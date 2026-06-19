import { corsHeaders } from "../_shared/cors.ts";
import { getEndpointHelpByKey, isHelpPath } from "../_shared/help.ts";
import { json, methodNotAllowed, readJson } from "../_shared/http.ts";
import { createAnonClient } from "../_shared/supabase.ts";

type LoginBody = {
  email?: string;
  password?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (isHelpPath(req)) {
    return getEndpointHelpByKey("auth-login");
  }

  if (req.method !== "POST") {
    return methodNotAllowed(["POST", "OPTIONS"]);
  }

  try {
    const body = await readJson<LoginBody>(req);
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return json({ error: "email and password are required" }, { status: 400 });
    }

    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return json({ error: error.message }, { status: 401 });
    }

    const profile = data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name ?? null,
        }
      : null;

    return json({
      message: "Login successful",
      user: profile,
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
            tokenType: data.session.token_type,
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
