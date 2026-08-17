# AI Integration Workflow

NutriLens uses a local Node.js ONNX service for food image classification.

## Current AI service

```text
ai-node/
```

Current runtime:

- Node.js
- Hono
- ONNX Runtime for Node.js
- Sharp image preprocessing
- STMicroelectronics EfficientNet-LC Food-101 QDQ INT8 ONNX model
- 101 Food-101 labels
- Local starter nutrition catalog

## Workflow

1. User selects or drags and drops a JPG, PNG, or WebP food image.
2. Frontend sends the file to `POST /api/v1/upload-food-image`.
3. Backend validates and stores the image.
4. Frontend sends the returned `imageId` to `POST /api/v1/analyze-food`.
5. Backend verifies that the image belongs to the current user.
6. Backend sends the image to `AI_MODEL_ENDPOINT`.
7. `ai-node` converts the image to RGB, resizes it to 224 x 224 with nearest-neighbor interpolation, and applies 1/255 rescaling.
8. EfficientNet-LC performs Food-101 classification.
9. The AI service returns the predicted food, confidence, top predictions, and the matching estimated nutrition record.
10. Backend validates the AI response, stores the completed analysis, and returns it to the frontend.
11. Frontend displays the food result and estimated nutrition values.

## AI output

Example structure:

```json
{
  "success": true,
  "foodName": "Hamburger",
  "confidence": 0.7569,
  "nutrition": {
    "calories": 295,
    "protein": 17,
    "carbohydrates": 30,
    "fats": 14,
    "fiber": 2,
    "servingSize": "100 g estimated edible portion"
  },
  "classification": "Moderate",
  "modelName": "stmicro_effnet_int8_food101",
  "modelVersion": "local-onnx-food101-v3"
}
```

Nutrition values are catalog estimates for approximately 100 g. The system does not estimate the actual photographed portion size.

## Local setup

```bash
pnpm run setup
pnpm run setup:model
pnpm run model:check
pnpm run inference:check
pnpm run dev
```

## Current limitation

The model performs one whole-image Food-101 classification. It does not perform multi-food detection, ingredient extraction, portion estimation, allergen detection from pixels, or medical diagnosis.
