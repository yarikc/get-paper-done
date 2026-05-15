---
name: gpd:grill
description: Pre-brief or later re-entry interrogation for paper intent, language, and decisions
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/grill.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/templates/paper-context.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/templates/decisions.md
</execution_context>

<process>
Run the grill workflow. Ask one question at a time. Update `PAPER-CONTEXT.md`, `DECISIONS.md`, and `STATE.json.grill` as decisions resolve. This command may be used as the mandatory first gate or later when ambiguity reappears. Do not research, outline, draft, or revise while grilling.
</process>
