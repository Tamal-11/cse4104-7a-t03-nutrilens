import { corsHeaders } from "./cors.ts";

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(corsHeaders);

  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function methodNotAllowed(allowed: string[]) {
  return json(
    { error: "Method not allowed" },
    {
      status: 405,
      headers: {
        Allow: allowed.join(", "),
      },
    },
  );
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function getBearerToken(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}
