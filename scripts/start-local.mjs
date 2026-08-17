import { spawnSync, spawn } from 'node:child_process';
import { existsSync, copyFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function ensureNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(major) || major < 22) {
    console.error(`Node.js 22 or newer is required. Current version: ${process.version}`);
    console.error('Install Node.js 22+, then run: pnpm run setup');
    process.exit(1);
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

function hasPackage(relativeDir, packageName) {
  return existsSync(path.join(root, relativeDir, 'node_modules', packageName, 'package.json'));
}

function checkDependencies() {
  const missing = [];
  if (!hasPackage('backend', 'hono')) missing.push('backend');
  if (!hasPackage('frontend', 'vite')) missing.push('frontend');

  if (missing.length > 0) {
    console.error(`Missing dependencies for: ${missing.join(', ')}`);
    console.error('Run this once first: pnpm run setup');
    process.exit(1);
  }
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
      console.warn(message);
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
checkDependencies();

console.log('\nStarting NutriLens locally...');
console.log('Frontend: http://localhost:3000');
console.log('Local API: http://localhost:8787');
console.log('AI provider: Gemini (configured with GEMINI_API_KEY in .env)');
console.log('Press Ctrl+C to stop all services.\n');

const commonEnv = {
  LOCAL_DEMO_MODE: 'true',
};

start('Local API', 'pnpm --filter nutrilens-backend dev:local', commonEnv, true);
start('Frontend', 'pnpm --filter nutrilens-frontend dev', {
  ...commonEnv,
  VITE_API_BASE_URL: 'http://localhost:8787',
}, true);
