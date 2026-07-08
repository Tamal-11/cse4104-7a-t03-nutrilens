# NutriLens Local AI Service

This package replaces the unfinished Python AI layer with a local Node.js ONNX inference service.

## What it uses

- Node.js
- ONNX Runtime Node.js binding
- A lightweight Food-101 MobileNetV2 ONNX model
- Local Food-101 labels
- Local starter nutrition catalog

The backend already calls `AI_MODEL_ENDPOINT`, so this service only needs to run beside the backend during local development.

## Setup

From the project root:

```bash
corepack enable
corepack pnpm install
corepack pnpm --dir ai-node run model:download
```

Create or update root `.env`:

```env
AI_MODEL_ENDPOINT=http://127.0.0.1:8788/predict
AI_MODEL_API_KEY=
AI_NODE_PORT=8788
AI_NODE_HOST=127.0.0.1
AI_NODE_MODEL_PATH=./models/food101-mobilenetv2.onnx
AI_NODE_LABELS_PATH=./data/food101-labels.json
AI_NODE_NUTRITION_PATH=./data/nutrition-db.json
```

Run the AI service:

```bash
corepack pnpm --dir ai-node run dev
```

Check it:

```bash
curl http://127.0.0.1:8788/health
```

Run the app in three terminals:

```bash
corepack pnpm --dir ai-node run dev
corepack pnpm --dir backend run dev
corepack pnpm --dir frontend run dev
```

## Endpoint contract

`POST /predict` accepts `multipart/form-data` with an `image` field and returns the exact shape expected by the backend:

```json
{
  "foodName": "Pizza",
  "confidence": 0.87,
  "nutrition": {
    "calories": 266,
    "protein": 11,
    "carbohydrates": 33,
    "fats": 10,
    "fiber": 2
  },
  "classification": "Moderate",
  "healthBenefits": [],
  "warnings": [],
  "suggestions": [],
  "explanation": "Pizza was identified by the local ONNX model with 87% confidence.",
  "modelName": "mobilenet_v2_food101_onnx_node",
  "modelVersion": "local-onnx-1"
}
```

## Notes

The nutrition values are starter estimates for 100 g edible portions. They are good enough for local project demonstration, but should be replaced with verified nutrition data before production or medical use.
