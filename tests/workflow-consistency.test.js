'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  CURRENT_STATE_VERSION,
  allowedStrategyStatuses,
  allowedStrategyBlockers,
  allowedUnblockActions,
} = require('../bin/lib/contracts');

const repoRoot = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function list(dir) {
  return fs.readdirSync(path.join(repoRoot, dir))
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => path.join(dir, file));
}

function fileExists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function simpleGlobMatches(pattern) {
  const normalized = pattern.split(path.sep).join('/');
  const star = normalized.indexOf('*');
  if (star === -1) return fileExists(normalized);
  const slash = normalized.lastIndexOf('/', star);
  const dir = slash === -1 ? '.' : normalized.slice(0, slash);
  const suffix = normalized.slice(star + 1);
  const absDir = path.join(repoRoot, dir);
  if (!fs.existsSync(absDir)) return [];
  return fs.readdirSync(absDir)
    .filter((name) => name.endsWith(suffix))
    .map((name) => path.join(dir, name));
}

function extractExecutionRefs(markdown) {
  const refs = [];
  const regex = /@\{\{GPD_RUNTIME_ROOT\}\}\/get-paper-done\/([^\s<]+)/g;
  let match = regex.exec(markdown);
  while (match) {
    refs.push(match[1].trim());
    match = regex.exec(markdown);
  }
  return refs;
}

function extractRequiredReading(markdown) {
  const match = markdown.match(/<required_reading>\s*([\s\S]*?)\s*<\/required_reading>/);
  if (!match) return [];
  return match[1].split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).replace(/\s+if present$/i, '').trim());
}

function extractFlags(markdown) {
  return new Set(markdown.match(/--[A-Za-z0-9][A-Za-z0-9-]*/g) || []);
}

function extractWorkflowRefs(markdown) {
  return extractExecutionRefs(markdown).filter((ref) => ref.startsWith('workflows/'));
}

function commandNameFromFile(commandFile) {
  return `/gpd-${path.basename(commandFile, '.md')}`;
}

function extractCommandRefs(markdown) {
  const refs = new Set();
  const regex = /\/gpd-[a-z0-9-]+/g;
  let match = regex.exec(markdown);
  while (match) {
    const next = markdown[match.index + match[0].length];
    if (next !== '.') refs.add(match[0]);
    match = regex.exec(markdown);
  }
  return refs;
}

function arrayEqual(actual, expected, label) {
  assert.deepStrictEqual(actual, expected, `${label} drifted from bin/lib/contracts.js`);
}

function assertContainsAll(file, values, label) {
  const markdown = read(file);
  for (const value of values) {
    assert(markdown.includes(value), `${file} is missing ${label} value ${value}`);
  }
}

function testCommandReferencesExistAndStayRuntimeNeutral() {
  for (const commandFile of list('commands/gpd')) {
    const markdown = read(commandFile);
    assert(!markdown.includes('@~/.claude/get-paper-done'), commandFile);
    const refs = extractExecutionRefs(markdown);
    assert(refs.length > 0, `${commandFile} should reference execution context`);
    for (const ref of refs) {
      assert(fileExists(ref), `${commandFile} references missing ${ref}`);
    }
  }
}

function testCommandWorkflowFlagParity() {
  for (const commandFile of list('commands/gpd')) {
    const commandMarkdown = read(commandFile);
    const workflowRefs = extractWorkflowRefs(commandMarkdown);
    assert(workflowRefs.length > 0, `${commandFile} should reference a workflow`);

    const commandFlags = extractFlags(commandMarkdown);
    if (commandFlags.size === 0) continue;

    const workflowMarkdown = workflowRefs.map(read).join('\n');
    const workflowFlags = extractFlags(workflowMarkdown);
    for (const flag of commandFlags) {
      assert(
        workflowFlags.has(flag),
        `${commandFile} documents ${flag}, but ${workflowRefs.join(', ')} does not`,
      );
    }
  }
}

function testReferencedCommandsExist() {
  const commandSet = new Set(list('commands/gpd').map(commandNameFromFile));
  for (const workflowFile of list('workflows')) {
    const markdown = read(workflowFile);
    for (const command of extractCommandRefs(markdown)) {
      assert(commandSet.has(command), `${workflowFile} references missing command ${command}`);
    }
  }
}

function testWorkflowRequiredReadingReferencesExist() {
  for (const workflowFile of list('workflows')) {
    const markdown = read(workflowFile);
    const refs = extractRequiredReading(markdown);
    for (const ref of refs) {
      if (ref.startsWith('.paper/') || ref.startsWith('original/')) continue;
      if (ref.includes('*')) {
        assert(simpleGlobMatches(ref).length > 0, `${workflowFile} references empty glob ${ref}`);
      } else {
        assert(fileExists(ref), `${workflowFile} references missing ${ref}`);
      }
    }
  }
}

function testStrategyEnumsStayCentralizedAndDocumented() {
  const schema = JSON.parse(read('references/schemas/state.schema.json'));
  const strategy = schema.properties.strategy.properties;

  arrayEqual(schema.properties.version.enum, [CURRENT_STATE_VERSION], 'STATE schema version enum');
  arrayEqual(strategy.status.enum, allowedStrategyStatuses, 'strategy.status enum');
  arrayEqual(strategy.blocking_issues.items.enum, allowedStrategyBlockers, 'strategy.blocking_issues enum');
  arrayEqual(strategy.primary_blocker.enum, allowedStrategyBlockers, 'strategy.primary_blocker enum');
  arrayEqual(strategy.required_unblock_action.enum, allowedUnblockActions, 'strategy.required_unblock_action enum');

  const statusDocs = [
    'agents/paper-strategist.md',
    'workflows/brief.md',
    'workflows/new-paper.md',
    'workflows/import-paper.md',
    'references/writing-artifacts.md',
    'templates/strategy.md',
  ];
  const blockerDocs = [
    'agents/paper-strategist.md',
    'workflows/brief.md',
    'workflows/new-paper.md',
    'workflows/import-paper.md',
    'references/writing-artifacts.md',
    'templates/strategy.md',
    'templates/import-report.md',
  ];
  const unblockActionDocs = [
    'agents/paper-strategist.md',
    'workflows/brief.md',
    'workflows/new-paper.md',
    'workflows/import-paper.md',
    'references/writing-artifacts.md',
    'templates/strategy.md',
  ];

  for (const file of statusDocs) assertContainsAll(file, allowedStrategyStatuses, 'strategy status');
  for (const file of blockerDocs) assertContainsAll(file, allowedStrategyBlockers, 'strategy blocker');
  for (const file of unblockActionDocs) assertContainsAll(file, allowedUnblockActions, 'unblock action');
}

function testReferencedTemplatesAndAgentsExist() {
  const allMarkdown = [
    ...list('commands/gpd').map(read),
    ...list('workflows').map(read),
  ].join('\n');

  const templateRefs = new Set(allMarkdown.match(/\btemplates\/[A-Za-z0-9_.-]+/g) || []);
  for (const ref of templateRefs) {
    assert(fileExists(ref), `missing template reference ${ref}`);
  }

  const agentRefs = new Set(
    allMarkdown.match(/\b[a-z]+(?:-[a-z]+)*(?:-reviewer|-researcher|-strategist|-outliner|-drafter|-editor|-fact-checker)\b/g) || [],
  );
  for (const name of agentRefs) {
    const agentPath = path.join('agents', `${name}.md`);
    assert(fileExists(agentPath), `missing agent reference ${agentPath}`);
  }
}

function testAudienceScorecardDimensionsAreProtected() {
  const reviewTemplate = read('templates/review.md');
  const required = [
    'Thesis clarity',
    'Audience relevance',
    'Evidence sufficiency',
    'Objection handling',
    'Jargon appropriateness',
    'Decision usefulness',
    'Structural flow',
  ];
  for (const dimension of required) {
    assert(reviewTemplate.includes(`| ${dimension} | [1-5] | [why] |`), `missing audience scorecard dimension ${dimension}`);
  }
}

function testGovernanceControlGuidanceStaysReusable() {
  const requiredFiles = [
    'templates/brief.md',
    'templates/outline.md',
    'templates/draft.md',
    'templates/fact-check.md',
    'templates/review.md',
    'workflows/brief.md',
    'workflows/outline.md',
    'workflows/draft.md',
    'workflows/fact-check.md',
    'workflows/review.md',
    'agents/paper-drafter.md',
    'agents/paper-fact-checker.md',
    'agents/paper-outliner.md',
  ];

  for (const file of requiredFiles) {
    const markdown = read(file).toLowerCase();
    assert(markdown.includes('governed object'), `${file} is missing governed-object guidance`);
    assert(markdown.includes('refresh trigger'), `${file} is missing refresh-trigger guidance`);
  }

  assert(read('templates/review.md').includes('Standards are explained and not overstated'));
  assert(read('workflows/draft.md').includes('do not imply that a public standard mandates the exact internal workflow unless the source actually does'));
}

testCommandReferencesExistAndStayRuntimeNeutral();
testCommandWorkflowFlagParity();
testReferencedCommandsExist();
testWorkflowRequiredReadingReferencesExist();
testStrategyEnumsStayCentralizedAndDocumented();
testReferencedTemplatesAndAgentsExist();
testAudienceScorecardDimensionsAreProtected();
testGovernanceControlGuidanceStaysReusable();

console.log('workflow consistency tests passed');
