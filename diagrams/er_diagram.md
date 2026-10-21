# ER Diagram

```mermaid
erDiagram
    NEON_AUTH_USER ||--|| USER_PROFILES : has
    USER_PROFILES ||--o{ FOOD_IMAGES : owns
    USER_PROFILES ||--o{ ANALYSIS_REQUESTS : creates
    FOOD_IMAGES ||--o{ ANALYSIS_REQUESTS : is_used_by
    ANALYSIS_REQUESTS ||--|| ANALYSIS_RESULTS : has
    NUTRITION_CATALOG ||--o{ ANALYSIS_RESULTS : optionally_matches

    USER_PROFILES {
        uuid user_id PK
        text email UK
        text full_name
        int age
        text gender
        numeric height_cm
        numeric weight_kg
        jsonb health_conditions
        jsonb allergies
        text food_goal
        text account_status
        timestamptz last_active_at
    }

    FOOD_IMAGES {
        uuid id PK
        uuid user_id FK
        text file_name
        text object_key UK
        text image_url
        text mime_type
        bigint size_bytes
        text meal_type
        text notes
        timestamptz uploaded_at
    }

    ANALYSIS_REQUESTS {
        uuid id PK
        uuid user_id FK
        uuid image_id FK
        text status
        timestamptz requested_at
        timestamptz completed_at
    }

    ANALYSIS_RESULTS {
        uuid id PK
        uuid request_id FK
        uuid matched_catalog_id FK
        text predicted_food_name
        numeric confidence_score
        jsonb nutrition_snapshot
        jsonb health_insights
        text model_name
        text model_version
        boolean is_mock
        timestamptz created_at
    }

    NUTRITION_CATALOG {
        uuid id PK
        text food_name UK
        text serving_size
        numeric calories
        numeric protein
        numeric carbohydrates
        numeric fats
        numeric fiber
        jsonb vitamins
        jsonb minerals
        jsonb health_benefits
        jsonb warnings
        text source_type
    }
```

The `NEON_AUTH_USER` entity is managed by Neon Auth and is shown only to explain the profile association. R2 object bytes are intentionally outside this relational diagram; `food_images.object_key` links an image record to its private object.
