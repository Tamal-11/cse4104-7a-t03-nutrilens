# Activity Diagram

## Major feature: Upload food image and get result

```mermaid
flowchart TD
    A([Start]) --> B[User logs in]
    B --> C[User uploads food image]
    C --> D[Frontend sends file to upload endpoint]
    D --> E[Edge Function validates token and file]
    E --> F[Store image in Supabase Storage]
    F --> G[Save image row in database]
    G --> H[Frontend calls analyze endpoint with imageId]
    H --> I[Create analysis request row]
    I --> J[Read mock nutrition data]
    J --> K[Create analysis result row]
    K --> L[Return result to frontend]
    L --> M[User sees nutrition and health notes]
    M --> N{Save in history?}
    N -->|Yes| O[Keep result in database]
    N -->|No| P[Return to dashboard]
    O --> Q([End])
    P --> Q
```
