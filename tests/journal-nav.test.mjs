import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const {step}=createRequire(import.meta.url)('../blog/journal-nav.js');
const start={y:0,direction:0,distance:0,hidden:false};
test('category navigation hides only after deliberate downward reading',()=>{
 let s=step(start,80);assert.equal(s.hidden,false);
 s=step(s,140);assert.equal(s.hidden,true);
 s=step(s,130);assert.equal(s.hidden,true);
 s=step(s,108);assert.equal(s.hidden,false);
});
test('small alternating deltas do not flicker; top and keyboard reveal categories',()=>{
 let s={y:220,direction:1,distance:80,hidden:true};
 for(const y of [217,220,215,219])s=step(s,y);
 assert.equal(s.hidden,true);
 assert.equal(step(s,219,true).hidden,false);
 assert.equal(step(s,-15).hidden,false);
});
test('all journal pages use sticky chrome; only index carries the original live filters',()=>{
 const base=new URL('../blog/',import.meta.url);
 const files=['index.html',...fs.readdirSync(base,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name+'/index.html')];
 for(const file of files){
  const html=fs.readFileSync(new URL(file,base),'utf8');
  assert.equal((html.match(/class="journal-chrome"/g)||[]).length,1,file);
  assert.ok(html.includes('/blog/journal-nav.css?'),file);
  assert.ok(html.includes('/blog/journal-nav.js?'),file);
 }
 const index=fs.readFileSync(new URL('index.html',base),'utf8');
 assert.equal((index.match(/class="article-filters"/g)||[]).length,1);
 assert.ok(index.indexOf('class="article-filters"')<index.indexOf('<main'));
 assert.ok(!index.includes('id="freshness"'),'consumer page must not expose runtime freshness copy');
 assert.ok(!index.includes('依生活分類'),'category controls do not need an explanatory label');
 const css=fs.readFileSync(new URL('journal-nav.css',base),'utf8');
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(css.includes('min-height: 44px'));
});
