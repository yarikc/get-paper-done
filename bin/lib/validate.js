'use strict';

const fs = require('fs');
const path = require('path');

const { root, expandHome } = require('./common');
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
  'strategy.md': 'STRATEGY.md',
  'outline.md': 'OUTLINE.md',
  'fact-check.md': 'FACT-CHECK.md',
  'review.md': 'REVIEW.md',
  'external-reviews.md': 'EXTERNAL-REVIEWS.md',
  'reader-feedback.md': 'READER-FEEDBACK.md',
  'feedback-plan.md': 'FEEDBACK-PLAN.md',
};

const markdownContracts = {
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
      '## Proposed Handling',
      '## Incorporate',
      '## Ignore',
      '## Defer',
      '## User Decisions Needed',
      '## Approval Gate',
    ],
    tables: [
      [
        '#',
        'Feedback',
        'Source(s)',
        'Assessment',
        'Recommendation',
        'Proposed Handling',
        'Affected Artifact',
      ],
    ],
  },
  'EXTERNAL-REVIEWS.md': {
    headings: [
      '# External Reviews',
      '## Review Prompt Summary',
      '## Consensus Summary',
      '### Shared Concerns',
      '### Shared Strengths',
      '### Divergent Views',
      '### High-Risk Items',
    ],
    tables: [],
  },
  'READER-FEEDBACK.md': {
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
};

function issue(severity, artifact, message) {
  return { severity, issue: `${artifact}: ${message}` };
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
  const contract = markdownContracts['READER-FEEDBACK.md'];
  const section = sectionBetween(markdown, '## Five-Signal Scorecard', /\n##\s+/);
  const rows = parseFirstTableRows(section);
  const signals = rows.map((row) => row[0]).filter(Boolean);
  const issues = [];

  for (const signal of contract.readerFeedbackSignals) {
    if (!signals.includes(signal)) {
      issues.push(issue('HIGH', 'READER-FEEDBACK.md', `Five-Signal Scorecard missing signal "${signal}"`));
    }
  }

  for (const signal of signals) {
    if (!contract.readerFeedbackSignals.includes(signal)) {
      issues.push(issue('HIGH', 'READER-FEEDBACK.md', `Five-Signal Scorecard has unexpected signal "${signal}"`));
    }
  }

  for (const signal of contract.readerFeedbackSignals) {
    const count = signals.filter((item) => item === signal).length;
    if (count > 1) {
      issues.push(issue('HIGH', 'READER-FEEDBACK.md', `Five-Signal Scorecard repeats signal "${signal}"`));
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

function validateMarkdownArtifact(filePath) {
  const basename = path.basename(filePath);
  const artifact = artifactNameAliases[basename] || basename;
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
  if (artifact === 'READER-FEEDBACK.md') {
    issues.push(...validateReaderFeedbackScorecard(markdown));
  }
  if (artifact === 'STRATEGY.md') {
    issues.push(...validateStrategyValues(markdown, filePath));
  }

  return issues;
}

function validateArtifact(inputPath) {
  const filePath = path.resolve(expandHome(inputPath));
  const basename = path.basename(filePath);
  const artifact = artifactNameAliases[basename] || basename;
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
