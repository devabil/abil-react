#!/usr/bin/env node
   
                                                                         
                                                                                 
   
const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "..", "api");
const holders = ["private-store.ts", "agent-memory.ts", "pending-decisions.ts"];
const sharedImport = 'from "./_vault-crypto.js"';
const outside = holders.filter((file) => {
  const source = fs.readFileSync(path.join(apiDir, file), "utf8");
  const withoutAdminLoginHash = source.replace(/crypto\.scryptSync\(password,\s*"abil_admin_auth_salt_v1",\s*32\)/g, "");
  return !source.includes(sharedImport) || source.includes("createCipheriv") || withoutAdminLoginHash.includes("scryptSync");
});
const shared = fs.readFileSync(path.join(apiDir, "_vault-crypto.ts"), "utf8");

if (outside.length || !shared.includes("VAULT_ENC_KEY") || !shared.includes("abil_vault_salt_v1")) {
  console.error("✗ check-vault-crypto: encrypted stores are not using the shared ABiL vault crypto module:");
  outside.forEach((file) => console.error("    api/" + file));
  process.exit(1);
}

console.log(`✓ check-vault-crypto: ${holders.length} encrypted stores use the shared module.`);
