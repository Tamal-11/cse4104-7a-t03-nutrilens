# NutriLens Local AI Service

This package runs the local Node.js ONNX food-recognition service used by the NutriLens demo.

## What it uses

- Node.js 22+
- ONNX Runtime Node.js binding
- Sharp image preprocessing
- Food-101 labels
- Local starter nutrition catalog
- STMicro Food-101 EfficientNet INT8 ONNX model

The old `food101-mobilenetv2.onnx` model is not used because it returns near-uniform scores and causes wrong 1% predictions.

## Setup

From the project root:

```bash
npm run setup
npm run setup:model
npm run model:check
npm run inference:check
npm run dev
```

The model is saved here:

```text
ai-node/models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx
```

Root `.env` should contain:

```env
AI_MODEL_ENDPOINT=http://127.0.0.1:8788/predict
AI_MODEL_API_KEY=
AI_NODE_PORT=8788
AI_NODE_HOST=127.0.0.1
AI_NODE_MODEL_PATH=./models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx
AI_NODE_LABELS_PATH=./data/food101-labels.json
AI_NODE_NUTRITION_PATH=./data/nutrition-db.json
AI_NODE_MODEL_KIND=stmicro_effnet_int8_food101
AI_NODE_TOP_K=5
```

## Model-aligned preprocessing

The bundled model is `st_efficientnetlcv1_224_tfs_qdq_int8.onnx`. Its published STMicroelectronics configuration specifies:

- input size: `224 x 224 x 3` RGB
- resizing: `aspect_ratio: fit`
- interpolation: `nearest`
- rescaling: `scale: 1/255.0`, `offset: 0.0`

NutriLens therefore rotates according to image metadata, converts to sRGB, removes alpha, resizes directly to the model dimensions with nearest-neighbor interpolation, and converts float input values to `[0, 1]`. It intentionally does **not** use ImageNet mean/std normalization and does **not** use center-crop preprocessing.

Upstream model configuration:

`https://github.com/STMicroelectronics/stm32ai-modelzoo/blob/main/image_classification/efficientnet/ST_pretrainedmodel_public_dataset/food101/st_efficientnetlcv1_224_tfs/st_efficientnetlcv1_224_tfs_config.yaml`

Regression check:

```bash
npm run inference:check
```

This builds the AI service, starts it on a temporary local port, verifies the `/health` preprocessing metadata, and checks representative hamburger and sushi images against minimum-confidence thresholds.

## Run only the AI service

```bash
npm run dev:ai
```

Check it:

```bash
curl http://127.0.0.1:8788/health
```

Test prediction directly:

```bash
curl -X POST http://127.0.0.1:8788/predict \
  -F "image=@sample-food.jpg"
```

## Endpoint contract

`POST /predict` accepts `multipart/form-data` with an `image` field and returns the shape expected by the backend:

```json
{
  "success": true,
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
  "explanation": "Pizza was identified by the local Food-101 ONNX model with 87% confidence.",
  "modelName": "stmicro_effnet_int8_food101",
  "modelVersion": "local-onnx-food101-v3",
  "topPredictions": []
}
```

## Notes

The model can classify Food-101 classes only. Many Bangladeshi/local dishes may be mapped to the closest Food-101 class unless you train or add a local-food model. Nutrition values are starter estimates for 100 g edible portions and should not be used as medical nutrition data.
