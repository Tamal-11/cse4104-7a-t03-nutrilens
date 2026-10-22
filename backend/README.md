# NutriLens backend

The production API is a Hono application deployed as the `nutrilens-api` Cloudflare Worker. It proxies Neon Auth, stores app data in Neon PostgreSQL, stores uploaded images in private Cloudflare R2, and calls Gemini for food analysis. `scripts/local-server.mjs` supplies a compatible local-demo implementation.

## Routes

`/`, `/health`, and `/help` are public. Authentication is exposed under `/api/auth/*`; application routes are under `/api/v1/*` and require the session cookie. The Worker has interactive endpoint metadata at `/help/<path>?method=<METHOD>`.

Implemented application areas:

- profile read/update and profile-completion gate;
- secure food upload, authenticated private image reads, analysis, and history;
- catalog nutrition and health-insight lookups; and
- administrator overview, upload review, user-status changes, and Gemini settings.

The complete request/response contract is in [../documentation/api_design.md](../documentation/api_design.md).

## Local development

From the repository root:

```bash
pnpm run setup
pnpm run dev
```

The full local demo runs at `http://localhost:8787`. It uses local files and memory but still calls Gemini when a key is configured. See [../RUN_LOCAL.md](../RUN_LOCAL.md).

To run the Worker development server against configured Cloudflare/Neon resources instead:

```bash
pnpm --filter nutrilens-backend dev
```

## Production configuration

Set these Worker secrets:

```text
DATABASE_URL
NEON_AUTH_URL
GEMINI_API_KEY          # optional fallback
```

`backend/wrangler.toml` declares the `FOOD_IMAGES` R2 binding, `GEMINI_SETTINGS_KV` binding, origin allowlist, and rate-limit bindings. Optional variables are `GEMINI_MODEL`, `MAX_IMAGE_UPLOAD_BYTES` (8 MiB default), and `R2_PUBLIC_BASE_URL`. Keep `R2_PUBLIC_BASE_URL` unset to preserve authenticated private image delivery.

```bash
cd backend
pnpm exec wrangler secret put DATABASE_URL
pnpm exec wrangler secret put NEON_AUTH_URL
```

From the repository root:

```bash
pnpm run db:migrate
pnpm run typecheck
pnpm run deploy
```

## Security behavior

- Sessions, roles, and passwords are handled through Neon Auth; role `admin` is required for administrative routes.
- CORS is credentialed and origin-allowlisted.
- Auth-changing routes and protected API routes have separate Worker rate limits.
- Uploads accept only JPEG, PNG, and WebP files that pass type, size, and signature checks.
- Images, scan history, and analysis records are ownership-scoped.
- Gemini responses are schema-validated before persistence; model failures return controlled errors.
- Request IDs are included in unhandled-error responses for diagnostics.
