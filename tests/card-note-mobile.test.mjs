import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = readFileSync(join(ROOT, 'script.js'), 'utf8');
const styles = readFileSync(join(ROOT, 'style.css'), 'utf8');

test('mobile card notes expose an accessible expand and collapse control', () => {
  assert.match(script, /function renderCardNote\(note\)/);
  assert.match(script, /aria-expanded="false"/);
  assert.match(script, /onclick="toggleCardNote\(event\)"/);
  assert.match(script, /nextExpanded \? '收合說明' : '展開完整說明'/);
  assert.match(script, /window\.toggleCardNote = toggleCardNote/);
});

test('mobile card notes can escape the generic paragraph clamp', () => {
  assert.match(styles, /\.masonry-card-content \.card-note__text/);
  assert.match(styles, /\.card-note\.is-expanded \.card-note__text/);
  assert.match(styles, /-webkit-line-clamp: unset/);
  assert.match(styles, /\.card-note__toggle[\s\S]*min-height: 44px/);
});
