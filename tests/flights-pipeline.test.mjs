import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ConfigurationError, InputError, ProviderError } from '../flights-pipeline/src/errors.mjs';
import { normalizeIndicativeResponse } from '../flights-pipeline/src/normalize.mjs';
import {
  buildIndicativeRequest,
  buildLiveRequest,
  SkyscannerProvider,
  skyscannerPreflight,
} from '../flights-pipeline/src/providers/skyscanner.mjs';
import { normalizeQuery } from '../flights-pipeline/src/query.mjs';
import { buildScanQueries, runIndicativeScan } from '../flights-pipeline/src/scan.mjs';
import { FareStore } from '../flights-pipeline/src/store.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLE_QUERY = {
  origin: 'tpe',
  destination: 'nrt',
  outbound: '2026-10-08',
  inbound: '2026-10-12',
  adults: 1,
};

test('preflight exposes only configuration status, never a credential value', () => {
  const result = skyscannerPreflight({ SKYSCANNER_API_KEY: 'secret-value' });
  assert.equal(result.configured, true);
  assert.equal(JSON.stringify(result).includes('secret-value'), false);
});

test('provider refuses network work when secret boundary is missing', () => {
  assert.throws(() => new SkyscannerProvider({ env: {} }), ConfigurationError);
});

test('query validation rejects malformed airports and reversed dates', () => {
  assert.throws(() => normalizeQuery({ ...SAMPLE_QUERY, origin: 'Taipei' }), InputError);
  assert.throws(() => normalizeQuery({ ...SAMPLE_QUERY, inbound: '2026-10-01' }), InputError);
});

test('request builders match Skyscanner indicative and live contracts', () => {
  const indicative = buildIndicativeRequest(SAMPLE_QUERY);
  const live = buildLiveRequest(SAMPLE_QUERY);
  assert.deepEqual(indicative.query.queryLegs[0].originPlace.queryPlace, { iata: 'TPE' });
  assert.deepEqual(indicative.query.queryLegs[1].destinationPlace.queryPlace, { iata: 'TPE' });
  assert.equal(live.query.queryLegs[0].originPlaceId.iata, 'TPE');
  assert.equal(live.query.queryLegs[1].originPlaceId.iata, 'NRT');
  assert.equal(live.query.currency, 'TWD');
});

test('indicative adapter sends the key only as a request header', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ status: 'RESULT_STATUS_COMPLETE' }), { status: 200 });
  };
  const provider = new SkyscannerProvider({
    env: { SKYSCANNER_API_KEY: 'secret-value' },
    fetchImpl,
  });
  await provider.searchIndicative(SAMPLE_QUERY);
  assert.match(request.url, /flights\/indicative\/search$/);
  assert.equal(request.options.headers['x-api-key'], 'secret-value');
  assert.equal(request.options.body.includes('secret-value'), false);
});

test('provider errors classify throttling as retryable without response content leakage', async () => {
  const fetchImpl = async () => new Response('{"internal":"do-not-emit"}', { status: 429 });
  const provider = new SkyscannerProvider({
    env: { SKYSCANNER_API_KEY: 'secret-value' },
    fetchImpl,
  });
  await assert.rejects(
    () => provider.searchIndicative(SAMPLE_QUERY),
    (error) => error instanceof ProviderError && error.status === 429 && error.retryable,
  );
});

test('live provider refuses automated background use before making a request', async () => {
  let called = false;
  const provider = new SkyscannerProvider({
    env: { SKYSCANNER_API_KEY: 'secret-value' },
    fetchImpl: async () => {
      called = true;
      return new Response('{}', { status: 200 });
    },
  });
  await assert.rejects(() => provider.searchLive(SAMPLE_QUERY), InputError);
  assert.equal(called, false);
});

test('bounded scan expands configured route regions and persists each successful result', async () => {
  const fixture = JSON.parse(readFileSync(
    join(ROOT, 'tests', 'fixtures', 'flights', 'skyscanner-indicative.json'),
    'utf8',
  ));
  const queries = buildScanQueries({
    market: 'TW',
    locale: 'zh-TW',
    currency: 'TWD',
    originAirports: ['TPE', 'KHH'],
    regions: { asia: ['NRT', 'KIX'] },
  }, { ...SAMPLE_QUERY, region: 'asia', maxRequests: 3 });
  assert.equal(queries.length, 3);

  const inserted = [];
  const summary = await runIndicativeScan({
    provider: { searchIndicative: async () => fixture },
    store: { insertMany: (observations) => (inserted.push(...observations), observations.length) },
    queries,
    now: () => '2026-09-12T08:00:00.000Z',
  });
  assert.deepEqual(summary, { requested: 3, succeeded: 3, failed: 0, inserted: 3, failures: [] });
  assert.equal(inserted.length, 3);
});

test('fixture normalizes and persists one append-only fare observation', async (context) => {
  const fixture = JSON.parse(readFileSync(
    join(ROOT, 'tests', 'fixtures', 'flights', 'skyscanner-indicative.json'),
    'utf8',
  ));
  const query = normalizeQuery(SAMPLE_QUERY);
  const observations = normalizeIndicativeResponse(fixture, query, '2026-09-12T08:00:00.000Z');
  assert.equal(observations.length, 1);
  assert.equal(observations[0].priceAmount, 6688);
  assert.equal(observations[0].carrier, 'China Airlines');
  assert.equal(observations[0].freshness, 'cached_up_to_4_days');

  const directory = await mkdtemp(join(tmpdir(), 'terra-flight-store-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const store = new FareStore(join(directory, 'fares.sqlite'));
  assert.equal(store.insertMany(observations), 1);
  assert.equal(store.count(), 1);
  store.close();
});
