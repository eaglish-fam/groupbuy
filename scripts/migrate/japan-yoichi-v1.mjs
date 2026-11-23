// Adds a Yoichi city guide to the Japan package from our 2024 winter trip
// (VThgTPbHDVU, the two Yoichi episodes as one video). The stay and Family Tour
// were a hosted invitation and the guide says so. Practical facts come from the
// operators' and the town's own sites (checked 2026-10-24); what only the video
// shows is written as our experience. Photos are video frames listed in
// trip/data/hokkaido-frames-v1.json; a place without its own frame is left out.
// Run after japan-otaru-v1.mjs: node scripts/migrate/japan-yoichi-v1.mjs
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,legacyAsset} from './legacy-approved-helpers.mjs';

const pkgPath=resolve(root,'trip/data/japan-approved-travel-v1.json');
const pkg=JSON.parse(readFileSync(pkgPath,'utf8'));
const framesPath=resolve(root,'trip/data/hokkaido-frames-v1.json');
const frames=existsSync(framesPath)?JSON.parse(readFileSync(framesPath,'utf8')):{places:{},frames:[]};
const checkedOn='2026-10-24',videoId='VThgTPbHDVU',video='https://www.youtube.com/watch?v='+videoId;
const sources=new Map(pkg.sources.map(s=>[s.id,s]));
const add=s=>{if(!sources.has(s.id))sources.set(s.id,s);return s.id;};
const official=(id,url,label)=>add({id,kind:'official',url,label,checkedOn,rights:'第一方公開資訊摘要；照片不採用'});
const clip=(id,seconds,label)=>add({id,kind:'youtube',url:`${video}&t=${seconds}`,label,rights:'鷹式一家自有影片。'});

const y={
 trip:clip('y00',0,'余市五天四夜：抵達小樽站'),house:clip('y01',140,'余市海邊的度假屋'),shop:clip('y02',295,'到 AEON 補買雪具與晚餐'),
 kiroro:clip('y03',440,'Kiroro 雪場與山上午餐'),snow:clip('y04',750,'房東安排的雪上活動'),coast:clip('y05',1787,'余市海邊與えびす岩・大黒岩'),
 sushi:clip('y06',2076,'余市番屋迴轉壽司'),nikka:clip('y07',2121,'Nikka 余市蒸餾所商店'),park:clip('y08',2197,'在地公園玩雪'),
 dinner:clip('y09',2262,'最後一晚的日式晚餐'),wrap:clip('y10',2370,'五天四夜總結與 Family Tour 內容')
};
const o={
 kiroroAccess:official('yoichi-kiroro-access','https://www.kiroro.co.jp/ja/access-winter/','Kiroro 冬季交通'),
 kiroroHours:official('yoichi-kiroro-hours','https://www.kiroro.co.jp/ja/operating_hours/','Kiroro 2025-26 營運時間'),
 kiroroRental:official('yoichi-kiroro-rental','https://www.kiroro.co.jp/ja/rental_price/','Kiroro 租借價目與時間'),
 rocks:official('yoichi-town-ebisu-daikoku','https://www.town.yoichi.hokkaido.jp/machi/syoukai/bunnkazai-ebisudaikoku.html','余市町：えびす岩・大黒岩'),
 town:official('yoichi-town-profile','https://www.town.yoichi.hokkaido.jp/machi/syoukai/files/suuji_de_miru_yoichi-2024.pdf','余市町「数字でみる よいち」2024'),
 nikkaTour:official('yoichi-nikka-reservation','https://distillery.nikka.com/yoichi/reservation','Nikka 余市蒸餾所導覽預約'),
 nikkaAccess:official('yoichi-nikka-access','https://www.nikka.com/en/distilleries/yoichi/access/','Nikka 余市蒸餾所交通'),
 house:official('yoichi-holiday-fugoppe','https://yoichiholiday.com/en/beach-front-fugoppe','Yoichi Holiday：Beach Front Fugoppe')
};
const fact=(label,value,sourceIds)=>({label,value,sourceIds,kind:sourceIds.every(id=>sources.get(id).kind==='official')?'source_based':'experience',checkedOn});

const places=[
 {id:'kiroro',stableId:'jp-yoichi-kiroro',title:'Kiroro 雪場：在風雪裡上山玩雪',locality:'赤井川村',
  paragraphs:['Kiroro 是小樽西南邊山裡的滑雪度假村，官網介紹離小樽約 30 分鐘。我們沒有租車，從余市的住處搭房東的車上山。','孩子穿著前一晚買齊的雪衣雪褲，大人到了雪場才租外套。上山後原本想在山上的餐廳吃飯，結果那間沒開，最後在另一間有暖氣的餐廳吃午餐，下午再去房東安排的雪上活動。'],
  facts:{what:fact('是什麼','小樽西南邊山裡的滑雪度假村，官網介紹離小樽約 30 分鐘。',[o.kiroroAccess]),
   play:fact('玩什麼','搭纜車上山、玩雪；雪具與雪衣可在 Mountain Center 1 樓租借。',[o.kiroroRental,y.kiroro]),
   arrival:fact('怎麼去','我們由房東開車接送。官網冬季交通頁另有 JR、巴士與計程車的說明，班次與票價以官網為準。',[o.kiroroAccess,y.kiroro]),
   duration:fact('留多久','我們 9:30 出門，上午在雪場、午餐後去雪上活動，下午 4 點才離開。',[y.kiroro,y.snow]),
   availability:fact('何時能去','2025–26 雪季高峰期纜車 9:00–15:00 運行，2 月中旬起延到 15:30；2026–27 雪季的時刻以官網公告為準。',[o.kiroroHours]),
   conditions:fact('雨天或特殊條件','我們那天遇到大雪和強風，山上起霧；官網註明積雪會影響運行的纜車。2026–27 雪季租借在纜車開始前 30 分鐘營業，最晚在結束前 1 小時借出。',[o.kiroroHours,o.kiroroRental,y.kiroro])},
  story:['那天早上剛起床時雪還很小，像在下雨，出門後越下越大，風也很強。雪場人很多，光是三個大人租外套就排了一段時間。','上山的路上起霧，什麼都看不太清楚。進到餐廳裡很暖，大家脫到只剩內層，吃飽再出發去下午的雪上活動。'],storySources:[y.kiroro],
  links:[{label:'Kiroro 冬季交通',url:'https://www.kiroro.co.jp/ja/access-winter/'},{label:'Kiroro 營運時間',url:'https://www.kiroro.co.jp/ja/operating_hours/'}]},
 {id:'ebisu-daikoku-rocks',stableId:'jp-yoichi-ebisu-daikoku',title:'惠比壽岩與大黑岩：余市海邊的一對奇岩',locality:'余市町白岩町',
  paragraphs:['えびす岩和大黒岩在余市町白岩町的海岸外，兩塊岩石並立在離岸十多公尺的淺灘上。余市町介紹，名字來自七福神的惠比壽和大黑天，也叫夫婦岩。','外側上寬下窄、看起來不太穩的是えびす岩，靠岸邊、較大較穩的是大黒岩。周圍是偏白色的斷崖，海和山在這一段貼得很近。'],
  facts:{what:fact('是什麼','余市町白岩町海岸外的兩塊奇岩，並立在淺灘上，又叫夫婦岩。',[o.rocks]),
   play:fact('玩什麼','在岸邊看岩石與斷崖；我們冬天停車拍照，孩子在路邊玩雪。',[o.rocks,y.coast]),
   arrival:fact('怎麼去','我們搭房東的車到附近。余市町的介紹頁沒有寫交通與停車，開車前先用地圖確認可以停車的位置。',[o.rocks,y.coast]),
   duration:fact('留多久','我們是順路停下來拍照、玩雪，停留時間不長。',[y.coast]),
   availability:fact('何時能去','這是戶外的海岸景觀，余市町的介紹頁沒有開放時間或費用。',[o.rocks]),
   conditions:fact('雨天或特殊條件','冬天路邊的雪又深又鬆，海邊風大；帶孩子下車要穿雪靴、戴防水手套。',[y.coast])},
  story:['最後一天，房東帶我們去看在地人會去的地方，第一站就是這裡。路邊的雪很鬆、很綿，房東說很多人特地來北海道滑雪，就是為了這種雪，叫 Japan powder。','孩子一下車就在雪裡堆雪球，玩到不想回車上。'],storySources:[y.coast],
  links:[{label:'余市町：えびす岩・大黒岩',url:'https://www.town.yoichi.hokkaido.jp/machi/syoukai/bunnkazai-ebisudaikoku.html'}]},
 {id:'nikka-yoichi',stableId:'jp-yoichi-nikka',title:'Nikka 余市蒸餾所：沒預約到導覽，也能逛商店',locality:'余市町',
  paragraphs:['Nikka 余市蒸餾所在 JR 余市站旁，官網寫從車站步行約 5 分鐘。廠內有免費導覽，約 60 分鐘，需要事先預約。','沒有預約的訪客從商店側的入口進去，可以逛 Nikka 博物館、蒸餾所商店和 Rita\'s Kitchen 餐廳。'],
  facts:{what:fact('是什麼','Nikka 威士忌在北海道的蒸餾所，在 JR 余市站旁。',[o.nikkaAccess]),
   play:fact('玩什麼','預約制的免費導覽約 60 分鐘；沒預約也能逛博物館、商店和餐廳。',[o.nikkaTour,o.nikkaAccess]),
   arrival:fact('怎麼去','JR 小樽站搭函館本線約 30 分鐘到余市站，再步行約 5 分鐘；官網提醒小樽到余市的班次不多。小樽站前搭巴士約 40 分鐘。',[o.nikkaAccess]),
   duration:fact('留多久','導覽約 60 分鐘；我們沒預約到，只在商店停留。',[o.nikkaTour,y.nikka]),
   availability:fact('何時能去','導覽 9:30–14:30 每 30 分鐘一梯，每組 1–9 人，網路預約到前一天 11:59；12/23–1/7 休館。博物館、商店與餐廳的最後入場時間各頁寫法不同，出發前以官網為準。',[o.nikkaTour,o.nikkaAccess]),
   conditions:fact('雨天或特殊條件','導覽可能額滿，要提早預約，我們去的那天就沒有名額。',[o.nikkaTour,y.nikka])},
  story:['我們到的那天，導覽已經額滿，沒辦法進廠參觀。沒預約到也不用直接離開：可以跟工作人員拿一張地圖，商店在後面。','我們開車繞到後面的商店，買了巧克力和伴手禮，大約七千日圓。外面一直下大雪，買完就上車往下一站。'],storySources:[y.nikka],
  links:[{label:'Nikka 余市蒸餾所導覽預約',url:'https://distillery.nikka.com/yoichi/reservation'},{label:'Nikka 余市蒸餾所交通',url:'https://www.nikka.com/en/distilleries/yoichi/access/'}]}
];

// Frames → assets (the manifest also carries Otaru frames; only VThgTPbHDVU frames are added here).
for(const f of frames.frames||[]){
 if(f.video!==videoId||!f.assetId.startsWith('jp-yoichi24-'))continue;
 const sid=add({id:'yoichi-frame-'+f.seconds,kind:'youtube',url:`${video}&t=${f.seconds}`,label:f.caption,rights:'鷹式一家自有影片畫格。'});
 if(!pkg.assets.some(a=>a.assetId===f.assetId))pkg.assets.push(legacyAsset(f.assetId,{alt:f.alt,caption:f.caption,sourceIds:[sid],frame:{second:f.seconds}}));
}
const assetIds=new Set(pkg.assets.map(a=>a.assetId));
const pics=key=>(frames.places?.[key]||[]).filter(a=>assetIds.has(a)).slice(0,3);
const ready=places.filter(p=>pics(p.id).length);
const missing=places.filter(p=>!ready.includes(p)).map(p=>p.id);
if(missing.length)console.warn('Yoichi places still without their own photo (left out):',missing.join(', '));
for(const p of ready){
 p.images=pics(p.id);p.sourceIds=[...new Set(Object.values(p.facts).flatMap(f=>f.sourceIds).concat(p.storySources))];
 p.story={title:'我們這次怎麼玩',text:p.story.join(''),paragraphs:p.story,sourceIds:p.storySources};delete p.storySources;
}
const gallery=key=>{const ids=pics(key);return ids.length?{images:ids}:{};};

const sub=(id,title,paragraphs,sourceIds,key,links=[])=>({id,title,paragraphs,sourceIds,links,...gallery(key)});
const city={id:'yoichi',countryId:'japan',path:'/trip/guides/yoichi-with-kids/',name:'余市',englishName:'Yoichi',destinationKind:'region',
 title:'余市親子攻略：海邊度假屋、Kiroro 玩雪與 Nikka 酒廠',metadataTitle:'余市親子攻略：Kiroro 雪場、えびす岩・大黒岩與 Nikka 余市蒸餾所｜鷹家遠行所',
 description:'冬天住在余市海邊的度假屋五天四夜：Kiroro 雪場、雪上活動、えびす岩・大黒岩、在地迴轉壽司和 Nikka 余市蒸餾所的商店。住宿與 Family Tour 為受邀體驗。',
 leadFormat:'longform-context/v1',
 intro:['這趟冬天的北海道，我們沒有住在札幌或小樽市區，而是住在余市海邊的一間度假屋。房東到小樽站接我們，接下來幾天的雪場、雪上活動和在地景點，也都是房東開車帶我們去。',
  '抵達小樽那天還有 7 度，天氣預報說接下來幾天會降到零下十度以下。出發前我們沒有幫孩子準備雪衣雪靴，第一晚先到 AEON 補齊裝備和火鍋料，隔天就上了 Kiroro。',
  '這篇照我們實際走的順序，介紹 Kiroro、余市海邊的えびす岩・大黒岩和 Nikka 余市蒸餾所；小樽水族館和音樂盒那天寫在小樽篇。這趟的住宿與 Family Tour 是房東邀請我們的體驗。'],
 author:'鷹式一家',updatedOn:checkedOn,sourceIds:[y.trip,y.house,y.shop,y.wrap,o.town],
 hero:[],places:ready,
 cards:ready.map(p=>({target:p.id,assetId:p.images[0],title:p.title.split('：')[0],play:p.facts.play.value.split('；')[0].replace(/。$/,''),time:p.facts.duration.value.split('；')[0].replace(/。$/,''),focalPoint:[50,50]})),
 food:{title:'吃什麼：超市火鍋、迴轉壽司與私廚晚餐',paragraphs:[
   '第一晚在 AEON 買了火鍋料和熟食，回度假屋自己煮。第二天玩完雪，晚餐去吃日式燒肉。',
   '最後一天房東帶我們去余市番屋，是在地人自己開的迴轉壽司店，不是連鎖店。我們覺得光是醋飯就很好吃。',
   '這幾天我們每餐至少一碗白飯；來北海道，很推薦吃吃看這裡的白米飯和馬鈴薯。'],sourceIds:[y.shop,y.snow,y.sushi,y.dinner],links:[],...gallery('yoichi-banya')},
 stay:{title:'住宿與 Family Tour（受邀體驗）',paragraphs:[
   '這趟我們受 Yoichi Holiday 邀請，住進 Beach Front Fugoppe，並參加五天四夜的 Family Tour。下面寫我們實際住過、玩過的內容。'],sourceIds:[y.house,y.wrap,o.house],
  links:[{label:'Yoichi Holiday：Beach Front Fugoppe',url:'https://yoichiholiday.com/en/beach-front-fugoppe'}],
  subsections:[
   sub('house','海邊三層樓的度假屋',['度假屋有三層樓，一邊是海，旁邊有一條河。官網列出兩間雙人床房、一間單人床房，樓上開放空間另有沙發床；可住人數在不同頁面寫 6 或 7 人，訂房前先確認。','官網也提醒房子面向車多的道路，會聽到車聲。冬天每晚有除雪車來清門口的雪。'],[y.house,o.house],'stay-house'),
   sub('snow-activity','房東安排的雪上活動',['午餐後房東載我們到雪上活動的場地，玩了雪上摩托車、橡皮艇和香蕉船。香蕉船比較刺激，小孩不能坐，就在旁邊有滑梯的區域玩雪。','項目大概兩三種，大人可能覺得很快就結束；孩子最開心的還是玩雪，玩到不想離開。'],[y.snow],'stay-snow'),
   sub('park','在地人的公園玩雪',['最後一天我們去了在地人玩雪的公園，免費，剛好遇到大雪。旁邊有位年輕人穿短袖在玩，我們手都已經凍到發抖。'],[y.park],'stay-park'),
   sub('dinner','最後一晚的日式晚餐',['最後一晚是 Family Tour 附的私廚日式晚餐，私廚帶了兩大箱器材和食材來，在度假屋裡上菜，從前菜開始一道一道吃。'],[y.dinner],'stay-dinner'),
   sub('tour','Family Tour 包含什麼',['影片中提到，這個五天四夜的 Family Tour 是 5 個人 17 萬日圓，含住宿，另外附三項：雪上活動、雪場門票和日式晚餐，其餘行程是房東預先排好的建議。現行方案與價格以官網為準。','它不是整天待在雪場的滑雪行程，比較適合想帶孩子認識當地、不打算四五天都滑雪的家庭。房東也說，台灣家庭通常沒有雪具，之後會調整準備的內容。'],[y.wrap])
  ]},
 arrival:{title:'交通：沒有租車，由房東接送',paragraphs:[
   '我們從小樽站被接到余市，這幾天都沒有租車。房東建議來這一帶還是以自駕為主，移動比較自由；他們接待的客人大多也是自駕。',
   '不開車的話，Nikka 官網寫 JR 小樽站到余市站約 30 分鐘，但班次不多；小樽站前搭巴士到余市約 40 分鐘。余市町介紹，從余市開車到小樽約 15 分鐘。'],sourceIds:[y.trip,y.shop,o.nikkaAccess,o.town],links:[]},
 faq:[
  {question:'余市需要租車嗎？',answer:'我們這趟由房東接送，沒有租車；房東建議自駕比較方便。不開車可以搭 JR 或巴士到余市站一帶，但小樽到余市的火車班次不多。',sourceIds:[y.shop,o.nikkaAccess]},
  {question:'冬天帶孩子去，雪具要自己帶嗎？',answer:'我們沒帶，第一晚到 AEON 買齊孩子的雪衣雪褲；大人的外套在雪場租。冬天這一帶白天常在零下，手套和雪靴要防水。',sourceIds:[y.trip,y.shop,y.kiroro]},
  {question:'沒預約到 Nikka 的導覽，還值得去嗎？',answer:'可以去逛博物館和商店。我們那天導覽額滿，跟工作人員拿了地圖，到後面的商店買巧克力和伴手禮。',sourceIds:[o.nikkaAccess,y.nikka]}],
 videoSourceIds:[y.trip,y.kiroro,y.coast,y.nikka,y.wrap],
 planner:{title:'余市兩天怎麼排',paragraphs:['以下是我們實際走過的兩天：一天上雪場，一天看余市在地景點。雪場與酒廠的時間依出發日期查官網。'],sourceIds:[y.kiroro,y.coast,o.kiroroHours,o.nikkaTour],
  routes:[{id:'yoichi-2-days',label:'兩天：雪場一天、余市一天',sightseeingDays:2,pace:'leisure',note:'我們由房東接送；自駕或搭車請另外預留移動時間。',sourceIds:[y.kiroro,y.coast,y.nikka],
   days:[{title:'Kiroro 與雪上活動',description:'早上出發上 Kiroro，在山上吃午餐，下午去雪上活動，傍晚回余市。',stops:['kiroro']},
    {title:'余市海邊與 Nikka',description:'先到海邊看えびす岩・大黒岩、玩雪，中午吃迴轉壽司，再到 Nikka 余市蒸餾所逛商店。',stops:['ebisu-daikoku-rocks','nikka-yoichi']}].map(d=>({...d,stops:d.stops.filter(id=>ready.some(p=>p.id===id))}))}]},
 extension:{title:'延伸閱讀',paragraphs:['本篇的住宿與 Family Tour 為 Yoichi Holiday 邀請的體驗。'],sourceIds:[y.wrap],links:[{label:'小樽：音樂盒、水族館與運河',url:'/trip/guides/otaru-with-kids/'},{label:'日本旅行總覽',url:'/trip/japan/'}]}};
// Lead with the family on the snow, the coast and the distillery gate when those frames exist.
const heroPool=[...['jp-yoichi24-792','jp-yoichi24-1823','jp-yoichi24-2121'].filter(id=>assetIds.has(id)),...ready.map(p=>p.images[0]),...ready.flatMap(p=>p.images.slice(1))];
city.hero=[...new Set(heroPool)].slice(0,3);
if(!city.planner.routes[0].days.every(d=>d.stops.length))city.planner.routes[0].days=city.planner.routes[0].days.filter(d=>d.stops.length);
city.planner.routes[0].sightseeingDays=city.planner.routes[0].days.length;

const usable=ready.length&&city.hero.length===3;
pkg.cities=pkg.cities.filter(c=>c.id!=='yoichi').concat(usable?[city]:[]);
const japan=pkg.countries.find(c=>c.id==='japan');
for(const list of [japan.cityIds,pkg.coverage.cityIds])if(usable&&!list.includes('yoichi'))list.push('yoichi');
if(usable){
 const p=japan.presentation;
 p.citySummaries=p.citySummaries.filter(s=>s.cityId!=='yoichi').concat({cityId:'yoichi',tag:'海邊與雪場',intro:'住在余市海邊的度假屋，上 Kiroro 玩雪，再看海邊奇岩、逛 Nikka 蒸餾所。',sourceIds:[y.trip,y.kiroro,y.nikka]});
 p.placeThemes=p.placeThemes.filter(t=>t.cityId!=='yoichi').concat(ready.map(pl=>({cityId:'yoichi',placeId:pl.id,themeIds:[pl.id==='kiroro'?'snow':'local-history']})));
 p.cityEntryLabels.yoichi='看余市攻略';
 const view=japan.geographicMap.views.find(v=>v.id==='hokkaido');
 view.points=view.points.filter(pt=>pt.cityId!=='yoichi').concat({cityId:'yoichi',label:'余市',point:[140.783611,43.195278],sourceIds:[o.town]});
 if(!japan.geographicMap.sourceIds.includes(o.town))japan.geographicMap.sourceIds.push(o.town);
}
pkg.sources=[...sources.values()];
writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');
console.log('Yoichi places with photos',ready.length,'of',places.length,usable?'':'(guide not added: needs photos)');
