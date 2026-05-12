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

function uniqueSourceIds(value) {
  return [...new Set(sourceIds(value))];
}

function paragraphBlocks(markdown) {
  return String(markdown || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => {
      if (!block) return false;
      return ![
        /^#/,
        /^\|/,
        /^[-*+]\s+/,
        /^\d+\.\s+/,
        /^>/,
        /^```/,
      ].some((pattern) => pattern.test(block));
    });
}

function looksLikeSaturatedParallelProse(paragraph) {
  const text = paragraph.replace(/\s+/g, ' ').trim();
  if (text.length < 80) return false;

  const commaCount = (text.match(/,/g) || []).length;
  const repeatedWhatHow = (text.match(/\b(what|how|who|where|which)\b/gi) || []).length;
  const repeatedOrAnd = (text.match(/\b(and|or)\b/gi) || []).length;
  return (commaCount >= 4 && repeatedOrAnd >= 2) || repeatedWhatHow >= 4;
}

function validateProseSaturationInArtifact(paperDir, artifactName) {
  const markdown = readIfExists(metaPath(paperDir, artifactName));
  if (!markdown) return [];

  const paragraphs = paragraphBlocks(markdown);
  const saturatedIndexes = paragraphs
    .map((paragraph, index) => (looksLikeSaturatedParallelProse(paragraph) ? index : null))
    .filter((index) => index !== null);
  if (saturatedIndexes.length < 2) return [];

  const hasLocalCluster = saturatedIndexes.some((index, position) => (
    position >= 2 && index - saturatedIndexes[position - 2] <= 2
  ));
  const hasArtifactDensity = saturatedIndexes.length >= 4
    && saturatedIndexes.length / paragraphs.length >= 0.16;
  if (!hasLocalCluster && !hasArtifactDensity) return [];

  return [issue(
    'MEDIUM',
    artifactName,
    'contains repeated list-heavy paragraphs across the artifact; revise saturated parallel structures into sharper causal or example-based prose',
  )];
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

function validateStandaloneSourceSensitiveDraft(paperDir) {
  const draft = readIfExists(metaPath(paperDir, 'DRAFT.md'));
  if (!draft) return [];
  if (readIfExists(metaPath(paperDir, 'RESEARCH.json')) || readIfExists(metaPath(paperDir, 'FACT-CHECK.md'))) {
    return [];
  }
  if (hasSourceId(draft)) return [];

  const normalized = normalizeText(draft);
  const sourceSensitiveTerms = [
    'regulatory',
    'regulated',
    'supervisory',
    'compliance',
    'cyber',
    'security',
    'vulnerability',
    'operational resilience',
    'third party',
    'model risk',
    'audit',
    'decommissioning',
  ];
  const strategicClaimTerms = [
    'expects',
    'expected',
    'must',
    'requires',
    'require',
    'accelerate',
    'evidence',
    'readiness',
    'production',
    'live signals',
  ];
  const sourceSensitiveHits = sourceSensitiveTerms.filter((term) => normalized.includes(term));
  const strategicClaimHits = strategicClaimTerms.filter((term) => normalized.includes(term));

  if (sourceSensitiveHits.length < 2 || strategicClaimHits.length < 2) return [];

  return [issue(
    'MEDIUM',
    'DRAFT.md',
    'source-sensitive imported draft has no RESEARCH.json, FACT-CHECK.md, or source IDs; run research/fact-check before treating regulatory, security, or operating-model claims as supported',
  )];
}

function isPlaceholderText(value) {
  const text = String(value || '').trim();
  return !text || /^\[[^\]]+\]$/.test(text) || /^(none|n\/a|not applicable)$/i.test(text);
}

function meaningfulSection(markdown, heading) {
  const section = sectionBetween(markdown, heading)
    .replace(/\[[^\]]+\]/g, '')
    .replace(/[#*_`|:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!section) return false;
  if (/^(none|n\/a|not applicable|single audience)$/i.test(section)) return false;
  return section.length >= 24;
}

function hasNonPlaceholderSecondaryAudienceRow(audience) {
  const table = parseFirstTable(sectionBetween(audience, '## Audience Set'));
  return table.rows.some((row) => {
    const cells = Object.values(row).map((cell) => String(cell || '').trim());
    if (cells.every(isPlaceholderText)) return false;
    return /\b(secondary|tertiary|peer|technical|operator|reviewer|approver)\b/i.test(cells.join(' '));
  });
}

function validateMixedAudienceNeedsReview(paperDir) {
  const audience = readIfExists(metaPath(paperDir, 'AUDIENCE.md'));
  const draft = readIfExists(metaPath(paperDir, 'DRAFT.md'));
  if (!audience || !draft) return [];
  if (readIfExists(metaPath(paperDir, 'REVIEW.md'))) return [];

  const declaresMultipleAudiences = (
    meaningfulSection(audience, '## Secondary Audience')
    || meaningfulSection(audience, '## Audience Tension')
    || meaningfulSection(audience, '## Audience Conflict')
    || hasNonPlaceholderSecondaryAudienceRow(audience)
  );
  if (!declaresMultipleAudiences) return [];

  return [issue(
    'MEDIUM',
    'AUDIENCE.md',
    'mixed-audience draft has no REVIEW.md; run audience review before treating audience fit or conflict handling as resolved',
  )];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapedPhraseSource(value) {
  return escapeRegExp(value).replace(/\s+/g, '\\s+');
}

const definitionTerms = [
  'lifecycle',
  'readiness',
  'operational readiness',
  'lifecycle decision',
  'maturity tier',
  'domain owner',
  'technology domain owner',
  'production telemetry',
  'live signals',
  'reference blueprint',
  'federation',
  'decommissioning',
  'retirement debt',
];

function termPattern(term) {
  return new RegExp(`\\b${escapedPhraseSource(term)}s?\\b`, 'gi');
}

function termDefinitionPattern(term) {
  const source = escapedPhraseSource(term);
  return new RegExp([
    `\\b${source}s?\\s+(?:is|are|means|mean|refers\\s+to|describes|captures|defined\\s+as)\\b`,
    `\\b(?:a|an|the)\\s+${source}s?\\s+(?:is|are|means|mean|refers\\s+to|describes|captures)\\b`,
    `\\b${source}s?\\s*[:=-]\\s+\\S+`,
    `\\*\\*${source}s?\\*\\*\\s*[:=-]?\\s+\\S+`,
  ].join('|'), 'i');
}

function termOccurrences(markdown, term) {
  return [...String(markdown || '').matchAll(termPattern(term))].map((match) => match.index);
}

function isDefinedNearFirstUse(markdown, term, firstIndex) {
  const nearFirstUse = markdown.slice(Math.max(0, firstIndex - 80), firstIndex + 700);
  return termDefinitionPattern(term).test(nearFirstUse);
}

function validateDefineBeforeReuseInDraft(paperDir) {
  const draft = readIfExists(metaPath(paperDir, 'DRAFT.md'));
  if (!draft) return [];

  const issues = [];
  for (const term of definitionTerms) {
    const occurrences = termOccurrences(draft, term);
    if (occurrences.length < 4) continue;
    if (isDefinedNearFirstUse(draft, term, occurrences[0])) continue;
    issues.push(issue(
      'MEDIUM',
      'DRAFT.md',
      `recurring term "${term}" appears repeatedly before being defined; define it near first use or replace vague repetition with concrete meaning`,
    ));
  }

  return issues.slice(0, 3);
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

function recommendationSection(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!/^##\s+(?:Section\s+\d+\s+-\s+)?Recommendations?\s*$/i.test(line)) continue;

    const rest = lines.slice(i + 1).join('\n');
    const next = rest.search(/\n##\s+/);
    return next === -1 ? rest : rest.slice(0, next);
  }
  return '';
}

function hasConcreteRecommendationExample(section) {
  return /\b(for example|such as|examples include|candidate use cases|first candidates|first wave should include)\b/i.test(section);
}

function validateRecommendationSpecificityInArtifact(paperDir, artifactName) {
  const markdown = readIfExists(metaPath(paperDir, artifactName));
  if (!markdown) return [];

  const section = recommendationSection(markdown);
  if (!section.trim()) return [];

  const recommendsUseCases = /\b(priority|high-value|initial|first wave)\s+(ai\s+)?use cases?\b/i.test(section)
    || /\buse cases?\s+(actually need|to inspect|to choose|to fund)\b/i.test(section);
  if (!recommendsUseCases || hasConcreteRecommendationExample(section)) return [];

  return [issue(
    'MEDIUM',
    artifactName,
    'recommendation names use cases generically; add concrete candidate use cases, metrics, or failure signals',
  )];
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

function sourceRegistryById(research) {
  const sources = research && Array.isArray(research.source_registry) ? research.source_registry : [];
  return new Map(sources.map((source) => [source.id, source]));
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

function claimSupportEntryFor(source, claimId) {
  const supportEntries = source && Array.isArray(source.claim_support) ? source.claim_support : [];
  return supportEntries.find((entry) => entry.claim_id === claimId) || null;
}

function validateFactCheckClaimSupportMetadata(paperDir) {
  const factCheck = readIfExists(metaPath(paperDir, 'FACT-CHECK.md'));
  const parsed = readJsonIfExists(metaPath(paperDir, 'RESEARCH.json'));
  if (!factCheck || !parsed.data || !Array.isArray(parsed.data.evidence_matrix)) return [];

  const sourcesById = sourceRegistryById(parsed.data);
  const hasClaimSupportMetadata = [...sourcesById.values()].some((source) => Array.isArray(source.claim_support));
  if (!hasClaimSupportMetadata) return [];

  const safe = parseFirstTable(sectionBetween(factCheck, '## Claims Safe To Keep'));
  if (!safe.rows.length) return [];

  const issues = [];
  for (const row of safe.rows) {
    const citedSources = uniqueSourceIds(row['Source(s)']);
    if (citedSources.length === 0) continue;

    const best = bestEvidenceMatch(row.Claim, parsed.data.evidence_matrix);
    if (!best.row || best.score < 0.25 || !best.row.claim_id) continue;

    for (const sourceId of citedSources) {
      const source = sourcesById.get(sourceId);
      if (!source || !Array.isArray(source.claim_support)) continue;

      const supportEntry = claimSupportEntryFor(source, best.row.claim_id);
      if (!supportEntry) {
        issues.push(issue(
          'MEDIUM',
          'FACT-CHECK.md',
          `Safe-to-keep claim "${row['Claim ID'] || 'unknown'}" cites ${sourceId}, but source_registry has no claim_support entry for evidence claim "${best.row.claim_id}"`,
        ));
        continue;
      }

      if (!['direct', 'partial'].includes(supportEntry.support)) {
        issues.push(issue(
          'MEDIUM',
          'FACT-CHECK.md',
          `Safe-to-keep claim "${row['Claim ID'] || 'unknown'}" cites ${sourceId}, but source_registry marks support for evidence claim "${best.row.claim_id}" as ${supportEntry.support}`,
        ));
      }
    }
  }

  return issues;
}

const quantitativePatterns = [
  /\b\d+(?:\.\d+)?\s*(?:-|–|to)\s*\d+(?:\.\d+)?\s*(?:%|percent|percentage points?)(?![a-z])/i,
  /\b\d+(?:\.\d+)?\s*(?:%|percent|percentage points?)(?![a-z])/i,
  /\$\s*\d+(?:[\d,.]*)(?:\s*(?:k|m|b|thousand|million|billion))?\b/i,
  /\b\d+(?:\.\d+)?\s*(?:x|times)\b/i,
  /\b(?:reduced|reduce|reduces|cut|cuts|saved|saves|faster|slower|increase|increased|decrease|decreased|improved|improves|fell|rose|lowered|raised)\b[^.!?\n]{0,120}\b\d+(?:\.\d+)?\s*(?:days?|weeks?|months?|hours?)\b/i,
  /\b\d+(?:\.\d+)?\s*(?:days?|weeks?|months?|hours?)\b[^.!?\n]{0,120}\b(?:reduced|reduce|reduces|cut|cuts|saved|saves|faster|slower|increase|increased|decrease|decreased|improved|improves|fell|rose|lowered|raised)\b/i,
];

function hasQuantitativeClaim(value) {
  return quantitativePatterns.some((pattern) => pattern.test(String(value || '')));
}

function hasComparativeQuantity(value) {
  const text = String(value || '');
  return /(?:%|percent|percentage points?|\b\d+(?:\.\d+)?\s*(?:x|times)\b)/i.test(text)
    || /\b(?:reduced|reduce|reduces|cut|cuts|saved|saves|faster|slower|increase|increased|decrease|decreased|improved|improves|fell|rose|lowered|raised)\b/i.test(text);
}

function hasQuantitativeContext(value) {
  return /\b(?:from|to|baseline|denominator|sample|sampled|n\s*=|across|over|per|compared with|compared to|versus|vs\.?|relative to|against|timeframe|period|window|quarter|year|month|week|cohort|population)\b/i.test(String(value || ''))
    || /\bof\s+\d+\b/i.test(String(value || ''));
}

function sentenceLikeClaims(markdown) {
  return String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !/^#/.test(line) && !/^\|/.test(line));
}

function quantitativeClaimsFromArtifact(markdown) {
  return sentenceLikeClaims(markdown).filter(hasQuantitativeClaim);
}

function quantitativeSafeClaimsFromFactCheck(factCheck) {
  const safe = parseFirstTable(sectionBetween(factCheck, '## Claims Safe To Keep'));
  return safe.rows
    .filter((row) => hasQuantitativeClaim(row.Claim))
    .map((row) => ({
      artifactName: 'FACT-CHECK.md',
      claim: row.Claim,
      sourceText: row['Source(s)'],
      label: `Safe-to-keep quantitative claim "${row['Claim ID'] || 'unknown'}"`,
    }));
}

function quantitativeClaimsFromDraftArtifact(paperDir, artifactName) {
  const markdown = readIfExists(metaPath(paperDir, artifactName));
  if (!markdown) return [];
  return quantitativeClaimsFromArtifact(markdown).map((claim) => ({
    artifactName,
    claim,
    sourceText: claim,
    label: 'quantitative claim',
  }));
}

function validateQuantitativeClaimSupport(paperDir) {
  const parsed = readJsonIfExists(metaPath(paperDir, 'RESEARCH.json'));
  const research = parsed.data || {};
  const evidenceRows = Array.isArray(research.evidence_matrix) ? research.evidence_matrix : [];
  const sourcesById = sourceRegistryById(research);
  const factCheck = readIfExists(metaPath(paperDir, 'FACT-CHECK.md'));
  const candidates = [
    ...quantitativeClaimsFromDraftArtifact(paperDir, 'DRAFT.md'),
    ...quantitativeClaimsFromDraftArtifact(paperDir, 'exports/FINAL.md'),
    ...(factCheck ? quantitativeSafeClaimsFromFactCheck(factCheck) : []),
  ];
  const issues = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const dedupeKey = `${candidate.artifactName}:${normalizeText(candidate.claim)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const citedSources = uniqueSourceIds(candidate.sourceText);
    const label = candidate.label;

    if (citedSources.length === 0) {
      issues.push(issue(
        'MEDIUM',
        candidate.artifactName,
        `${label} lacks source IDs; cite the supporting source or move the number to fact-check/research before treating it as safe`,
      ));
    }

    if (hasComparativeQuantity(candidate.claim) && !hasQuantitativeContext(candidate.claim)) {
      issues.push(issue(
        'MEDIUM',
        candidate.artifactName,
        `${label} lacks baseline, denominator, timeframe, or comparison context`,
      ));
    }

    if (evidenceRows.length === 0 || citedSources.length === 0) continue;

    const best = bestEvidenceMatch(candidate.claim, evidenceRows);
    if (!best.row || best.score < 0.25) {
      issues.push(issue(
        'MEDIUM',
        candidate.artifactName,
        `${label} does not map clearly to a RESEARCH.json evidence_matrix row`,
      ));
      continue;
    }

    const supportingSources = Array.isArray(best.row.supporting_sources) ? best.row.supporting_sources : [];
    const hasSupportingCitation = citedSources.some((sourceId) => supportingSources.includes(sourceId));
    if (!hasSupportingCitation) {
      issues.push(issue(
        'MEDIUM',
        candidate.artifactName,
        `${label} cites sources that are not supporting_sources for the closest evidence_matrix claim "${best.row.claim_id || 'unknown'}"`,
      ));
    }

    const strength = normalizeClaimType(best.row.strength_of_support);
    const handling = normalizeClaimType(best.row.recommended_handling);
    const weakSupport = ['weak', 'none'].includes(strength)
      || ['support_more', 'soften', 'narrow', 'caveat', 'drop'].includes(handling);
    if (weakSupport) {
      issues.push(issue(
        'MEDIUM',
        candidate.artifactName,
        `${label} uses precise numerical wording while RESEARCH.json marks closest evidence "${best.row.claim_id || 'unknown'}" as ${best.row.strength_of_support || 'unknown'} support / ${best.row.recommended_handling || 'unknown'} handling`,
      ));
    }

    const staleSources = citedSources
      .map((sourceId) => sourcesById.get(sourceId))
      .filter((source) => source && ['old', 'unknown'].includes(source.freshness));
    if (staleSources.length > 0) {
      issues.push(issue(
        'MEDIUM',
        candidate.artifactName,
        `${label} cites old or unknown-freshness source IDs for a numerical claim: ${staleSources.map((source) => source.id).join(', ')}`,
      ));
    }
  }

  return issues;
}

function validateSemanticPaper(paperDir) {
  return [
    ...validateBriefClaimEvidence(paperDir),
    ...validateStandaloneSourceSensitiveDraft(paperDir),
    ...validateMixedAudienceNeedsReview(paperDir),
    ...validateDefineBeforeReuseInDraft(paperDir),
    ...validateStrategyReasoningSpine(paperDir),
    ...validateResearchSourceCoverage(paperDir),
    ...validateResearchCounterevidence(paperDir),
    ...validateExportMetadataLeak(paperDir),
    ...validateStateDrift(paperDir),
    ...validateReviewRewriteInstructions(paperDir),
    ...validateRecommendationSpecificityInArtifact(paperDir, 'DRAFT.md'),
    ...validateRecommendationSpecificityInArtifact(paperDir, 'exports/FINAL.md'),
    ...validateProseSaturationInArtifact(paperDir, 'DRAFT.md'),
    ...validateProseSaturationInArtifact(paperDir, 'exports/FINAL.md'),
    ...validateAudienceConflictSpecificity(paperDir),
    ...validateFactCheckSafeSourceAlignment(paperDir),
    ...validateFactCheckClaimSupportMetadata(paperDir),
    ...validateQuantitativeClaimSupport(paperDir),
  ];
}

module.exports = {
  validateSemanticPaper,
};
