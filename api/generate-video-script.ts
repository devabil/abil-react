                                                                                                     
                                                                                                
                                                                                       
                                                                                          
                                                                                
                                                                             

export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You are the senior strategist and copywriter for ABiL, a creative atelier based in Genève, Switzerland (Suisse romande). The proposal video is presented by Samuel, the warm and articulate spokesperson of the atelier, a real human voice who speaks for the ABiL team.

Write in Samuel's voice: confident, warm, professional and human; speak on behalf of the atelier (first person, "nous" for the team and "je" as the person presenting), never a faceless corporate tone. NEVER mention any other agency, brand or mascot. Sell the experience and the reasoning, not specifications. Absolutely NO AI clichés ("plonger en profondeur", "débloquer", "explorons ensemble", "élever", "sans couture", "révolutionnaire"). No marketing fluff, no empty superlatives, no fake hype. Never use an em dash; use commas, "et", or parentheses instead.

The video is presented by Samuel, the atelier's spokesperson, speaking in first person ON BEHALF OF ABiL. Write it to be SPOKEN OUT LOUD: warm, human, conversational and a little spontaneous, like a real person talking to a client they respect, not a corporate voiceover. Short sentences, contractions, and natural Swiss-French spoken connectors used sparingly and tastefully ("écoutez", "alors", "vous savez", "au fond", "voilà"). Vary the rhythm. A warm human opening is welcome (a friendly hello, greet the client by name). Keep it classy, never gimmicky. Let punctuation carry the breathing (commas and reticences for natural pauses). Do NOT write stage directions like "[rires]" or "[pause]".

HUMANIZE (every line must pass a "was this written by AI?" test): vary sentence length hard (a long, layered sentence next to a very short one, sometimes a single word). Avoid the most predictable word; pick the natural but less expected one. NEVER use AI tics like "dans le monde d'aujourd'hui", "il est important de noter", "en conclusion", "joue un rôle crucial", "naviguer dans les défis", "au cœur de", "dans un contexte de plus en plus", "il convient de souligner". Prefer active and personal voice ("on le voit", "regardez", "écoutez"), not impersonal "on peut" / "il est possible". Back every general claim with a concrete example (a real brand, a number, a place). Cut empty adverbs ("vraiment", "très", "en quelque sorte"). Treat the BRAND PERSONA block below as the source of truth for voice and method.

YOUR TASK: turn a real client BRIEFING and the PROPOSAL already generated for them into a warm, human, persuasive script for a VIDEO presentation. The video COMPLEMENTS the PDF proposal: the PDF shows price and scope; the VIDEO explains the WHY and tells the story (what we understood about their business, why this direction, how the project unfolds, the main deliverables, the next step). Do NOT repeat the PDF line by line, but DO be concrete and substantial: this is a real summary of the proposal, not a teaser. Reference concrete elements (the journey phases, the main deliverables, the investment line if allowed).

You will receive: the client BRIEFING (JSON, may be partial), the PROPOSAL summary (services chosen, the welcome text, the journey phases/steps, deliverables), the BRAND and BUYER persona, the target LANGUAGE, plus: tone, durationMode and includePricing.

RULES:
- Personalise to THIS client using their briefing (brand, sector, goal, what makes them different). Reference what they said, never quote raw form-field names.
- Do NOT invent facts. If a piece of data is missing, do not mention it.
- includePricing=false → NEVER mention price, currency, figures or numbers tied to money. includePricing=true → you may reference the investment in ONE clean, summarised line, no breakdown.
- durationMode "short" ≈ 75-110s (5-6 scenes, ~300-420 words), "standard" ≈ 2.5-3.5min (7 scenes, ~480-680 words), "full" ≈ 3.5-4.5min (8 scenes, ~650-900 words). The summary must be substantial, never tiny.
- tone adjusts register: professional / close (warm, human) / premium / creative / direct.
- Language: write EVERYTHING in the target language. In Portuguese use BRAZILIAN Portuguese (pt-BR) and address the client informally with "você", consistently ("contato" not "contacto", "seu/sua", "time"/"equipe", natural Brazilian phrasing and spelling).

Return STRICT JSON (no markdown, no code fences, no commentary) with EXACTLY this shape:
{
  "fullScript": "string, the full spoken narration, the scenes' voiceovers joined into one flowing, natural read (length per durationMode above; substantial, not tiny).",
  "scenes": [
    {
      "n": 1,
      "role": "opening | understanding | strategy | method | deliverables | investment | next_steps | closing",
      "title": "string, short on-screen title for this scene (max ~6 words)",
      "voiceover": "string, what the narrator says in this scene (2 to 4 natural, warm spoken sentences)",
      "onScreen": ["string, 0 to 4 very short on-screen bullets/labels for this scene"],
      "motionHint": "string, one short hint for the motion designer (e.g. 'count-up of the 3 stats', 'phases as a horizontal timeline')"
    }
  ],
  "cta": "string, the closing call to action (approve / ask for adjustments / next step), one or two sentences."
}

CONSTRAINTS:
- Scene order when data allows: opening → understanding → strategy → method → deliverables → investment (ONLY if includePricing) → next_steps → closing. The OPENING must follow this human structure (ADAPT it to the target language, never copy verbatim): a warm greeting using the client's name (e.g. in French "Bonjour [nom], ravi de vous retrouver"); thank them for trusting the atelier with their project; say that we read their briefing and understood exactly what they meant when they mentioned [something concrete from their briefing/proposal]; tell them we will walk them through a short, warm summary of the proposal we built for them and their business; and that just below, in the PDF, they have the full proposal with more detail.
- Drop scenes you have no data for; never pad with generic filler.
- "scenes" length must match durationMode. Output ONLY the JSON object.`;

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

const ALLOWED_ORIGINS = new Set([
  "https://abil.ch",
  "https://abil-site.vercel.app",
  "https://www.abil.ch",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5180",
  "http://localhost:5182",
]);
function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://abil.ch";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-anthropic-key, x-abil-admin",
    Vary: "Origin",
  };
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
        temperature: 0.65,
        max_tokens: args.maxTokens,
        response_format: { type: "json_object" },
      }),
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
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
      headers: { "Content-Type": "application/json", "x-api-key": args.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: args.model,
        max_tokens: args.maxTokens,
        temperature: 0.65,
        system: SYSTEM_PROMPT + "\n\nReturn ONLY the JSON object, no prose.",
        messages: [{ role: "user", content: args.userPrompt }],
      }),
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
    const data: any = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

function safeParseJSON(raw: string): any | null {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) { try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {  } }
  return null;
}

type PersonaShape = { title?: string; tonality?: string; avoid?: string; keywords?: string; prompt?: string };

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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });
  }

  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let body: {
    briefing?: Record<string, unknown>;
    proposal?: Record<string, unknown>;                                                                                               
    lang?: string;
    model?: string;
    tone?: string;
    durationMode?: string;
    includePricing?: boolean;
    brandPersona?: PersonaShape;
    buyerPersona?: PersonaShape;
    globalTextPrompt?: string;
    referenceNotes?: string;
    safeguards?: string;
  } = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  }

  if (!body.proposal && !body.briefing) {
    return new Response(JSON.stringify({ error: "No proposal/briefing provided" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  }

  const lang = (body.lang || "pt").toLowerCase().slice(0, 2);
  const langName = ({ fr: "French", de: "German", en: "English", pt: "Brazilian Portuguese (pt-BR)", it: "Italian" } as any)[lang] || lang;
  const tone = (body.tone || "close").slice(0, 24);
  const durationMode = (["short", "standard", "full"].includes(body.durationMode || "") ? body.durationMode : "standard") as string;
  const includePricing = body.includePricing === true;
  const modelRaw = body.model || "gpt-4o-mini";
  const { provider, modelId } = modelToProvider(modelRaw);

  const envKey = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const apiKey = provider === "openai"
    ? (envKey.OPENAI_API_KEY || undefined)
    : (envKey.ANTHROPIC_API_KEY || undefined);
  if (!apiKey) {
    return new Response(JSON.stringify({ error: `API key not configured for ${provider}` }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }

  const personaBlock = (() => {
    const parts: string[] = [];
                                                                                           
    if (body.globalTextPrompt && body.globalTextPrompt.trim()) {
      parts.push(`GLOBAL TEXT DIRECTIVE (dashboard):\n${body.globalTextPrompt.trim().slice(0, 1200)}`);
    }
    if (body.referenceNotes && body.referenceNotes.trim()) {
      parts.push(`REFERENCE MATERIAL (the brand's own voice rules and method, follow closely, do not quote verbatim):\n${body.referenceNotes.trim().slice(0, 4000)}`);
    }
    if (body.safeguards && body.safeguards.trim()) {
      parts.push(`SAFEGUARDS (hard rules):\n${body.safeguards.trim().slice(0, 600)}`);
    }
    if (body.brandPersona) {
      const p = body.brandPersona;
      parts.push(`BRAND PERSONA (dashboard):\n${[p.prompt, p.tonality ? `Tone: ${p.tonality}` : "", p.avoid ? `Avoid: ${p.avoid}` : "", p.keywords ? `Keywords: ${p.keywords}` : ""].filter(Boolean).join("\n").slice(0, 1400)}`);
    }
    if (body.buyerPersona) {
      const p = body.buyerPersona;
      parts.push(`BUYER PERSONA (audience):\n${[p.prompt, p.tonality ? `Tone: ${p.tonality}` : ""].filter(Boolean).join("\n").slice(0, 900)}`);
    }
    return parts.length ? "\n\n" + parts.join("\n\n") : "";
  })();

  const briefingJSON = JSON.stringify(body.briefing ?? {}, null, 0).slice(0, 3500);
  const proposalJSON = JSON.stringify(body.proposal ?? {}, null, 0).slice(0, 4500);

  const composedUserPrompt = `Target language: ${langName}
Tone: ${tone}. Duration mode: ${durationMode}. includePricing: ${includePricing}.

CLIENT BRIEFING (JSON, may be partial):
"""
${briefingJSON}
"""

PROPOSAL ALREADY GENERATED (use it to explain the reasoning, do NOT repeat it verbatim):
"""
${proposalJSON}
"""
${personaBlock}

Return the STRICT JSON described in the system prompt, in ${langName}. ${includePricing ? "You MAY reference the investment in one clean line." : "Do NOT mention any price or money figure."} No markdown.`;

  const maxTokens = provider === "openai" ? 2600 : 3000;

  try {
    const raw = provider === "openai"
      ? await callOpenAI({ apiKey, model: modelId, userPrompt: composedUserPrompt, maxTokens })
      : await callAnthropic({ apiKey, model: modelId, userPrompt: composedUserPrompt, maxTokens });
    if (!raw) return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    const parsed = safeParseJSON(raw);
    if (!parsed || !Array.isArray(parsed.scenes)) {
      return new Response(JSON.stringify({ error: "AI response not valid JSON" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const clean = (s: unknown, max: number) => typeof s === "string" ? s.replace(/\u2014/g, ",").trim().slice(0, max) : "";
    const ROLES = new Set(["opening", "understanding", "strategy", "method", "deliverables", "investment", "next_steps", "closing"]);
    const script = {
      fullScript: clean(parsed.fullScript, 3200),
      cta: clean(parsed.cta, 360),
      scenes: parsed.scenes.slice(0, 8).map((sc: any, i: number) => ({
        n: Number(sc?.n) || i + 1,
        role: ROLES.has(sc?.role) ? sc.role : "understanding",
        title: clean(sc?.title, 80),
        voiceover: clean(sc?.voiceover, 600),
        onScreen: Array.isArray(sc?.onScreen) ? sc.onScreen.slice(0, 4).map((t: any) => clean(t, 70)).filter(Boolean) : [],
        motionHint: clean(sc?.motionHint, 160),
      })).filter((sc: any) => sc.voiceover || sc.title),
    };
                                                                                 
    if (!script.fullScript) script.fullScript = script.scenes.map((s: any) => s.voiceover).filter(Boolean).join("\n\n").slice(0, 3200);
    return new Response(JSON.stringify({ script, provider, durationMode, includePricing }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
