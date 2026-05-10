#!/usr/bin/env node
'use strict';

const { installAssets } = require('./lib/installer');

function printHelp() {
  console.log(`Usage: get-paper-done [--runtime claude|codex] [--target DIR] [--dry-run] [--no-backup]

Legacy installer entrypoint. Prefer:

  gpd install claude
  gpd install codex

Default runtime: claude
Default target: ~/.claude
`);
}

function parseArgs(argv) {
  const args = { runtime: 'claude', action: 'install', backup: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-backup') args.backup = false;
    else if (arg === '--runtime') {
      args.runtime = argv[i + 1];
      i += 1;
    } else if (arg === '--target') {
      args.target = argv[i + 1];
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

try {
  installAssets(parseArgs(process.argv.slice(2)));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
