                                                          
                                                                              
                                                                                         
                                                                                             
  
                                                                                                        
                                                           
  
                 

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([  
  "http://localhost:5173", "http://localhost:4173", "http://localhost:5180", "http://localhost:5182",
]);
const VERCEL_AUTO_DEPLOY_RE = /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/;
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && (ALLOWED_ORIGINS.has(origin) || VERCEL_AUTO_DEPLOY_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-abil-admin, x-openai-key, x-anthropic-key",
    "Vary": "Origin",
  };
}

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });

  { const _env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
    const _pw = _env.ABIL_ADMIN_AUTH_SECRET || "", _t = req.headers.get("x-abil-admin") || "", _d = _t.indexOf("."); let _ok = false;
    if (_pw && _d > 0 && /^\d+$/.test(_t.slice(0, _d)) && Date.now() <= Number(_t.slice(0, _d))) {
      try { const _k = await crypto.subtle.importKey("raw", new TextEncoder().encode(_pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const _g = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", _k, new TextEncoder().encode(_t.slice(0, _d))))).map((b) => b.toString(16).padStart(2, "0")).join(""); _ok = _t.slice(_d + 1) === _g; } catch { _ok = false; } }
    if (!_ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } }); }

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const clientId = env.GOOGLE_CLIENT_ID, clientSecret = env.GOOGLE_CLIENT_SECRET, refreshToken = env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    return new Response(JSON.stringify({ error: "Google OAuth não configurado (GOOGLE_CLIENT_ID/SECRET/GMAIL_REFRESH_TOKEN)." }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }

  const summary = String(body?.summary || "").trim();
  const startISO = String(body?.startISO || "").trim();
  if (!summary || !startISO) return new Response(JSON.stringify({ error: "summary e startISO obrigatórios" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const description = String(body?.description || "");
  const location = String(body?.location || "");
  const timezone = String(body?.timezone || "Europe/Lisbon");
  const durationMin = Math.max(15, Math.min(480, Number(body?.durationMin) || 60));
  const attendeeEmail = String(body?.attendeeEmail || "").trim();

                                                          
                                                                                                        
                                                                                                            
  const startHasZone = /([zZ])$|[+-]\d{2}:?\d{2}$/.test(startISO);
  let endISO = String(body?.endISO || "").trim();
  if (!endISO) {
    const startMs = Date.parse(startHasZone ? startISO : startISO + "Z");
    if (Number.isNaN(startMs)) return new Response(JSON.stringify({ error: "startISO inválido (usa ISO 8601, ex 2026-06-10T14:00:00)" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
    const endFull = new Date(startMs + durationMin * 60000).toISOString();
    endISO = startHasZone ? endFull : endFull.slice(0, 19);                                    
  }

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

                      
    const event: any = {
      summary,
      description: description || undefined,
      location: location || undefined,
      start: { dateTime: startISO, timeZone: timezone },
      end: { dateTime: endISO, timeZone: timezone },
    };
    if (attendeeEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(attendeeEmail)) {
      event.attendees = [{ email: attendeeEmail }];
    }

    const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!calRes.ok) {
      const e = await calRes.text().catch(() => "");
                                                                       
      const needsScope = calRes.status === 403 && /scope|insufficient|permission/i.test(e);
      return new Response(JSON.stringify({
        error: needsScope
          ? "Falta o scope de Calendar no OAuth. Re-autoriza com 'calendar.events' (ver guia)."
          : `Calendar: ${calRes.status} ${e.slice(0, 200)}`,
        needsScope,
      }), { status: needsScope ? 403 : 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const created: any = await calRes.json();
    return new Response(JSON.stringify({ ok: true, eventId: created?.id, htmlLink: created?.htmlLink, start: startISO, end: endISO }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err).slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
