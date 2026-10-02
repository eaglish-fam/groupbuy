import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseArticleMarkdown,renderTravelArticle} from './travel-article-renderer.mjs';
import {presentCebuR24} from './present-cebu-r24.mjs';
import {inlineTravelStyles} from './render-travel-home-r24.mjs';

export function buildCebuBohol(root){
 const config=JSON.parse(readFileSync(resolve(root,'trip/data/cebu-bohol-guide.json'),'utf8'));
 const media=Object.fromEntries(JSON.parse(readFileSync(resolve(root,'trip/assets/cebu-bohol-media.json'),'utf8')).map(m=>[m.id,m]));
 const article=parseArticleMarkdown(readFileSync(resolve(root,'trip/content/philippines/cebu-bohol-with-kids.md'),'utf8'),config.sectionMap);
 const html=inlineTravelStyles(presentCebuR24(renderTravelArticle(article,config,media),readFileSync(resolve(root,'flights/assets/faraway-wordmark.svg'),'utf8'))),dir=resolve(root,'.'+config.path);
 mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'index.html'),html);
 console.log('Built source-bound Cebu/Bohol guide with shared travel shell and complete-day planner.');
 return html;
}
