#!/usr/bin/env node
  
                                                                   
  
                                                                                   
                                                                               
                                                                                    
  
                                                                         
                                                                         
                                                                                
  
                                                                                          
   
const { execSync } = require("node:child_process");
const fs = require("node:fs");

const cfg = fs.existsSync("tsconfig.app.json") ? "tsconfig.app.json" : "tsconfig.json";
let out = "";
try {
  out = execSync(`npx tsc --noEmit -p ${cfg} --ignoreDeprecations 6.0`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
                                                                                                          
  out = String((e && e.stdout) || "") + String((e && e.stderr) || "");
}

const offenders = out.split("\n").filter((l) => /error TS2304|error TS2552/.test(l));
if (offenders.length > 0) {
  console.error("\n⛔ check-undefined-refs: undefined references found, which would blank the dashboard. Build blocked:\n");
  offenders.forEach((l) => console.error("   " + l.trim()));
  console.error(`\n   ${offenders.length} occurrence(s). Fix the missing import, constant or hook before deploying.\n`);
  process.exit(1);
}
console.log("✓ check-undefined-refs: 0 undefined references (TS2304/TS2552).");
