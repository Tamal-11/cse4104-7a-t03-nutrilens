# Local Node ONNX AI Integration

NutriLens local mode uses the Node.js ONNX service in `ai-node/`.

## Current model

The working default model is:

```text
ai-node/models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx
```

Download it intentionally once:

```bash
pnpm run setup:model
pnpm run model:check
```

The old `food101-mobilenetv2.onnx` model is not used because it returns near-uniform outputs, causing wrong 1% predictions.

## Local startup

```bash
pnpm run setup
pnpm run setup:model
pnpm run model:check
pnpm run dev
```

`pnpm run dev` starts services only. It does not install dependencies or download a model.

## Environment

```env
AI_MODEL_ENDPOINT=http://127.0.0.1:8788/predict
AI_NODE_MODEL_PATH=./models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx
AI_NODE_LABELS_PATH=./data/food101-labels.json
AI_NODE_NUTRITION_PATH=./data/nutrition-db.json
AI_NODE_MODEL_KIND=stmicro_effnet_int8_food101
```

## Endpoints

```text
GET  http://127.0.0.1:8788/health
GET  http://127.0.0.1:8788/labels
POST http://127.0.0.1:8788/predict
```
