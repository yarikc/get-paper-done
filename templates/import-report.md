# Import Report

**Imported at:** [timestamp]
**Source:** [source path]
**Destination:** [paper directory]

## Import Summary

[Short summary of what was imported and how it was classified.]

## Original Material

Original material was copied to:

```text
original/
```

## Files Copied

| Original Path | Imported Path | Classification | Notes |
|---------------|---------------|----------------|-------|
| [path] | [path] | [draft/research/spec/review/asset/unclear] | [notes] |

## Files Skipped

| Path | Reason |
|------|--------|
| [path] | [reason] |

## Canonical Draft

- **Selected draft:** [path]
- **Selection rationale:** [why this was treated as current]

## Derived Artifacts

| Artifact | Status | Source Basis | Notes |
|----------|--------|--------------|-------|
| PROJECT.md | [Created/Partial] | [source] | [notes] |
| PERSONA.md | [Created/Partial] | [source/profile] | [notes] |
| AUDIENCE.md | [Created/Partial] | [source] | [notes] |
| BRIEF.md | [Created/Partial] | [source] | [notes] |
| DRAFT.md | [Created/Partial] | [source] | [notes] |
| STATE.md | Created | import workflow | [notes] |
| STATE.json | Created | import workflow | [notes] |

## Deferred Artifacts

These are intentionally not generated during import unless explicitly requested.

| Artifact | Reason Deferred | Recommended Command |
|----------|-----------------|---------------------|
| RESEARCH.json / RESEARCH.md | Research compression should happen in a fresh context | `/gpd-research` |
| OUTLINE.md | Structure should be created or validated after research/brief clarity | `/gpd-outline --lite` for triage, `/gpd-outline --deep` for serious/researched/high-stakes papers |
| REVIEW.md | Review should happen after import context is cleared | `/gpd-review` |

## Imported Research / Reference Material

| Path In original/ | Type | Should Inform |
|-------------------|------|---------------|
| [path] | [research/reference/source/notes] | [BRIEF/RESEARCH/OUTLINE] |

## Imported Outline / Review Material

| Path In original/ | Type | Notes |
|-------------------|------|-------|
| [path] | [outline/review/feedback] | [notes] |

## Assumptions

- [Assumption]

## Open Questions

- [Question]

## Post-Import Choices

Strategy gate status: [`Go` | `Revise Before Drafting` | `No-Go`]

Primary strategy blocker: [`none` | `scope_too_broad` | `thesis_weak` | `audience_unclear` | `audience_conflict` | `evidence_gap` | `weak_ask` | `poor_posture` | `missing_outcome` | `reader_promise_weak` | `decision_usefulness_weak`]

If strategy gate status is `Revise Before Drafting` or `No-Go`, do not use the choices below yet. Run `/gpd-brief` first unless the user explicitly overrides the strategy block.

Choose one when strategy gate status is `Go`:

1. `/gpd-research` - research imported/source material and compress evidence for and against the argument.
2. `/gpd-outline --lite` - quickly triage or rebuild structure; use `/gpd-outline --deep` for serious, researched, high-stakes, or 1,200+ word papers.
3. `/gpd-review --external` - review the current draft locally and with available external models.

Conditional note: if this imported draft is publication-sensitive and contains material factual claims, run `/gpd-fact-check --risk-scan` before external review or export.

## Suggested Choice

`/[command]`

## Why

[One-sentence reason. If setup information is missing or `STRATEGY.md` blocks, recommend `/gpd-brief` before the three post-import choices.]
