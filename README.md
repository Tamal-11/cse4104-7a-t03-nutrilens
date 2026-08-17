# NutriLens

NutriLens is a food-recognition and nutrition-analysis system for CSE4104-7A-T03. It uses Gemini vision through the backend, so no local AI model is downloaded or run.

| Service | URL | Purpose |
|---|---|---|
| Frontend | `http://localhost:3000` | React/Vite UI |
| Local API | `http://localhost:8787` | Uploads, Gemini calls, and demo data |

## AI flow

`Frontend → Backend → Gemini → validated nutrition result → Frontend`

Images are uploaded to the backend first. The backend sends them to Gemini with a strict JSON response schema, validates the response before saving it, and never exposes the Gemini key to the browser. Nutrition values are estimates, not medical advice.

## Run locally

Requirements: Node.js 22+, pnpm, and a Gemini API key.

```bash
pnpm run setup
```

Copy `.env.example` to `.env`, then set:

```text
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Start the app:

```bash
pnpm run dev
```

Open `http://localhost:3000`. Never add the key to a frontend (`VITE_`) variable or commit `.env`.

## Useful commands

```bash
pnpm run setup            # install dependencies
pnpm run typecheck        # run TypeScript checks
pnpm run dev              # start frontend and local backend
pnpm run dev:api:local    # run local backend only
pnpm run dev:frontend     # run frontend only
pnpm run db:migrate       # run production database migrations
```

## Production configuration

Set `GEMINI_API_KEY` as a Cloudflare Worker secret:

```bash
cd backend
npx wrangler secret put GEMINI_API_KEY
```

Optional non-secret configuration: `GEMINI_MODEL` (defaults to `gemini-2.5-flash`). Production additionally needs its existing database, authentication, storage, CORS, and administrator settings.

## Current limitations

- Gemini provides one primary-food estimate from an image.
- Nutritional and health guidance is informational, not medical or clinical advice.
- The photographed portion is estimated and may be inaccurate.
