# AI Runtime Notice

The old Python/TensorFlow placeholder AI pipeline has been removed from the active project path.

NutriLens now uses the local Node.js ONNX service in:

```text
ai-node/
```

Use this instead:

```bash
corepack pnpm run model:download
corepack pnpm run dev:ai
```
