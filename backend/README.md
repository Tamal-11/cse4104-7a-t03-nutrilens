# NutriLens Backend

NutriLens now uses a Cloudflare Worker for app APIs, Neon PostgreSQL for app data, Neon Auth for login/session management, and Cloudflare R2 for uploaded food images.

## Stack

| Part | Tool |
|---|---|
| App API | Cloudflare Worker + Hono |
| Database | Neon PostgreSQL |
| Auth | Neon Auth built on Better Auth |
| File storage | Cloudflare R2 |
| Analysis | Local Node.js ONNX AI service |

## Folder Shape

```text
backend/
  migrations/
    001_neon_app_schema.sql
    002_profile_triggers_and_seed.sql
  src/
    index.ts
  package.json
  wrangler.toml
```

## Environment

Copy `.env.example` to `.env` in the repository root and set:

```text
DATABASE_URL=postgresql://...
NEON_AUTH_URL=https://your-neon-auth-endpoint
R2_PUBLIC_BASE_URL=https://your-public-r2-domain
```

Use the auth endpoint shown by Neon for `NEON_AUTH_URL`. The Worker validates
each protected request by calling that endpoint's `/get-session` route.

Store the database connection string and auth endpoint as Worker secrets before
the first deployment:

```bash
pnpm --dir backend exec wrangler secret put DATABASE_URL
pnpm --dir backend exec wrangler secret put NEON_AUTH_URL
```

Set `R2_PUBLIC_BASE_URL` in `wrangler.toml` or in the Cloudflare dashboard.
`pnpm dev:backend` loads local Worker bindings directly from the root `.env`.

## Database Setup

From the repository root, run all pending SQL migrations against Neon:

```bash
pnpm db:migrate
```

Applied files are recorded in `schema_migrations`. The app schema stores profile,
image, analysis request, analysis result, and mock nutrition catalog rows. Neon
Auth owns the login/session tables separately.

## Auth Flow

The frontend only calls the Worker. The Worker proxies `/api/auth/*` requests to
the Neon-provided auth endpoint:

```text
POST /api/auth/sign-up/email
POST /api/auth/sign-in/email
GET  /api/auth/get-session
POST /api/auth/sign-out
```

Request flow:

1. The frontend sends auth requests to the Worker's `/api/auth/*` routes.
2. The Worker forwards the request to `NEON_AUTH_URL`.
3. The Worker returns Neon Auth's response and session cookie to the frontend.
4. The frontend sends that cookie when calling protected `/api/v1/*` routes.
5. The Worker validates the cookie through `{NEON_AUTH_URL}/get-session`.
6. A valid session is mapped to `user_profiles`; otherwise the Worker returns `401`.

## Worker Routes

Base path:

```text
/api/v1
```

Protected routes:

| Method | Path | Purpose |
|---|---|---|
| PUT | `/profile` | Update app profile fields |
| POST | `/upload-food-image` | Store image in R2 and metadata in Neon |
| POST | `/analyze-food` | Analyze an uploaded image through the configured AI service |
| GET | `/analysis-history` | List current user's analyses |
| GET | `/analysis-history/:analysisId` | Read one analysis |
| GET | `/nutrition-lookup` | Mock nutrition lookup |
| GET | `/health-insights` | Mock health insights |


## One-command local demo

For classroom review, the repository root has a one-command local demo mode:

```bash
npm run dev
```

This starts `backend/scripts/local-server.mjs` instead of the Cloudflare Worker. The local server implements the frontend-facing routes with in-memory demo data and local filesystem uploads, so Neon, R2, and Cloudflare credentials are not required.

## Local Development

Use Node.js 22 or newer for the Worker toolchain.

Install dependencies from the repo root, then run Wrangler:

```bash
pnpm install
pnpm dev:backend
```

The local API listens at `http://localhost:8787`. Wrangler prints the URL after
the Workers runtime starts. Local mode does not require a Cloudflare login, but
authenticated `/api/v1/*` requests still require a valid Neon Auth session.

Deploy the Worker from the repository root:

```bash
pnpm run deploy
```

Use `pnpm run deploy`, not bare `pnpm deploy`. In pnpm 10, `pnpm deploy` is a
workspace deployment command and does not run this package script.

The Worker is the only public backend boundary. Clients must not call
`NEON_AUTH_URL` directly.
