// Tiny shared helpers for the /api/v1 surface.

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers ?? {}),
    },
  });
}

export function jsonError(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}
