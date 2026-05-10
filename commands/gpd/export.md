---
name: gpd:export
description: Export the final draft to .paper/exports/FINAL.md
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/export.md
</execution_context>

<process>
Run the export workflow.
</process>

