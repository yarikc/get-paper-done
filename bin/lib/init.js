'use strict';

const path = require('path');

const {
  today,
  resolvePaperDir,
  ensureNotExistingPaper,
  mkdirp,
  readTemplate,
  writeFile,
  templateWithBasics,
} = require('./common');
const {
  defaultMachineState,
  writeStateJson,
} = require('./state');

function strategyReplacements(title, reason) {
  return {
    '[Paper Title]': title,
    '[date]': today(),
    '[Go | Revise Before Drafting | No-Go]': 'Revise Before Drafting',
    '[Concise reason]': reason,
    '[none | scope_too_broad | thesis_weak | audience_unclear | audience_conflict | evidence_gap | weak_ask | poor_posture | missing_outcome | reader_promise_weak | decision_usefulness_weak]': 'thesis_weak | audience_unclear | missing_outcome',
    '[none | one blocker from Blocking issues]': 'thesis_weak',
    '[None | Medium | High]': 'Medium',
    '[none | brief_revision | audience_revision | thesis_revision | scope_narrowing | research_plan | user_override]': 'brief_revision',
  };
}

function writeSetupArtifacts(paperDir, title, reason, dryRun) {
  const replacements = strategyReplacements(title, reason);
  const files = [
    ['project.md', 'PROJECT.md'],
    ['persona.md', 'PERSONA.md'],
    ['audience.md', 'AUDIENCE.md'],
    ['brief.md', 'BRIEF.md'],
    ['strategy.md', 'STRATEGY.md'],
    ['state.md', 'STATE.md'],
  ];

  for (const [template, dest] of files) {
    writeFile(
      path.join(paperDir, '.paper', dest),
      templateWithBasics(template, replacements),
      dryRun,
    );
  }
  writeFile(path.join(paperDir, '.paper', 'config.json'), readTemplate('config.json'), dryRun);
  writeStateJson(paperDir, defaultMachineState(), dryRun);
}

function initPaper(input = {}) {
  const paperDir = resolvePaperDir(input);
  const title = input.title || input.slug || path.basename(paperDir);
  const dryRun = Boolean(input.dryRun);

  ensureNotExistingPaper(paperDir);

  mkdirp(paperDir, dryRun);
  mkdirp(path.join(paperDir, '.paper'), dryRun);
  mkdirp(path.join(paperDir, '.paper', 'sources'), dryRun);
  mkdirp(path.join(paperDir, '.paper', 'exports'), dryRun);

  writeSetupArtifacts(
    paperDir,
    title,
    'CLI initialization needs confirmed thesis, audience, reader promise, scope, and desired outcome.',
    dryRun,
  );

  console.log(`${dryRun ? 'Dry run complete' : 'Initialized paper'}: ${paperDir}`);
  return { paperDir };
}

module.exports = {
  initPaper,
  writeSetupArtifacts,
};
