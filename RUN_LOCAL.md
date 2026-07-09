# Run NutriLens Locally with Real ONNX Food Detection

This version does **not** install packages or download models inside `pnpm run dev`.
Setup is explicit, so there are no surprise downloads every time the app starts.

## 1. Install dependencies once

```bash
pnpm run setup
```

## 2. Download the working Food-101 ONNX model once

```bash
pnpm run setup:model
pnpm run model:check
```

The working model is saved here:

```text
ai-node/models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx
```

The old `food101-mobilenetv2.onnx` model was removed from the default path because it returns near-uniform scores and causes wrong 1% predictions.

## 3. Start the app

```bash
pnpm run dev
```

Then open:

```text
http://localhost:3000
```

The app starts three services:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Local API | http://localhost:8787 |
| Local ONNX AI | http://127.0.0.1:8788 |

## Check AI health

Open this URL after startup:

```text
http://127.0.0.1:8788/health
```

It should return `status: "ready"`, `modelStatus: "loaded"`, and `labelsCount: 101`.

## Test a prediction directly

```bash
curl -X POST http://127.0.0.1:8788/predict \
  -F "image=@sample-food.jpg"
```

The response includes detected food, confidence, nutrition, and top predictions.

## Stop everything

Press `Ctrl+C` in the terminal.
