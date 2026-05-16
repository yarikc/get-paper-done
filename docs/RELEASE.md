# Release And Update Guide

Last reviewed: 2026-05-14

This project is currently distributed as a private/local GitHub checkout, not as a public npm package. Treat each release as a tagged repo state that can be linked locally and installed into Claude Code and Codex runtimes.

## Release Principles

- The repo is the source release artifact.
- The npm package is an installable framework bundle, not a full repo archive.
- User/private paper workspaces are never part of a release.
- Runtime installs are generated from the current checkout or package.
- `gpd update` refreshes framework-owned runtime assets and must not touch paper workspaces.
- Private drafts, feedback files, RFC drafts, local settings, tests, and scratch files must not enter the package.

## Version Policy

Use semantic versioning in `package.json`.

| Change type | Version bump | Examples |
|-------------|--------------|----------|
| Patch | `0.1.x` | Documentation fixes, prompt clarifications, non-breaking tests, example repairs, package-boundary fixes. |
| Minor | `0.x.0` | New slash command, new CLI command, new artifact contract, new schema field with backward-compatible defaults, new example family. |
| Major | `x.0.0` | Breaking artifact schema, incompatible install layout, removed command, required paper-workspace migration. |

During `0.x`, minor releases may still reshape the framework, but every release must document whether existing paper workspaces remain usable.

## Compatibility Policy

Existing paper workspaces should remain readable by newer GPD versions unless a release explicitly declares a migration.

Compatibility expectations:

- Existing `.paper/` Markdown artifacts should remain inspectable.
- `STATE.json.version` changes require an explicit migration note.
- Schema enum additions must be reflected in contracts, schemas, templates, workflows, and tests.
- `gpd status` may route a paper backward for refresh after an update; that is compatible behavior, not data loss.
- `gpd update claude` and `gpd update codex` update installed framework files only. They must not modify paper directories.
- Runtime install paths may differ between Claude and Codex, but source command files must keep runtime-neutral `@{{GPD_RUNTIME_ROOT}}` references.

## Private GitHub Install Flow

For a private repo checkout:

```bash
git pull
npm link
npm run release:check
gpd update claude
gpd update codex
gpd doctor claude
gpd doctor codex
```

Use `npm link` when the local checkout is the package source. After the link exists, `git pull` plus `gpd update ...` is enough for normal local updates.

For a fresh machine:

```bash
git clone <private-repo-url>
cd get-paper-done
npm link
gpd install claude
gpd install codex
gpd doctor claude
gpd doctor codex
```

Restart Claude Code and Codex after install or update so slash commands reload.

## Pre-Release Checklist

Run this before tagging or handing off a release:

```bash
npm run release:check
```

`release:check` must cover:

- CLI/runtime dry-run install for Claude and Codex.
- Full test suite.
- Package hygiene checks.
- npm dry-run package creation.

Manual release checks:

- `CHANGELOG.md` describes user-visible changes.
- `package.json` version matches the intended release.
- `README.md`, `docs/START-HERE.md`, `docs/PROJECT-REVIEW.md`, and `ROADMAP.md` do not contradict the release state.
- `docs/PROJECT-REVIEW.md` has current ratings and residual risks.
- `ROADMAP.md` records any plan change.
- `git status --short` is clean before tagging.
- Ignored feedback files and `*.feedback` files are not staged.
- There is no tracked `docs/feedback-archive/`; raw review feedback stays ignored unless it is anonymized and deliberately converted into a durable issue, example, fixture, or documentation change.
- Feedback harvesting must leave an auditable trail: either a GitHub issue, a test/example change, a roadmap entry, or a documentation update. Do not commit the raw feedback file itself.
- Packaged paper examples are anonymized and contain no person names, company names, employer names, local paths, or private source material.

## Package Boundary Checks

The package must include:

- CLI binaries and support libraries.
- Commands, workflows, agents, templates, references, contexts, profiles, audiences, docs, and examples.
- License, README, changelog, release guide, and package metadata.

The package must exclude:

- `tests/`
- `.github/`
- `rfc/`
- `docs/feedback*.md`
- `*.feedback`
- local runtime settings such as `agents/.claude/`
- private paper source drafts or local scratch files

`tests/package-hygiene.test.js` enforces the package boundary.

## Release Record

For each release, record:

- version
- date
- commit hash or tag
- summary of changes
- compatibility notes
- validation command and result
- known residual risks

Use `CHANGELOG.md` for user-facing changes and `docs/PROJECT-REVIEW.md` for current health/risk assessment.
