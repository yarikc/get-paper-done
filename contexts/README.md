# Reusable Context Packs

This directory stores optional context that can help multiple papers.

Per-paper truth still lives in `.paper/PAPER-CONTEXT.md` and `.paper/DECISIONS.md`. Those files are authoritative for a specific paper. Context packs are reusable hints: shared terminology, recurring proof standards, audience assumptions, or stable decision patterns that may apply across papers.

Use context packs carefully:

- Apply them only when they are relevant to the current paper.
- Summarize the proposed reuse before applying it.
- Do not auto-promote paper-specific decisions into this directory.
- Sanitize promoted context so it contains no private names, company names, titles, local paths, or sensitive source material.

Suggested pack shape:

```markdown
# [Context Pack Name]

## Applies When

- [paper type, audience, domain, or recurring situation]

## Canonical Terms

| Term | Meaning | Avoid |
|------|---------|-------|
| [term] | [meaning] | [terms or uses to avoid] |

## Reusable Decisions

| Decision Pattern | Why It Exists | When Not To Use |
|------------------|---------------|-----------------|
| [pattern] | [reason] | [boundary] |

## Proof Standards

- [claim type]: [expected support]

## Privacy Boundary

- This pack must remain generic and sanitized.
```
