# Local Node.js ONNX AI Integration

NutriLens now supports local food-image classification without Python.

## Architecture

```text
Frontend image upload
  -> Cloudflare Worker backend
  -> R2 image storage
  -> POST AI_MODEL_ENDPOINT
  -> Local ai-node service
  -> ONNX Runtime Node.js inference
  -> Food-101 label + local nutrition estimate
  -> Backend saves analysis result in Neon PostgreSQL
```

## Why this approach

The backend is a Cloudflare Worker, so native Node.js packages such as `onnxruntime-node` cannot run inside the Worker runtime. The correct local setup is to keep the backend as the API gateway and run ONNX inference in a separate local Node.js service.

## Model

Default model repository:

```text
AlexKoff88/mobilenet_v2_food101
```

The downloader discovers the `.onnx` file from the Hugging Face model metadata and saves it locally to:

```text
ai-node/models/food101-mobilenetv2.onnx
```

Model files are ignored by git because ONNX weights can be large.

## Setup

```bash
corepack enable
corepack pnpm install
corepack pnpm run model:download
corepack pnpm run model:check
```

Update `.env`:

```env
AI_MODEL_ENDPOINT=http://127.0.0.1:8788/predict
AI_MODEL_API_KEY=
AI_NODE_PORT=8788
AI_NODE_HOST=127.0.0.1
AI_NODE_MODEL_PATH=./models/food101-mobilenetv2.onnx
AI_NODE_LABELS_PATH=./data/food101-labels.json
AI_NODE_NUTRITION_PATH=./data/nutrition-db.json
AI_NODE_INPUT_LAYOUT=NCHW
```

Run locally:

```bash
corepack pnpm run dev:ai
corepack pnpm run dev:backend
corepack pnpm run dev:frontend
```

## API contract

The local AI service exposes:

```text
GET  /health
GET  /labels
POST /predict
```

`POST /predict` accepts `multipart/form-data` with an `image` file field and returns the backend-compatible response:

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

## Database support

Migration `004_seed_food101_nutrition_catalog.sql` seeds the 101 Food-101 class names into `nutrition_catalog`, so backend lookup and analysis matching no longer fail after migration `003_real_data_support.sql` deletes old mock data.

Run:

```bash
corepack pnpm run db:migrate
```

## Important limitation

The local nutrition values are starter estimates for demo and project use. Replace them with verified values before production or health-critical use.
