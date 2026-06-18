import { corsHeaders } from "../_shared/cors.ts";
import { json, methodNotAllowed, readJson } from "../_shared/http.ts";
import { createAnonClient } from "../_shared/supabase.ts";

type RegisterBody = {
  email?: string;
  password?: string;
  fullName?: string;
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return methodNotAllowed(["POST", "OPTIONS"]);
  }

  try {
    const body = await readJson<RegisterBody>(req);
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const fullName = body.fullName?.trim();

    if (!email || !password || !fullName) {
      return json(
        { error: "email, password, and fullName are required" },
        { status: 400 },
      );
    }

    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          age: body.age ?? null,
          gender: body.gender ?? null,
          height_cm: body.heightCm ?? null,
          weight_kg: body.weightKg ?? null,
        },
      },
    });

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json(
      {
        message: data.session
          ? "Account created"
          : "Account created. Check email if confirmation is enabled.",
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email,
              fullName,
            }
          : null,
        session: data.session
          ? {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at,
              tokenType: data.session.token_type,
            }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
});
