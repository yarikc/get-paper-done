'use strict';

const fs = require('fs');
const path = require('path');

const {
  basenameLabel,
  displayPath,
  expandHome,
  fileSha256IfExists,
  writeFile,
} = require('./common');
const {
  validatePaperArtifacts,
} = require('./validate');
const {
  validateSemanticPaper,
  validateGuardedRevisionRegression,
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
    accepted: input.accepted || null,
    import_mode: input.importMode || null,
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
  const importMode = state.import_mode || {};
  const accepted = state.accepted || {};
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
    '## Accepted Baseline',
    '',
    `- **Accepted at:** ${accepted.accepted_at || 'Not recorded'}`,
    `- **Source artifact:** ${accepted.source_artifact || 'Not recorded'}`,
    `- **Accepted path:** ${accepted.accepted_path || 'Not recorded'}`,
    `- **Accepted hash:** ${accepted.accepted_sha256 || 'Not recorded'}`,
    '',
    '## Import Mode',
    '',
    `- **Detected mode:** ${importMode.detected || 'Not recorded'}`,
    `- **Confirmed mode:** ${importMode.confirmed || 'Not recorded'}`,
    `- **Authored prose detected:** ${importMode.authored_prose_detected === true ? 'yes' : importMode.authored_prose_detected === false ? 'no' : 'Not recorded'}`,
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

function artifactChangedAfterStateAndNewerThan(state, upstream, downstream) {
  return artifactNewerThan(state.paperDir, upstream, downstream)
    && artifactNewerThan(state.paperDir, upstream, 'STATE.json');
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

function acceptedSummary(paperDir) {
  const meta = path.join(paperDir, '.paper');
  const acceptedPath = path.join(meta, 'accepted', 'ACCEPTED.md');
  const metadataPath = path.join(meta, 'accepted', 'ACCEPTED.meta.json');
  if (!fs.existsSync(acceptedPath) || !fs.existsSync(metadataPath)) {
    return {
      exists: false,
      label: 'none',
      candidate_status: 'no accepted baseline',
    };
  }
  const parsed = readJsonIfExists(metadataPath);
  if (!parsed.data) {
    return {
      exists: false,
      label: 'metadata malformed',
      candidate_status: 'accepted metadata malformed',
    };
  }
  const metadata = parsed.data;
  const currentDraftSha = artifactSha256(paperDir, 'DRAFT.md');
  let draftStatusSinceAccept = 'no draft candidate';
  if (currentDraftSha && metadata.draft_sha256) {
    draftStatusSinceAccept = currentDraftSha === metadata.draft_sha256
      ? 'draft unchanged since accept'
      : 'draft changed since accept';
  } else if (currentDraftSha) {
    draftStatusSinceAccept = 'draft exists; accepted metadata has no draft hash';
  }
  return {
    exists: true,
    version: metadata.version || 1,
    accepted_at: metadata.accepted_at || '',
    source_artifact: metadata.source_artifact || '',
    accepted_path: metadata.accepted_path || '.paper/accepted/ACCEPTED.md',
    accepted_sha256: metadata.accepted_sha256 || '',
    source_sha256: metadata.source_sha256 || '',
    draft_sha256: metadata.draft_sha256 || '',
    final_sha256: metadata.final_sha256 || '',
    current_draft_sha256: currentDraftSha,
    draft_status_since_accept: draftStatusSinceAccept,
    candidate_status: draftStatusSinceAccept,
    label: `${metadata.source_artifact || '.paper/accepted/ACCEPTED.md'} accepted ${metadata.accepted_at || ''}`.trim(),
  };
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

function feedbackPlanApprovedForRevision(state) {
  const feedbackState = state.machineState && state.machineState.feedback
    ? String(state.machineState.feedback.feedback_plan_status || '').trim().toLowerCase()
    : '';
  if (feedbackState === 'applied') return false;
  const markdown = artifactContent(state.paperDir, 'FEEDBACK-PLAN.md');
  const statusValue = parseMarkdownField(markdown, 'Status');
  if (!statusValue || statusValue.trim().toLowerCase() !== 'approved by user') return false;
  if (!state.artifacts['DRAFT.md']) return true;
  return artifactNewerThan(state.paperDir, 'FEEDBACK-PLAN.md', 'DRAFT.md');
}

function factCheckRecommendedAction(state) {
  return parseHeadingValue(artifactContent(state.paperDir, 'FACT-CHECK.md'), 'Recommended Next Action');
}

function reviewVerdict(state) {
  return parseHeadingValue(artifactContent(state.paperDir, 'REVIEW.md'), 'Verdict');
}

function parseReviewTimestamp(value) {
  if (!value) return null;
  const normalized = value
    .trim()
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function latestReviewTimestampBefore(markdown, index) {
  const before = markdown.slice(0, index);
  const pattern = /(?:\*\*(?:Added|Reviewed at|Review timestamp):\*\*|(?:Added|Reviewed at|Review timestamp):)\s*([^\n]+)/gi;
  let latest = null;
  for (const match of before.matchAll(pattern)) {
    const timestamp = parseReviewTimestamp(match[1]);
    if (timestamp !== null) latest = timestamp;
  }
  return latest;
}

function normalizeReviewRatingValue(value) {
  let normalized = stripMarkdownValue(value).replace(/\.$/, '').trim();
  if (/^\d+(?:\.\d+)?\s*\/\s*10\b/.test(normalized) && normalized.includes('. ')) {
    normalized = normalized.split('. ')[0].replace(/\.$/, '').trim();
  }
  return normalized;
}

function reviewRating(state) {
  const review = artifactContent(state.paperDir, 'REVIEW.md');
  if (!review) return '';
  const patterns = [
    /Quality assessment:\s*([^\n]+)/gi,
    /Estimated quality:\s*([^\n]+)/gi,
    /\*\*Current rating if given:\*\*\s*([^\n]+)/gi,
    /Current rating if given:\s*([^\n]+)/gi,
    /Current rating:\s*([^\n]+)/gi,
  ];
  const candidates = [];
  for (const pattern of patterns) {
    for (const match of review.matchAll(pattern)) {
      const index = match.index || 0;
      candidates.push({
        index,
        timestamp: latestReviewTimestampBefore(review, index),
        value: match[1],
      });
    }
  }
  candidates.sort((a, b) => {
    const aHasTimestamp = typeof a.timestamp === 'number';
    const bHasTimestamp = typeof b.timestamp === 'number';
    if (aHasTimestamp && bHasTimestamp && a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
    if (aHasTimestamp !== bHasTimestamp) return aHasTimestamp ? -1 : 1;
    return b.index - a.index;
  });
  for (const candidate of candidates) {
    const value = normalizeReviewRatingValue(candidate.value);
    if (!value || /^not stated$/i.test(value) || /^\[/.test(value)) continue;
    return value.length > 160 ? `${value.slice(0, 157)}...` : value;
  }
  return '';
}

function reviewRatingProvenance(state) {
  if (!state.reviewRating) return '';
  if (hasGuardedRevisionBlocker(state)) return 'blocked_guarded_revision';
  const review = artifactContent(state.paperDir, 'REVIEW.md');
  if (/\b(human|user)\s+(accepted|approved)|accepted\s+by\s+(human|user)\b/i.test(review)) {
    return 'human_accepted';
  }
  if (/\b(independent|external)\s+review|review-external|external reviewer\b/i.test(review)) {
    return 'independently_assessed';
  }
  if (artifactContent(state.paperDir, 'REVISION-CHECK.md')) return 'self_assessed';
  return 'unverified_local_review';
}

function reviewRatingUsable(state) {
  return state.reviewRating && !hasGuardedRevisionBlocker(state);
}

function reviewRatingDisplay(state) {
  if (!state.reviewRating) return '';
  if (hasGuardedRevisionBlocker(state)) {
    return `${state.reviewRating} (blocked: guarded revision failed; do not treat as current quality)`;
  }
  return state.reviewRating;
}

function finalExportPath(state) {
  return state.artifacts['exports/FINAL.md']
    ? path.join(state.paperDir, '.paper', 'exports', 'FINAL.md')
    : '';
}

function truncateLine(value, maxLength = 150) {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
}

function stageLabel(state) {
  if (state.machineState && state.machineState.status === 'Exported') return 'Exported';
  if (state.machineState && state.machineState.current_stage) return state.machineState.current_stage;
  return state.stateSource || 'Unknown';
}

function validationLabel(state) {
  if (hasGuardedRevisionBlocker(state)) return 'Blocked by guarded revision checks.';
  if (!state.reviewCompletionNote) return '';
  if (/semantic validation passed/i.test(state.reviewCompletionNote) && /list-density/i.test(state.reviewCompletionNote)) {
    return 'Passed. Medium list-density warnings accepted in REVIEW.md.';
  }
  if (/semantic validation passed/i.test(state.reviewCompletionNote)) return 'Passed.';
  return state.reviewCompletionNote;
}

function stateSummary(state) {
  if (hasGuardedRevisionBlocker(state)) return 'Guarded revision checks found a possible regression. Do not ask for user review yet.';
  if (state.machineState && state.machineState.status === 'Accepted') return 'Accepted baseline is set. Future candidate changes should compare against it.';
  if (state.next === '/gpd-status') return 'Ready for user review. No writing stage is blocked.';
  if (state.next === '/gpd-feedback') return 'Feedback is waiting for user decisions before revision.';
  if (state.next === '/gpd-revise') return 'Approved feedback is ready to apply through revision.';
  if (state.next === '/gpd-export') return 'Draft-side artifacts changed; export is stale.';
  return `Next required stage: ${state.next}.`;
}

function parseMarkdownTableRows(section) {
  const rows = [];
  for (const line of section.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;
    if (/^\|\s*-+\s*\|/.test(trimmed)) continue;
    const cells = trimmed
      .slice(1, -1)
      .split('|')
      .map((cell) => stripMarkdownValue(cell));
    if (cells.length >= 2) rows.push(cells);
  }
  return rows;
}

function latestReviewSection(reviewMarkdown) {
  if (!reviewMarkdown) return '';
  const headingPattern = /^##\s+(.+)$/gm;
  const sections = [];
  let match;
  while ((match = headingPattern.exec(reviewMarkdown)) !== null) {
    sections.push({
      title: match[1],
      index: match.index,
      bodyStart: headingPattern.lastIndex,
    });
  }
  if (sections.length === 0) return '';
  const sectionBodies = sections.map((section, index) => {
    const next = sections[index + 1];
    const body = reviewMarkdown.slice(section.bodyStart, next ? next.index : reviewMarkdown.length);
    const timestampMatch = body.match(/(?:\*\*(?:Added|Reviewed at|Review timestamp):\*\*|(?:Added|Reviewed at|Review timestamp):)\s*([^\n]+)/i);
    return {
      ...section,
      body,
      timestamp: timestampMatch ? parseReviewTimestamp(timestampMatch[1]) : null,
    };
  });
  sectionBodies.sort((a, b) => {
    const aHasTimestamp = typeof a.timestamp === 'number';
    const bHasTimestamp = typeof b.timestamp === 'number';
    if (aHasTimestamp && bHasTimestamp && a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
    if (aHasTimestamp !== bHasTimestamp) return aHasTimestamp ? -1 : 1;
    return b.index - a.index;
  });
  return sectionBodies[0].body;
}

function latestReviewSummary(state) {
  const review = artifactContent(state.paperDir, 'REVIEW.md');
  const section = latestReviewSection(review);
  if (!section) return [];
  const summaries = [];
  for (const line of section.split(/\r?\n/)) {
    const match = line.match(/^\s*-\s+(.+)/);
    if (!match) continue;
    const value = stripMarkdownValue(match[1]);
    if (!value || /^snapshot\b/i.test(value) || /^restore\b/i.test(value)) continue;
    if (/^validation\b/i.test(value) || /^quality\b/i.test(value)) continue;
    summaries.push(truncateLine(value, 120));
    if (summaries.length >= 3) break;
  }
  return summaries;
}

function revisionSummary(state) {
  const reviewSummary = latestReviewSummary(state);
  if (reviewSummary.length > 0) return reviewSummary;

  const revisionCheck = artifactContent(state.paperDir, 'REVISION-CHECK.md');
  const section = sectionBetween(revisionCheck, '## Change Impact');
  const rows = parseMarkdownTableRows(section);
  if (rows.length <= 1) return [];
  const [, ...bodyRows] = rows;
  const summaries = [];
  for (const cells of [...bodyRows].reverse()) {
    const [change, intendedImprovement, , result] = cells;
    if (!change || /^snapshot$/i.test(change) || /body h1/i.test(change)) continue;
    if (result && !/(improved|accepted|passed|complete|yes|preserved)/i.test(result)) continue;
    const summary = intendedImprovement
      ? `${truncateLine(change, 70)}: ${truncateLine(intendedImprovement, 110)}`
      : truncateLine(change);
    if (!summaries.includes(summary)) summaries.push(summary);
    if (summaries.length >= 5) break;
  }
  return summaries.reverse();
}

function reviewCompletionNote(state) {
  const review = artifactContent(state.paperDir, 'REVIEW.md');
  if (!review) return '';
  if (/validation with semantic gates passed/i.test(review) && /medium[- ]density warnings/i.test(review)) {
    return 'semantic validation passed; accepted medium list-density warnings are documented in REVIEW.md';
  }
  if (/validation with semantic gates passed/i.test(review)) {
    return 'semantic validation passed according to REVIEW.md';
  }
  return '';
}

function hasGuardedRevisionBlocker(state) {
  return Array.isArray(state.guardedRevisionIssues)
    && state.guardedRevisionIssues.some((item) => item.severity === 'HIGH');
}

function exportHasInlineReviewComments(paperDir) {
  const final = artifactContent(paperDir, 'exports/FINAL.md');
  if (!final) return false;
  let inFence = false;
  for (const line of final.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /\/\/\s*(?:(review)\s+)?(todo|keep|qq|no|question|preserve|reject)[!?]?:\s*/i.test(line)) {
      return true;
    }
  }
  return false;
}

function reviewRecommendation(state) {
  const a = state.artifacts || {};
  if (hasGuardedRevisionBlocker(state)) {
    return {
      recommendation: 'recover before user review',
      why: 'Guarded revision checks found deterministic regression signals after a substantive revision, so the paper should not be treated as improved or ready for human review.',
      after: 'Process inline comments with gpd feedback if present; otherwise revise from the accepted baseline or restore the prior snapshot.',
    };
  }
  const hasReviewSurface = Boolean(
    a['DRAFT.md']
    || a['REVIEW.md']
    || a['FEEDBACK-READER.md']
    || a['FEEDBACK-EXTERNAL.md']
    || a['FEEDBACK-PLAN.md']
    || a['exports/FINAL.md'],
  );
  if (!hasReviewSurface) return null;
  if (a['FEEDBACK-READER.md'] && (!a['FEEDBACK-PLAN.md'] || artifactNewerThan(state.paperDir, 'FEEDBACK-READER.md', 'FEEDBACK-PLAN.md'))) {
    return {
      recommendation: 'process reader feedback before more review',
      why: 'Reader comments already exist and need to be captured into an approved feedback plan before another review pass creates more noise.',
      after: 'Run gpd feedback if comments are still inline, then /gpd-feedback.',
    };
  }
  if (feedbackPlanPending(state)) {
    return {
      recommendation: 'approve feedback plan before more review',
      why: 'A feedback plan is pending user approval; revising or running external review before that decision would mix unresolved concerns with new feedback.',
      after: 'Run /gpd-feedback.',
    };
  }
  if (feedbackPlanApprovedForRevision(state)) {
    return {
      recommendation: 'revise before more review',
      why: 'The feedback plan is approved but not yet reflected in the draft, so another review would assess a stale version.',
      after: 'Run /gpd-revise, then /gpd-export.',
    };
  }
  if (!a['exports/FINAL.md'] && state.next !== '/gpd-export') return null;
  if (!a['exports/FINAL.md']) {
    return {
      recommendation: 'finish export before reader review',
      why: 'The user should review the exported reading copy, not the editable draft, once the paper is ready.',
      after: 'Run the recommended next stage until .paper/exports/FINAL.md exists.',
    };
  }
  if (state.next === '/gpd-export') {
    return {
      recommendation: 'export before review',
      why: 'The draft, fact-check, or review changed after the current export, so the visible reading copy is stale.',
      after: 'Run /gpd-export, then review .paper/exports/FINAL.md.',
    };
  }
  if (state.next !== '/gpd-status') {
    return {
      recommendation: 'complete the routed stage before review',
      why: 'The workspace still has an upstream required action; reviewing now would test a known-incomplete paper state.',
      after: `Run ${state.next}.`,
    };
  }
  if (Array.isArray(state.revisionSummary) && state.revisionSummary.length > 0) {
    return {
      recommendation: 'user review first',
      why: 'The latest export includes substantive revisions. User review should confirm intent, voice, posture, and political calibration before external review amplifies or redirects the paper.',
      after: 'If the user review passes, run external review. If not, add inline comments to FINAL.md and run gpd feedback.',
    };
  }
  if (!a['FEEDBACK-EXTERNAL.md'] || artifactNewerThan(state.paperDir, 'exports/FINAL.md', 'FEEDBACK-EXTERNAL.md')) {
    return {
      recommendation: 'user review first, then external review',
      why: 'External review is most useful after the user confirms the current export says the intended thing in the intended voice; the external review is missing or older than the export.',
      after: 'If the user review passes, run gpd review-external with the desired providers.',
    };
  }
  return {
    recommendation: 'user review before peer sharing',
    why: 'The export is current and external feedback exists, so the next judgment is whether the user accepts the paper for trusted peer circulation.',
    after: 'If accepted, share the exported FINAL.md; if not, add inline comments and run gpd feedback.',
  };
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

function latestSnapshotIdFromDisk(paperDir) {
  const versionsDir = path.join(paperDir, '.paper', 'versions');
  if (!fs.existsSync(versionsDir)) return '';
  const entries = fs.readdirSync(versionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('REV-'))
    .map((entry) => {
      const snapshotDir = path.join(versionsDir, entry.name);
      const metadata = readJsonIfExists(path.join(snapshotDir, 'VERSION-METADATA.json')).data || {};
      let timestamp = metadata.created_at || '';
      if (!timestamp) {
        try {
          timestamp = fs.statSync(snapshotDir).mtime.toISOString();
        } catch (_err) {
          timestamp = '';
        }
      }
      return {
        id: entry.name,
        timestamp,
      };
    });
  if (entries.length === 0) return '';
  entries.sort((a, b) => {
    if (a.timestamp === b.timestamp) return a.id.localeCompare(b.id);
    return a.timestamp.localeCompare(b.timestamp);
  });
  return entries[entries.length - 1].id;
}

function latestSnapshotId(state) {
  const versioning = versioningState(state);
  return latestSnapshotIdFromDisk(state.paperDir)
    || versioning.active_revision_snapshot_id
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
    'REVISION-INSTRUCTIONS.md',
    'REVISION-CHECK.md',
    'REVISION-LOG.md',
    'accepted/ACCEPTED.md',
    'accepted/ACCEPTED.meta.json',
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
  if (feedbackPlanPending(state)) return '/gpd-feedback';
  if (feedbackPlanApprovedForRevision(state)) return '/gpd-revise';
  if (hasGuardedRevisionBlocker(state)) {
    if (a['exports/FINAL.md'] && exportHasInlineReviewComments(state.paperDir)) return '/gpd-feedback';
    return '/gpd-revise';
  }
  if (state.machineState && state.machineState.status === 'Accepted') return '/gpd-status';
  if (!grillComplete(state.machineState)) return '/gpd-grill';
  if (state.strategyStatus === 'Revise Before Drafting' || state.strategyStatus === 'No-Go') {
    return '/gpd-brief';
  }
  if (state.machineState && state.machineState.status === 'Restored') return '/gpd-status';
  if (
    state.machineState
    && state.machineState.current_stage === 'Revision'
    && artifactNewerThan(state.paperDir, 'DRAFT.md', 'STATE.json')
    && artifactNewerThan(state.paperDir, 'REVISION-CHECK.md', 'STATE.json')
  ) {
    return '/gpd-export';
  }
  if (
    artifactChangedAfterStateAndNewerThan(state, 'PAPER-CONTEXT.md', 'BRIEF.md')
    || artifactChangedAfterStateAndNewerThan(state, 'DECISIONS.md', 'BRIEF.md')
  ) {
    return '/gpd-brief';
  }
  if (
    artifactChangedAfterStateAndNewerThan(state, 'BRIEF.md', 'RESEARCH.json')
    || artifactChangedAfterStateAndNewerThan(state, 'STRATEGY.md', 'RESEARCH.json')
  ) {
    return '/gpd-research';
  }
  if (artifactChangedAfterStateAndNewerThan(state, 'RESEARCH.json', 'OUTLINE.md')) return '/gpd-outline --deep';
  if (artifactChangedAfterStateAndNewerThan(state, 'OUTLINE.md', 'DRAFT.md')) return '/gpd-draft';
  if (draftNewerThanWithContentChange(state, 'FACT-CHECK.md')) return '/gpd-fact-check --full';

  const factCheckAction = factCheckRecommendedAction(state);
  if (factCheckAction === '/gpd-research') return '/gpd-research';
  if (factCheckAction === '/gpd-revise') return '/gpd-revise';

  if (
    draftNewerThanWithContentChange(state, 'REVIEW.md')
    || artifactChangedAfterStateAndNewerThan(state, 'FACT-CHECK.md', 'REVIEW.md')
  ) {
    return '/gpd-review --deep';
  }
  if (
    a['FEEDBACK-READER.md']
    && (!a['FEEDBACK-PLAN.md'] || artifactChangedAfterStateAndNewerThan(state, 'FEEDBACK-READER.md', 'FEEDBACK-PLAN.md'))
  ) {
    return '/gpd-review';
  }

  const verdict = reviewVerdict(state);
  if (verdict === 'Revise' || verdict === 'Rework') return '/gpd-revise';
  if (reviewBelowTargetRequiresRevision(state)) return '/gpd-revise';
  if (a['exports/FINAL.md']) {
    if (
      draftChangedSinceExport(state)
      || artifactChangedAfterStateAndNewerThan(state, 'FACT-CHECK.md', 'exports/FINAL.md')
      || artifactChangedAfterStateAndNewerThan(state, 'REVIEW.md', 'exports/FINAL.md')
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
  state.guardedRevisionIssues = validateGuardedRevisionRegression(paperDir);
  state.next = suggestedNext(state);
  state.userAction = userActionHint(state);
  state.latestSnapshotId = latestSnapshotId(state);
  state.restoreCommand = snapshotRestoreCommand(state);
  state.reviewRating = reviewRating(state);
  state.reviewRatingProvenance = reviewRatingProvenance(state);
  state.reviewRatingUsable = reviewRatingUsable(state);
  state.reviewRatingDisplay = reviewRatingDisplay(state);
  state.finalExportPath = finalExportPath(state);
  state.revisionSummary = revisionSummary(state);
  state.reviewCompletionNote = reviewCompletionNote(state);
  state.reviewRecommendation = reviewRecommendation(state);
  state.acceptedSummary = acceptedSummary(paperDir);
  state.full = Boolean(input.full);
  return state;
}

function printStatus(state) {
  console.log('Paper status');
  console.log('');
  console.log(`Paper: ${basenameLabel(state.paperDir)}`);
  console.log(`Stage: ${stageLabel(state)}`);
  if (state.finalExportPath) console.log(`Current paper: ${displayPath(state.paperDir, state.finalExportPath)}`);
  if (state.acceptedSummary && state.acceptedSummary.exists) {
    console.log(`Accepted baseline: ${state.acceptedSummary.accepted_path} (${state.acceptedSummary.draft_status_since_accept})`);
  } else {
    console.log('Accepted baseline: none');
  }
  if (state.reviewRatingDisplay) console.log(`Rating: ${state.reviewRatingDisplay}`);
  if (state.reviewRatingProvenance) console.log(`Rating source: ${state.reviewRatingProvenance}`);
  console.log(`State: ${stateSummary(state)}`);
  const validation = validationLabel(state);
  if (validation) console.log(`Validation: ${validation}`);
  if (hasGuardedRevisionBlocker(state)) {
    console.log('Guarded revision: failed');
    for (const item of state.guardedRevisionIssues.filter((issueItem) => issueItem.severity === 'HIGH').slice(0, 3)) {
      console.log(`- ${item.issue}`);
    }
  }
  if (state.latestSnapshotId) console.log(`Snapshot: ${state.latestSnapshotId}`);
  if (Array.isArray(state.revisionSummary) && state.revisionSummary.length > 0) {
    console.log('');
    console.log('Latest change:');
    for (const item of state.revisionSummary) console.log(`- ${item}`);
  }
  if (state.reviewRecommendation) {
    console.log('');
    console.log(`Recommended review: ${state.reviewRecommendation.recommendation}. Why: ${state.reviewRecommendation.why}`);
    console.log(`After that: ${state.reviewRecommendation.after}`);
  }
  console.log('');
  const nextLabel = state.next === '/gpd-status' && state.finalExportPath
    ? 'Read .paper/exports/FINAL.md'
    : state.next;
  console.log(`Next: ${nextLabel}`);
  if (!state.reviewRecommendation) {
    console.log(`User action: ${state.userAction}`);
  }
  if (state.latestSnapshotId) console.log(`Restore: ${state.restoreCommand}`);
  if (state.full && state.reviewRecommendation) {
    console.log(`Why: ${state.reviewRecommendation.why}`);
    console.log(`User action: ${state.userAction}`);
  }
  if (state.full) {
    console.log('');
    console.log(`State source: ${state.stateSource || 'missing'}`);
    console.log(`Strategy: ${state.strategyStatus || 'missing'}`);
    if (state.primaryBlocker && state.primaryBlocker !== 'none') console.log(`Primary blocker: ${state.primaryBlocker}`);
    console.log('artifacts:');
    for (const [name, exists] of Object.entries(state.artifacts)) {
      console.log(`- ${exists ? 'ok' : 'missing'} ${name}`);
    }
  }
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
      read: ['DRAFT.md', 'REVISION-INSTRUCTIONS.md if present', 'REVIEW.md', 'FEEDBACK-PLAN.md if needed', 'FEEDBACK-READER.md if needed', 'REVISION-LOG.md if present'],
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
  if (hasGuardedRevisionBlocker(state)) {
    return 'Guarded revision checks found deterministic regression signals after a substantive revision, so recover or revise before asking the user to review the export.';
  }
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
    artifactChangedAfterStateAndNewerThan(state, 'PAPER-CONTEXT.md', 'BRIEF.md')
    || artifactChangedAfterStateAndNewerThan(state, 'DECISIONS.md', 'BRIEF.md')
  ) {
    return 'Paper context or decision records changed after the brief, so the formal brief must absorb the clarified intent before downstream work continues.';
  }
  if (feedbackPlanPending(state)) return 'A feedback plan is pending approval, so /gpd-feedback should walk through the concerns before revision.';
  if (
    artifactChangedAfterStateAndNewerThan(state, 'BRIEF.md', 'RESEARCH.json')
    || artifactChangedAfterStateAndNewerThan(state, 'STRATEGY.md', 'RESEARCH.json')
  ) {
    return 'The brief or strategy changed after research, so research needs an incremental refresh.';
  }
  if (artifactChangedAfterStateAndNewerThan(state, 'RESEARCH.json', 'OUTLINE.md')) return 'Research is newer than the outline, so the outline needs to be refreshed.';
  if (artifactChangedAfterStateAndNewerThan(state, 'OUTLINE.md', 'DRAFT.md')) return 'The outline is newer than the draft, so drafting should resume from the updated structure.';
  if (draftNewerThanWithContentChange(state, 'FACT-CHECK.md')) return 'The draft is newer than the fact-check, so material claims need a fresh check.';
  const factCheckAction = factCheckRecommendedAction(state);
  if (factCheckAction === next) return `FACT-CHECK.md recommends ${next}, so follow the documented fact-check routing.`;
  if (
    draftNewerThanWithContentChange(state, 'REVIEW.md')
    || artifactChangedAfterStateAndNewerThan(state, 'FACT-CHECK.md', 'REVIEW.md')
  ) {
    return 'The draft or fact-check changed after review, so review needs a refresh.';
  }
  if (
    a['FEEDBACK-READER.md']
    && (!a['FEEDBACK-PLAN.md'] || artifactChangedAfterStateAndNewerThan(state, 'FEEDBACK-READER.md', 'FEEDBACK-PLAN.md'))
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
  if (a['REVISION-INSTRUCTIONS.md'] && next === '/gpd-revise') return 'Approved feedback has been compiled into REVISION-INSTRUCTIONS.md, so revision has a compact instruction set.';
  if (a['FEEDBACK-PLAN.md'] && next === '/gpd-revise') return 'A feedback plan exists, so approved changes can be applied through revision.';
  if (next === '/gpd-export') return 'The paper has the required reviewed draft artifacts and is ready for export.';
  const nextFromState = savedNextCommand(state);
  if (nextFromState === next) return 'STATE.json saved this as the next plausible command, and required upstream artifacts are present.';
  return 'This is the earliest stage that appears necessary from the current artifact state.';
}

function userActionHint(state) {
  const a = state.artifacts;
  const next = state.next;
  if (hasGuardedRevisionBlocker(state)) {
    if (next === '/gpd-feedback') {
      return 'Run gpd feedback to capture the inline regression comments, then approve a recovery-oriented plan before another revision.';
    }
    return 'Do not ask the user to review this export as improved. Revise from the accepted baseline or restore the prior snapshot before external review.';
  }
  if (a['exports/FINAL.md'] && next === '/gpd-status') {
    return 'Read .paper/exports/FINAL.md. If you add inline comments, run gpd feedback; it will route approval and revision next.';
  }
  if (next === '/gpd-export') {
    return 'Run /gpd-export, then review .paper/exports/FINAL.md rather than DRAFT.md.';
  }
  if (next === '/gpd-feedback') {
    return 'Run /gpd-feedback to approve, modify, defer, or reject each feedback-plan concern before revision.';
  }
  if (next === '/gpd-review' && a['exports/FINAL.md']) {
    return 'If inline comments were added to .paper/exports/FINAL.md, run gpd feedback first; /gpd-feedback approves the captured concerns before revision.';
  }
  if (next === '/gpd-revise') {
    const restore = snapshotRestoreCommand(state);
    const instructionHint = a['REVISION-INSTRUCTIONS.md']
      ? ' Use .paper/REVISION-INSTRUCTIONS.md as the compact approved instruction set.'
      : '';
    if (restore) {
      return `Revise applies approved feedback to .paper/DRAFT.md.${instructionHint} Prior state is restorable with: ${restore}`;
    }
    return `Before editing, run gpd revise to snapshot the current paper. Then apply approved feedback to .paper/DRAFT.md; export regenerates FINAL.md.${instructionHint}`;
  }
  return 'Run the recommended command. After it finishes, run gpd next in the terminal or /gpd-status in Claude/Codex.';
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
    reviewRating: state.reviewRating,
    reviewRatingProvenance: state.reviewRatingProvenance,
    reviewRatingUsable: state.reviewRatingUsable,
    reviewRatingDisplay: state.reviewRatingDisplay,
    reviewRecommendation: state.reviewRecommendation,
    full: Boolean(input.full),
  };
}

function printNext(result) {
  const displayNext = result.next === '/gpd-status'
    ? 'Read .paper/exports/FINAL.md'
    : result.next;
  console.log('Next step');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Recommended: ${displayNext}`);
  console.log(`Why: ${result.reviewRecommendation ? result.reviewRecommendation.why : result.why}`);
  if (result.reviewRatingDisplay) console.log(`Rating: ${result.reviewRatingDisplay}`);
  if (result.reviewRatingProvenance) console.log(`Rating source: ${result.reviewRatingProvenance}`);
  if (result.reviewRecommendation) {
    console.log(`Review path: ${result.reviewRecommendation.recommendation}`);
    console.log(`After that: ${result.reviewRecommendation.after}`);
  }
  if (!result.reviewRecommendation) {
    console.log('');
    console.log(`User action: ${result.userAction}`);
  }
  if (result.restoreCommand) console.log(`Restore: ${result.restoreCommand}`);
  if (result.full) {
    console.log('');
    console.log(`Context reset: ${result.context.clear_context}`);
    console.log(`Read: ${result.context.read.join(', ')}`);
    console.log(`Avoid: ${result.context.avoid.join(', ')}`);
  }
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
  printStatus({ ...result, full: true });
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
