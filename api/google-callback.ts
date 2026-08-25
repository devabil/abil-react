/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                               
                                                                                                  
                                                                                             
                                                                                               
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const WEB_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
const WEB_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
const CONN_PREFIX = "meta/connections/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
let _key: Buffer | null = null;
function aesKey(): Buffer { if (!ENC_PW) throw new Error("enc_locked"); if (!_key) _key = crypto.scryptSync(ENC_PW, "abil_meta_salt_v1", 32); return _key; }
function encrypt(p: string): string { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv("aes-256-gcm", aesKey(), iv); const e = Buffer.concat([c.update(p, "utf8"), c.final()]); return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), e.toString("base64")].join("."); }
function decrypt(b: string): string { const [v, ivb, tagb, encb] = b.split("."); if (v !== "v1") throw new Error("bad_cipher"); const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivb, "base64")); d.setAuthTag(Buffer.from(tagb, "base64")); return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8"); }
async function readText(key: string): Promise<string | null> { if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  } } try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.text() : null; } catch { return null; } }
async function writeText(key: string, body: string): Promise<void> { await put(key, body, { access: "public", contentType: "text/plain", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
function esc(s: any): string { return String(s || "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" } as any)[c]); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = (req.query || {}) as Record<string, string>;
  const code = String(q.code || "");
  const tenantId = safeTenant(String(q.state || ""));
  const error = String(q.error || "");

  let result: { ok: boolean; error?: string; hasRefresh?: boolean } = { ok: false, error: "not_started" };

  if (!error && code && tenantId && WEB_ID && WEB_SECRET && ENC_PW) {
    try {
                                                                             
                                                                               
      const host = String(req.headers["x-forwarded-host"] || req.headers.host || "abil.ch");
      const proto = String(req.headers["x-forwarded-proto"] || "https");
      const redirectUri = `${proto}://${host}/api/google-callback`;
      const form = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: WEB_ID, client_secret: WEB_SECRET });
      const tr = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
      const tj: any = await tr.json().catch(() => ({}));
      if (!tr.ok || !tj.access_token) {
        result = { ok: false, error: String(tj.error_description || tj.error || "token_failed") + ` (redirect_uri: ${redirectUri})` };
      } else {
                                                                       
        const connKey = `${CONN_PREFIX}${tenantId}.enc`;
        const e = await readText(connKey);
        let existing: any = { tenantId, updatedAt: "" };
        if (e) { try { existing = JSON.parse(decrypt(e)); } catch {  } }
        const rec = { ...existing, tenantId, google: { token: tj.access_token, refreshToken: tj.refresh_token || null, expiresIn: tj.expires_in || null, scope: tj.scope || null, connectedAt: new Date().toISOString() }, updatedAt: new Date().toISOString() };
        await writeText(connKey, encrypt(JSON.stringify(rec)));
        result = { ok: true, hasRefresh: !!tj.refresh_token };
      }
    } catch (e) {
      result = { ok: false, error: String(e).slice(0, 100) };
    }
  } else if (error) {
    result = { ok: false, error };
  }

                                                           
  const notify = JSON.stringify({ source: "abil-oauth", provider: "google", ok: result.ok, error: result.error || "", tenantId, hasRefresh: result.hasRefresh }).replace(/</g, "\\u003c");
  const msg = result.ok ? "Google ligado! Podes fechar esta janela." : ("Erro: " + esc(result.error));

  const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Google</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#0b0b0c;color:#e8e3d9;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center;max-width:340px;padding:24px">
  <p style="font-size:15px;margin:0 0 6px">${esc(msg)}</p>
  <p style="opacity:.5;font-size:13px;margin:0">Podes fechar esta janela.</p>
</div>
<script>
  var n = ${notify};
  try { if (window.opener && !window.opener.closed) window.opener.postMessage(n, window.location.origin); } catch(e) {}
  try { localStorage.setItem('abil_oauth_google', JSON.stringify(n)); } catch(e) {}
  setTimeout(function(){ try{ window.close(); }catch(e){} }, 1500);
</script>
</body></html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(html);
}
