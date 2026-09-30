import {readFileSync,copyFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {parseArticleMarkdown} from './travel-article-renderer.mjs';
const root=resolve(import.meta.dirname,'..'),project=process.argv[2];
if(!project)throw Error('Supply the approved source Project path');
const sourceName=process.argv[3];
if(!/^alma-article-v[1234]\.md$/.test(sourceName||''))throw Error('Explicitly select the reviewed Alma article v1, v2, v3 or v4');
const version=sourceName.match(/v(\d)/)[1],source=resolve(project,sourceName),buffer=readFileSync(source);
const hash=b=>createHash('sha256').update(b).digest('hex');
const mapName=`alma-sources-map-v${version}.md`,map=readFileSync(resolve(project,mapName));
let freezeSha256;
if(version!=='1'){
 const proof=readFileSync(resolve(project,`alma-selfcheck-v${version}.md`));
 for(const [name,bytes] of [[sourceName,buffer],[mapName,map]]){
  if(!proof.toString().split('\n').some(line=>line.includes(name)&&line.includes(hash(bytes))))throw Error(`Unbound Alma freeze: ${name}`);
 }
 freezeSha256=hash(proof);
}
const config=JSON.parse(readFileSync(resolve(root,'trip/data/cebu-bohol-guide.json'),'utf8'));
const article=parseArticleMarkdown(buffer.toString('utf8'),config.sectionMap);
if(version!=='1'){
 const refs=[...buffer.toString().matchAll(/^!\[[^\]]*\]\(([^)]+)\)$/gm)].map(m=>m[1]);
 if(article.sections.length!==14||refs.length!==32||new Set(refs).size!==32||refs.some(p=>!config.mediaMap[p])||/media-slot:/.test(buffer.toString()))throw Error('Expanded article must map 14 sections and 32 distinct images');
}
const target=resolve(root,'trip/content/philippines/cebu-bohol-with-kids.md');
const receiptPath=resolve(root,'trip/content/philippines/alma-source-receipt.json');
if(existsSync(target)){
 const old=JSON.parse(readFileSync(receiptPath));
 if(old.sha256!==hash(readFileSync(target)))throw Error('Current imported source differs from receipt');
 if(old.sourceArtifact!==sourceName){
  const history=resolve(root,'trip/content/philippines/history');mkdirSync(history,{recursive:true});
  for(const [src,name] of [[target,old.sourceArtifact],[receiptPath,old.sourceArtifact.replace('.md','-receipt.json')]]){
   const dest=resolve(history,name);if(existsSync(dest)&&hash(readFileSync(dest))!==hash(readFileSync(src)))throw Error(`Historical source differs: ${name}`);
   if(!existsSync(dest))copyFileSync(src,dest);
  }
 }
}
mkdirSync(resolve(root,'trip/content/philippines'),{recursive:true});copyFileSync(source,target);
writeFileSync(resolve(root,'trip/content/philippines',mapName),map);
writeFileSync(receiptPath,JSON.stringify({sourceOwner:'Alma',sourceArtifact:sourceName,sha256:hash(buffer),sourceMapArtifact:mapName,sourceMapSha256:hash(map),...(freezeSha256?{freezeArtifact:`alma-selfcheck-v${version}.md`,freezeSha256}:{}),importedAt:new Date().toISOString(),contentChanges:false,factAcceptance:'Requires hash-bound Terra audit and Eliora actual-render review; not inferred from import'},null,2)+'\n');
console.log('Imported exact Alma source and recorded SHA-256; no editorial rewrite.');
