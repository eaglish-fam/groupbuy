import test from 'node:test';
import assert from 'node:assert/strict';
import { auditBlog } from '../scripts/blog-release-audit.mjs';

test('blog release contract checks published pages and explicit unpublished knowledge candidates', () => {
  const report = auditBlog();
  assert.equal(report.status, report.summary.unpublishedKnowledge ? 'candidate_ready' : 'ready', JSON.stringify(report.failures, null, 2));
  assert.equal(report.summary.failures, 0);
});
