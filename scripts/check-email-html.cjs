#!/usr/bin/env node
   
                                                                             
  
                                                                               
                                                                               
                                                                            
                                                                               
                                                        
  
                                               
                                                   
                                                                                   
                                                                     
                                                       
                                                                        
   
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const raiz = path.join(__dirname, "..");
const erros = [];

                                                                            
const tmp = path.join(raiz, "node_modules", ".cache", "check-email");
fs.mkdirSync(tmp, { recursive: true });
const entry = path.join(tmp, "entry.mjs");
fs.writeFileSync(entry, `
import { renderAbilEmailHtml } from ${JSON.stringify(path.join(raiz, "src/lib/emailTemplates/html.ts"))};
import { GROUNDS, PHASE_GROUND } from ${JSON.stringify(path.join(raiz, "src/lib/emailTemplates/tokens.ts"))};
const abs = (s) => (!s ? "" : /^https?:\\/\\//.test(s) ? s : "https://example.test" + s);
const out = {};
for (const fase of Object.keys(PHASE_GROUND)) {
  out[fase] = renderAbilEmailHtml({
    phase: fase, subject: "A test sentence with a representative length",
    body: "First paragraph.\\n\\nSecond paragraph.",
    ctaLabel: "A button", ctaUrl: "https://example.test/x",
    blocks: [{ titulo: "Key", descricao: "Description for the reading row." }],
  }, { absolute: abs, mergeName: "Test", preheader: "Preview" });
}
console.log(JSON.stringify({ html: out, grounds: GROUNDS, fases: PHASE_GROUND }));
`);
let dados;
try {
  const bundle = path.join(tmp, "bundle.cjs");
  execFileSync(path.join(raiz, "node_modules/.bin/esbuild"),
    [entry, "--bundle", "--platform=node", "--format=cjs", "--outfile=" + bundle, "--log-level=error"],
    { stdio: ["ignore", "ignore", "inherit"] });
  dados = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: "utf8" }));
} catch (e) {
  console.error("\n[check-email-html] could not render the emails:", e.message, "\n");
  process.exit(1);
}

for (const [fase, html] of Object.entries(dados.html)) {
                                                                                
  for (const m of html.matchAll(/style="([^"]*)"/g)) {
    const v = m[1].trimEnd();
    if (v && !v.endsWith(";") && !v.endsWith("%") && !/[a-z0-9)]$/i.test(v)) {
      erros.push(`${fase}: style attribute appears truncated: ...${v.slice(-48)}`);
    }
    if (/font:[^;]*$/.test(v) && !/(sans-serif|serif|monospace)/.test(v)) {
      erros.push(`${fase}: font declaration has no family, possibly due to nested double quotes: ...${v.slice(-48)}`);
    }
  }
                                                        
  if (/display:\s*grid/.test(html)) erros.push(`${fase}: uses display:grid, which Outlook ignores; use <table>`);
  if (/object-fit/.test(html)) erros.push(`${fase}: uses object-fit, which many email clients ignore`);
            
  if (/data:image\//.test(html)) erros.push(`${fase}: contains a base64 image, which duplicates the payload for every recipient`);
  const kb = Buffer.byteLength(html, "utf8") / 1024;
  if (kb > 40) erros.push(`${fase}: ${kb.toFixed(1)} KB of HTML exceeds the 40 KB email limit`);
                                                                              
  if (/linear-gradient/.test(html) && !/background-color:\s*#/.test(html)) {
    erros.push(`${fase}: gradient has no solid fallback, so Outlook would show the footer without a background`);
  }
}

                                        
const lum = (hex) => {
  const c = hex.replace("#", "");
  const v = [0, 2, 4].map((i) => {
    const x = parseInt(c.slice(i, i + 2), 16) / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for (const [nome, g] of Object.entries(dados.grounds)) {
  const r = ratio(g.pill.bg, g.pill.ink);
  if (r < 4.5) erros.push(`background ${nome}: CTA pill contrast is ${r.toFixed(2)}:1, minimum is 4.5:1`);
  const rt = ratio(g.bg, g.ink);
  if (rt < 4.5) erros.push(`background ${nome}: text contrast is ${rt.toFixed(2)}:1, minimum is 4.5:1`);
}

if (erros.length) {
  console.error("\n[check-email-html] build blocked\n");
  for (const e of erros) console.error("  ✗ " + e);
  console.error("");
  process.exit(1);
}
const pesos = Object.entries(dados.html).map(([f, h]) => `${f} ${(Buffer.byteLength(h, "utf8") / 1024).toFixed(1)}KB`);
console.log(`[check-email-html] ok: ${Object.keys(dados.html).length} phases rendered, complete styles, no grid, object-fit or base64, and pill and text contrast above 4.5:1 across ${Object.keys(dados.grounds).length} backgrounds.\n  ${pesos.join("  ")}`);
