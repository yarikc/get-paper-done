'use strict';

const fs = require('fs');
const path = require('path');

const {
  basenameLabel,
  displayPath,
  fileSha256IfExists,
  writeFile,
} = require('./common');
const {
  findPaperDir,
  status,
  writeStateJson,
  writeStateMarkdown,
} = require('./state');
const {
  loadSnapshotMetadata,
  resolveSnapshotDir,
  validateSnapshotHashes,
} = require('./snapshot');

const sourceAliases = new Map([
  ['draft', 'DRAFT.md'],
  ['DRAFT.md', 'DRAFT.md'],
  ['.paper/DRAFT.md', 'DRAFT.md'],
  ['final', 'exports/FINAL.md'],
  ['FINAL.md', 'exports/FINAL.md'],
  ['exports/FINAL.md', 'exports/FINAL.md'],
  ['.paper/exports/FINAL.md', 'exports/FINAL.md'],
]);

function resolveAcceptSource(meta, requestedSource) {
  if (requestedSource) {
    const normalized = sourceAliases.get(String(requestedSource).trim());
    if (!normalized) throw new Error('--source must be draft or final');
    return normalized;
  }
  if (fs.existsSync(path.join(meta, 'exports', 'FINAL.md'))) return 'exports/FINAL.md';
  return 'DRAFT.md';
}

function relativePaperPath(paperDir, filePath) {
  const relative = path.relative(paperDir, filePath);
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) return relative.split(path.sep).join('/');
  return filePath;
}

function resolveSnapshotAcceptSource(snapshotDir, requestedSource) {
  if (requestedSource) {
    const normalized = sourceAliases.get(String(requestedSource).trim());
    if (!normalized) throw new Error('--source must be draft or final');
    return normalized;
  }
  if (fs.existsSync(path.join(snapshotDir, 'exports', 'FINAL.md'))) return 'exports/FINAL.md';
  return 'DRAFT.md';
}

function resolveAcceptedInput(paperDir, requestedSource, requestedSnapshot) {
  const meta = path.join(paperDir, '.paper');
  if (!requestedSnapshot) {
    const sourceArtifact = resolveAcceptSource(meta, requestedSource);
    return {
      sourceArtifact,
      sourceLabel: `.paper/${sourceArtifact}`,
      sourcePath: path.join(meta, sourceArtifact),
      draftPath: path.join(meta, 'DRAFT.md'),
      finalPath: path.join(meta, 'exports', 'FINAL.md'),
    };
  }

  const snapshotDir = resolveSnapshotDir(paperDir, requestedSnapshot);
  if (!fs.existsSync(snapshotDir)) throw new Error(`Snapshot does not exist: ${snapshotDir}`);
  const snapshotMetadata = loadSnapshotMetadata(snapshotDir);
  const hashErrors = validateSnapshotHashes(snapshotDir, snapshotMetadata);
  if (hashErrors.length > 0) {
    throw new Error(`Snapshot integrity check failed:\n- ${hashErrors.join('\n- ')}`);
  }

  const sourceArtifact = resolveSnapshotAcceptSource(snapshotDir, requestedSource);
  const sourcePath = path.join(snapshotDir, sourceArtifact);
  const sourceLabel = `${relativePaperPath(paperDir, sourcePath)}`;
  return {
    sourceArtifact,
    sourceLabel,
    sourcePath,
    draftPath: path.join(snapshotDir, 'DRAFT.md'),
    finalPath: path.join(snapshotDir, 'exports', 'FINAL.md'),
    snapshotId: snapshotMetadata.version_id || path.basename(snapshotDir),
    snapshotPath: relativePaperPath(paperDir, snapshotDir),
  };
}

function acceptedMetadata(input, note = '') {
  const { sourcePath, sourceLabel, draftPath, finalPath, snapshotId, snapshotPath } = input;
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Cannot accept missing source artifact: ${sourceLabel}`);
  }
  const metadata = {
    version: 1,
    accepted_at: new Date().toISOString(),
    source_artifact: sourceLabel,
    source_sha256: fileSha256IfExists(sourcePath),
    accepted_sha256: fileSha256IfExists(sourcePath),
    draft_sha256: fileSha256IfExists(draftPath),
    final_sha256: fileSha256IfExists(finalPath),
    accepted_path: '.paper/accepted/ACCEPTED.md',
    note,
  };
  if (snapshotId) metadata.source_snapshot_id = snapshotId;
  if (snapshotPath) metadata.source_snapshot_path = snapshotPath;
  return metadata;
}

function acceptPaper(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const meta = path.join(paperDir, '.paper');
  const acceptedInput = resolveAcceptedInput(paperDir, input.source, input.snapshot);
  const sourcePath = acceptedInput.sourcePath;
  const acceptedDir = path.join(meta, 'accepted');
  const acceptedPath = path.join(acceptedDir, 'ACCEPTED.md');
  const metadataPath = path.join(acceptedDir, 'ACCEPTED.meta.json');
  const metadata = acceptedMetadata(acceptedInput, input.note || input.notes || '');

  if (!input.dryRun) fs.mkdirSync(acceptedDir, { recursive: true });
  writeFile(acceptedPath, fs.readFileSync(sourcePath, 'utf8'), input.dryRun);
  writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, input.dryRun);

  const current = status({ paper: paperDir });
  if (current.machineState) {
    const nextState = {
      ...current.machineState,
      status: 'Accepted',
      current_stage: 'Accepted Baseline',
      last_completed_stage: current.machineState.current_stage || current.machineState.last_completed_stage || 'Unknown',
      last_activity: metadata.accepted_at,
      suggested_next_command: '/gpd-status',
      accepted: {
        version: metadata.version,
        accepted_at: metadata.accepted_at,
        source_artifact: metadata.source_artifact,
        accepted_path: metadata.accepted_path,
        accepted_sha256: metadata.accepted_sha256,
        source_sha256: metadata.source_sha256,
        draft_sha256: metadata.draft_sha256,
        final_sha256: metadata.final_sha256,
      },
    };
    writeStateJson(paperDir, nextState, input.dryRun);
    writeStateMarkdown(paperDir, nextState, input.dryRun);
  }

  return {
    paperDir,
    sourceArtifact: metadata.source_artifact,
    sourceSnapshotId: metadata.source_snapshot_id || '',
    acceptedPath,
    metadataPath,
    metadata,
    dryRun: Boolean(input.dryRun),
  };
}

function printAccept(result) {
  console.log(result.dryRun ? 'Accepted baseline would be updated' : 'Accepted baseline updated');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Source: ${result.sourceArtifact}`);
  if (result.sourceSnapshotId) console.log(`Snapshot: ${result.sourceSnapshotId}`);
  console.log(`Accepted: ${displayPath(result.paperDir, result.acceptedPath)}`);
  console.log(`Metadata: ${displayPath(result.paperDir, result.metadataPath)}`);
  console.log('');
  console.log(result.dryRun ? 'Next: rerun without --dry-run to update the accepted baseline' : 'Next: gpd status');
  console.log('Why: future revisions should compare candidates against this accepted baseline, not the last draft.');
}

module.exports = {
  acceptPaper,
  printAccept,
};
