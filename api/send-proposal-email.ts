                                                                                             
                                                                                    
  
                                                                                             
                                                                                              
                                                                                           
  
                                                                                                 
                                                       
                                                                                       
                                                                                     
                                                                        
                                                              
  
                                                                                                  
                                              
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 30 };

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
                                                                                                      
                                                                                                    
                                                                                                 
                                                                                                          
const SEND_HARD_OFF = process.env.ABIL_SEND_HARD_OFF !== "0";
                                                                                               
                                                                                                          
const DEFAULT_FROM = process.env.RESEND_FROM || "ABiL MEDiAS <onboarding@resend.dev>";

                                                                                                 
                                                                                                
                                                                                   
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;

const emailOk = (e: string): boolean => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || "").trim());

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}

function adminOk(req: VercelRequest): boolean {
  const password = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  const raw = req.headers["x-abil-admin"];
  const token = Array.isArray(raw) ? raw[0] : String(raw || "");
  const dot = token.indexOf(".");
  if (!password || dot <= 0 || !/^\d+$/.test(token.slice(0, dot))) return false;
  if (Date.now() > Number(token.slice(0, dot))) return false;
  const expected = crypto.createHmac("sha256", password).update(token.slice(0, dot)).digest("hex");
  const actual = token.slice(dot + 1);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }

                                                                                                     
  if (!RESEND_API_KEY) { res.status(503).json({ error: "resend nao configurado" }); return; }

  let body: any;
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); }
  catch { res.status(400).json({ error: "invalid JSON" }); return; }

                                                                            
  try {
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_PAYLOAD_BYTES) {
      res.status(413).json({ error: "payload demasiado grande (>4MB), anexo demasiado pesado" });
      return;
    }
  } catch {                                                                     }

  const to = String(body?.to || "").trim();
  const subject = String(body?.subject || "").slice(0, 300).trim();
  const html = String(body?.html || "");
  const att = body?.attachment && typeof body.attachment === "object" ? body.attachment : null;
  const filename = att ? String(att.filename || "proposta.pdf").slice(0, 120) : "";
  const contentBase64 = att ? String(att.contentBase64 || "") : "";

                                                                                                   
                                                                                                      
  if (body?.autonomous === true && SEND_HARD_OFF) {
    res.status(200).json({ ok: false, skipped: "hard_off_teaser", nota: "ABiL em teaser: envio autonomo travado por codigo (ABIL_SEND_HARD_OFF). Zero email sai; o rascunho fica a aguardar aprovacao." });
    return;
  }

  if (!emailOk(to)) { res.status(400).json({ error: "destinatário inválido" }); return; }
  if (!subject) { res.status(400).json({ error: "assunto em falta" }); return; }
  if (!html || html.length < 10) { res.status(400).json({ error: "html em falta" }); return; }

                                                                               
  const attachments: Array<{ filename: string; content: string }> = [];
  if (contentBase64) {
    if (contentBase64.length < 100) { res.status(400).json({ error: "anexo inválido (base64 demasiado curto)" }); return; }
    attachments.push({ filename: filename || "proposta.pdf", content: contentBase64 });
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: [to],
        subject,
        html,
        ...(attachments.length ? { attachments } : {}),
      }),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      res.status(502).json({ error: (data && (data.message || data.name || data.error)) || `resend http_${r.status}` });
      return;
    }
    res.status(200).json({ ok: true, id: data?.id || null });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e).slice(0, 200) });
  }
}
