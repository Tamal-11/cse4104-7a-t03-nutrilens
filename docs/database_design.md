# Database Design

## Tables

### foods

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | text | Food name |
| category | text | Food category |
| image_url | text | Optional food image |

### nutrition_values

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| food_id | uuid | Related food |
| serving_size | text | Example: 100g |
| calories | numeric | Calories |
| protein | numeric | Protein in grams |
| carbs | numeric | Carbohydrates in grams |
| fats | numeric | Fats in grams |
| vitamins | jsonb | Vitamin values |
| minerals | jsonb | Mineral values |

### analysis_history

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | User ID |
| food_name | text | Predicted food |
| confidence | numeric | AI confidence |
| result | jsonb | Full result |
| created_at | timestamp | Analysis time |
