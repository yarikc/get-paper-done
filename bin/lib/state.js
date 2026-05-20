'use strict';

const fs = require('fs');
const path = require('path');

const {
  expandHome,
  fileSha256IfExists,
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
  requiredGrillDecisionKeys,
} = require('./contracts');

const allowedStrategyStatusSet = new Set(allowedStrategyStatuses);
const allowedStrategyBlockerSet = new Set(allowedStrategyBlockers);

function defaultMachineState(input = {}) {
  const strategyStatus = input.strategyStatus || 'Revise Before Drafting';
  const primaryBlocker = input.primaryBlocker || 'thesis_weak';
  const grill = input.grill || {
    status: 'Not Started',
    completion_basis: '',
    resolved_decisions: [],
  };
  return {
    version: 1,
    status: strategyStatus === 'Go' ? 'Initialized' : 'Blocked',
    current_stage: 'Strategy Gate',
    last_completed_stage: 'Setup',
    last_activity: input.lastActivity || new Date().toISOString(),
    suggested_next_command: input.suggestedNextCommand || '/gpd-grill',
    blocked_by: strategyStatus === 'Go' ? [] : [`strategy block: ${primaryBlocker}`],
    grill,
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
    versioning: {
      last_snapshot_id: '',
      active_revision_snapshot_id: '',
      last_export_snapshot_id: '',
      last_restore_snapshot_id: '',
      last_exported_draft_sha256: '',
      last_exported_final_sha256: '',
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

function stateMarkdown(state) {
  const blockedBy = Array.isArray(state.blocked_by) && state.blocked_by.length > 0
    ? state.blocked_by.map((blocker) => `- ${blocker}`).join('\n')
    : '- None';
  const postImportChoices = Array.isArray(state.post_import_choices) && state.post_import_choices.length > 0
    ? state.post_import_choices.map((choice) => `- \`${choice}\``).join('\n')
    : '- None';
  const feedback = state.feedback || {};
  return [
    '# Paper State',
    '',
    '## Current Position',
    '',
    `- **Status:** ${state.status}`,
    `- **Current stage:** ${state.current_stage}`,
    `- **Last completed stage:** ${state.last_completed_stage}`,
    `- **Last activity:** ${state.last_activity}`,
    `- **Suggested next command:** \`${state.suggested_next_command}\``,
    '',
    '## Grill Gate',
    '',
    `- **Status:** ${state.grill ? state.grill.status : 'Not Started'}`,
    `- **Completion basis:** ${state.grill ? state.grill.completion_basis : ''}`,
    '',
    '## Blocked By',
    '',
    blockedBy,
    '',
    '## Decisions',
    '',
    '- None recorded',
    '',
    '## Open Questions',
    '',
    '- Confirm or repair the brief before downstream work if the strategy gate is blocked.',
    '',
    '## Feedback Handling',
    '',
    `- **Feedback plan status:** ${feedback.feedback_plan_status || 'Not created'}`,
    `- **Approved handling:** ${feedback.approved_handling || ''}`,
    '',
    '## Post-Import Choices',
    '',
    postImportChoices,
    '',
    '## Next Action',
    '',
    `Run \`${state.suggested_next_command}\` next.`,
    '',
  ].join('\n');
}

function writeStateMarkdown(paperDir, state, dryRun) {
  writeFile(
    path.join(paperDir, '.paper', 'STATE.md'),
    stateMarkdown(state),
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

function artifactSha256(paperDir, artifactName) {
  return fileSha256IfExists(artifactPath(paperDir, artifactName));
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

function grillComplete(machineState) {
  if (!machineState || !machineState.grill || machineState.grill.status !== 'Complete') return false;
  const resolved = new Set(Array.isArray(machineState.grill.resolved_decisions)
    ? machineState.grill.resolved_decisions
    : []);
  return requiredGrillDecisionKeys.every((key) => resolved.has(key));
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
    const trimmed = line.trim().replace(/^-+\s*/, '');
    const normalized = trimmed.toLowerCase();
    if (normalized.startsWith(target)) {
      return stripMarkdownValue(trimmed.slice(target.length));
    }
  }
  return null;
}

function sectionBetween(markdown, heading, nextHeadingPattern = /\n##\s+/) {
  if (!markdown) return '';
  const start = markdown.indexOf(heading);
  if (start === -1) return '';
  const rest = markdown.slice(start + heading.length);
  const next = rest.search(nextHeadingPattern);
  return next === -1 ? rest : rest.slice(0, next);
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
    && feedback.feedback_plan_status.trim().toLowerCase() === 'pending user approval'
  ) {
    return true;
  }

  const markdown = artifactContent(state.paperDir, 'FEEDBACK-PLAN.md');
  const status = parseMarkdownField(markdown, 'Status');
  return status ? status.trim().toLowerCase() === 'pending user approval' : false;
}

function factCheckRecommendedAction(state) {
  return parseHeadingValue(artifactContent(state.paperDir, 'FACT-CHECK.md'), 'Recommended Next Action');
}

function reviewVerdict(state) {
  return parseHeadingValue(artifactContent(state.paperDir, 'REVIEW.md'), 'Verdict');
}

function reviewBelowTargetRequiresRevision(state) {
  const review = artifactContent(state.paperDir, 'REVIEW.md');
  const gate = sectionBetween(review, '## Below-Target Improvement Gate');
  const immediate = parseMarkdownField(gate, 'Immediate improvement required before export');
  return /^yes\b/i.test(immediate || '');
}

function versioningState(state) {
  return state.machineState && state.machineState.versioning
    ? state.machineState.versioning
    : {};
}

function latestSnapshotId(state) {
  const versioning = versioningState(state);
  return versioning.active_revision_snapshot_id
    || versioning.last_snapshot_id
    || versioning.last_export_snapshot_id
    || versioning.last_restore_snapshot_id
    || '';
}

function snapshotRestoreCommand(state) {
  const snapshotId = latestSnapshotId(state);
  return snapshotId ? `gpd restore --paper ${state.paperDir} --snapshot ${snapshotId}` : '';
}

function draftChangedSinceExport(state) {
  const versioning = versioningState(state);
  if (!state.artifacts['DRAFT.md'] || !state.artifacts['exports/FINAL.md']) return false;
  if (versioning.last_exported_draft_sha256) {
    return artifactSha256(state.paperDir, 'DRAFT.md') !== versioning.last_exported_draft_sha256;
  }
  return artifactNewerThan(state.paperDir, 'DRAFT.md', 'exports/FINAL.md');
}

function draftMatchesLastExportedHash(state) {
  const versioning = versioningState(state);
  return Boolean(
    state.artifacts['DRAFT.md']
    && versioning.last_exported_draft_sha256
    && artifactSha256(state.paperDir, 'DRAFT.md') === versioning.last_exported_draft_sha256,
  );
}

function draftNewerThanWithContentChange(state, downstream) {
  if (!artifactNewerThan(state.paperDir, 'DRAFT.md', downstream)) return false;
  return !draftMatchesLastExportedHash(state);
}

function artifactState(paperDir) {
  const meta = path.join(paperDir, '.paper');
  const artifactNames = [
    'PROJECT.md',
    'PERSONA.md',
    'AUDIENCE.md',
    'BRIEF.md',
    'STRATEGY.md',
    'IMPORT.md',
    'PAPER-CONTEXT.md',
    'DECISIONS.md',
    'RESEARCH.json',
    'OUTLINE.md',
    'DRAFT.md',
    'FACT-CHECK.md',
    'REVIEW.md',
    'FEEDBACK-READER.md',
    'FEEDBACK-EXTERNAL.md',
    'EXTERNAL-REVIEW-RUN.json',
    'FEEDBACK-PLAN.md',
    'REVISION-CHECK.md',
    'REVISION-LOG.md',
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
  if (!grillComplete(state.machineState)) return '/gpd-grill';
  if (state.strategyStatus === 'Revise Before Drafting' || state.strategyStatus === 'No-Go') {
    return '/gpd-brief';
  }
  if (
    artifactNewerThan(state.paperDir, 'PAPER-CONTEXT.md', 'BRIEF.md')
    || artifactNewerThan(state.paperDir, 'DECISIONS.md', 'BRIEF.md')
  ) {
    return '/gpd-brief';
  }
  if (feedbackPlanPending(state)) return '/gpd-feedback';
  if (
    artifactNewerThan(state.paperDir, 'BRIEF.md', 'RESEARCH.json')
    || artifactNewerThan(state.paperDir, 'STRATEGY.md', 'RESEARCH.json')
  ) {
    return '/gpd-research';
  }
  if (artifactNewerThan(state.paperDir, 'RESEARCH.json', 'OUTLINE.md')) return '/gpd-outline --deep';
  if (artifactNewerThan(state.paperDir, 'OUTLINE.md', 'DRAFT.md')) return '/gpd-draft';
  if (draftNewerThanWithContentChange(state, 'FACT-CHECK.md')) return '/gpd-fact-check --full';

  const factCheckAction = factCheckRecommendedAction(state);
  if (factCheckAction === '/gpd-research') return '/gpd-research';
  if (factCheckAction === '/gpd-revise') return '/gpd-revise';

  if (
    draftNewerThanWithContentChange(state, 'REVIEW.md')
    || artifactNewerThan(state.paperDir, 'FACT-CHECK.md', 'REVIEW.md')
  ) {
    return '/gpd-review --deep';
  }
  if (
    a['FEEDBACK-READER.md']
    && (!a['FEEDBACK-PLAN.md'] || artifactNewerThan(state.paperDir, 'FEEDBACK-READER.md', 'FEEDBACK-PLAN.md'))
  ) {
    return '/gpd-review';
  }

  const verdict = reviewVerdict(state);
  if (verdict === 'Revise' || verdict === 'Rework') return '/gpd-revise';
  if (reviewBelowTargetRequiresRevision(state)) return '/gpd-revise';
  if (a['exports/FINAL.md']) {
    if (
      draftChangedSinceExport(state)
      || artifactNewerThan(state.paperDir, 'FACT-CHECK.md', 'exports/FINAL.md')
      || artifactNewerThan(state.paperDir, 'REVIEW.md', 'exports/FINAL.md')
    ) {
      return '/gpd-export';
    }
    return '/gpd-status';
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
  state.userAction = userActionHint(state);
  state.latestSnapshotId = latestSnapshotId(state);
  state.restoreCommand = snapshotRestoreCommand(state);
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
  if (state.latestSnapshotId) {
    console.log(`latest snapshot: ${state.latestSnapshotId}`);
    console.log(`restore: ${state.restoreCommand}`);
  }
  console.log(`next: ${state.next}`);
  console.log(`user action: ${state.userAction}`);
}

function contextForCommand(command) {
  const base = baseCommand(command);
  if (base === '/gpd-research') {
    return {
      clear_context: 'Yes, if coming from intake or brief discussion.',
      read: ['PROJECT.md', 'PERSONA.md', 'AUDIENCE.md', 'BRIEF.md', 'STRATEGY.md'],
      avoid: ['raw sources unless planning specific source work'],
    };
  }
  if (base === '/gpd-outline') {
    return {
      clear_context: 'Yes, after research.',
      read: ['PERSONA.md', 'AUDIENCE.md', 'BRIEF.md', 'STRATEGY.md', 'RESEARCH.json'],
      avoid: ['raw .paper/sources/ by default'],
    };
  }
  if (base === '/gpd-draft') {
    return {
      clear_context: 'Yes, after outline.',
      read: ['PERSONA.md', 'AUDIENCE.md', 'BRIEF.md', 'RESEARCH.json', 'OUTLINE.md'],
      avoid: ['raw sources unless verifying a specific claim'],
    };
  }
  if (base === '/gpd-fact-check') {
    return {
      clear_context: 'Yes, after drafting.',
      read: ['DRAFT.md', 'RESEARCH.json', 'BRIEF.md', 'AUDIENCE.md'],
      avoid: ['unneeded source dumps; inspect sources only for specific verification'],
    };
  }
  if (base === '/gpd-review') {
    return {
      clear_context: 'Yes, after drafting or fact-check.',
      read: ['DRAFT.md', 'exports/FINAL.md if present or user reviewed it', 'REVIEW.md if present', 'FEEDBACK-READER.md if present', 'upstream artifacts as needed'],
      avoid: ['rewriting before feedback handling is approved'],
    };
  }
  if (base === '/gpd-revise') {
    return {
      clear_context: 'Yes, after review.',
      read: ['DRAFT.md', 'REVIEW.md', 'FEEDBACK-PLAN.md if present', 'FEEDBACK-READER.md if present', 'REVISION-LOG.md if present'],
      avoid: ['editing without first running gpd revise or gpd snapshot', 'unapproved feedback items', 'editing exports/FINAL.md as the source of truth'],
    };
  }
  if (base === '/gpd-export') {
    return {
      clear_context: 'No.',
      read: ['DRAFT.md', 'REVIEW.md', 'FACT-CHECK.md if present'],
      avoid: ['internal notes that should not appear in FINAL.md'],
    };
  }
  if (base === '/gpd-status') {
    return {
      clear_context: 'No.',
      read: ['STATE.json', 'STATE.md', 'artifact timestamps'],
      avoid: ['raw sources by default'],
    };
  }
  if (base === '/gpd-grill') {
    return {
      clear_context: 'No, unless the import/intake chat is noisy.',
      read: ['IMPORT.md if present', 'PROJECT.md', 'PERSONA.md', 'AUDIENCE.md', 'BRIEF.md', 'STRATEGY.md', 'PAPER-CONTEXT.md if present', 'DECISIONS.md if present'],
      avoid: ['research, outlining, drafting, or revising before ambiguities are resolved'],
    };
  }
  return {
    clear_context: 'No, unless the current chat is noisy.',
    read: ['PROJECT.md', 'PERSONA.md', 'AUDIENCE.md', 'BRIEF.md', 'STATE.json'],
    avoid: ['downstream drafting before the strategy gate is clear'],
  };
}

function explainNext(state) {
  const a = state.artifacts;
  const next = state.next;
  if (!a['PROJECT.md'] || !a['PERSONA.md'] || !a['AUDIENCE.md'] || !a['BRIEF.md']) {
    return 'One or more setup artifacts are missing, so the paper needs intake/brief repair before downstream work.';
  }
  if (!a['STRATEGY.md']) return 'The strategy gate has not been created yet, so brief work must run before research or drafting.';
  if (!grillComplete(state.machineState) && next === '/gpd-grill') {
    return 'The mandatory grill gate is incomplete, so thesis, reader, terms, proof standard, scope, and non-goals must be resolved before briefing.';
  }
  if (state.strategyStatus === 'Revise Before Drafting' || state.strategyStatus === 'No-Go') {
    return `The strategy gate is ${state.strategyStatus}; fix the primary blocker (${state.primaryBlocker || 'unknown'}) before downstream work.`;
  }
  if (
    artifactNewerThan(state.paperDir, 'PAPER-CONTEXT.md', 'BRIEF.md')
    || artifactNewerThan(state.paperDir, 'DECISIONS.md', 'BRIEF.md')
  ) {
    return 'Paper context or decision records changed after the brief, so the formal brief must absorb the clarified intent before downstream work continues.';
  }
  if (feedbackPlanPending(state)) return 'A feedback plan is pending approval, so /gpd-feedback should walk through the concerns before revision.';
  if (
    artifactNewerThan(state.paperDir, 'BRIEF.md', 'RESEARCH.json')
    || artifactNewerThan(state.paperDir, 'STRATEGY.md', 'RESEARCH.json')
  ) {
    return 'The brief or strategy changed after research, so research needs an incremental refresh.';
  }
  if (artifactNewerThan(state.paperDir, 'RESEARCH.json', 'OUTLINE.md')) return 'Research is newer than the outline, so the outline needs to be refreshed.';
  if (artifactNewerThan(state.paperDir, 'OUTLINE.md', 'DRAFT.md')) return 'The outline is newer than the draft, so drafting should resume from the updated structure.';
  if (artifactNewerThan(state.paperDir, 'DRAFT.md', 'FACT-CHECK.md')) return 'The draft is newer than the fact-check, so material claims need a fresh check.';
  const factCheckAction = factCheckRecommendedAction(state);
  if (factCheckAction === next) return `FACT-CHECK.md recommends ${next}, so follow the documented fact-check routing.`;
  if (
    artifactNewerThan(state.paperDir, 'DRAFT.md', 'REVIEW.md')
    || artifactNewerThan(state.paperDir, 'FACT-CHECK.md', 'REVIEW.md')
  ) {
    return 'The draft or fact-check changed after review, so review needs a refresh.';
  }
  if (
    a['FEEDBACK-READER.md']
    && (!a['FEEDBACK-PLAN.md'] || artifactNewerThan(state.paperDir, 'FEEDBACK-READER.md', 'FEEDBACK-PLAN.md'))
  ) {
    return 'Reader feedback exists without a current feedback plan, so review should synthesize it before revision.';
  }
  const verdict = reviewVerdict(state);
  if ((verdict === 'Revise' || verdict === 'Rework') && next === '/gpd-revise') return `REVIEW.md verdict is ${verdict}, so revision is the next controlled step.`;
  if (reviewBelowTargetRequiresRevision(state) && next === '/gpd-revise') return 'REVIEW.md says below-target items require immediate improvement before export.';
  if (a['exports/FINAL.md'] && next === '/gpd-status') return 'The export is current, so there is no required next writing stage.';
  if (a['exports/FINAL.md'] && next === '/gpd-export') {
    if (draftChangedSinceExport(state)) {
      return 'The draft content hash no longer matches the last exported draft, so FINAL.md needs regeneration.';
    }
    return 'The fact-check or review changed after export, so FINAL.md needs regeneration.';
  }
  if (!a['RESEARCH.json'] && next === '/gpd-research') return 'Structured research is missing, so research is the next required artifact.';
  if (!a['OUTLINE.md'] && next.startsWith('/gpd-outline')) return 'The outline is missing, so structure should be created before drafting.';
  if (!a['DRAFT.md'] && next === '/gpd-draft') return 'The draft is missing, so drafting is the next stage.';
  if (!a['FACT-CHECK.md'] && next.startsWith('/gpd-fact-check')) return 'Fact-check is missing for an existing draft.';
  if (!a['REVIEW.md'] && next.startsWith('/gpd-review')) return 'Review is missing for an existing draft.';
  if (a['FEEDBACK-PLAN.md'] && next === '/gpd-revise') return 'A feedback plan exists, so approved changes can be applied through revision.';
  if (next === '/gpd-export') return 'The paper has the required reviewed draft artifacts and is ready for export.';
  const nextFromState = savedNextCommand(state);
  if (nextFromState === next) return 'STATE.json saved this as the next plausible command, and required upstream artifacts are present.';
  return 'This is the earliest stage that appears necessary from the current artifact state.';
}

function userActionHint(state) {
  const a = state.artifacts;
  const next = state.next;
  if (a['exports/FINAL.md'] && next === '/gpd-status') {
    return 'Read .paper/exports/FINAL.md. If you add comments there, run gpd feedback, then /gpd-feedback; GPD will capture the comments, revise DRAFT.md after approval, and regenerate FINAL.md.';
  }
  if (next === '/gpd-export') {
    return 'Run /gpd-export, then review .paper/exports/FINAL.md rather than DRAFT.md.';
  }
  if (next === '/gpd-feedback') {
    return 'Run /gpd-feedback to approve, modify, defer, or reject each feedback-plan concern before revision.';
  }
  if (next === '/gpd-review' && a['exports/FINAL.md']) {
    return 'If comments were added to .paper/exports/FINAL.md, run gpd feedback first; /gpd-feedback approves the captured concerns before revision.';
  }
  if (next === '/gpd-revise') {
    const restore = snapshotRestoreCommand(state);
    if (restore) {
      return `Revise applies approved feedback to .paper/DRAFT.md. Prior state is restorable with: ${restore}`;
    }
    return 'Before editing, run gpd revise to snapshot the current paper. Then apply approved feedback to .paper/DRAFT.md; export regenerates FINAL.md.';
  }
  return 'Run the recommended command. After it finishes, run gpd next or /gpd-status again.';
}

function nextAction(input = {}) {
  const state = status(input);
  return {
    paperDir: state.paperDir,
    next: state.next,
    why: explainNext(state),
    strategyStatus: state.strategyStatus,
    primaryBlocker: state.primaryBlocker,
    stateSource: state.stateSource,
    context: contextForCommand(state.next),
    userAction: state.userAction,
    latestSnapshotId: state.latestSnapshotId,
    restoreCommand: state.restoreCommand,
  };
}

function printNext(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`next: ${result.next}`);
  console.log(`why: ${result.why}`);
  if (result.strategyStatus) console.log(`strategy: ${result.strategyStatus}`);
  if (result.primaryBlocker) console.log(`primary blocker: ${result.primaryBlocker}`);
  console.log(`clear context: ${result.context.clear_context}`);
  console.log(`read: ${result.context.read.join(', ')}`);
  console.log(`avoid: ${result.context.avoid.join(', ')}`);
  if (result.restoreCommand) console.log(`restore: ${result.restoreCommand}`);
  console.log(`user action: ${result.userAction}`);
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
  if (state.machineState && !grillComplete(state.machineState)) {
    issues.push({
      severity: 'HIGH',
      issue: 'Grill gate incomplete: run /gpd-grill before /gpd-brief',
    });
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
  writeStateMarkdown,
  findPaperDir,
  status,
  printStatus,
  nextAction,
  printNext,
  validate,
  printValidation,
  grillComplete,
};
