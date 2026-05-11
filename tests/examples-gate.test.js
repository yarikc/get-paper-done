'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const examplesDir = path.join(repoRoot, 'examples');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');

function run(args) {
  return execFileSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function examplePaperDirs() {
  return fs.readdirSync(examplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(examplesDir, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, '.paper')));
}

const examples = examplePaperDirs();
assert(examples.length > 0, 'expected at least one example workspace');

for (const example of examples) {
  const result = JSON.parse(run(['validate', '--paper', example, '--semantic', '--json']));
  assert.strictEqual(result.ok, true, `${example} should validate`);
  assert.deepStrictEqual(result.issues, [], `${example} should have no semantic warnings`);
}

console.log('example gate tests passed');
