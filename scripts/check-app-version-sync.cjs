#!/usr/bin/env node
   
                                                                                           
                                                                                     
   
const fs = require('fs');
const path = require('path');

const clientFile = path.join(__dirname, '..', 'src', 'lib', 'cloudProjects.ts');
const serverFile = path.join(__dirname, '..', 'api', 'projects.ts');

const cli = fs.readFileSync(clientFile, 'utf8');
const srv = fs.readFileSync(serverFile, 'utf8');

const cliMatch = cli.match(/export const APP_VERSION = "([^"]+)"/);
const srvMatch = srv.match(/const SERVER_APP_VERSION = "([^"]+)"/);

if (!cliMatch || !srvMatch) {
  console.error('❌ APP_VERSION or SERVER_APP_VERSION was not found. Check the regular expression in check-app-version-sync.cjs.');
  process.exit(1);
}

if (cliMatch[1] !== srvMatch[1]) {
  console.error('');
  console.error('❌ APP_VERSION MISMATCH:');
  console.error(`   Client (cloudProjects.ts):  ${cliMatch[1]}`);
  console.error(`   Server (api/projects.ts):    ${srvMatch[1]}`);
  console.error('');
  console.error('   If deployed like this, the new version banner will never disappear.');
  console.error('   Set both constants to the same value before building.');
  console.error('');
  process.exit(2);
}

console.log(`✓ APP_VERSION sync OK: ${cliMatch[1]}`);
