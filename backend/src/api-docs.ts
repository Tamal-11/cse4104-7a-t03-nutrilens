export type EndpointDoc = {
  method: string;
  path: string;
  summary: string;
  authentication: "none" | "session required";
  headers: Record<string, string>;
  pathParameters?: Record<string, string>;
  queryParameters?: Record<string, string>;
  payload: unknown;
  responses: Record<string, unknown>;
};

export const endpointDocs: EndpointDoc[] = [
  {
    method: "GET",
    path: "/",
    summary: "API identity and entry-point information.",
    authentication: "none",
    headers: {},
    payload: null,
    responses: { "200": { name: "NutriLens API", basePath: "/api/v1" } },
  },
  {
    method: "GET",
    path: "/health",
    summary: "Check server and database availability.",
    authentication: "none",
    headers: {},
    payload: null,
    responses: {
      "200": { status: "healthy", server: { status: "up" }, database: { status: "up" } },
      "503": { status: "degraded", server: { status: "up" }, database: { status: "down" } },
    },
  },
  {
    method: "GET",
    path: "/help",
    summary: "List all available API endpoints.",
    authentication: "none",
    headers: {},
    payload: null,
    responses: { "200": { success: true, endpoints: ["..."] } },
  },
  {
    method: "GET",
    path: "/help/{endpointPath}",
    summary: "Show detailed documentation for an endpoint path.",
    authentication: "none",
    headers: {},
    pathParameters: {
      endpointPath: "Endpoint path without the leading slash, for example api/v1/profile.",
    },
    queryParameters: { method: "Optional HTTP method used to disambiguate a path." },
    payload: null,
    responses: {
      "200": { success: true, data: { method: "POST", path: "/api/v1/profile" } },
      "404": { success: false, message: "No endpoint documentation was found." },
    },
  },
  {
    method: "POST",
    path: "/api/auth/sign-up",
    summary: "Create a user account and start a session.",
    authentication: "none",
    headers: {
      "Content-Type": "application/json",
      Origin: "Optional; defaults to the current API origin when omitted.",
    },
    payload: {
      name: "string (required)",
      email: "valid email address (required)",
      password: "string (required)",
    },
    responses: {
      "200": {
        token: "session token, when returned",
        user: { id: "uuid", email: "user@example.com", name: "User Name" },
      },
      "400": { message: "Invalid registration information." },
    },
  },
  {
    method: "POST",
    path: "/api/auth/sign-in",
    summary: "Sign in with email and password and start a session.",
    authentication: "none",
    headers: {
      "Content-Type": "application/json",
      Origin: "Optional; defaults to the current API origin when omitted.",
    },
    payload: {
      email: "valid email address (required)",
      password: "string (required)",
    },
    responses: {
      "200": {
        token: "session token, when returned",
        user: { id: "uuid", email: "user@example.com", name: "User Name" },
      },
      "400": { message: "Invalid sign-in information." },
      "401": { message: "Invalid email or password." },
    },
  },
  {
    method: "GET",
    path: "/api/auth/session",
    summary: "Get the current signed-in user and session.",
    authentication: "session required",
    headers: { Cookie: "Session cookie returned after sign-in." },
    payload: null,
    responses: {
      "200": {
        session: { userId: "uuid" },
        user: { id: "uuid", email: "user@example.com", name: "User Name" },
      },
      "401": { message: "No active session." },
    },
  },
  {
    method: "POST",
    path: "/api/auth/sign-out",
    summary: "End the current user session.",
    authentication: "session required",
    headers: {
      "Content-Type": "application/json",
      Cookie: "Session cookie returned after sign-in.",
    },
    payload: {},
    responses: {
      "200": { success: true },
      "401": { message: "No active session." },
    },
  },
  {
    method: "GET",
    path: "/api/v1/profile",
    summary: "Get the authenticated user's profile.",
    authentication: "session required",
    headers: { Cookie: "Authentication session cookie." },
    payload: null,
    responses: {
      "200": {
        success: true,
        data: {
          userId: "uuid",
          email: "user@example.com",
          fullName: "User Name",
          age: 25,
          gender: "string | null",
          heightCm: 170,
          weightKg: 65,
          createdAt: "ISO date-time",
          updatedAt: "ISO date-time",
        },
      },
      "401": { success: false, message: "Authentication required." },
      "404": { success: false, message: "Profile was not found." },
    },
  },
  {
    method: "POST",
    path: "/api/v1/profile",
    summary: "Create or update the authenticated user's profile.",
    authentication: "session required",
    headers: { "Content-Type": "application/json", Cookie: "Authentication session cookie." },
    payload: {
      fullName: "string (optional)",
      age: "number (optional)",
      gender: "string (optional)",
      heightCm: "number (optional)",
      weightKg: "number (optional)",
    },
    responses: {
      "200": { success: true, message: "Profile updated successfully." },
      "401": { success: false, message: "Authentication required." },
    },
  },
  {
    method: "POST",
    path: "/api/v1/upload-food-image",
    summary: "Upload a food image to R2 and store its metadata.",
    authentication: "session required",
    headers: { "Content-Type": "multipart/form-data", Cookie: "Authentication session cookie." },
    payload: {
      image: "File (required)",
      mealType: "string form field (optional)",
      notes: "string form field (optional)",
    },
    responses: {
      "200": {
        success: true,
        message: "Image uploaded successfully.",
        data: { imageId: "uuid", objectKey: "string", imageUrl: "string | null" },
      },
      "400": { success: false, message: "Image file is required." },
      "401": { success: false, message: "Authentication required." },
    },
  },
  {
    method: "POST",
    path: "/api/v1/analyze-food",
    summary: "Analyze an uploaded food image using the configured model service.",
    authentication: "session required",
    headers: { "Content-Type": "application/json", Cookie: "Authentication session cookie." },
    payload: { imageId: "uuid (required)" },
    responses: {
      "200": { success: true, message: "Analysis completed.", data: "Analysis result." },
      "400": { success: false, message: "imageId is required." },
      "401": { success: false, message: "Authentication required." },
      "404": { success: false, message: "Food image was not found." },
    },
  },
  {
    method: "GET",
    path: "/api/v1/analysis-history",
    summary: "List the authenticated user's food analyses.",
    authentication: "session required",
    headers: { Cookie: "Authentication session cookie." },
    payload: null,
    responses: {
      "200": { success: true, data: ["Analysis summary objects."] },
      "401": { success: false, message: "Authentication required." },
    },
  },
  {
    method: "GET",
    path: "/api/v1/analysis-history/:analysisId",
    summary: "Get one analysis owned by the authenticated user.",
    authentication: "session required",
    headers: { Cookie: "Authentication session cookie." },
    pathParameters: { analysisId: "Analysis UUID." },
    payload: null,
    responses: {
      "200": { success: true, data: "Detailed analysis object." },
      "401": { success: false, message: "Authentication required." },
      "404": { success: false, message: "Analysis was not found." },
    },
  },
  {
    method: "GET",
    path: "/api/v1/nutrition-lookup",
    summary: "Return stored nutrition information for a food name.",
    authentication: "session required",
    headers: { Cookie: "Authentication session cookie." },
    queryParameters: { food: "Food name (required)." },
    payload: null,
    responses: {
      "200": { success: true, data: "Nutrition information." },
      "401": { success: false, message: "Authentication required." },
    },
  },
  {
    method: "GET",
    path: "/api/v1/health-insights",
    summary: "Return stored health benefits and warnings for a food name.",
    authentication: "session required",
    headers: { Cookie: "Authentication session cookie." },
    payload: null,
    responses: {
      "200": { success: true, data: { healthBenefits: ["string"], warnings: ["string"] } },
      "401": { success: false, message: "Authentication required." },
    },
  },
];

export function findEndpointDocs(path: string, method?: string) {
  const normalizedPath = `/${path.replace(/^\/+|\/+$/g, "")}`;
  const normalizedMethod = method?.toUpperCase();

  return endpointDocs.filter((endpoint) => {
    if (normalizedMethod && endpoint.method !== normalizedMethod && endpoint.method !== "ALL") {
      return false;
    }

    const pattern = endpoint.path
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\\*/g, ".*")
      .replace(/:[^/]+/g, "[^/]+")
      .replace(/\\\{[^/]+\\\}/g, ".+");

    return new RegExp(`^${pattern}$`).test(normalizedPath);
  });
}
