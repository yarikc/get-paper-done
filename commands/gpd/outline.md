---
name: gpd:outline
description: Create an argument-aware outline from the brief, audience, persona, strategy, and research
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/outline.md
</execution_context>

<process>
Run the outline workflow.

Accepted intent flags:

- `--lite` - fast structure pass for early shaping, short pieces, or messy imported drafts
- `--deep` - full argument architecture with deep diagnostics
- `--outline-plus-skeleton` - add a light skeleton draft after the outline

If no depth flag is provided, choose Lite for early/short/import triage and Deep for serious, researched, executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers.
</process>
