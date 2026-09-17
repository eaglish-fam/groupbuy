import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url), content=require('../product-content.js'), Papa=require('../design/papaparse.min.js');
const root=new URL('../',import.meta.url);
export const SHEET='1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU';
export function normalizeSnapshot(csv,observedAt=new Date().toISOString()){
  if(/^\s*</.test(csv))throw Error('Expected CSV, not an error or login page');
  const parsed=Papa.parse(csv,{header:false,skipEmptyLines:true});
  if(parsed.errors.length)throw Error('Invalid CSV');
  const rows=content.sheetRows(parsed.data),seen=new Set();
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date(observedAt));
  const items=rows.flatMap(r=>{
    const brand=String(r['品牌']||'').trim();
    if(!brand||/^(\/\/|---|===)/.test(brand))return [];
    const article=content.entry(brand);
    const end=content.date(r['結束日期']),start=content.date(r['開團日期']);
    const validDates=(!r['結束日期']||end)&&(!r['開團日期']||start);
    const active=validDates&&(!start||start<=today)&&(!end||end>=today)&&!(/結團|售完/.test(String(r['類型'])+String(r['庫存狀態'])))&&(end||/長期|long/i.test(r['類型']||''));
    if(!article&&!active)return [];
    const description=String(r['商品描述']||'').trim(),key=article?.id||brand+'|'+description;
    if(seen.has(key))return [];seen.add(key);
    // Snapshot is an evergreen reading directory, never a stale purchase/status authority.
    // No coupons, private notes, raw Sheet fields, prices or checkout URLs are serialized.
    const evergreenDescription=article?.excerpt||(/免運|NT\$|抗氧化|心血管|好體質|守護正姿/.test(description)?'先確認品項、使用需求與適用限制，再核對廠商最新說明。':description);
    return [{id:article?.id||createHash('sha256').update(key).digest('hex').slice(0,16),brand,description:evergreenDescription,
      category:String(r['分類']||'其他').trim(),article:article?.article||null,
      image:article?.cardImage||article?.image||null}];
  });
  if(items.length<5)throw Error('Unexpectedly empty public catalogue; preserving previous snapshot');
  return {version:1,observedAt,source:`https://docs.google.com/spreadsheets/d/${SHEET}/`,items};
}
export function snapshotCards(snapshot){
  const e=content.escape;
  return snapshot.items.map(p=>`<article class="product-card" id="product-${e(p.id)}" data-snapshot-card>
    ${p.image?`<div class="product-picture">${p.article?`<a href="${e(p.article)}" class="image-open">`:''}<img src="${e(p.image)}" width="1000" height="750" alt="${e(p.brand)}" loading="lazy" decoding="async">${p.article?'</a>':''}</div>`:''}
    <div class="product-body"><span class="status">${e(p.category)}</span><h3>${e(p.brand)}</h3><p class="product-description">${e(p.description||'先從使用需求出發，再確認適合的品項。')}</p>
    <div class="product-bottom">${p.article?`<a class="card-reading" href="${e(p.article)}">${e(p.brand)}選購筆記 ↗</a>`:'<a class="card-reading" href="/guides/">先看選購方向 ↗</a>'}
    </div></div></article>`).join('\n');
}
export function readSnapshot(){return JSON.parse(readFileSync(new URL('config/catalog-snapshot.json',root),'utf8'));}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  if(!process.argv.includes('--refresh'))throw Error('Use --refresh for an explicit read-only Sheet refresh');
  const response=await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent('現正開團')}`,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Public Sheet unavailable; no files changed');
  const result=normalizeSnapshot(await response.text());
  writeFileSync(new URL('config/catalog-snapshot.json',root),JSON.stringify(result,null,2)+'\n');
  console.log(`Refreshed ${result.items.length} public descriptions; no campaign claims or checkout links`);
}
