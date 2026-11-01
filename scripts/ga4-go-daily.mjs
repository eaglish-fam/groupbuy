// Turns a GA4 report CSV (exported by hand or by GA4's scheduled email) into the
// daily summary Bingo reads: date, source, utm_source, utm_medium, utm_campaign,
// utm_content, views.
//
// What "views" means: /go/ pages only redirect and load no analytics. GA4 counts the
// visit on the destination page (for example /calendar/), with the utm codes the go
// page added. So "views" is page views of the destination that arrived with that
// campaign and content tag. It is NOT the number of clicks out to a vendor.
//
// Usage: node scripts/ga4-go-daily.mjs <ga4.csv> <YYYY-MM-DD> > daily.csv
// Column names are matched by the aliases below (English and Traditional Chinese
// report headers). If a column cannot be found the script stops and says which one,
// instead of guessing. The aliases have not been checked against a real GA4 export.
import {readFileSync} from 'node:fs';

const ALIASES={
 utm_source:[/^(session )?(manual )?(source|來源)$/i,/工作階段.*來源$/,/^來源$/],
 utm_medium:[/^(session )?(manual )?(medium|媒介)$/i,/工作階段.*媒介$/,/^媒介$/],
 utm_campaign:[/campaign/i,/廣告活動/],
 utm_content:[/(ad )?content/i,/廣告內容/],
 // Page views only. Sessions and views are different metrics, so "Sessions" is not accepted.
 views:[/^views$/i,/^瀏覽次數$/]
};
const OUT=['date','source','utm_source','utm_medium','utm_campaign','utm_content','views'];

export function parseCsv(text){
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=c;}
  else if(c==='"')q=true;
  else if(c===','){row.push(cell);cell='';}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x!==''))rows.push(row);row=[];cell='';}
  else cell+=c;}
 row.push(cell);if(row.some(x=>x!==''))rows.push(row);
 return rows;
}
const dash=v=>/^\(?(not set|not provided|\(direct\)|\(none\))\)?$/i.test(v.trim())||v.trim()===''?'':v.trim();
export function classify(utm_source,utm_content){
 if(/^blog-/.test(utm_content))return 'blog';
 if(utm_source==='line')return 'line';
 return 'other';
}
export function summarize(csvText,date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('date must be YYYY-MM-DD');
 // GA4 exports put "# ..." comment lines before the header.
 const rows=parseCsv(csvText.replace(/^﻿/,'')).filter(r=>!/^#/.test(r[0]||''));
 if(rows.length<2)throw Error('no data rows');
 const header=rows[0].map(h=>h.trim()),idx={};
 for(const [key,pats] of Object.entries(ALIASES)){
  const i=header.findIndex(h=>pats.some(p=>p.test(h)));
  if(i<0)throw Error(`column not found: ${key} (headers: ${header.join(' | ')})`);
  idx[key]=i;
 }
 const out=new Map();
 for(const r of rows.slice(1)){
  const v=Number(String(r[idx.views]).replace(/,/g,''));
  if(!Number.isFinite(v))continue;
  const rec={utm_source:dash(r[idx.utm_source]),utm_medium:dash(r[idx.utm_medium]),utm_campaign:dash(r[idx.utm_campaign]),utm_content:dash(r[idx.utm_content])};
  const key=JSON.stringify(rec);
  out.set(key,(out.get(key)||0)+v);
 }
 return [...out].map(([k,views])=>{const r=JSON.parse(k);return {date,source:classify(r.utm_source,r.utm_content),...r,views};})
  .sort((a,b)=>b.views-a.views||a.utm_campaign.localeCompare(b.utm_campaign));
}
const esc=v=>/[",\n]/.test(String(v))?`"${String(v).replace(/"/g,'""')}"`:String(v);
export function toCsv(rows){return [OUT.join(','),...rows.map(r=>OUT.map(k=>esc(r[k])).join(','))].join('\n')+'\n';}

if(import.meta.url===`file://${process.argv[1]}`){
 const [file,date]=process.argv.slice(2);
 if(!file||!date){console.error('usage: node scripts/ga4-go-daily.mjs <ga4.csv> <YYYY-MM-DD>');process.exit(2);}
 process.stdout.write(toCsv(summarize(readFileSync(file,'utf8'),date)));
}
