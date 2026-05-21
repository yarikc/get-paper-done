# Get Paper Done Upgrade Plan

Goal: raise the project to **9/10 as a writing framework** and **9/10 as an installable tool**.

Last reviewed: 2026-05-19

This file is the forward plan. The current ratings, risk snapshot, and review findings live in [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md). When the review changes, update that snapshot first and adjust this roadmap only when the plan itself changes.

## Current Assessment

- Current snapshot: [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md)
- Current rating: 9.25/10 as a writing framework and 9.1/10 as an installable private-repo tool as of 2026-05-19
- Target: 9/10 as a writing framework and 9/10 as an installable tool

The artifact model, command surface, install/update/export CLI, workspace helpers, artifact contracts, first-pass semantic validation, seven realistic completed examples, workflow consistency tests, routing scenario tests, content-aware status routing, hash-aware export freshness, export-state detection, quantitative-claim semantic coverage, live public-source claim-support coverage, reusable reader feedback capture, reusable governance/control-paper guidance, messy-import fixture coverage, mandatory and re-enterable `/gpd-grill` with machine-readable completion state, reusable sanitized context packs, import preview/draft-ranking hardening, `.docx` canonical-draft text extraction, import-time source-reference triage, import version/source indexing, external-review collection, Claude/Codex/Gemini provider invocation, external-review provider progress output, reviewer-specific external-review storage, combined-review deduplication, current-runtime self-review skipping, full-workspace external-review prompt context, external-review provenance, concern-first feedback plans, CLI feedback-plan review/decision commands, release/update guidance, and package-boundary hygiene checks are in place. The system still needs broader real-world validation, deeper PDF/spreadsheet extraction for imports, deeper semantic validation, local HTTP provider support, and one-by-one agent calibration against real papers.

Canonical design spec: [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md).
Detailed project review: [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md).
Active execution checklist: GitHub Issues #1 and #2.

## Planning Sources Of Truth

To avoid spreading todos across docs and issues:

| Surface | Owns | Does not own |
|---------|------|--------------|
| GitHub issues | Execution tracking, acceptance checklists, closure state | Narrative project health or long-form design rationale |
| `ROADMAP.md` | Milestone order, next slices, dependency reasoning | Detailed ratings or issue-by-issue status logs |
| `docs/PROJECT-REVIEW.md` | Current rating, risk snapshot, review findings | Forward execution backlog |
| GitHub Issue #2 | Active one-paper diagnostic checklist and friction-log execution | Long-term roadmap or design rationale |
| `rfc/*.md` | Design decisions and accepted/deferred scope | Day-to-day task tracking after implementation starts |

Current issue alignment:

- `#2`: active umbrella for layered workflow/agent testing; clean-paper, imported-paper, lite update, evidence-heavy external, short quantitative, live public-source examples, reusable reader feedback capture, governance/control-paper guidance, and messy import depth are now represented with regression coverage. The newest public-source calibration review produced reusable prompt/template guidance for defining the governed object early, explaining standards as context rather than authority signals, requiring evidence currency, and making human review exception-based.
- `#1`: broader test/evaluation program; remains open until more fixture diversity and deeper semantic checks exist.
- `#6`: focused semantic-validation execution plan; deterministic gate slices exist, and deferred gates remain tracked there.
- `#7`: prompt/validator calibration from example feedback; the initial calibration slice is complete, with future prompt calibration expected to come from additional paper trials.
- `#8`: closed cycle-3 example and semantic-warning calibration; it added example-wide semantic gates, recommendation specificity, list-heavy prose warnings, and compact broken-fixture coverage.
- `#9`: second-paper trial; produced the anonymized imported-paper example and an exporter bug fix. Pre-registration was not captured as a formal artifact, so the run is useful but weaker as calibration evidence.
- `#10`: closed anonymized control-paper import fixture; captured the founding failure pattern without real names, employer names, titles, or local paths and produced regression coverage for three missed semantic failures.
- `#5`: RFC event and hook runtime feature request; deferred until real-paper trial clarifies which transitions need deterministic events.
- `#14`: RFC-001 remaining review orchestration and evaluation hardening; Phase 1 artifact contracts are implemented, and later slices should wait for observed calibration failures.
- `#15`: RFC-012 progressive classification and policy-driven checks; current enum foundation exists, but classification-driven policy/routing remains deferred.
- `#12`: RFC-003 illustrations and diagram artifacts; gated feature request, not core workflow until a real calibration paper proves the need for paper-native visual lifecycle management.
- `#13`: RFC-004 data charts and Vega-Lite artifacts; gated feature request, not core workflow until a real quantitative/public-source paper proves charting is materially useful.
- `#16`: RFC-005 new-user onboarding follow-through; bounded README and START-HERE cleanup shipped, and any further onboarding work should be driven by concrete newcomer feedback.
- `#17`: RFC-006 mobile review packs for away-from-desktop review; useful capability backlog item, but should start as manual validation and review-pack export/import rather than a mobile app or vendor integration.
- `#18`: closed mandatory grill gate and reusable paper context records; follow-up cleanup now clarifies grandfathered examples, indexes examples/fixtures, and tightens validation for grill companion artifacts.
- `#20`: review/comment UX simplification; first CLI slice implemented with `gpd review-pack`, `gpd feedback`, unresolved-export-comment validation, external-review provider progress, current-runtime self-review skipping, full-workspace external-review prompt context, reviewer-specific external-review storage, combined-review deduplication, feedback-plan decomposition of external review concerns, generated recommendations, and explicit user decisions. Remaining future improvements should be driven by the next paper trial, not speculative UI surface.
- `#31`: concern-first feedback-plan UX; implements a clearer `FEEDBACK-PLAN.md` schema and `gpd feedback-plan list/review/decide` so users can make one decision at a time in the CLI/TUI before revision.
- `#32`: RFC-007 evaluation harness; backlog item for independent `FINAL.md` quality measurement. Start with manual rubric calibration before CLI automation.
- `#33`: RFC-008 warrant-integrity checks; backlog item for making load-bearing warrants explicit in grill/PAPER-CONTEXT. Keep deterministic checks separate from LLM advisory assessment.
- `#34`: RFC-009 bad-strategy tells; backlog item that should fold first into the Brief Acceptance Gate and strategy gate rather than adding a heavy standalone artifact immediately.
- `#35`: RFC-010 Minto/SCQA structure checks; backlog item for explicit structure declaration, answer-first checks, and genre opt-out.
- `#36`: RFC-011 grill source intake and source graph; highest-leverage RFC-007..011 starting point because it addresses the observed missed-source failure in a real paper trial.
- `#37`: state schema and workflow-simulation hardening follow-ups; tracks lower-risk state-label/versioning/status-nudge work harvested from the local workflow simulation after the high-risk safety findings were fixed.

## Main Line Preserved During RFC-005 Detour

RFC-005 identifies a real onboarding and product-story gap, and a bounded documentation detour is allowed because the pre-existing main line is now explicitly recorded. After that detour, the plan of record remains:

1. Run one more realistic paper calibration using public sources only.
2. Pre-register the calibration before the run: paper purpose, channel, risk, complexity, audience shape, source set, expected failure modes, and what would count as a useful result.
3. Run the workflow end to end: brief, strategy gate, research, outline, draft, fact-check, review, revise, and export.
4. Validate the resulting workspace with `gpd validate --semantic` and package/example checks where applicable.
5. Convert only observed failures into targeted changes: prompt guidance, artifact contracts, semantic validators, examples, or tests.
6. Keep all paper material anonymized and public-source-only; do not commit private drafts, person names, company names, titles, local paths, or ignored raw feedback files.

Owning issues:

- `#1` owns the broader test/evaluation objective and the real-paper calibration gap.
- `#2` owns workflow/agent fixture implications that come out of the calibration run.
- `#6` owns any semantic validator follow-up, but new validators should wait for concrete failures from the calibration.

Deferred until after the main-line calibration unless explicitly reprioritized:

- RFC-005 / `#16` work beyond the bounded README/product-story and `docs/START-HERE.md` cleanup.
- RFC-003 / `#12` and RFC-004 / `#13` visual/chart work.
- RFC-001 / `#14` later phases and RFC-012 / `#15` intake or policy-routing changes.
- Issue #5 RFC event and hook runtime.
- RFC-006 mobile review packs / `#17` beyond manual validation.
- Broad import conversion work beyond bugs exposed by the calibration.
- Semantic validation as a routing source. `gpd validate --semantic` detects quality failures, but `gpd next` does not yet use semantic issue IDs as blockers.
- Deterministic classification-driven policy checks beyond schema/template/workflow guidance. RFC-012 / issue #15 owns the broader feature direction.
- Context-pack discovery CLI. `contexts/` is installed and documented, but users inspect the directory directly for now.
- RFC-007 through RFC-011 implementation beyond issue creation and RFC capture. Resolve purpose-taxonomy drift first: current first-class `classification.purpose` values remain `decision_memo`, `strategy_paper`, `explainer`, and `update`; labels such as `position_paper` and `white_paper` should map onto the existing taxonomy unless the taxonomy is explicitly reopened.
- LLM-as-judge behavior inside deterministic semantic validation. Future RFC slices should keep `semantic.js` deterministic where possible and put model-judged assessment in advisory review/evaluation until calibrated.

## RFC-003 / RFC-004 Placement

RFC-003 (`#12`) and RFC-004 (`#13`) are useful design proposals, but they should not become core GPD workflow yet.

Current decision:

1. Treat RFC-003/RFC-004 as a gated visual-artifacts track, not active main-line work.
2. Use the next public-source calibration paper to observe whether a serious paper naturally needs a diagram, chart, both, or neither.
3. If a visual artifact is needed, prototype it first as an optional authoring skill or manual artifact convention before adding core CLI commands such as `gpd illustrate` or `gpd render`.
4. Promote to GPD core only after a real paper proves that visuals need lifecycle state, validation, rendering, and export behavior inside `.paper/`.

Rationale:

- The project still needs broader real-paper calibration more than it needs a new artifact family.
- RFC-003's proposed Excalidraw pipeline adds meaningful dependency and rendering complexity. It should be justified by a real diagram need, not by architecture completeness.
- RFC-004's Vega-Lite proposal is more naturally justified by a quantitative paper with real public data. The short quantitative example did not prove charting was necessary.
- Existing Codex skills already cover adjacent work: image generation is useful for raster assets but is not a deterministic diagram/chart source of truth; spreadsheet tooling can create charts in workbooks but does not solve paper-native markdown/SVG lifecycle management. These capabilities are helpers, not a replacement for a GPD visual artifact model.

Recommended phase order if the calibration proves the need:

1. **Skill prototype:** create a concise visual-authoring skill or instructions that can produce one committed SVG plus source file for a single paper, with no new GPD CLI.
2. **Artifact convention:** document `.paper/visuals/` or split `.paper/illustrations/` / `.paper/charts/` only after the prototype shows the format is stable.
3. **Validation slice:** add deterministic checks for referenced files, stale renders, missing sources, and obvious schema errors.
4. **Core CLI:** add `gpd render` / `gpd illustrate` only if repeated use shows manual rendering is a real workflow burden.

Open questions for the calibration:

- Does the paper need a conceptual diagram to explain structure or lifecycle?
- Does the paper include quantitative comparisons that are materially clearer as a chart?
- Can the visual be handled with a static committed SVG, or does it need source/render lifecycle management?
- Does fact-check need to reason over the visual, or is ordinary prose/source fact-checking enough?

## Active Execution Plan: Cycle 6 Hardening

Last changed: 2026-05-15 after adding the post-grill cleanup slice: example/fixture indexes, explicit grandfathering policy for pre-grill examples, alias/override documentation, and stronger validation for `PAPER-CONTEXT.md` and `DECISIONS.md`.

This is the active short-cycle plan. Changes to this plan must be recorded before implementation by updating this section and adding an append-only comment to the owning GitHub issue.

Plan-change rule:

- If scope changes, update this section with the new scope and reason.
- If task order changes, update this section with the new order and reason.
- If a task moves to a different issue, comment on both the old and new issue.
- Do not use ignored raw feedback files as execution tracking. They are inputs, not the plan of record.

### Owning Issues

- `#6` owns semantic-validation hardening: semantic issue IDs and claim-support example backfill.
- `#2` owns example and fixture hardening plus workflow contract cleanup: pre-registration artifacts, fixture documentation, dedicated example-shape tests, workflow-state fixtures, classification enum consistency, reader feedback artifact consistency, and messy-import depth coverage.

### Scope

1. Completed: backfilled `source_registry[*].claim_support` into `examples/platform-review-cycle-metrics/.paper/RESEARCH.json`.
2. Completed: added `examples/platform-review-cycle-metrics/EXPECTED-FINDINGS.md` to record the quantitative example's expected validator behavior.
3. Completed: added stable semantic issue IDs to `gpd validate --semantic --json`.
4. Completed: updated `tests/broken-fixture.test.js` to assert semantic issue IDs instead of prose substrings.
5. Completed: added `tests/fixtures/broken-semantic-paper/README.md` mapping intentional violations to semantic issue IDs.
6. Completed: added a dedicated `technology-lifecycle-management` import-recovery test covering anonymization/source boundary, mixed-audience config, absence of committed source draft, clean semantic validation, and completed routing.
7. Completed: added a failed-strategy-gate fixture that proves `Revise Before Drafting` blocks downstream progress and routes back to `/gpd-brief` with clear validation output.
8. Completed: added a mid-revision routing fixture that proves downstream review/fact-check artifacts can route a paper backward for incremental repair without resetting the whole workflow.
9. Completed: added a compact live public-source example that uses real official public sources, records source verification, and proves claim-support metadata carries through research, fact-check, review, and export.
10. Completed: promoted classification enums into `config.schema.json`, starter templates, brief/workflow guidance, docs, profile calibration, and example tests so `purpose/channel/risk/complexity/audience_shape` drive later stages instead of loose `paper_type` labels.
11. Completed: codified the reusable "not new bureaucracy" rule for governance, control, standard, gate, review, and required-record papers in brief, draft, review, and rubric guidance.
12. Completed: added reusable `FEEDBACK-READER.md` capture with five-signal template, artifact validation, review/revise/progress guidance, status routing, and documentation.
13. Completed: added a messy synthetic import fixture with expected findings and regression coverage for preservation, source/review classification, canonical draft selection, no downstream artifact generation, blocked strategy routing, and source-sensitive semantic warning.
14. Completed: added `gpd review-external` as a safe collector from files or stdin. It writes `.paper/FEEDBACK-EXTERNAL.md` and `.paper/FEEDBACK-PLAN.md`, updates state to the pending approval gate, adds an `FEEDBACK-EXTERNAL.md` artifact contract, and deliberately does not invoke external providers yet.
15. Completed: added a first provider-invocation slice for `gpd review-external --models`, limited to installed CLI providers with known stdin command patterns, temp prompt generation, timeout/error capture, and no local HTTP server support yet.
16. Completed: calibrated the real Claude CLI path on a synthetic public paper, fixed the command from `claude -p -` to `claude -p`, and added a regression assertion for the argument shape.
17. Completed: fixed status routing so pending `FEEDBACK-PLAN.md` approval gates route to `/gpd-feedback` before stale mtime refresh rules can send the paper backward.
18. Completed: calibrated the real Codex CLI path on a synthetic public paper, confirmed `codex exec --skip-git-repo-check -`, and added a regression assertion for the argument shape.
19. Completed: added first-pass `.docx` canonical-draft text extraction for `gpd import`, preserving the original file under `original/`, writing extracted paragraph text to `.paper/DRAFT.md`, recording extraction provenance in `.paper/IMPORT.md`, and covering the behavior with a synthetic DOCX regression test.
20. Completed: added import-time detection of unverified source-reference candidates from Markdown, text, and `.docx` material, recording URLs, DOIs, named standards/source families, and source/reference lines in `.paper/IMPORT.md` without creating `RESEARCH.json`.
21. Completed: added a `Version / Source Index` to `.paper/IMPORT.md`, grouping copied files by likely role, ranking signal, modified time, recommended downstream stage, and rationale without changing routing or generating downstream artifacts.
22. Completed: calibrated the real opencode CLI path on a synthetic public paper, confirmed `opencode run -`, corrected Gemini args to `gemini -p ""` with stdin based on CLI help, and added regression assertions for both provider argument shapes. Later paper-review calibration removed Opencode from supported paper reviewers because the local path proved unreliable for this workflow. Gemini was later calibrated on a real private-paper review once local authentication was available.
23. Completed: added CLI-only `gpd next` as a compact read-only guide for the next command, why it is next, and what context to read or avoid, while keeping `/gpd-status` as the Claude/Codex dashboard.
24. Completed: simplified README and `docs/START-HERE.md` into onboarding/front-door docs with a product story, output preview, first-paper path, and clarify/support/shape/draft/check/revise/export loop; dense workflow mechanics stay in `docs/DESIGN-SPEC.md`.
25. Completed: ran a temporary public-source onboarding calibration paper using `gpd next` between stages. The command routed correctly, but the calibration exposed that explanations could prefer saved `STATE.json` over the more helpful missing-artifact reason; fixed by prioritizing missing research/outline/draft/fact-check/review explanations before saved-state fallback.
26. Completed: enforced the new-example grill artifact policy in tests. Existing pre-grill examples are explicitly grandfathered; any new example must include `.paper/PAPER-CONTEXT.md`, `.paper/DECISIONS.md`, and complete `STATE.json.grill` state.

### Explicit Non-Goals For This Cycle

- Do not implement RFC-003 or RFC-004.
- Do not add new semantic quality heuristics unless the active plan changes first.
- Do not add a web dashboard, app UI, or any UX surface outside the `gpd` CLI, Claude/Codex slash commands, and `.paper/` artifacts.
- Do not commit ignored feedback files.
- Do not add a tracked feedback archive. Harvest actionable feedback into anonymized issues, tests, examples, docs, or roadmap entries; leave raw feedback files ignored.

### Deferred After This Cycle

- Longer-paper prose-saturation recalibration.
- CLI routing based on classification values. Classification is now schema/workflow/documentation enforced, but `gpd status` still routes primarily from artifact state, strategy state, mtimes, exported draft hashes, review/fact-check state, and export state.
- Public/team distribution policy beyond the private-repo release workflow.

## Active Milestone: One-Paper Diagnostic And Examples

Next work should validate behavior under real use before adding more RFC surface area.

1. Use GitHub Issue #2 as the active one-paper diagnostic checklist and friction log.
2. Completed: run one realistic paper through setup, strategy, research, outline, draft, fact-check, review, revision, and export.
3. Completed: refreshed the trial output so `gpd validate --semantic` passes with no semantic issues.
4. Completed: turned the refreshed trial output into `examples/data-products-ai-scaling`.
5. Completed: added example validation tests for semantic validation, export cleanliness, and completed-workflow routing on a normalized checkout copy.
6. Completed: converted the next feedback pass into prompt rules, semantic gates, and example repairs for reasoning spine, audience conflict specificity, fact-check/source alignment, and concrete recommendations.
7. Completed: added example-wide semantic gate script, compact broken semantic fixture, recommendation-specificity warnings, list-heavy prose warnings, and cleaned the completed example opening prose.
8. Completed: the fourth feedback pass expanded the example README, tightened artifact-level prose-density warnings, repaired the completed example, and tracked the second-paper trial in GitHub.
9. Completed: ran a second paper with a different failure profile before adding more same-example validators. Gap: hypotheses were discussed but not captured as a formal pre-registration artifact.
10. Completed: built the anonymized control-paper fixture from the non-GPD lifecycle-paper sequence, preserving the failure pattern while removing identifying names, titles, companies, and local paths.
11. Completed: added an anonymized imported-paper example at `examples/technology-lifecycle-management`.
12. Completed: added a lite internal update example at `examples/weekly-platform-update` to prove low-risk papers do not need forced research or fact-check artifacts.
13. Completed: added an evidence-heavy external example at `examples/responsible-ai-controls` with synthetic source registry, counterevidence, fact-check, audience review, and bounded public claims.
14. Completed: added controlled quantitative-claim semantic coverage and fact-check guidance so precise numbers require source IDs, baseline/denominator/timeframe context, and strong enough research support.
15. Completed: added `examples/platform-review-cycle-metrics`, a short synthetic quantitative memo that exercises baseline, sample, timeframe, source IDs, fact-check handling, review, export, and zero-warning semantic validation.
16. Completed: added structured `source_registry[*].claim_support` metadata plus semantic coverage that rejects safe claims citing sources recorded as only topically related.
17. Completed: added `examples/public-ai-control-baseline`, a compact public-source decision memo that uses verified NIST, OWASP, and NCSC/CISA sources with source IDs, claim-support metadata, fact-check, review, export, and zero-warning semantic validation.
18. Completed: pre-registered and ran `examples/software-supply-chain-evidence-pack`, a second public-source decision memo using CISA, NIST, SLSA, OpenSSF, OWASP, and NCSC sources with source IDs, claim-support metadata, fact-check, review, export, and zero-warning semantic validation.
19. Completed: reviewed the `software-supply-chain-evidence-pack` output against human feedback and repaired the example from a static evidence packet into a supply-chain control process for high-risk AI and software deployments, including pilots moving into production-like use, with a control record, standards context, AI runtime evidence, decision rules, refresh triggers, observed evidence, owner attestation, validation, and exception-based human review.
20. Completed: promoted `software-supply-chain-evidence-pack` into the showcase feedback-loop example by adding `FEEDBACK-READER.md`, `FEEDBACK-PLAN.md`, `EXPECTED-FINDINGS.md`, README coverage, and regression assertions for the backward-routing quality fix.
21. Completed: codified the reusable control/governance-paper lesson into workflow guidance, templates, agents, rubrics, and consistency tests. The guidance is prompt/artifact guidance first, not a new validator: when a paper proposes controls, standards, gates, reviews, or required records, it must define the governed object early, explain why cited standards matter, name the required artifact, state whether evidence is static or current, name refresh triggers, explain how evidence changes decisions, and handle process burden with automation/observed evidence plus human-by-exception where appropriate.
22. Completed: validated the reusable control/governance guidance against `examples/public-ai-control-baseline`, a smaller AI pilot control-baseline decision memo. The artifacts now show the control check in brief, outline, fact-check, and review, while the final memo stays concise and passes semantic validation without prose-saturation warnings.
23. Completed: validated that governance/control guidance does not leak into ordinary non-governance examples by adding regression checks for the clean strategy paper, lite update, and short quantitative memo.
24. Completed: added private-repo release/update guidance in `docs/RELEASE.md`, packaged it, added `npm run release:check`, and documented the release path in README.
25. Completed: hardened `gpd import` with dry-run inventory, classification counts, copied-size reporting, warning output, `--max-file-bytes`, deterministic draft-candidate scoring, and richer `.paper/IMPORT.md` inventory.
26. Completed: added `gpd review-external` collection wrapper for external review text, with tests for durable artifact output, pending feedback-plan routing, no local path leakage in the review artifact, the missing-draft failure path, and `FEEDBACK-EXTERNAL.md` artifact validation.
27. Completed: added first-pass `gpd review-external --models` provider invocation for installed CLI providers, with tests using a fake provider binary and unsupported-provider capture.
28. Completed: calibrated `gpd review-external --models claude` against the real Claude CLI on a synthetic public paper and fixed pending feedback-plan routing precedence.
29. Completed: calibrated `gpd review-external --models codex` against the real Codex CLI on a synthetic public paper.
30. Completed: added `.docx` canonical-draft text extraction for `gpd import` without adding package dependencies or committing binary/private fixture material.
31. Completed: added import-time source-reference triage for Markdown, text, and `.docx` imports, explicitly leaving verification to research/fact-check.
32. Completed: added import version/source indexing so `IMPORT.md` shows canonical draft, alternate drafts, source/reference material, review feedback, outlines/specs, assets, notes, and unclear files with downstream-stage guidance.
33. Completed: calibrated `gpd review-external --models opencode` against the real opencode CLI on a synthetic public paper, then removed Opencode from supported paper reviewers after a later real-paper trial showed it was unreliable for this workflow. Gemini is argument-corrected and calibrated for paper review when the local Gemini CLI is authenticated.
34. Completed: added visible provider-level progress to `gpd review-external --models` so users see each reviewer move through running, captured, empty, missing, failed, skipped-self-review, or unsupported states instead of waiting on an opaque background terminal.
35. Completed: added the first issue #20 review/comment UX slice: `gpd review-pack` shows the single review target and comment syntax, `gpd feedback` captures inline comments into `FEEDBACK-READER.md` and pending `FEEDBACK-PLAN.md`, and semantic validation flags unresolved inline comments left in `exports/FINAL.md`.
36. Completed: improved `gpd review-external` after the private-paper trial so provider prompts include the full paper workspace context and generated `FEEDBACK-PLAN.md` rows decompose captured HIGH/MEDIUM/LOW concerns instead of collapsing a full review into one item.
37. Completed: added generated recommendations, proposed edits, risk notes, reviewer evidence, explicit `User Decision`, and `User Constraint` fields to feedback plans, so the CLI proposes handling while keeping the author in control before revision.
38. Completed: added reviewer-specific external-review storage under `.paper/feedback-external/`, combined-review deduplication, combined recommendation printing, and Gemini-style review parser support after a private real-paper trial.
39. Completed: added `REVISION-CHECK.md` as the regression gate for substantive revisions after a private real-paper trial showed validator-clean edits can still degrade argument quality, evidence linkage, persona, and voice.
40. Completed: promoted paper version safety from documentation to CLI behavior after the private-paper regression. `gpd revise` now creates the pre-revision snapshot, records the active revision snapshot in state, and prints the restore command before controlled draft changes; generated artifact writes now use temp-file-plus-rename updates; `gpd snapshot` creates `.paper/versions/...` snapshots and `REVISION-LOG.md`; snapshots include paper artifacts, source notes, external-review captures, imported originals, and hash metadata; `gpd status` and `gpd next` surface the latest restore command when a snapshot exists; `gpd export` requires a current valid `REVISION-CHECK.md` before overwriting a prior export with a newer draft, then snapshots the existing `FINAL.md`; `gpd restore` restores tracked files from a snapshot after creating a safety snapshot; validation checks revision-check dimensions, score regressions, referenced version snapshots, and snapshot hashes; `gpd next` uses exported draft hashes for export freshness so touched-but-unchanged drafts do not cause false stale routing while content changes with misleading mtimes still route to export.
41. Completed: added issue #30 external-review provenance and the first implementation slice. `gpd review-external` now writes `.paper/EXTERNAL-REVIEW-RUN.json` and references it from `FEEDBACK-EXTERNAL.md`, recording review target, context artifacts, requested providers, current-runtime skip setting, timeout, isolated working-directory policy, safe provider command/argument shape, provider status, raw feedback paths, requested model alias or pin, requested effort where supported, ignored unsupported overrides, and resolved model evidence when the provider reports it. Claude paper review now defaults to `claude -p --model opus --effort xhigh`; Gemini paper review now defaults to `gemini -p "" -m pro --output-format json --approval-mode plan --skip-trust`, with per-paper `config.json` overrides for Claude/Gemini model selection and Claude effort when reproducibility matters.
42. Completed: added issue #31 concern-first feedback-plan UX. `FEEDBACK-PLAN.md` now groups tactical suggestions under named concerns, explains why each concern matters, what improves if addressed, the risk of handling it badly, proposed edits, and reviewer evidence; `/gpd-feedback` walks users through one concern at a time, while `gpd feedback-plan list/review/decide` remains the lower-level CLI surface for agents, tests, and scripts.
43. Next main-line slice: finish the paused private-paper revision by approving or modifying the combined external-review feedback plan, applying accepted changes, exporting again, and using that trial to decide whether PDF/spreadsheet import handling, local HTTP provider support, or another workflow validation should follow.

## Completed Design Simplifications

- Renamed project to Get Paper Done.
- Simplified import so it preserves originals and creates only minimal artifacts.
- Added paper location prompt and per-paper directory creation.
- Added `/gpd-status` as the read-only slash-command continuity dashboard.
- Added CLI-only `gpd next` for compact next-action guidance while preserving explicit slash-command stage execution.
- Added hard research compression rule.
- Added curated reusable audiences.
- Collapsed specialized audience review wrappers into one `audience-reviewer`.
- Added short aliases: `/gpd-new`, `/gpd-import`, `/gpd-status`.
- Simplified `STATE.md` to human-readable stage/blocker/approval/next-action state and added `STATE.json` as the machine-readable CLI state companion.
- Split `PROJECT.md` from `BRIEF.md`: project identity vs argument detail.
- Simplified review flags to `--lite`, `--deep`, `--external`, and `--models`.
- Added external feedback planning and approval gate.
- Upgraded researcher to infer research questions, present a plan, support depth/source modes, and write canonical `RESEARCH.json`.
- Upgraded strategist into a challenge-first gatekeeper that can block research, outline, and drafting with `Revise Before Drafting` or `No-Go`, plus normalized `Strategy Blockers` for machine-routable "why not Go" decisions.
- Added install/update CLI for Claude and Codex with runtime-neutral command placeholders, install manifest, update backups, dry-run, doctor, and version commands.
- Added deterministic `gpd export` and structural `exports/FINAL.md` status awareness.
- Added deterministic `gpd review-external` collection from files/stdin into `FEEDBACK-EXTERNAL.md` and `FEEDBACK-PLAN.md` with pending approval routing.
- Added first-pass `gpd validate --semantic` gates for empty-but-well-formed artifact failures.
- Added `examples/data-products-ai-scaling` plus regression coverage for a realistic completed clean-paper workspace.
- Added `examples/technology-lifecycle-management` plus regression coverage for an anonymized imported-paper recovery workspace.
- Added `examples/weekly-platform-update` plus regression coverage for a lite internal update workspace without research or fact-check artifacts.
- Added `examples/responsible-ai-controls` plus regression coverage for an external evidence-heavy workspace with required research and fact-check artifacts.
- Added `validateQuantitativeClaimSupport` with regression coverage for unsupported precise numerical claims and supported numerical claims with baseline, sample, timeframe, source IDs, and strong research support.
- Added `examples/platform-review-cycle-metrics` plus regression coverage for a short quantitative internal memo with baseline, denominator, timeframe, and fact-check evidence shape.
- Added `source_registry[*].claim_support` metadata and semantic coverage for public-source claim fidelity, including a topically related NIST source rejected for an OWASP-specific prompt-injection claim.
- Added an explicit npm package allowlist plus `npm run pack:check` so private templates, RFC drafts, tests, feedback files, and local scratch files do not enter the installable package.
- Added stable semantic issue IDs, backfilled claim-support metadata into the quantitative example, added quantitative expected findings, documented the broken semantic fixture, and added a dedicated imported-paper recovery test.
- Added a failed-strategy-gate fixture plus regression test proving a blocked strategy state routes back to `/gpd-brief` and fails validation clearly without downstream artifacts.
- Added a mid-revision routing fixture plus regression test proving fact-check can route a structurally valid paper back to `/gpd-research` while preserving downstream artifacts.
- Added `examples/public-ai-control-baseline` plus regression coverage for real public-source URLs, source verification notes, direct claim-support metadata, fact-check source IDs, and exported public citations.
- Added `examples/software-supply-chain-evidence-pack` plus `EXPECTED-FINDINGS.md`, README coverage, and regression coverage for real CISA, NIST, SLSA, OpenSSF, OWASP, and NCSC source URLs, direct/partial claim-support metadata, fact-check source IDs, process-burden handling, AI runtime evidence, and exported public citations.
- Repaired `examples/software-supply-chain-evidence-pack` from human reader feedback, converting the recommendation from a static pre-production packet into a supply-chain control process for high-risk AI and software deployments with a control record, AI runtime inventory, decision rules, refresh triggers, observed evidence, owner attestation, validation, and exception-based review.
- Added `docs/SEMANTIC-CALIBRATION.md` to record why the prose-saturation validator allows isolated load-bearing definition lists while still treating repeated decorative parallel prose as a quality risk.
- Codified governance/control-paper guidance across brief, outline, draft, fact-check, review, agents, and rubrics so future papers define the governed object, durable record, evidence currency, refresh triggers, decision rule, standards framing, and process-burden answer before prose polish.
- Backfilled `examples/public-ai-control-baseline` as the second governance/control calibration point, including process-burden, governed-object, evidence-currency, refresh-trigger, decision-rule, standards-framing, and fact-check coverage without expanding the memo into a white paper.
- Added regression coverage to keep governance/control scaffolding out of non-governance examples, protecting ordinary strategy papers, lite updates, and quantitative memos from over-application.
- Added `docs/RELEASE.md`, `npm run release:check`, README release/update guidance, and package-hygiene coverage for the release guide.
- Hardened `gpd import` preview and reporting: dry-run now shows classification counts, copied size, warnings, and canonical draft candidate; `.paper/IMPORT.md` now records import inventory, largest files, warnings, and draft-candidate ranking; CLI supports `--max-file-bytes`.

---

## Track A: Framework Quality To 9/10

### 1. Run A Real Paper Through The Full Flow

Use an existing paper project as the first test case.

Flow:

1. `/gpd-import`
2. `/gpd-brief`
3. `paper-strategist` gate via `.paper/STRATEGY.md`
4. `/gpd-research --standard` with plan approval
5. `/gpd-outline`
6. `/gpd-review --lite` if the outline or imported draft needs early reader-fit triage
7. `/gpd-draft` or preserve imported draft
8. `/gpd-fact-check --full`
9. `/gpd-review --deep --external`
10. `/gpd-revise`
11. `/gpd-fact-check --publication` if factual claims changed during revision
12. `/gpd-export`

Deliverables:

- Completed: `examples/technology-lifecycle-management/`
- Completed: notes on friction points in GitHub Issue #9
- Completed: exporter bug fix from the run
- Still useful later: deeper before/after comparison across more paper types

Success criteria:

- The workflow can ingest messy existing material without losing context.
- The next command recommendation is correct at each stage.
- The generated artifacts are useful, not ceremonial.
- `RESEARCH.json` is useful downstream without loading raw source material.
- `FACT-CHECK.md` catches unsupported, stale, overstated, or risky material claims before export.

### 2. Harden The Import Workflow

Current import flow is conceptually strong and has first-pass fixture coverage, including messy-folder classification, single-draft recovery, dry-run inventory, deterministic draft ranking, file-size skip control, richer import reporting, `.docx` canonical-draft text extraction, unverified source-reference triage, and version/source indexing. Remaining work is deeper PDF/spreadsheet extraction and user-facing review of very large imports.

Needed:

- add explicit user confirmation or review workflow for very large folders
- add import classification categories
- add handling for `.docx`, `.pdf`, Markdown, plain text, diagrams, and spreadsheets
- specify how to preserve and index richer version history beyond the copied file list

Deliverables:

- updated `workflows/import-paper.md`
- updated `templates/import-report.md`
- import checklist in `references/writing-artifacts.md`

Success criteria:

- Import can handle a folder with drafts, specs, research, reviews, and references.
- Original files are preserved unchanged in `original/`.
- `.paper/IMPORT.md` explains what was copied, skipped, inferred, and unknown.

### 3. Strengthen Audience System

Current curated audiences are useful but should be validated against real drafts.

Needed:

- refine the four curated personas after real use
- add conflict-resolution examples for multi-audience papers
- validate that users choose audience personas while internal review logic handles routing
- add audience selection examples to docs

Deliverables:

- improved `audiences/*.md`
- examples of multi-audience `.paper/AUDIENCE.md`
- tighter `audience-review-rubric.md`

Success criteria:

- Audience reviews produce specific, actionable changes.
- Low scores always produce rewrite instructions.
- Multi-audience scoring does not become vague or contradictory.

### 4. Improve Review And Feedback Planning

Current review design is strong but needs sharper feedback handling.

Needed:

- add examples of `FEEDBACK-EXTERNAL.md`
- define how conflicting model feedback is resolved
- require feedback to map to affected artifact
- extend `FEEDBACK-PLAN.md` examples to conflicting model feedback after external-review workflow is exercised

Deliverables:

- sample review artifacts
- stronger `templates/feedback-plan.md`
- stronger `workflows/review.md`
- stronger `workflows/revise.md`

Success criteria:

- Review never silently changes the draft.
- Every feedback item is classified: incorporate, ignore, defer, ask user.
- User can approve plan before revision.

### 5. Add Framework Examples

The project now has seven reference examples covering clean strategy, imported-paper recovery, lite update, evidence-heavy external writing, quantitative memo, compact public-source governance memo, and the showcase feedback-loop control memo.

Still useful later:

- a true multi-audience example when a real paper creates that conflict
- an external-review example after the manual external-review path is exercised
- a minimal first-paper walkthrough example if newcomer feedback shows the current examples are too dense

Success criteria:

- A new user can inspect examples and understand the intended artifact quality.
- Examples reveal how much detail belongs in each file.

### 6. Improve And Calibrate Agents

The agent set now has stronger prompts, but most agents still need one-by-one review with the user: explain purpose, inspect behavior, rate, simplify, and tune.

Reviewed so far:

- `audience-reviewer`: simplified to one internal reviewer; supports Lite review of brief/outline without requiring a draft, Deep draft review, separate multi-audience scoring, and an explicit conflict table when selected audiences disagree.
- `paper-researcher`: upgraded with strategy-aware claim framing, inferred research questions, plan approval, depth/source modes, source registry, evidence matrix, synthesis matrix, contradictions, draft support notes, and canonical `RESEARCH.json`.
- `paper-strategist`: upgraded to challenge thesis, paper job, reader promise, posture, decision usefulness, and scope; can block downstream work and preserves/supersedes prior `STRATEGY.md` state when rerun.
- `paper-outliner`: upgraded into an argument architect with Lite for early/short/import triage and Deep as default for serious, researched, executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers. It supports `outline_only` / `outline_plus_skeleton`, strategy-gate awareness, explicit missing-strategy handling, provisional-outline handling, reader-state transitions with strict cell format, evidence-strength marking, reader-question mapping, approximate length allocation, transition logic, and objection placement. Deep mode adds structure-selection rubric, draft-readiness scoring, reader jump analysis, evidence/objection load checks, and severity-scored structural anti-patterns tied to the anti-fluff profile.
- `paper-drafter`: upgraded into a controlled prose engine with `section_draft`, `full_draft`, and `redraft_from_comments` modes; section-by-section is default for serious or long papers. It preserves approved thesis, posture, scope, and existing sections; builds a section intent map with reader-state transitions and length/density targets; applies style controls; reads relevant strategy/review/feedback artifacts; and marks evidence gaps, placeholders, author decisions, assumptions, structure issues, and redraft change logs instead of hiding them in prose.
- `paper-editor`: upgraded into a voice-preserving line-and-structure editor with plan-first default, `editorial_review`, `section_edit`, `full_edit`, `style_pass`, and `final_polish` modes plus `light_edit`, `standard_edit`, and `heavy_edit` intensity. It edits in layers: structure, clarity, rhythm/flow, tone consistency, and publication readiness. It stops on pending feedback or strategy blocks, applies drift checks, preserves thesis/evidence/scope/audience/persona/decision ask, checks publication readiness, and records change logs for draft modifications.
- `paper-fact-checker`: upgraded into an editorial fact-checker and claims-risk auditor with `risk_scan`, `full_claim_check`, `publication_check`, and `source_audit` modes. It creates `FACT-CHECK.md`, inventories material claims, checks source alignment, distinguishes unsupported/false/not-checked/current-verification-needed/misleading-in-context, evaluates support/freshness/precision/context/risk/quantitative integrity, assesses whether the conclusion outruns verified support, reports systemic factual risk patterns, respects audience proof standards and source policy, and routes fixes to research or revision.
- `opposition-reviewer`: upgraded into a steelman opposition reviewer with Lite/Deep modes, scope modes, strongest good-faith opposition framing, opposition model, strongest fair opposing case, fatal/serious/moderate/minor objection audit, argument resilience scorecard, audience-impact mapping, claim stress tests, existing-defense check, weak-assumption table, overclaiming/strawman risks, alternative explanations, deep-mode opposition map, assumption failure test, alternative strategy test, pre-mortem, narrowing plan, and routing to brief/research/fact-check/outline/revision.

Current ratings:

- `audience-reviewer`: 8.8/10 pending real multi-audience calibration
- `paper-researcher`: 9.0/10 pending messy-import calibration
- `paper-strategist`: 9.1/10 pending real-use calibration
- `paper-outliner`: 9.3/10 pending calibration on a real imported or strategy-heavy paper
- `paper-drafter`: 9.1/10 pending real-use calibration
- `paper-editor`: 9.1/10 pending real-use calibration
- `paper-fact-checker`: 9.2/10 pending real-use calibration
- `opposition-reviewer`: 9.2/10 pending real adversarial-review calibration

Remaining one-by-one agent reviews:

1. Revisit `paper-fact-checker` after a real publication check
2. Revisit `paper-editor` after a real final-polish pass
3. Revisit `paper-drafter` after a real section-by-section draft
4. Revisit `audience-reviewer` after a real multi-audience draft
5. Revisit `paper-researcher` after one messy imported paper
6. Revisit `paper-strategist` after a real strategic block/override decision
7. Revisit `paper-outliner` after a real imported or strategy-heavy paper
8. Revisit `opposition-reviewer` after a real adversarial review

Review protocol for each agent:

- explain what the agent does
- explain how it operates
- identify where it can fail
- ask for user preferences
- update the prompt
- rate the result
- simplify where possible

Agent-specific open questions:

- `opposition-reviewer`: does the decision-relevant adversarial posture catch the objections that matter without bloating the paper?
- `paper-fact-checker`: does full material-claim inventory create too much review overhead on real papers?
- `paper-editor`: does plan-first editing add too much friction during real final polish?
- `audience-reviewer`: does the conflict table produce useful choices on real multi-audience drafts?
- `paper-researcher`: after real use, is `RESEARCH.json` too heavy, too sparse, or exactly useful?

Deliverables:

- improved agent prompts in `agents/*.md`
- agent-specific examples under `examples/agents/`
- tighter shared rubrics where needed
- agent checklist added to docs
- current rating for each agent

Success criteria:

- Agents produce operational feedback, not generic commentary.
- Each agent has a fixed output shape.
- Each agent knows what not to do.
- Audience Review Lite and Deep examples demonstrate expected quality.
- Curated audience files catch persona-specific failure modes through the single audience reviewer.

---

## Track B: Installable Tool To 9/10

### 1. Add A Real CLI Helper

Initial install/update CLI exists. The CLI now also has workspace helpers for init/import/next/status/validate/review/export/listing.

Implemented:

```bash
gpd install claude
gpd install codex
gpd update claude
gpd update codex
gpd doctor claude
gpd doctor codex
gpd version
gpd init
gpd import --source <path> --location <path> --slug <name>
gpd next
gpd status
gpd validate
gpd review-external --review-file reviewer=<path>
gpd list-audiences
gpd list-profiles
```

Still needed:

- richer `gpd import` classification and conversion support
- local project install mode
- broader external review provider calibration/local HTTP support
- broader validation rules

Deliverables:

- `bin/gpd.js` for install/update/doctor/version and workspace helpers
- shared installer in `bin/lib/installer.js`
- split workspace helpers across `bin/lib/workspace.js`, `bin/lib/init.js`, `bin/lib/import.js`, `bin/lib/state.js`, and `bin/lib/common.js`
- neutral `@{{GPD_RUNTIME_ROOT}}` source references plus command-reference rewriting for Claude/Codex targets
- install manifest
- backup of changed installed files during update
- command routing for init/import/next/status/validate
- path handling helpers for paper workspaces
- JSON output mode for next, status, validate, audience listing, and profile listing

Success criteria:

- CLI can install/update Claude and Codex runtime assets safely.
- CLI can create directories and copy/import files safely.
- Agent workflows can call CLI helpers instead of hand-rolling shell logic.

### 2. Build Safe Import Copy Logic

First-pass copy behavior is implemented in `gpd import`.

Implemented:

- recursive copy with ignore rules
- max file size skip
- CLI `--max-file-bytes` override
- binary file handling
- dry-run mode
- dry-run classification counts, total copied size, warnings, and canonical draft candidate
- no overwrite without confirmation
- `.paper/IMPORT.md` generation
- deterministic draft-candidate scoring by filename cues, version cues, location, and modified time
- import-report inventory with classification counts, largest files, warnings, and draft-candidate table

Still needed:

- `.docx`, `.pdf`, spreadsheet, and diagram conversion/indexing helpers
- richer citation/source extraction
- explicit large-folder confirmation/review workflow

Deliverables:

- `bin/lib/workspace.js`
- `bin/lib/init.js`
- `bin/lib/import.js`
- `bin/lib/state.js`
- tests for import copy behavior

Success criteria:

- `gpd import --dry-run` shows what would be copied.
- `gpd import` creates `original/` and `.paper/IMPORT.md`.
- dangerous/unrelated directories are skipped.

### 3. Add Tests

Initial CLI tests now exist.

Implemented:

- installer install/update/doctor test
- command reference rewriting test
- update backup correctness test
- import dry-run test
- import copy test with fixture folder
- varied import classification fixture test
- audience persona discovery test
- profile discovery test
- init/next/status/validate smoke test
- malformed input tests for unreadable/missing import source, missing required files, and malformed `STRATEGY.md`
- init footgun regression test for no `--slug`, no `--title`, and no `--location`
- slug/default-location behavior for init/import
- template artifact contract tests
- workflow consistency and template/agent reference tests
- example-wide semantic gates
- package hygiene tests
- external review collection tests
- CI workflow that runs `npm run check`

Still needed:

- local project install tests if that feature is added
- external-review provider invocation tests if that feature is added
- conversion/indexing tests when import starts parsing `.docx`, `.pdf`, spreadsheets, or diagrams

Deliverables:

- `tests/`
- `npm test`

Success criteria:

- `npm test` validates core file operations.
- Basic regressions are caught before changing workflows.

### 4. Improve Installer

Installer now supports Claude and Codex runtime targets through `gpd install` / `gpd update`, dry-run mode, backups, command-reference rewriting, install manifest, and `gpd doctor`. Tests cover install, update, doctor, command-reference rewriting, and backup correctness.

Remaining:

- support local project install
- validate install result

Deliverables:

- improved `bin/gpd.js`
- improved `bin/install.js`
- `bin/lib/installer.js`
- install docs

Success criteria:

- User knows exactly what was installed and where.
- Install can be repeated safely.

### 5. External Review Runner

The workflow documents model invocation, and the CLI now supports collection plus a first installed-provider invocation path.

Implemented:

```bash
gpd review-external --review-file claude=/tmp/claude-review.md
gpd review-external --stdin --reviewer claude
gpd review-external --models claude,codex,gemini --current-runtime codex
```

Needed:

- current-runtime skip logic
- output normalization
- another real-paper calibration pass for Claude/Gemini combined review behavior
- local HTTP server support for Ollama, LM Studio, and llama.cpp
- broader prompt size and timeout behavior calibration

Deliverables:

- `bin/lib/external-review.js`
- tests for detection and output assembly

Success criteria:

- External review works without hand-copying shell commands.
- Failures are recorded but do not abort all reviews.

### 6. Validation Command

Add:

```bash
gpd validate
```

Checks:

- required `.paper/` files exist
- `AUDIENCE.md` has selected personas or custom audience
- `BRIEF.md` has thesis and claims
- `RESEARCH.json` has source registry, evidence matrix, contradictions, and source gaps
- `RESEARCH.md` exists as a short index when `RESEARCH.json` exists
- `DRAFT.md` exists before review
- `FACT-CHECK.md` exists before export when the draft contains factual, current, technical, market, regulatory, numerical, or publication-sensitive claims
- `FEEDBACK-PLAN.md` approval state is clear

Success criteria:

- User can run one command to know what is missing.
- Agent can use validation to recommend next step.

### 7. Release And Update Workflow

Status: completed for private-repo release discipline. Public/team distribution remains deferred.

Completed:

- release notes convention
- version bump process
- release checklist
- documented update path: pull or install new package, then `gpd update claude` / `gpd update codex`
- compatibility notes for changed commands, templates, agents, and references
- package-boundary check covering the release guide
- `npm run release:check` as the canonical release validation command

Deferred:

- optional public package publishing plan
- team-wide distribution policy

Success criteria:

- A private-repo release can be cut without relying on memory.
- User can see what changed before updating installed runtimes.
- `gpd update` has a clear role in the release process.

---

## Priority Order

1. Harden import further only for deeper document/source extraction or very-large-folder review.
2. Extend external review from safe collection to provider invocation after the manual workflow proves the command shape.
3. Continue one-by-one agent calibration from real paper trials.
4. Add new examples only for new failure modes, especially multi-audience or external-review cases.
5. Add local project install support if private/global runtime install becomes a blocker.
6. Decide public/team distribution policy if the project moves beyond private GitHub use.

---

## Definition Of 9/10

### Framework 9/10

- Real paper has been run end-to-end.
- Import, audience, research, review, and revise flows have been corrected from real use.
- `RESEARCH.json` proves useful as the canonical evidence artifact.
- Examples exist and show intended artifact quality.
- Audience reviews produce operational feedback, not generic critique.
- Agent prompts are calibrated one by one with examples, ratings, and fixed output shapes.
- Feedback planning prevents accidental rewrites.

### Tool 9/10

- CLI handles install/update/doctor/version/init/import/next/status/validate.
- Import copy behavior is safe and tested.
- Installer is repeatable and clear.
- External model review text can be collected through a helper command.
- Release/update process has changelog, compatibility policy, and verification checklist.
- `npm test` covers core operations.
