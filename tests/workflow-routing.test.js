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

function initFixture(slug) {
  const dir = tempDir(`gpd-routing-${slug}`);
  run(['init', '--location', dir, '--slug', slug, '--title', slug]);
  return path.join(dir, slug);
}

function readState(paperDir) {
  return JSON.parse(fs.readFileSync(path.join(paperDir, '.paper', 'STATE.json'), 'utf8'));
}

function writeState(paperDir, state) {
  fs.writeFileSync(path.join(paperDir, '.paper', 'STATE.json'), `${JSON.stringify(state, null, 2)}\n`);
}

function statusJson(paperDir) {
  return JSON.parse(run(['status', '--paper', paperDir, '--json']));
}

function testFreshInitRoutesToBrief() {
  const paperDir = initFixture('fresh-init');
  const status = statusJson(paperDir);

  assert.strictEqual(status.stateSource, 'STATE.json');
  assert.strictEqual(status.strategyStatus, 'Revise Before Drafting');
  assert.strictEqual(status.primaryBlocker, 'thesis_weak');
  assert.strictEqual(status.next, '/gpd-brief');
}

function testStateSuggestedNextWinsAfterHardGatesPass() {
  const paperDir = initFixture('state-suggested-next');
  const state = readState(paperDir);
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
  writeState(paperDir, state);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-outline --lite');
}

function testBlockedStrategyOverridesBadSuggestedNext() {
  const paperDir = initFixture('blocked-overrides-next');
  const state = readState(paperDir);
  state.suggested_next_command = '/gpd-draft';
  writeState(paperDir, state);

  assert.strictEqual(statusJson(paperDir).next, '/gpd-brief');
}

function testUnsupportedFutureStateVersionFailsValidation() {
  const paperDir = initFixture('future-state-version');
  const state = readState(paperDir);
  state.version = 2;
  writeState(paperDir, state);

  const validation = runFail(['validate', '--paper', paperDir]);
  assert.strictEqual(validation.status, 1);
  assert(validation.stdout.includes('Unsupported STATE.json version 2; run gpd update or migrate'));
}

function testMalformedStrategyFallbackDoesNotBecomeRoutingState() {
  const paperDir = initFixture('strategy-placeholder-fallback');
  fs.unlinkSync(path.join(paperDir, '.paper', 'STATE.json'));
  fs.copyFileSync(
    path.join(repoRoot, 'templates', 'strategy.md'),
    path.join(paperDir, '.paper', 'STRATEGY.md'),
  );

  const validation = runFail(['validate', '--paper', paperDir]);
  assert.strictEqual(validation.status, 1);
  assert(validation.stdout.includes('STRATEGY.md: $.Status must be one of Go, Revise Before Drafting, No-Go'));
  assert(validation.stdout.includes('Malformed STRATEGY.md: missing or invalid strategy status'));
}

testFreshInitRoutesToBrief();
testStateSuggestedNextWinsAfterHardGatesPass();
testBlockedStrategyOverridesBadSuggestedNext();
testUnsupportedFutureStateVersionFailsValidation();
testMalformedStrategyFallbackDoesNotBecomeRoutingState();

console.log('workflow routing tests passed');
