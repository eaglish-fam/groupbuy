import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const receipt=JSON.parse(read('trip/data/cebu-bohol-hotel-publication-v1.json'));

test('stay articles use the approved city-guide shell and keep their own sections, photos and links',()=>{
 for(const page of receipt.pages.filter(p=>p.articleType==='hotel')){
  const html=read(page.slug.slice(1)+'index.html'),source=read(page.source);
  assert.match(html,/<body class="bkk-guide city-guide approved-city-guide approved-stay-article"/);
  // Titles with a colon split into title and accented subtitle, as on the city guides.
  const title=source.match(/^# (.+)$/m)[1];assert.ok(html.includes(title.includes('：')?`<h1>${title.split('：')[0]}<span>${title.split('：').slice(1).join('：')}</span></h1>`:`<h1>${title}</h1>`),title);
  assert.match(html,/src="\/blog\/reading-nav\.js"/);
  assert.doesNotMatch(html.replace(/<style[\s\S]*?<\/style>/g,''),/data-cb-planner|trip-plan-entry|cb-toc-number|brand-note/);
  assert.equal((html.match(/<img[^>]*fetchpriority="high"/g)||[]).length,1);
  for(const id of Object.values(page.config.sectionMap).filter(s=>!s.omit).map(s=>s.id))assert.ok(html.includes(`<section id="${id}">`),id);
  for(const l of page.config.related)assert.ok(html.includes(`href="${l.href}"`),l.href);
  for(const [,url] of source.matchAll(/\]\((https:\/\/[^)]+)\)/g))assert.ok(html.includes(`href="${url.replaceAll('&','&amp;')}"`),url);
  for(const [,file] of source.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)){const id=page.config.mediaMap[file];assert.ok(id,file);assert.ok(html.includes(`data-asset-id="${id}"`),id);}
 }
});
