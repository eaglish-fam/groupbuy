import test from 'node:test';
import assert from 'node:assert/strict';
import { auditBlog } from '../scripts/blog-release-audit.mjs';

test('production blog release contract passes', () => {
  const report = auditBlog();
  assert.equal(report.status, 'ready', JSON.stringify(report.failures, null, 2));
  assert.equal(report.summary.failures, 0);
});
