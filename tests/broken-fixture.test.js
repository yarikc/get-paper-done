'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const fixtureDir = path.join(repoRoot, 'tests', 'fixtures', 'broken-semantic-paper');

function run(args) {
  return spawnSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

const output = run(['validate', '--paper', fixtureDir, '--semantic', '--json']);
assert.strictEqual(output.status, 1);

const result = JSON.parse(output.stdout);
const issueIds = new Set(result.issues.map((item) => item.id));

assert.strictEqual(result.ok, false);
for (const expectedId of [
  'semantic.brief_claim_evidence_stale',
  'semantic.strategy_reasoning_spine_restatement',
  'semantic.research_source_coverage',
  'semantic.research_counterevidence_missing',
  'semantic.review_rewrite_instruction_missing',
  'semantic.recommendation_specificity',
  'semantic.prose_saturation',
  'semantic.audience_conflict_specificity',
  'semantic.fact_check_safe_source_missing',
  'semantic.quantitative_claim_missing_context',
  'semantic.quantitative_claim_weak_support',
]) {
  assert(issueIds.has(expectedId), `missing semantic issue id ${expectedId}`);
}

console.log('broken fixture tests passed');
