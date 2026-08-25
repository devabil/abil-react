                                           
                                                                        
                                                 
  
                                                                           
                                                                

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5180",
  "http://localhost:5182",
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

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
                                                                                                                                                    
  return new Response(JSON.stringify({ error: "email_disabled_pending_account_migration", message: "E-mail em migracao para a conta propria deste dashboard." }), { status: 403, headers: { "Content-Type": "application/json", ...CORS } });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
                                                                                                                           
  { const _pw = env.ABIL_ADMIN_AUTH_SECRET || "", _t = req.headers.get("x-abil-admin") || "", _d = _t.indexOf("."); let _ok = false;
    if (_pw && _d > 0 && /^\d+$/.test(_t.slice(0, _d)) && Date.now() <= Number(_t.slice(0, _d))) {
      try { const _k = await crypto.subtle.importKey("raw", new TextEncoder().encode(_pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const _g = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", _k, new TextEncoder().encode(_t.slice(0, _d))))).map((b) => b.toString(16).padStart(2, "0")).join(""); _ok = _t.slice(_d + 1) === _g; } catch { _ok = false; } }
    if (!_ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } }); }
  const clientId = env.GOOGLE_CLIENT_ID, clientSecret = env.GOOGLE_CLIENT_SECRET, refreshToken = env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    return new Response(JSON.stringify({ error: "Gmail OAuth não configurado." }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let body: any = {};
  try { body = await req.json(); } catch {                      }
  const draftId = body?.draftId ? String(body.draftId) : "";
  const all = body?.all === true;
  if (!draftId && !all) return new Response(JSON.stringify({ error: "draftId ou all=true obrigatório." }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  try {
                                  
    const tokRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }).toString(),
    });
    if (!tokRes.ok) {
      const e = await tokRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Token refresh: ${tokRes.status} ${e.slice(0, 160)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const accessToken = (await tokRes.json())?.access_token;
    if (!accessToken) return new Response(JSON.stringify({ error: "Sem access_token" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });

    if (all) {
                                         
      const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=100", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!listRes.ok) {
        const e = await listRes.text().catch(() => "");
        return new Response(JSON.stringify({ error: `list drafts: ${listRes.status} ${e.slice(0, 160)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
      }
      const drafts = (await listRes.json())?.drafts || [];
      const results: any[] = [];
      for (const d of drafts) {
        const id = d?.id;
        if (!id) continue;
        const delRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        results.push({ id, ok: delRes.ok, status: delRes.status });
      }
      return new Response(JSON.stringify({ ok: true, deletedCount: results.filter((r) => r.ok).length, total: results.length, results }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
    } else {
      const delRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${encodeURIComponent(draftId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!delRes.ok) {
        const e = await delRes.text().catch(() => "");
        return new Response(JSON.stringify({ error: `delete: ${delRes.status} ${e.slice(0, 200)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
      }
      return new Response(JSON.stringify({ ok: true, draftId }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
