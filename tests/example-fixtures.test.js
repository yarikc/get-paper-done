'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const gpd = path.join(repoRoot, 'bin', 'gpd.js');
const examplesRoot = path.join(repoRoot, 'examples');
const dataProductsExampleDir = path.join(examplesRoot, 'data-products-ai-scaling');
const technologyLifecycleExampleDir = path.join(examplesRoot, 'technology-lifecycle-management');
const responsibleAiExampleDir = path.join(examplesRoot, 'responsible-ai-controls');
const quantitativeExampleDir = path.join(examplesRoot, 'platform-review-cycle-metrics');
const publicSourceExampleDir = path.join(examplesRoot, 'public-ai-control-baseline');
const supplyChainExampleDir = path.join(examplesRoot, 'software-supply-chain-evidence-pack');

function run(args, options = {}) {
  return execFileSync(process.execPath, [gpd, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function normalizeWorkflowMtimes(paperDir) {
  const base = new Date('2026-05-11T12:00:00.000Z').getTime();
  const orderedArtifacts = [
    'PROJECT.md',
    'PERSONA.md',
    'AUDIENCE.md',
    'BRIEF.md',
    'STRATEGY.md',
    'RESEARCH.json',
    'OUTLINE.md',
    'DRAFT.md',
    'FACT-CHECK.md',
    'REVIEW.md',
    'exports/FINAL.md',
    'STATE.json',
    'STATE.md',
  ];

  orderedArtifacts.forEach((artifact, index) => {
    const artifactPath = path.join(paperDir, '.paper', artifact);
    if (!fs.existsSync(artifactPath)) return;
    const time = new Date(base + index * 1000);
    fs.utimesSync(artifactPath, time, time);
  });
}

function examplePaperDirs() {
  return fs.readdirSync(examplesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(examplesRoot, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, '.paper')));
}

function assertClassification(config, expected) {
  assert.deepStrictEqual(config.classification, expected);
}

function testExamplesValidateCleanly() {
  for (const exampleDir of examplePaperDirs()) {
    const validation = JSON.parse(run(['validate', '--paper', exampleDir, '--semantic', '--json']));
    assert.strictEqual(validation.ok, true, `${exampleDir} should validate`);
    assert.deepStrictEqual(validation.issues, [], `${exampleDir} should not have semantic warnings`);
  }
}

function testExamplesRouteToProgressAfterNormalizedCheckout() {
  for (const exampleDir of examplePaperDirs()) {
    const dir = tempDir('gpd-example-fixture');
    const copiedExample = path.join(dir, path.basename(exampleDir));
    fs.cpSync(exampleDir, copiedExample, { recursive: true });
    normalizeWorkflowMtimes(copiedExample);

    const status = JSON.parse(run(['status', '--paper', copiedExample, '--json']));
    assert.strictEqual(status.next, '/gpd-progress', `${exampleDir} should route to progress`);
  }
}

function testDataProductsExampleHasNoTrialOnlyArtifacts() {
  assert(!fs.existsSync(path.join(dataProductsExampleDir, '.paper', 'FRICTION-LOG.md')));

  const config = JSON.parse(fs.readFileSync(path.join(dataProductsExampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'standard');
  assertClassification(config, {
    purpose: 'strategy_paper',
    channel: 'internal',
    risk: 'internal_high',
    complexity: 'deep',
    audience_shape: 'prioritized_multi',
  });

  const final = fs.readFileSync(path.join(dataProductsExampleDir, '.paper', 'exports', 'FINAL.md'), 'utf8');
  for (const forbidden of [
    '## Internal',
    '## Draft',
    '## Section Intent',
    '**Drafting mode:**',
    '[NEEDS EVIDENCE:',
    '[AUTHOR DECISION:',
    '[STRUCTURE ISSUE:',
  ]) {
    assert(!final.includes(forbidden), forbidden);
  }

  const projectFiles = [
    'PROJECT.md',
    'BRIEF.md',
    'STRATEGY.md',
    'RESEARCH.md',
    'OUTLINE.md',
    'DRAFT.md',
    'FACT-CHECK.md',
  ].map((artifact) => fs.readFileSync(path.join(dataProductsExampleDir, '.paper', artifact), 'utf8')).join('\n');

  for (const forbidden of [
    'diagnostic trial',
    'Semantic validation refresh',
    'Stage 1 diagnostic',
    'gpd-paper-trials',
  ]) {
    assert(!projectFiles.includes(forbidden), forbidden);
  }
}

function testWeeklyPlatformUpdateKeepsLiteShape() {
  const exampleDir = path.join(examplesRoot, 'weekly-platform-update');
  assert(fs.existsSync(path.join(exampleDir, '.paper')));
  assert(!fs.existsSync(path.join(exampleDir, '.paper', 'RESEARCH.json')));
  assert(!fs.existsSync(path.join(exampleDir, '.paper', 'RESEARCH.md')));
  assert(!fs.existsSync(path.join(exampleDir, '.paper', 'FACT-CHECK.md')));

  const validation = JSON.parse(run(['validate', '--paper', exampleDir, '--semantic', '--json']));
  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);

  const config = JSON.parse(fs.readFileSync(path.join(exampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'lite');
  assertClassification(config, {
    purpose: 'update',
    channel: 'internal',
    risk: 'internal_low',
    complexity: 'light',
    audience_shape: 'single',
  });
  assert.strictEqual(config.research.require_source_table, false);
  assert.strictEqual(config.review.fact_check, false);
}

function testResponsibleAiControlsKeepsExternalEvidenceShape() {
  assert(fs.existsSync(path.join(responsibleAiExampleDir, '.paper', 'RESEARCH.json')));
  assert(fs.existsSync(path.join(responsibleAiExampleDir, '.paper', 'RESEARCH.md')));
  assert(fs.existsSync(path.join(responsibleAiExampleDir, '.paper', 'FACT-CHECK.md')));

  const validation = JSON.parse(run(['validate', '--paper', responsibleAiExampleDir, '--semantic', '--json']));
  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);

  const config = JSON.parse(fs.readFileSync(path.join(responsibleAiExampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'flagship');
  assertClassification(config, {
    purpose: 'explainer',
    channel: 'external',
    risk: 'external_high',
    complexity: 'deep',
    audience_shape: 'prioritized_multi',
  });
  assert.strictEqual(config.research.require_source_table, true);
  assert.strictEqual(config.review.fact_check, true);

  const research = JSON.parse(fs.readFileSync(path.join(responsibleAiExampleDir, '.paper', 'RESEARCH.json'), 'utf8'));
  const sourceTypes = new Set(research.source_registry.map((source) => source.source_type));
  for (const expectedType of ['official', 'academic', 'industry', 'analyst', 'news', 'user_provided']) {
    assert(sourceTypes.has(expectedType), `missing source type ${expectedType}`);
  }
  assert(research.evidence_matrix.some((row) => row.contradicting_sources.length > 0));
  assert(research.claims_to_soften.length > 0);

  const factCheck = fs.readFileSync(path.join(responsibleAiExampleDir, '.paper', 'FACT-CHECK.md'), 'utf8');
  assert(factCheck.includes('## Claims To Soften'));
  assert(factCheck.includes('/gpd-review'));
}

function testPlatformReviewCycleMetricsKeepsQuantitativeShape() {
  assert(fs.existsSync(path.join(quantitativeExampleDir, '.paper', 'RESEARCH.json')));
  assert(fs.existsSync(path.join(quantitativeExampleDir, '.paper', 'FACT-CHECK.md')));
  assert(fs.existsSync(path.join(quantitativeExampleDir, 'EXPECTED-FINDINGS.md')));

  const validation = JSON.parse(run(['validate', '--paper', quantitativeExampleDir, '--semantic', '--json']));
  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);

  const config = JSON.parse(fs.readFileSync(path.join(quantitativeExampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'standard');
  assertClassification(config, {
    purpose: 'decision_memo',
    channel: 'internal',
    risk: 'internal_high',
    complexity: 'standard',
    audience_shape: 'prioritized_multi',
  });
  assert.strictEqual(config.review.fact_check, true);

  const research = JSON.parse(fs.readFileSync(path.join(quantitativeExampleDir, '.paper', 'RESEARCH.json'), 'utf8'));
  const claimSupportSources = research.source_registry.filter((source) => Array.isArray(source.claim_support));
  assert.strictEqual(claimSupportSources.length, 4);
  assert(claimSupportSources.some((source) => (
    source.id === 'S4'
    && source.claim_support.some((entry) => entry.claim_id === 'C3' && entry.support === 'direct')
  )));
  const strongMetricRows = research.evidence_matrix.filter((row) => (
    row.claim_type === 'factual'
    && row.strength_of_support === 'strong'
    && row.recommended_handling === 'keep'
    && row.claim.includes('sampled review packets')
  ));
  assert(strongMetricRows.length >= 2);
  assert(research.claims_to_drop_or_reframe.some((item) => item.claim.includes('enterprise ROI')));

  const factCheck = fs.readFileSync(path.join(quantitativeExampleDir, '.paper', 'FACT-CHECK.md'), 'utf8');
  assert(factCheck.includes('## Quantitative Claims'));
  assert(factCheck.includes('10 days to 7 days'));
  assert(factCheck.includes('20 sampled review packets over one quarter'));
  assert(factCheck.includes('The pilot proves enterprise ROI'));

  const final = fs.readFileSync(path.join(quantitativeExampleDir, '.paper', 'exports', 'FINAL.md'), 'utf8');
  assert(final.includes('30% reduction across 20 sampled review packets (S1, S2)'));
  assert(final.includes('33% reduction across the same 20 sampled review packets over one quarter (S1, S3)'));
  assert(!final.includes('proves enterprise ROI'));

  const expectedFindings = fs.readFileSync(path.join(quantitativeExampleDir, 'EXPECTED-FINDINGS.md'), 'utf8');
  assert(expectedFindings.includes('semantic.fact_check_claim_support_unsafe'));
  assert(expectedFindings.includes('Sources that only show improvement signal must not be treated as proof'));
}

function testPublicAiControlBaselineKeepsLivePublicSourceShape() {
  assert(fs.existsSync(path.join(publicSourceExampleDir, '.paper')));
  assert(fs.existsSync(path.join(publicSourceExampleDir, '.paper', 'RESEARCH.json')));
  assert(fs.existsSync(path.join(publicSourceExampleDir, '.paper', 'FACT-CHECK.md')));
  assert(fs.existsSync(path.join(publicSourceExampleDir, '.paper', 'exports', 'FINAL.md')));

  const validation = JSON.parse(run(['validate', '--paper', publicSourceExampleDir, '--semantic', '--json']));
  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);

  const config = JSON.parse(fs.readFileSync(path.join(publicSourceExampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'standard');
  assertClassification(config, {
    purpose: 'decision_memo',
    channel: 'internal',
    risk: 'internal_high',
    complexity: 'standard',
    audience_shape: 'prioritized_multi',
  });
  assert.strictEqual(config.research.web_allowed, true);
  assert.strictEqual(config.research.require_source_table, true);
  assert.strictEqual(config.review.fact_check, true);

  const research = JSON.parse(fs.readFileSync(path.join(publicSourceExampleDir, '.paper', 'RESEARCH.json'), 'utf8'));
  assert.strictEqual(research.source_registry.length, 4);
  for (const source of research.source_registry) {
    assert.strictEqual(source.source_type, 'official');
    assert(source.url_or_path.startsWith('https://'), `${source.id} should use a public HTTPS URL`);
    assert(Array.isArray(source.claim_support), `${source.id} should include claim_support`);
    assert(source.claim_support.some((entry) => entry.support === 'direct'), `${source.id} should directly support a claim`);
    assert(source.notes.includes('Verified'), `${source.id} should record verification context`);
  }

  const urls = new Set(research.source_registry.map((source) => source.url_or_path));
  for (const expectedUrl of [
    'https://doi.org/10.6028/NIST.AI.100-1',
    'https://doi.org/10.6028/NIST.AI.600-1',
    'https://genai.owasp.org/llmrisk/llm01-prompt-injection/',
    'https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development',
  ]) {
    assert(urls.has(expectedUrl), `missing public source ${expectedUrl}`);
  }

  const factCheck = fs.readFileSync(path.join(publicSourceExampleDir, '.paper', 'FACT-CHECK.md'), 'utf8');
  for (const sourceId of ['S1', 'S2', 'S3', 'S4']) {
    assert(factCheck.includes(sourceId), `FACT-CHECK.md should include ${sourceId}`);
  }

  const final = fs.readFileSync(path.join(publicSourceExampleDir, '.paper', 'exports', 'FINAL.md'), 'utf8');
  assert(final.includes('https://doi.org/10.6028/NIST.AI.100-1'));
  assert(final.includes('https://doi.org/10.6028/NIST.AI.600-1'));
  assert(final.includes('https://genai.owasp.org/llmrisk/llm01-prompt-injection/'));
  assert(final.includes('https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development'));
  assert(!final.includes('guarantee'));
  assert(final.includes('These sources do not prove the internal baseline will reduce incidents'));
  assert(final.includes('## References And Standards Used'));
  assert(final.includes('not create a parallel approval process'));
  assert(final.includes('pilot_control_record_id'));
  assert(final.includes('not_started'));
  assert(final.includes('approved_with_exception'));
  assert(final.includes('repeatable gate'));
  assert(final.includes('standardizes and enforces'));
  assert(final.includes('Security or risk reviewer'));
  assert(final.includes('Review process owner'));
  assert(final.includes('Validates threat-model, testing, exception, and residual-risk attestations'));
}

function testSoftwareSupplyChainEvidencePackKeepsCalibrationShape() {
  assert(fs.existsSync(path.join(supplyChainExampleDir, 'EXPECTED-FINDINGS.md')));
  assert(fs.existsSync(path.join(supplyChainExampleDir, 'README.md')));
  assert(fs.existsSync(path.join(supplyChainExampleDir, '.paper')));
  assert(fs.existsSync(path.join(supplyChainExampleDir, '.paper', 'RESEARCH.json')));
  assert(fs.existsSync(path.join(supplyChainExampleDir, '.paper', 'FACT-CHECK.md')));
  assert(fs.existsSync(path.join(supplyChainExampleDir, '.paper', 'exports', 'FINAL.md')));

  const validation = JSON.parse(run(['validate', '--paper', supplyChainExampleDir, '--semantic', '--json']));
  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);

  const config = JSON.parse(fs.readFileSync(path.join(supplyChainExampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'standard');
  assertClassification(config, {
    purpose: 'decision_memo',
    channel: 'internal',
    risk: 'internal_high',
    complexity: 'standard',
    audience_shape: 'prioritized_multi',
  });
  assert.strictEqual(config.research.web_allowed, true);
  assert.strictEqual(config.research.require_source_table, true);
  assert.strictEqual(config.review.fact_check, true);

  const expectedFindings = fs.readFileSync(path.join(supplyChainExampleDir, 'EXPECTED-FINDINGS.md'), 'utf8');
  assert(expectedFindings.includes('Run one more realistic public-source paper calibration'));
  assert(expectedFindings.includes('Bureaucracy objection underhandled'));
  assert(expectedFindings.includes('Visual temptation'));

  const readme = fs.readFileSync(path.join(supplyChainExampleDir, 'README.md'), 'utf8');
  assert(readme.includes('public-source internal decision memo'));
  assert(readme.includes('backward routing'));
  assert(readme.includes('AI runtime evidence'));
  assert(readme.includes('Privacy Boundary'));

  const research = JSON.parse(fs.readFileSync(path.join(supplyChainExampleDir, '.paper', 'RESEARCH.json'), 'utf8'));
  assert.strictEqual(research.source_registry.length, 10);
  for (const source of research.source_registry) {
    assert(source.url_or_path.startsWith('https://'), `${source.id} should use a public HTTPS URL`);
    assert(Array.isArray(source.claim_support), `${source.id} should include claim_support`);
    assert(source.claim_support.some((entry) => entry.support === 'direct'), `${source.id} should directly support a claim`);
    assert(source.notes.includes('Verified'), `${source.id} should record verification context`);
  }

  const urls = new Set(research.source_registry.map((source) => source.url_or_path));
  for (const expectedUrl of [
    'https://www.cisa.gov/sbom',
    'https://www.cisa.gov/resources-tools/resources/2025-minimum-elements-software-bill-materials-sbom',
    'https://csrc.nist.gov/pubs/sp/800/218/final',
    'https://csrc.nist.gov/pubs/sp/800/161/r1/final',
    'https://slsa.dev/provenance',
    'https://openssf.org/scorecard/',
    'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10',
    'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence',
    'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
    'https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development',
  ]) {
    assert(urls.has(expectedUrl), `missing public source ${expectedUrl}`);
  }

  assert(research.claims_to_soften.some((item) => item.claim.includes('SBOMs prove pilot security')));
  assert(research.claims_to_soften.some((item) => item.claim.includes('AI runtime inventory proves')));
  assert(research.claims_to_drop_or_reframe.some((item) => item.claim.includes('guarantees regulatory readiness')));

  const factCheck = fs.readFileSync(path.join(supplyChainExampleDir, '.paper', 'FACT-CHECK.md'), 'utf8');
  for (const sourceId of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10']) {
    assert(factCheck.includes(sourceId), `FACT-CHECK.md should include ${sourceId}`);
  }
  assert(factCheck.includes('The control process standardizes existing production-approval questions rather than creating a separate approval forum'));
  assert(factCheck.includes('Public sources support the evidence categories, but the exact requirement is an internal policy recommendation'));
  assert(factCheck.includes('The supply-chain control record should refresh when dependencies, promoted artifacts, AI runtime inputs, deployment status, or material exceptions change'));
  assert(factCheck.includes('AI and LLM deployments add control points that may change behavior without a normal code release'));
  assert(factCheck.includes('Model/provider dependencies, prompt/configuration versions, retrieval data sources, and tool permissions should be visible in the control record'));
  assert(factCheck.includes('Human review should happen by exception rather than as a standing handoff for every build'));
  assert(factCheck.includes('Automated checks should create observed evidence where possible'));

  const review = fs.readFileSync(path.join(supplyChainExampleDir, '.paper', 'REVIEW.md'), 'utf8');
  assert(review.includes('new approval layer'));
  assert(review.includes('Audience Conflict Table'));
  assert(review.includes('separates observed evidence from owner attestation'));

  const final = fs.readFileSync(path.join(supplyChainExampleDir, '.paper', 'exports', 'FINAL.md'), 'utf8');
  assert(final.includes('Supply-Chain Control Process'));
  assert(final.includes('https://www.cisa.gov/sbom'));
  assert(final.includes('https://csrc.nist.gov/pubs/sp/800/218/final'));
  assert(final.includes('https://slsa.dev/provenance'));
  assert(final.includes('https://openssf.org/scorecard/'));
  assert(final.includes('https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10'));
  assert(final.includes('https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence'));
  assert(final.includes('https://owasp.org/www-project-top-10-for-large-language-model-applications/'));
  assert(final.includes('https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development'));
  assert(final.includes('supply-chain control record'));
  assert(final.includes('keeps evidence, attestation, validation results, exceptions, and approval decisions current'));
  assert(final.includes('High-risk means the deployment handles sensitive data'));
  assert(final.includes('Traditional dependency scanning helps with code and packages'));
  assert(final.includes('AI runtime inventory'));
  assert(final.includes('Behavior-shaping model, provider, prompt/configuration, retrieval source, and tool permission'));
  assert(final.includes('tool-permission change'));
  assert(final.includes('NIST AI RMF'));
  assert(final.includes('OWASP LLM Top 10'));
  assert(final.includes('do not prove the deployment is secure'));
  assert(final.includes('not an approval decision'));
  assert(final.includes('does not create a separate forum'));
  assert(final.includes('Create observed evidence for dependency inventory; artifact provenance; open-source health; and detectable AI runtime configuration where possible'));
  assert(final.includes('Validate exceptions, stale evidence, threshold breaches, and sampled records'));
  assert(final.includes('Evidence is complete, current, validated as needed, and within threshold'));
  assert(final.includes('Proceed with an explicit exception'));
  assert(final.includes('Hold deployment approval until corrected or accepted'));
  assert(final.includes('Sample validation'));
  assert(final.includes('unreviewed model or provider change'));
  assert(final.includes('unreviewed retrieval, prompt, or tool-permission change'));
  assert(final.includes('sampled validation failure'));
  assert(final.includes('decision owner accepts residual risk'));
  assert(!final.includes('//YC'));
  assert(!final.includes('[NEEDS EVIDENCE:'));
  assert(!final.includes('[AUTHOR DECISION:'));
}

function testTechnologyLifecycleManagementKeepsImportRecoveryShape() {
  assert(fs.existsSync(path.join(technologyLifecycleExampleDir, '.paper')));
  assert(!fs.existsSync(path.join(technologyLifecycleExampleDir, 'original')));
  assert(!fs.existsSync(path.join(technologyLifecycleExampleDir, '.paper', 'original')));

  const validation = JSON.parse(run(['validate', '--paper', technologyLifecycleExampleDir, '--semantic', '--json']));
  assert.strictEqual(validation.ok, true);
  assert.deepStrictEqual(validation.issues, []);

  const config = JSON.parse(fs.readFileSync(path.join(technologyLifecycleExampleDir, '.paper', 'config.json'), 'utf8'));
  assert.strictEqual(config.mode, 'standard');
  assertClassification(config, {
    purpose: 'strategy_paper',
    channel: 'internal',
    risk: 'internal_high',
    complexity: 'deep',
    audience_shape: 'hybrid',
  });
  assert.strictEqual(config.research.require_source_table, true);
  assert.strictEqual(config.review.opposition_review, true);
  assert.strictEqual(config.review.fact_check, true);

  const project = fs.readFileSync(path.join(technologyLifecycleExampleDir, '.paper', 'PROJECT.md'), 'utf8');
  assert(project.includes('anonymized internal strategy / decision memo'));
  assert(project.includes('private imported source draft is intentionally not included'));
  assert(project.includes('Does not name real organizations, people, employer names, internal titles, or local file paths.'));

  const audience = fs.readFileSync(path.join(technologyLifecycleExampleDir, '.paper', 'AUDIENCE.md'), 'utf8');
  assert(audience.includes('cxo-reader; distinguished-architect-engineer'));
  assert(audience.includes('Senior executive sponsor'));
  assert(audience.includes('Peer architecture leaders'));
  assert(audience.includes('Control / risk partners'));

  const readme = fs.readFileSync(path.join(technologyLifecycleExampleDir, 'README.md'), 'utf8');
  assert(readme.includes('imported-paper recovery without committing the source draft'));
  assert(readme.includes('Do not add source drafts, local paths, real people, real organization identifiers, or sensitive role details'));
}

testExamplesValidateCleanly();
testExamplesRouteToProgressAfterNormalizedCheckout();
testDataProductsExampleHasNoTrialOnlyArtifacts();
testWeeklyPlatformUpdateKeepsLiteShape();
testResponsibleAiControlsKeepsExternalEvidenceShape();
testPlatformReviewCycleMetricsKeepsQuantitativeShape();
testPublicAiControlBaselineKeepsLivePublicSourceShape();
testSoftwareSupplyChainEvidencePackKeepsCalibrationShape();
testTechnologyLifecycleManagementKeepsImportRecoveryShape();

console.log('example fixture tests passed');
