import {applyPhotoFrames} from './trip-photo-frames-r22.mjs';
export function inlineTravelWordmark(html,svg){
 if(!/^<svg\b/.test(svg)||/<script\b|<foreignObject\b|(?:href|src)=/i.test(svg))throw Error('Wordmark must be trusted self-contained SVG');
 let count=0;
 const result=html.replace(/<img src="\/flights\/assets\/faraway-wordmark\.svg"[^>]*>/g,()=>{
  const id=`home-wordmark-title-${++count}`;
  return svg.replace('<svg ','<svg class="home-wordmark" width="220" height="65" ').replace('aria-labelledby="title"',`aria-labelledby="${id}"`).replace('id="title"',`id="${id}"`);
 });
 if(count!==2)throw Error('Expected two travel wordmarks');
 return result;
}
export function presentCebuR24(html,wordmark){
 const toc=html.match(/<nav class="toc guide-nav cb-toc"[\s\S]*?<\/nav>/)?.[0];
 if(!toc)throw Error('Cebu numbered TOC missing');
 html=html.replace(toc,`<details class="r21-toc"><summary>本篇目錄</summary>${toc}</details>`)
  .replace('<main id="main">','<main id="main" data-presentation="r21">')
  .replace('<link rel="stylesheet" href="/blog/reading-nav.css">','')
  .replace('<script defer src="/blog/reading-nav.js"></script>','')
  .replace(/<link rel="stylesheet" href="\/trip\/planner-entry.css[^\"]*">/,'')
  .replace(/<script defer src="\/trip\/planner-entry.js[^\"]*"><\/script>/,'')
  .replace('<script type="module" src="/trip/cebu-bohol-planner.mjs"></script>','<script type="module" src="/trip/cebu-presentation-r21-bundle.mjs?v=r24-20261002"></script>')
  .replace(/<a class="trip-plan-entry"[\s\S]*?<\/a>/,'')
  .replace(/(<body\b[^>]*)(>)/,'$1 data-travel-theme="masthead-blue"$2')
  .replace('</head>','<link rel="stylesheet" href="/trip/cebu-presentation-r21.css?v=r24-20261002"><link rel="stylesheet" href="/trip/heading-theme-r24.css?v=r24-20261002"></head>');
 return applyPhotoFrames(inlineTravelWordmark(html,wordmark),'cebu');
}
