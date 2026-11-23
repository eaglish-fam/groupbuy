// Every journal article keeps the shared frame: the 鷹家選物誌 wordmark masthead, the shared article
// stylesheet, and a purchase control that can float (Hiram 2026-11-06: the CTA must float so readers
// can buy mid-article; one article must not replace the journal logo or the site frame).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = new URL('../blog/', import.meta.url);
const slugs = fs.readdirSync(base, {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name);

test('journal articles keep the shared masthead, article.css and a floating purchase control', () => {
  for (const slug of slugs) {
    const dir = new URL(`${slug}/`, base);
    const html = fs.readFileSync(new URL('index.html', dir), 'utf8');
    assert.match(html, /<div class="journal-chrome"[^>]*>\s*<header class="masthead">[\s\S]*?eaglish-journal-wordmark-v1\.svg/, `${slug}: shared wordmark masthead`);
    assert.ok(/href="\/articles\/article\.css(?:\?[^"]*)?"/.test(html), `${slug}: /articles/article.css`);
    const scripts = [html, ...fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(new URL(f, dir), 'utf8'))].join('\n');
    const shared = /src="\/articles\/(?:floating-offer|article)\.js/.test(html);
    assert.ok(shared || /position\s*:\s*fixed|FloatingOffer/.test(scripts + fs.readdirSync(dir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(new URL(f, dir), 'utf8')).join('')), `${slug}: floating purchase control`);
    if (html.includes('data-sheet-offer')) {
      assert.ok(html.includes('src="/articles/floating-offer.js"'), `${slug}: sheet offer loads floating-offer.js`);
      assert.match(html, /<section[^>]*id="offer"[^>]*class="[^"]*purchase|<section[^>]*class="[^"]*purchase[^"]*"[^>]*id="offer"/, `${slug}: offer sits in .purchase`);
    }
  }
});
