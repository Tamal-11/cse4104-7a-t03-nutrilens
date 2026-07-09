import { createWriteStream, existsSync, statSync } from 'node:fs';
import { mkdir, readFile, rename, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env'), override: true });

const defaultUrl = 'https://github.com/STMicroelectronics/stm32ai-modelzoo/raw/refs/heads/main/image_classification/efficientnet/ST_pretrainedmodel_public_dataset/food101/st_efficientnetlcv1_224_tfs/st_efficientnetlcv1_224_tfs_qdq_int8.onnx';
const defaultTarget = './models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx';

const downloadUrl = process.env.AI_NODE_MODEL_URL || defaultUrl;
const requestedTarget = process.env.AI_NODE_MODEL_PATH || defaultTarget;
const safeTarget = requestedTarget.includes('food101-mobilenetv2.onnx') ? defaultTarget : requestedTarget;
if (safeTarget !== requestedTarget) {
  console.warn('Ignoring old broken food101-mobilenetv2.onnx target and using the working STMicro model filename.');
}
const targetPath = resolve(process.cwd(), safeTarget);
const minimumBytes = 1_000_000;

if (existsSync(targetPath) && statSync(targetPath).size >= minimumBytes) {
  console.log(`Working model already exists: ${targetPath}`);
  process.exit(0);
}

await mkdir(dirname(targetPath), { recursive: true });
const tempPath = `${targetPath}.download`;

console.log('Downloading Food-101 ONNX model intentionally.');
console.log(`Source: ${downloadUrl}`);
console.log(`Saving: ${targetPath}`);

const response = await fetch(downloadUrl, {
  headers: {
    'User-Agent': 'NutriLens-local-setup',
    Accept: 'application/octet-stream,*/*',
  },
});

if (!response.ok || !response.body) {
  throw new Error(`Failed to download model (${response.status} ${response.statusText}).`);
}

try {
  await pipeline(Readable.fromWeb(response.body), createWriteStream(tempPath));

  const size = statSync(tempPath).size;
  const head = await readFile(tempPath, { encoding: 'utf8' }).then((text) => text.slice(0, 80)).catch(() => '');
  if (size < minimumBytes || head.startsWith('version https://git-lfs.github.com/spec')) {
    throw new Error(`Downloaded file is not the real ONNX model. Size: ${size} bytes. Check internet access or the model URL.`);
  }

  await rename(tempPath, targetPath);
  console.log('Model download complete.');
  console.log('Now run: pnpm run model:check');
} catch (error) {
  await unlink(tempPath).catch(() => undefined);
  throw error;
}
