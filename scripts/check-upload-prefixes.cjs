#!/usr/bin/env node
   
                                                                             
  
                                                                                    
                                                                                   
                                                                                    
                                                                                     
                                                                              
                                                                               
                                                                                     
                                                                
  
            
                                                                                   
                                                              
                                                       
                                                       
                                                                             
                                                                              
  
                                                                                   
   
const fs = require("fs");
const path = require("path");
const raiz = path.join(__dirname, "..");
const ler = (p) => fs.readFileSync(path.join(raiz, p), "utf8");
const erros = [];
const iguais = (a, b) => a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

                                                                                                                                   
const uniaoDe = (ficheiro) => {
  const t = ler(ficheiro);
  const m = t.match(/prefix:\s*((?:"[a-z0-9_-]+"\s*\|\s*)*"[a-z0-9_-]+")\s*;/);
  if (!m) { erros.push(`${ficheiro}: prefix type not found, expected \`prefix: "a" | "b";\``); return null; }
  return m[1].split("|").map((s) => s.trim().replace(/"/g, ""));
};
const uCloud = uniaoDe("src/lib/cloudProjects.ts");
const uStore = uniaoDe("src/lib/assetStore.ts");
if (uCloud && uStore && !iguais(uCloud, uStore)) {
  erros.push(`the prefix type differs between the two client files:\n    cloudProjects.ts: ${uCloud.join(", ")}\n    assetStore.ts:    ${uStore.join(", ")}`);
}
const CANONICO = uCloud || uStore || [];
if (!CANONICO.length) erros.push("no client prefix type could be read");

                                                                                                                                   
const usados = new Set();
(function varrer(dir) {
  for (const nome of fs.readdirSync(dir)) {
    const p = path.join(dir, nome);
    const st = fs.statSync(p);
    if (st.isDirectory()) { varrer(p); continue; }
    if (!/\.(ts|tsx)$/.test(nome)) continue;
    const txt = fs.readFileSync(p, "utf8");
    for (const m of txt.matchAll(/prefix:\s*"([a-z0-9_-]+)"/g)) usados.add(m[1]);
  }
})(path.join(raiz, "src"));
for (const u of usados) {
  if (!CANONICO.includes(u)) erros.push(`src/ uploads with prefix "${u}", which is not in the type (${CANONICO.join(", ")})`);
}

                                                                                                                                                                 
const tokenTxt = ler("api/upload-token.ts");
const mToken = tokenTxt.match(/const safe = \[([^\]]+)\]/);
if (!mToken) erros.push("api/upload-token.ts: allowlist not found (`const safe = [...]`)");
else {
  const lista = mToken[1].split(",").map((s) => s.trim().replace(/"/g, "").replace(/\/$/, "")).filter(Boolean);
  if (!iguais(lista, CANONICO)) {
    erros.push(`api/upload-token.ts accepts [${lista.join(", ")}] but the client uses [${CANONICO.join(", ")}]`);
  }
}
const assetTxt = ler("api/asset-upload.ts");
const mAsset = assetTxt.match(/ALLOWED_PREFIX = new Set\(\[([^\]]+)\]\)/);
if (!mAsset) erros.push("api/asset-upload.ts: ALLOWED_PREFIX not found");
else {
  const lista = mAsset[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
  if (!iguais(lista, CANONICO)) {
    erros.push(`api/asset-upload.ts accepts [${lista.join(", ")}] but the client uses [${CANONICO.join(", ")}]`);
  }
}

                                                                                                                                         
const storeTxt = ler("api/store.ts");
const conjunto = (nome) => {
  const m = storeTxt.match(new RegExp(nome + "\\s*=\\s*new Set\\(\\[([^\\]]+)\\]\\)"));
  return m ? m[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean) : null;
};
const priv = conjunto("PRIVADAS_NO_BLOB");
const nunca = conjunto("NUNCA_PUBLICO");
if (!priv || !nunca) erros.push("api/store.ts: PRIVADAS_NO_BLOB or NUNCA_PUBLICO was not found");
else if (!iguais(priv, nunca)) {
  erros.push(`api/store.ts: PRIVADAS_NO_BLOB for writes and NUNCA_PUBLICO for reads have diverged.\n    write only: ${priv.filter((k) => !nunca.includes(k)).join(", ") || "none"}\n    read only: ${nunca.filter((k) => !priv.includes(k)).join(", ") || "none"}\n    A private section present in only one list could reach the public blob.`);
}

                                                                                                            
                                                                                    
                                                                                      
const tiposDe = (txt, re, nome) => {
  const m = txt.match(re);
  if (!m) { erros.push(`${nome}: accepted content type list not found`); return null; }
  return m[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
};
const tToken = tiposDe(tokenTxt, /allowedContentTypes:\s*\[([^\]]+)\]/, "api/upload-token.ts");
const tAsset = tiposDe(assetTxt, /ALLOWED_CONTENT_TYPES\s*=\s*new Set\(\[([^\]]+)\]\)/, "api/asset-upload.ts");
if (tToken && tAsset && !iguais(tToken, tAsset)) {
  erros.push(`the two upload paths accept different content types.\n    upload-token only: ${tToken.filter((t) => !tAsset.includes(t)).join(", ") || "none"}\n    asset-upload only: ${tAsset.filter((t) => !tToken.includes(t)).join(", ") || "none"}`);
}
                                                                        
const appTxt = ler("src/App.tsx");
const mMap = appTxt.match(/const map: Record<string, string> = \{([\s\S]{0,600}?)\};/);
if (mMap && tToken) {
  const doCliente = [...mMap[1].matchAll(/"([a-z]+\/[a-z0-9.+-]+)":/g)].map((m) => m[1]);
  const orfaos = doCliente.filter((t) => !tToken.includes(t));
  if (orfaos.length) erros.push(`mimeToExt in src/App.tsx knows types that /api/upload-token rejects: ${orfaos.join(", ")}`);
}

if (erros.length) {
  console.error("\n[check-upload-prefixes] build blocked\n");
  for (const e of erros) console.error("  ✗ " + e);
  console.error("");
  process.exit(1);
}
console.log(`[check-upload-prefixes] ok: ${CANONICO.length} consistent prefixes (${CANONICO.join(", ")}); ${usados.size} used in src/; ${(tToken||[]).length} matching file types across both paths; private store sections match.`);
