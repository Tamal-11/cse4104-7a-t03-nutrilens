import { corsHeaders } from "../_shared/cors.ts";
import { getBearerToken, json, methodNotAllowed } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return methodNotAllowed(["POST", "OPTIONS"]);
  }

  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return json({ error: "Missing bearer token" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.admin.signOut(
      accessToken,
      "global",
    );

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json({
      message: "Logout successful",
      note:
        "Refresh tokens were revoked. Frontend should also clear the local access token.",
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
});
