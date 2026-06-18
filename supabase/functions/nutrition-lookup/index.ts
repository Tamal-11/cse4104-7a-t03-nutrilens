import { corsHeaders } from "../_shared/cors.ts";
import { json, methodNotAllowed } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return methodNotAllowed(["GET", "OPTIONS"]);
  }

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

  return json(nutrition);
});
