# NutriLens Backend

NutriLens now uses a Cloudflare Worker for app APIs, Neon PostgreSQL for app data, Neon Auth for login/session management, and Cloudflare R2 for uploaded food images.

## Stack

| Part | Tool |
|---|---|
| App API | Cloudflare Worker + Hono |
| Database | Neon PostgreSQL |
| Auth | Neon Auth built on Better Auth |
| File storage | Cloudflare R2 |
| Analysis | Mock result now, real AI later |

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

Set Worker secrets/vars:

```text
DATABASE_URL=postgresql://...
NEON_AUTH_URL=https://your-neon-auth-host
R2_PUBLIC_BASE_URL=https://your-public-r2-domain
```

`DATABASE_URL` should be stored as a Wrangler secret:

```bash
pnpm exec wrangler secret put DATABASE_URL
```

`NEON_AUTH_URL` and `R2_PUBLIC_BASE_URL` can stay in `wrangler.toml` during development, but production values should be configured in Cloudflare.

## Database Setup

Run the SQL files in order against the Neon database:

```text
migrations/001_neon_app_schema.sql
migrations/002_profile_triggers_and_seed.sql
```

The app schema stores profile, image, analysis request, analysis result, and mock nutrition catalog rows. Neon Auth owns the login/session tables separately.

## Auth Flow

Auth routes are handled by Neon Auth, not by the Worker:

```text
POST {NEON_AUTH_URL}/api/auth/sign-up/email
POST {NEON_AUTH_URL}/api/auth/sign-in/email
GET  {NEON_AUTH_URL}/api/auth/get-session
POST {NEON_AUTH_URL}/api/auth/sign-out
```

Frontend flow:

1. Register or sign in through Neon Auth.
2. Keep the Neon Auth session cookie or token.
3. Call Worker app routes with `credentials: "include"` when the session cookie is scoped to the Worker API domain, or `Authorization: Bearer <token>` when Neon Auth runs on a separate domain.
4. The Worker calls `{NEON_AUTH_URL}/api/auth/get-session`.
5. If the session is valid, the Worker upserts `user_profiles` and runs the requested app route.
6. If the session is missing or invalid, the Worker returns `401`.

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
| POST | `/analyze-food` | Create a mock analysis result for an uploaded image |
| GET | `/analysis-history` | List current user's analyses |
| GET | `/analysis-history/:analysisId` | Read one analysis |
| GET | `/nutrition-lookup` | Mock nutrition lookup |
| GET | `/health-insights` | Mock health insights |

## Local Development

Use Node.js 22 or newer for the Worker toolchain.

Install dependencies from the repo root, then run Wrangler:

```bash
pnpm install
pnpm --dir backend dev
```

For the frontend, set:

```text
VITE_API_BASE_URL=http://localhost:8787
```

The frontend upload helper now calls:

1. `POST /api/v1/upload-food-image`
2. `POST /api/v1/analyze-food`

Pass the active Neon Auth token into `analyzeFoodImage(file, accessToken)` when the Worker cannot receive the auth cookie directly.
