'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..', '..');

const runtimeDefaults = {
  claude: path.join(os.homedir(), '.claude'),
  codex: path.join(os.homedir(), '.codex'),
};

const installMappings = [
  ['commands', ['commands']],
  ['workflows', ['get-paper-done', 'workflows']],
  ['templates', ['get-paper-done', 'templates']],
  ['references', ['get-paper-done', 'references']],
  ['profiles', ['get-paper-done', 'profiles']],
  ['audiences', ['get-paper-done', 'audiences']],
  ['agents', ['agents']],
];

function packageVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return pkg.version;
}

function resolveRuntime(runtime, target) {
  const selected = runtime || 'claude';
  const resolvedTarget = path.resolve(target || runtimeDefaults[selected] || selected);
  return {
    runtime: runtimeDefaults[selected] ? selected : 'custom',
    target: resolvedTarget,
  };
}

function refRootForTarget(target) {
  const home = os.homedir();
  const relative = path.relative(home, target);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return `~/${relative.split(path.sep).join('/')}`;
  }
  return target.split(path.sep).join('/');
}

function shouldSkip(entryName) {
  return entryName.startsWith('.') || entryName.endsWith('~') || entryName.endsWith('.swp');
}

function listFiles(srcDir, baseDir = srcDir) {
  const files = [];
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldSkip(entry.name)) continue;
    const fullPath = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  return files;
}

function transformContent(srcRel, content, target) {
  if (!srcRel.startsWith(`commands${path.sep}`) && !srcRel.startsWith('commands/')) {
    return content;
  }
  const runtimeRefRoot = refRootForTarget(target);
  return content
    .replace(/@\{\{GPD_RUNTIME_ROOT\}\}\/get-paper-done/g, `@${runtimeRefRoot}/get-paper-done`)
    .replace(/@~\/\.claude\/get-paper-done/g, `@${runtimeRefRoot}/get-paper-done`);
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sameContent(filePath, content) {
  if (!fs.existsSync(filePath)) return false;
  return fs.readFileSync(filePath, 'utf8') === content;
}

function copyChangedFile(srcAbs, srcRel, destAbs, options, manifestFiles) {
  const raw = fs.readFileSync(srcAbs, 'utf8');
  const content = transformContent(srcRel, raw, options.target);
  const relDest = path.relative(options.target, destAbs);
  const exists = fs.existsSync(destAbs);
  const changed = !sameContent(destAbs, content);

  if (options.dryRun) {
    const action = exists ? (changed ? 'would update' : 'would keep') : 'would copy';
    console.log(`${action} ${srcRel} -> ${destAbs}`);
    manifestFiles.push(relDest);
    return;
  }

  if (exists && changed && options.backup) {
    const backupPath = path.join(options.backupRoot, relDest);
    ensureParent(backupPath);
    fs.copyFileSync(destAbs, backupPath);
    console.log(`backed up ${destAbs} -> ${backupPath}`);
  }

  if (changed) {
    ensureParent(destAbs);
    fs.writeFileSync(destAbs, content);
    console.log(`${exists ? 'updated' : 'copied'} ${srcRel} -> ${destAbs}`);
  } else {
    console.log(`kept ${destAbs}`);
  }
  manifestFiles.push(relDest);
}

function installAssets(input = {}) {
  const resolved = resolveRuntime(input.runtime, input.target);
  const options = {
    action: input.action || 'install',
    runtime: resolved.runtime,
    target: resolved.target,
    dryRun: Boolean(input.dryRun),
    backup: input.backup !== false,
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  options.backupRoot = path.join(options.target, 'get-paper-done', '.backups', stamp);

  const manifestFiles = [];

  for (const [srcRelRoot, destParts] of installMappings) {
    const srcRoot = path.join(root, srcRelRoot);
    const destRoot = path.join(options.target, ...destParts);
    for (const rel of listFiles(srcRoot)) {
      const srcAbs = path.join(srcRoot, rel);
      const srcRel = path.join(srcRelRoot, rel);
      const destAbs = path.join(destRoot, rel);
      copyChangedFile(srcAbs, srcRel, destAbs, options, manifestFiles);
    }
  }

  const manifest = {
    name: 'get-paper-done',
    version: packageVersion(),
    runtime: options.runtime,
    target: options.target,
    action: options.action,
    installedAt: new Date().toISOString(),
    files: manifestFiles.sort(),
  };

  const manifestPath = path.join(options.target, 'get-paper-done', 'INSTALL-MANIFEST.json');
  if (options.dryRun) {
    console.log(`would write manifest -> ${manifestPath}`);
    console.log(`Dry run complete for ${options.runtime} target ${options.target}.`);
  } else {
    ensureParent(manifestPath);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`wrote manifest -> ${manifestPath}`);
    console.log(`${options.action === 'update' ? 'Update' : 'Install'} complete for ${options.runtime} target ${options.target}.`);
  }

  return manifest;
}

function readManifest(target) {
  const manifestPath = path.join(target, 'get-paper-done', 'INSTALL-MANIFEST.json');
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function doctor(input = {}) {
  const resolved = resolveRuntime(input.runtime, input.target);
  const target = resolved.target;
  const required = [
    path.join(target, 'commands', 'gpd', 'new-paper.md'),
    path.join(target, 'commands', 'gpd', 'outline.md'),
    path.join(target, 'get-paper-done', 'workflows', 'new-paper.md'),
    path.join(target, 'get-paper-done', 'templates', 'outline.md'),
    path.join(target, 'get-paper-done', 'references', 'writing-artifacts.md'),
    path.join(target, 'agents', 'paper-outliner.md'),
  ];

  const missing = required.filter((file) => !fs.existsSync(file));
  const manifest = readManifest(target);

  return {
    runtime: resolved.runtime,
    target,
    version: manifest ? manifest.version : null,
    manifestPresent: Boolean(manifest),
    missing,
    ok: missing.length === 0 && Boolean(manifest),
  };
}

module.exports = {
  root,
  packageVersion,
  resolveRuntime,
  installAssets,
  doctor,
};
