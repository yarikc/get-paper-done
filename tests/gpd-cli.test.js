'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');

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

function findFiles(dir, predicate, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findFiles(full, predicate, results);
    else if (entry.isFile() && predicate(full)) results.push(full);
  }
  return results;
}

function testInstallerInstallDoctorRewriteAndBackup() {
  const target = tempDir('gpd-install-test');

  run(['install', 'codex', '--target', target]);

  const commandFile = path.join(target, 'commands', 'gpd', 'new-paper.md');
  assert(fs.existsSync(commandFile));
  const commandContent = fs.readFileSync(commandFile, 'utf8');
  assert(commandContent.includes(`@${target}/get-paper-done/workflows/new-paper.md`));
  assert(!commandContent.includes('@{{GPD_RUNTIME_ROOT}}'));

  const doctor = run(['doctor', 'codex', '--target', target]);
  assert(doctor.includes('status: ok'));

  fs.writeFileSync(commandFile, 'local edit before update\n');
  run(['update', 'codex', '--target', target]);

  const backups = findFiles(
    path.join(target, 'get-paper-done', '.backups'),
    (file) => file.endsWith(path.join('commands', 'gpd', 'new-paper.md')),
  );
  assert.strictEqual(backups.length, 1);
  assert.strictEqual(fs.readFileSync(backups[0], 'utf8'), 'local edit before update\n');
  assert(fs.readFileSync(commandFile, 'utf8').includes(`@${target}/get-paper-done/workflows/new-paper.md`));
}

function testListCommands() {
  const audiences = JSON.parse(run(['list-audiences', '--json']));
  assert(audiences.some((item) => item.slug === 'cxo-reader'));

  const profiles = JSON.parse(run(['list-profiles', '--json']));
  assert(profiles.some((item) => item.slug === 'head-data-ai-architecture'));
}

function testInitStatusValidate() {
  const dir = tempDir('gpd-init-test');
  run(['init', '--location', dir, '--slug', 'sample-paper', '--title', 'Sample Paper']);

  const paperDir = path.join(dir, 'sample-paper');
  assert(fs.existsSync(path.join(paperDir, '.paper', 'PROJECT.md')));
  assert(fs.existsSync(path.join(paperDir, '.paper', 'STRATEGY.md')));
  assert(fs.existsSync(path.join(paperDir, '.paper', 'STATE.json')));

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.stateSource, 'STATE.json');
  assert.strictEqual(status.strategyStatus, 'Revise Before Drafting');
  assert.strictEqual(status.primaryBlocker, 'thesis_weak');
  assert.strictEqual(status.next, '/gpd-brief');

  const validation = spawnSync(process.execPath, [gpd, 'validate', '--paper', paperDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(validation.status, 1);
  assert(validation.stdout.includes('Strategy blocks downstream work'));
}

function testStateJsonIsStatusSourceOfTruth() {
  const dir = tempDir('gpd-state-json-test');
  run(['init', '--location', dir, '--slug', 'state-source']);
  const paperDir = path.join(dir, 'state-source');

  fs.writeFileSync(path.join(paperDir, '.paper', 'STRATEGY.md'), '# Strategy\n\nNo status here.\n');
  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.stateSource, 'STATE.json');
  assert.strictEqual(status.strategyStatus, 'Revise Before Drafting');

  const validation = runFail(['validate', '--paper', paperDir]);
  assert.strictEqual(validation.status, 1);
  assert(!validation.stdout.includes('Malformed STRATEGY.md'));
  assert(validation.stdout.includes('Strategy blocks downstream work'));
}

function testStateJsonSuggestedNextIsStatusSourceOfTruth() {
  const dir = tempDir('gpd-state-next-test');
  run(['init', '--location', dir, '--slug', 'state-next']);
  const paperDir = path.join(dir, 'state-next');
  const statePath = path.join(paperDir, '.paper', 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Research Complete';
  state.current_stage = 'Research';
  state.last_completed_stage = 'Research';
  state.suggested_next_command = '/gpd-outline --lite';
  state.blocked_by = [];
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.next, '/gpd-outline --lite');
}

function testInitWithoutSlugUsesSubdirectory() {
  const dir = tempDir('gpd-init-default-test');
  run(['init', '--location', dir]);

  assert(!fs.existsSync(path.join(dir, '.paper')));
  const children = fs.readdirSync(dir);
  assert.strictEqual(children.length, 1);
  assert(children[0].startsWith('untitled-paper-'));
  assert(fs.existsSync(path.join(dir, children[0], '.paper', 'PROJECT.md')));
}

function testInitWithoutSlugOrLocationUsesSubdirectory() {
  const dir = tempDir('gpd-init-cwd-default-test');
  run(['init'], { cwd: dir });

  assert(!fs.existsSync(path.join(dir, '.paper')));
  const children = fs.readdirSync(dir);
  assert.strictEqual(children.length, 1);
  assert(children[0].startsWith('untitled-paper-'));
  assert(fs.existsSync(path.join(dir, children[0], '.paper', 'PROJECT.md')));
}

function testImportDryRunAndCopy() {
  const source = tempDir('gpd-import-source');
  fs.writeFileSync(path.join(source, 'draft.md'), '# Draft\n\nCurrent text.\n');
  fs.writeFileSync(path.join(source, 'research-notes.md'), '# Research\n\nNotes.\n');
  fs.mkdirSync(path.join(source, '.git'));
  fs.writeFileSync(path.join(source, '.git', 'config'), 'ignore');

  const dryTarget = tempDir('gpd-import-dry');
  const dryRun = run(['import', '--source', source, '--location', dryTarget, '--slug', 'imported', '--dry-run']);
  assert(dryRun.includes('would copy'));
  assert(!fs.existsSync(path.join(dryTarget, 'imported')));

  const target = tempDir('gpd-import-target');
  run(['import', '--source', source, '--location', target, '--slug', 'imported']);
  const paperDir = path.join(target, 'imported');

  assert(fs.existsSync(path.join(paperDir, 'original', 'draft.md')));
  assert(fs.existsSync(path.join(paperDir, '.paper', 'IMPORT.md')));
  assert(fs.existsSync(path.join(paperDir, '.paper', 'DRAFT.md')));
  assert(!fs.existsSync(path.join(paperDir, 'original', '.git', 'config')));
}

function testImportClassifications() {
  const source = tempDir('gpd-import-classification-source');
  fs.mkdirSync(path.join(source, 'research'));
  fs.writeFileSync(path.join(source, 'draft-v2.md'), '# Draft\n');
  fs.writeFileSync(path.join(source, 'research', 'source-note.md'), '# Source\n');
  fs.writeFileSync(path.join(source, 'outline-v1.md'), '# Outline\n');
  fs.writeFileSync(path.join(source, 'peer-review.md'), '# Review\n');
  fs.writeFileSync(path.join(source, 'strategy-spec.md'), '# Spec\n');
  fs.writeFileSync(path.join(source, 'chart.png'), 'not really an image\n');
  fs.writeFileSync(path.join(source, 'random.md'), '# Notes\n');

  const target = tempDir('gpd-import-classification-target');
  run(['import', '--source', source, '--location', target, '--slug', 'classified']);

  const report = fs.readFileSync(path.join(target, 'classified', '.paper', 'IMPORT.md'), 'utf8');
  assert(report.includes('| draft-v2.md | original/draft-v2.md | draft |'));
  assert(report.includes('| research/source-note.md | original/research/source-note.md | research |'));
  assert(report.includes('| outline-v1.md | original/outline-v1.md | outline |'));
  assert(report.includes('| peer-review.md | original/peer-review.md | review |'));
  assert(report.includes('| strategy-spec.md | original/strategy-spec.md | spec |'));
  assert(report.includes('| chart.png | original/chart.png | asset |'));
  assert(report.includes('| random.md | original/random.md | notes |'));
}

function testImportWithoutSlugUsesSourceName() {
  const source = tempDir('gpd-import-source-name');
  fs.writeFileSync(path.join(source, 'draft.md'), '# Draft\n\nCurrent text.\n');

  const target = tempDir('gpd-import-source-name-target');
  run(['import', '--source', source, '--location', target]);

  const expected = path.join(target, path.basename(source));
  assert(fs.existsSync(path.join(expected, '.paper', 'IMPORT.md')));
  assert(!fs.existsSync(path.join(target, '.paper')));
}

function testMalformedInputs() {
  const missingSource = runFail(['import', '--source', path.join(tempDir('gpd-missing-source'), 'missing'), '--location', tempDir('gpd-missing-source-target')]);
  assert.notStrictEqual(missingSource.status, 0);

  const missingRequired = tempDir('gpd-missing-required');
  fs.mkdirSync(path.join(missingRequired, '.paper'), { recursive: true });
  const missingValidation = runFail(['validate', '--paper', missingRequired]);
  assert.strictEqual(missingValidation.status, 1);
  assert(missingValidation.stdout.includes('Missing PROJECT.md'));

  const dir = tempDir('gpd-malformed-strategy');
  run(['init', '--location', dir, '--slug', 'bad-strategy']);
  const paperDir = path.join(dir, 'bad-strategy');
  fs.unlinkSync(path.join(paperDir, '.paper', 'STATE.json'));
  fs.writeFileSync(path.join(paperDir, '.paper', 'STRATEGY.md'), '# Strategy\n\nNo status here.\n');
  const malformed = runFail(['validate', '--paper', paperDir]);
  assert.strictEqual(malformed.status, 1);
  assert(malformed.stdout.includes('Malformed STRATEGY.md'));

  const stateJsonDir = tempDir('gpd-malformed-state-json');
  run(['init', '--location', stateJsonDir, '--slug', 'bad-state-json']);
  const stateJsonPaper = path.join(stateJsonDir, 'bad-state-json');
  fs.writeFileSync(path.join(stateJsonPaper, '.paper', 'STATE.json'), '{not json');
  const malformedJson = runFail(['validate', '--paper', stateJsonPaper]);
  assert.strictEqual(malformedJson.status, 1);
  assert(malformedJson.stdout.includes('Malformed STATE.json'));

  const versionDir = tempDir('gpd-unsupported-state-version');
  run(['init', '--location', versionDir, '--slug', 'future-state']);
  const versionPaper = path.join(versionDir, 'future-state');
  const statePath = path.join(versionPaper, '.paper', 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.version = 2;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  const unsupportedVersion = runFail(['validate', '--paper', versionPaper]);
  assert.strictEqual(unsupportedVersion.status, 1);
  assert(unsupportedVersion.stdout.includes('Unsupported STATE.json version 2; run gpd update or migrate'));
}

testInstallerInstallDoctorRewriteAndBackup();
testListCommands();
testInitStatusValidate();
testStateJsonIsStatusSourceOfTruth();
testStateJsonSuggestedNextIsStatusSourceOfTruth();
testInitWithoutSlugUsesSubdirectory();
testInitWithoutSlugOrLocationUsesSubdirectory();
testImportDryRunAndCopy();
testImportClassifications();
testImportWithoutSlugUsesSourceName();
testMalformedInputs();

console.log('gpd cli tests passed');
