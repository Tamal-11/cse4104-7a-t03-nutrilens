# NutriLens

NutriLens is a food picture app.

User flow is simple:

1. User makes account
2. User logs in
3. User uploads food picture
4. System stores picture
5. System returns mock food analysis
6. User sees nutrition and history

## Team

| Field | Information |
|---|---|
| Team Name | CSE4104-7A-T03 |
| Project Title | NutriLens - AI Based Food Recognition and Nutrition Analysis System |
| GitHub | https://github.com/Tamal-11/cse4104-7a-t03-nutrilens.git |

## Stack

| Part | Tool |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Supabase Edge Functions |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Auth | Supabase Auth through custom Edge Function APIs |
| AI | Mock data now, real AI later |

## Repo shape

```text
frontend/
backend/
supabase/
docs/
diagrams/
ai/
tests/
README.md
```

## Important planning docs

- [System design document](D:\Stuff\cse4104-7a-t03-nutrilens\docs\system_design_document.md)
- [API design](D:\Stuff\cse4104-7a-t03-nutrilens\docs\api_design.md)
- [Database design](D:\Stuff\cse4104-7a-t03-nutrilens\docs\database_design.md)
- [AI integration workflow](D:\Stuff\cse4104-7a-t03-nutrilens\docs\ai_integration_workflow.md)
- [Supabase backend planning](D:\Stuff\cse4104-7a-t03-nutrilens\supabase\README.md)

## Diagrams

- [System architecture](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\system_architecture.md)
- [ER diagram](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\er_diagram.md)
- [Use case diagram](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\use_case_diagram.md)
- [Activity diagram](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\activity_diagram.md)
- [AI Diagram]
(D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\ai_diagram.md)

## Planned backend APIs

| Method | Path |
|---|---|
| POST | `/functions/v1/auth-register` |
| POST | `/functions/v1/auth-login` |
| POST | `/functions/v1/auth-logout` |
| GET | `/functions/v1/auth-me` |
| PUT | `/functions/v1/profile` |
| POST | `/functions/v1/upload-food-image` |
| POST | `/functions/v1/analyze-food` |
| GET | `/functions/v1/analysis-history` |
| GET | `/functions/v1/analysis-history/:analysisId` |

## Current status

Planning phase only.

- Diagrams ready
- API structure ready
- Database plan ready
- Migration SQL drafted
- Real endpoints not built yet
