---
name: gpd:import
description: Alias for /gpd-import-paper
argument-hint: "--source <path> [--location <path>] [--slug <name>] [--profile <name>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/import-paper.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/references/writing-artifacts.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/templates/import-report.md
</execution_context>

<process>
Run the `/gpd-import-paper` workflow. This is a shorter alias for daily use.
</process>
