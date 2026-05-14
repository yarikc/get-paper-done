'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

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

const providerCommands = {
  gemini: { command: 'gemini', args: ['-p', '-'] },
  claude: { command: 'claude', args: ['-p', '-'] },
  codex: { command: 'codex', args: ['exec', '--skip-git-repo-check', '-'] },
  opencode: { command: 'opencode', args: ['run', '-'] },
  qwen: { command: 'qwen', args: ['-'] },
  cursor: { command: 'cursor', args: ['agent', '-p', '--mode', 'ask', '--trust'] },
};

function reviewerSlug(value, fallback = 'external-reviewer') {
  return String(value || fallback)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function parseModels(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => reviewerSlug(item))
    .filter(Boolean);
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

function executablePath(command, envPath = process.env.PATH || '') {
  const pathExt = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const dir of envPath.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of pathExt) {
      const candidate = path.join(dir, `${command}${ext}`);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch (err) {
        // Continue searching PATH.
      }
    }
  }
  return null;
}

function readPaperArtifact(paperDir, name) {
  const filePath = path.join(paperDir, '.paper', name);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8').trim();
  return content || '[Empty artifact]';
}

function promptSection(paperDir, title, artifactNames) {
  for (const artifactName of artifactNames) {
    const content = readPaperArtifact(paperDir, artifactName);
    if (content) return `## ${title}\n\n${content}`;
  }
  return `## ${title}\n\n[Not present]`;
}

function buildExternalReviewPrompt(paperDir) {
  return [
    '# External Paper Review Request',
    '',
    'You are reviewing a serious paper draft. Provide direct, skeptical, useful feedback.',
    '',
    promptSection(paperDir, 'Project', ['PROJECT.md']),
    promptSection(paperDir, 'Persona', ['PERSONA.md']),
    promptSection(paperDir, 'Audience', ['AUDIENCE.md']),
    promptSection(paperDir, 'Brief', ['BRIEF.md']),
    promptSection(paperDir, 'Research', ['RESEARCH.json', 'RESEARCH.md']),
    promptSection(paperDir, 'Outline', ['OUTLINE.md']),
    promptSection(paperDir, 'Draft', ['DRAFT.md']),
    promptSection(paperDir, 'Fact Check', ['FACT-CHECK.md']),
    promptSection(paperDir, 'Local Review', ['REVIEW.md']),
    '## Review Instructions',
    '',
    'Review the draft for:',
    '',
    '1. Thesis clarity',
    '2. Argument quality',
    '3. Evidence strength and unsupported claims',
    '4. Counterarguments and trade-offs',
    '5. Audience fit',
    '6. Persona consistency',
    '7. Technical credibility',
    '8. Mechanism quality',
    '9. Decision usefulness',
    '10. Style, structure, and concision',
    '',
    'Return markdown with:',
    '',
    '- Summary',
    '- Highest-priority concerns, with severity HIGH/MEDIUM/LOW',
    '- Specific suggested changes',
    '- Feedback you would ignore or treat cautiously',
    '- Questions the author must answer before revision',
    '',
  ].join('\n');
}

function writeTempPrompt(prompt, dryRun) {
  if (dryRun) return null;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpd-review-'));
  const promptPath = path.join(tempDir, 'prompt.md');
  fs.writeFileSync(promptPath, prompt);
  return { tempDir, promptPath };
}

function providerFailureReview(reviewer, source, content, status = 'failed') {
  return {
    reviewer,
    source,
    content,
    status,
  };
}

function invokeProvider(model, prompt, input = {}) {
  const config = providerCommands[model];
  if (!config) {
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Provider "${model}" is not supported by this CLI slice. Supported providers: ${Object.keys(providerCommands).join(', ')}.`,
      'unsupported',
    );
  }

  const found = executablePath(config.command);
  if (!found) {
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Provider CLI "${config.command}" was not found on PATH.`,
      'missing',
    );
  }

  if (input.dryRun) {
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Dry run: would invoke "${config.command} ${config.args.join(' ')}".`,
      'planned',
    );
  }

  const timeoutMs = input.timeoutMs || 120000;
  const result = spawnSync(found, config.args, {
    input: prompt,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: timeoutMs,
  });

  if (result.error) {
    const timedOut = result.error.code === 'ETIMEDOUT';
    return providerFailureReview(
      model,
      `provider:${model}`,
      timedOut
        ? `Provider CLI "${config.command}" timed out after ${timeoutMs}ms.`
        : `Provider CLI "${config.command}" failed: ${result.error.message}`,
      'failed',
    );
  }

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  if (result.status !== 0) {
    return providerFailureReview(
      model,
      `provider:${model}`,
      [
        `Provider CLI "${config.command}" exited with status ${result.status}.`,
        stderr ? `stderr: ${stderr}` : '',
        stdout ? `stdout: ${stdout}` : '',
      ].filter(Boolean).join('\n\n'),
      'failed',
    );
  }

  return {
    reviewer: model,
    source: `provider:${model}`,
    content: stdout,
    status: stdout ? 'captured' : 'empty',
  };
}

function invokeProviderReviews(input = {}, paperDir) {
  const models = parseModels(input.models);
  if (models.length === 0) return [];

  const prompt = buildExternalReviewPrompt(paperDir);
  const tempPrompt = writeTempPrompt(prompt, Boolean(input.dryRun));
  try {
    return models.map((model) => invokeProvider(model, prompt, input));
  } finally {
    if (tempPrompt) fs.rmSync(tempPrompt.tempDir, { recursive: true, force: true });
  }
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
  const sources = new Set(reviews.map((review) => review.source.split(':')[0]));
  const modes = [];
  if (sources.has('provider')) modes.push('installed provider CLIs');
  if (sources.has('stdin')) modes.push('stdin');
  if (reviews.some((review) => review.source !== 'stdin' && !review.source.startsWith('provider:'))) {
    modes.push('provided files');
  }
  const modeText = modes.length > 0 ? modes.join(', ') : 'provided files or stdin';

  return `# External Reviews

**Reviewed at:** ${createdAt}
**Reviewers:** ${reviewerList}
**Draft reviewed:** ${draftReviewed}

## Review Prompt Summary

External review text was collected by \`gpd review-external\` from ${modeText}. Provider invocation, when used, sends the generated review prompt to selected installed CLIs and captures their stdout/stderr. This command records captured feedback and creates a pending feedback plan; it does not revise the draft.

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
  const reviews = [
    ...readReviewInputs(input),
    ...invokeProviderReviews(input, paperDir),
  ];

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
    reviewsFailed: reviews.filter((review) => ['failed', 'missing', 'unsupported'].includes(review.status)).length,
    reviewers: reviews.map((review) => ({
      reviewer: review.reviewer,
      source: review.source,
      status: review.status,
    })),
    externalReviewsPath: path.join(paperDir, '.paper', 'EXTERNAL-REVIEWS.md'),
    feedbackPlanPath: path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
    next: '/gpd-progress',
  };
}

function printExternalReviewResult(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`reviews captured: ${result.reviewsCaptured}`);
  console.log(`empty reviews: ${result.reviewsEmpty}`);
  console.log(`review issues: ${result.reviewsFailed}`);
  for (const review of result.reviewers) {
    console.log(`- ${review.reviewer}: ${review.status} (${review.source})`);
  }
  console.log(`external reviews: ${result.externalReviewsPath}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`next: ${result.next}`);
}

module.exports = {
  buildExternalReviewPrompt,
  reviewExternal,
  printExternalReviewResult,
};
