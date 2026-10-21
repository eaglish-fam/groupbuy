import {readFileSync} from 'node:fs';
import {validateApprovedTravelPackage,routeAnchors} from '../trip/approved-travel-contract.mjs';
import {cityGuideHeader,cityGuideTemplateStyle,cityGuideTemplate} from './trip-city-guide-template.mjs';
import {singaporePracticalCss} from './trip-singapore-practical-style.mjs';
import {prioritizeFirstTravelImage} from './trip-image-priority.mjs';
import {renderSiteNavigation} from './site-navigation.mjs';
import {approvedInlineText} from './trip-approved-text.mjs';
import {approvedFigure,approvedPicture,approvedAttractionGallery,approvedTravelMetadata,paragraphs,travelLink,escapeTravel} from './trip-city-approved-adapter.mjs';
const origin='https://www.eaglish.store',esc=escapeTravel;
export const routeDayKindLabels=Object.freeze({international_outbound:'出發與飛行',arrival:'抵達與休息',full_play:'遊玩日',full_play_flexible:'遊玩與彈性安排',full_play_regional:'近郊日遊',transfer:'移動日',international_departure:'離境與飛行',international_arrival:'返抵台灣'});
const links=value=>value?.length?`<div class="actions">${value.map(travelLink).join('')}</div>`:'';
const moduleHtml=(id,value)=>`<section id="${id}"><h2>${esc(value.title)}</h2>${paragraphs(value.paragraphs)}${links(value.links)}</section>`;
const modules=['transport','stay','packing'];
// A route article is one fixed itinerary told day by day. Each day links into
// the city guides for what to do there; nothing here pretends to be a planner.
export function renderApprovedRoute(data,routeId,{publication=false}={}){
 const view=validateApprovedTravelPackage(data),route=view.routes.get(routeId);if(!route)throw Error('Unknown approved route');
 const country=view.countries.get(route.countryId),assets=view.assets,cities=route.cityIds.map(id=>view.cities.get(id));
 const breadcrumbs=`${travelLink({url:'/trip/',label:'鷹家遠行所'})} / ${travelLink({url:country.path,label:country.name})} / <span aria-current="page">${esc(route.name)}</span>`;
 const header=cityGuideHeader({...route,images:route.hero.map(id=>assets.get(id)),eyebrow:route.englishName,breadcrumbs},{esc,figure:approvedFigure}).replace('</h1>',`</h1>${route.subtitle?`<p class="city-subtitle">${esc(route.subtitle)}</p>`:''}`);
 const dayLabel=day=>`第 ${day.day} 天・${day.destination}`;
 const chapters=[['overview','路線一覽'],...route.days.map(day=>['day-'+day.day,dayLabel(day)]),...modules.filter(k=>route[k]).map(k=>[k,route[k].title]),['faq',cityGuideTemplate.labels.faq],['plan',route.plan?.title||route.calendarDays+' 天總表'],['videos',cityGuideTemplate.labels.videos],...(route.related?[['related',route.related.title]]:[])];
 if(JSON.stringify(chapters.map(([id])=>id))!==JSON.stringify(routeAnchors(route).filter(id=>id!=='main')))throw Error('Route chapters drifted from contract anchors');
 const facts=route.facts?.length?`<dl class="bkk-facts">${route.facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${approvedInlineText(f.value)}</dd></div>`).join('')}</dl>`:'';
 const guides=cities.length?`<h3>這條路線的城市篇</h3><div class="bkk-overview city-approved-cards route-city-cards">${cities.map(city=>`<a href="${esc(city.path)}" data-route-city="${esc(city.id)}">${approvedPicture(assets.get(city.hero[0]),{sizes:'(max-width:700px) calc(50vw - 24px), 250px'})}<span class="bkk-overview-copy"><strong>${esc(city.name)}</strong><span>${esc(city.englishName)}</span><small>看${esc(city.name)}城市篇</small></span></a>`).join('')}</div>`:'';
 const overview=`<section id="overview"><h2>路線一覽</h2>${facts}${guides}</section>`;
 const placeLink=ref=>{const city=view.cities.get(ref.cityId),place=city.places.find(p=>p.id===ref.placeId);return `<li><a href="${esc(city.path+'#'+place.id)}">${esc(place.title)}</a><small>${esc(city.name)}城市篇</small></li>`;};
 const days=route.days.map(day=>`<section id="day-${day.day}" class="route-day" data-route-day="${day.day}"><h2>${esc(dayLabel(day))}<span>${esc(day.title)}</span></h2><p class="route-day-meta">${esc(routeDayKindLabels[day.kind])}${day.overnight?`・住 ${esc(day.overnight)}`:''}</p>${paragraphs(day.paragraphs)}${day.images?approvedAttractionGallery(day.images.map(a=>assets.get(a))):''}${day.places?.length?`<h3>這天的景點</h3><ul class="route-day-places">${day.places.map(placeLink).join('')}</ul>`:''}${links(day.links)}</section>`).join('');
 const faq=`<section id="faq"><h2>${cityGuideTemplate.labels.faq}</h2>${route.faq.map(q=>`<details><summary>${esc(q.question)}</summary>${paragraphs([q.answer])}</details>`).join('')}</section>`;
 const plan=`<section id="plan" class="route-plan"><h2 tabindex="-1">${esc(route.plan?.title||route.calendarDays+' 天總表')}</h2>${paragraphs(route.plan?.paragraphs||[])}<ol class="approved-plan-timeline route-plan-days">${route.days.map(day=>`<li><a href="#day-${day.day}"><b>第 ${day.day} 天</b></a><div><p><strong>${esc(day.destination)}</strong>・${esc(routeDayKindLabels[day.kind])}</p><p>${esc(day.title)}${day.overnight?`（住 ${esc(day.overnight)}）`:''}</p></div></li>`).join('')}</ol></section>`;
 const videos=`<section id="videos"><h2>${cityGuideTemplate.labels.videos}</h2>${links(route.videoSourceIds.map(id=>({url:view.sources.get(id).url,label:view.sources.get(id).label||id})))}</section>`;
 const body=overview+days+modules.filter(k=>route[k]).map(k=>moduleHtml(k,route[k])).join('')+faq+plan+videos+(route.related?moduleHtml('related',route.related):'');
 const compat=['approved-city-guide.css','approved-heading-hierarchy.css','approved-route.css'].map(p=>readFileSync(new URL('../trip/'+p,import.meta.url),'utf8')).join('\n')+'\n'+singaporePracticalCss.replaceAll('.sg-guide','.approved-city-guide');
 const hero=assets.get(route.hero[0]).variants.at(-1).url;
 const html=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(route.metadataTitle||route.title+'｜鷹家遠行所')}</title>${approvedTravelMetadata(route,country,route.faq,{publication,imageUrl:hero})}<meta property="og:image" content="${origin+hero}"><link rel="icon" href="/icons/favicon.svg">${cityGuideTemplateStyle({compatCss:compat})}<script defer src="/blog/reading-nav.js"></script></head><body class="bkk-guide city-guide approved-city-guide approved-route-guide" data-reading-nav-instant><a class="skip" href="#main">跳到主要內容</a><header class="masthead wrap" data-reading-nav-chrome><a class="brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><nav aria-label="主要導覽"><a href="${esc(country.path)}">${esc(country.name)}總覽</a><a href="#overview">路線一覽</a><a href="#plan">${route.calendarDays} 天總表</a></nav></header><main id="main"><header class="article-header wrap bkk-header" data-route-article="${esc(route.id)}">${header}</header><div class="article-layout wrap"><nav class="toc guide-nav" data-reading-nav aria-label="文章目錄">${chapters.map(([id,label])=>`<a href="#${id}">${esc(label)}</a>`).join('')}</nav><article class="prose">${body}</article></div></main><footer class="footer"><div class="footer-inner wrap"><p>© 鷹式一家 Eaglish Family</p>${travelLink({url:country.path,label:'回'+country.name+'旅行總覽'})}</div></footer>${renderSiteNavigation(route.path)}</body></html>`;
 return prioritizeFirstTravelImage(html);
}
