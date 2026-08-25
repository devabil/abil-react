   
                                                                   
  
                                                                            
                                                                                  
                                                                           
                                    
  
                                                                        
                                                                          
                                                                     
                                                                   
                                                            
                                                        
  
                                                              
                                
   

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

const SYSTEM_PROMPT = `És meta-auditor do agente superadmin da ABiL.
Recebes o RESULTADO de uma acção executada (edit_site_text, send_email, generate_quote,
create_blog_post, create_social_post, archive_*) e validas 6 dimensões V1-V6.

PROTOCOLO OICA:
- Observação: o que foi pedido vs o que foi feito (literal)?
- Interpretação: o resultado cumpre a INTENÇÃO (não só a letra)?
- Correlação: a prova apresentada bate com o pedido?
- Aplicação: vereditar com calibração honesta (admite INSUFICIENTE)

V1, Objectivo atingido (action.result bate com pedido literal?)
V2, Escopo respeitado (não tocou em mais nada, apenas no que foi pedido)
V3, Prova real adequada (há evidência concreta? URL, ID, status, texto literal?)
V4, Reversibilidade preservada (existe audit trail / forma de desfazer?)
V5, Persona/voz respeitada (output bate com a voz da marca?)
V6, Risco residual (efeitos colaterais não óbvios? SPAM? leak de PII?)

Output JSON estrito (sem markdown):
{
  "verdict": "APROVADO" | "PARCIAL" | "INCORRETO" | "REGRESSÃO" | "INSUFICIENTE",
  "severity": "BAIXA" | "MEDIA" | "ALTA" | "CRITICA",
  "confidence": "ALTA" | "MEDIA" | "BAIXA",
  "rationale": "explicação curta (2-4 frases)",
  "findings": {
    "V1_objective": "PASS | FAIL: motivo | INSUFICIENTE: razão",
    "V2_scope": "...",
    "V3_real_proof": "...",
    "V4_reversible": "...",
    "V5_voice": "...",
    "V6_residual_risk": "..."
  },
  "recommendation": "ACEITAR" | "PEDIR_COMPLEMENTO" | "REVERTER" | "ESCALAR",
  "evidence": ["fragmento1 literal", "fragmento2"],
  "what_would_change_verdict": "o que faria mudar para APROVADO"
}

Regras: empírico não narrativo. Cita literais. Admite INSUFICIENTE. Confiança calibrada
(ALTA só com evidência directa). Não inventes.`;

type ChatMsg = { role: "user" | "assistant"; content: string };

async function callAnthropic(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-api-key": args.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: args.model, system: args.system, max_tokens: 1400, temperature: 0.3,
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
  const tid = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: args.model, temperature: 0.3, max_tokens: 1200,
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
  const result = String(body?.result || "").slice(0, 2000);
  const userMessage = String(body?.userMessage || "").slice(0, 600);
  const context = body?.context || {};
  if (!actionType || !result) return new Response(JSON.stringify({ error: "actionType + result required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const hasAnthropic = !!env.ANTHROPIC_API_KEY, hasOpenAI = !!env.OPENAI_API_KEY;
  if (!hasAnthropic && !hasOpenAI) return new Response(JSON.stringify({ error: "no LLM provider configured" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });

  const userPrompt = `AUDITAR ESTA EXECUÇÃO conforme V1-V6:

USER DISSE: "${userMessage}"

ACÇÃO EXECUTADA: ${actionType}
PARAMS: ${JSON.stringify(params).slice(0, 1500)}
RESULT (output do executor): ${result}

CONTEXTO: brand=${context.brand || "abil"} module=${context.currentModule || "?"}
${context.personaSummary ? `PERSONA: ${String(context.personaSummary).slice(0, 300)}` : ""}

Retorna JSON estrito com veredito + findings V1-V6 + recomendação.`;

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
      } else { throw e; }
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
      body: JSON.stringify({ provider, model: modelUsed, prompt_tokens: Math.ceil(promptLen / 4), completion_tokens: Math.ceil(compLen / 4), endpoint: "agent-audit", brand: context.brand }),
    }).catch(() => {});
  } catch {            }

  return new Response(JSON.stringify({ ok: true, provider, audit: parsed }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
}
