                                                                                           
                                                                                                       
  
                                            
                                                                                                             
                                                                                                          
                                                                                                       
                                                                                                                    
                                          
  
                                                                  
                                                                                                  

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([
  "https://abil.ch",
  "https://www.abil.ch",
  "https://abil-site.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5180",
  "http://localhost:5182",
]);
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && ALLOWED_ORIGINS.has(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-anthropic-key, x-abil-admin",
    "Vary": "Origin",
  };
}

function b64urlToText(data: string): string {
  try {
    const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch { return ""; }
}
function stripHtml(s: string): string {
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim();
}
function findPart(payload: any, mime: string): string | null {
  if (!payload) return null;
  if (payload.mimeType === mime && payload.body?.data) return payload.body.data;
  if (Array.isArray(payload.parts)) for (const p of payload.parts) { const r = findPart(p, mime); if (r) return r; }
  return null;
}
function getBody(payload: any): string {
  const plain = findPart(payload, "text/plain");
  if (plain) return b64urlToText(plain).trim();
  const html = findPart(payload, "text/html");
  if (html) return stripHtml(b64urlToText(html)).trim();
  if (payload?.body?.data) return b64urlToText(payload.body.data).trim();
  return "";
}
function header(headers: any[], name: string): string {
  const h = (headers || []).find((x) => (x.name || "").toLowerCase() === name.toLowerCase());
  return h?.value || "";
}
function parseFromEmail(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).trim().toLowerCase();
}

async function classify(items: { i: number; from: string; subject: string; snippet: string }[], apiKey: string): Promise<Record<number, { isRequest: boolean; reason: string }>> {
  const out: Record<number, { isRequest: boolean; reason: string }> = {};
  try {
    const sys = `You triage an inbox for a creative atelier (ABiL, Genève). Decide if each email is a REAL inbound CLIENT REQUEST: a specific person or company asking OUR atelier to do a project for THEM (branding, design, web, video, social, labels, etc.), or asking us for a quote/proposal where WE are the supplier they want to hire.

Mark isRequest=FALSE for everything else: newsletters, invoices/receipts, system/account notifications, no-reply/automated mail, platform notifications, internal/personal mail, marketing, AND freelance job-board postings (those are job ads where WE would be the applicant, NOT a client hiring us). When in doubt, mark false.

Return STRICT JSON: {"items":[{"i":<index>,"isRequest":true|false,"reason":"<=8 words in French"}]} for every index given. No prose.`;
    const user = "Emails:\n" + items.map((e) => `[${e.i}] De: ${e.from} | Objet: ${e.subject} | ${e.snippet}`).join("\n");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0, max_tokens: 900, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
    });
    if (!res.ok) return out;
    const data: any = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    if (Array.isArray(parsed.items)) for (const it of parsed.items) {
      const i = Number(it.i);
      if (!isNaN(i)) out[i] = { isRequest: !!it.isRequest, reason: String(it.reason || "").slice(0, 80) };
    }
  } catch {  }
  return out;
}

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });
  }

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
                                                                                            
  { const _pw = env.ABIL_ADMIN_AUTH_SECRET || "", _t = req.headers.get("x-abil-admin") || "", _d = _t.indexOf("."); let _ok = false;
    if (_pw && _d > 0 && /^\d+$/.test(_t.slice(0, _d)) && Date.now() <= Number(_t.slice(0, _d))) {
      try { const _k = await crypto.subtle.importKey("raw", new TextEncoder().encode(_pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const _g = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", _k, new TextEncoder().encode(_t.slice(0, _d))))).map((b) => b.toString(16).padStart(2, "0")).join(""); _ok = _t.slice(_d + 1) === _g; } catch { _ok = false; } }
    if (!_ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } }); }

                                                                                                         
                                                                                                            
                                                                                                   
  const clientId = env.GOOGLE_CLIENT_ID, clientSecret = env.GOOGLE_CLIENT_SECRET, refreshToken = env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
                                                                                   
    return new Response(JSON.stringify({ emails: [], count: 0, notConnected: true, message: "Caixa de e-mail ainda não ligada. Faltam GOOGLE_CLIENT_ID/SECRET ou GMAIL_REFRESH_TOKEN nas variáveis do projeto." }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let max = 12;
  try { if (req.method === "POST") { const b = await req.json().catch(() => ({})); if (b && Number(b.max)) max = Math.min(25, Math.max(1, Number(b.max))); } } catch {  }

  try {
    const tokRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString(),
    });
    if (!tokRes.ok) {
      const e = await tokRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Falha ao renovar o token Google: ${tokRes.status} ${e.slice(0, 160)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const accessToken = (await tokRes.json())?.access_token;
    if (!accessToken) return new Response(JSON.stringify({ error: "Sem access_token" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    const gh = { Authorization: `Bearer ${accessToken}` };

    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&q=${encodeURIComponent("in:inbox newer_than:60d")}`, { headers: gh });
    if (!listRes.ok) {
      const e = await listRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Falha a listar Gmail: ${listRes.status} ${e.slice(0, 160)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const ids: { id: string }[] = (await listRes.json())?.messages || [];

    const emails = await Promise.all(ids.slice(0, max).map(async (m) => {
      try {
        const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, { headers: gh });
        if (!r.ok) return null;
        const msg: any = await r.json();
        const hs = msg.payload?.headers || [];
        const from = header(hs, "From");
        const body = getBody(msg.payload).slice(0, 4000);
        return {
          id: m.id,
          threadId: msg.threadId,
          messageId: header(hs, "Message-ID"),
          from,
          fromEmail: parseFromEmail(from),
          subject: header(hs, "Subject"),
          date: header(hs, "Date"),
          snippet: (msg.snippet || "").slice(0, 220),
          body,
        };
      } catch { return null; }
    }));
    const list = emails.filter(Boolean) as any[];

    const apiKey = env.OPENAI_API_KEY || "";
    if (apiKey && list.length) {
      const cls = await classify(list.map((e, i) => ({ i, from: e.fromEmail, subject: e.subject, snippet: e.snippet })), apiKey);
      list.forEach((e, i) => { const c = cls[i]; e.isRequest = c ? c.isRequest : null; e.reason = c?.reason || ""; });
    } else {
      list.forEach((e) => { e.isRequest = null; e.reason = ""; });
    }

    return new Response(JSON.stringify({ emails: list, count: list.length }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
