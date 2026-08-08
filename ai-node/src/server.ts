import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { config } from 'dotenv';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

config({ path: path.resolve(process.cwd(), '../.env') });
config({ path: path.resolve(process.cwd(), '.env'), override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

const requestedModelPath = process.env.AI_NODE_MODEL_PATH || './models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx';
const safeModelPath = requestedModelPath.includes('food101-mobilenetv2.onnx')
  ? './models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx'
  : requestedModelPath;

const env = {
  port: Number(process.env.AI_NODE_PORT || 8788),
  host: ['127.0.0.1', '::1'].includes(process.env.AI_NODE_HOST || '') ? process.env.AI_NODE_HOST! : '127.0.0.1',
  modelPath: resolveFromPackage(safeModelPath),
  modelKind: process.env.AI_NODE_MODEL_KIND || 'stmicro_effnet_int8_food101',
  labelsPath: resolveFromPackage(process.env.AI_NODE_LABELS_PATH || './data/food101-labels.json'),
  nutritionPath: resolveFromPackage(process.env.AI_NODE_NUTRITION_PATH || './data/nutrition-db.json'),
  topK: Number(process.env.AI_NODE_TOP_K || 5),
  minOutputDynamicRange: Number(process.env.AI_NODE_MIN_OUTPUT_DYNAMIC_RANGE || 1e-5),
  apiKey: process.env.AI_MODEL_API_KEY || '',
};

const app = new Hono();

type NutritionEntry = {
  foodName: string;
  category: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  classification: 'Healthy' | 'Moderate' | 'Unhealthy';
  healthBenefits: string[];
  warnings: string[];
  suggestions: string[];
  source?: string;
};

type Prediction = {
  label: string;
  foodName: string;
  confidence: number;
};

type ModelInputSpec = {
  name: string;
  type: string;
  shape: number[];
  layout: 'NCHW' | 'NHWC';
  width: number;
  height: number;
  channels: number;
};

let modelPromise: Promise<ort.InferenceSession> | null = null;
let labelsPromise: Promise<string[]> | null = null;
let nutritionPromise: Promise<Record<string, NutritionEntry>> | null = null;

app.get('/', (c) =>
  c.json({
    name: 'NutriLens Local AI Service',
    runtime: 'Node.js + ONNX Runtime',
    modelKind: env.modelKind,
    endpoints: ['/health', '/labels', '/predict'],
  }),
);

app.get('/health', async (c) => {
  const labels = await loadLabels().catch(() => []);
  const nutrition = await loadNutrition().catch(() => ({}));
  const modelFileExists = existsSync(env.modelPath);
  const modelFileSize = modelFileExists ? statSync(env.modelPath).size : 0;
  let modelStatus = 'not_loaded';
  let input: unknown = null;
  let output: unknown = null;

  if (modelFileExists) {
    try {
      const session = await loadModel();
      const inputSpec = getModelInputSpec(session);
      modelStatus = 'loaded';
      input = inputSpec;
      output = session.outputMetadata[0] ?? null;
      if (session.inputNames.length === 0 || session.outputNames.length === 0) {
        modelStatus = 'invalid';
      }
    } catch (error) {
      modelStatus = 'error';
      console.error('Model health check failed', error);
    }
  }

  return c.json({
    status: modelFileExists && modelStatus === 'loaded' && labels.length === 101 ? 'ready' : 'not_ready',
    modelKind: env.modelKind,
    modelStatus,
    labelsCount: labels.length,
    nutritionEntries: Object.keys(nutrition).length,
    input,
    output,
  });
});

app.get('/labels', async (c) => {
  const labels = await loadLabels();
  return c.json({ success: true, data: labels.map((label, index) => ({ index, label, foodName: labelToFoodName(label) })) });
});

app.post('/predict', async (c) => {
  try {
    if (!isAuthorized(c.req.header('Authorization'))) {
      return c.json({ success: false, message: 'Authentication required.' }, 401);
    }
    if (!existsSync(env.modelPath)) {
      return c.json(
        {
          success: false,
          message: 'Food analysis service is unavailable.',
        },
        503,
      );
    }

    const form = await c.req.formData();
    const image = form.get('image');

    if (!isFileLike(image)) {
      return c.json({ success: false, message: 'image file is required.' }, 400);
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 8 * 1024 * 1024) {
      return c.json({ success: false, message: 'Upload must be a supported image no larger than 8 MB.' }, 400);
    }

    const [session, labels, nutritionDb] = await Promise.all([loadModel(), loadLabels(), loadNutrition()]);
    const inputSpec = getModelInputSpec(session);
    const inputTensor = await imageToTensor(Buffer.from(await image.arrayBuffer()), inputSpec);
    const outputName = session.outputNames[0];
    const result = await session.run({ [inputSpec.name]: inputTensor });
    const outputTensor = result[outputName];

    if (!outputTensor) {
      return c.json({ success: false, message: `Model output '${outputName}' was not returned.` }, 502);
    }

    const scores = Array.from(outputTensor.data as Float32Array | Int32Array | number[]).map(Number);
    if (scores.length !== labels.length) {
      throw new Error(`Model output class count (${scores.length}) does not match labels count (${labels.length}). Use the Food-101 ONNX model from pnpm run setup:model.`);
    }

    const stats = scoreStats(scores);
    if (!Number.isFinite(stats.range) || stats.range < env.minOutputDynamicRange) {
      throw new Error(
        `ONNX model returned near-uniform scores. This usually means the old broken food101-mobilenetv2.onnx is being used. Run pnpm run setup:model and keep AI_NODE_MODEL_PATH=./models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx. Output range: ${stats.range}`,
      );
    }

    const probabilities = toProbabilities(scores);
    const topPredictions = topK(probabilities, Math.min(env.topK, labels.length)).map(({ index, score }) => {
      const label = labels[index] ?? `class_${index}`;
      return { label, foodName: labelToFoodName(label), confidence: round(score, 4) };
    });

    const best = topPredictions[0] ?? { label: 'unknown', foodName: 'Unknown Food', confidence: 0 };
    const nutrition = nutritionDb[best.label] ?? createFallbackNutrition(best.label);

    return c.json({
      success: true,
      foodName: nutrition.foodName || best.foodName,
      confidence: best.confidence,
      nutrition: {
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbohydrates: nutrition.carbohydrates,
        fats: nutrition.fats,
        fiber: nutrition.fiber,
      },
      classification: nutrition.classification,
      healthBenefits: nutrition.healthBenefits,
      warnings: lowConfidenceWarnings(best, nutrition.warnings),
      suggestions: nutrition.suggestions,
      explanation: buildExplanation(best, topPredictions),
      modelName: env.modelKind,
      modelVersion: 'local-onnx-food101-v2',
      modelDebug: {
        inputType: inputSpec.type,
        inputShape: inputSpec.shape,
        outputRange: round(stats.range, 6),
      },
      topPredictions,
    });
  } catch (error) {
    console.error('Prediction failed', error);
    return c.json(
      {
        success: false,
        message: 'Prediction failed.',
      },
      500,
    );
  }
});

async function loadModel() {
  if (!modelPromise) {
    modelPromise = ort.InferenceSession.create(env.modelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });
  }
  return modelPromise;
}

async function loadLabels() {
  if (!labelsPromise) {
    labelsPromise = readJson<string[]>(env.labelsPath).then((labels) => {
      if (!Array.isArray(labels) || labels.length === 0) {
        throw new Error('Food labels file is empty or invalid.');
      }
      return labels;
    });
  }
  return labelsPromise;
}

async function loadNutrition() {
  if (!nutritionPromise) {
    nutritionPromise = readJson<Record<string, NutritionEntry>>(env.nutritionPath);
  }
  return nutritionPromise;
}

function getModelInputSpec(session: ort.InferenceSession): ModelInputSpec {
  const inputName = session.inputNames[0];
  const input = session.inputMetadata[0] as { type?: string; shape?: Array<number | string | null> } | undefined;
  if (!inputName || !input) {
    throw new Error('ONNX model input metadata is missing.');
  }

  if (!input.shape || !input.type) {
    throw new Error('ONNX model input is not a tensor or has no shape/type metadata.');
  }

  const shape = normalizeImageShape(input.shape);
  if (shape.length !== 4) {
    throw new Error(`Unsupported ONNX input shape: ${JSON.stringify(input.shape)}. Expected 4D image tensor.`);
  }

  if (shape[1] === 3) {
    return { name: inputName, type: input.type, shape, layout: 'NCHW', channels: 3, height: shape[2], width: shape[3] };
  }

  if (shape[3] === 3) {
    return { name: inputName, type: input.type, shape, layout: 'NHWC', channels: 3, height: shape[1], width: shape[2] };
  }

  throw new Error(`Unsupported ONNX image layout: ${JSON.stringify(input.shape)} -> ${JSON.stringify(shape)}. Expected NCHW or NHWC with 3 RGB channels.`);
}

function normalizeImageShape(rawShape: Array<number | string | null>) {
  if (!Array.isArray(rawShape) || rawShape.length !== 4) {
    throw new Error(`Unsupported input shape: ${JSON.stringify(rawShape)}. Expected 4D image tensor.`);
  }

  const numeric = rawShape.map((dim) => {
    if (typeof dim === 'number' && Number.isFinite(dim) && dim > 0) return Math.trunc(dim);
    if (typeof dim === 'string') {
      const parsed = Number(dim);
      if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
    }
    return null;
  });

  const hasNchwChannels = numeric[1] === 3;
  const hasNhwcChannels = numeric[3] === 3;

  if (hasNchwChannels) {
    return [numeric[0] ?? 1, 3, numeric[2] ?? 224, numeric[3] ?? 224];
  }

  if (hasNhwcChannels) {
    return [numeric[0] ?? 1, numeric[1] ?? 224, numeric[2] ?? 224, 3];
  }

  // Some ONNX exports use symbolic strings such as batch, height, width, channels.
  // The STMicro Food-101 model used here is a 224x224 RGB NHWC model.
  const lastDim = String(rawShape[3] ?? '').toLowerCase();
  if (lastDim.includes('channel') || lastDim.includes('rgb')) {
    return [numeric[0] ?? 1, numeric[1] ?? 224, numeric[2] ?? 224, 3];
  }

  return [numeric[0] ?? 1, numeric[1] ?? 224, numeric[2] ?? 224, numeric[3] ?? 3];
}

async function imageToTensor(buffer: Buffer, spec: ModelInputSpec) {
  const resizeSize = Number(process.env.AI_NODE_RESIZE_SIZE || Math.max(256, spec.width, spec.height));
  const left = Math.max(0, Math.floor((resizeSize - spec.width) / 2));
  const top = Math.max(0, Math.floor((resizeSize - spec.height) / 2));
  const { data, info } = await sharp(buffer)
    .rotate()
    .toColorspace('srgb')
    .resize(resizeSize, resizeSize, { fit: 'cover', position: 'centre' })
    .extract({ left, top, width: spec.width, height: spec.height })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 3) {
    throw new Error(`Expected RGB image data, got ${info.channels} channel(s).`);
  }

  if (spec.type === 'int8') {
    const input = new Int8Array(3 * spec.width * spec.height);
    fillTypedImage(input, data, info.channels, spec, (value) => clampInt8(value - 128));
    return new ort.Tensor('int8', input, spec.shape);
  }

  if (spec.type === 'uint8') {
    const input = new Uint8Array(3 * spec.width * spec.height);
    fillTypedImage(input, data, info.channels, spec, (value) => value);
    return new ort.Tensor('uint8', input, spec.shape);
  }

  const input = new Float32Array(3 * spec.width * spec.height);
  const normalization = (process.env.AI_NODE_FLOAT_NORMALIZATION || 'imagenet').toLowerCase();
  fillTypedImage(input, data, info.channels, spec, (value, channel) => normalizeFloat(value, channel, normalization));
  return new ort.Tensor('float32', input, spec.shape);
}

function fillTypedImage<T extends Float32Array | Int8Array | Uint8Array>(
  target: T,
  data: Buffer,
  sourceChannels: number,
  spec: ModelInputSpec,
  transform: (value: number, channel: number) => number,
) {
  const pixels = spec.width * spec.height;
  for (let y = 0; y < spec.height; y += 1) {
    for (let x = 0; x < spec.width; x += 1) {
      const pixelIndex = y * spec.width + x;
      const sourceIndex = pixelIndex * sourceChannels;
      const values = [data[sourceIndex], data[sourceIndex + 1], data[sourceIndex + 2]];

      for (let channel = 0; channel < 3; channel += 1) {
        const value = transform(values[channel], channel);
        if (spec.layout === 'NHWC') {
          target[pixelIndex * 3 + channel] = value;
        } else {
          target[channel * pixels + pixelIndex] = value;
        }
      }
    }
  }
}

function normalizeFloat(value: number, channel: number, normalization: string) {
  if (normalization === 'zero_to_one') return value / 255;
  if (normalization === 'minus_one_to_one') return value / 127.5 - 1;

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  return (value / 255 - mean[channel]) / std[channel];
}

function clampInt8(value: number) {
  return Math.max(-128, Math.min(127, Math.round(value)));
}

function toProbabilities(scores: number[]) {
  const finiteScores = scores.map((score) => (Number.isFinite(score) ? score : -Infinity));
  const sum = finiteScores.reduce((total, score) => total + (Number.isFinite(score) ? score : 0), 0);
  const alreadyProbabilities = finiteScores.every((score) => score >= 0 && score <= 1) && Math.abs(sum - 1) < 0.05;

  if (alreadyProbabilities) return finiteScores;

  const max = Math.max(...finiteScores);
  if (!Number.isFinite(max)) {
    throw new Error('Model returned no finite prediction scores.');
  }

  const exps = finiteScores.map((score) => (Number.isFinite(score) ? Math.exp(score - max) : 0));
  const expSum = exps.reduce((total, score) => total + score, 0);
  if (expSum <= 0) {
    throw new Error('Model prediction scores could not be normalized.');
  }

  return exps.map((score) => score / expSum);
}

function scoreStats(scores: number[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const score of scores) {
    if (score < min) min = score;
    if (score > max) max = score;
  }
  return { min, max, range: max - min };
}

function topK(scores: number[], k: number) {
  return scores
    .map((score, index) => ({ index, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

function buildExplanation(best: Prediction, topPredictions: Prediction[]) {
  const alternatives = topPredictions.slice(1, 3).map((item) => `${item.foodName} ${Math.round(item.confidence * 100)}%`);
  return alternatives.length
    ? `${best.foodName} was identified by the local Food-101 ONNX model with ${Math.round(best.confidence * 100)}% confidence. Close alternatives: ${alternatives.join(', ')}.`
    : `${best.foodName} was identified by the local Food-101 ONNX model with ${Math.round(best.confidence * 100)}% confidence.`;
}

function lowConfidenceWarnings(best: Prediction, warnings: string[]) {
  if (best.confidence >= 0.45) return warnings;
  return [
    'Model confidence is low. Confirm the food manually before relying on the nutrition estimate.',
    ...warnings,
  ];
}

function createFallbackNutrition(label: string): NutritionEntry {
  return {
    foodName: labelToFoodName(label),
    category: 'Unknown',
    servingSize: '100 g estimated edible portion',
    calories: 240,
    protein: 8,
    carbohydrates: 30,
    fats: 10,
    fiber: 2,
    classification: 'Moderate',
    healthBenefits: ['Nutrition estimate is based on a generic fallback because this food is not in the local catalog.'],
    warnings: ['Verify the food and portion size manually for accurate nutrition guidance.'],
    suggestions: ['Add a verified nutrition entry for this class in ai-node/data/nutrition-db.json.'],
  };
}

function labelToFoodName(label: string) {
  return label
    .split('_')
    .map((word) => (['and', 'of'].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function resolveFromPackage(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(packageRoot, value);
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return typeof value === 'object' && value !== null && 'arrayBuffer' in value && 'name' in value;
}

function isAuthorized(authorization: string | undefined) {
  if (!env.apiKey) return true;
  const supplied = authorization?.replace(/^Bearer\s+/i, '') ?? '';
  const expectedBytes = Buffer.from(env.apiKey);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`NutriLens local AI service running at http://${info.address}:${info.port}`);
  console.log(`Model path: ${env.modelPath}`);
  console.log(`Model kind: ${env.modelKind}`);
});
