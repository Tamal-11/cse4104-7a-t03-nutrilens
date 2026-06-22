# API Design

This is target design only. No full Neon + Worker backend is implemented yet.

## Route split

Two doors:

1. Neon Auth handles login door
2. Cloudflare Worker handles app data door

## Auth APIs

Base URL:

```text
{NEON_AUTH_URL}/api/auth
```

These are managed by Neon Auth, not by Hono routes we write.

### 1. Register User

```text
POST {NEON_AUTH_URL}/api/auth/sign-up/email
```

Purpose:

- Make account with email and password
- Start user session after sign-up if auth settings allow it

Request body:

```json
{
  "email": "saiful@example.com",
  "password": "StrongPass123!",
  "name": "Saiful Islam"
}
```

Success response:

```json
{
  "token": "session-token-or-cookie-managed-by-sdk",
  "user": {
    "id": "uuid",
    "email": "saiful@example.com",
    "name": "Saiful Islam"
  }
}
```

### 2. Login User

```text
POST {NEON_AUTH_URL}/api/auth/sign-in/email
```

Purpose:

- Check email and password
- Start session

Request body:

```json
{
  "email": "saiful@example.com",
  "password": "StrongPass123!"
}
```

Success response:

```json
{
  "token": "jwt-or-session-managed-by-sdk",
  "user": {
    "id": "uuid",
    "email": "saiful@example.com",
    "name": "Saiful Islam"
  }
}
```

### 3. Get Current Session

```text
GET {NEON_AUTH_URL}/api/auth/get-session
```

Purpose:

- Check if user is still logged in
- Read current session user

Success response:

```json
{
  "session": {
    "userId": "uuid"
  },
  "user": {
    "id": "uuid",
    "email": "saiful@example.com",
    "name": "Saiful Islam"
  }
}
```

### 4. Logout User

```text
POST {NEON_AUTH_URL}/api/auth/sign-out
```

Purpose:

- End current session

Success response:

```json
{
  "success": true
}
```

## App APIs

Worker base path:

```text
/api/v1
```

All app APIs below are planned in Cloudflare Worker with Hono.

Protected routes expect logged-in user.

### 5. Update Profile

```text
PUT /api/v1/profile
```

Purpose:

- Save user profile details used by the app

Headers:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{
  "fullName": "Saiful Islam Anik",
  "age": 24,
  "gender": "male",
  "heightCm": 170,
  "weightKg": 68
}
```

Success response:

```json
{
  "success": true,
  "message": "Profile updated successfully."
}
```

### 6. Upload Food Image

```text
POST /api/v1/upload-food-image
```

Purpose:

- Save image file in R2
- Save image metadata in Neon PostgreSQL

Headers:

```text
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Form data:

```text
image: <binary file>
mealType: breakfast | lunch | dinner | snack
notes: optional string
```

Success response:

```json
{
  "success": true,
  "message": "Image uploaded successfully.",
  "data": {
    "imageId": "uuid",
    "objectKey": "food-images/user-id/file-name.jpg",
    "imageUrl": "https://pub-example.r2.dev/food-images/user-id/file-name.jpg"
  }
}
```

### 7. Analyze Food Image

```text
POST /api/v1/analyze-food
```

Purpose:

- Make one analysis job row
- Return mock result now
- Keep shape ready for real AI later

Headers:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{
  "imageId": "uuid"
}
```

Success response:

```json
{
  "success": true,
  "message": "Mock analysis completed.",
  "data": {
    "analysisId": "uuid",
    "foodName": "Apple",
    "confidence": 0.94,
    "servingSize": "100 g",
    "nutrition": {
      "calories": 52,
      "protein": 0.3,
      "carbohydrates": 14,
      "fats": 0.2,
      "fiber": 2.4,
      "vitamins": ["Vitamin C", "Vitamin K"],
      "minerals": ["Potassium"]
    },
    "healthBenefits": [
      "Good for quick light snack",
      "Has fiber"
    ],
    "warnings": [
      "Portion still matters for sugar control"
    ],
    "isMock": true
  }
}
```

### 8. Get Analysis History

```text
GET /api/v1/analysis-history
```

Purpose:

- Show all saved results for current user

Headers:

```text
Authorization: Bearer <access_token>
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "analysisId": "uuid",
      "foodName": "Apple",
      "confidence": 0.94,
      "imageUrl": "https://pub-example.r2.dev/food-images/user-id/file-name.jpg",
      "createdAt": "2026-06-22T10:00:00Z",
      "isMock": true
    }
  ]
}
```

### 9. Get Single Analysis Details

```text
GET /api/v1/analysis-history/:analysisId
```

Purpose:

- Show one saved result

Headers:

```text
Authorization: Bearer <access_token>
```

Success response:

```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "foodName": "Apple",
    "confidence": 0.94,
    "nutrition": {
      "calories": 52,
      "protein": 0.3,
      "carbohydrates": 14,
      "fats": 0.2
    },
    "healthBenefits": [
      "Good for digestion"
    ],
    "warnings": [
      "Do not overeat"
    ],
    "createdAt": "2026-06-22T10:00:00Z"
  }
}
```

## Common Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": "Email is required."
  }
}
```
