# Run NutriLens locally

NutriLens has a self-contained local demo mode. It starts the React frontend and a Node/Hono API, so it does not require a Cloudflare account, Neon database, or R2 bucket.

## Prerequisites

- Node.js 22 or later
- pnpm 11 or later

## Start the app

```bash
pnpm run setup
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). The local API is available at `http://localhost:8787`; `GET /health` shows whether Gemini is configured.

The API accepts sign-up and sign-in requests as a local demo session. Fill in display name, age (13–120), height (50–260 cm), and weight (20–500 kg) before starting a scan.

## Configure Gemini

1. Add `LOCAL_DEMO_ROLE=admin` to the root `.env` file.
2. Restart `pnpm run dev`.
3. Sign in and open `/admin`.
4. In **AI settings**, add one to twenty Gemini API keys and a valid Gemini model identifier.

The local API rotates among saved keys. Settings are stored in `.local-storage/admin-ai-settings.json`, which is ignored by Git. You can also set a server-side fallback `GEMINI_API_KEY` and `GEMINI_MODEL` in the root `.env`. Do not put keys in `frontend/.env` or `VITE_*` variables.

## Local storage and reset behavior

- Uploaded files are placed in the ignored `.local-storage/` directory.
- Profile, accounts, scan history, and logs live only in the API process and reset when it stops.
- API-key settings persist locally in the ignored settings file.

Press `Ctrl+C` to stop the services.

## Useful commands

```bash
pnpm run dev:frontend     # Vite only
pnpm run dev:api:local    # Local demo API only
pnpm run typecheck        # Type-check both applications
pnpm run build:frontend   # Production frontend build
```
