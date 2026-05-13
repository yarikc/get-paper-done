# Project Review

Review date: 2026-05-13
Last reviewed: 2026-05-13

This file is the current project-health snapshot. The forward plan lives in [../ROADMAP.md](../ROADMAP.md).

## Summary Rating

**Overall: 9.1/10 as a writing framework; 8.6/10 as an installable private-repo tool**

Get Paper Done is now past the initial credibility threshold as a writing workflow framework. The project has a clearer README with a stronger product story, a newcomer `START-HERE` guide, artifact contracts, JSON schema validation, workflow consistency tests, content-aware scenario routing tests, CLI support for validating individual artifacts, deterministic internal export, seven realistic completed example workspaces, durable failed-strategy, mid-revision, and messy-import fixtures, semantic gates calibrated from multiple paper shapes, stable semantic issue IDs, a short quantitative example that exercises metric support and claim-support metadata from research through fact-check and export, live public-source claim-support coverage, reusable reader-feedback capture, and package-boundary hygiene tests. The lifecycle imported-paper run also found and fixed a real exporter bug, which is the kind of result expected from useful trial work.

It is still not a 9/10 installable tool. Import remains preservation-first rather than extraction-rich, external review is still prompt/workflow-driven rather than a wrapped CLI capability, and the private-repo install path still depends on local package linking rather than a release/update policy. The framework quality is stronger than the packaging story.

## Ratings

| Area | Rating | Rationale |
|------|--------|-----------|
| Framework design | 9.2/10 | Strong staged model, explicit paper memory, normalized classification, research compression, strategy gate, audience system, reader-feedback capture, feedback approval, clean-paper example, imported-paper recovery example, lite update example, evidence-heavy external example, short quantitative example, and two live public-source examples. Still needs broader messy-paper calibration and stronger external-review handling. |
| Installable tool maturity | 8.4/10 | CLI covers install/update/doctor/init/import/export/status/validate plus `validate-artifact`, and export now has a regression test for pre-body draft sections. Missing external-review runner, richer import extraction, and local package/release hardening. |
| Documentation | 9.3/10 | README now leads with product story, key benefits, fit/non-fit guidance, CLI vs slash commands, setup, state changes, gates, backward routing, import, export, artifact contracts, and examples. `docs/START-HERE.md` gives newcomers a shorter first-paper path. Still needs a richer guided walkthrough based on the next real-paper calibration run. |
| Test coverage | 9.7/10 | Tests now cover core CLI behavior, artifact contracts, malformed JSON, enum drift in state/research, exact audience scorecard dimensions, five-signal reader-feedback structure, malformed headings, workflow reference consistency, backward/incremental refresh, content-aware routing, blocked-strategy, mid-revision, and messy-import fixture behavior, export state detection, export body extraction, semantic gates including quantitative-claim support and claim-support metadata, stable semantic issue IDs, example-wide semantic validation, compact broken semantic fixture coverage, live public-source citation shape, and seven realistic completed example fixtures. Still needs broader real-paper calibration. |
| Release readiness | 8.1/10 | Package metadata, changelog, CI, license, dry-run install checks, package dry-run, and an explicit package allowlist are in place. Needs release checklist, versioning/update compatibility policy, and a tighter public/private distribution story. |

## What Works

- The project boundary is clear: framework package, installed runtime, and paper workspace are separate.
- `.paper/` gives the workflow durable memory without relying on chat history.
- `STATE.json` as the machine-readable source of truth is the right direction.
- `gpd status`, `gpd validate`, and `gpd validate-artifact` give useful visibility into workspace and artifact health.
- Artifact contracts now protect key JSON and Markdown outputs, including the fixed seven-dimension audience scorecard.
- `READER-FEEDBACK.md` now captures human/model reader feedback in a fixed five-signal structure before it becomes revision work.
- Workflow consistency tests reduce the risk of broken command/workflow/template/agent references.
- Scenario routing tests now protect backward movement when upstream artifacts change after downstream work exists.
- Content-aware routing tests now cover fact-check recommended next action, review revise/rework verdicts, reader feedback routing, and pending feedback-plan approval.
- `gpd status` no longer lets saved `STATE.json` next commands skip structurally required artifacts.
- `gpd status` now recognizes `.paper/exports/FINAL.md`, detects stale exports, and routes completed exports to `/gpd-progress`.
- `gpd export` provides a deterministic CLI path for internal Markdown export after a `Ready` review verdict.
- `gpd validate --semantic` now catches stale BRIEF evidence placeholders, source-sensitive imported drafts without source mapping, mixed-audience drafts missing audience review, recurring draft terms used repeatedly before definition, planned source-type gaps, missing counterevidence rationale, export metadata leakage, STATE drift, weak low-score review instructions, reasoning-spine restatement, generic audience-conflict rows, missing safe-claim sources, fact-check source/evidence mismatch for strategic or recommendation claims, safe claims that cite sources marked only topically related in research claim-support metadata, precise quantitative claims without enough source/context/support, generic recommendations without concrete examples, and clustered or artifact-dense list-heavy prose. Semantic JSON output includes stable issue IDs for regression assertions.
- `examples/data-products-ai-scaling` gives users and tests a realistic completed clean-paper workspace.
- `examples/technology-lifecycle-management` gives users and tests an anonymized imported-paper recovery workspace without committing the private source draft.
- `examples/weekly-platform-update` gives users and tests a lite internal update workspace where research and fact-check artifacts are intentionally absent.
- `examples/responsible-ai-controls` gives users and tests an external, evidence-heavy workspace with required research, counterevidence, fact-check, and audience review.
- `examples/platform-review-cycle-metrics` gives users and tests a short quantitative internal memo with baseline, sample, timeframe, source IDs, claim-support metadata, fact-check, review, expected findings, and bounded export claims.
- `examples/public-ai-control-baseline` gives users and tests a compact real-public-source workspace with NIST, OWASP, and NCSC/CISA source URLs, source verification notes, claim-support metadata, fact-check, review, and exported citations.
- `examples/software-supply-chain-evidence-pack` gives users and tests a pre-registered real-public-source workspace with CISA, NIST, SLSA, and OpenSSF source URLs, claim-support metadata, process-burden handling, fact-check, review, and exported citations.
- The completed examples are covered by semantic validation and normalized-checkout routing tests.
- The imported-paper recovery example has a dedicated test for anonymization/source boundary, mixed-audience config, clean semantic validation, and completed routing.
- The exporter now correctly ignores pre-body draft sections when `## Draft Body` exists.
- The npm package now has an explicit allowlist and package hygiene test, so ignored feedback files, RFC drafts, tests, and private profile templates do not enter the installable package.
- Import is preservation-first and does not silently convert or overwrite downstream artifacts.
- The strategy gate gives the system a useful way to stop weak papers before research or drafting.
- The failed-strategy-gate fixture now proves that blocked strategy states remain visible, fail validation clearly, and route back to `/gpd-brief` without creating downstream artifacts.
- The mid-revision fixture now proves that a structurally valid paper can keep downstream artifacts while fact-check routes the next action back to `/gpd-research`.
- The messy-import fixture now proves CLI import preserves mixed draft/source/review material, classifies `source/` and `sources/` as research-like material, avoids generating downstream artifacts, keeps strategy blocked, and exposes source-sensitive imported claims for later research/fact-check.
- The README now leads with product story and value before reference material, while `docs/START-HERE.md` gives a concise newcomer path through install, first paper setup, profile, audience, workflow commands, status, and import.

## Main Risks

1. Real-paper behavior now has seven examples plus targeted fixtures, but still not enough breadth. Live public-source claim-support metadata is represented in two compact examples; the next evidence gap is review of the new calibration output for quality failures that validators do not catch.
2. Import classification is useful but still shallow. Current import preserves and catalogs messy material better, but does not deeply extract `.docx`, PDFs, spreadsheets, diagrams, citations, or version history.
3. Semantic validation is improving from actual example feedback. It now catches several deterministic quality failures, but the gates still cannot judge full argument quality, citation fidelity, or prose distinctiveness.
4. State enum policy is now intentionally tighter and centrally tested. That prevents typo drift, but future blocker/action additions must go through the shared contract and workflow consistency tests.
5. External review is workflow-documented but not tool-wrapped. Users still need runtime/model-specific manual steps for multi-model review.
6. Release readiness remains private-repo oriented. The install flow assumes local `npm link`; a public or team-facing release needs clearer versioning and update guarantees.
7. Classification is not yet used by the CLI routing engine. It is enforced in schema, templates, workflows, docs, and examples, but `gpd status` still routes mostly from artifact state, strategy state, mtimes, review/fact-check state, and export state.

## Recommended Next Work

1. Review the new `software-supply-chain-evidence-pack` calibration output for quality failures that validators do not catch.
2. Use that calibration review to decide whether `START-HERE` needs a richer guided walkthrough.
3. Harden `gpd import` around large-folder previews, document extraction, citation extraction, and richer manifest details.
4. Add richer fixture workspaces only when they represent a new failure mode, not just more routing signals.
5. Expand semantic lint-style checks only where they are concrete enough to be useful; defer noisy heuristics until examples exist.
6. Add a release checklist, versioning policy, and update compatibility notes.
7. Build `gpd review-external` only after the manual external-review workflow has been proven on a real paper.

## Verification

Commands run during review:

```bash
npm run check
npm pack --dry-run --cache /tmp/gpd-npm-cache
git diff --check
```

All passed after the software supply-chain public-source calibration example was added.
