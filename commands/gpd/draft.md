---
name: gpd:draft
description: Draft the next paper section from the current writing context
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/draft.md
</execution_context>

<process>
Run the draft workflow.

Accepted intent flags:

- `--next-section` - draft the next undrafted outline section.
- `--section <name>` - draft or replace a specific section.
- `--full` - draft the whole paper in one pass. Use only for short pieces or when explicitly requested.
- `--redraft-from-comments` - update only requested sections from comments or approved feedback, with a change log.

If no flag is provided, draft section-by-section by default for serious, researched, executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers.
</process>
