# API Design

## 1. Analyze Food Image

### Endpoint

```text
POST /analyze-food
```

### Request

```json
{
  "image": "uploaded_food_image"
}
```

### Response

```json
{
  "food_name": "Apple",
  "confidence": 0.94,
  "nutrition": {
    "calories": "52 kcal",
    "protein": "0.3 g",
    "carbohydrates": "14 g",
    "fats": "0.2 g",
    "vitamins": ["Vitamin C"],
    "minerals": ["Potassium"]
  },
  "health_benefits": [],
  "possible_side_effects": []
}
```

## 2. Nutrition Lookup

### Endpoint

```text
GET /nutrition-lookup?food=apple
```

## 3. Health Insights

### Endpoint

```text
POST /health-insights
```
