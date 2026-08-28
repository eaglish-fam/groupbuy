import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { auditSite } from '../scripts/site-maintenance-audit.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('canonical repository contract stays bound to eaglish.store', () => {
  const contract = JSON.parse(readFileSync(join(ROOT, 'config', 'site-maintenance-v1.json'), 'utf8'));
  assert.equal(contract.repository.url, 'https://github.com/eaglish-fam/groupbuy');
  assert.equal(contract.repository.defaultBranch, 'main');
  assert.equal(contract.deployment.provider, 'github_pages');
  assert.equal(contract.deployment.productionWriteRequiresApproval, true);
  assert.equal(contract.site.publicUrl, 'https://www.eaglish.store/');
  assert.equal(contract.owners.requirementsAndOperations, 'lydia');
  assert.equal(contract.owners.codeAndVerification, 'kira');
});

test('current website has no blocking maintenance failures', () => {
  const report = auditSite(ROOT);
  assert.equal(report.summary.blockingFailures, 0, JSON.stringify(report.findings, null, 2));
  assert.match(report.status, /^ready/);
});

test('first-use technical SEO findings are fixed', () => {
  const report = auditSite(ROOT);
  const findingIds = new Set(report.findings.map((finding) => finding.id));
  assert.equal(findingIds.has('canonical'), false);
  assert.equal(findingIds.has('search-console-token-shape'), false);
  assert.equal(findingIds.has('iframe-title'), false);
  assert.equal(report.summary.warnings, 0);
  assert.equal(report.status, 'ready');
});
