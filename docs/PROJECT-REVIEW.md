# Project Review

Review date: 2026-05-17
Last reviewed: 2026-05-17

This file is the current project-health snapshot. The forward plan lives in [../ROADMAP.md](../ROADMAP.md).

## Summary Rating

**Overall: 9.45/10 as a writing framework; 9.15/10 as an installable private-repo tool**

Get Paper Done is now a strong writing workflow framework with a real showcase example. The project has a simpler product-story README, a concise newcomer `START-HERE` guide, CLI `gpd next` guidance for the next action and why, `gpd review-pack` and `gpd feedback` for the exported-paper comment loop, artifact contracts, JSON schema validation, workflow consistency tests, content-aware scenario routing tests, CLI support for validating individual artifacts, deterministic internal export, seven realistic completed example workspaces, durable failed-strategy, mid-revision, and messy-import fixtures, semantic gates calibrated from multiple paper shapes, stable semantic issue IDs, a short quantitative example that exercises metric support and claim-support metadata from research through fact-check and export, live public-source claim-support coverage, demonstrated reader-feedback capture and feedback-plan routing, governance/control-paper prompt guidance validated on two compact control examples, stronger import preview/draft-ranking behavior, mandatory and re-enterable `/gpd-grill` with machine-readable completion state, reusable sanitized context packs, example/fixture indexes, separated repo conventions, private-repo release/update guidance, and package-boundary hygiene tests. The software supply-chain example now demonstrates the full grill, `READER-FEEDBACK.md` to `FEEDBACK-PLAN.md`, and backward-routing loop with a real quality fix, not just a synthetic validator path.

The installable tool is now at the 9/10 private-repo threshold, but still not finished as a distributable product. Import now has better dry-run inventory, skip-threshold control, deterministic draft-candidate ranking, first-pass `.docx` canonical-draft text extraction, unverified source-reference triage, and version/source indexing, but it is still preservation-first rather than extraction-rich for PDFs, spreadsheets, comments, tracked changes, and deep version history. External review now has a safe CLI collector plus a first `--models` provider-invocation path for installed CLIs; it shows provider-level progress while reviewers run, stores reviewer-specific captures, deduplicates combined feedback, and prints recommended handling. Claude, Codex, and Gemini are calibrated for paper review when their local CLIs are authenticated, and Opencode is intentionally unsupported for papers after local calibration proved unreliable. Local HTTP servers remain workflow/manual. The private-repo release/update path is documented and test-backed, while public or team distribution remains a later decision.

## Ratings

| Area | Rating | Rationale |
|------|--------|-----------|
| Framework design | 9.55/10 | Strong staged model, explicit paper memory, normalized classification, mandatory grill before brief, research compression, strategy gate, audience system, reader-feedback capture, feedback approval, governance/control-paper guidance, clean-paper example, imported-paper recovery example, lite update example, evidence-heavy external example, short quantitative example, and two live public-source examples. The software supply-chain example now shows feedback-mediated backward routing as a real quality rescue. Remaining gaps are richer external-review handling and more imported/messy-paper breadth. |
| Installable tool maturity | 9.25/10 | CLI covers install/update/doctor/init/import/export/next/status/validate plus `validate-artifact` and `review-external`; `STATE.json.grill` now prevents skipping pre-brief ambiguity removal; import now has dry-run inventory, classification counts, warning output, skip-threshold control, deterministic draft-candidate ranking, `.docx` canonical-draft text extraction, unverified source-reference triage, and version/source indexing; export has a regression test for pre-body draft sections; external review can be collected from files/stdin or invoked through selected installed provider CLIs, now with visible provider progress, reviewer-specific storage, combined-review deduplication, current-runtime self-review skipping, full-workspace prompt context, feedback-plan decomposition, generated recommendations, and user overrides; Claude, Codex, and Gemini are calibrated for papers, while Opencode is intentionally unsupported. Missing local HTTP server support, PDF/spreadsheet extraction, local project install mode, and public/team distribution policy keep it below a complete product. |
| Documentation | 9.55/10 | README and `docs/START-HERE.md` now follow a simpler product-story shape: why the tool exists, finished outputs, install, first paper, and the clarify/support/shape/draft/check/revise/export loop. Dense mechanics remain in `docs/DESIGN-SPEC.md`. Still needs real newcomer feedback before more onboarding changes. |
| Test coverage | 9.8/10 | Tests now cover core CLI behavior, artifact contracts including external-review collection output, malformed JSON, enum drift in state/research, exact audience scorecard dimensions, five-signal reader-feedback structure, malformed headings, non-empty grill companion artifacts, decision-record dates, PAPER-CONTEXT-to-DRAFT term consistency when both artifacts exist, workflow reference consistency, backward/incremental refresh, content-aware routing, blocked-strategy, mid-revision, and messy-import fixture behavior, export state detection, export body extraction, semantic gates including quantitative-claim support and claim-support metadata, stable semantic issue IDs, example-wide semantic validation, compact broken semantic fixture coverage, live public-source citation shape, reader-feedback demonstration artifacts, and seven realistic completed example fixtures. Still needs broader real-paper calibration. |
| Release readiness | 8.8/10 | Package metadata, changelog, CI, license, dry-run install checks, package dry-run, explicit package allowlist, release checklist, version policy, compatibility policy, private GitHub install/update flow, and `release:check` are in place. Remaining gap is a public/team distribution story. |

## What Works

- The project boundary is clear: framework package, installed runtime, and paper workspace are separate.
- `.paper/` gives the workflow durable memory without relying on chat history.
- `STATE.json` as the machine-readable source of truth is the right direction, and it now includes mandatory grill completion state.
- `gpd next`, `gpd status`, `gpd validate`, and `gpd validate-artifact` give useful visibility into the next action, workspace health, and artifact health.
- Artifact contracts now protect key JSON and Markdown outputs, including the fixed seven-dimension audience scorecard, non-empty grill companion artifacts, dated paper decision records, and canonical-term consistency between `PAPER-CONTEXT.md` and `DRAFT.md` when both exist.
- `READER-FEEDBACK.md` now captures human/model reader feedback in a fixed five-signal structure before it becomes revision work.
- `examples/software-supply-chain-evidence-pack` now demonstrates `READER-FEEDBACK.md` and `FEEDBACK-PLAN.md` end to end: low evidence/ask-clarity scores triggered a plan, approval gate, backward routing to research, and a stronger final memo.
- Control/governance-paper guidance is now reusable across brief, outline, draft, fact-check, review, agents, and rubrics: papers that propose controls, gates, standards, reviews, records, or operating mechanisms must define the governed object, durable record, evidence currency, refresh triggers, decision rule, standards framing, and process-burden answer.
- `examples/public-ai-control-baseline` now acts as a second compact governance calibration point, proving the same checks can apply without turning a decision memo into a white paper.
- Non-governance examples now have regression coverage proving the governance/control scaffold does not leak into ordinary strategy, update, or quantitative memo shapes.
- Workflow consistency tests reduce the risk of broken command/workflow/template/agent references.
- Scenario routing tests now protect backward movement when upstream artifacts change after downstream work exists.
- Content-aware routing tests now cover fact-check recommended next action, review revise/rework verdicts, reader feedback routing, and pending feedback-plan approval.
- `gpd status` no longer lets saved `STATE.json` next commands skip structurally required artifacts.
- `gpd status` now recognizes `.paper/exports/FINAL.md`, detects stale exports, and routes completed exports to `/gpd-status`.
- `gpd export` provides a deterministic CLI path for internal Markdown export after a `Ready` review verdict.
- `gpd review-external` provides a deterministic CLI path for capturing external review text from files/stdin or selected installed provider CLIs, stores reviewer-specific captures under `.paper/external-reviews/`, sends reviewers full workspace context, writes a combined deduplicated `EXTERNAL-REVIEWS.md` and `FEEDBACK-PLAN.md`, decomposes captured concerns into recommended approval rows with user override, skips the current runtime's own provider when identified, then routes to the pending approval gate.
- Claude, Codex, and Gemini provider paths are calibrated on synthetic and live private-paper trials. Opencode is intentionally unsupported for paper review.
- `gpd validate-artifact` now recognizes `EXTERNAL-REVIEWS.md`, so the new review collector has a matching structural contract.
- `gpd status` now treats pending feedback-plan approval as a user gate before stale mtime refresh rules, as long as setup exists and strategy is not blocked.
- `gpd validate --semantic` now catches stale BRIEF evidence placeholders, source-sensitive imported drafts without source mapping, mixed-audience drafts missing audience review, recurring draft terms used repeatedly before definition, planned source-type gaps, missing counterevidence rationale, export metadata leakage, STATE drift, weak low-score review instructions, reasoning-spine restatement, generic audience-conflict rows, missing safe-claim sources, fact-check source/evidence mismatch for strategic or recommendation claims, safe claims that cite sources marked only topically related in research claim-support metadata, precise quantitative claims without enough source/context/support, generic recommendations without concrete examples, and clustered or artifact-dense list-heavy prose. Semantic JSON output includes stable issue IDs for regression assertions.
- `examples/data-products-ai-scaling` gives users and tests a realistic completed clean-paper workspace.
- `examples/technology-lifecycle-management` gives users and tests an anonymized imported-paper recovery workspace without committing the private source draft.
- `examples/weekly-platform-update` gives users and tests a lite internal update workspace where research and fact-check artifacts are intentionally absent.
- `examples/responsible-ai-controls` gives users and tests an external, evidence-heavy workspace with required research, counterevidence, fact-check, and audience review.
- `examples/platform-review-cycle-metrics` gives users and tests a short quantitative internal memo with baseline, sample, timeframe, source IDs, claim-support metadata, fact-check, review, expected findings, and bounded export claims.
- `examples/public-ai-control-baseline` gives users and tests a compact real-public-source workspace with NIST, OWASP, and NCSC/CISA source URLs, source verification notes, claim-support metadata, fact-check, review, and exported citations.
- `examples/software-supply-chain-evidence-pack` is the current showcase example: a pre-registered real-public-source workspace with README, EXPECTED-FINDINGS, PAPER-CONTEXT, DECISIONS, READER-FEEDBACK, FEEDBACK-PLAN, CISA, NIST, SLSA, OpenSSF, OWASP, and NCSC source URLs, claim-support metadata, control-process revision, high-risk scope definition, AI runtime evidence, decision rules, validation model, process-burden handling, fact-check, review, and exported citations.
- `examples/README.md` and `tests/fixtures/README.md` now explain what each example/fixture proves. New examples should include grill companion artifacts; older examples are explicitly grandfathered unless backfilling teaches a real workflow lesson.
- Short command files such as `commands/gpd/new.md`, `commands/gpd/import.md`, and `commands/gpd/status.md` are canonical; duplicate long-form slash commands were removed before first external use.
- `gpd validate --semantic` now has a documented two-layer model: artifact-contract validation in `bin/lib/validate.js`, followed by semantic lint-style checks in `bin/lib/semantic.js`.
- The completed examples are covered by semantic validation and normalized-checkout routing tests.
- The imported-paper recovery example has a dedicated test for anonymization/source boundary, mixed-audience config, clean semantic validation, and completed routing.
- The exporter now correctly ignores pre-body draft sections when `## Draft Body` exists.
- The npm package now has an explicit allowlist and package hygiene test, so ignored feedback files, RFC drafts, tests, and private profile templates do not enter the installable package.
- `docs/RELEASE.md` now defines the private-repo release checklist, version policy, compatibility policy, update flow, package boundary, and release record expectations; `npm run release:check` provides a single release validation command.
- Import is preservation-first and does not silently convert or overwrite downstream artifacts.
- The strategy gate gives the system a useful way to stop weak papers before research or drafting.
- The failed-strategy-gate fixture now proves that blocked strategy states remain visible, fail validation clearly, and route back to `/gpd-brief` without creating downstream artifacts.
- The mid-revision fixture now proves that a structurally valid paper can keep downstream artifacts while fact-check routes the next action back to `/gpd-research`.
- The messy-import fixture now proves CLI import preserves mixed draft/source/review material, classifies `source/` and `sources/` as research-like material, avoids generating downstream artifacts, keeps strategy blocked, routes imported author intent to `/gpd-grill`, and exposes source-sensitive imported claims for later research/fact-check.
- `/gpd-grill` now provides a mandatory pre-brief interrogation step for all new and imported papers and remains available later as a re-entry workflow when brainstorming or agent review exposes new ambiguity. It asks one question at a time, challenges fuzzy terms, records resolved language in `PAPER-CONTEXT.md`, records hard-to-reconstruct paper decisions in `DECISIONS.md`, and marks completion in `STATE.json.grill` only when the required decision keys are resolved.
- `contexts/` provides an optional sanitized reuse layer for cross-paper language and decision patterns without making private paper context globally reusable by default.
- `gpd import --dry-run` now gives a useful import preview: copied/skipped counts, total copied size, classification counts, warnings, and canonical draft candidate. `.paper/IMPORT.md` records the same inventory plus draft-candidate scoring.
- `gpd import` now extracts plain paragraph text from the selected `.docx` canonical draft into `.paper/DRAFT.md`, while preserving the original `.docx` unchanged under `original/` and recording extraction provenance in `.paper/IMPORT.md`.
- `gpd import` now detects unverified source-reference candidates from Markdown, text, and `.docx` material, records them in `.paper/IMPORT.md`, and explicitly leaves verification to `/gpd-research` or `/gpd-fact-check`.
- `gpd import` now writes a `Version / Source Index` so copied files are grouped by likely role, ranking signal, modified time, downstream stage, and rationale without generating downstream artifacts.
- The README now acts as a product front door with a short product story and workflow loop, while `docs/START-HERE.md` gives a first-paper path through examples, install, setup, `gpd next`, `/gpd-status`, workflow commands, feedback, and import.

## Main Risks

1. Real-paper behavior now has seven examples plus targeted fixtures, but still not enough breadth. Live public-source claim-support metadata is represented in two compact examples, and the latest calibration review has been turned into reusable control/governance guidance across prompts and templates. It has now been checked against a second compact governance memo and guarded against leaking into three non-governance examples, but it still should not become deterministic semantic validation until a broader paper shape exposes a concrete, reliably detectable failure.
2. Import classification is useful but still shallow. Current import preserves and catalogs messy material, previews large imports, ranks draft candidates deterministically, extracts plain text from the selected `.docx` canonical draft, records unverified source-reference candidates, indexes copied files by role, and routes author-intent recovery through mandatory `/gpd-grill`; it still does not deeply extract PDFs, spreadsheets, diagrams, comments, tracked changes, or version history.
3. Semantic validation is improving from actual example feedback. It now catches several deterministic quality failures, but the gates still cannot judge full argument quality, citation fidelity, or prose distinctiveness. The current prose-saturation calibration intentionally allows load-bearing definitional enumerations; see [SEMANTIC-CALIBRATION.md](SEMANTIC-CALIBRATION.md).
4. State enum policy is now intentionally tighter and centrally tested. That prevents typo drift, but future blocker/action additions must go through the shared contract and workflow consistency tests.
5. External review is now tool-wrapped for collection and first-pass installed-provider invocation with visible provider progress. Claude, Codex, and Gemini are calibrated for paper review when their local CLIs are authenticated; Opencode is intentionally unsupported for papers; local HTTP providers such as Ollama, LM Studio, and llama.cpp remain workflow/manual.
6. Release readiness remains private-repo oriented. The local/private release path is now documented and test-backed, but a public or team-facing release still needs a distribution decision.
7. Classification is not yet used by the CLI routing engine. It is enforced in schema, templates, workflows, docs, and examples, but `gpd status` still routes mostly from artifact state, strategy state, mtimes, review/fact-check state, and export state.
8. Feedback files intentionally remain ignored rather than archived in tracked docs. Useful feedback should be converted into anonymized issues, examples, fixtures, or documentation updates; raw feedback should not become package material.
9. Semantic validation does not yet drive routing. `gpd validate --semantic` can detect paper-quality failures, but `gpd next` still routes from artifact presence, strategy state, mtimes, fact-check/review verdicts, feedback-plan approval, and export state. Decide whether semantic failures should become routing blockers after the next real-paper trial.
10. Context packs are installed and documented, but there is no CLI discovery command such as `gpd list-contexts`. For now, users inspect `contexts/` directly and `/gpd-grill` treats reusable context as optional.

## Recommended Next Work

1. Run the next real-paper trial, then decide whether semantic validation and classification should affect `gpd next` routing.
2. Get real newcomer feedback on the slimmer README, `START-HERE`, `gpd next`, and `/gpd-status` before adding more onboarding surface.
3. Harden `gpd import` around non-DOCX source conversion only when real use exposes the need.
4. Add richer fixture workspaces only when they represent a new failure mode, not just more routing signals.
5. Expand semantic lint-style checks or classification-driven validators only where they are concrete enough to be useful; defer noisy heuristics until examples exist.
6. Decide whether public/team distribution is needed, and if so define publishing, tagging, and support policy.
7. Broaden external-review provider support only after another real paper trial proves a concrete need; local HTTP providers remain manual for now.
8. Decide whether `contexts/` needs `gpd list-contexts` after more than one reusable context pack exists.

## Verification

Commands run during the latest review:

```bash
npm run release:check
git diff --check
```

Both passed after the review/comment UX, external-review storage, combined deduplication, and documentation updates.
