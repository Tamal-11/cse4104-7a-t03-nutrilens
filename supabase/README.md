# Supabase Backend Planning

This folder is for backend planning with Supabase.

## Stack

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Edge Functions

## Why Edge Functions for auth

Frontend will not use Supabase client library.

So flow will be:

1. Frontend sends email and password to your own Edge Function
2. Edge Function talks to Supabase Auth
3. Edge Function returns clean REST response
4. Frontend stores token and uses it in later requests

## Planned Edge Function endpoints

Base path:

```text
/functions/v1
```

### Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth-register` | Create account with email and password |
| POST | `/auth-login` | Login and return tokens |
| POST | `/auth-logout` | Logout current user |
| GET | `/auth-me` | Check current user session |

### Profile

| Method | Path | Purpose |
|---|---|---|
| PUT | `/profile` | Update profile data |

### Upload

| Method | Path | Purpose |
|---|---|---|
| POST | `/upload-food-image` | Upload picture and save metadata |

### Analysis

| Method | Path | Purpose |
|---|---|---|
| POST | `/analyze-food` | Return mock nutrition result for uploaded image |
| GET | `/analysis-history` | Get all past analysis rows |
| GET | `/analysis-history/:analysisId` | Get one analysis details |

## Header rules

Public endpoints:

```text
Content-Type: application/json
```

Protected endpoints:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

Upload endpoint:

```text
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

## Planned database objects

- `user_profiles`
- `food_images`
- `nutrition_catalog`
- `analysis_requests`
- `analysis_results`
- Storage bucket: `food-images`

## Planned migration commands

### 1. Login to Supabase CLI

```bash
supabase login
```

### 2. Link local project with remote project

```bash
supabase link --project-ref your-project-ref
```

### 3. Create new migration file

```bash
supabase migration new planning_schema_update
```

### 4. Apply migrations to local Supabase

```bash
supabase db reset
```

### 5. Push migrations to remote Supabase project

```bash
supabase db push
```

### 6. Pull remote schema if team changed it online

```bash
supabase db pull
```

### 7. Serve Edge Functions locally later

```bash
supabase functions serve
```

## Development order

1. Finalize schema
2. Run migration
3. Create auth functions
4. Create upload function
5. Create mock analyze function
6. Connect frontend to these endpoints

## Planning note

For this phase, no function implementation is required. This README only fixes backend shape, API path plan, and database migration flow.
