import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {prioritizeFirstTravelImage} from './trip-image-priority.mjs';
import {renderTravelHomeR24} from './render-travel-home-r24.mjs';
const origin='https://www.eaglish.store';
export const nzRoute='/trip/new-zealand/christchurch/3-days/';
const nz='/trip/new-zealand/';
export function buildDestinations(root){
 const write=(path,html)=>{
  mkdirSync(resolve(root,path.slice(1)),{recursive:true});writeFileSync(resolve(root,path.slice(1),'index.html'),prioritizeFirstTravelImage(html));
 };
 write('/trip/',renderTravelHomeR24());
 // Thailand and New Zealand now render from their approved packages. The old
 // overview URLs (Thai cities, Christchurch and Akaroa hubs) point to the matching guide.
 for(const [path,guide,name] of [['/trip/thailand/bangkok/','/trip/guides/bangkok-with-kids/','曼谷'],['/trip/thailand/chiang-mai/','/trip/guides/chiang-mai-with-kids/','清邁'],['/trip/thailand/chiang-rai/','/trip/guides/chiang-rai-with-kids/','清萊'],[nz+'christchurch/',nzRoute,'基督城與 Akaroa'],[nz+'akaroa/',nzRoute,'基督城與 Akaroa']]){
  mkdirSync(resolve(root,path.slice(1)),{recursive:true});
  writeFileSync(resolve(root,path.slice(1),'index.html'),`<!doctype html>\n<html lang="zh-Hant">\n<head>\n  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n  <meta name="robots" content="noindex"><link rel="canonical" href="${origin+guide}">\n  <meta http-equiv="refresh" content="0;url=${guide}"><title>前往${name}親子攻略</title>\n</head>\n<body><p><a href="${guide}">前往${name}親子攻略</a></p></body>\n</html>\n`);
 }
 console.log('Built destination-led travel home and legacy overview redirects.');
}
