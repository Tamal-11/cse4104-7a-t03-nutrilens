# NutriLens

NutriLens is a food-image nutrition assistant for CSE4104-7A-T03. Signed-in users upload a meal photo, receive a Gemini-generated estimate for the visible portion, and can revisit their scan history. The result includes calories, macronutrients, food classification, plain-language cautions, and a recommendation that considers the user’s selected food goal and reported allergies.

Nutrition results are estimates, not medical advice and not a measured portion size.

## What is included

- Email/password authentication and session-based protected routes.
- Profile management, including food goal, health conditions, and supported allergies.
- JPG, PNG, and WebP uploads up to 8 MiB by default, with MIME and file-signature validation.
- Gemini food analysis, including a clear **No food detected** state for unsuitable images.
- Private image delivery, scan history, and a calendar-oriented dashboard.
- An administrator area for account status, uploaded-image review, and Gemini model/key-pool settings.
- A local demo API that uses local files and memory instead of Neon, R2, and Cloudflare.

## Architecture

```text
React + Vite browser
  → Hono API on Cloudflare Workers
    → Neon Auth + Neon PostgreSQL
    → private Cloudflare R2 image bucket
    → Gemini generateContent API
```

The production Worker keeps images private and serves them only through routes that check the requester’s ownership (or administrator role). Gemini keys are server-side only.

## Run locally

Requirements: Node.js 22+ and pnpm 11+.

```bash
pnpm run setup
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). The launcher starts Vite on port 3000 and the local demo API on port 8787. Sign up or sign in, complete the required profile fields (display name, age, height, and weight), then scan a food image.

The local API uses a demo session, stores uploads below the ignored `.local-storage/` folder, and keeps profile/history data in memory until it stops. Add Gemini keys in **Admin → AI settings**. To expose the admin screen locally, set `LOCAL_DEMO_ROLE=admin` in the root `.env` before starting the services. Key-pool settings are saved to ignored local storage; never commit keys.

See [RUN_LOCAL.md](RUN_LOCAL.md) for local-mode details and [documentation/api_design.md](documentation/api_design.md) for the API contract.

## Commands

```bash
pnpm run setup            # Install workspace dependencies
pnpm run dev              # Start frontend and local demo API
pnpm run dev:frontend     # Start only Vite
pnpm run dev:api:local    # Start only the local demo API
pnpm run typecheck        # Type-check frontend and backend
pnpm run build:frontend   # Build the frontend
pnpm run db:migrate       # Apply production database migrations
pnpm run deploy           # Deploy the Cloudflare Worker
```

## Production configuration

The Worker needs `DATABASE_URL` and `NEON_AUTH_URL` as secrets, plus the `FOOD_IMAGES` R2 and `GEMINI_SETTINGS_KV` KV bindings declared in `backend/wrangler.toml`. `GEMINI_API_KEY` is an optional fallback when administrators have not configured an AI key pool. Other configuration includes `GEMINI_MODEL`, `MAX_IMAGE_UPLOAD_BYTES`, `ALLOWED_ORIGINS`, and the two Worker rate-limit bindings.

```bash
cd backend
pnpm exec wrangler secret put DATABASE_URL
pnpm exec wrangler secret put NEON_AUTH_URL
pnpm exec wrangler secret put GEMINI_API_KEY
```

Run migrations and deploy from the repository root:

```bash
pnpm run db:migrate
pnpm run deploy
```

The authenticated Neon user’s `role` field controls administration; only `admin` has administrator access.

## Documentation

- [Project overview](documentation/project_overview.md)
- [System design](documentation/system_design_document.md)
- [Database design](documentation/database_design.md)
- [API design](documentation/api_design.md)
- [Development roadmap](documentation/roadmap.md)
- [Architecture and workflow diagrams](diagrams/)

## Limitations

- Gemini can misidentify foods, especially mixed plates or obscured portions.
- The app reports an estimate for what is visible, not a dietary measurement.
- Local demo data is intentionally ephemeral; use production services for persistent data.
