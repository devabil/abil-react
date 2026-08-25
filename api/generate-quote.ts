                                                                                 
                                                                                           
                                                                                      
                                                                                             
                                                                                              
                                                                                                
                                                                                               
                                  

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `You are the senior copywriter for ABiL, an independent creative atelier in Genève, Switzerland (Suisse romande), founded in 2015. Seven senior people, by hand, at scale.

ABiL is a COLLECTIVE atelier, not a person and not a mascot. Write in the voice of the atelier: calm, precise, confident; editorial, never advertising. Short sentences. No empty superlatives, no fake urgency, no buzzwords, no ALL CAPS, no excessive punctuation. Sign collectively as "nous" / "we", never "I". Sell the craft and the result, not specifications. Absolutely NO AI clichés ("dive deep", "unlock", "let's explore", "elevate", "seamless", "game-changing", "in today's fast-paced world"). Never use an em dash; use commas, parentheses, "et" or a full stop instead.

CONTEXT: you are writing a commercial PROPOSAL (devis / orçamento) for a real prospect who just filled in a briefing on our site. You personalise the prose to THIS prospect using their briefing (brand, sector, goals, budget, deadline). You DO NOT decide the methodology (the 8-step journey of each service is fixed and written elsewhere). You DO NOT invent or mention any prices, figures, hours or numbers, pricing is handled separately by our pricing table.

You will receive:
- The client BRIEFING (JSON, may be partial).
- The list of SERVICES in this proposal. Each has: key, label, desc (what the service contemplates, from our pricing table), etapas (the fixed journey steps of that service, each with n + titulo) and conteudo (true for content services like social/video). Use desc for the bemVindo coverage; personalise each etapa; write ideiasConteudo only when conteudo is true.
- The BRAND PERSONA and BUYER PERSONA from our dashboard (voice + audience).
- The target LANGUAGE.

You ONLY write the parts of the proposal that need real interpretation of the briefing. You do NOT write delivery specifications, timelines or change policy, those are STANDARDISED boilerplate handled elsewhere. Do not repeat them.

Your job: return STRICT JSON (no markdown, no code fences, no commentary) with this exact shape:
{
  "bemVindo": "string, a calm, confident welcome (2-3 short paragraphs). Paragraph 1: greet the client by name and show we truly read their briefing (reference their brand, sector, goal, what makes them different, without quoting raw form fields). Paragraph 2: summarise what this proposal covers, name each contemplated service and, drawing on its provided 'desc', say in one line what it includes. Paragraph 3 (optional, one line): how we will approach creating it. No prices, no numbers.",
  "servicos": [
    {
      "key": "string, copy the service key exactly as given",
      "diagnostico": "string, 1 to 2 short paragraphs that name the client's REAL challenge, read from their briefing (sector, goals, what sets them apart, what holds them back), and say how THIS service answers it. Specific to this client, in our voice. No prices, no numbers.",
      "etapas": [ { "n": 1, "texto": "string, for EACH etapa given (match the same n), rewrite the step's description in 1-2 sentences, personalised to THIS client. Keep the step's intent (what it is) but make it about them, never generic." } ],
      "ideiasConteudo": "string, ONLY when conteudo is true; otherwise return an empty string. When present: 4-6 concrete content ideas INVENTED specifically for this client's business, as sub-items '01 · Idea title\\nOne sentence describing it.' then '02 · ...' (TWO-DIGIT number, space, middle dot ·, space, title; then a newline; then the sentence). Be specific to their sector and goals."
    }
  ]
}

RULES:
- Output ONLY the JSON object. Nothing before or after.
- Write everything in the target language. In French, address the client formally as "vous" (Swiss French register). In Portuguese, use European Portuguese (pt-PT: projecto, óptimo, direcção) and the formal register, addressing the client as the atelier would a client. Keep the SAME register across bemVindo, diagnostico and etapas.
- bemVindo = 2-3 short paragraphs (welcome, what the proposal covers using each service's desc, optional one-line approach).
- diagnostico = 1-2 short paragraphs per service, naming the real challenge and how the service answers it.
- etapas = exactly one entry per etapa given (match n), each a 1-2 sentence personalised rewrite of that step. Do NOT invent extra steps or drop steps. If a step is the initial briefing/discovery step (usually the first), treat it as ALREADY DONE, the client has already filled in the briefing, so write it in the past ("nous sommes partis du briefing que vous avez transmis…"), NEVER as a future action.
- ideiasConteudo = 4-6 sub-items '01 · Title\\ntext' ONLY when conteudo is true; otherwise an empty string. It must be genuinely SPECIFIC to the client's business and impossible to reuse for another client (derive from sector, products, audience, goals).
- Respect the brand voice + brand persona (persona overrides base voice on conflict).
- NEVER include prices, currency symbols, percentages tied to money, or invented numbers.
- "servicos" must contain exactly one object per service given, with the key copied verbatim.`;

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
        temperature: 0.6,
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
        temperature: 0.6,
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
  "https://abil-site.vercel.app",
  "https://www.abil.ch",

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

type PersonaShape = { title?: string; tonality?: string; avoid?: string; keywords?: string; visualRef?: string; prompt?: string };

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

  let body: {
    briefing?: Record<string, unknown>;
    servicos?: { key: string; label: string }[];
    lang?: string;
    model?: string;
    brandPersona?: PersonaShape;
    buyerPersona?: PersonaShape;
    knowledge?: string[];
    globalTextPrompt?: string;
    referenceNotes?: string;
    safeguards?: string;
  } = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const lang = (body.lang || "fr").toLowerCase().slice(0, 2);
  const servicos = Array.isArray(body.servicos) ? body.servicos.slice(0, 8) : [];
  if (servicos.length === 0) {
    return new Response(JSON.stringify({ error: "No services provided" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
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

  const langName = ({ fr: "French (Swiss French, formal vous)", de: "German (Swiss German register, formal Sie)", en: "English", pt: "Portuguese (European, pt-PT, projecto/óptimo/direcção convention)", it: "Italian (Swiss Italian register)" } as any)[lang] || lang;

  const personaBlock = (() => {
    const parts: string[] = [];
    if (body.brandPersona) {
      const p = body.brandPersona;
      parts.push(`BRAND PERSONA (dashboard, overrides base voice on conflict):\n${[p.prompt, p.tonality ? `Tone: ${p.tonality}` : "", p.avoid ? `Avoid: ${p.avoid}` : "", p.keywords ? `Keywords: ${p.keywords}` : ""].filter(Boolean).join("\n").slice(0, 1500)}`);
    }
    if (body.buyerPersona) {
      const p = body.buyerPersona;
      parts.push(`BUYER PERSONA (audience):\n${[p.prompt, p.tonality ? `Tone: ${p.tonality}` : ""].filter(Boolean).join("\n").slice(0, 1000)}`);
    }
    if (body.globalTextPrompt && body.globalTextPrompt.trim()) parts.push(`GLOBAL TEXT DIRECTIVE:\n${body.globalTextPrompt.trim().slice(0, 800)}`);
    if (body.referenceNotes && body.referenceNotes.trim()) parts.push(`REFERENCE NOTES:\n${body.referenceNotes.trim().slice(0, 600)}`);
                                                                                                                           
    if (Array.isArray(body.knowledge) && body.knowledge.length > 0) {
      parts.push(`KNOWLEDGE BASE (extra brand docs, authoritative on factual claims):\n${body.knowledge.join("\n---\n").slice(0, 2000)}`);
    }
    if (body.safeguards && body.safeguards.trim()) {
      parts.push(`SAFEGUARDS (hard rules, the proposal must never violate these):\n${body.safeguards.trim().slice(0, 600)}`);
    }
    return parts.length ? "\n\n" + parts.join("\n\n") : "";
  })();

  const briefingJSON = JSON.stringify(body.briefing ?? {}, null, 0).slice(0, 4000);
  const servicosJSON = JSON.stringify(servicos, null, 0);

  const composedUserPrompt = `Target language: ${langName}

CLIENT BRIEFING (JSON, may be partial, read it, infer the project, never quote raw field names):
"""
${briefingJSON}
"""

SERVICES IN THIS PROPOSAL (write one "servicos" entry per item, copy the key verbatim):
"""
${servicosJSON}
"""
${personaBlock}

Return the STRICT JSON described in the system prompt, in ${langName}. No prices, no numbers tied to money, no markdown.`;

                                                                             
                                                                     
  const openaiKey = envKey.OPENAI_API_KEY || undefined;
  const anthropicKey = envKey.ANTHROPIC_API_KEY || undefined;
  const callBy = (p: Provider, mid: string, k: string) => p === "openai"
    ? callOpenAI({ apiKey: k, model: mid, userPrompt: composedUserPrompt, maxTokens: 3500 })
    : callAnthropic({ apiKey: k, model: mid, userPrompt: composedUserPrompt, maxTokens: 4000 });

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
    if (!parsed || !Array.isArray(parsed.servicos)) {
      return new Response(JSON.stringify({ error: "AI response not valid JSON" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }
                                                                  
    const clean = (s: unknown, max: number) => typeof s === "string" ? s.replace(/\u2014/g, ",").trim().slice(0, max) : "";
    const curated = {
      bemVindo: clean(parsed.bemVindo, 1600),
      servicos: parsed.servicos.slice(0, 8).map((sv: any) => ({
        key: clean(sv?.key, 80),
        diagnostico: clean(sv?.diagnostico, 900),
        etapas: Array.isArray(sv?.etapas)
          ? sv.etapas.slice(0, 12).map((e: any) => ({ n: Number(e?.n) || 0, texto: clean(e?.texto, 400) })).filter((e: any) => e.n > 0 && e.texto)
          : [],
        ideiasConteudo: clean(sv?.ideiasConteudo, 1400),
      })),
    };
    return new Response(JSON.stringify({ curated, provider: usedProvider }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
}
