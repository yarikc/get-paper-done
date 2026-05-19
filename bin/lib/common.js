'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const { root } = require('./installer');

function slugify(value) {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled-paper';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function timestampSlug() {
  return new Date().toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/[^0-9TZ]/g, '')
    .replace(/Z$/, '')
    .toLowerCase();
}

function expandHome(value) {
  if (!value) return value;
  const home = process.env.HOME || os.homedir();
  if ((value === '~' || value.startsWith('~/')) && !home) {
    throw new Error('Cannot expand "~" because HOME is not set. Pass an absolute path instead.');
  }
  if (value === '~') return home;
  if (value.startsWith('~/')) return path.join(home, value.slice(2));
  return value;
}

function resolvePaperDir(input = {}) {
  if (input.paper) return path.resolve(expandHome(input.paper));
  const location = path.resolve(expandHome(input.location || process.cwd()));
  const defaultName = input.source
    ? path.basename(path.resolve(expandHome(input.source)), path.extname(input.source))
    : `untitled-paper-${timestampSlug()}`;
  const slug = slugify(input.slug || input.title || defaultName);
  return path.join(location, slug);
}

function ensureNotExistingPaper(paperDir) {
  const paperMeta = path.join(paperDir, '.paper');
  if (fs.existsSync(paperMeta)) {
    throw new Error(
      `Refusing to overwrite existing paper workspace: ${paperDir}. `
      + 'Choose a different --slug or --location, or run commands against this workspace with --paper.',
    );
  }
}

function mkdirp(dir, dryRun) {
  if (dryRun) {
    console.log(`would create directory ${dir}`);
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function readTemplate(name) {
  return fs.readFileSync(path.join(root, 'templates', name), 'utf8');
}

function writeFile(filePath, content, dryRun) {
  if (dryRun) {
    console.log(`would write ${filePath}`);
    return;
  }
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  try {
    fs.writeFileSync(tempPath, content);
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_) {
      // Best effort cleanup only; preserve the original write error.
    }
    throw err;
  }
}

function copyFile(src, dest, dryRun) {
  if (dryRun) {
    console.log(`would copy ${src} -> ${dest}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function fileSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fileSha256IfExists(filePath) {
  return fs.existsSync(filePath) ? fileSha256(filePath) : '';
}

function templateWithBasics(name, replacements) {
  let content = readTemplate(name);
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  return content;
}

function listMarkdownItems(dirName) {
  const dir = path.join(root, dirName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((file) => {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const heading = content.split(/\r?\n/).find((line) => line.startsWith('# '));
      const title = heading ? heading.slice(2).trim() : file.replace(/\.md$/, '');
      return {
        slug: file.replace(/\.md$/, ''),
        title,
        path: path.join(dirName, file),
      };
    });
}

module.exports = {
  root,
  slugify,
  today,
  expandHome,
  resolvePaperDir,
  ensureNotExistingPaper,
  mkdirp,
  readTemplate,
  writeFile,
  copyFile,
  fileSha256,
  fileSha256IfExists,
  templateWithBasics,
  listMarkdownItems,
};
