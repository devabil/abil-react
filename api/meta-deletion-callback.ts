                                                                              
                                                                                                    
                                                                               

export const config = { runtime: "edge" };

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const bin = atob(b64); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false; let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i]; return r === 0;
}
function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
async function hmacSha256(secret: string, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, bytesToArrayBuffer(data)));
}
async function parseSignedRequest(signed: string, appSecret: string): Promise<{ user_id?: string; algorithm?: string } | null> {
  const dot = signed.indexOf("."); if (dot < 0) return null;
  const sigB64 = signed.slice(0, dot), payloadB64 = signed.slice(dot + 1);
  if (!bytesEqual(b64urlToBytes(sigB64), await hmacSha256(appSecret, new TextEncoder().encode(payloadB64)))) return null;
  try {
    const p = JSON.parse(new TextDecoder("utf-8").decode(b64urlToBytes(payloadB64)));
    if (p && p.algorithm && String(p.algorithm).toUpperCase().replace(/-/g, "") === "HMACSHA256") return p;
    return null;
  } catch { return null; }
}
function makeConfirmationCode(userId: string): string {
  const ts = Date.now().toString(36); const rand = crypto.getRandomValues(new Uint8Array(6));
  let r = ""; for (const b of rand) r += b.toString(16).padStart(2, "0");
  return `del_${userId.slice(0, 12)}_${ts}_${r}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const env = (typeof process !== "undefined" ? (process.env as Record<string, string | undefined>) : {});
  const base = env.PUBLIC_BASE_URL || "https://abil-site.vercel.app";
  const appSecret = env.META_APP_SECRET || "";

  if (req.method === "GET") {
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Meta, User Data Deletion (ABiL)</title>
      <style>body{font-family:system-ui;max-width:640px;margin:48px auto;padding:0 20px;color:#222;line-height:1.55}</style>
      <h1>User Data Deletion (Meta), ABiL / ABiL MEDiAS</h1>
      <p>This endpoint receives data-deletion callbacks from Meta. Users can request deletion of data collected via Meta integrations by emailing <a href="mailto:info@abil.ch">info@abil.ch</a> (subject: "User Data Deletion, Meta").</p>
      <p>Acted upon within 30 days. Status: <code>${base}/api/meta-deletion-status?id=&lt;confirmation_code&gt;</code>.</p>
      <p><a href="${base}/privacy">Privacy Policy</a></p>`;
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...CORS } });
  }
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });
  if (!appSecret) return new Response(JSON.stringify({ error: "META_APP_SECRET not configured on the server" }), { status: 503, headers: { "Content-Type": "application/json", ...CORS } });

  let signed: string | null = null;
  const ctype = req.headers.get("content-type") || "";
  try {
    if (ctype.includes("application/x-www-form-urlencoded")) { const form = await req.formData(); signed = form.get("signed_request") as string | null; }
    else if (ctype.includes("application/json")) { const body = await req.json(); signed = (body && (body.signed_request as string)) || null; }
    else { const txt = await req.text(); const m = txt.match(/signed_request=([^&]+)/); signed = m ? decodeURIComponent(m[1]) : null; }
  } catch {  }
  if (!signed) return new Response(JSON.stringify({ error: "Missing signed_request" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const payload = await parseSignedRequest(signed, appSecret);
  if (!payload || !payload.user_id) return new Response(JSON.stringify({ error: "Invalid signed_request" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const userId = String(payload.user_id);
  const confirmationCode = makeConfirmationCode(userId);
  try { console.log(JSON.stringify({ kind: "meta_deletion_request", project: "abil", userId, confirmationCode, ts: new Date().toISOString() })); } catch {  }
  return new Response(JSON.stringify({ url: `${base}/api/meta-deletion-status?id=${encodeURIComponent(confirmationCode)}`, confirmation_code: confirmationCode }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
}
