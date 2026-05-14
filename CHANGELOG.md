# Changelog

All notable changes to Get Paper Done are documented here.

## 0.1.0 - 2026-05-10

Initial working release.

### Added

- Private-repo release/update guide with version policy, compatibility policy, release checklist, package-boundary expectations, and `npm run release:check`.
- File-based paper workflow for newsletters, blogs, position papers, and white papers.
- Paper-scoped `.paper/` artifacts for project, persona, audience, brief, strategy, research, outline, draft, fact-check, review, feedback planning, revision, and export.
- Install/update CLI for Claude and Codex runtimes.
- Workspace CLI helpers: `gpd init`, `gpd import`, `gpd next`, `gpd status`, `gpd validate`, `gpd list-audiences`, and `gpd list-profiles`.
- External-review helper: `gpd review-external` writes captured review text to `.paper/EXTERNAL-REVIEWS.md`, can invoke selected installed provider CLIs with `--models`, creates a pending `.paper/FEEDBACK-PLAN.md`, and stops at the approval gate without revising the draft.
- Claude provider calibration for `gpd review-external --models claude`, including corrected `claude -p` stdin invocation.
- Codex provider calibration for `gpd review-external --models codex`, confirming `codex exec --skip-git-repo-check -` stdin invocation.
- Opencode provider calibration for `gpd review-external --models opencode`, confirming `opencode run -` stdin invocation.
- Gemini provider argument correction for `gpd review-external --models gemini`, using `gemini -p ""` with stdin; real capture requires local Gemini authentication.
- `gpd next` compact guidance for the next recommended workflow action, why it is next, and what context to read or avoid.
- Slimmer README and `docs/START-HERE.md` onboarding focused on first use, with dense mechanics left to reference docs.
- Status routing now keeps pending feedback plans at `/gpd-progress` instead of letting stale mtimes bypass the approval gate.
- Artifact validation for `EXTERNAL-REVIEWS.md`, including required prompt-summary and consensus-summary sections.
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
