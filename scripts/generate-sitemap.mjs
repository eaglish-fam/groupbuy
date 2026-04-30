#!/usr/bin/env node
// 從 Google Sheets 拉團購資料，產出只包含 evergreen 卡片的 sitemap.xml
// 排除 short / upcoming / 已過期，避免死頁面拖累 SEO（A4 + D3）

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const SHEET_ID = '1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU';
const SITE_URL = 'https://www.eaglish.store';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const EVERGREEN_CATEGORIES = new Set(['long', 'book', 'edu', 'coupon']);

// 靜態頁（首頁 + 工具頁，原本 sitemap 就有的）
const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/toolbox.html', changefreq: 'weekly', priority: 0.8 },
  { loc: '/zosia.html', changefreq: 'monthly', priority: 0.6 },
  { loc: '/trading.html', changefreq: 'weekly', priority: 0.6 },
];

// RFC 4180-ish CSV parser（夠用就好，避免拉外部依賴）
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const [headers, ...data] = rows;
  const cleanHeaders = headers.map(h => h.trim());
  return data.map(row => {
    const obj = {};
    cleanHeaders.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
    return obj;
  });
}

// 跟 script.js 的分類邏輯保持一致
function classifyCategory(typeRaw) {
  const t = (typeRaw || '').toLowerCase();
  if (/長期|long/.test(t)) return 'long';
  if (/折扣|coupon|affiliate/.test(t)) return 'coupon';
  if (/即將|upcoming/.test(t)) return 'upcoming';
  if (/教育|公益|edu|charity/.test(t)) return 'edu';
  if (/書籍|書|book/.test(t)) return 'book';
  return 'short';
}

function parseDateSafe(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function isExpired(endDateStr) {
  if (!endDateStr) return false;
  const d = parseDateSafe(endDateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function buildSitemap(brands) {
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = STATIC_PAGES.map(p =>
    `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  const brandUrls = brands.map(brand =>
    `  <url>
    <loc>${SITE_URL}/?p=${encodeURIComponent(brand)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${brandUrls}
</urlset>
`;
}

async function main() {
  console.log(`[sitemap] fetching CSV...`);
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  if (csv.includes('<html')) throw new Error('Got HTML — Sheet 權限可能未公開');

  const objects = rowsToObjects(parseCsv(csv));

  const evergreen = objects
    .map(row => ({
      brand: (row['品牌'] || row['Brand'] || '').trim(),
      category: classifyCategory(row['類型'] || row['Type'] || ''),
      endDate: row['結束日期'] || row['EndDate'] || '',
    }))
    .filter(g => {
      if (!g.brand || g.brand.includes('---') || g.brand.includes('===')) return false;
      if (!EVERGREEN_CATEGORIES.has(g.category)) return false;  // 排除 short / upcoming
      if (isExpired(g.endDate)) return false;                   // 排除已過期
      return true;
    });

  // 同品牌 dedupe（書籍類常一品牌多列）
  const seen = new Set();
  const unique = [];
  for (const g of evergreen) {
    if (seen.has(g.brand)) continue;
    seen.add(g.brand);
    unique.push(g);
  }

  console.log(`[sitemap] ${objects.length} rows → ${unique.length} evergreen brands`);

  const sitemap = buildSitemap(unique.map(g => g.brand));
  const outPath = join(REPO_ROOT, 'sitemap.xml');
  writeFileSync(outPath, sitemap);
  console.log(`[sitemap] written to ${outPath}`);
}

main().catch(err => {
  console.error('[sitemap] failed:', err);
  process.exit(1);
});
