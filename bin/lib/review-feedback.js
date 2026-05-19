'use strict';

const fs = require('fs');
const path = require('path');

const {
  writeFile,
} = require('./common');
const {
  findPaperDir,
  status,
  writeStateJson,
  writeStateMarkdown,
} = require('./state');

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
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

function reviewPack(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const target = reviewTarget(paperDir);
  if (!fs.existsSync(target.path)) throw new Error(`Review target is missing: .paper/${target.artifact}`);

  return {
    paperDir,
    reviewTarget: target.path,
    reviewArtifact: `.paper/${target.artifact}`,
    editableSource: target.editableSource,
    reason: target.reason,
    commentSyntax: [
      '// comment text',
      '//USER comment text',
      '<!-- comment text -->',
      `${target.path}.feedback`,
    ],
    captureCommand: `gpd feedback --paper ${paperDir}`,
    next: 'Review the target file, add comments, then run gpd feedback.',
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

function stripCommentPrefix(value) {
  return value
    .replace(/^\/\//, '')
    .replace(/^\s*(USER|GPD|feedback)\b\s*:?\s*/i, '')
    .replace(/^<!--\s*/, '')
    .replace(/\s*-->$/, '')
    .trim();
}

function inlineCommentFromLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) {
    const comment = stripCommentPrefix(trimmed);
    return comment ? { comment, anchor: '' } : null;
  }

  const htmlStart = line.indexOf('<!--');
  const htmlEnd = line.indexOf('-->', htmlStart + 4);
  if (htmlStart >= 0 && htmlEnd > htmlStart) {
    const raw = line.slice(htmlStart, htmlEnd + 3);
    const comment = stripCommentPrefix(raw);
    const anchor = line.slice(0, htmlStart).trim();
    return comment ? { comment, anchor } : null;
  }

  const slashIndex = line.indexOf('//');
  if (slashIndex <= 0) return null;
  if (line.includes('://')) return null;
  const before = line[slashIndex - 1];
  if (before && !/\s/.test(before)) return null;
  const comment = stripCommentPrefix(line.slice(slashIndex));
  const anchor = line.slice(0, slashIndex).trim();
  return comment ? { comment, anchor } : null;
}

function commentsFromMarkdown(content, artifact) {
  const lines = content.split(/\r?\n/);
  const comments = [];
  lines.forEach((line, index) => {
    const parsed = inlineCommentFromLine(line);
    if (!parsed) return;
    const context = nearestContext(lines, index);
    comments.push({
      artifact,
      line: index + 1,
      feedback: parsed.comment,
      context: parsed.anchor || context.previousText || context.heading || artifact,
      heading: context.heading,
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
    }))
    .filter((item) => item.feedback);
}

function collectInlineFeedback(paperDir) {
  const target = reviewTarget(paperDir);
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
    `| ${index + 1} | ${markdownEscape(comment.feedback)} | ${inferSignal(comment.feedback)} | ${inferSeverity(comment.feedback)} | Ask user | ${markdownEscape(comment.artifact)}:${comment.line} |`
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

## Feedback Items

| # | Feedback | Signal | Severity | Recommended Handling | Affected Artifact |
|---|----------|--------|----------|----------------------|-------------------|
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

function feedbackPlanMarkdown({ comments, createdAt }) {
  const sections = comments.map((comment, index) => [
    `### ${index + 1}. Concern: Reader comment ${index + 1}`,
    '',
    '- **Type:** Concern',
    '- **Severity:** MEDIUM',
    `- **Source(s):** ${markdownEscape(comment.artifact)}:${comment.line}`,
    '- **Recommendation:** modify',
    '- **Why this matters:** This is direct reader friction on the exported paper, so it may reveal ambiguity the workflow missed.',
    '- **What improves if addressed:** The revised paper should better match the reader need that triggered the inline comment.',
    '- **Risk if handled badly:** Applying the comment mechanically can expand scope, weaken the paper purpose, or conflict with approved author intent.',
    '- **Proposed handling:** Discuss the comment, then incorporate it if it clarifies intent, evidence, audience fit, or ask quality without expanding scope.',
    '- **Proposed edits:**',
    `  1. Address reader comment: ${markdownEscape(comment.feedback)}`,
    '- **Reviewer evidence:**',
    `  - ${markdownEscape(comment.feedback)}`,
    '- **Affected artifacts:** DRAFT / BRIEF / RESEARCH / OUTLINE',
    '- **User Decision:** pending',
    '- **User Constraint:** none yet',
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

| # | Concern | Type | Severity | Recommendation | User Decision |
|---|---------|------|----------|----------------|---------------|
${comments.map((_, index) => `| ${index + 1} | Reader comment ${index + 1} | Concern | MEDIUM | modify | pending |`).join('\n')}

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

function captureFeedback(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const target = reviewTarget(paperDir);
  if (!fs.existsSync(target.path)) throw new Error(`Review target is missing: .paper/${target.artifact}`);

  const comments = collectInlineFeedback(paperDir);
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
  const previousReaderFeedback = readIfExists(readerFeedbackPath);
  const previousFeedbackPlan = readIfExists(feedbackPlanPath);
  const readerFeedback = [
    readerFeedbackMarkdown({ comments, createdAt, targetArtifact: `.paper/${target.artifact}` }),
    previousReaderFeedback ? ['---', '', '## Prior Reader Feedback', '', previousReaderFeedback].join('\n') : '',
  ].filter(Boolean).join('\n\n');
  const feedbackPlan = [
    feedbackPlanMarkdown({ comments, createdAt }),
    previousFeedbackPlan ? ['---', '', '## Prior Feedback Plan', '', previousFeedbackPlan].join('\n') : '',
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
  console.log(`next: ${result.next}`);
}

module.exports = {
  captureFeedback,
  printFeedbackCapture,
  reviewPack,
  printReviewPack,
  collectInlineFeedback,
};
