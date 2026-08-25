#!/usr/bin/env node
   
                                                                                
  
                                                                                
                                                                                
                                                                                    
                                                                      
  
                                                                            
                                                                                
                                           
   
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const raiz = path.join(__dirname, "..");
const erros = [];
const avisos = [];

                                                                               
const app = fs.readFileSync(path.join(raiz, "src/App.tsx"), "utf8");
const ini = app.indexOf("const EMAIL_JOURNEY_BASE_PT");
const fim = app.indexOf("const EMAIL_JOURNEY_TEMPLATES_PT");
if (ini < 0 || fim < 0) {
  console.error("\n[check-email-caps] EMAIL_JOURNEY_BASE_PT was not found in src/App.tsx\n");
  process.exit(1);
}
const bloco = app.slice(ini, fim);

                                                      
const brutos = [];
const re = /phase:\s*"([a-z_]+)"/g;
let m, pos = [];
while ((m = re.exec(bloco))) pos.push({ phase: m[1], at: m.index });
pos.forEach((p, i) => {
  const txt = bloco.slice(p.at, i + 1 < pos.length ? pos[i + 1].at : bloco.length);
  const um = (k) => { const r = txt.match(new RegExp(k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"')); return r ? r[1] : ""; };
  const todos = (k) => [...txt.matchAll(new RegExp(k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"', "g"))].map((x) => x[1]);
  brutos.push({
    phase: p.phase, subject: um("subject"), preheader: um("preheader"),
    body: um("body").replace(/\\n/g, "\n"), ctaLabel: um("ctaLabel"),
    blocks: todos("titulo").map((t, k) => ({ titulo: t, descricao: todos("descricao")[k] || "" })),
  });
});

                                      
const tmp = path.join(raiz, "node_modules", ".cache", "check-email-caps");
fs.mkdirSync(tmp, { recursive: true });
const entry = path.join(tmp, "entry.mjs");
fs.writeFileSync(entry, `
import { EMAIL_CAPS, palavraLongaDemais } from ${JSON.stringify(path.join(raiz, "src/lib/emailTemplates/caps.ts"))};
import { buildEmailSpec } from ${JSON.stringify(path.join(raiz, "src/lib/emailTemplates/spec.ts"))};
const brutos = ${JSON.stringify(brutos)};
const out = brutos.map((t) => {
  const s = buildEmailSpec(t, {});
  return { phase: t.phase, subject: s.statementRaw, preheader: t.preheader,
    paragraphs: s.paragraphs, rows: s.rows, cta: t.ctaLabel };
});
console.log(JSON.stringify({ caps: EMAIL_CAPS, out }));
`);
let dados;
try {
  const bundle = path.join(tmp, "bundle.cjs");
  execFileSync(path.join(raiz, "node_modules/.bin/esbuild"),
    [entry, "--bundle", "--platform=node", "--format=cjs", "--outfile=" + bundle, "--log-level=error"],
    { stdio: ["ignore", "ignore", "inherit"] });
  dados = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: "utf8" }));
} catch (e) {
  console.error("\n[check-email-caps] could not build the specifications:", e.message, "\n");
  process.exit(1);
}

const { caps } = dados;
const ver = (fase, campo, chave, txt) => {
  const c = caps[chave];
  const n = String(txt || "").length;
  if (n > c.max) erros.push(`${fase} | ${campo}: ${n} characters, layout maximum is ${c.max}: "${String(txt).slice(0, 52)}..."`);
  else if (n > c.alvo[1]) avisos.push(`${fase} | ${campo}: ${n} characters, above the target of ${c.alvo[1]} but still within the limit`);
  const w = String(txt || "").split(/\s+/).find((x) => x.replace(/[.,;:!?()"«»]/g, "").length > c.palavraMax);
  if (w) erros.push(`${fase} | ${campo}: word "${w}" has ${w.length} letters and the line supports ${c.palavraMax}`);
};

for (const t of dados.out) {
  ver(t.phase, "subject", "subject", t.subject);
  ver(t.phase, "preheader", "preheader", t.preheader);
  t.paragraphs.forEach((p, i) => ver(t.phase, `paragraph ${i + 1}`, "body", p));
  t.rows.forEach((r, i) => { ver(t.phase, `label ${i + 1}`, "blockKey", r.key); ver(t.phase, `row ${i + 1}`, "blockText", r.text); });
  if (t.cta) ver(t.phase, "button", "cta", t.cta);
}

if (erros.length) {
  console.error("\n[check-email-caps] build blocked: copy exceeds the layout limits\n");
  for (const e of erros) console.error("  ✗ " + e);
  console.error("");
  process.exit(1);
}
if (avisos.length) for (const a of avisos.slice(0, 8)) console.warn("  ! " + a);
console.log(`[check-email-caps] ok: ${dados.out.length} templates fit the layout (${Object.keys(caps).length} fields checked${avisos.length ? `, ${avisos.length} near the limit` : ""}).`);
