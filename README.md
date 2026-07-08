# NutriLens

NutriLens is an AI based food recognition and nutrition analysis system for CSE4104-7A-T03.

The project has a local demo mode using npm, a local API, and a local ONNX Food-101 model. Setup is explicit, so `npm run dev` does not install packages or download random files.

| Service | URL | Purpose |
|---|---|---|
| Frontend | `http://localhost:3000` | React/Vite user interface |
| Local API | `http://localhost:8787` | Demo backend compatible with the frontend routes |
| Local AI | `http://127.0.0.1:8788` | Required Node.js ONNX Food-101 service for real image detection. |

## Run locally

Requirements:

- Node.js 22 or newer
- Internet connection only for the one-time setup commands

First install dependencies once:

```bash
npm run setup
```

Then download the working Food-101 ONNX model once:

```bash
npm run setup:model
npm run model:check
```

Then start the app:

```bash
npm run dev
```

`npm run dev` only starts the services. It does not run `npm install` and does not download models. If dependencies or the model are missing, it prints the exact setup command to run.

Press `Ctrl+C` to stop all services.


## Windows / Corepack note

This package intentionally uses plain npm. It does not require PNPM or Corepack, so it avoids the common Windows error:

```text
Cannot find matching keyid
```

If you previously ran an older PNPM/Corepack version of this project, clean and reinstall once:

```bash
npm run clean:deps
npm run setup
npm run setup:model
npm run dev
```


## Demo login

Local demo mode does not require Neon Auth. You can register or sign in with any email/password in the UI. The local API creates a demo session automatically.

## Local image analysis flow

1. Open `http://localhost:3000`.
2. Register or sign in with any test email.
3. Upload a JPG, PNG, or WebP food image.
4. The local API saves the image under `.local-storage/uploads/`.
5. The local API sends the image to the Node ONNX AI service. If AI is offline, the backend returns an error instead of fake demo analysis.
6. The UI shows the food analysis result.

## Useful commands

```bash
npm run setup            # install dependencies once
npm run setup:model      # download working Food-101 ONNX model once
npm run model:check      # verify the ONNX model returns usable scores
npm run dev              # start local demo, no downloads
npm run typecheck        # frontend + backend + AI TypeScript checks
npm run dev:ai           # local ONNX AI service only
npm run dev:api:local    # local demo API only
npm run dev:frontend     # frontend only
npm run db:migrate       # production Neon migrations
```

## Project structure

```text
frontend/       React + Vite frontend
backend/        Cloudflare Worker backend and local demo API
ai-node/        Node.js ONNX Runtime AI service
documentation/  System, API, database, and AI integration docs
diagrams/       Project diagrams
designs/        UI/design assets
tests/          Test resources
```

## Production/cloud mode

The original Cloudflare Worker backend is still available in `backend/src/index.ts`. Production mode requires real values for:

```text
DATABASE_URL
NEON_AUTH_URL
R2_PUBLIC_BASE_URL or private R2 image route
AI_MODEL_ENDPOINT
AI_MODEL_API_KEY, if enabled
```

Do not commit or submit real `.env` files. Keep credentials only in your private local `.env` or deployment secrets.

## AI runtime note

The old Python placeholder AI code is not part of the active detection path. NutriLens uses the local Node.js ONNX service in `ai-node/`. The backend no longer silently returns repeated demo food when AI is unavailable. The old `food101-mobilenetv2.onnx` file is intentionally not used because it returns near-uniform outputs and causes wrong 1% predictions.
