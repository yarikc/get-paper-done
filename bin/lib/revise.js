'use strict';

const fs = require('fs');
const path = require('path');

const {
  createSnapshot,
} = require('./snapshot');
const {
  findPaperDir,
  status,
  writeStateJson,
} = require('./state');

function defaultTrigger(meta) {
  const candidates = [
    'FEEDBACK-PLAN.md',
    'FEEDBACK-READER.md',
    'FEEDBACK-EXTERNAL.md',
    'REVIEW.md',
    'FACT-CHECK.md',
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(meta, candidate))) return `.paper/${candidate}`;
  }
  return 'user request';
}

function restoreCommand(paperDir, snapshotId) {
  return `gpd restore --paper ${paperDir} --snapshot ${snapshotId}`;
}

function prepareRevision(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const meta = path.join(paperDir, '.paper');
  if (!fs.existsSync(path.join(meta, 'DRAFT.md'))) {
    throw new Error('Cannot prepare revision because .paper/DRAFT.md is missing. Run /gpd-draft before /gpd-revise.');
  }
  const current = status({ paper: paperDir });
  const trigger = input.trigger || defaultTrigger(meta);
  const reason = input.reason || 'before_substantive_revision';

  const snapshot = createSnapshot({
    paper: paperDir,
    reason,
    trigger,
    paperStage: current.machineState ? current.machineState.current_stage : 'Revision',
    notes: input.notes || 'Automatic snapshot before controlled revision.',
    dryRun: input.dryRun,
  });

  if (current.machineState) {
    const nextState = {
      ...current.machineState,
      status: 'Revision Prepared',
      current_stage: 'Revision',
      last_completed_stage: 'Pre-revision snapshot',
      last_activity: new Date().toISOString(),
      suggested_next_command: '/gpd-revise',
      versioning: {
        ...(current.machineState.versioning || {}),
        last_snapshot_id: snapshot.versionId,
        active_revision_snapshot_id: snapshot.versionId,
      },
    };
    writeStateJson(paperDir, nextState, input.dryRun);
  }

  return {
    paperDir,
    trigger,
    reason: snapshot.reason,
    snapshot,
    next: '/gpd-revise',
    restoreCommand: restoreCommand(paperDir, snapshot.versionId),
  };
}

function printRevisionPreparation(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`snapshot before revision: ${result.snapshot.relativeSnapshotPath}`);
  console.log(`trigger: ${result.trigger}`);
  console.log(`next: ${result.next}`);
  console.log(`restore: ${result.restoreCommand}`);
}

module.exports = {
  prepareRevision,
  printRevisionPreparation,
};
