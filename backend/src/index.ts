import { neon } from "@neondatabase/serverless";
import { Hono } from "hono";
import { cors } from "hono/cors";

type Env = {
  Bindings: {
    DATABASE_URL: string;
    NEON_AUTH_URL: string;
    FOOD_IMAGES: R2Bucket;
    R2_PUBLIC_BASE_URL?: string;
  };
  Variables: {
    user: AuthUser;
  };
};

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/", (c) =>
  c.json({
    name: "NutriLens API",
    basePath: "/api/v1",
    auth: "Use Neon Auth /api/auth routes, then call Worker app routes with the active session.",
  }),
);

app.use("/api/v1/*", async (c, next) => {
  const user = await getCurrentUser(c.req.raw, c.env.NEON_AUTH_URL);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  c.set("user", user);
  await ensureProfile(c.env.DATABASE_URL, user);
  await next();
});

app.put("/api/v1/profile", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    fullName?: string;
    age?: number;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
  }>();
  const fullName = body.fullName?.trim() || user.name || user.email.split("@")[0];
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
    )
    values (
      ${user.id},
      ${user.email},
      ${fullName},
      ${body.age ?? null},
      ${body.gender ?? null},
      ${body.heightCm ?? null},
      ${body.weightKg ?? null}
    )
    on conflict (user_id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      age = excluded.age,
      gender = excluded.gender,
      height_cm = excluded.height_cm,
      weight_kg = excluded.weight_kg
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
    : null;
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

app.post("/api/v1/analyze-food", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ imageId?: string }>();

  if (!body.imageId) {
    return c.json({ success: false, message: "imageId is required." }, 400);
  }

  const sql = neon(c.env.DATABASE_URL);
  const imageRows = await sql`
    select id
    from food_images
    where id = ${body.imageId}
      and user_id = ${user.id}
    limit 1
  `;

  if (imageRows.length === 0) {
    return c.json({ success: false, message: "Food image was not found." }, 404);
  }

  const catalogRows = await sql`
    select *
    from nutrition_catalog
    where food_name = 'Apple'
    limit 1
  `;
  const catalog = catalogRows[0] ?? mockCatalog();
  const analysisId = crypto.randomUUID();
  const resultId = crypto.randomUUID();
  const nutrition = {
    calories: Number(catalog.calories),
    protein: Number(catalog.protein),
    carbohydrates: Number(catalog.carbohydrates),
    fats: Number(catalog.fats),
    fiber: Number(catalog.fiber),
    vitamins: catalog.vitamins,
    minerals: catalog.minerals,
  };
  const healthInsights = {
    healthBenefits: catalog.health_benefits,
    warnings: catalog.warnings,
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
      ${catalog.id ?? null},
      ${catalog.food_name},
      ${0.94},
      ${JSON.stringify(nutrition)},
      ${JSON.stringify(healthInsights)},
      'mock-nutrilens',
      '0.1.0',
      true
    )
  `;

  return c.json({
    success: true,
    message: "Mock analysis completed.",
    data: {
      analysisId,
      foodName: catalog.food_name,
      confidence: 0.94,
      servingSize: catalog.serving_size,
      nutrition,
      healthBenefits: healthInsights.healthBenefits,
      warnings: healthInsights.warnings,
      isMock: true,
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
      res.created_at,
      res.is_mock
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
      isMock: row.is_mock,
    })),
  });
});

app.get("/api/v1/analysis-history/:analysisId", async (c) => {
  const user = c.get("user");
  const analysisId = c.req.param("analysisId");
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`
    select
      ar.id as analysis_id,
      res.predicted_food_name,
      res.confidence_score,
      res.nutrition_snapshot,
      res.health_insights,
      res.created_at,
      res.is_mock
    from analysis_requests ar
    join analysis_results res on res.request_id = ar.id
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
      createdAt: row.created_at,
      isMock: row.is_mock,
    },
  });
});

app.get("/api/v1/nutrition-lookup", (c) => {
  const foodName = c.req.query("food") || "Apple";

  return c.json({
    success: true,
    data: {
      foodName,
      servingSize: "100 g",
      calories: 52,
      protein: 0.3,
      carbohydrates: 14,
      fats: 0.2,
      vitamins: ["Vitamin C"],
      minerals: ["Potassium"],
    },
  });
});

app.get("/api/v1/health-insights", (c) =>
  c.json({
    success: true,
    data: {
      healthBenefits: [
        "May provide useful nutrients depending on food type",
        "Can support a balanced diet when consumed in proper amount",
      ],
      warnings: [
        "Excessive consumption may cause health problems",
        "People with medical conditions should check with a professional",
      ],
    },
  }),
);

async function getCurrentUser(request: Request, neonAuthUrl: string): Promise<AuthUser | null> {
  if (!neonAuthUrl) {
    throw new Error("NEON_AUTH_URL is not configured.");
  }

  const headers = new Headers();
  const authorization = request.headers.get("Authorization");
  const cookie = request.headers.get("Cookie");

  if (authorization) headers.set("Authorization", authorization);
  if (cookie) headers.set("Cookie", cookie);

  const response = await fetch(`${neonAuthUrl.replace(/\/$/, "")}/api/auth/get-session`, {
    method: "GET",
    headers,
  });

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
    set email = excluded.email
  `;
}

function stringValue(value: File | string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isUploadedFile(value: File | string | null): value is File {
  return typeof value === "object" && value !== null && "stream" in value;
}

function mockCatalog() {
  return {
    id: null,
    food_name: "Apple",
    serving_size: "100 g",
    calories: 52,
    protein: 0.3,
    carbohydrates: 14,
    fats: 0.2,
    fiber: 2.4,
    vitamins: ["Vitamin C", "Vitamin K"],
    minerals: ["Potassium"],
    health_benefits: [
      "Supports digestion because it contains fiber",
      "Provides antioxidants",
    ],
    warnings: [
      "Excess consumption may cause bloating",
      "People with blood sugar problems should control portion size",
    ],
  };
}

export default app;
