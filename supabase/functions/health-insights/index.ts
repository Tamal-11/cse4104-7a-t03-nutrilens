import { corsHeaders } from "../_shared/cors.ts";
import { json, methodNotAllowed } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return methodNotAllowed(["GET", "OPTIONS"]);
  }

  const insights = {
    health_benefits: [
      "May provide useful nutrients depending on food type",
      "Can support a balanced diet when consumed in proper amount",
    ],
    possible_side_effects: [
      "Excessive consumption may cause health problems",
      "People with medical conditions should check with a professional",
    ],
  };

  return json(insights);
});
