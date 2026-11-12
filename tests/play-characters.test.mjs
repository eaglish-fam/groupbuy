// GB-028: 角色卡體驗「鷹家日常圖鑑」（/everyday/，準上線：網址可開，但網站沒有入口）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
require('../everyday/characters.js');
const P = globalThis.PlayCharacters;
const snapshotBrands = new Set(JSON.parse(read('config/catalog-snapshot.json')).items.map((i) => i.brand));

test('every product a character or the card builder mentions is a brand in the catalogue snapshot', () => {
  const used = new Set();
  for (const c of P.characters) for (const s of c.day) for (const b of s.options) used.add(b);
  for (const s of Object.values(P.sceneLibrary)) for (const b of [...s.options, ...s.alts]) used.add(b);
  for (const c of P.characters) for (const s of c.day) for (const b of s.alts) used.add(b);
  const missing = [...used].filter((b) => !snapshotBrands.has(b));
  assert.deepEqual(missing, []);
  assert.ok(used.size >= 20);
});

test('stories only use permanent group buys, so the always-on page never points at an expired campaign', () => {
  // Hiram 11/08：「都用常駐團購來寫。因為這是要常駐放的嘛，用限時團購可能就會失效」
  const permanent = new Set(P.permanentBrands);
  assert.deepEqual(Object.values(P.brands).filter((b) => !permanent.has(b)), []);
  const used = new Set();
  for (const c of P.characters) for (const s of c.day) for (const b of [...s.options, ...s.alts]) used.add(b);
  for (const s of Object.values(P.sceneLibrary)) for (const b of [...s.options, ...s.alts]) used.add(b);
  assert.deepEqual([...used].filter((b) => !permanent.has(b)), []);
  for (const b of permanent) assert.ok(snapshotBrands.has(b), `${b} is not in the catalogue snapshot`);
});

test('characters are complete, unique and mostly women as Hiram described the audience', () => {
  const ids = P.characters.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of P.characters) {
    for (const k of ['name', 'nick', 'role', 'place', 'tagline', 'goal', 'goalShort', 'story', 'color']) assert.ok(c[k], `${c.id}.${k}`);
    assert.match(c.gender, /^[fm]$/);
    assert.ok(Number.isInteger(c.age) && c.age >= 18);
    assert.ok(c.day.length >= 4, `${c.id} needs a day`);
    for (const s of c.day) {
      for (const k of ['time', 'title', 'text', 'need', 'reaction']) assert.ok(s[k], `${c.id} ${s.title} ${k}`);
      assert.ok(s.options.length >= 1 && s.options.length <= 3);
    }
    for (const g of c.groups) assert.ok(P.groups.some((x) => x.id === g), `${c.id} group ${g}`);
  }
  const women = P.characters.filter((c) => c.gender === 'f').length / P.characters.length;
  assert.ok(women >= 0.7, `women share ${women}`);
  assert.ok(P.characters.some((c) => c.gender === 'm'), 'at least one father');
});

test('the page is not indexed, not in the sitemap, and linked only from the homepage', async () => {
  const page = read('everyday/index.html');
  assert.match(page, /<meta name="robots" content="noindex,follow" \/>/);
  assert.doesNotMatch(read('sitemap.xml'), /\/everyday\//);
  // Hiram 11/04：先準上線，只有知道網址的人進得來，所以網站任何地方都不放連結。
  // Hiram 11/10：首頁引導可以導向日常；11/12：「鷹家日常…看放哪裡讓它更明顯一點」→ 首頁選單＋分類下方橫幅＋引導。
  // 入口只在首頁；其他頁仍不放，也仍然 noindex、不進 sitemap。
  const {execFileSync} = await import('node:child_process');
  const linked = execFileSync('git', ['grep', '-l', '-E', 'href="/everyday/|eaglish\\.store/everyday', '--', '*.html', '*.xml', '*.txt', '*.json'], {cwd: new URL('.', root), encoding: 'utf8'}).trim().split('\n').filter((f) => f && !f.startsWith('everyday/'));
  assert.deepEqual(linked.sort(), ['design/index.html', 'index.html']);
  for (const file of linked) {
    const html = read(file);
    assert.equal((html.match(/href="\/everyday\/"/g) || []).length, 3, `${file}: menu, banner, guide`);
    assert.match(html.match(/<dialog id="welcome-guide"[\s\S]*?<\/dialog>/)[0], /href="\/everyday\/"/, file);
    assert.match(html, /<nav class="content-nav"[^>]*>[\s\S]*?<a class="nav-everyday" href="\/everyday\/">鷹家日常<\/a>/, file);
    assert.match(html, /<a class="everyday-banner wrap" href="\/everyday\/"/, file);
  }
  assert.ok(page.indexOf('/design/catalog-core.js') < page.indexOf('/everyday/play.js'));
  assert.ok(page.indexOf('/everyday/characters.js') < page.indexOf('/everyday/play.js'));
});

test('the page only offers a buy link for open campaigns and keeps progress on the device', () => {
  const js = read('everyday/play.js');
  assert.match(js, /url: p\.status\.key === "open" \? p\.url : ""/);
  assert.match(js, /localStorage\.setItem\(STORE/);
  assert.doesNotMatch(js, /fetch\([^)]*(?:POST|method)/i, 'no data is sent anywhere');
});

test('every scene offers alternatives or a skip, and the builder maps every choice to a real scene', () => {
  const js = read('everyday/play.js');
  assert.match(js, /data-skip=/, 'a scene can be skipped (這個不需要)');
  assert.match(js, /data-toggle=/, 'a scene allows picking several products');
  assert.match(js, /data-confirm=/, 'picks are confirmed together');
  assert.match(read('everyday/index.html'), /id="cart-fab"/, 'floating shopping-list button');
  assert.match(js, /data-swap=/, 'a scene can show other products (換一個看看)');
  assert.match(js, /name="pack"/, 'the day ends with a pack list the player can untick');
  const B = P.builder;
  for (const x of [...B.family, ...B.goals, ...B.worries]) if (x.scene) assert.ok(P.sceneLibrary[x.scene], `${x.id} -> ${x.scene}`);
  for (const g of B.goals) assert.ok(g.scene && g.title && g.line, g.id);
  assert.ok(P.extraAvatars.length >= P.characters.length / 2, 'preset to extra avatars between 1:1 and 2:1');
});

test('the product gallery is generated from published articles and points at real files', async () => {
  const {buildPlayMedia} = await import('../scripts/build-play-media.mjs');
  const fresh = buildPlayMedia();
  assert.deepEqual(JSON.parse(read('everyday/product-media.json')), fresh, 'run npm run build:play');
  const {existsSync} = await import('node:fs');
  for (const [brand, list] of Object.entries(fresh.products)) {
    assert.ok(list.length >= 1 && list.length <= 8, brand);
    for (const m of list) assert.ok(existsSync(new URL('.' + m.src, root)), m.src);
  }
  assert.ok(fresh.products['MiToy米積木'].length >= 3);
  // 封面與商品卡是設計過的排版圖：只有文章沒有內文照片時才當退路，且不會和內文照片同時出現。
  for (const [brand, list] of Object.entries(fresh.products)) {
    if (list.length > 1) for (const m of list) assert.doesNotMatch(m.src, /cover|product-card/i, `${brand}: ${m.src}`);
  }
});

test('narration audio exists for every preset line and matches the current story text', async () => {
  const {lines, textHash} = await import('../scripts/build-play-voice.mjs');
  const manifest = JSON.parse(read('everyday/voice-manifest.json'));
  const {existsSync, statSync} = await import('node:fs');
  // 文字改了、還沒重錄的段落要明列在 voice-pending.json（頁面不播放）；清單裡不能有其實已經相符的段落。
  const pending = new Set(JSON.parse(read('everyday/voice-pending.json')).keys);
  for (const c of P.characters) for (const l of lines(c)) {
    const it = manifest.items[l.key];
    if (pending.has(l.key)) {
      assert.ok(!it || it.hash !== textHash(l.text), `${l.key} already matches; remove it from voice-pending.json`);
      pending.delete(l.key);
      continue;
    }
    assert.ok(it, `missing audio ${l.key}; run node scripts/build-play-voice.mjs`);
    assert.equal(it.hash, textHash(l.text), `${l.key} text changed; re-run the voice build`);
    assert.equal(it.text, l.text);
    assert.ok(existsSync(new URL('.' + it.file, root)) && statSync(new URL('.' + it.file, root)).size > 2000, it.file);
  }
  assert.deepEqual([...pending], [], 'voice-pending.json lists lines that no longer exist');
  const live = new Set(P.characters.flatMap((c) => lines(c).map((l) => l.key)));
  assert.deepEqual(Object.keys(manifest.items).filter((k) => !live.has(k)), [], 'audio left over for lines that were removed');
  for (const e of manifest.ledger) assert.equal(e.match, true, 'VoAI usage drop must equal the quota headers');
  assert.doesNotMatch(read('scripts/build-play-voice.mjs'), /x-api-key: (?!proxy)/, 'no real key in the repo');
  assert.match(read('everyday/play.js'), /語音由 AI（VoAI）生成/, 'the page discloses AI voice (VoAI EULA 2.4)');
});

test('names the visitor types stay on the device and never reach the voice build', () => {
  const voice = read('scripts/build-play-voice.mjs');
  assert.doesNotMatch(voice, /localStorage|state\.me|kidName|petName/);
  const js = read('everyday/play.js');
  assert.match(js, /\{kid\}|replaceAll\("\{kid\}"/);
  assert.doesNotMatch(js, /fetch\([^)]*voai/i, 'the page never calls VoAI');
  for (const sc of Object.values(P.sceneLibrary)) if (/\{kid\}/.test(sc.text)) assert.ok(Array.isArray(sc.kid) && sc.kid.length, sc.title);
});

test('family and neighbours on the cards are real characters with real portraits', async () => {
  const {existsSync, statSync} = await import('node:fs');
  for (const [id, p] of Object.entries(P.cast)) {
    for (const k of ['name', 'role', 'note', 'home', 'art']) assert.ok(p[k], `${id}.${k}`);
    assert.match(p.art, /^\/assets\/play\/characters\/cast\/[a-z0-9-]+\.webp$/, id);
    const f = new URL('.' + p.art, root);
    assert.ok(existsSync(f) && statSync(f).size > 2000 && statSync(f).size < 60000, p.art);
  }
  for (const [lead, list] of Object.entries(P.people)) {
    assert.ok(P.characters.some((c) => c.id === lead), lead);
    for (const [id] of list) assert.ok(P.cast[id] || P.characters.some((c) => c.id === id), `${lead} -> ${id}`);
  }
  // 年齡要和設定書一致：詩涵 35、佩珊 30（Hiram 11/04）。
  assert.equal(P.characters.find((c) => c.id === 'shihan').age, 35);
  assert.equal(P.characters.find((c) => c.id === 'peishan').age, 30);
  assert.match(read('everyday/play.js'), /startsWith\(`\$\{c\.name\}，\$\{c\.age\}歲`\)/, 'an intro recorded with an old age is not played');
});

test('character illustrations, where set, are real files in the repo', async () => {
  const {existsSync, statSync} = await import('node:fs');
  for (const c of [...P.characters, ...P.extraAvatars]) {
    if (!c.art) continue;
    assert.match(c.art, /^\/assets\/play\/characters\/(me\/)?[a-z0-9-]+\.webp$/, c.id);
    const f = new URL('.' + c.art, root);
    assert.ok(existsSync(f) && statSync(f).size > 5000 && statSync(f).size < 300000, c.art);
  }
});

test('「建立我的角色」 avatars are 日常里 characters in the same style, never the old watercolor set', () => {
  // Hiram 11/12：「可以直接用裡面的角色，不一定是要另外用一個水彩風格，然後跟後面的角色差太多了。」
  const leads = new Set(P.characters.map((c) => c.id));
  assert.equal(P.extraAvatars.length, 8);
  for (const a of P.extraAvatars) {
    assert.match(a.art, /^\/assets\/play\/characters\/me\/[a-z]+\.webp$/, a.id);
    const who = a.art.match(/me\/([a-z]+)\.webp/)[1];
    assert.ok(!leads.has(who), `${a.id}: a supporting character, not a lead (${who})`);
    assert.ok(existsSync(new URL(a.art.slice(1), root)), a.art);
  }
  assert.deepEqual(P.extraAvatars.map((a) => a.id), ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'], 'ids kept so saved picks still work');
  assert.ok(!existsSync(new URL('assets/play/characters/a1.webp', root)), 'watercolor set removed');
});
