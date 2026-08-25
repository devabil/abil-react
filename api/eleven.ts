                                                                                        
                                                                                        
                                                                                             
                                                        
                                                                                             
                                       
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 120 };
const EL = "https://api.elevenlabs.io";
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

  const key = process.env.ELEVENLABS_API_KEY;
  const action = String((req.query?.action as string) || (typeof req.body === "object" ? (req.body as any)?.action : "") || "").trim();

  if (req.method === "GET" && action === "config") { res.status(200).json({ provider: "elevenlabs", configured: !!key }); return; }
  if (req.method === "POST" && !adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }
  if (!key) { res.status(503).json({ error: "ELEVENLABS_API_KEY não configurada", configured: false }); return; }
  const H = { "xi-api-key": key } as Record<string, string>;

  let body: any = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch {           }
  const act = String(body?.action || action);

  try {
                                                                     
    if (act === "voices") {
      const r = await fetch(`${EL}/v1/voices`, { headers: H });
      const d: any = await r.json().catch(() => ({}));
      const voices = (d?.voices || []).map((v: any) => ({ voice_id: v.voice_id, name: v.name, category: v.category, labels: v.labels }));
      res.status(200).json({ count: voices.length, voices });
      return;
    }
                                                                        
    if (act === "shared") {
      const qs = new URLSearchParams();
      const ql = req.query || ({} as any);
      ["language", "gender", "accent", "search", "page_size", "category", "use_case"].forEach(k => { if (ql[k]) qs.append(k, String(ql[k])); });
      const r = await fetch(`${EL}/v1/shared-voices?${qs.toString()}`, { headers: H });
      const d: any = await r.json().catch(() => ({}));
      const voices = (d?.voices || []).slice(0, 30).map((v: any) => ({ voice_id: v.voice_id, public_owner_id: v.public_owner_id, name: v.name, language: v.language, accent: v.accent, gender: v.gender, age: v.age, description: v.descriptive || v.description, use_case: v.use_case, preview_url: v.preview_url }));
      res.status(200).json({ count: voices.length, voices });
      return;
    }
                                                                                    
    if (act === "add_shared") {
      const owner = String(body?.public_owner_id || "").trim();
      const vid = String(body?.voice_id || "").trim();
      const name = String(body?.name || "Voz importada").slice(0, 80);
      if (!owner || !vid) { res.status(400).json({ error: "public_owner_id + voice_id required" }); return; }
      const r = await fetch(`${EL}/v1/voices/add/${owner}/${vid}`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ new_name: name }) });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) { res.status(502).json({ error: `add_shared ${r.status}: ${JSON.stringify(d).slice(0, 200)}` }); return; }
      res.status(200).json({ voice_id: d?.voice_id, raw: d });
      return;
    }

                                            
    if (act === "clone") {
      const audioUrl = String(body?.audioUrl || "").trim();
      if (!audioUrl) { res.status(400).json({ error: "audioUrl required" }); return; }
      const a = await fetch(audioUrl);
      if (!a.ok) { res.status(502).json({ error: `audio fetch ${a.status}` }); return; }
      const buf = Buffer.from(await a.arrayBuffer());
      const fd = new FormData();
      fd.append("name", String(body?.name || "ABiL"));
      fd.append("remove_background_noise", "true");
      fd.append("files", new Blob([buf], { type: a.headers.get("content-type") || "audio/mpeg" }), "voice.mp3");
      const r = await fetch(`${EL}/v1/voices/add`, { method: "POST", headers: H, body: fd as any });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) { res.status(502).json({ error: `ElevenLabs ${r.status}: ${JSON.stringify(d).slice(0, 240)}` }); return; }
      res.status(200).json({ voice_id: d?.voice_id, raw: d });
      return;
    }

                                                                                 
                                                                                 
                                                                                             
    if (act === "sts") {
      const voiceId = String(body?.voiceId || "").trim();
      const sourceUrl = String(body?.sourceUrl || "").trim();
      if (!voiceId || !sourceUrl) { res.status(400).json({ error: "voiceId + sourceUrl required" }); return; }
      const a = await fetch(sourceUrl);
      if (!a.ok) { res.status(502).json({ error: `source fetch ${a.status}` }); return; }
      const buf = Buffer.from(await a.arrayBuffer());
      const fd = new FormData();
      fd.append("audio", new Blob([buf], { type: a.headers.get("content-type") || "audio/mpeg" }), "source.mp3");
      fd.append("model_id", String(body?.model || "eleven_multilingual_sts_v2"));
                                                                                                       
                                                                                                                       
      fd.append("remove_background_noise", String(body?.removeNoise ?? "true"));
                                                                                                              
                                                                                               
      const lockSettings = body?.vs || { stability: 0, similarity_boost: 0, style: 0, use_speaker_boost: true };
      await fetch(`https://api.us.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}/settings/edit`, {
        method: "POST", headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify(lockSettings),
      }).catch(() => {});
                                                                                                                 
      const r = await fetch(`https://api.us.elevenlabs.io/v1/speech-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`, { method: "POST", headers: { ...H, Accept: "audio/mpeg" }, body: fd as any });
      if (!r.ok) { const e = await r.text().catch(() => ""); res.status(502).json({ error: `STS ${r.status}: ${e.slice(0, 240)}` }); return; }
      const out = Buffer.from(await r.arrayBuffer());
      const blob = await put(`eleven/${String(body?.outName || "sts").replace(/[^\w.-]+/g, "-").slice(0, 60)}.mp3`, out, { access: "public", contentType: "audio/mpeg", addRandomSuffix: true });
      res.status(200).json({ blobUrl: blob.url, bytes: out.length, model: "sts" });
      return;
    }

                                                 
    if (act === "tts") {
      const voiceId = String(body?.voiceId || "").trim();
      const text = String(body?.text || "").slice(0, 4000);
      if (!voiceId || !text) { res.status(400).json({ error: "voiceId + text required" }); return; }
                                                                                           
                                                                                                 
      const settingsFor = (model: string) => body?.vs ? body.vs : (model === "eleven_v3"
        ? { stability: 0.75, similarity_boost: 0.95, style: 0.0, use_speaker_boost: true }
        : { stability: 0.45, similarity_boost: 0.85, style: 0.5, use_speaker_boost: true });
      const tryTTS = (model: string) => fetch(`${EL}/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: model, voice_settings: settingsFor(model), ...(body?.languageCode ? { language_code: String(body.languageCode) } : {}) }),
      });
      let used = String(body?.model || "eleven_v3");
      let r = await tryTTS(used);
      if (!r.ok) { used = "eleven_multilingual_v2"; r = await tryTTS(used); }
      if (!r.ok) { const e = await r.text().catch(() => ""); res.status(502).json({ error: `ElevenLabs TTS ${r.status}: ${e.slice(0, 240)}` }); return; }
      const buf = Buffer.from(await r.arrayBuffer());
      const blob = await put(`eleven/${String(body?.outName || "sample").replace(/[^\w.-]+/g, "-").slice(0, 60)}.mp3`, buf, { access: "public", contentType: "audio/mpeg", addRandomSuffix: true });
      res.status(200).json({ blobUrl: blob.url, bytes: buf.length, model: used });
      return;
    }

                                                                                                   
                                                                                   
    if (act === "design") {
      const description = String(body?.description || "").trim();
      const text = String(body?.text || "").trim();
      if (description.length < 20 || text.length < 100) { res.status(400).json({ error: "description (>=20 chars) + text (>=100 chars) required" }); return; }
      const r = await fetch(`${EL}/v1/text-to-voice/create-previews`, {
        method: "POST", headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify({ voice_description: description, text }),
      });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) { res.status(502).json({ error: `design ${r.status}: ${JSON.stringify(d).slice(0, 260)}` }); return; }
      const base = String(body?.outName || "voice").replace(/[^\w.-]+/g, "-").slice(0, 40);
      const previews: any[] = [];
      const arr = Array.isArray(d?.previews) ? d.previews : [];
      for (let i = 0; i < arr.length; i++) {
        try {
          const buf = Buffer.from(String(arr[i].audio_base_64 || ""), "base64");
          if (!buf.length) continue;
          const blob = await put(`eleven/design-${base}-${i}.mp3`, buf, { access: "public", contentType: "audio/mpeg", addRandomSuffix: true });
          previews.push({ generatedVoiceId: arr[i].generated_voice_id, url: blob.url, durationSecs: arr[i].duration_secs });
        } catch {  }
      }
      res.status(200).json({ previews });
      return;
    }
    if (act === "design_save") {
      const name = String(body?.name || "").trim();
      const description = String(body?.description || "").trim();
      const generatedVoiceId = String(body?.generatedVoiceId || "").trim();
      if (!name || !generatedVoiceId) { res.status(400).json({ error: "name + generatedVoiceId required" }); return; }
      const r = await fetch(`${EL}/v1/text-to-voice/create-voice-from-preview`, {
        method: "POST", headers: { ...H, "Content-Type": "application/json" },
        body: JSON.stringify({ voice_name: name, voice_description: description, generated_voice_id: generatedVoiceId }),
      });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) { res.status(502).json({ error: `design_save ${r.status}: ${JSON.stringify(d).slice(0, 260)}` }); return; }
      res.status(200).json({ voiceId: d?.voice_id, name: d?.name });
      return;
    }

    res.status(400).json({ error: "unknown action (use clone | tts | sts | design | design_save)" });
  } catch (e: any) {
    res.status(502).json({ error: String(e?.message || e).slice(0, 300) });
  }
}
