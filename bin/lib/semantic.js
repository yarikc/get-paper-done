'use strict';

const fs = require('fs');
const path = require('path');

function issue(severity, artifact, message) {
  return { severity, issue: `${artifact}: ${message}` };
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return { data: null, error: null };
  try {
    return { data: JSON.parse(fs.readFileSync(filePath, 'utf8')), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

function metaPath(paperDir, artifactName) {
  return path.join(paperDir, '.paper', artifactName);
}

function normalizeTableCell(value) {
  return value.trim().replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
}

function sectionBetween(markdown, heading, nextHeadingPattern = /\n##\s+/) {
  if (!markdown) return '';
  const start = markdown.indexOf(heading);
  if (start === -1) return '';
  const afterStart = start + heading.length;
  const rest = markdown.slice(afterStart);
  const next = rest.search(nextHeadingPattern);
  return next === -1 ? rest : rest.slice(0, next);
}

function parseFirstTable(markdown) {
  const lines = markdown.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i += 1) {
    const header = lines[i].trim();
    const separator = lines[i + 1].trim();
    if (!header.startsWith('|') || !header.endsWith('|')) continue;
    if (!separator.startsWith('|') || !separator.endsWith('|')) continue;
    if (!/^\|[\s:-]+\|/.test(separator)) continue;

    const columns = header.slice(1, -1).split('|').map(normalizeTableCell);
    const rows = [];
    for (let j = i + 2; j < lines.length; j += 1) {
      const row = lines[j].trim();
      if (!row.startsWith('|') || !row.endsWith('|')) break;
      const cells = row.slice(1, -1).split('|').map(normalizeTableCell);
      const record = {};
      columns.forEach((column, index) => {
        record[column] = cells[index] || '';
      });
      rows.push(record);
    }
    return { columns, rows };
  }
  return { columns: [], rows: [] };
}

function parseMarkdownField(markdown, label) {
  if (!markdown) return null;
  const target = `**${label.toLowerCase()}:**`;
  for (const line of markdown.split(/\r?\n/)) {
    const normalized = line.trim().toLowerCase();
    if (normalized.startsWith(target)) {
      return line.trim().slice(target.length).replace(/`/g, '').trim();
    }
    const bulletNormalized = line.trim().replace(/^-+\s*/, '').toLowerCase();
    if (bulletNormalized.startsWith(target)) {
      const original = line.trim().replace(/^-+\s*/, '');
      return original.slice(target.length).replace(/`/g, '').trim();
    }
  }
  return null;
}

function isExplicitlyDeferred(value) {
  return /\[deferred\s*:[^\]]+\]/i.test(value);
}

function hasSourceId(value) {
  return /\bS\d+\b/.test(value);
}

const stopwords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'because',
  'by',
  'for',
  'from',
  'has',
  'have',
  'in',
  'into',
  'is',
  'it',
  'its',
  'not',
  'of',
  'on',
  'or',
  'rather',
  'than',
  'that',
  'the',
  'their',
  'this',
  'to',
  'when',
  'with',
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function tokenCoverage(needle, haystack) {
  const needleTokens = tokenize(needle);
  if (needleTokens.length === 0) return 0;
  const haystackTokens = new Set(tokenize(haystack));
  const matches = needleTokens.filter((token) => haystackTokens.has(token));
  return matches.length / needleTokens.length;
}

function parseNumberedItems(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^\d+\.\s+(.+)$/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);
}

function sourceIds(value) {
  return [...String(value || '').matchAll(/\bS\d+\b/g)].map((match) => match[0]);
}

function validateBriefClaimEvidence(paperDir) {
  const issues = [];
  const brief = readIfExists(metaPath(paperDir, 'BRIEF.md'));
  const research = readIfExists(metaPath(paperDir, 'RESEARCH.json'));
  if (!brief || !research) return issues;

  const sections = brief.split(/\n(?=### Claim \d+\s*:)/);
  for (const section of sections) {
    const heading = section.split(/\r?\n/).find((line) => line.startsWith('### Claim '));
    if (!heading) continue;
    const evidence = parseMarkdownField(section, 'What evidence supports it');
    if (!evidence) {
      issues.push(issue('HIGH', 'BRIEF.md', `${heading.replace(/^###\s*/, '')} is missing "What evidence supports it"`));
      continue;
    }
    if (hasSourceId(evidence) || isExplicitlyDeferred(evidence)) continue;
    issues.push(issue(
      'HIGH',
      'BRIEF.md',
      `${heading.replace(/^###\s*/, '')} evidence field must cite source IDs like S1 or use [deferred: reason] after research exists`,
    ));
  }
  return issues;
}

function validateStrategyReasoningSpine(paperDir) {
  const strategy = readIfExists(metaPath(paperDir, 'STRATEGY.md'));
  if (!strategy) return [];

  const thesis = parseMarkdownField(strategy, 'Recommended thesis') || parseMarkdownField(strategy, 'Current thesis');
  if (!thesis) return [];

  const spine = sectionBetween(strategy, '### Reasoning Spine');
  const items = parseNumberedItems(spine);
  const thesisNormalized = normalizeText(thesis);
  const issues = [];

  for (const item of items) {
    const itemNormalized = normalizeText(item);
    const itemIsSubstring = itemNormalized.length > 20 && thesisNormalized.includes(itemNormalized);
    const coverage = tokenCoverage(item, thesis);
    if (itemIsSubstring || coverage >= 0.6) {
      issues.push(issue(
        'MEDIUM',
        'STRATEGY.md',
        `Reasoning Spine item "${item}" appears to decompose or restate the thesis instead of independently supporting it`,
      ));
    }
  }

  return issues;
}

function plannedSourceTypes(research) {
  const questions = research
    && research.research_plan
    && Array.isArray(research.research_plan.inferred_research_questions)
    ? research.research_plan.inferred_research_questions
    : [];
  const planned = new Set();
  for (const question of questions) {
    if (!Array.isArray(question.planned_source_types)) continue;
    for (const sourceType of question.planned_source_types) {
      if (typeof sourceType === 'string' && sourceType.trim()) planned.add(sourceType.trim());
    }
  }
  return planned;
}

function actualSourceTypes(research) {
  const sources = research && Array.isArray(research.source_registry) ? research.source_registry : [];
  return new Set(
    sources
      .map((source) => source.source_type)
      .filter((sourceType) => typeof sourceType === 'string' && sourceType.trim()),
  );
}

function validateResearchSourceCoverage(paperDir) {
  const parsed = readJsonIfExists(metaPath(paperDir, 'RESEARCH.json'));
  if (!parsed.data) return [];

  const planned = plannedSourceTypes(parsed.data);
  const actual = actualSourceTypes(parsed.data);
  if (planned.size === 0 || actual.size === 0) return [];

  const missing = [...planned].filter((sourceType) => !actual.has(sourceType));
  if (missing.length === 0) return [];
  return [issue(
    'MEDIUM',
    'RESEARCH.json',
    `planned source types missing from source_registry: ${missing.join(', ')}`,
  )];
}

function validateResearchCounterevidence(paperDir) {
  const parsed = readJsonIfExists(metaPath(paperDir, 'RESEARCH.json'));
  if (!parsed.data || !Array.isArray(parsed.data.evidence_matrix) || parsed.data.evidence_matrix.length === 0) {
    return [];
  }

  const hasContradictingSource = parsed.data.evidence_matrix.some((row) => (
    Array.isArray(row.contradicting_sources) && row.contradicting_sources.length > 0
  ));
  if (hasContradictingSource) return [];

  const documentedReason = Array.isArray(parsed.data.contradictions)
    && parsed.data.contradictions.some((item) => {
      if (typeof item === 'string') return item.trim().length > 0;
      return item && typeof item === 'object' && Object.values(item).some((value) => String(value || '').trim());
    });
  if (documentedReason) return [];

  return [issue(
    'MEDIUM',
    'RESEARCH.json',
    'evidence_matrix has no contradicting_sources and contradictions does not document why counterevidence is unavailable',
  )];
}

function validateExportMetadataLeak(paperDir) {
  const final = readIfExists(metaPath(paperDir, 'exports/FINAL.md'));
  if (!final) return [];

  const forbidden = [
    /^##\s+Internal\b/im,
    /^##\s+Draft\b/im,
    /^##\s+Section Intent\b/im,
    /\*\*Drafting mode:\*\*/i,
    /\[NEEDS EVIDENCE:/i,
    /\[AUTHOR DECISION:/i,
    /\[STRUCTURE ISSUE:/i,
  ];
  const leaks = forbidden.filter((pattern) => pattern.test(final));
  if (leaks.length === 0) return [];
  return [issue(
    'HIGH',
    'exports/FINAL.md',
    'export contains internal metadata, draft notes, or unresolved authoring markers',
  )];
}

function validateStateDrift(paperDir) {
  const stateMarkdown = readIfExists(metaPath(paperDir, 'STATE.md'));
  const parsed = readJsonIfExists(metaPath(paperDir, 'STATE.json'));
  if (!stateMarkdown || !parsed.data) return [];

  const markdownStatus = parseMarkdownField(stateMarkdown, 'Status');
  const markdownNext = parseMarkdownField(stateMarkdown, 'Suggested next command');
  const issues = [];
  if (markdownStatus && parsed.data.status && markdownStatus !== parsed.data.status) {
    issues.push(issue('HIGH', 'STATE.md', `Status "${markdownStatus}" does not match STATE.json status "${parsed.data.status}"`));
  }
  if (markdownNext && parsed.data.suggested_next_command && markdownNext !== parsed.data.suggested_next_command) {
    issues.push(issue(
      'HIGH',
      'STATE.md',
      `Suggested next command "${markdownNext}" does not match STATE.json suggested_next_command "${parsed.data.suggested_next_command}"`,
    ));
  }
  return issues;
}

const deferralOnlyInstruction = /\b(keep as|add later|if publishing|if public|defer until|defer to|not blocking|no blocking revisions)\b/i;

function validateReviewRewriteInstructions(paperDir) {
  const review = readIfExists(metaPath(paperDir, 'REVIEW.md'));
  if (!review) return [];

  const scorecard = sectionBetween(review, '## Audience Review Scorecard');
  const table = parseFirstTable(scorecard);
  if (!table.rows.length) return [];

  const issues = [];
  for (const row of table.rows) {
    const score = Number.parseInt(row.Score, 10);
    if (!Number.isInteger(score) || score > 3) continue;
    const instruction = row['Actionable Rewrite Instruction If 3 Or Below'] || '';
    if (!instruction || instruction === '-' || deferralOnlyInstruction.test(instruction)) {
      issues.push(issue(
        'HIGH',
        'REVIEW.md',
        `Audience Review Scorecard row "${row.Dimension || 'unknown'}" scores ${score} but lacks a concrete rewrite instruction`,
      ));
    }
  }
  return issues;
}

const genericConflictTerms = [
  'executive ask',
  'technical proof',
  'simplicity',
  'caveat load',
  'platform investment',
  'domain accountability',
  'depth',
  'brevity',
  'generality',
  'specificity',
  'technical detail',
  'strategic clarity',
  'mechanism',
  'evidence',
  'actionability',
];

function hasConflictAnchor(row) {
  const text = Object.values(row).join(' ');
  return /(?:\bC\d+\b|\bClaim\s+\d+\b|\bSection\s+\d+\b|\b§\s*\d+|["“][^"”]{12,}["”])/i.test(text);
}

function isGenericConflict(row) {
  const tension = String(row.Tension || '').toLowerCase();
  if (!/\b(versus|vs\.?)\b/.test(tension)) return false;
  const matchedTerms = genericConflictTerms.filter((term) => tension.includes(term));
  return matchedTerms.length >= 2;
}

function validateAudienceConflictSpecificity(paperDir) {
  const review = readIfExists(metaPath(paperDir, 'REVIEW.md'));
  if (!review) return [];

  const section = sectionBetween(review, '## Audience Conflict Table');
  const table = parseFirstTable(section);
  if (!table.rows.length) return [];

  return table.rows
    .filter((row) => isGenericConflict(row) && !hasConflictAnchor(row))
    .map((row) => issue(
      'MEDIUM',
      'REVIEW.md',
      `Audience Conflict Table row "${row.Tension || 'unknown'}" is generic; anchor it to a claim ID, section, or draft phrase`,
    ));
}

function bestEvidenceMatch(claim, evidenceRows) {
  let best = { row: null, score: 0 };
  for (const row of evidenceRows) {
    const score = Math.max(
      tokenCoverage(claim, row.claim),
      tokenCoverage(row.claim, claim),
    );
    if (score > best.score) best = { row, score };
  }
  return best;
}

function normalizeClaimType(value) {
  return normalizeText(value).replace(/\s+/g, '_');
}

function isStrategicSafeClaimType(value) {
  const normalized = normalizeClaimType(value);
  return normalized === 'recommendation'
    || normalized === 'strategic_judgment'
    || normalized === 'market_trend'
    || normalized.includes('recommendation')
    || normalized.includes('strategic_judgment')
    || normalized.includes('market_trend');
}

function validateFactCheckSafeSourceAlignment(paperDir) {
  const factCheck = readIfExists(metaPath(paperDir, 'FACT-CHECK.md'));
  const parsed = readJsonIfExists(metaPath(paperDir, 'RESEARCH.json'));
  if (!factCheck || !parsed.data || !Array.isArray(parsed.data.evidence_matrix)) return [];

  const inventory = parseFirstTable(sectionBetween(factCheck, '## Claim Inventory'));
  const safe = parseFirstTable(sectionBetween(factCheck, '## Claims Safe To Keep'));
  if (!inventory.rows.length || !safe.rows.length) return [];

  const typeById = new Map(inventory.rows.map((row) => [row['Claim ID'], row.Type]));
  const issues = [];

  for (const row of safe.rows) {
    const claimId = row['Claim ID'];
    const claimType = typeById.get(claimId);
    if (!isStrategicSafeClaimType(claimType)) continue;

    const citedSources = sourceIds(row['Source(s)']);
    if (citedSources.length === 0) {
      issues.push(issue(
        'MEDIUM',
        'FACT-CHECK.md',
        `Safe-to-keep claim "${claimId}" has no source IDs`,
      ));
      continue;
    }

    const best = bestEvidenceMatch(row.Claim, parsed.data.evidence_matrix);
    if (!best.row || best.score < 0.35) {
      issues.push(issue(
        'MEDIUM',
        'FACT-CHECK.md',
        `Safe-to-keep claim "${claimId}" does not map clearly to a RESEARCH.json evidence_matrix row`,
      ));
      continue;
    }

    const supportingSources = Array.isArray(best.row.supporting_sources) ? best.row.supporting_sources : [];
    const hasSupportingCitation = citedSources.some((sourceId) => supportingSources.includes(sourceId));
    if (!hasSupportingCitation) {
      issues.push(issue(
        'MEDIUM',
        'FACT-CHECK.md',
        `Safe-to-keep claim "${claimId}" cites sources that are not supporting_sources for the closest evidence_matrix claim "${best.row.claim_id || 'unknown'}"`,
      ));
    }
  }

  return issues;
}

function validateSemanticPaper(paperDir) {
  return [
    ...validateBriefClaimEvidence(paperDir),
    ...validateStrategyReasoningSpine(paperDir),
    ...validateResearchSourceCoverage(paperDir),
    ...validateResearchCounterevidence(paperDir),
    ...validateExportMetadataLeak(paperDir),
    ...validateStateDrift(paperDir),
    ...validateReviewRewriteInstructions(paperDir),
    ...validateAudienceConflictSpecificity(paperDir),
    ...validateFactCheckSafeSourceAlignment(paperDir),
  ];
}

module.exports = {
  validateSemanticPaper,
};
