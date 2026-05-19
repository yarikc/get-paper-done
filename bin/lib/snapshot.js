'use strict';

const fs = require('fs');
const path = require('path');

const {
  fileSha256,
  writeFile,
} = require('./common');
const {
  findPaperDir,
  status,
  writeStateJson,
} = require('./state');

const coreArtifacts = [
  'DRAFT.md',
  'exports/FINAL.md',
  'FEEDBACK-PLAN.md',
  'FEEDBACK-READER.md',
  'FEEDBACK-EXTERNAL.md',
  'REVISION-CHECK.md',
  'REVIEW.md',
  'FACT-CHECK.md',
  'RESEARCH.json',
  'RESEARCH.md',
  'OUTLINE.md',
  'BRIEF.md',
  'STRATEGY.md',
  'PERSONA.md',
  'AUDIENCE.md',
  'PAPER-CONTEXT.md',
  'DECISIONS.md',
  'STATE.json',
  'STATE.md',
  'config.json',
];

const directoryArtifacts = [
  {
    sourceRoot: '.paper/sources',
    snapshotRoot: 'sources',
  },
  {
    sourceRoot: '.paper/feedback-external',
    snapshotRoot: 'feedback-external',
  },
  {
    sourceRoot: 'original',
    snapshotRoot: 'original',
  },
];

function timestampId(date = new Date()) {
  return date.toISOString()
    .replace(/[^0-9TZ]/g, '')
    .replace(/Z$/, '');
}

function slugPart(value) {
  return String(value || 'manual')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'manual';
}

function copyIfPresent(src, dest, dryRun) {
  if (!fs.existsSync(src)) return false;
  if (dryRun) return true;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function sha256File(filePath) {
  return fileSha256(filePath);
}

function fileEntry(sourcePath, snapshotPath, sourceAbsolutePath) {
  const stat = fs.statSync(sourceAbsolutePath);
  return {
    source_path: sourcePath,
    snapshot_path: snapshotPath,
    bytes: stat.size,
    sha256: sha256File(sourceAbsolutePath),
  };
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) output.push(...walkFiles(filePath));
    else if (stat.isFile()) output.push(filePath);
  }
  return output;
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join('/');
}

function sourcePathForCoreArtifact(artifact) {
  return `.paper/${artifact}`;
}

function snapshotPathForSource(sourcePath) {
  if (sourcePath.startsWith('.paper/')) return sourcePath.slice('.paper/'.length);
  return sourcePath;
}

function revisionLogEntry(metadata) {
  return [
    `## ${metadata.version_id}`,
    '',
    `- Created: ${metadata.created_at}`,
    `- Reason: ${metadata.snapshot_reason}`,
    `- Trigger: ${metadata.trigger_artifact || 'not specified'}`,
    `- Snapshot: ${metadata.snapshot_path}`,
    `- Source artifacts: ${metadata.source_artifacts.join(', ') || 'none'}`,
    `- Notes: ${metadata.notes || ''}`,
    '',
  ].join('\n');
}

function appendRevisionLog(meta, metadata, dryRun) {
  const logPath = path.join(meta, 'REVISION-LOG.md');
  const entry = revisionLogEntry(metadata);
  if (dryRun) return logPath;

  if (!fs.existsSync(logPath)) {
    writeFile(
      logPath,
      [
        '# Revision Log',
        '',
        'This file records paper-local snapshots created before substantive revision or export overwrite.',
        '',
        entry,
      ].join('\n'),
      false,
    );
    return logPath;
  }

  fs.appendFileSync(logPath, `\n${entry}`);
  return logPath;
}

function createSnapshot(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');

  const meta = path.join(paperDir, '.paper');
  const createdAt = new Date();
  const reason = slugPart(input.reason || 'manual');
  const versionId = `REV-${timestampId(createdAt)}-${reason}`;
  const relativeSnapshotPath = `.paper/versions/${versionId}`;
  const snapshotDir = path.join(meta, 'versions', versionId);
  const copied = [];
  const files = [];

  for (const artifact of coreArtifacts) {
    const src = path.join(meta, artifact);
    const dest = path.join(snapshotDir, artifact);
    if (copyIfPresent(src, dest, input.dryRun)) {
      copied.push(artifact);
      files.push(fileEntry(sourcePathForCoreArtifact(artifact), artifact, src));
    }
  }

  for (const directoryArtifact of directoryArtifacts) {
    const sourceRoot = path.join(paperDir, directoryArtifact.sourceRoot);
    if (!fs.existsSync(sourceRoot)) continue;
    for (const sourceFile of walkFiles(sourceRoot)) {
      const relative = normalizeRelativePath(path.relative(sourceRoot, sourceFile));
      const sourcePath = normalizeRelativePath(path.join(directoryArtifact.sourceRoot, relative));
      const snapshotRelativePath = normalizeRelativePath(path.join(directoryArtifact.snapshotRoot, relative));
      const dest = path.join(snapshotDir, snapshotRelativePath);
      if (copyIfPresent(sourceFile, dest, input.dryRun)) {
        copied.push(sourcePath);
        files.push(fileEntry(sourcePath, snapshotRelativePath, sourceFile));
      }
    }
  }

  const metadata = {
    version_id: versionId,
    created_at: createdAt.toISOString(),
    snapshot_reason: reason,
    trigger_artifact: input.trigger || '',
    paper_stage: input.paperStage || '',
    snapshot_path: relativeSnapshotPath,
    source_artifacts: copied,
    file_hashes: files,
    notes: input.notes || '',
  };

  if (!input.dryRun) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }
  writeFile(
    path.join(snapshotDir, 'VERSION-METADATA.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    input.dryRun,
  );
  const revisionLogPath = appendRevisionLog(meta, metadata, input.dryRun);

  return {
    paperDir,
    versionId,
    snapshotDir,
    snapshotPath: path.join(meta, 'versions', versionId),
    relativeSnapshotPath,
    metadataPath: path.join(snapshotDir, 'VERSION-METADATA.json'),
    revisionLogPath,
    copied,
    reason,
  };
}

function resolveSnapshotDir(paperDir, snapshot) {
  if (!snapshot) throw new Error('Missing required option: --snapshot REV-... or --snapshot .paper/versions/REV-...');
  const raw = String(snapshot);
  if (path.isAbsolute(raw)) return raw;
  if (raw.startsWith('.paper/versions/')) return path.join(paperDir, raw);
  return path.join(paperDir, '.paper', 'versions', raw);
}

function loadSnapshotMetadata(snapshotDir) {
  const metadataPath = path.join(snapshotDir, 'VERSION-METADATA.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Snapshot metadata not found: ${metadataPath}`);
  }
  return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}

function validateSnapshotHashes(snapshotDir, metadata) {
  const files = Array.isArray(metadata.file_hashes) ? metadata.file_hashes : [];
  const errors = [];
  for (const file of files) {
    const snapshotPath = path.join(snapshotDir, file.snapshot_path || '');
    if (!fs.existsSync(snapshotPath)) {
      errors.push(`missing snapshot file: ${file.snapshot_path}`);
      continue;
    }
    const actual = sha256File(snapshotPath);
    if (actual !== file.sha256) {
      errors.push(`hash mismatch: ${file.snapshot_path}`);
    }
  }
  return errors;
}

function restoreSnapshot(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const meta = path.join(paperDir, '.paper');

  const snapshotDir = resolveSnapshotDir(paperDir, input.snapshot);
  if (!fs.existsSync(snapshotDir)) throw new Error(`Snapshot does not exist: ${snapshotDir}`);

  const metadata = loadSnapshotMetadata(snapshotDir);
  const hashErrors = validateSnapshotHashes(snapshotDir, metadata);
  if (hashErrors.length > 0) {
    throw new Error(`Snapshot integrity check failed:\n- ${hashErrors.join('\n- ')}`);
  }

  const currentState = status({ paper: paperDir });
  const safetySnapshot = createSnapshot({
    paper: paperDir,
    reason: 'before_restore',
    trigger: metadata.version_id || input.snapshot,
    paperStage: currentState.machineState ? currentState.machineState.current_stage : '',
    notes: `Automatic safety snapshot before restoring ${metadata.version_id || input.snapshot}.`,
    dryRun: input.dryRun,
  });

  const files = Array.isArray(metadata.file_hashes) && metadata.file_hashes.length > 0
    ? metadata.file_hashes
    : (metadata.source_artifacts || []).map((artifact) => ({
      source_path: artifact.startsWith('.paper/') || artifact.startsWith('original/')
        ? artifact
        : `.paper/${artifact}`,
      snapshot_path: snapshotPathForSource(artifact.startsWith('.paper/') || artifact.startsWith('original/')
        ? artifact
        : `.paper/${artifact}`),
    }));

  const restored = [];
  for (const file of files) {
    const src = path.join(snapshotDir, file.snapshot_path);
    const dest = file.source_path.startsWith('.paper/')
      ? path.join(paperDir, file.source_path)
      : path.join(paperDir, file.source_path);
    if (!fs.existsSync(src)) continue;
    if (!input.dryRun) fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!input.dryRun) fs.copyFileSync(src, dest);
    restored.push(file.source_path);
  }

  appendRevisionLog(meta, {
    version_id: `RESTORE-${timestampId(new Date())}-${metadata.version_id || path.basename(snapshotDir)}`,
    created_at: new Date().toISOString(),
    snapshot_reason: 'restore',
    trigger_artifact: metadata.version_id || input.snapshot,
    snapshot_path: safetySnapshot.relativeSnapshotPath,
    source_artifacts: restored,
    notes: `Restored ${metadata.version_id || input.snapshot}. Safety snapshot before restore: ${safetySnapshot.relativeSnapshotPath}.`,
  }, input.dryRun);

  if (currentState.machineState) {
    const nextState = {
      ...currentState.machineState,
      status: 'Restored',
      current_stage: 'Restore',
      last_completed_stage: 'Snapshot restore',
      last_activity: new Date().toISOString(),
      suggested_next_command: '/gpd-status',
      versioning: {
        ...(currentState.machineState.versioning || {}),
        last_snapshot_id: safetySnapshot.versionId,
        last_restore_snapshot_id: metadata.version_id || path.basename(snapshotDir),
      },
    };
    writeStateJson(paperDir, nextState, input.dryRun);
  }

  return {
    paperDir,
    snapshotDir,
    restoredSnapshotId: metadata.version_id || path.basename(snapshotDir),
    safetySnapshot,
    restored,
  };
}

function printSnapshot(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`snapshot: ${result.relativeSnapshotPath}`);
  console.log(`reason: ${result.reason}`);
  console.log(`copied: ${result.copied.length > 0 ? result.copied.join(', ') : 'none'}`);
  console.log(`revision log: ${result.revisionLogPath}`);
}

function printRestore(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`restored: ${result.restoredSnapshotId}`);
  console.log(`safety snapshot: ${result.safetySnapshot.relativeSnapshotPath}`);
  console.log(`files restored: ${result.restored.length > 0 ? result.restored.join(', ') : 'none'}`);
}

module.exports = {
  createSnapshot,
  restoreSnapshot,
  printSnapshot,
  printRestore,
  coreArtifacts,
  directoryArtifacts,
  validateSnapshotHashes,
};
