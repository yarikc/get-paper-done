'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const { slugify } = require('../bin/lib/common');
const { requiredGrillDecisionKeys } = require('../bin/lib/contracts');

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

function testHelpShowsCalibratedExternalReviewProviders() {
  const output = run(['help']);
  assert(output.includes('gpd review-external --paper ~/papers/metadata-strategy --models claude,codex,gemini --current-runtime codex'));
  assert(output.includes('next                         Show only the next recommended action and why'));
  assert(output.includes('gpd next --paper ~/papers/metadata-strategy'));
}

function minimalDocxBuffer(paragraphs) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:body>',
    ...paragraphs.map((paragraph) => `<w:p><w:r><w:t>${paragraph}</w:t></w:r></w:p>`),
    '</w:body>',
    '</w:document>',
  ].join('');
  const entries = [{ name: 'word/document.xml', data: Buffer.from(xml, 'utf8') }];
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, entry.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 12);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + entry.data.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const localFiles = Buffer.concat(localParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(localFiles.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localFiles, centralDir, eocd]);
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

  const commandFile = path.join(target, 'commands', 'gpd', 'new.md');
  const contextsReadme = path.join(target, 'get-paper-done', 'contexts', 'README.md');
  assert(fs.existsSync(commandFile));
  assert(fs.existsSync(contextsReadme));
  const commandContent = fs.readFileSync(commandFile, 'utf8');
  assert(commandContent.includes(`@${target}/get-paper-done/workflows/new-paper.md`));
  assert(!commandContent.includes('@{{GPD_RUNTIME_ROOT}}'));

  const doctor = run(['doctor', 'codex', '--target', target]);
  assert(doctor.includes('status: ok'));

  fs.writeFileSync(commandFile, 'local edit before update\n');
  run(['update', 'codex', '--target', target]);

  const backups = findFiles(
    path.join(target, 'get-paper-done', '.backups'),
    (file) => file.endsWith(path.join('commands', 'gpd', 'new.md')),
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
  assert.strictEqual(status.next, '/gpd-grill');
  assert.strictEqual(status.machineState.grill.status, 'Not Started');

  const validation = spawnSync(process.execPath, [gpd, 'validate', '--paper', paperDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(validation.status, 1);
  assert(validation.stdout.includes('Strategy blocks downstream work'));

  const semanticValidation = runFail(['validate', '--paper', paperDir, '--semantic']);
  assert.strictEqual(semanticValidation.status, 1);
  assert(!semanticValidation.stdout.includes('STATE.md: Status'));
  assert(!semanticValidation.stdout.includes('STATE.md: Suggested next command'));
}

function completeGrill(state) {
  state.grill.status = 'Complete';
  state.grill.completion_basis = 'test fixture resolved required grill decisions';
  state.grill.resolved_decisions = requiredGrillDecisionKeys;
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
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.next, '/gpd-outline --lite');
}

function testNextCommandExplainsMissingRequiredArtifactBeforeSavedState() {
  const dir = tempDir('gpd-next-missing-artifact-test');
  run(['init', '--location', dir, '--slug', 'missing-research', '--title', 'Missing Research']);
  const paperDir = path.join(dir, 'missing-research');
  const statePath = path.join(paperDir, '.paper', 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Brief Complete';
  state.current_stage = 'Brief';
  state.last_completed_stage = 'Brief';
  state.suggested_next_command = '/gpd-research';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  const next = JSON.parse(run(['next', '--paper', paperDir, '--json']));
  assert.strictEqual(next.next, '/gpd-research');
  assert(next.why.includes('Structured research is missing'));
  assert(!next.why.includes('STATE.json saved'));
}

function testNextCommandShowsCompactGuidance() {
  const dir = tempDir('gpd-next-test');
  run(['init', '--location', dir, '--slug', 'guided-next', '--title', 'Guided Next']);
  const paperDir = path.join(dir, 'guided-next');

  const output = run(['next', '--paper', paperDir]);
  assert(output.includes('next: /gpd-grill'));
  assert(output.includes('why: The mandatory grill gate is incomplete'));
  assert(output.includes('clear context:'));
  assert(output.includes('user action: Run the recommended command'));
  assert(!output.includes('artifacts:'));

  const json = JSON.parse(run(['next', '--paper', paperDir, '--json']));
  assert.strictEqual(json.next, '/gpd-grill');
  assert(json.why.includes('mandatory grill gate'));
  assert.strictEqual(json.context.clear_context, 'No, unless the import/intake chat is noisy.');
  assert(json.userAction.includes('Run the recommended command'));
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
  assert(dryRun.includes('classifications: draft=1, research=1'));
  assert(dryRun.includes('canonical draft candidate: original/draft.md'));
  assert(!fs.existsSync(path.join(dryTarget, 'imported')));

  const target = tempDir('gpd-import-target');
  run(['import', '--source', source, '--location', target, '--slug', 'imported']);
  const paperDir = path.join(target, 'imported');

  assert(fs.existsSync(path.join(paperDir, 'original', 'draft.md')));
  assert(fs.existsSync(path.join(paperDir, '.paper', 'IMPORT.md')));
  assert(fs.existsSync(path.join(paperDir, '.paper', 'DRAFT.md')));
  assert(!fs.existsSync(path.join(paperDir, 'original', '.git', 'config')));

  const report = fs.readFileSync(path.join(paperDir, '.paper', 'IMPORT.md'), 'utf8');
  assert(report.includes(`**Source label:** ${path.basename(source)}`));
  assert(report.includes('**Destination label:** imported'));
  assert(report.includes('Absolute local source and destination paths are intentionally omitted'));
  assert(report.includes('| draft | 1 |'));
  assert(report.includes('| research | 1 |'));
  assert(report.includes('| draft.md |'));
  assert(report.includes('| Candidate | Score | Modified | Selected |'));
  assert(!report.includes(source));
  assert(!report.includes(target));

  const semanticValidation = runFail(['validate', '--paper', paperDir, '--semantic']);
  assert.strictEqual(semanticValidation.status, 1);
  assert(!semanticValidation.stdout.includes('STATE.md: Status'));
  assert(!semanticValidation.stdout.includes('STATE.md: Suggested next command'));
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

function testSingleMarkdownImportIsCanonicalDraft() {
  const sourceDir = tempDir('gpd-import-single-source');
  const source = path.join(sourceDir, 'Directional_Outline_v0.5-latest.md');
  fs.writeFileSync(source, '# Directional Outline\n\nCurrent working draft.\n');

  const target = tempDir('gpd-import-single-target');
  run(['import', '--source', source, '--location', target, '--slug', 'single-import']);
  const paperDir = path.join(target, 'single-import');

  assert(fs.existsSync(path.join(paperDir, '.paper', 'DRAFT.md')));
  assert.strictEqual(
    fs.readFileSync(path.join(paperDir, '.paper', 'DRAFT.md'), 'utf8'),
    '# Directional Outline\n\nCurrent working draft.\n',
  );

  const report = fs.readFileSync(path.join(paperDir, '.paper', 'IMPORT.md'), 'utf8');
  assert(report.includes('**Selected draft:** original/Directional_Outline_v0.5-latest.md'));
  assert(report.includes('Single imported Markdown/text file treated as the working draft.'));
}

function testImportDocxCanonicalDraftExtraction() {
  const source = tempDir('gpd-import-docx-source');
  const docxPath = path.join(source, 'current-draft.docx');
  fs.writeFileSync(docxPath, minimalDocxBuffer([
    'Approve the lightweight source register.',
    'Evidence &amp; controls need one reviewable record.',
  ]));

  const target = tempDir('gpd-import-docx-target');
  const output = run(['import', '--source', source, '--location', target, '--slug', 'docx-import']);
  const paperDir = path.join(target, 'docx-import');
  const meta = path.join(paperDir, '.paper');

  assert(output.includes('canonical draft candidate: original/current-draft.docx'));
  assert(output.includes('draft extraction: .paper/DRAFT.md from original/current-draft.docx'));
  assert(fs.existsSync(path.join(paperDir, 'original', 'current-draft.docx')));
  assert(fs.existsSync(path.join(meta, 'DRAFT.md')));

  const draft = fs.readFileSync(path.join(meta, 'DRAFT.md'), 'utf8');
  assert(draft.includes('# Imported Draft'));
  assert(draft.includes('Derived from original/current-draft.docx by gpd import text extraction'));
  assert(draft.includes('Approve the lightweight source register.'));
  assert(draft.includes('Evidence & controls need one reviewable record.'));

  const report = fs.readFileSync(path.join(meta, 'IMPORT.md'), 'utf8');
  assert(report.includes('| current-draft.docx | original/current-draft.docx | draft | Preserved unchanged;'));
  assert(report.includes('## Draft Extraction'));
  assert(report.includes('| DRAFT.md | Created | original/current-draft.docx | Plain paragraph text extracted from the selected DOCX draft; formatting, comments, and tracked changes are not imported. |'));
  assert(!report.includes(source));
  assert(!report.includes(target));
}

function testImportDetectsSourceReferencesWithoutGeneratingResearch() {
  const source = tempDir('gpd-import-source-reference-source');
  fs.writeFileSync(path.join(source, 'draft.md'), [
    '# Draft',
    '',
    'Sources: NIST SP 800-218 and https://csrc.nist.gov/publications/detail/sp/800-218/final',
    'A related DOI is 10.6028/NIST.SP.800-218.',
  ].join('\n'));
  fs.writeFileSync(path.join(source, 'reference-notes.txt'), [
    'References: OWASP LLM Top 10 and CISA guidance.',
    'Background note that still needs verification.',
  ].join('\n'));
  fs.writeFileSync(path.join(source, 'supporting-draft.docx'), minimalDocxBuffer([
    'OpenSSF and SLSA are mentioned as possible source families.',
  ]));

  const target = tempDir('gpd-import-source-reference-target');
  const output = run(['import', '--source', source, '--location', target, '--slug', 'source-reference-import']);
  const paperDir = path.join(target, 'source-reference-import');
  const meta = path.join(paperDir, '.paper');

  assert(output.includes('source references detected:'));
  assert(!fs.existsSync(path.join(meta, 'RESEARCH.json')));
  assert(!fs.existsSync(path.join(meta, 'RESEARCH.md')));

  const report = fs.readFileSync(path.join(meta, 'IMPORT.md'), 'utf8');
  assert(report.includes('## Detected Source References'));
  assert(report.includes('These are unverified import-time triage candidates.'));
  assert(report.includes('| original/draft.md | url | https://csrc.nist.gov/publications/detail/sp/800-218/final | Triage only; verify during research or fact-check. |'));
  assert(report.includes('| original/draft.md | named_reference | NIST SP 800-218 | Triage only; verify during research or fact-check. |'));
  assert(report.includes('| original/draft.md | doi | 10.6028/NIST.SP.800-218 | Triage only; verify during research or fact-check. |'));
  assert(report.includes('| original/reference-notes.txt | named_reference | OWASP LLM Top 10 and CISA guidance | Triage only; verify during research or fact-check. |'));
  assert(report.includes('| original/supporting-draft.docx | named_reference | OpenSSF | Triage only; verify during research or fact-check. |'));
  assert(!report.includes(source));
  assert(!report.includes(target));
}

function testImportDraftSelectionUsesFilenameSignalsBeforeMtime() {
  const source = tempDir('gpd-import-draft-ranking-source');
  fs.mkdirSync(path.join(source, 'drafts'));
  const latest = path.join(source, 'drafts', 'draft-latest.md');
  const newerVersion = path.join(source, 'drafts', 'draft-v2.md');
  fs.writeFileSync(latest, '# Latest\n\nThis should win.\n');
  fs.writeFileSync(newerVersion, '# Version Two\n\nNewer but less explicit.\n');

  const olderTime = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  const newerTime = new Date(Date.UTC(2026, 0, 3, 0, 0, 0));
  fs.utimesSync(latest, olderTime, olderTime);
  fs.utimesSync(newerVersion, newerTime, newerTime);

  const target = tempDir('gpd-import-draft-ranking-target');
  run(['import', '--source', source, '--location', target, '--slug', 'ranked-import']);
  const paperDir = path.join(target, 'ranked-import');

  assert.strictEqual(
    fs.readFileSync(path.join(paperDir, '.paper', 'DRAFT.md'), 'utf8'),
    '# Latest\n\nThis should win.\n',
  );

  const report = fs.readFileSync(path.join(paperDir, '.paper', 'IMPORT.md'), 'utf8');
  assert(report.includes('**Selected draft:** original/drafts/draft-latest.md'));
  assert(report.includes('Highest-ranked imported draft-like file using filename cues, version cues, location, and modified time.'));
  assert(report.includes('| drafts/draft-latest.md |'));
  assert(report.includes('| drafts/draft-v2.md |'));
  assert(report.includes('| drafts/draft-latest.md | 1550 |'));
  assert(report.includes('| drafts/draft-v2.md | 1150 |'));
}

function testImportVersionSourceIndexGroupsMaterial() {
  const source = tempDir('gpd-import-version-index-source');
  fs.mkdirSync(path.join(source, 'drafts'));
  fs.mkdirSync(path.join(source, 'versions'));
  fs.mkdirSync(path.join(source, 'sources'));
  fs.mkdirSync(path.join(source, 'review'));
  fs.mkdirSync(path.join(source, 'assets'));
  fs.writeFileSync(path.join(source, 'drafts', 'current-draft-v3.md'), '# Current\n');
  fs.writeFileSync(path.join(source, 'drafts', 'old-draft-v1.md'), '# Old\n');
  fs.writeFileSync(path.join(source, 'versions', 'draft-v2.md'), '# Version Two\n');
  fs.writeFileSync(path.join(source, 'sources', 'nist-reference.md'), '# Source\n');
  fs.writeFileSync(path.join(source, 'review', 'peer-feedback.md'), '# Feedback\n');
  fs.writeFileSync(path.join(source, 'outline-v1.md'), '# Outline\n');
  fs.writeFileSync(path.join(source, 'strategy-spec.md'), '# Strategy\n');
  fs.writeFileSync(path.join(source, 'assets', 'chart.png'), 'not really an image\n');
  fs.writeFileSync(path.join(source, 'loose-note.md'), '# Note\n');

  const oldTime = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  const currentTime = new Date(Date.UTC(2026, 0, 5, 0, 0, 0));
  fs.utimesSync(path.join(source, 'drafts', 'old-draft-v1.md'), oldTime, oldTime);
  fs.utimesSync(path.join(source, 'drafts', 'current-draft-v3.md'), currentTime, currentTime);

  const target = tempDir('gpd-import-version-index-target');
  run(['import', '--source', source, '--location', target, '--slug', 'version-index-import']);
  const paperDir = path.join(target, 'version-index-import');
  const report = fs.readFileSync(path.join(paperDir, '.paper', 'IMPORT.md'), 'utf8');

  assert(report.includes('## Version / Source Index'));
  assert(report.includes('This index helps triage imported material.'));
  assert(report.includes('| original/drafts/current-draft-v3.md | canonical_draft |'));
  assert(report.includes('| original/drafts/current-draft-v3.md | canonical_draft | 2000 |'));
  assert(report.includes('| original/drafts/old-draft-v1.md | previous_or_alternate_draft |'));
  assert(report.includes('| original/versions/draft-v2.md | previous_or_alternate_draft |'));
  assert(report.includes('| original/sources/nist-reference.md | source_reference |'));
  assert(report.includes('| original/review/peer-feedback.md | review_feedback |'));
  assert(report.includes('| original/outline-v1.md | outline |'));
  assert(report.includes('| original/strategy-spec.md | brief_or_strategy_context |'));
  assert(report.includes('| original/assets/chart.png | asset |'));
  assert(report.includes('| original/loose-note.md | notes |'));
  assert(report.includes('| RESEARCH | Research/source filename or path; use as input to research compression. |'));
  assert(report.includes('| REVIEW | Review or feedback filename; use during review planning, not immediate revision. |'));
  assert(report.includes('| BRIEF, STRATEGY | Brief/spec/strategy filename; use to clarify purpose, scope, and gates. |'));
  assert(!report.includes(source));
  assert(!report.includes(target));
}

function testImportMaxFileBytesSkipsLargeFiles() {
  const source = tempDir('gpd-import-max-file-source');
  fs.writeFileSync(path.join(source, 'draft.md'), '# Draft\n');
  fs.writeFileSync(path.join(source, 'large-reference.pdf'), 'x'.repeat(64));

  const target = tempDir('gpd-import-max-file-target');
  const output = run(['import', '--source', source, '--location', target, '--slug', 'max-file-import', '--max-file-bytes', '16']);
  const paperDir = path.join(target, 'max-file-import');

  assert(output.includes('files skipped: 1'));
  assert(output.includes('Some files were skipped'));
  assert(fs.existsSync(path.join(paperDir, 'original', 'draft.md')));
  assert(!fs.existsSync(path.join(paperDir, 'original', 'large-reference.pdf')));

  const report = fs.readFileSync(path.join(paperDir, '.paper', 'IMPORT.md'), 'utf8');
  assert(report.includes('| large-reference.pdf | larger than 16 bytes |'));
  assert(report.includes('- Some files were skipped: review skip reasons before assuming the import is complete.'));
}

function testImportWithoutSlugUsesSourceName() {
  const sourceRoot = tempDir('gpd-import-source-name');
  const source = path.join(sourceRoot, 'MixedCase Source Folder');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'draft.md'), '# Draft\n\nCurrent text.\n');

  const target = tempDir('gpd-import-source-name-target');
  run(['import', '--source', source, '--location', target]);

  const expected = path.join(target, slugify(path.basename(source)));
  assert(fs.existsSync(path.join(expected, '.paper', 'IMPORT.md')));
  assert(!fs.existsSync(path.join(target, path.basename(source), '.paper', 'IMPORT.md')));
  assert(!fs.existsSync(path.join(target, '.paper')));
}

function testExportCommandWritesFinalAndState() {
  const dir = tempDir('gpd-export-test');
  run(['init', '--location', dir, '--slug', 'exportable', '--title', 'Exportable Paper']);
  const paperDir = path.join(dir, 'exportable');
  const meta = path.join(paperDir, '.paper');

  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Ready For Export';
  state.current_stage = 'Review';
  state.last_completed_stage = 'Review';
  state.suggested_next_command = '/gpd-export';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  fs.writeFileSync(path.join(meta, 'DRAFT.md'), [
    '# Draft',
    '',
    '## Working Title',
    '',
    'Exportable Paper',
    '',
    '## Section 1 - Opening',
    '',
    'Final body.',
    '',
    '## Draft Notes',
    '',
    '- Internal note.',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');

  const output = run(['export', '--paper', paperDir]);
  assert(output.includes('exports/FINAL.md'));
  assert(output.includes('review: read .paper/exports/FINAL.md'));
  assert(output.includes('if you add comments: run gpd feedback, then /gpd-review'));

  const finalPath = path.join(meta, 'exports', 'FINAL.md');
  assert(fs.existsSync(finalPath));
  const final = fs.readFileSync(finalPath, 'utf8');
  assert(final.includes('# Exportable Paper'));
  assert(final.includes('## Opening'));
  assert(final.includes('Final body.'));
  assert(!final.includes('Draft Notes'));

  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.status, 'Exported');
  assert.strictEqual(updatedState.suggested_next_command, '/gpd-status');
  const stateMarkdown = fs.readFileSync(path.join(meta, 'STATE.md'), 'utf8');
  assert(stateMarkdown.includes('**Status:** Exported'));
  assert(stateMarkdown.includes('**Suggested next command:** `/gpd-status`'));

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.artifacts['exports/FINAL.md'], true);
  assert.strictEqual(status.next, '/gpd-status');
  assert(status.userAction.includes('Read .paper/exports/FINAL.md'));
}

function testReviewPackAndFeedbackCaptureFinalComments() {
  const dir = tempDir('gpd-review-pack-test');
  run(['init', '--location', dir, '--slug', 'review-pack', '--title', 'Review Pack']);
  const paperDir = path.join(dir, 'review-pack');
  const meta = path.join(paperDir, '.paper');

  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Ready For Export';
  state.current_stage = 'Review';
  state.last_completed_stage = 'Review';
  state.suggested_next_command = '/gpd-export';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  fs.writeFileSync(path.join(meta, 'DRAFT.md'), [
    '# Draft',
    '',
    '## Working Title',
    '',
    'Review Pack Paper',
    '',
    '## Draft Body',
    '',
    'This is the exported body.',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');

  run(['export', '--paper', paperDir]);
  const finalPath = path.join(meta, 'exports', 'FINAL.md');
  fs.appendFileSync(finalPath, '\n//YC The ask is still unclear for the target reader.\n');

  const packOutput = run(['review-pack', '--paper', paperDir]);
  assert(packOutput.includes(`review target: ${finalPath}`));
  assert(packOutput.includes('editable source: .paper/DRAFT.md'));
  assert(packOutput.includes('capture: gpd feedback'));

  const captureOutput = run(['feedback', '--paper', paperDir]);
  assert(captureOutput.includes('comments captured: 1'));
  assert(captureOutput.includes('next: /gpd-status'));

  const readerFeedback = fs.readFileSync(path.join(meta, 'READER-FEEDBACK.md'), 'utf8');
  assert(readerFeedback.includes('**Source:** inline user comments'));
  assert(readerFeedback.includes('The ask is still unclear for the target reader.'));
  assert(readerFeedback.includes('| Ask clarity |'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('**Status:** Pending user approval'));
  assert(feedbackPlan.includes('No draft or upstream artifact has been changed.'));
  assert(feedbackPlan.includes('The ask is still unclear for the target reader.'));

  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.status, 'Feedback Pending');
  assert.strictEqual(updatedState.feedback.feedback_plan_status, 'Pending user approval');
}

function testExportCommandUsesDraftBodyWhenPreBodySectionsExist() {
  const dir = tempDir('gpd-export-body-test');
  run(['init', '--location', dir, '--slug', 'body-export', '--title', 'Body Export']);
  const paperDir = path.join(dir, 'body-export');
  const meta = path.join(paperDir, '.paper');

  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Ready For Export';
  state.current_stage = 'Review';
  state.last_completed_stage = 'Review';
  state.suggested_next_command = '/gpd-export';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  fs.writeFileSync(path.join(meta, 'DRAFT.md'), [
    '# Draft',
    '',
    '**Status:** Draft',
    '**Version:** v1',
    '',
    '## Working Definitions',
    '',
    '- **Internal term:** Should not export.',
    '',
    '## Section Intent Map',
    '',
    '| Section | Objective |',
    '|---------|-----------|',
    '| Opening | Test |',
    '',
    '## Draft Body',
    '',
    '## Opening',
    '',
    'Exported body.',
    '',
    '## Draft Notes',
    '',
    '- Internal note.',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');

  run(['export', '--paper', paperDir]);

  const final = fs.readFileSync(path.join(meta, 'exports', 'FINAL.md'), 'utf8');
  assert(final.includes('# Body Export'));
  assert(final.includes('## Opening'));
  assert(final.includes('Exported body.'));
  assert(!final.includes('Working Definitions'));
  assert(!final.includes('Internal term'));
  assert(!final.includes('Section Intent Map'));
  assert(!final.includes('Draft Notes'));
}

function testExportCommandRequiresReadyReview() {
  const dir = tempDir('gpd-export-not-ready-test');
  run(['init', '--location', dir, '--slug', 'not-ready', '--title', 'Not Ready']);
  const paperDir = path.join(dir, 'not-ready');
  const meta = path.join(paperDir, '.paper');

  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\n## Draft Body\n\nBody.\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nRevise\n');

  const failed = runFail(['export', '--paper', paperDir]);
  assert.strictEqual(failed.status, 1);
  assert(failed.stderr.includes('REVIEW.md verdict is Revise'));
  assert(!fs.existsSync(path.join(meta, 'exports', 'FINAL.md')));
}

function testExportCommandHonorsStatusRouting() {
  const dir = tempDir('gpd-export-routing-test');
  run(['init', '--location', dir, '--slug', 'needs-revise', '--title', 'Needs Revise']);
  const paperDir = path.join(dir, 'needs-revise');
  const meta = path.join(paperDir, '.paper');

  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Ready For Export';
  state.current_stage = 'Review';
  state.last_completed_stage = 'Review';
  state.suggested_next_command = '/gpd-export';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  fs.writeFileSync(path.join(meta, 'RESEARCH.json'), '{"research_plan":{},"source_registry":[],"evidence_matrix":[]}\n');
  fs.writeFileSync(path.join(meta, 'OUTLINE.md'), '# Outline\n');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\n## Draft Body\n\nBody.\n');
  fs.writeFileSync(path.join(meta, 'FACT-CHECK.md'), '# Fact And Claims Check\n\n## Recommended Next Action\n\n/gpd-revise\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');

  const failed = runFail(['export', '--paper', paperDir]);
  assert.strictEqual(failed.status, 1);
  assert(failed.stderr.includes('Current paper state recommends /gpd-revise'));
  assert(!fs.existsSync(path.join(meta, 'exports', 'FINAL.md')));
}

function testExportCommandBlocksBelowTargetReadyReview() {
  const dir = tempDir('gpd-export-below-target-test');
  run(['init', '--location', dir, '--slug', 'below-target', '--title', 'Below Target']);
  const paperDir = path.join(dir, 'below-target');
  const meta = path.join(paperDir, '.paper');

  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Ready For Export';
  state.current_stage = 'Review';
  state.last_completed_stage = 'Review';
  state.suggested_next_command = '/gpd-export';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  fs.writeFileSync(path.join(meta, 'RESEARCH.json'), '{"research_plan":{},"source_registry":[],"evidence_matrix":[]}\n');
  fs.writeFileSync(path.join(meta, 'OUTLINE.md'), '# Outline\n');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\n## Draft Body\n\nBody.\n');
  fs.writeFileSync(path.join(meta, 'FACT-CHECK.md'), '# Fact And Claims Check\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), [
    '# Review',
    '',
    '## Verdict',
    '',
    'Ready',
    '',
    '## Below-Target Improvement Gate',
    '',
    '- **Immediate improvement required before export:** Yes',
    '- **If yes, required action:** /gpd-revise before export',
    '',
  ].join('\n'));

  const failed = runFail(['export', '--paper', paperDir]);
  assert.strictEqual(failed.status, 1);
  assert(failed.stderr.includes('Current paper state recommends /gpd-revise'));
  assert(!fs.existsSync(path.join(meta, 'exports', 'FINAL.md')));
}

function testReviewExternalCollectsReviewAndStopsAtApprovalGate() {
  const dir = tempDir('gpd-review-external-test');
  run(['init', '--location', dir, '--slug', 'external-review', '--title', 'External Review']);
  const paperDir = path.join(dir, 'external-review');
  const meta = path.join(paperDir, '.paper');
  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Draft Complete';
  state.current_stage = 'Draft';
  state.last_completed_stage = 'Draft';
  state.suggested_next_command = '/gpd-review --deep';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.writeFileSync(path.join(meta, 'RESEARCH.json'), '{"research_plan":{},"source_registry":[],"evidence_matrix":[]}\n');
  fs.writeFileSync(path.join(meta, 'OUTLINE.md'), '# Outline\n');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const reviewDir = tempDir('gpd-external-review-source');
  const reviewPath = path.join(reviewDir, 'claude-review.md');
  fs.writeFileSync(reviewPath, [
    '# Claude Review',
    '',
    '## Highest-Priority Concerns',
    '',
    '### HIGH — Ask is unclear',
    '',
    'The paper does not make a decidable executive ask.',
    '',
    '### MEDIUM — Evidence is thin',
    '',
    'Research sources do not support the main claim.',
    '',
    '## Specific Suggested Changes',
    '',
    '1. Rewrite Section 8 as decidable actions.',
    '',
  ].join('\n'));

  const output = run(['review-external', '--paper', paperDir, '--review-file', `claude=${reviewPath}`]);
  assert(output.includes('reviews captured: 1'));
  assert(output.includes('empty reviews: 0'));
  assert(output.includes('feedback items: 3'));
  assert(output.includes('next: /gpd-status'));

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('## claude Review'));
  assert(externalReviews.includes('**Source:** claude-review.md'));
  assert(externalReviews.includes('### HIGH — Ask is unclear'));
  assert(!externalReviews.includes(reviewDir));
  assert(externalReviews.includes('does not revise the draft'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('**Status:** Pending user approval'));
  assert(feedbackPlan.includes('## Below-Target Items'));
  assert(feedbackPlan.includes('HIGH: Ask is unclear - The paper does not make a decidable executive ask.'));
  assert(feedbackPlan.includes('MEDIUM: Evidence is thin - Research sources do not support the main claim.'));
  assert(feedbackPlan.includes('Rewrite Section 8 as decidable actions.'));
  assert(feedbackPlan.includes('| # | Feedback | Source(s) | Assessment | Recommendation | Proposed Handling | User Override | Affected Artifact |'));
  assert(feedbackPlan.includes('HIGH - Pending approval'));
  assert(feedbackPlan.includes('MEDIUM - Pending approval'));
  assert(feedbackPlan.includes('ACTION - Pending approval'));
  assert(feedbackPlan.includes('Recommend incorporate'));
  assert(feedbackPlan.includes('Recommend discuss'));
  assert(feedbackPlan.includes('Recommend map to approved concern'));
  assert(feedbackPlan.includes('None yet - user may override with incorporate / discuss / defer / ignore.'));
  assert(feedbackPlan.includes('No draft or upstream artifact has been changed.'));

  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.status, 'Feedback Pending');
  assert.strictEqual(updatedState.current_stage, 'External Review');
  assert.strictEqual(updatedState.suggested_next_command, '/gpd-status');
  assert.strictEqual(updatedState.feedback.feedback_plan_status, 'Pending user approval');

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.artifacts['EXTERNAL-REVIEWS.md'], true);
  assert.strictEqual(status.artifacts['FEEDBACK-PLAN.md'], true);
  assert.strictEqual(status.next, '/gpd-status');
}

function testReviewExternalParsesGeminiSeverityFormat() {
  const dir = tempDir('gpd-review-external-gemini-format-test');
  run(['init', '--location', dir, '--slug', 'gemini-format-review', '--title', 'Gemini Format Review']);
  const paperDir = path.join(dir, 'gemini-format-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe operating layer is abstract.\n');

  const reviewDir = tempDir('gpd-gemini-review-source');
  const reviewPath = path.join(reviewDir, 'gemini-review.md');
  fs.writeFileSync(reviewPath, [
    '# External Review',
    '',
    '## Highest-Priority Concerns',
    '',
    '### 1. The Recursive Ownership Gap (Severity: HIGH)',
    '**Issue:** Who governs the governor?',
    '**Critique:** The operating layer can become the new bottleneck.',
    '',
    '### 2. Deliverable Overlap (Severity: MEDIUM)',
    '**Issue:** Context packs and decision records overlap.',
    '**Critique:** Sponsors cannot map the list to budget.',
    '',
    '## Specific Suggested Changes',
    '',
    '### Section 4: Operating Layer',
    '',
    '* **Section 4:** Define the human-by-exception trigger.',
    '* **Section 5:** Collapse the deliverables into product families.',
    '',
  ].join('\n'));

  const output = run(['review-external', '--paper', paperDir, '--review-file', `gemini=${reviewPath}`]);
  assert(output.includes('feedback items: 4'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('HIGH: The Recursive Ownership Gap'));
  assert(feedbackPlan.includes('MEDIUM: Deliverable Overlap'));
  assert(feedbackPlan.includes('Section 4: Define the human-by-exception trigger.'));
  assert(feedbackPlan.includes('Section 5: Collapse the deliverables into product families.'));
  assert(feedbackPlan.includes('Recommend incorporate'));
  assert(feedbackPlan.includes('Recommend discuss'));
  assert(feedbackPlan.includes('Recommend map to approved concern'));
}

function testReviewExternalCombinesAndStoresMultipleReviewers() {
  const dir = tempDir('gpd-review-external-combined-test');
  run(['init', '--location', dir, '--slug', 'combined-review', '--title', 'Combined Review']);
  const paperDir = path.join(dir, 'combined-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const reviewDir = tempDir('gpd-combined-review-source');
  const claudePath = path.join(reviewDir, 'claude-review.md');
  fs.writeFileSync(claudePath, [
    '# Claude Review',
    '',
    '## Highest-Priority Concerns',
    '',
    '### HIGH — Recursive ownership gap',
    '',
    'The paper does not say who governs the governor.',
    '',
    '### MEDIUM — Deliverable overlap',
    '',
    'Context packs and decision records overlap.',
    '',
  ].join('\n'));
  const geminiPath = path.join(reviewDir, 'gemini-review.md');
  fs.writeFileSync(geminiPath, [
    '# Gemini Review',
    '',
    '## Highest-Priority Concerns',
    '',
    '### 1. Recursive Ownership Gap (Severity: HIGH)',
    '**Issue:** The same architecture function owns constraints and exceptions.',
    '',
    '### 2. Deliverable Bloat vs. Differentiation (Severity: MEDIUM)',
    '**Issue:** Context packs, decision memory, and agentic assets sound overlapping.',
    '',
    '### 2. Counterfactual is abstract (Severity: HIGH)',
    '**Issue:** The paper needs a concrete failure story.',
    '',
  ].join('\n'));

  const output = run([
    'review-external',
    '--paper',
    paperDir,
    '--review-file',
    `claude=${claudePath}`,
    '--review-file',
    `gemini=${geminiPath}`,
  ]);
  assert(output.includes('reviews captured: 2'));
  assert(output.includes('feedback items: 3'));
  assert(output.includes('raw feedback items: 5'));
  assert(output.includes('stored reviews:'));
  assert(output.includes('combined recommendations:'));
  assert(output.includes('Recommend incorporate [claude, gemini]'));

  const storedDir = path.join(meta, 'external-reviews');
  const storedFiles = fs.readdirSync(storedDir).filter((file) => file.endsWith('.md'));
  assert.strictEqual(storedFiles.length, 2);
  assert(storedFiles.some((file) => file.includes('claude')));
  assert(storedFiles.some((file) => file.includes('gemini')));

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('## Stored Reviewer Files'));
  assert(externalReviews.includes('.paper/external-reviews/'));
  assert(!externalReviews.includes(reviewDir));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('Recursive Ownership Gap') || feedbackPlan.includes('Recursive ownership gap'));
  assert(feedbackPlan.includes('| claude, gemini | HIGH - Pending approval | Recommend incorporate |'));
  assert(feedbackPlan.includes('Counterfactual is abstract'));
  assert(feedbackPlan.includes('Deliverable overlap') || feedbackPlan.includes('Deliverable Bloat'));
  assert(feedbackPlan.includes('| claude, gemini | MEDIUM - Pending approval | Recommend discuss |'));
}

function testReviewExternalInvokesProviderModel() {
  const dir = tempDir('gpd-review-external-provider-test');
  run(['init', '--location', dir, '--slug', 'provider-review', '--title', 'Provider Review']);
  const paperDir = path.join(dir, 'provider-review');
  const meta = path.join(paperDir, '.paper');
  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.status = 'Draft Complete';
  state.current_stage = 'Draft';
  state.last_completed_stage = 'Draft';
  state.suggested_next_command = '/gpd-review --deep';
  state.blocked_by = [];
  completeGrill(state);
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.writeFileSync(path.join(meta, 'PROJECT.md'), '# Project\n\nProvider invocation test.\n');
  fs.writeFileSync(path.join(meta, 'STATE.md'), '# State\n\nStatus: Draft Complete.\n');
  fs.writeFileSync(path.join(meta, 'config.json'), '{"classification":{"purpose":"strategy_paper"}}\n');
  fs.writeFileSync(path.join(meta, 'PAPER-CONTEXT.md'), '# Paper Context\n\nCanonical term: operating layer.\n');
  fs.writeFileSync(path.join(meta, 'DECISIONS.md'), '# Decisions\n\n## PDR-001\n\nStatus: accepted\nDate: 2026-05-17\nDecision: Use operating layer.\n');
  fs.writeFileSync(path.join(meta, 'STRATEGY.md'), '# Strategy\n\nStatus: Go.\n');
  fs.writeFileSync(path.join(meta, 'RESEARCH.md'), '# Research\n\nResearch summary.\n');
  fs.writeFileSync(path.join(meta, 'RESEARCH.json'), '{"research_plan":{"question":"test"},"source_registry":[],"evidence_matrix":[]}\n');
  fs.writeFileSync(path.join(meta, 'FACT-CHECK.md'), '# Fact Check\n\nVerified.\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\nReady.\n');
  fs.writeFileSync(path.join(meta, 'READER-FEEDBACK.md'), '# Reader Feedback\n\nAsk clarity: 3.\n');
  fs.writeFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), '# Feedback Handling Plan\n\n**Status:** Approved.\n');
  fs.mkdirSync(path.join(meta, 'exports'), { recursive: true });
  fs.writeFileSync(path.join(meta, 'exports', 'FINAL.md'), '# Final\n\nReading copy.\n');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const providerDir = tempDir('gpd-provider-bin');
  const providerPath = path.join(providerDir, 'claude');
  const argsPath = path.join(providerDir, 'claude-args.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > "${argsPath}"`,
    'prompt=$(cat)',
    'if printf "%s" "$prompt" | grep -q "The ask is unclear" && printf "%s" "$prompt" | grep -q "Research Plan And Evidence Results" && printf "%s" "$prompt" | grep -q "Paper Decision Records" && printf "%s" "$prompt" | grep -q "Machine State" && printf "%s" "$prompt" | grep -q "Exported Reading Copy"; then',
    '  echo "HIGH: Provider saw full paper context."',
    'else',
    '  echo "LOW: Missing full paper context."',
    'fi',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'claude', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('external review: claude: running'));
  assert(output.includes('external review: claude: captured'));
  assert(output.includes('provider progress:'));
  assert(output.includes('reviews captured: 1'));
  assert(output.includes('review issues: 0'));
  assert(output.includes('- claude: captured (provider:claude)'));

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('## claude Review'));
  assert(externalReviews.includes('**Source:** provider:claude'));
  assert(externalReviews.includes('HIGH: Provider saw full paper context.'));
  assert(externalReviews.includes('installed provider CLIs'));
  assert(!externalReviews.includes(providerDir));
  assert(!externalReviews.includes('gpd-review-'));
  assert.strictEqual(fs.readFileSync(argsPath, 'utf8'), '-p\n');

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('HIGH: Provider saw full paper context.'));
  assert(feedbackPlan.includes('Pending user approval'));
}

function testReviewExternalUsesCodexProviderArgs() {
  const dir = tempDir('gpd-review-external-codex-provider-test');
  run(['init', '--location', dir, '--slug', 'codex-provider-review', '--title', 'Codex Provider Review']);
  const paperDir = path.join(dir, 'codex-provider-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const providerDir = tempDir('gpd-codex-provider-bin');
  const providerPath = path.join(providerDir, 'codex');
  const argsPath = path.join(providerDir, 'codex-args.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > "${argsPath}"`,
    'cat >/dev/null',
    'echo "HIGH: Codex provider saw draft context."',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'codex', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('reviews captured: 1'));
  assert(output.includes('- codex: captured (provider:codex)'));
  assert.strictEqual(fs.readFileSync(argsPath, 'utf8'), 'exec\n--skip-git-repo-check\n-\n');

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('HIGH: Codex provider saw draft context.'));
}

function testReviewExternalUsesGeminiProviderArgs() {
  const dir = tempDir('gpd-review-external-gemini-provider-test');
  run(['init', '--location', dir, '--slug', 'gemini-provider-review', '--title', 'Gemini Provider Review']);
  const paperDir = path.join(dir, 'gemini-provider-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const providerDir = tempDir('gpd-gemini-provider-bin');
  const providerPath = path.join(providerDir, 'gemini');
  const argsPath = path.join(providerDir, 'gemini-args.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > "${argsPath}"`,
    'cat >/dev/null',
    'echo "HIGH: Gemini provider saw draft context."',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'gemini', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('reviews captured: 1'));
  assert(output.includes('- gemini: captured (provider:gemini)'));
  assert.strictEqual(fs.readFileSync(argsPath, 'utf8'), '-p\n\n');

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('HIGH: Gemini provider saw draft context.'));
}

function testReviewExternalSkipsCurrentRuntimeProvider() {
  const dir = tempDir('gpd-review-external-self-skip-test');
  run(['init', '--location', dir, '--slug', 'self-skip-review', '--title', 'Self Skip Review']);
  const paperDir = path.join(dir, 'self-skip-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nBody.\n');

  const providerDir = tempDir('gpd-self-skip-provider-bin');
  const codexPath = path.join(providerDir, 'codex');
  const codexMarkerPath = path.join(providerDir, 'codex-ran.txt');
  fs.writeFileSync(codexPath, [
    '#!/bin/sh',
    `echo "ran" > "${codexMarkerPath}"`,
    'cat >/dev/null',
    'echo "HIGH: Codex should not have run."',
    '',
  ].join('\n'));
  fs.chmodSync(codexPath, 0o755);

  const claudePath = path.join(providerDir, 'claude');
  fs.writeFileSync(claudePath, [
    '#!/bin/sh',
    'cat >/dev/null',
    'echo "HIGH: Independent reviewer ran."',
    '',
  ].join('\n'));
  fs.chmodSync(claudePath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'codex,claude', '--current-runtime', 'codex', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('external review: codex: skipped_self_review'));
  assert(output.includes('external review: claude: running'));
  assert(output.includes('reviews captured: 1'));
  assert(output.includes('review issues: 1'));
  assert(output.includes('- codex: skipped_self_review (provider:codex)'));
  assert(output.includes('- claude: captured (provider:claude)'));
  assert(!fs.existsSync(codexMarkerPath));

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('Skipped provider "codex" because the current runtime is "codex".'));
  assert(externalReviews.includes('HIGH: Independent reviewer ran.'));
  assert(!externalReviews.includes('HIGH: Codex should not have run.'));
}

function testReviewExternalDoesNotUseOpencodeForPapers() {
  const dir = tempDir('gpd-review-external-opencode-provider-test');
  run(['init', '--location', dir, '--slug', 'opencode-provider-review', '--title', 'Opencode Provider Review']);
  const paperDir = path.join(dir, 'opencode-provider-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const providerDir = tempDir('gpd-opencode-provider-bin');
  const providerPath = path.join(providerDir, 'opencode');
  const markerPath = path.join(providerDir, 'opencode-ran.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `echo "ran" > "${markerPath}"`,
    'cat >/dev/null',
    'echo "HIGH: Opencode provider saw draft context."',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'opencode', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('external review: opencode: unsupported'));
  assert(output.includes('reviews captured: 0'));
  assert(output.includes('- opencode: unsupported (provider:opencode)'));
  assert(!fs.existsSync(markerPath));

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('Provider "opencode" is not supported by this CLI slice.'));
  assert(externalReviews.includes('Supported providers: gemini, claude, codex, qwen, cursor'));
}

function testReviewExternalRecordsMissingProvider() {
  const dir = tempDir('gpd-review-external-missing-provider-test');
  run(['init', '--location', dir, '--slug', 'missing-provider', '--title', 'Missing Provider']);
  const paperDir = path.join(dir, 'missing-provider');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nBody.\n');

  const output = run([
    'review-external',
    '--paper',
    paperDir,
    '--models',
    'definitely-missing-reviewer',
    '--timeout-ms',
    '5000',
  ]);
  assert(output.includes('reviews captured: 0'));
  assert(output.includes('review issues: 1'));
  assert(output.includes('- definitely-missing-reviewer: unsupported (provider:definitely-missing-reviewer)'));

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('Provider "definitely-missing-reviewer" is not supported by this CLI slice.'));
  assert(externalReviews.includes('Supported providers: gemini, claude, codex, qwen, cursor'));
  assert(fs.existsSync(path.join(meta, 'FEEDBACK-PLAN.md')));
}

function testReviewExternalRequiresDraft() {
  const dir = tempDir('gpd-review-external-missing-draft');
  run(['init', '--location', dir, '--slug', 'missing-draft']);
  const paperDir = path.join(dir, 'missing-draft');
  const reviewDir = tempDir('gpd-external-review-source');
  const reviewPath = path.join(reviewDir, 'review.md');
  fs.writeFileSync(reviewPath, 'HIGH: Missing draft should block review.\n');

  const failed = runFail(['review-external', '--paper', paperDir, '--review-file', reviewPath]);
  assert.strictEqual(failed.status, 1);
  assert(failed.stderr.includes('External review requires .paper/DRAFT.md.'));
  assert(!fs.existsSync(path.join(paperDir, '.paper', 'EXTERNAL-REVIEWS.md')));
  assert(!fs.existsSync(path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md')));
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

testHelpShowsCalibratedExternalReviewProviders();
testInstallerInstallDoctorRewriteAndBackup();
testListCommands();
testInitStatusValidate();
testStateJsonIsStatusSourceOfTruth();
testStateJsonSuggestedNextIsStatusSourceOfTruth();
testNextCommandExplainsMissingRequiredArtifactBeforeSavedState();
testNextCommandShowsCompactGuidance();
testInitWithoutSlugUsesSubdirectory();
testInitWithoutSlugOrLocationUsesSubdirectory();
testImportDryRunAndCopy();
testImportClassifications();
testSingleMarkdownImportIsCanonicalDraft();
testImportDocxCanonicalDraftExtraction();
testImportDetectsSourceReferencesWithoutGeneratingResearch();
testImportDraftSelectionUsesFilenameSignalsBeforeMtime();
testImportVersionSourceIndexGroupsMaterial();
testImportMaxFileBytesSkipsLargeFiles();
testImportWithoutSlugUsesSourceName();
testExportCommandWritesFinalAndState();
testReviewPackAndFeedbackCaptureFinalComments();
testExportCommandUsesDraftBodyWhenPreBodySectionsExist();
testExportCommandRequiresReadyReview();
testExportCommandHonorsStatusRouting();
testExportCommandBlocksBelowTargetReadyReview();
testReviewExternalCollectsReviewAndStopsAtApprovalGate();
testReviewExternalParsesGeminiSeverityFormat();
testReviewExternalCombinesAndStoresMultipleReviewers();
testReviewExternalInvokesProviderModel();
testReviewExternalUsesCodexProviderArgs();
testReviewExternalUsesGeminiProviderArgs();
testReviewExternalSkipsCurrentRuntimeProvider();
testReviewExternalDoesNotUseOpencodeForPapers();
testReviewExternalRecordsMissingProvider();
testReviewExternalRequiresDraft();
testMalformedInputs();

console.log('gpd cli tests passed');
