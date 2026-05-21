'use strict';

const CURRENT_STATE_VERSION = 1;

const allowedStrategyStatuses = [
  'Go',
  'Revise Before Drafting',
  'No-Go',
];

const allowedStrategyBlockers = [
  'none',
  'scope_too_broad',
  'thesis_weak',
  'audience_unclear',
  'audience_conflict',
  'evidence_gap',
  'weak_ask',
  'poor_posture',
  'missing_outcome',
  'reader_promise_weak',
  'decision_usefulness_weak',
];

const allowedUnblockActions = [
  'none',
  'brief_revision',
  'audience_revision',
  'thesis_revision',
  'scope_narrowing',
  'research_plan',
  'user_override',
];

const allowedGrillStatuses = [
  'Not Started',
  'In Progress',
  'Complete',
];

const requiredGrillDecisionKeys = [
  'paper_job',
  'primary_reader',
  'belief_shift',
  'thesis',
  'narrative_spine',
  'key_terms',
  'scope_boundary',
  'proof_standard',
  'strongest_counterargument',
  'non_goals',
];

const boundaryOutOfScopePhrases = [
  'does not define',
  'tui',
  'snapshot policy',
  'feedback approval',
  'workflow gates',
];

const personaBoundaryInScopePhrases = [
  'finished-paper voice',
  'author perspective',
  'durable content preferences',
];

const audienceBoundaryInScopePhrases = [
  'reader model',
  'objections',
  'proof standard',
  'desired reader shift',
];

module.exports = {
  CURRENT_STATE_VERSION,
  allowedStrategyStatuses,
  allowedStrategyBlockers,
  allowedUnblockActions,
  allowedGrillStatuses,
  requiredGrillDecisionKeys,
  boundaryOutOfScopePhrases,
  personaBoundaryInScopePhrases,
  audienceBoundaryInScopePhrases,
};
