import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {areaLabel, regions} from '../trip/new-zealand-data.mjs';
import {defaultSelectedStops, normalizeActiveDay, planCountry, planRegion, validDate} from '../trip/new-zealand-planner-model.mjs';

const findStop = (plan,id) => plan.itinerary.flatMap(day => day.stops ?? []).find(stop => stop.id === id);
const dayOf = (plan,id) => plan.itinerary.find(day => day.stops?.some(stop => stop.id === id));

test('stable area names cover every region and no raw area ID leaks to readers', () => {
  for (const region of regions) for (const stop of region.stops) {
    assert.notEqual(areaLabel(region.id,stop.area),stop.area,`${region.id}/${stop.area}`);
  }
});

test('Wellington Sunday market waits for Sunday without consuming preceding days', () => {
  const plan = planRegion('wellington',{days:3,date:'2026-10-02'});
  assert.equal(dayOf(plan,'harbour-market').date,'2026-10-04');
  assert.ok(plan.itinerary[0].stops.length);
  assert.ok(plan.itinerary[1].stops.length);
  assert.equal(findStop(plan,'te-papa').start,'10:00');
  assert.equal(findStop(plan,'wellington-zoo').start,null);
  assert.match(findStop(plan,'wellington-zoo').note,/出發日營業時間/);
});

test('Ashburton Aviation weekday times differ and unverified experiences stay untimed', () => {
  const monday = planRegion('mid-canterbury',{days:2,date:'2026-10-05',places:['aviation-museum']});
  const wednesday = planRegion('mid-canterbury',{days:2,date:'2026-10-07',places:['aviation-museum']});
  assert.equal(findStop(monday,'aviation-museum').start,'13:00');
  assert.equal(findStop(wednesday,'aviation-museum').start,'09:30');
  const booked = planRegion('mid-canterbury',{days:2,date:'2026-10-05',places:['aero-club']});
  assert.equal(findStop(booked,'aero-club').start,null);
  assert.match(findStop(booked,'aero-club').note,/確認/);
});

test('closed or seasonal activities never enter an apparently bookable day', () => {
  const christmas = planRegion('north-island',{days:3,date:'2026-12-25',places:['hamilton-zoo']});
  assert.notEqual(dayOf(christmas,'hamilton-zoo')?.date,'2026-12-25');
  const tooLate = planRegion('mid-canterbury',{days:2,date:'2026-09-28',places:['staveley']});
  assert.equal(findStop(tooLate,'staveley'),undefined);
  assert.match(tooLate.unscheduled[0].reason,/結束/);
  const winterTram = planRegion('christchurch-akaroa',{days:2,pace:'packed',date:'2027-06-01',places:['tram']});
  assert.equal(findStop(winterTram,'tram').start,'09:00');
  const special = planRegion('christchurch-akaroa',{days:2,date:'2026-12-25',places:['shamarra']});
  assert.notEqual(dayOf(special,'shamarra')?.date,'2026-12-25');
  assert.equal(findStop(special,'shamarra').start,null);
});

test('Hobbiton products are mutually exclusive and conflicts remain visible', () => {
  const plan = planRegion('north-island',{days:3,places:['hobbiton-site','hobbiton-ite']});
  assert.ok(findStop(plan,'hobbiton-site'));
  assert.equal(findStop(plan,'hobbiton-ite'),undefined);
  assert.equal(plan.unscheduled.find(item => item.id === 'hobbiton-ite')?.reason.includes('互斥'),true);
  assert.equal(findStop(plan,'hobbiton-site').duration,150);
  const alternate = planRegion('north-island',{days:3,places:['hobbiton-ite']});
  assert.equal(findStop(alternate,'hobbiton-ite').duration,240);
  assert.equal(findStop(alternate,'hobbiton-ite').checkin,20);
});

test('Akaroa Museum observes seasonal closing and ANZAC afternoon opening', () => {
  const winter = planRegion('christchurch-akaroa',{days:2,date:'2027-06-01',places:['akaroa-museum']});
  assert.equal(findStop(winter,'akaroa-museum').start,'10:30');
  const anzac = planRegion('christchurch-akaroa',{days:2,date:'2027-04-25',places:['akaroa-museum']});
  assert.equal(findStop(anzac,'akaroa-museum').start,'13:00');
});

test('regional grouping leaves time for real transfers instead of teleporting', () => {
  const otago = planRegion('otago',{days:2});
  assert.equal(dayOf(otago,'oamaru').number,dayOf(otago,'moeraki').number);
  assert.notEqual(dayOf(otago,'otago-museum').number,dayOf(otago,'oamaru').number);
  const wanaka = planRegion('wanaka-tekapo',{days:2});
  assert.equal(dayOf(wanaka,'cardrona').number,dayOf(wanaka,'wanaka-lake').number);
  assert.notEqual(dayOf(wanaka,'tekapo-lake').number,dayOf(wanaka,'wanaka-lake').number);
  assert.equal(findStop(wanaka,'cardrona').start,null);
});

test('country planner includes arrival, transfers, departure and rejects overfull picks', () => {
  const plan = planCountry({days:7,pace:'packed',regions:['north-island','otago','wanaka-tekapo']});
  assert.deepEqual(plan.included,['north-island']);
  assert.deepEqual(plan.unscheduled.map(item => item.id),['otago','wanaka-tekapo']);
  assert.equal(plan.itinerary.length,7);
  assert.equal(plan.itinerary[0].kind,'arrival');
  assert.equal(plan.itinerary.at(-1).kind,'departure');
  const longer = planCountry({days:13,pace:'packed',regions:['north-island','otago']});
  assert.equal(longer.itinerary.filter(day => day.kind === 'transfer').length,1);
  assert.ok(longer.itinerary.some(day => day.label === '跨島交通日'));
  assert.deepEqual(planCountry().included,['north-island']);
});

test('dates and default selections have bounded safe values', () => {
  assert.equal(validDate('2026-02-29'),false);
  assert.equal(validDate('2028-02-29'),true);
  assert.equal(planRegion('wellington',{date:'not-a-date'}).date,null);
  assert.ok(defaultSelectedStops('wellington').includes('harbour-market'));
  assert.deepEqual(planRegion('north-island',{places:['made-up']}).itinerary.flatMap(day => day.stops),[]);
});

test('day switcher clamps resized trips, exposes native buttons and retains a full no-script fallback', () => {
  assert.equal(normalizeActiveDay(20,7),6);
  assert.equal(normalizeActiveDay(6,2),1);
  assert.equal(normalizeActiveDay(-1,2),0);
  assert.equal(normalizeActiveDay(Number.NaN,2),0);
  const client = readFileSync(new URL('../trip/new-zealand-planner.js',import.meta.url),'utf8');
  assert.match(client,/switcher\.setAttribute\('role','group'\)/);
  assert.match(client,/button\.setAttribute\('aria-controls',item\.id\)/);
  assert.match(client,/button\.setAttribute\('aria-pressed'/);
  assert.match(client,/panel\.hidden=dayIndex!==index/);
  const staticHtml = readFileSync(new URL('../trip/new-zealand/index.html',import.meta.url),'utf8');
  const fallback = staticHtml.match(/<div class="nz-planner"[\s\S]*?<\/div><p class="nz-plan-share">/)?.[0];
  assert.ok(fallback);
  assert.match(fallback,/Day 1/);
  assert.match(fallback,/Day 7/);
});
