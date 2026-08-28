#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function buildSeoPerformancePlan(root = ROOT) {
  const contract = JSON.parse(readFileSync(join(root, 'config', 'seo-analytics-v1.json'), 'utf8'));
  const baseline = JSON.parse(readFileSync(join(root, 'reports', 'seo-analytics-baseline-v1.json'), 'utf8'));
  if (contract.schema !== 'eaglish.seo-analytics-contract/v1' || baseline.schema !== 'eaglish.seo-analytics-baseline/v1') throw new Error('seo_contract_invalid');
  const sourcePeriod = `截至 ${baseline.observedAt}`;
  const recommendations = [];
  const add = (item) => recommendations.push({ ...item, url: `${contract.canonicalOrigin}/`, sourcePeriod, mutationRequiresApproval: true });

  if (!baseline.candidateBranch.deployed) add({
    id: 'deploy-r2-technical-seo', title: '部署已驗證的 canonical、驗證 token 與 iframe title 修正',
    source: 'local candidate audit + production HTML', evidence: `候選 ${baseline.candidateBranch.technicalAudit}；正式站仍缺三項修正`,
    expectedImpact: '讓 canonical、Search Console 驗證與無障礙標題回到一致狀態', acceptanceMethod: '正式站重新執行 28 項 audit 且 28/28 通過',
  });
  if (!baseline.publicSite.httpWww.redirectsToHttps || !baseline.githubPages.httpsEnforced) add({
    id: 'enforce-www-https', title: '啟用 www 的 HTTPS 強制導向', source: 'GitHub Pages API + public HTTP probe',
    evidence: `Pages https_enforced=${baseline.githubPages.httpsEnforced}；HTTP 回 ${baseline.publicSite.httpWww.status}`, expectedImpact: '避免同內容同時由 HTTP 與 HTTPS 提供',
    acceptanceMethod: 'http://www.eaglish.store 只回 301/308 並導向 canonical HTTPS',
  });
  if (!baseline.publicSite.httpsApex.available) add({
    id: 'repair-apex-https', title: '修正裸網域 HTTPS 與 canonical 導向', source: 'DNS + public HTTPS probe', evidence: `裸網域 HTTPS ${baseline.publicSite.httpsApex.reason}`,
    expectedImpact: '讓輸入 eaglish.store 的訪客安全抵達 www canonical', acceptanceMethod: 'https://eaglish.store 在 5 秒內回 301/308 至 https://www.eaglish.store/',
  });
  if (baseline.connectors.searchConsole !== 'connected') add({
    id: 'connect-search-console-readonly', title: '接入 Search Console 唯讀成效', source: 'connector inventory', evidence: '目前無可呼叫的 Search Console Connector',
    expectedImpact: '取得查詢、頁面、索引與 sitemap 的實際證據', acceptanceMethod: '可讀最近 28 天查詢／頁面與 sitemap 狀態，零寫入',
  });
  if (baseline.connectors.ga4 !== 'connected') add({
    id: 'audit-and-connect-ga4-readonly', title: '先稽核再接入 GA4 唯讀資料', source: 'connector inventory', evidence: '目前無可呼叫的 GA4 Connector',
    expectedImpact: '辨識入口頁與外連導購行為是否可量測', acceptanceMethod: '確認 property／data stream／事件字典後，可讀最近 28 天流量與外連事件，零寫入',
  });
  for (const recommendation of recommendations) {
    for (const field of contract.recommendationRequiredFields) if (!(field in recommendation) || recommendation[field] === '') throw new Error(`seo_recommendation_missing:${field}`);
  }
  return {
    schema: 'eaglish.seo-performance-plan/v1', observedAt: baseline.observedAt, recommendationCount: recommendations.length,
    recommendations, externalWriteCount: 0, connectors: baseline.connectors,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(buildSeoPerformancePlan(), null, 2));
