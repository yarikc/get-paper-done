'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const fixtureSource = path.join(repoRoot, 'tests', 'fixtures', 'messy-import-source');

function run(args, options = {}) {
  return execFileSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function runFail(args, options = {}) {
  return spawnSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function copyFixtureSource() {
  const root = tempDir('gpd-messy-import-source');
  const source = path.join(root, 'messy-source');
  fs.cpSync(fixtureSource, source, { recursive: true });
  fs.writeFileSync(path.join(source, '.hidden-local-note'), 'should be skipped');
  fs.mkdirSync(path.join(source, '.git'));
  fs.writeFileSync(path.join(source, '.git', 'config'), 'should be skipped');

  const oldTime = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  const newTime = new Date(Date.UTC(2026, 0, 2, 0, 0, 0));
  fs.utimesSync(path.join(source, 'drafts', 'old-draft.md'), oldTime, oldTime);
  fs.utimesSync(path.join(source, 'drafts', 'current-draft.md'), newTime, newTime);
  return source;
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertAbsent(paperDir, artifact) {
  assert(!fs.existsSync(path.join(paperDir, '.paper', artifact)), `${artifact} should not be generated during import`);
}

function testFixtureIsAnonymized() {
  const text = fs.readdirSync(fixtureSource, { recursive: true })
    .map((entry) => path.join(fixtureSource, entry))
    .filter((entry) => fs.statSync(entry).isFile())
    .map(read)
    .join('\n');

  for (const pattern of [
    /\/Users\//,
    /Claude CoWork/i,
    /TD-90/i,
    /Tech_Lifecycle/i,
    /Lifecycle_Framework/i,
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+,\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4}\b/,
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:Corporation|Company|Bank)\b/,
  ]) {
    assert(!pattern.test(text), `fixture should not match ${pattern}`);
  }
}

function testMessyImportPreservesButDoesNotOverInfer() {
  const source = copyFixtureSource();
  const target = tempDir('gpd-messy-import-target');
  run(['import', '--source', source, '--location', target, '--slug', 'messy-import']);
  const paperDir = path.join(target, 'messy-import');
  const meta = path.join(paperDir, '.paper');

  assert(fs.existsSync(path.join(paperDir, 'original', 'drafts', 'current-draft.md')));
  assert(fs.existsSync(path.join(paperDir, 'original', 'review', 'reader-feedback.md')));
  assert(fs.existsSync(path.join(paperDir, 'original', 'sources', 'public-control-notes.md')));
  assert(!fs.existsSync(path.join(paperDir, 'original', '.hidden-local-note')));
  assert(!fs.existsSync(path.join(paperDir, 'original', '.git', 'config')));

  assert.strictEqual(
    read(path.join(meta, 'DRAFT.md')),
    read(path.join(source, 'drafts', 'current-draft.md')),
  );

  for (const artifact of ['RESEARCH.json', 'RESEARCH.md', 'OUTLINE.md', 'FACT-CHECK.md', 'REVIEW.md']) {
    assertAbsent(paperDir, artifact);
  }

  const report = read(path.join(meta, 'IMPORT.md'));
  assert(report.includes('| drafts/current-draft.md | original/drafts/current-draft.md | draft | Preserved unchanged;'));
  assert(report.includes('| sources/public-control-notes.md | original/sources/public-control-notes.md | research | Preserved unchanged;'));
  assert(report.includes('| references/standard-summary.md | original/references/standard-summary.md | research | Preserved unchanged;'));
  assert(report.includes('| review/reader-feedback.md | original/review/reader-feedback.md | review | Preserved unchanged;'));
  assert(report.includes('| outline/outline-fragment.md | original/outline/outline-fragment.md | outline | Preserved unchanged;'));
  assert(report.includes('**Selected draft:** original/drafts/current-draft.md'));
  assert(report.includes('Highest-ranked imported draft-like file using filename cues, version cues, location, and modified time.'));
  assert(report.includes('| drafts/current-draft.md |'));
  assert(report.includes('| drafts/old-draft.md |'));
  assert(report.includes('- Multiple draft-like files found: confirm the selected canonical draft before drafting or review.'));
  assert(report.includes('Conditional note: if this imported draft is publication-sensitive'));
  assert(report.includes('Absolute local source and destination paths are intentionally omitted'));
  assert(!report.includes(source));
  assert(!report.includes(target));

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.next, '/gpd-brief');
  assert.strictEqual(status.strategyStatus, 'Revise Before Drafting');
  assert.strictEqual(status.primaryBlocker, 'thesis_weak');
  assert.deepStrictEqual(status.machineState.post_import_choices, [
    '/gpd-research',
    '/gpd-outline --lite',
    '/gpd-review --external',
  ]);

  const validation = runFail(['validate', '--paper', paperDir, '--semantic', '--json']);
  assert.strictEqual(validation.status, 1);
  const validationJson = JSON.parse(validation.stdout);
  assert(validationJson.issues.some((item) => item.id === 'semantic.standalone_source_sensitive_draft'));
}

testFixtureIsAnonymized();
testMessyImportPreservesButDoesNotOverInfer();

console.log('messy import fixture tests passed');
