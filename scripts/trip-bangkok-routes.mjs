import {readFileSync} from 'node:fs';
import {esc} from './trip-bangkok-places.mjs';

export const bangkokRoutes=JSON.parse(readFileSync(new URL('../trip/data/bangkok-routes.json',import.meta.url)));
export function routeSection(){
 const routeMap=new Map(bangkokRoutes.routes.map(r=>[r.id,r]));
 return `<section id="plan"><p class="eyebrow"><b>PLAN</b> / BUILD YOUR BANGKOK DAYS</p><h2>曼谷 2～5 日行程：按區域挑，再調整順序</h2><p>以下是可自由搭配的遊玩日，<strong>不是影片的 Day 1、Day 2，也不含抵達和離境日</strong>。先看有幾個完整白天，再選 A～E；實際日期依週末、休館、票券與天氣調換。時間是規劃額度，不是交通或場次保證。</p><div class="bkk-combinations">${bangkokRoutes.combinations.map(c=>`<article><p class="eyebrow">${c.days} 個遊玩日</p><h3>${esc(c.label)}</h3><div class="actions">${c.routes.map(id=>`<a class="text-link" href="#route-${id}">${esc(routeMap.get(id).label)} ↓</a>`).join('')}</div><p>${esc(c.note)}</p></article>`).join('')}</div>${bangkokRoutes.routes.map(r=>`<div class="bkk-day" id="route-${r.id}" data-route-id="${r.id}"><p class="eyebrow">${esc(r.area)}</p><h3>${esc(r.label)}</h3><p class="route-description">${esc(r.duration)}。${esc(r.condition)}</p><ol>${r.steps.map(s=>`<li><time>${esc(s.time)}</time><div>${s.anchor?`<a href="#${s.anchor}">${esc(s.title)}</a>`:esc(s.title)}<p>${esc(s.text)}</p></div></li>`).join('')}</ol></div>`).join('')}</section>
 <section id="rain"><h2>曼谷下雨怎麼換？先看整段動線</h2><aside class="bkk-rain"><h3>優先：SEA LIFE＋同棟用餐</h3><p>把 B 改成直接去 Siam Paragon，省略老屋餐廳的戶外移動。已買指定日期或時段的票，先看退改條款，不預設能當天換日期。</p></aside><h3>侏羅紀體驗可以保留，河邊散步視雨勢拿掉</h3><p>展場以室內為主，但停推車、等候和找餐廳不是全程室內。若原本就訂好場次，可以安排車輛抵達，結束後找有室內座位的餐廳；大雨不把摩天輪或搭船列成必要行程。</p><h3>Safari World 和市集不拿來當大雨備案</h3><p>車遊有遮蔽，不代表步行園區也不受影響。兒童館同樣有戶外設施；蛇園雖有室內展覽，但離市區遠，不建議只因下雨就臨時橫跨曼谷。若天候不宜移動，留在住宿周邊並配合當地公告。</p></section>`;
}
