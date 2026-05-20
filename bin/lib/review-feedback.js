'use strict';

const fs = require('fs');
const path = require('path');

const {
  writeFile,
} = require('./common');
const {
  createSnapshot,
} = require('./snapshot');
const {
  findPaperDir,
  status,
  writeStateJson,
  writeStateMarkdown,
} = require('./state');

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function preservedPriorMarkdown(title, markdown) {
  if (!markdown) return '';
  const quoted = markdown
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n');
  return ['---', '', `## ${title}`, '', quoted].join('\n');
}

function reviewTarget(paperDir) {
  const finalPath = path.join(paperDir, '.paper', 'exports', 'FINAL.md');
  if (fs.existsSync(finalPath)) {
    return {
      artifact: 'exports/FINAL.md',
      path: finalPath,
      editableSource: '.paper/DRAFT.md',
      reason: 'FINAL.md exists, so it is the current reading copy.',
    };
  }

  const draftPath = path.join(paperDir, '.paper', 'DRAFT.md');
  return {
    artifact: 'DRAFT.md',
    path: draftPath,
    editableSource: '.paper/DRAFT.md',
    reason: 'No export exists yet, so review the draft.',
  };
}

function reviewTargetFromInput(paperDir, input = {}) {
  if (!input.from) return reviewTarget(paperDir);
  const raw = String(input.from);
  const candidate = path.isAbsolute(raw)
    ? raw
    : path.join(paperDir, raw.startsWith('.paper/') ? raw : path.join('.paper', raw));
  const meta = path.join(paperDir, '.paper');
  const relative = path.relative(meta, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('--from must point to a file inside .paper/');
  }
  return {
    artifact: relative.split(path.sep).join('/'),
    path: candidate,
    editableSource: '.paper/DRAFT.md',
    reason: 'Explicit review source selected with --from.',
  };
}

function reviewPack(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const target = reviewTargetFromInput(paperDir, input);
  if (!fs.existsSync(target.path)) throw new Error(`Review target is missing: .paper/${target.artifact}`);

  return {
    paperDir,
    reviewTarget: target.path,
    reviewArtifact: `.paper/${target.artifact}`,
    editableSource: target.editableSource,
    reason: target.reason,
    commentSyntax: [
      '//todo: requested action',
      '//keep: preserve this wording, argument, voice, or specificity',
      '//qq: question or uncertainty',
      '//no: reject or disagree with this claim/framing',
      '//todo!: high-severity action, //todo?: low-severity action',
      '//review todo: optional scoped form, closed with // when useful',
    ],
    captureCommand: `gpd feedback collect --paper ${paperDir}`,
    next: 'Review the target file, add comments, then run gpd feedback collect.',
  };
}

function nearestContext(lines, lineIndex) {
  let heading = '';
  let previousText = '';
  for (let i = 0; i <= lineIndex; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('#')) heading = trimmed.replace(/^#+\s*/, '');
    if (
      i < lineIndex
      && trimmed
      && !trimmed.startsWith('//')
      && !trimmed.includes('<!--')
    ) {
      previousText = trimmed;
    }
  }
  return { heading, previousText };
}

const markerAliases = {
  question: 'qq',
  preserve: 'keep',
  reject: 'no',
};

function normalizeKind(kind) {
  return markerAliases[kind] || kind;
}

function kindLabel(kind) {
  if (kind === 'todo') return 'Action';
  if (kind === 'keep') return 'Preservation';
  if (kind === 'qq') return 'Question';
  if (kind === 'no') return 'Rejection';
  return 'Concern';
}

function severityFromSuffix(suffix, feedback) {
  if (suffix === '!') return 'HIGH';
  if (suffix === '?') return 'LOW';
  return inferSeverity(feedback);
}

function markerRegex() {
  return /\/\/\s*(?:(review)\s+)?(todo|keep|qq|no|question|preserve|reject)([!?]?):\s*/i;
}

function isFenceLine(line) {
  return /^\s*(```|~~~)/.test(line);
}

function closingMarkerIndex(line, afterMarkerStart) {
  const remaining = line.slice(afterMarkerStart);
  const closeMatch = remaining.match(/(?<=\s)\/\//);
  return closeMatch ? afterMarkerStart + closeMatch.index : -1;
}

function inlineCommentFromLine(line) {
  const match = markerRegex().exec(line);
  if (!match) return null;
  const markerStart = match.index;
  const before = line.slice(0, markerStart);
  const afterMarkerStart = markerStart + match[0].length;
  const closeIndex = closingMarkerIndex(line, afterMarkerStart);
  const commentEnd = closeIndex >= 0 ? closeIndex : line.length;
  const rawComment = line.slice(afterMarkerStart, commentEnd).trim();
  if (!rawComment) return null;
  const after = closeIndex >= 0 ? line.slice(closeIndex + 2) : '';
  const cleanLine = `${before}${after}`.replace(/[ \t]{2,}/g, ' ').trimEnd();
  return {
    comment: rawComment,
    anchor: before.trim() || cleanLine.trim(),
    kind: normalizeKind(match[2].toLowerCase()),
    suffix: match[3] || '',
    scoped: Boolean(match[1]),
    marker: match[0].trim(),
    markerStart,
    markerEnd: commentEnd,
    hasClosingMarker: closeIndex >= 0,
    cleanLine,
  };
}

function cleanInlineCommentsFromMarkdown(content) {
  const lines = content.split(/\r?\n/);
  let inFence = false;
  let removed = 0;
  const cleaned = lines.map((line) => {
    if (isFenceLine(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    const parsed = inlineCommentFromLine(line);
    if (!parsed) return line;
    removed += 1;
    return parsed.cleanLine.trim() ? parsed.cleanLine : null;
  }).filter((line) => line !== null);
  return {
    content: cleaned.join('\n'),
    removed,
  };
}

function commentsFromMarkdown(content, artifact) {
  const lines = content.split(/\r?\n/);
  const comments = [];
  let inFence = false;
  lines.forEach((line, index) => {
    if (isFenceLine(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const parsed = inlineCommentFromLine(line);
    if (!parsed) return;
    const context = nearestContext(lines, index);
    const severity = severityFromSuffix(parsed.suffix, parsed.comment);
    comments.push({
      artifact,
      line: index + 1,
      feedback: parsed.comment,
      context: parsed.anchor || context.previousText || context.heading || artifact,
      heading: context.heading,
      kind: parsed.kind,
      type: kindLabel(parsed.kind),
      severity,
      explicitSeverity: Boolean(parsed.suffix),
      marker: parsed.marker,
      hasClosingMarker: parsed.hasClosingMarker,
    });
  });
  return comments;
}

function commentsFromFeedbackFile(content, artifact) {
  return content
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim())
    .map(({ line, index }) => ({
      artifact,
      line: index + 1,
      feedback: stripCommentPrefix(line.trim()),
      context: artifact,
      heading: 'Companion feedback file',
      kind: 'todo',
      type: 'Action',
      severity: inferSeverity(stripCommentPrefix(line.trim())),
    }))
    .filter((item) => item.feedback);
}

function stripCommentPrefix(value) {
  return value
    .replace(/^\/\//, '')
    .replace(/^\s*(review|feedback)\b\s*:?\s*/i, '')
    .trim();
}

function collectInlineFeedback(paperDir, input = {}) {
  const target = reviewTargetFromInput(paperDir, input);
  const sources = [];
  if (fs.existsSync(target.path)) {
    sources.push({
      artifact: target.artifact,
      path: target.path,
      content: fs.readFileSync(target.path, 'utf8'),
      mode: 'markdown',
    });
  }

  const feedbackPaths = Array.from(new Set([
    `${target.path}.feedback`,
    path.join(paperDir, '.paper', `${target.artifact}.feedback`),
  ]));
  for (const feedbackPath of feedbackPaths) {
    if (fs.existsSync(feedbackPath)) {
      sources.push({
        artifact: `${target.artifact}.feedback`,
        path: feedbackPath,
        content: fs.readFileSync(feedbackPath, 'utf8'),
        mode: 'feedback-file',
      });
    }
  }

  return sources.flatMap((source) => (
    source.mode === 'feedback-file'
      ? commentsFromFeedbackFile(source.content, source.artifact)
      : commentsFromMarkdown(source.content, source.artifact)
  ));
}

function inferSignal(feedback) {
  const value = feedback.toLowerCase();
  if (/evidence|source|fact|support|proof|standard|citation/.test(value)) return 'Evidence';
  if (/audience|reader|executive|engineer|architect|stakeholder/.test(value)) return 'Audience fit';
  if (/tone|voice|sounds|style/.test(value)) return 'Voice';
  if (/register|formal|casual|jargon|acronym/.test(value)) return 'Register';
  return 'Ask clarity';
}

function inferSeverity(feedback) {
  return /unclear|missing|wrong|weak|unsupported|not convincing|does not|can't|cannot/i.test(feedback)
    ? 'HIGH'
    : 'MEDIUM';
}

function markdownEscape(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function readerFeedbackMarkdown({ comments, createdAt, targetArtifact }) {
  const rows = comments.map((comment, index) => (
    `| ${index + 1} | ${comment.type || 'Concern'} | ${markdownEscape(comment.feedback)} | ${inferSignal(comment.feedback)} | ${comment.severity || inferSeverity(comment.feedback)} | Ask user | ${markdownEscape(comment.artifact)}:${comment.line} |`
  )).join('\n');
  const questions = comments.map((comment, index) => (
    `- Item ${index + 1}: confirm whether to incorporate the feedback from ${comment.artifact}:${comment.line}.`
  )).join('\n');

  return `# Reader Feedback

**Created:** ${createdAt}
**Source:** inline user comments
**Draft reviewed:** ${targetArtifact}
**Status:** Captured

## Source

- **Reviewer:** User
- **Context:** Comments captured from the current review target by \`gpd feedback collect\`.
- **Scope:** whole paper or commented sections

## Five-Signal Scorecard

| Signal | Score | Evidence | Actionable Feedback |
|--------|-------|----------|---------------------|
| Voice | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Register | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Audience fit | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Evidence | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Ask clarity | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |

## Feedback Items

| # | Type | Feedback | Signal | Severity | Recommended Handling | Affected Artifact |
|---|------|----------|--------|----------|----------------------|-------------------|
${rows}

## Questions

${questions}

## Suggested Handling

- **Incorporate:** None automatically. Inline comments require approval through \`.paper/FEEDBACK-PLAN.md\`.
- **Ignore:** None automatically.
- **Defer:** None automatically.
- **Ask user:** Decide which captured comments should become revision work.

## Notes

- Reader feedback is an input to \`.paper/FEEDBACK-PLAN.md\`; it does not directly authorize draft changes.
`;
}

function recommendationForComment(comment) {
  if (comment.kind === 'keep') return 'preserve';
  if (comment.kind === 'qq') return 'answer';
  if (comment.kind === 'no') return 'modify';
  return 'modify';
}

function whyForComment(comment) {
  if (comment.kind === 'keep') return 'The reader explicitly marked this as something the revision must preserve. Losing it risks repeating the prior regression where a strong paper became generic.';
  if (comment.kind === 'qq') return 'The reader raised a question or uncertainty. It must be answered before deciding whether revision, research, fact-checking, or no action is appropriate.';
  if (comment.kind === 'no') return 'The reader explicitly rejected this framing or claim. Leaving it unresolved may preserve a known disagreement in the paper.';
  return 'This is direct reader friction on the exported paper, so it may reveal ambiguity the workflow missed.';
}

function handlingForComment(comment) {
  if (comment.kind === 'keep') return 'Treat this as a preservation constraint during revision. Do not rewrite away the marked wording, argument, voice, or specificity unless the user explicitly overrides it.';
  if (comment.kind === 'qq') return 'Answer the question first. Then decide whether the result requires revision, research, fact-checking, deferral, or no action.';
  if (comment.kind === 'no') return 'Resolve the rejected claim or framing before revision approval. If the rejection is accepted, rewrite or remove the problematic framing without diluting adjacent strong material.';
  return 'Discuss the comment, then incorporate it if it clarifies intent, evidence, audience fit, or ask quality without expanding scope.';
}

function proposedEditForComment(comment) {
  if (comment.kind === 'keep') return `Preserve reader-marked material: ${markdownEscape(comment.feedback)}`;
  if (comment.kind === 'qq') return `Answer reader question before deciding revision action: ${markdownEscape(comment.feedback)}`;
  if (comment.kind === 'no') return `Address rejected framing or claim: ${markdownEscape(comment.feedback)}`;
  return `Address reader comment: ${markdownEscape(comment.feedback)}`;
}

function userConstraintForComment(comment) {
  if (comment.kind === 'keep') return markdownEscape(comment.feedback) || 'preserve marked material';
  return 'none yet';
}

function feedbackPlanMarkdown({ comments, createdAt }) {
  const sections = comments.map((comment, index) => [
    `### ${index + 1}. ${comment.type || 'Concern'}: Reader comment ${index + 1}`,
    '',
    `- **Type:** ${comment.type || 'Concern'}`,
    `- **Severity:** ${comment.severity || inferSeverity(comment.feedback)}`,
    `- **Source(s):** ${markdownEscape(comment.artifact)}:${comment.line}`,
    `- **Recommendation:** ${recommendationForComment(comment)}`,
    `- **Why this matters:** ${whyForComment(comment)}`,
    '- **What improves if addressed:** The revised paper should better match the reader need that triggered the inline comment.',
    '- **Risk if handled badly:** Applying the comment mechanically can expand scope, weaken the paper purpose, or conflict with approved author intent.',
    `- **Proposed handling:** ${handlingForComment(comment)}`,
    '- **Proposed edits:**',
    `  1. ${proposedEditForComment(comment)}`,
    '- **Reviewer evidence:**',
    `  - ${markdownEscape(comment.feedback)}`,
    '- **Affected artifacts:** DRAFT / BRIEF / RESEARCH / OUTLINE',
    '- **User Decision:** pending',
    `- **User Constraint:** ${userConstraintForComment(comment)}`,
    '',
  ].join('\n')).join('\n');
  const itemList = comments.map((_, index) => String(index + 1)).join(', ') || 'none';

  return `# Feedback Handling Plan

**Created:** ${createdAt}
**Based on:** \`.paper/FEEDBACK-READER.md\`
**Status:** Pending user approval

## Summary

\`gpd feedback collect\` captured inline review comments, grouped them into the concern-first decision queue below, and stopped at the approval gate. No draft or upstream artifact has been changed.

## Decision View

Review concerns ${itemList}. Use \`approve\`, \`modify\`, \`defer\`, or \`reject\` for each concern.

| # | Concern | Type | Severity | Recommendation | User Decision |
|---|---------|------|----------|----------------|---------------|
${comments.map((comment, index) => `| ${index + 1} | Reader comment ${index + 1} | ${comment.type || 'Concern'} | ${comment.severity || inferSeverity(comment.feedback)} | ${recommendationForComment(comment)} | pending |`).join('\n')}

These comments came from the reading copy, so they represent actual reader friction rather than speculative reviewer advice. The next draft should be easier to understand and more aligned with the reader's decision needs.

## Proposed Handling

${sections}

## Below-Target Items

| # | Issue | Target Bar Impact | Recommendation | Reason |
|---|-------|-------------------|----------------|--------|
| 1 | Inline comments may identify below-target issues. | Unknown until the user evaluates captured feedback. | modify | Inline comments are captured as proposed handling, not automatic rewrite authority. |

## Approved Or Modified

- Only concerns with \`User Decision: approve\` or \`modify\`.

## Rejected

- None automatically.

## Deferred

- Use \`User Decision: defer\` for comments that should not affect this revision.

## User Decisions Needed

- Decide which captured inline comments should become revision work.

## Approval Gate

Before changing \`.paper/DRAFT.md\` or upstream artifacts, present this plan to the user and ask how to proceed.

Options:

- Approve a concern
- Modify a concern with a constraint
- Defer a concern
- Reject a concern
- Revise the handling plan
- Reject captured feedback
`;
}

function updateFeedbackState(paperDir, dryRun) {
  const current = status({ paper: paperDir });
  const state = current.machineState;
  if (!state) return null;
  const nextState = {
    ...state,
    status: 'Feedback Pending',
    current_stage: 'Reader Feedback',
    last_completed_stage: 'Reader Feedback Capture',
    last_activity: new Date().toISOString(),
    suggested_next_command: '/gpd-feedback',
    feedback: {
      ...(state.feedback || {}),
      feedback_plan_status: 'Pending user approval',
      approved_handling: '',
    },
  };
  writeStateJson(paperDir, nextState, dryRun);
  writeStateMarkdown(paperDir, nextState, dryRun);
  return nextState;
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

function preserveCommentedReview(meta, target, content, createdAt, dryRun) {
  const reviewsDir = path.join(meta, 'reviews');
  const baseName = target.artifact.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'review';
  const reviewPath = path.join(reviewsDir, `inline-feedback-${timestampForFile(new Date(createdAt))}-${baseName}.md`);
  writeFile(reviewPath, content, dryRun);
  return reviewPath;
}

function captureFeedback(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const target = reviewTargetFromInput(paperDir, input);
  if (!fs.existsSync(target.path)) throw new Error(`Review target is missing: .paper/${target.artifact}`);

  const comments = collectInlineFeedback(paperDir, input);
  if (comments.length === 0) {
    return {
      paperDir,
      reviewTarget: target.path,
      commentsCaptured: 0,
      readerFeedbackPath: path.join(paperDir, '.paper', 'FEEDBACK-READER.md'),
      feedbackPlanPath: path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
      next: 'Add inline comments to the review target, then run gpd feedback collect again.',
    };
  }

  const createdAt = new Date().toISOString();
  const meta = path.join(paperDir, '.paper');
  const readerFeedbackPath = path.join(meta, 'FEEDBACK-READER.md');
  const feedbackPlanPath = path.join(meta, 'FEEDBACK-PLAN.md');
  const commentedReviewPath = preserveCommentedReview(
    meta,
    target,
    fs.readFileSync(target.path, 'utf8'),
    createdAt,
    input.dryRun,
  );
  const snapshot = createSnapshot({
    paper: paperDir,
    reason: 'inline_feedback_collect',
    trigger: `.paper/${target.artifact}`,
    notes: `Preserved commented review artifact at ${path.relative(paperDir, commentedReviewPath).split(path.sep).join('/')}`,
    dryRun: input.dryRun,
  });
  const previousReaderFeedback = readIfExists(readerFeedbackPath);
  const previousFeedbackPlan = readIfExists(feedbackPlanPath);
  const readerFeedback = [
    readerFeedbackMarkdown({ comments, createdAt, targetArtifact: `.paper/${target.artifact}` }),
    preservedPriorMarkdown('Prior Reader Feedback', previousReaderFeedback),
  ].filter(Boolean).join('\n\n');
  const feedbackPlan = [
    feedbackPlanMarkdown({ comments, createdAt }),
    preservedPriorMarkdown('Prior Feedback Plan', previousFeedbackPlan),
  ].filter(Boolean).join('\n\n');

  writeFile(readerFeedbackPath, readerFeedback, input.dryRun);
  writeFile(feedbackPlanPath, feedbackPlan, input.dryRun);
  updateFeedbackState(paperDir, input.dryRun);

  return {
    paperDir,
    reviewTarget: target.path,
    commentsCaptured: comments.length,
    readerFeedbackPath,
    feedbackPlanPath,
    commentedReviewPath,
    snapshotId: snapshot.versionId,
    commentsLeftInPlace: true,
    next: '/gpd-feedback',
  };
}

function cleanFeedbackComments(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const target = reviewTargetFromInput(paperDir, input);
  if (!fs.existsSync(target.path)) throw new Error(`Review target is missing: .paper/${target.artifact}`);
  const original = fs.readFileSync(target.path, 'utf8');
  const cleaned = cleanInlineCommentsFromMarkdown(original);
  if (cleaned.removed === 0) {
    return {
      paperDir,
      reviewTarget: target.path,
      commentsRemoved: 0,
      next: 'No inline feedback comments found to clean.',
    };
  }
  const snapshot = createSnapshot({
    paper: paperDir,
    reason: 'inline_feedback_clean',
    trigger: `.paper/${target.artifact}`,
    notes: `Before cleaning ${cleaned.removed} inline feedback comments from .paper/${target.artifact}`,
    dryRun: input.dryRun,
  });
  writeFile(target.path, cleaned.content, input.dryRun);
  return {
    paperDir,
    reviewTarget: target.path,
    commentsRemoved: cleaned.removed,
    snapshotId: snapshot.versionId,
    next: '/gpd-feedback',
  };
}

function printReviewPack(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`review target: ${result.reviewTarget}`);
  console.log(`review artifact: ${result.reviewArtifact}`);
  console.log(`editable source: ${result.editableSource}`);
  console.log(`why: ${result.reason}`);
  console.log('comment syntax:');
  for (const syntax of result.commentSyntax) console.log(`- ${syntax}`);
  console.log(`capture: ${result.captureCommand}`);
  console.log(`next: ${result.next}`);
}

function printFeedbackCapture(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`review target: ${result.reviewTarget}`);
  console.log(`comments captured: ${result.commentsCaptured}`);
  console.log(`reader feedback: ${result.readerFeedbackPath}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  if (result.commentedReviewPath) console.log(`commented review preserved: ${result.commentedReviewPath}`);
  if (result.snapshotId) console.log(`snapshot: ${result.snapshotId}`);
  if (result.commentsLeftInPlace) console.log('comments: left in review target; run gpd feedback clean after confirming extraction');
  console.log(`next: ${result.next}`);
}

function printFeedbackClean(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`review target: ${result.reviewTarget}`);
  console.log(`comments removed: ${result.commentsRemoved}`);
  if (result.snapshotId) console.log(`snapshot: ${result.snapshotId}`);
  console.log(`next: ${result.next}`);
}

module.exports = {
  captureFeedback,
  cleanFeedbackComments,
  printFeedbackCapture,
  printFeedbackClean,
  reviewPack,
  printReviewPack,
  collectInlineFeedback,
  cleanInlineCommentsFromMarkdown,
  inlineCommentFromLine,
};
