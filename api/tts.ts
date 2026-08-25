                                                                              
                                                                                            
                                                                                         
  
                                                                                                  
                                                                                             
                                                                                  
  
                                                                  

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([
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
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-abil-admin",
    "Vary": "Origin",
  };
}

const ALLOWED_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "ash", "sage"]);
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function adminOk(req: Request): Promise<boolean> {
  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const pw = env.ABIL_ADMIN_AUTH_SECRET || "";
  const tok = req.headers.get("x-abil-admin") || "";
  if (!pw || !tok || !tok.includes(".")) return false;
  const i = tok.indexOf(".");
  const exp = Number(tok.slice(0, i));
  const sig = tok.slice(i + 1);
  if (!exp || exp <= Date.now()) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(exp))));
  const want = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return safeEqual(sig, want);
}

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });
  if (!(await adminOk(req))) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } });

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }

  const text = String(body?.text || "").slice(0, 4000).trim();                                  
  if (!text) return new Response(JSON.stringify({ error: "text is required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const voice = ALLOWED_VOICES.has(String(body?.voice || "")) ? String(body.voice) : "nova";
  const model = body?.model === "tts-1-hd" || body?.model === "gpt-4o-mini-tts" ? body.model : "tts-1";
                                                                                                                                  
  const speed = Math.min(1.5, Math.max(0.7, Number(body?.speed) || 1));
  const instructions = String(body?.instructions || "").slice(0, 600);

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const apiKey = env.OPENAI_API_KEY || undefined;
  if (!apiKey) return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 25000);
    const CLASSIC = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    const callTTS = (m: string, v: string, withInstr: boolean) => fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: m, voice: v, input: text, response_format: "mp3", ...(speed !== 1 ? { speed } : {}), ...(withInstr && instructions ? { instructions } : {}) }),
    });
    let r = await callTTS(model, voice, model === "gpt-4o-mini-tts");
                                                                                                                                                                      
    if (!r.ok && (model === "gpt-4o-mini-tts" || !CLASSIC.includes(voice))) {
      r = await callTTS("tts-1", CLASSIC.includes(voice) ? voice : "onyx", false);
    }
    clearTimeout(tid);
    if (!r.ok) {
      const err = await r.text().catch(() => "");
      return new Response(JSON.stringify({ error: `OpenAI TTS ${r.status}: ${err.slice(0, 200)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
                                                                  
    return new Response(r.body, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", ...CORS } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
