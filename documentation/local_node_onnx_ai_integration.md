# Local Node ONNX AI Integration

NutriLens local AI runs from `ai-node/`.

## Model

```text
ai-node/models/st_efficientnetlcv1_224_tfs_qdq_int8.onnx
```

The model is an STMicroelectronics EfficientNet-LC Food-101 QDQ INT8 ONNX model with 101 classes.

## Setup

```bash
pnpm run setup
pnpm run setup:model
pnpm run model:check
pnpm run inference:check
pnpm run dev
```

## Preprocessing

```text
RGB
→ direct resize to 224 x 224
→ nearest-neighbor interpolation
→ 1/255 rescaling
→ ONNX inference
```

## Endpoints

```text
GET  http://127.0.0.1:8788/health
GET  http://127.0.0.1:8788/labels
POST http://127.0.0.1:8788/predict
```

`POST /predict` accepts JPG, PNG, and WebP files up to the configured upload-size limit. If `AI_MODEL_API_KEY` is configured, requests to `/predict` must include the matching Bearer token.
