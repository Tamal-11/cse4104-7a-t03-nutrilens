import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env'), override: true });

const modelId = process.env.AI_NODE_MODEL_ID || 'AlexKoff88/mobilenet_v2_food101';
const targetPath = resolve(process.cwd(), process.env.AI_NODE_MODEL_PATH || './models/food101-mobilenetv2.onnx');

if (existsSync(targetPath)) {
  console.log(`Model already exists: ${targetPath}`);
  process.exit(0);
}

await mkdir(dirname(targetPath), { recursive: true });
const apiUrl = `https://huggingface.co/api/models/${modelId}`;
console.log(`Discovering ONNX files from ${apiUrl}`);
const metadataResponse = await fetch(apiUrl);
if (!metadataResponse.ok) {
  throw new Error(`Failed to read Hugging Face model metadata (${metadataResponse.status}).`);
}

const metadata = await metadataResponse.json();
const candidates = (metadata.siblings || [])
  .map((file) => file.rfilename)
  .filter((name) => typeof name === 'string' && name.toLowerCase().endsWith('.onnx'));

if (candidates.length === 0) {
  throw new Error(`No .onnx file was found in ${modelId}. Open the model page and set AI_NODE_MODEL_ID to a repo that contains ONNX files.`);
}

const selectedFile = candidates.find((name) => /mobilenet|model/i.test(name)) || candidates[0];
const downloadUrl = `https://huggingface.co/${modelId}/resolve/main/${selectedFile}`;
const tempPath = `${targetPath}.download`;
console.log(`Downloading ${downloadUrl}`);
console.log(`Saving to ${targetPath}`);

const response = await fetch(downloadUrl);
if (!response.ok || !response.body) {
  throw new Error(`Failed to download model (${response.status}).`);
}

try {
  await pipeline(Readable.fromWeb(response.body), createWriteStream(tempPath));
  await rename(tempPath, targetPath);
  console.log('Model download complete.');
} catch (error) {
  await unlink(tempPath).catch(() => undefined);
  throw error;
}
