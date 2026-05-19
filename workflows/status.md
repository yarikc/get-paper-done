<purpose>
Report the paper dashboard inside Claude/Codex: current state, artifact completeness, blockers, suggested next command, why that command is next, and context-clearing guidance. This command is intentionally read-only and should not execute the next stage.
</purpose>

<process>

If `--json` is present, return the same status fields in a compact JSON object when the active runtime supports structured output. If structured output is not available, keep the normal Markdown format and include a note that `--json` could not be honored by the slash-command runtime.

## 1. Locate Paper Workspace

If `.paper/` is missing:

- If `original/` exists, recommend `/gpd-import` was likely started incorrectly or the user is inside an imported paper directory without `.paper/`.
- Otherwise recommend `/gpd-new` for a new paper or `/gpd-import` for an existing draft/folder.
- Stop.

Read `.paper/STATE.json` first if it exists, then `.paper/STATE.md` for human notes. If both are missing, report that state is missing and recommend reconstructing with `/gpd-status` output plus manual state repair.

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
- FEEDBACK-EXTERNAL.md
- FEEDBACK-READER.md
- FEEDBACK-PLAN.md
- REVISION-CHECK.md
- REVISION-LOG.md
- PAPER-CONTEXT.md
- DECISIONS.md
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
- `FEEDBACK-READER.md` exists without `FEEDBACK-PLAN.md`, or is newer than `FEEDBACK-PLAN.md`: synthesize reader feedback through `/gpd-review` before revision.
- `FEEDBACK-PLAN.md` pending approval: do not revise until user approves handling.
- `REVIEW.md` Below-Target Improvement Gate says immediate improvement is required before export: route to `/gpd-revise`.
- `DRAFT.md` changed substantively after review/export and no current `REVISION-CHECK.md` exists: require `/gpd-review` or a revision-check pass before export confidence.
- `STATE.json` `grill.status` is not `Complete`, or required `grill.resolved_decisions` are missing: recommend `/gpd-grill` before `/gpd-brief`.
- `PAPER-CONTEXT.md` or `DECISIONS.md` newer than `BRIEF.md`: recommend `/gpd-brief` so the formal brief absorbs the clarified context.
- An agent detects unresolved thesis, audience, term, scope, proof-standard, or non-goal ambiguity after downstream work exists: recommend `/gpd-grill` first, then `/gpd-brief` after resolution.

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
3. `STATE.json` `grill.status` is not `Complete`, or the required grill decision keys are missing → `/gpd-grill`.
4. `BRIEF.md` exists but thesis/claims/audience are visibly placeholder-like → `/gpd-brief`.
5. `STRATEGY.md` missing → `/gpd-brief` to run the strategy gate before research, outline, or drafting.
6. `STRATEGY.md` exists and says `Revise Before Drafting` or `No-Go` → `/gpd-brief` or `/gpd-grill` when ambiguity is author-intent/narrative-language related; include the `Strategy Blockers` primary blocker in the explanation.
7. `PAPER-CONTEXT.md` or `DECISIONS.md` is newer than `BRIEF.md` → `/gpd-brief` for brief refresh.
8. `BRIEF.md` or `STRATEGY.md` is newer than `RESEARCH.json` → `/gpd-research` for incremental research refresh.
9. `RESEARCH.json` is newer than `OUTLINE.md` → `/gpd-outline --deep` for outline refresh.
10. `OUTLINE.md` is newer than `DRAFT.md` → `/gpd-draft` for draft refresh.
11. `DRAFT.md` is newer than `FACT-CHECK.md` → `/gpd-fact-check --full` for claim refresh.
12. `DRAFT.md` or `FACT-CHECK.md` is newer than `REVIEW.md` → `/gpd-review --deep` for review refresh.
13. `RESEARCH.json` missing or lacks the structured evidence package → `/gpd-research`.
14. `OUTLINE.md` missing → `/gpd-outline --deep` when `RESEARCH.json` or `STRATEGY.md` exists, the paper is serious/researched/high-stakes, or target length is about 1,200+ words; otherwise `/gpd-outline --lite`.
15. `DRAFT.md` missing → `/gpd-draft`.
16. `FACT-CHECK.md` missing and draft contains sourced, factual, current, technical, market, regulatory, numerical, or publication-sensitive claims → `/gpd-fact-check --full`.
17. `REVIEW.md` missing → `/gpd-review --deep` for mature draft, or `/gpd-review --lite` for early draft/outline.
18. User wants external critique and `FEEDBACK-EXTERNAL.md` missing → `/gpd-review --external`.
19. `FEEDBACK-READER.md` exists without `FEEDBACK-PLAN.md`, or is newer than `FEEDBACK-PLAN.md` → `/gpd-review` to synthesize feedback into a plan.
20. `FEEDBACK-PLAN.md` exists and is pending approval → `/gpd-status`; ask user to approve/revise/ignore feedback plan before `/gpd-revise`.
21. `FACT-CHECK.md` recommended next action is `/gpd-research` or `/gpd-revise` → use that command.
22. `REVIEW.md` verdict is `Revise` or `Rework` → `/gpd-revise`.
23. `REVIEW.md` Below-Target Improvement Gate says immediate improvement is required before export → `/gpd-revise`.
24. Approved `FEEDBACK-PLAN.md` indicates changes needed → `/gpd-revise`.
25. `exports/FINAL.md` missing and review is ready → `/gpd-export`.
26. `DRAFT.md`, `FACT-CHECK.md`, or `REVIEW.md` is newer than `exports/FINAL.md` → `/gpd-export`.
27. Before treating a reviewed/exported paper as example-quality or handoff-ready, recommend running `gpd validate --semantic --paper <paper-dir>` from the shell. If semantic validation reports HIGH issues, recommend the earliest affected workflow stage before archive/export confidence.
28. Final exists and is current → paper appears exported; recommend `/gpd-status` or archive/next-paper planning unless new changes are planned.

Treat `STATE.json` `suggested_next_command` as a useful saved recommendation, not permission to skip structurally required artifacts. For example, do not recommend `/gpd-export` unless a draft and review exist, and do not recommend `/gpd-draft` unless an outline exists.

## 5. Human Action Hint

Users should not need to remember the whole workflow. Always include a short "what you do now" line after the next command:

- If next is `/gpd-export`: "Run export, then review `.paper/exports/FINAL.md`."
- If `exports/FINAL.md` is current and no writing stage is pending: "Read `.paper/exports/FINAL.md`. If you add comments there, run `gpd feedback`, then `/gpd-review`."
- If next is `/gpd-review` and `exports/FINAL.md` exists: "Review will capture comments from the exported reading copy into feedback artifacts before revision."
- If next is `/gpd-revise`: "Revision edits `.paper/DRAFT.md`; export regenerates `.paper/exports/FINAL.md`."
- Otherwise: "Run the recommended command, then run `/gpd-status` again."

## 6. Context Guidance

Always include context guidance:

- whether to clear context before the next command
- which artifacts the next command should read
- which artifacts it should avoid by default

Default guidance:

- Before `/gpd-research`: clear context if coming from intake/brief discussion.
- Before `/gpd-grill`: keep context focused on import/intake artifacts or the specific later ambiguity; ask one question at a time and update `PAPER-CONTEXT.md`, `DECISIONS.md`, and `STATE.json.grill` as ambiguity resolves.
- Before `/gpd-outline`: clear context after research; read compressed `RESEARCH.json`, not raw sources. Use Lite for early/short/import triage and Deep for serious/researched/high-stakes papers.
- Before `/gpd-draft`: clear context after outline; read `PERSONA.md`, `AUDIENCE.md`, `BRIEF.md`, `RESEARCH.json`, `OUTLINE.md`.
- Before `/gpd-fact-check`: clear context after drafting; read `DRAFT.md`, compressed `RESEARCH.json`, `BRIEF.md`, `AUDIENCE.md`, and source policy. Avoid raw sources except for specific verification.
- Before `/gpd-review`: clear context after drafting; read draft, reader feedback if present, and upstream artifacts.
- Before `/gpd-revise`: clear context after review; read approved feedback plan, reader feedback if present, and draft.

## 7. Output Format

Return:

```markdown
# GPD Progress

## Current Status

- **Detected stage:** [stage]
- **State file says:** [summary]
- **Suggested next command:** `/gpd-...`
- **Why:** [one or two sentences]
- **What you do now:** [one sentence from the Human Action Hint section]

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
