// lib/http.ts
const API_BASE = process.env.NEXT_PUBLIC_SMS_API!;
const API_KEY = process.env.NEXT_PUBLIC_SMS_API_KEY!;

const TIMEOUT_MS = 15000;

async function parseError(res: Response): Promise<string> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j: any = await res.json();
      if (typeof j?.detail === "string") return j.detail;
      if (Array.isArray(j?.detail) && j.detail[0]?.msg) return j.detail[0].msg;
      if (typeof j?.error?.message === "string") return j.error.message;
      return JSON.stringify(j);
    }
    const t = await res.text();
    return t || "";
  } catch {
    return "";
  }
}

function buildHeaders(initHeaders?: HeadersInit): Headers {
  const h = new Headers(initHeaders);
  h.set("X-API-Key", API_KEY);
  h.set("Content-Type", "application/json");
  return h;
}

async function request(method: string, path: string, body?: any, init: RequestInit = {}) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_SMS_API is not set");
  if (!API_KEY) throw new Error("NEXT_PUBLIC_SMS_API_KEY is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      ...init,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: buildHeaders(init.headers),
      cache: "no-store",
      signal: controller.signal,
      credentials: "include", // ✅ IMPORTANT: send/receive session cookies
    });

    if (!res.ok) {
      const msg = await parseError(res);
      throw new Error(msg || `${method} ${path} failed (${res.status})`);
    }

    try {
      return await res.json();
    } catch {
      return null;
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`Request timeout (${TIMEOUT_MS / 1000}s): ${method} ${path}`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get(path: string, init: RequestInit = {}) {
    return request("GET", path, undefined, init);
  },
  post(path: string, body: any, init: RequestInit = {}) {
    return request("POST", path, body, init);
  },
  patch(path: string, body: any, init: RequestInit = {}) {
    return request("PATCH", path, body, init);
  },
  delete(path: string, init: RequestInit = {}) {
    return request("DELETE", path, undefined, init);
  },
};
