/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                    
                                                                                                        
                                                                                                  
                                                                                                         
                                                                                        
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const WEB_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
const WEB_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
const CONN_PREFIX = "meta/connections/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
const ADMIN = process.env.META_ADMIN_KEY || "";
let _key: Buffer | null = null;
function aesKey(): Buffer { if (!ENC_PW) throw new Error("enc_locked"); if (!_key) _key = crypto.scryptSync(ENC_PW, "abil_meta_salt_v1", 32); return _key; }
function decrypt(b: string): string { const [v, ivb, tagb, encb] = b.split("."); if (v !== "v1") throw new Error("bad_cipher"); const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivb, "base64")); d.setAuthTag(Buffer.from(tagb, "base64")); return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8"); }
async function readText(key: string): Promise<string | null> { if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  } } try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.text() : null; } catch { return null; } }
function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
async function getConnection(t: string): Promise<any | null> { const id = safeTenant(t); if (!id) return null; const e = await readText(`${CONN_PREFIX}${id}.enc`); if (!e) return null; try { return JSON.parse(decrypt(e)); } catch { return null; } }
function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}
async function freshToken(conn: any): Promise<string | null> {
  const rt = conn?.google?.refreshToken;
  if (rt && WEB_ID && WEB_SECRET) {
    try {
      const form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: rt, client_id: WEB_ID, client_secret: WEB_SECRET });
      const r = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
      const j: any = await r.json().catch(() => ({}));
      if (r.ok && j.access_token) return j.access_token;
    } catch {  }
  }
  return conn?.google?.token || null;
}
function ymd(ms: number): string { return new Date(ms).toISOString().slice(0, 10); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ENC_PW) return res.status(503).json({ error: "server not configured (ABIL_ADMIN_AUTH_SECRET missing)" });
  if (!WEB_ID || !WEB_SECRET) return res.status(503).json({ error: "Google OAuth web client not configured (GOOGLE_OAUTH_CLIENT_ID/SECRET missing)" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  const b = (req.body || {}) as { tenantId?: string; kind?: string; propertyId?: string; siteUrl?: string; days?: number };
  const tenantId = String(b.tenantId || "");
  const kind = String(b.kind || "");
  const days = Math.min(365, Math.max(1, Number(b.days) || 28));
  if (!tenantId || !kind) return res.status(400).json({ error: "missing_tenant_or_kind" });
  const conn = await getConnection(tenantId);
  if (!conn?.google?.token && !conn?.google?.refreshToken) return res.status(409).json({ error: "tenant_not_connected_google", tenantId });
  const token = await freshToken(conn);
  if (!token) return res.status(502).json({ error: "token_refresh_failed" });

  try {
    if (kind === "analytics") {
      if (!b.propertyId) return res.status(400).json({ error: "missing_propertyId" });
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(String(b.propertyId))}:runReport`;
      const body = { dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }] };
      const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(502).json({ ok: false, error: "ga_failed", detail: j });
      const rows = (j.rows || []).map((row: any) => ({ date: row.dimensionValues?.[0]?.value, sessions: Number(row.metricValues?.[0]?.value || 0), users: Number(row.metricValues?.[1]?.value || 0), views: Number(row.metricValues?.[2]?.value || 0) }));
      const totals = rows.reduce((a: any, r2: any) => ({ sessions: a.sessions + r2.sessions, users: a.users + r2.users, views: a.views + r2.views }), { sessions: 0, users: 0, views: 0 });
                                                                                                    
                                                                                           
      let sources: { channel: string; sessions: number }[] = [];
      try {
        const srcBody = { dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 6 };
        const sr = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(srcBody) });
        const sj: any = await sr.json().catch(() => ({}));
        if (sr.ok) sources = (sj.rows || []).map((row: any) => ({ channel: String(row.dimensionValues?.[0]?.value || "(other)"), sessions: Number(row.metricValues?.[0]?.value || 0) }));
      } catch {  }
      return res.status(200).json({ ok: true, kind, days, totals, rows, sources });
    }
    if (kind === "searchconsole") {
      if (!b.siteUrl) return res.status(400).json({ error: "missing_siteUrl" });
      const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(String(b.siteUrl))}/searchAnalytics/query`;
      const body = { startDate: ymd(Date.now() - days * 86400000), endDate: ymd(Date.now()), dimensions: ["query"], rowLimit: 25 };
      const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(502).json({ ok: false, error: "sc_failed", detail: j });
      const rows = (j.rows || []).map((row: any) => ({ query: row.keys?.[0], clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position }));
      return res.status(200).json({ ok: true, kind, days, rows });
    }
    if (kind === "properties") {
                                                                             
                                                                                            
      const url = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200";
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(502).json({ ok: false, error: "admin_failed", status: r.status, detail: j });
      const properties: { propertyId: string; propertyPath: string; displayName: string; account: string }[] = [];
      for (const acc of (j.accountSummaries || [])) {
        const accountName = acc.displayName || acc.account || "";
        for (const ps of (acc.propertySummaries || [])) {
          const path = String(ps.property || "");                    
          const numId = path.replace(/^properties\//, "");
          if (!numId) continue;
          properties.push({ propertyId: numId, propertyPath: path, displayName: ps.displayName || numId, account: accountName });
        }
      }
      return res.status(200).json({ ok: true, kind, properties });
    }
    return res.status(400).json({ error: "bad_kind", allowed: ["analytics", "searchconsole", "properties"] });
  } catch (e) { return res.status(500).json({ ok: false, error: "network", detail: String(e) }); }
}
