import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {validatePageSource,pageRoutes} from './cebu-bohol-hotel-pack.mjs';
import {renderTravelArticle} from './travel-article-renderer.mjs';
export function buildCebuBoholHotels(root){
 const path=resolve(root,'trip/data/cebu-bohol-hotel-publication-v1.json');if(!existsSync(path))return [];
 const receipt=JSON.parse(readFileSync(path));
 if(receipt.publicationAuthorized!==false||JSON.stringify(receipt.pages.map(p=>p.slug))!==JSON.stringify(pageRoutes))throw Error('Invalid local hotel import receipt');
 const media=Object.fromEntries(['cebu-bohol-media.json','cebu-bohol-hotel-media-v1.json'].flatMap(name=>JSON.parse(readFileSync(resolve(root,'trip/assets',name)))).map(m=>[m.id,m]));
 const outputs=receipt.pages.filter(p=>p.articleType==='hotel').map(page=>{
  if(page.source!==`trip/content/philippines/${page.file}`||page.config.path!==page.slug||page.config.articleType!=='hotel')throw Error('Hotel source/output route differs');
  const source=readFileSync(resolve(root,page.source),'utf8'),article=validatePageSource(source,page,page.config,media);
  return {path:page.slug,html:renderTravelArticle(article,page.config,media)};
 });
 for(const {path,html} of outputs){const dir=resolve(root,'.'+path);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'index.html'),html);}
 console.log('Built two hash-bound hotel articles with independent TOC, Article/Breadcrumb metadata and reviewed reciprocal links; no day planner.');
 return outputs;
}
