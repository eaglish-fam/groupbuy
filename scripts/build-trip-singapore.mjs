import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {buildSync} from 'esbuild';
import {isDeepStrictEqual} from 'node:util';
import {renderApprovedSingapore} from './trip-singapore-approved-renderer.mjs';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export function validateSingaporePublicPackage(root){
 const bytes=readFileSync(resolve(root,'trip/data/singapore-public-article-v1.json'));
 const manifest=JSON.parse(readFileSync(resolve(root,'trip/data/singapore-publication-v1.json')));
 if(manifest.schema!=='eaglish.singapore-publication/v1'||hash(bytes)!==manifest.articleSha256)throw Error('Approved public article changed; revise its publication manifest');
 const data=JSON.parse(bytes);
 if(data.schema!=='eaglish.singapore-public-article/v1'||data.article.path!=='/trip/singapore/'||!data.article.approved||/\/Users\/|dispatchId|packetSha256|rawPath|videoPath/.test(bytes.toString()+JSON.stringify(manifest)))throw Error('Invalid public-only package');
 const a=data.article,attractions=[...a.sections,...a.supportingStops];
 if(a.heroImages.length!==3||a.sections.length!==8||attractions.length!==10||attractions.some(s=>s.images.length!==3)||new Set(attractions.flatMap(s=>s.images.map(i=>i.assetId))).size!==30||a.faq.items.length!==9||a.planner.routes.length!==6||a.planner.routes.reduce((n,r)=>n+r.days.length,0)!==18||data.navigationView.cards.length!==8)throw Error('Approved content coverage changed');
 const assets=new Map(manifest.assets.map(a=>[a.assetId,a]));
 if(assets.size!==37)throw Error('Expected 37 approved assets');
 for(const asset of assets.values())for(const v of asset.variants){
  if(v.url!==`/trip/assets/singapore/${asset.assetId}-${v.width}.webp`||!/^[a-zA-Z0-9_-]+$/.test(asset.assetId)||v.width>1440||v.bytes>(v.width<=640?120000:v.width<=960?220000:400000))throw Error('Invalid public variant');
  const b=readFileSync(resolve(root,'.'+v.url));if(b.length!==v.bytes||hash(b)!==v.sha256)throw Error('Approved WebP changed '+v.url);
 }
 const checkImages=value=>{
  if(!value||typeof value!=='object')return;
  if(value.assetId&&value.variants){const asset=assets.get(value.assetId);if(!asset||value.width!==asset.width||value.height!==asset.height||!isDeepStrictEqual(value.variants,asset.variants))throw Error('Article/manifest image mismatch');}
  for(const child of Object.values(value))checkImages(child);
 };
 checkImages(a);return data;
}
export function buildSingapore(root){
 const {article,navigationView}=validateSingaporePublicPackage(root);
 const html=renderApprovedSingapore(article,readFileSync(resolve(root,'flights/assets/faraway-wordmark.svg'),'utf8'),{navigationView,publication:true});
 const bundle=buildSync({entryPoints:[resolve(root,'trip/singapore-approved-planner.mjs')],bundle:true,format:'iife',target:['safari15'],write:false,logLevel:'silent'}).outputFiles[0].contents;
 mkdirSync(resolve(root,'trip/singapore'),{recursive:true});
 writeFileSync(resolve(root,'trip/singapore/index.html'),html);
 writeFileSync(resolve(root,'trip/singapore-planner-bundle.js'),bundle);
 console.log('Built approved public Singapore guide from portable repository data.');
 return {status:'public_build',articleSha256:hash(Buffer.from(JSON.stringify(article)))};
}
