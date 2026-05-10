'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');

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

function testBriefChangeRoutesBackToResearch() {
  const paperDir = completePaper('brief-refresh');
  touchArtifact(paperDir, 'BRIEF.md', 20);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-research');
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

testCleanCompletePaperUsesStateSuggestion();
testBriefChangeRoutesBackToResearch();
testStrategyChangeRoutesBackToResearch();
testResearchChangeRoutesBackToOutline();
testOutlineChangeRoutesBackToDraft();
testDraftChangeRoutesBackToFactCheck();
testFactCheckChangeRoutesBackToReview();

console.log('workflow scenario tests passed');
