<purpose>
Report paper status, artifact completeness, suggested next command, and context-clearing guidance. This command is intentionally read-only and should not execute the next stage.
</purpose>

<process>

## 1. Locate Paper Workspace

If `.paper/` is missing:

- If `original/` exists, recommend `/gpd-import-paper` was likely started incorrectly or the user is inside an imported paper directory without `.paper/`.
- Otherwise recommend `/gpd-new-paper` for a new paper or `/gpd-import-paper` for an existing draft/folder.
- Stop.

Read `.paper/STATE.json` first if it exists, then `.paper/STATE.md` for human notes. If both are missing, report that state is missing and recommend reconstructing with `/gpd-progress` output plus manual state repair.

Check which artifacts exist:

- PROJECT.md
- PERSONA.md
- AUDIENCE.md
- BRIEF.md
- STRATEGY.md
- RESEARCH.json
- RESEARCH.md
- OUTLINE.md
- DRAFT.md
- REVIEW.md
- FACT-CHECK.md
- EXTERNAL-REVIEWS.md
- FEEDBACK-PLAN.md
- IMPORT.md
- STATE.json
- exports/FINAL.md

Do not read `.paper/sources/` by default. Raw source material can be large and should not enter progress context.

## 2. Artifact Health Check

For each artifact, report:

- Exists / Missing
- Empty / Non-empty
- Likely stale if inferable
- Notes

Stale context risks:

- `PERSONA.md` or `AUDIENCE.md` updated after `DRAFT.md`: draft may need review/revision.
- `BRIEF.md` updated after `RESEARCH.json` / `RESEARCH.md`: research may need refresh.
- `STRATEGY.md` says `Revise Before Drafting` or `No-Go`: research, outline, and drafting are blocked unless user explicitly overrides.
- `RESEARCH.json` / `RESEARCH.md` updated after `OUTLINE.md`: outline may need refresh.
- `OUTLINE.md` updated after `DRAFT.md`: draft may need refresh.
- `DRAFT.md` updated after `FACT-CHECK.md`: fact-check may need refresh.
- `FACT-CHECK.md` has HIGH issues or claims marked verify-before-publication: do not export without user acknowledgement.
- `FEEDBACK-PLAN.md` pending approval: do not revise until user approves handling.

Use file modification times only as a hint; do not overstate certainty.

## 3. Research Compression Check

If `.paper/RESEARCH.json` exists, check whether it appears to include the canonical structured evidence package:

- research_plan
- source_registry
- evidence_matrix
- synthesis_matrix
- contradictions
- open_questions
- draft_support_notes

If `.paper/RESEARCH.json` is missing but `.paper/RESEARCH.md` exists, check whether it appears to include a compressed evidence map:

- `Claim Evidence Map`
- supporting evidence
- opposing evidence
- confidence
- source gaps
- facts safe to use
- claims to soften/drop

If these are missing, recommend `/gpd-research` before `/gpd-outline`.

Hard rule reminder:

Raw `.paper/sources/` material is not downstream context. Downstream outline/draft should read compressed `.paper/RESEARCH.json` first when present, then `.paper/RESEARCH.md` as summary, unless verifying a specific source.

## 4. Determine Suggested Next Command

Recommend exactly one next command and explain why.

Use this order:

1. Missing `.paper/PROJECT.md`, `.paper/PERSONA.md`, `.paper/AUDIENCE.md`, or `.paper/BRIEF.md` → `/gpd-brief` or `/gpd-audience` / `/gpd-persona` depending on the missing file.
2. `AUDIENCE.md` exists but does not declare curated personas or a custom audience → `/gpd-audience`.
3. `BRIEF.md` exists but thesis/claims/audience are visibly placeholder-like → `/gpd-brief`.
4. `STRATEGY.md` missing → `/gpd-brief` to run the strategy gate before research, outline, or drafting.
5. `STRATEGY.md` exists and says `Revise Before Drafting` or `No-Go` → `/gpd-brief`; include the `Strategy Blockers` primary blocker in the explanation.
6. `RESEARCH.json` missing or lacks the structured evidence package → `/gpd-research`.
7. `OUTLINE.md` missing → `/gpd-outline --deep` when `RESEARCH.json` or `STRATEGY.md` exists, the paper is serious/researched/high-stakes, or target length is about 1,200+ words; otherwise `/gpd-outline --lite`.
8. `DRAFT.md` missing → `/gpd-draft`.
9. `FACT-CHECK.md` missing and draft contains sourced, factual, current, technical, market, regulatory, numerical, or publication-sensitive claims → `/gpd-fact-check --full`.
10. `REVIEW.md` missing → `/gpd-review --deep` for mature draft, or `/gpd-review --lite` for early draft/outline.
11. User wants external critique and `EXTERNAL-REVIEWS.md` missing → `/gpd-review --external`.
12. `FEEDBACK-PLAN.md` exists and is pending approval → ask user to approve/revise/ignore feedback plan before `/gpd-revise`.
13. `REVIEW.md`, `FACT-CHECK.md`, or approved `FEEDBACK-PLAN.md` indicates changes needed → `/gpd-revise`.
14. `exports/FINAL.md` missing and review is ready → `/gpd-export`.
15. Final exists → paper appears exported; recommend review only if new changes are planned.

## 5. Context Guidance

Always include context guidance:

- whether to clear context before the next command
- which artifacts the next command should read
- which artifacts it should avoid by default

Default guidance:

- Before `/gpd-research`: clear context if coming from intake/brief discussion.
- Before `/gpd-outline`: clear context after research; read compressed `RESEARCH.json`, not raw sources. Use Lite for early/short/import triage and Deep for serious/researched/high-stakes papers.
- Before `/gpd-draft`: clear context after outline; read `PERSONA.md`, `AUDIENCE.md`, `BRIEF.md`, `RESEARCH.json`, `OUTLINE.md`.
- Before `/gpd-fact-check`: clear context after drafting; read `DRAFT.md`, compressed `RESEARCH.json`, `BRIEF.md`, `AUDIENCE.md`, and source policy. Avoid raw sources except for specific verification.
- Before `/gpd-review`: clear context after drafting; read draft and upstream artifacts.
- Before `/gpd-revise`: clear context after review; read approved feedback plan and draft.

## 6. Output Format

Return:

```markdown
# GPD Progress

## Current Status

- **Detected stage:** [stage]
- **State file says:** [summary]
- **Suggested next command:** `/gpd-...`
- **Why:** [one or two sentences]

## Artifact Health

| Artifact | Status | Notes |
|----------|--------|-------|
| PROJECT.md | [OK/Missing/Empty/Stale?] | [notes] |

## Risks / Blockers

- [risk]

## Context Guidance

- **Clear context before next step:** [Yes/No]
- **Next step should read:** [files]
- **Avoid loading:** [files/directories]

## Command

Run:

```text
/gpd-...
```
```

</process>
