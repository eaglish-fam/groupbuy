import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../site-runtime.js', import.meta.url), 'utf8');

function runtime(hostname = 'www.eaglish.store') {
  const listeners = {};
  const context = {
    URL,
    location: { hostname, pathname: '/', href: `https://${hostname}/`, origin: `https://${hostname}` },
    navigator: {},
    sessionStorage: { getItem() {}, setItem() {} },
    document: {
      head: { append() {} },
      createElement() { return {}; },
      addEventListener(name, listener) { listeners[name] = listener; },
    },
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return { context, listeners };
}

test('one unified outbound event preserves product and placement dimensions', () => {
  const { context } = runtime();
  context.dataLayer.length = 0;
  const accepted = context.SiteAnalytics.outboundGroupbuy({
    productId: 'playzu',
    productName: 'Playzu',
    groupType: 'limited',
    sourceSurface: 'blog_floating_cta',
    articleSlug: 'playzu',
    destinationUrl: 'https://gbf.tw/example',
    ctaLabel: '查看當期組合優惠',
    campaignKey: '20260930',
    legacyEvent: 'click_group_from_blog',
  });
  assert.equal(accepted, true);
  const events = context.dataLayer.filter(item => item[0] === 'event');
  assert.equal(events.length, 2);
  assert.equal(events[0][1], 'outbound_groupbuy_click');
  assert.deepEqual({ ...events[0][2] }, {
    product_id: 'playzu', product_name: 'Playzu', group_type: 'limited', source_surface: 'blog_floating_cta',
    article_slug: 'playzu', vendor_key: 'gbf.tw', cta_label: '查看當期組合優惠', campaign_key: '20260930',
    destination_host: 'gbf.tw', event_category: 'conversion', transport_type: 'beacon',
  });
  assert.equal(events[1][1], 'click_group_from_blog');
});

test('incomplete conversion dimensions are rejected instead of polluting GA4', () => {
  const { context } = runtime();
  context.dataLayer.length = 0;
  assert.equal(context.SiteAnalytics.outboundGroupbuy({ productName: 'Unknown' }), false);
  assert.equal(context.dataLayer.length, 0);
});

test('preview hosts expose the API but emit no analytics', () => {
  const { context } = runtime('localhost');
  assert.equal(context.SiteAnalytics.outboundGroupbuy({ productId:'p', productName:'P', groupType:'limited', sourceSurface:'test' }), true);
  assert.equal(context.dataLayer, undefined);
});

test('public sitemap excludes convenience pages and every indexed page loads analytics', () => {
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  for (const page of ['toolbox.html', 'zosia.html', 'trading.html']) assert.doesNotMatch(sitemap, new RegExp(page));
  assert.match(readFileSync(new URL('../flights/index.html', import.meta.url), 'utf8'), /site-runtime\.js/);
});
