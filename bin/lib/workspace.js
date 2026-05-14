'use strict';

const {
  slugify,
  listMarkdownItems,
} = require('./common');
const {
  initPaper,
} = require('./init');
const {
  importPaper,
} = require('./import');
const {
  exportPaper,
  printExport,
} = require('./export');
const {
  reviewExternal,
  printExternalReviewResult,
} = require('./external-review');
const {
  status,
  printStatus,
  nextAction,
  printNext,
  validate,
  printValidation,
} = require('./state');
const {
  validateArtifact,
  printArtifactValidation,
} = require('./validate');

module.exports = {
  slugify,
  initPaper,
  importPaper,
  exportPaper,
  printExport,
  reviewExternal,
  printExternalReviewResult,
  status,
  printStatus,
  nextAction,
  printNext,
  validate,
  printValidation,
  validateArtifact,
  printArtifactValidation,
  listMarkdownItems,
};
