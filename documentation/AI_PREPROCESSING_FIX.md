# Food-101 AI Preprocessing Fix

**Project:** CSE4104-7A-T03 NutriLens  
**Component:** `ai-node`  
**Model:** `st_efficientnetlcv1_224_tfs_qdq_int8.onnx`

## Problem

The inference service previously used a 256x256 cover resize followed by a 224x224 center crop and ImageNet mean/std normalization for float input. Those operations did not match the preprocessing configuration published for the bundled STMicroelectronics Food-101 model and could materially reduce classification quality.

## Correct preprocessing

The model's published configuration specifies:

- input shape: `224 x 224 x 3`
- color mode: RGB
- rescaling: `scale: 1/255.0`, `offset: 0.0`
- resizing interpolation: nearest
- aspect-ratio mode: fit

STMicroelectronics documents `fit` as resizing directly to the target size, with possible aspect-ratio distortion. NutriLens therefore uses Sharp `fit: 'fill'` with the nearest-neighbor kernel instead of a center crop.

Upstream configuration:

`https://github.com/STMicroelectronics/stm32ai-modelzoo/blob/main/image_classification/efficientnet/ST_pretrainedmodel_public_dataset/food101/st_efficientnetlcv1_224_tfs/st_efficientnetlcv1_224_tfs_config.yaml`

## Code changes

- Removed `AI_NODE_RESIZE_SIZE` from `.env.example` because model preprocessing is fixed by the selected model configuration.
- Removed ImageNet mean/std normalization from the active Food-101 inference path.
- Replaced cover + center-crop resizing with direct 224x224 nearest-neighbor fit resizing.
- Added explicit validation for output image dimensions, RGB channel count, and supported ONNX input types.
- Added preprocessing metadata to `/health`.
- Bumped the local model integration version from `local-onnx-food101-v2` to `local-onnx-food101-v3`.
- Updated the model check's float test input to the expected `[0, 1]` range.
- Added `pnpm run inference:check` as a regression test using representative hamburger and sushi fixtures.

## Verification

The corrected service was verified locally with the bundled ONNX model:

| Fixture | Expected class | Observed class | Confidence |
|---|---|---|---:|
| `hamburger.webp` | hamburger | hamburger | 75.69% |
| `sushi.jpg` | sushi | sushi | 98.43% |

The regression test also verifies that `/health` reports:

```json
{
  "preprocessing": {
    "colorMode": "rgb",
    "resize": "fit",
    "interpolation": "nearest",
    "rescaling": "1/255"
  }
}
```

Run the checks from the repository root:

```bash
pnpm run typecheck
pnpm run model:check
pnpm run inference:check
```
