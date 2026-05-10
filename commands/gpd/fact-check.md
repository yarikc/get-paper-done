---
name: gpd:fact-check
description: Check draft claims for support, staleness, exaggeration, contradiction, and citation risk
allowed-tools:
  - Read
  - Write
  - WebSearch
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/fact-check.md
</execution_context>

<process>
Run the fact-check workflow.

Accepted intent flags:

- `--risk-scan` - Fast pass over high-risk claims only.
- `--full` - Check every material claim.
- `--publication` - Final pre-export credibility pass.
- `--source-audit` - Check source quality and citation-source alignment.
</process>
