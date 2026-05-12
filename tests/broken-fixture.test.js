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
const issues = result.issues.map((item) => item.issue);

assert.strictEqual(result.ok, false);
assert(issues.some((item) => item.includes('BRIEF.md') && item.includes('must cite source IDs')));
assert(issues.some((item) => item.includes('planned source types missing')));
assert(issues.some((item) => item.includes('Reasoning Spine item')));
assert(issues.some((item) => item.includes('recommendation names use cases generically')));
assert(issues.some((item) => item.includes('contains repeated list-heavy paragraphs')));
assert(issues.some((item) => item.includes('Audience Conflict Table row')));
assert(issues.some((item) => item.includes('Safe-to-keep claim "FC1" has no source IDs')));
assert(issues.some((item) => item.includes('quantitative claim lacks baseline')));
assert(issues.some((item) => item.includes('precise numerical wording')));

console.log('broken fixture tests passed');
