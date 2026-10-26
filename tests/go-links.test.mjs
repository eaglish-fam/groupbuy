import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {validateLinks,renderGoPage} from '../scripts/build-go-links.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(readFileSync(resolve(root,'config/go-links.json'),'utf8'));
const links=validateLinks(config);
const redirect=(link,{search='',now='2026-10-26T12:00:00+08:00'}={})=>{
 const html=renderGoPage(link),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const anchor={href:''},seen={};
 const RealDate=Date,fixed=RealDate.parse(now);
 class FakeDate extends RealDate{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}}
 vm.runInNewContext(script,{Date:FakeDate,URLSearchParams,location:{search,replace:u=>{seen.url=u;}},document:{getElementById:()=>anchor}});
 return {url:seen.url,href:anchor.href};
};

test('every committed go page is exactly what the generator writes, and is noindex',()=>{
 for(const l of links){
  const html=readFileSync(resolve(root,'go',l.slug,'index.html'),'utf8');
  assert.equal(html,renderGoPage(l));
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(html,/<meta property="og:image" content="https:\/\/www\.eaglish\.store\/assets\//);
 }
});
test('the calendar link adds LINE tracking codes with the Taipei month and the group tag',()=>{
 const cal=links.find(l=>l.slug==='cal');
 const r=redirect(cal,{search:'?c=group1'});
 assert.equal(r.url,'/calendar/?utm_source=line&utm_medium=social&utm_campaign=calendar-202610&utm_content=group1');
 assert.equal(r.href,r.url);
});
test('the month follows Taipei time, not UTC',()=>{
 const cal=links.find(l=>l.slug==='cal');
 assert.match(redirect(cal,{now:'2026-11-01T00:30:00+08:00'}).url,/utm_campaign=calendar-202611/);
 assert.match(redirect(cal,{now:'2026-10-31T23:30:00+08:00'}).url,/utm_campaign=calendar-202610/);
});
test('without a group tag no utm_content is sent, and a malformed tag is dropped',()=>{
 const cal=links.find(l=>l.slug==='cal');
 assert.doesNotMatch(redirect(cal).url,/utm_content/);
 for(const bad of ['?c=Group1','?c=a%20b','?c=https://evil.example','?c='+'a'.repeat(25)])assert.doesNotMatch(redirect(cal,{search:bad}).url,/utm_content/);
 assert.match(redirect(cal,{search:'?c=group2-pin&email=a@b.c'}).url,/utm_content=group2-pin$/);
});
test('the config rejects anything that could send people off-site or break naming',()=>{
 const base=links[0];
 for(const patch of [{destination:'//evil.example/'},{destination:'https://evil.example/'},{slug:'Cal'},{utm:{...base.utm,source:'LINE'}},{image:'https://cdn.example/x.jpg'}])
  assert.throws(()=>validateLinks({...config,links:[{...base,...patch}]}));
 assert.throws(()=>validateLinks({...config,links:[base,base]}));
});
