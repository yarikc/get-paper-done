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

function acceptedMetadata(paperDir, sourceArtifact, note = '') {
  const meta = path.join(paperDir, '.paper');
  const sourcePath = path.join(meta, sourceArtifact);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Cannot accept missing source artifact: .paper/${sourceArtifact}`);
  }
  return {
    version: 1,
    accepted_at: new Date().toISOString(),
    source_artifact: `.paper/${sourceArtifact}`,
    source_sha256: fileSha256IfExists(sourcePath),
    accepted_sha256: fileSha256IfExists(sourcePath),
    draft_sha256: fileSha256IfExists(path.join(meta, 'DRAFT.md')),
    final_sha256: fileSha256IfExists(path.join(meta, 'exports', 'FINAL.md')),
    accepted_path: '.paper/accepted/ACCEPTED.md',
    note,
  };
}

function acceptPaper(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const meta = path.join(paperDir, '.paper');
  const sourceArtifact = resolveAcceptSource(meta, input.source);
  const sourcePath = path.join(meta, sourceArtifact);
  const acceptedDir = path.join(meta, 'accepted');
  const acceptedPath = path.join(acceptedDir, 'ACCEPTED.md');
  const metadataPath = path.join(acceptedDir, 'ACCEPTED.meta.json');
  const metadata = acceptedMetadata(paperDir, sourceArtifact, input.note || input.notes || '');

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
    sourceArtifact: `.paper/${sourceArtifact}`,
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
