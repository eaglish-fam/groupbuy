import assert from 'node:assert/strict';
import test from 'node:test';
import model from '../flights/flights-model.js';

test('price history stays hidden for short samples, stale snapshots or invalid statistics', () => {
  const now=Date.parse('2026-09-13T03:00:00Z');
  const history={asOf:new Date(now).toISOString(),windows:{30:{mature:true,observedDays:26,min:5000,median:8000,points:[{date:'2026-09-12',price:5000}]}}};
  const row={history_json:JSON.stringify(history)};
  assert.equal(model.priceHistory(row,now).min,5000);
  assert.equal(model.priceHistory(row,now+86400001),null);
  assert.equal(model.priceHistory({history_json:'broken'},now),null);
  history.windows[30].observedDays=2;assert.equal(model.priceHistory({history_json:JSON.stringify(history)},now),null);
});

const now = Date.parse('2026-09-12T15:30:00Z');
const valid = {
  status: 'published', review_status: 'approved', region: '亞洲', price_twd: '10970',
  observed_at: '2026-09-12T15:04:14Z',
  expires_at: '2026-09-13T03:04:14Z', search_url: 'https://www.aviasales.com/search/example',
};

test('public fares require approval, valid expiry, usable price and a safe link', () => {
  const cases = [valid,
    {...valid, status: 'draft'}, {...valid, review_status: 'pending'},
    {...valid, expires_at: ''}, {...valid, expires_at: 'invalid'},
    {...valid, expires_at: new Date(now).toISOString()},
    {...valid, price_twd: ''}, {...valid, price_twd: '-12'},
    {...valid, search_url: 'javascript:alert(1)'},
  ];
  assert.deepEqual(model.eligibleDeals(cases, '全部', now), [valid]);
  assert.deepEqual(model.eligibleDeals(cases, '歐洲', now), []);
});

test('fares expire at the earliest source/sale/one-hour verification deadline and withdrawals fail closed',()=>{
  const checked=Date.parse(valid.observed_at);
  assert.equal(model.isFresh(valid,checked+3600000),false);
  assert.equal(model.isFresh({...valid,observed_at:''},now),false);
  assert.equal(model.isFresh({...valid,verified_at:'invalid'},now),false);
  assert.equal(model.isFresh({...valid,verified_at:new Date(now+1).toISOString()},now),false);
  assert.equal(model.isFresh({...valid,source_expires_at:new Date(now).toISOString()},now),false);
  assert.equal(model.isFresh({...valid,sale_ends_at:new Date(now-1).toISOString()},now),false);
  for(const availability_status of ['sold_out','unavailable','price_changed','withdrawn','expired'])assert.equal(model.isFresh({...valid,availability_status},now),false);
});

test('destination search respects both the published state and the selected region', () => {
  const tokyo = {status:'published',region:'亞洲',country:'日本',city:'東京',title:'Tokyo Subway Ticket'};
  const paris = {status:'published',region:'歐洲',country:'法國',city:'巴黎',title:'博物館通行證'};
  const draft = {...tokyo, status:'draft'};
  assert.deepEqual(model.matchingProducts([tokyo,paris,draft], '全部', '  TOKYO  '), [tokyo]);
  assert.deepEqual(model.matchingProducts([tokyo,paris,draft], '歐洲', '東京'), []);
  assert.deepEqual(model.matchingProducts([tokyo,paris,draft], '歐洲', '巴黎'), [paris]);
});

test('travel dates preserve their calendar day and observations show Taiwan time', () => {
  assert.equal(model.travelDate('2026-10-08', true), '2026/10/8（四）');
  assert.equal(model.travelDate('2026-02-30'), '日期待確認');
  assert.equal(model.travelDate(''), '日期待確認');
  assert.match(model.localDate('2026-09-12T18:00:00Z'), /09\/13.*02:00/);
  assert.equal(model.localDate(''), '時間未提供');
  assert.deepEqual(model.airport('nrt'), {code:'NRT',city:'東京',name:'成田'});
  assert.deepEqual(model.airport('ZZZ'), {code:'ZZZ',city:'ZZZ',name:''});
});

test('price and affiliate URLs never manufacture a zero price or unsafe partner link', () => {
  assert.equal(model.money('NT$ 10,970'), 'NT$ 10,970');
  for (const value of ['',null,undefined,'unknown',0,'-100']) assert.equal(model.money(value), '查看最新價格');
  assert.equal(model.safeUrl('https://affiliate.klook.com/redirect?a=1', ['klook.com']), 'https://affiliate.klook.com/redirect?a=1');
  assert.equal(model.safeUrl('https://klook.com.attacker.test/', ['klook.com']), '');
  assert.equal(model.safeUrl('https://fakeklook.com/', ['klook.com']), '');
});
