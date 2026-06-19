import { corsHeaders } from "../_shared/cors.ts";
import { getEndpointHelpByKey, isHelpPath } from "../_shared/help.ts";
import { getBearerToken, json, methodNotAllowed } from "../_shared/http.ts";
import { createAnonClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (isHelpPath(req)) {
    return getEndpointHelpByKey("auth-me");
  }

  if (req.method !== "GET") {
    return methodNotAllowed(["GET", "OPTIONS"]);
  }

  try {
    const token = getBearerToken(req);

    if (!token) {
      return json({ error: "Missing bearer token" }, { status: 401 });
    }

    const supabase = createAnonClient(req.headers.get("Authorization"));
    const [
      { data: authData, error: authError },
      { data: profile, error: profileError },
    ] = await Promise.all([
      supabase.auth.getUser(token),
      supabase
        .from("user_profiles")
        .select("id, full_name, email, age, gender, height_cm, weight_kg, created_at, updated_at")
        .maybeSingle(),
    ]);

    if (authError || !authData.user) {
      return json({ error: authError?.message ?? "Invalid session" }, { status: 401 });
    }

    if (profileError) {
      return json({ error: profileError.message }, { status: 400 });
    }

    return json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmedAt: authData.user.email_confirmed_at,
      },
      profile: profile
        ? {
            id: profile.id,
            fullName: profile.full_name,
            email: profile.email,
            age: profile.age,
            gender: profile.gender,
            heightCm: profile.height_cm,
            weightKg: profile.weight_kg,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          }
        : null,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
});
