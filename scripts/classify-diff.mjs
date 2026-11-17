#!/usr/bin/env node
// Which Sheet rows does a change to design/catalog-core.js classify differently?
//   node scripts/classify-diff.mjs <sheet.csv> [--old-ref origin/main] [--today YYYY-MM-DD] [--allow 品牌[,品牌…]]
// <sheet.csv> is the public 現正開團 tab exported as CSV (the file refresh:catalog reads). The "old" classify is
// read from git (default origin/main), the "new" one is the working tree. Rows whose status (key, label,
// long, soldOut) differs are listed; exit 1 if a row outside --allow differs, so "nothing else changed" is a check.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire(import.meta.url);

export function loadOldCore(ref,repoDir=root){
 const dir=mkdtempSync(join(tmpdir(),'classify-old-'));
 mkdirSync(join(dir,'design'));
 writeFileSync(join(dir,'design','catalog-core.js'),execFileSync('git',['show',`${ref}:design/catalog-core.js`],{cwd:repoDir,maxBuffer:1<<26}));
 copyFileSync(join(repoDir,'product-content.js'),join(dir,'product-content.js'));
 const core=createRequire(join(dir,'x.js'))('./design/catalog-core.js');
 return {core,cleanup:()=>rmSync(dir,{recursive:true,force:true})};
}
const sig=s=>JSON.stringify([s.key,s.label,!!s.long,!!s.soldOut]);

export function diffClassify({csvText,oldCore,newCore,today}){
 const Papa=req('../design/papaparse.min.js'),content=req('../product-content.js');
 const parsed=Papa.parse(csvText,{header:false,skipEmptyLines:true});
 if(parsed.errors.length)throw Error('Invalid CSV');
 const rows=content.sheetRows(parsed.data).filter(r=>String(r['品牌']||'').trim()&&!/^(\/\/|---|===)/.test(String(r['品牌']).trim()));
 const changed=[];
 for(const r of rows){
  const a=oldCore.classify(r,today),b=newCore.classify(r,today);
  if(sig(a)!==sig(b))changed.push({brand:String(r['品牌']).trim(),type:r['類型']||'',old:a,now:b});
 }
 return {total:rows.length,changed};
}
export function formatDiff(res,today,allow=[]){
 const lines=[`分類比對｜${today}｜${res.total} 列，${res.changed.length} 列不同`];
 if(res.changed.length){
  lines.push('','| 品牌 | 類型 | 舊 | 新 | 預期 |','|---|---|---|---|---|');
  for(const c of res.changed)lines.push(`| ${c.brand} | ${c.type} | ${c.old.key}／${c.old.label} | ${c.now.key}／${c.now.label} | ${allow.includes(c.brand)?'是':'**否**'} |`);
 }
 const unexpected=res.changed.filter(c=>!allow.includes(c.brand));
 lines.push('',unexpected.length?`FAIL：${unexpected.length} 列不在預期名單裡`:'PASS：不同的列都在預期名單裡（沒有名單時代表完全沒有不同）');
 return {text:lines.join('\n'),ok:!unexpected.length};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 let csv=null,ref='origin/main',today=null,allow=[];
 for(let i=0;i<args.length;i++){
  if(args[i]==='--old-ref')ref=args[++i];
  else if(args[i]==='--today')today=args[++i];
  else if(args[i]==='--allow')allow=String(args[++i]||'').split(',').map(s=>s.trim()).filter(Boolean);
  else if(!csv)csv=args[i];
  else{console.error('unexpected argument '+args[i]);process.exit(2);}
 }
 if(!csv){console.error('usage: node scripts/classify-diff.mjs <sheet.csv> [--old-ref origin/main] [--today YYYY-MM-DD] [--allow 品牌,品牌]');process.exit(2);}
 today=today||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date());
 const old=loadOldCore(ref);
 try{
  const res=diffClassify({csvText:readFileSync(resolve(csv),'utf8'),oldCore:old.core,newCore:req('../design/catalog-core.js'),today});
  const out=formatDiff(res,today,allow);
  console.log(out.text);
  process.exit(out.ok?0:1);
 }catch(e){console.error('classify-diff: '+e.message);process.exit(2);}finally{old.cleanup();}
}
