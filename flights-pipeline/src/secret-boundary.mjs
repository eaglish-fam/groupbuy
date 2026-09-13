import { execFileSync } from 'node:child_process';

// Existing account; secret bytes never appear in arguments, output, database or source.
const known={
  TRAVELPAYOUTS_API_TOKEN:{service:'terra-travelpayouts-api',account:'zosia'},
  SERPAPI_API_KEY:{service:'terra-serpapi-api',account:'zosia'},
};
export function providerSecretLocator(provider) {
  const name={travelpayouts:'TRAVELPAYOUTS_API_TOKEN',serpapi:'SERPAPI_API_KEY'}[provider];
  return name ? {environmentVariable:name,...known[name]} : null;
}
export function providerEnvironment(env=process.env) {
  const resolved={...env};
  if(process.platform==='darwin')for(const [name,locator] of Object.entries(known)) {
    if(resolved[name])continue;
    try {resolved[name]=execFileSync('/usr/bin/security',['find-generic-password','-s',locator.service,'-a',locator.account,'-w'],{encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']}).trim();}catch {}
  }
  return resolved;
}
