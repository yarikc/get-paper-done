---
name: gpd:progress
description: Show paper status, missing artifacts, suggested next command, and context-clearing guidance
argument-hint: "[--json]"
allowed-tools:
  - Read
  - Bash
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/progress.md
</execution_context>

<process>
Run the progress workflow. This command reports and recommends only; it does not execute the next stage.
</process>
