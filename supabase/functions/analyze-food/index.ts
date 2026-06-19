import { corsHeaders } from "../_shared/cors.ts";
import { getEndpointHelpByKey, isHelpPath } from "../_shared/help.ts";
import { json, methodNotAllowed } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (isHelpPath(req)) {
    return getEndpointHelpByKey("analyze-food");
  }

  if (req.method !== "POST") {
    return methodNotAllowed(["POST", "OPTIONS"]);
  }

  // TODO:
  // 1. Read uploaded image.
  // 2. Send image to AI model endpoint.
  // 3. Get predicted food name.
  // 4. Call nutrition lookup.
  // 5. Call health insights.
  // 6. Return final result.

  const result = {
    food_name: "Apple",
    confidence: 0.94,
    serving_size: "100g",
    nutrition: {
      calories: "52 kcal",
      protein: "0.3 g",
      carbohydrates: "14 g",
      fats: "0.2 g",
      vitamins: ["Vitamin C", "Vitamin K"],
      minerals: ["Potassium", "Calcium"],
    },
    health_benefits: [
      "Supports digestion because it contains fiber",
      "Provides antioxidants",
    ],
    possible_side_effects: [
      "Excess consumption may cause bloating",
      "People with blood sugar problems should control portion size",
    ],
  };

  return json(result);
});
