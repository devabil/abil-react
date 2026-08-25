                                                                                          
                                                                                                 
                                                                                                 
                                                                                                 
                                                                                                
  
                                                                                                     

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `You are ABiL, a Swiss creative atelier based in Genève (Suisse romande). A prospect sent a request; you generated a proposal; now you write a SHORT reply email to send back with the proposal.

VOICE (strict):
- Speak as the atelier, collectively as "we" (nous / wir / noi / nós), NEVER first-person singular ("I").
- Calm, precise, confident, professional and warm. Never aggressive, never gratuitous irony. Short sentences.
- Keep the brand name "ABiL" with its asterisk if you mention it. Keep "Atelier" as a word.
- NO buzzwords ("synergy", "disruption", "leverage", "best-in-class", "game-changing"), no fake urgency, no empty superlatives, no AI clichés ("dive deep", "unlock", "elevate", "seamless").
- Never use the em dash character; use commas or parentheses.

WHAT TO WRITE:
A short email body of 3 to 5 short lines:
1. A greeting using the client's first name if provided (e.g. "Bonjour Marc," / "Olá Marta,").
2. One line thanking them for the request and acknowledging, specifically, what they asked for (reference their project/sector, show we read it).
3. One line saying we have prepared a proposal for it and that the details are in the attached/below document.
4. One line inviting them to adjust anything or to talk.

HARD RULES:
- Output ONLY the email body text (no JSON, no markdown, no subject line, no quotes around it).
- Do NOT include any price, currency, percentage or number tied to money. None.
- Do NOT include a sign-off or signature (no "Cordialement", no name), the app appends the price and signature afterwards.
- Write in the target language. Keep the SAME professional register throughout.
- Keep it genuinely short. No paragraphs longer than one or two sentences.`;

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

async function callOpenAI(args: { apiKey: string; model: string; userPrompt: string; maxTokens: number; systemPrompt: string }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 20000);
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
        temperature: 0.5,
        max_tokens: args.maxTokens,
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

async function callAnthropic(args: { apiKey: string; model: string; userPrompt: string; maxTokens: number; systemPrompt: string }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 20000);
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
        temperature: 0.5,
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

const ALLOWED_LANGS = new Set(["pt", "fr", "en", "it", "de"]);

export default async function handler(req: Request): Promise<Response> {
  const CORS_HEADERS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
                                                                                                          
                                                                                                    
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  let body: {
    lang?: string;
    model?: string;
    clientName?: string;
    company?: string;
    serviceLabel?: string;
    sector?: string;
    summary?: string;
                                                                                                           
                                                                                                          
                                                                                          
    brandPersona?: { title?: string; tonality?: string; avoid?: string; keywords?: string; prompt?: string; estiloEscrita?: string };
    buyerPersona?: { title?: string; tonality?: string; avoid?: string; keywords?: string; prompt?: string };
    knowledge?: string[];
    globalTextPrompt?: string;
    referenceNotes?: string;
    safeguards?: string;
  };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const lang = ALLOWED_LANGS.has((body.lang || "").toLowerCase().slice(0, 2)) ? (body.lang as string).toLowerCase().slice(0, 2) : "fr";
  const modelRaw = body.model || "gpt-4o-mini";
  const { provider, modelId } = modelToProvider(modelRaw);

  const envKey = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
                                                                                                                           
  { const _pw = envKey.ABIL_ADMIN_AUTH_SECRET || "", _t = req.headers.get("x-abil-admin") || "", _d = _t.indexOf("."); let _ok = false;
    if (_pw && _d > 0 && /^\d+$/.test(_t.slice(0, _d)) && Date.now() <= Number(_t.slice(0, _d))) {
      try { const _k = await crypto.subtle.importKey("raw", new TextEncoder().encode(_pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const _g = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", _k, new TextEncoder().encode(_t.slice(0, _d))))).map((b) => b.toString(16).padStart(2, "0")).join(""); _ok = _t.slice(_d + 1) === _g; } catch { _ok = false; } }
    if (!_ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }); }
  let apiKey: string | undefined;
  if (provider === "openai") apiKey = envKey.OPENAI_API_KEY || undefined;
  else apiKey = envKey.ANTHROPIC_API_KEY || undefined;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: `API key not configured for ${provider}` }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const langName = ({ fr: "French", de: "German", en: "English", pt: "Portuguese (European, pt-PT)", it: "Italian" } as any)[lang] || lang;
  const cap = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");

                                                                                               
                                                                                              
  const personaBlock = (() => {
    const parts: string[] = [];
    if (body.globalTextPrompt && body.globalTextPrompt.trim()) {
      parts.push(`GLOBAL TEXT DIRECTIVE (dashboard, base instructions for ALL copy; complements the rules above):\n${body.globalTextPrompt.trim().slice(0, 1500)}`);
    }
    if (body.referenceNotes && body.referenceNotes.trim()) {
      parts.push(`REFERENCE MATERIAL (the brand's own voice rules and method, follow this voice closely, do not quote verbatim):\n${body.referenceNotes.trim().slice(0, 4000)}`);
    }
    if (body.safeguards && body.safeguards.trim()) {
      parts.push(`SAFEGUARDS (hard rules, the email must never violate these):\n${body.safeguards.trim().slice(0, 600)}`);
    }
    if (body.brandPersona) {
      const bp = body.brandPersona;
      parts.push(`BRAND PERSONA (dashboard, override on conflict with base voice rules):\n- Tonality: ${bp.tonality || "-"}\n- Avoid: ${bp.avoid || "-"}\n- Keywords: ${bp.keywords || "-"}\n- Custom voice prompt:\n${(bp.prompt || "-").slice(0, 1000)}`);
      if (bp.estiloEscrita && bp.estiloEscrita.trim()) {
        parts.push(`HOW THE ATELIER WRITES (voice-style principles, follow closely, always in the reader's language):\n${bp.estiloEscrita.trim().slice(0, 2600)}`);
      }
    }
    if (body.buyerPersona) {
      const bup = body.buyerPersona;
      parts.push(`BUYER PERSONA (the client reading this email):\n- Tonality (audience expects): ${bup.tonality || "-"}\n- Avoid (audience rejects): ${bup.avoid || "-"}\n- Keywords (audience values): ${bup.keywords || "-"}\n- Custom buyer prompt:\n${(bup.prompt || "-").slice(0, 1000)}`);
    }
    if (Array.isArray(body.knowledge) && body.knowledge.length > 0) {
      parts.push(`KNOWLEDGE BASE (extra brand docs, authoritative on factual claims):\n${body.knowledge.join("\n---\n").slice(0, 2000)}`);
    }
    return parts.length > 0 ? `\n\n──────────\n${parts.join("\n\n")}\n──────────` : "";
  })();
  const systemPrompt = SYSTEM_PROMPT + personaBlock;

  const composedUserPrompt = `Target language: ${langName}

Write the short reply email body for this prospect. Context (use it to personalise, do not quote field names):
- Client first name: ${cap(body.clientName, 80) || "(unknown)"}
- Company / brand: ${cap(body.company, 120) || "(unknown)"}
- Sector: ${cap(body.sector, 160) || "(unknown)"}
- Service prepared: ${cap(body.serviceLabel, 120) || "(a proposal)"}
- What they asked for: ${cap(body.summary, 700) || "(see above)"}

Remember: no prices or numbers, no sign-off/signature, 3 to 5 short lines, speak as "we", in ${langName}.`;

                                                                                                   
  const openaiKey = envKey.OPENAI_API_KEY || undefined;
  const anthropicKey = envKey.ANTHROPIC_API_KEY || undefined;
  const callBy = (p: Provider, mid: string, k: string) => p === "openai"
    ? callOpenAI({ apiKey: k, model: mid, userPrompt: composedUserPrompt, maxTokens: 500, systemPrompt })
    : callAnthropic({ apiKey: k, model: mid, userPrompt: composedUserPrompt, maxTokens: 600, systemPrompt });

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
                                                                    
    const reply = raw.replace(/\u2014/g, ",").replace(/^["'“”]+|["'“”]+$/g, "").trim().slice(0, 1200);
    return new Response(JSON.stringify({ reply, provider: usedProvider }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
}
