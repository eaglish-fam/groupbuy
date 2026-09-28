import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {renderSiteNavigation,siteSection} from '../scripts/site-navigation.mjs';
const source=readFileSync(new URL('../site-navigation.js',import.meta.url),'utf8');
const KEY='eaglish.travel-return.v1',NOW=1800000000000;
const origin='https://www.eaglish.store';
const saved=overrides=>({version:1,origin,path:'/trip/guides/bangkok-with-kids/',hash:'#jurassic',title:'曼谷親子旅行',section:'侏羅紀世界體驗',scrollY:1700,savedAt:NOW,...overrides});
const record=storage=>JSON.parse(storage.get(KEY)||'null');
function anchor(href,{target='',section=null,download=false}={}){
 const attrs={href,target};
 return {getAttribute:name=>attrs[name]??null,setAttribute:(name,value)=>attrs[name]=value,hasAttribute:name=>name==='download'&&download,closest:()=>section};
}
function runtime(url,storage=new Map(),options={}){
 const location=new URL(url,origin),docEvents={},winEvents={},frames=[],scrolls=[],classes=new Set(),style={};
 const returnLink=anchor('/trip/'),label={textContent:''},dismissEvents={};
 const dismiss={addEventListener:(name,fn)=>dismissEvents[name]=fn};
 const bar={hidden:true,getBoundingClientRect:()=>({height:59}),querySelector:selector=>({'[data-travel-return-link]':returnLink,'[data-travel-return-title]':label,'[data-travel-return-dismiss]':dismiss}[selector])};
 const listen=(collection,name,fn)=>(collection[name]??=[]).push(fn);
 const remove=(collection,name,fn)=>{collection[name]=(collection[name]||[]).filter(value=>value!==fn);};
 const section=options.section;
 const document={title:'曼谷親子旅行｜鷹家遠行所',readyState:options.readyState||'complete',documentElement:{classList:{toggle(name,enabled){enabled?classes.add(name):classes.delete(name);}},style:{setProperty:(key,value)=>style[key]=value}},querySelector:selector=>({'[data-travel-return]':bar,'h1':{textContent:'曼谷親子旅行'},'base[target]':options.baseTarget?{getAttribute:()=>options.baseTarget}:null}[selector]||null),querySelectorAll:()=>options.viewportSections||[],getElementById:id=>section?.id===id?section:null,addEventListener:(name,fn)=>listen(docEvents,name,fn)};
 const context={URL,location,document,Date:{now:()=>options.now||NOW},sessionStorage:options.blockStorage?{getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}}:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},requestAnimationFrame:fn=>frames.push(fn),ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn();}}};
 context.window={scrollY:options.scrollY??1700,addEventListener:(name,fn)=>listen(winEvents,name,fn),removeEventListener:(name,fn)=>remove(winEvents,name,fn),scrollTo:value=>scrolls.push(value)};
 runInNewContext(source,context);
 const click=(href,details={})=>{
  const node=href===returnLink?returnLink:anchor(href,details);
  const event={button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},target:{closest:()=>node},...details};
  (docEvents.click||[]).forEach(fn=>fn(event));return node;
 };
 return {storage,bar,label,link:returnLink,classes,style,scrolls,click,dismiss:()=>dismissEvents.click(),emit:name=>(winEvents[name]||[]).slice().forEach(fn=>fn({})),flush:()=>frames.splice(0).forEach(fn=>fn())};
}

// Anchors need only section closest() here; event.target supplies the a[href] lookup.
test('shared navigation renders three static full-brand links and marks the current site section',()=>{
 for(const [path,current] of [['/','store'],['/blog/example/','journal'],['/guides/','journal'],['/how-we-select/','journal'],['/trip/new-zealand/','travel']]){
  const html=renderSiteNavigation(path);
  assert.equal(siteSection(path),current);
  assert.equal((html.match(/aria-current="location"/g)||[]).length,1);
  assert.match(html,new RegExp(`data-site-section="${current}" aria-current="location"`));
  for(const brand of ['鷹家買物社','鷹家選物誌','鷹家遠行所'])assert.ok(html.includes(brand));
  assert.match(html,/data-travel-return hidden/);
 }
});

test('travel departure preserves the actual section across multiple journal and shop pages',()=>{
 const section={id:'jurassic',matches:()=>false,querySelector:()=>({textContent:'侏羅紀世界體驗'})};
 const travel=runtime('/trip/guides/bangkok-with-kids/?private=discard#before',new Map(),{section});
 travel.click('/blog/mitoy-rice-blocks/',{section});
 const initial=travel.storage.get(KEY),context=record(travel.storage);
 assert.equal(context.hash,'#jurassic');assert.equal(context.path,'/trip/guides/bangkok-with-kids/');assert.doesNotMatch(initial,/private=|before/);
 const first=runtime('/blog/mitoy-rice-blocks/',travel.storage);
 assert.equal(first.bar.hidden,false);assert.equal(first.link.getAttribute('href'),context.path+'#jurassic');assert.match(first.label.textContent,/^侏羅紀世界體驗/);
 first.click('/blog/playzu/');assert.equal(travel.storage.get(KEY),initial);
 const second=runtime('/blog/playzu/',travel.storage);second.click('/?p=playzu');
 const shop=runtime('/?p=playzu',travel.storage);assert.equal(shop.bar.hidden,false);assert.equal(travel.storage.get(KEY),initial);
 shop.click(shop.link);assert.equal(record(travel.storage).returningAt,NOW);
 const returned=runtime(context.path+'#jurassic',travel.storage);returned.flush();assert.equal(travel.storage.has(KEY),false);assert.equal(returned.scrolls.length,0,'native hash navigation needs no scripted scroll');
});

test('modified, new-tab, download, external and prevented clicks never pollute the same-tab context',()=>{
 const page=runtime('/trip/new-zealand/');
 const cases=[['/blog/',{ctrlKey:true}],['/blog/',{metaKey:true}],['/blog/',{shiftKey:true}],['/blog/',{button:1}],['/blog/',{target:'_blank'}],['/blog/',{download:true}],['/blog/',{defaultPrevented:true}],['https://example.com/blog/',{}],['javascript:alert(1)',{}],['https://intruder@www.eaglish.store/blog/',{}]];
 for(const [href,options] of cases){page.click(href,options);assert.equal(page.storage.has(KEY),false);}
 const inherited=runtime('/trip/new-zealand/',new Map(),{baseTarget:'_blank'});inherited.click('/blog/');assert.equal(inherited.storage.has(KEY),false);
 page.click('/?p=branden');assert.equal(record(page.storage).path,'/trip/new-zealand/');
});

test('invalid, expired or cross-origin saved context is never rendered',()=>{
 for(const bad of [{origin:'https://evil.test'},{path:'//evil.test/trip/'},{path:'/trip/../blog/'},{path:'/trip/%2e%2e/'},{path:'/trip/?token=bad'},{savedAt:NOW-7*60*60*1000},{savedAt:NOW+120000},{version:2}]){
  const storage=new Map([[KEY,JSON.stringify(saved(bad))]]);const page=runtime('/blog/',storage);
  assert.equal(page.bar.hidden,true);assert.equal(storage.has(KEY),false);
 }
 const corrupt=runtime('/blog/',new Map([[KEY,'{corrupt']]));assert.equal(corrupt.bar.hidden,true);
 const safe=runtime('/blog/',new Map([[KEY,JSON.stringify(saved({title:'<img onerror=alert(1)>',section:'<b>文字</b>',hash:'#%E0%A4%A'}))]]));
 assert.equal(safe.link.getAttribute('href'),'/trip/guides/bangkok-with-kids/');assert.match(safe.label.textContent,/<b>文字<\/b>/,'untrusted saved labels are literal textContent, not HTML');
});

test('dismissal, storage denial and fresh travel navigation fail safely',()=>{
 const storage=new Map([[KEY,JSON.stringify(saved())]]);const page=runtime('/blog/',storage);
 assert.equal(page.style['--site-return-height'],'59px');page.dismiss();assert.equal(page.bar.hidden,true);assert.equal(storage.has(KEY),false);assert.equal(page.style['--site-return-height'],'0px');
 assert.doesNotThrow(()=>runtime('/blog/',new Map(),{blockStorage:true}));
 const blocked=runtime('/trip/new-zealand/',new Map(),{blockStorage:true});assert.doesNotThrow(()=>blocked.click('/blog/'));
 const other=new Map([[KEY,JSON.stringify(saved())]]);runtime('/trip/new-zealand/',other);assert.equal(other.has(KEY),false,'opening another trip starts a new reading origin');
});

test('scroll restores only for an explicit return and yields to user interaction',()=>{
 const make=()=>new Map([[KEY,JSON.stringify(saved({hash:'',returningAt:NOW,scrollY:2100}))]]);
 const restored=runtime('/trip/guides/bangkok-with-kids/',make());restored.flush();assert.equal(restored.scrolls[0].top,2100);
 const touched=runtime('/trip/guides/bangkok-with-kids/',make(),{readyState:'loading'});touched.emit('wheel');touched.emit('load');touched.flush();assert.equal(touched.scrolls.length,0);
 const ordinary=runtime('/trip/guides/bangkok-with-kids/',new Map([[KEY,JSON.stringify(saved({hash:''}))]]));ordinary.flush();assert.equal(ordinary.scrolls.length,0,'direct navigation does not force a stored scroll');
});

test('BFCache pageshow clears a completed travel return and hides stale journal controls',()=>{
 const storage=new Map();const trip=runtime('/trip/guides/bangkok-with-kids/',storage);trip.click('/blog/');
 const journal=runtime('/blog/',storage);assert.equal(journal.bar.hidden,false);
 trip.emit('pageshow');assert.equal(storage.has(KEY),false);
 journal.emit('pageshow');assert.equal(journal.bar.hidden,true);
});

test('return context expiring while a page stays open hides the old action and cancels navigation',()=>{
 const storage=new Map([[KEY,JSON.stringify(saved())]]),clock={now:NOW};
 const page=runtime('/blog/playzu/',storage,clock);assert.equal(page.bar.hidden,false);
 clock.now=NOW+7*60*60*1000;
 let prevented=false;
 page.click(page.link,{preventDefault(){prevented=true;this.defaultPrevented=true;}});
 assert.equal(prevented,true);assert.equal(page.bar.hidden,true);assert.equal(storage.has(KEY),false);
});

test('an explicit return repairs its section position after load but never overrides user movement',()=>{
 const make=()=>new Map([[KEY,JSON.stringify(saved({returningAt:NOW}))]]);
 let positioned=0;
 const section={id:'jurassic',scrollIntoView(options){positioned++;assert.equal(options.block,'start');assert.equal(options.behavior,'instant');}};
 const returned=runtime('/trip/guides/bangkok-with-kids/#jurassic',make(),{readyState:'loading',section});
 assert.equal(positioned,0);returned.emit('load');assert.equal(positioned,0);returned.flush();assert.equal(positioned,1);
 const cancelled=runtime('/trip/guides/bangkok-with-kids/#jurassic',make(),{readyState:'loading',section});cancelled.emit('pointerdown');cancelled.emit('load');cancelled.flush();assert.equal(positioned,1);
 const ordinary=runtime('/trip/guides/bangkok-with-kids/#jurassic',new Map([[KEY,JSON.stringify(saved())]]),{section});ordinary.flush();assert.equal(positioned,1,'ordinary incoming anchor navigation remains native');
 const otherHash=runtime('/trip/guides/bangkok-with-kids/#before',make(),{section});otherHash.flush();assert.equal(positioned,1,'do not override a deliberately different fragment');
});
