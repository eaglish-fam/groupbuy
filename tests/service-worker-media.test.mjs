import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
function harness({ response = new Response('ok'), cacheFails = false, offline = false } = {}) {
  const handlers = {};
  let writes = 0;
  vm.runInNewContext(source, {
    URL, Response,
    self: { location: { origin: 'https://www.eaglish.store' }, addEventListener: (event, fn) => { handlers[event] = fn; } },
    caches: { open: async () => ({ put: async () => { writes++; if (cacheFails) throw new Error('quota'); }, match: async () => undefined }) },
    fetch: async () => { if (offline) throw new Error('offline'); return response; },
  });
  return { handlers, writes: () => writes };
}

for (const input of [{ headers: { Range: 'bytes=0-' }, destination: '' }, { destination: 'video' }, { destination: 'audio' }]) {
  test(`media bypasses offline cache: ${JSON.stringify(input)}`, () => {
    const { handlers } = harness();
    let intercepted = false;
    handlers.fetch({ request: { url: 'https://www.eaglish.store/assets/knsh/reading-video-mobile.mp4', method: 'GET', headers: new Headers(input.headers), destination: input.destination }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false);
  });
}

for (const status of [200, 206]) {
  test(`successful HTTP ${status} survives cache failure`, async () => {
    const response = new Response('video bytes', { status });
    const h = harness({ response, cacheFails: true });
    let result;
    h.handlers.fetch({ request: new Request('https://www.eaglish.store/asset'), respondWith: promise => { result = promise; } });
    assert.equal(await result, response);
    assert.equal(h.writes(), status === 200 ? 1 : 0);
  });
}

test('ordinary offline requests retain the offline response', async () => {
  const h = harness({ offline: true });
  let result;
  h.handlers.fetch({ request: new Request('https://www.eaglish.store/page'), respondWith: promise => { result = promise; } });
  assert.equal((await result).status, 503);
});
