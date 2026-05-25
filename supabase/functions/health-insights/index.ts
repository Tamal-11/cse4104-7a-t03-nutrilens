import { serve } from "https://deno.land/std/http/server.ts";

serve(async (_req) => {
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

  return new Response(JSON.stringify(insights), {
    headers: { "Content-Type": "application/json" },
  });
});
