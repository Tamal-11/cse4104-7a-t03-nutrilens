# Gemini Analysis Workflow

NutriLens does not run YOLO, EfficientNet, ShuffleNet, or a local Food-101 classifier. Gemini receives the validated uploaded image from the backend and is required to produce a schema-constrained JSON response.

```mermaid
sequenceDiagram
    participant User
    participant UI as React frontend
    participant API as Hono API
    participant Store as Private R2
    participant Gemini
    participant DB as Neon PostgreSQL

    User->>UI: Select food image
    UI->>API: multipart upload
    API->>API: Validate type, size, signature, fields
    API->>Store: Store owned object
    API-->>UI: imageId
    UI->>API: Analyze imageId
    API->>Store: Read owned image
    API->>Gemini: Image + structured response schema + profile context
    Gemini-->>API: Food/no-food JSON prediction
    API->>API: Validate response and merge direct allergy warning
    API->>DB: Save request and result
    API-->>UI: Result estimate and guidance
```

## Gemini response shape

```mermaid
flowchart LR
    Image[Validated image] --> Prompt[Food-analysis instructions]
    Goal[Food goal] --> Prompt
    Allergies[Reported allergies] --> Prompt
    Prompt --> Gemini[Gemini generateContent]
    Gemini --> Check[Schema and business validation]
    Check -->|valid| Result[Food name, confidence, nutrition, classification, recommendation, guidance]
    Check -->|invalid/provider failure| Error[Controlled API error]
```

For images that do not clearly show food, the requested response sets `isFood` to false, labels the item `Not food`, provides zero nutrition values, and omits health guidance.
