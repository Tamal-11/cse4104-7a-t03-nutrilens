# NutriLens

NutriLens is an AI based food recognition and nutrition analysis system for CSE4104-7A-T03.

The project includes a React frontend, backend API, database integration, and a local AI service for food image classification. For local development, the project can run using pnpm without requiring the production Neon or Cloudflare setup.

| Service | URL | Purpose |
|---|---|---|
| Frontend | `http://localhost:3000` | React/Vite user interface |
| Local API | `http://localhost:8787` | Local backend used by the frontend |
| Local AI | `http://127.0.0.1:8788` | Node.js ONNX Food-101 image classification service |

## Main features

- User registration and login
- User profile and analysis history
- Food image upload with click-to-browse and drag-and-drop
- AI based food recognition
- Estimated calorie and nutrition information shown on a 100 g basis
- Food classification as Healthy, Moderate, or Unhealthy
- Local development mode
- Production backend support using Cloudflare Workers, Neon, and R2

## AI integration

NutriLens uses a Food-101 image classification model to identify food from an uploaded image.

The active AI service is located in:

```text
ai-node/
```

The current model is:

```text
st_efficientnetlcv1_224_tfs_qdq_int8.onnx
```

It is an STMicroelectronics EfficientNet-LC Food-101 ONNX model with 101 food classes.

The basic AI flow is:

```text
User uploads food image
        ↓
Frontend
        ↓
Backend API
        ↓
AI service
        ↓
Food-101 ONNX model
        ↓
Food prediction
        ↓
Nutrition data lookup
        ↓
Result shown in frontend
```

The backend does not generate fake food results when the AI service is unavailable. If the AI service fails, the frontend receives an error instead.

### AI preprocessing

The model expects the uploaded image to be prepared before inference.

The current preprocessing is:

```text
Image
  ↓
Convert to RGB
  ↓
Resize to 224 x 224
  ↓
Nearest-neighbor interpolation
  ↓
Scale pixel values using 1/255
  ↓
ONNX model
```

The project does not use ImageNet mean/std normalization or center cropping for this model.

After making AI-related changes, run:

```bash
pnpm run model:check
pnpm run inference:check
```

The inference check tests the preprocessing and verifies representative Food-101 predictions.

## Run locally

### Requirements

- Node.js 22 or newer
- pnpm
- Internet connection for the first dependency and model setup

Check Node and pnpm:

```bash
node -v
pnpm -v
```

If `pnpm` is not available, enable the package manager shim included with Node.js:

```bash
corepack enable
```

### 1. Install dependencies

From the project root:

```bash
pnpm run setup
```

### 2. Download the AI model

```bash
pnpm run setup:model
```

Then verify it:

```bash
pnpm run model:check
pnpm run inference:check
```

### 3. Start the project

```bash
pnpm run dev
```

Open:

```text
http://localhost:3000
```

Press `Ctrl+C` in the terminal to stop the services.

## Demo login

Local demo mode does not require Neon Auth. A test email and password can be used through the frontend.

## Local image analysis flow

1. Open `http://localhost:3000`.
2. Register or sign in with a test account.
3. Upload or drag and drop a JPG, PNG, or WebP food image.
4. The local backend saves the uploaded image.
5. The backend sends it to the local ONNX AI service.
6. The AI service predicts the food class.
7. The backend matches the food with nutrition data.
8. The frontend displays the result.

## Useful commands

```bash
pnpm run setup            # install dependencies
pnpm run setup:model      # download the Food-101 model
pnpm run model:check      # verify the ONNX model
pnpm run inference:check  # test AI preprocessing and predictions
pnpm run typecheck        # run TypeScript checks
pnpm run dev              # start frontend, backend, and AI service
pnpm run dev:ai           # run AI service only
pnpm run dev:api:local    # run local backend only
pnpm run dev:frontend     # run frontend only
pnpm run db:migrate       # run production database migrations
pnpm run clean:deps       # remove node_modules/build output, keep lockfiles
```

## Project structure

```text
frontend/       React + Vite frontend
backend/        Backend API and local demo server
ai-node/        Active Node.js ONNX AI service
documentation/  Project and AI documentation
diagrams/       Project diagrams
designs/        UI/design assets
tests/          Test resources
```

## Production setup

The production Cloudflare Worker backend is available in:

```text
backend/src/index.ts
```

Production mode requires environment variables such as:

```text
DATABASE_URL
NEON_AUTH_URL
ALLOWED_ORIGINS
R2_PUBLIC_BASE_URL
AI_MODEL_ENDPOINT
AI_MODEL_API_KEY
```

Do not upload real `.env` files or API keys to GitHub.

## Current limitations

- The AI model only recognizes Food-101 classes.
- It gives one main food prediction for an image.
- It does not estimate portion size.
- Nutrition values are estimated from the nutrition database on an approximately 100 g basis; the photographed portion is not measured.
- It does not detect ingredients or allergens directly from the image.
- User profile information is not yet used for personalized AI recommendations.
- The system is an academic project and should not be treated as medical or clinical advice.

## Team

**Team:** CSE4104-7A-T03  
**Section:** 7A  
**Project:** NutriLens - AI Based Food Recognition and Nutrition Analysis System

| Name | Student ID | Role |
|---|---|---|
| Md. Arafat Hossen | 11230121099 | Team Leader |
| Md. Saiful Islam Anik | 11230121086 | Backend Developer |
| Md. Azizul Haque Rifat | 11230121087 | AI Engineer |
| Gazi Nafisa Maliat | 11250122046 | Frontend Designer |

## Repository

https://github.com/Tamal-11/cse4104-7a-t03-nutrilens
