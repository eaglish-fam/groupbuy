#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');

function text(path) {
  return readFileSync(path, 'utf8');
}

function matchContent(html, attribute, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]*${attribute}=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attribute}=["']${escaped}["'][^>]*>`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function linkHref(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const relValue = tag.match(/\brel=["']([^"']+)["']/i)?.[1] || '';
    if (!relValue.split(/\s+/).includes(rel)) continue;
    return tag.match(/\bhref=["']([^"']+)["']/i)?.[1] || null;
  }
  return null;
}

function localReferences(html) {
  const refs = [];
  const pattern = /\b(?:src|href)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    const raw = match[1].trim();
    if (!raw || /^(?:[a-z]+:|\/\/|#|\?|data:)/i.test(raw)) continue;
    const clean = raw.split(/[?#]/)[0].replace(/^\//, '');
    if (clean && !clean.endsWith('/')) refs.push(clean);
  }
  return [...new Set(refs)].sort();
}

export function auditSite(root = DEFAULT_ROOT) {
  const configPath = join(root, 'config', 'site-maintenance-v1.json');
  const config = JSON.parse(text(configPath));
  const html = text(join(root, 'index.html'));
  const robots = text(join(root, 'robots.txt'));
  const sitemap = text(join(root, 'sitemap.xml'));
  const checks = [];
  const findings = [];

  const check = (id, passed, detail, severity = 'blocking') => {
    checks.push({ id, passed: Boolean(passed), severity, detail });
    if (!passed) findings.push({
      id,
      severity,
      detail,
      action: severity === 'blocking' ? 'Fix before release.' : 'Add to Lydia maintenance backlog.',
    });
  };

  for (const path of config.requiredFiles) {
    check(`required-file:${path}`, existsSync(join(root, path)), `Required file ${path} exists.`);
  }

  check('html-lang', /<html[^>]*\blang=["']zh-TW["']/i.test(html), 'Homepage declares Traditional Chinese locale.');
  check('viewport', Boolean(matchContent(html, 'name', 'viewport')), 'Homepage includes a responsive viewport.');

  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1].trim() || '';
  check('title', title.length >= 10 && title.length <= 70, `Homepage title length is ${title.length}.`);

  const description = matchContent(html, 'name', 'description') || '';
  check('meta-description', description.length >= 70 && description.length <= 180, `Meta description length is ${description.length}.`);

  const canonical = linkHref(html, 'canonical');
  check('canonical', canonical === `${config.site.canonicalOrigin}/`, canonical ? `Canonical is ${canonical}.` : 'Homepage has no canonical link.', 'warning');
  check('open-graph-url', matchContent(html, 'property', 'og:url') === config.site.canonicalOrigin, 'Open Graph URL uses the canonical origin.');
  check('open-graph-image', /^https:\/\//.test(matchContent(html, 'property', 'og:image') || ''), 'Open Graph image is an absolute HTTPS URL.');

  const verification = matchContent(html, 'name', 'google-site-verification') || '';
  check('search-console-token-shape', Boolean(verification) && !verification.startsWith('google-site-verification='), 'Search Console verification content should contain the token only.', 'warning');

  const jsonLdBlocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let jsonLdValid = jsonLdBlocks.length > 0;
  for (const block of jsonLdBlocks) {
    try { JSON.parse(block[1]); } catch { jsonLdValid = false; }
  }
  check('structured-data', jsonLdValid, `${jsonLdBlocks.length} JSON-LD block(s) found and parsed.`);

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  check('single-h1', h1Count === 1, `Homepage contains ${h1Count} H1 element(s).`);
  check('semantic-main', /<main\b/i.test(html), 'Homepage contains a semantic main landmark.');

  const images = html.match(/<img\b[^>]*>/gi) || [];
  const missingAlt = images.filter((tag) => !/\balt=["'][^"']*["']/i.test(tag));
  check('image-alt', missingAlt.length === 0, `${missingAlt.length} of ${images.length} static image(s) lack alt text.`, 'warning');

  const iframes = html.match(/<iframe\b[^>]*>/gi) || [];
  const missingIframeTitle = iframes.filter((tag) => !/\btitle=["'][^"']+["']/i.test(tag));
  check('iframe-title', missingIframeTitle.length === 0, `${missingIframeTitle.length} of ${iframes.length} iframe(s) lack a title.`, 'warning');

  check('robots-allows-root', !/^\s*Disallow:\s*\/\s*$/im.test(robots), 'robots.txt does not block the whole site.');
  check('robots-sitemap', robots.includes(`${config.site.canonicalOrigin}/sitemap.xml`), 'robots.txt points to the canonical sitemap.');

  const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  check('sitemap-home', sitemapLocs.includes(`${config.site.canonicalOrigin}/`), 'Sitemap includes the canonical homepage.');
  check('sitemap-https', sitemapLocs.length > 0 && sitemapLocs.every((url) => url.startsWith(`${config.site.canonicalOrigin}/`)), `${sitemapLocs.length} sitemap URL(s) use the canonical HTTPS origin.`);
  check('sitemap-unique', new Set(sitemapLocs).size === sitemapLocs.length, 'Sitemap URLs are unique.');

  const missingLocalRefs = localReferences(html).filter((path) => !existsSync(join(root, path)));
  check('local-assets', missingLocalRefs.length === 0, missingLocalRefs.length ? `Missing local references: ${missingLocalRefs.join(', ')}` : 'All static homepage asset references resolve.');

  const blockingFailures = checks.filter((item) => item.severity === 'blocking' && !item.passed).length;
  const warningCount = checks.filter((item) => item.severity === 'warning' && !item.passed).length;
  return {
    schema: 'eaglish.site-maintenance-audit/v1',
    site: config.site.publicUrl,
    repository: config.repository.url,
    sourceRoot: '.',
    status: blockingFailures === 0 ? (warningCount ? 'ready_with_findings' : 'ready') : 'blocked',
    summary: {
      checks: checks.length,
      passed: checks.filter((item) => item.passed).length,
      blockingFailures,
      warnings: warningCount,
    },
    checks,
    findings,
  };
}

function main() {
  const root = DEFAULT_ROOT;
  const report = auditSite(root);
  if (process.argv.includes('--write')) {
    const outDir = join(root, 'reports');
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'site-maintenance-baseline-v1.json');
    writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`[site-maintenance] wrote ${relative(root, outPath)}`);
  }
  console.log(`[site-maintenance] ${report.status}: ${report.summary.passed}/${report.summary.checks} checks passed; ${report.summary.warnings} warning(s)`);
  for (const finding of report.findings) {
    console.log(`- ${finding.severity.toUpperCase()} ${finding.id}: ${finding.detail}`);
  }
  if (report.summary.blockingFailures > 0) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
