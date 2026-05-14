# Project Review

Review date: 2026-05-14
Last reviewed: 2026-05-14

This file is the current project-health snapshot. The forward plan lives in [../ROADMAP.md](../ROADMAP.md).

## Summary Rating

**Overall: 9.4/10 as a writing framework; 9.09/10 as an installable private-repo tool**

Get Paper Done is now a strong writing workflow framework with a real showcase example. The project has a clearer README with a stronger product story, a newcomer `START-HERE` guide, artifact contracts, JSON schema validation, workflow consistency tests, content-aware scenario routing tests, CLI support for validating individual artifacts, deterministic internal export, seven realistic completed example workspaces, durable failed-strategy, mid-revision, and messy-import fixtures, semantic gates calibrated from multiple paper shapes, stable semantic issue IDs, a short quantitative example that exercises metric support and claim-support metadata from research through fact-check and export, live public-source claim-support coverage, demonstrated reader-feedback capture and feedback-plan routing, governance/control-paper prompt guidance validated on two compact control examples, stronger import preview/draft-ranking behavior, private-repo release/update guidance, and package-boundary hygiene tests. The software supply-chain example now demonstrates the full `READER-FEEDBACK.md` to `FEEDBACK-PLAN.md` to backward-routing loop with a real quality fix, not just a synthetic validator path.

The installable tool is now at the 9/10 private-repo threshold, but still not finished as a distributable product. Import now has better dry-run inventory, skip-threshold control, deterministic draft-candidate ranking, first-pass `.docx` canonical-draft text extraction, unverified source-reference triage, and version/source indexing, but it is still preservation-first rather than extraction-rich for PDFs, spreadsheets, comments, tracked changes, and deep version history. External review now has a safe CLI collector plus a first `--models` provider-invocation path for installed CLIs; Claude and Codex have been calibrated on synthetic public papers, while Gemini/opencode and local HTTP servers still need calibration if they become important. The private-repo release/update path is documented and test-backed, while public or team distribution remains a later decision.

## Ratings

| Area | Rating | Rationale |
|------|--------|-----------|
| Framework design | 9.5/10 | Strong staged model, explicit paper memory, normalized classification, research compression, strategy gate, audience system, reader-feedback capture, feedback approval, governance/control-paper guidance, clean-paper example, imported-paper recovery example, lite update example, evidence-heavy external example, short quantitative example, and two live public-source examples. The software supply-chain example now shows feedback-mediated backward routing as a real quality rescue. Remaining gaps are richer external-review handling and more imported/messy-paper breadth. |
| Installable tool maturity | 9.09/10 | CLI covers install/update/doctor/init/import/export/status/validate plus `validate-artifact` and `review-external`; import now has dry-run inventory, classification counts, warning output, skip-threshold control, deterministic draft-candidate ranking, `.docx` canonical-draft text extraction, unverified source-reference triage, and version/source indexing; export has a regression test for pre-body draft sections; external review can be collected from files/stdin or invoked through selected installed provider CLIs, with Claude and Codex calibrated on synthetic public papers. Missing broader real-provider calibration, local HTTP server support, PDF/spreadsheet extraction, local project install mode, and public/team distribution policy keep it below a complete product. |
| Documentation | 9.4/10 | README now leads with product story, key benefits, fit/non-fit guidance, CLI vs slash commands, setup, state changes, gates, backward routing, import, export, artifact contracts, and examples. `docs/START-HERE.md` gives newcomers a shorter first-paper path, and the strongest example now has a README plus `EXPECTED-FINDINGS.md`. Still needs a guided walkthrough if onboarding remains dense. |
| Test coverage | 9.8/10 | Tests now cover core CLI behavior, artifact contracts including external-review collection output, malformed JSON, enum drift in state/research, exact audience scorecard dimensions, five-signal reader-feedback structure, malformed headings, workflow reference consistency, backward/incremental refresh, content-aware routing, blocked-strategy, mid-revision, and messy-import fixture behavior, export state detection, export body extraction, semantic gates including quantitative-claim support and claim-support metadata, stable semantic issue IDs, example-wide semantic validation, compact broken semantic fixture coverage, live public-source citation shape, reader-feedback demonstration artifacts, and seven realistic completed example fixtures. Still needs broader real-paper calibration. |
| Release readiness | 8.8/10 | Package metadata, changelog, CI, license, dry-run install checks, package dry-run, explicit package allowlist, release checklist, version policy, compatibility policy, private GitHub install/update flow, and `release:check` are in place. Remaining gap is a public/team distribution story. |

## What Works

- The project boundary is clear: framework package, installed runtime, and paper workspace are separate.
- `.paper/` gives the workflow durable memory without relying on chat history.
- `STATE.json` as the machine-readable source of truth is the right direction.
- `gpd status`, `gpd validate`, and `gpd validate-artifact` give useful visibility into workspace and artifact health.
- Artifact contracts now protect key JSON and Markdown outputs, including the fixed seven-dimension audience scorecard.
- `READER-FEEDBACK.md` now captures human/model reader feedback in a fixed five-signal structure before it becomes revision work.
- `examples/software-supply-chain-evidence-pack` now demonstrates `READER-FEEDBACK.md` and `FEEDBACK-PLAN.md` end to end: low evidence/ask-clarity scores triggered a plan, approval gate, backward routing to research, and a stronger final memo.
- Control/governance-paper guidance is now reusable across brief, outline, draft, fact-check, review, agents, and rubrics: papers that propose controls, gates, standards, reviews, records, or operating mechanisms must define the governed object, durable record, evidence currency, refresh triggers, decision rule, standards framing, and process-burden answer.
- `examples/public-ai-control-baseline` now acts as a second compact governance calibration point, proving the same checks can apply without turning a decision memo into a white paper.
- Non-governance examples now have regression coverage proving the governance/control scaffold does not leak into ordinary strategy, update, or quantitative memo shapes.
- Workflow consistency tests reduce the risk of broken command/workflow/template/agent references.
- Scenario routing tests now protect backward movement when upstream artifacts change after downstream work exists.
- Content-aware routing tests now cover fact-check recommended next action, review revise/rework verdicts, reader feedback routing, and pending feedback-plan approval.
- `gpd status` no longer lets saved `STATE.json` next commands skip structurally required artifacts.
- `gpd status` now recognizes `.paper/exports/FINAL.md`, detects stale exports, and routes completed exports to `/gpd-progress`.
- `gpd export` provides a deterministic CLI path for internal Markdown export after a `Ready` review verdict.
- `gpd review-external` provides a deterministic CLI path for capturing external review text from files/stdin or selected installed provider CLIs into `EXTERNAL-REVIEWS.md` and `FEEDBACK-PLAN.md`, then routes to the pending approval gate.
- `gpd validate-artifact` now recognizes `EXTERNAL-REVIEWS.md`, so the new review collector has a matching structural contract.
- `gpd status` now treats pending feedback-plan approval as a user gate before stale mtime refresh rules, as long as setup exists and strategy is not blocked.
- `gpd validate --semantic` now catches stale BRIEF evidence placeholders, source-sensitive imported drafts without source mapping, mixed-audience drafts missing audience review, recurring draft terms used repeatedly before definition, planned source-type gaps, missing counterevidence rationale, export metadata leakage, STATE drift, weak low-score review instructions, reasoning-spine restatement, generic audience-conflict rows, missing safe-claim sources, fact-check source/evidence mismatch for strategic or recommendation claims, safe claims that cite sources marked only topically related in research claim-support metadata, precise quantitative claims without enough source/context/support, generic recommendations without concrete examples, and clustered or artifact-dense list-heavy prose. Semantic JSON output includes stable issue IDs for regression assertions.
- `examples/data-products-ai-scaling` gives users and tests a realistic completed clean-paper workspace.
- `examples/technology-lifecycle-management` gives users and tests an anonymized imported-paper recovery workspace without committing the private source draft.
- `examples/weekly-platform-update` gives users and tests a lite internal update workspace where research and fact-check artifacts are intentionally absent.
- `examples/responsible-ai-controls` gives users and tests an external, evidence-heavy workspace with required research, counterevidence, fact-check, and audience review.
- `examples/platform-review-cycle-metrics` gives users and tests a short quantitative internal memo with baseline, sample, timeframe, source IDs, claim-support metadata, fact-check, review, expected findings, and bounded export claims.
- `examples/public-ai-control-baseline` gives users and tests a compact real-public-source workspace with NIST, OWASP, and NCSC/CISA source URLs, source verification notes, claim-support metadata, fact-check, review, and exported citations.
- `examples/software-supply-chain-evidence-pack` is the current showcase example: a pre-registered real-public-source workspace with README, EXPECTED-FINDINGS, READER-FEEDBACK, FEEDBACK-PLAN, CISA, NIST, SLSA, OpenSSF, OWASP, and NCSC source URLs, claim-support metadata, control-process revision, high-risk scope definition, AI runtime evidence, decision rules, validation model, process-burden handling, fact-check, review, and exported citations.
- The completed examples are covered by semantic validation and normalized-checkout routing tests.
- The imported-paper recovery example has a dedicated test for anonymization/source boundary, mixed-audience config, clean semantic validation, and completed routing.
- The exporter now correctly ignores pre-body draft sections when `## Draft Body` exists.
- The npm package now has an explicit allowlist and package hygiene test, so ignored feedback files, RFC drafts, tests, and private profile templates do not enter the installable package.
- `docs/RELEASE.md` now defines the private-repo release checklist, version policy, compatibility policy, update flow, package boundary, and release record expectations; `npm run release:check` provides a single release validation command.
- Import is preservation-first and does not silently convert or overwrite downstream artifacts.
- The strategy gate gives the system a useful way to stop weak papers before research or drafting.
- The failed-strategy-gate fixture now proves that blocked strategy states remain visible, fail validation clearly, and route back to `/gpd-brief` without creating downstream artifacts.
- The mid-revision fixture now proves that a structurally valid paper can keep downstream artifacts while fact-check routes the next action back to `/gpd-research`.
- The messy-import fixture now proves CLI import preserves mixed draft/source/review material, classifies `source/` and `sources/` as research-like material, avoids generating downstream artifacts, keeps strategy blocked, and exposes source-sensitive imported claims for later research/fact-check.
- `gpd import --dry-run` now gives a useful import preview: copied/skipped counts, total copied size, classification counts, warnings, and canonical draft candidate. `.paper/IMPORT.md` records the same inventory plus draft-candidate scoring.
- `gpd import` now extracts plain paragraph text from the selected `.docx` canonical draft into `.paper/DRAFT.md`, while preserving the original `.docx` unchanged under `original/` and recording extraction provenance in `.paper/IMPORT.md`.
- `gpd import` now detects unverified source-reference candidates from Markdown, text, and `.docx` material, records them in `.paper/IMPORT.md`, and explicitly leaves verification to `/gpd-research` or `/gpd-fact-check`.
- `gpd import` now writes a `Version / Source Index` so copied files are grouped by likely role, ranking signal, modified time, downstream stage, and rationale without generating downstream artifacts.
- The README now leads with product story and value before reference material, while `docs/START-HERE.md` gives a concise newcomer path through install, first paper setup, profile, audience, workflow commands, status, and import.

## Main Risks

1. Real-paper behavior now has seven examples plus targeted fixtures, but still not enough breadth. Live public-source claim-support metadata is represented in two compact examples, and the latest calibration review has been turned into reusable control/governance guidance across prompts and templates. It has now been checked against a second compact governance memo and guarded against leaking into three non-governance examples, but it still should not become deterministic semantic validation until a broader paper shape exposes a concrete, reliably detectable failure.
2. Import classification is useful but still shallow. Current import preserves and catalogs messy material, previews large imports, ranks draft candidates deterministically, extracts plain text from the selected `.docx` canonical draft, records unverified source-reference candidates, and indexes copied files by role, but it does not deeply extract PDFs, spreadsheets, diagrams, comments, tracked changes, or version history.
3. Semantic validation is improving from actual example feedback. It now catches several deterministic quality failures, but the gates still cannot judge full argument quality, citation fidelity, or prose distinctiveness. The current prose-saturation calibration intentionally allows load-bearing definitional enumerations; see [SEMANTIC-CALIBRATION.md](SEMANTIC-CALIBRATION.md).
4. State enum policy is now intentionally tighter and centrally tested. That prevents typo drift, but future blocker/action additions must go through the shared contract and workflow consistency tests.
5. External review is now tool-wrapped for collection and first-pass installed-provider invocation. Claude and Codex are calibrated; Gemini/opencode still need real-provider checks, and local HTTP providers such as Ollama, LM Studio, and llama.cpp remain workflow/manual.
6. Release readiness remains private-repo oriented. The local/private release path is now documented and test-backed, but a public or team-facing release still needs a distribution decision.
7. Classification is not yet used by the CLI routing engine. It is enforced in schema, templates, workflows, docs, and examples, but `gpd status` still routes mostly from artifact state, strategy state, mtimes, review/fact-check state, and export state.

## Recommended Next Work

1. Decide whether to continue import hardening with PDF/spreadsheet handling or pause import work and return to Gemini/opencode provider calibration.
2. Use the calibration review to decide whether `START-HERE` needs a richer guided walkthrough.
3. Harden `gpd import` around non-DOCX source conversion only when real use exposes the need.
4. Add richer fixture workspaces only when they represent a new failure mode, not just more routing signals.
5. Expand semantic lint-style checks only where they are concrete enough to be useful; defer noisy heuristics until examples exist.
6. Decide whether public/team distribution is needed, and if so define publishing, tagging, and support policy.
7. Calibrate `gpd review-external --models` against Gemini/opencode before broadening to local HTTP providers.

## Verification

Commands run during the latest review:

```bash
npm run release:check
git diff --check
markdown link check
```

All passed after the import preview and draft-ranking hardening slice.
The latest external-review collection slice also passed `npm run release:check` and `git diff --check`.
