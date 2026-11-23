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
test('Brand-prefix local images are not followed by the private Sheet Drive image', async () => {
  const {createRequire} = await import('node:module');
  const core = createRequire(import.meta.url)('../design/catalog-core.js');
  const drive = 'https://drive.google.com/file/d/1o2jWiE_OdvhH1_3PMT9enmomngcckAmB/view?usp=drive_link';
  const [p] = core.normalize([{品牌:'加拿大 Jan & Jul 秋冬保暖系列',商品描述:'外套',連結:'https://gbf.tw/iyoer',類型:'短期',開團日期:'2026-11-16',結束日期:'2026-12-07',image:drive}]);
  assert.deepEqual(p.images, ['/assets/jan-jul/product-card.webp']);
  const [q] = core.normalize([{品牌:'加拿大 Jan & Jul 秋冬保暖系列',連結:'https://gbf.tw/iyoer',類型:'短期',image:drive,附加圖片:'https://www.eaglish.store/assets/jan-jul/product-card-960.webp'}]);
  assert.deepEqual(q.images, ['/assets/jan-jul/product-card.webp','/assets/jan-jul/product-card-960.webp'], 'extra images still show');
  const [r] = core.normalize([{品牌:'其他品牌',連結:'https://example.com',類型:'長期',image:drive}]);
  assert.deepEqual(r.images, ['https://lh3.googleusercontent.com/d/1o2jWiE_OdvhH1_3PMT9enmomngcckAmB=w1000'], 'brands without a local image keep the Sheet image');
});
