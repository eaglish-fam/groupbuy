import { digest } from './radar-store.mjs';
import { historyFor } from './radar-model.mjs';

const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
export function approve(store,quoteId,evidence,now=new Date().toISOString()) {
  const quote=store.quotes().find(q=>q.id===quoteId);
  if(!quote||quote.legacy||quote.expiresAt<=now||quote.outboundDate<now.slice(0,10))throw new Error('Quote is unavailable or expired');
  if(!evidence.actor?.trim() || evidence.status!=='confirmed' || !safeUrl(evidence.url))throw new Error('Confirmation needs an actor and supplier evidence URL');
  if(!Number.isFinite(Date.parse(evidence.checkedAt))||Date.parse(evidence.checkedAt)>Date.parse(now)||Date.parse(now)-Date.parse(evidence.checkedAt)>3600000)throw new Error('Verification must be within one hour');
  for(const key of ['origin','destination','outboundDate','inboundDate','adults','currency','isDirect','baggage'])if(evidence[key]!==quote[key])throw new Error('Verification conditions do not match: '+key);
  if(Number(evidence.price)!==quote.price)throw new Error('Changed price needs a new quote and review');
  const revision=digest(quote),id=digest([quote.id,revision,evidence]);
  store.db.prepare('INSERT OR IGNORE INTO radar_reviews VALUES(?,?,?,?,?,?,?)').run(id,quoteId,revision,'approved',evidence.actor,now,JSON.stringify(evidence));
  return {id,quoteId,revision,status:'approved'};
}
export function exportApproved(store,config,now=new Date().toISOString()) {
  const all=store.quotes(), quotes=new Map(all.map(q=>[q.id,q]));
  const reviews=store.db.prepare("SELECT * FROM radar_reviews WHERE status='approved' ORDER BY reviewed_at DESC").all(),seen=new Set(),rows=[];
  for(const review of reviews) {
    const q=quotes.get(review.quote_id),e=JSON.parse(review.verification_json);
    if(!q || seen.has(q.comparableKey) || q.expiresAt<=now || q.outboundDate<now.slice(0,10) || digest(q)!==review.revision || Date.parse(now)-Date.parse(e.checkedAt)>3600000 || !safeUrl(q.bookingUrl))continue;
    seen.add(q.comparableKey);
    const history=historyFor(q,all,now),route=config.routes.find(r=>r.origin===q.origin&&r.destination===q.destination);
    const row={deal_id:'fare-'+q.id.slice(0,24),status:'published',review_status:'approved',origin:q.origin,destination:q.destination,outbound_date:q.outboundDate,inbound_date:q.inboundDate,price_twd:q.price,region:route?.region??'其他',airline:q.carrier??'',stops:q.isDirect===true?'直飛':q.isDirect===false?'轉機':'待確認',baggage:q.baggage,source:q.provider,observed_at:q.fetchedAt,verified_at:e.checkedAt,expires_at:q.expiresAt,search_url:q.bookingUrl,summary:'價格與供應商條件已於 '+e.checkedAt+' 複核。',history_json:JSON.stringify(history),release_id:digest([review.id,history])};
    if(q.currency!=='TWD')continue;
    store.db.prepare('INSERT OR IGNORE INTO radar_releases VALUES(?,?,?,?)').run(row.release_id,review.id,now,JSON.stringify(row));rows.push(row);
  }
  return rows;
}
export function toCsv(rows){if(!rows.length)return '';const headers=Object.keys(rows[0]);const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';return [headers.map(cell).join(','),...rows.map(r=>headers.map(h=>cell(r[h])).join(','))].join('\r\n')+'\r\n';}
const xml=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function lineDraft(row){
  const url='https://www.eaglish.store/flights/#'+encodeURIComponent(row.deal_id);
  const text=`鷹家遠行所｜${row.origin} → ${row.destination}\n${row.outbound_date}${row.inbound_date?' — '+row.inbound_date:''}\n每人參考價 NT$ ${Number(row.price_twd).toLocaleString('zh-TW')}｜${row.stops}｜${row.baggage}\n查價時間：${row.verified_at}\n${url}\n票價與可訂日期以供應商最新結果為準。`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f1f7ff"/><rect x="45" y="45" width="1110" height="540" rx="20" fill="#fffefa" stroke="#15366a"/><g font-family="sans-serif" fill="#15366a"><text x="95" y="120" font-size="32">鷹家遠行所</text><text x="95" y="250" font-size="76">${xml(row.origin)} → ${xml(row.destination)}</text><text x="95" y="325" font-size="30">${xml(row.outbound_date)} — ${xml(row.inbound_date??'單程')}</text><text x="95" y="440" font-size="80" fill="#c4472d">NT$ ${xml(Number(row.price_twd).toLocaleString('zh-TW'))}</text><text x="95" y="510" font-size="24">每人參考價・${xml(row.stops)}・行李條件見連結</text><text x="95" y="555" font-size="18">查價 ${xml(row.verified_at)}　eaglish.store/flights</text></g></svg>`;
  return {releaseId:row.release_id,reviewRequired:true,text,svg,url};
}
