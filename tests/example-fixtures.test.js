'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const examplesRoot = path.join(repoRoot, 'examples');
const dataProductsExampleDir = path.join(examplesRoot, 'data-products-ai-scaling');

function run(args, options = {}) {
  return execFileSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function normalizeWorkflowMtimes(paperDir) {
  const base = new Date('2026-05-11T12:00:00.000Z').getTime();
  const orderedArtifacts = [
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
    'exports/FINAL.md',
    'STATE.json',
    'STATE.md',
  ];

  orderedArtifacts.forEach((artifact, index) => {
    const artifactPath = path.join(paperDir, '.paper', artifact);
    if (!fs.existsSync(artifactPath)) return;
    const time = new Date(base + index * 1000);
    fs.utimesSync(artifactPath, time, time);
  });
}

function examplePaperDirs() {
  return fs.readdirSync(examplesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(examplesRoot, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, '.paper')));
}

function testExamplesValidateCleanly() {
  for (const exampleDir of examplePaperDirs()) {
    const validation = JSON.parse(run(['validate', '--paper', exampleDir, '--semantic', '--json']));
    assert.strictEqual(validation.ok, true, `${exampleDir} should validate`);
    assert.deepStrictEqual(validation.issues, [], `${exampleDir} should not have semantic warnings`);
  }
}

function testExamplesRouteToProgressAfterNormalizedCheckout() {
  for (const exampleDir of examplePaperDirs()) {
    const dir = tempDir('gpd-example-fixture');
    const copiedExample = path.join(dir, path.basename(exampleDir));
    fs.cpSync(exampleDir, copiedExample, { recursive: true });
    normalizeWorkflowMtimes(copiedExample);

    const status = JSON.parse(run(['status', '--paper', copiedExample, '--json']));
    assert.strictEqual(status.next, '/gpd-progress', `${exampleDir} should route to progress`);
  }
}

function testDataProductsExampleHasNoTrialOnlyArtifacts() {
  assert(!fs.existsSync(path.join(dataProductsExampleDir, '.paper', 'FRICTION-LOG.md')));

  const final = fs.readFileSync(path.join(dataProductsExampleDir, '.paper', 'exports', 'FINAL.md'), 'utf8');
  for (const forbidden of [
    '## Internal',
    '## Draft',
    '## Section Intent',
    '**Drafting mode:**',
    '[NEEDS EVIDENCE:',
    '[AUTHOR DECISION:',
    '[STRUCTURE ISSUE:',
  ]) {
    assert(!final.includes(forbidden), forbidden);
  }

  const projectFiles = [
    'PROJECT.md',
    'BRIEF.md',
    'STRATEGY.md',
    'RESEARCH.md',
    'OUTLINE.md',
    'DRAFT.md',
    'FACT-CHECK.md',
  ].map((artifact) => fs.readFileSync(path.join(dataProductsExampleDir, '.paper', artifact), 'utf8')).join('\n');

  for (const forbidden of [
    'diagnostic trial',
    'Semantic validation refresh',
    'Stage 1 diagnostic',
    'gpd-paper-trials',
  ]) {
    assert(!projectFiles.includes(forbidden), forbidden);
  }
}

function testWeeklyPlatformUpdateKeepsLiteShape() {
  const exampleDir = path.join(examplesRoot, 'weekly-platform-update');
  assert(fs.existsSync(path.join(exampleDir, '.paper')));
  assert(!fs.existsSync(path.join(exampleDir, '.paper', 'RESEARCH.json')));
  assert(!fs.existsSync(path.join(exampleDir, '.paper', 'RESEARCH.md')));
  assert(!fs.existsSync(path.join(exampleDir, '.paper', 'FACT-CHECK.md')));

  const validation = JSON.parse(run(['validate', '--paper', exampleDir, '--semantic', '--json']));
  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);

  const config = JSON.parse(fs.readFileSync(path.join(exampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'lite');
  assert.strictEqual(config.research.require_source_table, false);
  assert.strictEqual(config.review.fact_check, false);
}

testExamplesValidateCleanly();
testExamplesRouteToProgressAfterNormalizedCheckout();
testDataProductsExampleHasNoTrialOnlyArtifacts();
testWeeklyPlatformUpdateKeepsLiteShape();

console.log('example fixture tests passed');
