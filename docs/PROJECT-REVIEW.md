# Project Review

Review date: 2026-05-11
Last reviewed: 2026-05-11

This file is the current project-health snapshot. The forward plan lives in [../ROADMAP.md](../ROADMAP.md).

## Summary Rating

**Overall: 8.8/10**

Get Paper Done is a coherent, useful writing workflow framework with a practical CLI wrapper and a stronger documentation surface than the initial release. The project now has a clearer README, artifact contracts, JSON schema validation, workflow consistency tests, content-aware scenario routing tests, CLI support for validating individual artifacts, first-pass semantic validation, deterministic internal export, and one completed diagnostic paper run.

It is still not a 9/10 tool. The core workflow has only one diagnostic trial, complete examples are missing, semantic validation has only been proven on one refreshed trial, import remains preservation-first rather than extraction-rich, and external review is still prompt/workflow-driven rather than a wrapped CLI capability.

## Ratings

| Area | Rating | Rationale |
|------|--------|-----------|
| Framework design | 8.8/10 | Strong staged model, explicit paper memory, research compression, strategy gate, audience system, and feedback approval. One diagnostic paper run completed; still needs broader messy-paper calibration. |
| Installable tool maturity | 8.3/10 | CLI covers install/update/doctor/init/import/export/status/validate plus `validate-artifact`. Runtime install is clearer and asset copying is tested. Missing external-review runner, richer import extraction, and local package/release hardening. |
| Documentation | 8.8/10 | README now explains the core idea, CLI vs slash commands, setup, state changes, gates, backward routing, import, export, and artifact contracts. Still needs concrete walkthroughs, screenshots/examples, and a complete sample paper workspace. |
| Test coverage | 8.9/10 | Tests now cover core CLI behavior, artifact contracts, malformed JSON, enum drift in state/research, exact audience scorecard dimensions, malformed headings, workflow reference consistency, backward/incremental refresh, content-aware routing, export state detection, and first-pass semantic gates. Still missing real paper fixtures and rerun examples that pass semantic validation. |
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
- `gpd validate --semantic` now catches stale BRIEF evidence placeholders, planned source-type gaps, missing counterevidence rationale, export metadata leakage, STATE drift, and weak low-score review instructions.
- Import is preservation-first and does not silently convert or overwrite downstream artifacts.
- The strategy gate gives the system a useful way to stop weak papers before research or drafting.
- The README now explains the actual user workflow instead of only listing commands.

## Main Risks

1. Real-paper behavior has one complete diagnostic trial, but not enough breadth. The next test should import a messy existing paper and run it through brief, strategy, research, outline, draft, fact-check, review, revise, and export.
2. Examples are missing. New users can understand the concepts, but they cannot yet inspect a complete high-quality paper workspace.
3. Import classification is useful but shallow. Current import preserves and catalogs material, but does not deeply extract `.docx`, PDFs, spreadsheets, diagrams, citations, or version history.
4. Semantic validation is only first-pass. It catches concrete lint-style failures, but it still cannot judge full argument quality, citation fidelity, or prose distinctiveness.
5. State enum policy is now intentionally tighter and centrally tested. That prevents typo drift, but future blocker/action additions must go through the shared contract and workflow consistency tests.
6. External review is workflow-documented but not tool-wrapped. Users still need runtime/model-specific manual steps for multi-model review.
7. Release readiness remains private-repo oriented. The install flow assumes local `npm link`; a public or team-facing release needs clearer versioning and update guarantees.

## Recommended Next Work

1. Add `examples/` with one new-paper workspace and one imported-paper workspace, starting from the refreshed one-paper diagnostic trial.
2. Add a regression fixture that runs `gpd validate --semantic` against the example and expects a clean result.
3. Add richer fixture workspaces with realistic artifact bodies, not just minimal routing signals.
4. Harden `gpd import` around canonical draft selection, large-folder previews, document extraction, and richer manifest details.
5. Add fixture-based end-to-end tests that validate representative completed workspaces with real artifact bodies.
6. Expand semantic lint-style checks only where they are concrete enough to be useful; defer noisy heuristics until examples exist.
7. Add a release checklist, versioning policy, and update compatibility notes.
8. Build `gpd review-external` only after the manual external-review workflow has been proven on a real paper.

## Verification

Commands run during review:

```bash
npm test
npm run check
```

Both passed after the artifact-contract and README updates.
