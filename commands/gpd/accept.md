---
name: gpd:accept
description: Promote the current draft or export to the accepted baseline
argument-hint: "[--paper <path>] [--source draft|final] [--note <text>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<context>
**Flags:**
- `--paper <path>` - Existing paper workspace.
- `--source <draft|final>` - Optional source artifact. Defaults to final when exported, otherwise draft.
- `--note <text>` - Optional acceptance note.
- `--notes <text>` - Optional acceptance note.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/accept.md
</execution_context>

<process>
Ask for confirmation before running this command unless the user has explicitly said the current paper is accepted. Then run `gpd accept` with the selected source and report the accepted path plus next status step.
</process>
