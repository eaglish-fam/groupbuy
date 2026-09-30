import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projectPath} from './check-cebu-bohol-hotel-media.mjs';
import {parseArticleMarkdown,validateTravelArticle} from './travel-article-renderer.mjs';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const pageRoutes=['/trip/guides/cebu-bohol-with-kids/','/trip/stays/molly-resort-bohol/','/trip/stays/henann-bohol-family-comparison/'];
export function hasUnrelatedHotelPlanner(html){
 // Shared styles/reading-nav can mention the launcher without creating one.
 // Inspect actual action/controller markup, not keywords in bundled resources.
 return /<(?:a|button|div)\b[^>]*(?:\bclass="[^"]*\btrip-plan-entry\b|\bdata-cb-planner(?:[=\s>]))/.test(html)||/<a\b[^>]*href="#plan"/.test(html)||/<script\b[^>]*(?:src|data-preview-source)="[^"]*\/cebu-bohol-planner\.mjs/.test(html);
}
export function validatePublicationPack(pack){
 const localStatuses=['FROZEN_LOCAL_DRAFTS_FOR_FACT_REVIEW_AND_CANDIDATE_BUILD','LOCAL_REVISED_DRAFTS_READY_FOR_HASH_BOUND_REVIEW'];
 if(!/^alma-hotel-publication-pack\/v[12]$/.test(pack.schemaVersion)||pack.workId!=='cebu-bohol-blog-20260930'||!localStatuses.includes(pack.status)||pack.publicationAuthorized!==false||pack.productionModified!==false)throw Error('Expected hash-bound local-only hotel publication pack');
 if(pack.pages?.length!==3||JSON.stringify(pack.pages.map(p=>p.slug))!==JSON.stringify(pageRoutes))throw Error('Publication pack must bind the exact three reviewed routes');
 for(const [i,p] of pack.pages.entries()){
  if(p.articleType!==(i===0?'guide':'hotel')||p.plannerEnabled!==(i===0)||p.analyticsEnabled!==false||p.robots!=='noindex,nofollow'||p.canonical!=='https://www.eaglish.store'+p.slug||p.reviewRating!==null||!/^alma-[a-z0-9-]+\.md$/.test(p.file)||p.path!==p.file||!/^[a-f0-9]{64}$/.test(p.sha256))throw Error(`Inconsistent reviewed page: ${p.id}`);
  if(p.sections.length!==[14,7,8][i]||p.media.length!==[29,4,3][i]||p.heroId!==p.hero?.id||p.media[0].id!==p.heroId||new Set(p.sections.map(s=>s.id)).size!==p.sections.length||new Set(p.media.map(m=>m.id)).size!==p.media.length)throw Error(`Inconsistent reviewed page counts: ${p.id}`);
  if(i===2&&(p.branchAttribution?.selfStayedBranch!==null||p.branchAttribution?.firsthand!=='brand_only'||p.media.some(m=>m.branchAttribution!=='henann-brand-only')))throw Error('Henann firsthand branch must remain unknown');
  if(p.media.some(m=>pack.excludedMediaIds.includes(m.id)||m.objectFit!=='contain'))throw Error('Excluded/cropped media in reviewed page');
 }
 return pack;
}
export function validateFactAudit(audit,pack,name,sha256){
 if(audit.schemaVersion!=='terra-hotel-final-fact-audit/v3'||audit.workId!==pack.workId||audit.reviewer!=='Terra'||audit.overallStatus!=='PASS_FACT_AUDIT_FOR_BOUND_HASHES'||audit.publicationAuthorized!==false||audit.productionModified!==false||!Array.isArray(audit.findings)||audit.findings.length)throw Error('Expected local-only Terra facts PASS');
 if(audit.publicationPack?.path!==name||audit.publicationPack.sha256!==sha256||audit.publicationPack.factMappingStatus!=='PASS_FOR_BOUND_HASH'||audit.pages?.length!==pack.pages.length||pack.pages.some(p=>!audit.pages.some(a=>a.path===p.file&&a.sha256===p.sha256&&a.factStatus==='PASS_FACT_AUDIT_FOR_BOUND_HASH')))throw Error('Terra facts audit differs from exact pack/article hashes');
 return audit;
}
export function readPublicationPack(project,name){
 if(!/^alma-hotel-publication-pack-v[123]\.json$/.test(name||''))throw Error('Explicitly select reviewed hotel publication pack v1, v2 or v3');
 const bytes=readFileSync(projectPath(project,name)),pack=validatePublicationPack(JSON.parse(bytes));
 for(const p of [...pack.pages,...pack.artifacts,...Object.values(pack.protectedV4),...Object.values(pack.lineage||{}).filter(v=>v?.path)])if(hash(readFileSync(projectPath(project,p.path)))!==p.sha256)throw Error(`Frozen publication artifact changed: ${p.path}`);
 for(const page of pack.pages)for(const m of page.media)if(hash(readFileSync(projectPath(project,m.path)))!==m.sha256)throw Error(`Frozen publication media changed: ${m.id}`);
 const sha256=hash(bytes);let factAudit;
 if(name==='alma-hotel-publication-pack-v3.json'){
  const path='terra-hotel-final-fact-audit-v3.json',auditBytes=readFileSync(projectPath(project,path)),audit=validateFactAudit(JSON.parse(auditBytes),pack,name,sha256);
  const review=audit.mechanicalValidation;
  if(review?.rootReviewPath!=='eliora-editorial-review-v7.md'||hash(readFileSync(projectPath(project,review.rootReviewPath)))!==review.rootReviewSha256)throw Error('Terra audit Root review binding differs');
  factAudit={path,sha256:hash(auditBytes),status:audit.overallStatus,sourcePackSha256:sha256};
 }
 return {pack,sha256,factAudit};
}
export function pageConfig(page,overview){
 const sectionMap=Object.fromEntries(page.sections.map(s=>[s.label,{id:s.id,label:s.tocLabel.replace(/^\d+ /,'')}]));
 if(page.articleType==='guide')sectionMap['文章目錄']={omit:true};
 // External viewing links already belong to the frozen article body. The
 // shell projects local travel links only, so a Reel is never repeated here.
 return {...(page.articleType==='guide'?overview:{}),path:page.slug,articleType:page.articleType==='hotel'?'hotel':'destination',hero:page.heroId,countryId:'philippines',tocTitle:page.articleType==='guide'?overview.tocTitle:page.id==='molly-resort-bohol'?'Molly 親子住宿':'Henann 三館親子比較',author:page.author,updatedAt:page.updated,eyebrow:page.articleType==='guide'?overview.eyebrow:'BOHOL / FAMILY STAY',sectionMap,mediaMap:Object.fromEntries(page.media.map(m=>[m.path,m.id])),...(page.articleType==='hotel'?{cards:[],related:page.relatedLinks.filter(l=>l.url.startsWith('/trip/')).map(l=>({label:l.label,href:l.url}))}:{})};
}
export function validatePageSource(source,page,config,media){
 if(hash(Buffer.from(source))!==page.sha256)throw Error(`Materialized editorial source changed: ${page.id}`);
 const article=parseArticleMarkdown(source,config.sectionMap);
 if(article.title!==page.title||article.metadata.description!==page.description||article.metadata.author!==page.author||article.metadata.updated!==page.updated||article.metadata.hero_source_id!==page.heroId)throw Error(`Editorial metadata differs from frozen pack: ${page.id}`);
 if(JSON.stringify(article.sections.map(s=>s.id))!==JSON.stringify(page.sections.map(s=>s.id)))throw Error('Editorial section identities differ');
 const images=[...source.matchAll(/^!\[([^\]]*)\]\(([^)]+)\)$/gm)];
 if(images.length!==page.media.length)throw Error('Editorial media counts differ');
 for(const [i,m] of page.media.entries()){
  const r=media[m.id];
  if(images[i][1]!==m.alt||images[i][2]!==m.path||!r||r.derivedSha256!==m.sha256||r.width!==m.width||r.height!==m.height)throw Error(`Editorial media identity differs: ${m.id}`);
 }
 validateTravelArticle(article,config,media);return article;
}
