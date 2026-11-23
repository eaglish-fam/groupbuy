// Adds an Otaru city guide to the Japan package from the reviewed Hokkaido
// route draft (docs/trip-hokkaido-v1-route-draft.md: 「小樽各站補充」 for the six
// places and the Otaru story section for the lead; facts checked 2026-10-21), plus
// the Otaru day of our 2024 Yoichi trip (VThgTPbHDVU: aquarium, second music-box
// visit; aquarium facts checked 2026-10-24). Photos come from
// trip/data/hokkaido-frames-v1.json: each place lists its own frames from either
// video; a place with no photo of its own is left out rather than borrowing
// another venue's picture.
// Run: node scripts/migrate/japan-otaru-v1.mjs
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,legacyAsset} from './legacy-approved-helpers.mjs';

const pkgPath=resolve(root,'trip/data/japan-approved-travel-v1.json');
const pkg=JSON.parse(readFileSync(pkgPath,'utf8'));
const draft=readFileSync(resolve(root,'docs/trip-hokkaido-v1-route-draft.md'),'utf8');
const photosPath=resolve(root,'trip/data/hokkaido-frames-v1.json');
const photos=existsSync(photosPath)?JSON.parse(readFileSync(photosPath,'utf8')):{places:{},frames:[]};
const checkedOn='2026-10-21',video='https://www.youtube.com/watch?v=nAKoy93DtQw',winterVideo='https://www.youtube.com/watch?v=VThgTPbHDVU';
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

// The 2024 winter day: Otaru Aquarium is a new place; the music box shop gets a second gallery.
const winterChecked='2026-10-24';
const w=(id,seconds,label)=>addSource({id,kind:'youtube',url:`${winterVideo}&t=${seconds}`,label,rights:'鷹式一家自有影片。'});
const wAq=w('y11',1122,'冬天的おたる水族館'),wLunch=w('y12',1340,'びっくりドンキー午餐與結冰的路'),wOrgel=w('y13',1466,'第二次去小樽音樂盒堂'),wDay=w('y14',1726,'小樽一天的路線');
const aq=(id,path,label)=>addSource({id,kind:'official',url:'https://otaru-aq.jp/'+path,label,checkedOn:winterChecked,rights:'第一方公開資訊摘要；照片不採用'});
const aqHours=aq('otaru-aq-hours','guide/openningtime','おたる水族館 營業期間與時間'),aqTickets=aq('otaru-aq-tickets','guide/tickets','おたる水族館 票價'),
 aqAccess=aq('otaru-aq-access','guide/access','おたる水族館 交通'),aqShow=aq('otaru-aq-show','events/showtime','おたる水族館 いきもののじかん'),aqPark=aq('otaru-aq-park','amusementpark','おたる水族館 遊樂園');
const wf=(label,value,sourceIds)=>({label,value,sourceIds,kind:sourceIds.some(id=>sources.get(id).kind!=='official')?'experience':'source_based',checkedOn:winterChecked});
const aquariumStory=['2023–24 年冬天我們住在余市，有一天房東先帶我們到おたる水族館。館內的建築看得出年代，戶外的池邊冷到受不了，大家鼻子都凍紅了。','我們沒有待很久，主要是看餵食和海豚表演。表演很精彩，看完我們就離開海邊，進市區找暖和的地方吃飯。'];
places.push({id:'otaru-aquarium',stableId:'jp-otaru-aquarium',title:'小樽水族館：冬天看海豚表演',
 paragraphs:['おたる水族館在小樽祝津的海邊，本館旁邊還有海獸公園和免費入園的遊樂園。','冬天也有營業，但冬期營業時海獸公園和遊樂園關閉。館方的動物表演與餵食時間依季節公告，出發前先看官網。'],
 sourceIds:[aqHours,aqTickets,aqAccess,aqShow,aqPark,wAq],
 facts:{what:wf('是什麼','小樽祝津海邊的水族館，本館旁有海獸公園和免費入園的遊樂園。',[aqHours,aqPark]),
  play:wf('玩什麼','看館內水槽、餵食與海豚等動物表演；表演時間依季節公告。',[aqShow,wAq]),
  arrival:wf('怎麼去','JR 小樽站前搭北海道中央巴士往水族館的路線；開車從札幌約 60–70 分鐘。我們是房東開車載去。',[aqAccess,wAq]),
  duration:wf('留多久','我們冬天去，主要看表演；戶外太冷，停留時間不長。',[wAq]),
  availability:wf('何時能去','2026 年通常營業到 11/23（10/16 起 9:00–16:00）；11/24–12/11 休館；冬期營業 2026/12/12–2027/2/23，10:00–16:00，15:30 最後入館。',[aqHours]),
  conditions:wf('雨天或特殊條件','冬期營業時海獸公園與遊樂園關閉，戶外池邊很冷。通常營業的門票是大人 1,800 日圓、中小學生 700 日圓、3–5 歲 350 日圓。',[aqHours,aqTickets,wAq])},
 story:{title:'我們這次怎麼玩',text:aquariumStory.join(''),paragraphs:aquariumStory,sourceIds:[wAq]},
 links:[{label:'おたる水族館 營業時間',url:'https://otaru-aq.jp/guide/openningtime'},{label:'おたる水族館 交通',url:'https://otaru-aq.jp/guide/access'}]});
const orgel=places.find(p=>p.id==='otaru-orgel');
orgel.story.paragraphs.push('2023–24 年冬天我們也來過一次，店裡人多到有點擠。這裡可以自己選曲子，再挑上面的造型，組成自己的音樂盒；曲子要配合底座尺寸，爸爸挑了六角形的底座。');
orgel.story.text=orgel.story.paragraphs.join('');orgel.story.sourceIds.push(wOrgel);orgel.sourceIds.push(wOrgel);

// Photos: frames supplied per place (Josie, TRIP-JP-001), plus the three canal-cruise frames already published.
for(const f of photos.frames||[]){
 const winter=f.video==='VThgTPbHDVU';if(winter&&!/^jp-otaru24-/.test(f.assetId))continue;
 const sid=addSource({id:(winter?'otaru24-frame-':'otaru-frame-')+f.seconds,kind:'youtube',url:`${winter?winterVideo:video}&t=${f.seconds}`,label:f.caption,rights:'鷹式一家自有影片畫格。'});
 if(!pkg.assets.some(a=>a.assetId===f.assetId))pkg.assets.push(legacyAsset(f.assetId,{alt:f.alt,caption:f.caption,sourceIds:[sid],frame:{second:f.seconds}}));
}
const assetIds=new Set(pkg.assets.map(a=>a.assetId));
const placePhotos={'otaru-canal-cruise':['otaru-canal-family','otaru-canal-bridge','otaru-canal-child'],...photos.places};
const ready=places.filter(p=>(placePhotos[p.id]||[]).some(a=>assetIds.has(a)));
for(const p of ready)p.images=placePhotos[p.id].filter(a=>assetIds.has(a)).slice(0,3);
const orgel24=(photos.places?.['otaru-orgel-2024']||[]).filter(a=>assetIds.has(a));
if(ready.includes(orgel)&&orgel24.length===3)orgel.additionalGalleries=[{title:'2023–24 年冬天再訪',images:orgel24}];
const missing=places.filter(p=>!ready.includes(p)).map(p=>p.id);
if(missing.length)console.warn('Otaru places still without their own photo (left out):',missing.join(', '));

const otaruStory=paras(section('小樽：在孩子餓了的時候，改變逛街節奏').split('\n').slice(1).join('\n'));
const city={id:'otaru',countryId:'japan',path:'/trip/guides/otaru-with-kids/',name:'小樽',englishName:'Otaru',destinationKind:'city',
 title:'小樽親子散步：音樂盒、運河遊船與三角市場',metadataTitle:'小樽親子攻略：音樂盒、運河館、運河遊船與三角市場｜鷹家遠行所',
 description:'滑雪摔傷的隔天，我們帶著嬰兒從南小樽一路逛到小樽站：音樂盒、六花亭、炸雞午餐、運河館與運河遊船，晚上在三角市場吃螃蟹；另附 2023–24 年冬天的水族館一日。',
 intro:otaruStory.slice(0,2),author:'鷹式一家',updatedOn:checkedOn,sourceIds:['o01','o08','o09','o10'],
 hero:['otaru-canal-family','otaru-canal-bridge','otaru-canal-child'],places:ready,
 cards:ready.map(p=>({target:p.id,assetId:p.images[0],title:p.title.split('：')[0],play:p.facts.play.value.replace(/。$/,''),time:p.facts.duration.value.replace(/^(建議|館方建議)留 ?/,'').replace(/。$/,''),focalPoint:[50,50]})),
 food:{title:'冬天的午餐：びっくりドンキー',paragraphs:['2023–24 年冬天看完水族館，我們進市區吃びっくりドンキー，是從北海道起家的漢堡排家庭餐廳。漢堡排很嫩，價格也還可以接受。','吃完走去音樂盒的路上全結冰了，比雪地還滑，有人一路滑倒；冬天走小樽的街道，鞋底止滑很重要。'],sourceIds:[wLunch],links:[],...(()=>{const ids=(photos.places?.['otaru-winter-lunch']||[]).filter(id=>assetIds.has(id));return ids.length?{images:ids}:{};})()},
 faq:[{question:'小樽可以從札幌當天往返嗎？',answer:'我們這趟住札幌，從南小樽一帶開始逛，晚上吃完三角市場再往小樽站走，回札幌休息。',sourceIds:['o01','o10']},
  {question:'冬天去小樽會不會太冷？',answer:'2023–24 年冬天那趟很冷，水族館戶外池邊待不住，街道也結冰。我們把戶外時間縮短，多安排室內的店和餐廳。',sourceIds:[wAq,wLunch]}],
 videoSourceIds:['o01','o08','o09','o10',wAq,wOrgel],
 planner:{title:'小樽一日走法',paragraphs:['我們當天從南小樽一帶慢慢往小樽站方向逛，最後在三角市場吃晚餐再回札幌。'],sourceIds:['o01','o10'],
  routes:[{id:'otaru-1-day',label:'一天：南小樽到小樽站',sightseeingDays:1,pace:'leisure',note:'營業時間與遊船班次依出發日期查官方資訊。',sourceIds:['o01','o08','o09','o10'],
   days:[{title:'南小樽 → 小樽站',description:'從南小樽一帶開始散步，看音樂盒、吃甜點；孩子餓了就先吃午餐，之後搭運河遊船，晚上到三角市場吃螃蟹，再從小樽站回札幌。',stops:ready.map(p=>p.id).filter(id=>id!=='otaru-aquarium')}]},
   ...(ready.some(p=>p.id==='otaru-aquarium')?[{id:'otaru-winter-1-day',label:'冬天一天：水族館與音樂盒',sightseeingDays:1,pace:'leisure',note:'冬期營業時水族館的海獸公園與遊樂園關閉；表演時間依官網公告。',sourceIds:[wAq,wLunch,wOrgel,wDay],
    days:[{title:'水族館 → 小樽市區',description:'上午到祝津的水族館看餵食和海豚表演，中午進市區吃飯、避寒，下午走到音樂盒堂選曲子。',stops:['otaru-aquarium',...(ready.includes(orgel)?['otaru-orgel']:[])]}]}]:[])]},
 extension:{title:'北海道七天行程',paragraphs:['小樽在我們的七天建議裡和札幌市區擇一安排。'],sourceIds:['o01'],links:[{label:'北海道七天親子行程',url:'/trip/japan/hokkaido-asahikawa-sapporo-7-days/'}]}};
pkg.cities=pkg.cities.filter(c=>c.id!=='otaru').concat(ready.length?[city]:[]);
const japan=pkg.countries.find(c=>c.id==='japan');
if(ready.length&&!japan.cityIds.includes('otaru'))japan.cityIds.push('otaru');
if(ready.length&&!pkg.coverage.cityIds.includes('otaru'))pkg.coverage.cityIds.push('otaru');
if(ready.length){
 const p=japan.presentation;
 p.citySummaries=p.citySummaries.filter(s=>s.cityId!=='otaru').concat({cityId:'otaru',tag:'散步與市場',intro:'從南小樽走到小樽站，看音樂盒、搭運河遊船，晚上到三角市場吃螃蟹；冬天再加一站水族館。',sourceIds:['o01','o08','o09']});
 const theme={'otaru-aquarium':'animals','otaru-canal-museum':'local-history','otaru-orgel':'hands-on'};
 p.placeThemes=p.placeThemes.filter(t=>t.cityId!=='otaru').concat(ready.filter(pl=>theme[pl.id]).map(pl=>({cityId:'otaru',placeId:pl.id,themeIds:[theme[pl.id]]})));
 p.cityEntryLabels.otaru='看小樽攻略';
 // The route-only Otaru pin becomes the guide's pin.
 const view=japan.geographicMap.views.find(v=>v.id==='hokkaido');
 view.points=view.points.filter(pt=>pt.label!=='小樽').concat({cityId:'otaru',label:'小樽',point:[140.994444,43.190833],sourceIds:['jp-official-geo-otaru']});
}
pkg.sources=[...sources.values()];
writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');
console.log('Otaru places with photos',ready.length,'of',places.length);
