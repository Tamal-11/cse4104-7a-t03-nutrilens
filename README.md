# NutriLens

NutriLens is an AI based food recognition and nutrition analysis system for CSE4104-7A-T03.

The project now has a one-command local demo mode. It starts the app with npm only:

| Service | URL | Purpose |
|---|---|---|
| Frontend | `http://localhost:3000` | React/Vite user interface |
| Local API | `http://localhost:8787` | Demo backend compatible with the frontend routes |
| Local AI | `http://127.0.0.1:8788` | Optional Node.js ONNX Food-101 service. If native AI dependencies fail, the local API still runs with fallback analysis. |

## Run with one command

Requirements:

- Node.js 22 or newer
- Internet connection on first run so npm can install packages

From the project root, run:

```bash
npm run dev
```

The command automatically:

1. creates `.env` from `.env.example` if missing,
2. creates `frontend/.env.local` for the local API URL,
3. installs dependencies with npm, without PNPM or Corepack,
4. checks that the ONNX model exists,
5. tries to start the local AI service,
6. starts the frontend and local API. If the AI service cannot start, the API still returns a demo fallback analysis so the app remains usable.

Press `Ctrl+C` to stop all services.


## Windows / Corepack note

This package intentionally uses plain npm. It does not require PNPM or Corepack, so it avoids the common Windows error:

```text
Cannot find matching keyid
```

If you previously ran an older PNPM/Corepack version of this project, the new startup script detects old PNPM `node_modules` and reinstalls dependencies with npm automatically. You can also force a clean reinstall with:

```bash
npm run clean:deps
npm run dev
```


To intentionally skip the optional AI service and use the local fallback only:

```bash
# PowerShell
$env:SKIP_AI="1"; npm run dev

# macOS/Linux
SKIP_AI=1 npm run dev
```

## Demo login

Local demo mode does not require Neon Auth. You can register or sign in with any email/password in the UI. The local API creates a demo session automatically.

## Local image analysis flow

1. Open `http://localhost:3000`.
2. Register or sign in with any test email.
3. Upload a JPG, PNG, or WebP food image.
4. The local API saves the image under `.local-storage/uploads/`.
5. If the Node ONNX AI service is running, the local API sends the image there. Otherwise it returns a fallback demo analysis.
6. The UI shows the food analysis result.

## Useful commands

```bash
npm run dev              # one-command local demo
npm run typecheck        # frontend + backend + AI TypeScript checks
npm run dev:ai           # optional AI service only
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

The old Python placeholder AI code was removed from the active project. NutriLens now uses the local Node.js ONNX service in `ai-node/`.
