import { spawnSync, spawn } from 'node:child_process';
import { existsSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function ensureNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(major) || major < 22) {
    console.error(`Node.js 22 or newer is required. Current version: ${process.version}`);
    console.error('Install Node.js 22+, then run: npm run dev');
    process.exit(1);
  }
}

function run(command, options = {}) {
  const result = spawnSync(command, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...options.env },
  });

  if (result.status !== 0 && !options.allowFail) {
    process.exit(result.status ?? 1);
  }

  return result.status === 0;
}

function removePath(relativePath) {
  const target = path.join(root, relativePath);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
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

function isNpmInstalled(relativeDir, requiredPackages = []) {
  if (!existsSync(path.join(root, relativeDir, 'node_modules'))) return false;
  return requiredPackages.every((packageName) => existsSync(path.join(root, relativeDir, 'node_modules', packageName, 'package.json')));
}

function installPackage(relativeDir, label, required = true, requiredPackages = []) {
  if (isNpmInstalled(relativeDir, requiredPackages)) {
    console.log(`${label} dependencies already installed.`);
    return true;
  }

  console.log(`Installing ${label} dependencies with npm...`);
  const ok = run(`npm install --prefix ${relativeDir}`, { allowFail: !required });

  if (!ok && !required) {
    console.warn(`${label} dependencies could not be installed. Continuing without ${label}.`);
  }

  return ok;
}

function ensureDependencies() {
  const rootPnpmStore = path.join(root, 'node_modules', '.pnpm');
  if (existsSync(rootPnpmStore)) {
    console.log('Detected old PNPM/Corepack node_modules. Cleaning them for npm compatibility...');
    removePath('node_modules');
    removePath('frontend/node_modules');
    removePath('backend/node_modules');
    removePath('ai-node/node_modules');
  }

  const backendReady = installPackage('backend', 'Local API', true, ['hono']);
  const frontendReady = installPackage('frontend', 'Frontend', true, ['vite']);

  const skipAi = ['1', 'true', 'yes'].includes(String(process.env.SKIP_AI || '').toLowerCase());
  let aiReady = false;

  if (!skipAi) {
    aiReady = installPackage('ai-node', 'AI service', false, ['tsx', 'onnxruntime-node', 'sharp']);
  } else {
    console.log('Skipping AI service because SKIP_AI is enabled. Local API fallback will be used.');
  }

  return { backendReady, frontendReady, aiReady };
}

function ensureModel(aiReady) {
  const modelPath = path.join(root, 'ai-node', 'models', 'food101-mobilenetv2.onnx');
  if (existsSync(modelPath)) {
    console.log('AI model file found.');
    return true;
  }

  if (!aiReady) {
    console.warn('AI model file not found. Continuing with local API fallback.');
    return false;
  }

  console.log('AI model file not found. Downloading model...');
  return run('npm --prefix ai-node run model:download', { allowFail: true });
}

function start(name, command, env = {}, required = true) {
  const child = spawn(command, {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    windowsHide: false,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;

    const message = `${name} stopped${signal ? ` by ${signal}` : ''}${code !== null ? ` with code ${code}` : ''}.`;
    if (required) {
      console.error(message);
      shutdown(code || 1);
    } else {
      console.warn(`${message} Continuing with local API fallback.`);
    }
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      if (isWindows) spawnSync('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
      else child.kill('SIGTERM');
    }
  }
  process.exit(code);
}

let shuttingDown = false;
const children = [];

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

ensureNodeVersion();
ensureLocalEnv();
const { aiReady } = ensureDependencies();
const modelReady = ensureModel(aiReady);
const startAi = aiReady && modelReady;

console.log('\nStarting NutriLens locally...');
console.log('Frontend: http://localhost:3000');
console.log('Local API: http://localhost:8787');
if (startAi) {
  console.log('AI service: http://127.0.0.1:8788');
} else {
  console.log('AI service: not started; local API fallback analysis is enabled.');
}
console.log('Press Ctrl+C to stop all services.\n');

const commonEnv = {
  AI_MODEL_ENDPOINT: process.env.AI_MODEL_ENDPOINT || 'http://127.0.0.1:8788/predict',
  LOCAL_DEMO_MODE: 'true',
};

if (startAi) {
  start('AI service', 'npm --prefix ai-node run dev', commonEnv, false);
}

start('Local API', 'npm --prefix backend run dev:local', commonEnv, true);
start('Frontend', 'npm --prefix frontend run dev', {
  ...commonEnv,
  VITE_API_BASE_URL: 'http://localhost:8787',
}, true);
