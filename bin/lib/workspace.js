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
  status,
  printStatus,
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
  status,
  printStatus,
  validate,
  printValidation,
  validateArtifact,
  printArtifactValidation,
  listMarkdownItems,
};
