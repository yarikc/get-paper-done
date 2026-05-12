'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const fixtureDir = path.join(repoRoot, 'tests', 'fixtures', 'failed-strategy-gate');

function run(args) {
  return execFileSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function runFail(args) {
  return spawnSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function assertAbsent(artifact) {
  assert(
    !fs.existsSync(path.join(fixtureDir, '.paper', artifact)),
    `${artifact} should be absent in the blocked strategy fixture`,
  );
}

function testBlockedFixtureRoutesBackToBrief() {
  const status = JSON.parse(run(['status', '--paper', fixtureDir, '--json']));

  assert.strictEqual(status.stateSource, 'STATE.json');
  assert.strictEqual(status.strategyStatus, 'Revise Before Drafting');
  assert.strictEqual(status.primaryBlocker, 'thesis_weak');
  assert.strictEqual(status.next, '/gpd-brief');
  assert.strictEqual(status.artifacts['RESEARCH.json'], false);
  assert.strictEqual(status.artifacts['OUTLINE.md'], false);
  assert.strictEqual(status.artifacts['DRAFT.md'], false);
}

function testBlockedFixtureFailsValidationClearly() {
  const validation = runFail(['validate', '--paper', fixtureDir]);

  assert.strictEqual(validation.status, 1);
  assert(validation.stdout.includes('Strategy blocks downstream work: thesis_weak'));
  assert(validation.stdout.includes('next: /gpd-brief'));
}

function testBlockedFixtureSchemaIsOtherwiseValid() {
  const output = runFail(['validate', '--paper', fixtureDir, '--json']);
  const validation = JSON.parse(output.stdout);
  const issues = validation.issues.map((item) => item.issue);

  assert.strictEqual(output.status, 1);
  assert.strictEqual(validation.ok, false);
  assert.deepStrictEqual(issues, ['Strategy blocks downstream work: thesis_weak']);
}

assertAbsent('RESEARCH.json');
assertAbsent('OUTLINE.md');
assertAbsent('DRAFT.md');
assertAbsent('FACT-CHECK.md');
assertAbsent('REVIEW.md');

testBlockedFixtureRoutesBackToBrief();
testBlockedFixtureFailsValidationClearly();
testBlockedFixtureSchemaIsOtherwiseValid();

console.log('failed strategy fixture tests passed');
