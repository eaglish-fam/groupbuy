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

test('known technical SEO findings stay visible until fixed', () => {
  const report = auditSite(ROOT);
  const findingIds = new Set(report.findings.map((finding) => finding.id));
  assert.ok(findingIds.has('canonical'));
  assert.ok(findingIds.has('search-console-token-shape'));
  assert.ok(findingIds.has('iframe-title'));
});
