---
name: gpd:curate-audience
description: Create, review, or update reusable curated audience personas
argument-hint: "[--new] [--edit <slug>] [--review <slug>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<context>
**Flags:**
- `--new` - Create a new curated audience persona in `audiences/`.
- `--edit <slug>` - Update an existing curated audience persona.
- `--review <slug>` - Review an existing curated audience persona and propose improvements.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/curate-audience.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/templates/curated-audience.md
</execution_context>

<process>
Run the curated audience workflow. Curated personas are reusable; paper-specific audience adaptations belong in `.paper/AUDIENCE.md`.
</process>

