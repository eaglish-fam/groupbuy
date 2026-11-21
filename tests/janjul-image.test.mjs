// GB-064：Jan & Jul 秋冬保暖系列的商品卡用站內圖，不依賴 Drive 分享；夏季防曬那一列不套用。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, statSync} from 'node:fs';
import vm from 'node:vm';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('Jan & Jul autumn/winter cards use the local cropped photo', () => {
  const core = read('design/catalog-core.js');
  const list = core.match(/const BRAND_IMAGES = (\[[\s\S]*?\]);/)[1];
  const images = vm.runInNewContext(list);
  const pick = (brand) => images.find((x) => brand.startsWith(x.prefix))?.image || '';
  assert.equal(pick('加拿大 Jan & Jul 秋冬保暖系列'), '/assets/jan-jul/product-card.webp');
  assert.equal(pick('Jan & Jul 秋冬保暖系列'), '/assets/jan-jul/product-card.webp');
  assert.equal(pick('加拿大 Jan & Jul 夏季防曬系列'), '');
  for (const f of ['product-card.webp', 'product-card-480.webp', 'product-card-960.webp']) {
    const u = new URL('../assets/jan-jul/' + f, import.meta.url);
    assert.ok(existsSync(u) && statSync(u).size > 5000, f);
  }
  assert.ok(!existsSync(new URL('../assets/jan-jul/beach-1200x630.jpg', import.meta.url)));
});
