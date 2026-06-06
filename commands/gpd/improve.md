---
name: gpd:improve
description: Guide the accepted-baseline improvement loop without rewriting prose
argument-hint: "[--paper <path>] [--json]"
allowed-tools:
  - Read
  - Bash
---

<context>
**Flags:**
- `--paper <path>` - Existing paper workspace.
- `--json` - Print the machine-readable guidance result.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/improve.md
</execution_context>

<process>
Run `gpd improve` to decide the next safe action in the accepted-baseline loop. Report whether the paper needs an accepted baseline, needs a fresh compare report, or is ready for author review of `CHANGESET.md`.
</process>
