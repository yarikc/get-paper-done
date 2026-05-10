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
  status,
  printStatus,
  validate,
  printValidation,
} = require('./state');

module.exports = {
  slugify,
  initPaper,
  importPaper,
  status,
  printStatus,
  validate,
  printValidation,
  listMarkdownItems,
};
