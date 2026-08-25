                                                             
                                                                          
  
                                          
                                                                                   
                                                                         
  
                                                                       
                                                                  
                                                      
                                                                  
                                                                           
                                                           

export const config = {
  runtime: "edge",
};

const LANG_NAMES: Record<string, string> = {
  fr: "French",
  pt: "Portuguese (European, pt-PT, use 'projecto' not 'projeto', 'óptimo' not 'ótimo', 'direcção' not 'direção', 'activação' not 'ativação', 'tecto' not 'teto')",
  en: "English",
  de: "German",
  it: "Italian",
};

const DEFAULT_SYSTEM_PROMPT = `You are the in-house translator for ABiL, a Swiss creative atelier in Genève.

Translate the user's text to the target language while strictly preserving the ABiL brand voice:

VOICE RULES (apply to translation):
- Calm, precise, confident. Never aggressive. Never gratuitous irony.
- First-person plural ("we/our", "nous/notre", "wir/unser", "noi/nostro", "nós/nosso"), NEVER first-person singular.
- Concrete, measurable. Short sentences when possible.
- The asterisk (*) is sparingly used, preserve when present, never add new ones.

AVOID (these violate the voice, neutralise them in translation):
- Buzzwords ("synergy", "disruption", "innovate", "leverage", "best-in-class")
- ALL CAPS (lowercase or sentence case unless original uses it semantically like "ABiL")
- Fake urgency ("ACT NOW", "limited time")
- Empty superlatives ("exceptional", "unique in the world", "world-class")
- Multiple exclamation marks (!!!)

GLOSSARY (do NOT translate these literal):
- "ABiL" → keep with asterisk in all languages
- "Atelier" → keep "Atelier" in PT/IT (NOT "Studio", NOT "Workshop"); "Studio" in EN/DE
- "Genève", "Suisse romande", "Lausanne" → keep proper names
- Brand names ("<Client>", "<Client> Festival", etc.) → never translate
- Code identifiers, IDs, URLs, emails → never translate
- Variable placeholders {{name}}, {{prenom}}, {{projet}} → keep verbatim

OUTPUT:
- Return ONLY the translation. No quotes, no explanations, no "Here is the translation:".
- Preserve exactly: line breaks (\\n), markdown formatting, punctuation style, emoji, capitalization patterns (when semantic).
- If the original is already in the target language, return it unchanged.
- If translation would force a voice violation, gently rephrase to comply (e.g. "GROSSE SORTIE !!!" → "Grande lançamento.").`;

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

async function callOpenAI(args: { apiKey: string; model: string; systemPrompt: string; userPrompt: string }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: args.model,
        messages: [
          { role: "system", content: args.systemPrompt },
          { role: "user", content: args.userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
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

async function callAnthropic(args: { apiKey: string; model: string; systemPrompt: string; userPrompt: string }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 15000);
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
        max_tokens: 2000,
        system: args.systemPrompt,
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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  let body: { text?: string; from?: string; to?: string; model?: string; systemPrompt?: string; knowledge?: string[] };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const text = (body.text || "").trim();
  const from = (body.from || "auto").toLowerCase();
  const to = (body.to || "").toLowerCase();
  const modelRaw = body.model || "gpt-4o-mini";
  const customPrompt = body.systemPrompt;
  const knowledge = Array.isArray(body.knowledge) ? body.knowledge.filter((k) => typeof k === "string" && k.trim()) : [];

  if (!text) {
    return new Response(JSON.stringify({ translated: "" }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
  if (!to || !LANG_NAMES[to]) {
    return new Response(JSON.stringify({ error: "Invalid 'to' lang" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
  if (text.length > 8000) {
    return new Response(JSON.stringify({ error: "Text too long (max 8000 chars)" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
  if (from !== "auto" && from === to) {
    return new Response(JSON.stringify({ translated: text }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const { provider, modelId } = modelToProvider(modelRaw);

                                                          
  const envKey = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  let apiKey: string | undefined;
  if (provider === "openai") {
    apiKey = envKey.OPENAI_API_KEY || undefined;
  } else {
    apiKey = envKey.ANTHROPIC_API_KEY || undefined;
  }
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: `API key not configured for ${provider}`,
      hint: provider === "openai"
        ? "Set OPENAI_API_KEY env var in Vercel OR send x-openai-key header from dashboard config."
        : "Set ANTHROPIC_API_KEY env var in Vercel OR send x-anthropic-key header from dashboard config.",
    }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

                                                    
  let systemPrompt = customPrompt && customPrompt.trim() ? customPrompt : DEFAULT_SYSTEM_PROMPT;
                                                                 
  if (knowledge.length > 0) {
    const joined = knowledge.join("\n\n---\n\n").slice(0, 30000);
    systemPrompt = `${systemPrompt}\n\n=== ADDITIONAL KNOWLEDGE BASE ===\n${joined}\n=== END KNOWLEDGE BASE ===`;
  }

  const userPrompt = from === "auto"
    ? `Translate to ${LANG_NAMES[to]}:\n\n${text}`
    : `Translate from ${LANG_NAMES[from] || from} to ${LANG_NAMES[to]}:\n\n${text}`;

  try {
    let translated: string | null = null;
    try {
      translated = provider === "openai"
        ? await callOpenAI({ apiKey, model: modelId, systemPrompt, userPrompt })
        : await callAnthropic({ apiKey, model: modelId, systemPrompt, userPrompt });
    } catch (primaryErr) {
                                                                                                   
      const msg = String((primaryErr as Error)?.message || primaryErr);
      const st = /(?:OpenAI|Anthropic) (\d{3})/.exec(msg)?.[1];
      const recoverable = !st || st === "429" || st.startsWith("5");
      const altKey = provider === "openai" ? envKey.ANTHROPIC_API_KEY : envKey.OPENAI_API_KEY;
      if (!recoverable || !altKey) throw primaryErr;
      translated = provider === "openai"
        ? await callAnthropic({ apiKey: altKey, model: "claude-haiku-4-5-20251001", systemPrompt, userPrompt })
        : await callOpenAI({ apiKey: altKey, model: "gpt-4o-mini", systemPrompt, userPrompt });
    }
    if (!translated) {
      return new Response(JSON.stringify({ error: "Empty translation" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }
    return new Response(JSON.stringify({ translated, model: modelRaw, provider }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: "translation failed",
      detail: String(err?.message || err).slice(0, 300),
    }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
}
