---
name: gpd:revise
description: Apply approved feedback or run a controlled editorial pass on the current draft
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/revise.md
</execution_context>

<process>
Run the revise workflow.

Accepted intent flags:

- `--section <name>` - revise or edit only a named section.
- `--full` - revise or edit the whole draft. Use only when explicitly requested.
- `--editorial-review` - return an editorial plan only; do not modify `.paper/DRAFT.md`.
- `--style-pass` - tune tone, rhythm, and voice without changing thesis, claims, evidence, or structure.
- `--final-polish` - final prose pass after review is ready or remaining risk is explicitly accepted.
- `--light-edit` - copyedit and small clarity/rhythm fixes only.
- `--standard-edit` - default editorial intensity for clarity, flow, transitions, redundancy, and paragraph-level tightening.
- `--heavy-edit` - substantial line-and-structure edit of an existing draft; requires explicit request and drift checks.
</process>
