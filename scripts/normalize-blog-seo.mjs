#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.eaglish.store';
const WRITE = process.argv.includes('--write');
const TOUCH_DATE = process.argv.includes('--touch-date');
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());

function text(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1] || '';
}

function upsertMeta(html, key, value, attributeName = 'property') {
  const matcher = new RegExp(`<meta\\s+[^>]*${attributeName}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  const tag = `<meta ${attributeName}="${key}" content="${value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">`;
  if (matcher.test(html)) return html.replace(matcher, tag);
  return html.replace(/(<script\s+type=["']application\/ld\+json["'])/i, `${tag}\n  $1`);
}

function normalize(path) {
  const absolute = resolve(ROOT, path);
  const before = readFileSync(absolute, 'utf8');
  let html = before;
  const canonical = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] || '';
  const ogImage = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i)?.[1] || '';
  const imagePath = ogImage.startsWith(ORIGIN) ? ogImage.slice(ORIGIN.length) : '';
  const matchingImage = imagePath
    ? (html.match(/<img\b[^>]*>/gi) || []).find((tag) => attribute(tag, 'src') === imagePath)
    : null;
  if (!canonical || !ogImage || !matchingImage) throw new Error(`${path}: canonical or matching OG image is missing`);

  const imageAlt = attribute(matchingImage, 'alt');
  const width = attribute(matchingImage, 'width');
  const height = attribute(matchingImage, 'height');
  if (!imageAlt || !width || !height) throw new Error(`${path}: OG image needs alt text and intrinsic dimensions`);

  html = upsertMeta(html, 'og:image:width', width);
  html = upsertMeta(html, 'og:image:height', height);
  html = upsertMeta(html, 'og:image:alt', imageAlt);
  html = upsertMeta(html, 'twitter:card', 'summary_large_image', 'name');
  html = upsertMeta(html, 'twitter:title', html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)/i)?.[1] || '', 'name');
  html = upsertMeta(html, 'twitter:description', html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)/i)?.[1] || '', 'name');
  html = upsertMeta(html, 'twitter:image', ogImage, 'name');
  html = upsertMeta(html, 'twitter:image:alt', imageAlt, 'name');

  const socialMetadataChanged = before !== html;
  html = html.replace(/(<script\s+type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/i, (all, open, raw, close) => {
    const data = JSON.parse(raw);
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    const article = graph.find((item) => item?.['@type'] === 'Article');
    if (!article) throw new Error(`${path}: Article structured data is missing`);
    const previousArticle = JSON.stringify(article);
    article.author = { '@type': 'Organization', name: '鷹式一家', url: `${ORIGIN}/` };
    article.publisher = { '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: '鷹式一家', url: `${ORIGIN}/` };
    article.isAccessibleForFree = true;
    const subject = text(html.match(/<span\s+class=["']seo-subject["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]);
    const title = text(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]).split('｜')[0];
    if (!Array.isArray(article.keywords) || article.keywords.length < 2
      || (article.keywords.length === 2 && article.keywords[0] === subject && article.keywords[1] === title)) {
      article.keywords = [...new Set([subject, `${subject} 怎麼選`].filter(Boolean))];
    }
    article.mainEntityOfPage = canonical;
    if (TOUCH_DATE && (socialMetadataChanged || JSON.stringify(article) !== previousArticle)) article.dateModified = TODAY;
    return `${open}${JSON.stringify(data)}${close}`;
  });

  if (WRITE) writeFileSync(absolute, html);
  return before === html;
}

const articles = readdirSync(resolve(ROOT, 'blog'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(ROOT, 'blog', entry.name, 'index.html')))
  .map((entry) => `blog/${entry.name}/index.html`)
  .sort();
const unchanged = articles.filter(normalize).length;
console.log(`[blog-seo] ${WRITE ? 'normalized' : 'checked'} ${articles.length} articles; ${unchanged} already current`);
if (!WRITE && unchanged !== articles.length) process.exitCode = 1;
