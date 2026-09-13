import { execFileSync } from 'node:child_process';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { RadarStore } from './radar-store.mjs';

const entry=join(dirname(fileURLToPath(import.meta.url)),'radar-cli.mjs');
let failed=false;
try {process.stdout.write(execFileSync(process.execPath,[entry,'collect'],{encoding:'utf8',timeout:650000,stdio:['ignore','pipe','pipe']}));}catch{failed=true;console.error(JSON.stringify({status:'collection_failed',at:new Date().toISOString()}));}
const root=process.env.TERRA_FLIGHTS_DATA_DIR??join(homedir(),'Library','Application Support','Eaglish','flight-radar');
const s=new RadarStore(join(root,'fares.sqlite'));
try {
  const day=new Date().toISOString().slice(0,10),path=join(root,'backups','daily-'+day+'.sqlite');
  if(!existsSync(path))s.backup(path);
  console.log(JSON.stringify({at:new Date().toISOString(),backupDay:day,health:s.health(new Date().toISOString())}));
}finally{s.close();}
if(failed)process.exitCode=1;
