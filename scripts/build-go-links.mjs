// Writes go/<slug>/index.html for every entry in config/go-links.json.
// Each page adds the tracking codes (utm_source, utm_medium, utm_campaign, and
// utm_content from ?c=) and sends people to the destination, which is the page
// that reports the visit to GA4. The page stays noindex and loads no scripts of
// its own besides the redirect; the share-preview tags are copied from config
// because LINE reads them without running JavaScript.
//
// A link has a status. Without one (or "redirect") the page sends people straight
// on. "closed" and "unknown" are for a group buy that is not open: the page does
// not redirect to an old vendor link, it says so, offers the calendar (with the
// tracking codes) and the article, and shows the notification link only if the
// config has a real one. "open" (redirect to a vendor booking page) is rejected
// until the click can be recorded and someone owns the vendor URL.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.eaglish.store';
const marker='<!-- generated:go-links -->';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const word=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STATUS=['redirect','closed','unknown'];
const internal=/^\/(?:[a-z0-9-]+\/)*$/;
function validateStatus(l){
 const st=l.status??'redirect';
 if(st==='open')throw Error('go-links: status "open" is not supported yet (vendor URL owner and click recording are undecided): '+l.slug);
 if(!STATUS.includes(st))throw Error(`go-links: bad status ${st} for ${l.slug}`);
 if(st==='redirect'){
  if(l.article!==undefined||l.notify!==undefined)throw Error('go-links: article/notify only apply to closed or unknown links: '+l.slug);
  return;
 }
 if(!internal.test(l.article||'')||l.article.startsWith('//'))throw Error('go-links: article must be an internal path: '+l.slug);
 if(l.notify!==null&&l.notify!==undefined){
  let u;try{u=new URL(l.notify.url);}catch{throw Error('go-links: notify.url must be a URL: '+l.slug);}
  if(u.protocol!=='https:'||u.username||u.password)throw Error('go-links: notify.url must be plain https: '+l.slug);
  if(!String(l.notify.label||'').trim())throw Error('go-links: notify.label missing: '+l.slug);
 }
}

export function validateLinks(config){
 if(config.schema!=='eaglish.go-links/v1'||!Array.isArray(config.links)||!config.links.length)throw Error('go-links: schema or links missing');
 const seen=new Set();
 for(const l of config.links){
  validateStatus(l);
  if(!word.test(l.slug||'')||l.slug.length>24)throw Error('go-links: bad slug '+l.slug);
  if(seen.has(l.slug))throw Error('go-links: duplicate slug '+l.slug);seen.add(l.slug);
  if(!internal.test(l.destination||'')||l.destination.startsWith('//'))throw Error('go-links: destination must be an internal path: '+l.slug);
  for(const k of ['title','description','imageAlt','label'])if(!String(l[k]||'').trim())throw Error(`go-links: ${k} missing for ${l.slug}`);
  if(!/^https:\/\/www\.eaglish\.store\/assets\//.test(l.image||''))throw Error('go-links: image must be a site asset: '+l.slug);
  const u=l.utm||{};
  for(const k of ['source','medium','campaign'])if(!/^[a-z0-9{}-]+$/.test(u[k]||''))throw Error(`go-links: utm.${k} must be lowercase letters, digits and hyphens: ${l.slug}`);
  if(u.campaign.replace('{yyyymm}','').includes('{'))throw Error('go-links: only {yyyymm} is allowed in campaign: '+l.slug);
 }
 return config.links;
}

const NOTICE={
 closed:name=>`${name}目前沒有開團`,
 unknown:name=>`${name}目前無法確認是否開團`
};
const HINT={
 closed:'舊的訂房連結已經不是當期方案，所以不帶你過去。',
 unknown:'還不確定現在有沒有當期方案，先不帶你去舊連結。'
};
export function renderGoPage(l){
 if((l.status??'redirect')!=='redirect')return renderClosedPage(l);
 const url=`${origin}/go/${l.slug}/`,utm=JSON.stringify(l.utm),dest=JSON.stringify(l.destination);
 return `<!doctype html>
${marker}
<html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(l.title)}</title>
<meta name="description" content="${esc(l.description)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="鷹家買物社"><meta property="og:type" content="website"><meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(l.title)}"><meta property="og:description" content="${esc(l.description)}">
<meta property="og:image" content="${esc(l.image)}"><meta property="og:image:alt" content="${esc(l.imageAlt)}"><meta property="og:locale" content="zh_TW">
<meta name="twitter:card" content="summary_large_image">
<noscript><meta http-equiv="refresh" content="0;url=${esc(l.destination)}"></noscript>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fbf8f1;color:#30392d;font:16px/1.7 -apple-system,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif}main{padding:24px;text-align:center}a{color:#a84c2b}</style>
</head><body><main><p>正在前往${esc(l.label)}…</p><p><a id="go" href="${esc(l.destination)}">沒有自動跳轉的話，按這裡前往${esc(l.label)}</a></p></main>
<script>(function(){var d=${dest},u=${utm};
// Month in Taipei, so the campaign name follows the same calendar the group buys do.
var ym=new Date(Date.now()+8*36e5).toISOString().slice(0,7).replace("-","");
var q=new URLSearchParams();q.set("utm_source",u.source);q.set("utm_medium",u.medium);q.set("utm_campaign",u.campaign.replace("{yyyymm}",ym));
var c=new URLSearchParams(location.search).get("c");if(c&&/^[a-z0-9-]{1,40}$/.test(c))q.set("utm_content",c);
var url=d+"?"+q.toString();document.getElementById("go").href=url;location.replace(url);})();</script>
</body></html>
`;
}

function head(l,url){
 return `<!doctype html>
${marker}
<html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(l.title)}</title>
<meta name="description" content="${esc(l.description)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="鷹家買物社"><meta property="og:type" content="website"><meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(l.title)}"><meta property="og:description" content="${esc(l.description)}">
<meta property="og:image" content="${esc(l.image)}"><meta property="og:image:alt" content="${esc(l.imageAlt)}"><meta property="og:locale" content="zh_TW">
<meta name="twitter:card" content="summary_large_image">`;
}
export function renderClosedPage(l){
 const url=`${origin}/go/${l.slug}/`,utm=JSON.stringify(l.utm);
 const notify=l.notify?`<p><a class="btn" href="${esc(l.notify.url)}" rel="noopener noreferrer">${esc(l.notify.label)}</a></p>`:`<p class="soft">開團時間待公告。</p>`;
 return `${head(l,url)}
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fbf8f1;color:#30392d;font:16px/1.7 -apple-system,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif}main{padding:24px;max-width:28rem;text-align:center}a{color:#a84c2b}.btn{display:inline-block;padding:.6em 1.2em;border-radius:999px;background:#a84c2b;color:#fff;text-decoration:none}.soft{color:#6b7466}</style>
</head><body><main><h1>${esc(NOTICE[l.status](l.label))}</h1><p>${esc(HINT[l.status])}</p>${notify}
<p><a id="go" href="${esc(l.destination)}">看團購行事曆，了解接下來的開團</a></p>
<p><a href="${esc(l.article)}">回到${esc(l.label)}的文章</a></p></main>
<script>(function(){var d=${JSON.stringify(l.destination)},u=${utm};
var ym=new Date(Date.now()+8*36e5).toISOString().slice(0,7).replace("-","");
var q=new URLSearchParams();q.set("utm_source",u.source);q.set("utm_medium",u.medium);q.set("utm_campaign",u.campaign.replace("{yyyymm}",ym));
var c=new URLSearchParams(location.search).get("c");if(c&&/^[a-z0-9-]{1,40}$/.test(c))q.set("utm_content",c);
document.getElementById("go").href=d+"?"+q.toString();})();</script>
</body></html>
`;
}

export function build(){
 const links=validateLinks(JSON.parse(readFileSync(resolve(root,'config/go-links.json'),'utf8')));
 for(const l of links){
  const file=resolve(root,'go',l.slug,'index.html');
  if(existsSync(file)&&!readFileSync(file,'utf8').includes(marker))throw Error(`go-links: ${l.slug} is a hand-made page; pick another slug`);
  mkdirSync(dirname(file),{recursive:true});writeFileSync(file,renderGoPage(l));
 }
 return links.length;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Go links built:',build());
