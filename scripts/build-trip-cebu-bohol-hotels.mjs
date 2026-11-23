import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {validatePageSource,pageRoutes} from './cebu-bohol-hotel-pack.mjs';
import {renderApprovedStayArticle} from './trip-stay-approved-shell.mjs';
// The lead keeps the source's own paragraph breaks: blocks after the H1, up to the hero photo or first H2.
function leadOf(source){
 const blocks=source.slice(source.indexOf('\n# ')+1).split(/\n\s*\n/).slice(1).map(b=>b.trim()),out=[];
 for(const b of blocks){if(/^!\[|^## /.test(b))break;if(b&&!/^(撰文|更新|---)/.test(b))out.push(b.replace(/\n/g,' '));}
 return out;
}
export function buildCebuBoholHotels(root){
 const path=resolve(root,'trip/data/cebu-bohol-hotel-publication-v1.json');if(!existsSync(path))return [];
 const receipt=JSON.parse(readFileSync(path));
 if(receipt.publicationAuthorized!==false||JSON.stringify(receipt.pages.map(p=>p.slug))!==JSON.stringify(pageRoutes))throw Error('Invalid local hotel import receipt');
 const media=Object.fromEntries(['cebu-bohol-media.json','cebu-bohol-hotel-media-v1.json'].flatMap(name=>JSON.parse(readFileSync(resolve(root,'trip/assets',name)))).map(m=>[m.id,m]));
 const outputs=receipt.pages.filter(p=>p.articleType==='hotel').map(page=>{
  if(page.source!==`trip/content/philippines/${page.file}`||page.config.path!==page.slug||page.config.articleType!=='hotel')throw Error('Hotel source/output route differs');
  const source=readFileSync(resolve(root,page.source),'utf8'),article=validatePageSource(source,page,page.config,media);
  return {path:page.slug,html:renderApprovedStayArticle(article,page.config,media,{introParagraphs:leadOf(source)})};
 });
 for(const {path,html} of outputs){const dir=resolve(root,'.'+path);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'index.html'),html);}
 console.log('Built two hash-bound hotel articles with independent TOC, Article/Breadcrumb metadata and reviewed reciprocal links; no day planner.');
 return outputs;
}
