import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import * as ort from 'onnxruntime-node';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env'), override: true });

const requestedModelPath = process.env.AI_NODE_MODEL_PATH || './models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx';
const modelPath = resolve(process.cwd(), requestedModelPath.includes('food101-mobilenetv2.onnx') ? './models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx' : requestedModelPath);
const labelsCount = 101;

if (!existsSync(modelPath)) {
  console.error(`Model missing: ${modelPath}`);
  console.error('Run: pnpm run setup:model');
  process.exit(1);
}

if (statSync(modelPath).size < 1_000_000) {
  console.error('Model file is too small. It may be a Git LFS pointer instead of the real ONNX file.');
  process.exit(1);
}

const session = await ort.InferenceSession.create(modelPath, {
  executionProviders: ['cpu'],
  graphOptimizationLevel: 'all',
});

const inputName = session.inputNames[0];
const outputName = session.outputNames[0];
const input = session.inputMetadata[0];
const output = session.outputMetadata[0];

if (!inputName || !outputName || !input || !output) {
  console.error('Model input/output metadata is invalid.');
  process.exit(1);
}

const rawShape = input.shape;
const shape = normalizeImageShape(rawShape);
const channelIndex = shape[1] === 3 ? 1 : shape[shape.length - 1] === 3 ? shape.length - 1 : -1;
if (shape.length !== 4 || channelIndex === -1) {
  console.error(`Unsupported input shape: ${JSON.stringify(input.shape)} -> ${JSON.stringify(shape)}`);
  process.exit(1);
}

const total = shape.reduce((a, b) => a * b, 1);
if (!Number.isSafeInteger(total) || total <= 0) {
  console.error(`Invalid resolved input shape: ${JSON.stringify(input.shape)} -> ${JSON.stringify(shape)}`);
  process.exit(1);
}
let tensor;
if (input.type === 'int8') {
  const data = new Int8Array(total);
  for (let i = 0; i < total; i += 1) data[i] = (i % 255) - 128;
  tensor = new ort.Tensor('int8', data, shape);
} else if (input.type === 'uint8') {
  const data = new Uint8Array(total);
  for (let i = 0; i < total; i += 1) data[i] = i % 255;
  tensor = new ort.Tensor('uint8', data, shape);
} else {
  const data = new Float32Array(total);
  // Float inputs for the bundled STMicro Food-101 model are rescaled to [0, 1].
  for (let i = 0; i < total; i += 1) data[i] = (i % 255) / 255;
  tensor = new ort.Tensor('float32', data, shape);
}

const result = await session.run({ [inputName]: tensor });
const outputTensor = result[outputName];
const scores = Array.from(outputTensor.data).map(Number);
const min = Math.min(...scores);
const max = Math.max(...scores);
const range = max - min;

console.log('Model path:', modelPath);
console.log('Input:', inputName, input.type, JSON.stringify(input.shape));
console.log('Output:', outputName, output.type, JSON.stringify(output.shape));
console.log('Output classes:', scores.length);
console.log('Output dynamic range:', range);

if (scores.length !== labelsCount) {
  console.error(`Expected ${labelsCount} Food-101 classes, got ${scores.length}.`);
  process.exit(1);
}

if (!Number.isFinite(range) || range < 1e-5) {
  console.error('Model output is nearly uniform. This usually means the old broken MobileNet ONNX model is being used.');
  process.exit(1);
}

console.log('Model check passed.');


function normalizeImageShape(rawShape) {
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

  // Some ONNX exports mark batch/height/width/channel as symbolic strings.
  // The STMicro Food-101 model used by this project is a 224x224 RGB model.
  if (String(rawShape[3]).toLowerCase().includes('channel')) {
    return [numeric[0] ?? 1, numeric[1] ?? 224, numeric[2] ?? 224, 3];
  }

  return [numeric[0] ?? 1, numeric[1] ?? 224, numeric[2] ?? 224, numeric[3] ?? 3];
}
