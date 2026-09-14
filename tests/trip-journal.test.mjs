import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=['trip/index.html','trip/guides/bangkok-with-kids/index.html'];
test('travel journal has real static content, distinct canonical pages and no internal data',()=>{
 for(const file of pages){const html=read(file);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/鷹家遠行所/);assert.match(html,/id="main"/);assert.doesNotMatch(html,/\/Users\/|Gemini|qwen|source_sha256|AI生成|reviewed-materials/);assert.doesNotMatch(html,/id="deal-grid"/);
 const path='/'+file.replace(/index.html$/,'');assert.ok(html.includes(`rel="canonical" href="https://www.eaglish.store${path}"`));
 for(const m of html.matchAll(/(?:href|src)="(\/[^"?#]+)(?:[?#][^"]*)?"/g)){const p=m[1].endsWith('/')?m[1]+'index.html':m[1];assert.ok(existsSync(new URL('..'+p,import.meta.url)),file+' '+p);}
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${m[1]}"`),m[1]);
 }
});
test('source-bound travel details avoid unsupported ticket and venue claims',()=>{
 const html=read(pages[1]);assert.match(html,/Children’s Discovery Museum/);assert.match(html,/一位家長陪孩子/);assert.match(html,/在 Google Maps 搜尋/);assert.match(html,/f5h0gGdaX2c&t=1097s/);assert.match(html,/原定的烹飪課並未參加/);assert.doesNotMatch(html,/24小時營業|0至5歲.*免費|SEA LIFE.*推薦|6262/);
});
test('travel stylesheet has mobile and reduced-motion layouts',()=>{
 const css=read('trip/trip.css');assert.match(css,/max-width:700px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/:focus-visible/);
});
