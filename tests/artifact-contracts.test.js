'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const {
  validateJsonSchemaValue,
  validateSchemaDefinition,
  validatePaperArtifacts,
} = require('../bin/lib/validate');

function run(args, options = {}) {
  return execFileSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function runFail(args, options = {}) {
  return spawnSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'references', 'schemas', name), 'utf8'));
}

function testTemplateArtifactsPassContracts() {
  for (const file of [
    'templates/state.json',
    'templates/config.json',
    'templates/research.json',
    'templates/strategy.md',
    'templates/outline.md',
    'templates/fact-check.md',
    'templates/review.md',
    'templates/external-reviews.md',
    'templates/reader-feedback.md',
    'templates/feedback-plan.md',
    'templates/paper-context.md',
    'templates/decisions.md',
  ]) {
    const output = run(['validate-artifact', '--path', path.join(repoRoot, file)]);
    assert(output.includes('validation: ok'), file);
  }
}

function testJsonSchemaFailureIsActionable() {
  const dir = tempDir('gpd-artifact-json-test');
  const badState = path.join(dir, 'STATE.json');
  fs.writeFileSync(badState, JSON.stringify({
    version: 1,
    status: 'Initialized',
    current_stage: 'Strategy Gate',
    last_completed_stage: 'Setup',
    last_activity: new Date().toISOString(),
    suggested_next_command: '/gpd-brief',
    blocked_by: [],
    grill: {
      status: 'Not Started',
      completion_basis: '',
      resolved_decisions: [],
    },
    strategy: {
      blocking_issues: [],
      primary_blocker: 'none',
      block_severity: 'None',
      required_unblock_action: 'none',
    },
    feedback: {
      feedback_plan_status: 'Not created',
      approved_handling: '',
    },
    post_import_choices: [],
  }, null, 2));

  const result = runFail(['validate-artifact', '--path', badState]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('STATE.json: $.strategy.status is required'));
}

function testStateEnumFailureIsActionable() {
  const dir = tempDir('gpd-artifact-state-enum-test');
  const badState = path.join(dir, 'STATE.json');
  const state = JSON.parse(fs.readFileSync(path.join(repoRoot, 'templates', 'state.json'), 'utf8'));
  state.grill.status = 'Almost Done';
  state.grill.resolved_decisions = ['paper_job', 'reader_vibes'];
  state.strategy.primary_blocker = 'thesis_typo';
  state.strategy.required_unblock_action = 'rewrite_the_thing';
  fs.writeFileSync(badState, JSON.stringify(state, null, 2));

  const result = runFail(['validate-artifact', '--path', badState]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('STATE.json: $.grill.status must be one of Not Started, In Progress, Complete'));
  assert(result.stdout.includes('STATE.json: $.grill.resolved_decisions[1] must be one of paper_job, primary_reader'));
  assert(result.stdout.includes('STATE.json: $.strategy.primary_blocker must be one of none, scope_too_broad, thesis_weak, audience_unclear'));
  assert(result.stdout.includes('STATE.json: $.strategy.required_unblock_action must be one of none, brief_revision, audience_revision'));
}

function testResearchEnumFailureIsActionable() {
  const dir = tempDir('gpd-artifact-research-enum-test');
  const badResearch = path.join(dir, 'RESEARCH.json');
  const research = JSON.parse(fs.readFileSync(path.join(repoRoot, 'templates', 'research.json'), 'utf8'));
  research.evidence_matrix[0].claim_type = 'vibes';
  research.evidence_matrix[0].strength_of_support = 'pretty_good';
  research.evidence_matrix[0].recommended_handling = 'wing_it';
  fs.writeFileSync(badResearch, JSON.stringify(research, null, 2));

  const result = runFail(['validate-artifact', '--path', badResearch]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('RESEARCH.json: $.evidence_matrix[0].claim_type must be one of factual, causal, strategic_judgment, technical_mechanism, market_trend, recommendation'));
  assert(result.stdout.includes('RESEARCH.json: $.evidence_matrix[0].strength_of_support must be one of strong, moderate, weak, none'));
  assert(result.stdout.includes('RESEARCH.json: $.evidence_matrix[0].recommended_handling must be one of keep, support_more, soften, narrow, caveat, drop'));
}

function testResearchPlanSourceTypeFailureIsActionable() {
  const dir = tempDir('gpd-artifact-research-plan-source-test');
  const badResearch = path.join(dir, 'RESEARCH.json');
  const research = JSON.parse(fs.readFileSync(path.join(repoRoot, 'templates', 'research.json'), 'utf8'));
  research.research_plan.inferred_research_questions[0].planned_source_types = ['official', 'practitioner'];
  fs.writeFileSync(badResearch, JSON.stringify(research, null, 2));

  const result = runFail(['validate-artifact', '--path', badResearch]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('RESEARCH.json: $.research_plan.inferred_research_questions[0].planned_source_types[1] must be one of official, academic, industry, news, analyst, blog, user_provided, other'));
}

function testResearchSourceRegistryFailureIsActionable() {
  const dir = tempDir('gpd-artifact-research-source-test');
  const badResearch = path.join(dir, 'RESEARCH.json');
  const research = JSON.parse(fs.readFileSync(path.join(repoRoot, 'templates', 'research.json'), 'utf8'));
  research.source_registry[0].source_type = 'newsletter_thread';
  research.source_registry[0].authority = 'legendary';
  research.source_registry[0].stance = 'cheerleading';
  research.source_registry[0].claim_support[0].support = 'vibes';
  research.source_registry[0].claim_support[0].unexpected = true;
  research.source_registry[0].unexpected = true;
  fs.writeFileSync(badResearch, JSON.stringify(research, null, 2));

  const result = runFail(['validate-artifact', '--path', badResearch]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('RESEARCH.json: $.source_registry[0].source_type must be one of official, academic, industry, news, analyst, blog, user_provided, other'));
  assert(result.stdout.includes('RESEARCH.json: $.source_registry[0].authority must be one of high, medium, low'));
  assert(result.stdout.includes('RESEARCH.json: $.source_registry[0].stance must be one of supportive, neutral, critical, mixed'));
  assert(result.stdout.includes('RESEARCH.json: $.source_registry[0].claim_support[0].support must be one of direct, partial, topical_only, contradicts, not_checked'));
  assert(result.stdout.includes('RESEARCH.json: $.source_registry[0].claim_support[0].unexpected is not allowed'));
  assert(result.stdout.includes('RESEARCH.json: $.source_registry[0].unexpected is not allowed'));
}

function testResearchSynthesisMatrixFailureIsActionable() {
  const dir = tempDir('gpd-artifact-research-synthesis-test');
  const badResearch = path.join(dir, 'RESEARCH.json');
  const research = JSON.parse(fs.readFileSync(path.join(repoRoot, 'templates', 'research.json'), 'utf8'));
  research.synthesis_matrix.rows[0].pattern = 'handwave';
  research.synthesis_matrix.rows[0].source_summaries.S2 = 42;
  research.synthesis_matrix.rows[0].extra = 'not allowed';
  fs.writeFileSync(badResearch, JSON.stringify(research, null, 2));

  const result = runFail(['validate-artifact', '--path', badResearch]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('RESEARCH.json: $.synthesis_matrix.rows[0].source_summaries.S2 expected string, got number'));
  assert(result.stdout.includes('RESEARCH.json: $.synthesis_matrix.rows[0].pattern must be one of agreement, disagreement, mixed, gap'));
  assert(result.stdout.includes('RESEARCH.json: $.synthesis_matrix.rows[0].extra is not allowed'));
}

function testMarkdownContractFailureIsActionable() {
  const dir = tempDir('gpd-artifact-md-test');
  const badReview = path.join(dir, 'REVIEW.md');
  const review = fs.readFileSync(path.join(repoRoot, 'templates', 'review.md'), 'utf8')
    .replace('| Structural flow | [1-5] | [why] | [instruction or "-"] |\n', '');
  fs.writeFileSync(badReview, review);

  const result = runFail(['validate-artifact', '--path', badReview]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('REVIEW.md: Audience Review Scorecard missing dimension "Structural flow"'));
}

function testMarkdownContractRejectsUnexpectedAudienceDimension() {
  const dir = tempDir('gpd-artifact-md-extra-test');
  const badReview = path.join(dir, 'REVIEW.md');
  const review = fs.readFileSync(path.join(repoRoot, 'templates', 'review.md'), 'utf8')
    .replace(
      '| Structural flow | [1-5] | [why] | [instruction or "-"] |\n',
      '| Structural flow | [1-5] | [why] | [instruction or "-"] |\n| Extra dimension | [1-5] | [why] | [instruction or "-"] |\n',
    );
  fs.writeFileSync(badReview, review);

  const result = runFail(['validate-artifact', '--path', badReview]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('REVIEW.md: Audience Review Scorecard has unexpected dimension "Extra dimension"'));
}

function testMarkdownContractRejectsMalformedHeading() {
  const dir = tempDir('gpd-artifact-md-heading-test');
  const badReview = path.join(dir, 'REVIEW.md');
  const review = fs.readFileSync(path.join(repoRoot, 'templates', 'review.md'), 'utf8')
    .replace('# Review\n', '# Review Notes\n');
  fs.writeFileSync(badReview, review);

  const result = runFail(['validate-artifact', '--path', badReview]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('REVIEW.md: Missing heading "# Review"'));
}

function testReaderFeedbackContractRejectsMissingSignal() {
  const dir = tempDir('gpd-artifact-reader-feedback-test');
  const badFeedback = path.join(dir, 'READER-FEEDBACK.md');
  const feedback = fs.readFileSync(path.join(repoRoot, 'templates', 'reader-feedback.md'), 'utf8')
    .replace('| Ask clarity | [1-5] | [phrase, section, or pattern] | [what to preserve or change] |\n', '');
  fs.writeFileSync(badFeedback, feedback);

  const result = runFail(['validate-artifact', '--path', badFeedback]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('READER-FEEDBACK.md: Five-Signal Scorecard missing signal "Ask clarity"'));
}

function testExternalReviewsContractRequiresConsensusSections() {
  const dir = tempDir('gpd-artifact-external-reviews-test');
  const badReviews = path.join(dir, 'EXTERNAL-REVIEWS.md');
  const reviews = fs.readFileSync(path.join(repoRoot, 'templates', 'external-reviews.md'), 'utf8')
    .replace('### High-Risk Items\n\n- [Feedback that could materially change the thesis, evidence, or positioning]\n', '');
  fs.writeFileSync(badReviews, reviews);

  const result = runFail(['validate-artifact', '--path', badReviews]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('EXTERNAL-REVIEWS.md: Missing heading "### High-Risk Items"'));
}

function testFactCheckContractRequiresSafeClaimSections() {
  const dir = tempDir('gpd-artifact-fact-check-heading-test');
  const badFactCheck = path.join(dir, 'FACT-CHECK.md');
  const factCheck = fs.readFileSync(path.join(repoRoot, 'templates', 'fact-check.md'), 'utf8')
    .replace(/## Claims Safe To Keep[\s\S]*?(?=## Claims To Soften)/, '');
  fs.writeFileSync(badFactCheck, factCheck);

  const result = runFail(['validate-artifact', '--path', badFactCheck]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('FACT-CHECK.md: Missing heading "## Claims Safe To Keep"'));
  assert(result.stdout.includes('FACT-CHECK.md: Missing table with columns: Claim ID, Claim, Why Safe, Source(s)'));
}

function testStrategyValueFailureIsActionable() {
  const dir = tempDir('gpd-artifact-strategy-value-test');
  const badStrategy = path.join(dir, 'STRATEGY.md');
  const strategy = fs.readFileSync(path.join(repoRoot, 'templates', 'strategy.md'), 'utf8');
  fs.writeFileSync(badStrategy, strategy);

  const result = runFail(['validate-artifact', '--path', badStrategy]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('STRATEGY.md: $.Status must be one of Go, Revise Before Drafting, No-Go'));
  assert(result.stdout.includes('STRATEGY.md: $.Primary blocker must be one of none, scope_too_broad, thesis_weak'));
  assert(result.stdout.includes('STRATEGY.md: $.Required unblock action must be one of none, brief_revision, audience_revision'));
}

function testPaperContextRejectsPlaceholderContent() {
  const dir = tempDir('gpd-artifact-paper-context-test');
  const badContext = path.join(dir, 'PAPER-CONTEXT.md');
  fs.writeFileSync(badContext, fs.readFileSync(path.join(repoRoot, 'templates', 'paper-context.md'), 'utf8'));

  const result = runFail(['validate-artifact', '--path', badContext]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('PAPER-CONTEXT.md: Opening context must explain why this paper needs a language contract'));
  assert(result.stdout.includes('PAPER-CONTEXT.md: Language section must define at least one non-placeholder canonical term'));
  assert(result.stdout.includes('PAPER-CONTEXT.md: Contains unresolved template placeholder text'));
}

function testDecisionsRejectPlaceholderContent() {
  const dir = tempDir('gpd-artifact-decisions-test');
  const badDecisions = path.join(dir, 'DECISIONS.md');
  fs.writeFileSync(badDecisions, fs.readFileSync(path.join(repoRoot, 'templates', 'decisions.md'), 'utf8'));

  const result = runFail(['validate-artifact', '--path', badDecisions]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('DECISIONS.md: PDR-0001 decision must be non-placeholder text'));
  assert(result.stdout.includes('DECISIONS.md: PDR-0001 Why It Matters must be non-placeholder text'));
  assert(result.stdout.includes('DECISIONS.md: PDR-0001 detail section must include a YYYY-MM-DD Date field'));
  assert(result.stdout.includes('DECISIONS.md: Contains unresolved template placeholder text'));
}

function testPaperContextTermsMustAppearInDraftWhenDraftExists() {
  const dir = tempDir('gpd-artifact-paper-context-draft-test');
  const paperDir = path.join(dir, 'paper');
  const meta = path.join(paperDir, '.paper');
  fs.mkdirSync(meta, { recursive: true });
  fs.writeFileSync(path.join(meta, 'PAPER-CONTEXT.md'), [
    '# Paper Context',
    '',
    'This context defines a term that should be used by the draft.',
    '',
    '## Language',
    '',
    '**Governed object**: The thing the control applies to.',
    '_Avoid_: vague control target',
    '',
    '## Relationships',
    '',
    '- **Governed object** anchors the control record.',
    '',
    '## Example Dialogue',
    '',
    '> **Author:** "What is governed?"',
    '>',
    '> **Reader:** "The governed object."',
    '',
    '## Flagged Ambiguities',
    '',
    '- "Object" was vague.',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(meta, 'DRAFT.md'), '# Draft\n\nThis draft never names the key term.\n');

  const issues = validatePaperArtifacts(paperDir, {
    'PAPER-CONTEXT.md': true,
    'DRAFT.md': true,
  });

  assert(issues.some((item) => item.issue.includes('PAPER-CONTEXT.md: Canonical term "Governed object" does not appear in DRAFT.md')));
}

function testJsonSchemaAdditionalPropertiesAndPatternAreEnforced() {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['command'],
    properties: {
      command: {
        type: 'string',
        pattern: '^/gpd-[a-z-]+$',
      },
    },
  };

  const errors = validateJsonSchemaValue({
    command: 'draft',
    extra: true,
  }, schema);

  assert(errors.includes('$.command must match pattern ^/gpd-[a-z-]+$'));
  assert(errors.includes('$.extra is not allowed'));
}

function testUnsupportedSchemaKeywordFailsSchemaDefinition() {
  const errors = validateSchemaDefinition({
    type: 'object',
    oneOf: [],
  });

  assert(errors.includes('$ uses unsupported JSON Schema keyword "oneOf"'));
}

function testUnknownArtifactFailsCli() {
  const result = runFail(['validate-artifact', '--path', path.join(repoRoot, 'README.md')]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('README.md: No artifact contract found'));
}

function testPaperValidationIncludesArtifactContracts() {
  const dir = tempDir('gpd-paper-contract-test');
  run(['init', '--location', dir, '--slug', 'contract-paper']);
  const paperDir = path.join(dir, 'contract-paper');
  fs.writeFileSync(path.join(paperDir, '.paper', 'config.json'), JSON.stringify({
    mode: 'standard',
    classification: {
      purpose: 'explainer',
      channel: 'internal',
      risk: 'internal_low',
      complexity: 'standard',
      audience_shape: 'single',
    },
    paper_type: 'explainer',
    default_length: {
      newsletter: '800-1200 words',
      blog: '1200-1800 words',
      memo: '600-1000 words',
      update: '150-300 words',
      position_paper: '1800-3000 words',
      white_paper: '3000-6000 words',
    },
    citation_style: 'inline_links',
    research: {
      web_allowed: true,
      require_source_table: 'yes',
      flag_unsupported_claims: true,
    },
    review: {
      audience_fit: true,
      opposition_review: true,
      fact_check: true,
      persona_consistency: true,
    },
  }, null, 2));

  const result = runFail(['validate', '--paper', paperDir]);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('config.json: $.research.require_source_table expected boolean, got string'));
}

function testConfigClassificationEnumFailureIsActionable() {
  const errors = validateJsonSchemaValue({
    mode: 'standard',
    classification: {
      purpose: 'white_paper',
      channel: 'public',
      risk: 'high',
      complexity: 'medium',
      audience_shape: 'everyone',
    },
    paper_type: 'white_paper',
    default_length: {
      newsletter: '800-1200 words',
      blog: '1200-1800 words',
      memo: '600-1000 words',
      update: '150-300 words',
      position_paper: '1800-3000 words',
      white_paper: '3000-6000 words',
    },
    citation_style: 'inline_links',
    research: {
      web_allowed: true,
      require_source_table: true,
      flag_unsupported_claims: true,
    },
    review: {
      audience_fit: true,
      opposition_review: true,
      fact_check: true,
      persona_consistency: true,
    },
  }, loadSchema('config.schema.json'));

  assert(errors.includes('$.classification.purpose must be one of decision_memo, strategy_paper, explainer, update'));
  assert(errors.includes('$.classification.channel must be one of internal, external, mixed'));
  assert(errors.includes('$.classification.risk must be one of internal_low, internal_high, external_low, external_high, regulated'));
  assert(errors.includes('$.classification.complexity must be one of light, standard, deep'));
  assert(errors.includes('$.classification.audience_shape must be one of single, prioritized_multi, hybrid'));
}

testTemplateArtifactsPassContracts();
testJsonSchemaFailureIsActionable();
testStateEnumFailureIsActionable();
testResearchEnumFailureIsActionable();
testResearchPlanSourceTypeFailureIsActionable();
testResearchSourceRegistryFailureIsActionable();
testResearchSynthesisMatrixFailureIsActionable();
testMarkdownContractFailureIsActionable();
testMarkdownContractRejectsUnexpectedAudienceDimension();
testMarkdownContractRejectsMalformedHeading();
testReaderFeedbackContractRejectsMissingSignal();
testExternalReviewsContractRequiresConsensusSections();
testFactCheckContractRequiresSafeClaimSections();
testStrategyValueFailureIsActionable();
testPaperContextRejectsPlaceholderContent();
testDecisionsRejectPlaceholderContent();
testPaperContextTermsMustAppearInDraftWhenDraftExists();
testJsonSchemaAdditionalPropertiesAndPatternAreEnforced();
testUnsupportedSchemaKeywordFailsSchemaDefinition();
testUnknownArtifactFailsCli();
testPaperValidationIncludesArtifactContracts();
testConfigClassificationEnumFailureIsActionable();

console.log('artifact contract tests passed');
