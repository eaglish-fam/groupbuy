import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {feature} from 'topojson-client';
import {geoBounds, geoPath} from 'd3-geo';
import {deriveAtlasBounds, projectAtlasView, renderApprovedCountryMap} from '../scripts/trip-approved-country-map.mjs';
import {initTravelAtlases} from '../trip/travel-atlas.mjs';

// TRIP_COUNTRY_MAP_SOURCE_ROOT is used only for the specialist's isolated run.
// Normal repository runs read the integrated tree beside this test.
const sourceRoot = process.env.TRIP_COUNTRY_MAP_SOURCE_ROOT || fileURLToPath(new URL('../', import.meta.url));
const readSource = path => readFileSync(resolve(sourceRoot, path), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
const actual = JSON.parse(readSource('trip/data/europe-approved-travel-v1.json'));
const topology = JSON.parse(readSource('trip/globe-land.json'));
const territory = feature(topology, topology.objects.countries).features.find(country => country.id === '458');
const fullBounds = geoBounds(territory);
const divide = (fullBounds[0][0] + fullBounds[1][0]) / 2;
const westernCoordinates = territory.geometry.coordinates.filter(coordinates => geoBounds({type:'Polygon', coordinates})[1][0] < divide);
const peninsula = {type:'MultiPolygon', coordinates:westernCoordinates};
const cities = [
  {id:'penang', path:'/trip/guides/penang-with-kids/'},
  {id:'kuala-lumpur', path:'/trip/guides/kuala-lumpur-with-kids/'}
];
const markers = [
  {cityId:'penang', label:'檳城・喬治市', point:[100.34325694444443,5.419776111111111], sourceIds:['g4-GTCOORD']},
  {cityId:'kuala-lumpur', label:'吉隆坡', point:[101.68653,3.1412], sourceIds:['g4-KLCOORD']}
];
const countryFixture = () => ({
  id:'malaysia', name:'馬來西亞', englishName:'Malaysia', cityIds:cities.map(city=>city.id), discovery:{isoNumeric:'458'},
  geographicMap:{caption:'西馬與東馬隔南海；位置標記連到檳城與吉隆坡攻略。', views:[
    {id:'all', label:'全圖', bounds:deriveAtlasBounds(territory), points:structuredClone(markers)},
    {id:'peninsula', label:'西馬', bounds:deriveAtlasBounds(peninsula), points:structuredClone(markers)}
  ]}
});
const render = country => renderApprovedCountryMap(country, {cities});
const panels = html => [...html.matchAll(/data-travel-atlas-view="([^"]+)"( hidden)? aria-label="([^"]+)"/g)].map(match=>({id:match[1], hidden:!!match[2], label:match[3]}));

// A DOM test double exercises the unmodified controller. It is not a browser
// layout, accessibility-tree, real keyboard, or device-emulation test.
function controllerHarness(html) {
  const views = panels(html).map(view=>({dataset:{travelAtlasView:view.id}, hidden:view.hidden}));
  const listeners = new Map();
  let focused = null;
  const controls = [...html.matchAll(/<button type="button" data-travel-atlas-select="([^"]+)"[^>]*aria-pressed="(true|false)">([^<]*)<\/button>/g)].map(match=>({
    dataset:{travelAtlasSelect:match[1]}, textContent:match[3], attrs:{'aria-pressed':match[2]},
    setAttribute(name,value){this.attrs[name]=value;},
    addEventListener(name, callback){const key=`${this.dataset.travelAtlasSelect}:${name}`;const callbacks=listeners.get(key)||[];callbacks.push(callback);listeners.set(key,callbacks);},
    focus(){focused=this.dataset.travelAtlasSelect;}
  }));
  const atlas = {dataset:{atlasActive:html.match(/data-atlas-active="([^"]+)"/)[1]}};
  const status = {textContent:''};
  const toolbar = {hidden:true};
  const root = {
    dataset:{},
    querySelector(selector){return {'[data-travel-atlas]':atlas,'[data-travel-atlas-status]':status,'.travel-atlas-controls':toolbar}[selector]||null;},
    querySelectorAll(selector){return {'[data-travel-atlas-select]':controls,'[data-travel-atlas-view]':views}[selector]||[];}
  };
  const scope = {querySelectorAll:selector=>selector==='[data-travel-atlas-root]'?[root]:[]};
  return {
    scope, views, controls, atlas, status, toolbar, listeners,
    get focused(){return focused;},
    fire(id,name,key){let prevented=false;for(const callback of listeners.get(`${id}:${name}`)||[]) callback({key,preventDefault(){prevented=true;}});return prevented;}
  };
}

test('ISO 458 has two real country portions and geometry-derived full/peninsula bounds',()=>{
  assert.equal(territory.id,'458');
  assert.equal(territory.geometry.type,'MultiPolygon');
  assert.equal(territory.geometry.coordinates.length,2);
  assert.equal(peninsula.coordinates.length,1);
  assert.deepEqual(fullBounds,[[100.08640086400862,0.7723831050547716],[119.18099180991811,6.9282187453733]]);
  const westBounds=geoBounds(peninsula);
  assert.deepEqual(westBounds,[[100.08640086400862,1.2259888107477508],[104.24804248042483,6.642176341410192]]);
  const country=countryFixture();
  for(const view of country.geographicMap.views){
    const projection=projectAtlasView(view,[28,16,544,330]);
    const geometry=view.id==='all'?territory:peninsula;
    for(const polygon of geometry.geometry?.coordinates||geometry.coordinates){for(const ring of polygon){for(const point of ring){const [x,y]=projection(point);assert.ok(x>=28&&x<=572&&y>=16&&y<=346);}}}
    for(const point of view.points)assert.ok(point.point[0]>=view.bounds[0]&&point.point[0]<=view.bounds[2]&&point.point[1]>=view.bounds[1]&&point.point[1]<=view.bounds[3]);
  }
  assert.throws(()=>deriveAtlasBounds({type:'Point',coordinates:[0,0]}),/geometry/);
  assert.throws(()=>deriveAtlasBounds(territory,.3),/padding/);
});

test('Malaysia has two opt-in views and only the two verified guide destinations',()=>{
  const html=render(countryFixture());
  assert.deepEqual(panels(html),[{id:'all',hidden:false,label:'全圖'},{id:'peninsula',hidden:true,label:'西馬'}]);
  assert.equal((html.match(/data-travel-atlas-select=/g)||[]).length,2);
  assert.match(html,/data-atlas-active="all"/);
  assert.match(html,/data-travel-atlas-status role="status" aria-live="polite">目前顯示：全圖/);
  assert.equal((html.match(/data-geometry-country="458"/g)||[]).length,2);
  assert.doesNotMatch(html,/travel-atlas-inset|data-travel-atlas-select="island"/);
  const nav=html.match(/<nav class="travel-atlas-destinations"[\s\S]*?<\/nav>/)[0];
  assert.equal((nav.match(/<a /g)||[]).length,2);
  assert.match(nav,/href="\/trip\/guides\/penang-with-kids\/">檳城・喬治市/);
  assert.match(nav,/href="\/trip\/guides\/kuala-lumpur-with-kids\/">吉隆坡/);
  for(const city of cities)assert.equal((html.match(new RegExp(`href="${city.path}"`,'g'))||[]).length,5);
  assert.deepEqual([...new Set([...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]))].sort(),cities.map(city=>city.path).sort());
});

test('rendered country paths use the actual ISO 458 polygons and preserve one full projection',()=>{
  const country=countryFixture();
  const html=render(country);
  const paths=[...html.matchAll(/class="travel-atlas-territory" data-geometry-country="458" d="([^"]+)"/g)].map(match=>match[1]);
  for(const [i,view] of country.geographicMap.views.entries()){
    const projection=projectAtlasView(view,[28,16,544,330]).clipExtent(null);
    assert.equal(paths[i],geoPath(projection)(territory));
    assert.ok((paths[i].match(/M/g)||[]).length>=2);
  }
  const full=projectAtlasView(country.geographicMap.views[0],[28,16,544,330]);
  const west=projectAtlasView(country.geographicMap.views[1],[28,16,544,330]);
  const westXY=full([104.24804248042483,4]),eastXY=full([109.66249662496625,4]);
  assert.ok(eastXY[0]>westXY[0]);
  assert.ok(full([119,4])[0]<572);
  assert.ok(west([119,4])[0]>572);
});

test('two-view controller supports clicks, arrow wrap, focus, live status and idempotent binding',()=>{
  const harness=controllerHarness(render(countryFixture()));
  initTravelAtlases(harness.scope);
  assert.equal(harness.toolbar.hidden,false);
  assert.equal(harness.atlas.dataset.atlasActive,'all');
  harness.fire('peninsula','click');
  assert.equal(harness.atlas.dataset.atlasActive,'peninsula');
  assert.equal(harness.status.textContent,'目前顯示：西馬');
  assert.deepEqual(harness.views.map(view=>view.hidden),[true,false]);
  assert.deepEqual(harness.controls.map(button=>button.attrs['aria-pressed']),['false','true']);
  assert.equal(harness.fire('peninsula','keydown','ArrowRight'),true);
  assert.equal(harness.atlas.dataset.atlasActive,'all');
  assert.equal(harness.focused,'all');
  harness.fire('all','keydown','End');
  assert.equal(harness.focused,'peninsula');
  harness.fire('peninsula','keydown','Home');
  assert.equal(harness.focused,'all');
  assert.equal(harness.fire('all','keydown','Tab'),false);
  initTravelAtlases(harness.scope);
  assert.ok([...harness.listeners.values()].every(callbacks=>callbacks.length===1));
});

test('three generic views use their own IDs with no hardcoded all/mainland/island selection',()=>{
  const country=countryFixture();
  country.geographicMap.views[0].id='country-full';
  country.geographicMap.views.push({...structuredClone(country.geographicMap.views[1]),id:'guide-focus',label:'目的地',points:[structuredClone(markers[0])]});
  const html=render(country);
  assert.deepEqual(panels(html).map(view=>[view.id,view.hidden]),[['country-full',false],['peninsula',true],['guide-focus',true]]);
  const harness=controllerHarness(html);
  initTravelAtlases(harness.scope);
  assert.equal(harness.atlas.dataset.atlasActive,'country-full');
  harness.fire('country-full','keydown','ArrowLeft');
  assert.equal(harness.focused,'guide-focus');
  assert.equal(harness.status.textContent,'目前顯示：目的地');
  harness.fire('guide-focus','keydown','ArrowDown');
  assert.equal(harness.focused,'country-full');
  harness.fire('peninsula','click');
  assert.deepEqual(harness.views.map(view=>view.hidden),[true,false,true]);
  harness.fire('peninsula','keydown','End');
  assert.deepEqual(harness.views.map(view=>view.hidden),[true,true,false]);
  harness.fire('guide-focus','keydown','ArrowUp');
  assert.equal(harness.focused,'peninsula');
});

test('untrusted text is escaped and oversized or control-character text is rejected',()=>{
  const country=countryFixture();
  country.name='馬來西亞 <script> & "旅行"';
  country.englishName="Malaysia <b> & 'travel'";
  country.geographicMap.caption='位置 & <svg onload=alert(1)>';
  country.geographicMap.views[0].label='全圖 & <西馬>';
  for(const view of country.geographicMap.views)view.points[0].label='<img src=x onerror=alert(1)> & "檳城"';
  const html=render(country);
  assert.doesNotMatch(html,/<script>|<img src=x|<svg onload|<b>/);
  assert.match(html,/全圖 &amp; &lt;西馬&gt;/);
  assert.match(html,/探索&lt;img src=x onerror=alert\(1\)&gt; &amp; &quot;檳城&quot;/);
  assert.match(html,/Malaysia &lt;b&gt; &amp; &#39;travel&#39;/);
  for(const label of ['x'.repeat(65),'\u0000unsafe','',42]){
    const copy=countryFixture();copy.geographicMap.views[1].points[0].label=label;
    assert.throws(()=>render(copy),/point label/);
  }
});

test('unsafe or colliding IDs fail before emitting broken controls or clip URLs',()=>{
  for(const id of ['all" onclick="alert(1)','all><script>','', '---', '__proto__','x'.repeat(65),'全圖']){
    const country=countryFixture();country.geographicMap.views[0].id=id;
    assert.throws(()=>render(country),/view id/);
  }
  const duplicate=countryFixture();duplicate.geographicMap.views[1].id='all';
  assert.throws(()=>render(duplicate),/Duplicate/);
  const country=countryFixture();country.id='malaysia" autofocus';
  assert.throws(()=>render(country),/country id/);
  const point=countryFixture();point.geographicMap.views[0].points[0].cityId='penang"';
  assert.throws(()=>render(point),/city id/);
});

test('every marker and text entry resolves to its own authorized guide path',()=>{
  for(const href of ['javascript:alert(1)','https://example.test/','//example.test/','/trip/../secret/','/trip/guides/kuala-lumpur-with-kids/','/trip/guides/penang-with-kids/?bad=1']){
    const country=countryFixture();country.geographicMap.views[0].points[0].href=href;
    assert.throws(()=>render(country),/destination|guide/);
  }
  const unknown=countryFixture();unknown.geographicMap.views[0].points[0].cityId='east-malaysia';
  assert.throws(()=>render(unknown),/Unresolved atlas guide/);
  const withoutCity=countryFixture();
  assert.throws(()=>renderApprovedCountryMap(withoutCity,{cities:[cities[1]]}),/Unresolved atlas guide/);
  const brokenPath=structuredClone(cities);brokenPath[0].path='/trip/guides/penang-with-kids/" onclick="alert(1)';
  assert.throws(()=>renderApprovedCountryMap(countryFixture(),{cities:brokenPath}),/guide path/);
  const longPath=structuredClone(cities);longPath[0].path=`/trip/guides/${'p'.repeat(513)}/`;
  assert.throws(()=>renderApprovedCountryMap(countryFixture(),{cities:longPath}),/too long/);
  const longAnchor=countryFixture();longAnchor.geographicMap.views[0].points[0].href=`${cities[0].path}#${'p'.repeat(513)}`;
  assert.throws(()=>render(longAnchor),/too long/);
});

test('invalid or unbounded geometry, views and points fail explicitly',()=>{
  for(const point of [[120,3],[100,NaN],[100,Infinity],[100],['100',3]]){
    const country=countryFixture();country.geographicMap.views[1].points[0].point=point;
    assert.throws(()=>render(country),/point/);
  }
  for(const bounds of [[-181,0,120,10],[100,-86,120,10],[120,0,100,10],[100,0,120],[100,0,120,NaN]]){
    const country=countryFixture();country.geographicMap.views[0].bounds=bounds;
    assert.throws(()=>render(country),/bounds/);
  }
  const missing=countryFixture();missing.discovery.isoNumeric='000';
  assert.throws(()=>render(missing),/geometry/);
  const many=countryFixture();many.geographicMap.views=Array.from({length:9},(_,i)=>({...structuredClone(many.geographicMap.views[0]),id:`view-${i}`}));
  assert.throws(()=>render(many),/too many/);
  const points=countryFixture();points.geographicMap.views[0].points=Array.from({length:13},()=>structuredClone(markers[0]));
  assert.throws(()=>render(points),/points/);
});

test('Norway/Svalbard and Netherlands retain their frozen HTML bytes and shared controller/CSS',()=>{
  const expected={norway:'1212e5a28bb604140eff2a4aba6bf564edbf12ba47b6aaebb943a7fd68bd75a5',netherlands:'fd57856fb965033caa0c1801f0d87b391cb235b6b9a52bb960372a6c372ae1f9'};
  for(const country of actual.countries)assert.equal(sha(renderApprovedCountryMap(country,{cities:actual.cities})),expected[country.id]);
  assert.equal(sha(readSource('trip/travel-atlas.mjs')),'d95673a9572d45e93047cdeeaecbea3ac1834dce58d845a8cdcef8738daa64e3');
  const css=readFileSync(new URL('../trip/travel-atlas-country.css',import.meta.url),'utf8');
  assert.equal(sha(css.slice(0,css.indexOf('\n/* Opt-in multi-view'))),'41a5153e104d958f2ef340d17c0646bc0c688a680607c5c0c8ff16828d40cba3');
  const norway=actual.countries.find(country=>country.id==='norway');
  const harness=controllerHarness(renderApprovedCountryMap(norway,{cities:actual.cities}));
  initTravelAtlases(harness.scope);
  harness.fire('island','click');
  assert.equal(harness.status.textContent,'目前顯示：斯瓦巴');
  assert.deepEqual(harness.views.map(view=>view.hidden),[true,true,false]);
  harness.fire('island','keydown','ArrowRight');
  assert.equal(harness.focused,'all');
});
