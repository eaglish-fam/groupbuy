#!/usr/bin/env node
import { execFileSync,spawnSync } from 'node:child_process';
import { providerSecretLocator } from './secret-boundary.mjs';

const provider=process.argv[2],fromClipboard=process.argv.includes('--from-clipboard'),locator=providerSecretLocator(provider);
if(process.platform!=='darwin')throw new Error('Secure setup currently requires macOS Keychain');
if(!locator)throw new Error('Supported provider: travelpayouts or serpapi');
let input,stdio='inherit';
if(fromClipboard){
  const secret=execFileSync('/usr/bin/pbpaste',{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  if(!/^\S{32,128}$/.test(secret))throw new Error('Clipboard does not contain a plausible non-empty API credential');
  input=secret+'\n'+secret+'\n';stdio=['pipe','ignore','ignore'];
  console.log(`Importing the ${provider} credential from the local clipboard. Its value is not printed or logged.`);
}else console.log(`Paste the ${provider} credential twice at the secure Keychain prompts. Input is hidden and is not written to logs.`);
const result=spawnSync('/usr/bin/security',['add-generic-password','-U','-s',locator.service,'-a',locator.account,'-w'],{input,stdio});
if(result.status!==0)throw new Error('Credential setup was cancelled or failed');
const stored=execFileSync('/usr/bin/security',['find-generic-password','-s',locator.service,'-a',locator.account,'-w'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
if(!stored)throw new Error('Keychain item is empty; copy the API credential and run setup again');
console.log(JSON.stringify({configured:true,provider,secretBoundary:'macOS Keychain',environmentVariable:locator.environmentVariable}));
