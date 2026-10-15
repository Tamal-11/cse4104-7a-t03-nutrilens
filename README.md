# NutriLens

NutriLens is a food image and nutrition analysis app for CSE4104-7A-T03. Users can scan a meal, review estimated nutrition, and browse their recent scans and eating pattern calendar. The app uses Gemini through the backend; it does not run an AI model locally.

## Features

- Food image analysis with a clear **No food detected** result for non-food images.
- Estimated calories and macronutrients, plus plain-language meal notes.
- Profile settings for dietary preferences and health notes.
- Eating pattern calendar and a scrollable recent scan list.
- Admin settings for managing Gemini API keys.
- Local demo authentication for development.

Users must complete their display name, age, height, and weight before starting a new scan. Existing scans can still be opened. Nutrition results are estimates, not medical advice or a measurement of the photographed portion.

## How image analysis works

```text
Browser → NutriLens API → private R2 image → Gemini → validated result → meal history
```

The backend validates uploaded image types and sizes, sends the image to Gemini, validates the model response, and saves the result. API keys stay on the server. In production, images are stored in a private Cloudflare R2 bucket. The Worker serves them through an authenticated route that checks image ownership; a public R2 URL is not needed. Keep `R2_PUBLIC_BASE_URL` unset unless public image access is intentionally configured.

## Run locally

Requirements: Node.js 22 or newer and pnpm.

Install dependencies:

```bash
pnpm run setup
```

Start the frontend and local demo API:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). The local launcher starts the frontend and local API at `http://localhost:8787`. Sign up or sign in to access protected pages. The local API accepts development credentials and keeps profile and scan data in memory; new accounts start with an empty profile and history. Complete your profile before scanning.

Local demo accounts have the `user` role by default and cannot open `/admin`. To test admin-only settings, set `LOCAL_DEMO_ROLE=admin` in the root `.env` before starting the app. Save Gemini keys in **AI settings**; local mode stores them in the ignored `.local-storage/admin-ai-settings.json` file. Do not put API keys in frontend environment variables or commit them.

Press `Ctrl+C` to stop the local services.

## Project commands

```bash
pnpm run setup            # Install dependencies
pnpm run typecheck        # Type-check frontend and backend
pnpm run dev              # Start local frontend and API
pnpm run dev:api:local    # Start only the local demo API
pnpm run dev:frontend     # Start only the frontend
pnpm run db:migrate       # Apply database migrations
pnpm run deploy           # Deploy the backend Worker
```

## Production setup

The production backend runs as the `nutrilens-api` Cloudflare Worker. It uses Neon PostgreSQL, Neon Auth, Cloudflare R2, Cloudflare KV, and Gemini.

### Required Worker secrets

Set the database and Neon Auth credentials as Worker secrets:

```bash
cd backend
pnpm exec wrangler secret put DATABASE_URL
pnpm exec wrangler secret put NEON_AUTH_URL
```

`GEMINI_API_KEY` is an optional server-side fallback. The preferred production key configuration is the Admin dashboard’s **AI settings** tab.

### Admin-managed Gemini keys

The `GEMINI_SETTINGS_KV` namespace is already bound in `backend/wrangler.toml`. Admins can save up to 20 Gemini API keys and choose the model in `/admin`; keys are stored server-side in KV, and analysis requests rotate through the saved key pool. `GEMINI_API_KEY` remains available as a fallback when no key pool is configured.

Admin access comes from the authenticated Neon Auth user’s `role` field. A role of `admin` grants access; `ADMIN_EMAILS` is not used.

### Storage, CORS, and rate limits

- `FOOD_IMAGES` binds the private `food-images` R2 bucket. Uploaded images are read through the Worker’s authenticated route.
- `R2_PUBLIC_BASE_URL` is optional and should remain unset for private image delivery.
- `ALLOWED_ORIGINS` is configured in `backend/wrangler.toml`.
- Cloudflare rate limits allow 10 auth requests per minute and 30 protected API requests per minute.
- `MAX_IMAGE_UPLOAD_BYTES` defaults to 8 MiB.

### Deploy

From the repository root:

```bash
pnpm run typecheck
pnpm run deploy
```

Apply database migrations separately when a schema change requires one:

```bash
pnpm run db:migrate
```

The profile-completion scan gate uses existing profile columns and does not require a migration.

## Current limitations

- Gemini returns one primary-food estimate for an image; mixed plates and portion sizes can be misidentified.
- Nutrition and health notes are informational and should not replace professional advice.
- Local image analysis requires Gemini to be configured in Admin settings. The local API does not return fabricated scan results.
