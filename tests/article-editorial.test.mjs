import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../blog/atojet/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../articles/article.css',import.meta.url),'utf8');
test('editorial style preserves source images and functioning offer/video hooks',()=>{
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.equal((html.match(/<img /g)||[]).length,4);
  for(const source of ['vendor-shower.webp','video-06.webp','video-12.webp','home-set.webp'])assert.ok(html.includes(source));
  for(const hook of ['data-current-offer','id="offer-status"','id="article-videos"'])assert.equal(html.split(hook).length-1,1);
  assert.equal((html.match(/<details>/g)||[]).length,4);
  assert.ok(html.includes('合作推廣內容'));
  assert.ok(html.includes('不等於水質檢測結果'));
  assert.ok(html.includes('index,follow,max-image-preview:large'));
  assert.ok(!html.includes('noindex'));
  assert.ok(html.includes('"@type":"Article"'));
  assert.ok(html.includes('"@type":"BreadcrumbList"'));
  assert.ok(html.includes('Atojet 濾芯蓮蓬頭'));
  assert.ok(html.includes('https://www.eaglish.store/blog/atojet/'));
});
test('handwriting is an accent, not the body font; motion and focus remain accessible',()=>{
  assert.match(css,/body\{[^}]*font-family:var\(--sans\)/);
  assert.match(css,/\.handwritten\{[^}]*font-family:var\(--hand\)/);
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(css.includes(':focus-visible'));
  assert.ok(!html.includes('class="steps"'));
  assert.ok(!html.includes('非 AI 生成'));
  for(const internal of ['閱讀風格預覽','尚未發布','廠商情境照片','廠商套組照片'])assert.ok(!html.includes(internal));
});
