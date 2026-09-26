import {readFileSync} from 'node:fs';

// One catalog powers both the destination cards and the full guide.
export const bangkokCatalog=JSON.parse(readFileSync(new URL('../trip/data/bangkok-places.json',import.meta.url)));
export const bangkokGuide='/trip/guides/bangkok-with-kids/';
export const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const media={
 'bkk-safari-giraffes':{video:'F5cQv1yS69g',second:670,width:1280,height:720,alt:'Safari World 的長頸鹿靠近參觀平台，能看清楚臉部和花紋',caption:'Safari World 的長頸鹿。近距離活動須依現場工作人員指示。',crop:[0,0,1280,720]},
 'bkk-safari-drive':{video:'F5cQv1yS69g',second:790,width:1280,height:620,alt:'從遊覽車窗看 Safari World 草地與開放區域中的犀牛',caption:'車遊區的動物與景觀，參觀途中不要任意下車。',crop:[0,0,1280,620]},
 'bkk-jurassic-dinosaur':{video:'F5cQv1yS69g',second:1645,width:1280,height:720,alt:'曼谷侏羅紀世界體驗裡，巨大的恐龍探向叢林步道',caption:'近距離看大型恐龍造景，是這項體驗的重點之一。',crop:[0,0,1280,720]},
 'bkk-jurassic-lab':{video:'F5cQv1yS69g',second:1710,width:1280,height:720,alt:'侏羅紀體驗的玻璃展示與研究室場景，燈光照亮裡面的恐龍',caption:'研究室場景結合聲光效果；容易受驚的孩子要先評估。',crop:[0,0,1280,720]},
 'bkk-asiatique-street':{video:'F5cQv1yS69g',second:1940,width:1280,height:620,alt:'白天的 Asiatique 倉庫式商店街，遠處可看見摩天輪',caption:'我們白天走過的 Asiatique；晚餐和夜景可另作延伸。',crop:[0,0,1280,620]},
 'bkk-serpentarium-snake':{video:'F5cQv1yS69g',second:2390,width:1280,height:530,alt:'Siam Serpentarium 展示箱裡的蛇與棲地造景',caption:'蛇類展示箱，適合慢慢觀察身體花紋與棲地。',crop:[0,0,1280,530]},
 'bkk-serpentarium-gallery':{video:'F5cQv1yS69g',second:2330,width:1280,height:720,alt:'孩子從入口走進 Siam Serpentarium 的室內蛇類展覽空間',caption:'室內展區的參觀動線；活動是否開放請先詢問館方。',crop:[0,0,1280,720]},
 'bkk-baan-langsuan':{second:2038,width:1440,height:696,alt:'Baan Langsuan 庭院裡，孩子指著老屋餐廳的介紹牌',caption:'我們去水族館前，在 Baan Langsuan 用餐並逛了老屋。',crop:[0,0,1920,928]},
 'bkk-market-stalls':{second:810,height:696,alt:'恰圖恰市集的服飾攤位與逛街巷道',caption:'先選想逛的區域，走進市集的小巷看看。',crop:[0,0,1920,928]},
 'bkk-market-section':{second:744,height:810,alt:'恰圖恰市集的 Section 2 與 Soi 41 分區路牌',caption:'拍下分區與巷號，下次比較容易找到喜歡的店。'},
 'bkk-museum-climb':{second:1092,height:810,alt:'孩子在曼谷兒童探索博物館的戶外攀爬網上活動',caption:'兒童探索博物館的戶外攀爬設施。'},
 'bkk-museum-sand':{second:1094,height:810,alt:'兒童探索博物館裡，孩子在岩壁造景旁的沙坑玩沙',caption:'玩沙區也是這次孩子實際玩的地方。'},
 'bkk-aquarium-reef':{second:2220,height:810,alt:'SEA LIFE 曼谷海洋世界水槽中的魚與彩色水族造景',caption:'在水槽前觀察魚的花紋與游動方式。'},
 'bkk-aquarium-sharks':{second:2380,height:810,alt:'SEA LIFE 曼谷海洋世界的大型水槽裡，鯊魚從前方游過',caption:'近距離看鯊魚，和逛市集是完全不同的體驗。'},
 'bkk-glass-boat':{second:2370,height:696,alt:'孩子穿著救生衣坐在 SEA LIFE 玻璃底船上，觀看水中的動物',caption:'我們實際搭乘的館內玻璃底船；預訂時確認方案是否包含這項活動。',crop:[0,0,1920,928]}
};
export function scene(id,{priority=false,card=false,thumbnail=false}={}){
 const m=media[id];if(!m)throw new Error(`Unknown Bangkok media: ${id}`);
 return `<img src="/trip/assets/${id}.webp" srcset="/trip/assets/${id}-640.webp 640w, /trip/assets/${id}-960.webp 960w, /trip/assets/${id}.webp ${m.width||1440}w" sizes="${thumbnail?'(max-width:700px) 44vw, 200px':card?'(max-width:700px) 90vw, 380px':'(max-width:700px) 90vw, 760px'}" alt="${esc(m.alt)}" width="${m.width||1440}" height="${m.height}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
}
const overviewLabels={
 market:['恰圖恰週末市集','逛小店・吃小吃','約 1.5～2 小時'],
 museum:['兒童探索博物館','攀爬・玩沙','約 1.5～2 小時'],
 indoors:['SEA LIFE 水族館','看魚・玻璃底船','約 2～3 小時'],
 safari:['Safari World','車遊・看長頸鹿','含交通留一整天'],
 jurassic:['侏羅紀世界體驗','恐龍・沉浸式場景','含報到約 1.5～2 小時'],
 asiatique:['Asiatique 河畔','散步・晚餐・商店','約 2～3 小時'],
 serpentarium:['暹羅蛇園','蛇類展覽・知識探索','參觀約 2～3 小時'],
 baanlangsuan:['Baan Langsuan','老屋・泰式用餐','約 1～1.5 小時']
};
export function overviewCard(p){
 const [name,activity,duration]=overviewLabels[p.anchor];
 return `<a href="#${p.anchor}" data-place-ref="${p.id}">${scene(p.image,{thumbnail:true})}<span class="bkk-overview-copy"><strong>${esc(name)}</strong><span>${esc(activity)}</span><small>${esc(duration)}</small></span></a>`;
}
export const external=(url,label,cls='text-link',affiliate=false)=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="${affiliate?'sponsored ':''}noopener">${esc(label)} ↗</a>`;
export const maps=p=>external('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.mapsQuery),'Google Maps','button outline');
export const film=(second,label='看我們的體驗片段',video=bangkokCatalog.video)=>external(video+`&t=${second}s`,label);
export function placeCard(p){
 return `<article class="place-card" data-place-id="${p.id}">${scene(p.image,{card:true})}<div class="place-copy"><p class="eyebrow">${p.area} <span class="origin-tag">我們去過</span></p><h3><a href="${bangkokGuide}#${p.anchor}">${p.name}</a></h3><p>${p.summary}</p><p class="place-facts">${p.duration}<br>${p.weather}</p><div class="actions">${maps(p)}<a class="text-link" href="${bangkokGuide}#${p.anchor}">看景點攻略 ↓</a></div></div></article>`;
}
export function cardsSection(){return `<section class="section wrap" id="places"><p class="eyebrow"><b>01</b> / BANGKOK PLACES</p><h2>${bangkokCatalog.places.length} 個實訪地點，挑喜歡的排進行程</h2><p class="section-intro">恰圖恰、Siam、河畔與郊區分開安排。先看玩法、停留時間與雨天條件，再搭配適合的日程。</p><div class="place-grid">${bangkokCatalog.places.map(placeCard).join('')}</div></section>`;}
export function placeSection(p,index){
 return `<section id="${p.anchor}" data-place-id="${p.id}"><p class="eyebrow"><b>${String(index+1).padStart(2,'0')}</b> <span>/ ${esc(p.englishName.split(' · ')[0].toUpperCase())}</span></p><h2>${p.name}</h2><p class="place-english">${p.englishName}</p><p>${p.intro}</p><figure>${scene(p.image)}<figcaption>${media[p.image].caption}</figcaption></figure><dl class="bkk-facts"><div><dt>建議停留</dt><dd>${p.duration}</dd></div><div><dt>開放時間</dt><dd>${p.hours}</dd></div><div><dt>怎麼去</dt><dd>${p.transport}</dd></div><div><dt>雨天安排</dt><dd>${p.weather}</dd></div></dl>${p.activities.map(a=>`<h3>${a.title}</h3><p>${a.text}</p>`).join('')}<div class="bkk-gallery ${p.gallery.length===1?'single':''}">${p.gallery.map(id=>`<figure>${scene(id)}<figcaption>${media[id].caption}</figcaption></figure>`).join('')}</div><aside class="bkk-experience"><h3>我們在這裡的小故事</h3><p>${p.experience}</p></aside><p class="bkk-tip"><strong>出發前準備：</strong>${p.tip}</p><div class="actions">${maps(p)}${film(p.videoSeconds,'看我們的體驗片段',p.video||bangkokCatalog.video)}</div>${p.booking.length?`<aside class="bkk-booking"><h3>想去 ${p.name}？先看日期與方案</h3><p>${p.bookingIntro||'確認入場日、旅客身分與包含項目，再比較總價。'}</p><div class="actions">${p.booking.map(b=>external(b.url,b.label,'button',b.affiliate)).join('')}</div><p class="affiliate-note">本文的 Klook／KKday 連結為聯盟連結；透過連結購買，我們可能獲得佣金。價格與方案依預訂頁顯示。</p></aside>`:''}<details class="bkk-sources"><summary>查看營業與參觀資訊來源</summary><p>行前資訊核對：${bangkokCatalog.checkedAt}。臨時休館、活動場次與票券條件，請在出發前再次確認。</p><div class="actions">${p.sources.map(s=>external(s.url,s.label)).join('')}</div></details></section>`;
}
