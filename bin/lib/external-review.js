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
  gemini: {
    command: 'gemini',
    args: ['-p', '', '-m', 'pro', '--output-format', 'json', '--approval-mode', 'plan', '--skip-trust'],
    modelArg: '-m',
    requestedModel: 'pro',
    requestedModelType: 'provider_alias',
    outputFormat: 'json',
  },
  claude: {
    command: 'claude',
    args: ['-p', '--model', 'opus', '--effort', 'xhigh'],
    modelArg: '--model',
    effortArg: '--effort',
    requestedModel: 'opus',
    requestedModelType: 'provider_alias',
    requestedEffort: 'xhigh',
  },
  codex: { command: 'codex', args: ['exec', '--skip-git-repo-check', '-'] },
  qwen: { command: 'qwen', args: ['-'] },
  cursor: { command: 'cursor', args: ['agent', '-p', '--mode', 'ask', '--trust'] },
};

const externalReviewContextArtifacts = [
  ['STATE.md', 'State Summary'],
  ['STATE.json', 'Machine State'],
  ['config.json', 'Paper Config And Classification'],
  ['PROJECT.md', 'Project'],
  ['PAPER-CONTEXT.md', 'Grill Context'],
  ['DECISIONS.md', 'Paper Decision Records'],
  ['PERSONA.md', 'Persona'],
  ['AUDIENCE.md', 'Audience'],
  ['BRIEF.md', 'Brief'],
  ['STRATEGY.md', 'Strategy Gate'],
  ['RESEARCH.md', 'Research Summary'],
  ['RESEARCH.json', 'Research Plan And Evidence Results'],
  ['OUTLINE.md', 'Outline'],
  ['DRAFT.md', 'Draft'],
  ['exports/FINAL.md', 'Exported Reading Copy'],
  ['FACT-CHECK.md', 'Fact Check'],
  ['REVIEW.md', 'Local Review'],
  ['FEEDBACK-READER.md', 'Reader Feedback'],
  ['FEEDBACK-PLAN.md', 'Prior Feedback Plan'],
];

const activeProviderChildren = new Set();
let providerSignalHandlersInstalled = false;

function supportedProviders() {
  return Object.keys(providerCommands);
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function preservedPriorMarkdown(title, markdown) {
  if (!markdown) return '';
  const quoted = markdown
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join('\n');
  return ['---', '', `## ${title}`, '', quoted].join('\n');
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

function paperReviewModelOverrides(paperDir) {
  const config = readJsonIfExists(path.join(paperDir || '', '.paper', 'config.json'));
  return config?.review?.external_models || {};
}

function modelSelectionType(provider, model) {
  if (!model) return 'provider_default';
  // Keep this alias list intentionally small. Unknown values are explicit pins
  // unless the provider's CLI documents a durable capability alias.
  const aliases = {
    claude: new Set(['default', 'opus', 'sonnet', 'haiku', 'opusplan']),
    gemini: new Set(['auto', 'pro', 'flash', 'flash-lite']),
  };
  return aliases[provider]?.has(String(model).toLowerCase()) ? 'provider_alias' : 'explicit_pin';
}

function withArgValue(args, flag, value) {
  const index = args.indexOf(flag);
  if (index < 0 || index === args.length - 1) return args;
  const next = [...args];
  next[index + 1] = value;
  return next;
}

function providerOverrideFor(model, paperDir) {
  const override = paperReviewModelOverrides(paperDir)[model];
  if (!override) return {};
  if (typeof override === 'string') return { model: override };
  return typeof override === 'object' ? override : {};
}

function resolvedProviderConfig(model, input = {}) {
  const base = providerCommands[model];
  if (!base) return null;
  const override = providerOverrideFor(model, input.paperDir);
  let args = [...base.args];
  let requestedModel = base.requestedModel || null;
  let requestedEffort = base.requestedEffort || null;
  const ignoredOverrides = [];

  if (override.model) {
    if (base.modelArg) {
      requestedModel = String(override.model);
      args = withArgValue(args, base.modelArg, requestedModel);
    } else {
      ignoredOverrides.push({
        field: 'model',
        reason: 'provider has no GPD-controlled model flag',
      });
    }
  }
  if (override.effort) {
    if (base.effortArg) {
      requestedEffort = String(override.effort);
      args = withArgValue(args, base.effortArg, requestedEffort);
    } else {
      ignoredOverrides.push({
        field: 'effort',
        reason: 'provider has no GPD-controlled effort flag',
      });
    }
  }

  return {
    ...base,
    args,
    requestedModel,
    requestedModelType: modelSelectionType(model, requestedModel),
    requestedEffort,
    overrideApplied: Object.keys(override).length > ignoredOverrides.length,
    ignoredOverrides,
  };
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
    'Print the full review in your stdout response. Do not create, modify, save, or reference any local files. Do not answer with a pointer to a file.',
    '',
    ...externalReviewContextArtifacts
      .filter(([artifactName]) => artifactName !== 'exports/FINAL.md')
      .map(([artifactName, title]) => artifactSection(paperDir, artifactName, title)),
    promptSection(paperDir, 'Exported Reading Copy', ['exports/FINAL.md']),
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

function parseProviderStdout(model, config, stdout) {
  const raw = (stdout || '').trim();
  if (model !== 'gemini' || config?.outputFormat !== 'json' || !raw) {
    return {
      content: raw,
      resolvedModels: [],
      resolutionStatus: config ? 'not_reported_by_provider_cli' : 'unknown',
      resolutionSource: null,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const resolvedModels = parsed?.stats?.models && typeof parsed.stats.models === 'object'
      ? Object.keys(parsed.stats.models)
      : [];
    return {
      content: String(parsed.response || '').trim(),
      resolvedModels,
      resolutionStatus: resolvedModels.length > 0
        ? 'resolved_from_provider_stats'
        : 'not_reported_by_provider_cli',
      resolutionSource: resolvedModels.length > 0 ? 'stdout_json.stats.models' : null,
    };
  } catch (error) {
    return {
      content: raw,
      resolvedModels: [],
      resolutionStatus: 'resolution_parse_failed',
      resolutionSource: 'stdout_json',
      resolutionError: error.message,
    };
  }
}

function reviewRunId(createdAt) {
  return `EXT-${String(createdAt).replace(/[-:.]/g, '').replace(/\D/g, '').slice(0, 17)}`;
}

function reviewTargetForPaper(paperDir) {
  const finalPath = path.join(paperDir, '.paper', 'exports', 'FINAL.md');
  if (fs.existsSync(finalPath)) return '.paper/exports/FINAL.md';
  return '.paper/DRAFT.md';
}

function contextArtifactProvenance(paperDir) {
  return externalReviewContextArtifacts.map(([artifactName, title]) => {
    const relativePath = `.paper/${artifactName}`;
    return {
      artifact: relativePath,
      title,
      included: fs.existsSync(path.join(paperDir, '.paper', artifactName)),
    };
  });
}

function reviewSourceType(review) {
  if (review.source === 'stdin') return 'stdin';
  if (review.source.startsWith('provider:')) return 'provider';
  return 'file';
}

function providerReviewConfig(model, input = {}, review = null) {
  const config = resolvedProviderConfig(model, input);
  const resolvedModels = review?.resolvedModels || [];
  const resolutionStatus = review?.resolutionStatus
    || (config ? 'not_reported_by_provider_cli' : 'unsupported');
  return {
    provider: model,
    source: `provider:${model}`,
    supported: Boolean(config),
    command: config ? config.command : null,
    args: config ? [...config.args] : [],
    timeout_ms: input.timeoutMs || 120000,
    requested_model: config?.requestedModel || null,
    requested_model_type: config?.requestedModelType || 'unknown',
    requested_effort: config?.requestedEffort || null,
    resolved_model: resolvedModels.length === 1 ? resolvedModels[0] : null,
    resolved_models: resolvedModels,
    resolution_status: resolutionStatus,
    resolution_source: review?.resolutionSource || null,
    resolution_error: review?.resolutionError || null,
    ignored_overrides: config?.ignoredOverrides || [],
    temperature: null,
    max_output_tokens: null,
    reasoning_budget: config?.requestedEffort || null,
    working_directory_policy: config ? 'isolated_temp_directory' : null,
    configuration_control: config
      ? 'GPD controls provider CLI command, argument shape, prompt, timeout, requested model alias/pin when configured, and requested effort where supported. Exact resolved model is recorded only when the provider reports it.'
      : 'Unsupported provider; no model or CLI configuration was invoked.',
  };
}

function reviewRunProvenance({
  paperDir,
  input,
  createdAt,
  reviews,
  storedReviews,
}) {
  const requestedProviders = parseModels(input.models);
  const currentRuntime = detectCurrentRuntime(input);
  const providerConfigs = requestedProviders.map((model) => {
    const review = reviews.find((item) => item.source === `provider:${model}`) || null;
    return {
      ...providerReviewConfig(model, { ...input, paperDir }, review),
      current_runtime_match: Boolean(currentRuntime && model === currentRuntime),
      status: review ? review.status : 'not_run',
      raw_feedback_path: storedReviews.find((item) => item.reviewer === model)?.relativePath || null,
    };
  });
  const reviewerInputs = reviews.map((review) => ({
    reviewer: review.reviewer,
    source_type: reviewSourceType(review),
    source: review.source,
    status: review.status,
    raw_feedback_path: storedReviews.find((item) => item.reviewer === review.reviewer)?.relativePath || null,
  }));

  return {
    review_run_id: reviewRunId(createdAt),
    created_at: createdAt,
    gpd_command: 'gpd review-external',
    review_target: reviewTargetForPaper(paperDir),
    editable_source: '.paper/DRAFT.md',
    requested_providers: requestedProviders,
    current_runtime: requestedProviders.length > 0 ? (currentRuntime || null) : null,
    timeout_ms: input.timeoutMs || 120000,
    model_policy: 'GPD defaults to provider capability aliases for best current review, allows supported per-paper pins through config.json, and records resolved models only when provider output reports them.',
    provider_configs: providerConfigs,
    reviewer_inputs: reviewerInputs,
    context_artifacts: contextArtifactProvenance(paperDir),
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

function runProviderCommand(commandPath, args, prompt, timeoutMs, options = {}) {
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
      cwd: options.cwd || undefined,
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
  const config = resolvedProviderConfig(model, input);
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
  const result = await runProviderCommand(found, config.args, prompt, timeoutMs, {
    cwd: input.providerCwd,
  });

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

  const providerOutput = parseProviderStdout(model, config, result.stdout || '');
  const stdout = providerOutput.content;
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
    resolvedModels: providerOutput.resolvedModels,
    resolutionStatus: providerOutput.resolutionStatus,
    resolutionSource: providerOutput.resolutionSource,
    resolutionError: providerOutput.resolutionError,
  };
}

async function invokeProviderReviews(input = {}, paperDir) {
  const models = parseModels(input.models);
  if (models.length === 0) return [];
  const currentRuntime = detectCurrentRuntime(input);
  const needsPrompt = models.some((model) => model !== currentRuntime);

  const prompt = needsPrompt ? buildExternalReviewPrompt(paperDir) : '';
  const tempPrompt = needsPrompt ? writeTempPrompt(prompt, Boolean(input.dryRun)) : null;
  const providerTempDir = needsPrompt && !input.dryRun
    ? fs.mkdtempSync(path.join(os.tmpdir(), 'gpd-provider-review-'))
    : null;
  try {
    const reviews = [];
    for (const model of models) {
      if (currentRuntime && model === currentRuntime) {
        reviews.push(providerSelfReviewSkip(model, currentRuntime, input));
      } else {
        reviews.push(await invokeProvider(model, prompt, {
          ...input,
          paperDir,
          providerCwd: providerTempDir,
        }));
      }
    }
    return reviews;
  } finally {
    if (tempPrompt) fs.rmSync(tempPrompt.tempDir, { recursive: true, force: true });
    if (providerTempDir) fs.rmSync(providerTempDir, { recursive: true, force: true });
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
  if (severity === 'HIGH') return 'Default is approval before final release unless the user rejects the premise.';
  if (severity === 'MEDIUM') return 'Default is modification if the concern improves the paper without expanding scope.';
  if (severity === 'LOW') return 'Default is deferral unless the change is quick, low-risk polish.';
  if (severity === 'ACTION') return 'Treat as a tactical edit option; apply only if it maps to an approved or modified parent concern.';
  return 'Default is deferral until the user turns this into a specific approved or modified revision task.';
}

function recommendationForSeverity(severity) {
  if (severity === 'HIGH') return 'approve';
  if (severity === 'MEDIUM') return 'modify';
  if (severity === 'LOW') return 'defer';
  if (severity === 'ACTION') return 'modify';
  return 'defer';
}

function itemNumbers(items, predicate) {
  return items
    .map((item, index) => (predicate(item, index) ? String(index + 1) : null))
    .filter(Boolean);
}

function formatItemNumbers(items) {
  return items.length > 0 ? items.join(', ') : 'none';
}

function decisionViewMarkdown(items) {
  if (!items || items.length === 0) {
    return `## Decision View

**Recommended decision:** Decide whether to provide external review input or continue without external feedback.

**Why:** No reviewer supplied actionable feedback, so there is no independent review signal to approve.

**What improves:** The workflow stays explicit instead of pretending missing review is approval.

**How:** Provide review files/stdin, run provider review, or explicitly skip external feedback for this revision.
`;
  }

  const highItems = itemNumbers(items, (item) => item.severity === 'HIGH');
  const sharedItems = itemNumbers(items, (item) => (
    item.severity === 'MEDIUM'
    && Array.isArray(item.reviewers)
    && item.reviewers.length > 1
  ));
  const sharedItemSet = new Set(sharedItems);
  const mediumItems = itemNumbers(items, (item, index) => (
    item.severity === 'MEDIUM'
    && !sharedItemSet.has(String(index + 1))
  ));
  const lowItems = itemNumbers(items, (item) => item.severity === 'LOW');
  const lowText = lowItems.length > 0 ? `Defer LOW items ${formatItemNumbers(lowItems)} unless they are quick polish.` : 'No LOW items were extracted.';

  return `## Decision View

**Recommended decision:** Approve HIGH items ${formatItemNumbers(highItems)}. Modify shared MEDIUM items ${formatItemNumbers(sharedItems)} if they sharpen the same approved concern. Discuss the remaining MEDIUM items ${formatItemNumbers(mediumItems)}. ${lowText}

**Why:** HIGH items are likely to block decision usefulness, credibility, or audience trust. Shared items carry more signal because more than one reviewer converged on the concern. Tactical suggestions should stay under approved or modified concerns so revision does not add noise.

**What improves:** The paper should become easier to sponsor, easier to defend, and easier to revise because the feedback is reduced from a reviewer transcript into a ranked decision set.

**How:** For each numbered item, approve the proposed fix, constrain it, or override it. Then revise the affected artifacts named in the accepted items, regenerate the export, and rerun review/validation before treating the paper as final.
`;
}

function decisionRationaleForItem(item) {
  const affected = item.affectedArtifact || 'DRAFT';
  if (item.severity === 'HIGH') {
    return `This high-severity concern can block the paper's decision usefulness or credibility; fixing it makes ${affected} more defensible for the intended audience.`;
  }
  if (item.severity === 'MEDIUM') {
    return `This may not block the paper, but it can weaken clarity, audience fit, or persuasive force; resolving it should sharpen ${affected} without necessarily expanding scope.`;
  }
  if (item.severity === 'LOW') {
    return `This is useful polish but unlikely to change the paper's decision value; handle it only if it is quick and low-risk.`;
  }
  if (item.severity === 'ACTION') {
    return `This is a tactical edit, not a standalone strategic concern; apply it only when it supports an approved higher-level item.`;
  }
  return `The review signal is not classified clearly enough to act automatically; decide whether it should affect ${affected}.`;
}

function decisionLabelForItem(item) {
  const recommendation = item.recommendation || recommendationForSeverity(item.severity);
  const severity = item.severity && item.severity !== 'UNKNOWN' ? ` (${item.severity})` : '';
  return `${recommendation}${severity}`;
}

function proposedFixForItem(item) {
  const feedback = String(item.feedback || '').toLowerCase();
  const reviewerFix = String(item.reviewerSuggestedFix || '').trim();
  if (reviewerFix) return reviewerFix;
  if (/front-loaded repetition|reader patience|opening.*executive summary|executive summary.*section 1|thesis.*stated.*three/.test(feedback)) {
    return 'Separate the opening from the executive summary and Section 1: make the opening establish the operating-model shift and stakes, make the executive summary state the thesis and ask, and let Section 1 add only new evidence or pressure.';
  }
  if (/exception trigger|definition of an exception|human-by-exception.*abstract|human by exception.*abstract/.test(feedback)) {
    return 'Define exception triggers concretely: unresolved boundary conflicts, failed validation, material data or identity exposure, model or third-party dependency changes, resilience impact, regulatory interpretation, or decisions outside approved patterns.';
  }
  if (/safely faster|safe acceleration|cycle time|time-to-production|rework|defect|escalation rate/.test(feedback)) {
    return 'Anchor safe acceleration in a small set of baselineable measures, such as design/integration cycle time, routine escalation rate, reuse of context packs, traceability evidence completeness, and issues caught by validation harnesses before human review. State that exact targets belong in the follow-on capability charter.';
  }
  if (/section 4.*too much|eight distinct sub-topics|lost the thread|too much in one section/.test(feedback)) {
    return 'Split or tighten Section 4 so it first defines the operating layer, then separately handles how it works, how it avoids bureaucracy, and how it is governed. Move secondary detail into shorter paragraphs or the capability section.';
  }
  if (/platform engineering objection|why architecture and not engineering platforms|platform.*objection|delivery substrate|cross-domain decision semantics|cross-domain interaction contract/.test(feedback)) {
    return 'Answer the ownership objection directly: platform and engineering own delivery substrate and tool integration; architecture owns cross-domain decision semantics, constraints, evidence logic, and exception rules. Add one causal example showing why platform automation alone cannot decide cross-domain business, risk, data, and resilience trade-offs.';
  }
  if (/architect as builder|builder credibility|principal engineer|product designer|repo management|ci\/cd|executable policy/.test(feedback)) {
    return 'Add a credibility note that this is a team capability and development path, not an instant expectation for every architect. Name the needed builder skills, the likely talent sources, and the fact that current architecture teams may need reskilling and closer partnership with engineering/platform teams.';
  }
  if (/talent gap|unrealistically broad|where these people come from|staffing|four-role architect|four substantial professions/.test(feedback)) {
    return 'Add a credibility note that the role requires a changed staffing and development model: some capability must be built from senior engineering, platform, product, and domain talent, and architects should not be expected to be equally strong in every mode on day one.';
  }
  if (/accountability when the operating layer is wrong|when the layer is wrong|constraint passes.*bad outcome|stale context.*incorrect decision|three lines of defense/.test(feedback)) {
    return 'Add a failure-accountability paragraph: when the operating layer is wrong, ownership remains with the accountable human function; incidents should trigger evidence review, constraint/context updates, rollback or remediation, and periodic independent validation proportionate to risk.';
  }
  if (/decision memory.*resilience|stale or conflicting memory|conflicting boundary assumptions|accidental architecture hardens/.test(feedback)) {
    return 'Frame decision memory as a resilience control: current, versioned, and reviewable decision memory helps prevent conflicting agent assumptions, supports diagnosis and rollback, and creates a feedback loop when stale context causes failure.';
  }
  if (/vendor reliance|vendor-affiliated|anti-vendor|direction of travel|independent measurement/.test(feedback)) {
    return 'Add a short caveat that vendor-affiliated trend evidence is used for direction of travel and current practice signals, not as independent proof of the mandate.';
  }
  if (/anti-bureaucracy test|templates and meetings|strongest sentences|surface it/.test(feedback)) {
    return 'Move the anti-bureaucracy test into the executive summary or opening ask so readers see early that the proposal is meant to reduce repeated ambiguity and routine review overhead, not add ceremony.';
  }
  if (/bureaucracy|overhead|approval ceremon|larger, more durable|governance/.test(feedback)) {
    return 'Add a comparative overhead argument: the operating layer is not less control; it replaces repeated meeting-based review for routine decisions with reusable constraints, context, evidence, and human exception review. Name the concrete overhead it should reduce, such as re-litigation of settled decisions and bespoke review of routine integration choices.';
  }
  if (/transition|current state|existing.*forum|review board|legacy gate|escalation/.test(feedback)) {
    return 'Add a short transition paragraph: existing architecture forums remain for material, high-risk, and exception decisions while routine decisions migrate only after context packs, executable constraints, evidence capture, and escalation paths are mature enough to trust.';
  }
  if (/cost|funding|investment|re-?org|multi-year|multi-million|capability shift|program/.test(feedback)) {
    return 'Add a bounded scope paragraph and reflect it in the ask: this paper seeks agreement on the future architecture mandate and operating-layer direction, not approval of a full re-org, budget, or implementation plan. Name that a phased capability buildout and separate investment case would follow.';
  }
  if (/sonar|code review|verification bottleneck|per-commit|architecture review|different bottleneck/.test(feedback)) {
    return 'Reframe the source as evidence of a broader verification-capacity problem, then bridge explicitly to architecture through decision volume: agents increase design proposals, integration choices, dependency decisions, and AI-runtime configuration decisions faster than human review forums can absorb.';
  }
  if (/mental model|abstract|what is this|versioned git|platform with an api|policy-as-code|knowledge base/.test(feedback)) {
    return 'Add one concrete mental model for the architecture operating layer, such as a policy-as-code and curated-knowledge platform that engineers and agents query at decision time, while keeping implementation choices open.';
  }
  if (/four-decision|ask.*parallel|decisions are on the table|separate ask/.test(feedback)) {
    return 'Refactor the ask into parallel executive decisions: approve the mandate shift, approve investment in the operating-layer capability, and approve new measures/incentives. Treat enablement-with-evidence as a property of the capability, not a separate decision.';
  }
  if (/g-sib scope|gsib scope|g-sib.*typography|gsib.*typography|systemically important|cross-jurisdiction|recovery|resolution|heterogeneous business lines/.test(feedback)) {
    return 'Clarify why G-SIB scope matters: cross-jurisdictional obligations, systemic-importance expectations, heterogenous business lines, resilience and recovery implications, and higher evidentiary burden make the mandate more consequential than in a generic enterprise.';
  }
  if (/capability family names|forgettable|taxonomy labels|actionable handles|golden paths/.test(feedback)) {
    return 'Rename or introduce the four capability families with more action-oriented handles, while preserving the precise definitions underneath.';
  }
  if (/adlc.*acronym|acronym that does no work|barely appears|drop the acronym/.test(feedback)) {
    return 'Either use ADLC consistently as the named delivery model or remove the acronym and use plain "agentic delivery" language so the reader is not asked to carry unused terminology.';
  }
  if (/citation rigor|bracketed source ids|cannot click|per-citation links/.test(feedback)) {
    return 'Make source lookup easier by adding per-source links or a compact source-id map for cited IDs, at least for the most important references used in body prose.';
  }
  if (/deliverable overlap|deliverable bloat|togaf|artifact catalog|product description|product families/.test(feedback)) {
    return 'Recast the deliverables as a smaller set of operating-layer capabilities with outcomes, then list artifacts as examples under those capabilities instead of presenting a long taxonomy.';
  }
  if (/governor|recursive accountability|who governs|governs the harnesses/.test(feedback)) {
    return 'Add an accountability paragraph for the operating layer itself: name ownership, change control, evidence review, and periodic validation of constraints, harnesses, context packs, and decision memory.';
  }
  if (/accidental architecture|shadow context|context packs|hallucinating|infer/.test(feedback)) {
    return 'Add the shadow-context risk: if architects do not provide authoritative context packs and decision memory, agents will infer boundaries from local code and create accidental architecture at machine speed.';
  }
  if (/cross-agent|coordination|conflicting boundary decisions/.test(feedback)) {
    return 'Add cross-agent coordination to the decision-memory capability: shared memory should prevent separate agents from making conflicting boundary or integration decisions in isolation.';
  }
  if (/harness effectiveness|productivity metric|caught by.*harness/.test(feedback)) {
    return 'Add a metric for operating-layer quality: percentage of design flaws caught by automated harnesses versus human exception review.';
  }
  if (item.severity === 'ACTION') {
    return 'Apply this only if it supports an approved higher-level feedback item; otherwise leave it as a tactical suggestion.';
  }
  return 'Needs human synthesis before revision. The CLI could not derive a concern-specific proposed fix with enough confidence.';
}

function proposedFixConfidenceForItem(item) {
  const fix = proposedFixForItem(item);
  if (/^Needs human synthesis before revision\./.test(fix)) return 'low';
  if (item.reviewerSuggestedFix) return 'high';
  if (item.severity === 'ACTION') return 'medium';
  return 'medium';
}

function whyProposedFixAddressesItem(item) {
  const feedback = String(item.feedback || '').toLowerCase();
  if (proposedFixConfidenceForItem(item) === 'low') {
    return 'The concern is specific enough to require a human-written remedy; applying a generic fix would risk changing the wrong part of the paper.';
  }
  if (/front-loaded repetition|reader patience|opening.*executive summary|executive summary.*section 1/.test(feedback)) {
    return 'The fix reduces repeated thesis setup by giving the opening, executive summary, and first section distinct jobs.';
  }
  if (/exception trigger|definition of an exception|human-by-exception.*abstract|human by exception.*abstract/.test(feedback)) {
    return 'The fix makes the human-by-exception model operational by naming the kinds of decisions that leave the automated path.';
  }
  if (/safely faster|safe acceleration|cycle time|time-to-production|rework|defect|escalation rate/.test(feedback)) {
    return 'The fix turns the value claim into something a sponsor can baseline and later test without forcing a full KPI framework into the paper.';
  }
  if (/section 4.*too much|eight distinct sub-topics|lost the thread|too much in one section/.test(feedback)) {
    return 'The fix addresses reader overload by separating definition, mechanism, objection handling, and governance instead of stacking them in one passage.';
  }
  if (/platform engineering objection|why architecture and not engineering platforms|platform.*objection|delivery substrate|cross-domain decision semantics|cross-domain interaction contract/.test(feedback)) {
    return 'The fix answers why architecture owns cross-domain decision semantics while platform and engineering own the delivery substrate and integration path.';
  }
  if (/architect as builder|builder credibility|principal engineer|product designer|repo management|ci\/cd|executable policy|talent gap|four-role architect/.test(feedback)) {
    return 'The fix makes the capability credible by framing it as a team development path rather than pretending every current architect already has all required skills.';
  }
  if (/accountability when the operating layer is wrong|when the layer is wrong|constraint passes.*bad outcome|stale context.*incorrect decision/.test(feedback)) {
    return 'The fix closes the control-loop objection by naming what happens when the operating layer itself produces or permits a bad decision.';
  }
  if (/g-sib scope|gsib scope|g-sib.*typography|gsib.*typography|systemically important|cross-jurisdiction/.test(feedback)) {
    return 'The fix earns the G-SIB scope by separating broad regulated-bank obligations from the higher consequence and complexity of systemic institutions.';
  }
  if (/decision memory.*resilience|stale or conflicting memory|conflicting boundary assumptions|accidental architecture hardens/.test(feedback)) {
    return 'The fix reframes decision memory from documentation into a control that helps prevent, diagnose, and correct conflicting machine-speed decisions.';
  }
  if (/vendor reliance|vendor-affiliated|anti-vendor|direction of travel|independent measurement/.test(feedback)) {
    return 'The fix aligns the source caveat with the author persona by keeping vendor material directional rather than treating it as proof.';
  }
  if (/anti-bureaucracy test|templates and meetings|strongest sentences|surface it/.test(feedback)) {
    return 'The fix moves a strong objection-handling sentence earlier so executive readers understand that the proposal reduces routine ceremony instead of adding it.';
  }
  if (item.reviewerSuggestedFix) {
    return 'The fix comes from the reviewer-supplied remedy for this same concern, so it is safer than choosing a generic canned action.';
  }
  return 'The fix maps to the same concern category as the reviewer feedback and should be reviewed before revision.';
}

function guardrailForItem(item) {
  const feedback = String(item.feedback || '').toLowerCase();
  if (/accountability when the operating layer is wrong|when the layer is wrong|constraint passes.*bad outcome|stale context.*incorrect decision|three lines of defense/.test(feedback)) {
    return 'Do not imply the operating layer eliminates accountable ownership; keep failure handling explicit, inspectable, and proportionate to risk.';
  }
  if (/vendor reliance|vendor-affiliated|anti-vendor|direction of travel|independent measurement/.test(feedback)) {
    return 'Do not overcorrect by removing useful current-practice signals; qualify them instead.';
  }
  if (/anti-bureaucracy test|templates and meetings|strongest sentences|surface it/.test(feedback)) {
    return 'Do not duplicate the full Section 4 argument in the executive summary; surface only the test.';
  }
  if (/governor|recursive accountability|who governs|governs the harnesses/.test(feedback)) {
    return 'Do not create a new unchecked governance body; make accountability inspectable, change-controlled, and proportionate to risk.';
  }
  if (/talent gap|unrealistically broad|where these people come from|staffing/.test(feedback)) {
    return 'Do not imply every architect must instantly become a full SME, principal engineer, product owner, and product designer; frame this as a team capability and development path.';
  }
  if (/safely faster|safe acceleration|cycle time|time-to-production|rework|defect|escalation rate/.test(feedback)) {
    return 'Do not overload the paper with a full KPI framework; use a few measures to make the value proposition concrete.';
  }
  if (/bureaucracy|overhead|approval ceremon|governance/.test(feedback)) {
    return 'Do not claim the model eliminates governance or bureaucracy; argue that it changes the form of control so it scales better.';
  }
  if (/transition|current state|existing.*forum|review board|legacy gate/.test(feedback)) {
    return 'Do not specify detailed forum retirement, ownership charts, or migration timelines without stronger organizational facts.';
  }
  if (/cost|funding|investment|re-?org|multi-year|multi-million|program/.test(feedback)) {
    return 'Do not turn the paper into a budget request, org design, or delivery plan; keep the fix at mandate and approval-boundary level.';
  }
  if (/sonar|code review|verification bottleneck|architecture review/.test(feedback)) {
    return 'Do not imply code-review data directly proves architecture-review failure; make the bridge explicit and bounded.';
  }
  if (/mental model|abstract|policy-as-code|knowledge base/.test(feedback)) {
    return 'Do not lock the paper into a specific implementation architecture or vendor-style product design.';
  }
  if (/deliverable overlap|deliverable bloat|artifact catalog/.test(feedback)) {
    return 'Do not delete important regulated-industry evidence needs; compress the framing without losing control substance.';
  }
  if (/g-sib|gsib|systemic|cross-jurisdiction/.test(feedback)) {
    return 'Do not overclaim that every cited obligation is uniquely G-SIB-only; separate general regulated-bank obligations from G-SIB-specific stakes.';
  }
  if (item.severity === 'HIGH') {
    return 'Address the blocker without broadening the paper into a white paper or implementation plan.';
  }
  if (item.severity === 'MEDIUM') {
    return 'Keep the edit proportionate; do not expand scope for a clarity improvement.';
  }
  if (item.severity === 'ACTION') {
    return 'Do not apply isolated tactical edits that create noise or conflict with the accepted revision strategy.';
  }
  return 'Do not revise automatically without a user decision.';
}

function conciseFeedbackForPlan(item) {
  let feedback = cleanTableCell(item.feedback || '');
  feedback = feedback.replace(/^(HIGH|MEDIUM|LOW|ACTION):\s*/i, '');
  if (feedback.includes(' - ')) {
    const splitAt = feedback.indexOf(' - ');
    const title = feedback.slice(0, splitAt).trim();
    const detail = feedback.slice(splitAt + 3).trim();
    feedback = detail ? `${title}: ${detail}` : title;
  }
  if (feedback.length > 700) {
    const excerpt = feedback.slice(0, 700);
    const sentenceEnd = Math.max(
      excerpt.lastIndexOf('. '),
      excerpt.lastIndexOf('? '),
      excerpt.lastIndexOf('! '),
    );
    feedback = sentenceEnd > 240
      ? excerpt.slice(0, sentenceEnd + 1).trim()
      : `${excerpt.slice(0, 697).trim()}...`;
  }
  return feedback;
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

function extractReviewerSuggestedFix(lines) {
  const fixes = [];
  for (const line of lines) {
    const trimmed = trimMarkdownMarkers(line);
    const match = trimmed.match(/^(?:fix|suggested fix|recommendation|recommended fix)\s*:\s*(.+)$/i);
    if (match && match[1].trim()) fixes.push(trimMarkdownMarkers(match[1]));
  }
  return fixes.join(' ');
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
      recommendation: 'defer',
      proposedHandling: review.status === 'captured'
        ? handlingForSeverity('UNKNOWN')
        : 'Check whether this provider result should be ignored, retried, or replaced.',
      affectedArtifact: 'FEEDBACK-EXTERNAL',
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
    const reviewerSuggestedFix = extractReviewerSuggestedFix(body);
    items.push({
      reviewer: review.reviewer,
      severity,
      feedback,
      reviewerSuggestedFix,
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
    recommendation: 'defer',
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

function planRecommendationForSeverity(severity) {
  if (severity === 'HIGH') return 'approve';
  if (severity === 'MEDIUM') return 'modify';
  if (severity === 'LOW') return 'defer';
  if (severity === 'INFO') return 'defer';
  return 'modify';
}

function planTypeForItem(item) {
  if (item.severity === 'INFO' || item.affectedArtifact === 'FEEDBACK-EXTERNAL') return 'Tooling Issue';
  if (item.severity === 'LOW') return 'Review Note';
  if (item.severity === 'SUGGESTION') return 'Unmapped Suggestion';
  return 'Concern';
}

function concernTitleForItem(item) {
  const title = itemTitle(item) || conciseFeedbackForPlan(item);
  return cleanTableCell(title).replace(/^(HIGH|MEDIUM|LOW|ACTION|UNKNOWN):\s*/i, '') || 'External review concern';
}

function whatImprovesForItem(item) {
  const affected = item.affectedArtifact || 'DRAFT';
  if (item.severity === 'HIGH') {
    return `The paper becomes more decision-useful and defensible for the intended audience, especially in ${affected}.`;
  }
  if (item.severity === 'MEDIUM') {
    return `The paper should become clearer, sharper, or easier to trust without requiring a major scope change.`;
  }
  if (item.severity === 'LOW') {
    return `The paper may gain polish or readability if the change is quick and low-risk.`;
  }
  if (item.severity === 'INFO') {
    return 'The review record becomes cleaner and less likely to confuse tool behavior with paper feedback.';
  }
  return 'The next revision has a clearer implementation option, but the author should confirm that it supports an approved concern.';
}

function riskIfHandledBadlyForItem(item) {
  const guardrail = guardrailForItem(item);
  if (guardrail && !/^Do not revise automatically/.test(guardrail)) return guardrail;
  if (item.severity === 'HIGH') return 'Over-correcting can dilute the paper, expand scope, or replace a specific argument with generic safe language.';
  if (item.severity === 'MEDIUM') return 'A disproportionate fix can add length or distract from the main ask.';
  if (item.severity === 'LOW') return 'Polish work can consume revision time without improving decision usefulness.';
  return 'Acting on this without user judgment can change the wrong part of the paper.';
}

function proposedEditTextForAction(action) {
  const fix = String(action.reviewerSuggestedFix || '').trim();
  if (fix) return fix;
  return conciseFeedbackForPlan(action);
}

function createPlanConcern(item) {
  const proposedHandling = proposedFixForItem(item);
  return {
    type: planTypeForItem(item),
    title: concernTitleForItem(item),
    severity: item.severity === 'INFO' ? 'TOOLING' : (item.severity || 'UNKNOWN'),
    sources: item.reviewer || (item.reviewers || []).join(', ') || 'external review',
    recommendation: planRecommendationForSeverity(item.severity),
    why: decisionRationaleForItem(item),
    improves: whatImprovesForItem(item),
    risk: riskIfHandledBadlyForItem(item),
    proposedHandling,
    proposedEdits: proposedHandling && !/^Needs human synthesis/.test(proposedHandling) ? [proposedHandling] : [],
    reviewerEvidence: [conciseFeedbackForPlan(item)],
    affectedArtifacts: item.affectedArtifact || 'DRAFT',
    sourceItem: item,
  };
}

function createSuggestionConcern(action) {
  const edit = proposedEditTextForAction(action);
  return {
    type: 'Unmapped Suggestion',
    title: concernTitleForItem(action),
    severity: 'SUGGESTION',
    sources: action.reviewer || 'external review',
    recommendation: 'defer',
    why: 'This is a tactical reviewer suggestion, but it did not map cleanly to a substantive concern. It should not drive revision by itself.',
    improves: 'If the author maps it to an approved concern, it can become a concrete edit instead of an isolated tweak.',
    risk: 'Applying isolated tactical suggestions can create noise, length, or inconsistency with the accepted revision strategy.',
    proposedHandling: 'Hold until the user maps this suggestion to an approved concern or explicitly approves it as a standalone edit.',
    proposedEdits: [edit],
    reviewerEvidence: [cleanTableCell(action.feedback || edit)],
    affectedArtifacts: action.affectedArtifact || 'DRAFT',
    sourceItem: action,
  };
}

function mapActionsToConcerns(concerns, actions) {
  const mapped = [...concerns];
  for (const action of actions) {
    let bestIndex = -1;
    let bestScore = 0;
    for (let i = 0; i < mapped.length; i += 1) {
      const concern = mapped[i];
      const score = topicSimilarity(
        action.feedback,
        `${concern.title} ${concern.reviewerEvidence.join(' ')} ${concern.proposedHandling}`,
      );
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex >= 0 && bestScore >= 0.18) {
      const edit = proposedEditTextForAction(action);
      mapped[bestIndex].proposedEdits.push(edit);
      mapped[bestIndex].reviewerEvidence.push(cleanTableCell(action.feedback || edit));
      mapped[bestIndex].sources = [
        ...mapped[bestIndex].sources.split(',').map((item) => item.trim()).filter(Boolean),
        action.reviewer,
      ].filter(Boolean).filter((item, index, array) => array.indexOf(item) === index).join(', ');
    } else {
      mapped.push(createSuggestionConcern(action));
    }
  }
  return mapped;
}

function feedbackPlanConcerns(feedbackItems) {
  const items = feedbackItems || [];
  const concerns = items
    .filter((item) => item.severity !== 'ACTION')
    .map(createPlanConcern);
  const actions = items.filter((item) => item.severity === 'ACTION');
  return mapActionsToConcerns(concerns, actions);
}

function decisionSummaryMarkdown(concerns) {
  if (!concerns || concerns.length === 0) {
    return `## Decision View

No actionable concerns were extracted. Decide whether to rerun external review, provide review text manually, or explicitly proceed without external feedback.

| # | Concern | Type | Severity | Recommendation | User Decision |
|---|---------|------|----------|----------------|---------------|
| - | No actionable concerns extracted | Tooling Issue | TOOLING | defer | pending |
`;
  }
  const rows = concerns.map((concern, index) => (
    `| ${index + 1} | ${cleanTableCell(concern.title)} | ${cleanTableCell(concern.type)} | ${cleanTableCell(concern.severity)} | ${cleanTableCell(concern.recommendation)} | pending |`
  )).join('\n');
  return `## Decision View

Review the concerns below. Use \`approve\`, \`modify\`, \`defer\`, or \`reject\` for each concern. Proposed edits are implementation options under a concern; they are not separate decisions unless listed as an unmapped suggestion.

| # | Concern | Type | Severity | Recommendation | User Decision |
|---|---------|------|----------|----------------|---------------|
${rows}
`;
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
  const suggestedFixes = [
    ...(existing.suggestedFixes || [existing.reviewerSuggestedFix].filter(Boolean)),
    ...(incoming.suggestedFixes || [incoming.reviewerSuggestedFix].filter(Boolean)),
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
    reviewerSuggestedFix: [...new Set(suggestedFixes)].join(' '),
    suggestedFixes: [...new Set(suggestedFixes)],
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
  const reviewDir = path.join(paperDir, '.paper', 'feedback-external');
  const stored = [];
  for (const review of reviews) {
    const fileName = `${safeTimestamp(createdAt)}-${reviewerSlug(review.reviewer)}.md`;
    const filePath = path.join(reviewDir, fileName);
    if (!dryRun) fs.mkdirSync(reviewDir, { recursive: true });
    writeFile(filePath, storedReviewMarkdown({ review, createdAt }), dryRun);
    stored.push({
      reviewer: review.reviewer,
      path: filePath,
      relativePath: path.join('.paper', 'feedback-external', fileName),
    });
  }
  return stored;
}

function externalReviewsMarkdown({
  reviews, paperDir, createdAt, storedReviews = [], combinedItems = [], reviewRunPath = null,
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

  return `# External Feedback

**Reviewed at:** ${createdAt}
**Reviewers:** ${reviewerList}
**Draft reviewed:** ${draftReviewed}
**Review run provenance:** ${reviewRunPath ? `\`${reviewRunPath}\`` : 'Not recorded'}

## Review Prompt Summary

External review text was collected by \`gpd review-external\` from ${modeText}. Provider invocation, when used, sends the generated review prompt to selected installed CLIs and captures their stdout/stderr. The review-run provenance file records the requested providers, current-runtime skip setting, timeout, safe provider command/argument shape, context artifacts, raw feedback paths, requested model aliases or pins, requested effort where supported, and resolved model evidence when the provider reports it. This command records captured feedback and creates a pending feedback plan; it does not revise the draft.

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
  const concerns = feedbackPlanConcerns(combinedItems);
  const sections = concerns.length === 0
    ? [
      '### 1. Tooling Issue: No external review input was provided',
      '',
      '- **Type:** Tooling Issue',
      '- **Severity:** TOOLING',
      '- **Source(s):** gpd review-external',
      '- **Recommendation:** defer',
      '- **Why this matters:** No reviewer supplied actionable feedback, so the workflow should not treat missing independent review as approval.',
      '- **What improves if addressed:** The author can decide whether to rerun review, provide review text manually, or explicitly proceed without external feedback.',
      '- **Risk if handled badly:** Treating missing review as approval can hide quality risk.',
      '- **Proposed handling:** Provide review files/stdin, run provider review, or explicitly skip external feedback for this revision.',
      '- **Proposed edits:**',
      '  1. No draft edit proposed.',
      '- **Reviewer evidence:** No external review input was provided.',
      '- **Affected artifacts:** FEEDBACK-EXTERNAL',
      '- **User Decision:** pending',
      '- **User Constraint:** none yet',
      '',
    ].join('\n')
    : concerns.map((concern, index) => {
      const edits = concern.proposedEdits.length > 0
        ? concern.proposedEdits.map((edit, editIndex) => `  ${editIndex + 1}. ${cleanTableCell(edit)}`).join('\n')
        : '  1. No concrete edit proposed; user synthesis required.';
      const evidence = concern.reviewerEvidence
        .slice(0, 3)
        .map((item) => `  - ${cleanTableCell(item)}`)
        .join('\n');
      return [
        `### ${index + 1}. ${concern.type}: ${cleanTableCell(concern.title)}`,
        '',
        `- **Type:** ${cleanTableCell(concern.type)}`,
        `- **Severity:** ${cleanTableCell(concern.severity)}`,
        `- **Source(s):** ${cleanTableCell(concern.sources)}`,
        `- **Recommendation:** ${cleanTableCell(concern.recommendation)}`,
        `- **Why this matters:** ${cleanTableCell(concern.why)}`,
        `- **What improves if addressed:** ${cleanTableCell(concern.improves)}`,
        `- **Risk if handled badly:** ${cleanTableCell(concern.risk)}`,
        `- **Proposed handling:** ${cleanTableCell(concern.proposedHandling)}`,
        '- **Proposed edits:**',
        edits,
        '- **Reviewer evidence:**',
        evidence || '  - None captured.',
        `- **Affected artifacts:** ${cleanTableCell(concern.affectedArtifacts)}`,
        '- **User Decision:** pending',
        '- **User Constraint:** none yet',
        '',
      ].join('\n');
    }).join('\n');
  const incorporate = concerns.length > 0
    ? '- Recommended only for concerns whose `Recommendation` is `approve` and whose `User Decision` is `approve` or `modify`.'
    : '- None.';
  const defer = concerns.length > 0
    ? '- Recommended for review notes, unmapped suggestions, or any concern whose `User Decision` is `defer`.'
    : '- None automatically.';
  const decisions = reviews.length > 0
    ? '- Review each concern and record `approve`, `modify`, `defer`, or `reject` in `User Decision` before revision.'
    : '- Decide whether to provide external review input or continue without it.';

  return `# Feedback Handling Plan

**Created:** ${createdAt}
**Based on:** \`.paper/FEEDBACK-EXTERNAL.md\`
**Status:** Pending user approval

## Summary

\`gpd review-external\` captured external review input, grouped reviewer feedback into the concern-first decision queue below, and stopped at the approval gate. No draft or upstream artifact has been changed.

Review the concerns below in the CLI or in this file. Proposed edits are implementation options under a concern; they are not separate decisions unless listed as an unmapped suggestion. Full reviewer text remains in \`FEEDBACK-EXTERNAL.md\`.

${decisionSummaryMarkdown(concerns)}

## Proposed Handling

${sections}

## Below-Target Items

| # | Issue | Target Bar Impact | Recommendation | Reason |
|---|-------|-------------------|----------------|--------|
| 1 | External review may identify below-target issues. | Unknown until the user evaluates captured feedback. | modify | External feedback is captured as proposed handling, not automatic rewrite authority. |

## Approved Or Modified

${incorporate}

## Rejected

- None automatically.

## Deferred

${defer}

## User Decisions Needed

${decisions}

## Approval Gate

Before changing \`.paper/DRAFT.md\` or upstream artifacts, present this plan to the user and ask how to proceed.

Options:

- Approve a concern
- Modify a concern with a user constraint
- Defer a concern
- Reject a concern
- Revise the handling plan
- Reject external feedback
`;
}

function updateFeedbackState(paperDir, dryRun) {
  const current = status({ paper: paperDir });
  const state = current.machineState || defaultMachineState({ strategyStatus: current.strategyStatus || 'Go' });
  const nextState = {
    ...state,
    status: 'Feedback Pending',
    current_stage: 'External Review',
    last_completed_stage: 'External Review Capture',
    last_activity: new Date().toISOString(),
    suggested_next_command: '/gpd-feedback',
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
  const feedbackConcerns = feedbackPlanConcerns(feedbackItems);
  const storedReviews = storeIndividualReviews(paperDir, reviews, createdAt, dryRun);
  const reviewRun = reviewRunProvenance({
    paperDir,
    input: reviewInput,
    createdAt,
    reviews,
    storedReviews,
  });
  const reviewRunPath = path.join(paperDir, '.paper', 'EXTERNAL-REVIEW-RUN.json');
  const relativeReviewRunPath = '.paper/EXTERNAL-REVIEW-RUN.json';

  writeFile(
    reviewRunPath,
    `${JSON.stringify(reviewRun, null, 2)}\n`,
    dryRun,
  );
  writeFile(
    path.join(paperDir, '.paper', 'FEEDBACK-EXTERNAL.md'),
    externalReviewsMarkdown({
      reviews,
      paperDir,
      createdAt,
      storedReviews,
      combinedItems: feedbackItems,
      reviewRunPath: relativeReviewRunPath,
    }),
    dryRun,
  );
  const feedbackPlanPath = path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md');
  const previousFeedbackPlan = readIfExists(feedbackPlanPath);
  const feedbackPlan = [
    feedbackPlanMarkdown({ reviews, createdAt, feedbackItems }),
    preservedPriorMarkdown('Prior Feedback Plan', previousFeedbackPlan),
  ].filter(Boolean).join('\n\n');
  writeFile(feedbackPlanPath, feedbackPlan, dryRun);
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
    feedbackRecommendations: feedbackConcerns.map((item, index) => ({
      index: index + 1,
      feedback: item.title,
      reviewers: item.sources,
      recommendation: item.recommendation,
      severity: item.severity,
    })),
    reviewers: reviews.map((review) => ({
      reviewer: review.reviewer,
      source: review.source,
      status: review.status,
    })),
    reviewRunPath,
    externalReviewsPath: path.join(paperDir, '.paper', 'FEEDBACK-EXTERNAL.md'),
    feedbackPlanPath: path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md'),
    next: '/gpd-feedback',
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
    console.log('pending concerns:');
    for (const item of result.feedbackRecommendations) {
      console.log(`- ${item.index}. ${item.severity || '-'} ${item.recommendation} [${item.reviewers}]: ${item.feedback}`);
    }
  }
  console.log(`review run: ${result.reviewRunPath}`);
  console.log(`external feedback: ${result.externalReviewsPath}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`next: ${result.next}`);
}

module.exports = {
  buildExternalReviewPrompt,
  formatExternalReviewProgress,
  reviewExternal,
  printExternalReviewResult,
};
