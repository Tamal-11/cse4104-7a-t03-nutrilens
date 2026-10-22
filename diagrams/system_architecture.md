# System Architecture Diagram

```mermaid
flowchart TD
    User[User browser] --> Frontend[React + Vite frontend]
    Frontend -->|credentialed requests| API[Hono API: Cloudflare Worker]
    API --> Auth[Neon Auth]
    API --> DB[(Neon PostgreSQL)]
    API --> R2[(Private R2: food-images)]
    API --> Gemini[Gemini generateContent API]
    Admin[Administrator] -->|protected admin UI| Frontend
    API --> KV[KV: Gemini key pool and model]

    subgraph Local development
        LocalUI[Same React frontend] --> LocalAPI[Node/Hono local demo]
        LocalAPI --> Files[Ignored local files]
        LocalAPI --> LocalGemini[Gemini when configured]
    end
```

## Runtime responsibilities

- The frontend handles interaction, session restoration, upload selection, and result presentation.
- The Worker is the public trust boundary: it proxies auth, validates requests, scopes data to the user, and controls AI/image access.
- Neon holds relational profile, metadata, request, result, and system-event data.
- R2 holds image bytes privately; the API owns access checks.
- Gemini receives a server-side image request and returns structured analysis JSON.
- KV stores administrator-managed keys/model; a Worker secret can provide a fallback key.
