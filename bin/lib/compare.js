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
const MAX_ADVISORIES_PER_CATEGORY = 3;
const DEFAULT_TIER2B_CATALOG_PATH = path.resolve(__dirname, '..', '..', 'references', 'tier2b-patterns.json');

const stopwords = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between',
  'could', 'every', 'first', 'from', 'have', 'into', 'more', 'must', 'need',
  'needs', 'only', 'paper', 'section', 'should', 'than', 'that', 'their',
  'there', 'these', 'this', 'those', 'through', 'what', 'when', 'where',
  'which', 'while', 'with', 'would',
]);

function wordCount(markdown) {
  const words = String(markdown || '').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g);
  return words ? words.length : 0;
}

function words(value) {
  return String(value || '').toLowerCase().match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g) || [];
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeCategory(base = {}, extension = {}) {
  const merged = { ...base, ...extension };
  if (Array.isArray(base.patterns) || Array.isArray(extension.patterns)) {
    merged.patterns = [
      ...(Array.isArray(base.patterns) ? base.patterns : []),
      ...(Array.isArray(extension.patterns) ? extension.patterns : []),
    ];
  }
  return merged;
}

function mergePatternCatalog(base, extension) {
  const merged = deepClone(base || { version: 1, categories: {} });
  const extensionCategories = extension && extension.categories ? extension.categories : {};
  merged.categories = merged.categories || {};
  for (const [category, value] of Object.entries(extensionCategories)) {
    merged.categories[category] = mergeCategory(merged.categories[category], value);
  }
  return merged;
}

function loadTier2bCatalog(paperDir) {
  const fallback = readJsonIfExists(DEFAULT_TIER2B_CATALOG_PATH) || { version: 1, categories: {} };
  const paperCatalog = paperDir
    ? readJsonIfExists(path.join(paperDir, '.paper', 'tier2b-patterns.json'))
    : null;
  return paperCatalog ? mergePatternCatalog(fallback, paperCatalog) : fallback;
}

function categoryConfig(catalog, category) {
  return catalog && catalog.categories && catalog.categories[category] ? catalog.categories[category] : {};
}

function compilePatterns(patterns) {
  return (Array.isArray(patterns) ? patterns : [])
    .map((pattern) => {
      try {
        return new RegExp(pattern, 'i');
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeHeading(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(value) {
  const words = String(value || '').toLowerCase().match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g) || [];
  return new Set(words.filter((word) => word.length > 2));
}

function tokenSimilarity(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let shared = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) shared += 1;
  }
  return shared / Math.max(leftTokens.size, rightTokens.size);
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

function firstParagraph(markdown) {
  const paragraphs = String(markdown || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !/^#{1,6}\s+/.test(block));
  return paragraphs[0] || '';
}

function sections(markdown) {
  const found = [];
  const re = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    found.push({
      level: match[1].length,
      text: match[2].trim(),
      normalized: normalizeHeading(match[2]),
      start: match.index,
      bodyStart: re.lastIndex,
    });
  }
  return found.map((section, index) => {
    const next = found[index + 1];
    const body = String(markdown || '').slice(section.bodyStart, next ? next.start : undefined);
    return {
      level: section.level,
      text: section.text,
      normalized: section.normalized,
      index,
      first_paragraph: firstParagraph(body),
    };
  });
}

function excerpt(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 600);
}

function sentences(markdown) {
  return String(markdown || '')
    .replace(/^#{1,6}\s+.+$/gm, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function blocks(markdown) {
  return String(markdown || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function proseBlocks(markdown) {
  return blocks(markdown).filter((block) => !/^#{1,6}\s+/.test(block));
}

function normalizedPhrase(value) {
  return words(value).join(' ');
}

function hasDefinition(markdown, term) {
  const escaped = normalizedPhrase(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return false;
  const normalized = normalizedPhrase(markdown);
  return new RegExp(`${escaped}\\s+(means|refers to|is|are|defined as)\\b`).test(normalized)
    || new RegExp(`by\\s+${escaped}\\s+i\\s+mean\\b`).test(normalized)
    || new RegExp(`what\\s+${escaped}\\s+means\\b`).test(normalized);
}

function pushAdvisory(findings, category, message, evidence, recommendation, location = 'candidate') {
  const existingCount = findings.filter((finding) => finding.category === category).length;
  if (existingCount >= MAX_ADVISORIES_PER_CATEGORY) return;
  findings.push({
    id: `PA-${String(findings.length + 1).padStart(3, '0')}`,
    category,
    severity: 'advisory',
    message,
    evidence: excerpt(evidence),
    location,
    recommendation,
  });
}

function draftingScaffoldAdvisories(candidate, findings, catalog) {
  const config = categoryConfig(catalog, 'drafting_scaffold_leak');
  const patterns = compilePatterns(config.patterns);
  for (const sentence of sentences(candidate)) {
    if (patterns.some((pattern) => pattern.test(sentence))) {
      pushAdvisory(
        findings,
        'drafting_scaffold_leak',
        'Candidate may include drafting scaffolding instead of direct argument.',
        sentence,
        'Prefer making the argument directly in reader-facing prose.',
      );
    }
  }
}

function repeatedRestatementAdvisories(candidate, findings, catalog) {
  const config = categoryConfig(catalog, 'repeated_restatement');
  const minWords = Number.isFinite(config.min_words) ? config.min_words : 12;
  const similarityThreshold = Number.isFinite(config.similarity_threshold) ? config.similarity_threshold : 0.72;
  const paragraphs = proseBlocks(candidate).filter((block) => wordCount(block) >= minWords);
  for (let index = 0; index < paragraphs.length - 1; index += 1) {
    const similarity = tokenSimilarity(paragraphs[index], paragraphs[index + 1]);
    if (similarity >= similarityThreshold) {
      pushAdvisory(
        findings,
        'repeated_restatement',
        `Adjacent paragraphs are mechanically similar (${Math.round(similarity * 100)}%).`,
        `${paragraphs[index]}\n\n${paragraphs[index + 1]}`,
        'Consider merging or cutting one restatement unless the repetition is intentional rhythm.',
      );
    }
  }
}

function defendedJargonAdvisories(candidate, findings, catalog) {
  const config = categoryConfig(catalog, 'defended_jargon');
  const patterns = compilePatterns(config.patterns);
  for (const sentence of sentences(candidate)) {
    if (patterns.some((pattern) => pattern.test(sentence))) {
      pushAdvisory(
        findings,
        'defended_jargon',
        'Candidate appears to introduce a term that needs immediate defense or explanation.',
        sentence,
        'Use a plain functional name, define the term once, or cut the term if the explanation costs more than it adds.',
      );
    }
  }
}

function repeatedDistinctiveTerms(markdown, minCount = 2) {
  const counts = new Map();
  const quoted = String(markdown || '').matchAll(/["']([^"'\n]{4,60})["']/g);
  for (const match of quoted) {
    const term = normalizedPhrase(match[1]);
    if (term) counts.set(term, (counts.get(term) || 0) + 1);
  }
  const hyphenated = String(markdown || '').match(/\b[a-z][a-z0-9]+(?:-[a-z0-9]+)+\b/gi) || [];
  for (const termValue of hyphenated) {
    const term = normalizedPhrase(termValue);
    if (term) counts.set(term, (counts.get(term) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .map(([term, count]) => ({ term, count }));
}

function undefinedLoadBearingTermAdvisories(candidate, findings, catalog) {
  const config = categoryConfig(catalog, 'undefined_load_bearing_term');
  const minCount = Number.isFinite(config.min_count) ? config.min_count : 2;
  for (const { term, count } of repeatedDistinctiveTerms(candidate, minCount)) {
    if (hasDefinition(candidate, term)) continue;
    pushAdvisory(
      findings,
      'undefined_load_bearing_term',
      `Repeated distinctive term appears undefined: "${term}" (${count} uses).`,
      term,
      'Define the term once in plain language or replace it with functional wording.',
    );
  }
}

function multiClauseOverloadAdvisories(candidate, findings, catalog) {
  const config = categoryConfig(catalog, 'multi_clause_overload');
  const minWords = Number.isFinite(config.min_words) ? config.min_words : 35;
  const minClauseSignals = Number.isFinite(config.min_clause_signals) ? config.min_clause_signals : 5;
  for (const sentence of sentences(candidate)) {
    const sentenceWords = wordCount(sentence);
    const punctuationClauses = (sentence.match(/[,;:]/g) || []).length;
    const conjunctions = (sentence.match(/\b(and|or|but|because|while|although|therefore|however)\b/gi) || []).length;
    if (sentenceWords >= minWords && punctuationClauses + conjunctions >= minClauseSignals) {
      pushAdvisory(
        findings,
        'multi_clause_overload',
        `Long sentence carries many clause boundaries (${sentenceWords} words, ${punctuationClauses + conjunctions} clause signals).`,
        sentence,
        'Split the sentence or convert it into a tighter sequence so the reader does not have to parse the structure.',
      );
    }
  }
}

function repeatedContentPhrases(markdown, config = {}) {
  const contentWords = words(markdown).filter((word) => word.length > 3 && !stopwords.has(word));
  const counts = new Map();
  const minCount = Number.isFinite(config.min_count) ? config.min_count : 3;
  const ngramMin = Number.isFinite(config.ngram_min) ? config.ngram_min : 2;
  const ngramMax = Number.isFinite(config.ngram_max) ? config.ngram_max : 3;
  for (let size = ngramMin; size <= ngramMax; size += 1) {
    for (let index = 0; index <= contentWords.length - size; index += 1) {
      const phrase = contentWords.slice(index, index + size).join(' ');
      counts.set(phrase, (counts.get(phrase) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([phrase, count]) => count >= minCount && !phrase.split(' ').some((word) => stopwords.has(word)))
    .sort((left, right) => right[1] - left[1])
    .map(([phrase, count]) => ({ phrase, count }));
}

function abandonedTerminologyAdvisories(accepted, candidate, findings, catalog) {
  const config = categoryConfig(catalog, 'abandoned_terminology');
  const candidateNormalized = normalizedPhrase(candidate);
  for (const { phrase, count } of repeatedContentPhrases(accepted, config)) {
    if (candidateNormalized.includes(phrase)) continue;
    pushAdvisory(
      findings,
      'abandoned_terminology',
      `Accepted baseline repeated "${phrase}" (${count} uses), but candidate no longer uses it.`,
      phrase,
      'Confirm the terminology was intentionally replaced; otherwise restore the accepted term or name the replacement.',
      'accepted baseline',
    );
  }
}

function proseAdvisories(accepted, candidate, catalog) {
  const findings = [];
  draftingScaffoldAdvisories(candidate, findings, catalog);
  repeatedRestatementAdvisories(candidate, findings, catalog);
  defendedJargonAdvisories(candidate, findings, catalog);
  undefinedLoadBearingTermAdvisories(candidate, findings, catalog);
  multiClauseOverloadAdvisories(candidate, findings, catalog);
  abandonedTerminologyAdvisories(accepted, candidate, findings, catalog);
  return findings;
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

function comparableRenamedSection(acceptedSection, candidateSections, usedCandidateIndexes) {
  let best = null;
  for (const candidateSection of candidateSections) {
    if (usedCandidateIndexes.has(candidateSection.index)) continue;
    if (candidateSection.level !== acceptedSection.level) continue;
    if (candidateSection.normalized === acceptedSection.normalized) continue;
    const sameOrder = candidateSection.index === acceptedSection.index;
    if (!sameOrder) continue;
    const heading_similarity = tokenSimilarity(acceptedSection.text, candidateSection.text);
    const body_similarity = tokenSimilarity(acceptedSection.first_paragraph, candidateSection.first_paragraph);
    if (heading_similarity < 0.4 || body_similarity < 0.6) continue;
    if (!best || body_similarity > best.body_similarity || (
      body_similarity === best.body_similarity && heading_similarity > best.heading_similarity
    )) {
      best = {
        from: acceptedSection.text,
        to: candidateSection.text,
        heading_similarity: Math.round(heading_similarity * 100) / 100,
        body_similarity: Math.round(body_similarity * 100) / 100,
        order: acceptedSection.index,
        candidateIndex: candidateSection.index,
      };
    }
  }
  return best;
}

function headingDiff(acceptedHeadings, candidateHeadings, acceptedSections, candidateSections) {
  const candidateSet = new Set(candidateHeadings.map((heading) => heading.normalized));
  const acceptedSet = new Set(acceptedHeadings.map((heading) => heading.normalized));
  const usedRenamedCandidateIndexes = new Set();
  const renamed = [];
  const removed = [];

  for (const heading of acceptedHeadings) {
    if (candidateSet.has(heading.normalized)) continue;
    const acceptedSection = acceptedSections.find((section) => section.normalized === heading.normalized);
    const rename = acceptedSection
      ? comparableRenamedSection(acceptedSection, candidateSections, usedRenamedCandidateIndexes)
      : null;
    if (rename) {
      usedRenamedCandidateIndexes.add(rename.candidateIndex);
      renamed.push({
        from: rename.from,
        to: rename.to,
        heading_similarity: rename.heading_similarity,
        body_similarity: rename.body_similarity,
        order: rename.order,
      });
    } else {
      removed.push(heading.text);
    }
  }

  return {
    removed,
    renamed,
    added: candidateHeadings
      .filter((heading) => !acceptedSet.has(heading.normalized))
      .filter((heading) => !usedRenamedCandidateIndexes.has(candidateSections.find((section) => section.normalized === heading.normalized)?.index))
      .map((heading) => heading.text),
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
    `- **Renamed headings:** ${report.metrics.renamed_headings.length ? report.metrics.renamed_headings.map((heading) => `${heading.from} -> ${heading.to}`).join('; ') : 'None'}`,
    `- **Added headings:** ${report.metrics.added_headings.length ? report.metrics.added_headings.join('; ') : 'None'}`,
    '',
    '## Advisory Findings',
    '',
  ];

  if (report.advisory_findings.length === 0) {
    lines.push('- None.');
  } else {
    for (const finding of report.advisory_findings) {
      lines.push(`### ${finding.id} -- ${finding.category} -- ${finding.severity}`);
      lines.push('');
      lines.push(`- **Message:** ${finding.message}`);
      lines.push(`- **Location:** ${finding.location}`);
      lines.push(`- **Evidence:** ${finding.evidence || 'None'}`);
      lines.push(`- **Recommendation:** ${finding.recommendation}`);
      lines.push('');
    }
  }

  lines.push(
    '',
    '## Changed Spans',
    '',
  );

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
  const tier2bCatalog = loadTier2bCatalog(paperDir);
  const acceptedHeadings = headings(accepted);
  const candidateHeadings = headings(candidate);
  const acceptedSections = sections(accepted);
  const candidateSections = sections(candidate);
  const headingChanges = headingDiff(acceptedHeadings, candidateHeadings, acceptedSections, candidateSections);
  const acceptedWords = wordCount(accepted);
  const candidateWords = wordCount(candidate);
  const wordDelta = candidateWords - acceptedWords;
  const wordDeltaPct = acceptedWords > 0 ? Math.round((wordDelta / acceptedWords) * 1000) / 10 : 0;
  const spans = changedSpans(accepted, candidate);
  const advisoryFindings = proseAdvisories(accepted, candidate, tier2bCatalog);
  const metrics = {
    word_count_delta: wordDelta,
    word_count_delta_pct: wordDeltaPct,
    removed_headings: headingChanges.removed,
    renamed_headings: headingChanges.renamed,
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
    advisory_findings: advisoryFindings,
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
  console.log(`Advisories: ${report.advisory_findings.length}`);
  if (report.metrics.removed_headings.length > 0) {
    console.log(`Removed headings: ${report.metrics.removed_headings.join('; ')}`);
  }
  if (report.metrics.renamed_headings.length > 0) {
    console.log(`Renamed headings: ${report.metrics.renamed_headings.map((heading) => `${heading.from} -> ${heading.to}`).join('; ')}`);
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
