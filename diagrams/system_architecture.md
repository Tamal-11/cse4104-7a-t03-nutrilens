# System Architecture Diagram

```mermaid
flowchart TD
    A[User on Web App] --> B[React Frontend]
    B --> C[Neon Auth]
    B --> D[Cloudflare Worker API]
    D --> E[Neon PostgreSQL]
    D --> F[Cloudflare R2]
    D --> G[Mock Analysis Layer]
    G -. future .-> H[AI Model Service]

    subgraph Frontend
      B
    end

    subgraph Managed Auth
      C
    end

    subgraph App Backend
      D
      E
      F
    end

    subgraph AI
      G
      H
    end
```

## User flow

1. User signs up or logs in with Neon Auth
2. Frontend keeps session
3. User uploads food image
4. Worker stores file in R2 and metadata in Neon
5. Frontend asks for analysis using image id
6. Worker returns mock nutrition result now
7. Future version will call AI model before final response
