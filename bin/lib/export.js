'use strict';

const fs = require('fs');
const path = require('path');

const {
  fileSha256IfExists,
  writeFile,
} = require('./common');
const {
  findPaperDir,
  status,
  writeStateJson,
} = require('./state');
const {
  createSnapshot,
} = require('./snapshot');
const {
  validateArtifact,
} = require('./validate');

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function stripMarkdownValue(value) {
  return value
    .trim()
    .replace(/`/g, '')
    .trim();
}

function parseHeadingValue(markdown, heading) {
  if (!markdown) return null;
  const lines = markdown.split(/\r?\n/);
  const target = `## ${heading.toLowerCase()}`;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().toLowerCase() === target) {
      for (let j = i + 1; j < lines.length; j += 1) {
        const value = lines[j].trim();
        if (value.startsWith('## ')) return null;
        if (value) return stripMarkdownValue(value);
      }
    }
  }
  return null;
}

function projectTitle(projectMarkdown) {
  if (!projectMarkdown) return null;
  const heading = projectMarkdown.split(/\r?\n/).find((line) => line.startsWith('# '));
  if (!heading) return null;
  const title = heading.slice(2).trim();
  return title && !title.includes('[Paper Title]') ? title : null;
}

function draftTitleAndBody(draftMarkdown, fallbackTitle) {
  const lines = draftMarkdown.split(/\r?\n/);
  let title = fallbackTitle || null;
  const output = [];
  const hasDraftBody = lines.some((rawLine) => rawLine.trim() === '## Draft Body');
  let inDraftBody = false;
  let sawDraftBody = false;
  let inWorkingTitle = false;
  let skippingMetadata = true;
  let skipSection = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '## Working Title') {
      inWorkingTitle = true;
      skippingMetadata = false;
      continue;
    }
    if (inWorkingTitle) {
      if (!title && line) title = line;
      if (line.startsWith('## ')) inWorkingTitle = false;
      else continue;
    }

    if (line === '## Draft Body') {
      inDraftBody = true;
      sawDraftBody = true;
      skippingMetadata = false;
      continue;
    }

    if (line.startsWith('## Draft Notes') || line.startsWith('## Draft Markers') || line.startsWith('## Draft Source Anchors')) {
      break;
    }

    if (hasDraftBody && !inDraftBody) {
      continue;
    }

    if (line.startsWith('## Section Intent Map')) {
      skipSection = 'section-intent-map';
      skippingMetadata = false;
      continue;
    }
    if (skipSection && line.startsWith('## ') && line !== '## Section Intent Map') {
      skipSection = null;
    }
    if (skipSection) continue;

    if (rawLine.startsWith('# Draft')) continue;
    if (skippingMetadata && (line.startsWith('**') || line === '---' || line === '')) continue;
    if (sawDraftBody && !inDraftBody) continue;

    skippingMetadata = false;
    const normalized = rawLine.replace(/^## Section \d+\s*-\s*/, '## ');
    output.push(normalized);
  }

  const body = output.join('\n').trim();
  return {
    title: title || 'Final',
    body,
  };
}

function mtimeMs(filePath) {
  return fs.existsSync(filePath) ? fs.statSync(filePath).mtimeMs : 0;
}

function draftChangedSinceExport(draftPath, finalPath, stateResult) {
  if (!fs.existsSync(finalPath)) return false;
  const versioning = stateResult.machineState && stateResult.machineState.versioning
    ? stateResult.machineState.versioning
    : {};
  if (versioning.last_exported_draft_sha256) {
    return fileSha256IfExists(draftPath) !== versioning.last_exported_draft_sha256;
  }
  return mtimeMs(draftPath) > mtimeMs(finalPath);
}

function ensureRevisionSafetyForOverwrite(meta, draftPath, finalPath, stateResult) {
  if (!fs.existsSync(finalPath)) return;
  if (!draftChangedSinceExport(draftPath, finalPath, stateResult)) return;

  const revisionCheckPath = path.join(meta, 'REVISION-CHECK.md');
  if (!fs.existsSync(revisionCheckPath)) {
    throw new Error(
      'DRAFT.md is newer than exports/FINAL.md. Create a snapshot and REVISION-CHECK.md before overwriting a reviewed export.',
    );
  }
  if (mtimeMs(revisionCheckPath) < mtimeMs(draftPath)) {
    throw new Error('REVISION-CHECK.md is older than DRAFT.md. Refresh the revision check before export.');
  }

  const issues = validateArtifact(revisionCheckPath).filter((item) => item.severity === 'HIGH');
  if (issues.length > 0) {
    throw new Error(`REVISION-CHECK.md has blocking issues:\n- ${issues.map((item) => item.issue).join('\n- ')}`);
  }
}

function exportPaper(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');

  const meta = path.join(paperDir, '.paper');
  const draftPath = path.join(meta, 'DRAFT.md');
  const reviewPath = path.join(meta, 'REVIEW.md');
  const projectPath = path.join(meta, 'PROJECT.md');

  const draft = readIfExists(draftPath);
  if (!draft) throw new Error('Missing .paper/DRAFT.md; run /gpd-draft before export.');

  const review = readIfExists(reviewPath);
  const verdict = parseHeadingValue(review, 'Verdict');
  if (verdict !== 'Ready' && !input.force) {
    throw new Error(`REVIEW.md verdict is ${verdict || 'missing'}; run /gpd-review or pass --force to export anyway.`);
  }

  const stateResult = status({ paper: paperDir });
  if (
    !input.force
    && stateResult.next !== '/gpd-export'
    && stateResult.next !== '/gpd-status'
  ) {
    throw new Error(`Current paper state recommends ${stateResult.next}; run that first or pass --force to export anyway.`);
  }

  const { title, body } = draftTitleAndBody(draft, projectTitle(readIfExists(projectPath)));
  if (!body) throw new Error('DRAFT.md does not contain exportable body content.');

  const finalPath = path.join(meta, 'exports', 'FINAL.md');
  ensureRevisionSafetyForOverwrite(meta, draftPath, finalPath, stateResult);
  const overwriteSnapshot = fs.existsSync(finalPath)
    ? createSnapshot({
      paper: paperDir,
      reason: 'before_export_overwrite',
      trigger: '.paper/exports/FINAL.md',
      paperStage: stateResult.machineState ? stateResult.machineState.current_stage : '',
      notes: 'Automatic snapshot before regenerating exports/FINAL.md.',
      dryRun: input.dryRun,
    })
    : null;
  writeFile(finalPath, `# ${title}\n\n${body}\n`, input.dryRun);

  if (stateResult.machineState) {
    const draftHash = fileSha256IfExists(draftPath);
    const finalHash = input.dryRun
      ? ''
      : fileSha256IfExists(finalPath);
    const nextState = {
      ...stateResult.machineState,
      status: 'Exported',
      current_stage: 'Export',
      last_completed_stage: 'Internal export',
      last_activity: new Date().toISOString(),
      suggested_next_command: '/gpd-status',
      versioning: {
        ...(stateResult.machineState.versioning || {}),
        last_snapshot_id: overwriteSnapshot ? overwriteSnapshot.versionId : (
          stateResult.machineState.versioning ? stateResult.machineState.versioning.last_snapshot_id : ''
        ),
        last_export_snapshot_id: overwriteSnapshot ? overwriteSnapshot.versionId : (
          stateResult.machineState.versioning ? stateResult.machineState.versioning.last_export_snapshot_id : ''
        ),
        last_exported_draft_sha256: draftHash,
        last_exported_final_sha256: finalHash,
      },
    };
    writeStateJson(paperDir, nextState, input.dryRun);
  }
  writeFile(
    path.join(meta, 'STATE.md'),
    [
      '# State',
      '',
      '- **Status:** Exported',
      '- **Current stage:** Export',
      '- **Last completed stage:** Internal export',
      '- **Suggested next command:** `/gpd-status`',
      '- **Blocked by:** None',
      '',
      '## Notes',
      '',
      '- Internal export created at `.paper/exports/FINAL.md`.',
      '- Review `.paper/exports/FINAL.md` as the reading copy.',
      '- If you add comments to `FINAL.md`, run `gpd feedback`, then `/gpd-feedback`; approved changes will be applied to `.paper/DRAFT.md` and exported again.',
      '- Run `/gpd-status` whenever you are unsure what to do next.',
      '',
    ].join('\n'),
    input.dryRun,
  );

  return {
    paperDir,
    finalPath,
    forced: Boolean(input.force),
    snapshot: overwriteSnapshot,
  };
}

function printExport(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`export: ${result.finalPath}`);
  if (result.snapshot) console.log(`snapshot before overwrite: ${result.snapshot.relativeSnapshotPath}`);
  if (result.forced) console.log('warning: exported with --force');
  console.log('review: read .paper/exports/FINAL.md');
  console.log('if you add comments: run gpd feedback, then /gpd-feedback');
}

module.exports = {
  exportPaper,
  printExport,
};
