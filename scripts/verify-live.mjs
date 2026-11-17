#!/usr/bin/env node
// Post-merge check of the public site (KINGDOM-068-G).
//
//   node scripts/verify-live.mjs <merge-commit-sha> [--checks config/verify-live/pr-84.json]
//        [--origin https://www.eaglish.store] [--wait-minutes 15] [--interval-seconds 30] [--max-files 80] [--base <sha>]
//   --base compares <base>..<sha> instead of the commit against its first parent: use it after several merges in a row.
//
// What it does, read-only and with no keys:
//   1. finds the files this commit changed (against its first parent, so a merge commit lists the PR's files);
//   2. waits for GitHub Pages to deploy: every changed file that the site serves must be byte-identical to the
//      file at that commit (a removed file must answer 404). Content equality is the version proof: Pages
//      deploys straight from main and a commit cannot contain its own hash, so there is no build marker to read;
//   3. checks the strings listed in an optional checks file (page path + text that must / must not be there);
//   4. prints a block that can be pasted into a receipt. Any FAIL exits 1.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

export const DEFAULT_ORIGIN='https://www.eaglish.store';
// Files in the repo that GitHub Pages does not serve as site content.
const NOT_SERVED=[/^(?:scripts|tests|docs|config|reports|node_modules|src|flights-pipeline|\.github|\.claude)\//,/^(?:package(?:-lock)?\.json|AGENTS\.md|CNAME|_config\.yml|tailwind\.config\.[cm]?js|\.[^/]+)$/,/\.md$/];

export function servedPath(file){
 if(NOT_SERVED.some(re=>re.test(file)))return null;
 if(file==='index.html')return '/';
 if(file.endsWith('/index.html'))return '/'+file.slice(0,-'index.html'.length);
 return '/'+file;
}
const encodePath=p=>p.split('/').map(s=>encodeURIComponent(decodeURIComponent(s))).join('/');
export const liveUrl=(origin,path)=>origin.replace(/\/$/,'')+encodePath(path);
const sha256=buf=>createHash('sha256').update(buf).digest('hex');

function git(repoDir,args,{buffer=false}={}){
 return execFileSync('git',args,{cwd:repoDir,maxBuffer:256*1024*1024,encoding:buffer?'buffer':'utf8',stdio:['ignore','pipe','pipe']});
}
export function changedFiles(repoDir,sha,base=null){
 if(base){
  const b=git(repoDir,['rev-parse','--verify',`${base}^{commit}`]).trim();
  return git(repoDir,['diff','--name-status','--no-renames',b,sha]).split('\n').filter(Boolean).map(line=>{const [status,...rest]=line.split('\t');return {status:status[0],file:rest.join('\t')};});
 }
 const parents=git(repoDir,['rev-list','--parents','-n','1',sha]).trim().split(' ').slice(1);
 // A merge commit is compared with its first parent, so it lists the PR's files; a root commit lists everything it added.
 const out=parents.length
  ?git(repoDir,['diff','--name-status','--no-renames',parents[0],sha])
  :git(repoDir,['show','--name-status','--no-renames','--format=',sha]);
 return out.split('\n').filter(Boolean).map(line=>{
  const [status,...rest]=line.split('\t');
  return {status:status[0],file:rest.join('\t')};
 });
}
export const fileAt=(repoDir,sha,file)=>git(repoDir,['show',`${sha}:${file}`],{buffer:true});

async function get(fetchImpl,url,timeoutMs){
 try{
  const res=await fetchImpl(url,{redirect:'follow',headers:{'cache-control':'no-cache',pragma:'no-cache'},signal:AbortSignal.timeout(timeoutMs)});
  return {status:res.status,body:Buffer.from(await res.arrayBuffer())};
 }catch(error){
  return {status:0,body:Buffer.alloc(0),error:String(error?.cause?.code||error?.message||error)};
 }
}
const bust=url=>url+(url.includes('?')?'&':'?')+'verify-live='+Date.now();

export function evaluateChecks({items,responses}){
 return items.map(item=>{
  const r=responses.get(item.url)||{status:0,body:Buffer.alloc(0)};
  if(item.kind==='same'){
   const ok=r.status===200&&sha256(r.body)===item.expectedHash;
   return {...item,http:r.status,ok,note:ok?'內容與 commit 相同':r.status!==200?`HTTP ${r.status}${r.error?`（${r.error}）`:''}`:'內容與 commit 不同（部署未完成或沒有生效）'};
  }
  if(item.kind==='gone'){
   const ok=r.status===404;
   return {...item,http:r.status,ok,note:ok?'已移除（404）':`仍然回 HTTP ${r.status}`};
  }
  const text=r.body.toString('utf8');
  const missing=(item.mustInclude||[]).filter(s=>!text.includes(s));
  const present=(item.mustNotInclude||[]).filter(s=>text.includes(s));
  const ok=r.status===(item.status??200)&&!missing.length&&!present.length;
  const parts=[];
  if(r.status!==(item.status??200))parts.push(`HTTP ${r.status}，預期 ${item.status??200}${r.error?`（${r.error}）`:''}`);
  if(missing.length)parts.push('缺少：'+missing.map(s=>JSON.stringify(s.length>40?s.slice(0,40)+'…':s)).join('、'));
  if(present.length)parts.push('不該出現但出現：'+present.map(s=>JSON.stringify(s.length>40?s.slice(0,40)+'…':s)).join('、'));
  return {...item,http:r.status,ok,note:ok?`${(item.mustInclude||[]).length} 個字串都在`+((item.mustNotInclude||[]).length?`，${item.mustNotInclude.length} 個不該出現的都沒有`:''):parts.join('；')};
 });
}

export async function verifyLive({sha,base=null,repoDir=process.cwd(),origin=DEFAULT_ORIGIN,checks=null,waitMs=15*60e3,intervalMs=30e3,maxFiles=80,requestTimeoutMs=20e3,fetchImpl=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=()=>Date.now(),log=()=>{}}){
 const full=git(repoDir,['rev-parse','--verify',`${sha}^{commit}`]).trim();
 const subject=git(repoDir,['log','-1','--format=%s',full]).trim();
 const changed=changedFiles(repoDir,full,base);
 const served=[],skippedNotServed=[];
 for(const c of changed){const p=servedPath(c.file);(p?served:skippedNotServed).push({...c,path:p});}
 const notes=[];
 let listed=served;
 if(served.length>maxFiles){listed=served.slice(0,maxFiles);notes.push(`改到 ${served.length} 個網站檔案，只核對前 ${maxFiles} 個（--max-files）；其餘 ${served.length-maxFiles} 個沒核對`);}
 const items=listed.map(c=>c.status==='D'
  ?{kind:'gone',label:`${c.path}（移除）`,url:liveUrl(origin,c.path)}
  :{kind:'same',label:c.path,url:liveUrl(origin,c.path),expectedHash:sha256(fileAt(repoDir,full,c.file))});
 for(const page of checks?.pages||[]){
  items.push({kind:'text',label:`${page.path} 內容`,url:liveUrl(origin,page.path),mustInclude:page.mustInclude,mustNotInclude:page.mustNotInclude,status:page.status});
 }
 if(!items.length)notes.push('這個 commit 沒有改到網站會提供的檔案，也沒有給檢查設定：沒有東西可核對');
 const started=now();
 let results=[],attempts=0;
 for(;;){
  attempts++;
  const responses=new Map();
  for(const item of items){
   if(!responses.has(item.url))responses.set(item.url,await get(fetchImpl,bust(item.url),requestTimeoutMs));
  }
  results=evaluateChecks({items,responses});
  const done=results.every(r=>r.ok);
  log(`第 ${attempts} 輪：${results.filter(r=>r.ok).length}/${results.length} 通過`);
  if(done||now()-started+intervalMs>waitMs)break;
  await sleep(intervalMs);
 }
 const ok=results.length>0&&results.every(r=>r.ok);
 return {ok,sha:full,base:base?git(repoDir,['rev-parse','--verify',`${base}^{commit}`]).trim():null,subject,origin,checkedAt:new Date(now()),attempts,waitedMs:now()-started,results,notes,skippedNotServed:skippedNotServed.map(c=>c.file)};
}

const taipei=date=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',dateStyle:'short',timeStyle:'medium'}).format(date)+'（台北）';
export function formatReport(r){
 const fails=r.results.filter(x=>!x.ok).length;
 const lines=[
  `上線核實｜${new URL(r.origin).host}｜${taipei(r.checkedAt)}`,
  `commit：${r.sha.slice(0,7)}（${r.subject}）`+(r.base?`；範圍：${r.base.slice(0,7)}..${r.sha.slice(0,7)}`:''),
  `結果：${r.ok?'PASS':'FAIL'}（${r.results.length} 項，${fails} 項失敗；輪詢 ${r.attempts} 輪，約 ${Math.round(r.waitedMs/1000)} 秒）`,
  '',
  '| 項目 | 結果 | HTTP | 說明 |','|---|---|---|---|',
  ...r.results.map(x=>`| ${x.label.replace(/\|/g,'\\|')} | ${x.ok?'PASS':'FAIL'} | ${x.http||'—'} | ${x.note.replace(/\|/g,'\\|')} |`)
 ];
 for(const n of r.notes)lines.push('',`注意：${n}`);
 if(r.skippedNotServed.length)lines.push('',`沒有核對（網站不提供的檔案）：${r.skippedNotServed.length} 個，例如 ${r.skippedNotServed.slice(0,3).join('、')}`);
 lines.push('','範圍：只證明站上這些檔案和這個 commit 一致、關鍵字串在；不代表畫面看起來正確，也不代表 Google 已收錄。');
 return lines.join('\n');
}

export function parseArgs(argv){
 const out={sha:null,base:null,checks:null,origin:DEFAULT_ORIGIN,waitMinutes:15,intervalSeconds:30,maxFiles:80};
 for(let i=0;i<argv.length;i++){
  const a=argv[i],next=()=>{if(i+1>=argv.length)throw Error(`${a} needs a value`);return argv[++i];};
  if(a==='--checks')out.checks=next();
  else if(a==='--base')out.base=next();
  else if(a==='--origin')out.origin=next();
  else if(a==='--wait-minutes')out.waitMinutes=Number(next());
  else if(a==='--interval-seconds')out.intervalSeconds=Number(next());
  else if(a==='--max-files')out.maxFiles=Number(next());
  else if(a.startsWith('--'))throw Error('unknown option '+a);
  else if(!out.sha)out.sha=a;
  else throw Error('only one commit is expected');
 }
 for(const k of ['waitMinutes','intervalSeconds','maxFiles'])if(!Number.isFinite(out[k])||out[k]<=0)throw Error(`--${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())} must be a positive number`);
 if(!/^https?:\/\//.test(out.origin))throw Error('--origin must be an http(s) URL');
 return out;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=parseArgs(process.argv.slice(2));
  if(!args.sha){console.error('usage: node scripts/verify-live.mjs <merge-commit-sha> [--checks file.json] [--origin url]');process.exit(2);}
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const checks=args.checks?JSON.parse(readFileSync(resolve(args.checks),'utf8')):null;
  const result=await verifyLive({sha:args.sha,base:args.base,repoDir:root,origin:args.origin,checks,waitMs:args.waitMinutes*60e3,intervalMs:args.intervalSeconds*1e3,maxFiles:args.maxFiles,log:m=>console.error('[verify-live] '+m)});
  console.log(formatReport(result));
  process.exit(result.ok?0:1);
 }catch(error){
  console.error('verify-live: '+(error.stderr?.toString().trim()||error.message));
  process.exit(2);
 }
}
