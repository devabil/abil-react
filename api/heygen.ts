                                                                                                    
                                                                                                        
                                                                                                        
                                                                                                           
                                                                                 
  
                                                                                                                                                                         
                                                                                                                                          
                                                                                                                                                           
                                                                                                                         
                                                                                                             
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 60 };

const KEY = (typeof process !== "undefined" ? (process.env?.HEYGEN_API_KEY || process.env?.HEYGEN_KEY) : "") || "";
const H = { "X-Api-Key": KEY } as Record<string, string>;
const ADMIN_PW = (typeof process !== "undefined" ? process.env?.ABIL_ADMIN_AUTH_SECRET : "") || "";

function adminOk(req: VercelRequest): boolean {
  if (!ADMIN_PW) return false;
  const h = req.headers["x-abil-admin"];
  const tok = Array.isArray(h) ? h[0] : (h as string | undefined);
  if (!tok) return false;
  const [expS, sig] = tok.split(".");
  const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

                                    
  if (req.method === "GET") {
    const id = String((req.query?.id as string) || "").trim();
    if (!id) { res.status(200).json({ configured: !!KEY }); return; }
    if (!KEY) { res.status(503).json({ error: "HEYGEN_API_KEY não configurada", configured: false }); return; }
                                                                                      
    try {
      const r = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(id)}`, { headers: H });
      const d: any = await r.json().catch(() => ({}));
      const data = d?.data || d || {};
      const status = data.status || d.status || "unknown";
      const videoUrl = data.video_url || data.url || null;
      const done = status === "completed" || status === "success";
      if (!r.ok && !done) { res.status(200).json({ done: false, status, raw: JSON.stringify(d).slice(0, 240) }); return; }
      res.status(200).json({ done, status, videoUrl, error: data.error || null });
    } catch (e: any) {
      res.status(502).json({ error: String(e?.message || e).slice(0, 200) });
    }
    return;
  }

  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }
  if (!KEY) { res.status(503).json({ error: "HEYGEN_API_KEY não configurada", configured: false }); return; }

  let body: any;
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch { res.status(400).json({ error: "invalid JSON" }); return; }

  const action = String(body?.action || "generate");

                                                                                                    
  if (action === "generate") {
    const imageUrl = String(body?.imageUrl || "").trim();
    const audioUrl = String(body?.audioUrl || "").trim();
    if (!imageUrl || !audioUrl) { res.status(400).json({ error: "imageUrl + audioUrl required" }); return; }
    const resolution = ["4k", "1080p", "720p"].includes(body?.resolution) ? body.resolution : "1080p";
    const aspectRatio = ["16:9", "9:16", "4:5", "5:4", "1:1", "auto"].includes(body?.aspectRatio) ? body.aspectRatio : "16:9";
                                                                           
                                                                                                     
                                                                                               
                                                                                 
    const motionPrompt = String(body?.motionPrompt || "").trim().slice(0, 400);
    const payload: any = {
      type: "image",
      image: { type: "url", url: imageUrl },
      audio_url: audioUrl,
      resolution,
      aspect_ratio: aspectRatio,
      title: String(body?.title || "Apresentacao").slice(0, 80),
    };
    if (motionPrompt) payload.motion_prompt = motionPrompt;
    try {
      const r = await fetch("https://api.heygen.com/v3/videos", {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d: any = await r.json().catch(() => ({}));
      const id = d?.data?.video_id || d?.video_id || d?.data?.id || d?.id || null;
      if (!r.ok || !id) { res.status(502).json({ error: `heygen v3 ${r.status}: ${JSON.stringify(d).slice(0, 260)}` }); return; }
      res.status(200).json({ id, raw: d?.data || null });
    } catch (e: any) {
      res.status(502).json({ error: String(e?.message || e).slice(0, 240) });
    }
    return;
  }

                                                                                   
                                                                                                   
                                                                                              
  if (action === "create_talking_photo") {
    const imageUrl = String(body?.imageUrl || "").trim();
    if (!imageUrl) { res.status(400).json({ error: "imageUrl required" }); return; }
    try {
                                                                                              
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) { res.status(502).json({ error: `fetch image ${imgRes.status}` }); return; }
      const ct0 = (imgRes.headers.get("content-type") || "").toLowerCase();
      const contentType = ct0.includes("png") ? "image/png" : ct0.includes("jpeg") || ct0.includes("jpg") ? "image/jpeg" : (imageUrl.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
      const buf = Buffer.from(await imgRes.arrayBuffer());
                                                                      
      const up = await fetch("https://upload.heygen.com/v1/talking_photo", {
        method: "POST",
        headers: { ...H, "Content-Type": contentType },
        body: buf,
      });
      const d: any = await up.json().catch(() => ({}));
      const tpId = d?.data?.talking_photo_id || d?.talking_photo_id || d?.data?.id || null;
      if (!up.ok || !tpId) { res.status(502).json({ error: `talking_photo upload ${up.status}: ${JSON.stringify(d).slice(0, 260)}` }); return; }
      res.status(200).json({ talkingPhotoId: tpId, talkingPhotoUrl: d?.data?.talking_photo_url || null, raw: d?.data || null });
    } catch (e: any) {
      res.status(502).json({ error: String(e?.message || e).slice(0, 240) });
    }
    return;
  }

                                                                                                              
                                                                                   
                                                                                                       
  if (action === "generate_tp") {
    const talkingPhotoId = String(body?.talkingPhotoId || "").trim();
    const audioUrl = String(body?.audioUrl || "").trim();
    if (!talkingPhotoId || !audioUrl) { res.status(400).json({ error: "talkingPhotoId + audioUrl required" }); return; }
    const dim = body?.dimension && typeof body.dimension === "object"
      ? { width: Number(body.dimension.width) || 1280, height: Number(body.dimension.height) || 720 }
      : { width: 1280, height: 720 };
    const character: any = {
      type: "talking_photo",
      talking_photo_id: talkingPhotoId,
      scale: 1.0,
      talking_photo_style: "square",
      talking_style: "stable",
      expression: "default",
    };
    if (body?.useAvatarIV) character.use_avatar_iv_model = true;
    const payload = {
      video_inputs: [
        {
          character,
          voice: { type: "audio", audio_url: audioUrl },
        },
      ],
      dimension: dim,
      title: String(body?.title || "Apresentacao").slice(0, 80),
    };
    try {
      const r = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d: any = await r.json().catch(() => ({}));
      const id = d?.data?.video_id || d?.video_id || d?.data?.id || d?.id || null;
      if (!r.ok || !id) { res.status(502).json({ error: `heygen v2 ${r.status}: ${JSON.stringify(d).slice(0, 260)}` }); return; }
      res.status(200).json({ id, raw: d?.data || null });
    } catch (e: any) {
      res.status(502).json({ error: String(e?.message || e).slice(0, 240) });
    }
    return;
  }

  res.status(400).json({ error: "unknown action: " + action });
}
