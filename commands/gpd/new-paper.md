---
name: gpd:new-paper
description: Initialize a new paper project with persona, audience, provisional brief, grill gate, and state
argument-hint: "[optional topic or document]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Initialize a new `.paper/` workspace for a serious paper, including persona, audience, provisional brief, provisional strategy state, and the mandatory `/gpd-grill` gate before formal briefing or downstream research, outline, or drafting.
</objective>

<context>
**Flags:**
- `--fast` - Use one-page intake: audience, problem, thesis, three claims, evidence, counterargument, recommendation, tone, avoid list, length.
- `--profile <name>` - Import `profiles/<name>.md` into the paper-scoped persona.
- `--location <path>` - Create the paper directory under this location.
- `--slug <name>` - Use this directory name for the paper.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/new-paper.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/references/questioning.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/references/writing-artifacts.md
</execution_context>

<process>
Execute the workflow end to end. Preserve the requirement that persona and audience profiles are paper-scoped.
</process>
