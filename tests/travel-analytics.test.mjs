import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const source=readFileSync(new URL('../site-runtime.js',import.meta.url),'utf8');
function runtime({hostname='www.eaglish.store',path='/trip/',robots='',query='',referrer='',country='new-zealand',breadcrumbs=[],deferred=false}={}){
 const listeners={},scripts=[],idle=[],selection={value:country};
 const context={URL,location:{hostname,pathname:path,origin:`https://${hostname}`,href:`https://${hostname}${path}${query}`},navigator:{},
  document:{referrer,
   head:{append:script=>scripts.push(script)},createElement:()=>({}),
   querySelector:s=>s==='#home-country-filter'?selection:s==='meta[name="robots"]'?{content:robots}:null,
   querySelectorAll:()=>breadcrumbs.map(data=>({textContent:JSON.stringify(data)})),
   addEventListener(name,handler){(listeners[name]??=[]).push(handler);},
  },
 };
 if(deferred){
  context.document.readyState='loading';
  context.addEventListener=(name,handler)=>{(listeners[name]??=[]).push(handler);};
  context.requestIdleCallback=handler=>idle.push(handler);
 }
 context.window=context;
 vm.createContext(context);vm.runInContext(source,context);
 const events=()=>context.dataLayer?.filter(row=>row[0]==='event')||[];
 const click=(href,matches={})=>{
  const a={href,hasAttribute:()=>false,textContent:'Read',classList:{contains:()=>false},closest:s=>matches[s]||null};
  const target={closest:s=>s==='a'?a:matches[s]||null};
  for(const handler of listeners.click)handler({target});
 };
 return {context,listeners,scripts,events,click,selection,flushLoad(){
  for(const handler of listeners.load||[])handler();
  for(const handler of idle.splice(0))handler();
 }};
}

test('GA queues page view immediately and downloads the library after page load and idle',()=>{
 const r=runtime({deferred:true});
 assert.equal(r.context.dataLayer.filter(row=>row[0]==='config').length,1);
 assert.equal(r.scripts.length,0);
 r.flushLoad();
 assert.equal(r.scripts.length,1);
 assert.match(r.scripts[0].src,/googletagmanager\.com\/gtag\/js/);
});

test('one GA initialization and page view configuration survives repeated runtime inclusion',()=>{
 const r=runtime();vm.runInContext(source,r.context);
 assert.equal(r.scripts.length,1);
 assert.equal(r.context.dataLayer.filter(row=>row[0]==='config').length,1);
 assert.equal(r.context.dataLayer.find(row=>row[0]==='config')[2].content_group,'travel');
 assert.equal(r.listeners.click.length,1);
 assert.equal(r.listeners.change.length,1);
});

test('GA page configuration removes query and fragments from landing and referrer URLs',()=>{
 const r=runtime({query:'?email=person@example.com#private',referrer:'https://example.org/start?token=private#section'});
 const config=r.context.dataLayer.find(row=>row[0]==='config')[2];
 assert.equal(config.page_location,'https://www.eaglish.store/trip/');
 assert.equal(config.page_referrer,'https://example.org/start');
 assert.doesNotMatch(JSON.stringify(config),/person@|token|private/);
});

test('travel entries and guide opens retain their actual country and placement',()=>{
 const r=runtime({path:'/'});
 r.click('https://www.eaglish.store/trip/',{'.hero-entry-actions':{}});
 let e=r.events().at(-1);assert.equal(e[1],'travel_entry_click');
 assert.equal(e[2].source_surface,'homepage_hero');assert.equal(e[2].destination_path,'/trip/');
 r.click('https://www.eaglish.store/trip/new-zealand/queenstown-arrowtown/',{
  '[data-home-guides]':{},'[data-country]':{dataset:{country:'new-zealand'}},
 });
 e=r.events().at(-1);assert.equal(e[1],'travel_guide_open');assert.equal(e[2].country_id,'new-zealand');
 assert.equal(e[2].source_surface,'travel_guide_grid');assert.equal(r.events().length,2);
});

test('destination and theme interactions log the synchronized selection without a page view',()=>{
 const r=runtime();
 r.click('https://www.eaglish.store/trip/new-zealand/',{'[data-atlas-choice]':{}});
 assert.equal(r.events().length,1);assert.equal(r.events()[0][1],'travel_destination_select');
 assert.equal(r.events()[0][2].country_id,'new-zealand');
 r.selection.value='thailand';r.listeners.change[0]({target:{id:'home-country-filter'}});
 assert.equal(r.events()[1][2].country_id,'thailand');
 r.listeners.change[0]({target:{id:'home-theme-filter',value:'nature'}});
 assert.equal(r.events()[2][1],'travel_filter_change');assert.equal(r.events()[2][2].theme_id,'nature');
 r.listeners.reset[0]({target:{hasAttribute:()=>true}});
 assert.equal(r.events()[3][2].country_id,'all');
 r.selection.value='new-zealand';
 r.listeners.keydown[0]({key:' ',repeat:false,target:{closest:()=>({})}});
 assert.equal(r.events()[4][1],'travel_destination_select');
 assert.equal(r.events()[4][2].country_id,'new-zealand');
 assert.equal(r.context.dataLayer.filter(row=>row[0]==='config').length,1);
});

test('outbound travel records one referral, never purchase or affiliate query parameters',()=>{
 const r=runtime({path:'/trip/guides/bangkok-with-kids/',breadcrumbs:[{'@type':'BreadcrumbList',itemListElement:[{item:'https://www.eaglish.store/trip/thailand/'}]}]});
 r.click('https://affiliate.klook.com/redirect?aid=43858&private_email=person@example.com');
 const e=r.events()[0];assert.equal(r.events().length,1);assert.equal(e[1],'outbound_travel_click');
 assert.equal(e[2].provider,'klook');assert.equal(e[2].country_id,'thailand');
 assert.equal(e[2].destination_host,'affiliate.klook.com');
 assert.doesNotMatch(JSON.stringify(e),/private_email|person@example|43858|purchase/);
 r.click('https://not-klook.com/');assert.equal(r.events().length,1);
 const home=runtime();
 home.click('https://www.kkday.com/zh-tw/product/2735',{'[data-offer-country]':{dataset:{offerCountry:'thailand'}}});
 assert.equal(home.events()[0][2].country_id,'thailand');
 assert.equal(home.events()[0][2].source_surface,'travel_home_offer');
});

test('local, Tailscale, design, lab and noindex pages never initialize GA or emit travel hits',()=>{
 for(const options of [{hostname:'localhost'},{hostname:'preview.example.ts.net'},{path:'/design/'},{path:'/lab/demo.html'},{robots:'noindex,follow'}]){
  const r=runtime(options);r.click('https://www.eaglish.store/trip/');
  r.listeners.change[0]({target:{id:'home-country-filter'}});
  assert.equal(r.scripts.length,0);assert.equal(r.events().length,0);
 }
});

test('ordinary Skyscanner referrals use exact HTTPS hosts, country identity and no private query',()=>{
 const r=runtime({path:'/trip/guides/cebu-bohol-with-kids/'});
 const matches={'[data-country]':{dataset:{country:'philippines'}}};
 for(const host of ['www.skyscanner.com.tw','skyscanner.com.tw'])r.click(`https://${host}/?private_email=person@example.com#token`,matches);
 assert.equal(r.events().length,2);
 for(const event of r.events()){assert.equal(event[1],'outbound_travel_click');assert.equal(event[2].provider,'skyscanner');assert.equal(event[2].country_id,'philippines');assert.equal(event[2].source_surface,'travel_article');assert.doesNotMatch(JSON.stringify(event),/person@|token|private_email|purchase|affiliate/);}
 for(const url of ['https://evil.skyscanner.com.tw/','https://skyscanner.com.tw.evil.test/','https://evil.test/skyscanner.com.tw','http://www.skyscanner.com.tw/'])r.click(url,matches);
 assert.equal(r.events().length,2);
 for(const options of [{hostname:'localhost'},{hostname:'preview.example.ts.net'},{robots:'noindex,nofollow'}]){const local=runtime({...options,path:'/trip/guides/cebu-bohol-with-kids/'});local.click('https://www.skyscanner.com.tw/',matches);assert.equal(local.events().length,0);assert.equal(local.scripts.length,0);}
});

test('every sitemap page includes exactly one shared runtime and no parallel inline GA tag',()=>{
 const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
 for(const [,url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)){
  const path=new URL(url).pathname;
  const html=readFileSync(new URL('..'+path+(path.endsWith('/')?'index.html':''),import.meta.url),'utf8');
  assert.equal((html.match(/<script[^>]+src="\/site-runtime\.js(?:\?[^"<>]*)?"/g)||[]).length,1,path);
  assert.ok(html.includes('/site-runtime.js?v='+createHash('sha256').update(source).digest('hex').slice(0,12)),path+' runtime cache version');
  assert.doesNotMatch(html,/src="https:\/\/www\.googletagmanager\.com\/gtag\/js/);
 }
});
