# Backend Platform Note

This is the current backend target for NutriLens.

## Big flow

User does two things:

1. User proves who they are
2. User uses app features

Those two things go to two different places:

- Neon Auth handles login, session, sign out
- Cloudflare Worker with Hono handles profile, upload, analysis, history

## Backend shape

| Part | Job |
|---|---|
| Neon Auth | Sign up, sign in, session, sign out |
| Cloudflare Worker + Hono | Main app API |
| Neon PostgreSQL | App data rows |
| Cloudflare R2 | Food image files |
| Mock analysis layer | Fake result now, real AI later |

## User flow

1. User signs up or signs in with Neon Auth
2. Frontend gets active session
3. User uploads food image
4. Worker checks logged-in user
5. Worker saves image file to R2
6. Worker saves metadata to Neon PostgreSQL
7. Worker returns image id
8. Frontend asks Worker to analyze image
9. Worker returns mock result now
10. User opens history and sees saved results

## Worker routes

Base path:

```text
/api/v1
```

Main routes:

- `PUT /profile`
- `POST /upload-food-image`
- `POST /analyze-food`
- `GET /analysis-history`
- `GET /analysis-history/:analysisId`

## Auth routes

Base path:

```text
{NEON_AUTH_URL}/api/auth
```

Main actions:

- `POST /sign-up/email`
- `POST /sign-in/email`
- `GET /get-session`
- `POST /sign-out`

## Planning note

This doc is target architecture only.

Legacy Supabase files still sit in repo, but they are old path and should not drive new backend work.
