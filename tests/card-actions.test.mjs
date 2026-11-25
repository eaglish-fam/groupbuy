import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../design/design.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../design/design.css', import.meta.url), 'utf8');
const completeCss = fs.readFileSync(new URL('../design/complete-content.css', import.meta.url), 'utf8');
const mobileCss = fs.readFileSync(new URL('../design/mobile-grid.css', import.meta.url), 'utf8');
const releaseCss = fs.readFileSync(new URL('../release.css', import.meta.url), 'utf8');

test('product cards keep one primary purchase action; notes and details sit in a quiet link row below it', () => {
  const body = source.slice(source.indexOf('function card(p'), source.indexOf('function render()'));
  const primary = body.indexOf('class="card-primary-action"');
  const links = body.indexOf('class="card-links"');
  assert.ok(primary > -1 && links > primary, 'link row follows the primary action');
  assert.match(body, /class="card-reading"[^`]*>看選購筆記/);
  assert.match(body, /class="card-more" data-detail=/);
  // Calendar and videos moved into the detail sheet; the card no longer stacks them.
  assert.doesNotMatch(body, /class="card-calendar"/);
  assert.doesNotMatch(body, /觀看使用影片<\/button>/);
  assert.match(source, /<summary>使用影片<\/summary>/);
  assert.match(fs.readFileSync(new URL('../design/complete-content.js', import.meta.url), 'utf8'), /data-calendar-product="\$\{index\}">加入行事曆/);
  // The status (or the live countdown) is shown once, on the photo.
  assert.match(source, /function cardBadge\(p\)[\s\S]*?countdownMarkup\(p\)/);
  assert.match(completeCss, /\.product-picture:has\(\.card-badge\) \+ \.product-body \.product-meta \.status\s*\{\s*display:\s*none/);
  assert.doesNotMatch(source, /常駐好物・訂購前查看當期組合/);
});

test('secondary card actions use distinct, uncluttered styling', () => {
  assert.match(css, /\.card-reading[\s\S]*?color: var\(--orange\)/);
  assert.match(css, /\.card-primary-action \.button[\s\S]*?width: 100%/);
  assert.match(completeCss, /\.card-calendar[\s\S]*?text-decoration: none/);
  assert.match(mobileCss, /\.card-reading[\s\S]*?white-space: nowrap/);
  assert.match(mobileCss, /@media \(max-width: 700px\)[\s\S]*?\.product-bottom\s*\{[\s\S]*?grid-auto-rows:\s*max-content/);
  assert.match(mobileCss, /@media \(max-width: 700px\)[\s\S]*?\.card-actions\s*\{\s*display:\s*none/);
  assert.match(mobileCss, /@media \(max-width: 700px\)[\s\S]*?\.date-line\s*\{[\s\S]*?margin-bottom:\s*0/);
  assert.match(mobileCss, /@media \(max-width: 700px\)[\s\S]*?\.card-reading\s*\{[\s\S]*?height:\s*36px/);
  assert.match(mobileCss, /@media \(max-width: 700px\)[\s\S]*?\.card-calendar\s*\{[\s\S]*?height:\s*36px/);
  assert.match(releaseCss, /\.product-bottom \.card-reading,[\s\S]*?\.product-bottom \.card-calendar\s*\{[\s\S]*?min-height:\s*36px/);
});
