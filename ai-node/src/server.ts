import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

config({ path: path.resolve(process.cwd(), '../.env') });
config({ path: path.resolve(process.cwd(), '.env'), override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

const env = {
  port: Number(process.env.AI_NODE_PORT || 8788),
  host: process.env.AI_NODE_HOST || '127.0.0.1',
  modelPath: resolveFromPackage(process.env.AI_NODE_MODEL_PATH || './models/food101-mobilenetv2.onnx'),
  labelsPath: resolveFromPackage(process.env.AI_NODE_LABELS_PATH || './data/food101-labels.json'),
  nutritionPath: resolveFromPackage(process.env.AI_NODE_NUTRITION_PATH || './data/nutrition-db.json'),
  imageSize: Number(process.env.AI_NODE_IMAGE_SIZE || 224),
  inputLayout: (process.env.AI_NODE_INPUT_LAYOUT || 'NCHW').toUpperCase() as 'NCHW' | 'NHWC',
  topK: Number(process.env.AI_NODE_TOP_K || 5),
};

const app = new Hono();
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));

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

let modelPromise: Promise<ort.InferenceSession> | null = null;
let labelsPromise: Promise<string[]> | null = null;
let nutritionPromise: Promise<Record<string, NutritionEntry>> | null = null;

app.get('/', (c) =>
  c.json({
    name: 'NutriLens Local AI Service',
    runtime: 'Node.js + ONNX Runtime',
    endpoints: ['/health', '/labels', '/predict'],
  }),
);

app.get('/health', async (c) => {
  const labels = await loadLabels().catch(() => []);
  const nutrition = await loadNutrition().catch(() => ({}));

  return c.json({
    status: existsSync(env.modelPath) && labels.length > 0 ? 'ready' : 'not_ready',
    modelPath: env.modelPath,
    modelFileExists: existsSync(env.modelPath),
    labelsCount: labels.length,
    nutritionEntries: Object.keys(nutrition).length,
    imageSize: env.imageSize,
    inputLayout: env.inputLayout,
  });
});

app.get('/labels', async (c) => {
  const labels = await loadLabels();
  return c.json({ success: true, data: labels.map((label, index) => ({ index, label, foodName: labelToFoodName(label) })) });
});

app.post('/predict', async (c) => {
  try {
    if (!existsSync(env.modelPath)) {
      return c.json(
        {
          success: false,
          message: `ONNX model file was not found at ${env.modelPath}. Run: corepack pnpm --dir ai-node run model:download`,
        },
        503,
      );
    }

    const form = await c.req.formData();
    const image = form.get('image');

    if (!isFileLike(image)) {
      return c.json({ success: false, message: 'image file is required.' }, 400);
    }

    const [session, labels, nutritionDb] = await Promise.all([loadModel(), loadLabels(), loadNutrition()]);
    const inputTensor = await imageToTensor(Buffer.from(await image.arrayBuffer()));
    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];
    const result = await session.run({ [inputName]: inputTensor });
    const outputTensor = result[outputName];

    if (!outputTensor) {
      return c.json({ success: false, message: `Model output '${outputName}' was not returned.` }, 502);
    }

    const scores = Array.from(outputTensor.data as Float32Array | number[]).map(Number);
    const probabilities = toProbabilities(scores);
    const topPredictions = topK(probabilities, Math.min(env.topK, labels.length)).map(({ index, score }) => {
      const label = labels[index] ?? `class_${index}`;
      return { label, foodName: labelToFoodName(label), confidence: round(score, 4) };
    });

    const best = topPredictions[0] ?? { label: 'unknown', foodName: 'Unknown Food', confidence: 0 };
    const nutrition = nutritionDb[best.label] ?? createFallbackNutrition(best.label);

    return c.json({
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
      modelName: 'mobilenet_v2_food101_onnx_node',
      modelVersion: 'local-onnx-1',
      topPredictions,
    });
  } catch (error) {
    console.error('Prediction failed', error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Prediction failed.',
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

async function imageToTensor(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize(env.imageSize, env.imageSize, { fit: 'cover', position: 'centre' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 3) {
    throw new Error(`Expected RGB image data, got ${info.channels} channel(s).`);
  }

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const pixels = env.imageSize * env.imageSize;
  const input = new Float32Array(3 * pixels);

  for (let y = 0; y < env.imageSize; y += 1) {
    for (let x = 0; x < env.imageSize; x += 1) {
      const pixelIndex = y * env.imageSize + x;
      const sourceIndex = pixelIndex * info.channels;
      const r = (data[sourceIndex] / 255 - mean[0]) / std[0];
      const g = (data[sourceIndex + 1] / 255 - mean[1]) / std[1];
      const b = (data[sourceIndex + 2] / 255 - mean[2]) / std[2];

      if (env.inputLayout === 'NHWC') {
        input[pixelIndex * 3] = r;
        input[pixelIndex * 3 + 1] = g;
        input[pixelIndex * 3 + 2] = b;
      } else {
        input[pixelIndex] = r;
        input[pixels + pixelIndex] = g;
        input[pixels * 2 + pixelIndex] = b;
      }
    }
  }

  const dims = env.inputLayout === 'NHWC'
    ? [1, env.imageSize, env.imageSize, 3]
    : [1, 3, env.imageSize, env.imageSize];

  return new ort.Tensor('float32', input, dims);
}

function toProbabilities(scores: number[]) {
  const finiteScores = scores.map((score) => (Number.isFinite(score) ? score : -Infinity));
  const sum = finiteScores.reduce((total, score) => total + score, 0);
  const alreadyProbabilities = finiteScores.every((score) => score >= 0 && score <= 1) && Math.abs(sum - 1) < 0.05;

  if (alreadyProbabilities) return finiteScores;

  const max = Math.max(...finiteScores);
  const exps = finiteScores.map((score) => Math.exp(score - max));
  const expSum = exps.reduce((total, score) => total + score, 0);
  return exps.map((score) => score / expSum);
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
    ? `${best.foodName} was identified by the local ONNX model with ${Math.round(best.confidence * 100)}% confidence. Close alternatives: ${alternatives.join(', ')}.`
    : `${best.foodName} was identified by the local ONNX model with ${Math.round(best.confidence * 100)}% confidence.`;
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

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`NutriLens local AI service running at http://${info.address}:${info.port}`);
  console.log(`Model path: ${env.modelPath}`);
});
