'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

testCommandReferencesExistAndStayRuntimeNeutral();
testWorkflowRequiredReadingReferencesExist();
testReferencedTemplatesAndAgentsExist();
testAudienceScorecardDimensionsAreProtected();

console.log('workflow consistency tests passed');
