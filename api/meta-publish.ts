/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                            
                                                                                            
                                                                                                              
                             
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 60 };
const GRAPH = "https://graph.facebook.com/v21.0";
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

async function postForm(url: string, params: Record<string, string>): Promise<{ ok: boolean; data: any }> {
  const body = new URLSearchParams(params).toString();
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, data };
}

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) {
    const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1);
    if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } }
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ENC_PW) return res.status(503).json({ error: "server not configured (ABIL_ADMIN_AUTH_SECRET missing)" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  const b = (req.body || {}) as { tenantId?: string; target?: string; pageId?: string; igUserId?: string; message?: string; link?: string; imageUrl?: string; caption?: string; placement?: string };
  const tenantId = String(b.tenantId || "");
  const target = String(b.target || "");
  if (!tenantId || !target) return res.status(400).json({ error: "missing_tenant_or_target" });

  const conn = await getConnection(tenantId);
  const pages: any[] = conn?.facebook?.pages || [];
  if (!pages.length) return res.status(409).json({ error: "tenant_not_connected_facebook", tenantId });

  try {
    if (target === "facebook") {
      const page = b.pageId ? pages.find((p) => p.pageId === b.pageId) : pages[0];
      if (!page?.pageToken) return res.status(409).json({ error: "page_not_found", pageId: b.pageId || null });
      const caption = String(b.message || b.caption || "");
      const r = b.imageUrl
        ? await postForm(`${GRAPH}/${page.pageId}/photos`, { url: String(b.imageUrl), caption, access_token: page.pageToken })
        : await postForm(`${GRAPH}/${page.pageId}/feed`, { message: caption, ...(b.link ? { link: String(b.link) } : {}), access_token: page.pageToken });
      if (!r.ok) return res.status(502).json({ ok: false, error: "fb_publish_failed", detail: r.data });
      return res.status(200).json({ ok: true, target, id: r.data.id || r.data.post_id || null });
    }
    if (target === "instagram") {
      if (!b.imageUrl) return res.status(400).json({ error: "instagram_requires_imageUrl" });
      const page = b.igUserId ? pages.find((p) => p.igUserId === b.igUserId) : (b.pageId ? pages.find((p) => p.pageId === b.pageId) : pages.find((p) => p.igUserId));
      const igUserId = page?.igUserId;
      if (!igUserId || !page?.pageToken) return res.status(409).json({ error: "instagram_not_connected" });
                                                                                                      
                                                                                            
      const isStory = String(b.placement || "") === "story";
      const c = await postForm(`${GRAPH}/${igUserId}/media`, isStory
        ? { image_url: String(b.imageUrl), media_type: "STORIES", access_token: page.pageToken }
        : { image_url: String(b.imageUrl), caption: String(b.caption || b.message || ""), access_token: page.pageToken });
      if (!c.ok || !c.data.id) return res.status(502).json({ ok: false, error: "ig_container_failed", detail: c.data });
      const creationId = String(c.data.id);
                                                                                                           
                                                                                                        
                                                                                                      
      let status = "";
      for (let i = 0; i < 9; i++) {
        await new Promise((r) => setTimeout(r, 2200));
        const sr = await fetch(`${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(page.pageToken)}`);
        const sj: any = await sr.json().catch(() => ({}));
        status = String(sj.status_code || "");
        if (status === "FINISHED") break;
        if (status === "ERROR") return res.status(502).json({ ok: false, error: "ig_container_error", detail: sj });
      }
      if (status !== "FINISHED") return res.status(504).json({ ok: false, error: "ig_container_timeout", detail: { status } });
                    
      const p = await postForm(`${GRAPH}/${igUserId}/media_publish`, { creation_id: creationId, access_token: page.pageToken });
      if (!p.ok) return res.status(502).json({ ok: false, error: "ig_publish_failed", detail: p.data });
      return res.status(200).json({ ok: true, target, id: p.data.id || null });
    }
    return res.status(400).json({ error: "unknown_target", target });
  } catch (e) {
    return res.status(500).json({ error: "publish_failed", detail: String(e) });
  }
}
