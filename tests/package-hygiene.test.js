'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function parsePackJson(output) {
  const jsonStart = output.indexOf('[');
  assert(jsonStart >= 0, 'npm pack --json output should contain a JSON array');
  return JSON.parse(output.slice(jsonStart));
}

const npmCache = fs.mkdtempSync(path.join(os.tmpdir(), 'gpd-npm-cache-'));
const output = execFileSync('npm', ['--cache', npmCache, 'pack', '--dry-run', '--json'], {
  cwd: repoRoot,
  encoding: 'utf8',
});

const pack = parsePackJson(output)[0];
const files = new Set(pack.files.map((file) => file.path));

for (const requiredPath of [
  'README.md',
  'LICENSE',
  'package.json',
  'bin/gpd.js',
  'docs/START-HERE.md',
  'docs/SEMANTIC-CALIBRATION.md',
  'commands/gpd/new-paper.md',
  'workflows/new-paper.md',
  'agents/paper-strategist.md',
  'templates/state.json',
  'references/schemas/state.schema.json',
  'profiles/head-data-ai-architecture.md',
  'examples/data-products-ai-scaling/README.md',
]) {
  assert(files.has(requiredPath), `package is missing required file: ${requiredPath}`);
}

for (const forbiddenPath of [
  'paper_spec_template_yarik.md',
  'rfc/RFC-1.md',
  'rfc/RFC-2.md',
  'rfc/RFC-3-illustrations.md',
  'rfc/RFC-4-charts.md',
  '.github/workflows/ci.yml',
  'agents/.claude/settings.local.json',
  'tests/package-hygiene.test.js',
]) {
  assert(!files.has(forbiddenPath), `package should not include ${forbiddenPath}`);
}

for (const filePath of files) {
  assert(!filePath.startsWith('docs/feedback'), `package should not include feedback file: ${filePath}`);
  assert(!filePath.endsWith('.feedback'), `package should not include inline feedback file: ${filePath}`);
  assert(!filePath.startsWith('agents/.claude/'), `package should not include local agent settings: ${filePath}`);
  assert(!filePath.startsWith('rfc/'), `package should not include RFC design drafts: ${filePath}`);
  assert(!filePath.startsWith('tests/'), `package should not include tests: ${filePath}`);
  assert(!filePath.startsWith('.github/'), `package should not include GitHub metadata: ${filePath}`);
}

console.log('package hygiene tests passed');
