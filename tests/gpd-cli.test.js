'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const { slugify } = require('../bin/lib/common');

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

  const semanticValidation = runFail(['validate', '--paper', paperDir, '--semantic']);
  assert.strictEqual(semanticValidation.status, 1);
  assert(!semanticValidation.stdout.includes('STATE.md: Status'));
  assert(!semanticValidation.stdout.includes('STATE.md: Suggested next command'));
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

  const finalPath = path.join(meta, 'exports', 'FINAL.md');
  assert(fs.existsSync(finalPath));
  const final = fs.readFileSync(finalPath, 'utf8');
  assert(final.includes('# Exportable Paper'));
  assert(final.includes('## Opening'));
  assert(final.includes('Final body.'));
  assert(!final.includes('Draft Notes'));

  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.status, 'Exported');
  assert.strictEqual(updatedState.suggested_next_command, '/gpd-progress');
  const stateMarkdown = fs.readFileSync(path.join(meta, 'STATE.md'), 'utf8');
  assert(stateMarkdown.includes('**Status:** Exported'));
  assert(stateMarkdown.includes('**Suggested next command:** `/gpd-progress`'));

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.artifacts['exports/FINAL.md'], true);
  assert.strictEqual(status.next, '/gpd-progress');
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
  fs.writeFileSync(reviewPath, '# Claude Review\n\nHIGH: Ask is unclear.\n');

  const output = run(['review-external', '--paper', paperDir, '--review-file', `claude=${reviewPath}`]);
  assert(output.includes('reviews captured: 1'));
  assert(output.includes('empty reviews: 0'));
  assert(output.includes('next: /gpd-progress'));

  const externalReviews = fs.readFileSync(path.join(meta, 'EXTERNAL-REVIEWS.md'), 'utf8');
  assert(externalReviews.includes('## claude Review'));
  assert(externalReviews.includes('**Source:** claude-review.md'));
  assert(externalReviews.includes('HIGH: Ask is unclear.'));
  assert(!externalReviews.includes(reviewDir));
  assert(externalReviews.includes('does not invoke external model providers yet'));

  const feedbackPlan = fs.readFileSync(path.join(meta, 'FEEDBACK-PLAN.md'), 'utf8');
  assert(feedbackPlan.includes('**Status:** Pending user approval'));
  assert(feedbackPlan.includes('HIGH: Ask is unclear.'));
  assert(feedbackPlan.includes('Needs decision'));
  assert(feedbackPlan.includes('Ask user'));
  assert(feedbackPlan.includes('No draft or upstream artifact has been changed.'));

  const updatedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(updatedState.status, 'Feedback Pending');
  assert.strictEqual(updatedState.current_stage, 'External Review');
  assert.strictEqual(updatedState.suggested_next_command, '/gpd-progress');
  assert.strictEqual(updatedState.feedback.feedback_plan_status, 'Pending user approval');

  const status = JSON.parse(run(['status', '--paper', paperDir, '--json']));
  assert.strictEqual(status.artifacts['EXTERNAL-REVIEWS.md'], true);
  assert.strictEqual(status.artifacts['FEEDBACK-PLAN.md'], true);
  assert.strictEqual(status.next, '/gpd-progress');
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

testInstallerInstallDoctorRewriteAndBackup();
testListCommands();
testInitStatusValidate();
testStateJsonIsStatusSourceOfTruth();
testStateJsonSuggestedNextIsStatusSourceOfTruth();
testInitWithoutSlugUsesSubdirectory();
testInitWithoutSlugOrLocationUsesSubdirectory();
testImportDryRunAndCopy();
testImportClassifications();
testSingleMarkdownImportIsCanonicalDraft();
testImportDraftSelectionUsesFilenameSignalsBeforeMtime();
testImportMaxFileBytesSkipsLargeFiles();
testImportWithoutSlugUsesSourceName();
testExportCommandWritesFinalAndState();
testExportCommandUsesDraftBodyWhenPreBodySectionsExist();
testExportCommandRequiresReadyReview();
testExportCommandHonorsStatusRouting();
testReviewExternalCollectsReviewAndStopsAtApprovalGate();
testReviewExternalRequiresDraft();
testMalformedInputs();

console.log('gpd cli tests passed');
