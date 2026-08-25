import ttsHandler from "./tts.js";

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([
  "https://abil.ch",
  "https://abil-site.vercel.app",
  "https://www.abil.ch",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5180",
  "http://localhost:5182",
]);

const VERCEL_AUTO_DEPLOY_RE = /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/;

function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && (ALLOWED_ORIGINS.has(origin) || VERCEL_AUTO_DEPLOY_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

type Bucket = { count: number; reset: number };

function rateLimit(req: Request): boolean {
  const root = globalThis as any;
  const buckets: Map<string, Bucket> = root.__publicTtsBuckets || new Map<string, Bucket>();
  root.__publicTtsBuckets = buckets;
  const now = Date.now();
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
  const key = `tts:${ip}`;
  const current = buckets.get(key);
  if (!current || current.reset <= now) {
    buckets.set(key, { count: 1, reset: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

async function signAdminToken(password: string): Promise<string> {
  const exp = Date.now() + 60_000;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(exp))));
  const sig = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${exp}.${sig}`;
}

const ALLOWED_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });
  if (!rateLimit(req)) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { "Content-Type": "application/json", ...CORS } });

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }
  const text = String(body?.text || "").trim();
  if (!text) return new Response(JSON.stringify({ error: "text required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const password = env.ABIL_ADMIN_AUTH_SECRET || "";
  if (!password) return new Response(JSON.stringify({ error: "public tts not configured" }), { status: 503, headers: { "Content-Type": "application/json", ...CORS } });

  const voice = ALLOWED_VOICES.has(String(body?.voice || "")) ? String(body.voice) : "nova";
  const speed = Math.min(1.2, Math.max(0.85, Number(body?.speed) || 1));
  const payload = { text: text.slice(0, 700), voice, model: "tts-1", speed };
  const url = new URL(req.url);
  url.pathname = "/api/tts";
  const headers = new Headers({ "Content-Type": "application/json", "x-abil-admin": await signAdminToken(password) });
  const origin = req.headers.get("origin");
  if (origin) headers.set("origin", origin);
  const internalReq = new Request(url.toString(), { method: "POST", headers, body: JSON.stringify(payload) });
  const upstream = await ttsHandler(internalReq);
  const outHeaders = new Headers(upstream.headers);
  Object.entries(CORS).forEach(([key, value]) => outHeaders.set(key, value));
  return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
}
