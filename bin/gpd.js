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
  status,
  printStatus,
  validate,
  printValidation,
  validateArtifact,
  printArtifactValidation,
  listMarkdownItems,
} = require('./lib/workspace');

function printHelp() {
  console.log(`Usage: gpd <command> [runtime] [options]

Commands:
  install [claude|codex]       Install GPD assets into a runtime
  update [claude|codex]        Update installed GPD assets from this package
  doctor [claude|codex]        Validate an installed runtime
  init                         Create a new paper workspace
  import                       Import an existing paper folder/file into a workspace
  status                       Show current paper workspace state
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
  --paper DIR                  Existing paper directory for status/validate
  --path FILE                  Artifact path for validate-artifact
  --json                       Print JSON for list/status/validate
  --dry-run                    Show planned changes without writing
  --no-backup                  Do not back up changed installed files

Examples:
  gpd install claude
  gpd install codex --dry-run
  gpd update claude
  gpd doctor codex
  gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
  gpd import --source ~/drafts/paper --location ~/papers --slug metadata-strategy
  gpd status --paper ~/papers/metadata-strategy
  gpd validate
  gpd validate-artifact --path ~/papers/metadata-strategy/.paper/STATE.json
  gpd list-audiences
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
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--json') args.json = true;
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

function main(argv) {
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

  if (command === 'status') {
    const args = parseWorkspaceOptions(rest);
    const result = status(args);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printStatus(result);
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
  main(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
