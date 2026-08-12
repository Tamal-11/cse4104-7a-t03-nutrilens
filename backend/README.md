# NutriLens Backend

NutriLens uses a Hono backend. Production runs as a Cloudflare Worker with Neon PostgreSQL, Neon Auth, and Cloudflare R2. Local demo mode runs with Node.js and local storage.

## Stack

| Part | Tool |
|---|---|
| API | Hono |
| Production runtime | Cloudflare Workers |
| Database | Neon PostgreSQL |
| Authentication | Neon Auth |
| Image storage | Cloudflare R2 |
| AI analysis | Node.js ONNX Food-101 service |

## Local development

From the repository root:

```bash
npm run setup
npm run setup:model
npm run model:check
npm run inference:check
npm run dev
```

Local services:

```text
Frontend   http://localhost:3000
Backend    http://localhost:8787
AI service http://127.0.0.1:8788
```

The local backend uses demo authentication and in-memory records. Production authentication and storage are separate.

## Production environment

Production configuration includes:

```text
DATABASE_URL
NEON_AUTH_URL
ALLOWED_ORIGINS
AI_MODEL_ENDPOINT
AI_MODEL_API_KEY
ADMIN_EMAILS
MAX_IMAGE_UPLOAD_BYTES
```

Cloudflare R2 is bound as `FOOD_IMAGES` in `backend/wrangler.toml`.

Store secrets with Wrangler from the `backend` directory, for example:

```bash
cd backend
npx wrangler secret put DATABASE_URL
npx wrangler secret put NEON_AUTH_URL
npx wrangler secret put AI_MODEL_API_KEY
```

Run migrations from the repository root:

```bash
npm run db:migrate
```

Deploy from the repository root:

```bash
npm run deploy
```

## Security controls

The production Worker includes:

- allowlisted credentialed CORS using `ALLOWED_ORIGINS`;
- request IDs and a generic unhandled-error response;
- Cloudflare rate limits for auth and protected API routes;
- strict profile and request-body validation;
- UUID validation for protected resource IDs;
- image MIME, file-size, and file-signature checks;
- user ownership checks for private images and analysis history;
- server-side admin authorization; and
- AI response validation before persistence.

The AI service can also require `AI_MODEL_API_KEY` when deployed beyond localhost.

## Main routes

```text
/api/auth/*
/api/v1/profile
/api/v1/upload-food-image
/api/v1/analyze-food
/api/v1/analysis-history
/api/v1/analysis-history/:analysisId
/api/v1/nutrition-lookup
/api/v1/health-insights
/api/v1/admin/*
```

Do not commit real `.env` files, database credentials, or API keys.
