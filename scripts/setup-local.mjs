import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function ensureNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(major) || major < 22) {
    console.error(`Node.js 22 or newer is required. Current version: ${process.version}`);
    process.exit(1);
  }
}

function run(command) {
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureLocalEnv() {
  const rootEnv = path.join(root, '.env');
  const exampleEnv = path.join(root, '.env.example');
  if (!existsSync(rootEnv) && existsSync(exampleEnv)) {
    copyFileSync(exampleEnv, rootEnv);
    console.log('Created .env from .env.example');
  }

  const frontendEnv = path.join(root, 'frontend', '.env.local');
  if (!existsSync(frontendEnv)) {
    writeFileSync(frontendEnv, 'VITE_API_BASE_URL=http://localhost:8787\n', 'utf8');
    console.log('Created frontend/.env.local for local API URL');
  }
}

ensureNodeVersion();
ensureLocalEnv();

console.log('Installing project dependencies once with npm ci...');
run('npm ci --prefix backend');
run('npm ci --prefix frontend');
run('npm ci --prefix ai-node');

console.log('\nDependency setup complete.');
console.log('Next: run npm run setup:model once to download the working Food-101 ONNX model.');
console.log('After that, run npm run dev.');
