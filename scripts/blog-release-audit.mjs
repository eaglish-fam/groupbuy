#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.eaglish.store';
const articlePages = readdirSync(join(ROOT, 'blog'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, 'blog', entry.name, 'index.html')))
  .map((entry) => {
    const path = `blog/${entry.name}/index.html`;
    const html = readFileSync(join(ROOT, path), 'utf8');
    const phrase = html.match(/<span\s+class=["']seo-subject["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
    return { path, url: `${ORIGIN}/blog/${entry.name}/`, type: 'Article', phrase };
  }).sort((a, b) => a.path.localeCompare(b.path));
const pages = [{ path: 'blog/index.html', url: `${ORIGIN}/blog/`, type: 'Blog', phrase: '鷹家選物誌' }, ...articlePages];
const forbiddenPublicText = ['閱讀風格預覽', '尚未發布', '廠商情境照片', '廠商套組照片', '內部審核', '待 Hiram 核准', '依生活分類', '正在確認最新團購狀態', '團購狀態已依', '目前無法取得最新團購狀態'];

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
function articleNode(schemas) {
  const values = schemas.flatMap((item) => Array.isArray(item?.['@graph']) ? item['@graph'] : [item]);
  return values.find((item) => item?.['@type'] === 'Article') || null;
}
function significantText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}
function sitemapLastmod(xml, url) {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return xml.match(new RegExp(`<loc>${escaped}<\\/loc>\\s*<lastmod>([^<]+)<\\/lastmod>`))?.[1] || '';
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
    const article = page.type === 'Article' ? articleNode(schemas) : null;

    check(`${id}:title`, title.length >= 20 && title.length <= 80, `Title length ${title.length}.`);
    check(`${id}:description`, description.length >= 55 && description.length <= 180, `Description length ${description.length}.`);
    check(`${id}:canonical`, canonical === page.url, `Canonical ${canonical || 'missing'}.`);
    check(`${id}:indexable`, !/noindex/i.test(robots) && /index/i.test(robots), `Robots ${robots || 'missing'}.`);
    check(`${id}:single-h1`, (html.match(/<h1\b/gi) || []).length === 1, 'Exactly one H1.');
    check(`${id}:search-phrase`, title.includes(page.phrase) && h1.includes(page.phrase), `Title and H1 include ${page.phrase}.`);
    check(`${id}:schema`, schemaTypes.has(page.type), `${page.type} structured data parses.`);
    if (page.type === 'Article') {
      check(`${id}:breadcrumb`, schemaTypes.has('BreadcrumbList'), 'BreadcrumbList structured data parses.');
      check(`${id}:author`, article?.author?.['@type'] === 'Organization' && article?.author?.name === '鷹式一家' && article?.author?.url === `${ORIGIN}/`, 'Author is the Eaglish organization with a stable URL.');
      check(`${id}:publisher`, article?.publisher?.['@type'] === 'Organization' && article?.publisher?.name === '鷹式一家' && article?.publisher?.url === `${ORIGIN}/`, 'Publisher is the Eaglish organization.');
      check(`${id}:schema-url`, article?.mainEntityOfPage === canonical, 'Article mainEntityOfPage matches canonical.');
      check(`${id}:schema-dates`, /^\d{4}-\d{2}-\d{2}$/.test(article?.datePublished || '') && /^\d{4}-\d{2}-\d{2}$/.test(article?.dateModified || '') && article.dateModified >= article.datePublished, 'Published and modified dates are valid.');
      check(`${id}:sitemap-lastmod`, sitemapLastmod(sitemap, page.url) === article?.dateModified, 'Sitemap lastmod matches the significant article update date.');
      check(`${id}:schema-images`, Array.isArray(article?.image) && article.image.length > 0 && article.image.every((url) => /^https:\/\/www\.eaglish\.store\//.test(url)), 'Article images use absolute first-party URLs.');
      check(`${id}:schema-keywords`, Array.isArray(article?.keywords) && article.keywords.length >= 2, 'Article has a restrained query/topic cluster.');
      check(`${id}:schema-noise`, !schemaTypes.has('FAQPage') && !schemaTypes.has('Product'), 'No unsupported commercial FAQ or volatile Product/Offer markup.');
      check(`${id}:opening-answer`, /<section\s+class=["'][^"']*opening[^"']*["'][\s\S]*?data-answer-block[\s\S]*?<\/section>/i.test(html), 'A source-grounded direct answer is visible near the opening.');
      check(`${id}:answer-depth`, (html.match(/<details>/gi) || []).length >= 3, 'At least three visible reader questions support extractable answers.');
      check(`${id}:crawlable-offer-fallback`, /<noscript>[\s\S]*?<a\s+[^>]*href=["']\/["']/i.test(html), 'A stable crawlable fallback reaches the live catalogue without JavaScript.');
      check(`${id}:content-depth`, significantText(html).length >= 1200, 'Article has substantive consumer-facing depth.');
      const ogImage = tagValue(html, 'meta', 'property', 'og:image');
      check(`${id}:social-card`, tagValue(html, 'meta', 'name', 'twitter:card') === 'summary_large_image'
        && tagValue(html, 'meta', 'name', 'twitter:image') === ogImage
        && Boolean(tagValue(html, 'meta', 'name', 'twitter:title'))
        && Boolean(tagValue(html, 'meta', 'name', 'twitter:description')), 'Twitter/X card mirrors the Open Graph card.');
      check(`${id}:og-image-contract`, /^\d+$/.test(tagValue(html, 'meta', 'property', 'og:image:width'))
        && /^\d+$/.test(tagValue(html, 'meta', 'property', 'og:image:height'))
        && Boolean(tagValue(html, 'meta', 'property', 'og:image:alt')), 'OG image has dimensions and alt text.');
      const badImages = (html.match(/<img\b[^>]*>/gi) || []).filter((tag) => !/\baria-hidden=["']true["']/i.test(tag) && !/\balt=["'][^"']+["']/i.test(tag));
      check(`${id}:image-alt`, badImages.length === 0, 'Every non-decorative image has descriptive alt text.');
      check(`${id}:video-runtime-version`, html.includes('/product-content.js?v=20260911-video-poster') && html.includes('/product-content.css?v=20260911-video-poster'), 'Article uses the current resilient video runtime and styles.');
    }
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
  const productStyles = content('product-content.css');
  check('video:click-to-load', productContent.includes("poster.replaceWith(frameFor(v))") && productContent.includes('i.ytimg.com/vi/') && productContent.includes("src.searchParams.set('playsinline','1')"), 'YouTube uses a visible poster and a user-initiated inline player.');
  check('video:responsive-poster', productStyles.includes('.video-poster.is-vertical') && productStyles.includes('.video-play'), 'Video poster supports vertical media and an accessible play affordance.');
  const blogIndex = content('blog/index.html');
  for (const page of articlePages) {
    const pathname = new URL(page.url).pathname;
    check(`catalog:${page.url}`, productContent.includes(`article:'${pathname}'`), 'Product-card article mapping exists.');
    check(`blog-index:${page.url}`, blogIndex.includes(`href="${pathname}"`), 'Blog index links to the article.');
  }
  check('homepage:meroware', content('index.html').includes('href="/blog/meroware/"'), 'Homepage journal links to the Meroware article.');
  const meroware = content('blog/meroware/index.html');
  const merowareDescription = tagValue(meroware, 'meta', 'name', 'description');
  check('seo:meroware-intent', ['Meroware', '餐具', '水壺', '怎麼選'].every((term) => merowareDescription.includes(term)), 'Meroware meta description covers the primary choice intent.');
  check('geo:meroware-answers', meroware.includes('class="choice-map"') && (meroware.match(/<details>/g) || []).length >= 3, 'Meroware exposes a scannable choice map and direct FAQ answers.');

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
