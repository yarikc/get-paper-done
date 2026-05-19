'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const { requiredGrillDecisionKeys } = require('../bin/lib/contracts');

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

function artifactPath(paperDir, name) {
  return path.join(paperDir, '.paper', name);
}

function readState(paperDir) {
  return JSON.parse(fs.readFileSync(artifactPath(paperDir, 'STATE.json'), 'utf8'));
}

function writeState(paperDir, state) {
  fs.writeFileSync(artifactPath(paperDir, 'STATE.json'), `${JSON.stringify(state, null, 2)}\n`);
}

function writeArtifact(paperDir, name, content) {
  fs.writeFileSync(artifactPath(paperDir, name), content);
}

function touchArtifact(paperDir, name, secondsOffset) {
  const time = new Date(Date.UTC(2026, 0, 1, 0, 0, secondsOffset));
  fs.utimesSync(artifactPath(paperDir, name), time, time);
}

function statusJson(paperDir) {
  return JSON.parse(run(['status', '--paper', paperDir, '--json']));
}

function completePaper(slug) {
  const dir = tempDir(`gpd-scenario-${slug}`);
  run(['init', '--location', dir, '--slug', slug, '--title', slug]);
  const paperDir = path.join(dir, slug);

  const state = readState(paperDir);
  state.status = 'Ready For Export';
  state.current_stage = 'Review';
  state.last_completed_stage = 'Review';
  state.suggested_next_command = '/gpd-export';
  state.blocked_by = [];
  state.grill.status = 'Complete';
  state.grill.completion_basis = 'test fixture resolved required grill decisions';
  state.grill.resolved_decisions = requiredGrillDecisionKeys;
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  writeState(paperDir, state);

  writeArtifact(paperDir, 'RESEARCH.json', '{"research_plan":{},"source_registry":[],"evidence_matrix":[]}\n');
  writeArtifact(paperDir, 'OUTLINE.md', '# Outline\n');
  writeArtifact(paperDir, 'DRAFT.md', '# Draft\n');
  writeArtifact(paperDir, 'FACT-CHECK.md', '# Fact And Claims Check\n');
  writeArtifact(paperDir, 'REVIEW.md', '# Review\n');

  [
    'BRIEF.md',
    'STRATEGY.md',
    'RESEARCH.json',
    'OUTLINE.md',
    'DRAFT.md',
    'FACT-CHECK.md',
    'REVIEW.md',
    'STATE.json',
  ].forEach((name, index) => touchArtifact(paperDir, name, index));

  return paperDir;
}

function testCleanCompletePaperUsesStateSuggestion() {
  const paperDir = completePaper('complete');

  assert.strictEqual(statusJson(paperDir).next, '/gpd-export');
}

function testExportedPaperRoutesToProgress() {
  const paperDir = completePaper('exported');
  writeArtifact(paperDir, 'exports/FINAL.md', '# Final\n');
  touchArtifact(paperDir, 'exports/FINAL.md', 20);

  const status = statusJson(paperDir);
  assert.strictEqual(status.artifacts['exports/FINAL.md'], true);
  assert.strictEqual(status.next, '/gpd-status');
}

function testStaleExportRoutesBackToExport() {
  const paperDir = completePaper('stale-export');
  writeArtifact(paperDir, 'exports/FINAL.md', '# Final\n');
  touchArtifact(paperDir, 'exports/FINAL.md', 20);
  touchArtifact(paperDir, 'REVIEW.md', 30);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-export');
}

function testBriefChangeRoutesBackToResearch() {
  const paperDir = completePaper('brief-refresh');
  touchArtifact(paperDir, 'BRIEF.md', 20);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-research');
}

function testGrillContextChangeRoutesBackToBrief() {
  const paperDir = completePaper('context-refresh');
  writeArtifact(paperDir, 'PAPER-CONTEXT.md', '# Paper Context\n\n## Language\n\nClarified term.\n');
  writeArtifact(paperDir, 'DECISIONS.md', '# Paper Decision Records\n\n## Decision Index\n\n| ID | Status | Decision | Why It Matters |\n|----|--------|----------|----------------|\n');
  touchArtifact(paperDir, 'PAPER-CONTEXT.md', 20);
  touchArtifact(paperDir, 'DECISIONS.md', 21);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-brief');
}

function testStrategyChangeRoutesBackToResearch() {
  const paperDir = completePaper('strategy-refresh');
  touchArtifact(paperDir, 'STRATEGY.md', 20);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-research');
}

function testResearchChangeRoutesBackToOutline() {
  const paperDir = completePaper('outline-refresh');
  touchArtifact(paperDir, 'RESEARCH.json', 20);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-outline --deep');
}

function testOutlineChangeRoutesBackToDraft() {
  const paperDir = completePaper('draft-refresh');
  touchArtifact(paperDir, 'OUTLINE.md', 20);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-draft');
}

function testDraftChangeRoutesBackToFactCheck() {
  const paperDir = completePaper('fact-check-refresh');
  touchArtifact(paperDir, 'DRAFT.md', 20);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-fact-check --full');
}

function testFactCheckChangeRoutesBackToReview() {
  const paperDir = completePaper('review-refresh');
  touchArtifact(paperDir, 'FACT-CHECK.md', 20);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-review --deep');
}

function testFactCheckRecommendedResearchRoutesBackToResearch() {
  const paperDir = completePaper('fact-check-research');
  writeArtifact(paperDir, 'FACT-CHECK.md', [
    '# Fact And Claims Check',
    '',
    '## Recommended Next Action',
    '',
    '/gpd-research',
    '',
  ].join('\n'));

  assert.strictEqual(statusJson(paperDir).next, '/gpd-research');
}

function testFactCheckRecommendedReviseRoutesToRevise() {
  const paperDir = completePaper('fact-check-revise');
  writeArtifact(paperDir, 'FACT-CHECK.md', [
    '# Fact And Claims Check',
    '',
    '## Recommended Next Action',
    '',
    '/gpd-revise',
    '',
  ].join('\n'));

  assert.strictEqual(statusJson(paperDir).next, '/gpd-revise');
}

function testReviewVerdictRoutesToRevise() {
  const paperDir = completePaper('review-revise');
  writeArtifact(paperDir, 'REVIEW.md', [
    '# Review',
    '',
    '## Verdict',
    '',
    'Revise',
    '',
  ].join('\n'));

  assert.strictEqual(statusJson(paperDir).next, '/gpd-revise');
}

function testBelowTargetGateRoutesToRevise() {
  const paperDir = completePaper('review-below-target');
  writeArtifact(paperDir, 'REVIEW.md', [
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

  assert.strictEqual(statusJson(paperDir).next, '/gpd-revise');
}

function testPendingFeedbackPlanBlocksAutomaticRevise() {
  const paperDir = completePaper('feedback-pending');
  const state = readState(paperDir);
  state.feedback.feedback_plan_status = 'Pending user approval';
  state.suggested_next_command = '/gpd-revise';
  writeState(paperDir, state);
  writeArtifact(paperDir, 'FEEDBACK-PLAN.md', [
    '# Feedback Handling Plan',
    '',
    '**Status:** Pending user approval',
    '',
  ].join('\n'));

  assert.strictEqual(statusJson(paperDir).next, '/gpd-status');
}

function testPendingFeedbackPlanBlocksStaleMtimeRefresh() {
  const paperDir = completePaper('feedback-pending-stale-mtime');
  const state = readState(paperDir);
  state.feedback.feedback_plan_status = 'Pending user approval';
  state.suggested_next_command = '/gpd-status';
  writeState(paperDir, state);
  writeArtifact(paperDir, 'FEEDBACK-PLAN.md', [
    '# Feedback Handling Plan',
    '',
    '**Status:** Pending user approval',
    '',
  ].join('\n'));
  touchArtifact(paperDir, 'FEEDBACK-PLAN.md', 20);
  touchArtifact(paperDir, 'BRIEF.md', 30);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-status');
}

function testReaderFeedbackRoutesToReviewBeforeRevision() {
  const paperDir = completePaper('reader-feedback');
  writeArtifact(paperDir, 'FEEDBACK-READER.md', fs.readFileSync(path.join(repoRoot, 'templates', 'feedback-reader.md'), 'utf8'));
  touchArtifact(paperDir, 'FEEDBACK-READER.md', 30);

  const status = statusJson(paperDir);
  assert.strictEqual(status.artifacts['FEEDBACK-READER.md'], true);
  assert.strictEqual(status.next, '/gpd-review');
}

function testHandledReaderFeedbackDoesNotStaleExport() {
  const paperDir = completePaper('handled-reader-feedback');
  writeArtifact(paperDir, 'exports/FINAL.md', '# Final\n');
  writeArtifact(paperDir, 'FEEDBACK-READER.md', fs.readFileSync(path.join(repoRoot, 'templates', 'feedback-reader.md'), 'utf8'));
  writeArtifact(paperDir, 'FEEDBACK-PLAN.md', [
    '# Feedback Handling Plan',
    '',
    '**Status:** Approved - no draft changes needed',
    '',
  ].join('\n'));
  touchArtifact(paperDir, 'exports/FINAL.md', 30);
  touchArtifact(paperDir, 'FEEDBACK-READER.md', 40);
  touchArtifact(paperDir, 'FEEDBACK-PLAN.md', 50);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-status');
}

testCleanCompletePaperUsesStateSuggestion();
testExportedPaperRoutesToProgress();
testStaleExportRoutesBackToExport();
testBriefChangeRoutesBackToResearch();
testGrillContextChangeRoutesBackToBrief();
testStrategyChangeRoutesBackToResearch();
testResearchChangeRoutesBackToOutline();
testOutlineChangeRoutesBackToDraft();
testDraftChangeRoutesBackToFactCheck();
testFactCheckChangeRoutesBackToReview();
testFactCheckRecommendedResearchRoutesBackToResearch();
testFactCheckRecommendedReviseRoutesToRevise();
testReviewVerdictRoutesToRevise();
testBelowTargetGateRoutesToRevise();
testPendingFeedbackPlanBlocksAutomaticRevise();
testPendingFeedbackPlanBlocksStaleMtimeRefresh();
testReaderFeedbackRoutesToReviewBeforeRevision();
testHandledReaderFeedbackDoesNotStaleExport();

console.log('workflow scenario tests passed');
