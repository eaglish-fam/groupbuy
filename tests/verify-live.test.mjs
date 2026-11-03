import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {servedPath,liveUrl,changedFiles,verifyLive,formatReport,parseArgs,evaluateChecks} from '../scripts/verify-live.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const git=(cwd,...args)=>execFileSync('git',['-c','user.name=t','-c','user.email=t@example.com','-c','commit.gpgsign=false',...args],{cwd,encoding:'utf8'}).trim();
const write=(dir,file,text)=>{mkdirSync(dirname(join(dir,file)),{recursive:true});writeFileSync(join(dir,file),text);};

// A throw-away repo with a base commit and a "PR" merged with --no-ff, plus a fake public site.
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'verify-live-'));
 git(dir,'init','-q','-b','main');
 write(dir,'index.html','<title>old</title>');
 write(dir,'blog/a/index.html','A1');
 write(dir,'gone/index.html','will be removed');
 write(dir,'scripts/tool.mjs','x');
 git(dir,'add','-A');git(dir,'commit','-qm','base');
 git(dir,'checkout','-q','-b','pr');
 write(dir,'index.html','<title>new brand title</title><meta name="description" content="d">');
 write(dir,'blog/a/index.html','A2');
 write(dir,'scripts/tool.mjs','y');
 write(dir,'docs/note.md','n');
 git(dir,'rm','-q','-r','gone');
 git(dir,'add','-A');git(dir,'commit','-qm','pr work');
 git(dir,'checkout','-q','main');
 write(dir,'unrelated.txt','u');git(dir,'add','-A');git(dir,'commit','-qm','main moved on');
 git(dir,'merge','--no-ff','-q','pr','-m','Merge PR');
 return {dir,sha:git(dir,'rev-parse','HEAD')};
}
const site=(files,{onRequest}={})=>new Promise(res=>{
 const hits=[];
 const server=http.createServer((req,rsp)=>{
  const path=new URL(req.url,'http://x').pathname;hits.push(path);
  const body=typeof files[path]==='function'?files[path](hits.filter(p=>p===path).length):files[path];
  if(body==null){rsp.statusCode=404;return rsp.end('nope');}
  rsp.end(body);
 });
 server.listen(0,'127.0.0.1',()=>res({origin:`http://127.0.0.1:${server.address().port}`,hits,close:()=>server.close()}));
});
const fast={waitMs:600,intervalMs:50,requestTimeoutMs:2000};

test('which files count as site content, and their public URLs',()=>{
 assert.equal(servedPath('index.html'),'/');
 assert.equal(servedPath('blog/a/index.html'),'/blog/a/');
 assert.equal(servedPath('sitemap.xml'),'/sitemap.xml');
 assert.equal(servedPath('assets/x/cover.webp'),'/assets/x/cover.webp');
 assert.equal(servedPath('design/design.js'),'/design/design.js');
 for(const f of ['scripts/a.mjs','tests/a.mjs','docs/a.md','config/a.json','reports/a.json','package.json','AGENTS.md','CNAME','README.md','.gitignore'])assert.equal(servedPath(f),null,f);
 assert.equal(liveUrl('https://www.eaglish.store/','/go/cal/'),'https://www.eaglish.store/go/cal/');
 assert.equal(liveUrl('https://x.test','/blog/鷹/'),'https://x.test/blog/%E9%B7%B9/');
});
test('a merge commit lists the PR files against its first parent, not unrelated main changes',()=>{
 const {dir,sha}=fixture();
 try{
  const files=changedFiles(dir,sha).map(c=>`${c.status}:${c.file}`).sort();
  assert.deepEqual(files,['D:gone/index.html','M:blog/a/index.html','M:index.html','M:scripts/tool.mjs','A:docs/note.md'].sort());
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('PASS when the live site serves the commit files, removed pages are 404, and the strings are there',async()=>{
 const {dir,sha}=fixture();
 const s=await site({'/':readFileSync(join(dir,'index.html')),'/blog/a/':'A2'});
 try{
  const checks={pages:[{path:'/',mustInclude:['<title>new brand title</title>'],mustNotInclude:['<title>old</title>']}]};
  const r=await verifyLive({sha,repoDir:dir,origin:s.origin,checks,...fast});
  assert.equal(r.ok,true,formatReport(r));
  assert.deepEqual(r.results.map(x=>x.label).sort(),['/','/ 內容','/blog/a/','/gone/（移除）'].sort());
  const text=formatReport(r);
  assert.match(text,/結果：PASS/);assert.ok(text.includes(sha.slice(0,7)));assert.match(text,/\| \/blog\/a\/ \| PASS \| 200 \|/);
  assert.match(text,/沒有核對（網站不提供的檔案）：2 個/);
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
test('FAIL (never a false PASS) while the site still serves the old content',async()=>{
 const {dir,sha}=fixture();
 const s=await site({'/':'<title>old</title>','/blog/a/':'A2'});
 try{
  const r=await verifyLive({sha,repoDir:dir,origin:s.origin,...fast});
  assert.equal(r.ok,false);
  const idx=r.results.find(x=>x.label==='/');
  assert.equal(idx.ok,false);assert.match(idx.note,/內容與 commit 不同/);
  assert.match(formatReport(r),/結果：FAIL/);
  assert.ok(r.attempts>1,'it polled before giving up');
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
test('it waits for the deploy: old content first, new content on a later poll',async()=>{
 const {dir,sha}=fixture();
 const fresh=readFileSync(join(dir,'index.html'));
 const s=await site({'/':n=>n<3?'<title>old</title>':fresh,'/blog/a/':'A2'});
 try{
  const r=await verifyLive({sha,repoDir:dir,origin:s.origin,waitMs:5000,intervalMs:20,requestTimeoutMs:2000});
  assert.equal(r.ok,true,formatReport(r));assert.ok(r.attempts>=3);
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
test('a removed page that is still live is a FAIL',async()=>{
 const {dir,sha}=fixture();
 const s=await site({'/':readFileSync(join(dir,'index.html')),'/blog/a/':'A2','/gone/':'still here'});
 try{
  const r=await verifyLive({sha,repoDir:dir,origin:s.origin,...fast});
  assert.equal(r.ok,false);
  assert.match(r.results.find(x=>x.label.startsWith('/gone/')).note,/仍然回 HTTP 200/);
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
test('a missing required string or a present forbidden string is a FAIL, and says which',async()=>{
 const {dir,sha}=fixture();
 const s=await site({'/':readFileSync(join(dir,'index.html')),'/blog/a/':'A2'});
 try{
  const r=await verifyLive({sha,repoDir:dir,origin:s.origin,checks:{pages:[{path:'/',mustInclude:['<meta name="robots" content="index">'],mustNotInclude:['new brand title']}]},...fast});
  assert.equal(r.ok,false);
  const note=r.results.find(x=>x.label==='/ 內容').note;
  assert.match(note,/缺少：/);assert.match(note,/不該出現但出現：/);
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
test('a forbidden string alone is enough to FAIL, even when every required string is present',async()=>{
 const {dir,sha}=fixture();
 const s=await site({'/':readFileSync(join(dir,'index.html')),'/blog/a/':'A2'});
 try{
  const r=await verifyLive({sha,repoDir:dir,origin:s.origin,checks:{pages:[{path:'/',mustInclude:['<title>new brand title</title>'],mustNotInclude:['name="description"']}]},...fast});
  assert.equal(r.ok,false);
  assert.match(r.results.find(x=>x.label==='/ 內容').note,/不該出現但出現：/);
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
test('an unreachable site is a FAIL with HTTP 0, not a crash',async()=>{
 const {dir,sha}=fixture();
 try{
  const r=await verifyLive({sha,repoDir:dir,origin:'http://127.0.0.1:9',waitMs:100,intervalMs:20,requestTimeoutMs:500});
  assert.equal(r.ok,false);
  assert.ok(r.results.every(x=>!x.ok&&x.http===0));
  assert.match(formatReport(r),/\| FAIL \| — \|/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('a commit with nothing to check is not reported as PASS',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'verify-live-'));
 try{
  git(dir,'init','-q','-b','main');write(dir,'scripts/a.mjs','1');git(dir,'add','-A');git(dir,'commit','-qm','only scripts');
  const r=await verifyLive({sha:git(dir,'rev-parse','HEAD'),repoDir:dir,origin:'http://127.0.0.1:9',...fast});
  assert.equal(r.ok,false);assert.match(r.notes.join(' '),/沒有東西可核對/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('the check is cache-busted and sends no credentials',async()=>{
 const seen=[];
 const fetchImpl=async(url,init)=>{seen.push({url,headers:init.headers});return {status:200,arrayBuffer:async()=>Buffer.from('x')};};
 const {dir,sha}=fixture();
 try{
  await verifyLive({sha,repoDir:dir,origin:'https://example.test',fetchImpl,...fast});
  assert.ok(seen.length>0&&seen.every(s=>/[?&]verify-live=\d+/.test(s.url)));
  assert.ok(seen.every(s=>!Object.keys(s.headers).some(h=>/authorization|cookie|api-key/i.test(h))));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('option parsing rejects nonsense',()=>{
 assert.deepEqual(parseArgs(['abc123','--wait-minutes','2']).waitMinutes,2);
 for(const bad of [['a','b'],['--bogus'],['a','--wait-minutes','0'],['a','--origin','ftp://x'],['a','--checks']])assert.throws(()=>parseArgs(bad),undefined,bad.join(' '));
});
test('the shipped PR #84 checks file is well formed and lists the homepage strings',()=>{
 const checks=JSON.parse(readFileSync(resolve(root,'config/verify-live/pr-84.json'),'utf8'));
 assert.equal(checks.pages[0].path,'/');
 const html=readFileSync(resolve(root,'index.html'),'utf8');
 for(const s of checks.pages[0].mustInclude)assert.ok(html.includes(s),'index.html has: '+s.slice(0,50));
 for(const s of checks.pages[0].mustNotInclude)assert.ok(!html.includes(s),'index.html lacks: '+s.slice(0,50));
 const r=evaluateChecks({items:[{kind:'text',label:'x',url:'u',mustInclude:checks.pages[0].mustInclude,mustNotInclude:checks.pages[0].mustNotInclude}],responses:new Map([['u',{status:200,body:Buffer.from(html)}]])});
 assert.equal(r[0].ok,true);
});
