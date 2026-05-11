'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { validateSemanticPaper } = require('../bin/lib/semantic');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'tests', 'fixtures', 'control-paper-lifecycle-framework');
const paperDir = fixtureDir;

function fixtureFiles() {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else files.push(fullPath);
    }
  }
  walk(fixtureDir);
  return files;
}

function fixtureText() {
  return fixtureFiles()
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
}

function testFixtureIsAnonymized() {
  const text = fixtureText();
  const disallowedPatterns = [
    /\/Users\//,
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+,\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4}\b/,
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:Group|Corporation|Company|Bank)\b/,
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:Institute|Office|Agency|Commission|Authority)\b/,
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+(?:Research|Preview|Suite)\b/,
  ];

  for (const pattern of disallowedPatterns) {
    assert(!pattern.test(text), `fixture contains sensitive pattern ${pattern}`);
  }
}

function testExpectedFindingsDocumentKnownGap() {
  const expected = fs.readFileSync(path.join(fixtureDir, 'EXPECTED-FINDINGS.md'), 'utf8');
  assert(expected.includes('Current semantic baseline'));
  assert(expected.includes('Baseline commit'));
  assert(expected.includes('MEDIUM warning'));
}

function testStandaloneDraftWarnsAboutMissingSourceMapping() {
  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('source-sensitive imported draft has no RESEARCH.json')
  )));
}

function testMixedAudienceDraftWarnsAboutMissingReview() {
  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('mixed-audience draft has no REVIEW.md')
  )));
}

function testDraftWarnsAboutUndefinedRecurringTerms() {
  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('recurring term "lifecycle" appears repeatedly before being defined')
  )));
}

testFixtureIsAnonymized();
testExpectedFindingsDocumentKnownGap();
testStandaloneDraftWarnsAboutMissingSourceMapping();
testMixedAudienceDraftWarnsAboutMissingReview();
testDraftWarnsAboutUndefinedRecurringTerms();

console.log('control paper fixture tests passed');
