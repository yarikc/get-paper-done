# Get Paper Done Upgrade Plan

Goal: raise the project to **9/10 as a writing framework** and **9/10 as an installable tool**.

Last reviewed: 2026-05-12

This file is the forward plan. The current ratings, risk snapshot, and review findings live in [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md). When the review changes, update that snapshot first and adjust this roadmap only when the plan itself changes.

## Current Assessment

- Current snapshot: [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md)
- Current rating: 9.1/10 as a writing framework and 8.6/10 as an installable private-repo tool as of 2026-05-12
- Target: 9/10 as a writing framework and 9/10 as an installable tool

The artifact model, command surface, install/update/export CLI, workspace helpers, artifact contracts, first-pass semantic validation, five realistic completed examples, workflow consistency tests, routing scenario tests, content-aware status routing, export-state detection, and quantitative-claim semantic coverage are in place. The system still needs broader real-world validation, richer import helpers, deeper semantic validation, external review wrapping, release guidance, real public-source numerical citation fidelity, and one-by-one agent calibration against real papers.

Canonical design spec: [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md).
Detailed project review: [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md).
Active execution checklist: GitHub Issue #2.

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

- `#2`: active umbrella for layered workflow/agent testing; clean-paper, imported-paper, lite update, evidence-heavy external, and short quantitative examples are now represented under `examples/` with regression coverage. Remaining example diversity should focus on real public-source citation fidelity or messy import depth, not more synthetic numeric coverage.
- `#1`: broader test/evaluation program; remains open until more fixture diversity and deeper semantic checks exist.
- `#6`: focused semantic-validation execution plan; deterministic gate slices exist, and deferred gates remain tracked there.
- `#7`: prompt/validator calibration from example feedback; the initial calibration slice is complete, with future prompt calibration expected to come from additional paper trials.
- `#8`: closed cycle-3 example and semantic-warning calibration; it added example-wide semantic gates, recommendation specificity, list-heavy prose warnings, and compact broken-fixture coverage.
- `#9`: second-paper trial; produced the anonymized imported-paper example and an exporter bug fix. Pre-registration was not captured as a formal artifact, so the run is useful but weaker as calibration evidence.
- `#10`: closed anonymized control-paper import fixture; captured the founding failure pattern without real names, employer names, titles, or local paths and produced regression coverage for three missed semantic failures.
- `#5`: hook/event runtime; deferred until real-paper trial clarifies which transitions need deterministic events.

## Active Milestone: One-Paper Diagnostic And Examples

Next work should validate behavior under real use before adding more RFC surface area.

1. Use GitHub Issue #2 as the active one-paper diagnostic checklist and friction log.
2. Completed: run one realistic paper through setup, strategy, research, outline, draft, fact-check, review, revision, and export.
3. Completed: refreshed the trial output so `gpd validate --semantic` passes with no semantic issues.
4. Completed: turned the refreshed trial output into `examples/data-products-ai-scaling`.
5. Completed: added example validation tests for semantic validation, export cleanliness, and completed-workflow routing on a normalized checkout copy.
6. Completed: converted the next feedback pass into prompt rules, semantic gates, and example repairs for reasoning spine, audience conflict specificity, fact-check/source alignment, and concrete recommendations.
7. Completed: added example-wide semantic gate script, compact broken semantic fixture, recommendation-specificity warnings, list-heavy prose warnings, and cleaned the completed example opening prose.
8. Completed: feedback-4 prep expanded the example README, tightened artifact-level prose-density warnings, repaired the completed example, and tracked the second-paper trial in GitHub.
9. Completed: ran a second paper with a different failure profile before adding more same-example validators. Gap: hypotheses were discussed but not captured as a formal pre-registration artifact.
10. Completed: built the anonymized control-paper fixture from the non-GPD lifecycle-paper sequence, preserving the failure pattern while removing identifying names, titles, companies, and local paths.
11. Completed: added an anonymized imported-paper example at `examples/technology-lifecycle-management`.
12. Completed: added a lite internal update example at `examples/weekly-platform-update` to prove low-risk papers do not need forced research or fact-check artifacts.
13. Completed: added an evidence-heavy external example at `examples/responsible-ai-controls` with synthetic source registry, counterevidence, fact-check, audience review, and bounded public claims.
14. Completed: added controlled quantitative-claim semantic coverage and fact-check guidance so precise numbers require source IDs, baseline/denominator/timeframe context, and strong enough research support.
15. Completed: added `examples/platform-review-cycle-metrics`, a short synthetic quantitative memo that exercises baseline, sample, timeframe, source IDs, fact-check handling, review, export, and zero-warning semantic validation.
16. Use example findings to decide whether RFC-2.1 intake, RFC-1 later phases, Issue #5 hooks, real-source citation fidelity, or release hardening should come next.

## Completed Design Simplifications

- Renamed project to Get Paper Done.
- Simplified import so it preserves originals and creates only minimal artifacts.
- Added paper location prompt and per-paper directory creation.
- Added `/gpd-progress` and `/gpd-status` as read-only continuity commands.
- Deferred `/gpd-next` to preserve explicit context-break stages.
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
- Added first-pass `gpd validate --semantic` gates for empty-but-well-formed artifact failures.
- Added `examples/data-products-ai-scaling` plus regression coverage for a realistic completed clean-paper workspace.
- Added `examples/technology-lifecycle-management` plus regression coverage for an anonymized imported-paper recovery workspace.
- Added `examples/weekly-platform-update` plus regression coverage for a lite internal update workspace without research or fact-check artifacts.
- Added `examples/responsible-ai-controls` plus regression coverage for an external evidence-heavy workspace with required research and fact-check artifacts.
- Added `validateQuantitativeClaimSupport` with regression coverage for unsupported precise numerical claims and supported numerical claims with baseline, sample, timeframe, source IDs, and strong research support.
- Added `examples/platform-review-cycle-metrics` plus regression coverage for a short quantitative internal memo with baseline, denominator, timeframe, and fact-check evidence shape.

---

## Track A: Framework Quality To 9/10

### 1. Run A Real Paper Through The Full Flow

Use an existing paper project as the first test case.

Flow:

1. `/gpd-import-paper`
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

Current import flow is conceptually strong but untested.

Needed:

- define canonical draft selection rules more concretely
- add size limits and explicit user confirmation for large folders
- add import classification categories
- add handling for `.docx`, `.pdf`, Markdown, plain text, diagrams, and spreadsheets
- specify how to preserve version history and choose latest draft

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

- add examples of `EXTERNAL-REVIEWS.md`
- add examples of `FEEDBACK-PLAN.md`
- define how conflicting model feedback is resolved
- require feedback to map to affected artifact
- add approval state to `STATE.md` and `STATE.json`

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

The project needs reference examples.

Create:

- `examples/new-paper-minimal/`
- `examples/imported-paper/`
- `examples/multi-audience-paper/`
- `examples/external-review/`

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

Initial install/update CLI exists. The CLI now also has first-pass workspace helpers for init/import/status/validate/listing.

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
gpd status
gpd validate
gpd list-audiences
gpd list-profiles
```

Still needed:

- richer `gpd import` classification and conversion support
- local project install mode
- external review runner
- broader validation rules

Deliverables:

- `bin/gpd.js` for install/update/doctor/version and workspace helpers
- shared installer in `bin/lib/installer.js`
- split workspace helpers across `bin/lib/workspace.js`, `bin/lib/init.js`, `bin/lib/import.js`, `bin/lib/state.js`, and `bin/lib/common.js`
- neutral `@{{GPD_RUNTIME_ROOT}}` source references plus command-reference rewriting for Claude/Codex targets
- install manifest
- backup of changed installed files during update
- command routing for init/import/status/validate
- path handling helpers for paper workspaces
- JSON output mode for status, validate, audience listing, and profile listing

Success criteria:

- CLI can install/update Claude and Codex runtime assets safely.
- CLI can create directories and copy/import files safely.
- Agent workflows can call CLI helpers instead of hand-rolling shell logic.

### 2. Build Safe Import Copy Logic

First-pass copy behavior is implemented in `gpd import`.

Implemented:

- recursive copy with ignore rules
- max file size skip
- binary file handling
- dry-run mode
- no overwrite without confirmation
- `.paper/IMPORT.md` generation

Still needed:

- richer import manifest details
- `.docx`, `.pdf`, spreadsheet, and diagram conversion/indexing helpers
- canonical draft ranking beyond filename and modified time
- large folder summary before copy

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
- init/status/validate smoke test
- malformed input tests for unreadable/missing import source, missing required files, and malformed `STRATEGY.md`
- init footgun regression test for no `--slug`, no `--title`, and no `--location`
- CI workflow that runs `npm run check`

Still needed:

- slug generation test
- template presence test
- workflow consistency tests

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

The workflow documents model invocation, but this should be wrapped.

Add:

```bash
gpd review-external
gpd review-external --models claude,gemini,codex
```

Needed:

- CLI detection
- current-runtime skip logic
- timeouts
- error capture
- output normalization
- temp prompt generation
- write `.paper/EXTERNAL-REVIEWS.md`

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

Install/update now works from the current local package, but release mechanics are still manual.

Needed:

- changelog file and release notes convention
- version bump process
- release checklist
- documented update path: pull or install new package, then `gpd update claude` / `gpd update codex`
- optional package publishing plan
- compatibility notes for changed commands, templates, agents, and references

Deliverables:

- `CHANGELOG.md`
- release checklist in docs
- package versioning guidance
- update verification checklist

Success criteria:

- A new release can be cut without relying on memory.
- User can see what changed before updating installed runtimes.
- `gpd update` has a clear role in the release process.

---

## Priority Order

1. Run one real paper through the current workflow.
2. Harden import based on that run.
3. Add examples from the real paper run.
4. Expand validation coverage beyond setup/sequencing checks.
5. Add workflow consistency and template coverage tests.
6. Wrap external review runner.
7. Add release/update documentation.
8. Add local project install support.

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

- CLI handles install/update/doctor/version and eventually init/import/status/validate.
- Import copy behavior is safe and tested.
- Installer is repeatable and clear.
- External model review is wrapped in a helper command.
- Release/update process has changelog and verification checklist.
- `npm test` covers core operations.
