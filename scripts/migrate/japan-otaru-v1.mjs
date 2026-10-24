// Adds an Otaru city guide to the Japan package from the reviewed Hokkaido
// route draft (docs/trip-hokkaido-v1-route-draft.md: 「小樽各站補充」 for the six
// places and the Otaru story section for the lead; facts checked 2026-10-21). Photos come from
// trip/data/otaru-photos-v1.json: each place lists its own frames from the Otaru
// video (nAKoy93DtQw); a place with no photo of its own is left out rather than
// borrowing another venue's picture.
// Run: node scripts/migrate/japan-otaru-v1.mjs
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,legacyAsset} from './legacy-approved-helpers.mjs';

const pkgPath=resolve(root,'trip/data/japan-approved-travel-v1.json');
const pkg=JSON.parse(readFileSync(pkgPath,'utf8'));
const draft=readFileSync(resolve(root,'docs/trip-hokkaido-v1-route-draft.md'),'utf8');
const photosPath=resolve(root,'trip/data/otaru-photos-v1.json');
const photos=existsSync(photosPath)?JSON.parse(readFileSync(photosPath,'utf8')):{places:{},frames:[]};
const checkedOn='2026-10-21',video='https://www.youtube.com/watch?v=nAKoy93DtQw';
const sources=new Map(pkg.sources.map(s=>[s.id,s]));
const addSource=s=>{if(!sources.has(s.id))sources.set(s.id,s);return s.id;};
const slug=url=>url.replace(/^https:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,60).replace(/^-+|-+$/g,'');
const official=(url,label)=>addSource({id:'otaru-'+slug(url),kind:'official',url,label,checkedOn,rights:'第一方公開資訊摘要；照片不採用'});
const section=title=>{const i=draft.indexOf('\n## '+title);if(i<0)throw Error('Missing draft section '+title);const j=draft.indexOf('\n## ',i+4);return draft.slice(i+4,j<0?undefined:j);};
const paras=text=>text.split(/\n\s*\n/).map(b=>b.trim()).filter(b=>b&&!/^(#|- |\[|\*\*我們這次怎麼玩\*\*)/.test(b));

// 「小樽各站補充」: one ### block per place with intro, our story, six facts and official links.
const ids={'小樽音樂盒':'otaru-orgel','六花亭':'rokkatei-otaru','炸雞午餐':'wakatori-naruto','運河館':'otaru-canal-museum','小樽運河遊船':'otaru-canal-cruise','三角市場':'otaru-sankaku-market'};
const factKey={'是什麼':'what','玩什麼':'play','怎麼去':'arrival','留多久':'duration','何時能去':'availability','雨天或特殊條件':'conditions'};
const evidence={'otaru-canal-cruise':'o08','otaru-sankaku-market':'o09'};
const places=[];
for(const block of section('小樽各站補充').split(/\n### /).slice(1)){
 const title=block.slice(0,block.indexOf('\n')).trim(),key=Object.keys(ids).find(k=>title.startsWith(k));if(!key)throw Error('Unknown Otaru place '+title);
 const [intro,story='']=block.slice(block.indexOf('\n')).split('**我們這次怎麼玩**');
 const links=[...block.matchAll(/^\[([^\]]+)\]\((https:[^)]+)\)$/gm)].map(m=>({label:m[1],url:m[2]}));
 const factSources=links.map(l=>official(l.url,l.label));
 const facts={},extraFacts=[];
 for(const [,label,value] of story.matchAll(/^- ([^：]+)：(.+?)（原核對日 2026-10-21）$/gm)){
  const k=factKey[label];
  if(k)facts[k]={label,value,sourceIds:factSources,kind:'source_based',checkedOn};else extraFacts.push({label,value,sourceIds:factSources});
 }
 if(Object.keys(facts).length!==6)throw Error('Six facts required for '+title);
 const id=ids[key],videoSource=evidence[id]||'o01';
 places.push({id,stableId:'jp-'+id,title,paragraphs:paras(intro),sourceIds:[...new Set([...factSources,videoSource])],facts,...(extraFacts.length?{extraFacts}:{}),
  story:{title:'我們這次怎麼玩',text:paras(story).join(''),paragraphs:paras(story),sourceIds:[videoSource]},links});
}

// Photos: frames supplied per place (Josie, TRIP-JP-001), plus the three canal-cruise frames already published.
for(const f of photos.frames||[]){
 const sid=addSource({id:'otaru-frame-'+f.seconds,kind:'youtube',url:`${video}&t=${f.seconds}`,label:f.caption,rights:'鷹式一家自有影片畫格。'});
 if(!pkg.assets.some(a=>a.assetId===f.assetId))pkg.assets.push(legacyAsset(f.assetId,{alt:f.alt,caption:f.caption,sourceIds:[sid],frame:{second:f.seconds}}));
}
const assetIds=new Set(pkg.assets.map(a=>a.assetId));
const placePhotos={'otaru-canal-cruise':['otaru-canal-family','otaru-canal-bridge','otaru-canal-child'],...photos.places};
const ready=places.filter(p=>(placePhotos[p.id]||[]).some(a=>assetIds.has(a)));
for(const p of ready)p.images=placePhotos[p.id].filter(a=>assetIds.has(a)).slice(0,3);
const missing=places.filter(p=>!ready.includes(p)).map(p=>p.id);
if(missing.length)console.warn('Otaru places still without their own photo (left out):',missing.join(', '));

const otaruStory=paras(section('小樽：在孩子餓了的時候，改變逛街節奏').split('\n').slice(1).join('\n'));
const city={id:'otaru',countryId:'japan',path:'/trip/guides/otaru-with-kids/',name:'小樽',englishName:'Otaru',destinationKind:'city',
 title:'小樽親子散步：音樂盒、運河遊船與三角市場',metadataTitle:'小樽親子攻略：音樂盒、運河館、運河遊船與三角市場｜鷹家遠行所',
 description:'滑雪摔傷的隔天，我們帶著嬰兒從南小樽一路逛到小樽站：音樂盒、六花亭、炸雞午餐、運河館與運河遊船，晚上在三角市場吃螃蟹。',
 intro:otaruStory.slice(0,2),author:'鷹式一家',updatedOn:checkedOn,sourceIds:['o01','o08','o09','o10'],
 hero:['otaru-canal-family','otaru-canal-bridge','otaru-canal-child'],places:ready,
 cards:ready.map(p=>({target:p.id,assetId:p.images[0],title:p.title.split('：')[0],play:p.facts.play.value.replace(/。$/,''),time:p.facts.duration.value.replace(/^(建議|館方建議)留 ?/,'').replace(/。$/,''),focalPoint:[50,50]})),
 faq:[{question:'小樽可以從札幌當天往返嗎？',answer:'我們這趟住札幌，從南小樽一帶開始逛，晚上吃完三角市場再往小樽站走，回札幌休息。',sourceIds:['o01','o10']}],
 videoSourceIds:['o01','o08','o09','o10'],
 planner:{title:'小樽一日走法',paragraphs:['我們當天從南小樽一帶慢慢往小樽站方向逛，最後在三角市場吃晚餐再回札幌。'],sourceIds:['o01','o10'],
  routes:[{id:'otaru-1-day',label:'一天：南小樽到小樽站',sightseeingDays:1,pace:'leisure',note:'營業時間與遊船班次依出發日期查官方資訊。',sourceIds:['o01','o08','o09','o10'],
   days:[{title:'南小樽 → 小樽站',description:'從南小樽一帶開始散步，看音樂盒、吃甜點；孩子餓了就先吃午餐，之後搭運河遊船，晚上到三角市場吃螃蟹，再從小樽站回札幌。',stops:ready.map(p=>p.id)}]}]},
 extension:{title:'北海道七天行程',paragraphs:['小樽在我們的七天建議裡和札幌市區擇一安排。'],sourceIds:['o01'],links:[{label:'北海道七天親子行程',url:'/trip/japan/hokkaido-asahikawa-sapporo-7-days/'}]}};
pkg.cities=pkg.cities.filter(c=>c.id!=='otaru').concat(ready.length?[city]:[]);
const japan=pkg.countries.find(c=>c.id==='japan');
if(ready.length&&!japan.cityIds.includes('otaru'))japan.cityIds.push('otaru');
if(ready.length&&!pkg.coverage.cityIds.includes('otaru'))pkg.coverage.cityIds.push('otaru');
pkg.sources=[...sources.values()];
writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');
console.log('Otaru places with photos',ready.length,'of',places.length);
