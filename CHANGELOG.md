# Changelog

All notable changes to Get Paper Done are documented here.

## 0.1.0 - 2026-05-10

Initial working release.

### Added

- `/gpd-grill` workflow for mandatory pre-brief interrogation, with `.paper/PAPER-CONTEXT.md` and `.paper/DECISIONS.md` artifacts for resolved language and paper decision records.
- `STATE.json.grill` gate with enum-backed completion state and required decision keys, so new and imported papers route to `/gpd-grill` until paper job, reader, belief shift, thesis, narrative spine, terms, scope, proof standard, counterargument, and non-goals are resolved.
- Re-enterable grill behavior: authors or agents can invoke `/gpd-grill` later for new ambiguity, and newer `PAPER-CONTEXT.md` / `DECISIONS.md` artifacts route the paper back to `/gpd-brief`.
- Optional reusable `contexts/` packs for sanitized cross-paper language and decision patterns; per-paper `.paper/PAPER-CONTEXT.md` remains authoritative.
- Installer now copies `contexts/` into Claude/Codex runtimes so `/gpd-grill` can see reusable context packs after install/update.
- Example and fixture indexes, plus explicit policy that old examples may be grandfathered while new examples should include grill companion artifacts.
- Stronger artifact validation for non-template `PAPER-CONTEXT.md` and `DECISIONS.md`, catching unresolved placeholders and empty grill outputs.
- Reworked README and START-HERE into simpler product-story onboarding docs: problem, output preview, install, first paper, and the clarify/support/shape/draft/check/revise/export loop.
- Kept detailed workflow mechanics in DESIGN-SPEC with sequence tables, mandatory/conditional stage status, stage purpose, outputs, and transition rules.
- `REPO-CONVENTIONS.md` as the canonical repository-conventions document, with `AGENTS.md` kept as the agent-discovery shim.
- Removed duplicate long-form slash commands for new/import/status; `/gpd-new`, `/gpd-import`, and `/gpd-status` are canonical.
- Cross-artifact validation that requires `PAPER-CONTEXT.md` canonical terms to appear in `DRAFT.md` when both artifacts exist, and requires `DECISIONS.md` PDR detail sections to include dates.
- Example fixture coverage now enforces the new-example grill artifact policy while explicitly grandfathering pre-grill examples.
- Explicit backward-routing walkthrough and gate-override documentation for grill and strategy gates.
- Documented validation composition: artifact-contract validation runs before semantic lint-style validation.
- Documented the feedback-harvesting rule: raw feedback remains ignored, while actionable items must become anonymized issues, tests, examples, docs, or roadmap entries.
- Private-repo release/update guide with version policy, compatibility policy, release checklist, package-boundary expectations, and `npm run release:check`.
- File-based paper workflow for newsletters, blogs, position papers, and white papers.
- Paper-scoped `.paper/` artifacts for project, persona, audience, brief, strategy, research, outline, draft, fact-check, review, feedback planning, revision, and export.
- Install/update CLI for Claude and Codex runtimes.
- Workspace CLI helpers: `gpd init`, `gpd import`, `gpd next`, `gpd status`, `gpd validate`, `gpd list-audiences`, and `gpd list-profiles`.
- External-review helper: `gpd review-external` writes captured review text to `.paper/FEEDBACK-EXTERNAL.md`, can invoke selected installed provider CLIs with `--models`, creates a pending `.paper/FEEDBACK-PLAN.md`, and stops at the approval gate without revising the draft.
- External-review provider invocation now prints provider-level progress so users can see each model move through running, captured, empty, missing, failed, skipped-self-review, or unsupported states instead of waiting on an opaque background command.
- External-review provider invocation now skips the current runtime's own provider when identified, so Claude does not review itself from Claude and Codex does not review itself from Codex.
- External-review prompts now include the full paper workspace context: state, config/classification, grill context, decision records, persona, audience, brief, strategy, research summary, research JSON, outline, draft, exported reading copy, fact-check, local review, reader feedback, and prior feedback plan when present.
- External-review feedback plans now decompose captured HIGH/MEDIUM/LOW concerns and suggested changes into named concern sections instead of collapsing a whole review into one generic item, with rationale, proposed handling, proposed edits, reviewer evidence, `User Decision`, and `User Constraint` before revision.
- External-review runs now store each reviewer capture under `.paper/feedback-external/`, keep `FEEDBACK-EXTERNAL.md` and `FEEDBACK-PLAN.md` as the active combined view, deduplicate overlapping reviewer concerns, and print the pending concern count at command completion.
- External-review runs now write `.paper/EXTERNAL-REVIEW-RUN.json` so provider/file review provenance records the review target, context artifacts, requested providers, current-runtime skip setting, timeout, isolated working-directory policy, safe provider command/argument shape, provider status, raw feedback paths, requested model alias or pin, requested effort where supported, and resolved model evidence when the provider reports it.
- Claude external-review provider default changed from `claude -p` to `claude -p --model opus --effort xhigh` for final paper-review quality.
- Gemini external-review provider default changed from `gemini -p ""` to `gemini -p "" -m pro --output-format json --approval-mode plan --skip-trust` so review uses the Pro capability alias and records resolved-model evidence from JSON stats when available.
- Per-paper `config.json` can override Claude/Gemini external-review model selection and Claude effort when the user intentionally wants a pinned reviewer configuration; unsupported provider overrides are not presented as requested models in provenance.
- Feedback plans now use a concern-first schema with `Recommendation`, `Why this matters`, `What improves if addressed`, `Risk if handled badly`, `Proposed handling`, `Proposed edits`, `Reviewer evidence`, `User Decision`, and `User Constraint`, so users decide on named concerns rather than vague action rows.
- `gpd feedback-plan list|review|decide` lets users review the feedback queue inside the CLI/TUI, inspect one concern at a time, and record `approve`, `modify`, `defer`, `reject`, or `answered_no_action` decisions before revision.
- `/gpd-feedback` slash command now provides the user-facing approval loop for feedback plans, hiding the lower-level list/review/decide CLI plumbing behind one concern-at-a-time conversation.
- Reader-feedback plans generated by `gpd feedback collect` now use the same concern-first approval queue as external-review feedback plans.
- Inline human feedback now supports explicit visible markers: `//todo:`, `//keep:`, `//qq:`, and `//no:`, with `!` and `?` severity suffixes, fenced-code and URL guards, preservation constraints for `//keep:`, and non-destructive comment collection.
- `gpd feedback clean` removes captured inline comments only after the user confirms extraction, preserving the commented paper first so review context is recoverable.
- Feedback approval state now uses an enum-backed `feedback_plan_status` and exact `Pending user approval` routing, preventing typo bypasses and false positives from arbitrary strings containing "pending".
- `FEEDBACK-PLAN.md` status is now validated against the same approval vocabulary, and exported-paper comment guidance now routes users through `gpd feedback collect` followed by `/gpd-feedback`.
- External-review feedback-plan generation now preserves any prior `FEEDBACK-PLAN.md` under a quoted `Prior Feedback Plan` section instead of silently overwriting user decisions.
- `REVISION-CHECK.md` artifact for substantive revisions, requiring before/after quality scoring for thesis clarity, argument flow, evidence support, audience fit, persona and voice, ask clarity, and substance preservation before export.
- Revision workflow now treats validators as advisory and explicitly blocks validator-driven edits that delete specificity, weaken evidence, flatten persona/voice, or reduce persuasive force.
- The drafting agent now has revision-safety instructions and must snapshot before redrafting or replacing existing `DRAFT.md` content; append-only `--next-section` drafting remains lightweight.
- Paper-local version snapshots under `.paper/versions/`, `REVISION-LOG.md`, and `gpd snapshot` for preserving paper artifacts, source notes, external-review captures, imported originals, and hash metadata before substantive revision.
- `gpd revise` revision preflight now snapshots the current paper, records the active revision snapshot in state, and prints the exact restore command before controlled draft changes.
- `gpd restore` now restores tracked files from a snapshot after first creating a safety snapshot of the current state.
- `gpd status` and `gpd next` now show the latest restore command when a snapshot exists.
- Generated artifact, revision-log, and installer writes now use a temp-file plus rename path so state, feedback, export, metadata, install assets, and manifests are not left partially overwritten by interrupted writes.
- Import/init refusal for an existing paper workspace now explains how to recover: choose a different slug/location or run commands against the existing workspace with `--paper`.
- `PAPER-CONTEXT.md` canonical-term validation now waits until review/export exists, avoiding false blocking of early partial drafts while still protecting reviewed papers.
- `gpd export` now requires a current valid `REVISION-CHECK.md` before overwriting an existing `.paper/exports/FINAL.md` with a newer draft, then snapshots the prior export so a reviewed reading copy is recoverable.
- `gpd next` and `gpd status` now use the stored exported draft hash for export freshness, avoiding false stale routing from a touched-but-unchanged `DRAFT.md` while still catching content changes with misleading mtimes.
- Review/comment UX helper commands: `gpd review-pack` shows the single current review target and comment syntax; `gpd feedback collect` captures inline comments from the review target into `FEEDBACK-READER.md` and a pending `FEEDBACK-PLAN.md` without mutating the draft.
- Semantic validation now flags unresolved inline review comments left in `exports/FINAL.md` and tells the user to run `gpd feedback collect`, then `gpd feedback clean`.
- Claude provider calibration for `gpd review-external --models claude`, including corrected `claude -p` stdin invocation.
- Codex provider calibration for `gpd review-external --models codex`, confirming `codex exec --skip-git-repo-check -` stdin invocation.
- Gemini provider calibration for `gpd review-external --models gemini`, using `gemini -p ""` with stdin; real capture requires the user's local Gemini authentication.
- Opencode is intentionally unsupported for paper external review after local paper-review calibration proved it unreliable for this workflow.
- `gpd next` compact guidance for the next recommended workflow action, why it is next, and what context to read or avoid.
- `gpd next` now explains missing required artifacts before falling back to saved `STATE.json` recommendations.
- Slimmer README and `docs/START-HERE.md` onboarding focused on first use, with dense mechanics left to reference docs.
- Status routing now keeps pending feedback plans at `/gpd-feedback` instead of letting stale mtimes bypass the approval gate.
- Artifact validation for `FEEDBACK-EXTERNAL.md`, including required prompt-summary and consensus-summary sections.
- Safe import behavior that preserves source material under `original/`.
- Import dry-run inventory, classification counts, warning output, file-size skip override, and deterministic canonical-draft candidate ranking.
- Import plain-text extraction for selected `.docx` canonical drafts, with original files still preserved unchanged under `original/` and extraction provenance recorded in `IMPORT.md`.
- Import-time detection of unverified source-reference candidates such as URLs, DOIs, named standards, and source lines, recorded in `IMPORT.md` for later research/fact-check triage.
- Import `Version / Source Index` in `IMPORT.md`, grouping copied files by likely role, ranking signal, modified time, recommended downstream stage, and rationale.
- Strategy gate with normalized `Strategy Blockers`.
- Curated reusable audience personas and reusable author profile support.
- Specialized agents for strategy, research, outlining, drafting, audience review, opposition review, fact-checking, and editing.
- External review workflow with feedback-plan approval before revision.
- CLI test suite and GitHub Actions CI.
