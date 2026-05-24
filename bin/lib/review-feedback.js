'use strict';

const fs = require('fs');
const path = require('path');

const {
  basenameLabel,
  displayPath,
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

function missingReviewTargetMessage(target) {
  return [
    `Review target is missing: .paper/${target.artifact}.`,
    'If the paper is still early, run gpd next to see the required upstream stage.',
    'If you expected a reading copy, run /gpd-export first; if you expected a draft, run /gpd-draft first.',
  ].join(' ');
}

function reviewPack(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const target = reviewTargetFromInput(paperDir, input);
  if (!fs.existsSync(target.path)) throw new Error(missingReviewTargetMessage(target));

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
    captureCommand: 'gpd feedback',
    alternateCaptureCommand: `gpd feedback --paper ${paperDir}`,
    next: 'Review the target file, add comments, then run gpd feedback from the paper directory.',
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
  const closeMatch = remaining.match(/(?<!:)\/\/(?=[\s.,;:!?)]|$)/);
  return closeMatch ? afterMarkerStart + closeMatch.index : -1;
}

function inlineCommentFromLine(line, startIndex = 0) {
  const searchable = line.slice(startIndex);
  const match = markerRegex().exec(searchable);
  if (!match) return null;
  const markerStart = startIndex + match.index;
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

function inlineCommentsFromLine(line) {
  const comments = [];
  let current = line;
  let guard = 0;
  while (guard < 50) {
    const parsed = inlineCommentFromLine(current);
    if (!parsed) break;
    comments.push(parsed);
    current = parsed.cleanLine;
    guard += 1;
  }
  return comments;
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
    let current = line;
    let changed = false;
    let guard = 0;
    while (guard < 50) {
      const parsed = inlineCommentFromLine(current);
      if (!parsed) break;
      current = parsed.cleanLine;
      removed += 1;
      changed = true;
      guard += 1;
    }
    if (!changed) return line;
    return current.trim() ? current : null;
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
    const parsedItems = inlineCommentsFromLine(line);
    if (parsedItems.length === 0) return;
    const context = nearestContext(lines, index);
    parsedItems.forEach((parsed) => {
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
  if (/tone|voice|sounds|style/.test(value)) return 'Voice';
  if (/generic|ai generated|fluff|weak|not convincing|disappointing|dissapointing|story|journey/.test(value)) return 'Audience fit';
  if (/audience|reader|executive|engineer|architect|stakeholder/.test(value)) return 'Audience fit';
  if (/evidence|source|fact|support|proof|standard|citation/.test(value)) return 'Evidence';
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

function blockQuote(value) {
  return String(value || '-')
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n');
}

function commentTitle(comment, index) {
  const clean = markdownEscape(comment.feedback).replace(/\s+/g, ' ');
  const clipped = clean.length > 96 ? `${clean.slice(0, 93)}...` : clean;
  return clipped || `Reader comment ${index + 1}`;
}

function initialAssessmentForComment(comment) {
  if (comment.kind === 'keep') return 'Agree as a preservation constraint. The revision must protect the marked wording, specificity, or argument unless the user overrides it.';
  if (comment.kind === 'qq') return 'Needs clarification before revision. Answer the question first; then decide whether the paper, research, or no artifact needs to change.';
  if (comment.kind === 'no') return 'Agree that this is an explicit reader rejection. Treat it as a likely rewrite/remove candidate unless the paper evidence proves the rejected framing is necessary.';

  const value = comment.feedback.toLowerCase();
  if (/generic|ai generated|fluff|weak|not convincing|disappointing|dissapointing|no sense of substance|poorly written/.test(value)) {
    return 'Agree. This is below-target reader friction about voice, substance, argument quality, or audience fit. It should trigger a substantive rewrite, not a line edit.';
  }
  if (/unclear|what do you mean|what is|what does|why|so what|makes no sense|confusing/.test(value)) {
    return 'Agree that the reader is missing a necessary explanation. The revision should answer the implied question in the paper, not merely polish the sentence.';
  }
  if (/evidence|research|source|support|standard|requirement|obligation/.test(value)) {
    return 'Likely valid evidence concern. Check the research and source interpretation before changing the claim.';
  }
  return 'Needs interpretation in the feedback review loop. Do not apply mechanically; decide whether it improves the paper purpose, audience fit, evidence, or ask clarity.';
}

function clarificationForComment(comment) {
  if (comment.kind === 'qq') return 'Answer the reader question. If the answer changes the paper, revise; if the paper already answers it clearly, record answered_no_action.';
  const value = comment.feedback.toLowerCase();
  if (/we had a lot more|more here|missing/.test(value)) return 'Clarify what content or argument is missing before rewriting.';
  if (/why|what do you mean|unclear|confusing|so what|makes no sense/.test(value)) return 'Clarify the concept, causal link, or reader decision implication.';
  if (/generic|ai generated|fluff|weak|not convincing/.test(value)) return 'Clarify the intended story spine before editing prose.';
  return 'No extra clarification required unless the user disagrees with the proposed handling.';
}

function readerFeedbackMarkdown({ comments, createdAt, targetArtifact }) {
  const rows = comments.map((comment, index) => (
    `| ${index + 1} | ${markdownEscape(comment.feedback)} | ${inferSignal(comment.feedback)} | ${comment.severity || inferSeverity(comment.feedback)} | Ask user | ${markdownEscape(comment.artifact)}:${comment.line} |`
  )).join('\n');
  const items = comments.map((comment, index) => [
    `### ${index + 1}. ${comment.type || 'Concern'}: ${commentTitle(comment, index)}`,
    '',
    `- **Location:** ${markdownEscape(comment.artifact)}:${comment.line}`,
    `- **Signal:** ${inferSignal(comment.feedback)}`,
    `- **Severity:** ${comment.severity || inferSeverity(comment.feedback)}`,
    `- **Initial interpretation:** ${initialAssessmentForComment(comment)}`,
    `- **Clarification needed:** ${clarificationForComment(comment)}`,
    '- **Reader comment:**',
    blockQuote(comment.feedback),
    '- **Anchor text:**',
    blockQuote(comment.context),
    '',
  ].join('\n')).join('\n');
  const questions = comments.map((comment, index) => (
    `- Item ${index + 1}: decide whether the interpretation of ${comment.artifact}:${comment.line} is right, wrong, or needs more author clarification.`
  )).join('\n');

  return `# Reader Feedback

**Created:** ${createdAt}
**Source:** inline user comments
**Draft reviewed:** ${targetArtifact}
**Status:** Captured

## Source

- **Reviewer:** User
- **Context:** Comments captured from the current review target by \`gpd feedback\`.
- **Scope:** whole paper or commented sections

## Five-Signal Scorecard

| Signal | Score | Evidence | Actionable Feedback |
|--------|-------|----------|---------------------|
| Voice | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Register | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Audience fit | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Evidence | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |
| Ask clarity | Not scored | Inline comments captured; not scored automatically. | Review item-level feedback before revision. |

## Captured Comments

${items}

## Feedback Items

This compact table is retained for validation, search, and tooling. Use \`## Captured Comments\` for human review.

| # | Feedback | Signal | Severity | Recommended Handling | Affected Artifact |
|---|----------|--------|----------|----------------------|-------------------|
${rows}

## Questions

${questions}

## Suggested Handling

- **Incorporate:** None automatically. Inline comments require approval through \`.paper/FEEDBACK-PLAN.md\`.
- **Ignore:** None automatically.
- **Defer:** None automatically.
- **Ask user:** Review GPD's interpretation of each captured comment before deciding what becomes revision work.

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

function feedbackPlanMarkdown({ comments, createdAt, input = {} }) {
  if (shouldUseAggregateFeedbackPlan(comments, input)) {
    return aggregateFeedbackPlanMarkdown({ comments, createdAt });
  }

  const sections = comments.map((comment, index) => [
    `### ${index + 1}. ${comment.type || 'Concern'}: ${commentTitle(comment, index)}`,
    '',
    `- **Type:** ${comment.type || 'Concern'}`,
    `- **Severity:** ${comment.severity || inferSeverity(comment.feedback)}`,
    `- **Source(s):** ${markdownEscape(comment.artifact)}:${comment.line}`,
    `- **Suggested handling:** ${recommendationForComment(comment)}`,
    `- **Initial assessment:** ${initialAssessmentForComment(comment)}`,
    `- **Clarification needed:** ${clarificationForComment(comment)}`,
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

\`gpd feedback\` captured inline review comments, grouped them into the concern-first decision queue below, and stopped at the approval gate. No draft or upstream artifact has been changed.

## Decision View

Review concerns ${itemList}. Use \`approve\`, \`modify\`, \`defer\`, or \`reject\` for each concern.

| # | Concern | Type | Severity | Suggested handling | User Decision |
|---|---------|------|----------|----------------|---------------|
${comments.map((comment, index) => `| ${index + 1} | ${markdownEscape(commentTitle(comment, index))} | ${comment.type || 'Concern'} | ${comment.severity || inferSeverity(comment.feedback)} | ${recommendationForComment(comment)} | pending |`).join('\n')}

These comments came from the reading copy, so they represent actual reader friction rather than speculative reviewer advice. The next draft should be easier to understand and more aligned with the reader's decision needs.

## Proposed Handling

${sections}

## Below-Target Items

| # | Issue | Target Bar Impact | Suggested handling | Reason |
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

const AGGREGATE_FEEDBACK_THRESHOLD = 8;

function shouldUseAggregateFeedbackPlan(comments, input = {}) {
  if (input.feedbackMode === 'aggregate') return true;
  if (input.feedbackMode === 'itemized') return false;
  return comments.length > AGGREGATE_FEEDBACK_THRESHOLD;
}

function aggregateThemeDefinitions() {
  return [
    {
      id: 'opening',
      title: 'Opening, thesis, and executive flow',
      match: /opening|summary|executive|ask|decision|thesis|lead|intro|first paragraph|hook|flow|story|spine/i,
      assessment: 'Likely valid. Comments in this theme usually mean the paper is asking the reader to work too hard before the thesis, ask, or story spine is clear.',
      handling: 'Revise the opening path before local line edits: clarify the paper job, state the thesis or ask earlier, remove avoidable detours, and make the first section carry the argument rather than summarize background.',
      improves: 'The reader should understand what the paper wants them to decide, believe, or rethink before they reach the supporting detail.',
      risk: 'If handled mechanically, the revision can polish sentences while leaving the argument spine weak.',
      edits: [
        'Rewrite the opening around the paper job and main claim.',
        'Move the ask, thesis, or decision implication earlier if it is currently delayed.',
        'Remove repeated setup language that does not help the reader understand the point.',
        'Check that the executive summary reads as a coherent argument, not meeting notes.',
      ],
    },
    {
      id: 'audience-context',
      title: 'Audience context and reader assumptions',
      match: /audience|reader|executive|leader|stakeholder|context|prior|assume|why received|who is this for|background|working group|organization|institution|internal|public/i,
      assessment: 'Likely valid. Comments in this theme indicate the paper assumes context the reader may not have.',
      handling: 'Add only the context needed for the intended audience to understand why the paper exists, why they are receiving it, and what decision or interpretation is expected.',
      improves: 'The paper becomes readable outside the author’s prior conversation without expanding into a white paper.',
      risk: 'Too much background can dilute the ask and make the paper feel slow.',
      edits: [
        'State the intended audience and paper purpose more plainly where needed.',
        'Add short bridging context for terms or decisions that depend on prior work.',
        'Remove assumptions that only a working-group participant would understand.',
      ],
    },
    {
      id: 'regulatory-evidence',
      title: 'Evidence, sources, standards, and claim support',
      match: /evidence|source|reference|citation|standard|support|prove|proof|fact|research|requirement|obligation|regulator|authority|credible|cite|satisfy|expects|expected/i,
      assessment: 'Likely valid. Comments in this theme should be checked against research before drafting, because they may expose unsupported claims or weak source use.',
      handling: 'Validate the claim-source relationship, explain why the source matters when needed, and rewrite claims so the paper uses evidence as support rather than decoration.',
      improves: 'The paper becomes more defensible and easier to trust without overclaiming what a source proves.',
      risk: 'Over-tightening can turn the prose into a citation dump or imply regulatory certainty the evidence does not support.',
      edits: [
        'Check whether each challenged claim is supported by the cited research.',
        'Add a short explanation of why important standards or sources are contextually relevant.',
        'Soften or remove claims that the evidence does not support.',
        'Use references in a style appropriate to the paper type and reader.',
      ],
    },
    {
      id: 'mechanism-ownership',
      title: 'Mechanism, ownership, and operating model',
      match: /how it works|mechanism|owner|owns|ownership|accountable|responsible|role|team|operating model|process|governance|control|exception|guardrail|handoff/i,
      assessment: 'Likely valid. These comments usually mean the paper states a direction but does not make the operating mechanism, owner, or decision flow concrete enough.',
      handling: 'Clarify who owns what, how the mechanism works, where decisions flow, and what evidence or controls make the recommendation operational.',
      improves: 'The paper becomes actionable instead of merely persuasive.',
      risk: 'Adding too much operating detail can overload a memo or strategy paper.',
      edits: [
        'Name the accountable owner or decision role where the paper implies one.',
        'Explain the mechanism in concrete terms rather than abstract labels.',
        'Separate ownership from collaboration so the paper does not sound dictatorial or vague.',
      ],
    },
    {
      id: 'structure-sequencing',
      title: 'Structure, sequencing, and section logic',
      match: /section|move|earlier|later|order|sequence|repeated|repeat|layout|list|table|numbered|transition|sprawl/i,
      assessment: 'Likely valid. These comments indicate the paper may have the right content in the wrong order or form.',
      handling: 'Fix sequencing before line edits: move prerequisite context earlier, split overloaded paragraphs, convert repeated structures into lists or tables, and remove internal process leakage.',
      improves: 'The reader can follow the argument without carrying unresolved context across sections.',
      risk: 'Reordering without preserving the argument spine can create a polished but weaker draft.',
      edits: [
        'Move prerequisite context before the claim that depends on it.',
        'Use a list or table when repeated prose hides a structured comparison.',
        'Remove drafting-process residue from the reader-facing paper.',
      ],
    },
    {
      id: 'voice-clarity',
      title: 'Voice, wording, and local clarity',
      match: /sentence|sentense|wording|phrase|term|define|definition|jargon|acronym|vague|abstract|generic|fluff|tone|voice|style|cumbersome|combersome|awkward|unclear|confusing/i,
      assessment: 'Likely valid. These comments identify local prose that blocks comprehension, weakens voice, or sounds generic.',
      handling: 'Apply local rewrites after structural decisions are settled. Define load-bearing terms, replace vague language with concrete wording, and preserve strong author voice.',
      improves: 'The paper becomes sharper and less generic without changing the approved strategy.',
      risk: 'Line editing too early can hide unresolved thesis, audience, evidence, or structure problems.',
      edits: [
        'Define terms that readers cannot infer safely.',
        'Replace vague or generic phrases with specific claims.',
        'Use local line edits only after upstream issues are resolved.',
      ],
    },
    {
      id: 'scope-risk',
      title: 'Scope, constraints, and risk boundaries',
      match: /scope|too much|too broad|overclaim|overstate|risk|boundary|constraint|caveat|qualification|incremental|gradual|overnight|transition|can or must|can or will|must\?/i,
      assessment: 'Likely valid. These comments usually mean the paper risks sounding too certain, too broad, or insufficiently bounded.',
      handling: 'Add bounded language, options, transition framing, or explicit assumptions without diluting the main claim.',
      improves: 'The paper remains ambitious but defensible.',
      risk: 'Excessive caveats can make the paper sound unwilling to take a position.',
      edits: [
        'Make assumptions and boundaries explicit.',
        'Add incremental or transition language where the change cannot happen all at once.',
        'Preserve the recommendation while qualifying what is not yet proven.',
      ],
    },
    {
      id: 'measures',
      title: 'Outcomes, measures, and validation',
      match: /measure|metric|outcome|success|validated|validation|baseline|kpi|score|impact|benefit|result/i,
      assessment: 'Likely valid. These comments indicate the paper may need a clearer way to judge whether the recommendation works.',
      handling: 'Frame measures as an initial validation set unless the paper already has direct evidence and baselines.',
      improves: 'The recommendation becomes testable without pretending all metrics are final.',
      risk: 'Weak metrics can create false precision or distract from the decision.',
      edits: [
        'State how success will be measured or validated.',
        'Distinguish candidate measures from proven KPIs.',
      ],
    },
  ];
}

function themeForComment(comment) {
  if (comment.kind === 'keep') {
    return {
      id: 'preservation',
      title: 'Preservation constraints',
      assessment: 'Valid as a user constraint. These comments identify wording, specificity, argument, or voice the revision must not accidentally erase.',
      handling: 'Carry the preservation constraint into revision and verify after editing that the marked value remains intact.',
      improves: 'The revision can improve weak parts without losing language or concepts the user intentionally protected.',
      risk: 'Ignoring preservation comments can recreate the catastrophic regression pattern where a stronger draft becomes generic.',
      edits: ['Preserve the marked language, concept, specificity, or voice unless the user explicitly overrides it.'],
    };
  }
  if (comment.kind === 'qq') {
    return {
      id: 'questions',
      title: 'Open questions and clarification points',
      assessment: 'Valid as a clarification queue. These questions should be answered before deciding whether they require revision.',
      handling: 'Answer each question, then classify the outcome as revise, research, fact-check, defer, or answered_no_action.',
      improves: 'The paper avoids revising blindly when the right action may be an answer rather than a text change.',
      risk: 'Treating questions as automatic edits can introduce unnecessary scope or distort the author intent.',
      edits: ['Answer the question before deciding whether the paper changes.'],
    };
  }
  if (comment.kind === 'no') {
    return {
      id: 'rejections',
      title: 'Rejected framing or claims',
      assessment: 'Valid as a rejection signal. The paper should not preserve a framing the reader explicitly rejected without a reasoned decision.',
      handling: 'Decide whether to remove, rewrite, or defend the rejected claim with stronger evidence.',
      improves: 'The paper does not carry known disagreement into the next revision by accident.',
      risk: 'Accepting every rejection mechanically can weaken necessary claims.',
      edits: ['Resolve the rejected claim or framing explicitly.'],
    };
  }
  const text = comment.feedback || '';
  const definitions = aggregateThemeDefinitions();
  return definitions.find((theme) => theme.match.test(text)) || {
    id: 'misc',
    title: 'Voice, wording, and local readability fixes',
    assessment: 'Mostly agree. These comments are local readability signals and should be handled only where they improve the paper without changing the approved direction.',
    handling: 'Apply as local edits after the structural themes are resolved.',
    improves: 'The draft becomes cleaner without creating unnecessary decision overhead.',
    risk: 'Mechanical edits could distract from more important structural fixes.',
    edits: ['Apply only if the edit improves clarity, voice, evidence use, or ask quality.'],
  };
}

function aggregateComments(comments) {
  const grouped = new Map();
  for (const comment of comments) {
    const theme = themeForComment(comment);
    if (!grouped.has(theme.id)) {
      grouped.set(theme.id, {
        ...theme,
        comments: [],
        severity: 'MEDIUM',
      });
    }
    const item = grouped.get(theme.id);
    item.comments.push(comment);
    if ((comment.severity || inferSeverity(comment.feedback)) === 'HIGH') item.severity = 'HIGH';
  }
  const themes = Array.from(grouped.values()).filter((theme) => theme.comments.length > 0);
  return compactAggregateThemes(themes, comments.length);
}

function compactAggregateThemes(themes, commentCount) {
  if (commentCount <= 20 || themes.length <= 8) return themes;

  const major = themes.filter((theme) => theme.severity === 'HIGH' || theme.comments.length >= 3);
  const minor = themes.filter((theme) => !major.includes(theme));
  if (minor.length <= 1) return themes;

  const combined = {
    id: 'local-fixes-clarifications',
    title: 'Local fixes, evidence checks, and clarifications',
    assessment: 'Mostly valid. These smaller themes should be handled after the major structural themes so they do not fragment the user decision loop.',
    handling: 'Treat these as a bundled cleanup pass: answer open questions, verify challenged claims, preserve useful wording constraints, and apply local clarity edits only where they support the approved revision direction.',
    improves: 'The user can decide the main revision direction without losing the smaller comments.',
    risk: 'Bundling can hide a serious local issue, so revision must still check every raw comment in FEEDBACK-READER.md.',
    edits: [
      'Answer open questions before editing.',
      'Verify any challenged source or evidence claim.',
      'Apply local wording fixes after major structure and audience changes.',
      'Use FEEDBACK-READER.md as the raw checklist during revision.',
    ],
    comments: minor.flatMap((theme) => theme.comments),
    severity: minor.some((theme) => theme.severity === 'HIGH') ? 'HIGH' : 'MEDIUM',
  };

  return [...major, combined];
}

function aggregateFeedbackPlanMarkdown({ comments, createdAt }) {
  const themes = aggregateComments(comments);
  const sections = themes.map((theme, index) => {
    const sources = theme.comments.map((comment) => `${comment.artifact}:${comment.line}`).join(', ');
    const evidence = theme.comments.slice(0, 8).map((comment) => `  - ${markdownEscape(comment.feedback)}`);
    const edits = theme.edits.map((edit, editIndex) => `  ${editIndex + 1}. ${edit}`);
    return [
      `### ${index + 1}. Theme: ${theme.title}`,
      '',
      '- **Type:** Theme',
      `- **Severity:** ${theme.severity}`,
      `- **Source(s):** ${sources}`,
      '- **Suggested handling:** modify',
      `- **Initial assessment:** ${theme.assessment}`,
      '- **Clarification needed:** No extra clarification required unless the user disagrees with the proposed handling.',
      '- **Why this matters:** These comments repeat across multiple locations, so they indicate a pattern of reader friction rather than isolated copy edits.',
      `- **What improves if addressed:** ${theme.improves}`,
      `- **Risk if handled badly:** ${theme.risk}`,
      `- **Proposed handling:** ${theme.handling}`,
      '- **Proposed edits:**',
      edits.join('\n'),
      '- **Reviewer evidence:**',
      evidence.join('\n'),
      '- **Affected artifacts:** DRAFT / OUTLINE / FACT-CHECK / REVIEW',
      '- **User Decision:** pending',
      '- **User Constraint:** none yet',
      '',
    ].join('\n');
  }).join('\n');

  return `# Feedback Handling Plan

**Created:** ${createdAt}
**Based on:** \`.paper/FEEDBACK-READER.md\`
**Status:** Pending user approval
**Mode:** Aggregate theme review
**Raw comments captured:** ${comments.length}
**Theme count:** ${themes.length}

## Summary

\`gpd feedback\` captured ${comments.length} inline reader comments. Because the count is above ${AGGREGATE_FEEDBACK_THRESHOLD}, GPD grouped them into theme-level decisions instead of making the user approve every comment one by one. Raw comments remain in \`.paper/FEEDBACK-READER.md\` and the preserved commented review copy.

No draft or upstream artifact has been changed.

## Decision View

Review the themes below, not the ${comments.length} raw comments. Use \`approve\`, \`modify\`, \`defer\`, or \`reject\` for each theme.

| # | Theme | Severity | Suggested handling | User Decision | Raw comments |
|---|-------|----------|----------------|---------------|--------------|
${themes.map((theme, index) => `| ${index + 1} | ${markdownEscape(theme.title)} | ${theme.severity} | modify | pending | ${theme.comments.length} |`).join('\n')}

## Pushback And Cautions

- Do not mechanically apply every inline comment as a sentence edit.
- Treat repeated comments as structural signals.
- Preserve the approved thesis, G-SIB scope, operating-layer mandate, and medium-strength ask unless the user explicitly changes direction.
- Keep raw comments available as evidence, but make the decision at theme level.

## Proposed Handling

${sections}

## Below-Target Items

| # | Issue | Target Bar Impact | Suggested handling | Reason |
|---|-------|-------------------|----------------|--------|
${themes.map((theme, index) => `| ${index + 1} | ${markdownEscape(theme.title)} | ${theme.severity === 'HIGH' ? 'HIGH' : 'MEDIUM'} impact on reader comprehension and decision usefulness. | modify | Pattern appears in ${theme.comments.length} captured comment(s). |`).join('\n')}

## Approved Or Modified

- Only themes with \`User Decision: approve\` or \`modify\`.

## Rejected

- None automatically.

## Deferred

- Use \`User Decision: defer\` for themes that should not affect this revision.

## User Decisions Needed

- Approve, modify, defer, or reject each theme.

## Approval Gate

Before changing \`.paper/DRAFT.md\` or upstream artifacts, present this theme plan to the user and ask how to proceed.
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
  if (!fs.existsSync(target.path)) throw new Error(missingReviewTargetMessage(target));

  const comments = collectInlineFeedback(paperDir, input);
  if (comments.length === 0) {
    return {
      paperDir,
      reviewTarget: target.path,
      commentsCaptured: 0,
      readerFeedbackPath: path.join(paperDir, '.paper', 'FEEDBACK-READER.md'),
      feedbackPlanPath: path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
      next: 'Add inline comments to the review target, then run gpd feedback again.',
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
    feedbackPlanMarkdown({ comments, createdAt, input }),
    preservedPriorMarkdown('Prior Feedback Plan', previousFeedbackPlan),
  ].filter(Boolean).join('\n\n');
  const feedbackMode = shouldUseAggregateFeedbackPlan(comments, input) ? 'aggregate' : 'itemized';

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
    feedbackMode,
    commentsLeftInPlace: true,
    next: '/gpd-feedback',
  };
}

function cleanFeedbackComments(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const target = reviewTargetFromInput(paperDir, input);
  if (!fs.existsSync(target.path)) throw new Error(missingReviewTargetMessage(target));
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
  console.log('Review pack');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Review target: ${displayPath(result.paperDir, result.reviewTarget)}`);
  console.log(`Review artifact: ${result.reviewArtifact}`);
  console.log(`Editable source: ${result.editableSource}`);
  console.log(`Why: ${result.reason}`);
  console.log('');
  console.log('Comment syntax:');
  for (const syntax of result.commentSyntax) console.log(`- ${syntax}`);
  console.log('');
  console.log(`Capture: ${result.captureCommand}`);
  if (result.alternateCaptureCommand) console.log(`Capture from elsewhere: ${result.alternateCaptureCommand}`);
  console.log(`Next: ${result.next}`);
}

function printFeedbackCapture(result) {
  console.log('Feedback captured');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Reviewed file: ${displayPath(result.paperDir, result.reviewTarget)}`);
  console.log(`Comments found: ${result.commentsCaptured}`);
  console.log(`Reader feedback: ${displayPath(result.paperDir, result.readerFeedbackPath)}`);
  console.log(`Feedback plan: ${displayPath(result.paperDir, result.feedbackPlanPath)}`);
  if (result.commentedReviewPath) console.log(`Preserved copy: ${displayPath(result.paperDir, result.commentedReviewPath)}`);
  if (result.snapshotId) console.log(`Snapshot: ${result.snapshotId}`);
  if (result.feedbackMode) console.log(`Plan mode: ${result.feedbackMode}`);
  if (result.commentsCaptured === 0) {
    console.log('');
    console.log('No comments found. Add //todo:, //keep:, //qq:, or //no: comments to the reviewed file, then run gpd feedback again.');
  }
  if (result.commentsCaptured > 0) {
    console.log('');
    console.log('Interpretation: FEEDBACK-READER.md captures the raw comments; FEEDBACK-PLAN.md groups them for decision.');
    if (result.feedbackMode === 'aggregate') {
      console.log('Suggested handling: Review a small set of theme-level decisions instead of every raw comment.');
    } else {
      console.log('Suggested handling: Review each concern with its proposed action before revision.');
    }
    if (result.commentsLeftInPlace) console.log('Comments: left in reviewed file until you explicitly clean them.');
    console.log('No draft changes were made.');
  }
  console.log(`Next: ${result.next}`);
}

function printFeedbackClean(result) {
  console.log('Feedback comments cleaned');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Reviewed file: ${displayPath(result.paperDir, result.reviewTarget)}`);
  console.log(`Comments removed: ${result.commentsRemoved}`);
  if (result.snapshotId) console.log(`Snapshot: ${result.snapshotId}`);
  console.log(`Next: ${result.next}`);
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
