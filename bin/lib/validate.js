'use strict';

const fs = require('fs');
const path = require('path');

const { root, expandHome } = require('./common');

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
      '## Source Gaps',
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
};
