---
name: gpd:improve
description: Guide the accepted-baseline improvement loop without rewriting prose
argument-hint: "[--paper <path>] [--action guide|compare|accept] [--json]"
allowed-tools:
  - Read
  - Write
  - Bash
---

<context>
**Flags:**
- `--paper <path>` - Existing paper workspace.
- `--action guide|compare|accept` - Default `guide`; `compare` writes a fresh CHANGESET when needed; `accept` promotes the reviewed baseline or candidate.
- `--json` - Print the machine-readable guidance result.
- `--force` - Required with `--note` to accept a candidate whose current CHANGESET reports `regression_risk`.
- `--note <text>` - Acceptance note or forced-risk rationale.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/improve.md
</execution_context>

<process>
Run `gpd improve` to decide the next safe action in the accepted-baseline loop. Use `--action compare` only when the user approves generating or refreshing `CHANGESET.md`. Use `--action accept` only after the user has read the relevant paper/change set and explicitly accepts the baseline or candidate.
</process>
