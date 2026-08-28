import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSeoPerformancePlan } from '../scripts/seo-performance-plan.mjs';

test('SEO recommendations remain evidence-bound and non-executable', () => {
  const plan = buildSeoPerformancePlan();
  assert.equal(plan.externalWriteCount, 0);
  assert.equal(plan.connectors.searchConsole, 'not_connected');
  assert.equal(plan.connectors.ga4, 'not_connected');
  assert.deepEqual(new Set(plan.recommendations.map(({ id }) => id)), new Set([
    'deploy-r2-technical-seo', 'enforce-www-https', 'repair-apex-https', 'connect-search-console-readonly', 'audit-and-connect-ga4-readonly',
  ]));
  for (const item of plan.recommendations) {
    assert.equal(item.mutationRequiresApproval, true);
    assert.match(item.url, /^https:\/\/www\.eaglish\.store\/$/);
    assert.ok(item.source && item.sourcePeriod && item.evidence && item.expectedImpact && item.acceptanceMethod);
  }
});
