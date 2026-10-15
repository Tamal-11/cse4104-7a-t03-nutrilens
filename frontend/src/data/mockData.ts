import type { FoodAnalysis, UserProfile } from '../types';

export const MOCK_USER: UserProfile = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  age: 28,
  gender: 'Other',
  height: 170,
  weight: 68,
  healthConditions: [],
  dietaryPreferences: ['Eat Balanced', 'More Protein'],
  isAdmin: false,
};

const mealExamples = [
  { name: 'Grilled chicken salad', emoji: '🥗', calories: 320, protein: 35, carbs: 18, fat: 12, healthy: true, pros: ['High in protein', 'Includes fresh vegetables'], cons: ['Watch dressing portions'], detail: 'A balanced plate with lean protein and colorful vegetables.' },
  { name: 'Vegetable rice bowl', emoji: '🍚', calories: 410, protein: 12, carbs: 67, fat: 10, healthy: true, pros: ['Good source of energy', 'Provides some vegetables'], cons: ['Could use more protein'], detail: 'A filling rice bowl with vegetables and a moderate amount of protein.' },
  { name: 'Egg and avocado toast', emoji: '🍳', calories: 360, protein: 18, carbs: 32, fat: 18, healthy: true, pros: ['Protein from eggs', 'Filling fats from avocado'], cons: ['Calories vary by bread size'], detail: 'A satisfying breakfast with protein, grains, and healthy fats.' },
  { name: 'Beef noodle soup', emoji: '🍜', calories: 480, protein: 27, carbs: 54, fat: 16, healthy: false, pros: ['Comforting and filling', 'Good protein source'], cons: ['Can be high in sodium'], detail: 'A hearty soup; consider balancing it with vegetables and water.' },
  { name: 'Yogurt fruit bowl', emoji: '🍓', calories: 280, protein: 16, carbs: 42, fat: 6, healthy: true, pros: ['Fruit adds fiber', 'Protein from yogurt'], cons: ['Sweetened yogurt may add sugar'], detail: 'A light bowl with fruit and protein-rich yogurt.' },
  { name: 'Chickpea curry', emoji: '🍛', calories: 390, protein: 17, carbs: 55, fat: 12, healthy: true, pros: ['Plant-based protein', 'Good source of fiber'], cons: ['Portion size affects calories'], detail: 'A fiber-rich meal with plant protein and satisfying carbohydrates.' },
  { name: 'Cheese sandwich', emoji: '🥪', calories: 430, protein: 19, carbs: 43, fat: 21, healthy: false, pros: ['Convenient source of protein'], cons: ['Can be high in sodium and saturated fat'], detail: 'A convenient meal; add vegetables or fruit for more balance.' },
  { name: 'Salmon with greens', emoji: '🐟', calories: 450, protein: 34, carbs: 28, fat: 22, healthy: true, pros: ['Rich in protein', 'Includes leafy greens'], cons: ['Estimate depends on cooking oil'], detail: 'A protein-rich meal with greens and a moderate portion of grains.' },
];

function makeMealImage(emoji: string, index: number) {
  const colors = ['#e8f3df', '#f8ead5', '#e2eff2', '#f4e5e8'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="${colors[index % colors.length]}"/><circle cx="320" cy="210" r="132" fill="#ffffff" opacity=".8"/><text x="320" y="248" text-anchor="middle" font-size="130">${emoji}</text><text x="320" y="370" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#527348">NutriLens sample meal</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createMockHistory(now = new Date()): FoodAnalysis[] {
  const entries: Array<{ daysAgo: number; hour: number; meal: typeof mealExamples[number] }> = [
    { daysAgo: 0, hour: 8, meal: mealExamples[2] },
    { daysAgo: 0, hour: 13, meal: mealExamples[0] },
    { daysAgo: 1, hour: 19, meal: mealExamples[5] },
    { daysAgo: 2, hour: 8, meal: mealExamples[4] },
    { daysAgo: 2, hour: 13, meal: mealExamples[1] },
    { daysAgo: 3, hour: 20, meal: mealExamples[3] },
    { daysAgo: 5, hour: 9, meal: mealExamples[2] },
    { daysAgo: 6, hour: 14, meal: mealExamples[6] },
    { daysAgo: 7, hour: 19, meal: mealExamples[7] },
    { daysAgo: 9, hour: 8, meal: mealExamples[4] },
    { daysAgo: 11, hour: 13, meal: mealExamples[0] },
    { daysAgo: 13, hour: 20, meal: mealExamples[5] },
    { daysAgo: 16, hour: 9, meal: mealExamples[1] },
    { daysAgo: 19, hour: 18, meal: mealExamples[7] },
    { daysAgo: 23, hour: 12, meal: mealExamples[3] },
    { daysAgo: 28, hour: 8, meal: mealExamples[2] },
    { daysAgo: 34, hour: 13, meal: mealExamples[5] },
    { daysAgo: 39, hour: 19, meal: mealExamples[0] },
  ];

  return entries.map(({ daysAgo, hour, meal }, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, (index * 7) % 60, 0, 0);
    return {
      id: `mock-meal-${index + 1}`,
      name: meal.name,
      isFood: true,
      image: makeMealImage(meal.emoji, index),
      time: date.toISOString(),
      isHealthy: meal.healthy,
      classification: meal.healthy ? 'Healthy' : 'Moderate',
      macros: { calories: meal.calories, protein: meal.protein, carbohydrates: meal.carbs, fat: meal.fat, fiber: Math.round(meal.carbs * 0.12) },
      servingSize: '1 estimated serving',
      pros: meal.pros,
      cons: meal.cons,
      warnings: meal.cons,
      suggestions: ['Adjust the portion to your needs'],
      explanation: meal.detail,
    };
  });
}
