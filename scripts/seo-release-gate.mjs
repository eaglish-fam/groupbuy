#!/usr/bin/env node
// Read-only SEO/media release audit for the two-wave SEO work: sitemap safety,
// internal link crawlability, and per-page image contracts. Does not alter photos.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.eaglish.store';
const HOST = 'www.eaglish.store';
const RASTER_EXT = /\.(jpe?g|png|gif)$/i;
const MAX_BYTES = 350 * 1024;
const FORBIDDEN_KEYS = /^(price|coupon|checkout|stock|inventory)$/i;
const FORBIDDEN_TEXT = /\b(price|coupon|checkout|inventory)\b/i;

function push(findings, level, category, message, extra = {}) {
  findings.push({ level, category, message, ...extra });
}

function stripNonTags(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
    .replace(/<script[\s\S]*?<\/script>/gi, (m) => ' '.repeat(m.length))
    .replace(/<style[\s\S]*?<\/style>/gi, (m) => ' '.repeat(m.length));
}

function urlToFile(urlPath) {
  if (urlPath === '/') return 'index.html';
  if(extname(urlPath))return urlPath.replace(/^\//,'');
  return urlPath.replace(/^\//, '').replace(/\/$/, '') + '/index.html';
}

function resolveAssetPath(root, file, src) {
  return src.startsWith('/') ? resolve(root, src.slice(1)) : resolve(dirname(resolve(root, file)), src);
}

function auditSitemap(root, findings) {
  const sitemapPath = resolve(root, 'sitemap.xml');
  if (!existsSync(sitemapPath)) {
    push(findings, 'blocking', 'sitemap', 'sitemap.xml is missing');
    return [];
  }
  const xml = readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const pages = [];
  const seen=new Set();
  for (const loc of locs) {
    let u;
    try {
      u = new URL(loc);
    } catch {
      push(findings, 'blocking', 'sitemap', `Sitemap entry is not a valid URL: ${loc}`);
      continue;
    }
    if(seen.has(loc))push(findings,'blocking','sitemap','Duplicate sitemap URL: '+loc);seen.add(loc);
    if(u.hash||u.username||u.password||u.port)push(findings,'blocking','sitemap','Unsafe sitemap URL: '+loc);
    if (u.protocol !== 'https:') push(findings, 'blocking', 'sitemap', `Sitemap URL is not HTTPS: ${loc}`);
    if (u.hostname !== HOST) push(findings, 'blocking', 'sitemap', `Sitemap URL host is not ${HOST}: ${loc}`);
    if (u.search) push(findings, 'blocking', 'sitemap', `Sitemap URL has a query string: ${loc}`);
    if (/(^|\/)(test|design)(\/|$)/i.test(u.pathname)) push(findings, 'blocking', 'sitemap', `Sitemap URL exposes a test/design path: ${loc}`);
    const file = urlToFile(u.pathname);
    const filePath = resolve(root, file);
    if (!existsSync(filePath)) {
      push(findings, 'blocking', 'sitemap', `Sitemap document has no matching file: ${loc}`, { file });
      continue;
    }
    const html = readFileSync(filePath, 'utf8');
    const canonicalTag = (html.match(/<link\b[^>]*>/gi) || []).find((t) => /rel=["']canonical["']/i.test(t));
    const canonicalHref = canonicalTag?.match(/href=["']([^"']+)["']/i)?.[1];
    if (canonicalHref !== loc) push(findings, 'blocking', 'sitemap', `Canonical mismatch: expected ${loc}, found ${canonicalHref || 'none'}`, { file });
    if ((html.match(/<meta\b[^>]*>/gi)||[]).some(t=>/name=["'](?:robots|googlebot)["']/i.test(t)&&/content=["'][^"']*noindex/i.test(t))) push(findings, 'blocking', 'sitemap', `Page is marked noindex but listed in sitemap: ${loc}`, { file });
    pages.push({ loc, file, html });
  }
  return pages;
}

function auditLinks(root, pages, findings) {
  for (const { file, html } of pages) {
    const clean = stripNonTags(html);
    for (const m of clean.matchAll(/<a\b[^>]*href=["']([^"']*)["'][^>]*>/gi)) {
      const href = m[1];
      if (!href || /^(?:mailto|tel):/.test(href)) continue;
      let u;try{u=new URL(href.replaceAll('&amp;','&'),ORIGIN+'/'+file.replace(/index\.html$/,''));}catch{continue;}
      if(u.origin!==ORIGIN)continue;
      let path,fragment;try{path=decodeURIComponent(u.pathname);fragment=decodeURIComponent(u.hash.slice(1));}catch{push(findings,'blocking','links','Malformed link encoding',{file});continue;}
      const targetFile = urlToFile(path);
      const targetPath = resolve(root, targetFile);
      if(!targetPath.startsWith(resolve(root)+'/')){push(findings,'blocking','links','Link escapes site root',{file});continue;}
      if (!existsSync(targetPath)) {
        push(findings, 'blocking', 'links', `Broken internal link, no destination document: ${href}`, { file, index: m.index });
        continue;
      }
      if (fragment && targetFile.endsWith('.html')) {
        const targetHtml = readFileSync(targetPath, 'utf8');
        if (!new RegExp(`\\bid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(targetHtml)) {
          push(findings, 'warn', 'links', `Link fragment not found on destination page: ${href}`, { file, index: m.index });
        }
      }
    }
  }
}

function auditImages(root, pages, findings) {
  for (const { file, html } of pages) {
    const clean = stripNonTags(html);
    const isArticle = file.startsWith('blog/') && file !== 'blog/index.html';
    const blockLevel = isArticle ? 'blocking' : 'warn';
    let sawFirstImage = false;
    const mainStart=clean.search(/<main\b/i);
    for (const m of clean.matchAll(/<img\b[^>]*>/gi)) {
      const tag = m[0];
      const index = m.index;
      const attr = (name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
      const src = attr('src');
      const alt = attr('alt');
      const width = Number(attr('width'));
      const height = Number(attr('height'));
      const loading = attr('loading');
      const decorative = attr('aria-hidden') === 'true' || attr('role') === 'presentation';
      if (alt == null || (alt === '' && !decorative)) {
        push(findings, decorative ? 'warn' : blockLevel, 'images', 'Image missing meaningful alt text', { file, index });
      }
      if (!(width > 0) || !(height > 0)) {
        push(findings, blockLevel, 'images', 'Image missing positive width/height (an existing CSS-set aspect ratio does not substitute for these attributes)', { file, index });
      }
      if (!src) {
        push(findings, blockLevel, 'images', 'Image missing src', { file, index });
      } else if (!/^(?:https?:)?\/\//i.test(src)||src.startsWith(ORIGIN+'/')) {
        const local=new URL(src,ORIGIN+'/'+file).pathname;
        const assetPath = resolveAssetPath(root, file, decodeURIComponent(local));
        if(!assetPath.startsWith(resolve(root)+'/')){push(findings,blockLevel,'images','Image escapes site root',{file,index});continue;}
        if (!existsSync(assetPath)) {
          push(findings, blockLevel, 'images', `Local image source not found: ${src}`, { file, index });
        } else {
          const size = statSync(assetPath).size;
          if (RASTER_EXT.test(src)) push(findings, 'warn', 'images', `Raster image is not webp/avif: ${src}`, { file, index });
          if (size > MAX_BYTES) push(findings, 'warn', 'images', `Image exceeds 350KB (${Math.round(size / 1024)}KB): ${src}. File weight alone does not guarantee ranking; only flagged for review.`, { file, index });
        }
      }
      if (mainStart>=0&&index<mainStart)continue;
      if (!sawFirstImage) {
        sawFirstImage = true;
        if (loading === 'lazy') push(findings, 'warn', 'images', 'Hero/first image should not be lazy-loaded', { file, index });
      } else if (loading !== 'lazy' && attr('fetchpriority')!=='high' && loading!=='eager') {
        push(findings, 'warn', 'images', 'Below-fold image missing loading="lazy" (existing exceptions are warned, not blocked)', { file, index });
      }
    }
  }
}

function auditSnapshotSafety(root, findings) {
  const snapPath = resolve(root, 'config/catalog-snapshot.json');
  if (!existsSync(snapPath)) {
    push(findings, 'blocking', 'snapshot', 'config/catalog-snapshot.json is missing');
    return;
  }
  let snapshot;
  try {
    snapshot = JSON.parse(readFileSync(snapPath, 'utf8'));
  } catch {
    push(findings, 'blocking', 'snapshot', 'config/catalog-snapshot.json is not valid JSON');
    return;
  }
  if (!Array.isArray(snapshot.items) || snapshot.items.length < 5) {
    push(findings, 'blocking', 'snapshot', `Snapshot has too few public items (${snapshot.items?.length || 0})`);
  }
  for (const item of snapshot.items || []) {
    for (const key of Object.keys(item)) {
      if (FORBIDDEN_KEYS.test(key)) push(findings, 'blocking', 'snapshot', `Snapshot item serializes a disallowed operational field: ${key}`, { file: 'config/catalog-snapshot.json' });
      else if(!['id','brand','description','category','article','image'].includes(key))push(findings,'blocking','snapshot','Unexpected snapshot field: '+key);
    }
    if(item.article&&!/^\/blog\/[a-z0-9-]+\/$/.test(item.article)||item.image&&!/^\/assets\/[a-zA-Z0-9_./-]+$/.test(item.image))push(findings,'blocking','snapshot','Unsafe snapshot article/image URL');
  }
  const homepagePath = resolve(root, 'index.html');
  if (existsSync(homepagePath)) {
    const homepage = readFileSync(homepagePath, 'utf8');
    const cards=[...homepage.matchAll(/<article\b[^>]*data-snapshot-card[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
    if(cards.length!==(snapshot.items?.length||0))push(findings,'blocking','snapshot','Static card count does not match snapshot items',{file:'index.html'});
    if(cards.some(c=>/data-buy-key|data-copy-code|data-closing-date/.test(c))) push(findings, 'blocking', 'snapshot', 'Built snapshot leaks an operational action', { file: 'index.html' });
    if (homepage.includes('docs.google.com/spreadsheets')) push(findings, 'blocking', 'snapshot', 'Built homepage leaks the raw Sheet source URL', { file: 'index.html' });
  }
}

export function auditRelease(root, findings = []) {
  const pages = auditSitemap(root, findings);
  auditLinks(root, pages, findings);
  auditImages(root, pages, findings);
  auditSnapshotSafety(root, findings);
  const blocking = findings.filter((f) => f.level === 'blocking').length;
  const warnings = findings.filter((f) => f.level === 'warn').length;
  return { counts: { pages: pages.length, blocking, warnings, total: findings.length }, findings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const findings = [];
  const report = auditRelease(root, findings);
  console.log(`[seo-release-gate] pages=${report.counts.pages} blocking=${report.counts.blocking} warnings=${report.counts.warnings}`);
  for (const f of findings) {
    const where = f.file ? ` (${f.file}${f.index != null ? `#${f.index}` : ''})` : '';
    console.log(`${f.level === 'blocking' ? 'BLOCK' : 'warn '} [${f.category}] ${f.message}${where}`);
  }
  if (process.argv.includes('--write')) {
    mkdirSync(resolve(root, 'reports'), { recursive: true });
    writeFileSync(resolve(root, 'reports/seo-release-gate.json'), JSON.stringify(report, null, 2) + '\n');
  }
  if (report.counts.blocking > 0) process.exit(1);
}
