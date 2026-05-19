#!/usr/bin/env node
'use strict';

const {
  installAssets,
  doctor,
  packageVersion,
} = require('./lib/installer');
const {
  initPaper,
  importPaper,
  exportPaper,
  printExport,
  reviewExternal,
  printExternalReviewResult,
  status,
  printStatus,
  nextAction,
  printNext,
  validate,
  printValidation,
  validateArtifact,
  printArtifactValidation,
  listMarkdownItems,
  formatExternalReviewProgress,
  reviewPack,
  printReviewPack,
  captureFeedback,
  printFeedbackCapture,
  createSnapshot,
  printSnapshot,
  restoreSnapshot,
  printRestore,
  prepareRevision,
  printRevisionPreparation,
} = require('./lib/workspace');

function printHelp() {
  console.log(`Usage: gpd <command> [runtime] [options]

Commands:
  install [claude|codex]       Install GPD assets into a runtime
  update [claude|codex]        Update installed GPD assets from this package
  doctor [claude|codex]        Validate an installed runtime
  init                         Create a new paper workspace
  import                       Import an existing paper folder/file into a workspace
  export                       Export reviewed draft to .paper/exports/FINAL.md
  review-pack                  Show the one file to review and how to comment
  feedback                     Capture reader comments; /gpd-review evaluates paper quality
  revise                       Prepare revision by snapshotting current paper state
  snapshot                     Preserve current paper artifacts before risky work
  restore                      Restore paper artifacts from a snapshot
  review-external              Collect external review text into review artifacts
  status                       Show current paper workspace state
  next                         Show only the next recommended action and why
  validate                     Validate current paper workspace state
  validate-artifact            Validate one GPD artifact contract
  list-audiences               List reusable audience personas
  list-profiles                List reusable author profiles
  version                      Print GPD version
  help                         Show this help

Options:
  --target DIR                 Override runtime target directory
  --location DIR               Parent location for init/import
  --slug NAME                  Paper directory name
  --title TITLE                Paper title for init/import
  --source PATH                Source folder/file for import
  --max-file-bytes BYTES       Import skip threshold for individual source files
  --review-file REVIEWER=FILE  External review file to collect; repeatable
  --models LIST                Invoke external reviewer CLIs, comma-separated
  --current-runtime NAME       Exclude current runtime from external provider review
  --timeout-ms MS              External reviewer timeout in milliseconds
  --reviewer NAME              Reviewer name for stdin review input
  --reason REASON              Snapshot reason, e.g. before_substantive_revision
  --snapshot REV               Snapshot ID or .paper/versions path to restore
  --trigger ARTIFACT           Artifact or event that triggered a snapshot
  --notes TEXT                 Human note for snapshot metadata
  --stdin                      Read one external review from stdin
  --paper DIR                  Existing paper directory for next/status/validate
  --path FILE                  Artifact path for validate-artifact
  --json                       Print JSON for list/next/status/validate
  --semantic                   Include deterministic semantic gates in validate
  --force                      Allow export when REVIEW.md is not Ready
  --dry-run                    Show planned changes without writing
  --no-backup                  Do not back up changed installed files

Examples:
  gpd install claude
  gpd install codex --dry-run
  gpd update claude
  gpd doctor codex
  gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
  gpd import --source ~/drafts/paper --location ~/papers --slug metadata-strategy
  gpd review-pack --paper ~/papers/metadata-strategy
  gpd feedback --paper ~/papers/metadata-strategy
  gpd revise --paper ~/papers/metadata-strategy --trigger .paper/FEEDBACK-PLAN.md
  gpd snapshot --paper ~/papers/metadata-strategy --reason before_substantive_revision
  gpd restore --paper ~/papers/metadata-strategy --snapshot REV-20260519T143205123-before-substantive-revision
  gpd review-external --paper ~/papers/metadata-strategy --review-file claude=/tmp/claude-review.md
  gpd review-external --paper ~/papers/metadata-strategy --models claude,codex,gemini --current-runtime codex
  gpd export --paper ~/papers/metadata-strategy
  gpd status --paper ~/papers/metadata-strategy
  gpd next --paper ~/papers/metadata-strategy
  gpd validate
  gpd validate --semantic --paper ~/papers/metadata-strategy
  gpd validate-artifact --path ~/papers/metadata-strategy/.paper/STATE.json
  gpd list-audiences

Review distinction:
  /gpd-review evaluates the paper. gpd feedback captures reader comments.
`);
}

function parseRuntimeAndOptions(argv) {
  const args = { backup: true };
  const rest = [...argv];

  if (rest[0] && !rest[0].startsWith('-')) {
    args.runtime = rest.shift();
  }

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-backup') args.backup = false;
    else if (arg === '--target') {
      args.target = rest[i + 1];
      i += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return args;
}

function parseWorkspaceOptions(argv) {
  const args = { reviewFiles: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--semantic') args.semantic = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--stdin') args.stdin = true;
    else if (arg === '--location') {
      args.location = argv[i + 1];
      i += 1;
    } else if (arg === '--slug') {
      args.slug = argv[i + 1];
      i += 1;
    } else if (arg === '--title') {
      args.title = argv[i + 1];
      i += 1;
    } else if (arg === '--source') {
      args.source = argv[i + 1];
      i += 1;
    } else if (arg === '--max-file-bytes') {
      args.maxFileBytes = Number(argv[i + 1]);
      if (!Number.isFinite(args.maxFileBytes) || args.maxFileBytes < 1) {
        throw new Error('--max-file-bytes must be a positive number');
      }
      i += 1;
    } else if (arg === '--review-file') {
      args.reviewFiles.push(argv[i + 1]);
      i += 1;
    } else if (arg === '--models') {
      args.models = argv[i + 1];
      i += 1;
    } else if (arg === '--current-runtime') {
      args.currentRuntime = argv[i + 1];
      i += 1;
    } else if (arg === '--timeout-ms') {
      args.timeoutMs = Number(argv[i + 1]);
      if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 1) {
        throw new Error('--timeout-ms must be a positive number');
      }
      i += 1;
    } else if (arg === '--reviewer') {
      args.reviewer = argv[i + 1];
      i += 1;
    } else if (arg === '--reason') {
      args.reason = argv[i + 1];
      i += 1;
    } else if (arg === '--snapshot') {
      args.snapshot = argv[i + 1];
      i += 1;
    } else if (arg === '--trigger') {
      args.trigger = argv[i + 1];
      i += 1;
    } else if (arg === '--notes') {
      args.notes = argv[i + 1];
      i += 1;
    } else if (arg === '--paper') {
      args.paper = argv[i + 1];
      i += 1;
    } else if (arg === '--path') {
      args.path = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return args;
}

function printDoctor(result) {
  console.log(`runtime: ${result.runtime}`);
  console.log(`target: ${result.target}`);
  console.log(`manifest: ${result.manifestPresent ? 'present' : 'missing'}`);
  console.log(`version: ${result.version || '-'}`);

  if (result.missing.length > 0) {
    console.log('missing:');
    for (const file of result.missing) console.log(`- ${file}`);
  }

  console.log(`status: ${result.ok ? 'ok' : 'needs install/update'}`);
}

async function main(argv) {
  const command = argv[0] || 'help';
  const rest = argv.slice(1);

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    console.log(packageVersion());
    return;
  }

  if (command === 'install' || command === 'update') {
    const args = parseRuntimeAndOptions(rest);
    installAssets({ ...args, action: command });
    return;
  }

  if (command === 'doctor') {
    const args = parseRuntimeAndOptions(rest);
    printDoctor(doctor(args));
    return;
  }

  if (command === 'init') {
    initPaper(parseWorkspaceOptions(rest));
    return;
  }

  if (command === 'import') {
    importPaper(parseWorkspaceOptions(rest));
    return;
  }

  if (command === 'export') {
    const args = parseWorkspaceOptions(rest);
    const result = exportPaper(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printExport(result);
    return;
  }

  if (command === 'review-pack') {
    const args = parseWorkspaceOptions(rest);
    const result = reviewPack(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printReviewPack(result);
    return;
  }

  if (command === 'feedback') {
    const args = parseWorkspaceOptions(rest);
    const result = captureFeedback(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printFeedbackCapture(result);
    return;
  }

  if (command === 'revise') {
    const args = parseWorkspaceOptions(rest);
    const result = prepareRevision(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printRevisionPreparation(result);
    return;
  }

  if (command === 'snapshot') {
    const args = parseWorkspaceOptions(rest);
    const result = createSnapshot(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printSnapshot(result);
    return;
  }

  if (command === 'restore') {
    const args = parseWorkspaceOptions(rest);
    const result = restoreSnapshot(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printRestore(result);
    return;
  }

  if (command === 'review-external') {
    const args = parseWorkspaceOptions(rest);
    const result = await reviewExternal({
      ...args,
      onProgress: args.json
        ? undefined
        : (event) => console.log(`external review: ${formatExternalReviewProgress(event)}`),
    });
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printExternalReviewResult(result);
    return;
  }

  if (command === 'status') {
    const args = parseWorkspaceOptions(rest);
    const result = status(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printStatus(result);
    return;
  }

  if (command === 'next') {
    const args = parseWorkspaceOptions(rest);
    const result = nextAction(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printNext(result);
    return;
  }

  if (command === 'validate') {
    const args = parseWorkspaceOptions(rest);
    const result = validate(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printValidation(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (command === 'validate-artifact') {
    const args = parseWorkspaceOptions(rest);
    if (!args.path) throw new Error('Missing required option: --path');
    const issues = validateArtifact(args.path);
    if (args.json) console.log(JSON.stringify({ path: args.path, issues, ok: issues.length === 0 }, null, 2));
    else printArtifactValidation(args.path, issues);
    if (issues.length > 0) process.exitCode = 1;
    return;
  }

  if (command === 'list-audiences' || command === 'list-profiles') {
    const args = parseWorkspaceOptions(rest);
    const items = listMarkdownItems(command === 'list-audiences' ? 'audiences' : 'profiles');
    if (args.json) {
      console.log(JSON.stringify(items, null, 2));
    } else {
      for (const item of items) console.log(`${item.slug}\t${item.title}\t${item.path}`);
    }
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

try {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
