# Database Design

This design is for planning phase. Real AI tables can grow later.

## Main Database Choice

- Database: Supabase PostgreSQL
- Auth source: Supabase Auth
- File storage: Supabase Storage bucket `food-images`

## Tables

### 1. `user_profiles`

Stores app user details. Auth login data stays in `auth.users`.

| Column | Type | Key | Notes |
|---|---|---|---|
| id | uuid | PK, FK | References `auth.users.id` |
| full_name | text |  | User full name |
| email | text | Unique | Copy of login email for quick read |
| age | int |  | Optional |
| gender | text |  | Optional |
| height_cm | numeric(5,2) |  | Optional |
| weight_kg | numeric(5,2) |  | Optional |
| created_at | timestamptz |  | Default `now()` |
| updated_at | timestamptz |  | Default `now()` |

### 2. `food_images`

Stores uploaded image info.

| Column | Type | Key | Notes |
|---|---|---|---|
| id | uuid | PK | Image row id |
| user_id | uuid | FK | References `user_profiles.id` |
| file_name | text |  | Stored file name |
| storage_path | text | Unique | Path inside Storage |
| public_url | text |  | Read URL |
| mime_type | text |  | Example `image/jpeg` |
| size_bytes | bigint |  | File size |
| meal_type | text |  | breakfast, lunch, dinner, snack |
| notes | text |  | Optional |
| uploaded_at | timestamptz |  | Default `now()` |

### 3. `nutrition_catalog`

Stores mock nutrition source data for now.

| Column | Type | Key | Notes |
|---|---|---|---|
| id | uuid | PK | Catalog row id |
| food_name | text | Unique | Example `Apple` |
| category | text |  | Fruit, rice, drink |
| serving_size | text |  | Example `100 g` |
| calories | numeric(8,2) |  |  |
| protein | numeric(8,2) |  |  |
| carbohydrates | numeric(8,2) |  |  |
| fats | numeric(8,2) |  |  |
| fiber | numeric(8,2) |  |  |
| vitamins | jsonb |  | Array/json data |
| minerals | jsonb |  | Array/json data |
| health_benefits | jsonb |  | Mock text list |
| warnings | jsonb |  | Mock text list |
| source_type | text |  | `mock` now |
| created_at | timestamptz |  | Default `now()` |
| updated_at | timestamptz |  | Default `now()` |

### 4. `analysis_requests`

Stores each analyze action.

| Column | Type | Key | Notes |
|---|---|---|---|
| id | uuid | PK | Request id |
| user_id | uuid | FK | References `user_profiles.id` |
| image_id | uuid | FK | References `food_images.id` |
| status | text |  | pending, completed, failed |
| requested_at | timestamptz |  | Default `now()` |
| completed_at | timestamptz |  | Nullable |

### 5. `analysis_results`

Stores final mock result returned to frontend.

| Column | Type | Key | Notes |
|---|---|---|---|
| id | uuid | PK | Result id |
| request_id | uuid | FK, Unique | One result per request |
| predicted_food_name | text |  | Example `Apple` |
| confidence_score | numeric(5,4) |  | Example `0.9400` |
| matched_catalog_id | uuid | FK | References `nutrition_catalog.id` |
| nutrition_snapshot | jsonb |  | Saved result copy |
| health_insights | jsonb |  | Benefits and warnings |
| model_name | text |  | Future-ready |
| model_version | text |  | Future-ready |
| is_mock | boolean |  | `true` for now |
| created_at | timestamptz |  | Default `now()` |

## Relationship Summary

- One auth user has one profile
- One profile has many uploaded images
- One profile has many analysis requests
- One uploaded image can have many analysis requests if user re-runs
- One analysis request has one analysis result
- Many analysis results can point to one nutrition catalog item

## Why this shape works

- Auth stays in Supabase Auth
- Frontend talks only to your own Edge Functions
- Upload flow and analysis flow stay separate
- Mock nutrition data can be swapped with real AI later
- Saved history becomes easy
