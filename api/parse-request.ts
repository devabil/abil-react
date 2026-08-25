                                                                                                   
                                                                                           
                                                                                            
                                                                                                  
                                                                                                     
                                                                                       
  
                                                                                               
                                                                

export const config = {
  runtime: "edge",
};

                                                                                                  
const SERVICE_MENU = `branding, Identidade visual completa, logo, sistema gráfico
naming, Nome de marca, slogan, manifesto
activation, Ativação de marca: eventos, pop-ups, lançamentos físicos
campaigns, Publicidade: billboard, OOH, jornais, revistas, ATL/BTL
social_media, Redes sociais, orgânico, tráfego pago, templates, buyer personas
marketing_digital, Google Ads, Facebook Ads, inbound, SEO
marketing_360, Estratégia integrada multi-canal
video, Vídeo: institucional, promocional, depoimentos, eventos, IA
webdesign, Sites, plataformas digitais, e-commerce
app_design, UI/UX para apps nativas iOS + Android
label, Rótulos / packaging para bebidas, alimentos e produtos
motion_graphic, Motion graphics, animação de logótipo, 3D fake
photo, Fotografia: produto, eventos, moda, retrato
cgi_3d, 3D / CGI: visualização, modelação, animação 3D
ai_music, Música: spot, jingle, trilha sonora
editorial, Editorial design: revistas, relatórios, livros, catálogos
consulting, Consultoria: benchmark, SWOT, estudo de concorrência
signage, Sinalética: sistemas de sinalização, fachadas
talk_team, Conversa exploratória sem briefing definido (usar quando o pedido é vago)`;

const SYSTEM_PROMPT = `You are the intake analyst for ABiL, a Swiss creative atelier based in Genève (Suisse romande). A real prospect sent a free-form request (email, message or note). Your job: read it and turn it into a STRUCTURED BRIEFING our atelier can act on. You do NOT write a proposal, you do NOT invent prices, you do NOT reply to the client. You only extract and structure what is there, and flag what is missing.

You MUST classify the request into exactly ONE service family from this menu (return the key on the left):
${SERVICE_MENU}

You MUST suggest a company size tier (drives the pricing bracket later, the human confirms it):
- bronze, solo, freelancer, micro business, tight budget, simple/one-off need
- prata, small business / small team, a focused project
- ouro, established mid-size company, broader scope, multiple deliverables
- platina, large company / enterprise / premium ambition, strategic multi-channel scope
If the size is genuinely unclear, choose "bronze" and add a question about budget/company size to openQuestions.

Return STRICT JSON (no markdown, no code fences, no commentary) with EXACTLY this shape:
{
  "detectedLang": "fr | de | en | it | pt, the language the CLIENT wrote in (best guess; default fr)",
  "service": "one key from the menu above",
  "serviceRationale": "one short sentence (in detectedLang) on why this service",
  "companySize": "bronze | prata | ouro | platina",
  "companySizeRationale": "one short sentence (in detectedLang) on why this tier",
  "contactName": "person name if present, else empty string",
  "contactCompany": "company / brand name if present, else empty string",
  "contactEmail": "email if present, else empty string",
  "contactPhone": "phone if present, else empty string",
  "sector": "the client's industry / sector, inferred if needed (in detectedLang), else empty string",
  "summary": "2-3 sentence neutral summary of what the client is asking for (in detectedLang)",
  "scope": "what is in scope, as you understand it (in detectedLang)",
  "deliverables": ["concrete deliverables the client expects or that the service implies; 2-6 items; in detectedLang"],
  "deadline": "any timing / deadline mentioned, verbatim-ish (in detectedLang), else empty string",
  "budget": "any budget the CLIENT indicated, verbatim-ish (in detectedLang), else empty string, NEVER invent a number",
  "openQuestions": ["the most important questions to ask before quoting; 2-5 items; in detectedLang"]
}

RULES:
- Output ONLY the JSON object. Nothing before or after.
- Write EVERY human-readable field (serviceRationale, companySizeRationale, sector, summary, scope, deliverables, openQuestions) in detectedLang, even though this menu and these instructions are in Portuguese. If the client wrote in French, write those fields in French; if in English, in English; and so on.
- NEVER invent prices, hours or figures. "budget" only echoes what the client themselves stated; otherwise empty.
- "service" and "companySize" MUST be one of the allowed keys, lowercase, exactly as written.
- Be honest about uncertainty: put real gaps in openQuestions instead of guessing.`;

type Provider = "openai" | "anthropic";
function modelToProvider(model: string): { provider: Provider; modelId: string } {
  if (model.startsWith("claude")) {
    const map: Record<string, string> = {
      "claude-haiku-3.5": "claude-haiku-4-5-20251001",
      "claude-sonnet-4.5": "claude-sonnet-4-5",
      "claude-opus-4.5": "claude-opus-4-5",
    };
    return { provider: "anthropic", modelId: map[model] || model };
  }
  return { provider: "openai", modelId: model };
}

async function callOpenAI(args: { apiKey: string; model: string; userPrompt: string; maxTokens: number }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: args.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: args.userPrompt },
        ],
        temperature: 0.2,
        max_tokens: args.maxTokens,
        response_format: { type: "json_object" },
      }),
    });
    clearTimeout(tid);
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
    }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

async function callAnthropic(args: { apiKey: string; model: string; userPrompt: string; maxTokens: number }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": args.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: args.model,
        max_tokens: args.maxTokens,
        temperature: 0.2,
        system: SYSTEM_PROMPT + "\n\nReturn ONLY the JSON object, no prose.",
        messages: [{ role: "user", content: args.userPrompt }],
      }),
    });
    clearTimeout(tid);
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
    }
    const data: any = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

const ALLOWED_ORIGINS = new Set([
  "https://abil.ch",
  "https://www.abil.ch",
  "https://abil-site.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
]);
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && ALLOWED_ORIGINS.has(origin);
  const allowed = ok ? origin! : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-anthropic-key, x-abil-admin",
    "Vary": "Origin",
  };
}

                                                                              
function safeParseJSON(raw: string): any | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch {  }
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {  }
  }
  return null;
}

const ALLOWED_SERVICES = new Set([
  "branding", "naming", "activation", "campaigns", "social_media", "marketing_digital",
  "marketing_360", "video", "webdesign", "app_design", "label", "motion_graphic",
  "photo", "cgi_3d", "ai_music", "editorial", "consulting", "signage", "talk_team",
]);
const ALLOWED_TIERS = new Set(["bronze", "prata", "ouro", "platina"]);
const ALLOWED_LANGS = new Set(["pt", "fr", "en", "it", "de"]);

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
  const CORS_HEADERS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  let body: { text?: string; model?: string; langHint?: string };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const text = (body.text || "").toString().trim();
  if (text.length < 8) {
    return new Response(JSON.stringify({ error: "Empty or too short request text" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const modelRaw = body.model || "gpt-4o-mini";
  const { provider, modelId } = modelToProvider(modelRaw);

  const envKey = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  let apiKey: string | undefined;
  if (provider === "openai") apiKey = envKey.OPENAI_API_KEY || undefined;
  else apiKey = envKey.ANTHROPIC_API_KEY || undefined;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: `API key not configured for ${provider}` }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const langHint = (body.langHint || "").toString().toLowerCase().slice(0, 2);
  const langHintLine = ALLOWED_LANGS.has(langHint) ? `\n(Hint: the client likely writes in "${langHint}", but trust the text itself.)` : "";

  const composedUserPrompt = `CLIENT REQUEST (raw text, as received):${langHintLine}
"""
${text.slice(0, 6000)}
"""

Return the STRICT JSON briefing described in the system prompt. Classify "service" and "companySize" with one allowed key each. Never invent prices.`;

                                                                                           
                                                                                         
                                                                                         
  const openaiKey = envKey.OPENAI_API_KEY || undefined;
  const anthropicKey = envKey.ANTHROPIC_API_KEY || undefined;
  const callBy = (p: Provider, mid: string, k: string) => p === "openai"
    ? callOpenAI({ apiKey: k, model: mid, userPrompt: composedUserPrompt, maxTokens: 1400 })
    : callAnthropic({ apiKey: k, model: mid, userPrompt: composedUserPrompt, maxTokens: 1600 });

  let usedProvider: Provider = provider;
  try {
    let raw: string | null;
    try {
      raw = await callBy(provider, modelId, apiKey);
    } catch (primaryErr) {
      const fb = provider === "openai"
        ? (anthropicKey ? { p: "anthropic" as Provider, mid: "claude-haiku-4-5-20251001", k: anthropicKey } : null)
        : (openaiKey ? { p: "openai" as Provider, mid: "gpt-4o-mini", k: openaiKey } : null);
      if (!fb) throw primaryErr;
      usedProvider = fb.p;
      raw = await callBy(fb.p, fb.mid, fb.k);
    }
    if (!raw) return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    const parsed = safeParseJSON(raw);
    if (!parsed || typeof parsed !== "object") {
      return new Response(JSON.stringify({ error: "AI response not valid JSON" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    const str = (s: unknown, max: number) => typeof s === "string" ? s.replace(/\u2014/g, ",").trim().slice(0, max) : "";
    const arr = (a: unknown, maxItems: number, maxLen: number) => Array.isArray(a)
      ? a.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems)
      : [];

    const service = String(parsed.service || "").toLowerCase().trim();
    const companySize = String(parsed.companySize || "").toLowerCase().trim();
    const detectedLang = String(parsed.detectedLang || "").toLowerCase().slice(0, 2);

    const briefing = {
      detectedLang: ALLOWED_LANGS.has(detectedLang) ? detectedLang : "fr",
      service: ALLOWED_SERVICES.has(service) ? service : "talk_team",
      serviceRationale: str(parsed.serviceRationale, 240),
      companySize: ALLOWED_TIERS.has(companySize) ? companySize : "bronze",
      companySizeRationale: str(parsed.companySizeRationale, 240),
      contactName: str(parsed.contactName, 120),
      contactCompany: str(parsed.contactCompany, 120),
      contactEmail: str(parsed.contactEmail, 160),
      contactPhone: str(parsed.contactPhone, 60),
      sector: str(parsed.sector, 160),
      summary: str(parsed.summary, 800),
      scope: str(parsed.scope, 1200),
      deliverables: arr(parsed.deliverables, 8, 240),
      deadline: str(parsed.deadline, 240),
      budget: str(parsed.budget, 240),
      openQuestions: arr(parsed.openQuestions, 6, 280),
    };

    return new Response(JSON.stringify({ briefing, provider: usedProvider }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
}
