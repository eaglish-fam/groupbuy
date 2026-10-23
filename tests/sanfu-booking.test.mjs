import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../go/sanfu-farm/index.html',import.meta.url),'utf8');
const base='https://www.bbnet.com.tw/violetforest/reserve/index.php?lang=tw&amp;c=pack&amp;m=info&amp;pid=';

// GB-006: one shareable URL whose ten buttons open the vendor's ten package pages.
test('Sanfu booking hub links every package once, in zone order, without prices',()=>{
 const pids=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(u=>u.startsWith('https://www.bbnet.com.tw/')).map(u=>{assert.ok(u.startsWith(base),u);return Number(u.slice(base.length));});
 assert.deepEqual(pids,[528,529,530,531,532,533,534,535,536,537]);
 for(const tag of html.match(/<a [^>]*bbnet[^>]*>/g))assert.match(tag,/target="_blank" rel="noopener noreferrer"/);
 assert.deepEqual([...html.matchAll(/<h2 id="zone-[abc]">([^<]+)<\/h2>/g)].map(m=>m[1]),['A　森林館','B　紫屋／欒樹館','C　寵物專區']);
 assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/,''),/\$|NT|元|價格\s*[:：]|分潤|佣金/);
 assert.match(html,/<meta name="robots" content="noindex,follow">/);
 assert.match(html,/\.sanfu-options a\{[^}]*min-height:52px/);
});
