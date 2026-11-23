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
  assert.match(html,l.push?/<meta property="og:image" content="https:\/\/www\.eaglish\.store\//:/<meta property="og:image" content="https:\/\/www\.eaglish\.store\/assets\//,'push links reuse the destination page share image');
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
 for(const bad of ['?c=Group1','?c=a%20b','?c=https://evil.example','?c='+'a'.repeat(41)])assert.doesNotMatch(redirect(cal,{search:bad}).url,/utm_content/);
 assert.match(redirect(cal,{search:'?c=group2-pin&email=a@b.c'}).url,/utm_content=group2-pin$/);
});
test('an article tag (blog-<article slug>) fits and becomes utm_content',()=>{
 const cal=links.find(l=>l.slug==='cal');
 assert.match(redirect(cal,{search:'?c=blog-caesar-kenting'}).url,/utm_content=blog-caesar-kenting$/);
 assert.match(redirect(cal,{search:'?c=blog-'+'a'.repeat(35)}).url,/utm_content=blog-a{35}$/);
});
test('the config rejects anything that could send people off-site or break naming',()=>{
 const base=links[0];
 for(const patch of [{destination:'//evil.example/'},{destination:'https://evil.example/'},{slug:'Cal'},{utm:{...base.utm,source:'LINE'}},{image:'https://cdn.example/x.jpg'}])
  assert.throws(()=>validateLinks({...config,links:[{...base,...patch}]}));
 assert.throws(()=>validateLinks({...config,links:[base,base]}));
});

// --- G2: groups that are not open, and the sanfu-farm hall parameter ---
const NOTIFY='https://line.me/ti/g2/WcewqAFHz9CZ4zQRMCeiMNilA281HRQvfH71yg';
const closedPage=slug=>renderGoPage(links.find(l=>l.slug===slug));
const run=(html,{search='',hash='',now='2026-11-02T12:00:00+08:00'}={})=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const anchor={href:''},seen={replaced:null,scrolled:[],classes:[],root:[]};
 const RealDate=Date,fixed=RealDate.parse(now);
 class FakeDate extends RealDate{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}}
 const section={classList:{add:c=>seen.classes.push(c)}};
 const root={classList:{add:c=>seen.root.push(c)}};
 const el=id=>({id,closest:()=>section,scrollIntoView:()=>seen.scrolled.push(id)});
 vm.runInNewContext(script,{Date:FakeDate,URLSearchParams,Object,location:{search,hash,replace:u=>{seen.replaced=u;}},document:{documentElement:root,getElementById:id=>id==='go'?anchor:el(id)}});
 return {anchor,seen};
};
test('a closed group buy never redirects to a vendor or old link, and says so',()=>{
 for(const slug of ['leofoo','caesar-kenting']){
  const l=links.find(x=>x.slug===slug);
  assert.equal(l.status,'closed');
  const html=closedPage(slug);
  assert.match(html,/目前沒有開團/);
  assert.doesNotMatch(html,/location\.replace|http-equiv="refresh"/);
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  assert.deepEqual((html.match(/href="https?:\/\/[^"]*"/g)||[]).filter(h=>!/eaglish\.store/.test(h)),[`href="${NOTIFY}"`],'the only off-site link is the approved LINE community link');
  const r=run(html,{search:'?c=blog-'+slug});
  assert.equal(r.seen.replaced,null);
  assert.equal(r.anchor.href,'/calendar/?utm_source=line&utm_medium=social&utm_campaign=calendar-202611&utm_content=blog-'+slug);
 }
});
test('the notification button uses the LINE community link Hiram chose; with none configured the page says the date is not announced',()=>{
 for(const slug of ['leofoo','caesar-kenting']){
  const l=links.find(x=>x.slug===slug);
  assert.deepEqual(l.notify,{url:NOTIFY,label:'加入 LINE 社群，開團第一時間通知'});
  const html=renderGoPage(l);
  assert.match(html,new RegExp(`<a class="btn" href="${NOTIFY}" rel="noopener noreferrer">加入 LINE 社群，開團第一時間通知</a>`));
  assert.doesNotMatch(html,/開團時間待公告/);
 }
 assert.match(renderGoPage({...links.find(x=>x.slug==='leofoo'),notify:null}),/開團時間待公告/);
});
test('an unknown status uses its own wording',()=>{
 const l={...links.find(x=>x.slug==='leofoo'),status:'unknown'};
 assert.match(renderGoPage(l),/目前無法確認是否開團/);
});
test('the config rejects open status, off-site article or notify, and article on a plain redirect',()=>{
 const b=links.find(x=>x.slug==='leofoo');
 for(const patch of [{status:'open'},{status:'bogus'},{article:'https://evil.example/'},{article:'//evil.example/'},{notify:{url:'http://line.me/x',label:'x'}},{notify:{url:'https://u:p@line.me/x',label:'x'}},{notify:{url:'https://line.me/x',label:''}},{notify:{url:'not a url',label:'x'}}])
  assert.throws(()=>validateLinks({...config,links:[{...b,...patch}]}),undefined,JSON.stringify(patch));
 assert.throws(()=>validateLinks({...config,links:[{...links.find(x=>x.slug==='cal'),article:'/blog/x/'}]}));
});
const sanfu=readFileSync(resolve(root,'go/sanfu-farm/index.html'),'utf8');
test('sanfu-farm ?h= lands on the right hall and highlights it; unknown values do nothing',()=>{
 for(const [h,id] of [['forest','zone-a'],['purple','zone-b'],['luan','zone-b'],['pet','zone-c']]){
  const r=run(sanfu,{search:'?h='+h});assert.deepEqual(r.seen.scrolled,[id]);assert.deepEqual(r.seen.classes,['is-target']);
 }
 for(const bad of ['?h=x','?h=__proto__','?h=constructor','?h=zone-a%27','?h=']){const r=run(sanfu,{search:bad});assert.deepEqual(r.seen.scrolled,[],bad);}
 assert.deepEqual(run(sanfu,{hash:'#zone-b'}).seen.scrolled,['zone-b']);
 assert.deepEqual(run(sanfu,{hash:'#evil'}).seen.scrolled,[]);
});

test('sanfu-farm hides the vendor booking buttons after the last sale day (Taipei), not before',()=>{
 assert.deepEqual(run(sanfu,{now:'2026-11-02T23:59:00+08:00'}).seen.root,[]);
 assert.deepEqual(run(sanfu,{now:'2026-11-03T00:01:00+08:00'}).seen.root,['sale-over']);
 assert.deepEqual(run(sanfu,{now:'2026-11-02T16:30:00Z'}).seen.root,['sale-over'],'UTC evening of 11/02 is already 11/03 in Taipei');
 assert.match(sanfu,/html\.sale-over \.room-list\{display:none\}/);
 assert.match(sanfu,/class="sale-over-notice"/);
 assert.ok(sanfu.includes(`href="${NOTIFY}"`),'the sale-over notice offers the same LINE community link');
});

// --- GB-048: an open group buy lands on its article's buy section ---
test('kids-active-toys goes to the article buy section with LINE codes, never to a vendor URL',()=>{
 const l=links.find(x=>x.slug==='kids-active-toys');
 assert.ok(l,'kids-active-toys link exists');
 const html=renderGoPage(l);
 assert.doesNotMatch(html,/gbf\.tw|https?:\/\/(?!www\.eaglish\.store)[^"'\s]*"/,'no off-site link in the page');
 assert.match(html,/content="0;url=\/blog\/kids-active-toys\/#offer"/);
 const r=redirect(l,{search:'?c=push-am'});
 assert.equal(r.url,'/blog/kids-active-toys/?utm_source=line&utm_medium=social&utm_campaign=kids-active-toys&utm_content=push-am#offer');
 assert.equal(redirect(l).url,'/blog/kids-active-toys/?utm_source=line&utm_medium=social&utm_campaign=kids-active-toys#offer');
 const article=readFileSync(resolve(root,'blog/kids-active-toys/index.html'),'utf8');
 assert.match(article,/<section id="offer"[^>]*>[\s\S]*?data-sheet-offer/,'the anchor is the Sheet-driven buy section');
});
test('an anchor must be a plain section id',()=>{
 const b=links.find(x=>x.slug==='cal');
 for(const anchor of ['Offer','#offer','offer"><script>','a b','x'.repeat(41),'1offer'])
  assert.throws(()=>validateLinks({...config,links:[{...b,anchor}]}),undefined,anchor);
 assert.doesNotMatch(renderGoPage(b),/#offer/,'links without an anchor are unchanged');
});

// --- GB-050: LINE push links (slug = utm_campaign, no query in the push text) ---
test('push links redirect with line/social and the push slug as the campaign',()=>{
 const home=links.find(x=>x.slug==='20261114-home-am');
 assert.equal(redirect(home).url,'/?utm_source=line&utm_medium=social&utm_campaign=20261114-home-am');
 const art=links.find(x=>x.slug==='20261114-meroware-am');
 assert.equal(redirect(art).url,'/blog/meroware/?utm_source=line&utm_medium=social&utm_campaign=20261114-meroware-am');
 const kids=links.find(x=>x.slug==='20261117-kids-active-toys-pm');
 assert.equal(redirect(kids).url,'/blog/kids-active-toys/?utm_source=line&utm_medium=social&utm_campaign=20261117-kids-active-toys-pm#offer');
});
test('push links copy the share preview from the destination page',()=>{
 const art=links.find(x=>x.slug==='20261114-meroware-am');
 const page=readFileSync(resolve(root,'blog/meroware/index.html'),'utf8');
 const og=page.match(/<meta property="og:image" content="([^"]*)"/)[1];
 const html=renderGoPage(art);
 assert.ok(html.includes(`<meta property="og:image" content="${og}">`));
 assert.match(html,/<meta property="og:title" content="Meroware/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
});
test('push rows reject bad slugs, extra fields, off-site or missing pages',()=>{
 const ok={slug:'20261114-home-am',destination:'/'};
 const v=row=>validateLinks({...config,push:[row]});
 assert.doesNotThrow(()=>v(ok));
 for(const slug of ['20261114-home','home-am','20261314-home-am','20260230-home-am','20261114-Home-am','20261114-home-noon','20261114-'+'a'.repeat(30)+'-am'])
  assert.throws(()=>v({...ok,slug}),undefined,slug);
 for(const destination of ['https://gbf.tw/x/','//evil.example/','/blog/no-such-article/','/blog/meroware'])
  assert.throws(()=>v({...ok,destination}),undefined,destination);
 assert.throws(()=>v({...ok,utm:{source:'line',medium:'social',campaign:'x'}}),undefined,'campaign comes from the slug only');
 assert.throws(()=>v({...ok,destination:'/',anchor:'Offer'}));
 assert.throws(()=>validateLinks({...config,push:[ok,ok]}),undefined,'duplicate');
 assert.throws(()=>validateLinks({...config,push:[{...ok,slug:'cal'}]}));
});
test('every push slug fits the 40-character limit and matches its campaign',()=>{
 for(const l of links.filter(x=>x.push)){assert.ok(l.slug.length<=40);assert.equal(l.utm.campaign,l.slug);}
});
