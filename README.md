# NutriLens

NutriLens is a food picture app.

User flow:

1. User makes account
2. User logs in
3. User uploads food picture
4. System saves picture
5. System runs mock analysis now
6. User sees nutrition result and history

## Team

| Field | Information |
|---|---|
| Team Name | CSE4104-7A-T03 |
| Project Title | NutriLens - AI Based Food Recognition and Nutrition Analysis System |
| GitHub | https://github.com/Tamal-11/cse4104-7a-t03-nutrilens.git |

## Current backend direction

| Part | Tool |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| API layer | Cloudflare Worker + Hono |
| Database | Neon PostgreSQL |
| Auth | Neon Auth built on Better Auth |
| File storage | Cloudflare R2 |
| AI | Mock data now, real AI later |

## Package manager

Use pnpm from the repo root:

```bash
corepack enable
pnpm install
pnpm dev:backend
pnpm db:migrate
pnpm deploy
```

## Repo shape

```text
frontend/
backend/
docs/
diagrams/
ai/
tests/
README.md
```

## Backend docs

- [Backend platform note](backend/README.md)
- [System design document](docs/system_design_document.md)
- [API design](docs/api_design.md)
- [Database design](docs/database_design.md)
- [AI integration workflow](docs/ai_integration_workflow.md)

## Diagrams

- [System architecture](diagrams/system_architecture.md)
- [ER diagram](diagrams/er_diagram.md)
- [Use case diagram](diagrams/use_case_diagram.md)
- [Activity diagram](diagrams/activity_diagram.md)
- [AI Diagram](diagrams/ai_diagrams.md)

## App API paths

Worker base path:

```text
/api/v1
```

Main app routes:

| Method | Path |
|---|---|
| PUT | `/api/v1/profile` |
| POST | `/api/v1/upload-food-image` |
| POST | `/api/v1/analyze-food` |
| GET | `/api/v1/analysis-history` |
| GET | `/api/v1/analysis-history/:analysisId` |

## Auth paths

Auth is not planned inside the Worker.

Frontend will use Neon Auth at:

```text
{NEON_AUTH_URL}/*
```

Main auth actions:

- sign up
- sign in
- get session
- sign out

## Current note

Docs now follow the target backend plan:

- Neon PostgreSQL
- Neon Auth (Better Auth)
- Cloudflare Worker with Hono
- Cloudflare R2 for image files

The legacy Supabase folder has been removed. Backend code now lives in `backend/`.
