'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const { expandHome, slugify, writeFile } = require('../bin/lib/common');
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
  assert(output.includes('revise                       Prepare revision by snapshotting current paper state'));
  assert(output.includes('gpd revise --paper ~/papers/metadata-strategy --trigger .paper/FEEDBACK-PLAN.md'));
  assert(output.includes('improve                      Guide the accepted-baseline improvement loop'));
  assert(output.includes('gpd improve --paper ~/papers/metadata-strategy'));
  assert(output.includes('gpd improve --paper ~/papers/metadata-strategy --action compare'));
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

  const profileOutput = run(['list-profiles']);
  assert(profileOutput.includes('profiles:'));
  assert(profileOutput.includes('- head-data-ai-architecture: Head of Data and AI Architecture Profile'));
  assert(profileOutput.includes('path: profiles/head-data-ai-architecture.md'));
}

function testCommonWriteFileAndHomeExpansion() {
  const dir = tempDir('gpd-common-test');
  const target = path.join(dir, 'nested', 'STATE.json');
  writeFile(target, '{"version":1}\n', false);
  writeFile(target, '{"version":2}\n', false);
  assert.strictEqual(fs.readFileSync(target, 'utf8'), '{"version":2}\n');
  assert.strictEqual(
    fs.readdirSync(path.dirname(target)).filter((name) => name.includes('.tmp')).length,
    0,
  );
  assert(!expandHome('~/gpd-test-path').startsWith('~'));
}

function testImportAgainstExistingWorkspaceExplainsRecoveryPath() {
  const dir = tempDir('gpd-import-existing-workspace-test');
  run(['init', '--location', dir, '--slug', 'existing-paper', '--title', 'Existing Paper']);
  const source = path.join(dir, 'source.md');
  fs.writeFileSync(source, '# Existing Paper\n\nSource body.\n');

  const result = runFail(['import', '--source', source, '--location', dir, '--slug', 'existing-paper']);
  assert.strictEqual(result.status, 1);
  assert(result.stderr.includes('Refusing to overwrite existing paper workspace'));
  assert(result.stderr.includes('Choose a different --slug or --location'));
  assert(result.stderr.includes('run commands against this workspace with --paper'));
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

  const statusOutput = run(['status', '--paper', paperDir]);
  assert(statusOutput.includes('Next: /gpd-grill'));
  assert(statusOutput.includes('User action: Run the recommended command'));
  assert(!statusOutput.includes('artifacts:'));
  const fullStatusOutput = run(['status', '--paper', paperDir, '--full']);
  assert(fullStatusOutput.includes('artifacts:'));
  assert(fullStatusOutput.includes('- ok PROJECT.md'));

  const validation = spawnSync(process.execPath, [gpd, 'validate', '--paper', paperDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.strictEqual(validation.status, 1);
  assert(validation.stdout.includes('artifacts:'));
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

function validRevisionCheckMarkdown(snapshotId) {
  return [
    '# Revision Check',
    '',
    '## Revision Classification',
    '',
    '- **Revision timestamp:** 2026-05-19T10:00:00Z',
    '- **Revision source:** test',
    `- **Baseline compared:** .paper/versions/${snapshotId}`,
    `- **Baseline metadata:** .paper/versions/${snapshotId}/VERSION-METADATA.json`,
    '- **Current draft:** `.paper/DRAFT.md`',
    '- **Substantive revision:** Yes',
    '- **Reason:** test',
    '',
    '## Substantive Revision Definition',
    '',
    'Substantive revision changed draft body after review.',
    '',
    '## Before / After Quality Gate',
    '',
    '| Dimension | Baseline Score | Revised Score | Regression? | Evidence / Notes |',
    '|-----------|----------------|---------------|-------------|------------------|',
    '| Thesis clarity | 5 | 5 | No | preserved |',
    '| Argument flow | 5 | 5 | No | preserved |',
    '| Evidence support | 5 | 5 | No | preserved |',
    '| Audience fit | 5 | 5 | No | preserved |',
    '| Persona and voice | 5 | 5 | No | preserved |',
    '| Ask clarity | 5 | 5 | No | preserved |',
    '| Substance preservation | 5 | 5 | No | preserved |',
    '',
    '## Change Impact',
    '',
    '| Change | Intended Improvement | Regression Risk | Result |',
    '|--------|----------------------|-----------------|--------|',
    '| body | update | low | preserved |',
    '',
    '## Validator Interpretation',
    '',
    '- **Structural validation result:** ok',
    '- **Semantic validation result:** ok',
    '- **Snapshot hash validation:** ok',
    '- **Validator-driven edits made:** None',
    '- **Meaning-preservation check:** preserved',
    '',
    '## Decision',
    '',
    '- **Revision verdict:** Accept',
    '- **Reason:** no regression',
    '- **User approval required before export:** No',
    '- **Next action:** /gpd-export',
    '',
  ].join('\n');
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
  assert(output.includes('Recommended: /gpd-grill'));
  assert(output.includes('Why: The mandatory grill gate is incomplete'));
  assert(output.includes('User action: Run the recommended command'));
  assert(!output.includes('artifacts:'));
  assert(!output.includes('Context reset:'));

  const fullOutput = run(['next', '--paper', paperDir, '--full']);
  assert(fullOutput.includes('Context reset:'));
  assert(fullOutput.includes('Read:'));

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

  const statusOutput = run(['status', '--paper', paperDir]);
  assert(statusOutput.includes('Next: /gpd-grill'));
  assert(!statusOutput.includes('Recommended review:'), 'imported drafts should not show review guidance before grill is complete');
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

function authoredDraftText() {
  return [
    '# The Bottleneck Moved',
    '',
    'The bottleneck moved from generating more options to deciding which options deserve organizational trust. That change matters because the work no longer fails at the moment a team asks for ideas. It fails when the organization cannot tell which decision is safe, reversible, funded, and accountable.',
    '',
    'The old delivery model treated architecture as review after a design existed. That posture is too slow for AI-assisted work because agents can produce plausible alternatives faster than teams can inspect them. The scarce capability is judgment before generation, not another approval meeting after generation.',
    '',
    'A useful operating model makes the decision conditions visible before the work starts. It names who owns the constraint, what evidence proves the constraint was met, and which exceptions require human review. That is authored prose with a thesis, not raw notes waiting for a ghostwriter.',
  ].join('\n');
}

function testImportModeDefaultsAuthoredProseToPreserve() {
  const sourceDir = tempDir('gpd-import-mode-preserve-source');
  const source = path.join(sourceDir, 'current-draft.md');
  fs.writeFileSync(source, authoredDraftText());

  const target = tempDir('gpd-import-mode-preserve-target');
  const output = run(['import', '--source', source, '--location', target, '--slug', 'mode-preserve']);
  const paperDir = path.join(target, 'mode-preserve');
  const meta = path.join(paperDir, '.paper');

  assert(output.includes('import mode: preserve-and-strengthen (authored prose detected)'));
  const state = JSON.parse(fs.readFileSync(path.join(meta, 'STATE.json'), 'utf8'));
  assert.strictEqual(state.import_mode.detected, 'preserve-and-strengthen');
  assert.strictEqual(state.import_mode.confirmed, 'preserve-and-strengthen');
  assert.strictEqual(state.import_mode.authored_prose_detected, true);
  assert.strictEqual(state.import_mode.confirmation_required, false);

  const report = fs.readFileSync(path.join(meta, 'IMPORT.md'), 'utf8');
  assert(report.includes('## Import Mode'));
  assert(report.includes('| Detected mode | preserve-and-strengthen |'));
  assert(report.includes('| Confirmed mode | preserve-and-strengthen |'));
  assert(report.includes('| Authored prose detected | yes |'));
}

function testImportModeBlocksTransformOfAuthoredProseWithoutConfirmation() {
  const sourceDir = tempDir('gpd-import-mode-block-source');
  const source = path.join(sourceDir, 'current-draft.md');
  fs.writeFileSync(source, authoredDraftText());

  const target = tempDir('gpd-import-mode-block-target');
  const failed = runFail([
    'import',
    '--source',
    source,
    '--location',
    target,
    '--slug',
    'mode-block',
    '--mode',
    'generate-from-brief',
  ]);

  assert.strictEqual(failed.status, 1);
  assert(failed.stderr.includes('Import detected authored prose'));
  assert(failed.stderr.includes('--confirm-transform'));
  assert(!fs.existsSync(path.join(target, 'mode-block', '.paper', 'STATE.json')));
}

function testImportModeAllowsConfirmedTransformOfAuthoredProse() {
  const sourceDir = tempDir('gpd-import-mode-confirm-source');
  const source = path.join(sourceDir, 'current-draft.md');
  fs.writeFileSync(source, authoredDraftText());

  const target = tempDir('gpd-import-mode-confirm-target');
  const output = run([
    'import',
    '--source',
    source,
    '--location',
    target,
    '--slug',
    'mode-confirm',
    '--mode',
    'convert-format',
    '--confirm-transform',
  ]);
  const state = JSON.parse(fs.readFileSync(path.join(target, 'mode-confirm', '.paper', 'STATE.json'), 'utf8'));

  assert(output.includes('import mode: convert-format (authored prose detected)'));
  assert.strictEqual(state.import_mode.detected, 'preserve-and-strengthen');
  assert.strictEqual(state.import_mode.confirmed, 'convert-format');
  assert.strictEqual(state.import_mode.authored_prose_detected, true);
  assert.strictEqual(state.import_mode.confirmation_required, true);
  assert.strictEqual(state.import_mode.confirmation, 'confirmed_by_flag');
}

function rawMaterialText() {
  return [
    '# Notes',
    '',
    '- audience: operating executive',
    '- possible topic: evidence gate',
    '- TODO: pick the strongest thesis',
    '- source candidates: NIST, internal control notes',
    '- maybe compare two options',
  ].join('\n');
}

function testImportModeDefaultsRawMaterialToGenerateFromBrief() {
  const sourceDir = tempDir('gpd-import-mode-raw-source');
  const source = path.join(sourceDir, 'notes.md');
  fs.writeFileSync(source, rawMaterialText());

  const target = tempDir('gpd-import-mode-raw-target');
  const output = run(['import', '--source', source, '--location', target, '--slug', 'mode-raw']);
  const state = JSON.parse(fs.readFileSync(path.join(target, 'mode-raw', '.paper', 'STATE.json'), 'utf8'));

  assert(output.includes('import mode: generate-from-brief'));
  assert(!output.includes('(authored prose detected)'));
  assert.strictEqual(state.import_mode.detected, 'generate-from-brief');
  assert.strictEqual(state.import_mode.confirmed, 'generate-from-brief');
  assert.strictEqual(state.import_mode.authored_prose_detected, false);
  assert.strictEqual(state.import_mode.confirmation_required, false);
}

function testImportModeAllowsPreserveOnRawMaterial() {
  const sourceDir = tempDir('gpd-import-mode-raw-preserve-source');
  const source = path.join(sourceDir, 'notes.md');
  fs.writeFileSync(source, rawMaterialText());

  const target = tempDir('gpd-import-mode-raw-preserve-target');
  const output = run([
    'import',
    '--source',
    source,
    '--location',
    target,
    '--slug',
    'mode-raw-preserve',
    '--mode',
    'preserve-and-strengthen',
  ]);
  const state = JSON.parse(fs.readFileSync(path.join(target, 'mode-raw-preserve', '.paper', 'STATE.json'), 'utf8'));

  assert(output.includes('import mode: preserve-and-strengthen'));
  assert(!output.includes('(authored prose detected)'));
  assert.strictEqual(state.import_mode.detected, 'generate-from-brief');
  assert.strictEqual(state.import_mode.confirmed, 'preserve-and-strengthen');
  assert.strictEqual(state.import_mode.authored_prose_detected, false);
  assert.strictEqual(state.import_mode.confirmation_required, false);
}

function testImportModePrivateFixtureWhenConfigured() {
  const fixtureRoot = process.env.GPD_TEST_PAPER;
  if (!fixtureRoot) return;

  const source = fs.existsSync(path.join(fixtureRoot, 'peak', 'DRAFT.md'))
    ? path.join(fixtureRoot, 'peak', 'DRAFT.md')
    : path.join(fixtureRoot, 'fixtures', 'test-1-rca', 'peak', 'DRAFT.md');
  if (!fs.existsSync(source)) {
    throw new Error(`GPD_TEST_PAPER is set but no R14 peak fixture was found under: ${fixtureRoot}`);
  }

  const target = tempDir('gpd-import-mode-private-fixture');
  try {
    const positiveOutput = run([
      'import',
      '--source',
      source,
      '--location',
      target,
      '--slug',
      'acceptance-peak',
    ]);
    const state = JSON.parse(fs.readFileSync(path.join(target, 'acceptance-peak', '.paper', 'STATE.json'), 'utf8'));

    assert(positiveOutput.includes('import mode: preserve-and-strengthen (authored prose detected)'));
    assert.strictEqual(state.import_mode.detected, 'preserve-and-strengthen');
    assert.strictEqual(state.import_mode.confirmed, 'preserve-and-strengthen');
    assert.strictEqual(state.import_mode.authored_prose_detected, true);

    const negative = runFail([
      'import',
      '--source',
      source,
      '--location',
      target,
      '--slug',
      'acceptance-peak-blocked',
      '--mode',
      'generate-from-brief',
    ]);

    assert.strictEqual(negative.status, 1);
    assert(negative.stderr.includes('Import detected authored prose'));
    assert(negative.stderr.includes('--confirm-transform'));
    assert(!fs.existsSync(path.join(target, 'acceptance-peak-blocked', '.paper', 'STATE.json')));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
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
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), [
    '# Review',
    '',
    '## Verdict',
    '',
    'Ready',
    '',
    'Estimated quality: 9.1/10 for internal review',
    '',
    '## Later Review Addendum',
    '',
    'Estimated quality: 9.3/10 after revision',
    '',
    '## Current Review Addendum',
    '',
    '**Added:** 2026-05-23T20:07:00-0400',
    '',
    'Quality assessment: 9.4/10 for internal user review. This sentence should not be printed as part of the rating.',
    '',
    '## Older Review Addendum Appended Later',
    '',
    '**Added:** 2026-05-17T01:30:24Z',
    '',
    'Current rating: 8.8/10 older note',
    '',
  ].join('\n'));

  const output = run(['export', '--paper', paperDir]);
  assert(output.includes('exports/FINAL.md'));
  assert(output.includes('Rating: 9.4/10 for internal user review'));
  assert(output.includes('Next: Read FINAL.md.'));
  assert(output.includes('External review is most useful after the user confirms the current export'));
  assert(output.includes('After that:'));
  assert(output.includes('external review'));

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
  assert(updatedState.versioning.last_exported_draft_sha256);
  assert(updatedState.versioning.last_exported_final_sha256);
  const stateMarkdown = fs.readFileSync(path.join(meta, 'STATE.md'), 'utf8');
  assert(stateMarkdown.includes('**Status:** Exported'));
  assert(stateMarkdown.includes('**Suggested next command:** `/gpd-status`'));

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.artifacts['exports/FINAL.md'], true);
  assert.strictEqual(status.next, '/gpd-status');
  assert.strictEqual(status.reviewRating, '9.4/10 for internal user review');
  assert(status.reviewRecommendation.recommendation.startsWith('user review first'));
  assert(status.userAction.includes('Read .paper/exports/FINAL.md'));
  const statusOutput = run(['status', '--paper', paperDir]);
  assert(statusOutput.includes('Rating: 9.4/10 for internal user review'));
  assert(statusOutput.includes('Recommended review: user review first'));
  const nextOutput = run(['next', '--paper', paperDir]);
  assert(nextOutput.includes('Rating: 9.4/10 for internal user review'));
  assert(nextOutput.includes('Review path: user review first'));
}

function testNextUsesDraftHashForExportFreshness() {
  const dir = tempDir('gpd-export-hash-freshness-test');
  run(['init', '--location', dir, '--slug', 'export-hash-freshness', '--title', 'Export Hash Freshness']);
  const paperDir = path.join(dir, 'export-hash-freshness');
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

  const draftPath = path.join(meta, 'DRAFT.md');
  fs.writeFileSync(draftPath, '# Draft\n\n## Draft Body\n\nStable body.\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');
  run(['export', '--paper', paperDir, '--force']);

  const finalPath = path.join(meta, 'exports', 'FINAL.md');
  const future = new Date('2026-05-19T12:00:00Z');
  fs.utimesSync(draftPath, future, future);
  let status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.next, '/gpd-status');

  fs.writeFileSync(draftPath, '# Draft\n\n## Draft Body\n\nChanged body with old mtime.\n');
  const past = new Date('2026-05-19T09:00:00Z');
  const later = new Date('2026-05-19T10:00:00Z');
  fs.utimesSync(draftPath, past, past);
  fs.utimesSync(path.join(meta, 'REVIEW.md'), later, later);
  fs.utimesSync(finalPath, later, later);
  status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.next, '/gpd-export');
  assert(status.userAction.includes('Run /gpd-export'));
}

function testAcceptCommandPromotesFinalToAcceptedBaseline() {
  const dir = tempDir('gpd-accept-test');
  run(['init', '--location', dir, '--slug', 'accepted-paper', '--title', 'Accepted Paper']);
  const paperDir = path.join(dir, 'accepted-paper');
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

  fs.writeFileSync(
    path.join(meta, 'DRAFT.md'),
    '# Draft\n\n## Draft Body\n\nAccepted baseline explains the paper with enough stable words for a fair compare gate and preserves the same section shape.\n',
  );
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');
  run(['export', '--paper', paperDir, '--force']);

  const acceptOutput = run(['accept', '--paper', paperDir, '--source', 'final', '--note', 'User accepted reading copy.']);
  assert(acceptOutput.includes('Accepted baseline updated'));
  assert(acceptOutput.includes('Source: .paper/exports/FINAL.md'));
  assert(acceptOutput.includes('Accepted: .paper/accepted/ACCEPTED.md'));
  assert(acceptOutput.includes('Next: gpd status'));

  const acceptedPath = path.join(meta, 'accepted', 'ACCEPTED.md');
  const metadataPath = path.join(meta, 'accepted', 'ACCEPTED.meta.json');
  assert.strictEqual(
    fs.readFileSync(acceptedPath, 'utf8'),
    '# Accepted Paper\n\nAccepted baseline explains the paper with enough stable words for a fair compare gate and preserves the same section shape.\n',
  );
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  assert.strictEqual(metadata.version, 1);
  assert.strictEqual(metadata.source_artifact, '.paper/exports/FINAL.md');
  assert.strictEqual(metadata.accepted_path, '.paper/accepted/ACCEPTED.md');
  assert.strictEqual(metadata.accepted_sha256, metadata.source_sha256);
  assert(metadata.source_sha256);
  assert(metadata.draft_sha256);
  assert(metadata.final_sha256);
  assert.strictEqual(metadata.note, 'User accepted reading copy.');

  const acceptedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(acceptedState.status, 'Accepted');
  assert.strictEqual(acceptedState.accepted.version, 1);
  assert.strictEqual(acceptedState.accepted.source_artifact, '.paper/exports/FINAL.md');
  assert.strictEqual(acceptedState.accepted.accepted_sha256, metadata.accepted_sha256);

  let statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.next, '/gpd-status');
  assert.strictEqual(statusJson.acceptedSummary.exists, true);
  assert.strictEqual(statusJson.acceptedSummary.draft_status_since_accept, 'draft unchanged since accept');
  const statusOutput = run(['status', '--paper', paperDir]);
  assert(statusOutput.includes('Accepted baseline: .paper/accepted/ACCEPTED.md (draft unchanged since accept)'));
  assert(statusOutput.includes('Accepted baseline is set'));

  fs.writeFileSync(
    path.join(meta, 'DRAFT.md'),
    '# Accepted Paper\n\nCandidate baseline explains the paper with enough stable words for a fair compare gate and preserves the same section shape.\n',
  );
  statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.next, '/gpd-compare');
  assert.strictEqual(statusJson.acceptedSummary.draft_status_since_accept, 'draft changed since accept');

  const compareOutput = run(['compare', '--paper', paperDir]);
  assert(compareOutput.includes('Change set updated'));
  assert(compareOutput.includes('Verdict: changed_inconclusive'));
  assert(compareOutput.includes('Changed spans: 1'));
  assert(compareOutput.includes('Next: review CHANGESET.md before accepting'));
  const changeSetPath = path.join(meta, 'CHANGESET.json');
  const changeSetMarkdownPath = path.join(meta, 'CHANGESET.md');
  const changeSet = JSON.parse(fs.readFileSync(changeSetPath, 'utf8'));
  assert.strictEqual(changeSet.version, 1);
  assert.strictEqual(changeSet.baseline.path, '.paper/accepted/ACCEPTED.md');
  assert.strictEqual(changeSet.candidate.path, '.paper/DRAFT.md');
  assert.strictEqual(changeSet.verdict.pairwise, 'changed_inconclusive');
  assert.strictEqual(changeSet.changed_spans.length, 1);
  assert.strictEqual(changeSet.changed_spans[0].status, 'proposed');
  const changeSetMarkdown = fs.readFileSync(changeSetMarkdownPath, 'utf8');
  assert(changeSetMarkdown.includes('## Changed Spans'));
  assert(changeSetMarkdown.includes('## Advisory Findings'));
  assert(changeSetMarkdown.includes('- **Candidate SHA-256:**'));
  assert(run(['validate-artifact', '--path', changeSetPath]).includes('validation: ok'));

  statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.next, '/gpd-status');
  assert.strictEqual(statusJson.changeSetSummary.exists, true);
  assert.strictEqual(statusJson.changeSetSummary.current, true);
  assert.strictEqual(statusJson.changeSetSummary.pairwise, 'changed_inconclusive');

  fs.writeFileSync(
    path.join(meta, 'DRAFT.md'),
    '# Accepted Paper\n\nCandidate baseline explains the paper with enough stable words for a fair compare gate and changes after compare.\n',
  );
  statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.next, '/gpd-compare');
  assert.strictEqual(statusJson.changeSetSummary.current, false);

  fs.writeFileSync(
    path.join(meta, 'DRAFT.md'),
    '# Accepted Paper\n\nCandidate baseline explains the paper with enough stable words for a fair compare gate and preserves the same section shape.\n\nOne additional short sentence clarifies the point for review.\n',
  );
  const smallDeltaCompare = run(['compare', '--paper', paperDir]);
  assert(smallDeltaCompare.includes('Verdict: changed_inconclusive'));

  fs.writeFileSync(
    path.join(meta, 'DRAFT.md'),
    '# Accepted Paper Revised\n\nAccepted baseline explains the paper with enough stable words for a fair compare gate and preserves the same section shape.\n',
  );
  const renamedCompare = run(['compare', '--paper', paperDir]);
  assert(renamedCompare.includes('Verdict: changed_inconclusive'));
  assert(renamedCompare.includes('Renamed headings: Accepted Paper -> Accepted Paper Revised'));
  const renamedChangeSet = JSON.parse(fs.readFileSync(changeSetPath, 'utf8'));
  assert.strictEqual(renamedChangeSet.metrics.removed_headings.length, 0);
  assert.strictEqual(renamedChangeSet.metrics.renamed_headings.length, 1);
  assert.strictEqual(renamedChangeSet.metrics.renamed_headings[0].from, 'Accepted Paper');
  assert.strictEqual(renamedChangeSet.metrics.renamed_headings[0].to, 'Accepted Paper Revised');
  statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.changeSetSummary.renamed_heading_count, 1);
  assert.strictEqual(statusJson.changeSetSummary.removed_heading_count, 0);
  const renamedStatusOutput = run(['status', '--paper', paperDir]);
  assert(renamedStatusOutput.includes('Compare structure: added 0; removed 0; renamed 1'));
  assert(run(['validate-artifact', '--path', changeSetPath]).includes('validation: ok'));

  fs.writeFileSync(
    path.join(meta, 'DRAFT.md'),
    '# Different Title\n\nCandidate baseline explains the paper with enough stable words for a fair compare gate and changes the accepted heading.\n',
  );
  const regressionCompare = run(['compare', '--paper', paperDir]);
  assert(regressionCompare.includes('Verdict: regression_risk'));
  assert(regressionCompare.includes('Removed headings: Accepted Paper'));

  const snapshotOutput = run(['snapshot', '--paper', paperDir, '--reason', 'accepted_baseline_check']);
  assert(snapshotOutput.includes('accepted/ACCEPTED.md'));
  const snapshotId = fs.readdirSync(path.join(meta, 'versions')).find((name) => name.includes('accepted-baseline-check'));
  assert(snapshotId);
  assert.strictEqual(
    fs.readFileSync(path.join(meta, 'versions', snapshotId, 'accepted', 'ACCEPTED.md'), 'utf8'),
    '# Accepted Paper\n\nAccepted baseline explains the paper with enough stable words for a fair compare gate and preserves the same section shape.\n',
  );
}

function testCompareReportsProsePatternAdvisories() {
  const dir = tempDir('gpd-compare-prose-advisories');
  run(['init', '--location', dir, '--slug', 'prose-advisories', '--title', 'Prose Advisories']);
  const paperDir = path.join(dir, 'prose-advisories');
  const meta = path.join(paperDir, '.paper');
  const draftPath = path.join(meta, 'DRAFT.md');

  fs.writeFileSync(
    draftPath,
    [
      '# Prose Advisories',
      '',
      'The decision substrate keeps accountability visible. The decision substrate keeps sequencing visible. The decision substrate keeps ownership visible.',
      '',
      'The agent-ready change lane keeps governance close to delivery. The agent-ready change lane keeps decisions close to delivery. The agent-ready change lane keeps review close to delivery.',
      '',
    ].join('\n'),
  );
  run(['accept', '--paper', paperDir, '--source', 'draft']);
  fs.writeFileSync(path.join(meta, 'tier2b-patterns.json'), JSON.stringify({
    version: 1,
    categories: {
      drafting_scaffold_leak: {
        patterns: ['\\bcustom local scaffold\\b'],
      },
    },
  }, null, 2));

  fs.writeFileSync(
    draftPath,
    [
      '# Prose Advisories',
      '',
      'This paper explains why teams need a new model. The point most often missed is that the new model has two supports.',
      '',
      'Custom local scaffold should be caught by the paper-local pattern catalog.',
      '',
      'Teams can improve coordination because the process can support better alignment across the enterprise.',
      '',
      'Teams can improve coordination because the process can support better alignment across the enterprise.',
      '',
      'By Control Surface, I mean the interface where every team can see the same queue, which is not just a dashboard, but a complete way to govern work, align leaders, sequence changes, reduce ambiguity, and prevent surprises across many dependencies.',
      '',
      'The decision-fabric shapes the flow. The decision-fabric clarifies ownership. The decision-fabric keeps escalation visible.',
      '',
    ].join('\n'),
  );

  const output = run(['compare', '--paper', paperDir]);
  assert(output.includes('Advisories:'));
  const changeSetPath = path.join(meta, 'CHANGESET.json');
  const changeSet = JSON.parse(fs.readFileSync(changeSetPath, 'utf8'));
  const categories = new Set(changeSet.advisory_findings.map((finding) => finding.category));
  assert(categories.has('drafting_scaffold_leak'));
  assert(categories.has('repeated_restatement'));
  assert(categories.has('defended_jargon'));
  assert(categories.has('undefined_load_bearing_term'));
  assert(categories.has('multi_clause_overload'));
  assert(categories.has('abandoned_terminology'));
  assert(changeSet.advisory_findings.some((finding) => finding.evidence.toLowerCase().includes('custom local scaffold')));
  assert.strictEqual(changeSet.advisory_findings.every((finding) => finding.severity === 'advisory'), true);
  assert.strictEqual(changeSet.verdict.pairwise, 'changed_inconclusive');
  assert(run(['validate-artifact', '--path', changeSetPath]).includes('validation: ok'));
  const statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.changeSetSummary.advisory_count, changeSet.advisory_findings.length);
}

function testChangeSetCurrentRequiresCurrentAcceptedBaseline() {
  const dir = tempDir('gpd-changeset-baseline-current');
  run(['init', '--location', dir, '--slug', 'compare-currentness', '--title', 'Compare Currentness']);
  const paperDir = path.join(dir, 'compare-currentness');
  const meta = path.join(paperDir, '.paper');
  const draftPath = path.join(meta, 'DRAFT.md');
  const changeSetPath = path.join(meta, 'CHANGESET.json');

  fs.writeFileSync(draftPath, '# Baseline\n\nStable accepted body for the first baseline.\n');
  run(['accept', '--paper', paperDir, '--source', 'draft']);

  fs.writeFileSync(draftPath, '# Baseline\n\nCandidate body for the second baseline.\n');
  run(['compare', '--paper', paperDir]);
  let statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.changeSetSummary.current, true);

  const oldChangeSet = JSON.parse(fs.readFileSync(changeSetPath, 'utf8'));
  run(['accept', '--paper', paperDir, '--source', 'draft']);
  statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.next, '/gpd-status');
  assert.strictEqual(statusJson.acceptedSummary.draft_status_since_accept, 'draft unchanged since accept');
  assert.strictEqual(statusJson.changeSetSummary.exists, true);
  assert.strictEqual(statusJson.changeSetSummary.current, false);
  assert.strictEqual(statusJson.changeSetSummary.baseline_sha256, oldChangeSet.baseline.sha256);
  assert.notStrictEqual(statusJson.changeSetSummary.current_accepted_sha256, oldChangeSet.baseline.sha256);

  run(['compare', '--paper', paperDir]);
  statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.changeSetSummary.current, true);
  assert.strictEqual(statusJson.changeSetSummary.pairwise, 'unchanged');
}

function testImproveCommandGuidesAcceptedBaselineLoop() {
  const dir = tempDir('gpd-improve-loop');
  run(['init', '--location', dir, '--slug', 'improve-paper', '--title', 'Improve Paper']);
  const paperDir = path.join(dir, 'improve-paper');
  const meta = path.join(paperDir, '.paper');
  const draftPath = path.join(meta, 'DRAFT.md');

  fs.writeFileSync(
    draftPath,
    '# Improve Paper\n\nAccepted baseline keeps the argument stable before any candidate change.\n',
  );

  let output = run(['improve', '--paper', paperDir]);
  assert(output.includes('Stage: needs accepted baseline'));
  assert(output.includes(`Next: run gpd accept --paper ${paperDir} --source draft`));
  let json = JSON.parse(run(['improve', '--paper', paperDir, '--json']));
  assert.strictEqual(json.stage, 'needs_accepted_baseline');
  assert.strictEqual(json.next_command, `gpd accept --paper ${paperDir} --source draft`);

  run(['accept', '--paper', paperDir, '--source', 'draft']);
  output = run(['improve', '--paper', paperDir]);
  assert(output.includes('Stage: accepted current'));
  assert(output.includes('Candidate: draft unchanged since accept'));

  fs.writeFileSync(
    draftPath,
    '# Improve Paper\n\nCandidate baseline keeps the argument stable before any candidate change and adds a clearer author-owned sentence.\n',
  );
  output = run(['improve', '--paper', paperDir]);
  assert(output.includes('Stage: needs compare'));
  assert(output.includes(`Next: run gpd compare --paper ${paperDir}`));
  json = JSON.parse(run(['improve', '--paper', paperDir, '--json']));
  assert.strictEqual(json.stage, 'needs_compare');
  assert.strictEqual(json.next_command, `gpd compare --paper ${paperDir}`);

  output = run(['improve', '--paper', paperDir, '--action', 'compare']);
  assert(output.includes('Action: Compare updated CHANGESET.md and CHANGESET.json.'));
  assert(output.includes('Stage: review change set'));
  assert(fs.existsSync(path.join(meta, 'CHANGESET.json')));

  output = run(['improve', '--paper', paperDir]);
  assert(output.includes('Stage: review change set'));
  assert(output.includes('Compare: current changed_inconclusive'));
  assert(output.includes('Next: review '));
  assert(output.includes('Recommendation: Review CHANGESET.md'));
  json = JSON.parse(run(['improve', '--paper', paperDir, '--json']));
  assert.strictEqual(json.stage, 'review_change_set');
  assert.strictEqual(json.changeSet.current, true);
  assert.strictEqual(json.next_command, '');

  const finalSource = runFail(['improve', '--paper', paperDir, '--action', 'accept', '--source', 'final', '--note', 'Wrong source.']);
  assert.strictEqual(finalSource.status, 1);
  assert(finalSource.stderr.includes('CHANGESET compares accepted baseline to DRAFT.md'));

  output = run(['improve', '--paper', paperDir, '--action', 'accept', '--note', 'Candidate approved by author.']);
  assert(output.includes('Action: Candidate accepted as the new baseline.'));
  assert(output.includes('Stage: accepted current'));
  json = JSON.parse(run(['improve', '--paper', paperDir, '--json']));
  assert.strictEqual(json.stage, 'accepted_current');
}

function testImproveCommandBlocksRegressionRiskAcceptWithoutOverride() {
  const dir = tempDir('gpd-improve-risk');
  run(['init', '--location', dir, '--slug', 'risk-paper', '--title', 'Risk Paper']);
  const paperDir = path.join(dir, 'risk-paper');
  const meta = path.join(paperDir, '.paper');
  const draftPath = path.join(meta, 'DRAFT.md');

  fs.writeFileSync(
    draftPath,
    '# Risk Paper\n\n## Keep This Section\n\nAccepted baseline keeps a load-bearing section visible.\n',
  );
  run(['accept', '--paper', paperDir, '--source', 'draft']);
  fs.writeFileSync(
    draftPath,
    '# Risk Paper\n\nCandidate removes the load-bearing section.\n',
  );
  run(['improve', '--paper', paperDir, '--action', 'compare']);
  let json = JSON.parse(run(['improve', '--paper', paperDir, '--json']));
  assert.strictEqual(json.changeSet.pairwise, 'regression_risk');

  let blocked = runFail(['improve', '--paper', paperDir, '--action', 'accept']);
  assert.strictEqual(blocked.status, 1);
  assert(blocked.stderr.includes('Cannot accept a regression-risk candidate without --force and --note'));

  blocked = runFail(['improve', '--paper', paperDir, '--action', 'accept', '--force']);
  assert.strictEqual(blocked.status, 1);
  assert(blocked.stderr.includes('Cannot accept a regression-risk candidate without --force and --note'));

  const output = run(['improve', '--paper', paperDir, '--action', 'accept', '--force', '--note', 'Author accepts removal for this test.']);
  assert(output.includes('Action: Candidate accepted as the new baseline.'));
  json = JSON.parse(run(['improve', '--paper', paperDir, '--json']));
  assert.strictEqual(json.stage, 'accepted_current');
}

function testAcceptCommandCoversDraftDefaultErrorsAndValidation() {
  const dir = tempDir('gpd-accept-coverage');
  const outsideWorkspace = runFail(['accept'], { cwd: dir });
  assert.strictEqual(outsideWorkspace.status, 1);
  assert(outsideWorkspace.stderr.includes('No .paper workspace found'));

  run(['init', '--location', dir, '--slug', 'draft-paper', '--title', 'Draft Paper']);
  const paperDir = path.join(dir, 'draft-paper');
  const meta = path.join(paperDir, '.paper');

  let missing = runFail(['accept', '--paper', paperDir]);
  assert.strictEqual(missing.status, 1);
  assert(missing.stderr.includes('Cannot accept missing source artifact: .paper/DRAFT.md'));

  const compareBeforeAccept = runFail(['compare', '--paper', paperDir]);
  assert.strictEqual(compareBeforeAccept.status, 1);
  assert(compareBeforeAccept.stderr.includes('No accepted baseline found'));

  const draftPath = path.join(meta, 'DRAFT.md');
  fs.writeFileSync(draftPath, '# Draft Paper\n\nDraft baseline.\n');
  const dryRunOutput = run(['accept', '--paper', paperDir, '--dry-run']);
  assert(dryRunOutput.includes('Accepted baseline would be updated'));
  assert(dryRunOutput.includes('Next: rerun without --dry-run to update the accepted baseline'));
  assert(!fs.existsSync(path.join(meta, 'accepted', 'ACCEPTED.md')));

  const acceptDefault = run(['accept', '--paper', paperDir]);
  assert(acceptDefault.includes('Source: .paper/DRAFT.md'));
  let accepted = fs.readFileSync(path.join(meta, 'accepted', 'ACCEPTED.md'), 'utf8');
  assert.strictEqual(accepted, '# Draft Paper\n\nDraft baseline.\n');
  let metadata = JSON.parse(fs.readFileSync(path.join(meta, 'accepted', 'ACCEPTED.meta.json'), 'utf8'));
  assert.strictEqual(metadata.note, '');
  assert.strictEqual(metadata.source_artifact, '.paper/DRAFT.md');
  assert.strictEqual(metadata.accepted_sha256, metadata.source_sha256);
  assert(run(['validate-artifact', '--path', path.join(meta, 'accepted', 'ACCEPTED.meta.json')]).includes('validation: ok'));

  fs.writeFileSync(draftPath, '# Draft Paper\n\nSecond accepted baseline.\n');
  const acceptDraft = run(['accept', '--paper', paperDir, '--source', 'draft', '--note', 'Second pass.']);
  assert(acceptDraft.includes('Source: .paper/DRAFT.md'));
  accepted = fs.readFileSync(path.join(meta, 'accepted', 'ACCEPTED.md'), 'utf8');
  assert.strictEqual(accepted, '# Draft Paper\n\nSecond accepted baseline.\n');
  metadata = JSON.parse(fs.readFileSync(path.join(meta, 'accepted', 'ACCEPTED.meta.json'), 'utf8'));
  assert.strictEqual(metadata.note, 'Second pass.');

  const invalid = runFail(['accept', '--paper', paperDir, '--source', 'review']);
  assert.strictEqual(invalid.status, 1);
  assert(invalid.stderr.includes('--source must be draft or final'));

  metadata.accepted_sha256 = 'bad-hash';
  fs.writeFileSync(path.join(meta, 'accepted', 'ACCEPTED.meta.json'), JSON.stringify(metadata, null, 2));
  const badMetadata = runFail(['validate-artifact', '--path', path.join(meta, 'accepted', 'ACCEPTED.meta.json')]);
  assert.strictEqual(badMetadata.status, 1);
  assert(badMetadata.stdout.includes('$.accepted_sha256 does not match accepted/ACCEPTED.md'));
}

function testSnapshotCommandCreatesVersionAndRevisionLog() {
  const dir = tempDir('gpd-snapshot-test');
  run(['init', '--location', dir, '--slug', 'snapshot-paper', '--title', 'Snapshot Paper']);
  const paperDir = path.join(dir, 'snapshot-paper');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nImportant draft body.\n');
  fs.mkdirSync(path.join(meta, 'exports'), { recursive: true });
  fs.writeFileSync(path.join(meta, 'exports', 'FINAL.md'), '# Snapshot Paper\n\nReviewed export.\n');
  fs.mkdirSync(path.join(meta, 'sources'), { recursive: true });
  fs.writeFileSync(path.join(meta, 'sources', 'source-note.md'), '# Source\n\nEvidence note.\n');
  fs.mkdirSync(path.join(paperDir, 'original'), { recursive: true });
  fs.writeFileSync(path.join(paperDir, 'original', 'source-draft.md'), '# Original\n\nImported draft.\n');

  const output = run([
    'snapshot',
    '--paper',
    paperDir,
    '--reason',
    'before_substantive_revision',
    '--trigger',
    '.paper/FEEDBACK-PLAN.md',
    '--notes',
    'test snapshot',
  ]);
  assert(output.includes('snapshot: .paper/versions/REV-'));
  assert(output.includes('copied: DRAFT.md, exports/FINAL.md'));
  assert(output.includes(`restore: gpd restore --paper ${paperDir} --snapshot REV-`));
  assert(output.includes('next: continue the planned work; run gpd status if you are unsure what should happen next.'));

  const versionsDir = path.join(meta, 'versions');
  const versions = fs.readdirSync(versionsDir);
  assert.strictEqual(versions.length, 1);
  const snapshotDir = path.join(versionsDir, versions[0]);
  assert.strictEqual(fs.readFileSync(path.join(snapshotDir, 'DRAFT.md'), 'utf8'), '# Draft\n\nImportant draft body.\n');
  assert.strictEqual(fs.readFileSync(path.join(snapshotDir, 'exports', 'FINAL.md'), 'utf8'), '# Snapshot Paper\n\nReviewed export.\n');
  const metadata = JSON.parse(fs.readFileSync(path.join(snapshotDir, 'VERSION-METADATA.json'), 'utf8'));
  assert.strictEqual(metadata.snapshot_reason, 'before-substantive-revision');
  assert.strictEqual(metadata.trigger_artifact, '.paper/FEEDBACK-PLAN.md');
  assert(metadata.source_artifacts.includes('DRAFT.md'));
  assert(metadata.source_artifacts.includes('exports/FINAL.md'));
  assert(metadata.source_artifacts.includes('.paper/sources/source-note.md'));
  assert(metadata.source_artifacts.includes('original/source-draft.md'));
  assert(Array.isArray(metadata.file_hashes));
  assert(metadata.file_hashes.some((file) => file.source_path === '.paper/DRAFT.md' && file.sha256));
  assert.strictEqual(
    fs.readFileSync(path.join(snapshotDir, 'sources', 'source-note.md'), 'utf8'),
    '# Source\n\nEvidence note.\n',
  );
  assert.strictEqual(
    fs.readFileSync(path.join(snapshotDir, 'original', 'source-draft.md'), 'utf8'),
    '# Original\n\nImported draft.\n',
  );
  const revisionLog = fs.readFileSync(path.join(meta, 'REVISION-LOG.md'), 'utf8');
  assert(revisionLog.includes(`# Revision Log`));
  assert(revisionLog.includes(metadata.version_id));

  run(['snapshot', '--paper', paperDir, '--reason', 'second_snapshot']);
  const updatedVersions = fs.readdirSync(versionsDir);
  assert.strictEqual(updatedVersions.length, 2);
  const updatedRevisionLog = fs.readFileSync(path.join(meta, 'REVISION-LOG.md'), 'utf8');
  assert(updatedRevisionLog.includes(metadata.version_id));
  assert(updatedRevisionLog.includes('second-snapshot'));
  assert.strictEqual(
    fs.readdirSync(meta).filter((name) => name.includes('REVISION-LOG.md') && name.endsWith('.tmp')).length,
    0,
  );
}

function testReviseCommandCreatesPreRevisionSnapshotAndSurfacesRestore() {
  const dir = tempDir('gpd-revise-preflight-test');
  run(['init', '--location', dir, '--slug', 'revise-preflight', '--title', 'Revise Preflight']);
  const paperDir = path.join(dir, 'revise-preflight');
  const meta = path.join(paperDir, '.paper');
  const draftPath = path.join(meta, 'DRAFT.md');
  fs.writeFileSync(draftPath, '# Draft\n\nStrong version before risky revision.\n');
  fs.writeFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), '# Feedback Plan\n\n## Status\n\nApproved.\n');

  const output = run(['revise', '--paper', paperDir, '--trigger', '.paper/FEEDBACK-PLAN.md']);
  assert(output.includes('snapshot before revision: .paper/versions/REV-'));
  assert(output.includes('next: /gpd-revise'));
  assert(output.includes(`restore: gpd restore --paper ${paperDir} --snapshot REV-`));
  assert(output.includes('after revision: run /gpd-export, then read .paper/exports/FINAL.md before external review.'));
  assert(output.includes('why: user review confirms intent, voice, and calibration after substantive edits'));
  assert.strictEqual(fs.readFileSync(draftPath, 'utf8'), '# Draft\n\nStrong version before risky revision.\n');

  const state = JSON.parse(fs.readFileSync(path.join(meta, 'STATE.json'), 'utf8'));
  assert(state.versioning.last_snapshot_id.startsWith('REV-'));
  assert.strictEqual(state.versioning.active_revision_snapshot_id, state.versioning.last_snapshot_id);
  assert.strictEqual(state.suggested_next_command, '/gpd-revise');

  const snapshotDraft = fs.readFileSync(
    path.join(meta, 'versions', state.versioning.active_revision_snapshot_id, 'DRAFT.md'),
    'utf8',
  );
  assert.strictEqual(snapshotDraft, '# Draft\n\nStrong version before risky revision.\n');

  const statusOutput = run(['status', '--paper', paperDir]);
  assert(statusOutput.includes(`Snapshot: ${state.versioning.active_revision_snapshot_id}`));
  assert(statusOutput.includes(`Restore: gpd restore --paper ${paperDir} --snapshot ${state.versioning.active_revision_snapshot_id}`));

  const nextOutput = run(['next', '--paper', paperDir]);
  assert(nextOutput.includes(`Restore: gpd restore --paper ${paperDir} --snapshot ${state.versioning.active_revision_snapshot_id}`));

  fs.writeFileSync(draftPath, '# Draft\n\nRisky revised version after preflight.\n');
  const postEditStatusOutput = run(['status', '--paper', paperDir]);
  assert(postEditStatusOutput.includes(`Snapshot: ${state.versioning.active_revision_snapshot_id}`));
  assert(postEditStatusOutput.includes(`Restore: gpd restore --paper ${paperDir} --snapshot ${state.versioning.active_revision_snapshot_id}`));

  const statusJson = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(statusJson.latestSnapshotId, state.versioning.active_revision_snapshot_id);
  assert.strictEqual(statusJson.restoreCommand, `gpd restore --paper ${paperDir} --snapshot ${state.versioning.active_revision_snapshot_id}`);
}

function testReviseCommandRequiresDraft() {
  const dir = tempDir('gpd-revise-missing-draft-test');
  run(['init', '--location', dir, '--slug', 'revise-missing-draft', '--title', 'Revise Missing Draft']);
  const paperDir = path.join(dir, 'revise-missing-draft');

  const result = runFail(['revise', '--paper', paperDir]);
  assert.strictEqual(result.status, 1);
  assert(result.stderr.includes('Cannot prepare revision because .paper/DRAFT.md is missing'));
}

function testReviseCommandRejectsStaleRevisionInstructions() {
  const dir = tempDir('gpd-revise-stale-instructions-test');
  run(['init', '--location', dir, '--slug', 'stale-instructions', '--title', 'Stale Instructions']);
  const paperDir = path.join(dir, 'stale-instructions');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nBody.\n');
  const instructionsPath = path.join(meta, 'REVISION-INSTRUCTIONS.md');
  const feedbackPlanPath = path.join(meta, 'FEEDBACK-PLAN.md');
  fs.writeFileSync(instructionsPath, '# Revision Instructions\n\n**Status:** Ready for revision\n');
  fs.writeFileSync(feedbackPlanPath, '# Feedback Handling Plan\n\n**Status:** Approved by user\n');
  const oldTime = new Date(Date.now() - 20000);
  const newTime = new Date(Date.now() - 10000);
  fs.utimesSync(instructionsPath, oldTime, oldTime);
  fs.utimesSync(feedbackPlanPath, newTime, newTime);

  const defaultOutput = run(['revise', '--paper', paperDir]);
  assert(defaultOutput.includes('trigger: .paper/FEEDBACK-PLAN.md'));
  assert(!defaultOutput.includes('instructions: read .paper/REVISION-INSTRUCTIONS.md first'));

  const explicit = runFail(['revise', '--paper', paperDir, '--trigger', '.paper/REVISION-INSTRUCTIONS.md']);
  assert.strictEqual(explicit.status, 1);
  assert(explicit.stderr.includes('Cannot use .paper/REVISION-INSTRUCTIONS.md because FEEDBACK-PLAN.md is newer'));

  fs.unlinkSync(instructionsPath);
  const missing = runFail(['revise', '--paper', paperDir, '--trigger', '.paper/REVISION-INSTRUCTIONS.md']);
  assert.strictEqual(missing.status, 1);
  assert(missing.stderr.includes('Cannot use .paper/REVISION-INSTRUCTIONS.md because it is missing'));

  fs.writeFileSync(instructionsPath, '# Revision Instructions\n\n**Status:** Ready for revision\n');
  fs.writeFileSync(feedbackPlanPath, '# Feedback Handling Plan\n\n**Status:** Pending user approval\n');
  const pending = runFail(['revise', '--paper', paperDir, '--trigger', '.paper/REVISION-INSTRUCTIONS.md']);
  assert.strictEqual(pending.status, 1);
  assert(pending.stderr.includes('because FEEDBACK-PLAN.md is pending user approval'));
}

function testRestoreCommandRestoresSnapshotAndCreatesSafetySnapshot() {
  const dir = tempDir('gpd-restore-test');
  run(['init', '--location', dir, '--slug', 'restore-paper', '--title', 'Restore Paper']);
  const paperDir = path.join(dir, 'restore-paper');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nVersion one.\n');
  fs.mkdirSync(path.join(meta, 'sources'), { recursive: true });
  fs.writeFileSync(path.join(meta, 'sources', 'source-note.md'), 'source v1\n');

  run(['snapshot', '--paper', paperDir, '--reason', 'before_substantive_revision']);
  const firstSnapshot = fs.readdirSync(path.join(meta, 'versions'))[0];

  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nVersion two.\n');
  fs.writeFileSync(path.join(meta, 'sources', 'source-note.md'), 'source v2\n');

  const output = run(['restore', '--paper', paperDir, '--snapshot', firstSnapshot]);
  assert(output.includes(`restored: ${firstSnapshot}`));
  assert(output.includes('safety snapshot: .paper/versions/REV-'));
  assert.strictEqual(fs.readFileSync(path.join(meta, 'DRAFT.md'), 'utf8'), '# Draft\n\nVersion one.\n');
  assert.strictEqual(fs.readFileSync(path.join(meta, 'sources', 'source-note.md'), 'utf8'), 'source v1\n');

  const versions = fs.readdirSync(path.join(meta, 'versions'));
  assert.strictEqual(versions.length, 2);
  const restoredState = JSON.parse(fs.readFileSync(path.join(meta, 'STATE.json'), 'utf8'));
  assert.strictEqual(restoredState.versioning.last_restore_snapshot_id, firstSnapshot);
  const restoredStateMarkdown = fs.readFileSync(path.join(meta, 'STATE.md'), 'utf8');
  assert(restoredStateMarkdown.includes('- **Status:** Restored'));
  assert(restoredStateMarkdown.includes('- **Suggested next command:** `/gpd-status`'));
  assert(fs.readFileSync(path.join(meta, 'REVISION-LOG.md'), 'utf8').includes(`Restored ${firstSnapshot}`));
}

function testRestoreCommandRejectsTamperedSnapshot() {
  const dir = tempDir('gpd-restore-tamper-test');
  run(['init', '--location', dir, '--slug', 'restore-tamper', '--title', 'Restore Tamper']);
  const paperDir = path.join(dir, 'restore-tamper');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nVersion one.\n');

  run(['snapshot', '--paper', paperDir, '--reason', 'before_substantive_revision']);
  const snapshotId = fs.readdirSync(path.join(meta, 'versions'))[0];
  fs.writeFileSync(path.join(meta, 'versions', snapshotId, 'DRAFT.md'), '# Draft\n\nTampered snapshot.\n');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nCurrent version must survive.\n');

  const result = runFail(['restore', '--paper', paperDir, '--snapshot', snapshotId]);
  assert.strictEqual(result.status, 1);
  assert(result.stderr.includes('Snapshot integrity check failed'));
  assert(result.stderr.includes('hash mismatch: DRAFT.md'));
  assert.strictEqual(fs.readFileSync(path.join(meta, 'DRAFT.md'), 'utf8'), '# Draft\n\nCurrent version must survive.\n');
  assert.strictEqual(fs.readdirSync(path.join(meta, 'versions')).length, 1);
}

function testExportCommandSnapshotsExistingFinalBeforeOverwrite() {
  const dir = tempDir('gpd-export-snapshot-test');
  run(['init', '--location', dir, '--slug', 'export-snapshot', '--title', 'Export Snapshot']);
  const paperDir = path.join(dir, 'export-snapshot');
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
    '## Draft Body',
    '',
    'First export body.',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');
  run(['export', '--paper', paperDir, '--force']);
  const firstFinal = fs.readFileSync(path.join(meta, 'exports', 'FINAL.md'), 'utf8');
  assert(firstFinal.includes('First export body.'));

  run(['snapshot', '--paper', paperDir, '--reason', 'before_substantive_revision']);
  const baselineSnapshot = fs.readdirSync(path.join(meta, 'versions'))[0];
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), [
    '# Draft',
    '',
    '## Draft Body',
    '',
    'Second export body.',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(meta, 'REVISION-CHECK.md'), validRevisionCheckMarkdown(baselineSnapshot));
  const output = run(['export', '--paper', paperDir, '--force']);
  assert(output.includes('Snapshot: REV-'));

  const versions = fs.readdirSync(path.join(meta, 'versions'));
  assert.strictEqual(versions.length, 2);
  const exportSnapshot = versions.find((version) => version.includes('before-export-overwrite'));
  const snapshotFinal = fs.readFileSync(path.join(meta, 'versions', exportSnapshot, 'exports', 'FINAL.md'), 'utf8');
  assert(snapshotFinal.includes('First export body.'));
  const currentFinal = fs.readFileSync(path.join(meta, 'exports', 'FINAL.md'), 'utf8');
  assert(currentFinal.includes('Second export body.'));
  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.versioning.last_export_snapshot_id, exportSnapshot);
  assert(fs.readFileSync(path.join(meta, 'REVISION-LOG.md'), 'utf8').includes('before-export-overwrite'));
}

function testExportCommandRequiresCurrentRevisionCheckBeforeOverwritingFinal() {
  const dir = tempDir('gpd-export-revision-check-test');
  run(['init', '--location', dir, '--slug', 'export-revision-check', '--title', 'Export Revision Check']);
  const paperDir = path.join(dir, 'export-revision-check');
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

  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\n## Draft Body\n\nFirst body.\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');
  run(['export', '--paper', paperDir, '--force']);
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\n## Draft Body\n\nChanged body.\n');

  const result = runFail(['export', '--paper', paperDir, '--force']);
  assert.strictEqual(result.status, 1);
  assert(result.stderr.includes('Create a snapshot and REVISION-CHECK.md before overwriting a reviewed export'));
}

function testExportCommandRejectsStaleRevisionCheckBeforeOverwritingFinal() {
  const dir = tempDir('gpd-export-stale-revision-check-test');
  run(['init', '--location', dir, '--slug', 'export-stale-revision-check', '--title', 'Export Stale Revision Check']);
  const paperDir = path.join(dir, 'export-stale-revision-check');
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

  const draftPath = path.join(meta, 'DRAFT.md');
  const revisionCheckPath = path.join(meta, 'REVISION-CHECK.md');
  fs.writeFileSync(draftPath, '# Draft\n\n## Draft Body\n\nFirst body.\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');
  run(['export', '--paper', paperDir]);

  run(['snapshot', '--paper', paperDir, '--reason', 'before_substantive_revision']);
  const snapshotId = fs.readdirSync(path.join(meta, 'versions'))[0];
  fs.writeFileSync(revisionCheckPath, validRevisionCheckMarkdown(snapshotId));
  fs.writeFileSync(draftPath, '# Draft\n\n## Draft Body\n\nChanged after revision check.\n');

  const oldTime = new Date('2026-05-19T10:00:00Z');
  const newTime = new Date('2026-05-19T10:01:00Z');
  fs.utimesSync(revisionCheckPath, oldTime, oldTime);
  fs.utimesSync(draftPath, newTime, newTime);

  const result = runFail(['export', '--paper', paperDir, '--force']);
  assert.strictEqual(result.status, 1);
  assert(result.stderr.includes('REVISION-CHECK.md is older than DRAFT.md'));
  assert(fs.readFileSync(path.join(meta, 'exports', 'FINAL.md'), 'utf8').includes('First body.'));
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
  fs.appendFileSync(finalPath, [
    '',
    '//todo!: The ask is still unclear for the target reader.',
    'This sentence has a source URL https://example.com/path and should not become feedback.',
    'This sentence includes a protected phrase //keep: preserve the capability ownership language // that must remain readable.',
    'This sentence asks a question. //qq?: Is this supported by the research?',
    'This sentence uses scoped syntax. //review todo: The mechanism is unsupported and weak. //',
    'This sentence uses untyped scoped syntax //review this should not be captured // and should stay untouched.',
    'Architecture must support //todo: see https://example.com for details // and ship.',
    'This sentence has two comments //todo: first same-line issue// and then //todo: second same-line issue//.',
    '//keep: this NIST framing from https://nist.gov/x -- do not dilute //',
    '```js',
    '//todo: this is code and should not be captured',
    '```',
    '~~~js',
    '//todo: this is tilde-fenced code and should not be captured',
    '~~~',
    '',
  ].join('\n'));

  const packOutput = run(['review-pack', '--paper', paperDir]);
  assert(packOutput.includes('Review target: .paper/exports/FINAL.md'));
  assert(packOutput.includes('Editable source: .paper/DRAFT.md'));
  assert(packOutput.includes('Capture: gpd feedback'));

  const captureOutput = run(['feedback', 'collect', '--paper', paperDir]);
  assert(captureOutput.includes('Feedback captured: 8 comments'));
  assert(captureOutput.includes('GPD read:'));
  assert(captureOutput.includes('Recommendation:'));
  assert(captureOutput.includes('Top concerns:'));
  assert(captureOutput.includes('Next action: /gpd-feedback'));
  assert(captureOutput.includes('Preserved copy:'));
  assert(captureOutput.includes('Comments remain in the reviewed file until you run gpd feedback clean.'));
  assert(fs.readFileSync(finalPath, 'utf8').includes('//todo!: The ask is still unclear'));

  const reviewsDir = path.join(meta, 'reviews');
  const reviewArtifacts = fs.readdirSync(reviewsDir).filter((name) => name.startsWith('inline-feedback-'));
  assert.strictEqual(reviewArtifacts.length, 1);
  assert(fs.readFileSync(path.join(reviewsDir, reviewArtifacts[0]), 'utf8').includes('//keep: preserve the capability ownership language'));
  const snapshotDirs = fs.readdirSync(path.join(meta, 'versions')).filter((name) => name.includes('inline-feedback-collect'));
  assert(snapshotDirs.length >= 1);
  const snapshotReviewPath = path.join(meta, 'versions', snapshotDirs[0], 'reviews', reviewArtifacts[0]);
  assert(fs.existsSync(snapshotReviewPath), 'snapshot should include preserved review artifacts');
  const statusAfterFeedback = run(['status', '--paper', paperDir]);
  assert(statusAfterFeedback.includes(`Snapshot: ${snapshotDirs[0]}`));
  assert(statusAfterFeedback.includes(`Restore: gpd restore --paper ${paperDir} --snapshot ${snapshotDirs[0]}`));

  const readerFeedback = fs.readFileSync(path.join(meta, 'FEEDBACK-READER.md'), 'utf8');
  assert(readerFeedback.includes('**Source:** inline user comments'));
  assert(readerFeedback.includes('The ask is still unclear for the target reader.'));
  assert(readerFeedback.includes('preserve the capability ownership language'));
  assert(readerFeedback.includes('Is this supported by the research?'));
  assert(readerFeedback.includes('The mechanism is unsupported and weak.'));
  assert(readerFeedback.includes('see https://example.com for details'));
  assert(readerFeedback.includes('first same-line issue'));
  assert(readerFeedback.includes('second same-line issue'));
  assert(readerFeedback.includes('this NIST framing from https://nist.gov/x -- do not dilute'));
  assert(!readerFeedback.includes('https://example.com/path'));
  assert(!readerFeedback.includes('this should not be captured'));
  assert(!readerFeedback.includes('this is code and should not be captured'));
  assert(!readerFeedback.includes('this is tilde-fenced code and should not be captured'));
  assert(readerFeedback.includes('| Ask clarity |'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('**Status:** Pending user approval'));
  assert(feedbackPlan.includes('No draft or upstream artifact has been changed.'));
  assert(feedbackPlan.includes('### 1. Action: The ask is still unclear for the target reader.'));
  assert(feedbackPlan.includes('### 2. Preservation: preserve the capability ownership language'));
  assert(feedbackPlan.includes('### 3. Question: Is this supported by the research?'));
  assert(feedbackPlan.includes('### 4. Action: The mechanism is unsupported and weak.'));
  assert(feedbackPlan.includes('### 5. Action: see https://example.com for details'));
  assert(feedbackPlan.includes('### 6. Action: first same-line issue'));
  assert(feedbackPlan.includes('### 7. Action: second same-line issue'));
  assert(feedbackPlan.includes('### 8. Preservation: this NIST framing from https://nist.gov/x -- do not dilute'));
  assert(feedbackPlan.includes('**Initial assessment:** Agree. This is below-target reader friction'));
  assert(feedbackPlan.includes('**Clarification needed:** Clarify the intended story spine before editing prose.'));
  assert(feedbackPlan.includes('**Severity:** HIGH'));
  assert(feedbackPlan.includes('**Severity:** LOW'));
  assert(feedbackPlan.includes('**User Decision:** pending'));
  assert(feedbackPlan.includes('**User Constraint:** preserve the capability ownership language'));
  assert(feedbackPlan.includes('The ask is still unclear for the target reader.'));

  const listOutput = run(['feedback-plan', 'list', '--paper', paperDir]);
  assert(listOutput.includes('1. HIGH suggested=modify decision=pending The ask is still unclear for the target reader.'));
  assert(listOutput.includes('2. MEDIUM suggested=preserve decision=pending preserve the capability ownership language'));
  assert(listOutput.includes('3. LOW suggested=answer decision=pending Is this supported by the research?'));
  assert(listOutput.includes('4. HIGH suggested=modify decision=pending The mechanism is unsupported and weak.'));
  assert(listOutput.includes('5. MEDIUM suggested=modify decision=pending see https://example.com for details'));
  assert(listOutput.includes('6. MEDIUM suggested=modify decision=pending first same-line issue'));
  assert(listOutput.includes('7. MEDIUM suggested=modify decision=pending second same-line issue'));
  assert(listOutput.includes('8. MEDIUM suggested=preserve decision=pending this NIST framing from https://nist.gov/x -- do not dilute'));
  const reviewOutput = run(['feedback-plan', 'review', '--paper', paperDir, '--item', '1']);
  assert(reviewOutput.includes('Concern 1 of 8'));
  assert(reviewOutput.includes('The ask is still unclear for the target reader.'));
  assert(reviewOutput.includes('Recommended decision:'));
  assert(reviewOutput.includes('Decision needed: do you accept this concern?'));
  assert(reviewOutput.includes('- modify: accept the concern, but provide your instruction for how to handle it'));
  assert(reviewOutput.includes('- answered_no_action: answer a reviewer question and record that no paper change is needed'));
  assert(reviewOutput.includes('If you choose modify, include your handling instruction.'));
  assert(!reviewOutput.includes('Reviewer evidence:'));
  assert(reviewOutput.includes('More detail: rerun this command with --full.'));
  const fullReviewOutput = run(['feedback-plan', 'review', '--paper', paperDir, '--item', '1', '--full']);
  assert(fullReviewOutput.includes('Initial assessment:'));
  assert(fullReviewOutput.includes('Clarification needed:'));
  assert(fullReviewOutput.includes('Proposed edits:'));
  assert(fullReviewOutput.includes('Reviewer evidence:'));
  const decideOutput = run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '1', '--decision', 'modify', '--note', 'Keep the ask concise.']);
  assert(decideOutput.includes('decision: modify'));
  assert(decideOutput.includes('constraint: Keep the ask concise.'));
  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '2', '--decision', 'approve', '--note', 'Preserve the ownership language.']);
  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '3', '--decision', 'answered_no_action', '--note', 'Research already supports it.']);
  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '4', '--decision', 'approve', '--note', 'Clarify the mechanism.']);
  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '5', '--decision', 'approve', '--note', 'Use the cited URL.']);
  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '6', '--decision', 'approve', '--note', 'Fix the first same-line issue.']);
  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '7', '--decision', 'approve', '--note', 'Fix the second same-line issue.']);
  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '8', '--decision', 'approve', '--note', 'Preserve the NIST framing.']);
  const decidedPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(decidedPlan.includes('**Status:** Approved by user'));
  assert(decidedPlan.includes('**User Decision:** modify'));
  assert(decidedPlan.includes('**User Decision:** answered_no_action'));
  assert(decidedPlan.includes('**User Constraint:** Keep the ask concise.'));
  assert(decidedPlan.includes('| 1 | The ask is still unclear for the target reader. | Action | HIGH | modify | modify |'));
  assert(decidedPlan.includes('| 3 | Is this supported by the research? | Question | LOW | answer | answered_no_action |'));
  assert(!decidedPlan.includes('| 1 | The ask is still unclear for the target reader. | Action | HIGH | modify | pending |'));

  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.status, 'Feedback Pending');
  assert.strictEqual(updatedState.feedback.feedback_plan_status, 'Approved by user');
  const approvedStatus = run(['status', '--paper', paperDir]);
  assert(approvedStatus.includes('Next: /gpd-revise'));
  const revisionInstructions = fs.readFileSync(path.join(meta, 'REVISION-INSTRUCTIONS.md'), 'utf8');
  assert(revisionInstructions.includes('# Revision Instructions'));
  assert(revisionInstructions.includes('**Compilation basis:** Individual concerns'));
  assert(revisionInstructions.includes('### Concern 1: The ask is still unclear for the target reader.'));
  assert(revisionInstructions.includes('- **Decision:** modify'));
  assert(revisionInstructions.includes('- **Instruction:** Keep the ask concise.'));
  assert(revisionInstructions.includes('Concern 3 (answered_no_action): Is this supported by the research?'));
  assert(!revisionInstructions.includes('### Concern 3: Is this supported by the research?'));

  const cleanOutput = run(['feedback', 'clean', '--paper', paperDir]);
  assert(cleanOutput.includes('Comments removed: 8'));
  const cleanedFinal = fs.readFileSync(finalPath, 'utf8');
  assert(!cleanedFinal.includes('//todo!:'));
  assert(!cleanedFinal.includes('//keep:'));
  assert(!cleanedFinal.includes('//qq?:'));
  assert(!cleanedFinal.includes('//review todo:'));
  assert(cleanedFinal.includes('https://example.com/path'));
  assert(cleanedFinal.includes('//review this should not be captured //'));
  assert(cleanedFinal.includes('//todo: this is code and should not be captured'));
  assert(cleanedFinal.includes('//todo: this is tilde-fenced code and should not be captured'));
  assert(cleanedFinal.includes('This sentence includes a protected phrase that must remain readable.'));
  assert(cleanedFinal.includes('This sentence uses scoped syntax.'));
  assert(cleanedFinal.includes('Architecture must support and ship.'));
  assert(cleanedFinal.includes('This sentence has two comments and then .'));
  assert(!cleanedFinal.includes('see https://example.com for details'));
  assert(!cleanedFinal.includes('first same-line issue'));
  assert(!cleanedFinal.includes('second same-line issue'));
  assert(!cleanedFinal.includes('this NIST framing from https://nist.gov/x'));
}

function createFeedbackCapturePaper(name) {
  const dir = tempDir(name);
  run(['init', '--location', dir, '--slug', 'feedback-paper', '--title', 'Feedback Paper']);
  const paperDir = path.join(dir, 'feedback-paper');
  const meta = path.join(paperDir, '.paper');
  const statePath = path.join(meta, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
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
    'Feedback Capture Paper',
    '',
    '## Draft Body',
    '',
    'This draft exists so the export command has a body.',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\n## Verdict\n\nReady\n');
  run(['export', '--paper', paperDir, '--force']);
  return {
    paperDir,
    meta,
    finalPath: path.join(meta, 'exports', 'FINAL.md'),
  };
}

function testFeedbackCaptureAggregatesManyInlineCommentsByDefault() {
  const { paperDir, meta, finalPath } = createFeedbackCapturePaper('gpd-feedback-aggregate-test');
  fs.appendFileSync(finalPath, [
    '',
    '//todo: Opening does not state the ask clearly enough.',
    '//todo: Executive summary reads like notes instead of a thesis.',
    '//todo: Reader needs more context before the recommendation.',
    '//todo: The evidence claim needs a source and explanation.',
    '//todo: Clarify who owns the operating model.',
    '//todo: Explain how the control mechanism works.',
    '//todo: Section order is confusing; move prerequisite context earlier.',
    '//todo: This sentence is vague and sounds generic.',
    '//todo: Bound the risk claim so it does not overstate certainty.',
    '//todo: Measures need validation and baseline language.',
    '',
  ].join('\n'));

  const captureOutput = run(['feedback', '--paper', paperDir]);
  assert(captureOutput.includes('Feedback captured: 10 comments'));
  assert(captureOutput.includes('Decision needed: approve, modify, defer, or reject'));
  assert(captureOutput.includes('Top themes:'));

  const readerFeedback = fs.readFileSync(path.join(meta, 'FEEDBACK-READER.md'), 'utf8');
  assert(readerFeedback.includes('Opening does not state the ask clearly enough.'));
  assert(readerFeedback.includes('Measures need validation and baseline language.'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('**Mode:** Aggregate theme review'));
  assert(feedbackPlan.includes('**Raw comments captured:** 10'));
  assert(feedbackPlan.includes('Raw comments remain in `.paper/FEEDBACK-READER.md`'));
  assert(feedbackPlan.includes('### 1. Theme:'));
  assert(!feedbackPlan.includes('### 10. Action:'));
  assert(feedbackPlan.includes('Opening, thesis, and executive flow'));
  assert(feedbackPlan.includes('Evidence, sources, standards, and claim support'));
  assert(feedbackPlan.includes('Mechanism, ownership, and operating model'));

  const listOutput = run(['feedback-plan', 'list', '--paper', paperDir]);
  assert(listOutput.includes('concerns:'));
  assert(listOutput.includes('Opening, thesis, and executive flow'));
  assert(!listOutput.includes('10. MEDIUM suggested=modify decision=pending Measures need validation and baseline language.'));
}

function testFeedbackCaptureCanForceItemizedModeForManyComments() {
  const { paperDir, meta, finalPath } = createFeedbackCapturePaper('gpd-feedback-itemized-test');
  fs.appendFileSync(finalPath, [
    '',
    '//todo: Opening does not state the ask clearly enough.',
    '//todo: Executive summary reads like notes instead of a thesis.',
    '//todo: Reader needs more context before the recommendation.',
    '//todo: The evidence claim needs a source and explanation.',
    '//todo: Clarify who owns the operating model.',
    '//todo: Explain how the control mechanism works.',
    '//todo: Section order is confusing; move prerequisite context earlier.',
    '//todo: This sentence is vague and sounds generic.',
    '//todo: Bound the risk claim so it does not overstate certainty.',
    '//todo: Measures need validation and baseline language.',
    '',
  ].join('\n'));

  const captureOutput = run(['feedback', '--itemized', '--paper', paperDir]);
  assert(captureOutput.includes('Feedback captured: 10 comments'));
  assert(captureOutput.includes('Decision needed: approve, modify, defer, or reject'));
  assert(captureOutput.includes('Top concerns:'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(!feedbackPlan.includes('**Mode:** Aggregate theme review'));
  assert(feedbackPlan.includes('### 10. Action: Measures need validation and baseline language.'));
}

function testFeedbackPlanReviewGroupsManyConcernsByDefault() {
  const { paperDir, meta } = createFeedbackCapturePaper('gpd-feedback-decision-set-test');
  const planItems = [
    'The opening, executive summary, and Sections 1-2 repeat the same argument',
    'Sections 4 and 5 are the same content with different headings',
    "The Conway's law point is the strongest argument and appears once",
    'The decision substrate is described categorically, never shown',
    'The human by exception model is hollow',
    'The why architecture answer is asserted, not argued',
    'References are noisy',
  ];
  const itemMarkdown = planItems.map((title, index) => [
    `### ${index + 1}. Concern: ${title}`,
    '',
    '- **Type:** Concern',
    `- **Severity:** ${index < 6 ? 'HIGH' : 'LOW'}`,
    '- **Source(s):** claude',
    `- **Recommendation:** ${index < 6 ? 'modify' : 'defer'}`,
    '- **Why this matters:** This affects decision usefulness.',
    '- **What improves if addressed:** The paper becomes clearer.',
    '- **Risk if handled badly:** Do not expand the paper.',
    '- **Proposed handling:** Apply the concern with a bounded edit.',
    '- **Proposed edits:**',
    '  1. Bounded edit.',
    '- **Reviewer evidence:**',
    `  1. ${title}`,
    '- **Affected artifacts:** DRAFT',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
  ].join('\n')).join('\n');
  fs.writeFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), [
    '# Feedback Handling Plan',
    '',
    '**Created:** 2026-05-24T00:00:00Z',
    '**Based on:** `.paper/FEEDBACK-EXTERNAL.md`',
    '**Status:** Pending user approval',
    '',
    '## Decision Sets',
    '',
    '**Mode:** Aggregate (3 sets covering 7 concerns)',
    '',
    '### Set 1 -- MODIFY -- Structural compression',
    '',
    '- **Covers:** concerns 1, 2, 3',
    '- **Why:** Repetition and duplicate structures are real, but the paper should be compressed without losing the executive spine.',
    '- **Instruction:** Keep a concise executive summary and merge repeated diagnosis material.',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
    '### Set 2 -- MODIFY -- Make the decision substrate concrete',
    '',
    '- **Covers:** concerns 4, 5, 6',
    '- **Why:** Executives need to see how the capability works before approving the mandate.',
    '- **Instruction:** Add one short scenario and clarify ownership.',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
    '### Set 3 -- DEFER -- Low-risk polish',
    '',
    '- **Covers:** concerns 7',
    '- **Why:** Polish should not block structural revision.',
    '- **Instruction:** Defer unless the next revision touches the same sentence.',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
    '## Proposed Handling',
    '',
    itemMarkdown,
  ].join('\n'));

  const groupedOutput = run(['feedback-plan', 'review', '--paper', paperDir]);
  assert(groupedOutput.includes('Feedback decision set'));
  assert(groupedOutput.includes('MODIFY -- Structural compression'));
  assert(groupedOutput.includes('MODIFY -- Make the decision substrate concrete'));
  assert(groupedOutput.includes('DEFER -- Low-risk polish'));
  assert(groupedOutput.includes('Decision needed: approve this decision set, modify the set, or review individual concerns.'));
  assert(groupedOutput.includes('Next: reply with approve set, modify set, or review individual.'));

  const itemOutput = run(['feedback-plan', 'review', '--paper', paperDir, '--item', '1']);
  assert(itemOutput.includes('Feedback decision'));
  assert(itemOutput.includes('Concern 1 of 7'));
  assert(!itemOutput.includes('Feedback decision set'));
  assert(itemOutput.includes('modify -- Accept the concern, but handle it with this constraint: <your instruction>.'));
  assert(!itemOutput.includes('decision substrate'));
  assert(!itemOutput.includes('program authorization'));

  const setDecisionOutput = run([
    'feedback-plan',
    'decide',
    '--paper',
    paperDir,
    '--set',
    '1',
    '--decision',
    'approve',
    '--note',
    'Compress without expanding scope.',
  ]);
  assert(setDecisionOutput.includes('set: 1'));
  assert(setDecisionOutput.includes('decision: approve'));
  assert(setDecisionOutput.includes('covered concerns: 1, 2, 3'));
  const planAfterSetDecision = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(planAfterSetDecision.includes('### Set 1 -- MODIFY -- Structural compression'));
  assert(planAfterSetDecision.includes('- **User Decision:** approve'));
  assert(planAfterSetDecision.match(/### 1\. Concern: The opening[\s\S]*?- \*\*User Decision:\*\* modify/));
  assert(planAfterSetDecision.match(/### 2\. Concern: Sections 4 and 5[\s\S]*?- \*\*User Decision:\*\* modify/));
  assert(planAfterSetDecision.match(/### 3\. Concern: The Conway's law[\s\S]*?- \*\*User Decision:\*\* modify/));
  assert(planAfterSetDecision.includes('- **User Constraint:** Compress without expanding scope.'));

  run([
    'feedback-plan',
    'decide',
    '--paper',
    paperDir,
    '--set',
    '2',
    '--decision',
    'modify',
    '--note',
    'Show the decision substrate with one bounded example.',
  ]);
  const finalSetOutput = run([
    'feedback-plan',
    'decide',
    '--paper',
    paperDir,
    '--set',
    '3',
    '--decision',
    'approve',
    '--note',
    'Defer low-risk polish.',
  ]);
  assert(finalSetOutput.includes('status: Approved by user'));
  assert(finalSetOutput.includes('revision instructions: .paper/REVISION-INSTRUCTIONS.md'));
  const setInstructions = fs.readFileSync(path.join(meta, 'REVISION-INSTRUCTIONS.md'), 'utf8');
  assert(setInstructions.includes('**Compilation basis:** Decision Sets'));
  assert(setInstructions.includes('### Set 1: Structural compression'));
  assert(setInstructions.includes('- **Decision:** modify'));
  assert(setInstructions.includes('- **Instruction:** Compress without expanding scope.'));
  assert(setInstructions.includes('### Set 2: Make the decision substrate concrete'));
  assert(setInstructions.includes('- **Instruction:** Show the decision substrate with one bounded example.'));
  assert(!setInstructions.includes('### Set 3: Low-risk polish'));
  assert(setInstructions.includes('Decision Set 3 (defer): Low-risk polish. Defer low-risk polish.'));

  const ungrouped = createFeedbackCapturePaper('gpd-feedback-ungrouped-many-test');
  fs.writeFileSync(path.join(ungrouped.meta, 'FEEDBACK-PLAN.md'), [
    '# Feedback Handling Plan',
    '',
    '**Created:** 2026-05-24T00:00:00Z',
    '**Based on:** `.paper/FEEDBACK-EXTERNAL.md`',
    '**Status:** Pending user approval',
    '',
    '## Proposed Handling',
    '',
    itemMarkdown,
  ].join('\n'));
  const ungroupedOutput = run(['feedback-plan', 'review', '--paper', ungrouped.paperDir]);
  assert(ungroupedOutput.includes('Feedback decision'));
  assert(ungroupedOutput.includes('Concern 1 of 7'));
  assert(!ungroupedOutput.includes('Feedback decision set'));
}

function testRevisionInstructionsBlockOnInvalidDecisionSets() {
  const { paperDir, meta } = createFeedbackCapturePaper('gpd-feedback-instruction-block-test');
  fs.writeFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), [
    '# Feedback Handling Plan',
    '',
    '**Created:** 2026-05-24T00:00:00Z',
    '**Based on:** `.paper/FEEDBACK-EXTERNAL.md`',
    '**Status:** Pending user approval',
    '',
    '## Decision Sets',
    '',
    '**Mode:** Aggregate (2 sets covering 2 concerns)',
    '',
    '### Set 1 -- MODIFY -- First set',
    '',
    '- **Covers:** concerns 1, 2',
    '- **Why:** Grouped for revision.',
    '- **Instruction:** Apply both items.',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
    '### Set 2 -- MODIFY -- Overlapping set',
    '',
    '- **Covers:** concerns 2',
    '- **Why:** This overlap should block compiled instructions.',
    '- **Instruction:** Apply the second item differently.',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
    '## Proposed Handling',
    '',
    '### 1. Concern: First concern',
    '',
    '- **Type:** Concern',
    '- **Severity:** HIGH',
    '- **Source(s):** claude',
    '- **Recommendation:** modify',
    '- **Why this matters:** This matters.',
    '- **What improves if addressed:** Better paper.',
    '- **Risk if handled badly:** Expansion.',
    '- **Proposed handling:** Apply it.',
    '- **Proposed edits:**',
    '  1. Edit one.',
    '- **Reviewer evidence:**',
    '  1. Evidence one.',
    '- **Affected artifacts:** DRAFT',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
    '### 2. Concern: Second concern',
    '',
    '- **Type:** Concern',
    '- **Severity:** HIGH',
    '- **Source(s):** claude',
    '- **Recommendation:** modify',
    '- **Why this matters:** This also matters.',
    '- **What improves if addressed:** Better paper.',
    '- **Risk if handled badly:** Expansion.',
    '- **Proposed handling:** Apply it.',
    '- **Proposed edits:**',
    '  1. Edit two.',
    '- **Reviewer evidence:**',
    '  1. Evidence two.',
    '- **Affected artifacts:** DRAFT',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
    '',
  ].join('\n'));

  run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '1', '--decision', 'modify', '--note', 'Apply the first concern.']);
  const output = run(['feedback-plan', 'decide', '--paper', paperDir, '--item', '2', '--decision', 'modify', '--note', 'Apply the second concern.']);
  assert(output.includes('status: Approved by user'));
  assert(output.includes('revision instructions: blocked by feedback-plan validation issues'));
  assert(output.includes('semantic.feedback_decision_set_overlap'));
  assert(!fs.existsSync(path.join(meta, 'REVISION-INSTRUCTIONS.md')));
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
  fs.writeFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), [
    '# Feedback Handling Plan',
    '',
    '**Status:** Approved by user',
    '',
    '### 1. Concern: Prior approved concern',
    '',
    '- **User Decision:** modify',
    '- **User Constraint:** Preserve the executive ask.',
    '',
  ].join('\n'));

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
  assert(output.includes('review run:'));
  assert(output.includes('next: /gpd-feedback'));

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
  assert(externalReviews.includes('## claude Review'));
  assert(externalReviews.includes('**Source:** claude-review.md'));
  assert(externalReviews.includes('**Review run provenance:** `.paper/EXTERNAL-REVIEW-RUN.json`'));
  assert(externalReviews.includes('### HIGH — Ask is unclear'));
  assert(!externalReviews.includes(reviewDir));
  assert(externalReviews.includes('does not revise the draft'));
  assert(externalReviews.includes('requested model aliases or pins'));

  const reviewRun = JSON.parse(fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEW-RUN.json'), 'utf8'));
  assert.strictEqual(reviewRun.gpd_command, 'gpd review-external');
  assert.strictEqual(reviewRun.review_target, '.paper/DRAFT.md');
  assert.strictEqual(reviewRun.editable_source, '.paper/DRAFT.md');
  assert.deepStrictEqual(reviewRun.requested_providers, []);
  assert.strictEqual(reviewRun.current_runtime, null);
  assert(reviewRun.context_artifacts.some((item) => item.artifact === '.paper/STATE.json' && item.included));
  assert(reviewRun.context_artifacts.some((item) => item.artifact === '.paper/exports/FINAL.md' && !item.included));
  assert.strictEqual(reviewRun.reviewer_inputs[0].reviewer, 'claude');
  assert.strictEqual(reviewRun.reviewer_inputs[0].source_type, 'file');
  assert.strictEqual(reviewRun.reviewer_inputs[0].source, 'claude-review.md');
  assert(reviewRun.reviewer_inputs[0].raw_feedback_path.includes('.paper/feedback-external/'));
  assert(!JSON.stringify(reviewRun).includes(reviewDir));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('**Status:** Pending user approval'));
  assert(feedbackPlan.includes('## Below-Target Items'));
  assert(feedbackPlan.includes('Concern: Ask is unclear'));
  assert(feedbackPlan.includes('Concern: Evidence is thin'));
  assert(feedbackPlan.includes('Full reviewer text remains in `FEEDBACK-EXTERNAL.md`.'));
  assert(feedbackPlan.includes('Rewrite Section 8 as decidable actions.'));
  assert(feedbackPlan.includes('### 1. Concern:'));
  assert(feedbackPlan.includes('**Source(s):** claude'));
  assert(feedbackPlan.includes('**User Decision:** pending'));
  assert(feedbackPlan.includes('**Recommendation:** approve'));
  assert(feedbackPlan.includes('**Recommendation:** modify'));
  assert(!feedbackPlan.includes('ACTION'));
  assert(!feedbackPlan.includes('Fix Confidence'));
  assert(feedbackPlan.includes('**Why this matters:**'));
  assert(feedbackPlan.includes('**Proposed handling:**'));
  assert(feedbackPlan.includes('**Risk if handled badly:**'));
  assert(feedbackPlan.includes('**User Constraint:** none yet'));
  assert(feedbackPlan.includes('No draft or upstream artifact has been changed.'));
  assert(feedbackPlan.includes('## Prior Feedback Plan'));
  assert(feedbackPlan.includes('> - **User Constraint:** Preserve the executive ask.'));

  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.status, 'Feedback Pending');
  assert.strictEqual(updatedState.current_stage, 'External Review');
  assert.strictEqual(updatedState.last_completed_stage, 'External Review Capture');
  assert.strictEqual(updatedState.suggested_next_command, '/gpd-feedback');
  assert.strictEqual(updatedState.feedback.feedback_plan_status, 'Pending user approval');

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.artifacts['FEEDBACK-EXTERNAL.md'], true);
  assert.strictEqual(status.artifacts['FEEDBACK-PLAN.md'], true);
  assert.strictEqual(status.next, '/gpd-feedback');
}

function testReviewExternalParsesGeminiSeverityFormat() {
  const dir = tempDir('gpd-review-external-gemini-format-test');
  run(['init', '--location', dir, '--slug', 'gemini-format-review', '--title', 'Gemini Format Review']);
  const paperDir = path.join(dir, 'gemini-format-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe decision substrate is abstract.\n');

  const reviewDir = tempDir('gpd-gemini-review-source');
  const reviewPath = path.join(reviewDir, 'gemini-review.md');
  fs.writeFileSync(reviewPath, [
    '# External Review',
    '',
    '## Highest-Priority Concerns',
    '',
    '### 1. The Recursive Ownership Gap (Severity: HIGH)',
    '**Issue:** Who governs the governor?',
    '**Critique:** The decision substrate can become the new bottleneck.',
    '',
    '### 2. Deliverable Overlap (Severity: MEDIUM)',
    '**Issue:** Context packs and decision records overlap.',
    '**Critique:** Sponsors cannot map the list to budget.',
    '',
    '## Specific Suggested Changes',
    '',
    '### Section 4: Decision Substrate',
    '',
    '* **Section 4:** Define the human-by-exception trigger.',
    '* **Section 5:** Collapse the deliverables into product families.',
    '',
  ].join('\n'));

  const output = run(['review-external', '--paper', paperDir, '--review-file', `gemini=${reviewPath}`]);
  assert(output.includes('feedback items: 4'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('Concern: The Recursive Ownership Gap'));
  assert(feedbackPlan.includes('Concern: Deliverable Overlap'));
  assert(feedbackPlan.includes('Section 4: Define the human-by-exception trigger.'));
  assert(feedbackPlan.includes('Section 5: Collapse the deliverables into product families.'));
  assert(feedbackPlan.includes('**Recommendation:** approve'));
  assert(feedbackPlan.includes('**Recommendation:** modify'));
  assert(!feedbackPlan.includes('ACTION'));
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
  assert(output.includes('pending concerns:'));
  assert(output.includes('HIGH approve [claude, gemini]'));

  const storedDir = path.join(meta, 'feedback-external');
  const storedFiles = fs.readdirSync(storedDir).filter((file) => file.endsWith('.md'));
  assert.strictEqual(storedFiles.length, 2);
  assert(storedFiles.some((file) => file.includes('claude')));
  assert(storedFiles.some((file) => file.includes('gemini')));

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
  assert(externalReviews.includes('## Stored Reviewer Files'));
  assert(externalReviews.includes('.paper/feedback-external/'));
  assert(!externalReviews.includes(reviewDir));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('Recursive Ownership Gap') || feedbackPlan.includes('Recursive ownership gap'));
  assert(feedbackPlan.includes('**Source(s):** claude, gemini'));
  assert(feedbackPlan.includes('**Recommendation:** approve'));
  assert(feedbackPlan.includes('**Why this matters:**'));
  assert(feedbackPlan.includes('**Proposed handling:**'));
  assert(feedbackPlan.includes('**Risk if handled badly:**'));
  assert(feedbackPlan.includes('Counterfactual is abstract'));
  assert(feedbackPlan.includes('Deliverable overlap') || feedbackPlan.includes('Deliverable Bloat'));
  assert(feedbackPlan.includes('**Recommendation:** modify'));
}

function testReviewExternalKeepsProposedFixesMappedToConcerns() {
  const dir = tempDir('gpd-review-external-fix-mapping-test');
  run(['init', '--location', dir, '--slug', 'fix-mapping-review', '--title', 'Fix Mapping Review']);
  const paperDir = path.join(dir, 'fix-mapping-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nArchitecture owns the decision substrate.\n');

  const reviewDir = tempDir('gpd-fix-mapping-review-source');
  const claudePath = path.join(reviewDir, 'claude-review.md');
  fs.writeFileSync(claudePath, [
    '# Claude Review',
    '',
    '## Highest-Priority Concerns',
    '',
    '### HIGH — The platform engineering objection is named but not closed',
    '',
    'Section 3 says architecture owns cross-domain decision semantics and platform/engineering own delivery substrate. The sentence is a long noun phrase, not an argument.',
    '',
    '### HIGH — The four-role architect is structurally implausible',
    '',
    'SME + principal engineer + product owner + product designer is four substantial professions. In a regulated-enterprise context, this profile is rare enough that an executive will ask where these people come from.',
    '',
    '### MEDIUM — Regulated-enterprise scope is mostly typography',
    '',
    'The paper labels the scope regulated enterprise but many obligations cited are broadly applicable. The fix is to earn the regulated-enterprise framing.',
    '',
  ].join('\n'));

  const geminiPath = path.join(reviewDir, 'gemini-review.md');
  fs.writeFileSync(geminiPath, [
    '# Gemini Review',
    '',
    '## Highest-Priority Concerns',
    '',
    '### HIGH — The Architect as Builder Credibility Gap',
    '',
    'The paper asks architects to become principal engineers and product designers for the decision substrate. In many large regulated enterprises, the current architecture cohort is culturally and technically detached from building repo management, CI/CD, and executable policy.',
    '',
    '### MEDIUM — Decision Memory as a Resilience Control',
    '',
    'If Agent A and Agent B make conflicting boundary assumptions at machine speed, accidental architecture hardens before humans can intervene.',
    '',
    '### MEDIUM — Defining the Exception Trigger',
    '',
    'The human-by-exception model is central to safe acceleration, but the definition of an exception remains abstract.',
    '',
  ].join('\n'));

  run([
    'review-external',
    '--paper',
    paperDir,
    '--review-file',
    `claude=${claudePath}`,
    '--review-file',
    `gemini=${geminiPath}`,
  ]);

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  const planSections = feedbackPlan.split(/\n### \d+\. [^:\n]+: /);
  const sectionWith = (needle) => planSections.find((section) => (
    section.toLowerCase().includes(needle.toLowerCase())
    && section.includes('**Proposed handling:**')
  )) || '';
  assert(feedbackPlan.includes('**Proposed edits:**'));
  assert(feedbackPlan.includes('**Reviewer evidence:**'));
  assert(!feedbackPlan.includes('**Fix Confidence:**'));
  const platformSection = sectionWith('platform engineering objection');
  assert(platformSection.includes('architecture owns cross-domain decision semantics'));
  assert(platformSection.includes('platform and engineering own delivery substrate'));
  assert(!platformSection.includes('decision memory to resilience'));

  const builderSection = sectionWith('Architect as Builder Credibility Gap');
  assert(builderSection.includes('builder skills') || builderSection.includes('team capability and development path'));
  assert(!builderSection.includes('Clarify why the regulated-enterprise scope matters'));

  const regulatedScopeSection = sectionWith('Regulated-enterprise scope');
  assert(regulatedScopeSection.includes('Clarify why the regulated-enterprise scope matters'));

  const memorySection = sectionWith('Decision Memory as a Resilience Control');
  assert(memorySection.includes('stale or conflicting memory') || memorySection.includes('Frame decision memory as a resilience control'));

  const exceptionSection = sectionWith('Defining the Exception Trigger');
  assert(exceptionSection.includes('Define exception triggers concretely'));
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
  fs.writeFileSync(path.join(meta, 'PAPER-CONTEXT.md'), '# Paper Context\n\nCanonical term: decision substrate.\n');
  fs.writeFileSync(path.join(meta, 'DECISIONS.md'), '# Decisions\n\n## PDR-001\n\nStatus: accepted\nDate: 2026-05-17\nDecision: Use decision substrate.\n');
  fs.writeFileSync(path.join(meta, 'STRATEGY.md'), '# Strategy\n\nStatus: Go.\n');
  fs.writeFileSync(path.join(meta, 'RESEARCH.md'), '# Research\n\nResearch summary.\n');
  fs.writeFileSync(path.join(meta, 'RESEARCH.json'), '{"research_plan":{"question":"test"},"source_registry":[],"evidence_matrix":[]}\n');
  fs.writeFileSync(path.join(meta, 'FACT-CHECK.md'), '# Fact Check\n\nVerified.\n');
  fs.writeFileSync(path.join(meta, 'REVIEW.md'), '# Review\n\nReady.\n');
  fs.writeFileSync(path.join(meta, 'FEEDBACK-READER.md'), '# Reader Feedback\n\nAsk clarity: 3.\n');
  fs.writeFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), '# Feedback Handling Plan\n\n**Status:** Approved.\n');
  fs.mkdirSync(path.join(meta, 'exports'), { recursive: true });
  fs.writeFileSync(path.join(meta, 'exports', 'FINAL.md'), '# Final\n\nReading copy.\n');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const providerDir = tempDir('gpd-provider-bin');
  const providerPath = path.join(providerDir, 'claude');
  const argsPath = path.join(providerDir, 'claude-args.txt');
  const cwdPath = path.join(providerDir, 'claude-cwd.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > "${argsPath}"`,
    `pwd > "${cwdPath}"`,
    'printf "provider side effect\\n" > REVIEW.md',
    'prompt=$(cat)',
    'if printf "%s" "$prompt" | grep -q "The ask is unclear" && printf "%s" "$prompt" | grep -q "Research Plan And Evidence Results" && printf "%s" "$prompt" | grep -q "Paper Decision Records" && printf "%s" "$prompt" | grep -q "Machine State" && printf "%s" "$prompt" | grep -q "Exported Reading Copy" && printf "%s" "$prompt" | grep -q "Print the full review in your stdout response" && printf "%s" "$prompt" | grep -q "Do not create, modify, save, or reference any local files"; then',
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

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
  assert(externalReviews.includes('## claude Review'));
  assert(externalReviews.includes('**Source:** provider:claude'));
  assert(externalReviews.includes('HIGH: Provider saw full paper context.'));
  assert(externalReviews.includes('installed provider CLIs'));
  assert(externalReviews.includes('**Review run provenance:** `.paper/EXTERNAL-REVIEW-RUN.json`'));
  assert(!externalReviews.includes(providerDir));
  assert(!externalReviews.includes('gpd-review-'));
  assert.strictEqual(
    fs.readFileSync(argsPath, 'utf8'),
    '-p\n--model\nopus\n--effort\nxhigh\n',
  );
  const providerCwd = fs.readFileSync(cwdPath, 'utf8').trim();
  assert(providerCwd.includes('gpd-provider-review-'));
  assert(!fs.existsSync(path.join(process.cwd(), 'REVIEW.md')));
  assert(!fs.existsSync(path.join(paperDir, 'REVIEW.md')));

  const reviewRun = JSON.parse(fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEW-RUN.json'), 'utf8'));
  assert.strictEqual(reviewRun.review_target, '.paper/exports/FINAL.md');
  assert.deepStrictEqual(reviewRun.requested_providers, ['claude']);
  assert.strictEqual(reviewRun.current_runtime, null);
  assert.strictEqual(reviewRun.timeout_ms, 5000);
  assert.strictEqual(reviewRun.provider_configs[0].provider, 'claude');
  assert.strictEqual(reviewRun.provider_configs[0].command, 'claude');
  assert.deepStrictEqual(
    reviewRun.provider_configs[0].args,
    ['-p', '--model', 'opus', '--effort', 'xhigh'],
  );
  assert.strictEqual(reviewRun.provider_configs[0].status, 'captured');
  assert.strictEqual(reviewRun.provider_configs[0].requested_model, 'opus');
  assert.strictEqual(reviewRun.provider_configs[0].requested_model_type, 'provider_alias');
  assert.strictEqual(reviewRun.provider_configs[0].requested_effort, 'xhigh');
  assert.strictEqual(reviewRun.provider_configs[0].resolved_model, null);
  assert.deepStrictEqual(reviewRun.provider_configs[0].resolved_models, []);
  assert.strictEqual(reviewRun.provider_configs[0].resolution_status, 'not_reported_by_provider_cli');
  assert.strictEqual(reviewRun.provider_configs[0].reasoning_budget, 'xhigh');
  assert.strictEqual(reviewRun.provider_configs[0].working_directory_policy, 'isolated_temp_directory');
  assert(reviewRun.provider_configs[0].configuration_control.includes('requested model alias/pin'));
  assert(reviewRun.context_artifacts.some((item) => item.artifact === '.paper/exports/FINAL.md' && item.included));
  assert(!JSON.stringify(reviewRun).includes(providerDir));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('Provider saw full paper context.'));
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

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
  assert(externalReviews.includes('HIGH: Codex provider saw draft context.'));
}

function testReviewExternalDoesNotInventUnsupportedProviderModelOverride() {
  const dir = tempDir('gpd-review-external-unsupported-override-test');
  run(['init', '--location', dir, '--slug', 'unsupported-override-review', '--title', 'Unsupported Override Review']);
  const paperDir = path.join(dir, 'unsupported-override-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');
  const configPath = path.join(meta, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.review.external_models = {
    codex: {
      model: 'gpt-5',
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  const providerDir = tempDir('gpd-codex-unsupported-override-bin');
  const providerPath = path.join(providerDir, 'codex');
  const argsPath = path.join(providerDir, 'codex-unsupported-override-args.txt');
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
  assert.strictEqual(fs.readFileSync(argsPath, 'utf8'), 'exec\n--skip-git-repo-check\n-\n');

  const reviewRun = JSON.parse(fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEW-RUN.json'), 'utf8'));
  assert.strictEqual(reviewRun.provider_configs[0].requested_model, null);
  assert.strictEqual(reviewRun.provider_configs[0].requested_model_type, 'provider_default');
  assert.deepStrictEqual(reviewRun.provider_configs[0].ignored_overrides, [
    {
      field: 'model',
      reason: 'provider has no GPD-controlled model flag',
    },
  ]);
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
  const cwdPath = path.join(providerDir, 'gemini-cwd.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > "${argsPath}"`,
    `pwd > "${cwdPath}"`,
    'printf "provider side effect\\n" > REVIEW.md',
    'cat >/dev/null',
    'printf \'%s\\n\' \'{"response":"HIGH: Gemini provider saw draft context.","stats":{"models":{"gemini-3-pro-preview":{"tokens":{"total":42}}}}}\'',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'gemini', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('reviews captured: 1'));
  assert(output.includes('- gemini: captured (provider:gemini)'));
  assert.strictEqual(
    fs.readFileSync(argsPath, 'utf8'),
    '-p\n\n-m\npro\n--output-format\njson\n--approval-mode\nplan\n--skip-trust\n',
  );
  const providerCwd = fs.readFileSync(cwdPath, 'utf8').trim();
  assert(providerCwd.includes('gpd-provider-review-'));
  assert(!fs.existsSync(path.join(process.cwd(), 'REVIEW.md')));
  assert(!fs.existsSync(path.join(paperDir, 'REVIEW.md')));

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
  assert(externalReviews.includes('HIGH: Gemini provider saw draft context.'));

  const reviewRun = JSON.parse(fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEW-RUN.json'), 'utf8'));
  assert.strictEqual(reviewRun.provider_configs[0].requested_model, 'pro');
  assert.strictEqual(reviewRun.provider_configs[0].requested_model_type, 'provider_alias');
  assert.strictEqual(reviewRun.provider_configs[0].requested_effort, null);
  assert.strictEqual(reviewRun.provider_configs[0].resolved_model, 'gemini-3-pro-preview');
  assert.deepStrictEqual(reviewRun.provider_configs[0].resolved_models, ['gemini-3-pro-preview']);
  assert.strictEqual(reviewRun.provider_configs[0].resolution_status, 'resolved_from_provider_stats');
  assert.strictEqual(reviewRun.provider_configs[0].resolution_source, 'stdout_json.stats.models');
  assert.strictEqual(reviewRun.provider_configs[0].reasoning_budget, null);
  assert.strictEqual(reviewRun.provider_configs[0].working_directory_policy, 'isolated_temp_directory');
  assert.deepStrictEqual(
    reviewRun.provider_configs[0].args,
    ['-p', '', '-m', 'pro', '--output-format', 'json', '--approval-mode', 'plan', '--skip-trust'],
  );
}

function testReviewExternalUsesPerPaperProviderModelOverride() {
  const dir = tempDir('gpd-review-external-model-override-test');
  run(['init', '--location', dir, '--slug', 'model-override-review', '--title', 'Model Override Review']);
  const paperDir = path.join(dir, 'model-override-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');
  const configPath = path.join(meta, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.review.external_models = {
    gemini: {
      model: 'gemini-3-pro-preview',
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  const providerDir = tempDir('gpd-gemini-override-provider-bin');
  const providerPath = path.join(providerDir, 'gemini');
  const argsPath = path.join(providerDir, 'gemini-override-args.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > "${argsPath}"`,
    'cat >/dev/null',
    'printf \'%s\\n\' \'{"response":"HIGH: Gemini override reviewer ran.","stats":{"models":{"gemini-3-pro-preview":{"tokens":{"total":12}}}}}\'',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'gemini', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('reviews captured: 1'));
  assert.strictEqual(
    fs.readFileSync(argsPath, 'utf8'),
    '-p\n\n-m\ngemini-3-pro-preview\n--output-format\njson\n--approval-mode\nplan\n--skip-trust\n',
  );

  const reviewRun = JSON.parse(fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEW-RUN.json'), 'utf8'));
  assert.strictEqual(reviewRun.provider_configs[0].requested_model, 'gemini-3-pro-preview');
  assert.strictEqual(reviewRun.provider_configs[0].requested_model_type, 'explicit_pin');
  assert.strictEqual(reviewRun.provider_configs[0].resolved_model, 'gemini-3-pro-preview');
  assert.strictEqual(reviewRun.provider_configs[0].resolution_status, 'resolved_from_provider_stats');

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
  assert(externalReviews.includes('HIGH: Gemini override reviewer ran.'));
}

function testReviewExternalUsesClaudeEffortOverride() {
  const dir = tempDir('gpd-review-external-claude-effort-override-test');
  run(['init', '--location', dir, '--slug', 'claude-effort-override-review', '--title', 'Claude Effort Override Review']);
  const paperDir = path.join(dir, 'claude-effort-override-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');
  const configPath = path.join(meta, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.review.external_models = {
    claude: {
      model: 'sonnet',
      effort: 'max',
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  const providerDir = tempDir('gpd-claude-effort-override-provider-bin');
  const providerPath = path.join(providerDir, 'claude');
  const argsPath = path.join(providerDir, 'claude-effort-override-args.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `printf '%s\\n' "$@" > "${argsPath}"`,
    'cat >/dev/null',
    'echo "HIGH: Claude override reviewer ran."',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'claude', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('reviews captured: 1'));
  assert.strictEqual(
    fs.readFileSync(argsPath, 'utf8'),
    '-p\n--model\nsonnet\n--effort\nmax\n',
  );

  const reviewRun = JSON.parse(fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEW-RUN.json'), 'utf8'));
  assert.strictEqual(reviewRun.provider_configs[0].requested_model, 'sonnet');
  assert.strictEqual(reviewRun.provider_configs[0].requested_model_type, 'provider_alias');
  assert.strictEqual(reviewRun.provider_configs[0].requested_effort, 'max');
  assert.deepStrictEqual(reviewRun.provider_configs[0].ignored_overrides, []);
}

function testReviewExternalRecordsMalformedGeminiJsonResolution() {
  const dir = tempDir('gpd-review-external-malformed-gemini-json-test');
  run(['init', '--location', dir, '--slug', 'malformed-gemini-review', '--title', 'Malformed Gemini Review']);
  const paperDir = path.join(dir, 'malformed-gemini-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const providerDir = tempDir('gpd-malformed-gemini-provider-bin');
  const providerPath = path.join(providerDir, 'gemini');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    'cat >/dev/null',
    'echo "HIGH: Gemini returned non-json text."',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'gemini', '--current-runtime', 'none', '--timeout-ms', '5000'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('reviews captured: 1'));

  const reviewRun = JSON.parse(fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEW-RUN.json'), 'utf8'));
  assert.strictEqual(reviewRun.provider_configs[0].resolution_status, 'resolution_parse_failed');
  assert.strictEqual(reviewRun.provider_configs[0].resolution_source, 'stdout_json');
  assert(reviewRun.provider_configs[0].resolution_error);

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
  assert(externalReviews.includes('HIGH: Gemini returned non-json text.'));
}

function testReviewExternalProviderTimeoutCleansUpProcessTree() {
  const dir = tempDir('gpd-review-external-timeout-provider-test');
  run(['init', '--location', dir, '--slug', 'timeout-provider-review', '--title', 'Timeout Provider Review']);
  const paperDir = path.join(dir, 'timeout-provider-review');
  const meta = path.join(paperDir, '.paper');
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThe ask is unclear.\n');

  const providerDir = tempDir('gpd-timeout-provider-bin');
  const providerPath = path.join(providerDir, 'gemini');
  const childPidPath = path.join(providerDir, 'child-pid.txt');
  fs.writeFileSync(providerPath, [
    '#!/bin/sh',
    `( sleep 30 ) &`,
    `echo "$!" > "${childPidPath}"`,
    'cat >/dev/null',
    'wait',
    '',
  ].join('\n'));
  fs.chmodSync(providerPath, 0o755);

  const output = run(
    ['review-external', '--paper', paperDir, '--models', 'gemini', '--current-runtime', 'none', '--timeout-ms', '1500'],
    { env: { ...process.env, PATH: `${providerDir}${path.delimiter}${process.env.PATH}` } },
  );
  assert(output.includes('external review: gemini: timed_out'));
  assert(output.includes('- gemini: timed_out (provider:gemini)'));
  assert(output.includes('review issues: 1'));

  const childPid = Number(fs.readFileSync(childPidPath, 'utf8').trim());
  assert(Number.isFinite(childPid));
  let childStillRunning = true;
  try {
    process.kill(childPid, 0);
  } catch (err) {
    childStillRunning = false;
  }
  assert.strictEqual(childStillRunning, false);

  const timeoutReviewPath = fs.existsSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'))
    ? path.join(meta, 'FEEDBACK-EXTERNAL.md')
    : path.join(meta, 'EXTERNAL-REVIEWS.md');
  const externalReviews = fs.readFileSync(timeoutReviewPath, 'utf8');
  assert(externalReviews.includes('Provider CLI "gemini" timed out after 1500ms.'));
  assert(externalReviews.includes('GPD requested cleanup for the provider process tree.'));
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

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
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

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
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

  const externalReviews = fs.readFileSync(path.join(meta, 'FEEDBACK-EXTERNAL.md'), 'utf8');
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
  assert(!fs.existsSync(path.join(paperDir, '.paper', 'FEEDBACK-EXTERNAL.md')));
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
testCommonWriteFileAndHomeExpansion();
testImportAgainstExistingWorkspaceExplainsRecoveryPath();
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
testImportModeDefaultsAuthoredProseToPreserve();
testImportModeBlocksTransformOfAuthoredProseWithoutConfirmation();
testImportModeAllowsConfirmedTransformOfAuthoredProse();
testImportModeDefaultsRawMaterialToGenerateFromBrief();
testImportModeAllowsPreserveOnRawMaterial();
testImportModePrivateFixtureWhenConfigured();
testImportDocxCanonicalDraftExtraction();
testImportDetectsSourceReferencesWithoutGeneratingResearch();
testImportDraftSelectionUsesFilenameSignalsBeforeMtime();
testImportVersionSourceIndexGroupsMaterial();
testImportMaxFileBytesSkipsLargeFiles();
testImportWithoutSlugUsesSourceName();
testExportCommandWritesFinalAndState();
testNextUsesDraftHashForExportFreshness();
testAcceptCommandPromotesFinalToAcceptedBaseline();
testCompareReportsProsePatternAdvisories();
testChangeSetCurrentRequiresCurrentAcceptedBaseline();
testImproveCommandGuidesAcceptedBaselineLoop();
testImproveCommandBlocksRegressionRiskAcceptWithoutOverride();
testAcceptCommandCoversDraftDefaultErrorsAndValidation();
testSnapshotCommandCreatesVersionAndRevisionLog();
testReviseCommandCreatesPreRevisionSnapshotAndSurfacesRestore();
testReviseCommandRequiresDraft();
testReviseCommandRejectsStaleRevisionInstructions();
testRestoreCommandRestoresSnapshotAndCreatesSafetySnapshot();
testRestoreCommandRejectsTamperedSnapshot();
testExportCommandSnapshotsExistingFinalBeforeOverwrite();
testExportCommandRequiresCurrentRevisionCheckBeforeOverwritingFinal();
testExportCommandRejectsStaleRevisionCheckBeforeOverwritingFinal();
testReviewPackAndFeedbackCaptureFinalComments();
testFeedbackCaptureAggregatesManyInlineCommentsByDefault();
testFeedbackCaptureCanForceItemizedModeForManyComments();
testFeedbackPlanReviewGroupsManyConcernsByDefault();
testRevisionInstructionsBlockOnInvalidDecisionSets();
testExportCommandUsesDraftBodyWhenPreBodySectionsExist();
testExportCommandRequiresReadyReview();
testExportCommandHonorsStatusRouting();
testExportCommandBlocksBelowTargetReadyReview();
testReviewExternalCollectsReviewAndStopsAtApprovalGate();
testReviewExternalParsesGeminiSeverityFormat();
testReviewExternalCombinesAndStoresMultipleReviewers();
testReviewExternalKeepsProposedFixesMappedToConcerns();
testReviewExternalInvokesProviderModel();
testReviewExternalUsesCodexProviderArgs();
testReviewExternalDoesNotInventUnsupportedProviderModelOverride();
testReviewExternalUsesGeminiProviderArgs();
testReviewExternalUsesPerPaperProviderModelOverride();
testReviewExternalUsesClaudeEffortOverride();
testReviewExternalRecordsMalformedGeminiJsonResolution();
testReviewExternalProviderTimeoutCleansUpProcessTree();
testReviewExternalSkipsCurrentRuntimeProvider();
testReviewExternalDoesNotUseOpencodeForPapers();
testReviewExternalRecordsMissingProvider();
testReviewExternalRequiresDraft();
testMalformedInputs();

console.log('gpd cli tests passed');
