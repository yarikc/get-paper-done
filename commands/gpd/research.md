---
name: gpd:research
description: Build structured research artifacts for the current paper
argument-hint: "[--rapid|--standard|--deep] [--provided-first|--provided-only|--web-first|--web-only]"
allowed-tools:
  - Read
  - Write
  - WebSearch
  - AskUserQuestion
---

<context>
**Depth flags:**
- `--rapid` - Small number of high-value sources and 3-7 key findings.
- `--standard` - Default. Full evidence, synthesis, contradiction, and draft support artifacts.
- `--deep` - Broader search and more explicit disagreement/uncertainty treatment.

**Source mode flags:**
- `--provided-first` - Default for imported papers. Start with `original/` and `.paper/sources/`, then use web for gaps, verification, and counterevidence.
- `--provided-only` - Use only user-provided/imported material.
- `--web-first` - Start with web research, then reconcile with provided material.
- `--web-only` - Use web sources only.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/research.md
</execution_context>

<process>
Run the research workflow. First infer research questions from `.paper/BRIEF.md`, present a research plan, and give the user a chance to adjust it before collecting sources. Use reliable sources and short compliant quotations only.
</process>
