   
                                                                                     
  
                                                                               
                                                                                       
                                                                          
                                                                             
  
                                                                   
                                
   

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([
  "https://abil.ch", "https://www.abil.ch", "https://abil-site.vercel.app",
  "http://localhost:5173", "http://localhost:4173", "http://localhost:5180", "http://localhost:5182",
]);
const VERCEL_AUTO_DEPLOY_RE = /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/;
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && (ALLOWED_ORIGINS.has(origin) || VERCEL_AUTO_DEPLOY_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-abil-admin",
    "Vary": "Origin",
  };
}

const SYSTEM_PROMPT = `És Devil's Advocate adversarial do agente superadmin da ABiL.
Recebes uma acção que o agente PROPÕE executar (edit_site_text, send_email, generate_quote,
delete_*, archive_*). Atacas-a tecnicamente, 3-5 objecções fundamentadas que o agente pode
não ter considerado.

Aplica:
- Anti-presunção: pode ser engano? assume errado e procura sinais.
- Anti-dispersão: a acção desvia do que o utilizador realmente quer?
- Robustez > paliativo: a acção resolve o problema raiz ou faz cosmética?
- Reversibilidade: se for irreversível e mal executada, qual o custo?

Categorias de objecção: tecnica · governance · risco · escopo · trade-off · longevidade

Output JSON estrito (sem markdown, sem cercas):
{
  "verdict": "ROBUSTA" | "ACEITÁVEL_COM_AJUSTES" | "FRACA" | "INADEQUADA",
  "confidence_in_action_pct": 0-100,
  "objections": [
    { "id": "O1", "category": "tecnica|governance|risco|escopo|trade-off|longevidade",
      "severity": "ALTA|MEDIA|BAIXA", "objection": "explicação clara",
      "consequence_if_ignored": "o que pode acontecer" }
  ],
  "alternatives": [
    { "id": "A1", "alternative": "...", "trade_off": "ganha X perde Y", "robustness": "MAIS|IGUAL|MENOS" }
  ],
  "recommendation": "ACEITAR" | "ACEITAR_COM_AJUSTES" | "EXIGIR_REVISAO" | "REJEITAR_PROPOR_ALTERNATIVA",
  "rationale": "1-3 frases sintéticas"
}

Regras:
- Sem complacência (ataca como adversário sério).
- Sem strawman (ataca o melhor caso da proposta).
- 3-5 objecções de qualidade > 10 superficiais.
- 1-2 alternativas concretas se EXIGIR_REVISAO ou REJEITAR.`;

type ChatMsg = { role: "user" | "assistant"; content: string };

async function callAnthropic(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
                                                                          
                                                                                       
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 14000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-api-key": args.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: args.model, system: args.system, max_tokens: 1300, temperature: 0.5,
        messages: args.messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    clearTimeout(tid);
    if (!res.ok) { const e = await res.text().catch(() => ""); throw new Error(`Anthropic ${res.status}: ${e.slice(0, 200)}`); }
    const data: any = await res.json();
    return data?.content?.[0]?.text || null;
  } catch (err) { clearTimeout(tid); throw err; }
}
async function callOpenAI(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
                                                                                     
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: args.model, temperature: 0.4, max_tokens: 1300,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: args.system }, ...args.messages],
      }),
    });
    clearTimeout(tid);
    if (!res.ok) { const e = await res.text().catch(() => ""); throw new Error(`OpenAI ${res.status}: ${e.slice(0, 200)}`); }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) { clearTimeout(tid); throw err; }
}

function parseJson(raw: string): any {
  let text = raw.trim();
  if (text.includes("```json")) {
    const s = text.indexOf("```json") + 7;
    const e = text.indexOf("```", s);
    if (e > s) text = text.slice(s, e).trim();
  } else if (text.includes("```")) {
    const s = text.indexOf("```") + 3;
    const e = text.indexOf("```", s);
    if (e > s) text = text.slice(s, e).trim();
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) text = m[0];
  try { return JSON.parse(text); } catch { return null; }
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
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });

  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }

  const actionType = String(body?.actionType || "").trim();
  const params = body?.params || {};
  const context = body?.context || {};
  if (!actionType) return new Response(JSON.stringify({ error: "actionType required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const hasAnthropic = !!env.ANTHROPIC_API_KEY, hasOpenAI = !!env.OPENAI_API_KEY;
  if (!hasAnthropic && !hasOpenAI) return new Response(JSON.stringify({ error: "no LLM provider configured" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });

  const userPrompt = `ACÇÃO PROPOSTA: ${actionType}
PARAMS: ${JSON.stringify(params).slice(0, 1500)}
CONTEXTO: brand=${context.brand || "abil"} module=${context.currentModule || "?"} user_message="${(context.userMessage || "").slice(0, 300)}"
${context.personaSummary ? `PERSONA: ${String(context.personaSummary).slice(0, 400)}` : ""}

Apresenta 3-5 objecções fundamentadas + 1-2 alternativas + veredito. JSON estrito.`;

  let raw: string | null;
  let provider = "anthropic";
  try {
    if (hasAnthropic) {
      raw = await callAnthropic({ apiKey: env.ANTHROPIC_API_KEY!, model: "claude-haiku-4-5-20251001", system: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt }] });
    } else {
      provider = "openai";
      raw = await callOpenAI({ apiKey: env.OPENAI_API_KEY!, model: "gpt-4o-mini", system: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt }] });
    }
  } catch (e: any) {
                                 
    try {
      if (provider === "anthropic" && hasOpenAI) {
        provider = "openai-fallback";
        raw = await callOpenAI({ apiKey: env.OPENAI_API_KEY!, model: "gpt-4o-mini", system: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt }] });
      } else {
        throw e;
      }
    } catch (e2: any) {
      return new Response(JSON.stringify({ error: String(e2?.message || e2).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
  }

  const parsed = raw ? parseJson(raw) : null;
  if (!parsed) return new Response(JSON.stringify({ error: "could not parse LLM JSON", raw: (raw || "").slice(0, 400) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });

                       
  try {
    const promptLen = SYSTEM_PROMPT.length + userPrompt.length;
    const compLen = (raw || "").length;
    const url = new URL(req.url);
    const modelUsed = provider.startsWith("anthropic") ? "claude-haiku-4-5-20251001" : "gpt-4o-mini";
    fetch(`${url.protocol}//${url.host}/api/agent-cost?action=log`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": req.headers.get("x-abil-admin") || "" },
      body: JSON.stringify({ provider, model: modelUsed, prompt_tokens: Math.ceil(promptLen / 4), completion_tokens: Math.ceil(compLen / 4), endpoint: "agent-contest", brand: context.brand }),
    }).catch(() => {});
  } catch {            }

  return new Response(JSON.stringify({ ok: true, provider, contest: parsed }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
}
