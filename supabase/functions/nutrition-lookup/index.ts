import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const food = url.searchParams.get("food") ?? "unknown";

  // TODO: Replace mock data with database or external Nutrition API.
  const nutrition = {
    food_name: food,
    serving_size: "100g",
    calories: "52 kcal",
    protein: "0.3 g",
    carbohydrates: "14 g",
    fats: "0.2 g",
    vitamins: ["Vitamin C"],
    minerals: ["Potassium"],
  };

  return new Response(JSON.stringify(nutrition), {
    headers: { "Content-Type": "application/json" },
  });
});
