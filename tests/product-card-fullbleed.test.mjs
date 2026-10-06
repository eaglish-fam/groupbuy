import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all product-card breakpoints use full-width natural-ratio images without letterboxing',()=>{
  const css=read('design/design.css'),mobile=read('design/mobile-grid.css');
  assert.match(css,/\.product-picture\s*\{[^}]*aspect-ratio:\s*auto;[^}]*overflow:\s*hidden/s);
  assert.match(css,/\.product-picture > \.image-open\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;[^}]*padding:\s*0/s);
  assert.match(css,/\.product-picture img\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*height:\s*auto;[^}]*object-fit:\s*cover/s);
  for(const sheet of [css,mobile])for(const block of sheet.matchAll(/\.product-picture\s*\{([^}]+)\}/g))assert.doesNotMatch(block[1],/aspect-ratio:\s*4\s*\/\s*3/);
  assert.match(read('design/complete-content.css'),/\.resource-grid \.product-picture img\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css,/\.detail-photo img\s*\{[^}]*object-fit:\s*contain/s,'detail viewer still shows the complete source image');
});
test('production CSS cache versions survive homepage rebuilds',()=>{
  for(const file of ['design.css','mobile-grid.css','complete-content.css'])assert.ok(read('index.html').includes(`/design/${file}?v=20261006-fullbleed`));
  assert.ok(read('scripts/build-homepage.mjs').includes("const productMediaRelease = '20261006-fullbleed'"));
});
