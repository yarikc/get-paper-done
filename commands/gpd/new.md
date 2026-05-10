---
name: gpd:new
description: Alias for /gpd-new-paper
argument-hint: "[optional topic or document] [--fast] [--profile <name>] [--location <path>] [--slug <name>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/new-paper.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/references/questioning.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/references/writing-artifacts.md
</execution_context>

<process>
Run the `/gpd-new-paper` workflow. This is a shorter alias for daily use.
</process>
