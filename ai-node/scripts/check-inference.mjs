import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const port = Number(process.env.AI_NODE_SMOKE_PORT || 18788);
const baseUrl = `http://127.0.0.1:${port}`;
const packageRoot = process.cwd();
const serverEntry = resolve(packageRoot, 'dist/server.js');

const fixtures = [
  { file: resolve(packageRoot, 'test-fixtures/hamburger.webp'), type: 'image/webp', expectedLabel: 'hamburger', minConfidence: 0.70 },
  { file: resolve(packageRoot, 'test-fixtures/sushi.jpg'), type: 'image/jpeg', expectedLabel: 'sushi', minConfidence: 0.95 },
];

const child = spawn(process.execPath, [serverEntry], {
  cwd: packageRoot,
  env: { ...process.env, AI_NODE_PORT: String(port), AI_NODE_HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
child.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
child.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

try {
  const health = await waitForHealth();
  assertEqual(health.status, 'ready', `AI service health status is '${health.status}', expected 'ready'.`);
  assertEqual(health.preprocessing?.colorMode, 'rgb', 'Health metadata must report RGB preprocessing.');
  assertEqual(health.preprocessing?.resize, 'fit', 'Health metadata must report fit resizing.');
  assertEqual(health.preprocessing?.interpolation, 'nearest', 'Health metadata must report nearest-neighbor interpolation.');
  assertEqual(health.preprocessing?.rescaling, '1/255', 'Health metadata must report 1/255 rescaling.');

  for (const fixture of fixtures) {
    const result = await predict(fixture);
    const best = result.topPredictions?.[0];
    if (!result.success || !best) {
      throw new Error(`${basename(fixture.file)} returned no valid prediction: ${JSON.stringify(result)}`);
    }
    assertEqual(best.label, fixture.expectedLabel, `${basename(fixture.file)} predicted '${best.label}', expected '${fixture.expectedLabel}'.`);
    if (Number(best.confidence) < fixture.minConfidence) {
      throw new Error(`${basename(fixture.file)} confidence ${best.confidence} is below regression threshold ${fixture.minConfidence}.`);
    }
    console.log(`${basename(fixture.file)}: ${best.label} ${(Number(best.confidence) * 100).toFixed(2)}%`);
  }

  console.log('Inference preprocessing regression check passed.');
} finally {
  child.kill('SIGTERM');
  await new Promise((resolveExit) => {
    const timer = setTimeout(resolveExit, 1500);
    child.once('exit', () => {
      clearTimeout(timer);
      resolveExit();
    });
  });
}

async function waitForHealth() {
  const deadline = Date.now() + 20_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`AI service exited before becoming ready (code ${child.exitCode}).\n${serverOutput}`);
    }
    try {
      const response = await fetchWithTimeout(`${baseUrl}/health`, {}, 1500);
      if (response.ok) return await response.json();
      lastError = new Error(`Health endpoint returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`AI service did not become ready within 20 seconds. Last error: ${String(lastError)}\n${serverOutput}`);
}

async function predict(fixture) {
  const bytes = await readFile(fixture.file);
  const form = new FormData();
  form.append('image', new Blob([bytes], { type: fixture.type }), basename(fixture.file));
  const response = await fetchWithTimeout(`${baseUrl}/predict`, { method: 'POST', body: form }, 20_000);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${basename(fixture.file)} prediction failed with HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message} Got ${JSON.stringify(actual)}.`);
}
