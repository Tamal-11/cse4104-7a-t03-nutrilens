import { corsHeaders } from "../_shared/cors.ts";
import { listEndpointDocs } from "../_shared/help.ts";
import { json, methodNotAllowed } from "../_shared/http.ts";

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return methodNotAllowed(["GET", "OPTIONS"]);
  }

  return json({
    message: "Use /functions/v1/{endpoint}/help for body and response shape.",
    endpoints: listEndpointDocs(),
  });
});
