   
                                                                             
                                                                                    
                                                                    
  
                                                                                    
                                                                                     
                                                                                
                                                                            
  
            
                                                                           
                              
                                                                                   
  
                                 
                                                                               
                                                                                           
  
                                                                                
                                                                                    
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

                                                                                   
                                                                                   
                                                                          
                                                                                    
                                                                        
                                                                   
const ALLOWED_PREFIX = new Set(["covers", "assets", "social", "email", "airefs", "catalog", "autovideo", "equipa"]);
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif",
  "video/mp4", "video/quicktime", "video/webm", "video/x-m4v",
  "application/pdf",
]);
const MAX_SIZE = 200 * 1024 * 1024;                                    

function setCors(res: VercelResponse) {
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

function readRaw(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer | string) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

type ParsedPart = { fields: Record<string, string>; file?: { filename: string; contentType: string; data: Buffer } };

function parseMultipart(buf: Buffer, boundary: string): ParsedPart {
  const fields: Record<string, string> = {};
  let file: ParsedPart["file"];
  const delimiter = Buffer.from(`--${boundary}`);
  const crlfcrlf = Buffer.from("\r\n\r\n");
  let start = buf.indexOf(delimiter);
  while (start !== -1) {
    const next = buf.indexOf(delimiter, start + delimiter.length);
    if (next === -1) break;
    const partStart = start + delimiter.length + 2;                                     
    const part = buf.subarray(partStart, next - 2);                        
    start = next;
    const headerEnd = part.indexOf(crlfcrlf);
    if (headerEnd === -1) continue;
    const header = part.subarray(0, headerEnd).toString("utf8");
    const body = part.subarray(headerEnd + 4);
    const nameM = header.match(/name="([^"]*)"/);
    if (!nameM) continue;
    const fnameM = header.match(/filename="([^"]*)"/);
    const ctM = header.match(/Content-Type:\s*([^\r\n]+)/i);
    if (fnameM) {
      file = { filename: fnameM[1], contentType: ctM ? ctM[1].trim() : "application/octet-stream", data: body };
    } else {
      fields[nameM[1]] = body.toString("utf8");
    }
  }
  return { fields, file };
}

function safeName(name: string): string {
  return (name || "file").replace(/[^A-Za-z0-9._-]/g, "-").toLowerCase().slice(0, 120) || "file";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }
  try {
    const ct = String(req.headers["content-type"] || "");
    const bM = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundary = bM ? (bM[1] || bM[2]).trim() : "";
    if (!boundary) { res.status(400).json({ error: "missing multipart boundary" }); return; }

    const raw = await readRaw(req);
    if (raw.length > MAX_SIZE) { res.status(413).json({ error: "file too large (max 200MB)" }); return; }

    const { fields, file } = parseMultipart(raw, boundary);
    if (!file || !file.data || file.data.length === 0) { res.status(400).json({ error: "no file" }); return; }

    const prefix = String(fields.prefix || "");
    if (!ALLOWED_PREFIX.has(prefix)) { res.status(400).json({ error: `invalid prefix; must be one of ${[...ALLOWED_PREFIX].join("|")}` }); return; }
    if (!ALLOWED_CONTENT_TYPES.has(file.contentType)) { res.status(415).json({ error: `content-type not allowed: ${file.contentType}` }); return; }

    const baseName = safeName(fields.filename || file.filename);
    const suffix = crypto.randomBytes(6).toString("hex");
    const finalName = `${suffix}-${baseName}`;
    const relPath = `${prefix}/${finalName}`;

    const uploadDir = process.env.ABIL_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
    const destDir = path.join(uploadDir, prefix);
    await fs.mkdir(destDir, { recursive: true });
    await fs.writeFile(path.join(destDir, finalName), file.data);

    const publicBase = (process.env.ABIL_PUBLIC_BASE || "").replace(/\/$/, "");
    const url = `${publicBase}/uploads/${relPath}`;
    res.status(200).json({ url, pathname: relPath });
  } catch (e) {
    console.error("[asset-upload] error:", e);
    res.status(500).json({ error: String((e as Error).message || e) });
  }
}
