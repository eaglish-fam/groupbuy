// Restates the published Cebu/Bohol guide (trip/content/philippines/cebu-bohol-with-kids.md)
// in the approved-package shape used by Japan, Thailand and Singapore. Text, photos,
// links and day plans come from the published article; the six practical answers
// per place reuse sentences from its own "建議…" paragraphs. Nothing new is added.
// Run once: node scripts/migrate/cebu-bohol-approved-v1.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from './legacy-approved-helpers.mjs';

const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const config=json('trip/data/cebu-bohol-guide.json');
const media=new Map(json('trip/assets/cebu-bohol-media.json').map(m=>[m.id,m]));
const md=readFileSync(resolve(root,'trip/content/philippines/cebu-bohol-with-kids.md'),'utf8');
const front=Object.fromEntries(md.match(/^---\n([\s\S]*?)\n---/)[1].split('\n').map(l=>{const i=l.indexOf(':');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const checkedOn=front.updated,path=config.path,page='https://www.eaglish.store'+path;
const video='https://www.youtube.com/watch?v=QmngtzfPVDk';

const sources=new Map(),assets=new Map();
const addSource=s=>{if(!sources.has(s.id))sources.set(s.id,s);return s.id;};
const ownRights='鷹式一家自有公開照片與影片，原刊於本站宿霧、薄荷島攻略。';
const slug=url=>url.replace(/^https:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,70).replace(/^-+|-+$/g,'');
const linkSource=l=>/youtube\.com/.test(l.url)?addSource({id:'v-'+slug(l.url),kind:'youtube',url:l.url,label:l.label,rights:ownRights})
 :addSource({id:'o-'+slug(l.url),kind:'official',url:l.url,label:l.label,checkedOn,rights:'第一方公開資訊摘要；照片不採用'});
const mainVideo=linkSource({url:video,label:'《宿霧親子旅遊之薄荷島三日遊》完整影片'});

// Every photo keeps its published variants; lineage points at the published master.
function asset(id,{alt,caption}){
 if(assets.has(id))return id;
 const m=media.get(id);if(!m)throw Error('Unknown Cebu/Bohol media '+id);
 const variants=m.variants.map(v=>({url:v.file,width:v.width,height:v.height,bytes:v.bytes,sha256:v.sha256})).filter(v=>v.width<=1440).sort((a,b)=>a.width-b.width),master=variants.at(-1);
 const frame=m.kind==='owned-video-frame';
 const sourceId=frame?mainVideo:addSource({id:'m-'+id,kind:'photo',url:page,label:caption,rights:ownRights});
 assets.set(id,{assetId:id,width:master.width,height:master.height,alt,caption,focalPoint:[50,50],sourceIds:[sourceId],variants,
  lineage:{sourceSha256:master.sha256,sourceWidth:master.width,sourceHeight:master.height,kind:frame?'video-frame':'photo',activePicture:{x:0,y:0,width:master.width,height:master.height},
   ...(frame?{pts:Math.round(m.actualSeconds*90000),timebase:'1/90000'}:{})},
  legacyProvenance:{originalSha256:m.originalSha256,derivedSha256:m.derivedSha256,...(frame?{sourceUrl:m.sourceUrl,timecode:m.timecode}:{}),creator:m.creator}});
 return id;
}

// Same-page anchors follow the approved section ids; the old ids stay as aliases
// because the travel home and the two stay articles link to them.
const anchorMap={choose:'places',dining:'food',transport:'arrival',films:'extension'};
const inline=s=>s.replace(/\*\*/g,'').replace(/\]\(#([a-z0-9-]+)\)/g,(m,a)=>`](#${anchorMap[a]||a})`).trim();
const linkList=s=>[...s.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(m=>({label:m[1],url:m[2]}));
const plainText=s=>s.replace(/\*\*/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').trim();
const isLinkLine=b=>/^\[[^\]]+\]\([^)]+\)(?:｜\[[^\]]+\]\([^)]+\))*$/.test(b);

// Each "<a id> + ##" section becomes a list of blocks: text, h3, image, table, links.
const sections=new Map();
for(const part of md.split(/\n<a id="/).slice(1)){
 const id=part.slice(0,part.indexOf('"')),body=part.slice(part.indexOf('\n')+1).trim();
 const title=body.match(/^## (.+)$/m)[1],blocks=[];
 const raw=body.replace(/^## .+$/m,'').trim().split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean);
 for(let i=0;i<raw.length;i++){
  const b=raw[i],img=b.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if(b.startsWith('### '))blocks.push({type:'h3',text:b.slice(4)});
  else if(img){const caption=raw[++i];const aid=config.mediaMap[img[2]];if(!aid)throw Error('Unmapped image '+img[2]);
   blocks.push({type:'image',id:asset(aid,{alt:img[1],caption:plainText(caption)}),captionLinks:linkList(caption)});}
  else if(b.startsWith('|')){const rows=b.split('\n').map(r=>r.split('|').slice(1,-1).map(c=>c.trim()));blocks.push({type:'table',head:rows[0],rows:rows.slice(2)});}
  else if(isLinkLine(b))blocks.push({type:'links',links:linkList(b)});
  else blocks.push({type:'text',text:inline(b)});
 }
 sections.set(id,{title,blocks});
}
const take=(id,type)=>sections.get(id).blocks.filter(b=>b.type===type);
const texts=id=>take(id,'text').map(b=>b.text);
const tableRows=t=>t.rows.map(r=>`${inline(r[0])}——${t.head.slice(1).map((h,i)=>`${h}：${inline(r[i+1])}`).join('；')}。`);
// Blocks between one h3 and the next.
function bySub(id){
 const out=[];let cur={title:null,blocks:[]};
 for(const b of sections.get(id).blocks){if(b.type==='h3'){out.push(cur);cur={title:b.text,blocks:[]};}else cur.blocks.push(b);}
 out.push(cur);return out.filter(s=>s.title||s.blocks.length);
}

// The six questions per place, from each section's own practical paragraph.
const facts={
 buggy:{what:'有車架與頂篷的家庭 buggy，全家坐在一起，從泥土路看山丘。',play:'一起坐車走進丘陵與泥土路',arrival:'與 Carmen 山景段一起詢問接送，使用業者確認的集合點。',
  duration:'建議先留 1～1.5 小時，包含準備與換裝；較長路線再增加時間。',availability:'場次、費用與雨天改期方式在預約時確認。',
  conditions:'預約時附上孩子年齡、身高及全家人數，一次問清車型、駕駛資格、兒童乘坐、安全帶與頭盔，以及帶隊或代駕選項；若路線取消，就改用餐或休息。'},
 hills:{what:'巧克力山的特色是連綿的圓錐狀丘陵，高處看出去，山丘與其間樹林一起展開。',play:'看連綿山丘，拍全景與合照',arrival:'與 Carmen 周邊活動串接，接送一併確認。',
  duration:'建議安排 45～60 分鐘。',availability:'放在白天；當日開放與入場方式出發前確認。[官方鄉村路線](https://tourism.bohol.gov.ph/countryside-tour/)',
  conditions:'官方鄉村路線的觀景台需登階，帶幼兒或推車先問實際觀景點的入口與停放安排；強雨或登階不便時換時段，午餐仍按原本時間吃。'},
 tarsier:{what:'Bohol Tarsier Conservation Area，位於 Villa Aurora, Bilar，在枝葉間觀察眼鏡猴。',play:'放慢腳步，在枝葉間找小動物',arrival:'向司機提供完整園名與下方地圖。',
  duration:'建議觀察 30～45 分鐘，另留等候。',availability:'出發前確認當日參觀時間與購票方式。',
  conditions:'穿好走的鞋；在現場輕聲觀察，按指引保持距離、關掉閃光燈。下雨先問步道是否開放，再決定縮短或延後。'},
 loboc:{what:'Loboc River 上的午餐船，把河上航程也放進午餐。',play:'坐下吃飯，也看看河岸',arrival:'預約時確認船家、登船處與報到時間，用訂單上的碼頭安排接送。',
  duration:'一般約 45～60 分鐘的航程；加上報到、候船與用餐，建議整段留 1.5～2 小時。[省府旅遊資料](https://ppdo.bohol.gov.ph/ppdofiles/Profile/SocioEconomicProfile/EconomicDevelopment/TourismProfile2025.pdf#page=125)',
  availability:'先固定午餐場次，再排前後活動；兒童計價在預約時確認。',
  conditions:'遇雨查當日開航及改期方式，陸上餐廳作午餐替代；孩子吃飯時間固定、不想配合場次，選陸上午餐會更好調整。'},
 cross:{what:'Cebu City 的宗教場所，十字架在亭內中央，抬頭還能看見壁畫。',play:'看十字架與天花板壁畫',arrival:'在宿霧市區，與薄荷島內陸活動分開安排；市區交通另外算。',
  duration:'建議留 20～30 分鐘。',availability:'排在白天，出發前確認當日開放與宗教活動。',
  conditions:'亭內有屋頂，進出和接車仍要步行；大雨時改成方便抵達的室內用餐，短暫參觀另找時段。'},
 'whale-shark':{what:'薄荷島 Lila 的鯨鯊觀察：搭小船到活動區，可以下水，也可以留在船上看。',play:'看我們當年的乘船與水下體驗，了解現在怎麼安排',
  arrival:'地圖是 Lila 的位置，不是指定業者的登船點；實際接送用預約單上的地點。',duration:'連同住宿接送、說明、候船和回程一起估算；請業者提供完整時間。',
  availability:'鯨鯊互動季為 11 月至翌年 5 月；業者須取得 Certificate of Compliance（COC），也不保證每次都能看到。[省府互動季與許可說明](https://bohol.gov.ph/2026/05/01/bohol-strengthens-marine-wildlife-protection-through-enhanced-ordinance-irr/)',
  conditions:'禁止餵食、碰觸與騷擾；游泳者與鯨鯊至少保持 4 公尺、船隻至少 20 公尺。[現行互動規範](https://bohol.gov.ph/2026/05/12/bohol-strengthens-marine-wildlife-protection-and-coastal-resource-management-efforts/)'}};
// Paragraphs whose content now lives in the practical answers.
const movedToFacts=[/^建議先留 1～1\.5 小時/,/^建議安排 45～60 分鐘/,/^建議觀察 30～45 分鐘/,/^省府旅遊資料介紹/,/^預約時確認船家/,/^建議留 20～30 分鐘/,/^地圖是 Lila 的位置/];
const label={what:'是什麼',play:'玩什麼',arrival:'怎麼去',duration:'留多久',availability:'何時能去',conditions:'雨天或特殊條件'};
// Card photos: hills uses its own section photo; the family photo at the viewpoint leads the page.
const cardImage={hills:'photo-07'};

const places=config.cards.map(card=>{
 const id=card.target,s=sections.get(id);
 const images=take(id,'image').map(b=>b.id);
 const links=[...take(id,'links').flatMap(b=>b.links),...take(id,'image').flatMap(b=>b.captionLinks)];
 const factLinks=Object.values(facts[id]).flatMap(linkList);
 const official=[...new Set([...links,...factLinks].filter(l=>!/google\.com\/maps/.test(l.url)).map(linkSource))];
 const paragraphs=texts(id).filter(t=>!movedToFacts.some(r=>r.test(t)));
 const factSources=official.length?official:[mainVideo];
 return {id,stableId:'cebu-bohol-'+id,title:s.title,paragraphs,sourceIds:[...new Set([...official,mainVideo])],
  facts:Object.fromEntries(Object.entries(facts[id]).map(([k,v])=>[k,{label:label[k],value:v,sourceIds:factSources}])),
  images:images.slice(0,3),...(images.length>3?{supportImages:images.slice(3)}:{}),links};
});
const cards=config.cards.map(c=>({target:c.target,assetId:cardImage[c.target]||c.image,title:c.name,play:c.reason,time:c.duration.replace(/^建議 ?/,''),focalPoint:[50,50]}));

// Module subsections keep their photos and link lines.
const sub=(id,s,extra=[])=>{
 const images=s.blocks.filter(b=>b.type==='image').map(b=>b.id);
 return {id,title:s.title,paragraphs:[...s.blocks.flatMap(b=>b.type==='text'?[b.text]:b.type==='table'?tableRows(b):[]),...extra],sourceIds:[mainVideo],
  links:s.blocks.filter(b=>b.type==='links').flatMap(b=>b.links),...(images.length?{images}:{})};
};
const lead=s=>s.blocks.flatMap(b=>b.type==='text'?[b.text]:b.type==='table'?tableRows(b):[]);
const [diningLead,mist,ubeco,choice]=bySub('dining');
const food={title:sections.get('dining').title,paragraphs:lead(diningLead),sourceIds:[mainVideo],links:[],
 subsections:[sub('food-mist',mist),sub('food-ubeco',ubeco),sub('food-choice',choice)]};
const [stayLead,molly,henann]=bySub('stay');
const stay={title:sections.get('stay').title,paragraphs:lead(stayLead),sourceIds:[mainVideo],links:[],
 subsections:[sub('stay-molly',molly),sub('stay-henann',henann)]};
// Arrival opens with the two-island split; the planner's whole-trip notes close it.
const islands=sections.get('islands'),[chooseFirst,chooseNote]=texts('choose');
const transport=bySub('transport'),planSubs=bySub('plan');
const wholeTrip=planSubs.find(s=>s.title?.startsWith('抵離'));
const arrival={title:sections.get('transport').title,paragraphs:[],sourceIds:[mainVideo],links:[],
 subsections:[sub('islands',{title:islands.title,blocks:islands.blocks}),...transport.map((s,i)=>sub(`arrival-${i+1}`,s)),sub('arrival-whole-trip',wholeTrip)]};
for(const s of arrival.subsections)s.sourceIds=[...new Set([mainVideo,...s.links.filter(l=>/^https:/.test(l.url)&&!/google\.com\/maps|facebook\.com/.test(l.url)).map(linkSource)])];

// FAQ: question h3 + answer paragraph(s).
const faq=bySub('faq').filter(s=>s.title).map(s=>({question:s.title,answer:s.blocks.map(b=>b.text).join(' '),sourceIds:[mainVideo]}));

// Planner: the four published day plans, by number of full Bohol days and pace.
const planText=s=>s.blocks.map(b=>b.text.replace(/^(第[一二]天：)/,''));
const day=(title,description,stops)=>({title,description,stops});
const plans=Object.fromEntries(planSubs.filter(s=>s.title&&!s.title.startsWith('抵離')).map(s=>[s.title,planText(s)]));
const [oneLeisure,oneCompact,twoLeisure,twoCompact]=Object.keys(plans);
const route=(id,label,days,pace,note,ds)=>({id:`cebu-bohol-${id}`,label,sightseeingDays:days,pace,note,sourceIds:[mainVideo],days:ds});
const planner={title:sections.get('plan').title,paragraphs:[planSubs[0].blocks[0].text,chooseNote],sourceIds:[mainVideo],routes:[
 route('1-leisure',oneLeisure,1,'leisure','住宿是起點，跨島抵離與宿霧停留另算。',[day(oneLeisure.split('｜')[1],plans[oneLeisure].join(' '),['hills','tarsier'])]),
 route('1-compact',oneCompact,1,'compact','預約後依交通和午餐場次調整順序。',[day(oneCompact.split('｜')[1],plans[oneCompact].join(' '),['tarsier','hills','buggy','loboc'])]),
 route('2-leisure',twoLeisure,2,'leisure','兩天下午都留休息。',[day('第一天：山景與 buggy',plans[twoLeisure][0],['hills','buggy']),day('第二天：眼鏡猴與午餐',plans[twoLeisure][1],['tarsier','loboc'])]),
 route('2-compact',twoCompact,2,'compact','由司機依接送位置串接。',[day('第一天：四種玩法串接',plans[twoCompact][0],['hills','buggy','tarsier']),day('第二天：Loboc 午餐船或休息',plans[twoCompact][1],['loboc'])])]};

// Films: the full video and its chapters; the closing reading links stay as further reading.
const films=sections.get('films');
const chapterLinks=linkList(texts('films')[0]).filter(l=>l.url.includes('&t='));
const videoSourceIds=[mainVideo,...chapterLinks.map(linkSource)];
const extension={title:films.title,paragraphs:texts('films').slice(0,2),sourceIds:videoSourceIds,
 links:linkList(texts('films')[2]).map(l=>({label:l.label,url:l.url.replace('https://www.eaglish.store','')}))};

const [heading,introLead,,heroImage,heroCaption]=md.replace(/^---[\s\S]*?---\n/,'').trim().split(/\n\s*\n/);
const heroMatch=heroImage.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
asset(config.mediaMap[heroMatch[2]],{alt:heroMatch[1],caption:plainText(heroCaption)});
const city={id:'cebu-bohol',countryId:'philippines',path,name:'宿霧・薄荷島',englishName:'Cebu · Bohol',destinationKind:'region',
 title:front.title,description:front.description,intro:[introLead,chooseFirst],sourceIds:[...new Set([mainVideo,...places.flatMap(p=>p.sourceIds)])].slice(0,6),
 author:front.author,updatedOn:front.updated,hero:['photo-06','photo-02','photo-08'],places,cards,food,stay,arrival,faq,videoSourceIds,planner,extension,
 anchorAliases:Object.fromEntries(Object.entries(anchorMap))};
if(heading!=='# '+front.title)throw Error('Unexpected article heading');
const country={id:'philippines',path,singleDestination:true,name:'菲律賓',englishName:'Philippines',flag:'🇵🇭',title:front.title,description:front.description,intro:city.intro,
 author:front.author,updatedOn:front.updated,sourceIds:[mainVideo],cityIds:['cebu-bohol'],image:'photo-06',faq:faq.slice(0,1)};
const pkg={schema:'eaglish.approved-travel-package/v1',approved:true,sources:[...sources.values()],assets:[...assets.values()],countries:[country],cities:[city],routes:[],
 coverage:{countryIds:['philippines'],cityIds:['cebu-bohol']}};
const out=resolve(root,'trip/data/cebu-bohol-approved-travel-v1.json');
writeFileSync(out,JSON.stringify(pkg,null,2)+'\n');
console.log('wrote',out,'sources',pkg.sources.length,'assets',pkg.assets.length,'places',places.length,'routes',planner.routes.length);
