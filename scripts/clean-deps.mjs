import { rmSync } from 'node:fs';

for (const path of [
  'node_modules',
  'frontend/node_modules',
  'backend/node_modules',
  'ai-node/node_modules',
  'package-lock.json',
  'frontend/package-lock.json',
  'backend/package-lock.json',
  'ai-node/package-lock.json',
]) {
  rmSync(path, { recursive: true, force: true });
}

console.log('Removed installed dependencies and npm lock files. Run pnpm run setup before starting.');
