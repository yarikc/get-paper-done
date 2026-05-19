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
  formatExternalReviewProgress,
} = require('./external-review');
const {
  captureFeedback,
  printFeedbackCapture,
  reviewPack,
  printReviewPack,
} = require('./review-feedback');
const {
  createSnapshot,
  printSnapshot,
  restoreSnapshot,
  printRestore,
} = require('./snapshot');
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
  formatExternalReviewProgress,
  captureFeedback,
  printFeedbackCapture,
  reviewPack,
  printReviewPack,
  createSnapshot,
  printSnapshot,
  restoreSnapshot,
  printRestore,
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
