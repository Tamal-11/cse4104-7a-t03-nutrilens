export type NutritionValues = {
  calories: string
  protein: string
  carbohydrates: string
  fats: string
  vitamins: string[]
  minerals: string[]
}

export type FoodAnalysisResult = {
  food_name: string
  confidence: number
  serving_size: string
  nutrition: NutritionValues
  health_benefits: string[]
  possible_side_effects: string[]
}
