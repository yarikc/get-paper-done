'use strict';

const fs = require('fs');
const path = require('path');

const {
  basenameLabel,
  displayPath,
  fileSha256,
  writeFile,
} = require('./common');
const {
  findPaperDir,
  status,
} = require('./state');

const WORD_DELTA_RISK_PCT = 30;
const WORD_DELTA_RISK_MIN_WORDS = 200;

function wordCount(markdown) {
  const words = String(markdown || '').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g);
  return words ? words.length : 0;
}

function normalizeHeading(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function headings(markdown) {
  const found = [];
  const re = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    found.push({
      level: match[1].length,
      text: match[2].trim(),
      normalized: normalizeHeading(match[2]),
    });
  }
  return found;
}

function excerpt(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 600);
}

function blocks(markdown) {
  return String(markdown || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function lcsPairs(left, right) {
  const table = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return pairs;
}

function changedSpans(accepted, candidate) {
  const before = blocks(accepted);
  const after = blocks(candidate);
  const pairs = lcsPairs(before, after);
  const spans = [];
  let beforeCursor = 0;
  let afterCursor = 0;

  function pushSpan(removed, added) {
    if (removed.length === 0 && added.length === 0) return;
    const kind = removed.length > 0 && added.length > 0
      ? 'changed'
      : removed.length > 0 ? 'removed' : 'added';
    const risk = {
      changed: 'May alter argument, evidence, voice, or audience fit relative to the accepted baseline.',
      removed: 'May remove baseline structure, evidence, or voice that the author previously accepted.',
      added: 'May add scope, length, hedge density, or unsupported claims.',
    }[kind];
    spans.push({
      id: `CS-${String(spans.length + 1).padStart(3, '0')}`,
      kind,
      status: 'proposed',
      reason: 'Detected by gpd compare against the accepted baseline.',
      source: '.paper/accepted/ACCEPTED.md -> .paper/DRAFT.md',
      expected_benefit: 'Author must confirm the benefit before accepting or applying this change.',
      risk,
      before_excerpt: excerpt(removed.join('\n\n')),
      after_excerpt: excerpt(added.join('\n\n')),
    });
  }

  for (const [beforeIndex, afterIndex] of pairs) {
    pushSpan(before.slice(beforeCursor, beforeIndex), after.slice(afterCursor, afterIndex));
    beforeCursor = beforeIndex + 1;
    afterCursor = afterIndex + 1;
  }
  pushSpan(before.slice(beforeCursor), after.slice(afterCursor));
  return spans;
}

function headingDiff(acceptedHeadings, candidateHeadings) {
  const candidateSet = new Set(candidateHeadings.map((heading) => heading.normalized));
  const acceptedSet = new Set(acceptedHeadings.map((heading) => heading.normalized));
  return {
    removed: acceptedHeadings.filter((heading) => !candidateSet.has(heading.normalized)).map((heading) => heading.text),
    added: candidateHeadings.filter((heading) => !acceptedSet.has(heading.normalized)).map((heading) => heading.text),
  };
}

function compareVerdict(spans, metrics) {
  if (spans.length === 0) {
    return {
      pairwise: 'unchanged',
      recommendation: 'no action',
      summary: 'Candidate draft is unchanged from the accepted baseline.',
    };
  }
  const largeWordDelta = Math.abs(metrics.word_count_delta_pct) > WORD_DELTA_RISK_PCT
    && Math.abs(metrics.word_count_delta) > WORD_DELTA_RISK_MIN_WORDS;
  if (metrics.removed_headings.length > 0 || largeWordDelta) {
    return {
      pairwise: 'regression_risk',
      recommendation: 'review before accept',
      summary: 'Candidate has baseline-relative regression risk; review removed headings and word-count movement before accepting.',
    };
  }
  return {
    pairwise: 'changed_inconclusive',
    recommendation: 'review before accept',
    summary: 'Candidate differs from the accepted baseline; GPD cannot declare it better without human review.',
  };
}

function renderChangeSetMarkdown(report) {
  const lines = [
    '# Change Set',
    '',
    '## Verdict',
    '',
    `- **Candidate vs accepted:** ${report.verdict.pairwise}`,
    `- **Recommendation:** ${report.verdict.recommendation}`,
    `- **Summary:** ${report.verdict.summary}`,
    '',
    '## Baseline',
    '',
    `- **Accepted:** ${report.baseline.path}`,
    `- **Candidate:** ${report.candidate.path}`,
    `- **Accepted SHA-256:** ${report.baseline.sha256}`,
    `- **Candidate SHA-256:** ${report.candidate.sha256}`,
    `- **Accepted words:** ${report.baseline.word_count}`,
    `- **Candidate words:** ${report.candidate.word_count}`,
    `- **Word delta:** ${report.metrics.word_count_delta} (${report.metrics.word_count_delta_pct}%)`,
    '',
    '## Structural Delta',
    '',
    `- **Removed headings:** ${report.metrics.removed_headings.length ? report.metrics.removed_headings.join('; ') : 'None'}`,
    `- **Added headings:** ${report.metrics.added_headings.length ? report.metrics.added_headings.join('; ') : 'None'}`,
    '',
    '## Changed Spans',
    '',
  ];

  if (report.changed_spans.length === 0) {
    lines.push('- None.');
  } else {
    for (const span of report.changed_spans) {
      lines.push(`### ${span.id} -- ${span.kind} -- ${span.status}`);
      lines.push('');
      lines.push(`- **Reason:** ${span.reason}`);
      lines.push(`- **Source:** ${span.source}`);
      lines.push(`- **Expected benefit:** ${span.expected_benefit}`);
      lines.push(`- **Risk:** ${span.risk}`);
      lines.push(`- **Before:** ${span.before_excerpt || 'None'}`);
      lines.push(`- **After:** ${span.after_excerpt || 'None'}`);
      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

function comparePaper(input = {}) {
  const paperDir = findPaperDir(input.paper || process.cwd());
  if (!paperDir) throw new Error('No .paper workspace found. Run from a paper directory or pass --paper DIR.');
  const meta = path.join(paperDir, '.paper');
  const acceptedPath = path.join(meta, 'accepted', 'ACCEPTED.md');
  const candidatePath = path.join(meta, 'DRAFT.md');
  if (!fs.existsSync(acceptedPath)) throw new Error('No accepted baseline found. Run gpd accept before gpd compare.');
  if (!fs.existsSync(candidatePath)) throw new Error('No candidate draft found at .paper/DRAFT.md.');

  const accepted = fs.readFileSync(acceptedPath, 'utf8');
  const candidate = fs.readFileSync(candidatePath, 'utf8');
  const acceptedHeadings = headings(accepted);
  const candidateHeadings = headings(candidate);
  const headingChanges = headingDiff(acceptedHeadings, candidateHeadings);
  const acceptedWords = wordCount(accepted);
  const candidateWords = wordCount(candidate);
  const wordDelta = candidateWords - acceptedWords;
  const wordDeltaPct = acceptedWords > 0 ? Math.round((wordDelta / acceptedWords) * 1000) / 10 : 0;
  const spans = changedSpans(accepted, candidate);
  const metrics = {
    word_count_delta: wordDelta,
    word_count_delta_pct: wordDeltaPct,
    removed_headings: headingChanges.removed,
    added_headings: headingChanges.added,
    changed_span_count: spans.length,
  };
  const report = {
    version: 1,
    created_at: new Date().toISOString(),
    baseline: {
      path: '.paper/accepted/ACCEPTED.md',
      sha256: fileSha256(acceptedPath),
      word_count: acceptedWords,
      headings: acceptedHeadings.map((heading) => ({ level: heading.level, text: heading.text })),
    },
    candidate: {
      path: '.paper/DRAFT.md',
      sha256: fileSha256(candidatePath),
      word_count: candidateWords,
      headings: candidateHeadings.map((heading) => ({ level: heading.level, text: heading.text })),
    },
    metrics,
    verdict: compareVerdict(spans, metrics),
    changed_spans: spans,
  };

  const jsonPath = path.join(meta, 'CHANGESET.json');
  const markdownPath = path.join(meta, 'CHANGESET.md');
  writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, input.dryRun);
  writeFile(markdownPath, renderChangeSetMarkdown(report), input.dryRun);

  return {
    paperDir,
    report,
    jsonPath,
    markdownPath,
    dryRun: Boolean(input.dryRun),
  };
}

function printCompare(result) {
  const { report } = result;
  console.log(result.dryRun ? 'Change set would be updated' : 'Change set updated');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Verdict: ${report.verdict.pairwise}`);
  console.log(`Recommendation: ${report.verdict.recommendation}`);
  console.log(`Word delta: ${report.metrics.word_count_delta} (${report.metrics.word_count_delta_pct}%)`);
  console.log(`Changed spans: ${report.changed_spans.length}`);
  if (report.metrics.removed_headings.length > 0) {
    console.log(`Removed headings: ${report.metrics.removed_headings.join('; ')}`);
  }
  console.log(`Report: ${displayPath(result.paperDir, result.markdownPath)}`);
  console.log(`JSON: ${displayPath(result.paperDir, result.jsonPath)}`);
  console.log('');
  console.log(report.verdict.pairwise === 'unchanged'
    ? 'Next: gpd status'
    : 'Next: review CHANGESET.md before accepting, revising, or restoring the baseline');
}

module.exports = {
  comparePaper,
  printCompare,
};
