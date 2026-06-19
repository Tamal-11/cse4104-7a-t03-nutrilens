import { json } from "./http.ts";

type EndpointMethod = "GET" | "POST";

type EndpointDoc = {
  key: string;
  method: EndpointMethod;
  path: string;
  summary: string;
  authRequired: boolean;
  headers: string[];
  requestBody: Record<string, unknown> | null;
  queryParams?: Record<string, string>;
  responseBody: Record<string, unknown>;
};

const endpointDocs: EndpointDoc[] = [
  {
    key: "auth-register",
    method: "POST",
    path: "/functions/v1/auth-register",
    summary: "Make new user account.",
    authRequired: false,
    headers: ["Content-Type: application/json"],
    requestBody: {
      email: "saiful@example.com",
      password: "StrongPass123!",
      fullName: "Saiful Islam",
      age: 23,
      gender: "male",
      heightCm: 170,
      weightKg: 68,
    },
    responseBody: {
      message: "Account created",
      user: {
        id: "uuid",
        email: "saiful@example.com",
        fullName: "Saiful Islam",
      },
      session: {
        accessToken: "jwt-access-token",
        refreshToken: "jwt-refresh-token",
        expiresAt: 1760000000,
        tokenType: "bearer",
      },
    },
  },
  {
    key: "auth-login",
    method: "POST",
    path: "/functions/v1/auth-login",
    summary: "Login user and give token.",
    authRequired: false,
    headers: ["Content-Type: application/json"],
    requestBody: {
      email: "saiful@example.com",
      password: "StrongPass123!",
    },
    responseBody: {
      message: "Login successful",
      user: {
        id: "uuid",
        email: "saiful@example.com",
        fullName: "Saiful Islam",
      },
      session: {
        accessToken: "jwt-access-token",
        refreshToken: "jwt-refresh-token",
        expiresAt: 1760000000,
        tokenType: "bearer",
      },
    },
  },
  {
    key: "auth-logout",
    method: "POST",
    path: "/functions/v1/auth-logout",
    summary: "Logout user and kill tokens.",
    authRequired: true,
    headers: [
      "Authorization: Bearer <token>",
      "Content-Type: application/json",
    ],
    requestBody: {},
    responseBody: {
      message: "Logout successful",
      note: "Refresh tokens were revoked. Frontend should also clear the local access token.",
    },
  },
  {
    key: "auth-me",
    method: "GET",
    path: "/functions/v1/auth-me",
    summary: "Get logged in user and profile.",
    authRequired: true,
    headers: ["Authorization: Bearer <token>"],
    requestBody: null,
    responseBody: {
      user: {
        id: "uuid",
        email: "saiful@example.com",
        emailConfirmedAt: "2026-06-18T20:00:00.000Z",
      },
      profile: {
        id: "uuid",
        fullName: "Saiful Islam",
        email: "saiful@example.com",
        age: 23,
        gender: "male",
        heightCm: 170,
        weightKg: 68,
        createdAt: "2026-06-18T20:00:00.000Z",
        updatedAt: "2026-06-18T20:00:00.000Z",
      },
    },
  },
  {
    key: "analyze-food",
    method: "POST",
    path: "/functions/v1/analyze-food",
    summary: "Analyze one food image and return mock nutrition.",
    authRequired: false,
    headers: ["Content-Type: application/json"],
    requestBody: {
      imageUrl: "https://example.com/food.jpg",
    },
    responseBody: {
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
    },
  },
  {
    key: "health-insights",
    method: "GET",
    path: "/functions/v1/health-insights",
    summary: "Get generic health note list.",
    authRequired: false,
    headers: [],
    requestBody: null,
    responseBody: {
      health_benefits: [
        "May provide useful nutrients depending on food type",
        "Can support a balanced diet when consumed in proper amount",
      ],
      possible_side_effects: [
        "Excessive consumption may cause health problems",
        "People with medical conditions should check with a professional",
      ],
    },
  },
  {
    key: "nutrition-lookup",
    method: "GET",
    path: "/functions/v1/nutrition-lookup",
    summary: "Get mock nutrition by food name.",
    authRequired: false,
    headers: [],
    requestBody: null,
    queryParams: {
      food: "apple",
    },
    responseBody: {
      food_name: "apple",
      serving_size: "100g",
      calories: "52 kcal",
      protein: "0.3 g",
      carbohydrates: "14 g",
      fats: "0.2 g",
      vitamins: ["Vitamin C"],
      minerals: ["Potassium"],
    },
  },
];

const docsByKey = new Map(endpointDocs.map((doc) => [doc.key, doc]));

export function listEndpointDocs() {
  return endpointDocs.map((doc) => ({
    method: doc.method,
    path: doc.path,
  }));
}

export function isHelpPath(req: Request) {
  const pathname = new URL(req.url).pathname.replace(/\/+$/, "");
  return pathname.endsWith("/help");
}

export function getEndpointHelpByKey(key: string) {
  const doc = docsByKey.get(key);

  if (!doc) {
    return json(
      {
        error: "Help not found",
      },
      { status: 404 },
    );
  }

  return json({
    endpoint: doc.path,
    method: doc.method,
    summary: doc.summary,
    authRequired: doc.authRequired,
    headers: doc.headers,
    queryParams: doc.queryParams ?? null,
    requestBody: doc.requestBody,
    responseBody: doc.responseBody,
  });
}
