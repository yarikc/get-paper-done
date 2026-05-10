# Changelog

All notable changes to Get Paper Done are documented here.

## 0.1.0 - 2026-05-10

Initial working release.

### Added

- File-based paper workflow for newsletters, blogs, position papers, and white papers.
- Paper-scoped `.paper/` artifacts for project, persona, audience, brief, strategy, research, outline, draft, fact-check, review, feedback planning, revision, and export.
- Install/update CLI for Claude and Codex runtimes.
- Workspace CLI helpers: `gpd init`, `gpd import`, `gpd status`, `gpd validate`, `gpd list-audiences`, and `gpd list-profiles`.
- Safe import behavior that preserves source material under `original/`.
- Strategy gate with normalized `Strategy Blockers`.
- Curated reusable audience personas and reusable author profile support.
- Specialized agents for strategy, research, outlining, drafting, audience review, opposition review, fact-checking, and editing.
- External review workflow with feedback-plan approval before revision.
- CLI test suite and GitHub Actions CI.
