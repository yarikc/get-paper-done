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

module.exports = {
  CURRENT_STATE_VERSION,
  allowedStrategyStatuses,
  allowedStrategyBlockers,
  allowedUnblockActions,
};
