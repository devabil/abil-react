                                                                                           
                                                                                   
                                                                        

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `You are the in-house copywriter for ABiL, a Swiss creative atelier in Genève.

FACTUAL HONESTY (hard rule, apply ALWAYS): NEVER fabricate facts, client names, brands worked with, awards, numbers, metrics or dates. Use ONLY what appears in the brand persona / knowledge base provided in this request. If you lack a specific client or number, stay generic ("premium brands", "international clients") instead of naming one. Never add adjacent brands by association. Better true-and-generic than specific-and-false.

You receive:
- The CURRENT text on a webpage element (eyebrow, title, paragraph, CTA, etc.)
- A USER INSTRUCTION on what to change (could be vague: "make it more punchy" or specific: "add the word 'projets'")
- A MAX CHARACTER LIMIT for the element (must not exceed)
- The PATH/key giving semantic context (e.g. "atelier.intro" → introduction paragraph; "hero.cta" → call-to-action button)
- The TARGET LANGUAGE for the output

Your job: rewrite the text following the user's instruction, respecting the brandpersona and the character limit.

VOICE RULES (strict):
- Calm, precise, confident. Never aggressive. Never gratuitous irony.
- First-person plural ("we/our", "nous/notre"), NEVER first-person singular.
- Concrete, measurable. Short sentences when possible.
- The asterisk (*) is sparingly used, preserve when present, never add new ones.

AVOID (these violate the voice):
- Buzzwords ("synergy", "disruption", "innovate", "leverage", "best-in-class", "game-changing")
- ALL CAPS (lowercase or sentence case unless original uses it semantically like "ABiL")
- Fake urgency ("ACT NOW", "limited time")
- Empty superlatives ("exceptional", "unique in the world", "world-class", "amazing")
- Multiple exclamation marks (!!!)

GLOSSARY (do NOT translate/normalize these):
- "ABiL" → keep with asterisk
- "Atelier" → keep "Atelier" in PT/IT (NOT "Studio", NOT "Workshop"); "Studio" in EN/DE
- "Genève", "Suisse romande", "Lausanne" → keep proper names
- Brand names (<Client>, <Client> Festival, etc.) → never modify

PATH HINTS:
- "*.title" / "*.hero.tagline" → headline tone, max-impact
- "*.eyebrow" / "*.label" → kicker style, monospace uppercase OK if context allows
- "*.intro" / "*.subtitle" / "*.desc" → paragraph tone, complete sentences
- "*.cta" / "*.ctaButton" / "*.button" → action verb, imperative
- "*.bio" → short professional bio, 3rd person facts
- "*.back" / "*.scroll" → navigation hint, very short

SOCIAL POSTS (when the path contains "social", e.g. "social.title", "social.supportText", "social.disruptivePhrase", "social/caption"), MANDATORY:
- The copy MUST be CREATIVE and DISRUPTIVE in the EDITORIAL sense: a bold, contrarian, memorable statement that challenges a market convention and makes the reader stop scrolling. Never safe, never generic, never a flat description.
- BRAND LAUNCH 2026: ABiL has a new identity. Signature: "Des idées à la hauteur de l'ambition." Posture: ABiL is a stance, not a description ("Nous ne créons pas pour remplir un espace, nous créons pour changer d'échelle"). The asterisk (*) is core: it signals there is always more behind what is visible (more strategy, depth, ambition), use the "phrase + asterisk footnote" mechanic when it fits. Values: Passion, Audace, Excellence. Lean into this launch story when relevant.
- Gold-standard register (match this level, do not copy literally): "Nous ne pensons jamais petit.*" / "Tout est dans l'astérisque." / "Visez le sommet, pas la moyenne." / "Une seule équipe, du brief au master." / "Le marché disperse. Nous concentrons."
- IMPORTANT: "disruptive" here means the IDEA is bold and contrarian. The TONE stays the calm-confident brand voice. This is NOT the banned buzzword "disruption", NOT hype, NOT caps, NOT exclamation marks.
- "social.title" → a sharp, scroll-stopping headline/statement (may be phrased as a provocative question for curiosity posts). "social.supportText" → 1 to 3 short sentences that land the idea with a concrete proof. "social.disruptivePhrase" → one contrarian, quotable line. "social/caption" → short caption in the brand voice + 2 to 4 relevant hashtags at the end.

LENGTH STRATEGY (very important, read carefully):
- For LONG-FORM elements (descriptions, intros, paragraphs, case-study text, bios, typically limit ≥ 200): DEVELOP the idea fully. Treat the user instruction as a BRIEF, not as the final text. Expand it into a complete, rich paragraph that USES most of the available space, aim for 70 to 90% of the character limit. Bring in concrete context, the creative challenge, the approach taken, and the result, all in the brand voice. NEVER just translate or minimally rewrite a short brief into one short sentence, that is a failure. Build portfolio-quality copy.
- For SHORT elements (titles, taglines, eyebrows, CTAs, nav hints, typically limit < 80): be concise and high-impact. Do NOT pad to fill space.
- When in doubt because the limit is generous (≥ 200), prefer the richer, fuller version.

CONSTRAINTS:
- Hard limit: output MUST be ≤ maxLength characters. Count carefully.
- Output ONLY the new text. No quotes, no explanations, no "Here's the rewritten text:".
- Match the original language unless user instruction says otherwise.
- If the user instruction is unclear or impossible within the limit, do your best interpretation.`;

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

async function callOpenAI(args: { apiKey: string; model: string; userPrompt: string; maxTokens: number; temperature?: number; imageUrl?: string }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 15000);
  try {
                                                                                                    
                                                                                                        
                                                                                                              
    const userContent = args.imageUrl
      ? [{ type: "text", text: args.userPrompt }, { type: "image_url", image_url: { url: args.imageUrl } }]
      : args.userPrompt;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: args.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: args.temperature ?? 0.4,
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

async function callAnthropic(args: { apiKey: string; model: string; userPrompt: string; maxTokens: number; temperature?: number }): Promise<string | null> {
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
        max_tokens: args.maxTokens,
        temperature: args.temperature ?? 0.4,
        system: SYSTEM_PROMPT,
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

                                                                                                                 
                                                                                                                  
                                                                                                                  
                                                                                                                 
                                                                                                                    
let _bioContentCache: { at: number; text: string } | null = null;
async function readBiographyForContent(req: Request): Promise<string> {
  if (_bioContentCache && Date.now() - _bioContentCache.at < 10 * 60 * 1000) return _bioContentCache.text;
  try {
    const tok = req.headers.get("x-abil-admin") || ""; if (!tok) return "";
    const cu = new URL(req.url);
    const r = await fetch(`${cu.protocol}//${cu.host}/api/private-store?col=biography&cb=${Date.now()}`, { headers: { "x-abil-admin": tok } });
    if (!r.ok) return "";
    const d: any = await r.json().catch(() => null);
    const v: any = d?.value ?? null;
    const raw = typeof v === "string" ? v : (typeof v?.texto === "string" ? v.texto : "");
    const clean = String(raw || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    _bioContentCache = { at: Date.now(), text: clean };
    return clean;
  } catch { return ""; }
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

  type PersonaShape = { title?: string; tonality?: string; avoid?: string; keywords?: string; visualRef?: string; prompt?: string };
  let body: {
    currentText?: string;
    userPrompt?: string;
    maxLength?: number;
    path?: string;
    lang?: string;
    model?: string;
    brandPersona?: PersonaShape;
    buyerPersona?: PersonaShape;
    knowledge?: string[];
  } = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const currentText = (body.currentText || "").slice(0, 2000);
  const requestedMax = Number(body.maxLength || 200);
  const isBlogLongform = String(body.path || "").toLowerCase().includes("blog");
                                                                                                          
                                                                                                         
  const isLongPrompt = isBlogLongform || String(body.path || "").toLowerCase().includes("auditoria");
  const userPrompt = (body.userPrompt || "").trim().slice(0, isLongPrompt ? 8000 : 1000);
  const maxLength = Math.max(10, Math.min(isBlogLongform ? 12000 : 3000, requestedMax));
  const path = (body.path || "").slice(0, 100);
  const lang = (body.lang || "fr").toLowerCase().slice(0, 2);
  const modelRaw = body.model || "gpt-4o-mini";

                                                                                   
  const personaBlock = (() => {
    const parts: string[] = [];
    if (body.brandPersona) {
      const bp = body.brandPersona;
      parts.push(`BRAND PERSONA (dashboard, override on conflict with base voice rules):
- Tonality: ${bp.tonality || ", "}
- Avoid: ${bp.avoid || ", "}
- Keywords: ${bp.keywords || ", "}
- Custom voice prompt:
${(bp.prompt || ", ").slice(0, 1000)}`);
    }
    if (body.buyerPersona) {
      const bup = body.buyerPersona;
      parts.push(`BUYER PERSONA (audience the rewrite must resonate with):
- Tonality (audience expects): ${bup.tonality || ", "}
- Avoid (audience rejects): ${bup.avoid || ", "}
- Keywords (audience values): ${bup.keywords || ", "}
- Custom buyer prompt:
${(bup.prompt || ", ").slice(0, 1000)}`);
    }
    if (Array.isArray(body.knowledge) && body.knowledge.length > 0) {
      const merged = body.knowledge.join("\n---\n").slice(0, 2000);
      parts.push(`KNOWLEDGE BASE (extra brand docs, authoritative on factual claims):\n${merged}`);
    }
    return parts.length > 0 ? `\n\n──────────\n${parts.join("\n\n")}\n──────────\n` : "";
  })();

  if (!userPrompt) {
    return new Response(JSON.stringify({ error: "userPrompt is required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
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
    }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }

  const langName = ({ fr: "French", de: "German", en: "English", pt: "Portuguese (European, pt-PT, projecto/óptimo/direcção convention)", it: "Italian" } as any)[lang] || lang;

                                                                                  
                                                                                
                                                         
  const isLongForm = maxLength >= 200;
  const targetMin = isLongForm ? Math.floor(maxLength * 0.7) : Math.floor(maxLength * 0.4);
                                                                                       
  const targetMax = Math.floor(maxLength * 0.88);
  const lengthDirective = isLongForm
    ? `Target length: AIM FOR ${targetMin} to ${targetMax} characters (this is a long-form field, DEVELOP the brief into a rich, complete paragraph; do not stop at one short sentence).`
    : `Target length: up to ${maxLength} characters (short field, be concise and high-impact).`;

                                                                                                                  
                                                                                                                           
  const bioRaw = (isBlogLongform || maxLength >= 200) ? await readBiographyForContent(req) : "";
  const bioBlock = bioRaw ? `\n\n──────────\nBRAND CULTURE / MANIFESTO of ABiL (authoritative facts, treat as knowledge base: the atelier's story, values and way of working; use ONLY what is written here, never invent, and never dump the raw manifesto into marketing copy):\n${bioRaw}\n──────────\n` : "";

  const composedUserPrompt = `Path: ${path || "(unknown)"}
Target language: ${langName}
Max character limit: ${maxLength} (HARD LIMIT, DO NOT EXCEED)
${lengthDirective}

CURRENT TEXT:
"""
${currentText}
"""

USER INSTRUCTION (treat as a BRIEF to develop, not as the final text):
"""
${userPrompt}
"""
${personaBlock}${bioBlock}
Rewrite/develop following the USER INSTRUCTION. Respect ALL voice rules + the Target length + character limit + BRAND PERSONA (overrides base voice on conflict) + BUYER PERSONA (audience). For long-form fields, produce a full, rich paragraph that uses the space. Output only the new text.`;

                                                                                 
  const temperature = isLongForm ? 0.6 : 0.4;

                                                                          
  const maxTokens = Math.min(isBlogLongform ? 4500 : 2200, Math.max(50, Math.floor(maxLength / 3) + 100));

  try {
                                                                                                                 
    const imageUrl = typeof (body as { imageUrl?: unknown }).imageUrl === "string" && /^https?:\/\//.test(String((body as { imageUrl?: string }).imageUrl)) ? String((body as { imageUrl?: string }).imageUrl).slice(0, 600) : undefined;
    let newText: string | null = null;
    let usedProvider = provider;
    let usedModel = modelId;
    try {
      newText = provider === "openai"
        ? await callOpenAI({ apiKey, model: modelId, userPrompt: composedUserPrompt, maxTokens, temperature, imageUrl })
        : await callAnthropic({ apiKey, model: modelId, userPrompt: composedUserPrompt, maxTokens, temperature });
    } catch (primaryErr) {
                                                                                                      
                                                                                                       
                                                                                                  
                                                                                                      
                                                                                             
      const msg = String((primaryErr as Error)?.message || primaryErr);
      const st = /(?:OpenAI|Anthropic) (\d{3})/.exec(msg)?.[1];
      const recoverable = !st || st === "429" || st.startsWith("5");
      const altKey = provider === "openai" ? envKey.ANTHROPIC_API_KEY : envKey.OPENAI_API_KEY;
      if (!recoverable || !altKey) throw primaryErr;
      usedProvider = provider === "openai" ? "anthropic" : "openai";
      usedModel = provider === "openai" ? "claude-haiku-4-5-20251001" : "gpt-4o-mini";
      newText = provider === "openai"
        ? await callAnthropic({ apiKey: altKey, model: usedModel, userPrompt: composedUserPrompt, maxTokens, temperature })
        : await callOpenAI({ apiKey: altKey, model: usedModel, userPrompt: composedUserPrompt, maxTokens, temperature, imageUrl });
    }
    if (!newText) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }
                                                                               
                                                                                
                                                                 
    let truncated = newText;
    if (newText.length > maxLength) {
      const cut = newText.slice(0, maxLength);
      const lastSentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("."));
      const lastSpace = cut.lastIndexOf(" ");
      if (lastSentence > maxLength * 0.5) {
        truncated = cut.slice(0, lastSentence + 1).trim();
      } else if (lastSpace > maxLength * 0.5) {
        truncated = cut.slice(0, lastSpace).trim();
      } else {
        truncated = cut.trim();
      }
    }
    return new Response(JSON.stringify({ text: truncated, originalLength: newText.length, finalLength: truncated.length, maxLength }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: "regeneration failed",
      detail: String(err?.message || err).slice(0, 300),
    }), { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
}
