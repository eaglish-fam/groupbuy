#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.eaglish.store';
const pages = [
  { path: 'blog/index.html', url: `${ORIGIN}/blog/`, type: 'Blog', phrase: '鷹家選物誌' },
  { path: 'blog/atojet/index.html', url: `${ORIGIN}/blog/atojet/`, type: 'Article', phrase: 'Atojet 濾芯蓮蓬頭' },
  { path: 'blog/wave-hummus/index.html', url: `${ORIGIN}/blog/wave-hummus/`, type: 'Article', phrase: 'Wave 鷹嘴豆泥' },
  { path: 'blog/artisan-cb301/index.html', url: `${ORIGIN}/blog/artisan-cb301/`, type: 'Article', phrase: 'ARTISAN CB301 電動清潔刷' },
];
const forbiddenPublicText = ['閱讀風格預覽', '尚未發布', '廠商情境照片', '廠商套組照片', '內部審核', '待 Hiram 核准'];

function content(path) { return readFileSync(join(ROOT, path), 'utf8'); }
function tagValue(html, tag, attribute, value, outputAttribute = 'content') {
  const tags = html.match(new RegExp(`<${tag}\\b[^>]*>`, 'gi')) || [];
  return tags.find((item) => item.match(new RegExp(`\\b${attribute}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i')))
    ?.match(new RegExp(`\\b${outputAttribute}=["']([^"']+)["']`, 'i'))?.[1] || '';
}
function jsonLd(html) {
  return [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]));
}
function types(value, found = new Set()) {
  if (Array.isArray(value)) value.forEach((item) => types(item, found));
  else if (value && typeof value === 'object') {
    if (value['@type']) found.add(value['@type']);
    Object.values(value).forEach((item) => types(item, found));
  }
  return found;
}
function localAssets(html) {
  return [...html.matchAll(/\b(?:src|href)=["'](\/[^"'#?]+)["']/gi)]
    .map((match) => match[1]).filter((path) => !path.endsWith('/'));
}

export function auditBlog() {
  const checks = [];
  const check = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
  const titles = new Set();
  const descriptions = new Set();
  const sitemap = content('sitemap.xml');

  for (const page of pages) {
    const html = content(page.path);
    const id = page.path.replaceAll('/', ':');
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1].trim() || '';
    const description = tagValue(html, 'meta', 'name', 'description');
    const canonical = tagValue(html, 'link', 'rel', 'canonical', 'href');
    const robots = tagValue(html, 'meta', 'name', 'robots');
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
    let schemas = [];
    try { schemas = jsonLd(html); } catch { /* recorded below */ }
    const schemaTypes = schemas.reduce((all, item) => types(item, all), new Set());

    check(`${id}:title`, title.length >= 20 && title.length <= 80, `Title length ${title.length}.`);
    check(`${id}:description`, description.length >= 55 && description.length <= 180, `Description length ${description.length}.`);
    check(`${id}:canonical`, canonical === page.url, `Canonical ${canonical || 'missing'}.`);
    check(`${id}:indexable`, !/noindex/i.test(robots) && /index/i.test(robots), `Robots ${robots || 'missing'}.`);
    check(`${id}:single-h1`, (html.match(/<h1\b/gi) || []).length === 1, 'Exactly one H1.');
    check(`${id}:search-phrase`, title.includes(page.phrase) && h1.includes(page.phrase), `Title and H1 include ${page.phrase}.`);
    check(`${id}:schema`, schemaTypes.has(page.type), `${page.type} structured data parses.`);
    if (page.type === 'Article') check(`${id}:breadcrumb`, schemaTypes.has('BreadcrumbList'), 'BreadcrumbList structured data parses.');
    check(`${id}:sitemap`, sitemap.includes(`<loc>${page.url}</loc>`), 'Canonical URL is in sitemap.');
    check(`${id}:consumer-copy`, forbiddenPublicText.every((text) => !html.includes(text)), 'No internal review language is visible.');
    const missing = [...new Set(localAssets(html))].filter((path) => !existsSync(join(ROOT, path.slice(1))));
    check(`${id}:local-assets`, missing.length === 0, missing.length ? `Missing ${missing.join(', ')}.` : 'Local assets resolve.');
    check(`${id}:unique-title`, !titles.has(title), 'Title is unique.');
    check(`${id}:unique-description`, !descriptions.has(description), 'Meta description is unique.');
    titles.add(title); descriptions.add(description);
  }

  const artisan = content('blog/artisan-cb301/index.html');
  check('identity:artisan-cb301', !artisan.includes('bFNLF_Vgn7k') && !artisan.includes('LM3000'), 'CB301 does not inherit the sibling leg-massager video or model.');
  check('cover:artisan-cb301', artisan.includes('/assets/artisan-cb301/blog-cover-v2.webp') && content('blog/index.html').includes('/assets/artisan-cb301/blog-cover-v2.webp'), 'CB301 uses its editorial cover on both the article and blog index.');
  const productContent = content('product-content.js');
  for (const page of pages.slice(1)) check(`catalog:${page.url}`, productContent.includes(`article:'${new URL(page.url).pathname}'`), 'Product-card article mapping exists.');

  const failures = checks.filter((item) => !item.passed);
  return {
    schema: 'eaglish.blog-release-audit/v1',
    generatedAt: new Date().toISOString(),
    status: failures.length ? 'blocked' : 'ready',
    summary: { checks: checks.length, passed: checks.length - failures.length, failures: failures.length },
    checks,
    failures,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = auditBlog();
  if (process.argv.includes('--write')) {
    const out = join(ROOT, 'reports', 'blog-release-v1.json');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`[blog-release] wrote ${relative(ROOT, out)}`);
  }
  console.log(`[blog-release] ${report.status}: ${report.summary.passed}/${report.summary.checks} checks passed`);
  for (const item of report.failures) console.log(`- ${item.id}: ${item.detail}`);
  if (report.failures.length) process.exitCode = 1;
}
