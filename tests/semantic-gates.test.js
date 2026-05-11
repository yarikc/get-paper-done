'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { validateSemanticPaper } = require('../bin/lib/semantic');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');

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

function artifactPath(paperDir, name) {
  return path.join(paperDir, '.paper', name);
}

function writeArtifact(paperDir, name, content) {
  const fullPath = artifactPath(paperDir, name);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function writeJsonArtifact(paperDir, name, data) {
  writeArtifact(paperDir, name, `${JSON.stringify(data, null, 2)}\n`);
}

function readState(paperDir) {
  return JSON.parse(fs.readFileSync(artifactPath(paperDir, 'STATE.json'), 'utf8'));
}

function writeState(paperDir, state) {
  writeJsonArtifact(paperDir, 'STATE.json', state);
}

function makePaper(slug = 'semantic') {
  const dir = tempDir(`gpd-${slug}`);
  run(['init', '--location', dir, '--slug', slug, '--title', slug]);
  const paperDir = path.join(dir, slug);
  const state = readState(paperDir);
  state.status = 'Ready';
  state.current_stage = 'Research';
  state.last_completed_stage = 'Research';
  state.suggested_next_command = '/gpd-outline --deep';
  state.blocked_by = [];
  state.strategy.status = 'Go';
  state.strategy.blocking_issues = [];
  state.strategy.primary_blocker = 'none';
  state.strategy.block_severity = 'None';
  state.strategy.required_unblock_action = 'none';
  writeState(paperDir, state);
  writeArtifact(paperDir, 'STATE.md', [
    '# State',
    '',
    '- **Status:** Ready',
    '- **Current stage:** Research',
    '- **Last completed stage:** Research',
    '- **Suggested next command:** `/gpd-outline --deep`',
    '- **Blocked by:** None',
    '',
  ].join('\n'));
  return paperDir;
}

function baseResearch(overrides = {}) {
  return {
    metadata: {
      topic: 'Semantic gates',
      scope: 'Test',
      depth: 'standard',
      source_mode: 'web_first',
      created_at: '2026-05-11T00:00:00.000Z',
      updated_at: '2026-05-11T00:00:00.000Z',
    },
    research_plan: {
      inferred_research_questions: [
        {
          id: 'RQ1',
          question: 'Question',
          mapped_claims: ['C1'],
          why_it_matters: 'Reason',
          planned_source_types: ['official', 'academic'],
          search_queries: ['query'],
        },
      ],
      depth_rationale: 'Rationale',
      source_mode_rationale: 'Rationale',
      user_feedback: 'None',
    },
    research_brief: {
      executive_summary: 'Summary',
      key_findings: [],
    },
    source_registry: [
      {
        id: 'S1',
        title: 'Official source',
        url_or_path: 'https://example.com/source',
        source_type: 'official',
        authority: 'high',
        freshness: 'recent',
        relevance: 'high',
        specificity: 'high',
        bias_or_agenda: 'None',
        stance: 'supportive',
        notes: 'Notes',
      },
      {
        id: 'S2',
        title: 'Academic source',
        url_or_path: 'https://example.com/academic',
        source_type: 'academic',
        authority: 'high',
        freshness: 'recent',
        relevance: 'high',
        specificity: 'high',
        bias_or_agenda: 'None',
        stance: 'critical',
        notes: 'Notes',
      },
    ],
    evidence_matrix: [
      {
        claim_id: 'C1',
        claim: 'Claim',
        claim_type: 'strategic_judgment',
        research_questions: ['RQ1'],
        supporting_sources: ['S1'],
        contradicting_sources: ['S2'],
        strength_of_support: 'moderate',
        confidence: 'medium',
        recommended_handling: 'keep',
        notes: 'Notes',
      },
    ],
    synthesis_matrix: {
      themes: [],
      rows: [],
    },
    contradictions: [],
    open_questions: [],
    draft_support_notes: [],
    facts_safe_to_use: [],
    claims_to_soften: [],
    claims_to_drop_or_reframe: [],
    ...overrides,
  };
}

function writeBrief(paperDir, evidenceValue) {
  writeArtifact(paperDir, 'BRIEF.md', [
    '# Brief',
    '',
    '### Claim 1: Test claim',
    '',
    '- **What evidence supports it:** ' + evidenceValue,
    '',
  ].join('\n'));
}

function writeOutline(paperDir) {
  writeArtifact(paperDir, 'OUTLINE.md', [
    '# Outline',
    '',
    '## Mode',
    '',
    '- **Depth:** Lite',
    '',
    '## Structure Verdict',
    '',
    'Usable.',
    '',
    '## Reader Journey',
    '',
    '- In: Question',
    '- Out: Answer',
    '',
    '## Section Architecture',
    '',
    '| Section | Objective | Reader State In | Reader State Out | Main Claim | Evidence Hooks | Evidence Strength | Reader Questions | Objection Handled | Approx Length | Transition To Next | Keep/Cut |',
    '|---------|-----------|-----------------|------------------|------------|----------------|-------------------|------------------|-------------------|---------------|--------------------|----------|',
    '| 1. Opening | Explain | Question | Answer | Claim | S1 | Moderate | Why? | None | 200 | End | Keep |',
    '',
    '## Objection Map',
    '',
    '| Objection | Where Addressed | Handling |',
    '|-----------|-----------------|----------|',
    '| None | Section 1 | None |',
    '',
    '## Drafting Risks',
    '',
    '- None',
    '',
  ].join('\n'));
}

function writeReview(paperDir, score = 4, instruction = '-') {
  writeOutline(paperDir);
  writeArtifact(paperDir, 'DRAFT.md', '# Draft\n\n## Draft Body\n\nBody.\n');
  writeArtifact(paperDir, 'REVIEW.md', [
    '# Review',
    '',
    '## Verdict',
    '',
    'Ready',
    '',
    '## Scores',
    '',
    '| Dimension | Score | Notes |',
    '|-----------|-------|-------|',
    '| Thesis clarity | 4 | Good |',
    '',
    '## Required Fixes',
    '',
    '- None',
    '',
    '## Audience Review Scorecard',
    '',
    '| Dimension | Score | Why | Actionable Rewrite Instruction If 3 Or Below |',
    '|-----------|-------|-----|----------------------------------------------|',
    `| Evidence sufficiency | ${score} | Why | ${instruction} |`,
    '| Thesis clarity | 4 | Why | - |',
    '| Audience relevance | 4 | Why | - |',
    '| Objection handling | 4 | Why | - |',
    '| Jargon appropriateness | 4 | Why | - |',
    '| Decision usefulness | 4 | Why | - |',
    '| Structural flow | 4 | Why | - |',
    '',
    '## Unsupported Or Risky Claims',
    '',
    '| Claim | Issue | Recommended Fix |',
    '|-------|-------|-----------------|',
    '| None | None | None |',
    '',
    '## Revision Plan',
    '',
    '1. None',
    '',
    '## Done Checklist',
    '',
    '- [x] Done',
    '',
  ].join('\n'));
}

function semanticJson(paperDir) {
  return JSON.parse(run(['validate', '--paper', paperDir, '--semantic', '--json']));
}

function testReasoningSpineRestatementWarns() {
  const paperDir = makePaper('semantic-spine');
  writeArtifact(paperDir, 'STRATEGY.md', [
    '# Strategy Review',
    '',
    '## Strategic Readiness',
    '',
    '**Status:** Go',
    '',
    '## Strategy Blockers',
    '',
    '- **Blocking issues:** none',
    '- **Primary blocker:** none',
    '- **Block severity:** None',
    '- **Required unblock action:** none',
    '',
    '## Thesis Package',
    '',
    '- **Recommended thesis:** Enterprise AI scaling requires trusted data, domain ownership, and shared controls.',
    '',
    '### Thesis Tests',
    '',
    '| Test | Pass? | Notes |',
    '|------|-------|-------|',
    '| Debatable | Yes | Notes |',
    '',
    '### Reasoning Spine',
    '',
    '1. AI scaling requires trusted data.',
    '2. Domain ownership creates meaning.',
    '3. Shared controls reduce fragmentation.',
    '',
    '## Strategic Gaps',
    '',
    '| ID | Type | Description | Why It Matters | Fix Instruction |',
    '|----|------|-------------|----------------|-----------------|',
    '| none | none | none | none | none |',
    '',
    '## Recommended Shape',
    '',
    'Shape.',
    '',
    '## Block / Override',
    '',
    'None.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => item.severity === 'MEDIUM' && item.issue.includes('Reasoning Spine item')));
}

function testGenericAudienceConflictWarns() {
  const paperDir = makePaper('semantic-conflict');
  writeReview(paperDir, 4, '-');
  const reviewPath = artifactPath(paperDir, 'REVIEW.md');
  fs.appendFileSync(reviewPath, [
    '',
    '## Audience Conflict Table',
    '',
    '| Tension | Audiences In Conflict | Priority Rule | Recommended Handling |',
    '|---------|-----------------------|---------------|----------------------|',
    '| Executive ask versus technical proof | CxO and architect | Decision usefulness wins | Keep concise |',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => item.severity === 'MEDIUM' && item.issue.includes('Audience Conflict Table row')));
}

function testFactCheckSafeSourceAlignmentWarns() {
  const paperDir = makePaper('semantic-fact-alignment');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch({
    evidence_matrix: [
      {
        claim_id: 'C1',
        claim: 'Domain ownership improves data product meaning.',
        claim_type: 'technical_mechanism',
        research_questions: ['RQ1'],
        supporting_sources: ['S1'],
        contradicting_sources: ['S2'],
        strength_of_support: 'moderate',
        confidence: 'medium',
        recommended_handling: 'keep',
        notes: 'Notes',
      },
    ],
  }));
  writeArtifact(paperDir, 'FACT-CHECK.md', [
    '# Fact And Claims Check',
    '',
    '## Claim Inventory',
    '',
    '| Claim ID | Claim | Type | Location | Risk | Check Status |',
    '|----------|-------|------|----------|------|--------------|',
    '| FC4 | Data-product programs should measure reuse and friction reduction, not product count. | recommendation | Section 4 | LOW | checked |',
    '',
    '## Claims Safe To Keep',
    '',
    '| Claim ID | Claim | Why Safe | Source(s) |',
    '|----------|-------|----------|-----------|',
    '| FC4 | Data-product programs should measure reuse and friction reduction, not product count. | Good advice. | S1 |',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => item.severity === 'MEDIUM' && item.issue.includes('Safe-to-keep claim "FC4"')));
}

function testFactCheckSafeSourceAlignmentNormalizesTypeLabels() {
  const paperDir = makePaper('semantic-fact-type-label');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch({
    evidence_matrix: [
      {
        claim_id: 'C1',
        claim: 'Market demand for governed AI data products is increasing.',
        claim_type: 'market_trend',
        research_questions: ['RQ1'],
        supporting_sources: ['S2'],
        contradicting_sources: [],
        strength_of_support: 'weak',
        confidence: 'low',
        recommended_handling: 'caveat',
        notes: 'Notes',
      },
    ],
  }));
  writeArtifact(paperDir, 'FACT-CHECK.md', [
    '# Fact And Claims Check',
    '',
    '## Claim Inventory',
    '',
    '| Claim ID | Claim | Type | Location | Risk | Check Status |',
    '|----------|-------|------|----------|------|--------------|',
    '| FC9 | Market demand for governed AI data products is increasing. | market/trend | Section 2 | MEDIUM | checked |',
    '',
    '## Claims Safe To Keep',
    '',
    '| Claim ID | Claim | Why Safe | Source(s) |',
    '|----------|-------|----------|-----------|',
    '| FC9 | Market demand for governed AI data products is increasing. | Broadly supported. | S1 |',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('cites sources that are not supporting_sources')
  )));
}

function testFactCheckSafeSourceAlignmentWarnsOnMissingSources() {
  const paperDir = makePaper('semantic-fact-missing-sources');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch());
  writeArtifact(paperDir, 'FACT-CHECK.md', [
    '# Fact And Claims Check',
    '',
    '## Claim Inventory',
    '',
    '| Claim ID | Claim | Type | Location | Risk | Check Status |',
    '|----------|-------|------|----------|------|--------------|',
    '| FC5 | Start with high-value AI use cases rather than a taxonomy rollout. | recommendation | Section 6 | LOW | checked |',
    '',
    '## Claims Safe To Keep',
    '',
    '| Claim ID | Claim | Why Safe | Source(s) |',
    '|----------|-------|----------|-----------|',
    '| FC5 | Start with high-value AI use cases rather than a taxonomy rollout. | Good advice. | - |',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('Safe-to-keep claim "FC5" has no source IDs')
  )));
}

function testGenericRecommendationSpecificityWarns() {
  const paperDir = makePaper('semantic-recommendation-specificity');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Recommendation',
    '',
    'The immediate next move is to choose a small set of high-value AI use cases and build the data products those use cases actually need.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('recommendation names use cases generically')
  )));
}

function testNumberedRecommendationSpecificityWarns() {
  const paperDir = makePaper('semantic-numbered-recommendation-specificity');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Section 5 - Recommendation',
    '',
    'The immediate next move is to choose a small set of high-value AI use cases and build the data products those use cases actually need.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('recommendation names use cases generically')
  )));
}

function testConcreteRecommendationSpecificityPasses() {
  const paperDir = makePaper('semantic-recommendation-specificity-pass');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Recommendation',
    '',
    'The immediate next move is to choose a small set of high-value AI use cases and build the data products those use cases actually need. Candidate use cases should be named before funding approval, such as customer-support intent classification, fraud alert enrichment, regulatory reporting copilots, or claims triage.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(!issues.some((item) => item.issue.includes('recommendation names use cases generically')));
}

function testProseSaturationWarns() {
  const paperDir = makePaper('semantic-prose-saturation');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Opening',
    '',
    'Teams must resolve identity, access, ownership, lineage, quality, policy, metadata, support, and change, and they must do it before the model can be trusted.',
    '',
    'The visible investment goes into model platforms, orchestration frameworks, vector stores, evaluation tooling, application teams, operating dashboards, and delivery squads, and each use case still has to answer what source is authoritative.',
    '',
    'The resulting program names owners, contracts, metrics, controls, support paths, escalation rules, publication checks, and review cadences, and it does so before leaders can trust the label.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('contains repeated list-heavy paragraphs')
  )));
}

function testDistributedProseSaturationWarns() {
  const paperDir = makePaper('semantic-distributed-prose-saturation');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Body',
    '',
    'The first section explains the main decision in plain language. It keeps the mechanism visible without turning the opening into a catalog.',
    '',
    'Teams repeatedly find, understand, access, trust, and govern the same data while also debating ownership, quality, lineage, access, controls, and policy expectations.',
    '',
    'The second section gives the reader one concrete example. It does not need a long inventory to make the point.',
    '',
    'The visible investment goes into model platforms, orchestration frameworks, vector stores, evaluation tooling, and application teams, but each use case still has to answer what source is authoritative, who owns meaning, what quality can be trusted, what access is allowed, and what controls apply.',
    '',
    'The third section narrows the scope. It describes the operating decision and leaves supporting detail to the evidence table.',
    '',
    'The resulting program asks what owners exist, what contracts apply, what metrics matter, what controls run, and what support path exists before leaders can trust it as more than another platform label.',
    '',
    'The fourth section moves from diagnosis to recommendation. It uses short sentences to avoid repeating the same cadence.',
    '',
    'A launch plan often names discovery, access, lineage, quality monitoring, metadata, policy enforcement, publication workflow, funding rules, and staffing models, and then forgets the actual use case.',
    '',
    'The closing paragraph returns to the decision. It names the proof point and avoids another parallel list.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('contains repeated list-heavy paragraphs')
  )));
}

function testStructuredListsDoNotCountAsSaturatedProse() {
  const paperDir = makePaper('semantic-structured-list-saturation-pass');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Body',
    '',
    'The section introduces a checklist and then returns to normal prose.',
    '',
    '1. The product needs identity, access, ownership, lineage, quality, policy, metadata, support, and change, and the team should validate it before launch.',
    '',
    '2. The platform includes discovery, access, lineage, quality monitoring, metadata, policy enforcement, publication workflow, funding rules, and staffing, and then names a use case.',
    '',
    '* The operating model defines owners, contracts, metrics, controls, support paths, escalation rules, publication checks, and review cadences, and it does so before launch.',
    '',
    '- The rollout names fraud, support, claims, regulatory reporting, onboarding, and retention, and it still has to prove actual consumption.',
    '',
    '> A quoted review note can contain discovery, access, lineage, quality monitoring, metadata, policy enforcement, and publication workflow without being draft prose.',
    '',
    '```',
    'discovery, access, lineage, quality monitoring, metadata, policy enforcement, publication workflow',
    '```',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(!issues.some((item) => item.issue.includes('contains repeated list-heavy paragraphs')));
}

function testSparseEnumerationDoesNotWarn() {
  const paperDir = makePaper('semantic-sparse-enumeration-pass');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Body',
    '',
    'The platform needs identity, access, lineage, quality monitoring, metadata, policy enforcement, and publication workflow. This paragraph is a necessary inventory rather than a repeated prose pattern.',
    '',
    'The rest of the section explains why the decision matters. It uses direct causal prose and does not repeat the same list structure.',
    '',
    'A later paragraph names owners, contracts, metrics, controls, support paths, escalation rules, publication checks, and review cadences, but it is not dense enough across the artifact to deserve a warning.',
    '',
    'The closing paragraph returns to the decision. It names the next action and does not rely on another enumeration.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(!issues.some((item) => item.issue.includes('contains repeated list-heavy paragraphs')));
}

function testStandaloneSourceSensitiveDraftWarns() {
  const paperDir = makePaper('semantic-standalone-source-sensitive');
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Body',
    '',
    'Regulatory expectations require operational resilience evidence. Security readiness and vulnerability exposure should be assessed from production live signals before leaders accept the operating model.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('source-sensitive imported draft has no RESEARCH.json')
  )));
}

function testStandaloneSourceSensitiveDraftPassesWithResearch() {
  const paperDir = makePaper('semantic-standalone-source-sensitive-pass');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch());
  writeArtifact(paperDir, 'DRAFT.md', [
    '# Draft',
    '',
    '## Body',
    '',
    'Regulatory expectations require operational resilience evidence. Security readiness and vulnerability exposure should be assessed from production live signals before leaders accept the operating model.',
    '',
  ].join('\n'));

  const issues = validateSemanticPaper(paperDir);
  assert(!issues.some((item) => item.issue.includes('source-sensitive imported draft has no RESEARCH.json')));
}

function testMixedAudienceDraftWarnsWithoutReview() {
  const paperDir = makePaper('semantic-mixed-audience-review');
  writeArtifact(paperDir, 'AUDIENCE.md', [
    '# Audience',
    '',
    '## Primary Audience',
    '',
    'Senior decision sponsor.',
    '',
    '## Secondary Audience',
    '',
    'Peer architecture collaborators.',
    '',
    '## Audience Tension',
    '',
    'The senior sponsor needs a concise decision frame. Peer collaborators need operating detail.',
    '',
  ].join('\n'));
  writeArtifact(paperDir, 'DRAFT.md', '# Draft\n\n## Body\n\nThe decision needs support.\n');

  const issues = validateSemanticPaper(paperDir);
  assert(issues.some((item) => (
    item.severity === 'MEDIUM'
    && item.issue.includes('mixed-audience draft has no REVIEW.md')
  )));
}

function testMixedAudienceDraftPassesWithReview() {
  const paperDir = makePaper('semantic-mixed-audience-review-pass');
  writeArtifact(paperDir, 'AUDIENCE.md', [
    '# Audience',
    '',
    '## Primary Audience',
    '',
    'Senior decision sponsor.',
    '',
    '## Secondary Audience',
    '',
    'Peer architecture collaborators.',
    '',
    '## Audience Tension',
    '',
    'The senior sponsor needs a concise decision frame. Peer collaborators need operating detail.',
    '',
  ].join('\n'));
  writeReview(paperDir, 4, 'No required rewrite.');

  const issues = validateSemanticPaper(paperDir);
  assert(!issues.some((item) => item.issue.includes('mixed-audience draft has no REVIEW.md')));
}

function testSingleAudienceDraftDoesNotRequireReview() {
  const paperDir = makePaper('semantic-single-audience-no-review');
  writeArtifact(paperDir, 'AUDIENCE.md', [
    '# Audience',
    '',
    '## Primary Audience',
    '',
    'Senior decision sponsor.',
    '',
  ].join('\n'));
  writeArtifact(paperDir, 'DRAFT.md', '# Draft\n\n## Body\n\nThe decision needs support.\n');

  const issues = validateSemanticPaper(paperDir);
  assert(!issues.some((item) => item.issue.includes('mixed-audience draft has no REVIEW.md')));
}

function testPlaceholderAudienceTemplateDoesNotRequireReview() {
  const paperDir = makePaper('semantic-placeholder-audience-no-review');
  writeArtifact(paperDir, 'DRAFT.md', '# Draft\n\n## Body\n\nThe decision needs support.\n');

  const issues = validateSemanticPaper(paperDir);
  assert(!issues.some((item) => item.issue.includes('mixed-audience draft has no REVIEW.md')));
}

function testBriefEvidencePlaceholdersFailAfterResearch() {
  const paperDir = makePaper('semantic-brief-stale');
  writeBrief(paperDir, 'Needs research across official sources.');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch());

  const result = runFail(['validate', '--paper', paperDir, '--semantic']);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('BRIEF.md'));
  assert(result.stdout.includes('must cite source IDs'));
}

function testBriefEvidenceSourceIdsPass() {
  const paperDir = makePaper('semantic-brief-pass');
  writeBrief(paperDir, 'Supported by S1 and S2.');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch());

  const result = semanticJson(paperDir);
  assert.strictEqual(result.ok, true);
}

function testSourceCoverageWarnsWithoutFailing() {
  const paperDir = makePaper('semantic-source-coverage');
  writeBrief(paperDir, 'Supported by S1.');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch({
    source_registry: [
      {
        id: 'S1',
        title: 'Official source',
        url_or_path: 'https://example.com/source',
        source_type: 'official',
        authority: 'high',
        freshness: 'recent',
        relevance: 'high',
        specificity: 'high',
        bias_or_agenda: 'None',
        stance: 'supportive',
        notes: 'Notes',
      },
    ],
  }));

  const result = semanticJson(paperDir);
  assert.strictEqual(result.ok, true);
  assert(result.issues.some((item) => item.severity === 'MEDIUM' && item.issue.includes('planned source types missing')));
}

function testCounterevidenceWarnsWithoutFailing() {
  const paperDir = makePaper('semantic-counterevidence');
  writeBrief(paperDir, 'Supported by S1 and S2.');
  writeJsonArtifact(paperDir, 'RESEARCH.json', baseResearch({
    evidence_matrix: [
      {
        claim_id: 'C1',
        claim: 'Claim',
        claim_type: 'strategic_judgment',
        research_questions: ['RQ1'],
        supporting_sources: ['S1'],
        contradicting_sources: [],
        strength_of_support: 'moderate',
        confidence: 'medium',
        recommended_handling: 'keep',
        notes: 'Notes',
      },
    ],
  }));

  const result = semanticJson(paperDir);
  assert.strictEqual(result.ok, true);
  assert(result.issues.some((item) => item.severity === 'MEDIUM' && item.issue.includes('no contradicting_sources')));
}

function testExportMetadataLeakFails() {
  const paperDir = makePaper('semantic-export-leak');
  writeArtifact(paperDir, 'exports/FINAL.md', '# Final\n\n## Draft Notes\n\nInternal.\n');

  const result = runFail(['validate', '--paper', paperDir, '--semantic']);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('exports/FINAL.md'));
  assert(result.stdout.includes('internal metadata'));
}

function testStateMarkdownJsonDriftFails() {
  const paperDir = makePaper('semantic-state-drift');
  writeArtifact(paperDir, 'STATE.md', [
    '# State',
    '',
    '- **Status:** Old',
    '- **Suggested next command:** `/gpd-draft`',
    '',
  ].join('\n'));

  const result = runFail(['validate', '--paper', paperDir, '--semantic']);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('STATE.md'));
  assert(result.stdout.includes('does not match STATE.json'));
}

function testWeakReviewInstructionFails() {
  const paperDir = makePaper('semantic-review-instruction');
  writeReview(paperDir, 3, 'Keep as internal strategy or add later if publishing.');

  const result = runFail(['validate', '--paper', paperDir, '--semantic']);
  assert.strictEqual(result.status, 1);
  assert(result.stdout.includes('REVIEW.md'));
  assert(result.stdout.includes('lacks a concrete rewrite instruction'));
}

function testConcreteReviewInstructionPasses() {
  const paperDir = makePaper('semantic-review-pass');
  writeReview(paperDir, 3, 'Rewrite Section 1 to cite S1 and add one sentence explaining why the evidence is sufficient.');

  const result = semanticJson(paperDir);
  assert.strictEqual(result.ok, true);
}

testBriefEvidencePlaceholdersFailAfterResearch();
testBriefEvidenceSourceIdsPass();
testSourceCoverageWarnsWithoutFailing();
testCounterevidenceWarnsWithoutFailing();
testExportMetadataLeakFails();
testStateMarkdownJsonDriftFails();
testWeakReviewInstructionFails();
testConcreteReviewInstructionPasses();
testReasoningSpineRestatementWarns();
testGenericAudienceConflictWarns();
testFactCheckSafeSourceAlignmentWarns();
testFactCheckSafeSourceAlignmentNormalizesTypeLabels();
testFactCheckSafeSourceAlignmentWarnsOnMissingSources();
testGenericRecommendationSpecificityWarns();
testNumberedRecommendationSpecificityWarns();
testConcreteRecommendationSpecificityPasses();
testProseSaturationWarns();
testDistributedProseSaturationWarns();
testStructuredListsDoNotCountAsSaturatedProse();
testSparseEnumerationDoesNotWarn();
testStandaloneSourceSensitiveDraftWarns();
testStandaloneSourceSensitiveDraftPassesWithResearch();
testMixedAudienceDraftWarnsWithoutReview();
testMixedAudienceDraftPassesWithReview();
testSingleAudienceDraftDoesNotRequireReview();
testPlaceholderAudienceTemplateDoesNotRequireReview();

console.log('semantic gate tests passed');
