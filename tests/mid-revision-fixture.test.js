'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const fixtureDir = path.join(repoRoot, 'tests', 'fixtures', 'mid-revision-routing');

function run(args) {
  return execFileSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function artifactPath(paperDir, artifact) {
  return path.join(paperDir, '.paper', artifact);
}

function touchArtifact(paperDir, artifact, secondsOffset) {
  const time = new Date(Date.UTC(2026, 0, 1, 0, 0, secondsOffset));
  fs.utimesSync(artifactPath(paperDir, artifact), time, time);
}

function copyFixture() {
  const dir = tempDir('gpd-mid-revision-fixture');
  const paperDir = path.join(dir, 'mid-revision-routing');
  fs.cpSync(fixtureDir, paperDir, { recursive: true });

  [
    'PROJECT.md',
    'PERSONA.md',
    'AUDIENCE.md',
    'BRIEF.md',
    'STRATEGY.md',
    'RESEARCH.json',
    'OUTLINE.md',
    'DRAFT.md',
    'FACT-CHECK.md',
    'REVIEW.md',
    'STATE.json',
    'STATE.md',
  ].forEach((artifact, index) => touchArtifact(paperDir, artifact, index));

  return paperDir;
}

function testMidRevisionFixtureRoutesBackToResearch() {
  const paperDir = copyFixture();
  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));

  assert.strictEqual(status.stateSource, 'STATE.json');
  assert.strictEqual(status.machineState.status, 'Research Refresh Required');
  assert.strictEqual(status.strategyStatus, 'Go');
  assert.strictEqual(status.next, '/gpd-research');
  assert(status.machineState.blocked_by.includes('fact-check source gap: avoided rework claim'));
  assert.strictEqual(status.artifacts['RESEARCH.json'], true);
  assert.strictEqual(status.artifacts['OUTLINE.md'], true);
  assert.strictEqual(status.artifacts['DRAFT.md'], true);
  assert.strictEqual(status.artifacts['FACT-CHECK.md'], true);
  assert.strictEqual(status.artifacts['REVIEW.md'], true);
}

function testMidRevisionFixtureValidatesStructurally() {
  const paperDir = copyFixture();
  const validation = JSON.parse(run(['validate', '--paper', paperDir, '--json']));

  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);
  assert.strictEqual(validation.next, '/gpd-research');
}

testMidRevisionFixtureRoutesBackToResearch();
testMidRevisionFixtureValidatesStructurally();

console.log('mid-revision fixture tests passed');
