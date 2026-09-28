import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {regions} from '../trip/new-zealand-data.mjs';
const html = readFileSync(new URL('../blog/caesar-kenting/index.html', import.meta.url), 'utf8');
test('Caesar reading navigation has one opt-in source and every section in document order', () => {
  assert.equal((html.match(/data-reading-nav/g) || []).length, 1);
  const nav = html.match(/<nav[^>]*data-reading-nav[^>]*>(.*?)<\/nav>/s)[1];
  const targets = [...nav.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(targets, ['room-guide', 'family-memory', 'superior', 'scenic', 'garden', 'poolside', 'suite', 'meals', 'around', 'offer-details', 'questions']);
  const positions = targets.map(id => html.indexOf(`id="${id}"`));
  assert.ok(positions.every((position, i) => position >= 0 && (!i || position > positions[i - 1])));
  assert.match(html, /\/blog\/reading-nav\.css\?v=/);
  assert.match(html, /defer src="\/blog\/reading-nav\.js\?v=/);
});

test('every published article loads the shared reading navigation', () => {
  const blog = new URL('../blog/', import.meta.url);
  const articles = readdirSync(blog, {withFileTypes: true}).filter(entry => entry.isDirectory() &&
    readdirSync(new URL(`${entry.name}/`, blog)).includes('index.html'));
  assert.ok(articles.length >= 15);
  for (const article of articles) {
    const page = readFileSync(new URL(`${article.name}/index.html`, blog), 'utf8');
    assert.match(page, /\/blog\/reading-nav\.css(?:\?v=[^" ]+)?/, `${article.name}: missing CSS`);
    assert.match(page, /\/blog\/reading-nav\.js(?:\?v=[^" ]+)?/, `${article.name}: missing script`);
    assert.match(page, /<div class="article-body">/, `${article.name}: no article body for chapter fallback`);
  }
});

test('mobile reading tab uses the approved compact size without the arrow', () => {
  const css = readFileSync(new URL('../blog/reading-nav.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(max-width:1199px\)[\s\S]*?\.reading-nav__tab\{width:36px;padding-left:7px;padding-right:3px;align-items:flex-start\}/);
  assert.match(css, /@media\(max-width:1199px\)[\s\S]*?\.reading-nav__chevron\{display:none\}/);
});

test('all nine New Zealand pages opt into the same reading navigation', () => {
  for (const path of ['/trip/new-zealand/',...regions.map(region=>region.route)]) {
    const page = readFileSync(new URL(`..${path}index.html`, import.meta.url),'utf8');
    assert.equal((page.match(/data-reading-nav/g)||[]).length,1,path);
    assert.match(page,/href="\/blog\/reading-nav\.css"/,path);
    assert.match(page,/defer src="\/blog\/reading-nav\.js"/,path);
    const nav = page.match(/<nav[^>]*data-reading-nav[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav,path);
    for (const [,anchor] of nav.matchAll(/href="#([^"]+)"/g)) assert.match(page,new RegExp(`id="${anchor}"`),`${path} #${anchor}`);
  }
});
