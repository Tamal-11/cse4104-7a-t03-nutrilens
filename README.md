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

## Repo shape

```text
frontend/
backend/
docs/
diagrams/
supabase/    # legacy folder, not current plan
ai/
tests/
README.md
```

## Backend docs

- [Backend platform note](D:\Stuff\cse4104-7a-t03-nutrilens\backend\README.md)
- [System design document](D:\Stuff\cse4104-7a-t03-nutrilens\docs\system_design_document.md)
- [API design](D:\Stuff\cse4104-7a-t03-nutrilens\docs\api_design.md)
- [Database design](D:\Stuff\cse4104-7a-t03-nutrilens\docs\database_design.md)
- [AI integration workflow](D:\Stuff\cse4104-7a-t03-nutrilens\docs\ai_integration_workflow.md)

## Diagrams

- [System architecture](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\system_architecture.md)
- [ER diagram](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\er_diagram.md)
- [Use case diagram](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\use_case_diagram.md)
- [Activity diagram](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\activity_diagram.md)
- [AI Diagram]
(D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\ai_diagram.md)

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
{NEON_AUTH_URL}/api/auth/*
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

Legacy Supabase files still exist in this repo, but they are old path, not source of truth.
