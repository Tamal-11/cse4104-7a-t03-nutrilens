# CSE4104-7A-T03 NutriLens System Design

## Cover page

- Team: CSE4104-7A-T03
- Project: NutriLens
- Focus: System design and backend planning
- Backend stack: Cloudflare Worker + Hono, Neon PostgreSQL, Neon Auth, Cloudflare R2

## Team information

See [team_info.md](D:\Stuff\cse4104-7a-t03-nutrilens\docs\team_info.md).

## Project information

See [project_overview.md](D:\Stuff\cse4104-7a-t03-nutrilens\docs\project_overview.md).

## Backend direction

User goes through two simple paths:

1. User login path goes to Neon Auth
2. App feature path goes to Hono Worker

That means:

- auth stays managed
- app business logic stays in our Worker
- food image file stays in R2
- app data stays in Neon PostgreSQL

## Architecture diagram

See [system_architecture.md](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\system_architecture.md).

## ER diagram

See [er_diagram.md](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\er_diagram.md).

## Use case diagram

See [use_case_diagram.md](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\use_case_diagram.md).

## Activity diagram

See [activity_diagram.md](D:\Stuff\cse4104-7a-t03-nutrilens\diagrams\activity_diagram.md).

## API design

See [api_design.md](D:\Stuff\cse4104-7a-t03-nutrilens\docs\api_design.md).

## AI workflow

See [ai_integration_workflow.md](D:\Stuff\cse4104-7a-t03-nutrilens\docs\ai_integration_workflow.md).

## References

- [Neon Auth Overview](https://neon.com/docs/auth/overview)
- [Better Auth Installation](https://better-auth.com/docs/installation)
- [Better Auth Hono Integration](https://better-auth.com/docs/integrations/hono)
- [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
