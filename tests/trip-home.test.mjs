import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {renderTravelHome, validateTravelHomeCatalog} from '../scripts/build-trip-home.mjs';
import {prioritizeFirstTravelImage} from '../scripts/trip-image-priority.mjs';
import {regions} from '../trip/new-zealand-data.mjs';
import {cities} from '../trip/thailand-model.mjs';
import {runInNewContext} from 'node:vm';

const clone = () => structuredClone(travelHomeCatalog);
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('travel home covers each published region with a real photo and canonical destination', () => {
  validateTravelHomeCatalog(travelHomeCatalog);
  assert.deepEqual(new Set(travelHomeCatalog.guides.filter(g => g.countryId === 'new-zealand').map(g => g.href)), new Set(regions.map(r => r.route)));
  assert.deepEqual(new Set(travelHomeCatalog.guides.filter(g => g.countryId === 'thailand').map(g => g.href)), new Set(cities.map(c => c.guide)));
  for (const item of [...travelHomeCatalog.countries, ...travelHomeCatalog.guides]) {
    assert.ok(existsSync(new URL('..' + item.href + 'index.html', import.meta.url)), item.href);
    assert.ok(existsSync(new URL('..' + item.image.src, import.meta.url)), item.image.src);
    const page = read(item.href.slice(1) + 'index.html');
    assert.ok(page.includes(`rel="canonical" href="https://www.eaglish.store${item.href}"`), item.href);
    assert.ok(item.image.alt && item.image.width > 0 && item.image.height > 0);
  }
  const html = renderTravelHome();
  for (const guide of travelHomeCatalog.guides) assert.ok(html.includes(`href="${guide.href}"`), guide.name);
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1);
  assert.match(html, /CollectionPage/);
  assert.doesNotMatch(html, /"@type":"Article"/);
});

test('a third country and guide render through the same components without production fixture data', () => {
  const catalog = clone();
  const guide = {...structuredClone(catalog.guides[0]), id:'fixture-guide', countryId:'fixture-country', name:'測試城市', href:'/trip/fixture-country/fixture-city/'};
  const country = {...structuredClone(catalog.countries[0]), id:'fixture-country', name:'測試國家', englishName:'FIXTURE COUNTRY', href:'/trip/fixture-country/', guideIds:[guide.id]};
  catalog.countries.push(country);
  catalog.guides.push(guide);
  const html = renderTravelHome(catalog);
  assert.ok(html.includes(country.name));
  assert.ok(html.includes(`href="${country.href}"`));
  assert.ok(html.includes(`href="${guide.href}"`));
  assert.ok(html.includes('fixture-country'));
  assert.doesNotMatch(read('trip/index.html'), /fixture-country|測試國家/);
});

test('invalid references fail instead of silently dropping cards or inventing destinations', () => {
  const mutations = [
    c => {c.guides[0].countryId = 'missing-country';},
    c => {c.countries[0].guideIds.push('missing-guide');},
    c => {c.guides.push(structuredClone(c.guides[0]));},
    c => {c.guides[0].suitableFor.push('missing-theme');},
    c => {c.countries[0].image.src = '/trip/assets/nonexistent-home-cover.webp';},
    c => {c.guides[0].href = 'javascript:alert(1)';},
  ];
  for (const mutate of mutations) {
    const catalog = clone();
    mutate(catalog);
    assert.throws(() => validateTravelHomeCatalog(catalog));
  }
});

test('country and guide copy is escaped and cannot inject HTML or JSON-LD', () => {
  const catalog = clone();
  catalog.countries[0].name = '<script>alert("country")</script>';
  catalog.guides[0].summary = '<img src=x onerror="alert(1)">';
  const html = renderTravelHome(catalog);
  assert.doesNotMatch(html, /<script>alert|<img src=x/);
  assert.ok(html.includes('&lt;script&gt;'));
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => JSON.parse(match[1]));
  }
});

test('first meaningful photo receives one responsive preload and each guide stays statically readable', () => {
  const html = prioritizeFirstTravelImage(renderTravelHome());
  assert.equal((html.match(/<link[^>]*rel="preload"[^>]*as="image"/g) || []).length, 1);
  assert.equal((html.match(/<img[^>]*fetchpriority="high"/g) || []).length, 1);
  for (const tag of html.matchAll(/<img[^>]*src="\/trip\/assets\/[^>]*>/g)) {
    assert.match(tag[0], /srcset="[^"]+"/);
    assert.match(tag[0], /sizes="[^"]+"/);
    assert.match(tag[0], /width="\d+"/);
    assert.match(tag[0], /height="\d+"/);
  }
  for (const guide of travelHomeCatalog.guides) {
    assert.ok(html.includes(guide.name), guide.name);
    assert.ok(html.includes(`href="${guide.href}"`), guide.href);
  }
  for (const tag of html.matchAll(/<article[^>]*data-guide-id[^>]*>/g)) assert.doesNotMatch(tag[0], /\shidden(?:\s|>)/);
});

test('progressive controller handles a new country, empty intersections, reset, and reveal focus', () => {
  const events = {};
  let focusedGuide = null;
  const country = {value:'all', selectedOptions:[{textContent:'測試國家'}], focus(){}};
  const theme = {value:'all', selectedOptions:[{textContent:'市集與美食'}]};
  const records = [...travelHomeCatalog.guides, {id:'fixture', countryId:'fixture-country', suitableFor:['nature']}];
  const cards = records.map(g => ({hidden:false, dataset:{guideId:g.id,country:g.countryId,themes:g.suitableFor.join(' ')}, querySelector(){return {focus(){focusedGuide=g.id;}};}}));
  const form = {hidden:true, elements:{country,theme}, addEventListener(type,fn){events[type]=fn;}, reset(){events.reset({preventDefault(){}});}};
  const more = {hidden:true, textContent:'', addEventListener(type,fn){events.more=fn;}};
  const reset = {addEventListener(type,fn){events.emptyReset=fn;}};
  const empty = {hidden:true};
  const status = {textContent:''};
  const nodes = {'[data-home-filters]':form,'[data-home-guides]':{querySelectorAll(){return cards;}},'[data-home-status]':status,'[data-home-empty]':empty,'[data-home-more]':more,'[data-home-reset]':reset};
  runInNewContext(read('trip/home.js'), {document:{querySelector(selector){return nodes[selector];}}});
  const visible = () => cards.filter(c => !c.hidden).map(c => c.dataset.guideId);
  assert.equal(form.hidden, false);
  assert.equal(visible().length, 6);
  country.value='fixture-country';
  events.change();
  assert.deepEqual(visible(), ['fixture']);
  theme.value='food';
  events.change();
  assert.equal(visible().length, 0);
  assert.equal(empty.hidden, false);
  assert.equal(more.hidden, true);
  events.emptyReset();
  assert.equal(country.value, 'all');
  assert.equal(theme.value, 'all');
  assert.equal(visible().length, 6);
  assert.equal(empty.hidden, true);
  events.more();
  assert.equal(visible().length, records.length);
  assert.equal(focusedGuide, records[6].id);
  assert.equal(more.hidden, true);
});
