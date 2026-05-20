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
  cleanFeedbackComments,
  printFeedbackCapture,
  printFeedbackClean,
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
  prepareRevision,
  printRevisionPreparation,
} = require('./revise');
const {
  decideFeedbackPlan,
  listFeedbackPlan,
  printFeedbackPlanDecision,
  printFeedbackPlanList,
  printFeedbackPlanReview,
  reviewFeedbackPlan,
} = require('./feedback-plan');
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
  cleanFeedbackComments,
  printFeedbackCapture,
  printFeedbackClean,
  reviewPack,
  printReviewPack,
  createSnapshot,
  printSnapshot,
  restoreSnapshot,
  printRestore,
  prepareRevision,
  printRevisionPreparation,
  decideFeedbackPlan,
  listFeedbackPlan,
  printFeedbackPlanDecision,
  printFeedbackPlanList,
  printFeedbackPlanReview,
  reviewFeedbackPlan,
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
