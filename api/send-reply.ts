                                                                            
                                                                                                  
                                                                                                      
                           
  
                                                                                               
                                      
  
                                                                                                  
                                                                                              
  
                                                                                        
                                                                                  

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([  
  "https://abil.ch",
  "https://abil-site.vercel.app", "https://www.abil.ch",
  "http://localhost:5173", "http://localhost:4173", "http://localhost:5180", "http://localhost:5182",
]);
const VERCEL_AUTO_DEPLOY_RE = /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/;
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && (ALLOWED_ORIGINS.has(origin) || VERCEL_AUTO_DEPLOY_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-anthropic-key, x-abil-admin",
    "Vary": "Origin",
  };
}

                                                                          
function b64urlFromUtf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
                                                                                                
function encodeHeaderValue(v: string): string {
  let asciiOnly = true;
  for (let i = 0; i < v.length; i++) {
    if (v.charCodeAt(i) > 0x7f) {
      asciiOnly = false;
      break;
    }
  }
  if (asciiOnly) return v;
  const b = btoa(String.fromCharCode(...new TextEncoder().encode(v)));
  return `=?UTF-8?B?${b}?=`;
}
function sanitizeHeader(v: string): string {
  return String(v || "").replace(/[\r\n]+/g, " ").trim();
}

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });
  }

                                                                                                             
                                                                             
  { const _env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
    const _pw = _env.ABIL_ADMIN_AUTH_SECRET || "", _t = req.headers.get("x-abil-admin") || "", _d = _t.indexOf("."); let _ok = false;
    if (_pw && _d > 0 && /^\d+$/.test(_t.slice(0, _d)) && Date.now() <= Number(_t.slice(0, _d))) {
      try { const _k = await crypto.subtle.importKey("raw", new TextEncoder().encode(_pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const _g = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", _k, new TextEncoder().encode(_t.slice(0, _d))))).map((b) => b.toString(16).padStart(2, "0")).join(""); _ok = _t.slice(_d + 1) === _g; } catch { _ok = false; } }
    if (!_ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } }); }

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const clientId = env.GOOGLE_CLIENT_ID, clientSecret = env.GOOGLE_CLIENT_SECRET, refreshToken = env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    return new Response(JSON.stringify({ error: "Gmail OAuth não configurado (faltam GOOGLE_CLIENT_ID/SECRET ou GMAIL_REFRESH_TOKEN)." }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let body: any = {};
  try { body = await req.json(); } catch {  }
  const mode = body?.mode === "send" ? "send" : "draft";
  const to = sanitizeHeader(body?.to);
  const subjectRaw = sanitizeHeader(body?.subject);
  const bodyText = typeof body?.bodyText === "string" ? body.bodyText : "";
                                                                     
  const bodyHtml = typeof body?.bodyHtml === "string" ? body.bodyHtml : "";
  const useHtml = bodyHtml.trim().length > 0;
  const threadId = body?.threadId ? String(body.threadId) : undefined;
  const inReplyTo = body?.inReplyTo ? sanitizeHeader(body.inReplyTo) : "";
                                                                                                               
  const att = body?.attachment && typeof body.attachment === "object" ? body.attachment : null;

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return new Response(JSON.stringify({ error: "Destinatário (to) em falta ou inválido." }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  }
  if (!bodyText.trim() && !useHtml) {
    return new Response(JSON.stringify({ error: "Corpo da mensagem (bodyText ou bodyHtml) vazio." }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  }
  const subject = subjectRaw || "Re:";

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

                                                                                                  
    let attB64 = "", attName = "proposta.pdf", attMime = "application/pdf";
    if (att) {
      attName = sanitizeHeader(att.filename || "proposta.pdf").replace(/[^\w.\-() ]/g, "_").slice(0, 120) || "proposta.pdf";
      attMime = sanitizeHeader(att.mimeType || "application/pdf").slice(0, 80) || "application/pdf";
      let raw64 = "";
      if (typeof att.contentBase64 === "string" && att.contentBase64) {
        raw64 = att.contentBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
      } else if (typeof att.url === "string" && /^https?:\/\//.test(att.url)) {
        const fr = await fetch(att.url);
        if (!fr.ok) return new Response(JSON.stringify({ error: `Não consegui buscar o anexo: ${fr.status}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
        const buf = new Uint8Array(await fr.arrayBuffer());
        let bin = ""; const ch = 0x8000;
        for (let i = 0; i < buf.length; i += ch) bin += String.fromCharCode(...buf.subarray(i, i + ch));
        raw64 = btoa(bin);
      }
      attB64 = (raw64.match(/.{1,76}/g) || []).join("\r\n");
      if (!attB64) return new Response(JSON.stringify({ error: "Anexo vazio ou inválido." }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const baseHeaders = [
      `To: ${to}`,
      `Subject: ${encodeHeaderValue(subject)}`,
      inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
      inReplyTo ? `References: ${inReplyTo}` : null,
      "MIME-Version: 1.0",
    ].filter((x): x is string => x !== null);
    let mime: string;
    if (att && attB64) {
      const boundary = "abilprop_" + Math.abs((to + subject).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36) + "_b";
      mime = [
        ...baseHeaders,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        useHtml ? 'Content-Type: text/html; charset="UTF-8"' : 'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        (useHtml ? bodyHtml : bodyText).replace(/\r?\n/g, "\r\n"),
        `--${boundary}`,
        `Content-Type: ${attMime}; name="${attName}"`,
        `Content-Disposition: attachment; filename="${attName}"`,
        "Content-Transfer-Encoding: base64",
        "",
        attB64,
        `--${boundary}--`,
        "",
      ].join("\r\n");
    } else if (useHtml) {
                                                                                               
      const boundary = "abilalt_" + Math.abs((to + subject).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 11)).toString(36) + "_b";
      const plain = (bodyText.trim() || "Este email foi desenhado em HTML. Abra-o num cliente que mostre HTML.").replace(/\r?\n/g, "\r\n");
      mime = [
        ...baseHeaders,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        plain,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        bodyHtml.replace(/\r?\n/g, "\r\n"),
        `--${boundary}--`,
        "",
      ].join("\r\n");
    } else {
      mime = [...baseHeaders, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: 8bit", "", bodyText.replace(/\r?\n/g, "\r\n")].join("\r\n");
    }
    const raw = b64urlFromUtf8(mime);

                                  
    const url = mode === "send"
      ? "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
      : "https://gmail.googleapis.com/gmail/v1/users/me/drafts";
    const payload = mode === "send"
      ? { raw, ...(threadId ? { threadId } : {}) }
      : { message: { raw, ...(threadId ? { threadId } : {}) } };
    const gRes = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const gData: any = await gRes.json().catch(() => ({}));
    if (!gRes.ok) {
      const msg = gData?.error?.message || JSON.stringify(gData).slice(0, 200);
      return new Response(JSON.stringify({ error: `Gmail ${mode === "send" ? "send" : "drafts.create"} falhou: ${gRes.status} ${msg}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }

    return new Response(JSON.stringify({
      ok: true,
      mode,
      draftId: gData?.id || null,
      messageId: gData?.message?.id || gData?.id || null,
      threadId: gData?.message?.threadId || gData?.threadId || threadId || null,
    }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
