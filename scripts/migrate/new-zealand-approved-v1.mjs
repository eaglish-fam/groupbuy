// Restates the published New Zealand country overview and eight regional guides
// (trip/content/new-zealand/*.md, trip/new-zealand-data.mjs, trip/new-zealand-galleries.mjs)
// in the approved-package shape used by Japan, Thailand, Singapore and Cebu/Bohol.
// Text, photos, links and day plans come from the published pages; the six
// practical answers per place reuse the place's own published sentences.
// Run once: node scripts/migrate/new-zealand-approved-v1.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,legacyAsset} from './legacy-approved-helpers.mjs';
import {regions,countryRoute,updatedAt} from '../../trip/new-zealand-data.mjs';
import {galleries} from '../../trip/new-zealand-galleries.mjs';
import {travelHomeCatalog} from '../../trip/home-catalog.mjs';

const media=new Map(JSON.parse(readFileSync(resolve(root,'trip/assets/nz-media.json'),'utf8')).map(m=>[m.name,m]));
const read=name=>readFileSync(resolve(root,'trip/content/new-zealand',name),'utf8').replaceAll('\r\n','\n');
const checkedOn=updatedAt,site='https://www.eaglish.store';
const sources=new Map(),assets=new Map(),pageOf=new Map();
const addSource=s=>{if(!sources.has(s.id))sources.set(s.id,s);return s.id;};
const ownRights='鷹式一家自有公開照片與影片，原刊於本站紐西蘭攻略。';
const slug=url=>url.replace(/^https:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,70).replace(/^-+|-+$/g,'');
const isVideo=url=>/youtube\.com|youtu\.be|instagram\.com/.test(url);
const isMap=url=>/google\.com\/maps|maps\.app\.goo\.gl/.test(url);
const linkSource=l=>isVideo(l.url)?addSource({id:'v-'+slug(l.url),kind:l.url.includes('instagram')?'instagram':'youtube',url:l.url,label:l.label,rights:ownRights})
 :addSource({id:'o-'+slug(l.url),kind:'official',url:l.url,label:l.label,checkedOn,rights:'第一方公開資訊摘要；照片不採用'});

// Every photo keeps its published sizes; video frames keep their timestamp.
function asset(name,{alt,caption}={}){
 if(assets.has(name))return name;
 // A few early photos have no manifest entry; they cite the guide page that first published them.
 const m=media.get(name)||{source:site+(pageOf.get(name)||countryRoute),caption:caption||alt};
 if(!m.caption&&!alt)throw Error('Unknown NZ media '+name);
 const base=m.source.replace(/[?&]t=\d+s?$/,'');
 const sourceId=addSource({id:(isVideo(base)?'v-':'m-')+(base.startsWith(site)?name:slug(base)),kind:base.includes('instagram')?'instagram':base.includes('youtube')?'youtube':'photo',url:base,label:m.caption||alt,rights:ownRights});
 assets.set(name,legacyAsset(name,{alt:alt||m.alt||m.caption,caption:caption||m.caption||alt,sourceIds:[sourceId],frame:Number.isFinite(m.second)?{second:m.second}:null,
  provenance:{source:m.source,...(m.sha256?{sha256:m.sha256}:{}),...(m.originalSha256?{originalSha256:m.originalSha256}:{})}}));
 return name;
}

// Markdown links to sibling manuscripts become the guides' public paths.
const routes=new Map([...regions.map(r=>[r.manuscript,r.route]),['new-zealand-family-travel-overview.md',countryRoute]]);
const href=url=>routes.get(url.replace(/^\.\//,''))||url;
const inline=s=>s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(m,label,url)=>`[${label}](${href(url)})`).replace(/\*\*/g,'').trim();
const linkList=s=>[...s.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(m=>({label:m[1],url:href(m[2])}));
const isLinkLine=s=>/^(?:\[[^\]]+\]\([^)]+\)(?:[^\[]{0,3}))+$/.test(s.replace(/^- /,'').trim())&&!/[。，]/.test(s.replace(/\[[^\]]+\]/g,''));
const sentences=s=>inline(s).split(/(?<=。)/).map(x=>x.trim()).filter(Boolean);

// A manuscript becomes H2 sections, each with lead blocks and H3 subsections.
function parse(name){
 const lines=read(name).split('\n');
 const title=lines.find(l=>l.startsWith('# ')).slice(2).trim();
 const first=lines.findIndex(l=>l.startsWith('## '));
 const introBlocks=blocks(lines.slice(lines.findIndex(l=>l.startsWith('# '))+1,first));
 const sections=[];
 for(const l of lines.slice(first)){if(l.startsWith('## '))sections.push({title:l.slice(3).trim(),lines:[]});else sections.at(-1).lines.push(l);}
 for(const s of sections){
  const subs=[];let cur={title:null,lines:[]};
  for(const l of s.lines){if(l.startsWith('### ')){subs.push(cur);cur={title:l.slice(4).trim(),lines:[]};}else cur.lines.push(l);}
  subs.push(cur);s.lead=blocks(subs[0].lines);s.subs=subs.slice(1).map(x=>({title:x.title,blocks:blocks(x.lines)}));
 }
 return {title,introBlocks,sections};
}
function blocks(lines){
 const out=[];let para=[],table=[];
 const flush=()=>{if(para.length){const t=para.join(' ').trim();out.push(isLinkLine(t)?{type:'links',links:linkList(t)}:{type:'text',text:t});para=[];}if(table.length){const rows=table.filter((_,i)=>i!==1).map(r=>r.split('|').slice(1,-1).map(c=>c.trim()));out.push({type:'table',head:rows[0],rows:rows.slice(1)});table=[];}};
 for(const raw of lines){
  const l=raw.trim();
  if(!l||/^<a id="[a-z-]+"><\/a>$/.test(l)){flush();continue;}
  if(l.startsWith('|')){if(para.length){const t=para;para=[];flush();para=t;}table.push(l);continue;}
  const img=l.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if(img){flush();out.push({type:'image',name:img[2].split('/').pop().replace(/-(?:640|960|1440)\.webp$|\.webp$/g,''),alt:img[1]});continue;}
  if(l.startsWith('- ')){flush();const item=l.slice(2);out.push(isLinkLine(item)?{type:'links',links:linkList(item)}:{type:'text',text:item});continue;}
  para.push(l);
 }
 flush();return out;
}
const textOf=bs=>bs.flatMap(b=>b.type==='text'?[inline(b.text)]:b.type==='table'?b.rows.map(r=>`${inline(r[0])}——${b.head.slice(1).map((h,i)=>`${h}：${inline(r[i+1])}`).join('；')}。`):[]);
const linksOf=bs=>bs.flatMap(b=>b.type==='links'?b.links:[]);
const kindOf=title=>/常見問題/.test(title)?'faq':/影片|旅行照片|看我們的海岸旅行|先看我們的旅行現場|看我們實際去過/.test(title)?'video':/行程建議|行程試排|建議安排|按假期長度選路線|兩到三日建議|兩至三天建議/.test(title)?'plan':null;

// The six questions, filled from the place's own sentences.
const factRules={
 arrival:/導航|前往|位於|位在|交通|停車|集合|登船|步行|搭車|自駕|進站|地址|Road|Street|Rue/,
 availability:/開放|開館|時段|場次|班次|營運|營業|時刻|預訂|預約|季|星期|周日|週|\d{1,2}:\d{2}|休館|聖誕/,
 conditions:/雨|天候|天氣|海況|強風|陪同|年齡|身高|安全|推車|幼兒/};
const labelKeys=l=>[/交通|位置|集合|導航|登船|停車/.test(l)&&'arrival',/開放|時間|班次|營業|營運|時刻|場次|季節/.test(l)&&'availability',/雨|天氣|天候|海況|注意|安全|用餐/.test(l)&&'conditions'].filter(Boolean);
const label={what:'是什麼',play:'玩什麼',arrival:'怎麼去',duration:'留多久',availability:'何時能去',conditions:'雨天或特殊條件'};
// Labelled paragraphs (「交通與開放：」「雨天安排：」) answer their own questions first;
// the remaining questions take matching sentences from the rest of the place's text.
function facts(stop,raw,play,sourceIds){
 const value={what:sentences(raw[0])[0],play,duration:stop.time},used=new Set([value.what]),add=(k,t)=>{value[k]=value[k]?value[k]+t:t;used.add(t);};
 for(const r of raw){
  const m=r.match(/^\*\*([^*]+?)[：:]?\*\*[：:]?\s*/);if(!m)continue;
  const keys=labelKeys(m[1]);if(!keys.length)continue;
  const parts=sentences(r.slice(m[0].length));
  if(keys.length===1){if(!value[keys[0]])parts.forEach(t=>add(keys[0],t));continue;}
  for(const t of parts){const k=/雨|強風|天候|天氣|海況/.test(t)?'conditions':keys.find(k=>factRules[k].test(t))||keys[0];if(!value[k]||value[k].length<120)add(k,t);}
 }
 const rest=raw.filter(r=>!/^\*\*/.test(r)).flatMap(sentences).filter(t=>!used.has(t)&&!/^建議(?:留|安排)/.test(t));
 const open=new Set(['arrival','availability','conditions'].filter(k=>!value[k])),count={};
 for(const t of rest){const k=/雨|強風|天候|天氣|海況/.test(t)&&open.has('conditions')?'conditions':[...open].find(k=>factRules[k].test(t));if(k&&(count[k]=(count[k]||0)+1)<=2)add(k,t);}
 value.arrival||='見下方地圖連結與官方資訊。';value.availability||='出發前依官方公告確認。';value.conditions||='依當日天氣與現場公告調整。';
 return Object.fromEntries(Object.keys(label).map(k=>[k,{label:label[k],value:value[k],sourceIds}]));
}

// Day plans, written from each guide's published 「行程建議」 section.
const R=(id,label,days,note,ds)=>({id,label,days,note,ds});
const D=(title,stops,text)=>({title,stops,text});
const plans={
 'north-island':p=>[R('3-days','三天精選版',3,p.trailing('三天精選版'),[D('第一天：奧克蘭',['sky-tower','mount-eden'],p.day('三天精選版',1)),D('第二天：前往 Rotorua',[],p.day('三天精選版',2)),D('第三天：Skyline／Luge',['rotorua-luge'],p.day('三天精選版',3))]),
  R('5-days','五天串接版',5,p.trailing('五天串接版'),[D('第一天：奧克蘭',['sky-tower','mount-eden'],p.day('五天串接版',1)),D('第二天：Hamilton Zoo',['hamilton-zoo'],p.day('五天串接版',2)),D('第三天：Hobbiton',['hobbiton-site'],p.day('五天串接版',3)),D('第四天：Skyline／Luge',['rotorua-luge'],p.day('五天串接版',4)),D('第五天：返回奧克蘭',[],p.day('五天串接版',5))])],
 wellington:p=>[R('2-days','兩天：海港、博物館、動物園與纜車',2,'',[D('第一天：海港與 Te Papa',['harbour-market','te-papa'],p.bold('第一天')),D('第二天：動物園與 Cable Car',['wellington-zoo','cable-car'],p.bold('第二天'))]),
  R('3-days','三天：把半日活動拆開',3,'',[D('第一天：海港與 Te Papa',['harbour-market','te-papa'],p.bold('第一天')),D('第二天：Wellington Zoo',['wellington-zoo'],p.bold('第二天')),D('第三天：Cable Car',['cable-car'],p.bold('第三天'))])],
 'christchurch-akaroa':p=>[R('2-days','兩天版',2,'',[D('第一天：基督城',['tram','ninja-valley'],p.day('兩天版',1)),D('第二天：Akaroa',['shamarra','akaroa-museum'],p.day('兩天版',2))]),
  R('3-days','三天版',3,p.trailing('三天版'),[D('第一天：基督城',['tram'],p.day('三天版',1)),D('第二天：Shamarra 與 Akaroa',['shamarra','akaroa-museum'],p.day('三天版',2)),D('第三天：Akaroa Dolphins',['akaroa-dolphins'],p.day('三天版',3))])],
 'mid-canterbury':p=>[R('aviation-2-days','航空與河谷版（兩天）',2,p.extra[0],[D('第一天：Ashburton',['ashburton-museum','aero-club'],p.day('航空與河谷版',1)),D('第二天：熱氣球或河谷快艇',['balloon','discovery-jet'],p.day('航空與河谷版',2))]),
  R('aviation-3-days','航空與河谷版（三天）',3,p.extra[0],[D('第一天：Ashburton',['ashburton-museum','aero-club'],p.day('航空與河谷版',1)),D('第二天：熱氣球或河谷快艇',['balloon','discovery-jet'],p.day('航空與河谷版',2)),D('第三天：另一間館或調整日',['aviation-museum'],p.day('航空與河谷版',3))]),
  R('winter-2-days','冬季版（兩天）',2,p.trailing('冬季版'),[D('第一天：抵達 Methven',[],p.day('冬季版',1)),D('第二天：Mt Hutt',['mt-hutt'],p.day('冬季版',2))]),
  R('winter-3-days','冬季版（三天）',3,p.extra[0],[D('第一天：抵達 Methven',[],p.day('冬季版',1)),D('第二天：Mt Hutt',['mt-hutt'],p.day('冬季版',2)),D('第三天：Staveley 或 Ashburton',['staveley'],p.day('冬季版',3))])],
 kaikoura:p=>[R('2-days','兩天',2,'',[D('第一天：Ōhau Point 與海岸',['ohau-point','coastal-walk'],p.bold('第一天')),D('第二天：海狗皮划艇或看海',['seal-kayak'],p.bold('第二天'))]),
  R('3-days','三天（含選配日）',3,'',[D('第一天：Ōhau Point 與海岸',['ohau-point','coastal-walk'],p.bold('第一天')),D('第二天：海狗皮划艇或看海',['seal-kayak'],p.bold('第二天')),D('第三天選配：留在海邊',['coastal-walk'],p.bold('第三天選配'))])],
 otago:p=>[R('2-days','兩天',2,'',[D('第一天：Oamaru → Moeraki → 但尼丁',['oamaru','moeraki'],p.bold('第一天')),D('第二天：但尼丁市區或 Sandfly Bay',['otago-museum','baldwin'],p.extra[0])]),
  R('3-days','三天',3,'',[D('第一天：Oamaru → Moeraki → 但尼丁',['oamaru','moeraki'],p.bold('第一天')),D('第二天：但尼丁市區',['otago-museum','baldwin'],p.bold('第二天')),D('第三天：Sandfly Bay',['sandfly'],p.bold('第三天'))])],
 'queenstown-arrowtown':p=>[R('2-days','兩天：從三天裡選兩天',2,p.extra[0],[D('第一天：Skyline／Luge＋湖畔',['skyline','lakefront'],p.bold('第一天')),D('第二天：蒸汽船＋Walter Peak',['earnslaw'],p.bold('第二天'))]),
  R('3-days','三天',3,'',[D('第一天：Skyline／Luge＋湖畔',['skyline','lakefront'],p.bold('第一天')),D('第二天：蒸汽船＋Walter Peak',['earnslaw'],p.bold('第二天')),D('第三天：箭鎮',['arrowtown'],p.bold('第三天'))])],
 'wanaka-tekapo':p=>[R('2-days','兩天版本',2,p.trailing('兩天版本'),[D('第一天：Cardrona 與 Wānaka',['cardrona','wanaka-lake','wanaka-tree'],p.day('兩天版本',1)),D('第二天：前往 Tekapo',['tekapo-lake'],p.day('兩天版本',2))]),
  R('3-days','三天版本',3,p.trailing('三天版本'),[D('第一天：Cardrona 與 Wānaka',['cardrona','wanaka-lake','wanaka-tree'],p.day('兩天版本',1)),D('第二天：留在 Wānaka',['wanaka-lake','wanaka-tree'],p.day('三天版本',2)),D('第三天：轉往 Tekapo',['tekapo-lake'],p.day('三天版本',3))])]};
// Reads one plan section: bold-labelled paragraphs, their 第N天 parts and the remaining notes.
function planReader(section){
 const paras=textOf(section.lead),bold=new Map(),extra=[];
 for(const raw of section.lead.filter(b=>b.type==='text').map(b=>b.text)){const m=raw.match(/^\*\*([^*]+?)[：:｜]?\*\*\s*[：:]?\s*/)||raw.match(/^\*\*([^*｜]+)｜[^*]*\*\*\s*/);if(m)bold.set(m[1].replace(/[：:｜].*$/,'').trim(),inline(raw));else extra.push(inline(raw));}
 const get=key=>{const v=[...bold].find(([k])=>k===key||k.startsWith(key));if(!v)throw Error('Missing plan paragraph '+key);return v[1];};
 const parts=key=>{const t=get(key).replace(/^[^：｜]*[：｜]\s*/,'');return t.split(/(?<=^|[；。]\s*)(?=第[一二三四五]天)/).map(s=>s.replace(/[；;]\s*$/,'').trim()).filter(Boolean);};
 const num='一二三四五';
 // A day paragraph's own 「第一天｜…。」 label is already the day title.
 return {paras,extra,bold:key=>get(key).replace(/^第[一二三四五]天(?:選配)?｜[^。]*。\s*|^第[一二三四五]天(?:選配)?：\s*/,''),
  day:(key,n)=>{const p=parts(key).find(s=>s.startsWith('第'+num[n-1]+'天'));if(!p)throw Error(`Missing ${key} day ${n}`);const t=p.split('。');return (t.length>1&&n===parts(key).length?t[0]+'。':p.endsWith('。')?p:p+'。').trim();},
  trailing:key=>{const ps=parts(key),last=ps.at(-1),i=last.indexOf('。');return i>=0&&i<last.length-1?last.slice(i+1).trim():'';}};
}

// The approved header shows two lead paragraphs: the first sentence, then the rest.
function twoLeads(text,fallback){const i=text.search(/[。？]/)+1;return i>0&&i<text.length?[text.slice(0,i),text.slice(i)]:[text,fallback];}
const catalog=new Map(travelHomeCatalog.guides.filter(g=>g.countryId==='new-zealand').map(g=>[g.id,g]));
const cities=[];
for(const region of regions){
 const doc=parse(region.manuscript),cat=catalog.get(region.id);
 const stops=region.stops.filter(s=>!s.alternate),assigned=new Map();
 const matchStops=title=>stops.filter(s=>title.includes(s.heading)&&!assigned.has(s.id));
 const photosFor=stop=>(galleries[region.id]?.[stop.id]||(stop.photo?[{name:stop.photo,alt:stop.photoAlt}]:[])).map(g=>{if(!pageOf.has(g.name))pageOf.set(g.name,region.route);return asset(g.name,{alt:g.alt,caption:g.caption});});
 pageOf.set(region.hero,pageOf.get(region.hero)||region.route);
 const videoLinks=[];
 // Classify each H2: place, chapter of places, or a supporting module.
 const placeSections=[],before=[],after=[];let faqSection,planSection,videoSection,seenPlace=false;
 for(const s of doc.sections){
  const kind=kindOf(s.title);
  if(kind==='faq'){faqSection=s;continue;}if(kind==='plan'){planSection=s;continue;}if(kind==='video'){videoSection=s;continue;}
  // An H3 naming a stop is its own place; the H2 keeps any stop no H3 claims.
  const subPlaces=s.subs.map(sub=>({sub,stop:matchStops(sub.title)[0]})).filter(x=>x.stop);
  const own=matchStops(s.title).filter(st=>!subPlaces.some(x=>x.stop===st));
  if(!own.length&&!subPlaces.length){(seenPlace?after:before).push(s);continue;}
  seenPlace=true;
  const entry={section:s,own:own[0]||null,merged:own.slice(1),subPlaces};
  for(const st of [...own,...subPlaces.map(x=>x.stop)])assigned.set(st.id,s.title);
  placeSections.push(entry);
 }
 const unassigned=stops.filter(s=>!assigned.has(s.id));
 if(unassigned.length)throw Error(`${region.id}: stops without a section ${unassigned.map(s=>s.id)}`);
 const places=[],chapters=[],food=[],aliases={};
 const makePlace=(stop,title,bs,extraStops=[])=>{
  const paragraphs=textOf(bs),links=linksOf(bs);
  const inlineImgs=bs.filter(b=>b.type==='image').map(b=>asset(b.name,{alt:b.alt}));
  const imgs=[...new Set([...photosFor(stop),...extraStops.flatMap(photosFor),...inlineImgs])];
  const official=[...new Set(links.concat(paragraphs.flatMap(linkList)).filter(l=>/^https:/.test(l.url)&&!isMap(l.url)).map(linkSource))];
  const play=(title.split(/[：｜]/)[1]||cat.summary).trim();
  const sourceIds=official.length?official:[...new Set(imgs.flatMap(a=>assets.get(a).sourceIds))].slice(0,2);
  for(const s of extraStops)aliases[s.id]=stop.id;
  // The old page also showed a map link built from the stop's own map query; it stays.
  const stopMap=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.map)}`;
  const mapsLink=links.some(l=>l.url===stopMap)?[]:[{label:`Google Maps：${stop.name}`,url:stopMap}];
  return {id:stop.id,stableId:`nz-${region.id}-${stop.id}`,title,paragraphs,sourceIds,facts:facts(stop,bs.filter(b=>b.type==='text').map(b=>b.text),play,sourceIds),
   images:imgs.slice(0,3),...(imgs.length>3?{supportImages:imgs.slice(3)}:{}),links:[...links,...mapsLink],_stop:stop};
 };
 for(const {section:s,own,merged,subPlaces} of placeSections){
  const nonPlaceSubs=s.subs.filter(sub=>!subPlaces.some(x=>x.sub===sub));
  if(!subPlaces.length){
   // One place; H3s that name no stop stay with it, except a restaurant, which joins the food module.
   const keep=nonPlaceSubs.filter(sub=>!/Bully Hayes/.test(sub.title));
   for(const sub of nonPlaceSubs.filter(sub=>/Bully Hayes/.test(sub.title)))food.push(sub);
   places.push(makePlace(own,s.title,[...s.lead,...keep.flatMap(sub=>sub.blocks)],merged));continue;
  }
  const chapterId=`${region.id}-${slug(s.title.split(/[：｜]/)[0]).replace(/^-|-$/g,'')||'chapter'}`.slice(0,60).replace(/-$/,'');
  const ids=[];
  if(own){places.push({...makePlace(own,s.title,s.lead,merged),sectionTitle:own.name});ids.push(own.id);}
  for(const {sub,stop} of subPlaces){places.push(makePlace(stop,sub.title,sub.blocks));ids.push(stop.id);}
  chapters.push({id:chapterId,title:s.title,paragraphs:own?[]:textOf(s.lead),sourceIds:[...new Set(ids.flatMap(id=>places.find(p=>p.id===id).sourceIds))],placeIds:ids});
 }
 // Hobbiton's i-SITE departure is the same venue; it stays as an alias of the main place.
 for(const alt of region.stops.filter(s=>s.alternate)){const main=places.find(p=>p._stop.heading===alt.heading);aliases[alt.id]=main.id;
  main.extraFacts=[{label:'另一種出發方式',value:`${alt.name}：${alt.time}。`,sourceIds:main.sourceIds}];}
 // Single-place chapters in a chaptered guide get a short chapter title and keep the full heading on the place.
 if(chapters.length){
  for(const p of places.filter(p=>!chapters.some(c=>c.placeIds.includes(p.id)))){
   chapters.push({id:`${region.id}-${p.id}-chapter`.slice(0,60),title:p._stop.name,paragraphs:[],sourceIds:p.sourceIds,placeIds:[p.id]});
  }
  const order=new Map(places.map((p,i)=>[p.id,i]));chapters.sort((a,b)=>order.get(a.placeIds[0])-order.get(b.placeIds[0]));
 }
 // Videos: the guide's own video list; the rest of its links stay as further reading.
 const vLinks=linksOf(videoSection.lead),vText=textOf(videoSection.lead);
 const videoSourceIds=[...new Set(vLinks.filter(l=>isVideo(l.url)).map(linkSource))];
 if(!videoSourceIds.length)throw Error(region.id+': no video links');
 const mainSource=videoSourceIds[0];
 for(const p of places)if(!p.sourceIds.length)p.sourceIds=[mainSource];
 const moduleOf=(s,id)=>({...(id?{id}:{}),title:s.title,paragraphs:textOf(s.lead||s.blocks),sourceIds:[mainSource],links:linksOf(s.lead||s.blocks).map(l=>({label:l.label,url:l.url}))});
 const reading=before.length?{...moduleOf(before[0]),subsections:before.slice(1).map((s,i)=>moduleOf(s,`${region.id}-reading-${i+1}`)).concat(before[0].subs.map((sub,i)=>({id:`${region.id}-reading-sub-${i+1}`,title:sub.title,paragraphs:textOf(sub.blocks),sourceIds:[mainSource],links:linksOf(sub.blocks)})))}:null;
 if(reading&&!reading.subsections.length)delete reading.subsections;
 const arrival=after.length?{...moduleOf(after[0]),...(after.length>1?{subsections:after.slice(1).map((s,i)=>moduleOf(s,`${region.id}-arrival-${i+1}`))}:{})}:null;
 // Arrival text written between two places (e.g. the drive to Tekapo) joins the arrival module.
 const foodModule=food.length?{title:food[0].title,paragraphs:textOf(food[0].blocks),sourceIds:[mainSource],links:linksOf(food[0].blocks),...(food.length>1?{subsections:food.slice(1).map((s,i)=>({id:`${region.id}-food-${i+1}`,title:s.title,paragraphs:textOf(s.blocks),sourceIds:[mainSource],links:linksOf(s.blocks)}))}:{})}:null;
 for(const m of [reading,arrival,foodModule].filter(Boolean))for(const s of [m,...(m.subsections||[])])if(!s.paragraphs.length&&!s.links.length)s.paragraphs=[s.title];
 const faq=faqSection.subs.map(sub=>({question:sub.title,answer:textOf(sub.blocks).join(' '),sourceIds:[mainSource]}));
 const pr=planReader(planSection),routesDef=plans[region.id](pr);
 const planner={title:planSection.title,paragraphs:pr.extra.length?pr.extra:[`${cat.name}：${cat.summary}`],sourceIds:videoSourceIds,
  routes:routesDef.map(r=>({id:`${region.id}-${r.id}`,label:r.label,sightseeingDays:r.days,pace:'leisure',note:r.note||'抵達、離境與跨區移動另留時間；預約後依場次調整順序。',sourceIds:videoSourceIds,
   days:r.ds.map(d=>({title:d.title,description:d.text,stops:d.stops,...(d.stops.length?{}:{transfer:true})}))}))};
 const extension={title:videoSection.title,paragraphs:vText.length?vText:[`${cat.name}的影片與延伸閱讀。`],sourceIds:videoSourceIds,links:vLinks.filter(l=>!isVideo(l.url)).map(l=>({label:l.label,url:l.url}))};
 // Three distinct hero photos: the guide's own hero, then the first photos of its places.
 const heroAsset=asset(region.hero,{alt:region.heroAlt,caption:region.heroCaption||region.heroAlt});
 const hero=[...new Set([heroAsset,...places.map(p=>p.images[0])])].slice(0,3);
 const cards=places.map(p=>({target:p.id,assetId:p.images[0],title:p._stop.name,play:p.facts.play.value,time:p._stop.time,focalPoint:[50,50]}));
 const introText=textOf(doc.introBlocks).join(''),intro=twoLeads(introText,cat.summary);
 if(region.id==='christchurch-akaroa')Object.assign(aliases,{itinerary:'plan','plan-two':'plan','plan-three':'plan','plan-five':'plan','city-walk':'tram','new-regent':'tram',riverside:'tram',gardens:'tram',gallery:'ninja-valley',airforce:'ninja-valley',farm:'shamarra',dolphins:'akaroa-dolphins',museum:'akaroa-museum','fish-chips':'akaroa-museum',waterfront:'akaroa-museum',before:'places'});
 const city={id:region.id,countryId:'new-zealand',path:region.route,name:cat.name,englishName:cat.englishName,destinationKind:'region',
  title:doc.title,description:introText.slice(0,150),intro,sourceIds:[...new Set([...videoSourceIds,...places.flatMap(p=>p.sourceIds)])].slice(0,8),author:'鷹式一家',updatedOn:updatedAt,
  hero,places:places.map(({_stop,...p})=>p),...(chapters.length?{chapters}:{}),cards,...(reading?{reading}:{}),...(foodModule?{food:foodModule}:{}),...(arrival?{arrival}:{}),faq,videoSourceIds,planner,extension,
  ...(Object.keys(aliases).length?{anchorAliases:aliases}:{})};
 // Plan stops that name a merged stop point at the place that carries it.
 for(const r of city.planner.routes)for(const d of r.days)d.stops=[...new Set(d.stops.map(id=>aliases[id]&&city.places.some(p=>p.id===aliases[id])?aliases[id]:id))];
 cities.push(city);
}

// Country overview: the published overview manuscript.
const ov=parse('new-zealand-family-travel-overview.md');
const sec=t=>ov.sections.find(s=>s.title.startsWith(t));
const ovVideo=sec('先看我們的旅行現場'),ovVideoLinks=linksOf(ovVideo.lead),ovVideoIds=ovVideoLinks.map(linkSource);
const choose=sec('南北島怎麼選'),chooseText=choose.lead.filter(b=>b.type==='text').map(b=>b.text);
const note=raw=>{const m=raw.match(/^\*\*([^*]+)\*\*\s*/);return {title:m[1],paragraphs:[inline(raw.slice(m[0].length))],links:linkList(raw)};};
const table=sec('八個區域').lead.find(b=>b.type==='table');
const plan=sec('按假期長度選路線'),planTexts=plan.lead.filter(b=>b.type==='text').map(b=>b.text);
const inspirations=planTexts.filter(t=>/^\*\*/.test(t)).map(t=>{const m=t.match(/^\*\*([^*]+)\*\*\s*/);return {title:m[1].replace(/[。]$/,''),paragraphs:[inline(t.slice(m[0].length))],links:[]};});
const minimum={'north-island':3,wellington:2,'christchurch-akaroa':2,'mid-canterbury':2,kaikoura:2,otago:2,'queenstown-arrowtown':2,'wanaka-tekapo':2};
const names=Object.fromEntries(cities.map(c=>[c.id,c.name]));
const routeSets=[...regions.map(r=>[r.id]),['christchurch-akaroa','queenstown-arrowtown'],['christchurch-akaroa','wanaka-tekapo','queenstown-arrowtown'],['north-island','christchurch-akaroa','queenstown-arrowtown'],
 ['christchurch-akaroa','wanaka-tekapo','queenstown-arrowtown','otago'],['christchurch-akaroa','mid-canterbury','wanaka-tekapo','queenstown-arrowtown']];
const country={id:'new-zealand',path:countryRoute,name:'紐西蘭',englishName:'New Zealand',flag:'🇳🇿',title:ov.title,metadataTitle:ov.title+'｜鷹家遠行所',
 description:textOf(ov.introBlocks).join('').slice(0,150),intro:twoLeads(textOf(ov.introBlocks).join(''),'先選區域，再排適合的天數。'),author:'鷹式一家',updatedOn:updatedAt,sourceIds:ovVideoIds,cityIds:cities.map(c=>c.id),
 image:asset('nz-christchurch-tram'),
 presentation:{overviewTitle:choose.title,overviewText:inline(chooseText.at(-1)),destinationNotes:chooseText.slice(0,-1).map(note),
  citySummaries:cities.map(c=>{const row=table.rows.find(r=>href(linkList(r[1])[0].url)===c.path);return {cityId:c.id,tag:row[2],intro:`${row[0]}。${catalog.get(c.id).summary}`,sourceIds:c.videoSourceIds.slice(0,1)};}),
  themes:[{id:'hands-on',label:'自己動手'},{id:'vehicles',label:'交通工具'},{id:'animals',label:'看動物'},{id:'winter',label:'冬季風景'}],
  placeThemes:[['north-island','rotorua-luge',['hands-on']],['queenstown-arrowtown','skyline',['hands-on']],['queenstown-arrowtown','arrowtown',['hands-on']],
   ['christchurch-akaroa','tram',['vehicles']],['wellington','cable-car',['vehicles']],['queenstown-arrowtown','earnslaw',['vehicles']],
   ['north-island','hamilton-zoo',['animals']],['wellington','wellington-zoo',['animals']],['christchurch-akaroa','shamarra',['animals']],['christchurch-akaroa','akaroa-dolphins',['animals']],['kaikoura','ohau-point',['animals']],['kaikoura','seal-kayak',['animals']],
   ['mid-canterbury','mt-hutt',['winter']],['mid-canterbury','staveley',['winter']]].map(([cityId,placeId,themeIds])=>({cityId,placeId,themeIds})),
  routeInspirations:inspirations},
 allocation:{approved:true,arrivalDays:1,departureDays:1,dayRange:[7,21],extraDays:'round-robin',sourceIds:ovVideoIds,
  minimumStay:Object.fromEntries(Object.entries(minimum).map(([id,n])=>[id,{leisure:n+1,compact:n}])),
  routes:routeSets.map(ids=>({id:ids.join('-'),label:ids.map(id=>names[id]).join(' → '),description:'天數包含抵達與離境日；每換一個區域留一天交通，跨島也是一天。',cityIds:ids,transferDays:ids.slice(1).map(()=>1),validFrom:'2026-01-01',validThrough:'2027-12-31',sourceIds:ovVideoIds}))},
 planInfo:{title:plan.title,paragraphs:planTexts.filter(t=>!/^\*\*/.test(t)).map(inline),sourceIds:ovVideoIds,links:[]},
 packing:{title:'跨區交通與季節預算',paragraphs:[...textOf(sec('跨區交通').lead),...textOf(sec('季節與預算').lead)],sourceIds:[...new Set(linksOf(sec('跨區交通').lead).concat(textOf(sec('跨區交通').lead).flatMap(linkList)).filter(l=>/^https:/.test(l.url)).map(linkSource))].concat(ovVideoIds.slice(0,1)),links:[]},
 related:{title:sec('用孩子想做的事').title,paragraphs:textOf(sec('用孩子想做的事').lead),sourceIds:ovVideoIds,links:cities.map(c=>({label:c.name,url:c.path}))},
 videos:{title:ovVideo.title,paragraphs:textOf(ovVideo.lead).length?textOf(ovVideo.lead):[ov.title],sourceIds:ovVideoIds,links:ovVideoLinks},
 faq:sec('規劃前常見問題').subs.map(sub=>({question:sub.title,answer:textOf(sub.blocks).join(' '),sourceIds:ovVideoIds})),
 discovery:{region:'oceania',subregion:'australasia',summary:'北島的城市與戶外活動，南島的湖泊、海岸與農場，先選一段喜歡的風景。',assetId:'nz-christchurch-tram',sourceIds:ovVideoIds,point:[172.8,-43.2],isoNumeric:'554'}};
const atlasSource=addSource({id:'p-new-zealand-atlas',kind:'photo',url:site+countryRoute,label:'紐西蘭手繪旅行示意圖',rights:'鷹式一家自製旅行示意圖，原刊於本站紐西蘭總覽。',locator:'紐西蘭總覽地圖'});
assets.set('new-zealand-atlas',legacyAsset('new-zealand-atlas',{alt:'紐西蘭手繪旅行示意圖：北島在上，南島在下，八個旅行區域分布其中',caption:'旅行位置示意；點區域看攻略。',sourceIds:[atlasSource]}));
const points={'north-island':[67,33,'right'],wellington:[61,53,'right'],kaikoura:[55,60,'right'],'christchurch-akaroa':[51,67,'right'],'mid-canterbury':[45,69,'left'],'wanaka-tekapo':[40,71,'left'],'queenstown-arrowtown':[32,77,'left'],otago:[40,83,'right']};
country.map={assetId:'new-zealand-atlas',caption:'旅行位置示意；點區域看攻略。',sourceIds:[atlasSource],pins:Object.keys(points).map(id=>({cityId:id,x:points[id][0],y:points[id][1],...(points[id][2]==='left'?{align:'left'}:{})}))}; // north to south

const pkg={schema:'eaglish.approved-travel-package/v1',approved:true,sources:[...sources.values()],assets:[...assets.values()],countries:[country],cities,routes:[],
 coverage:{countryIds:['new-zealand'],cityIds:cities.map(c=>c.id)}};
const out=resolve(root,'trip/data/new-zealand-approved-travel-v1.json');
writeFileSync(out,JSON.stringify(pkg,null,2)+'\n');
console.log('wrote',out,'sources',pkg.sources.length,'assets',pkg.assets.length,'cities',cities.length,'places',cities.reduce((n,c)=>n+c.places.length,0));
