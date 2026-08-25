   
                                                           
  
                                                                            
                                                                      
  
                
                                                                             
                                                                              
                                                                
  
                                                                  
                                   
  
                                                                             
   

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
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-abil-admin",
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
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });

  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }

  const imageUrl = String(body?.imageUrl || "").trim();
  const imageBase64 = String(body?.imageBase64 || "").trim();
  const instruction = String(body?.instruction || "Descreve esta imagem em detalhe.").slice(0, 1000);
  const brand = String(body?.brand || "abil");
  const imageSource = imageBase64 || imageUrl;
  if (!imageSource) return new Response(JSON.stringify({ error: "imageUrl or imageBase64 required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const apiKey = env.OPENAI_API_KEY || "";
  if (!apiKey) return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });

                                              
                                                                                                           
                                                                                                        
  let personaHint = "";
  try {
    const p = body?.persona || {};
    const bp = p.brandPersona;
    const bits = [
      bp?.tonality ? `Tom: ${String(bp.tonality).slice(0, 300)}` : "",
      bp?.avoid ? `Evitar: ${String(bp.avoid).slice(0, 200)}` : "",
      bp?.keywords ? `Palavras-chave: ${String(bp.keywords).slice(0, 200)}` : "",
      bp?.prompt ? `Essência: ${String(bp.prompt).slice(0, 500)}` : "",
      bp?.visualRef ? `Referência visual: ${String(bp.visualRef).slice(0, 300)}` : "",
      p.referenceNotes ? `Regras de voz e método: ${String(p.referenceNotes).slice(0, 900)}` : "",
      p.globalImagePrompt ? `Direção de arte global: ${String(p.globalImagePrompt).slice(0, 400)}` : "",
    ].filter(Boolean);
    if (bits.length) personaHint = `\n\nCONTEXTO DA MARCA (${brand}):\n${bits.join("\n")}`;
  } catch {  }

  const systemPrompt = `És o copiloto visual do atelier ABiL. Analisas imagens com olho
de director criativo: composição, luz, cor, tipografia, alinhamento com a marca, e dás
feedback accionável e honesto. Responde na língua do utilizador, conciso e útil.${personaHint}`;

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 30000);
  let raw: string | null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 900,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: instruction },
            { type: "image_url", image_url: { url: imageSource, detail: "auto" } },
          ] },
        ],
      }),
    });
    clearTimeout(tid);
    if (!res.ok) { const e = await res.text().catch(() => ""); return new Response(JSON.stringify({ error: `OpenAI ${res.status}: ${e.slice(0, 200)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } }); }
    const data: any = await res.json();
    raw = data?.choices?.[0]?.message?.content || null;
  } catch (e: any) {
    clearTimeout(tid);
    return new Response(JSON.stringify({ error: String(e?.message || e).slice(0, 200) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
  if (!raw) return new Response(JSON.stringify({ error: "empty response" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });

                                                                        
  try {
    const url = new URL(req.url);
    fetch(`${url.protocol}//${url.host}/api/agent-cost?action=log`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": req.headers.get("x-abil-admin") || "" },
      body: JSON.stringify({ provider: "openai", model: "gpt-4o", prompt_tokens: 800 + Math.ceil((systemPrompt.length + instruction.length) / 4), completion_tokens: Math.ceil(raw.length / 4), endpoint: "agent-vision", brand }),
    }).catch(() => {});
  } catch {       }

  return new Response(JSON.stringify({ ok: true, provider: "openai", analysis: raw }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
}
