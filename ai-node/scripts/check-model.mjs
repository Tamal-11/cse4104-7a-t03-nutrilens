import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import * as ort from 'onnxruntime-node';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env'), override: true });

const modelPath = resolve(process.cwd(), process.env.AI_NODE_MODEL_PATH || './models/food101-mobilenetv2.onnx');
const labelsPath = resolve(process.cwd(), process.env.AI_NODE_LABELS_PATH || './data/food101-labels.json');

if (!existsSync(modelPath)) {
  throw new Error(`Model file missing: ${modelPath}\nRun: corepack pnpm --dir ai-node run model:download`);
}

const labels = JSON.parse(await readFile(labelsPath, 'utf8'));
const session = await ort.InferenceSession.create(modelPath, { executionProviders: ['cpu'] });
console.log('Model loaded successfully.');
console.log('Inputs:', session.inputNames);
console.log('Outputs:', session.outputNames);
console.log('Labels:', labels.length);
