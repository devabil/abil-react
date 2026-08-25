import agentCouncilHandler from "./agent-council.js";

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

function rateLimit(req: Request, keyPrefix: string, limit: number, windowMs: number): boolean {
  const storeKey = "__publicAgentBuckets";
  const root = globalThis as any;
  const buckets: Map<string, Bucket> = root[storeKey] || new Map<string, Bucket>();
  root[storeKey] = buckets;
  const now = Date.now();
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
  const key = `${keyPrefix}:${ip}`;
  const current = buckets.get(key);
  if (!current || current.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

                                                                                   
                                                                                       
                                                                                     
                                                                                           
function disjuntorGlobal(limitePorJanela: number, windowMs: number): boolean {
  const root = globalThis as any;
  const st = root.__pa_global || { count: 0, reset: 0 };
  const now = Date.now();
  if (st.reset <= now) { st.count = 0; st.reset = now + windowMs; }
  st.count += 1;
  root.__pa_global = st;
  return st.count <= limitePorJanela;
}

async function signAdminToken(password: string): Promise<string> {
  const exp = Date.now() + 60_000;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(exp))));
  const sig = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${exp}.${sig}`;
}

                                                                                                       
                                                                                                         
                                                                                                           
                                                                                                         
                                                                                                           
                                                                                                          
const SITE_BASE = "https://abil.ch";
const VAULT_TTL_MS = 60_000;
const KNOWLEDGE_MAX_FILES = 4;
const KNOWLEDGE_MAX_CHARS = 2000;

                                                                                             
                                                                                      
const DEFAULT_PERSONA = {
  brandPersona: {
    title: "ABiL, Voix de marque",
    tonality: "Calme, précis, confiant. Jamais agressif. Jamais ironique gratuit.",
    avoid: "Buzzwords, ALL CAPS, ponctuation excessive, urgence factice.",
    keywords: "Atelier · Précision · Discipline · Échelle · Sénior",
    prompt: "Atelier créatif indépendant à Genève, équipe senior. Ton calme, précis, confiant. Phrases courtes; éviter superlatifs. Vocabulaire éditorial, pas publicitaire. Signer collectivement (« nous »), jamais « je ».",
  },
  buyerPersona: {
    title: "Décideur marketing PME romande",
    tonality: "Recherche le sérieux et la singularité. Méfiant du jargon publicitaire.",
    avoid: "Promesses creuses, ROI sur-vendu, langage corporate générique.",
    keywords: "Confiance · Pertinence · Mesurable · Long-terme · Discret",
    prompt: "Décideur 35-55 ans, PME B2B/B2C romande. Refuse le bullshit corporate, cherche un partenaire long-terme.",
  },
  safeguards: "Never commit to a price, a deadline, or to accepting a project. Inform and propose, never decide or promise on the atelier's behalf.",
};

type ServerCtx = { persona: Record<string, unknown>; extraInstructions: string; at: number };

async function readVaultCol(base: string, token: string, col: string): Promise<unknown> {
  try {
    const r = await fetch(`${base}/api/private-store?col=${encodeURIComponent(col)}&cb=${Date.now()}`, {
      headers: { "x-abil-admin": token },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json().catch(() => null)) as { value?: unknown } | null;
    return j && "value" in j ? j.value : null;
  } catch {
    return null;
  }
}

                                                                                                           
                                                                                                     
function personaFromSnapshot(snap: unknown): Record<string, unknown> {
  if (!snap || typeof snap !== "object" || Array.isArray(snap)) return { ...DEFAULT_PERSONA };
  const s = snap as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (s.brandPersona && typeof s.brandPersona === "object") out.brandPersona = s.brandPersona;
  if (s.buyerPersona && typeof s.buyerPersona === "object") out.buyerPersona = s.buyerPersona;
  if (Array.isArray(s.knowledge) && s.knowledge.length) {
    out.knowledge = s.knowledge.slice(0, KNOWLEDGE_MAX_FILES).map((k) => String(k || "").slice(0, KNOWLEDGE_MAX_CHARS));
  }
  if (typeof s.safeguards === "string" && s.safeguards.trim()) out.safeguards = s.safeguards.trim().slice(0, 600);
                                                                                                                             
  if (typeof s.referenceNotes === "string" && s.referenceNotes.trim()) out.referenceNotes = s.referenceNotes.trim().slice(0, 2500);
  if (typeof s.globalTextPrompt === "string" && s.globalTextPrompt.trim()) out.globalTextPrompt = s.globalTextPrompt.trim().slice(0, 900);
  if (!out.brandPersona) out.brandPersona = DEFAULT_PERSONA.brandPersona;
  if (!out.buyerPersona) out.buyerPersona = DEFAULT_PERSONA.buyerPersona;
  if (!out.safeguards) out.safeguards = DEFAULT_PERSONA.safeguards;
  return out;
}

                                                                                                       
                                                                                                       
                                                                                                
function vaultBases(req: Request, env: Record<string, string | undefined>): string[] {
  const out: string[] = [];
  const push = (b?: string) => { const v = String(b || "").trim().replace(/\/$/, ""); if (v && !out.includes(v)) out.push(v); };
  if (env.VERCEL_URL) push(`https://${env.VERCEL_URL}`);
  push(env.PUBLIC_BASE_URL);
  push(env.ABIL_PUBLIC_BASE);
  try { push(new URL(req.url).origin); } catch {                                                      }
  push(SITE_BASE);
  return out;
}

async function serverContext(bases: string[], token: string): Promise<ServerCtx> {
  const root = globalThis as unknown as Record<string, unknown>;
  const cached = root.__publicAgentCtx as ServerCtx | undefined;
  if (cached && Date.now() - cached.at < VAULT_TTL_MS) return cached;
  let snap: unknown = null;
  let rules: unknown = null;
  for (const base of bases) {
    [snap, rules] = await Promise.all([
      readVaultCol(base, token, "agent_persona_snapshot"),
      readVaultCol(base, token, "ai_agent_rules"),
    ]);
    if (snap != null || rules != null) break;                                                          
  }
  const clientRules = (rules && typeof rules === "object" && !Array.isArray(rules))
    ? String((rules as Record<string, unknown>).client || "").trim().slice(0, 2000)
    : "";
  const ctx: ServerCtx = { persona: personaFromSnapshot(snap), extraInstructions: clientRules, at: Date.now() };
  root.__publicAgentCtx = ctx;
  return ctx;
}

const LANGS = new Set(["pt", "fr", "en", "de", "it"]);
const BRANDS = new Set(["abil"]);

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });
  if (!disjuntorGlobal(240, 60 * 60_000)) return new Response(JSON.stringify({ error: "busy" }), { status: 429, headers: { "Content-Type": "application/json", ...CORS } });
  if (!rateLimit(req, "chat", 18, 10 * 60_000)) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { "Content-Type": "application/json", ...CORS } });

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }

  const message = String(body?.message || "").trim();
  if (!message) return new Response(JSON.stringify({ error: "message required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  if (message.length > 1200) return new Response(JSON.stringify({ error: "message too long" }), { status: 413, headers: { "Content-Type": "application/json", ...CORS } });

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const password = env.ABIL_ADMIN_AUTH_SECRET || "";
  if (!password) return new Response(JSON.stringify({ error: "public agent not configured" }), { status: 503, headers: { "Content-Type": "application/json", ...CORS } });

  const lang = LANGS.has(String(body?.lang || "").toLowerCase().slice(0, 2)) ? String(body.lang).toLowerCase().slice(0, 2) : "pt";
  const brand = BRANDS.has(String(body?.brand || "")) ? String(body.brand) : "abil";
  const history = Array.isArray(body?.history)
    ? body.history.slice(-6).map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content || "").slice(0, 500) })).filter((m: any) => m.content)
    : [];

  const adminToken = await signAdminToken(password);
  const ctx = await serverContext(vaultBases(req, env), adminToken);

  const payload = {
    message: message.slice(0, 1200),
    brand,
    mode: "client",
    lang,
    langVariant: lang === "pt" ? "pt-PT" : undefined,                                                            
                                                                                                
    persona: ctx.persona,
    history,
    extraInstructions: ctx.extraInstructions,
  };

  const url = new URL(req.url);
  url.pathname = "/api/agent-council";
  const headers = new Headers({ "Content-Type": "application/json", "x-abil-admin": adminToken });
  const origin = req.headers.get("origin");
  if (origin) headers.set("origin", origin);
  const internalReq = new Request(url.toString(), { method: "POST", headers, body: JSON.stringify(payload) });
  const upstream = await agentCouncilHandler(internalReq);
  const text = await upstream.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch {            }
  if (!upstream.ok || !data?.reply) {
    return new Response(text || JSON.stringify({ error: "agent unavailable" }), { status: upstream.status || 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
  return new Response(JSON.stringify({ ok: true, provider: data.provider, persona_used: data.persona_used || "CONCIERGE", reply: String(data.reply).slice(0, 1500), action: null }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
}
