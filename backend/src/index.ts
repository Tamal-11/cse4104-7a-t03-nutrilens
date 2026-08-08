import { neon } from "@neondatabase/serverless";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { endpointDocs, findEndpointDocs } from "./api-docs";

type Env = {
  Bindings: {
    DATABASE_URL: string;
    NEON_AUTH_URL: string;
    FOOD_IMAGES: R2Bucket;
    R2_PUBLIC_BASE_URL?: string;
    AI_MODEL_ENDPOINT?: string;
    AI_MODEL_API_KEY?: string;
    ADMIN_EMAILS?: string;
    MAX_IMAGE_UPLOAD_BYTES?: string;
    ALLOWED_ORIGINS?: string;
    AUTH_RATE_LIMIT: RateLimit;
    API_RATE_LIMIT: RateLimit;
  };
  Variables: {
    user: AuthUser;
    requestId: string;
  };
};

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

const app = new Hono<Env>();

const DEFAULT_MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_METHODS = ["GET", "POST", "PUT", "OPTIONS"];

app.use("*", async (c, next) => {
  const requestId = c.req.header("X-Request-ID")?.slice(0, 128) || crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);
  await next();
});

app.use(
  "*",
  cors({
    origin: (origin, c) => isAllowedOrigin(origin, c.env.ALLOWED_ORIGINS),
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ALLOWED_METHODS,
    credentials: true,
  }),
);

app.onError((error, c) => {
  const requestId = c.get("requestId") || crypto.randomUUID();
  console.error(JSON.stringify({ event: "unhandled_error", requestId, path: c.req.path, message: error instanceof Error ? error.message : "Unknown error" }));
  return c.json({ success: false, message: "An unexpected error occurred.", requestId }, 500);
});

app.get("/", (c) =>
  c.json({
    name: "NutriLens API",
    basePath: "/api/v1",
    auth: "Use /api/auth/sign-up, /api/auth/sign-in, /api/auth/session, and /api/auth/sign-out.",
    health: "/health",
    help: "/help",
  }),
);

app.get("/health", async (c) => {
  const startedAt = Date.now();

  try {
    if (!c.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured.");
    }

    const sql = neon(c.env.DATABASE_URL);
    await sql`select 1 as healthy`;

    return c.json({
      status: "healthy",
      server: { status: "up" },
      database: { status: "up" },
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed", error);

    return c.json(
      {
        status: "degraded",
        server: { status: "up" },
        database: {
          status: "down",
          message:
            "Database connection failed.",
        },
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      503,
    );
  }
});

app.get("/help", (c) =>
  c.json({
    success: true,
    message:
      "Use /help/<endpoint-path>?method=<HTTP_METHOD> for detailed documentation.",
    endpoints: endpointDocs.map(
      ({ method, path, summary, authentication }) => ({
        method,
        path,
        summary,
        authentication,
        helpUrl: `/help${path === "/" ? "" : path}?method=${method === "ALL" ? "" : method}`,
      }),
    ),
  }),
);

app.get("/help/*", (c) => {
  const endpointPath = c.req.path.slice("/help".length);
  const method = c.req.query("method");
  const matches = findEndpointDocs(endpointPath, method);

  if (matches.length === 0) {
    return c.json(
      {
        success: false,
        message: "No endpoint documentation was found.",
        requestedPath: endpointPath,
        requestedMethod: method ?? null,
      },
      404,
    );
  }

  return c.json({
    success: true,
    data: matches.length === 1 ? matches[0] : matches,
  });
});

const authRoutes: Record<string, string> = {
  "/api/auth/sign-up": "/sign-up/email",
  "/api/auth/sign-in": "/sign-in/email",
  "/api/auth/session": "/get-session",
  "/api/auth/sign-out": "/sign-out",
};

app.all("/api/auth/*", async (c) => {
  const rateLimitResponse = await enforceAuthRateLimit(c);
  if (rateLimitResponse) return rateLimitResponse;
  if (!c.env.NEON_AUTH_URL) {
    return c.json(
      { success: false, message: "Authentication service is unavailable." },
      500,
    );
  }

  const authPath =
    authRoutes[c.req.path] ?? c.req.path.slice("/api/auth".length);
  const target = new URL(
    `${c.env.NEON_AUTH_URL.replace(/\/+$/, "")}${authPath}`,
  );
  target.search = new URL(c.req.url).search;

  const upstreamHeaders = new Headers(c.req.raw.headers);
  if (!upstreamHeaders.has("Origin")) {
    upstreamHeaders.set("Origin", new URL(c.req.url).origin);
  }

  const upstreamRequest = new Request(target, {
    method: c.req.method,
    headers: upstreamHeaders,
    body: c.req.raw.body,
    redirect: "manual",
  });
  const upstreamResponse = await fetch(upstreamRequest, { redirect: "manual" });
  const headers = new Headers(upstreamResponse.headers);
  const cookies = getSetCookies(upstreamResponse.headers);

  headers.delete("set-cookie");
  for (const cookie of cookies) {
    headers.append("set-cookie", cookie.replace(/;\s*Domain=[^;]+/gi, ""));
  }

  const location = headers.get("location");
  if (location?.startsWith(c.env.NEON_AUTH_URL)) {
    headers.set(
      "location",
      location.replace(c.env.NEON_AUTH_URL.replace(/\/+$/, ""), "/api/auth"),
    );
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
});

function getSetCookies(headers: Headers): string[] {
  const cookieHeaders = headers as Headers & {
    getSetCookie?: () => string[];
    getAll?: (name: string) => string[];
  };

  return (
    cookieHeaders.getSetCookie?.() ??
    cookieHeaders.getAll?.("Set-Cookie") ??
    (headers.get("Set-Cookie") ? [headers.get("Set-Cookie")!] : [])
  );
}

app.use("/api/v1/*", async (c, next) => {
  const user = await getCurrentUser(c.req.raw, c.env.NEON_AUTH_URL);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  c.set("user", user);
  const rateLimitResponse = await enforceApiRateLimit(c, user.id);
  if (rateLimitResponse) return rateLimitResponse;
  await ensureProfile(c.env.DATABASE_URL, user);
  if (!(await isAccountActive(c.env.DATABASE_URL, user.id))) {
    return c.json(
      { success: false, message: "This account is suspended." },
      403,
    );
  }
  await next();
});

app.get("/api/v1/profile", async (c) => {
  const user = c.get("user");
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`
    select
      user_id,
      email,
      full_name,
      age,
      gender,
      height_cm,
      weight_kg,
      health_conditions,
      dietary_preferences,
      created_at,
      updated_at
    from user_profiles
    where user_id = ${user.id}
    limit 1
  `;
  const profile = rows[0];

  if (!profile) {
    return c.json({ success: false, message: "Profile was not found." }, 404);
  }

  return c.json({
    success: true,
    data: {
      userId: profile.user_id,
      email: profile.email,
      fullName: profile.full_name,
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.height_cm === null ? null : Number(profile.height_cm),
      weightKg: profile.weight_kg === null ? null : Number(profile.weight_kg),
      healthConditions: profile.health_conditions ?? [],
      dietaryPreferences: profile.dietary_preferences ?? [],
      isAdmin: isAdmin(user, c.env.ADMIN_EMAILS),
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
  });
});

app.post("/api/v1/profile", async (c) => {
  const user = c.get("user");
  const parsed = await parseProfileBody(c.req.raw);
  if (!parsed.ok) return validationError(c, parsed.message);
  const body = parsed.value;
  const fullName =
    body.fullName?.trim() || user.name || user.email.split("@")[0];
  const sql = neon(c.env.DATABASE_URL);

  await sql`
    insert into user_profiles (
      user_id,
      email,
      full_name,
      age,
      gender,
      height_cm,
      weight_kg
      , health_conditions
      , dietary_preferences
    )
    values (
      ${user.id},
      ${user.email},
      ${fullName},
      ${body.age ?? null},
      ${body.gender ?? null},
      ${body.heightCm ?? null},
      ${body.weightKg ?? null}
      , ${JSON.stringify(body.healthConditions ?? [])}
      , ${JSON.stringify(body.dietaryPreferences ?? [])}
    )
    on conflict (user_id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      age = excluded.age,
      gender = excluded.gender,
      height_cm = excluded.height_cm,
      weight_kg = excluded.weight_kg
      , health_conditions = excluded.health_conditions
      , dietary_preferences = excluded.dietary_preferences
  `;

  return c.json({ success: true, message: "Profile updated successfully." });
});

app.post("/api/v1/upload-food-image", async (c) => {
  const user = c.get("user");
  const form = await c.req.formData();
  const image = form.get("image") as File | string | null;

  if (!isUploadedFile(image)) {
    return c.json({ success: false, message: "Image file is required." }, 400);
  }

  const uploadError = await validateUploadedImage(
    image,
    c.env.MAX_IMAGE_UPLOAD_BYTES,
  );
  if (uploadError) {
    return c.json({ success: false, message: uploadError }, 400);
  }

  const formError = validateImageForm(form);
  if (formError) return validationError(c, formError);
  const mealType = stringValue(form.get("mealType"));
  const notes = stringValue(form.get("notes"));
  const imageId = crypto.randomUUID();
  const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "food-image";
  const objectKey = `${user.id}/${imageId}-${safeName}`;

  await c.env.FOOD_IMAGES.put(objectKey, image.stream(), {
    httpMetadata: { contentType: image.type || "application/octet-stream" },
  });

  const imageUrl = c.env.R2_PUBLIC_BASE_URL
    ? `${c.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`
    : `/api/v1/food-images/${imageId}`;
  const sql = neon(c.env.DATABASE_URL);

  await sql`
    insert into food_images (
      id,
      user_id,
      file_name,
      object_key,
      image_url,
      mime_type,
      size_bytes,
      meal_type,
      notes
    )
    values (
      ${imageId},
      ${user.id},
      ${image.name || safeName},
      ${objectKey},
      ${imageUrl},
      ${image.type || "application/octet-stream"},
      ${image.size},
      ${mealType},
      ${notes}
    )
  `;

  return c.json({
    success: true,
    message: "Image uploaded successfully.",
    data: { imageId, objectKey, imageUrl },
  });
});

app.get("/api/v1/food-images/:imageId", async (c) => {
  const user = c.get("user");
  if (!isUuid(c.req.param("imageId"))) return validationError(c, "imageId must be a UUID.");
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`select object_key, mime_type from food_images
    where id = ${c.req.param("imageId")} and user_id = ${user.id} limit 1`;
  if (!rows[0])
    return c.json(
      { success: false, message: "Food image was not found." },
      404,
    );
  const image = await c.env.FOOD_IMAGES.get(rows[0].object_key);
  if (!image)
    return c.json(
      { success: false, message: "Food image data was not found." },
      404,
    );
  return new Response(image.body, {
    headers: {
      "Content-Type": rows[0].mime_type,
      "Cache-Control": "private, max-age=3600",
    },
  });
});

app.post("/api/v1/analyze-food", async (c) => {
  const user = c.get("user");
  const parsed = await parseImageIdBody(c.req.raw);
  if (!parsed.ok) return validationError(c, parsed.message);
  const body = parsed.value;

  const sql = neon(c.env.DATABASE_URL);
  const imageRows = await sql`
    select id, object_key, file_name, mime_type, image_url
    from food_images
    where id = ${body.imageId}
      and user_id = ${user.id}
    limit 1
  `;

  if (imageRows.length === 0) {
    return c.json(
      { success: false, message: "Food image was not found." },
      404,
    );
  }

  if (!c.env.AI_MODEL_ENDPOINT) {
    return c.json(
      {
        success: false,
        message: "Food analysis service is unavailable.",
      },
      503,
    );
  }

  const storedImage = await c.env.FOOD_IMAGES.get(imageRows[0].object_key);
  if (!storedImage) {
    return c.json(
      { success: false, message: "Uploaded image data was not found." },
      404,
    );
  }

  const modelForm = new FormData();
  modelForm.append(
    "image",
    new File([await storedImage.arrayBuffer()], imageRows[0].file_name, {
      type: imageRows[0].mime_type,
    }),
  );
  let modelResponse: Response;
  try {
    modelResponse = await fetch(c.env.AI_MODEL_ENDPOINT, {
      method: "POST",
      headers: c.env.AI_MODEL_API_KEY
        ? { Authorization: `Bearer ${c.env.AI_MODEL_API_KEY}` }
        : undefined,
      body: modelForm,
    });
  } catch (error) {
    console.error("AI model request failed", error);
    return c.json(
      {
        success: false,
        message: "Food analysis service is unavailable.",
      },
      502,
    );
  }
  const prediction = (await modelResponse
    .json()
    .catch(() => null)) as ModelPrediction | null;
  if (!modelResponse.ok || !prediction || (prediction as { success?: boolean }).success === false) {
    return c.json(
      {
        success: false,
        message:
          "Food analysis service is unavailable.",
      },
      502,
    );
  }
  const modelValidationError = validatePrediction(prediction);
  if (modelValidationError) {
    return c.json(
      {
        success: false,
        message: "Food analysis service returned an invalid response.",
      },
      502,
    );
  }

  const catalogRows = await sql`
    select id
    from nutrition_catalog
    where lower(food_name) = lower(${prediction.foodName})
    limit 1
  `;
  const analysisId = crypto.randomUUID();
  const resultId = crypto.randomUUID();
  const healthInsights = {
    healthBenefits: prediction.healthBenefits ?? [],
    warnings: prediction.warnings ?? [],
    suggestions: prediction.suggestions ?? [],
    explanation: prediction.explanation ?? "",
    classification: prediction.classification,
  };

  await sql`
    insert into analysis_requests (id, user_id, image_id, status, completed_at)
    values (${analysisId}, ${user.id}, ${body.imageId}, 'completed', now())
  `;
  await sql`
    insert into analysis_results (
      id,
      request_id,
      matched_catalog_id,
      predicted_food_name,
      confidence_score,
      nutrition_snapshot,
      health_insights,
      model_name,
      model_version,
      is_mock
    )
    values (
      ${resultId},
      ${analysisId},
      ${catalogRows[0]?.id ?? null},
      ${prediction.foodName},
      ${prediction.confidence},
      ${JSON.stringify(prediction.nutrition)},
      ${JSON.stringify(healthInsights)},
      ${prediction.modelName ?? "external-model"},
      ${prediction.modelVersion ?? null},
      false
    )
  `;

  return c.json({
    success: true,
    message: "Analysis completed.",
    data: {
      analysisId,
      foodName: prediction.foodName,
      confidence: prediction.confidence,
      nutrition: prediction.nutrition,
      healthBenefits: healthInsights.healthBenefits,
      warnings: healthInsights.warnings,
      suggestions: healthInsights.suggestions,
      explanation: healthInsights.explanation,
      classification: healthInsights.classification,
      imageUrl: imageRows[0].image_url,
    },
  });
});

app.get("/api/v1/analysis-history", async (c) => {
  const user = c.get("user");
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`
    select
      ar.id as analysis_id,
      res.predicted_food_name,
      res.confidence_score,
      img.image_url,
      res.nutrition_snapshot,
      res.health_insights,
      res.created_at,
      ar.requested_at
    from analysis_requests ar
    join analysis_results res on res.request_id = ar.id
    join food_images img on img.id = ar.image_id
    where ar.user_id = ${user.id}
    order by res.created_at desc
  `;

  return c.json({
    success: true,
    data: rows.map((row) => ({
      analysisId: row.analysis_id,
      foodName: row.predicted_food_name,
      confidence: Number(row.confidence_score),
      imageUrl: row.image_url,
      createdAt: row.created_at,
      nutrition: row.nutrition_snapshot,
      healthBenefits: row.health_insights?.healthBenefits ?? [],
      warnings: row.health_insights?.warnings ?? [],
      suggestions: row.health_insights?.suggestions ?? [],
      explanation: row.health_insights?.explanation ?? "",
      classification: row.health_insights?.classification ?? "Moderate",
    })),
  });
});

app.get("/api/v1/analysis-history/:analysisId", async (c) => {
  const user = c.get("user");
  if (!isUuid(c.req.param("analysisId"))) return validationError(c, "analysisId must be a UUID.");
  const analysisId = c.req.param("analysisId");
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`
    select
      ar.id as analysis_id,
      res.predicted_food_name,
      res.confidence_score,
      res.nutrition_snapshot,
      res.health_insights,
      img.image_url,
      res.created_at
    from analysis_requests ar
    join analysis_results res on res.request_id = ar.id
    join food_images img on img.id = ar.image_id
    where ar.id = ${analysisId}
      and ar.user_id = ${user.id}
    limit 1
  `;

  if (rows.length === 0) {
    return c.json({ success: false, message: "Analysis was not found." }, 404);
  }

  const row = rows[0];
  const insights = row.health_insights ?? {};

  return c.json({
    success: true,
    data: {
      analysisId: row.analysis_id,
      foodName: row.predicted_food_name,
      confidence: Number(row.confidence_score),
      nutrition: row.nutrition_snapshot,
      healthBenefits: insights.healthBenefits ?? [],
      warnings: insights.warnings ?? [],
      suggestions: insights.suggestions ?? [],
      explanation: insights.explanation ?? "",
      classification: insights.classification ?? "Moderate",
      imageUrl: row.image_url,
      createdAt: row.created_at,
    },
  });
});

app.get("/api/v1/nutrition-lookup", async (c) => {
  const foodName = c.req.query("food")?.trim();
  if (!foodName)
    return c.json({ success: false, message: "food query is required." }, 400);
  const sql = neon(c.env.DATABASE_URL);
  const rows =
    await sql`select * from nutrition_catalog where lower(food_name) = lower(${foodName}) limit 1`;
  if (!rows[0])
    return c.json(
      { success: false, message: "Nutrition entry was not found." },
      404,
    );
  const row = rows[0];
  return c.json({
    success: true,
    data: {
      foodName: row.food_name,
      servingSize: row.serving_size,
      calories: Number(row.calories),
      protein: Number(row.protein),
      carbohydrates: Number(row.carbohydrates),
      fats: Number(row.fats),
      fiber: Number(row.fiber),
      vitamins: row.vitamins,
      minerals: row.minerals,
    },
  });
});

app.get("/api/v1/health-insights", async (c) => {
  const foodName = c.req.query("food")?.trim();
  if (!foodName)
    return c.json({ success: false, message: "food query is required." }, 400);
  const sql = neon(c.env.DATABASE_URL);
  const rows =
    await sql`select health_benefits, warnings from nutrition_catalog where lower(food_name) = lower(${foodName}) limit 1`;
  if (!rows[0])
    return c.json(
      { success: false, message: "Health insights were not found." },
      404,
    );
  return c.json({
    success: true,
    data: {
      healthBenefits: rows[0].health_benefits,
      warnings: rows[0].warnings,
    },
  });
});

app.get("/api/v1/admin/overview", async (c) => {
  const user = c.get("user");
  if (!isAdmin(user, c.env.ADMIN_EMAILS))
    return c.json(
      { success: false, message: "Administrator access required." },
      403,
    );
  const startedAt = Date.now();
  const sql = neon(c.env.DATABASE_URL);
  const [users, totals, events] = await Promise.all([
    sql`select p.user_id, p.full_name, p.email, p.account_status, p.created_at,
        count(ar.id)::int as scans_count
      from user_profiles p left join analysis_requests ar on ar.user_id = p.user_id
      group by p.user_id order by p.created_at desc`,
    sql`select count(distinct p.user_id)::int as total_users, count(ar.id)::int as total_scans,
        count(distinct p.user_id) filter (where p.last_active_at >= now() - interval '24 hours')::int as active_users
      from user_profiles p left join analysis_requests ar on ar.user_id = p.user_id`,
    sql`select level, message, created_at from system_events order by created_at desc limit 20`,
  ]);
  const total = totals[0];
  return c.json({
    success: true,
    data: {
      currentUserId: user.id,
      users: users.map((row) => ({
        id: row.user_id,
        name: row.full_name,
        email: row.email,
        status: row.account_status,
        role: isAdmin({ email: row.email }, c.env.ADMIN_EMAILS)
          ? "Admin"
          : "User",
        joinedDate: new Date(row.created_at).toISOString(),
        scansCount: Number(row.scans_count),
      })),
      stats: {
        totalUsers: Number(total.total_users),
        totalScans: Number(total.total_scans),
        activeUsers24h: Number(total.active_users),
        averageResponseTime: (Date.now() - startedAt) / 1000,
        systemStatus: "Healthy",
        modelAccuracy: 0,
      },
      logs: events.map(
        (row) =>
          `[${new Date(row.created_at).toISOString()}] [${row.level}] ${row.message}`,
      ),
    },
  });
});

app.put("/api/v1/admin/users/:userId/status", async (c) => {
  const admin = c.get("user");
  if (!isAdmin(admin, c.env.ADMIN_EMAILS))
    return c.json(
      { success: false, message: "Administrator access required." },
      403,
    );
  const targetUserId = c.req.param("userId");
  if (!isUuid(targetUserId)) return validationError(c, "userId must be a UUID.");
  const parsed = await parseAccountStatusBody(c.req.raw);
  if (!parsed.ok) return validationError(c, parsed.message);
  const body = parsed.value;
  if (body.status !== "Active" && body.status !== "Suspended") {
    return c.json(
      { success: false, message: "status must be Active or Suspended." },
      400,
    );
  }
  if (targetUserId === admin.id && body.status === "Suspended") {
    return c.json(
      {
        success: false,
        message: "Administrators cannot suspend their own account.",
      },
      409,
    );
  }
  const sql = neon(c.env.DATABASE_URL);
  const rows =
    await sql`update user_profiles set account_status = ${body.status}
    where user_id = ${targetUserId} returning user_id, full_name, email, account_status, created_at`;
  if (!rows[0])
    return c.json({ success: false, message: "User was not found." }, 404);
  const row = rows[0];
  return c.json({
    success: true,
    data: {
      id: row.user_id,
      name: row.full_name,
      email: row.email,
      status: row.account_status,
      role: isAdmin({ email: row.email }, c.env.ADMIN_EMAILS)
        ? "Admin"
        : "User",
      joinedDate: new Date(row.created_at).toISOString(),
      scansCount: 0,
    },
  });
});

async function getCurrentUser(
  request: Request,
  neonAuthUrl: string,
): Promise<AuthUser | null> {
  if (!neonAuthUrl) {
    throw new Error("Authentication service is not configured.");
  }

  const headers = new Headers();
  const authorization = request.headers.get("Authorization");
  const cookie = request.headers.get("Cookie");

  if (authorization) headers.set("Authorization", authorization);
  if (cookie) headers.set("Cookie", cookie);

  const response = await fetch(
    `${neonAuthUrl.replace(/\/+$/, "")}/get-session`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    session?: { userId?: string };
    user?: { id?: string; email?: string; name?: string };
  };
  const id = payload.user?.id ?? payload.session?.userId;
  const email = payload.user?.email;

  if (!id || !email) {
    return null;
  }

  return { id, email, name: payload.user?.name };
}

async function ensureProfile(databaseUrl: string, user: AuthUser) {
  const sql = neon(databaseUrl);
  await sql`
    insert into user_profiles (user_id, email, full_name)
    values (${user.id}, ${user.email}, ${user.name ?? user.email.split("@")[0]})
    on conflict (user_id) do update
    set email = excluded.email, last_active_at = now()
  `;
}

async function isAccountActive(databaseUrl: string, userId: string) {
  const sql = neon(databaseUrl);
  const rows =
    await sql`select account_status from user_profiles where user_id = ${userId} limit 1`;
  return rows[0]?.account_status === "Active";
}

function stringValue(value: File | string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isUploadedFile(value: File | string | null): value is File {
  return typeof value === "object" && value !== null && "stream" in value;
}

async function validateUploadedImage(image: File, configuredMaxSize?: string) {
  const maxSize = Number(configuredMaxSize || DEFAULT_MAX_IMAGE_UPLOAD_BYTES);
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return "Only JPG, PNG, and WebP food images are supported.";
  }
  if (Number.isFinite(maxSize) && image.size > maxSize) {
    return `Image is too large. Maximum allowed size is ${Math.round(maxSize / 1024 / 1024)} MB.`;
  }
  const signature = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  if (!matchesImageSignature(signature, image.type)) {
    return "The file contents do not match the declared image type.";
  }
  return null;
}

type ModelPrediction = {
  success?: boolean;
  foodName: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fats: number;
    fiber: number;
  };
  healthBenefits?: string[];
  warnings?: string[];
  suggestions?: string[];
  explanation?: string;
  classification: "Healthy" | "Moderate" | "Unhealthy";
  modelName?: string;
  modelVersion?: string;
  topPredictions?: Array<{
    label: string;
    foodName: string;
    confidence: number;
  }>;
  message?: string;
};

function validatePrediction(value: ModelPrediction): string | null {
  if (!value.foodName?.trim()) return "foodName is required";
  if (
    !Number.isFinite(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 1
  )
    return "confidence must be between 0 and 1";
  if (!value.nutrition) return "nutrition is required";
  for (const key of [
    "calories",
    "protein",
    "carbohydrates",
    "fats",
    "fiber",
  ] as const) {
    if (!Number.isFinite(value.nutrition[key]) || value.nutrition[key] < 0)
      return `nutrition.${key} must be a non-negative number`;
  }
  if (!["Healthy", "Moderate", "Unhealthy"].includes(value.classification))
    return "classification is invalid";
  return null;
}

function isAdmin(user: Pick<AuthUser, "email">, configured?: string) {
  const admins = (configured ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };
type ProfileInput = {
  fullName?: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  heightCm?: number;
  weightKg?: number;
  healthConditions?: string[];
  dietaryPreferences?: string[];
};

function validationError(c: { json: (body: object, status: 400) => Response }, message: string) {
  return c.json({ success: false, message }, 400);
}

function isAllowedOrigin(origin: string, configured?: string) {
  if (!origin) return "";
  const allowed = (configured ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

async function enforceAuthRateLimit(c: { env: Env["Bindings"]; req: { raw: Request }; get: (key: "requestId") => string }) {
  const route = c.req.raw ? new URL(c.req.raw.url).pathname : "auth";
  const ip = c.req.raw.headers.get("CF-Connecting-IP") ?? "unknown";
  const ipResult = await c.env.AUTH_RATE_LIMIT.limit({ key: `auth:ip:${ip}:${route}` });
  if (!ipResult.success) return tooManyRequests(c.get("requestId"));

  if (c.req.raw.method !== "POST") return null;
  const body = await c.req.raw.clone().json<{ email?: unknown }>().catch(() => null);
  if (typeof body?.email !== "string" || !body.email.trim()) return null;
  const accountKey = await hashRateLimitKey(body.email.trim().toLowerCase());
  const accountResult = await c.env.AUTH_RATE_LIMIT.limit({ key: `auth:account:${accountKey}:${route}` });
  return accountResult.success ? null : tooManyRequests(c.get("requestId"));
}

async function enforceApiRateLimit(c: { env: Env["Bindings"]; get: (key: "requestId") => string }, userId: string) {
  const result = await c.env.API_RATE_LIMIT.limit({ key: `api:user:${userId}` });
  return result.success ? null : tooManyRequests(c.get("requestId"));
}

function tooManyRequests(requestId: string) {
  return new Response(JSON.stringify({ success: false, message: "Too many requests. Try again later.", requestId }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "60", "RateLimit-Limit": "10", "RateLimit-Remaining": "0", "RateLimit-Reset": "60" },
  });
}

async function hashRateLimitKey(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function parseJsonObject(request: Request): Promise<ParseResult<Record<string, unknown>>> {
  const body = await request.json<unknown>().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, message: "Request body must be a JSON object." };
  return { ok: true, value: body as Record<string, unknown> };
}

async function parseProfileBody(request: Request): Promise<ParseResult<ProfileInput>> {
  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed;
  const allowed = new Set(["fullName", "age", "gender", "heightCm", "weightKg", "healthConditions", "dietaryPreferences"]);
  if (Object.keys(parsed.value).some((key) => !allowed.has(key))) return { ok: false, message: "Request contains an unsupported field." };
  const value = parsed.value;
  if (Object.keys(value).length === 0) return { ok: false, message: "Request body must not be empty." };
  if (value.fullName !== undefined && (typeof value.fullName !== "string" || value.fullName.trim().length < 1 || value.fullName.trim().length > 100)) return { ok: false, message: "fullName must be between 1 and 100 characters." };
  if (value.age !== undefined && (!isNumberInRange(value.age, 1, 120))) return { ok: false, message: "age must be a number between 1 and 120." };
  if (value.gender !== undefined && value.gender !== "Male" && value.gender !== "Female" && value.gender !== "Other") return { ok: false, message: "gender is invalid." };
  if (value.heightCm !== undefined && (!isNumberInRange(value.heightCm, 30, 300))) return { ok: false, message: "heightCm must be a number between 30 and 300." };
  if (value.weightKg !== undefined && (!isNumberInRange(value.weightKg, 2, 500))) return { ok: false, message: "weightKg must be a number between 2 and 500." };
  for (const field of ["healthConditions", "dietaryPreferences"] as const) {
    if (value[field] !== undefined && !isStringArray(value[field], 20, 100)) return { ok: false, message: `${field} must contain at most 20 strings of 100 characters or fewer.` };
  }
  return { ok: true, value: value as ProfileInput };
}

async function parseImageIdBody(request: Request): Promise<ParseResult<{ imageId: string }>> {
  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed;
  if (Object.keys(parsed.value).length !== 1 || !isUuid(parsed.value.imageId)) return { ok: false, message: "imageId must be a UUID." };
  return { ok: true, value: { imageId: parsed.value.imageId } };
}

async function parseAccountStatusBody(request: Request): Promise<ParseResult<{ status: "Active" | "Suspended" }>> {
  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return parsed;
  if (Object.keys(parsed.value).length !== 1 || (parsed.value.status !== "Active" && parsed.value.status !== "Suspended")) return { ok: false, message: "status must be Active or Suspended." };
  return { ok: true, value: { status: parsed.value.status } };
}

function validateImageForm(form: FormData) {
  const allowed = new Set(["image", "mealType", "notes"]);
  for (const [key, value] of form.entries()) {
    if (!allowed.has(key)) return "Upload contains an unsupported field.";
    if (key === "mealType" && (typeof value !== "string" || value.length > 40)) return "mealType must be at most 40 characters.";
    if (key === "notes" && (typeof value !== "string" || value.length > 2_000)) return "notes must be at most 2000 characters.";
  }
  return null;
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isStringArray(value: unknown, maxItems: number, maxLength: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= maxLength);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function matchesImageSignature(signature: Uint8Array, type: string) {
  if (type === "image/jpeg") return signature.length >= 3 && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  if (type === "image/png") return signature.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => signature[index] === byte);
  return signature.length >= 12 && String.fromCharCode(...signature.slice(0, 4)) === "RIFF" && String.fromCharCode(...signature.slice(8, 12)) === "WEBP";
}

export default app;
