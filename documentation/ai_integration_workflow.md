# AI Integration Workflow

NutriLens now has a local Node.js ONNX AI integration. The old Python/TensorFlow placeholder has been removed from the active runtime path.

## Current AI service

```text
ai-node/
```

Runtime:

- Node.js
- ONNX Runtime Node.js binding
- Food-101 MobileNetV2 ONNX model
- Local Food-101 labels
- Local starter nutrition catalog

## Current working flow

1. User uploads a food image from the frontend.
2. Frontend sends the image to `POST /api/v1/upload-food-image`.
3. Backend stores the file in Cloudflare R2 and metadata in Neon PostgreSQL.
4. Frontend sends the returned `imageId` to `POST /api/v1/analyze-food`.
5. Backend reads the image from R2.
6. Backend sends the image to `AI_MODEL_ENDPOINT`.
7. Local `ai-node` service runs ONNX inference.
8. AI service returns food name, confidence, nutrition estimate, health notes, and suggestions.
9. Backend validates the AI response and saves the result in Neon PostgreSQL.
10. Frontend displays the final food analysis.

## Local setup

```bash
pnpm install
pnpm run model:download
pnpm run dev:ai
pnpm run dev:api:local
pnpm run dev:frontend
```

Root `.env` must include:

```env
AI_MODEL_ENDPOINT=http://127.0.0.1:8788/predict
AI_MODEL_API_KEY=
```

## AI input

`POST /predict` receives multipart form data:

```text
image = uploaded food image
```

Supported backend uploads:

```text
image/jpeg
image/png
image/webp
```

Default maximum upload size:

```text
8 MB
```

## AI output

The AI service returns the exact shape expected by the backend:

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

`004_seed_food101_nutrition_catalog.sql` adds all 101 Food-101 classes to `nutrition_catalog`, so lookup/matching works after mock data is removed.

## Important limitation

The Food-101 model can classify only the 101 trained classes. The nutrition catalog values are starter estimates for project demonstration and should be replaced with verified data before production.
