import {readFileSync} from 'node:fs';
import {bangkokCatalog,esc} from './trip-bangkok-places.mjs';

export const bangkokRoutes=JSON.parse(readFileSync(new URL('../trip/data/bangkok-routes.json',import.meta.url)));
const placeByAnchor=new Map(bangkokCatalog.places.map(p=>[p.anchor,p]));
const mapsUrl=query=>`https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(query)}`;
const stepsHtml=steps=>`<ol>${steps.map(s=>{
 const place=s.anchor?placeByAnchor.get(s.anchor):null;
 const query=place?.mapsQuery||s.mapsQuery;
 const hours=place?.plannerHours||s.hours;
 const source=s.hoursSourceUrl||place?.sources[0]?.url;
 return `<li><time>${esc(s.time)}</time><div>${s.anchor?`<a href="#${s.anchor}">${esc(s.title)}</a>`:esc(s.title)}${query?`<div class="bkk-stop-meta">${hours?`<span>開放參考：${esc(hours)}</span>`:''}<a href="${mapsUrl(query)}" target="_blank" rel="noopener">Google Maps ↗</a>${source?`<a href="${esc(source)}" target="_blank" rel="noopener">時間來源 ↗</a>`:''}</div>`:''}<p>${esc(s.text)}</p></div></li>`;
 }).join('')}</ol>`;
const compactContent=(r,prefix='compact')=>`<p class="bkk-compact-note">${esc(r[`${prefix}Note`])}${r[`${prefix}SourceUrl`]?` <a href="${esc(r[`${prefix}SourceUrl`])}" target="_blank" rel="noopener">${esc(r[`${prefix}SourceLabel`])} ↗</a>`:''}</p>${stepsHtml(r[`${prefix}Steps`])}`;
const routeHtml=r=>`<details class="bkk-day" id="route-${r.id}" data-route-id="${r.id}"><summary>${esc(r.label)}</summary><p class="eyebrow">${esc(r.area)}</p><p class="route-description" data-pace="relaxed">${esc(r.duration)}。${esc(r.condition)}</p><p class="route-description" data-pace="compact"${r.compactJurassicSteps?' data-compact-path="standard"':''} hidden>${esc(r.compactDuration)}。${esc(r.compactCondition||r.condition)}</p>${r.compactJurassicSteps?`<p class="route-description" data-pace="compact" data-compact-path="jurassic" hidden>${esc(r.compactJurassicDuration)}。${esc(r.condition)}</p>`:''}<div class="bkk-pace-schedule" data-pace="relaxed">${stepsHtml(r.steps)}</div><details class="bkk-compact-variant" data-pace="compact"><summary>緊湊版時間表</summary>${r.compactJurassicSteps?`<div data-compact-path="standard">${compactContent(r)}</div><div data-compact-path="jurassic" hidden>${compactContent(r,'compactJurassic')}</div>`:compactContent(r)}</details></details>`;
export function routeSection(){
 const config={routes:bangkokRoutes.routes.map(({id,label})=>({id,label})),combinations:bangkokRoutes.combinations};
 return `<section id="plan" class="bkk-planner"><p class="eyebrow"><b>PLAN</b> / YOUR BANGKOK DAYS</p><h2>曼谷 2～5 日，選天數與步調來試排</h2><p>先選遊玩天數和步調，再點某一天看路線；想換區域也能直接調整。</p>
 <div class="bkk-planner-controls" hidden>
 <label for="bkk-days">① 這趟有幾個遊玩日？</label><select id="bkk-days" aria-describedby="bkk-days-help">${bangkokRoutes.combinations.map(c=>`<option value="${c.days}">${c.days} 天${c.days===5?'（含機場區半日，可替換）':''}</option>`).join('')}</select>
 <p id="bkk-days-help" class="bkk-control-help">不含抵達、離境日。先給你一組按區域安排的建議，可以繼續調整。</p>
 <fieldset class="bkk-pace" aria-describedby="bkk-pace-help"><legend>② 這趟想走什麼步調？</legend><div class="bkk-pace-options"><label class="bkk-pace-option"><input type="radio" name="bkk-pace" value="relaxed" checked><span><strong>悠閒散步</strong><small>每區留休息時間</small></span></label><label class="bkk-pace-option"><input type="radio" name="bkk-pace" value="compact"><span><strong>緊湊</strong><small>多看一站或晚間延伸</small></span></label></div></fieldset>
 <p id="bkk-pace-help" class="bkk-control-help">緊湊版會改變當天時間表；侏羅紀可排晚場，同趟只安排一次。Safari World 仍只排白天，機場區須先看班機時間。</p>
 <p class="bkk-control-label">③ 點選一天，看當天怎麼玩</p><div class="bkk-day-switcher" role="group" aria-label="選擇要查看的遊玩日"></div>
 <label for="bkk-route-choice">④ 想換玩法？替換這一天的區域</label><select id="bkk-route-choice" aria-describedby="bkk-route-help">${config.routes.map(r=>`<option value="${r.id}">${esc(r.label)}</option>`).join('')}</select>
 <p id="bkk-route-help" class="bkk-control-help">如果選到已排好的區域，兩天會交換，不會重複去同一站。這次試排不會在重整後保留。</p><p class="bkk-planner-status" role="status" aria-live="polite" aria-atomic="true"></p>
 </div>
 <p class="bkk-planner-fallback">展開想去的區域查看一日安排；每條路線也可展開緊湊版時間表。</p>
 <div class="bkk-route-panels">${bangkokRoutes.routes.map(routeHtml).join('')}</div>
 <details class="bkk-plan-notes"><summary>排日期前，先看這些提醒</summary><p>這些是按區域重組的建議，<strong>不是影片的 Day 1、Day 2，也不含抵達和離境日</strong>。市集優先排週末，並避開休館日；票券、車程和活動場次需另外確認。蛇園只是一個機場區半日選項，不順路就留作自由活動。</p><p>景點時間於 ${bangkokCatalog.checkedAt} 核對，均為泰國當地時間。行程卡附 Google Maps 與時間來源；請在出發前再看地圖的當日營業狀態及場館公告。街區沒有統一營業時間，蛇園現有公開時段資料較舊。試排工具不會自動核對你的實際旅行日期、場次、交通或訂位。</p><a href="#rain">遇到下雨，怎麼換？</a></details>
 <script type="application/json" id="bkk-planner-data">${JSON.stringify(config).replaceAll('<','\\u003c')}</script><script type="module" src="/trip/bangkok-planner.mjs?v=20260927-hours-1"></script></section>`;
}
export function rainSection(){return `<section id="rain"><h2>曼谷下雨怎麼換？先看整段動線</h2><aside class="bkk-rain"><h3>優先：SEA LIFE＋同棟用餐</h3><p>把 B 改成直接去 Siam Paragon，省略老屋餐廳的戶外移動。已買指定日期或時段的票，先看退改條款，不預設能當天換日期。</p></aside><h3>侏羅紀體驗可以保留，河邊散步視雨勢拿掉</h3><p>展場以室內為主，但停推車、等候和找餐廳不是全程室內。若原本就訂好場次，可以安排車輛抵達，結束後找有室內座位的餐廳；大雨不把摩天輪或搭船列成必要行程。</p><h3>Safari World 和市集不拿來當大雨備案</h3><p>車遊有遮蔽，不代表步行園區也不受影響。兒童館同樣有戶外設施；蛇園雖有室內展覽，但離市區遠，不建議只因下雨就臨時橫跨曼谷。若天候不宜移動，留在住宿周邊並配合當地公告。</p></section>`;}
