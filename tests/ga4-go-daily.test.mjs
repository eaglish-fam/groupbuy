import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,toCsv,parseCsv} from '../scripts/ga4-go-daily.mjs';

const en='# GA4 export\n# Date range\n\nSession source,Session medium,Session campaign,Session manual ad content,Views\nline,social,calendar-202611,group1,"1,200"\nline,social,calendar-202611,group2-pin,30\nline,social,calendar-202611,blog-leofoo,5\n(direct),(none),(not set),(not set),7\nline,social,calendar-202611,group1,3\n';
test('rows are grouped, classified by source, and sorted by views',()=>{
 const r=summarize(en,'2026-11-01');
 assert.deepEqual(r.map(x=>[x.source,x.utm_content,x.views]),[['line','group1',1203],['line','group2-pin',30],['other','',7],['blog','blog-leofoo',5]]);
 assert.equal(r[0].date,'2026-11-01');
 assert.equal(r.find(x=>x.source==='other').utm_campaign,'');
});
test('Traditional Chinese headers work and a missing column stops the script',()=>{
 const zh='工作階段來源,工作階段媒介,工作階段廣告活動,工作階段手動廣告內容,瀏覽次數\nline,social,calendar-202611,group1,4\n';
 assert.equal(summarize(zh,'2026-11-01')[0].views,4);
 assert.throws(()=>summarize('foo,Views\nx,1\n','2026-11-01'),/column not found: utm_source/);
 assert.throws(()=>summarize('Session source,Session medium,Session campaign,Session manual ad content,Sessions\nline,social,c,g,1\n','2026-11-01'),/column not found: views/);
 assert.throws(()=>summarize(en,'11/01'),/date must be/);
});
test('csv output quotes commas and has the documented columns',()=>{
 const out=toCsv([{date:'2026-11-01',source:'line',utm_source:'line',utm_medium:'social',utm_campaign:'a,b',utm_content:'',views:1}]);
 assert.equal(out.split('\n')[0],'date,source,utm_source,utm_medium,utm_campaign,utm_content,views');
 assert.deepEqual(parseCsv(out)[1],['2026-11-01','line','line','social','a,b','','1']);
});
