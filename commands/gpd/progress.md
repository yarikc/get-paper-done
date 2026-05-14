---
name: gpd:progress
description: Show the Claude/Codex paper dashboard: current state, blockers, next command, and context guidance
argument-hint: "[--json]"
allowed-tools:
  - Read
  - Bash
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/progress.md
</execution_context>

<process>
Run the progress workflow as the in-runtime paper dashboard. This command reports and recommends only; it does not execute the next stage.
</process>
