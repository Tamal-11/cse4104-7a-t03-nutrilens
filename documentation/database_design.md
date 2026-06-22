# Database Design

This design is for planning phase.

Main idea:

- Neon Auth keeps login tables
- App keeps profile, upload, and analysis tables
- Image file stays in R2
- Database keeps file metadata and result history

## Main database choice

- App database: Neon PostgreSQL
- Auth source: Neon Auth built on Better Auth
- Auth schema source: `neon_auth`
- File storage: Cloudflare R2 bucket `food-images`

## Tables

### 1. `user_profiles`

Stores app profile details. Login identity stays in `neon_auth.user`.

| Column | Type | Key | Notes |
|---|---|---|---|
| user_id | uuid | PK, FK | References `neon_auth.user.id` |
| full_name | text |  | User full name |
| age | int |  | Optional |
| gender | text |  | Optional |
| height_cm | numeric(5,2) |  | Optional |
| weight_kg | numeric(5,2) |  | Optional |
| created_at | timestamptz |  | Default `now()` |
| updated_at | timestamptz |  | Default `now()` |

### 2. `food_images`

Stores uploaded image metadata.

| Column | Type | Key | Notes |
|---|---|---|---|
| id | uuid | PK | Image row id |
| user_id | uuid | FK | References `user_profiles.user_id` |
| file_name | text |  | Original or normalized file name |
| object_key | text | Unique | Path inside R2 |
| image_url | text |  | Delivery URL |
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
| user_id | uuid | FK | References `user_profiles.user_id` |
| image_id | uuid | FK | References `food_images.id` |
| status | text |  | pending, completed, failed |
| requested_at | timestamptz |  | Default `now()` |
| completed_at | timestamptz |  | Nullable |

### 5. `analysis_results`

Stores final result returned to frontend.

| Column | Type | Key | Notes |
|---|---|---|---|
| id | uuid | PK | Result id |
| request_id | uuid | FK, Unique | One result per request |
| matched_catalog_id | uuid | FK | References `nutrition_catalog.id` |
| predicted_food_name | text |  | Example `Apple` |
| confidence_score | numeric(5,4) |  | Example `0.9400` |
| nutrition_snapshot | jsonb |  | Saved result copy |
| health_insights | jsonb |  | Benefits and warnings |
| model_name | text |  | Future-ready |
| model_version | text |  | Future-ready |
| is_mock | boolean |  | `true` for now |
| created_at | timestamptz |  | Default `now()` |

## Relationship summary

- One Neon auth user has one app profile
- One profile has many uploaded images
- One profile has many analysis requests
- One uploaded image can be analyzed many times
- One analysis request has one analysis result
- Many analysis results can point to one nutrition catalog item

## Why this shape works

- Login part stays with Neon Auth
- App data part stays clean and separate
- Worker can read one user id and fetch only that user's rows
- Image file storage stays outside Postgres
- Mock nutrition data can switch to real AI later
- Saved history stays easy

## Planning note

Neon Auth stores its own tables in the `neon_auth` schema.

This doc treats those auth tables as managed by Neon, not by our own migrations.
