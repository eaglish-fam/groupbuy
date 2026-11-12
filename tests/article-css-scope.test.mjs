// An article stylesheet copied from another article must be re-scoped to its own data-article-key,
// otherwise its rules (buy button, floating glass offer) silently stop applying (Hiram 2026-11-12).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('every article stylesheet targets only its own page key', () => {
  let checked = 0;
  for (const slug of readdirSync(new URL('blog/', root))) {
    const page = `blog/${slug}/index.html`;
    if (!existsSync(new URL(page, root))) continue;
    const html = read(page);
    const key = html.match(/<body[^>]*data-article-key="([^"]+)"/)?.[1];
    if (!key) continue;
    for (const [, css] of html.matchAll(new RegExp(`href="/blog/${slug}/([a-z0-9-]+\\.css)(?:\\?[^"]*)?"`, 'g'))) {
      const keys = [...read(`blog/${slug}/${css}`).matchAll(/data-article-key="([^"]+)"/g)].map((m) => m[1]);
      for (const k of keys) assert.equal(k, key, `${page}: ${css} has rules for "${k}"`);
      checked++;
    }
  }
  assert.ok(checked >= 20, `checked ${checked} article stylesheets`);
});

test('the floating Sheet offer link is frosted glass, not a bare underlined link', () => {
  const css = read('articles/article.css');
  assert.match(css, /\.purchase \.offer-bar\.is-floating \.offer-link\{[^}]*backdrop-filter:blur\(18px\)/);
  for (const [slug, file, key] of [['momax-locator', 'momax.css', 'momaxLocator'], ['kids-active-toys', 'kids-active.css', 'kidsActiveToys'], ['acer-luggage', 'acer.css', 'acerLuggage'], ['ilovekids-rotating-bookcase', 'ilovekids.css', 'ilovekidsBookcase']]) {
    const own = read(`blog/${slug}/${file}`);
    assert.match(own, new RegExp(`body\\[data-article-key="${key}"\\] \\.purchase \\.offer-bar\\.is-floating \\.offer-link\\{[^}]*rgba\\(24,61,45,\\.84\\)`), slug);
  }
});
