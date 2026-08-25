#!/usr/bin/env node
   
                                                                                               
  
                                                                                                 
                                                                                                    
                                                                                                          
                                                                                                      
                                                                                                     
  
                                                                                                       
                                                                                                     
                          
   
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'api');
if (!fs.existsSync(apiDir)) process.exit(0);

const files = fs.readdirSync(apiDir).filter((f) => f.endsWith('.ts'));
                                                                                             
const DECL_RE = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let)\s+([A-Za-z_$][\w$]*)/;

let problemas = [];

for (const f of files) {
  const full = path.join(apiDir, f);
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  const seen = new Map();                                      
  lines.forEach((line, idx) => {
    const m = DECL_RE.exec(line);
    if (!m) return;
    const nome = m[1];
    if (seen.has(nome)) {
      problemas.push({ file: f, nome, primeira: seen.get(nome), repetida: idx + 1 });
    } else {
      seen.set(nome, idx + 1);
    }
  });
}

if (problemas.length) {
  console.error('');
  console.error('❌ DUPLICATE TOP LEVEL DECLARATION in api/*.ts, which would crash ESM in production:');
  for (const p of problemas) {
    console.error(`   ${p.file}: "${p.nome}" declared on line ${p.primeira} and again on line ${p.repetida}`);
  }
  console.error('');
  console.error('   In an ES module this is a load time SyntaxError and every request fails.');
  console.error('   esbuild does not catch it. Remove or rename the duplicate declaration before deploying.');
  console.error('');
  process.exit(1);
}

console.log(`✓ api duplicates: ${files.length} files, no duplicate top level declarations.`);
