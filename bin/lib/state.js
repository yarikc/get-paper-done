'use strict';

const fs = require('fs');
const path = require('path');

const {
  expandHome,
  writeFile,
} = require('./common');
const {
  validatePaperArtifacts,
} = require('./validate');
const {
  validateSemanticPaper,
} = require('./semantic');
const {
  CURRENT_STATE_VERSION,
  allowedStrategyStatuses,
  allowedStrategyBlockers,
} = require('./contracts');

const allowedStrategyStatusSet = new Set(allowedStrategyStatuses);
const allowedStrategyBlockerSet = new Set(allowedStrategyBlockers);

function defaultMachineState(input = {}) {
  const strategyStatus = input.strategyStatus || 'Revise Before Drafting';
  const primaryBlocker = input.primaryBlocker || 'thesis_weak';
  return {
    version: 1,
    status: strategyStatus === 'Go' ? 'Initialized' : 'Blocked',
    current_stage: 'Strategy Gate',
    last_completed_stage: 'Setup',
    last_activity: input.lastActivity || new Date().toISOString(),
    suggested_next_command: input.suggestedNextCommand || '/gpd-brief',
    blocked_by: strategyStatus === 'Go' ? [] : [`strategy block: ${primaryBlocker}`],
    strategy: {
      status: strategyStatus,
      blocking_issues: input.blockingIssues || ['thesis_weak', 'audience_unclear', 'missing_outcome'],
      primary_blocker: primaryBlocker,
      block_severity: input.blockSeverity || 'Medium',
      required_unblock_action: input.requiredUnblockAction || 'brief_revision',
    },
    feedback: {
      feedback_plan_status: 'Not created',
      approved_handling: '',
    },
    post_import_choices: input.postImportChoices || [],
  };
}

function writeStateJson(paperDir, state, dryRun) {
  writeFile(
    path.join(paperDir, '.paper', 'STATE.json'),
    `${JSON.stringify(state, null, 2)}\n`,
    dryRun,
  );
}

function findPaperDir(start = process.cwd()) {
  let current = path.resolve(expandHome(start));
  if (fs.existsSync(path.join(current, '.paper'))) return current;
  while (current !== path.dirname(current)) {
    current = path.dirname(current);
    if (fs.existsSync(path.join(current, '.paper'))) return current;
  }
  return null;
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return { data: null, error: null };
  try {
    return { data: JSON.parse(fs.readFileSync(filePath, 'utf8')), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

function artifactPath(paperDir, artifactName) {
  return path.join(paperDir, '.paper', artifactName);
}

function artifactMtimeMs(paperDir, artifactName) {
  const fullPath = artifactPath(paperDir, artifactName);
  if (!fs.existsSync(fullPath)) return null;
  return fs.statSync(fullPath).mtimeMs;
}

function artifactNewerThan(paperDir, upstream, downstream) {
  const upstreamMtime = artifactMtimeMs(paperDir, upstream);
  const downstreamMtime = artifactMtimeMs(paperDir, downstream);
  return upstreamMtime !== null && downstreamMtime !== null && upstreamMtime > downstreamMtime;
}

function savedNextCommand(state) {
  if (
    state.machineState
    && state.machineState.version === CURRENT_STATE_VERSION
    && typeof state.machineState.suggested_next_command === 'string'
    && state.machineState.suggested_next_command.trim()
  ) {
    return state.machineState.suggested_next_command.trim();
  }
  return null;
}

function baseCommand(command) {
  return command.trim().split(/\s+/)[0];
}

function savedNextCommandIsPlausible(command, artifacts) {
  switch (baseCommand(command)) {
    case '/gpd-export':
      return artifacts['DRAFT.md'] && artifacts['REVIEW.md'];
    case '/gpd-revise':
      return artifacts['DRAFT.md'] && (
        artifacts['REVIEW.md']
        || artifacts['FACT-CHECK.md']
        || artifacts['FEEDBACK-PLAN.md']
      );
    case '/gpd-review':
    case '/gpd-fact-check':
      return artifacts['DRAFT.md'];
    case '/gpd-draft':
      return artifacts['OUTLINE.md'];
    default:
      return true;
  }
}

function stripMarkdownValue(value) {
  return value
    .trim()
    .replace(/`/g, '')
    .trim();
}

function parseMarkdownField(markdown, label) {
  if (!markdown) return null;
  const target = `**${label.toLowerCase()}:**`;
  for (const line of markdown.split(/\r?\n/)) {
    const normalized = line.trim().toLowerCase();
    if (normalized.startsWith(target)) {
      return stripMarkdownValue(line.trim().slice(target.length));
    }
  }
  return null;
}

function parseStrategyFallback(strategyMarkdown) {
  const strategyStatus = parseMarkdownField(strategyMarkdown, 'Status');
  const primaryBlocker = parseMarkdownField(strategyMarkdown, 'Primary blocker');
  return {
    strategyStatus: allowedStrategyStatusSet.has(strategyStatus) ? strategyStatus : null,
    primaryBlocker: allowedStrategyBlockerSet.has(primaryBlocker) ? primaryBlocker : null,
    source: 'STRATEGY.md',
  };
}

function parseHeadingValue(markdown, heading) {
  if (!markdown) return null;
  const lines = markdown.split(/\r?\n/);
  const target = `## ${heading.toLowerCase()}`;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().toLowerCase() === target) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const value = lines[j].trim();
        if (value.startsWith('## ')) return null;
        if (value) return stripMarkdownValue(value);
      }
    }
  }
  return null;
}

function artifactContent(paperDir, artifactName) {
  return readIfExists(artifactPath(paperDir, artifactName));
}

function feedbackPlanPending(state) {
  const feedback = state.machineState ? state.machineState.feedback : null;
  if (
    feedback
    && typeof feedback.feedback_plan_status === 'string'
    && feedback.feedback_plan_status.toLowerCase().includes('pending')
  ) {
    return true;
  }

  const markdown = artifactContent(state.paperDir, 'FEEDBACK-PLAN.md');
  const status = parseMarkdownField(markdown, 'Status');
  return status ? status.toLowerCase().includes('pending') : false;
}

function factCheckRecommendedAction(state) {
  return parseHeadingValue(artifactContent(state.paperDir, 'FACT-CHECK.md'), 'Recommended Next Action');
}

function reviewVerdict(state) {
  return parseHeadingValue(artifactContent(state.paperDir, 'REVIEW.md'), 'Verdict');
}

function artifactState(paperDir) {
  const meta = path.join(paperDir, '.paper');
  const artifactNames = [
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
    'FEEDBACK-PLAN.md',
    'STATE.md',
    'STATE.json',
    'config.json',
    'exports/FINAL.md',
  ];
  const artifacts = {};
  for (const name of artifactNames) {
    artifacts[name] = fs.existsSync(path.join(meta, name));
  }

  const stateJson = readJsonIfExists(path.join(meta, 'STATE.json'));
  if (stateJson.data) {
    return {
      paperDir,
      artifacts,
      stateSource: 'STATE.json',
      stateJsonError: null,
      strategyStatus: stateJson.data.strategy ? stateJson.data.strategy.status : null,
      primaryBlocker: stateJson.data.strategy ? stateJson.data.strategy.primary_blocker : null,
      machineState: stateJson.data,
    };
  }

  const strategy = readIfExists(path.join(meta, 'STRATEGY.md'));
  const fallback = parseStrategyFallback(strategy);
  return {
    paperDir,
    artifacts,
    stateSource: fallback.strategyStatus ? fallback.source : null,
    stateJsonError: stateJson.error,
    strategyStatus: fallback.strategyStatus,
    primaryBlocker: fallback.primaryBlocker,
    machineState: null,
  };
}

function suggestedNext(state) {
  const a = state.artifacts;
  if (!a['PROJECT.md'] || !a['PERSONA.md'] || !a['AUDIENCE.md'] || !a['BRIEF.md']) return '/gpd-brief';
  if (!a['STRATEGY.md']) return '/gpd-brief';
  if (state.strategyStatus === 'Revise Before Drafting' || state.strategyStatus === 'No-Go') return '/gpd-brief';
  if (
    artifactNewerThan(state.paperDir, 'BRIEF.md', 'RESEARCH.json')
    || artifactNewerThan(state.paperDir, 'STRATEGY.md', 'RESEARCH.json')
  ) {
    return '/gpd-research';
  }
  if (artifactNewerThan(state.paperDir, 'RESEARCH.json', 'OUTLINE.md')) return '/gpd-outline --deep';
  if (artifactNewerThan(state.paperDir, 'OUTLINE.md', 'DRAFT.md')) return '/gpd-draft';
  if (artifactNewerThan(state.paperDir, 'DRAFT.md', 'FACT-CHECK.md')) return '/gpd-fact-check --full';

  const factCheckAction = factCheckRecommendedAction(state);
  if (factCheckAction === '/gpd-research') return '/gpd-research';
  if (factCheckAction === '/gpd-revise') return '/gpd-revise';

  if (
    artifactNewerThan(state.paperDir, 'DRAFT.md', 'REVIEW.md')
    || artifactNewerThan(state.paperDir, 'FACT-CHECK.md', 'REVIEW.md')
  ) {
    return '/gpd-review --deep';
  }
  if (feedbackPlanPending(state)) return '/gpd-progress';

  const verdict = reviewVerdict(state);
  if (verdict === 'Revise' || verdict === 'Rework') return '/gpd-revise';
  if (a['exports/FINAL.md']) {
    if (
      artifactNewerThan(state.paperDir, 'DRAFT.md', 'exports/FINAL.md')
      || artifactNewerThan(state.paperDir, 'FACT-CHECK.md', 'exports/FINAL.md')
      || artifactNewerThan(state.paperDir, 'REVIEW.md', 'exports/FINAL.md')
    ) {
      return '/gpd-export';
    }
    return '/gpd-progress';
  }

  const nextFromState = savedNextCommand(state);
  if (nextFromState && savedNextCommandIsPlausible(nextFromState, a)) {
    return nextFromState;
  }
  if (!a['RESEARCH.json']) return '/gpd-research';
  if (!a['OUTLINE.md']) return '/gpd-outline --deep';
  if (!a['DRAFT.md']) return '/gpd-draft';
  if (!a['FACT-CHECK.md']) return '/gpd-fact-check --full';
  if (!a['REVIEW.md']) return '/gpd-review --deep';
  if (a['FEEDBACK-PLAN.md']) return '/gpd-revise';
  return '/gpd-export';
}

function status(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const state = artifactState(paperDir);
  state.next = suggestedNext(state);
  return state;
}

function printStatus(state) {
  console.log(`paper: ${state.paperDir}`);
  console.log(`state source: ${state.stateSource || 'missing'}`);
  console.log(`strategy: ${state.strategyStatus || 'missing'}`);
  if (state.primaryBlocker) console.log(`primary blocker: ${state.primaryBlocker}`);
  console.log('artifacts:');
  for (const [name, exists] of Object.entries(state.artifacts)) {
    console.log(`- ${exists ? 'ok' : 'missing'} ${name}`);
  }
  console.log(`next: ${state.next}`);
}

function validate(input = {}) {
  const state = status(input);
  const issues = [];
  const a = state.artifacts;
  for (const required of ['PROJECT.md', 'PERSONA.md', 'AUDIENCE.md', 'BRIEF.md', 'STRATEGY.md', 'STATE.md']) {
    const exists = fs.existsSync(path.join(state.paperDir, '.paper', required));
    if (!exists) issues.push({ severity: 'HIGH', issue: `Missing ${required}` });
  }
  if (state.stateJsonError) {
    issues.push({ severity: 'HIGH', issue: `Malformed STATE.json: ${state.stateJsonError}` });
  }
  if (
    state.machineState
    && state.machineState.version !== CURRENT_STATE_VERSION
  ) {
    issues.push({
      severity: 'HIGH',
      issue: `Unsupported STATE.json version ${state.machineState.version}; run gpd update or migrate`,
    });
  }
  if (!a['STATE.json']) {
    issues.push({ severity: 'MEDIUM', issue: 'Missing STATE.json; using legacy STRATEGY.md parsing fallback' });
  }
  if (a['STRATEGY.md'] && !allowedStrategyStatusSet.has(state.strategyStatus)) {
    const source = state.artifacts['STATE.json'] ? 'STATE.json' : 'STRATEGY.md';
    issues.push({ severity: 'HIGH', issue: `Malformed ${source}: missing or invalid strategy status` });
  }
  if (
    (state.strategyStatus === 'Revise Before Drafting' || state.strategyStatus === 'No-Go')
    && (!state.primaryBlocker || state.primaryBlocker === 'none')
  ) {
    const source = state.artifacts['STATE.json'] ? 'STATE.json' : 'STRATEGY.md';
    issues.push({ severity: 'HIGH', issue: `Malformed ${source}: blocked strategy requires a primary blocker` });
  }
  if (state.strategyStatus === 'Revise Before Drafting' || state.strategyStatus === 'No-Go') {
    issues.push({ severity: 'HIGH', issue: `Strategy blocks downstream work: ${state.primaryBlocker || state.strategyStatus}` });
  }
  const nextFromState = savedNextCommand(state);
  if (nextFromState && !savedNextCommandIsPlausible(nextFromState, a)) {
    issues.push({
      severity: 'HIGH',
      issue: `STATE.json suggested_next_command ${nextFromState} is incompatible with current artifacts`,
    });
  }
  if (a['DRAFT.md'] && !a['OUTLINE.md']) issues.push({ severity: 'MEDIUM', issue: 'Draft exists before OUTLINE.md' });
  if (a['REVIEW.md'] && !a['DRAFT.md']) issues.push({ severity: 'HIGH', issue: 'REVIEW.md exists without DRAFT.md' });
  issues.push(...validatePaperArtifacts(state.paperDir, a));
  const structuralIssueCount = issues.length;
  if (input.semantic) {
    issues.push(...validateSemanticPaper(state.paperDir));
  }
  const hasHighIssue = issues.some((item) => item.severity === 'HIGH');
  return {
    ...state,
    issues,
    semantic: Boolean(input.semantic),
    ok: structuralIssueCount === 0 && !hasHighIssue,
  };
}

function printValidation(result) {
  printStatus(result);
  console.log(`validation: ${result.ok ? 'ok' : 'issues found'}`);
  if (result.semantic) console.log('semantic validation: enabled');
  for (const issue of result.issues) {
    console.log(`- ${issue.severity}: ${issue.issue}`);
  }
}

module.exports = {
  defaultMachineState,
  writeStateJson,
  findPaperDir,
  status,
  printStatus,
  validate,
  printValidation,
};
