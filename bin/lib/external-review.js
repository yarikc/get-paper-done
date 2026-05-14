'use strict';

const fs = require('fs');
const path = require('path');

const {
  expandHome,
  writeFile,
} = require('./common');
const {
  defaultMachineState,
  status,
  writeStateJson,
  writeStateMarkdown,
} = require('./state');

function reviewerSlug(value, fallback = 'external-reviewer') {
  return String(value || fallback)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function parseReviewFileSpec(spec) {
  const value = String(spec || '');
  const eq = value.indexOf('=');
  if (eq > 0) {
    return {
      reviewer: reviewerSlug(value.slice(0, eq)),
      file: value.slice(eq + 1),
    };
  }
  const file = value;
  const base = path.basename(file, path.extname(file));
  return {
    reviewer: reviewerSlug(base),
    file,
  };
}

function readReviewInputs(input = {}) {
  const reviews = [];
  const reviewFiles = input.reviewFiles || [];

  for (const spec of reviewFiles) {
    const parsed = parseReviewFileSpec(spec);
    const filePath = path.resolve(expandHome(parsed.file));
    if (!fs.existsSync(filePath)) throw new Error(`Review file not found: ${parsed.file}`);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    reviews.push({
      reviewer: parsed.reviewer,
      source: path.basename(filePath),
      content,
      status: content ? 'captured' : 'empty',
    });
  }

  if (input.stdin) {
    const content = fs.readFileSync(0, 'utf8').trim();
    reviews.push({
      reviewer: reviewerSlug(input.reviewer || 'stdin-reviewer'),
      source: 'stdin',
      content,
      status: content ? 'captured' : 'empty',
    });
  }

  return reviews;
}

function firstNonEmptyLine(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#')) || '';
}

function externalReviewsMarkdown({ reviews, paperDir, createdAt }) {
  const draftReviewed = fs.existsSync(path.join(paperDir, '.paper', 'DRAFT.md'))
    ? '.paper/DRAFT.md'
    : 'No DRAFT.md found';
  const reviewerList = reviews.length > 0
    ? reviews.map((review) => review.reviewer).join(', ')
    : 'none';
  const rawSections = reviews.length === 0
    ? '## No Captured Reviews\n\nNo external review input was provided to the CLI wrapper.\n'
    : reviews.map((review) => [
      `## ${review.reviewer} Review`,
      '',
      `**Source:** ${review.source}`,
      `**Status:** ${review.status}`,
      '',
      review.content || '[No review content captured.]',
      '',
      '---',
      '',
    ].join('\n')).join('\n');
  const captured = reviews.filter((review) => review.status === 'captured');
  const empty = reviews.filter((review) => review.status !== 'captured');

  return `# External Reviews

**Reviewed at:** ${createdAt}
**Reviewers:** ${reviewerList}
**Draft reviewed:** ${draftReviewed}

## Review Prompt Summary

External review text was collected by \`gpd review-external\` from provided files or stdin. This CLI wrapper records captured feedback and creates a pending feedback plan; it does not invoke external model providers yet.

---

${rawSections}
## Consensus Summary

### Shared Concerns

- Deterministic CLI collection cannot infer consensus. Review the captured feedback and update \`.paper/FEEDBACK-PLAN.md\` before revision.

### Shared Strengths

- Not synthesized by the CLI wrapper.

### Divergent Views

- Not synthesized by the CLI wrapper.

### High-Risk Items

- ${captured.length > 0 ? 'External feedback is captured but not yet approved for revision.' : 'No external feedback was captured.'}
- ${empty.length > 0 ? `${empty.length} reviewer input(s) were empty and should be checked before relying on the review set.` : 'No empty reviewer inputs recorded.'}
`;
}

function feedbackPlanMarkdown({ reviews, createdAt }) {
  const rows = reviews.length === 0
    ? '| 1 | No external review input was provided. | gpd review-external | Needs decision | Ask user | Provide review files/stdin or skip external feedback for this revision. | EXTERNAL-REVIEWS |\n'
    : reviews.map((review, index) => {
      const summary = firstNonEmptyLine(review.content) || '[No review content captured.]';
      const escaped = summary.replace(/\|/g, '\\|');
      return `| ${index + 1} | ${escaped} | ${review.reviewer} | Needs decision | Ask user | Review captured feedback and decide whether to incorporate, ignore, defer, or convert into a specific revision task. | DRAFT / BRIEF / RESEARCH / OUTLINE |`;
    }).join('\n');
  const incorporate = reviews.length > 0
    ? '- None automatically. External feedback requires user approval before revision.'
    : '- None.';
  const decisions = reviews.length > 0
    ? '- Decide which captured external feedback should become revision work.'
    : '- Decide whether to provide external review input or continue without it.';

  return `# Feedback Handling Plan

**Created:** ${createdAt}
**Based on:** \`.paper/EXTERNAL-REVIEWS.md\`
**Status:** Pending user approval

## Summary

\`gpd review-external\` captured external review input and stopped at the approval gate. No draft or upstream artifact has been changed.

## Proposed Handling

| # | Feedback | Source(s) | Assessment | Recommendation | Proposed Handling | Affected Artifact |
|---|----------|-----------|------------|----------------|-------------------|-------------------|
${rows}

## Incorporate

${incorporate}

## Ignore

- None automatically.

## Defer

- None automatically.

## User Decisions Needed

${decisions}

## Approval Gate

Before changing \`.paper/DRAFT.md\` or upstream artifacts, present this plan to the user and ask how to proceed.

Options:

- Approve all recommended handling
- Approve only incorporate items
- Discuss decisions first
- Revise the handling plan
- Ignore external feedback
`;
}

function updateFeedbackState(paperDir, dryRun) {
  const current = status({ paper: paperDir });
  const state = current.machineState || defaultMachineState({ strategyStatus: current.strategyStatus || 'Go' });
  const nextState = {
    ...state,
    status: 'Feedback Pending',
    current_stage: 'External Review',
    last_completed_stage: 'External Review',
    last_activity: new Date().toISOString(),
    suggested_next_command: '/gpd-progress',
    feedback: {
      ...(state.feedback || {}),
      feedback_plan_status: 'Pending user approval',
      approved_handling: '',
    },
  };
  writeStateMarkdown(paperDir, nextState, dryRun);
  writeStateJson(paperDir, nextState, dryRun);
  return nextState;
}

function reviewExternal(input = {}) {
  const paperState = status(input);
  const paperDir = paperState.paperDir;
  if (!paperState.artifacts['DRAFT.md']) {
    throw new Error('External review requires .paper/DRAFT.md.');
  }
  const createdAt = new Date().toISOString();
  const dryRun = Boolean(input.dryRun);
  const reviews = readReviewInputs(input);

  writeFile(
    path.join(paperDir, '.paper', 'EXTERNAL-REVIEWS.md'),
    externalReviewsMarkdown({ reviews, paperDir, createdAt }),
    dryRun,
  );
  writeFile(
    path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
    feedbackPlanMarkdown({ reviews, createdAt }),
    dryRun,
  );
  updateFeedbackState(paperDir, dryRun);

  return {
    paperDir,
    reviewsCaptured: reviews.filter((review) => review.status === 'captured').length,
    reviewsEmpty: reviews.filter((review) => review.status !== 'captured').length,
    externalReviewsPath: path.join(paperDir, '.paper', 'EXTERNAL-REVIEWS.md'),
    feedbackPlanPath: path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
    next: '/gpd-progress',
  };
}

function printExternalReviewResult(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`reviews captured: ${result.reviewsCaptured}`);
  console.log(`empty reviews: ${result.reviewsEmpty}`);
  console.log(`external reviews: ${result.externalReviewsPath}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`next: ${result.next}`);
}

module.exports = {
  reviewExternal,
  printExternalReviewResult,
};
