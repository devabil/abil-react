/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                   
                                                                                               
                                                                                              
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { runtime: "nodejs" };

function esc(s: any): string {
  return String(s || "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" } as any)[c]);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const q = (req.query || {}) as Record<string, string>;
  const code = String(q.code || "");
  const state = String(q.state || "");
  const error = String(q.error_description || q.error || "");
                                                                        
  const payload = JSON.stringify({ source: "abil-oauth", provider: "linkedin", code, state, error }).replace(/</g, "\\u003c");
  const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>LinkedIn</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#0b0b0c;color:#e8e3d9;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center;max-width:340px;padding:24px">
  <p style="font-size:15px;margin:0 0 6px">${error ? "Erro do LinkedIn: " + esc(error) : "A ligar o LinkedIn…"}</p>
  <p style="opacity:.5;font-size:13px;margin:0">Podes fechar esta janela.</p>
</div>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage(${payload}, window.location.origin);
      setTimeout(function(){ try{ window.close(); }catch(e){} }, 500);
    }
  } catch (e) { /* noop */ }
</script>
</body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(html);
}
