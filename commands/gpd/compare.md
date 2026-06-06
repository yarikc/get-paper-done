---
name: gpd:compare
description: Compare the current draft candidate against the accepted baseline
argument-hint: "[--paper <path>] [--json] [--dry-run]"
allowed-tools:
  - Read
  - Write
  - Bash
---

<context>
**Flags:**
- `--paper <path>` - Existing paper workspace.
- `--json` - Print machine-readable result.
- `--dry-run` - Show planned writes without updating `.paper/CHANGESET.*`.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/compare.md
</execution_context>

<process>
Run `gpd compare` after a paper has an accepted baseline and `DRAFT.md` has changed. Report the pairwise verdict, word delta, removed headings, changed span count, and paths to `CHANGESET.md` and `CHANGESET.json`.
</process>
