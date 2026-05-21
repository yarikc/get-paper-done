'use strict';

const fs = require('fs');
const path = require('path');

const { root, expandHome, fileSha256 } = require('./common');
const {
  allowedStrategyStatuses,
  allowedStrategyBlockers,
  allowedUnblockActions,
} = require('./contracts');

const jsonArtifactSchemas = {
  'STATE.json': 'state.schema.json',
  'state.json': 'state.schema.json',
  'config.json': 'config.schema.json',
  'RESEARCH.json': 'research.schema.json',
  'research.json': 'research.schema.json',
};

const artifactNameAliases = {
  'persona.md': 'PERSONA.md',
  'audience.md': 'AUDIENCE.md',
  'strategy.md': 'STRATEGY.md',
  'outline.md': 'OUTLINE.md',
  'fact-check.md': 'FACT-CHECK.md',
  'review.md': 'REVIEW.md',
  'feedback-external.md': 'FEEDBACK-EXTERNAL.md',
  'feedback-reader.md': 'FEEDBACK-READER.md',
  'feedback-plan.md': 'FEEDBACK-PLAN.md',
  'revision-check.md': 'REVISION-CHECK.md',
  'revision-log.md': 'REVISION-LOG.md',
  'paper-context.md': 'PAPER-CONTEXT.md',
  'decisions.md': 'DECISIONS.md',
};

function artifactNameForFile(filePath) {
  const basename = path.basename(filePath);
  const normalized = path.resolve(filePath).split(path.sep);
  if (normalized.includes('profiles') && basename.endsWith('.md')) return 'PERSONA.md';
  if (normalized.includes('audiences') && basename.endsWith('.md')) return 'AUDIENCE.md';
  return artifactNameAliases[basename] || basename;
}

const allowedFeedbackPlanStatuses = [
  'Pending user approval',
  'Approved',
  'Approved by user',
  'Applied',
  'Needs revision',
  'Ignored',
];

const markdownContracts = {
  'PERSONA.md': {
    headings: [
      '## Profile Boundary',
    ],
    tables: [],
  },
  'AUDIENCE.md': {
    headings: [
      '## Audience Boundary',
    ],
    tables: [],
  },
  'STRATEGY.md': {
    headings: [
      '# Strategy Review',
      '## Strategic Readiness',
      '## Strategy Blockers',
      '## Thesis Package',
      '### Thesis Tests',
      '## Strategic Gaps',
      '## Recommended Shape',
      '## Block / Override',
    ],
    tables: [
      ['Test', 'Pass?', 'Notes'],
      ['ID', 'Type', 'Description', 'Why It Matters', 'Fix Instruction'],
    ],
  },
  'OUTLINE.md': {
    headings: [
      '# Outline',
      '## Mode',
      '## Structure Verdict',
      '## Reader Journey',
      '## Section Architecture',
      '## Objection Map',
      '## Drafting Risks',
    ],
    tables: [
      [
        'Section',
        'Objective',
        'Reader State In',
        'Reader State Out',
        'Main Claim',
        'Evidence Hooks',
        'Evidence Strength',
        'Reader Questions',
        'Objection Handled',
        'Approx Length',
        'Transition To Next',
        'Keep/Cut',
      ],
      ['Objection', 'Where Addressed', 'Handling'],
    ],
  },
  'FACT-CHECK.md': {
    headings: [
      '# Fact And Claims Check',
      '## Mode',
      '## Claims Risk Verdict',
      '## Claim Inventory',
      '## Claim Issues',
      '## Claims Safe To Keep',
      '## Claims To Soften',
      '## Claims To Remove Or Verify Before Publication',
      '## Source Gaps',
      '## Source Alignment Notes',
      '## Synthesis Integrity',
      '## Systemic Risk Report',
      '## Recommended Next Action',
    ],
    tables: [
      ['Claim ID', 'Claim', 'Type', 'Location', 'Risk', 'Check Status'],
      [
        'Severity',
        'Claim ID',
        'Claim',
        'Issue',
        'Evidence Status',
        'Source(s)',
        'Recommended Fix',
        'Suggested Wording',
      ],
      ['Claim ID', 'Claim', 'Why Safe', 'Source(s)'],
      ['Claim ID', 'Current Wording', 'Suggested Wording', 'Why'],
      ['Claim ID', 'Claim', 'Action', 'Why'],
      ['Gap', 'Source Type Needed', 'Blocks Publication?'],
    ],
  },
  'REVIEW.md': {
    headings: [
      '# Review',
      '## Verdict',
      '## Scores',
      '## Required Fixes',
      '## Audience Review Scorecard',
      '## Below-Target Improvement Gate',
      '## Unsupported Or Risky Claims',
      '## Revision Plan',
      '## Done Checklist',
    ],
    tables: [
      ['Dimension', 'Score', 'Notes'],
      ['Dimension', 'Score', 'Why', 'Actionable Rewrite Instruction If 3 Or Below'],
      ['Claim', 'Issue', 'Recommended Fix'],
    ],
    audienceDimensions: [
      'Thesis clarity',
      'Audience relevance',
      'Evidence sufficiency',
      'Objection handling',
      'Jargon appropriateness',
      'Decision usefulness',
      'Structural flow',
    ],
  },
  'FEEDBACK-PLAN.md': {
    headings: [
      '# Feedback Handling Plan',
      '## Summary',
      '## Decision View',
      '## Proposed Handling',
      '## Below-Target Items',
      '## Approved Or Modified',
      '## Rejected',
      '## Deferred',
      '## User Decisions Needed',
      '## Approval Gate',
    ],
    tables: [
      ['#', 'Issue', 'Target Bar Impact', 'Recommendation', 'Reason'],
    ],
  },
  'FEEDBACK-EXTERNAL.md': {
    headings: [
      '# External Feedback',
      '## Review Prompt Summary',
      '## Consensus Summary',
      '### Shared Concerns',
      '### Shared Strengths',
      '### Divergent Views',
      '### High-Risk Items',
    ],
    tables: [],
  },
  'FEEDBACK-READER.md': {
    headings: [
      '# Reader Feedback',
      '## Source',
      '## Five-Signal Scorecard',
      '## Feedback Items',
      '## Questions',
      '## Suggested Handling',
      '## Notes',
    ],
    tables: [
      ['Signal', 'Score', 'Evidence', 'Actionable Feedback'],
      ['#', 'Feedback', 'Signal', 'Severity', 'Recommended Handling', 'Affected Artifact'],
    ],
    readerFeedbackSignals: [
      'Voice',
      'Register',
      'Audience fit',
      'Evidence',
      'Ask clarity',
    ],
  },
  'REVISION-CHECK.md': {
    headings: [
      '# Revision Check',
      '## Revision Classification',
      '## Substantive Revision Definition',
      '## Before / After Quality Gate',
      '## Change Impact',
      '## Validator Interpretation',
      '## Decision',
    ],
    tables: [
      ['Dimension', 'Baseline Score', 'Revised Score', 'Regression?', 'Evidence / Notes'],
      ['Change', 'Intended Improvement', 'Regression Risk', 'Result'],
    ],
  },
  'REVISION-LOG.md': {
    headings: [
      '# Revision Log',
    ],
    tables: [],
  },
  'PAPER-CONTEXT.md': {
    headings: [
      '# Paper Context',
      '## Language',
      '## Relationships',
      '## Example Dialogue',
      '## Flagged Ambiguities',
    ],
    tables: [],
  },
  'DECISIONS.md': {
    headings: [
      '# Paper Decision Records',
      '## Decision Index',
    ],
    tables: [
      ['ID', 'Status', 'Decision', 'Why It Matters'],
    ],
  },
};

function issue(severity, artifact, message) {
  return { severity, issue: `${artifact}: ${message}` };
}

function stripMarkdownValue(value) {
  return value
    .trim()
    .replace(/`/g, '')
    .replace(/\.$/, '')
    .trim();
}

function parseMarkdownField(markdown, label) {
  if (!markdown) return null;
  const target = `**${label.toLowerCase()}:**`;
  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^-+\s*/, '');
    const normalized = trimmed.toLowerCase();
    if (normalized.startsWith(target)) {
      return stripMarkdownValue(trimmed.slice(target.length));
    }
  }
  return null;
}

function readJson(filePath) {
  try {
    return {
      data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
      error: null,
    };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

function schemaPathForArtifact(filePath) {
  const name = path.basename(filePath);
  const schemaName = jsonArtifactSchemas[name];
  return schemaName ? path.join(root, 'references', 'schemas', schemaName) : null;
}

const supportedSchemaKeywords = new Set([
  '$id',
  '$schema',
  'additionalProperties',
  'description',
  'enum',
  'items',
  'minimum',
  'minLength',
  'pattern',
  'properties',
  'required',
  'title',
  'type',
]);

function validateSchemaDefinition(schema, location = '$') {
  const errors = [];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return errors;

  for (const key of Object.keys(schema)) {
    if (!supportedSchemaKeywords.has(key)) {
      errors.push(`${location} uses unsupported JSON Schema keyword "${key}"`);
    }
  }

  if (schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties)) {
    for (const [key, childSchema] of Object.entries(schema.properties)) {
      errors.push(...validateSchemaDefinition(childSchema, `${location}.properties.${key}`));
    }
  }

  if (schema.items && typeof schema.items === 'object') {
    errors.push(...validateSchemaDefinition(schema.items, `${location}.items`));
  }

  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    errors.push(...validateSchemaDefinition(schema.additionalProperties, `${location}.additionalProperties`));
  }

  return errors;
}

function typeName(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateJsonSchemaValue(value, schema, location = '$') {
  const errors = [];

  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = typeName(value);
    const typeMatches = allowedTypes.includes(actual)
      || (allowedTypes.includes('integer') && actual === 'number' && Number.isInteger(value));
    if (!typeMatches) {
      errors.push(`${location} expected ${allowedTypes.join(' or ')}, got ${actual}`);
      return errors;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location} must be one of ${schema.enum.join(', ')}`);
  }

  if (schema.type === 'string' && schema.minLength && value.length < schema.minLength) {
    errors.push(`${location} must have length >= ${schema.minLength}`);
  }

  if (schema.type === 'string' && schema.pattern) {
    const pattern = new RegExp(schema.pattern);
    if (!pattern.test(value)) {
      errors.push(`${location} must match pattern ${schema.pattern}`);
    }
  }

  if (schema.type === 'integer') {
    if (!Number.isInteger(value)) errors.push(`${location} must be an integer`);
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${location} must be >= ${schema.minimum}`);
    }
  }

  if (schema.type === 'array' && schema.items) {
    value.forEach((item, index) => {
      errors.push(...validateJsonSchemaValue(item, schema.items, `${location}[${index}]`));
    });
  }

  if (schema.type === 'object') {
    const required = schema.required || [];
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${location}.${key} is required`);
      }
    }

    const properties = schema.properties || {};
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateJsonSchemaValue(value[key], childSchema, `${location}.${key}`));
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${location}.${key} is not allowed`);
        }
      }
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(...validateJsonSchemaValue(value[key], schema.additionalProperties, `${location}.${key}`));
        }
      }
    }
  }

  return errors;
}

function validateJsonArtifact(filePath) {
  const artifact = path.basename(filePath);
  const schemaPath = schemaPathForArtifact(filePath);
  if (!schemaPath) return [];
  if (!fs.existsSync(filePath)) return [issue('HIGH', artifact, 'file does not exist')];

  const parsed = readJson(filePath);
  if (parsed.error) return [issue('HIGH', artifact, `Malformed JSON: ${parsed.error}`)];

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const schemaErrors = validateSchemaDefinition(schema);
  if (schemaErrors.length > 0) {
    return schemaErrors.map((message) => issue('HIGH', path.basename(schemaPath), message));
  }
  return validateJsonSchemaValue(parsed.data, schema).map((message) => issue('HIGH', artifact, message));
}

function normalizeTableCell(value) {
  return value.trim().replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
}

function parseTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tables = [];
  for (let i = 0; i < lines.length - 1; i += 1) {
    const line = lines[i].trim();
    const separator = lines[i + 1].trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;
    if (!separator.startsWith('|') || !separator.endsWith('|')) continue;
    if (!/^\|[\s:-]+\|/.test(separator)) continue;
    const columns = line
      .slice(1, -1)
      .split('|')
      .map(normalizeTableCell);
    tables.push({ columns, line: i + 1 });
  }
  return tables;
}

function hasTableWithColumns(tables, requiredColumns) {
  return tables.some((table) => requiredColumns.every((column) => table.columns.includes(column)));
}

function hasHeading(markdown, heading) {
  return markdown.split(/\r?\n/).some((line) => line.trim() === heading);
}

function sectionBetween(markdown, heading, nextHeadingPattern) {
  const start = markdown.indexOf(heading);
  if (start === -1) return '';
  const afterStart = start + heading.length;
  const rest = markdown.slice(afterStart);
  const next = rest.search(nextHeadingPattern);
  return next === -1 ? rest : rest.slice(0, next);
}

function parseFirstTableRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i += 1) {
    const line = lines[i].trim();
    const separator = lines[i + 1].trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;
    if (!separator.startsWith('|') || !separator.endsWith('|')) continue;
    if (!/^\|[\s:-]+\|/.test(separator)) continue;

    const rows = [];
    for (let j = i + 2; j < lines.length; j += 1) {
      const row = lines[j].trim();
      if (!row.startsWith('|') || !row.endsWith('|')) break;
      rows.push(row.slice(1, -1).split('|').map(normalizeTableCell));
    }
    return rows;
  }
  return [];
}

function validateAudienceScorecard(markdown) {
  const contract = markdownContracts['REVIEW.md'];
  const section = sectionBetween(markdown, '## Audience Review Scorecard', /\n##\s+/);
  const rows = parseFirstTableRows(section);
  const dimensions = rows.map((row) => row[0]).filter(Boolean);
  const issues = [];

  for (const dimension of contract.audienceDimensions) {
    if (!dimensions.includes(dimension)) {
      issues.push(issue('HIGH', 'REVIEW.md', `Audience Review Scorecard missing dimension "${dimension}"`));
    }
  }

  for (const dimension of dimensions) {
    if (!contract.audienceDimensions.includes(dimension)) {
      issues.push(issue('HIGH', 'REVIEW.md', `Audience Review Scorecard has unexpected dimension "${dimension}"`));
    }
  }

  for (const dimension of contract.audienceDimensions) {
    const count = dimensions.filter((item) => item === dimension).length;
    if (count > 1) {
      issues.push(issue('HIGH', 'REVIEW.md', `Audience Review Scorecard repeats dimension "${dimension}"`));
    }
  }

  return issues;
}

function validateReaderFeedbackScorecard(markdown) {
  const contract = markdownContracts['FEEDBACK-READER.md'];
  const section = sectionBetween(markdown, '## Five-Signal Scorecard', /\n##\s+/);
  const rows = parseFirstTableRows(section);
  const signals = rows.map((row) => row[0]).filter(Boolean);
  const issues = [];

  for (const signal of contract.readerFeedbackSignals) {
    if (!signals.includes(signal)) {
      issues.push(issue('HIGH', 'FEEDBACK-READER.md', `Five-Signal Scorecard missing signal "${signal}"`));
    }
  }

  for (const signal of signals) {
    if (!contract.readerFeedbackSignals.includes(signal)) {
      issues.push(issue('HIGH', 'FEEDBACK-READER.md', `Five-Signal Scorecard has unexpected signal "${signal}"`));
    }
  }

  for (const signal of contract.readerFeedbackSignals) {
    const count = signals.filter((item) => item === signal).length;
    if (count > 1) {
      issues.push(issue('HIGH', 'FEEDBACK-READER.md', `Five-Signal Scorecard repeats signal "${signal}"`));
    }
  }

  return issues;
}

function validateFeedbackPlanSections(markdown) {
  const section = sectionBetween(markdown, '## Proposed Handling', /\n##\s+/);
  const issues = [];
  const status = parseMarkdownField(markdown, 'Status');
  if (!status) {
    issues.push(issue('HIGH', 'FEEDBACK-PLAN.md', 'Status field is required'));
  } else if (!allowedFeedbackPlanStatuses.includes(status)) {
    issues.push(issue('HIGH', 'FEEDBACK-PLAN.md', `Status must be one of ${allowedFeedbackPlanStatuses.join(', ')}`));
  }

  if (!/###\s+\d+\.\s+/.test(section)) {
    issues.push(issue('HIGH', 'FEEDBACK-PLAN.md', 'Proposed Handling must use numbered feedback item sections'));
    return issues;
  }

  const requiredFields = [
    'Type',
    'Severity',
    'Source(s)',
    'Recommendation',
    'Why this matters',
    'What improves if addressed',
    'Risk if handled badly',
    'Proposed handling',
    'Proposed edits',
    'Reviewer evidence',
    'Affected artifacts',
    'User Decision',
    'User Constraint',
  ];
  for (const field of requiredFields) {
    const pattern = new RegExp(`\\*\\*${field.replace(/[()]/g, '\\$&')}:\\*\\*`);
    if (!pattern.test(section)) {
      issues.push(issue('HIGH', 'FEEDBACK-PLAN.md', `Proposed Handling missing field "${field}"`));
    }
  }

  return issues;
}

function validateRevisionCheckContent(markdown, filePath) {
  if (isTemplateFile(filePath)) return [];

  const issues = [];
  const expectedDimensions = [
    'Thesis clarity',
    'Argument flow',
    'Evidence support',
    'Audience fit',
    'Persona and voice',
    'Ask clarity',
    'Substance preservation',
  ];

  const baseline = extractMarkdownField(markdown, 'Baseline compared');
  const substantive = extractMarkdownField(markdown, 'Substantive revision');
  if (!baseline || isPlaceholderValue(baseline)) {
    issues.push(issue('HIGH', 'REVISION-CHECK.md', 'Baseline compared must name the prior draft/export or snapshot'));
  }
  if (!substantive || !['Yes', 'No'].includes(substantive)) {
    issues.push(issue('HIGH', 'REVISION-CHECK.md', 'Substantive revision must be Yes or No'));
  }

  const meta = path.dirname(filePath);
  if (baseline && /\.paper\/versions\//.test(baseline)) {
    const matches = baseline.match(/\.paper\/versions\/[A-Za-z0-9_.-]+/g) || [];
    for (const relative of matches) {
      const snapshotPath = path.join(meta, relative.replace(/^\.paper\//, ''));
      if (!fs.existsSync(snapshotPath)) {
        issues.push(issue('HIGH', 'REVISION-CHECK.md', `Baseline snapshot does not exist: ${relative}`));
      } else {
        issues.push(...validateSnapshotMetadata(snapshotPath, relative));
      }
    }
  }

  const qualitySection = sectionBetween(markdown, '## Before / After Quality Gate', /\n##\s+/);
  const rows = parseFirstTableRows(qualitySection);
  const rowByDimension = new Map(rows.map((row) => [row[0], row]));
  for (const dimension of expectedDimensions) {
    if (!rowByDimension.has(dimension)) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `Before / After Quality Gate missing dimension "${dimension}"`));
    }
  }

  const decision = sectionBetween(markdown, '## Decision', /\n##\s+/).toLowerCase();
  for (const [dimension, row] of rowByDimension.entries()) {
    if (!expectedDimensions.includes(dimension)) continue;
    const baselineScore = Number(row[1]);
    const revisedScore = Number(row[2]);
    const regression = String(row[3] || '').trim();
    if (!Number.isInteger(baselineScore) || baselineScore < 1 || baselineScore > 5) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `${dimension} baseline score must be an integer from 1 to 5`));
    }
    if (!Number.isInteger(revisedScore) || revisedScore < 1 || revisedScore > 5) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `${dimension} revised score must be an integer from 1 to 5`));
    }
    if (!['Yes', 'No'].includes(regression)) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `${dimension} Regression? must be Yes or No`));
    }
    if (Number.isInteger(baselineScore) && Number.isInteger(revisedScore) && revisedScore < baselineScore && regression !== 'Yes') {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `${dimension} score dropped but Regression? is not Yes`));
    }
    if ((regression === 'Yes' || revisedScore < baselineScore) && !/user.*accept|accepted.*tradeoff|approval.*yes/.test(decision)) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `${dimension} regression requires explicit user-accepted tradeoff in Decision`));
    }
  }

  return issues;
}

function sha256File(filePath) {
  return fileSha256(filePath);
}

function validateSnapshotMetadata(snapshotPath, relativeSnapshotPath) {
  const issues = [];
  const metadataPath = path.join(snapshotPath, 'VERSION-METADATA.json');
  if (!fs.existsSync(metadataPath)) {
    return [issue('HIGH', 'REVISION-CHECK.md', `Baseline snapshot missing VERSION-METADATA.json: ${relativeSnapshotPath}`)];
  }

  const parsed = readJson(metadataPath);
  if (parsed.error) {
    return [issue('HIGH', 'REVISION-CHECK.md', `Baseline snapshot metadata is malformed JSON: ${relativeSnapshotPath}`)];
  }

  const files = Array.isArray(parsed.data.file_hashes) ? parsed.data.file_hashes : [];
  if (files.length === 0) {
    issues.push(issue('HIGH', 'REVISION-CHECK.md', `Baseline snapshot has no file_hashes metadata: ${relativeSnapshotPath}`));
    return issues;
  }

  for (const file of files) {
    if (!file.snapshot_path || !file.sha256) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `Baseline snapshot has incomplete hash entry: ${relativeSnapshotPath}`));
      continue;
    }
    const snapshottedFile = path.join(snapshotPath, file.snapshot_path);
    if (!fs.existsSync(snapshottedFile)) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `Baseline snapshot file missing: ${file.snapshot_path}`));
      continue;
    }
    const actual = sha256File(snapshottedFile);
    if (actual !== file.sha256) {
      issues.push(issue('HIGH', 'REVISION-CHECK.md', `Baseline snapshot hash mismatch: ${file.snapshot_path}`));
    }
  }

  return issues;
}

function extractMarkdownField(markdown, label) {
  const target = `**${label.toLowerCase()}:**`;
  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^-+\s*/, '');
    if (trimmed.toLowerCase().startsWith(target)) {
      return trimmed.slice(target.length).replace(/`/g, '').trim();
    }
  }
  return null;
}

function isPlaceholderValue(value) {
  if (!value) return false;
  return /^\[.*\]$/.test(value.trim());
}

function validateEnumField(markdown, artifact, label, allowedValues) {
  const value = extractMarkdownField(markdown, label);
  if (!value) return [issue('HIGH', artifact, `Missing field "${label}"`)];
  if (isPlaceholderValue(value) || !allowedValues.includes(value)) {
    return [issue('HIGH', artifact, `$.${label} must be one of ${allowedValues.join(', ')}`)];
  }
  return [];
}

function isTemplateFile(filePath) {
  const relative = path.relative(root, filePath).split(path.sep).join('/');
  return relative.startsWith('templates/');
}

function validateStrategyValues(markdown, filePath) {
  if (isTemplateFile(filePath)) return [];
  return [
    ...validateEnumField(markdown, 'STRATEGY.md', 'Status', allowedStrategyStatuses),
    ...validateEnumField(markdown, 'STRATEGY.md', 'Primary blocker', allowedStrategyBlockers),
    ...validateEnumField(markdown, 'STRATEGY.md', 'Required unblock action', allowedUnblockActions),
  ];
}

function containsPlaceholder(markdown) {
  return /\[[^\]]+\]/.test(markdown);
}

function validatePaperContextContent(markdown, filePath) {
  if (isTemplateFile(filePath)) return [];

  const issues = [];
  const summary = sectionBetween(markdown, '# Paper Context', /\n##\s+/).trim();
  if (summary.length < 40 || containsPlaceholder(summary) || summary.includes('One or two sentences')) {
    issues.push(issue('HIGH', 'PAPER-CONTEXT.md', 'Opening context must explain why this paper needs a language contract'));
  }

  const language = sectionBetween(markdown, '## Language', /\n##\s+/);
  const entries = language
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\*\*[^*[\]]+\*\*:\s+\S/.test(line) && !containsPlaceholder(line));

  if (entries.length === 0) {
    issues.push(issue('HIGH', 'PAPER-CONTEXT.md', 'Language section must define at least one non-placeholder canonical term'));
  }

  if (containsPlaceholder(markdown)) {
    issues.push(issue('HIGH', 'PAPER-CONTEXT.md', 'Contains unresolved template placeholder text'));
  }

  return issues;
}

function extractCanonicalTerms(markdown) {
  const language = sectionBetween(markdown, '## Language', /\n##\s+/);
  return language
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^\*\*([^*[\]]+)\*\*:\s+\S/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);
}

function validateDecisionRecordsContent(markdown, filePath) {
  if (isTemplateFile(filePath)) return [];

  const issues = [];
  const rows = parseFirstTableRows(sectionBetween(markdown, '## Decision Index', /\n##\s+/));
  const decisionRows = rows.filter((row) => /^PDR-\d{4}$/.test(row[0] || ''));

  if (decisionRows.length === 0) {
    issues.push(issue('HIGH', 'DECISIONS.md', 'Decision Index must contain at least one PDR row'));
  }

  for (const row of decisionRows) {
    const [id, status, decision, whyItMatters] = row;
    if (!['proposed', 'accepted', 'rejected', 'superseded'].includes(status)) {
      issues.push(issue('HIGH', 'DECISIONS.md', `${id} status must be one of proposed, accepted, rejected, superseded`));
    }
    if (!decision || decision.length < 10 || containsPlaceholder(decision)) {
      issues.push(issue('HIGH', 'DECISIONS.md', `${id} decision must be non-placeholder text`));
    }
    if (!whyItMatters || whyItMatters.length < 15 || containsPlaceholder(whyItMatters)) {
      issues.push(issue('HIGH', 'DECISIONS.md', `${id} Why It Matters must be non-placeholder text`));
    }
    if (!markdown.includes(`## ${id}:`)) {
      issues.push(issue('HIGH', 'DECISIONS.md', `${id} is missing a detail section`));
    }
    const detail = sectionBetween(markdown, `## ${id}:`, /\n##\s+PDR-\d{4}:/);
    if (!/\*\*Date:\*\*\s+\d{4}-\d{2}-\d{2}/.test(detail)) {
      issues.push(issue('HIGH', 'DECISIONS.md', `${id} detail section must include a YYYY-MM-DD Date field`));
    }
  }

  if (containsPlaceholder(markdown)) {
    issues.push(issue('HIGH', 'DECISIONS.md', 'Contains unresolved template placeholder text'));
  }

  return issues;
}

function validatePersonaContent(markdown) {
  const boundary = sectionBetween(markdown, '## Profile Boundary', /\n##\s+/).toLowerCase();
  const requiredPhrases = [
    'finished-paper voice',
    'author perspective',
    'durable content preferences',
    'does not define',
    'tui',
    'snapshot policy',
    'feedback approval',
    'workflow gates',
  ];
  const missing = requiredPhrases.filter((phrase) => !boundary.includes(phrase));
  const issues = [];
  if (missing.length > 0) {
    issues.push(issue('HIGH', 'PERSONA.md', 'Profile Boundary must separate finished-paper voice from TUI behavior, snapshot policy, feedback approval, and workflow gates'));
  }
  issues.push(...validateSeparationOfConcerns(markdown, 'PERSONA.md', ['## Profile Boundary']));
  return issues;
}

function validateAudienceContent(markdown) {
  const boundary = sectionBetween(markdown, '## Audience Boundary', /\n##\s+/).toLowerCase();
  const requiredPhrases = [
    'reader model',
    'objections',
    'proof standard',
    'desired reader shift',
    'does not define',
    'tui',
    'snapshot policy',
    'feedback approval',
    'workflow gates',
  ];
  const issues = [];
  const missing = requiredPhrases.filter((phrase) => !boundary.includes(phrase));
  if (missing.length > 0) {
    issues.push(issue('HIGH', 'AUDIENCE.md', 'Audience Boundary must separate reader model from TUI behavior, snapshot policy, feedback approval, and workflow gates'));
  }
  issues.push(...validateSeparationOfConcerns(markdown, 'AUDIENCE.md', ['## Audience Boundary']));
  return issues;
}

function removeMarkdownSections(markdown, headings) {
  let result = markdown;
  for (const heading of headings) {
    const pattern = new RegExp(`\\n?${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n##\\s+|$)`, 'g');
    result = result.replace(pattern, '\n');
  }
  return result;
}

function validateSeparationOfConcerns(markdown, artifact, allowedBoundaryHeadings = []) {
  const scoped = removeMarkdownSections(markdown, allowedBoundaryHeadings);
  const checks = [
    {
      label: 'interactive TUI behavior',
      pattern: /\b(?:interactive\s+)?(?:codex\s+|claude\s+)?tui\s+behavior\b/i,
    },
    {
      label: 'snapshot or restore policy',
      pattern: /\b(?:snapshot policy|gpd snapshot|gpd restore|last_snapshot_id|restore snapshot)\b/i,
    },
    {
      label: 'feedback approval mechanics',
      pattern: /\b(?:feedback approval|feedback approval gate|FEEDBACK-PLAN approval|approved_handling)\b/i,
    },
    {
      label: 'workflow gates or CLI routing',
      pattern: /(?:\b(?:workflow gates?|gate override|suggested_next_command|gpd next)\b|\/gpd-[a-z-]+\b)/i,
    },
    {
      label: 'machine state mechanics',
      pattern: /\b(?:STATE\.json|STATE\.md|config\.json)\b/i,
    },
  ];

  return checks
    .filter((check) => check.pattern.test(scoped))
    .map((check) => issue('HIGH', artifact, `Separation of concerns violation: ${check.label} belongs in workflows, commands, CLI, or artifact contracts, not ${artifact}`));
}

function validatePaperContextTermsUsedInDraft(meta) {
  const contextPath = path.join(meta, 'PAPER-CONTEXT.md');
  const draftPath = path.join(meta, 'DRAFT.md');
  if (!fs.existsSync(contextPath) || !fs.existsSync(draftPath)) return [];
  const reviewedOrExported = fs.existsSync(path.join(meta, 'REVIEW.md'))
    || fs.existsSync(path.join(meta, 'exports', 'FINAL.md'));
  if (!reviewedOrExported) return [];

  const context = fs.readFileSync(contextPath, 'utf8');
  const draft = fs.readFileSync(draftPath, 'utf8').toLowerCase();
  const issues = [];

  for (const term of extractCanonicalTerms(context)) {
    if (!draft.includes(term.toLowerCase())) {
      issues.push(issue('HIGH', 'PAPER-CONTEXT.md', `Canonical term "${term}" does not appear in DRAFT.md`));
    }
  }

  return issues;
}

function validateMarkdownArtifact(filePath) {
  const basename = path.basename(filePath);
  const artifact = artifactNameForFile(filePath);
  const contract = markdownContracts[artifact];
  if (!contract) return [];
  if (!fs.existsSync(filePath)) return [issue('HIGH', artifact, 'file does not exist')];

  const markdown = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  for (const heading of contract.headings) {
    if (!hasHeading(markdown, heading)) {
      issues.push(issue('HIGH', artifact, `Missing heading "${heading}"`));
    }
  }

  const tables = parseTables(markdown);
  for (const columns of contract.tables) {
    if (!hasTableWithColumns(tables, columns)) {
      issues.push(issue('HIGH', artifact, `Missing table with columns: ${columns.join(', ')}`));
    }
  }

  if (artifact === 'REVIEW.md') {
    issues.push(...validateAudienceScorecard(markdown));
  }
  if (artifact === 'PERSONA.md') {
    issues.push(...validatePersonaContent(markdown));
  }
  if (artifact === 'AUDIENCE.md') {
    issues.push(...validateAudienceContent(markdown));
  }
  if (artifact === 'FEEDBACK-READER.md') {
    issues.push(...validateReaderFeedbackScorecard(markdown));
  }
  if (artifact === 'FEEDBACK-PLAN.md') {
    issues.push(...validateFeedbackPlanSections(markdown));
  }
  if (artifact === 'REVISION-CHECK.md') {
    issues.push(...validateRevisionCheckContent(markdown, filePath));
  }
  if (artifact === 'STRATEGY.md') {
    issues.push(...validateStrategyValues(markdown, filePath));
  }
  if (artifact === 'PAPER-CONTEXT.md') {
    issues.push(...validatePaperContextContent(markdown, filePath));
  }
  if (artifact === 'DECISIONS.md') {
    issues.push(...validateDecisionRecordsContent(markdown, filePath));
  }

  return issues;
}

function validateArtifact(inputPath) {
  const filePath = path.resolve(expandHome(inputPath));
  const basename = path.basename(filePath);
  const artifact = artifactNameForFile(filePath);
  if (jsonArtifactSchemas[basename]) return validateJsonArtifact(filePath);
  if (markdownContracts[artifact]) return validateMarkdownArtifact(filePath);
  return [issue('MEDIUM', basename, 'No artifact contract found')];
}

function validatePaperArtifacts(paperDir, artifacts) {
  const meta = path.join(paperDir, '.paper');
  const issues = [];

  for (const name of Object.keys(jsonArtifactSchemas)) {
    if (fs.existsSync(path.join(meta, name))) {
      issues.push(...validateJsonArtifact(path.join(meta, name)));
    }
  }

  for (const name of Object.keys(markdownContracts)) {
    if (artifacts[name]) {
      issues.push(...validateMarkdownArtifact(path.join(meta, name)));
    }
  }

  issues.push(...validatePaperContextTermsUsedInDraft(meta));

  return issues;
}

function printArtifactValidation(filePath, issues) {
  console.log(`artifact: ${path.resolve(expandHome(filePath))}`);
  console.log(`validation: ${issues.length === 0 ? 'ok' : 'issues found'}`);
  for (const item of issues) {
    console.log(`- ${item.severity}: ${item.issue}`);
  }
}

module.exports = {
  jsonArtifactSchemas,
  markdownContracts,
  validateArtifact,
  validatePaperArtifacts,
  printArtifactValidation,
  parseTables,
  validateJsonSchemaValue,
  validateSchemaDefinition,
};
