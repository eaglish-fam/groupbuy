import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {renderTravelHomeR24,travelHomeModel,guidePins} from '../scripts/render-travel-home-r24.mjs';
import {prioritizeFirstTravelImage} from '../scripts/trip-image-priority.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=renderTravelHomeR24(),main=html.slice(html.indexOf('<main id="main">'));
const model=travelHomeModel();

test('home has one brief H1 and the inline world map before destinations, Taiwan, films and planning',()=>{
 assert.match(main,/^<main id="main">\n<section class="home-hero" aria-labelledby="home-title">/);
 const at=id=>main.indexOf(`id="${id}"`);
 assert.ok(at('home-title')<main.indexOf('class="world-map"')&&main.indexOf('class="world-map"')<at('destinations')&&at('destinations')<at('taiwan')&&at('taiwan')<at('records')&&at('records')<at('planning'));
 assert.doesNotMatch(main.slice(0,at('destinations')),/<img\b/,'the first screen is the inline map, not a photo');
 assert.equal((html.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1);
 assert.match(html,/<h1 id="home-title">我們帶孩子走過的地方<\/h1>/);
 for(const id of ['home-title','destinations','guides','taiwan','records','planning'])assert.equal((html.match(new RegExp(`\\sid="${id}"`,'g'))||[]).length,1,id);
 // The previous globe, Taiwan place wall and country panels now live on /trip/taiwan/ and the country pages.
 assert.doesNotMatch(html,/atlas-ui-bundle|id="globe-stage"|id="atlas-config"|class="place-card"|data-country-panel=/);
});
test('the world map is a static build-time SVG with a text equivalent and no runtime map request',()=>{
 const map=html.match(/<div class="world-map" role="region" aria-label="鷹式一家去過的國家地圖" aria-describedby="world-map-text">([\s\S]*?)<\/div>/)?.[1];
 assert.ok(map);
 assert.match(map,/^<svg class="world-map-svg" viewBox="0 0 960 520"[^>]*aria-hidden="true"/);
 // Taiwan plus every visited country that is large enough at 1:110m (Singapore is a pin only).
 const shapes=(map.match(/<g class="map-visited">([\s\S]*?)<\/g>/)[1].match(/<path /g)||[]).length;
 assert.equal(shapes,1+model.countries.filter(c=>c.isoNumeric!=='702').length);
 assert.equal((map.match(/<circle cx/g)||[]).length,model.guideCount+1,'one pin per guide plus the Taiwan ring');
 assert.match(map,/<text [^>]+>家在這裡<\/text>/);
 for(const c of model.countries)for(const g of c.guides)assert.ok(guidePins[g.id],g.id);
 const text=html.match(/<p class="sr-only" id="world-map-text">([^<]+)<\/p>/)[1];
 assert.ok(text.includes(`台灣（${model.taiwan.places.length} 個地點）`));
 for(const c of model.countries)assert.ok(text.includes(`${c.name}（${c.guides.length} 份指南）`),c.name);
 // The country list beside the map is the map's interactive equivalent.
 const list=html.match(/<nav class="hero-places" aria-label="去過的國家與指南數">([\s\S]*?)<\/nav>/)[1];
 assert.match(list,/^<ul><li><a href="\/trip\/taiwan\/"><span class="place-name">台灣<\/span><span class="place-count">53 個地點<\/span><\/a><\/li>/);
 for(const c of model.countries)assert.ok(list.includes(`<a href="${c.href}"><span class="place-name">${c.name}</span><span class="place-count">${c.guides.length} 份指南</span></a>`),c.id);
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);
 for(const src of scripts)assert.match(src,/^\/(trip\/trip-home\.js|site-font-loader\.js|site-runtime\.js)\?v=[a-f0-9]+$/);
 assert.doesNotMatch(read('trip/trip-home.js'),/fetch\(|XMLHttpRequest|import\(|https?:\/\//);
});
test('one sticky header only, with tokens, focus, motion and tap-target rules in the home stylesheet',()=>{
 const css=read('trip/trip-home.css');
 assert.equal((css.match(/position:sticky/g)||[]).length,1);
 assert.match(css,/\.home-top\{position:sticky;top:0/);
 assert.doesNotMatch(css.replace(/:root\{[^}]*\}/,''),/#[0-9a-f]{3,6}\b/i,'colours come from custom properties');
 assert.match(css,/:focus-visible/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/min-height:44px/);
 assert.match(html,/<style data-site-style="\/trip\/trip-home\.css">/);
 assert.doesNotMatch(html,/<header class="home-masthead/,'the shared sticky masthead rule does not stack a second bar');
});
test('travel map labels explicitly use the isolated serif with both Taiwan glyphs',()=>{
 const css=read('trip/home.css'),rule=css.match(/\.travel-home \.atlas-component :is\(#top-levels button,[^}]+\}/)?.[0];
 assert.ok(rule);assert.match(rule,/#counties button\[data-action="country"\]/);assert.match(rule,/#breadcrumbs button/);assert.match(rule,/font-family:var\(--serif\)/);assert.match(rule,/font-synthesis:none/);
 assert.match(read('trip/heading-theme-r24.css'),/body\.travel-home,body\.cb-guide\{--serif:"Eaglish Travel Heading Serif"/);
 const glyphs=read('assets/fonts/travel-heading-glyphs-r24.txt');
 for(const char of '臺台灣泰國紐西蘭菲律賓')assert.ok(glyphs.includes(char));
});
test('map-first hidden panels and no-JS fallback cannot steal or duplicate the primary-photo preload',()=>{
 const image='<img src="/trip/assets/photo.webp" srcset="/trip/assets/photo-640.webp 640w, /trip/assets/photo-960.webp 960w" sizes="100vw" loading="lazy" fetchpriority="low">';
 const marked=image.replace('<img ','<img data-primary-travel-photo ');
 const input=`<head><link rel="icon" href="/icon.png"></head><section hidden>${image.replaceAll('photo','hidden')}</section><noscript>${image}</noscript><figure>${marked}</figure>`;
 const html=prioritizeFirstTravelImage(input);
 assert.ok(html.includes(`<noscript>${image}</noscript>`));
 assert.match(html,/<figure><img[^>]+loading="eager" fetchpriority="high">/);
 assert.equal((html.match(/rel="preload"/g)||[]).length,1);
 assert.equal((html.match(/<img[^>]+fetchpriority="high"/g)||[]).length,1);
 assert.doesNotMatch(html.match(/rel="preload"[^>]+/)[0],/hidden/);
 assert.throws(()=>prioritizeFirstTravelImage(input+marked),/multiple primary/);
 assert.equal(prioritizeFirstTravelImage(`<head><link rel="icon" href="/icon.png"></head><noscript>${image}</noscript>`),`<head><link rel="icon" href="/icon.png"></head><noscript>${image}</noscript>`);
});
