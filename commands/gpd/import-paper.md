---
name: gpd:import-paper
description: Import an existing paper, versions, specs, research, references, and a lightweight strategy gate into a GPD paper workspace
argument-hint: "--source <path> [--location <path>] [--slug <name>] [--profile <name>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<context>
**Flags:**
- `--source <path>` - Existing draft file or source directory to import.
- `--location <path>` - Create the new paper directory under this location.
- `--slug <name>` - Use this directory name for the imported paper.
- `--profile <name>` - Import `profiles/<name>.md` into the paper-scoped persona.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/import-paper.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/references/writing-artifacts.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/templates/import-report.md
</execution_context>

<process>
Run the import workflow end to end. Preserve original source material unchanged in `original/` before creating framework artifacts, including a lightweight `STRATEGY.md` gate. Finish by presenting the post-import menu instead of revising or executing another stage.
</process>
