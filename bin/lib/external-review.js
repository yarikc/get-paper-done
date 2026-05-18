'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

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
  gemini: { command: 'gemini', args: ['-p', ''] },
  claude: { command: 'claude', args: ['-p'] },
  codex: { command: 'codex', args: ['exec', '--skip-git-repo-check', '-'] },
  qwen: { command: 'qwen', args: ['-'] },
  cursor: { command: 'cursor', args: ['agent', '-p', '--mode', 'ask', '--trust'] },
};

const activeProviderChildren = new Set();
let providerSignalHandlersInstalled = false;

function supportedProviders() {
  return Object.keys(providerCommands);
}

function emitProgress(input, event) {
  if (typeof input.onProgress === 'function') input.onProgress(event);
}

function formatExternalReviewProgress(event) {
  const detail = event.detail ? ` - ${event.detail}` : '';
  return `${event.reviewer}: ${event.status}${detail}`;
}

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

function normalizeRuntime(value) {
  const runtime = reviewerSlug(value || '');
  return providerCommands[runtime] ? runtime : '';
}

function detectCurrentRuntime(input = {}) {
  if (Object.prototype.hasOwnProperty.call(input, 'currentRuntime')) {
    return normalizeRuntime(input.currentRuntime);
  }
  const explicit = normalizeRuntime(process.env.GPD_CURRENT_RUNTIME);
  if (explicit) return explicit;

  const env = process.env;
  if (env.CLAUDECODE || env.CLAUDE_CODE || env.CLAUDE_CODE_ENTRYPOINT) return 'claude';
  if (env.CODEX_HOME || env.CODEX_SANDBOX || env.CODEX_CLI) return 'codex';
  if (env.CURSOR_TRACE_ID || env.CURSOR_AGENT) return 'cursor';
  return '';
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

function artifactSection(paperDir, artifactName, title = artifactName) {
  const content = readPaperArtifact(paperDir, artifactName);
  return `## ${title}\n\n**Artifact:** .paper/${artifactName}\n\n${content || '[Not present]'}`;
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
    'Use the full paper workspace context below. Treat `.paper/DRAFT.md` as the editable source of truth and `.paper/exports/FINAL.md` as the user-facing reading copy when present.',
    '',
    artifactSection(paperDir, 'STATE.md', 'State Summary'),
    artifactSection(paperDir, 'STATE.json', 'Machine State'),
    artifactSection(paperDir, 'config.json', 'Paper Config And Classification'),
    artifactSection(paperDir, 'PROJECT.md', 'Project'),
    artifactSection(paperDir, 'PAPER-CONTEXT.md', 'Grill Context'),
    artifactSection(paperDir, 'DECISIONS.md', 'Paper Decision Records'),
    artifactSection(paperDir, 'PERSONA.md', 'Persona'),
    artifactSection(paperDir, 'AUDIENCE.md', 'Audience'),
    artifactSection(paperDir, 'BRIEF.md', 'Brief'),
    artifactSection(paperDir, 'STRATEGY.md', 'Strategy Gate'),
    artifactSection(paperDir, 'RESEARCH.md', 'Research Summary'),
    artifactSection(paperDir, 'RESEARCH.json', 'Research Plan And Evidence Results'),
    artifactSection(paperDir, 'OUTLINE.md', 'Outline'),
    artifactSection(paperDir, 'DRAFT.md', 'Draft'),
    promptSection(paperDir, 'Exported Reading Copy', ['exports/FINAL.md']),
    artifactSection(paperDir, 'FACT-CHECK.md', 'Fact Check'),
    artifactSection(paperDir, 'REVIEW.md', 'Local Review'),
    artifactSection(paperDir, 'READER-FEEDBACK.md', 'Reader Feedback'),
    artifactSection(paperDir, 'FEEDBACK-PLAN.md', 'Prior Feedback Plan'),
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

function providerSelfReviewSkip(model, currentRuntime, input = {}) {
  emitProgress(input, {
    reviewer: model,
    source: `provider:${model}`,
    status: 'skipped_self_review',
    detail: `current runtime is ${currentRuntime}`,
  });
  return providerFailureReview(
    model,
    `provider:${model}`,
    `Skipped provider "${model}" because the current runtime is "${currentRuntime}". External review must come from a different reviewer, not the assistant already doing the work.`,
    'skipped_self_review',
  );
}

function killProviderProcess(child, signal = 'SIGTERM') {
  if (!child || !child.pid) return false;
  try {
    if (process.platform === 'win32') {
      const result = spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: 'ignore',
      });
      if (result.status === 0) return true;
      return child.kill(signal);
    }
    process.kill(-child.pid, signal);
    return true;
  } catch (err) {
    try {
      child.kill(signal);
      return true;
    } catch (fallbackErr) {
      return false;
    }
  }
}

function cleanupActiveProviderProcesses() {
  let cleaned = false;
  for (const child of activeProviderChildren) {
    cleaned = killProviderProcess(child, 'SIGTERM') || cleaned;
  }
  return cleaned;
}

function installProviderSignalHandlers() {
  if (providerSignalHandlersInstalled) return;
  providerSignalHandlersInstalled = true;
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.once(signal, () => {
      cleanupActiveProviderProcesses();
      process.exit(signal === 'SIGINT' ? 130 : 143);
    });
  }
}

function runProviderCommand(commandPath, args, prompt, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    let timedOut = false;
    let killed = false;
    let stdout = '';
    let stderr = '';
    let timeoutTimer = null;
    let killTimer = null;
    const maxBuffer = 10 * 1024 * 1024;
    const child = spawn(commandPath, args, {
      detached: process.platform !== 'win32',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    activeProviderChildren.add(child);
    installProviderSignalHandlers();

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(killTimer);
      activeProviderChildren.delete(child);
      resolve({
        ...result,
        stdout,
        stderr,
        timedOut,
        killed,
        pid: child.pid,
      });
    }

    function stopForTimeout() {
      timedOut = true;
      killed = killProviderProcess(child, 'SIGTERM');
      killTimer = setTimeout(() => {
        killed = killProviderProcess(child, 'SIGKILL') || killed;
      }, 1000);
    }

    timeoutTimer = setTimeout(stopForTimeout, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > maxBuffer) {
        stderr += '\nProvider stdout exceeded 10MB capture limit.';
        killed = killProviderProcess(child, 'SIGTERM') || killed;
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > maxBuffer) {
        stderr += '\nProvider stderr exceeded 10MB capture limit.';
        killed = killProviderProcess(child, 'SIGTERM') || killed;
      }
    });

    child.on('error', (error) => {
      finish({ error });
    });

    child.on('close', (status, signal) => {
      finish({ status, signal });
    });

    child.stdin.on('error', () => {
      // The provider may close stdin early. The exit status will carry the outcome.
    });
    child.stdin.end(prompt);
  });
}

async function invokeProvider(model, prompt, input = {}) {
  const config = providerCommands[model];
  if (!config) {
    emitProgress(input, {
      reviewer: model,
      source: `provider:${model}`,
      status: 'unsupported',
      detail: `supported providers: ${supportedProviders().join(', ')}`,
    });
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Provider "${model}" is not supported by this CLI slice. Supported providers: ${supportedProviders().join(', ')}.`,
      'unsupported',
    );
  }

  const found = executablePath(config.command);
  if (!found) {
    emitProgress(input, {
      reviewer: model,
      source: `provider:${model}`,
      status: 'missing',
      detail: `CLI "${config.command}" was not found on PATH`,
    });
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Provider CLI "${config.command}" was not found on PATH.`,
      'missing',
    );
  }

  if (input.dryRun) {
    emitProgress(input, {
      reviewer: model,
      source: `provider:${model}`,
      status: 'planned',
      detail: `would invoke "${config.command} ${config.args.join(' ')}"`,
    });
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Dry run: would invoke "${config.command} ${config.args.join(' ')}".`,
      'planned',
    );
  }

  const timeoutMs = input.timeoutMs || 120000;
  emitProgress(input, {
    reviewer: model,
    source: `provider:${model}`,
    status: 'running',
    detail: `invoking "${config.command} ${config.args.join(' ')}" with ${timeoutMs}ms timeout`,
  });
  const result = await runProviderCommand(found, config.args, prompt, timeoutMs);

  if (result.timedOut) {
    emitProgress(input, {
      reviewer: model,
      source: `provider:${model}`,
      status: 'timed_out',
      detail: `timed out after ${timeoutMs}ms; provider process tree cleanup ${result.killed ? 'requested' : 'failed'}`,
    });
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Provider CLI "${config.command}" timed out after ${timeoutMs}ms. GPD requested cleanup for the provider process tree.`,
      'timed_out',
    );
  }

  if (result.error) {
    emitProgress(input, {
      reviewer: model,
      source: `provider:${model}`,
      status: 'failed',
      detail: result.error.message,
    });
    return providerFailureReview(
      model,
      `provider:${model}`,
      `Provider CLI "${config.command}" failed: ${result.error.message}`,
      'failed',
    );
  }

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  if (result.status !== 0) {
    emitProgress(input, {
      reviewer: model,
      source: `provider:${model}`,
      status: 'failed',
      detail: `exited with status ${result.status}`,
    });
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

  emitProgress(input, {
    reviewer: model,
    source: `provider:${model}`,
    status: stdout ? 'captured' : 'empty',
    detail: stdout ? 'review text captured' : 'provider returned no review text',
  });
  return {
    reviewer: model,
    source: `provider:${model}`,
    content: stdout,
    status: stdout ? 'captured' : 'empty',
  };
}

async function invokeProviderReviews(input = {}, paperDir) {
  const models = parseModels(input.models);
  if (models.length === 0) return [];
  const currentRuntime = detectCurrentRuntime(input);
  const needsPrompt = models.some((model) => model !== currentRuntime);

  const prompt = needsPrompt ? buildExternalReviewPrompt(paperDir) : '';
  const tempPrompt = needsPrompt ? writeTempPrompt(prompt, Boolean(input.dryRun)) : null;
  try {
    const reviews = [];
    for (const model of models) {
      if (currentRuntime && model === currentRuntime) {
        reviews.push(providerSelfReviewSkip(model, currentRuntime, input));
      } else {
        reviews.push(await invokeProvider(model, prompt, input));
      }
    }
    return reviews;
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

function cleanTableCell(value) {
  return String(value || '')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function trimMarkdownMarkers(value) {
  return String(value || '')
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

function affectedArtifactForFeedback(text) {
  const value = String(text || '').toLowerCase();
  const artifacts = [];
  if (/(brief|thesis|ask|decision|classification|purpose)/.test(value)) artifacts.push('BRIEF');
  if (/(research|evidence|source|citation|fact|standard|regulat)/.test(value)) artifacts.push('RESEARCH', 'FACT-CHECK');
  if (/(outline|structure|section|narrative|argument flow|deliverable|famil)/.test(value)) artifacts.push('OUTLINE', 'DRAFT');
  if (/(audience|executive|reader|sponsor|c-level|cxo)/.test(value)) artifacts.push('AUDIENCE', 'DRAFT');
  if (/(persona|voice|tone|register|style|concision)/.test(value)) artifacts.push('PERSONA', 'DRAFT');
  if (/(context|term|definition|decision record|operating layer|mechanism)/.test(value)) artifacts.push('PAPER-CONTEXT', 'DECISIONS', 'DRAFT');
  if (artifacts.length === 0) artifacts.push('DRAFT');
  return [...new Set(artifacts)].join(' / ');
}

function handlingForSeverity(severity) {
  if (severity === 'HIGH') return 'Recommended default: incorporate before final approval unless the user rejects the premise.';
  if (severity === 'MEDIUM') return 'Recommended default: discuss; incorporate if it improves the paper without expanding scope.';
  if (severity === 'LOW') return 'Recommended default: defer unless it is quick, low-risk polish.';
  if (severity === 'ACTION') return 'Recommended default: apply only if it maps to an approved HIGH/MEDIUM/LOW concern.';
  return 'Recommended default: ask user whether to incorporate, ignore, defer, or convert into a specific revision task.';
}

function recommendationForSeverity(severity) {
  if (severity === 'HIGH') return 'Recommend incorporate';
  if (severity === 'MEDIUM') return 'Recommend discuss';
  if (severity === 'LOW') return 'Recommend defer';
  if (severity === 'ACTION') return 'Recommend map to approved concern';
  return 'Recommend ask user';
}

function extractSection(content, headingPattern) {
  const lines = String(content || '').split(/\r?\n/);
  const start = lines.findIndex((line) => headingPattern.test(line.trim()));
  if (start < 0) return '';
  const section = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^##\s+\S/.test(line.trim())) break;
    section.push(line);
  }
  return section.join('\n').trim();
}

function extractNumberedItems(content) {
  const items = [];
  const lines = String(content || '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*\d+[.)]\s+(.+?)\s*$/);
    if (match) items.push(trimMarkdownMarkers(match[1]));
  }
  return items;
}

function extractBulletItems(content) {
  const items = [];
  const lines = String(content || '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*[*-]\s+(.+?)\s*$/);
    if (match) items.push(trimMarkdownMarkers(match[1]));
  }
  return items;
}

function severityHeading(line) {
  const prefixed = line.match(/^#{2,4}\s+(HIGH|MEDIUM|LOW)(?:-\d+)?(?:\s*[—:]\s*|\s+-\s+|\s+)(.+?)\s*$/i);
  if (prefixed) {
    return {
      severity: prefixed[1].toUpperCase(),
      title: trimMarkdownMarkers(prefixed[2]),
    };
  }

  const parenthetical = line.match(/^#{2,4}\s+(?:\d+[.)]\s+)?(.+?)\s+\(Severity:\s*(HIGH|MEDIUM|LOW)\)\s*$/i);
  if (parenthetical) {
    return {
      severity: parenthetical[2].toUpperCase(),
      title: trimMarkdownMarkers(parenthetical[1]),
    };
  }

  return null;
}

function extractReviewFeedbackItems(review) {
  if (review.status !== 'captured' || !review.content) {
    return [{
      reviewer: review.reviewer,
      severity: review.status === 'captured' ? 'UNKNOWN' : 'INFO',
      feedback: firstNonEmptyLine(review.content) || `[${review.status}] ${review.reviewer} produced no actionable review text.`,
      recommendation: review.status === 'captured' ? 'Ask user' : 'Check provider',
      proposedHandling: review.status === 'captured'
        ? handlingForSeverity('UNKNOWN')
        : 'Check whether this provider result should be ignored, retried, or replaced.',
      affectedArtifact: 'EXTERNAL-REVIEWS',
    }];
  }

  const items = [];
  const lines = review.content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const heading = severityHeading(lines[i]);
    if (!heading) continue;
    const severity = heading.severity;
    const title = heading.title;
    const body = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      if (severityHeading(lines[j])) break;
      if (/^##\s+\S/.test(lines[j]) && !/^###\s+/.test(lines[j])) break;
      body.push(lines[j]);
    }
    const firstBody = body
      .map((line) => trimMarkdownMarkers(line))
      .find((line) => line && !/^fix:/i.test(line));
    const feedback = firstBody ? `${severity}: ${title} - ${firstBody}` : `${severity}: ${title}`;
    items.push({
      reviewer: review.reviewer,
      severity,
      feedback,
      recommendation: recommendationForSeverity(severity),
      proposedHandling: handlingForSeverity(severity),
      affectedArtifact: affectedArtifactForFeedback(`${title} ${body.join(' ')}`),
    });
  }

  const suggestedSection = extractSection(review.content, /^##\s+Specific Suggested Changes\b/i);
  const suggestedChanges = [
    ...extractNumberedItems(suggestedSection),
    ...extractBulletItems(suggestedSection),
  ];
  for (const change of suggestedChanges.slice(0, 12)) {
    const duplicate = items.some((item) => item.feedback.toLowerCase().includes(change.toLowerCase().slice(0, 48)));
    if (duplicate) continue;
    items.push({
      reviewer: review.reviewer,
      severity: 'ACTION',
      feedback: change,
      recommendation: recommendationForSeverity('ACTION'),
      proposedHandling: handlingForSeverity('ACTION'),
      affectedArtifact: affectedArtifactForFeedback(change),
    });
  }

  if (items.length > 0) return items;

  return [{
    reviewer: review.reviewer,
    severity: 'UNKNOWN',
    feedback: firstNonEmptyLine(review.content) || '[No actionable feedback extracted.]',
    recommendation: 'Ask user',
    proposedHandling: handlingForSeverity('UNKNOWN'),
    affectedArtifact: 'DRAFT / BRIEF / RESEARCH / OUTLINE',
  }];
}

function feedbackItemsForReviews(reviews) {
  return reviews.flatMap((review) => extractReviewFeedbackItems(review));
}

function severityRank(severity) {
  return {
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    ACTION: 1,
    UNKNOWN: 0,
    INFO: 0,
  }[String(severity || '').toUpperCase()] || 0;
}

function severityFromRank(rank) {
  if (rank >= 4) return 'HIGH';
  if (rank === 3) return 'MEDIUM';
  if (rank === 2) return 'LOW';
  if (rank === 1) return 'ACTION';
  return 'UNKNOWN';
}

function itemTitle(item) {
  const value = item.title || item.feedback || '';
  return String(value)
    .replace(/^(HIGH|MEDIUM|LOW|ACTION|UNKNOWN):\s*/i, '')
    .split(' - ')[0]
    .trim();
}

function topicTokens(value) {
  const stopwords = new Set([
    'about',
    'action',
    'again',
    'architecture',
    'because',
    'being',
    'concern',
    'could',
    'deliverable',
    'does',
    'from',
    'have',
    'into',
    'issue',
    'layer',
    'paper',
    'problem',
    'section',
    'should',
    'that',
    'their',
    'there',
    'these',
    'this',
    'what',
    'when',
    'where',
    'with',
  ]);
  const canonical = {
    bloat: 'overlap',
    bloated: 'overlap',
    differentiation: 'overlap',
    duplicate: 'overlap',
    duplication: 'overlap',
    duplicative: 'overlap',
    overlapping: 'overlap',
    overlaps: 'overlap',
  };
  return String(value || '')
    .toLowerCase()
    .replace(/["'`*_()[\]#:.—–-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .map((token) => canonical[token] || token)
    .filter((token) => token.length > 3 && !stopwords.has(token));
}

function topicSimilarity(a, b) {
  const aTokens = new Set(topicTokens(a));
  const bTokens = new Set(topicTokens(b));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  return overlap / Math.min(aTokens.size, bTokens.size);
}

function itemsAreDuplicates(a, b) {
  if (a.severity === 'ACTION' || b.severity === 'ACTION') return false;
  const aTitle = itemTitle(a);
  const bTitle = itemTitle(b);
  if (!aTitle || !bTitle) return false;
  if (reviewerSlug(aTitle) === reviewerSlug(bTitle)) return true;
  return topicSimilarity(aTitle, bTitle) >= 0.5;
}

function mergeFeedbackItems(existing, incoming) {
  const existingRank = severityRank(existing.severity);
  const incomingRank = severityRank(incoming.severity);
  const keepIncomingText = incomingRank > existingRank
    || (incomingRank === existingRank && String(incoming.feedback || '').length > String(existing.feedback || '').length);
  const reviewers = [
    ...(existing.reviewers || [existing.reviewer].filter(Boolean)),
    ...(incoming.reviewers || [incoming.reviewer].filter(Boolean)),
  ];
  const sources = [
    ...(existing.sources || [existing.reviewer].filter(Boolean)),
    ...(incoming.sources || [incoming.reviewer].filter(Boolean)),
  ];
  const affectedArtifacts = [
    ...(existing.affectedArtifact || '').split('/').map((item) => item.trim()).filter(Boolean),
    ...(incoming.affectedArtifact || '').split('/').map((item) => item.trim()).filter(Boolean),
  ];
  const severity = severityFromRank(Math.max(existingRank, incomingRank));
  return {
    ...existing,
    title: keepIncomingText ? incoming.title : existing.title,
    feedback: keepIncomingText ? incoming.feedback : existing.feedback,
    severity,
    recommendation: recommendationForSeverity(severity),
    proposedHandling: handlingForSeverity(severity),
    reviewer: [...new Set(reviewers)].join(', '),
    reviewers: [...new Set(reviewers)],
    sources: [...new Set(sources)],
    affectedArtifact: [...new Set(affectedArtifacts)].join(' / '),
    mergedCount: (existing.mergedCount || 1) + 1,
  };
}

function dedupeFeedbackItems(items) {
  const deduped = [];
  for (const item of items) {
    const normalized = {
      ...item,
      reviewers: item.reviewers || [item.reviewer].filter(Boolean),
      sources: item.sources || [item.reviewer].filter(Boolean),
    };
    const matchIndex = deduped.findIndex((existing) => itemsAreDuplicates(existing, normalized));
    if (matchIndex >= 0) {
      deduped[matchIndex] = mergeFeedbackItems(deduped[matchIndex], normalized);
    } else {
      deduped.push(normalized);
    }
  }
  return deduped;
}

function safeTimestamp(createdAt) {
  return String(createdAt)
    .replace(/[:.]/g, '')
    .replace(/[^0-9TZ-]/g, '-');
}

function storedReviewMarkdown({ review, createdAt }) {
  return `# External Review Capture

**Captured at:** ${createdAt}
**Reviewer:** ${review.reviewer}
**Source:** ${review.source}
**Status:** ${review.status}

## Review

${review.content || '[No review content captured.]'}
`;
}

function storeIndividualReviews(paperDir, reviews, createdAt, dryRun) {
  const reviewDir = path.join(paperDir, '.paper', 'external-reviews');
  const stored = [];
  for (const review of reviews) {
    const fileName = `${safeTimestamp(createdAt)}-${reviewerSlug(review.reviewer)}.md`;
    const filePath = path.join(reviewDir, fileName);
    if (!dryRun) fs.mkdirSync(reviewDir, { recursive: true });
    writeFile(filePath, storedReviewMarkdown({ review, createdAt }), dryRun);
    stored.push({
      reviewer: review.reviewer,
      path: filePath,
      relativePath: path.join('.paper', 'external-reviews', fileName),
    });
  }
  return stored;
}

function externalReviewsMarkdown({
  reviews, paperDir, createdAt, storedReviews = [], combinedItems = [],
}) {
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

## Stored Reviewer Files

${storedReviews.length > 0 ? storedReviews.map((item) => `- ${item.reviewer}: \`${item.relativePath}\``).join('\n') : '- None.'}

---

${rawSections}
## Consensus Summary

### Shared Concerns

${combinedItems.length > 0 ? combinedItems.slice(0, 8).map((item) => `- ${item.reviewer}: ${item.feedback}`).join('\n') : '- No actionable feedback extracted.'}

### Shared Strengths

- Not synthesized by the CLI wrapper.

### Divergent Views

- Not synthesized by the CLI wrapper.

### High-Risk Items

- ${captured.length > 0 ? 'External feedback is captured but not yet approved for revision.' : 'No external feedback was captured.'}
- ${empty.length > 0 ? `${empty.length} reviewer input(s) were empty and should be checked before relying on the review set.` : 'No empty reviewer inputs recorded.'}
`;
}

function feedbackPlanMarkdown({ reviews, createdAt, feedbackItems }) {
  const combinedItems = feedbackItems || dedupeFeedbackItems(feedbackItemsForReviews(reviews));
  const rows = reviews.length === 0
    ? '| 1 | No external review input was provided. | gpd review-external | Needs decision | Recommend ask user | Provide review files/stdin or skip external feedback for this revision. | None yet - user may override. | EXTERNAL-REVIEWS |\n'
    : combinedItems.map((item, index) => {
      const assessment = item.severity && item.severity !== 'UNKNOWN' ? `${item.severity} - Pending approval` : 'Pending approval';
      return `| ${index + 1} | ${cleanTableCell(item.feedback)} | ${cleanTableCell(item.reviewer)} | ${cleanTableCell(assessment)} | ${cleanTableCell(item.recommendation)} | ${cleanTableCell(item.proposedHandling)} | None yet - user may override with incorporate / discuss / defer / ignore. | ${cleanTableCell(item.affectedArtifact)} |`;
    }).join('\n');
  const incorporate = reviews.length > 0
    ? '- Recommended by default for HIGH items, unless the user writes an override in the table or rejects the premise.'
    : '- None.';
  const defer = reviews.length > 0
    ? '- Recommended by default for LOW items and ACTION items that do not map to an approved concern.'
    : '- None automatically.';
  const decisions = reviews.length > 0
    ? '- Approve the recommendations as written or edit the \`User Override\` column before revision.'
    : '- Decide whether to provide external review input or continue without it.';

  return `# Feedback Handling Plan

**Created:** ${createdAt}
**Based on:** \`.paper/EXTERNAL-REVIEWS.md\`
**Status:** Pending user approval

## Summary

\`gpd review-external\` captured external review input, decomposed actionable concerns into the table below, assigned default recommendations, and stopped at the approval gate. No draft or upstream artifact has been changed. The user may override any row by editing the \`User Override\` column before revision.

## Proposed Handling

| # | Feedback | Source(s) | Assessment | Recommendation | Proposed Handling | User Override | Affected Artifact |
|---|----------|-----------|------------|----------------|-------------------|---------------|-------------------|
${rows}

## Below-Target Items

| # | Issue | Target Bar Impact | Action | Reason |
|---|-------|-------------------|--------|--------|
| 1 | External review may identify below-target issues. | Unknown until the user evaluates captured feedback. | Ask user | External feedback is captured as proposed handling, not automatic rewrite authority. |

## Incorporate

${incorporate}

## Ignore

- None automatically.

## Defer

${defer}

## User Decisions Needed

${decisions}

## Approval Gate

Before changing \`.paper/DRAFT.md\` or upstream artifacts, present this plan to the user and ask how to proceed.

Options:

- Approve all recommended handling
- Approve only incorporate items
- Override selected rows in the \`User Override\` column
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
    suggested_next_command: '/gpd-status',
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

async function reviewExternal(input = {}) {
  const paperState = status(input);
  const paperDir = paperState.paperDir;
  if (!paperState.artifacts['DRAFT.md']) {
    throw new Error('External review requires .paper/DRAFT.md.');
  }
  const createdAt = new Date().toISOString();
  const dryRun = Boolean(input.dryRun);
  const providerProgress = [];
  const reviewInput = {
    ...input,
    onProgress: (event) => {
      providerProgress.push(event);
      emitProgress(input, event);
    },
  };
  const reviews = [
    ...readReviewInputs(reviewInput),
    ...await invokeProviderReviews(reviewInput, paperDir),
  ];
  const rawFeedbackItems = feedbackItemsForReviews(reviews);
  const feedbackItems = dedupeFeedbackItems(rawFeedbackItems);
  const storedReviews = storeIndividualReviews(paperDir, reviews, createdAt, dryRun);

  writeFile(
    path.join(paperDir, '.paper', 'EXTERNAL-REVIEWS.md'),
    externalReviewsMarkdown({
      reviews,
      paperDir,
      createdAt,
      storedReviews,
      combinedItems: feedbackItems,
    }),
    dryRun,
  );
  writeFile(
    path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
    feedbackPlanMarkdown({ reviews, createdAt, feedbackItems }),
    dryRun,
  );
  updateFeedbackState(paperDir, dryRun);

  return {
    paperDir,
    reviewsCaptured: reviews.filter((review) => review.status === 'captured').length,
    reviewsEmpty: reviews.filter((review) => review.status !== 'captured').length,
    reviewsFailed: reviews.filter((review) => ['failed', 'missing', 'unsupported', 'skipped_self_review', 'timed_out'].includes(review.status)).length,
    feedbackItems: feedbackItems.length,
    rawFeedbackItems: rawFeedbackItems.length,
    providerProgress,
    storedReviews,
    feedbackRecommendations: feedbackItems.map((item, index) => ({
      index: index + 1,
      feedback: item.feedback,
      reviewers: item.reviewer,
      recommendation: item.recommendation,
    })),
    reviewers: reviews.map((review) => ({
      reviewer: review.reviewer,
      source: review.source,
      status: review.status,
    })),
    externalReviewsPath: path.join(paperDir, '.paper', 'EXTERNAL-REVIEWS.md'),
    feedbackPlanPath: path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
    next: '/gpd-status',
  };
}

function printExternalReviewResult(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`reviews captured: ${result.reviewsCaptured}`);
  console.log(`empty reviews: ${result.reviewsEmpty}`);
  console.log(`review issues: ${result.reviewsFailed}`);
  console.log(`feedback items: ${result.feedbackItems}`);
  if (result.rawFeedbackItems !== undefined && result.rawFeedbackItems !== result.feedbackItems) {
    console.log(`raw feedback items: ${result.rawFeedbackItems}`);
  }
  if (result.providerProgress && result.providerProgress.length > 0) {
    console.log('provider progress:');
    for (const event of result.providerProgress) {
      console.log(`- ${formatExternalReviewProgress(event)}`);
    }
  }
  for (const review of result.reviewers) {
    console.log(`- ${review.reviewer}: ${review.status} (${review.source})`);
  }
  if (result.storedReviews && result.storedReviews.length > 0) {
    console.log('stored reviews:');
    for (const stored of result.storedReviews) {
      console.log(`- ${stored.reviewer}: ${stored.relativePath}`);
    }
  }
  if (result.feedbackRecommendations && result.feedbackRecommendations.length > 0) {
    console.log('combined recommendations:');
    for (const item of result.feedbackRecommendations) {
      console.log(`- ${item.index}. ${item.recommendation} [${item.reviewers}]: ${item.feedback}`);
    }
  }
  console.log(`external reviews: ${result.externalReviewsPath}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`next: ${result.next}`);
}

module.exports = {
  buildExternalReviewPrompt,
  formatExternalReviewProgress,
  reviewExternal,
  printExternalReviewResult,
};
