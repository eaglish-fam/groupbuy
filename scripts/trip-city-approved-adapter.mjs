import {readFileSync} from 'node:fs';
import {validateApprovedTravelPackage,publicUrl,publicDiagramUrl,focalPoint} from '../trip/approved-travel-contract.mjs';
import {cityGuideTemplate,cityGuideHeader,cityGuideChapters,cityGuideBody,cityGuideTemplateStyle} from './trip-city-guide-template.mjs';
import {singaporePracticalCss} from './trip-singapore-practical-style.mjs';
import {plannerEntry,plannerAssets} from './trip-planner-entry.mjs';
import {prioritizeFirstTravelImage} from './trip-image-priority.mjs';
import {renderSiteNavigation} from './site-navigation.mjs';
import {renderApprovedCityPlanner} from './trip-approved-city-planner.mjs';
import {approvedParagraphs,approvedInlineText} from './trip-approved-text.mjs';
import {approvedPublicationFont} from './trip-approved-publication-font.mjs';
const origin='https://www.eaglish.store';
export const escapeTravel=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const travelScriptJson=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const esc=escapeTravel;
export const paragraphs=approvedParagraphs;
export const travelLink=({url,label})=>`<a href="${esc(publicUrl(url))}"${url.startsWith('https://')?' target="_blank" rel="noopener noreferrer"':''}>${esc(label)}</a>`;
export function approvedPicture(asset,{sizes='(max-width:700px) calc(100vw - 40px), 760px',focal,card=false}={}){
 if(card&&asset.cardPhoto)asset={...asset,...asset.cardPhoto};
 const v=asset.variants,src=v.find(v=>v.width===960)||v.at(-1);
 const pos=focal?`object-position:${focalPoint(focal).join('% ')}%;`:'';
 return `<img style="${pos}--photo-ratio:${asset.width}/${asset.height}" src="${esc(src.url)}" srcset="${esc(v.map(v=>`${v.url} ${v.width}w`).join(', '))}" sizes="${esc(sizes)}" width="${asset.width}" height="${asset.height}" alt="${esc(asset.alt)}" loading="lazy" fetchpriority="low" decoding="async">`;
}
export const approvedFigure=(asset,options)=>`<figure data-asset-id="${esc(asset.assetId)}">${approvedPicture(asset,options)}<figcaption>${esc(asset.caption)}</figcaption></figure>`;
export function approvedRouteDiagram(d){
 return `<figure data-route-diagram="${esc(d.id)}" aria-label="${esc(d.title)}"><img src="${esc(publicDiagramUrl(d.url))}" width="${d.width}" height="${d.height}" alt="${esc(d.alt)}" loading="lazy" decoding="async"><figcaption><p>班表核對：<time datetime="${d.checkedOn}">${d.checkedOn.replaceAll('-','.')}</time></p><dl class="bkk-facts">${d.routes.map(r=>`<div><dt>${esc(r.title)}</dt><dd>${esc(r.sampleCaption)}${r.edgeLabels?.length?`<br>${r.edgeLabels.map(esc).join('；')}`:''}</dd></div>`).join('')}</dl><p>${esc(d.caption)}</p></figcaption></figure>`;
}
const columns=assets=>{const ratios=assets.map(a=>a.width/a.height),sum=ratios.reduce((a,b)=>a+b,0);return ratios.map(r=>(ratios.length*r/sum).toFixed(6)+'fr').join(' ');};
export function approvedAttractionGallery(images){
 if(images.length!==3||new Set(images.map(i=>i.assetId)).size!==3)throw Error('Three distinct approved attraction images required');
 return `<div class="city-attraction-gallery"><div class="city-gallery-lead">${approvedFigure(images[0])}</div><div class="city-gallery-pair" style="--city-pair-columns:${columns(images.slice(1))}">${images.slice(1).map(a=>approvedFigure(a,{sizes:'(max-width:700px) calc(50vw - 24px), 380px'})).join('')}</div></div>`;
}
const links=value=>`<div class="actions">${(value||[]).map(travelLink).join('')}</div>`;
export function renderApprovedFactsStory(place){
 const facts=['what','play','arrival','duration','availability','conditions'].map(key=>place.facts[key]);
 return `${place.story?`<aside class="bkk-experience"><h3>我們那次的小記錄</h3>${paragraphs(place.story.paragraphs||[place.story.text])}</aside>`:''}<h3>實用資料</h3><dl class="bkk-facts">${[...facts,...(place.extraFacts||[])].map(f=>`<div><dt>${esc(f.label)}</dt><dd>${approvedInlineText(f.value)}</dd></div>`).join('')}</dl>`;
}
export function approvedNavigationCards(city,assets){
 return `<section id="places"><h2>${cityGuideTemplate.labels.places}</h2><div class="bkk-overview city-approved-cards">${city.cards.map(card=>`<a href="#${esc(card.target)}" data-place-ref="${esc(city.places.find(p=>p.id===card.target).stableId)}" data-asset-id="${esc(card.assetId)}">${approvedPicture(assets.get(card.assetId),{sizes:'(max-width:700px) calc(50vw - 24px), 250px',focal:card.focalPoint,card:true})}<span class="bkk-overview-copy"><strong>${esc(card.title)}</strong><span>${esc(card.play)}</span><small>${esc(card.time)}</small></span></a>`).join('')}</div></section>`;
}
function moduleHtml(id,value,assets){
 return `<section id="${id}"><h2>${esc(value.title)}</h2>${paragraphs(value.paragraphs)}${id==='arrival'&&value.diagram?approvedRouteDiagram(value.diagram):''}${value.images?.length?`<div class="city-module-gallery" style="--city-pair-columns:${columns(value.images.map(a=>assets.get(a)))}">${value.images.map(a=>approvedFigure(assets.get(a))).join('')}</div>`:''}${links(value.links)}</section>`;
}
export function approvedTravelMetadata(page,country,faq,{publication=false,imageUrl,relatedPages=[]}={}){
 const url=origin+page.path,isCountry=page===country;
 const siteRuntime=publication?approvedPublicationFont()+'<script defer src="/site-runtime.js?v=20260914-analytics-v1"></script>':'';
 const crumbs=[{name:'鷹家遠行所',path:'/trip/'},{name:country.name,path:country.path},...(!isCountry?[{name:page.name,path:page.path}]:[])];
 const graph=[{'@type':isCountry?'CollectionPage':'Article',name:page.title,headline:page.title,description:page.description,inLanguage:'zh-Hant',dateModified:page.updatedOn,mainEntityOfPage:url,...(imageUrl?{image:[origin+imageUrl]}:{}),...(isCountry?{hasPart:relatedPages.map(p=>({'@type':'WebPage',name:p.name,url:origin+p.path}))}:{author:{'@type':'Organization',name:page.author}})},{'@type':'BreadcrumbList',itemListElement:crumbs.map((v,i)=>({'@type':'ListItem',position:i+1,name:v.name,item:origin+v.path}))},{'@type':'FAQPage',mainEntity:faq.map(q=>({'@type':'Question',name:q.question,acceptedAnswer:{'@type':'Answer',text:q.answer}}))}];
 return `<meta name="robots" content="${publication?'index,follow,max-image-preview:large':'noindex,nofollow'}"><link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta property="og:type" content="${isCountry?'website':'article'}"><meta property="og:title" content="${esc(page.title)}"><meta name="description" content="${esc(page.description)}"><meta property="og:description" content="${esc(page.description)}"><script type="application/ld+json">${travelScriptJson({'@context':'https://schema.org','@graph':graph})}</script>${siteRuntime}`;
}
export function renderApprovedCity(data,cityId,{publication=false}={}){
 const view=validateApprovedTravelPackage(data),city=view.cities.get(cityId);if(!city)throw Error('Unknown approved city');
 const country=view.countries.get(city.countryId),assets=view.assets;
 const breadcrumbs=`${travelLink({url:'/trip/',label:'鷹家遠行所'})} / ${travelLink({url:country.path,label:country.name})} / <span aria-current="page">${esc(city.name)}</span>`;
 const header=cityGuideHeader({...city,images:city.hero.map(id=>assets.get(id)),eyebrow:city.englishName,breadcrumbs}, {esc,figure:approvedFigure}).replace('</h1>',`</h1>${city.subtitle?`<p class="city-subtitle">${esc(city.subtitle)}</p>`:''}`);
 const chapters=cityGuideChapters({details:[...(city.reading?[['day-reading',city.reading.title]]:[]),...city.places.map(p=>[p.id,p.title])],extensions:city.extension?[['extension',city.extension.title]]:[]});
 const details=(city.reading?moduleHtml('day-reading',city.reading,assets):'')+city.places.map(p=>`<section id="${p.id}" data-place-id="${p.stableId}"><h2>${esc(p.title)}</h2>${paragraphs(p.paragraphs)}${approvedAttractionGallery(p.images.map(a=>assets.get(a)))}${(p.additionalGalleries||[]).map(g=>`<h3>${esc(g.title)}</h3>${approvedAttractionGallery(g.images.map(a=>assets.get(a)))}`).join('')}${p.supportImages?.length?`<div class="city-module-gallery" style="--city-pair-columns:${columns(p.supportImages.map(a=>assets.get(a)))}">${p.supportImages.map(a=>approvedFigure(assets.get(a))).join('')}</div>`:''}${renderApprovedFactsStory(p)}${links(p.links)}</section>`).join('');
 const faq=`<section id="faq"><h2>${cityGuideTemplate.labels.faq}</h2>${city.faq.map(q=>`<details><summary>${esc(q.question)}</summary>${paragraphs([q.answer])}</details>`).join('')}</section>`;
 // The same source-owned routes back both the static fallback and controller.
 const plan=renderApprovedCityPlanner(city);
 const videos=`<section id="videos"><h2>${cityGuideTemplate.labels.videos}</h2>${links(city.videoSourceIds.map(id=>({url:view.sources.get(id).url,label:view.sources.get(id).label||id})))}</section>`;
 const body=cityGuideBody({places:approvedNavigationCards(city,assets),details,...Object.fromEntries(['food','stay','arrival','rain'].map(id=>[id,moduleHtml(id,city[id],assets)])),faq,plan,videos,extension:city.extension?moduleHtml('extension',city.extension,assets):''});
 const compat=readFileSync(new URL('../trip/approved-city-guide.css',import.meta.url),'utf8')+'\n'+singaporePracticalCss.replaceAll('.sg-guide','.approved-city-guide')+'\n'+readFileSync(new URL('../trip/approved-heading-hierarchy.css',import.meta.url),'utf8');
 const html=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(city.metadataTitle||city.title+'｜鷹家遠行所')}</title>${approvedTravelMetadata(city,country,city.faq,{publication,imageUrl:assets.get(city.hero[0]).variants.at(-1).url})}<meta property="og:image" content="${origin+assets.get(city.hero[0]).variants.at(-1).url}"><link rel="icon" href="/icons/favicon.svg">${cityGuideTemplateStyle({compatCss:compat})}${plannerAssets}<script defer src="/blog/reading-nav.js"></script></head><body class="bkk-guide city-guide approved-city-guide" data-reading-nav-instant><a class="skip" href="#main">跳到主要內容</a><header class="masthead wrap" data-reading-nav-chrome><a class="brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><nav aria-label="主要導覽"><a href="/trip/#destinations">目的地</a><a href="/trip/#guides">找玩法</a><a href="#plan">排行程</a></nav></header><main id="main"><header class="article-header wrap bkk-header" data-city-guide-template="${cityGuideTemplate.id}">${header}</header><div class="article-layout wrap"><nav class="toc guide-nav" data-reading-nav aria-label="文章目錄">${chapters.map(([id,label])=>`<a href="#${id}">${esc(label)}</a>`).join('')}</nav><article class="prose">${body}</article></div></main>${plannerEntry}<footer class="footer"><div class="footer-inner wrap"><p>© 鷹式一家 Eaglish Family</p>${travelLink({url:country.path,label:'回'+country.name+'旅行總覽'})}</div></footer>${renderSiteNavigation(city.path)}</body></html>`;
 return prioritizeFirstTravelImage(html);
}
