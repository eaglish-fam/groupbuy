import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
