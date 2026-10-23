// Stay articles keep their own sections, text and photos; only the page shell
// matches the approved city guides: masthead, split title, plain TOC, galleries
// and type. No planner, cards or lodging schema are added.
import {readFileSync} from 'node:fs';
import {cityGuideTemplateStyle} from './trip-city-guide-template.mjs';
import {singaporePracticalCss} from './trip-singapore-practical-style.mjs';
import {approvedFigure,approvedAttractionGallery,escapeTravel as esc} from './trip-city-approved-adapter.mjs';
import {renderMarkdown,inlineMarkdown,validateTravelArticle} from './travel-article-renderer.mjs';
import {prioritizeFirstTravelImage} from './trip-image-priority.mjs';
import {renderSiteNavigation} from './site-navigation.mjs';

const origin='https://www.eaglish.store';
const jsonld=value=>`<script type="application/ld+json">${JSON.stringify(value).replaceAll('<','\\u003c')}</script>`;
const plain=s=>String(s).replace(/\*\*/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').trim();
const heroSizes='(max-width:700px) calc(100vw - 40px), (max-width:1280px) calc(100vw - 96px), 1184px';

// Media manifest entry → the approved asset shape (published sizes only, ≤1440px).
export function stayAsset(m,{alt,caption}={}){
 const variants=m.variants.filter(v=>v.width<=1440).map(v=>({url:v.file,width:v.width,height:v.height})).sort((a,b)=>a.width-b.width),master=variants.at(-1);
 return {assetId:m.id,width:master.width,height:master.height,alt:alt||m.alt,caption:plain(caption??m.caption),focalPoint:[50,50],variants};
}
// One to three photos use the attraction gallery; four or more go two to a row.
function gallery(assets){
 if(assets.length<=3)return approvedAttractionGallery(assets);
 const rows=[];for(let i=0;i<assets.length;i+=2)rows.push(assets.slice(i,i+2));
 return rows.map(row=>approvedAttractionGallery(row)).join('');
}
function sectionBody(lines,config,media){
 const out=[];let text=[],photos=[];
 const flushPhotos=()=>{if(photos.length){out.push(gallery(photos));photos=[];}};
 const flushText=()=>{if(text.length){out.push(renderMarkdown(text));text=[];}};
 for(let i=0;i<lines.length;i++){
  const v=lines[i].trim(),image=v.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if(!image){if(v)flushPhotos();text.push(lines[i]);continue;}
  flushText();const source=media[config.mediaMap?.[image[2]]];if(!source)throw Error(`Unmapped editorial image: ${image[2]}`);
  let next=i+1;while(next<lines.length&&!lines[next].trim())next++;
  let caption=source.caption;
  if(next<lines.length&&!/^#|^!\[|^\||^<a |^[-*] /.test(lines[next].trim())){caption=lines[next];i=next;}
  photos.push(stayAsset(source,{alt:image[1],caption}));
 }
 flushPhotos();flushText();return out.join('').replaceAll('<div class="cb-table-scroll">','<div class="stay-table-scroll">');
}
function faq(lines){
 const blocks=[];let question,answer=[];
 const flush=()=>{if(question)blocks.push(`<details><summary>${inlineMarkdown(question)}</summary>${renderMarkdown(answer)}</details>`);};
 for(const line of lines){if(line.startsWith('### ')){flush();question=line.slice(4);answer=[];}else if(question)answer.push(line);else if(line.trim())blocks.push(renderMarkdown([line]));}
 flush();return blocks.join('');
}
const stayCss=`.approved-stay-article .stay-table-scroll{max-width:100%;overflow-x:auto;margin:22px 0}.approved-stay-article .stay-table-scroll table{border-collapse:collapse;width:100%;font-size:14px}.approved-stay-article .stay-table-scroll :is(td,th){padding:10px;border:1px solid var(--line);text-align:left;vertical-align:top}.approved-stay-article .stay-table-scroll th{background:#f2eee5}
.approved-stay-article .stay-hero{margin-top:28px}.approved-stay-article .stay-related{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:28px}`;

export function renderApprovedStayArticle(article,config,media,{introParagraphs}={}){
 validateTravelArticle(article,config,media);
 if(config.articleType!=='hotel')throw Error('Stay shell is for hotel articles');
 if(article.heroImage&&config.mediaMap?.[article.heroImage.source]!==config.hero)throw Error('Editorial hero does not match source-bound configuration');
 const hero=stayAsset(media[config.hero],article.heroImage?{alt:article.heroImage.alt,caption:article.heroImage.caption}:{});
 const description=article.metadata?.description||article.intro.replace(/\*\*|`/g,'').slice(0,160),canonical=origin+config.path,ogImage=origin+media[config.hero].file;
 const [main,...rest]=article.title.split('：'),subtitle=rest.join('：');
 const lead=(introParagraphs||[article.intro]).map(p=>`<p>${inlineMarkdown(p)}</p>`).join('');
 const sections=article.sections.map(s=>`<section id="${s.id}"><h2>${esc(s.title)}</h2>${s.id==='faq'?faq(s.lines):sectionBody(s.lines,config,media)}</section>`).join('');
 const related=`<nav class="stay-related" aria-label="相關旅行攻略">${config.related.map(l=>`<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</nav>`;
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const compat=read('trip/approved-city-guide.css')+'\n'+singaporePracticalCss.replaceAll('.sg-guide','.approved-city-guide')+'\n'+read('trip/approved-heading-hierarchy.css')+'\n'+stayCss;
 const schema=jsonld({'@context':'https://schema.org','@type':'Article',headline:article.title,description,inLanguage:'zh-Hant',datePublished:config.updatedAt,dateModified:config.updatedAt,author:{'@type':'Organization',name:config.author,url:origin+'/trip/'},publisher:{'@type':'Organization',name:'鷹家遠行所',url:origin+'/trip/'},image:[ogImage],mainEntityOfPage:canonical})
  +jsonld({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{position:1,name:'鷹家遠行所',item:origin+'/trip/'},{position:2,name:config.tocTitle,item:canonical}].map(x=>({'@type':'ListItem',...x}))});
 const html=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(article.title)}｜鷹家遠行所</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(article.title)}｜鷹家遠行所"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ogImage}"><meta property="og:image:alt" content="${esc(hero.alt)}"><meta property="og:locale" content="zh_TW"><link rel="icon" href="/icons/favicon.svg">${cityGuideTemplateStyle({compatCss:compat})}<script defer src="/blog/reading-nav.js"></script><script defer src="/site-runtime.js"></script>${schema}</head>`
  +`<body class="bkk-guide city-guide approved-city-guide approved-stay-article"${config.countryId?` data-country="${esc(config.countryId)}"`:''} data-reading-nav-instant><a class="skip" href="#main">跳到主要內容</a><header class="masthead wrap" data-reading-nav-chrome><a class="brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><nav aria-label="主要導覽"><a href="/trip/#destinations">目的地</a><a href="#${article.sections[0].id}">住宿介紹</a><a href="${esc(config.related[0].href)}">相關攻略</a></nav></header>`
  +`<main id="main"><header class="article-header wrap bkk-header"><nav class="breadcrumbs" aria-label="麵包屑"><a href="/trip/">鷹家遠行所</a> / <span aria-current="page">${esc(config.tocTitle)}</span></nav><p class="eyebrow">${esc(config.eyebrow)}</p><h1>${esc(main)}${subtitle?`<span>${esc(subtitle)}</span>`:''}</h1><div class="article-lead">${lead}</div><p class="byline"><span>撰文・影像：${esc(config.author)}</span><span>更新 ${esc(config.updatedAt.replaceAll('-','.'))}</span></p><div class="city-attraction-gallery city-attraction-gallery--single stay-hero"><div class="city-gallery-lead">${approvedFigure(hero,{sizes:heroSizes})}</div></div></header>`
  +`<div class="article-layout wrap"><nav class="toc guide-nav" data-reading-nav aria-label="文章目錄">${article.sections.map(s=>`<a href="#${s.id}">${esc(s.label)}</a>`).join('')}</nav><article class="prose">${sections}${related}</article></div></main>`
  +`<footer class="footer"><div class="footer-inner wrap"><p>© 鷹式一家 Eaglish Family</p><a href="/trip/">回鷹家遠行所</a></div></footer>${renderSiteNavigation(config.path)}</body></html>`;
 return prioritizeFirstTravelImage(html);
}
