                                                                                       
                                                                             
                                                                                      
  
                                                                                  

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `You are the in-house project analyst for ABiL, a Swiss creative atelier in Genève.

You receive raw text extracted from a project document (PDF, brief, presentation) AND/OR a set of images of the project (pages, boards, final pieces, photos of printed material) and must produce a STRUCTURED JSON object describing the project.

WHEN IMAGES ARE ATTACHED: read them carefully. Extract the client name, sector, medium and any visible copy from what you SEE (logos, headlines, packaging, posters, screens). The visual language you observe (typography, palette, grid) feeds the description. Images are as authoritative as text.

VOICE RULES (apply to title + description):
- Calm, precise, confident. Never aggressive. Never gratuitous irony.
- First-person plural ("we/our"), NEVER first-person singular.
- Concrete, measurable. Short sentences when possible.
- The asterisk (*) is sparingly used, preserve when present, never add new ones.

AVOID (these violate the voice):
- Buzzwords ("synergy", "disruption", "innovate", "leverage", "best-in-class", "game-changing")
- ALL CAPS (lowercase or sentence case unless original uses it semantically)
- Fake urgency ("ACT NOW", "limited time")
- Empty superlatives ("exceptional", "unique in the world", "world-class", "amazing")
- Multiple exclamation marks (!!!)

GLOSSARY (do NOT translate/normalize these):
- "ABiL" → keep with asterisk
- "Atelier" → keep "Atelier" in PT/IT (NOT "Studio", NOT "Workshop"); "Studio" in EN/DE
- "Genève", "Suisse romande", "Lausanne" → keep proper names
- Brand names (<Client>, <Client> Festival, etc.) → never modify

OUTPUT FORMAT (JSON ONLY, no prose, no markdown fences):
{
  "title": "STRICT FORMAT: '{Service} {ClientName}' (max 60 chars). Service = ONE word from the categories list capitalized in the language detected. ClientName = brand/client name extracted from doc or filename. Examples of the FORMAT only (never copy these names): 'Branding <Client>', 'Campagne <Client>', 'Film <Client>', 'Identité <Client>', 'Digital <Client>', 'Éditorial <Client>'. Use ONLY the client name given in the brief; never invent one. NO TAGLINES, NO COLON, NO DASH. Just '{Service} {ClientName}'. MANDATORY non-empty.",
  "description": "Compact case study, HARD LIMIT 580 chars (DO NOT EXCEED, UI cap=600 truncates). Use 2 paragraphs separated by \\n\\n. STRUCTURE OBRIGATÓRIA:\\n- §1 Brief + abordagem (~280 chars): contexto, desafio, posicionamento + metodologia/entregáveis técnicos (typography, sistema visual, palette, declinações).\\n- §2 Resultado/impacto (~280 chars): outcome concreto, números quando possível, reconhecimento.\\n\\nTOM: técnico + criativo + ABiL brand voice. NUNCA genérico. NUNCA buzzwords. SEMPRE completar última frase com ponto final (NUNCA cortar mid-sentence). Specific concrete nouns > abstract concepts. Conta caracteres antes de fechar, se >580, REMOVE a última frase.",
  "serviceName": "ONE word or compact service phrase from the categories list in the language detected (Branding, Campaign, Film, Digital, Editorial, OOH, Social, Motion, Activation, Consulting, Automation, System, Website, Marketing, Inbound, App, 3D, AI, Photography, UI/UX). MANDATORY.",
  "clientName": "Brand/client name extracted (e.g. 'ABiL', '<Client>', '<Client> Festival'). MANDATORY non-empty, if unknown, use the most distinctive proper noun from the doc/filename.",
  "categories": ["branding"|"campagne"|"film"|"digital"|"editorial"|"ooh"|"social"|"motion_graphics"|"brand_activation"|"marketing_consulting"|"ai_automation"|"system"|"website"|"marketing_360"|"digital_marketing"|"inbound_marketing"|"mobile_app"|"modeling_3d"|"ai_modeling"|"live_action_film"|"ai_film"|"ai_image_manipulation"|"photography"|"ui_ux_design"], // 1-4 categories that BEST fit the project. Pick from this exact list.
  "suggestedTeam": ["tm-1"|"tm-2"|"tm-3"|"tm-4"|"tm-5"|"tm-6"|"tm-7"], // 1-4 team member IDs that match the disciplines in the project
  "language": "fr"|"de"|"en"|"pt"|"it", // detected language of the source text
  "seoKeywords": ["string"] // 3-5 short SEO-friendly keywords (lowercase, hyphenated, no diacritics, no stopwords). Used in image filenames for ranking. Examples: ["identite-visuelle", "campagne-360", "geneve", "swiss-design", "affiches"]. Avoid generic words like "design" or "projet"; prefer specific terms (industry/discipline/region/medium).
}

CRITICAL RULES (NEVER violate):
1. title MUST be non-empty and follow EXACT format '{Service} {ClientName}'. If you cannot determine ClientName, use the most distinctive proper noun in the doc/filename (capitalized). Example: filename "presentation-final-v2.pdf" + content mentions "<Client>" → title="Branding <Client>". NEVER return whitespace-only or generic "Novo projeto".
2. description MUST be non-empty (≥200 chars). If text is sparse/unreadable, INFER a believable description from filename + page count + serviceName.
3. serviceName + clientName MUST always be filled, they are the building blocks for the title.
4. Always return valid JSON with ALL required fields.

TEAM MEMBER DISCIPLINES (for suggestedTeam):
- tm-1: Samuel Dahan, managing partner, business development, client strategy
- tm-2: Nicolas Juban, creative direction
- tm-3: Jimmy Dubuisson, art direction
- tm-4: Elizabeth C., project management
- tm-5: Ihor Trokhymchuk, web and mobile development
- tm-6: Inna Krychuniak, graphic design
- tm-7: Stephen Bellotto, creative AI ecosystems

If the document text is empty/unreadable, return reasonable defaults inferred from the filename. Always return valid JSON.`;

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

async function callOpenAI(args: { apiKey: string; model: string; userPrompt: string; images?: string[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 25000);
                                                                            
                                                                        
  const userContent: unknown = args.images && args.images.length
    ? [{ type: "text", text: args.userPrompt },
       ...args.images.map((u) => ({ type: "image_url", image_url: { url: u, detail: "auto" } }))]
    : args.userPrompt;
  try {
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
        temperature: 0.5,
        max_tokens: 2500,
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

async function callAnthropic(args: { apiKey: string; model: string; userPrompt: string; images?: string[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 25000);
                                                                            
  const blocosImagem = (args.images || []).map((u) => {
    const m = u.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    return m ? { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } } : null;
  }).filter(Boolean);
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
        max_tokens: 1500,
        system: SYSTEM_PROMPT + "\n\nIMPORTANT: Reply with raw JSON only. No markdown fences, no prose before/after.",
        messages: [{
          role: "user",
          content: blocosImagem.length
            ? [{ type: "text", text: args.userPrompt }, ...blocosImagem]
            : args.userPrompt,
        }],
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
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } });
  }

  type PersonaShape = { title?: string; tonality?: string; avoid?: string; keywords?: string; visualRef?: string; prompt?: string };
  let body: {
    text?: string;
    filename?: string;
    pageCount?: number;
    model?: string;
    brandPersona?: PersonaShape;
    buyerPersona?: PersonaShape;
    globalTextPrompt?: string;
    referenceNotes?: string;
    safeguards?: string;
    knowledge?: string[];
    images?: string[];
  } = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  }

  const text = (body.text || "").trim().slice(0, 30000);                               
  const filename = body.filename || "documento";
                                                                                 
                                                                                
                                                                                
                                                                              
  const imagens = (Array.isArray(body.images) ? body.images : [])
    .filter((u): u is string => typeof u === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(u) && u.length < 2_000_000)
    .slice(0, 8);
  let somaImg = 0;
  const imagensOk = imagens.filter((u) => { somaImg += u.length; return somaImg <= 3_200_000; });
  const pageCount = body.pageCount || imagensOk.length || 0;
  const modelRaw = body.model || "gpt-4o-mini";

                                                                                         
                                                                                                      
  const personaBlock = (() => {
    const parts: string[] = [];
                                                                                                    
                                                                                                      
                                                              
    if (body.globalTextPrompt && body.globalTextPrompt.trim()) {
      parts.push(`GLOBAL TEXT DIRECTIVE (dashboard, base instructions for ALL site copy; complements the rules above):\n${body.globalTextPrompt.trim().slice(0, 1500)}`);
    }
    if (body.referenceNotes && body.referenceNotes.trim()) {
      parts.push(`REFERENCE MATERIAL (the brand's own voice rules and method, follow this voice closely, do not quote verbatim):\n${body.referenceNotes.trim().slice(0, 4000)}`);
    }
    if (body.safeguards && body.safeguards.trim()) {
      parts.push(`SAFEGUARDS (hard rules, the copy must never violate these):\n${body.safeguards.trim().slice(0, 600)}`);
    }
    if (body.brandPersona) {
      const bp = body.brandPersona;
      parts.push(`BRAND PERSONA (dashboard, override on conflict with base voice rules):
- Title: ${bp.title || ", "}
- Tonality: ${bp.tonality || ", "}
- Avoid: ${bp.avoid || ", "}
- Keywords: ${bp.keywords || ", "}
- Visual ref: ${bp.visualRef || ", "}
- Custom voice prompt:
${(bp.prompt || ", ").slice(0, 1500)}`);
    }
    if (body.buyerPersona) {
      const bup = body.buyerPersona;
      parts.push(`BUYER PERSONA (target audience the description must resonate with):
- Title: ${bup.title || ", "}
- Tonality (audience expects): ${bup.tonality || ", "}
- Avoid (audience rejects): ${bup.avoid || ", "}
- Keywords (audience values): ${bup.keywords || ", "}
- Custom buyer prompt:
${(bup.prompt || ", ").slice(0, 1500)}`);
    }
    if (Array.isArray(body.knowledge) && body.knowledge.length > 0) {
      const merged = body.knowledge.join("\n---\n").slice(0, 3000);
      parts.push(`KNOWLEDGE BASE (extra brand docs, treat as authoritative on factual claims):\n${merged}`);
    }
    return parts.length > 0 ? `\n\n──────────\n${parts.join("\n\n")}\n──────────\n` : "";
  })();

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
    }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }

  const userPrompt = `Filename: ${filename}
Page count: ${pageCount}
${imagensOk.length ? `Attached: ${imagensOk.length} image(s) of the project. READ them (visible copy, logos, medium, design language); they are as authoritative as the text.` : ""}
Extracted text (truncated to 30k chars):

${text || (imagensOk.length ? "[no text layer, work from the attached images and the filename]" : "[empty / unreadable text, infer from filename]")}
${personaBlock}
Return JSON object as specified in system prompt. The BRAND PERSONA block (if present) overrides the default voice rules where they conflict. The BUYER PERSONA block tells you who the description must speak to.`;

  try {
    let raw: string | null = null;
    try {
      raw = provider === "openai"
        ? await callOpenAI({ apiKey, model: modelId, userPrompt, images: imagensOk })
        : await callAnthropic({ apiKey, model: modelId, userPrompt, images: imagensOk });
    } catch (primaryErr) {
                                                                                                   
      const msg = String((primaryErr as Error)?.message || primaryErr);
      const st = /(?:OpenAI|Anthropic) (\d{3})/.exec(msg)?.[1];
      const recoverable = !st || st === "429" || st.startsWith("5");
      const altKey = provider === "openai" ? envKey.ANTHROPIC_API_KEY : envKey.OPENAI_API_KEY;
      if (!recoverable || !altKey) throw primaryErr;
      raw = provider === "openai"
        ? await callAnthropic({ apiKey: altKey, model: "claude-haiku-4-5-20251001", userPrompt, images: imagensOk })
        : await callOpenAI({ apiKey: altKey, model: "gpt-4o-mini", userPrompt, images: imagensOk });
    }
    if (!raw) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
                                                            
    let jsonStr = raw;
    const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]+?)\n?```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    let parsed: any;
    try { parsed = JSON.parse(jsonStr); } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", raw: jsonStr.slice(0, 500) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
                          
    const VALID_CATS = new Set([
      "branding","campagne","film","digital","editorial","ooh","social",
      "motion_graphics","brand_activation","marketing_consulting","ai_automation",
      "system","website","marketing_360","digital_marketing","inbound_marketing",
      "mobile_app","modeling_3d","ai_modeling","live_action_film","ai_film",
      "ai_image_manipulation","photography","ui_ux_design",
    ]);
    const VALID_TEAM = new Set(["tm-1","tm-2","tm-3","tm-4","tm-5","tm-6","tm-7"]);
                                                                                                             
    const sanitizeKw = (kw: string): string => {
      return String(kw)
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")                      
        .replace(/[^a-z0-9]+/g, "-")                                        
        .replace(/^-+|-+$/g, "")                       
        .slice(0, 30);
    };
    const failIncomplete = (field: string, detail: string) => new Response(JSON.stringify({
      error: "AI returned incomplete project analysis",
      field,
      detail,
    }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });

    const detectedLang = typeof parsed.language === "string" ? parsed.language : "fr";
    const cats = Array.isArray(parsed.categories) ? parsed.categories.filter((c: string) => VALID_CATS.has(c)) : [];
    if (cats.length === 0) {
      return failIncomplete("categories", "The AI did not return any valid project categories.");
    }

                                                                        
    const rawService = typeof parsed.serviceName === "string" ? parsed.serviceName.trim() : "";
    const rawClient = typeof parsed.clientName === "string" ? parsed.clientName.trim() : "";
    const composedTitle = rawService.length > 0 && rawClient.length > 0 ? `${rawService} ${rawClient}`.slice(0, 60).trim() : "";

    const rawTitle = typeof parsed.title === "string" ? parsed.title.trim() : "";
                                                                                              
    const titleHasFormat = rawTitle.split(/\s+/).length >= 2 && rawTitle.length >= 5;
    const finalTitle = (rawTitle.length > 0 && titleHasFormat) ? rawTitle.slice(0, 60) : composedTitle;
    if (finalTitle.split(/\s+/).length < 2 || finalTitle.length < 5) {
      return failIncomplete("title", "The AI did not return a usable project title.");
    }

    const rawDesc = typeof parsed.description === "string" ? parsed.description.trim() : "";
    if (rawDesc.length < 200) {
      return failIncomplete("description", "The AI description was missing or too short.");
    }
    const suggestedTeam = Array.isArray(parsed.suggestedTeam) ? parsed.suggestedTeam.filter((t: string) => VALID_TEAM.has(t)).slice(0, 4) : [];
    if (suggestedTeam.length === 0) {
      return failIncomplete("suggestedTeam", "The AI did not select a valid creative team member.");
    }

                                                                         
                                                                          
    const smartCut = (text: string, maxLen: number): string => {
      if (text.length <= maxLen) return text;
      const slice = text.slice(0, maxLen);
                                                                         
      const lastSentenceEnd = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("\n\n")
      );
      if (lastSentenceEnd > maxLen * 0.6) return slice.slice(0, lastSentenceEnd + 1);
                                                                    
      const lastSpace = slice.lastIndexOf(" ");
      return lastSpace > maxLen * 0.7 ? slice.slice(0, lastSpace) + "…" : slice + "…";
    };
                                                                              
                                                         
    const finalDesc = smartCut(rawDesc, 580);

    const result = {
      title: finalTitle,
      description: finalDesc,
                                                                                                        
                                                                                                           
      clientName: rawClient || undefined,
      serviceName: rawService || undefined,
      categories: cats.slice(0, 3),
      suggestedTeam,
      language: detectedLang,
      seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords.map(sanitizeKw).filter((k: string) => k.length >= 3).slice(0, 5) : [],
    };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: "analysis failed",
      detail: String(err?.message || err).slice(0, 300),
    }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
