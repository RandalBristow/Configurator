const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
const API_KEY = import.meta.env.VITE_API_KEY;

type Options = RequestInit & { query?: Record<string, string | number | boolean | undefined> };

function buildUrl(path: string, query?: Options["query"]) {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function request<T>(path: string, options: Options = {}) {
  const url = buildUrl(path, options.query);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    ...(options.headers ?? {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    let details: unknown;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { message?: string; details?: unknown };
        if (parsed?.message) message = parsed.message;
        if (parsed?.details) details = parsed.details;
      } catch {
        // ignore parse errors
      }
    }
    if (details) {
      console.error("API error details", details);
    }
    if (details) {
      throw new Error(`${message || `Request failed: ${res.status}`}: ${JSON.stringify(details)}`);
    }
    throw new Error(message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Options["query"]) => request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
