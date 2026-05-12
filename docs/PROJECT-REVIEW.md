# Project Review

Review date: 2026-05-12
Last reviewed: 2026-05-12

This file is the current project-health snapshot. The forward plan lives in [../ROADMAP.md](../ROADMAP.md).

## Summary Rating

**Overall: 9.0/10 as a writing framework; 8.6/10 as an installable private-repo tool**

Get Paper Done is now past the initial credibility threshold as a writing workflow framework. The project has a clearer README, artifact contracts, JSON schema validation, workflow consistency tests, content-aware scenario routing tests, CLI support for validating individual artifacts, deterministic internal export, four realistic completed example workspaces, and semantic gates calibrated from multiple paper shapes. The lifecycle imported-paper run also found and fixed a real exporter bug, which is the kind of result expected from useful trial work.

It is still not a 9/10 installable tool. Import remains preservation-first rather than extraction-rich, external review is still prompt/workflow-driven rather than a wrapped CLI capability, and the private-repo install path still depends on local package linking rather than a release/update policy. The framework quality is stronger than the packaging story.

## Ratings

| Area | Rating | Rationale |
|------|--------|-----------|
| Framework design | 9.1/10 | Strong staged model, explicit paper memory, research compression, strategy gate, audience system, feedback approval, clean-paper example, imported-paper recovery example, lite update example, and evidence-heavy external example. Still needs broader messy-paper calibration and stronger external-review handling. |
| Installable tool maturity | 8.4/10 | CLI covers install/update/doctor/init/import/export/status/validate plus `validate-artifact`, and export now has a regression test for pre-body draft sections. Missing external-review runner, richer import extraction, and local package/release hardening. |
| Documentation | 9.1/10 | README now explains the core idea, CLI vs slash commands, setup, state changes, gates, backward routing, import, export, artifact contracts, and clean/imported/lite/external examples. Still needs a guided walkthrough. |
| Test coverage | 9.4/10 | Tests now cover core CLI behavior, artifact contracts, malformed JSON, enum drift in state/research, exact audience scorecard dimensions, malformed headings, workflow reference consistency, backward/incremental refresh, content-aware routing, export state detection, export body extraction, semantic gates, example-wide semantic validation, compact broken semantic fixture coverage, and four realistic completed example fixtures. Still needs broader fixture diversity around quantitative claims and real public-source citation fidelity. |
| Release readiness | 7.8/10 | Package metadata, changelog, CI, license, dry-run install checks, and package dry-run are in place. Needs release checklist, versioning/update compatibility policy, and a tighter public/private distribution story. |

## What Works

- The project boundary is clear: framework package, installed runtime, and paper workspace are separate.
- `.paper/` gives the workflow durable memory without relying on chat history.
- `STATE.json` as the machine-readable source of truth is the right direction.
- `gpd status`, `gpd validate`, and `gpd validate-artifact` give useful visibility into workspace and artifact health.
- Artifact contracts now protect key JSON and Markdown outputs, including the fixed seven-dimension audience scorecard.
- Workflow consistency tests reduce the risk of broken command/workflow/template/agent references.
- Scenario routing tests now protect backward movement when upstream artifacts change after downstream work exists.
- Content-aware routing tests now cover fact-check recommended next action, review revise/rework verdicts, and pending feedback-plan approval.
- `gpd status` no longer lets saved `STATE.json` next commands skip structurally required artifacts.
- `gpd status` now recognizes `.paper/exports/FINAL.md`, detects stale exports, and routes completed exports to `/gpd-progress`.
- `gpd export` provides a deterministic CLI path for internal Markdown export after a `Ready` review verdict.
- `gpd validate --semantic` now catches stale BRIEF evidence placeholders, source-sensitive imported drafts without source mapping, mixed-audience drafts missing audience review, recurring draft terms used repeatedly before definition, planned source-type gaps, missing counterevidence rationale, export metadata leakage, STATE drift, weak low-score review instructions, reasoning-spine restatement, generic audience-conflict rows, missing safe-claim sources, fact-check source/evidence mismatch for strategic or recommendation claims, generic recommendations without concrete examples, and clustered or artifact-dense list-heavy prose.
- `examples/data-products-ai-scaling` gives users and tests a realistic completed clean-paper workspace.
- `examples/technology-lifecycle-management` gives users and tests an anonymized imported-paper recovery workspace without committing the private source draft.
- `examples/weekly-platform-update` gives users and tests a lite internal update workspace where research and fact-check artifacts are intentionally absent.
- `examples/responsible-ai-controls` gives users and tests an external, evidence-heavy workspace with required research, counterevidence, fact-check, and audience review.
- The completed examples are covered by semantic validation and normalized-checkout routing tests.
- The exporter now correctly ignores pre-body draft sections when `## Draft Body` exists.
- Import is preservation-first and does not silently convert or overwrite downstream artifacts.
- The strategy gate gives the system a useful way to stop weak papers before research or drafting.
- The README now explains the actual user workflow instead of only listing commands.

## Main Risks

1. Real-paper behavior now has four examples, but still not enough breadth. The next tests should cover harder quantitative claims and real public-source citation fidelity.
2. Import classification is useful but shallow. Current import preserves and catalogs material, but does not deeply extract `.docx`, PDFs, spreadsheets, diagrams, citations, or version history.
3. Semantic validation is improving from actual example feedback. It now catches several deterministic quality failures, but the gates still cannot judge full argument quality, citation fidelity, or prose distinctiveness.
4. State enum policy is now intentionally tighter and centrally tested. That prevents typo drift, but future blocker/action additions must go through the shared contract and workflow consistency tests.
5. External review is workflow-documented but not tool-wrapped. Users still need runtime/model-specific manual steps for multi-model review.
6. Release readiness remains private-repo oriented. The install flow assumes local `npm link`; a public or team-facing release needs clearer versioning and update guarantees.

## Recommended Next Work

1. Add richer fixture workspaces with realistic artifact bodies, not just minimal routing signals.
2. Run a quantitatively heavy paper with a different failure profile before adding more same-example semantic checks.
3. Harden `gpd import` around canonical draft selection, large-folder previews, document extraction, and richer manifest details.
4. Add fixture-based end-to-end tests that validate representative completed workspaces with real artifact bodies.
5. Expand semantic lint-style checks only where they are concrete enough to be useful; defer noisy heuristics until examples exist.
6. Add a release checklist, versioning policy, and update compatibility notes.
7. Build `gpd review-external` only after the manual external-review workflow has been proven on a real paper.

## Verification

Commands run during review:

```bash
npm test
npm run check
```

Both passed after the lifecycle imported-paper example, exporter fix, lite update fixture, and evidence-heavy external fixture.
