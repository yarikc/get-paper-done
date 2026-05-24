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

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function markdownStatus(markdown) {
  const match = String(markdown || '').match(/^\*\*Status:\*\*\s*(.+)$/im);
  return match ? match[1].trim() : '';
}

function revisionInstructionsUsable(meta) {
  return revisionInstructionsReadiness(meta).ok;
}

function revisionInstructionsReadiness(meta) {
  const instructionsPath = path.join(meta, 'REVISION-INSTRUCTIONS.md');
  if (!fs.existsSync(instructionsPath)) {
    return {
      ok: false,
      reason: 'missing',
      message: 'Cannot use .paper/REVISION-INSTRUCTIONS.md because it is missing. Review FEEDBACK-PLAN.md, record decisions, and regenerate revision instructions before revising.',
    };
  }

  const feedbackPlanPath = path.join(meta, 'FEEDBACK-PLAN.md');
  if (!fs.existsSync(feedbackPlanPath)) return { ok: true };

  const planStatus = markdownStatus(readIfExists(feedbackPlanPath));
  if (planStatus === 'Pending user approval') {
    return {
      ok: false,
      reason: 'pending_feedback_plan',
      message: 'Cannot use .paper/REVISION-INSTRUCTIONS.md because FEEDBACK-PLAN.md is pending user approval. Finish feedback decisions and regenerate revision instructions before revising.',
    };
  }

  const instructionsMtime = fs.statSync(instructionsPath).mtimeMs;
  const planMtime = fs.statSync(feedbackPlanPath).mtimeMs;
  if (instructionsMtime < planMtime) {
    return {
      ok: false,
      reason: 'stale',
      message: 'Cannot use .paper/REVISION-INSTRUCTIONS.md because FEEDBACK-PLAN.md is newer. Regenerate revision instructions before revising.',
    };
  }
  return { ok: true };
}

function defaultTrigger(meta) {
  const candidates = [
    'FEEDBACK-PLAN.md',
    'FEEDBACK-READER.md',
    'FEEDBACK-EXTERNAL.md',
    'REVIEW.md',
    'FACT-CHECK.md',
  ];
  if (revisionInstructionsUsable(meta)) return '.paper/REVISION-INSTRUCTIONS.md';
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
  if (trigger === '.paper/REVISION-INSTRUCTIONS.md') {
    const readiness = revisionInstructionsReadiness(meta);
    if (!readiness.ok) throw new Error(readiness.message);
  }
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
  if (result.trigger === '.paper/REVISION-INSTRUCTIONS.md') {
    console.log('instructions: read .paper/REVISION-INSTRUCTIONS.md first; inspect FEEDBACK-PLAN.md only when an instruction is ambiguous.');
  }
  console.log(`next: ${result.next}`);
  console.log(`restore: ${result.restoreCommand}`);
  console.log('after revision: run /gpd-export, then read .paper/exports/FINAL.md before external review.');
  console.log('why: user review confirms intent, voice, and calibration after substantive edits; external review should test the accepted version, not steer an unapproved one.');
}

module.exports = {
  prepareRevision,
  printRevisionPreparation,
};
