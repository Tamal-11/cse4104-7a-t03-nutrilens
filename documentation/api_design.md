# API Design

The production API is a Hono Cloudflare Worker. All `/api/v1/*` routes use the current Neon Auth session cookie; clients should send requests with credentials enabled. The frontend does not use bearer tokens for application routes.

`GET /` identifies the service, `GET /health` reports service/database health, and `GET /help` exposes runtime endpoint metadata. `GET /help/<endpoint-path>?method=<METHOD>` returns detailed metadata for a particular Worker route.

## Authentication routes

The Worker proxies these public paths to Neon Auth.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/sign-up` | Create an account. |
| POST | `/api/auth/sign-in` | Start a session. |
| GET | `/api/auth/session` | Read the current session/user. |
| POST | `/api/auth/sign-out` | End the current session. |

The production proxy maps these to Neon Auth’s `/sign-up/email`, `/sign-in/email`, `/get-session`, and `/sign-out` routes. The local demo also accepts the direct `/email` suffixes for convenience.

## User routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/profile` | Read the current profile. |
| POST | `/api/v1/profile` | Create or update the current profile. |
| POST | `/api/v1/upload-food-image` | Validate and store one food image. |
| GET | `/api/v1/food-images/:imageId` | Read an owned private image. |
| POST | `/api/v1/analyze-food` | Analyze an owned stored image with Gemini. |
| GET | `/api/v1/analysis-history` | List current-user analyses, newest first. |
| GET | `/api/v1/analysis-history/:analysisId` | Read one owned analysis. |
| GET | `/api/v1/nutrition-lookup?food=...` | Read a catalog nutrition entry. |
| GET | `/api/v1/health-insights?food=...` | Read catalog benefits and warnings. |

### Profile request

```json
{
  "fullName": "Saiful Islam Anik",
  "age": 24,
  "gender": "Male",
  "heightCm": 170,
  "weightKg": 68,
  "healthConditions": [],
  "allergies": ["Peanuts (China Badam)"],
  "foodGoal": "Eat balanced"
}
```

`foodGoal` must be `Lose weight`, `Gain weight`, or `Eat balanced`. Uploading requires a non-empty display name, age 13–120, height 50–260 cm, and weight 20–500 kg.

### Upload request

Send `multipart/form-data` with `image` (required), and optional `mealType` and `notes`. JPEG, PNG, and WebP are accepted after MIME, byte-limit, and file-signature validation. The default size limit is 8 MiB.

```json
{
  "success": true,
  "data": {
    "imageId": "uuid",
    "objectKey": "user-id/uuid-photo.jpg",
    "imageUrl": "/api/v1/food-images/uuid"
  }
}
```

### Analysis request and response

```json
{ "imageId": "uuid" }
```

```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "isFood": true,
    "foodName": "Pizza",
    "confidence": 0.87,
    "nutrition": {
      "calories": 266,
      "protein": 11,
      "carbohydrates": 33,
      "fats": 10,
      "fiber": 2,
      "servingSize": "visible portion estimate"
    },
    "classification": "Moderate",
    "recommendation": "Limit",
    "healthBenefits": ["..."],
    "warnings": ["..."],
    "suggestions": ["..."],
    "explanation": "...",
    "imageUrl": "/api/v1/food-images/uuid"
  }
}
```

For a non-food image, the model returns `isFood: false`, `foodName: "Not food"`, zero nutrition values, and empty guidance arrays. Food estimates are not medical advice.

## Administrator routes

All administrator routes require the authenticated user’s Neon role to be `admin`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/admin/overview` | Read user, scan, health, and event summary. |
| GET | `/api/v1/admin/uploads` | List up to 300 uploaded images. |
| GET | `/api/v1/admin/uploads/:imageId/image` | Read an uploaded image for review. |
| GET | `/api/v1/admin/ai-settings` | Read model and configured-key count. |
| PUT | `/api/v1/admin/ai-settings` | Save a model and 1–20 unique API keys. |
| PUT | `/api/v1/admin/users/:userId/status` | Set an account to `Active` or `Suspended`. |

AI-settings requests take `{ "apiKeys": ["..."], "model": "gemini-2.5-flash" }`. The response never returns the keys. The Worker rotates saved keys and can fall back to `GEMINI_API_KEY` when no pool is configured.

## Errors and status codes

Responses normally use `{ "success": false, "message": "..." }`. Common status codes are `400` for invalid input, `401` for a missing session, `403` for suspended accounts, missing profile completion, or non-admin access, `404` for missing/foreign records, `429` for rate limiting, `502` for Gemini failures, `503` for unavailable service/configuration, and `500` for unexpected failures. Unhandled Worker errors also include a `requestId` for server-side diagnostics.
