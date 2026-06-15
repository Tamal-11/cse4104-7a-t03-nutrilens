# API Design

This is planning only. No endpoint is implemented yet.

Base path:

```text
/functions/v1
```

## Auth APIs

### 1. Register User

```text
POST /functions/v1/auth-register
```

Purpose:
- Create account with email and password
- Create matching profile row after auth user is created

Headers:

```text
Content-Type: application/json
```

Request body:

```json
{
  "fullName": "Saiful Islam",
  "email": "saiful@example.com",
  "password": "StrongPass123!",
  "age": 23,
  "gender": "male"
}
```

Success response:

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "userId": "uuid",
    "email": "saiful@example.com"
  }
}
```

### 2. Login User

```text
POST /functions/v1/auth-login
```

Purpose:
- Verify email and password
- Return access token and refresh token

Headers:

```text
Content-Type: application/json
```

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
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": "uuid",
      "email": "saiful@example.com",
      "fullName": "Saiful Islam"
    }
  }
}
```

### 3. Logout User

```text
POST /functions/v1/auth-logout
```

Purpose:
- Invalidate current session on backend side

Headers:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{}
```

Success response:

```json
{
  "success": true,
  "message": "Logout successful."
}
```

### 4. Get Current User

```text
GET /functions/v1/auth-me
```

Purpose:
- Check session from frontend without Supabase client library

Headers:

```text
Authorization: Bearer <access_token>
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "saiful@example.com",
    "fullName": "Saiful Islam",
    "age": 23,
    "gender": "male"
  }
}
```

## Profile APIs

### 5. Update Profile

```text
PUT /functions/v1/profile
```

Purpose:
- Update user profile details

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

## Upload APIs

### 6. Upload Food Image

```text
POST /functions/v1/upload-food-image
```

Purpose:
- Upload image file to Supabase Storage
- Save file metadata in database

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
    "storagePath": "food-images/user-id/file-name.jpg",
    "publicUrl": "https://project.supabase.co/storage/v1/object/public/food-images/..."
  }
}
```

## Analysis APIs

### 7. Analyze Food Image

```text
POST /functions/v1/analyze-food
```

Purpose:
- Use mock data for now
- Create one analysis request row
- Return predicted food, nutrition, and health notes

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
GET /functions/v1/analysis-history
```

Purpose:
- Show all past uploads and analysis results for logged-in user

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
      "imageUrl": "https://project.supabase.co/storage/...",
      "createdAt": "2026-06-15T10:00:00Z",
      "isMock": true
    }
  ]
}
```

### 9. Get Single Analysis Details

```text
GET /functions/v1/analysis-history/:analysisId
```

Purpose:
- Show one saved analysis result

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
    "createdAt": "2026-06-15T10:00:00Z"
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
