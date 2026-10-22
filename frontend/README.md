# NutriLens frontend

The frontend is a React 19, Vite, TypeScript, Tailwind CSS application. It is a single-page interface with browser-history paths for the landing page, authentication, dashboard, AI Lens, profile, and administrator view.

## Start locally

From the repository root:

```bash
pnpm run setup
pnpm run dev
```

Vite runs at `http://localhost:3000` and talks to the local demo API at `http://localhost:8787` by default. Configure a different API origin with `VITE_API_BASE_URL` in `frontend/.env`; it must not contain Gemini or database secrets.

```bash
pnpm run dev:frontend
pnpm run build:frontend
pnpm run typecheck:frontend
```

## User flow

1. The app restores the cookie-backed session or shows the landing/authentication screens.
2. New users complete display name, age, height, and weight before they can upload a scan.
3. AI Lens uploads a JPG, PNG, or WebP image, then requests analysis using the returned image ID.
4. The result presents the model’s visible-portion estimate, classification, recommendation, benefits, cautions, and suggestions. Non-food images show a dedicated no-food result.
5. Dashboard and history let the user reopen past analyses; profile updates food goal, health conditions, and allergies.

Administrators can open `/admin` to review users and uploads and manage the server-side Gemini settings. The UI does not store API keys in browser configuration.

## Main folders

```text
src/components/  Screens and reusable interface elements
src/services/    Cookie-aware API client and response mapping
src/hooks/       PWA installation hook
src/types.ts     Application types
public/          Static assets
```

All nutrition information shown in the interface is an estimate and not medical advice.
