'use strict';

const fs = require('fs');
const path = require('path');

const {
  resolvePaperDir,
  expandHome,
  ensureNotExistingPaper,
  mkdirp,
  writeFile,
  copyFile,
} = require('./common');
const {
  defaultMachineState,
} = require('./state');
const {
  writeSetupArtifacts,
} = require('./init');

const skipDirs = new Set([
  '.git',
  '.paper',
  'original',
  'node_modules',
  '.DS_Store',
  '__pycache__',
]);

const maxDefaultFileBytes = 25 * 1024 * 1024;

function classifyFile(relPath) {
  const lower = relPath.toLowerCase();
  const base = path.basename(lower);
  if (base.includes('review') || base.includes('feedback') || base.includes('critique')) return 'review';
  if (base.includes('outline')) return 'outline';
  if (base.includes('brief') || base.includes('spec') || base.includes('strategy')) return 'spec';
  if (
    base.includes('research')
    || base.includes('reference')
    || base.includes('source')
    || lower.startsWith('research/')
    || lower.startsWith('references/')
    || lower.startsWith('source/')
    || lower.startsWith('sources/')
    || lower.includes('/research/')
    || lower.includes('/references/')
    || lower.includes('/source/')
    || lower.includes('/sources/')
  ) return 'research';
  if (
    base.includes('draft')
    || base.includes('white-paper')
    || base.includes('position-paper')
    || base.includes('article')
    || base.includes('blog')
    || base.includes('newsletter')
    || base.endsWith('.docx')
  ) return 'draft';
  if (base.endsWith('.md') || base.endsWith('.txt')) return 'notes';
  if (base.match(/\.(png|jpg|jpeg|gif|webp|svg|pdf|xlsx|csv|pptx)$/)) return 'asset';
  return 'unclear';
}

function shouldSkipEntry(entry, relPath) {
  if (skipDirs.has(entry.name)) return true;
  if (entry.name.startsWith('.') && entry.name !== '.env.example') return true;
  if (relPath.includes(`${path.sep}.git${path.sep}`)) return true;
  return false;
}

function walkSource(sourcePath, maxBytes = maxDefaultFileBytes) {
  const source = path.resolve(expandHome(sourcePath));
  const stat = fs.statSync(source);
  const files = [];
  const skipped = [];

  function visit(abs, base) {
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(abs, entry.name);
      const rel = path.relative(base, full);
      if (shouldSkipEntry(entry, rel)) {
        skipped.push({ path: rel, reason: 'ignored directory or hidden file' });
        continue;
      }
      if (entry.isDirectory()) {
        visit(full, base);
      } else if (entry.isFile()) {
        const size = fs.statSync(full).size;
        if (size > maxBytes) {
          skipped.push({ path: rel, reason: `larger than ${maxBytes} bytes` });
        } else {
          files.push({
            abs: full,
            rel,
            size,
            classification: classifyFile(rel),
          });
        }
      }
    }
  }

  if (stat.isDirectory()) {
    visit(source, source);
  } else if (stat.isFile()) {
    files.push({
      abs: source,
      rel: path.basename(source),
      size: stat.size,
      classification: classifyFile(path.basename(source)),
    });
  } else {
    throw new Error(`Unsupported source type: ${source}`);
  }

  return { source, files, skipped };
}

function isTextDraftCandidate(file) {
  return /\.(md|txt)$/i.test(file.rel);
}

function selectCanonicalDraft(files, sourceIsFile = false) {
  const candidates = files.filter((file) => file.classification === 'draft');
  if (candidates.length === 0) {
    if (sourceIsFile && files.length === 1 && isTextDraftCandidate(files[0])) {
      return {
        ...files[0],
        selectionRationale: 'Single imported Markdown/text file treated as the working draft.',
      };
    }
    return null;
  }
  return candidates
    .map((file) => ({ file, mtime: fs.statSync(file.abs).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .map((candidate) => ({
      ...candidate.file,
      selectionRationale: 'Most recently modified imported draft-like file.',
    }))[0];
}

function reportPathLabel(value) {
  return path.basename(path.resolve(expandHome(value)));
}

function importReport(input, copied, skipped, canonicalDraft) {
  const copiedRows = copied.length === 0
    ? '| - | - | - | - |'
    : copied.map((file) => `| ${file.rel} | original/${file.rel.split(path.sep).join('/')} | ${file.classification} | Preserved unchanged; ${file.size} bytes |`).join('\n');
  const skippedRows = skipped.length === 0
    ? '| - | - |'
    : skipped.map((file) => `| ${file.path.split(path.sep).join('/')} | ${file.reason} |`).join('\n');
  const researchRows = copied
    .filter((file) => file.classification === 'research')
    .map((file) => `| original/${file.rel.split(path.sep).join('/')} | research/reference/source/notes | RESEARCH |`)
    .join('\n') || '| - | - | - |';
  const outlineRows = copied
    .filter((file) => file.classification === 'outline' || file.classification === 'review')
    .map((file) => `| original/${file.rel.split(path.sep).join('/')} | ${file.classification} | Imported for later review |`)
    .join('\n') || '| - | - | - |';

  return `# Import Report

**Imported at:** ${new Date().toISOString()}
**Source label:** ${reportPathLabel(input.source)}
**Destination label:** ${reportPathLabel(input.paperDir)}
**Path policy:** Absolute local source and destination paths are intentionally omitted from this report.

## Import Summary

Imported ${copied.length} file(s), skipped ${skipped.length} file(s). Original material was preserved unchanged under \`original/\`.

## Original Material

Original material was copied to:

\`\`\`text
original/
\`\`\`

## Files Copied

| Original Path | Imported Path | Classification | Notes |
|---------------|---------------|----------------|-------|
${copiedRows}

## Files Skipped

| Path | Reason |
|------|--------|
${skippedRows}

## Canonical Draft

- **Selected draft:** ${canonicalDraft ? `original/${canonicalDraft.rel.split(path.sep).join('/')}` : 'None selected'}
- **Selection rationale:** ${canonicalDraft ? canonicalDraft.selectionRationale : 'No obvious draft-like file was found.'}

## Deferred Artifacts

These are intentionally not generated during import unless explicitly requested.

| Artifact | Reason Deferred | Recommended Command |
|----------|-----------------|---------------------|
| RESEARCH.json / RESEARCH.md | Research compression should happen in a fresh context | \`/gpd-research\` |
| OUTLINE.md | Structure should be created or validated after research/brief clarity | \`/gpd-outline --lite\` for triage, \`/gpd-outline --deep\` for serious/researched/high-stakes papers |
| FACT-CHECK.md | Claim audit should happen after draft/context is selected | \`/gpd-fact-check --risk-scan\` or \`/gpd-fact-check --full\` |
| REVIEW.md | Review should happen after import context is cleared | \`/gpd-review\` |

## Imported Research / Reference Material

| Path In original/ | Type | Should Inform |
|-------------------|------|---------------|
${researchRows}

## Imported Outline / Review Material

| Path In original/ | Type | Notes |
|-------------------|------|-------|
${outlineRows}

## Assumptions

- CLI import preserved files and produced only minimal setup artifacts.
- Strategy, research, outline, fact-check, and review should run as separate stages.

## Open Questions

- Confirm paper thesis, audience, and desired outcome in \`.paper/BRIEF.md\`.
- Confirm whether the selected canonical draft is the right working draft.

## Post-Import Choices

Strategy gate status: [\`Revise Before Drafting\`]

Primary strategy blocker: [\`thesis_weak\`]

If strategy gate status is \`Revise Before Drafting\` or \`No-Go\`, do not use the choices below yet. Run \`/gpd-brief\` first unless the user explicitly overrides the strategy block.

Choose one when strategy gate status is \`Go\`:

1. \`/gpd-research\` - research imported/source material and compress evidence for and against the argument.
2. \`/gpd-outline --lite\` - quickly triage or rebuild structure; use \`/gpd-outline --deep\` for serious, researched, high-stakes, or 1,200+ word papers.
3. \`/gpd-review --external\` - review the current draft locally and with available external models.

Conditional note: if this imported draft is publication-sensitive and contains material factual, current, technical, market, regulatory, numerical, or citation-dependent claims, run \`/gpd-fact-check --risk-scan\` before external review or export.

## Suggested Choice

\`/gpd-brief\`

## Why

Imported material needs a confirmed thesis, audience, reader promise, and strategy gate before downstream stages.
`;
}

function importPaper(input = {}) {
  if (!input.source) throw new Error('Missing required option: --source');
  if (!input.location && !input.paper) throw new Error('Missing required option: --location');

  const paperDir = resolvePaperDir(input);
  const dryRun = Boolean(input.dryRun);
  ensureNotExistingPaper(paperDir);

  const scan = walkSource(input.source, input.maxFileBytes || maxDefaultFileBytes);
  const sourceIsFile = fs.statSync(scan.source).isFile();
  const canonicalDraft = selectCanonicalDraft(scan.files, sourceIsFile);

  mkdirp(paperDir, dryRun);
  mkdirp(path.join(paperDir, 'original'), dryRun);
  mkdirp(path.join(paperDir, '.paper'), dryRun);
  mkdirp(path.join(paperDir, '.paper', 'sources'), dryRun);
  mkdirp(path.join(paperDir, '.paper', 'exports'), dryRun);

  for (const file of scan.files) {
    copyFile(file.abs, path.join(paperDir, 'original', file.rel), dryRun);
  }

  const title = input.title || input.slug || path.basename(paperDir);
  const machineState = defaultMachineState({
    postImportChoices: [
      '/gpd-research',
      '/gpd-outline --lite',
      '/gpd-review --external',
    ],
  });
  writeSetupArtifacts(
    paperDir,
    title,
    'Imported material needs confirmed thesis, audience, reader promise, scope, and desired outcome.',
    dryRun,
    machineState,
  );
  writeFile(
    path.join(paperDir, '.paper', 'IMPORT.md'),
    importReport({ ...input, source: scan.source, paperDir }, scan.files, scan.skipped, canonicalDraft),
    dryRun,
  );

  if (canonicalDraft && isTextDraftCandidate(canonicalDraft)) {
    const draft = fs.readFileSync(canonicalDraft.abs, 'utf8');
    writeFile(path.join(paperDir, '.paper', 'DRAFT.md'), draft, dryRun);
  }

  console.log(`${dryRun ? 'Dry run complete' : 'Imported paper'}: ${paperDir}`);
  console.log(`files copied: ${scan.files.length}`);
  console.log(`files skipped: ${scan.skipped.length}`);
  if (canonicalDraft) console.log(`canonical draft candidate: original/${canonicalDraft.rel}`);
  return { paperDir, copied: scan.files.length, skipped: scan.skipped.length };
}

module.exports = {
  importPaper,
  classifyFile,
};
