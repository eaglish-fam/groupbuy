import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {existsSync,mkdtempSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {extname,resolve} from 'node:path';
import {syntheticJapanCandidate,writeCandidate,syntheticRoutePath} from './fixtures/travel-route-package.mjs';
import {validateApprovedTravelPackage,routeAnchors} from '../trip/approved-travel-contract.mjs';
import {readApprovedTravelPackage} from '../scripts/trip-approved-public-package.mjs';
import {approvedTravelCandidates,approvedTravelRegistration} from '../scripts/trip-approved-registration.mjs';
import {renderApprovedRoute} from '../scripts/trip-route-approved-adapter.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {collectIndexablePages} from '../scripts/site-seo-inventory.mjs';
import {loadBrowserRuntime} from './browser-runtime.mjs';
const repo=resolve(import.meta.dirname,'..');
const root=mkdtempSync(resolve(tmpdir(),'route-candidate-'));
const data=await syntheticJapanCandidate(root),registration=writeCandidate(root,data);
const pages={'/trip/japan/':renderApprovedCountry(data,'japan',registration),[syntheticRoutePath]:renderApprovedRoute(data,data.routes[0].id,registration),'/trip/guides/asahikawa-with-kids/':renderApprovedCity(data,'asahikawa',registration),'/trip/guides/sapporo-with-kids/':renderApprovedCity(data,'sapporo',registration)};

test('route contract: fixed day order, resolvable city places, coverage and country membership',async()=>{
 const view=await readApprovedTravelPackage(root,registration);
 assert.equal(view.routes.size,1);assert.equal(view.verifiedVariants,36);
 const breaks=[d=>d.routes[0].days.pop(),d=>d.routes[0].days[1].day=5,d=>d.routes[0].days[0].kind='holiday',d=>d.routes[0].days[2].places[0].placeId='missing',d=>d.routes[0].days[2].images.pop(),d=>d.routes[0].cityIds.push('elsewhere'),
  d=>d.countries[0].routeIds=[],d=>delete d.countries[0].routeIds,d=>d.coverage.routeIds=[],d=>d.routes[0].path=d.cities[0].path,d=>d.routes[0].days[0].links=[{label:'x',url:'#nowhere'}],d=>d.countries[0].referencePlans[0].routeId='other-route'];
 for(const change of breaks){const copy=structuredClone(data);change(copy);assert.throws(()=>validateApprovedTravelPackage(copy),undefined,change.toString());}
 assert.throws(()=>validateApprovedTravelPackage(data,{routeIds:['other']}),/requested route/);
 assert.deepEqual(routeAnchors(data.routes[0]).slice(0,3),['main','overview','day-1']);
});

test('map points: cities or route sections only, inside their view, href bound to the route article',()=>{
 const breaks=[d=>delete d.countries[0].geographicMap.views[1].points[2].href,d=>d.countries[0].geographicMap.views[1].points[2].href='/trip/elsewhere/#day-5',d=>d.countries[0].geographicMap.views[1].points[2].href=syntheticRoutePath+'#day-9',d=>d.countries[0].geographicMap.views[1].points[2].cityId='sapporo',d=>d.countries[0].geographicMap.views[1].points[3].point=[150,42],d=>d.countries[0].geographicMap.detail='10m'];
 for(const change of breaks){const copy=structuredClone(data);change(copy);assert.throws(()=>validateApprovedTravelPackage(copy),undefined,change.toString());}
 const html=pages['/trip/japan/'],map=html.match(/<section class="approved-geographic-map[\s\S]*?<\/section>/)[0];
 assert.equal((map.match(/data-travel-atlas-view=/g)||[]).length,2);
 assert.match(map,/data-travel-atlas-select="japan"[^>]*aria-pressed="true">日本全圖/);
 assert.match(map,new RegExp(`href="${syntheticRoutePath}#day-5"><span>小樽`));
 assert.match(map,new RegExp(`href="${syntheticRoutePath}#day-1"><span>新千歲機場`));
 // Text entries mirror the dots; 1:50m coastline keeps Hokkaido legible without inlining a continent.
 assert.deepEqual([...map.match(/<nav class="travel-atlas-destinations"[\s\S]*?<\/nav>/)[0].matchAll(/>([^<]+)<\/a>/g)].map(m=>m[1]),['旭川','札幌','小樽','新千歲機場']);
 assert.ok(map.length<120000,`map is ${map.length} bytes`);
});

test('candidate pages are noindex, canonical, linked to each other and kept out of the sitemap inventory',()=>{
 for(const [path,html] of Object.entries(pages)){
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/,path);
  assert.match(html,new RegExp(`<link rel="canonical" href="https://www\\.eaglish\\.store${path}">`),path);
  assert.doesNotMatch(html,/site-runtime\.js/,path);
 }
 const route=pages[syntheticRoutePath];
 assert.equal((route.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual([...route.matchAll(/<section id="(day-\d+)"/g)].map(m=>m[1]),['day-1','day-2','day-3','day-4','day-5','day-6','day-7']);
 // Reading order: overview, days, modules, FAQ, then the fixed day table, then videos.
 const order=['overview','day-1','day-7','transport','faq','plan','videos','related'].map(id=>route.indexOf(`<section id="${id}"`));
 assert.deepEqual(order,[...order].sort((a,b)=>a-b));assert.ok(order.every(i=>i>0));
 assert.match(route,/<a href="\/trip\/guides\/asahikawa-with-kids\/#asahikawa-stop-1">/);
 assert.match(route,/"@type":"Article"[^}]*"headline":"北海道 7 天親子路線：工程樣板"/);
 assert.match(route,/"name":"北海道 7 天路線","item":"https:\/\/www\.eaglish\.store\/trip\/japan\/hokkaido-asahikawa-sapporo-7-days\/"/);
 assert.match(pages['/trip/japan/'],new RegExp(`<a href="${syntheticRoutePath}" data-route-article=`));
 const inventory=collectIndexablePages(repo).map(p=>p.path);
 assert.ok(!inventory.some(p=>p.startsWith('/trip/japan/')));
});

test('candidate registry: unpublished only, no path collisions, published package untouched',()=>{
 const published=approvedTravelRegistration(repo);
 assert.equal(published.publication,true);assert.deepEqual(approvedTravelCandidates(repo,published),[]);
 const reg=(packages)=>writeFileSync(resolve(root,'trip/data/approved-travel-candidates-v1.json'),JSON.stringify({schema:'eaglish.approved-travel-candidates/v1',packages}));
 reg([registration]);assert.equal(approvedTravelCandidates(root,null).length,1);
 reg([{...registration,publication:true}]);assert.throws(()=>approvedTravelCandidates(root,null),/unpublished/);
 reg([registration,registration]);assert.throws(()=>approvedTravelCandidates(root,null),/twice/);
 const twin=structuredClone(data);twin.countries[0].id='japan-copy';twin.coverage.countryIds=['japan-copy'];twin.cities.forEach(c=>c.countryId='japan-copy');twin.routes[0].countryId='japan-copy';
 reg([registration,writeCandidate(root,twin,'trip/data/fixture-japan-twin.json')]);assert.throws(()=>approvedTravelCandidates(root,null),/collides/);
});

test('route and country pages: no sideways scroll, first TOC click clears the sticky header, map labels do not overlap',{timeout:90_000},async t=>{
 const runtime=await loadBrowserRuntime();if(!runtime)return t.skip('Playwright is unavailable');
 const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
 const server=http.createServer((q,r)=>{
  const path=decodeURIComponent(new URL(q.url,'http://x').pathname);
  if(pages[path]){r.setHeader('Content-Type','text/html');return r.end(pages[path]);}
  let file=resolve(path.startsWith('/trip/assets/fixture-japan/')?root:repo,'.'+path);
  if(!existsSync(file)){r.statusCode=404;return r.end();}if(statSync(file).isDirectory())file=resolve(file,'index.html');
  r.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');r.end(readFileSync(file));
 });
 await new Promise(d=>server.listen(0,'127.0.0.1',d));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await runtime.chromium.launch({headless:true,executablePath:runtime.executablePath});
 t.after(async()=>{await browser.close();server.close();});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.fulfill({status:204,body:''}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+syntheticRoutePath,{waitUntil:'load'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`route ${width}`);
  // Desktop: the sticky table of contents. Phones: the side tab opens a drawer first.
  let toc=page.locator('nav[data-reading-nav] a[href="#day-3"]');
  if(!await toc.isVisible()){await page.locator('[aria-label="展開文章目錄"]').click();toc=page.locator('a[href="#day-3"]:visible').first();}
  {
   await toc.click();await page.waitForTimeout(900);
   const gap=await page.evaluate(()=>{const h=document.querySelector('#day-3 h2').getBoundingClientRect(),chrome=[...document.querySelectorAll('[data-reading-nav-chrome],nav[data-reading-nav]')].filter(e=>getComputedStyle(e).position==='sticky'||getComputedStyle(e).position==='fixed').map(e=>e.getBoundingClientRect()).filter(b=>b.right>h.left&&b.left<h.right&&b.top<h.top+1).map(b=>b.bottom);return h.top-Math.max(0,...chrome);});
   assert.ok(gap>=0,`day heading hidden under sticky chrome at ${width} (${gap})`);
  }
  await page.goto(base+'/trip/japan/',{waitUntil:'load'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`country ${width}`);
  const select=page.locator('[data-travel-atlas-select="hokkaido"]');
  if(await select.isVisible())await select.click();
  const boxes=await page.locator('[data-travel-atlas-view="hokkaido"] .travel-atlas-country-label').evaluateAll(els=>els.map(e=>e.getBoundingClientRect()).map(b=>[b.left,b.top,b.right,b.bottom]));
  assert.equal(boxes.length,4);
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const [a,b]=[boxes[i],boxes[j]];assert.ok(a[2]<=b[0]||b[2]<=a[0]||a[3]<=b[1]||b[3]<=a[1],`labels ${i}/${j} overlap at ${width}`);}
  assert.deepEqual(errors,[]);
  await context.close();
 }
});
