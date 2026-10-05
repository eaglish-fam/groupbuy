import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCityIntro} from '../trip/approved-travel-contract.mjs';
// Opt-in city-guide composition; approved city content remains source-owned.
export function cityGuideTemplateStyle({compatCss=''}={}){
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const base=read('trip/trip.css')+'\n'+read('trip/bangkok.css');
 const chrome=read('blog/reading-nav.css')+'\n'+read('site-navigation.css');
 const template=readFileSync(new URL('../trip/city-guide-template.css',import.meta.url),'utf8');
 const css=base+'\n'+compatCss+'\n'+chrome+'\n'+template+'\n'+read('trip/planner-entry.css');
 const hash=createHash('sha256').update(css).digest('hex');
 return `<style data-city-guide-style="v1" data-style-sha256="${hash}">${css}</style>`;
}
export const cityGuideTemplate = Object.freeze({
 id:'eaglish.city-guide/v1', baseline:'chiang-mai-with-kids', version:'2026-10-04',
 order:Object.freeze(['places','details','food','stay','arrival','rain','faq','plan','videos','extension']),
 labels:Object.freeze({places:'看圖挑景點',food:'餐食與費用',stay:'住宿',arrival:'交通',rain:'雨天替換',faq:'常見問題',plan:'行程規劃',videos:'看實際旅行影片',extension:'延伸閱讀'}),
 steps:Object.freeze({days:'① 有幾個完整遊玩日？',pace:'② 想走什麼步調？',date:'③ 第一個遊玩日（選填）',day:'選一天查看行程'}),
 heroSlots:Object.freeze(['main','support-1','support-2']),
});
// Source dimensions choose layout and reserve every photo's actual ratio.
// No CSS backdrop, cover-crop preset or media rewrite substitutes for a source.
export function cityGuideHeroLayout(images){
 if(!Array.isArray(images)||images.length!==3||images.some(i=>!Number.isInteger(i.width)||!Number.isInteger(i.height)||i.width<1||i.height<1))throw Error('Three real source dimensions required');
 const ratios=images.map(i=>i.width/i.height),mode=ratios.every(r=>r<1)?'portraits':ratios.every(r=>r>=1)?'landscapes':'mixed';
 const columns=v=>{const total=v.reduce((a,b)=>a+b,0);return v.map(r=>(v.length*r/total).toFixed(6)+'fr').join(' ');};
 return {mode,desktopColumns:columns(ratios),supportColumns:columns(ratios.slice(1)),ratios:images.map(i=>`${i.width}/${i.height}`)};
}
export function cityGuideHeader({title,intro,leadFormat,author,updatedOn,eyebrow,images,breadcrumbs},{esc,figure,compatClass=''}){
 validateCityIntro(intro,leadFormat);
 if(images.length!==3||new Set(images.map(i=>i.assetId)).size!==3)throw Error('Three distinct source photos required');
 const layout=cityGuideHeroLayout(images);
 const [main,...rest]=title.split('：'),subtitle=rest.join('：');
 return `<nav class="breadcrumbs" aria-label="麵包屑">${breadcrumbs}</nav><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(main)}${subtitle?`<span>${esc(subtitle)}</span>`:''}</h1><div class="article-lead">${intro.map(p=>`<p>${esc(p)}</p>`).join('')}</div><p class="byline"><span>撰文・影像：${esc(author)}</span><span>更新 ${esc(updatedOn.replaceAll('-','.'))}</span></p><div class="city-guide-hero${compatClass?' '+esc(compatClass):''}" data-hero-layout="${layout.mode}" style="--hero-desktop-columns:${layout.desktopColumns};--hero-support-columns:${layout.supportColumns}">${images.map((i,n)=>figure(i,{sizes:layout.mode==='landscapes'?'(max-width:700px) 90vw, 680px':n===0?'(max-width:700px) calc(100vw - 40px), (max-width:1280px) calc(33.333vw - 40px), 387px':'(max-width:700px) calc(50vw - 24px), (max-width:1280px) calc(33.333vw - 40px), 387px'}).replace('<figure',`<figure data-hero-slot="${cityGuideTemplate.heroSlots[n]}" style="--hero-ratio:${layout.ratios[n]}"`)).join('')}</div>`;
}
export function cityGuideChapters({details,extensions=[]}){
 const l=cityGuideTemplate.labels;
 return [['places',l.places],...details,...['food','stay','arrival','rain','faq','plan','videos'].map(id=>[id,l[id]]),...extensions.map(([id,label])=>[id,label||l.extension])];
}
export function cityGuideBody(modules){
 for(const id of cityGuideTemplate.order.filter(id=>id!=='extension'))if(typeof modules[id]!=='string'||!modules[id])throw Error('Missing city-guide module '+id);
 if(modules.extension!==undefined&&typeof modules.extension!=='string')throw Error('Invalid city-guide extension');
 return cityGuideTemplate.order.map(id=>modules[id]||'').join('');
}
