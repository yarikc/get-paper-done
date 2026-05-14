'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

function isDocxDraftCandidate(file) {
  return /\.docx$/i.test(file.rel);
}

function findEndOfCentralDirectory(buffer) {
  const signature = 0x06054b50;
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  return -1;
}

function zipEntry(buffer, entryName) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) throw new Error('DOCX zip directory not found');

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Malformed DOCX zip directory');
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.slice(offset + 46, offset + 46 + nameLength).toString('utf8');

    if (name === entryName) {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Malformed DOCX local header');
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.slice(dataOffset, dataOffset + compressedSize);
      if (compression === 0) return data;
      if (compression === 8) return zlib.inflateRawSync(data);
      throw new Error(`Unsupported DOCX compression method: ${compression}`);
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`${entryName} not found in DOCX`);
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function textFromDocumentXml(xml) {
  return xml
    .split(/<\/w:p>/i)
    .map((paragraph) => {
      const parts = [];
      for (const match of paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi)) {
        parts.push(decodeXmlEntities(match[1]));
      }
      return parts.join('');
    })
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

function extractDocxText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const documentXml = zipEntry(buffer, 'word/document.xml').toString('utf8');
  return textFromDocumentXml(documentXml);
}

function sourceDetectionText(file) {
  if (/\.(md|txt)$/i.test(file.rel)) return fs.readFileSync(file.abs, 'utf8');
  if (isDocxDraftCandidate(file)) return extractDocxText(file.abs);
  return null;
}

function cleanSourceReference(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[),.;:]+$/g, '')
    .trim()
    .slice(0, 180);
}

function detectSourceReferences(files, limit = 30) {
  const results = [];
  const seen = new Set();
  const urlPattern = /\bhttps?:\/\/[^\s<>)\]]+/gi;
  const doiPattern = /\b(?:doi:\s*)?10\.\d{4,9}\/[^\s<>)\]]+/gi;
  const namedSourcePattern = /\b(?:NIST(?:\s+(?:SP|AI RMF|CSF|Cybersecurity Framework|GenAI Profile)\s*[A-Z0-9 .-]*)?|OWASP(?:\s+(?:LLM|Top|ASVS|SAMM|API|Application|Software)[A-Za-z0-9 .-]*)?|CISA|NCSC|SLSA|OpenSSF|ISO\/IEC\s+\d[\d:-]*|RFC\s+\d{3,5}|W3C|IETF|SEC|FDIC|OCC|Federal Reserve|Basel\s+[IVX]+)\b/g;

  function add(file, type, reference) {
    const cleaned = cleanSourceReference(reference);
    if (!cleaned) return;
    const key = `${file.rel}:${type}:${cleaned.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({
      rel: file.rel,
      type,
      reference: cleaned,
    });
  }

  for (const file of files) {
    let text = null;
    try {
      text = sourceDetectionText(file);
    } catch (_error) {
      text = null;
    }
    if (!text) continue;

    for (const line of text.split(/\n+/)) {
      const cleanLine = line.replace(/\s+/g, ' ').trim();
      if (!cleanLine) continue;

      for (const match of cleanLine.matchAll(urlPattern)) add(file, 'url', match[0]);
      for (const match of cleanLine.matchAll(doiPattern)) add(file, 'doi', match[0]);
      for (const match of cleanLine.matchAll(namedSourcePattern)) add(file, 'named_reference', match[0]);

      const sourceLine = cleanLine.match(/^(?:source|sources|reference|references|standard|standards)\s*[:|-]\s*(.+)$/i);
      if (sourceLine) add(file, 'source_line', sourceLine[1]);

      if (results.length >= limit) return results;
    }
  }

  return results;
}

function fileAge(file) {
  return fs.statSync(file.abs).mtimeMs;
}

function versionScore(value) {
  const matches = [...value.matchAll(/(?:^|[^a-z0-9])v?(\d+(?:\.\d+){0,3})(?:[^a-z0-9]|$)/gi)];
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((match) => {
    const parts = match[1].split('.').map((part) => Number(part));
    return parts.reduce((score, part, index) => score + (part * (100 ** (3 - index))), 0);
  }));
}

function draftCandidateScore(file) {
  const lower = file.rel.toLowerCase().split(path.sep).join('/');
  const base = path.basename(lower);
  let score = 0;

  if (base.includes('latest')) score += 900;
  if (base.includes('current')) score += 850;
  if (base.includes('final')) score += 700;
  if (base.includes('working')) score += 500;
  if (base.includes('draft')) score += 400;
  if (base.includes('paper')) score += 250;
  if (lower.startsWith('drafts/') || lower.includes('/drafts/')) score += 150;
  if (base.endsWith('.md') || base.endsWith('.txt')) score += 100;
  if (base.endsWith('.docx')) score += 80;

  const version = versionScore(base);
  if (version > 0) score += Math.min(version, 500);

  if (base.includes('old') || base.includes('previous') || base.includes('archive')) score -= 600;
  if (lower.startsWith('archive/') || lower.includes('/archive/')) score -= 500;
  if (lower.startsWith('versions/') || lower.includes('/versions/')) score -= 200;

  return score;
}

function draftSelectionRationale(ranked) {
  const winner = ranked[0];
  const next = ranked[1];
  const base = 'Highest-ranked imported draft-like file using filename cues, version cues, location, and modified time.';
  if (!next) return base;
  if (winner.score !== next.score) return `${base} Winning score ${winner.score}; next score ${next.score}.`;
  return `${base} Scores tied at ${winner.score}; newest modified time won.`;
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
  const ranked = candidates
    .map((file) => ({ file, score: draftCandidateScore(file), mtime: fileAge(file) }))
    .sort((a, b) => (
      b.score - a.score
      || b.mtime - a.mtime
      || a.file.rel.localeCompare(b.file.rel)
    ));
  return {
    ...ranked[0].file,
    selectionRationale: draftSelectionRationale(ranked),
  };
}

function reportPathLabel(value) {
  return path.basename(path.resolve(expandHome(value)));
}

function byClassification(files) {
  return files.reduce((counts, file) => {
    counts[file.classification] = (counts[file.classification] || 0) + 1;
    return counts;
  }, {});
}

function bytesLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function importInventory(files, skipped, maxBytes) {
  const counts = byClassification(files);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const draftCandidates = files.filter((file) => file.classification === 'draft');
  const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 5);
  const warnings = [];

  if (files.length > 75) warnings.push('Large import set: review the copied file list before running downstream stages.');
  if (draftCandidates.length > 1) warnings.push('Multiple draft-like files found: confirm the selected canonical draft before drafting or review.');
  if (skipped.length > 0) warnings.push('Some files were skipped: review skip reasons before assuming the import is complete.');

  return {
    counts,
    totalBytes,
    draftCandidates,
    largest,
    warnings,
    maxBytes,
  };
}

function classificationRows(inventory) {
  const order = ['draft', 'research', 'outline', 'review', 'spec', 'notes', 'asset', 'unclear'];
  return order
    .filter((name) => inventory.counts[name])
    .map((name) => `| ${name} | ${inventory.counts[name]} |`)
    .join('\n') || '| - | 0 |';
}

function classificationSummary(inventory) {
  const order = ['draft', 'research', 'outline', 'review', 'spec', 'notes', 'asset', 'unclear'];
  return order
    .filter((name) => inventory.counts[name])
    .map((name) => `${name}=${inventory.counts[name]}`)
    .join(', ') || 'none';
}

function largestRows(inventory) {
  return inventory.largest
    .map((file) => `| ${file.rel.split(path.sep).join('/')} | ${file.classification} | ${bytesLabel(file.size)} |`)
    .join('\n') || '| - | - | - |';
}

function draftCandidateRows(inventory, canonicalDraft) {
  return inventory.draftCandidates
    .map((file) => {
      const selected = canonicalDraft && file.rel === canonicalDraft.rel ? 'yes' : 'no';
      return `| ${file.rel.split(path.sep).join('/')} | ${draftCandidateScore(file)} | ${new Date(fileAge(file)).toISOString()} | ${selected} |`;
    })
    .join('\n') || '| - | - | - | - |';
}

function warningRows(inventory) {
  return inventory.warnings.map((warning) => `- ${warning}`).join('\n') || '- None.';
}

function draftSourcePath(file) {
  return `original/${file.rel.split(path.sep).join('/')}`;
}

function planDraftExtraction(canonicalDraft) {
  if (!canonicalDraft) {
    return {
      created: false,
      artifact: 'DRAFT.md',
      sourceBasis: '-',
      notes: 'No canonical draft was selected during import.',
    };
  }

  if (isTextDraftCandidate(canonicalDraft)) {
    return {
      created: true,
      artifact: 'DRAFT.md',
      sourceBasis: draftSourcePath(canonicalDraft),
      notes: 'Copied text from the selected Markdown/text draft.',
      content: fs.readFileSync(canonicalDraft.abs, 'utf8'),
    };
  }

  if (isDocxDraftCandidate(canonicalDraft)) {
    try {
      const text = extractDocxText(canonicalDraft.abs);
      if (!text.trim()) {
        return {
          created: false,
          artifact: 'DRAFT.md',
          sourceBasis: draftSourcePath(canonicalDraft),
          notes: 'DOCX text extraction returned no usable paragraphs; original remains preserved.',
        };
      }
      return {
        created: true,
        artifact: 'DRAFT.md',
        sourceBasis: draftSourcePath(canonicalDraft),
        notes: 'Plain paragraph text extracted from the selected DOCX draft; formatting, comments, and tracked changes are not imported.',
        content: `# Imported Draft\n\n<!-- Derived from ${draftSourcePath(canonicalDraft)} by gpd import text extraction. Original file remains unchanged under original/. -->\n\n${text.trim()}\n`,
      };
    } catch (error) {
      return {
        created: false,
        artifact: 'DRAFT.md',
        sourceBasis: draftSourcePath(canonicalDraft),
        notes: `DOCX text extraction failed (${error.message}); original remains preserved for manual review.`,
      };
    }
  }

  return {
    created: false,
    artifact: 'DRAFT.md',
    sourceBasis: draftSourcePath(canonicalDraft),
    notes: 'Selected draft format is preserved but not text-extracted by this import path.',
  };
}

function draftExtractionRows(draftExtraction) {
  const status = draftExtraction.created ? 'Created' : 'Deferred';
  return `| ${draftExtraction.artifact} | ${status} | ${draftExtraction.sourceBasis} | ${draftExtraction.notes} |`;
}

function markdownTableCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function sourceReferenceRows(sourceReferences) {
  return sourceReferences
    .map((item) => `| original/${item.rel.split(path.sep).join('/')} | ${item.type} | ${markdownTableCell(item.reference)} | Triage only; verify during research or fact-check. |`)
    .join('\n') || '| - | - | - | - |';
}

function importReport(input, copied, skipped, canonicalDraft, draftExtraction, sourceReferences) {
  const inventory = importInventory(copied, skipped, input.maxFileBytes || maxDefaultFileBytes);
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

Imported ${copied.length} file(s), skipped ${skipped.length} file(s), total copied size ${bytesLabel(inventory.totalBytes)}. Original material was preserved unchanged under \`original/\`.

Per-file skip threshold: ${bytesLabel(inventory.maxBytes)}.

## Import Inventory

| Classification | Count |
|----------------|-------|
${classificationRows(inventory)}

Largest copied files:

| Path | Classification | Size |
|------|----------------|------|
${largestRows(inventory)}

Warnings:

${warningRows(inventory)}

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

Draft candidates:

| Candidate | Score | Modified | Selected |
|-----------|-------|----------|----------|
${draftCandidateRows(inventory, canonicalDraft)}

## Draft Extraction

| Artifact | Status | Source Basis | Notes |
|----------|--------|--------------|-------|
${draftExtractionRows(draftExtraction)}

## Detected Source References

These are unverified import-time triage candidates. They are not evidence until \`/gpd-research\` or \`/gpd-fact-check\` verifies source relevance and claim support.

| Path In original/ | Type | Candidate Reference | Import Use |
|-------------------|------|---------------------|------------|
${sourceReferenceRows(sourceReferences)}

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
  const draftExtraction = planDraftExtraction(canonicalDraft);
  const sourceReferences = detectSourceReferences(scan.files);
  const inventory = importInventory(scan.files, scan.skipped, input.maxFileBytes || maxDefaultFileBytes);

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
    importReport({ ...input, source: scan.source, paperDir }, scan.files, scan.skipped, canonicalDraft, draftExtraction, sourceReferences),
    dryRun,
  );

  if (draftExtraction.created) {
    writeFile(path.join(paperDir, '.paper', 'DRAFT.md'), draftExtraction.content, dryRun);
  }

  console.log(`${dryRun ? 'Dry run complete' : 'Imported paper'}: ${paperDir}`);
  console.log(`files copied: ${scan.files.length}`);
  console.log(`files skipped: ${scan.skipped.length}`);
  console.log(`copied size: ${bytesLabel(inventory.totalBytes)}`);
  console.log(`classifications: ${classificationSummary(inventory)}`);
  if (inventory.warnings.length > 0) {
    console.log('warnings:');
    for (const warning of inventory.warnings) console.log(`- ${warning}`);
  }
  if (canonicalDraft) console.log(`canonical draft candidate: original/${canonicalDraft.rel}`);
  if (draftExtraction.created) console.log(`draft extraction: .paper/DRAFT.md from ${draftExtraction.sourceBasis}`);
  if (sourceReferences.length > 0) console.log(`source references detected: ${sourceReferences.length}`);
  return { paperDir, copied: scan.files.length, skipped: scan.skipped.length };
}

module.exports = {
  importPaper,
  classifyFile,
};
