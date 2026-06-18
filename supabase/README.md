# Supabase Backend

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

## Edge Function endpoints

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

## Required secrets for functions

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database objects

- `user_profiles`
- `food_images`
- `nutrition_catalog`
- `analysis_requests`
- `analysis_results`
- Storage bucket: `food-images`

Auth flow also uses:

- trigger on `auth.users` to auto-create `user_profiles`
- row-level security so each user only sees own rows

## Run commands

### 1. Login to Supabase CLI

```bash
supabase login
```

### 2. Link local project with remote project

```bash
supabase link --project-ref your-project-ref
```

### 3. Apply migrations to local Supabase

```bash
supabase db reset
```

### 4. Push migrations to remote Supabase project

```bash
supabase db push
```

### 5. Pull remote schema if team changed it online

```bash
supabase db pull
```

### 6. Serve Edge Functions locally

```bash
supabase functions serve
```

## Auth user flow

1. User sends `email`, `password`, `fullName` to `/functions/v1/auth-register`
2. Supabase Auth makes account
3. DB trigger auto-creates `user_profiles` row
4. User logs in through `/functions/v1/auth-login`
5. Frontend stores `accessToken`
6. Frontend sends `Authorization: Bearer <token>` to `/functions/v1/auth-me` and other protected routes
7. Frontend calls `/functions/v1/auth-logout` and clears local token

## Current note

Built now:

- `auth-register`
- `auth-login`
- `auth-logout`
- `auth-me`
- `002_auth_profile_rls.sql`

Still not built:

- `profile`
- `upload-food-image`
- `analysis-history`
- final non-mock analyze flow
