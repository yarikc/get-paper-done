<purpose>
Draft the paper from the established context.
</purpose>

<required_reading>
- .paper/PROJECT.md
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/BRIEF.md
- .paper/STRATEGY.md if present
- .paper/RESEARCH.json if present
- .paper/RESEARCH.md if present
- .paper/OUTLINE.md
- .paper/DRAFT.md if present
- .paper/REVIEW.md if redrafting from review comments
- .paper/EXTERNAL-REVIEWS.md if redrafting from external model feedback
- .paper/FEEDBACK-PLAN.md if redrafting from approved feedback
- templates/draft.md
</required_reading>

<process>

Read all required context. If `OUTLINE.md` is missing, ask whether to create an outline first.

If `.paper/STRATEGY.md` exists and its status is `Revise Before Drafting` or `No-Go`, stop before drafting unless the user explicitly says to override the strategy block. Recommend `/gpd-brief` to revise the strategic core and cite the primary blocker from `Strategy Blockers` when present.

Before drafting, verify `.paper/AUDIENCE.md` exists and declares either selected curated personas or a custom audience. If not, stop and recommend `/gpd-audience`.

If `.paper/OUTLINE.md` has verdict `Needs research first`, `Needs brief clarification`, or `Strategy blocked`, stop before drafting unless the user explicitly says to override.

Default to `section_draft` for serious, researched, executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers. Use `full_draft` only for short pieces under about 1,200 words, simple newsletters/blogs, or when the user explicitly requests full draft mode. Use `redraft_from_comments` only when the user supplies comments, review notes, or an approved feedback plan and asks to update specific sections.

Supported intent flags:

- `--section <name>`: draft or replace a specific outline section.
- `--next-section`: draft the next undrafted section from `OUTLINE.md`.
- `--full`: draft the whole paper in one pass. Use sparingly.
- `--redraft-from-comments`: update only requested sections from comments or approved feedback.

If no section is specified and `section_draft` applies, identify the next undrafted section from `OUTLINE.md` and `.paper/DRAFT.md`. Ask only if multiple next sections are plausible.

Write `.paper/DRAFT.md`. In `section_draft` mode, append or replace only the target section and preserve existing sections unless the user explicitly asks to revise them.

Drafting rules:

- obey persona directives
- meet the audience at the right expertise level
- make the thesis clear
- support claims using `RESEARCH.json` when present, with `RESEARCH.md` as a summary/index
- address the strongest likely objection
- stay within the requested length range unless the brief says otherwise
- preserve the outline's section objective, reader-state transition, and transition to next
- build a section intent map before prose, including specific reader state in/out and length/density target
- use style controls from project, brief, persona, or user request; default to direct, analytical, lean-to-standard density
- mark unresolved evidence as `[NEEDS EVIDENCE: ...]`
- mark required user decisions as `[AUTHOR DECISION: ...]`
- mark upstream structure problems as `[STRUCTURE ISSUE: ...]`
- include a change log in `redraft_from_comments` mode
- avoid generic filler and meta-explanations about the writing process

Update `.paper/STATE.md` and `.paper/STATE.json` with the next suggested command:

- `/gpd-draft --next-section` if `section_draft` mode was used and undrafted outline sections remain.
- `/gpd-fact-check --full` once all required sections are drafted and the draft contains factual, current, technical, market, regulatory, numerical, citation-dependent, or publication-sensitive claims.
- `/gpd-review` once all required sections are drafted and fact-checking is not needed.
- `/gpd-fact-check --full` after `full_draft` mode when the draft contains factual, current, technical, market, regulatory, numerical, citation-dependent, or publication-sensitive claims.
- `/gpd-review` after `full_draft` mode when fact-checking is not needed.
- `/gpd-fact-check --publication` after `redraft_from_comments` mode if factual claims, source-backed claims, or factual risk language changed.
- `/gpd-review` after `redraft_from_comments` mode unless the approved feedback plan still has unapplied items or fact-checking is needed.

</process>
