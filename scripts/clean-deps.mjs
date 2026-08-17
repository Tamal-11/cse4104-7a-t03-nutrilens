import { rmSync } from 'node:fs';

for (const path of [
  'node_modules',
  'frontend/node_modules',
  'backend/node_modules',
  'ai-node/node_modules',
  'frontend/dist',
  'backend/dist',
  'ai-node/dist',
]) {
  rmSync(path, { recursive: true, force: true });
}

console.log('Removed installed dependencies and build output.');
console.log('pnpm-lock.yaml was kept so installs remain reproducible.');
console.log('Run: pnpm run setup');
