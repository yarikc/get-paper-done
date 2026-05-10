# Writing Artifact Model

Get Paper Done uses `.paper/` as the durable context directory for a single piece.

## Artifact Lifecycle

Setup creates only the durable context needed to start:

- `PROJECT.md`: what the piece is, why it exists, and its intended outcome
- `PERSONA.md`: the paper-scoped author voice and argument posture
- `AUDIENCE.md`: the reader model, objections, and desired belief shift
- `BRIEF.md`: thesis, claims, constraints, and definition of done
- `STRATEGY.md`: strategic readiness gate, paper job, thesis package, posture, decision usefulness, and scope
- `STATE.md`: human-readable current stage, blockers, approvals, and suggested next command
- `STATE.json`: machine-readable state companion used by CLI status and validation
- `config.json`: workflow preferences

Later stages create these on demand:

- `RESEARCH.json`: canonical structured evidence package
- `RESEARCH.md`: short human-readable research summary/index
- `OUTLINE.md`: argument architecture, reader journey, section architecture, evidence placement, objection handling, and mode-specific diagnostics
- `DRAFT.md`: current draft
- `FACT-CHECK.md`: claim inventory, source alignment, factual risk, source gaps, and recommended factual handling
- `REVIEW.md`: argument, audience, structure, persona, decision-usefulness, and publication-readiness review
- `EXTERNAL-REVIEWS.md`: optional raw and summarized feedback from external AI reviewers
- `FEEDBACK-PLAN.md`: proposed handling of local/external feedback before revision

Import-specific and supporting material:

- `IMPORT.md`: import manifest and assessment when a paper starts from existing material
- `.paper/sources/`: paper-specific source files, excerpts, notes, and research material
- `original/`: preserved copy of imported draft/spec/research/version material, stored outside `.paper/`
- `audiences/*.md`: reusable audience personas that can be selected and adapted into `.paper/AUDIENCE.md`

## Workspace Location

`/gpd-new-paper` should ask where to create the paper project unless `--location` is provided. It creates:

```text
[location]/[paper-slug]/.paper/
```

The paper slug should be derived from the working title or topic unless `--slug` is provided.

`/gpd-import-paper` follows the same location and slug behavior, but also creates:

```text
[location]/[paper-slug]/original/
```

The `original/` directory is for preserved imported material. The import workflow should copy relevant source files into `original/` before analyzing or deriving `.paper/` artifacts.

## Consumption Rules

Every drafting or revision workflow must read:

1. `.paper/PERSONA.md`
2. `.paper/AUDIENCE.md`
3. `.paper/BRIEF.md`

Every outline, draft, fact-check, review, and revision workflow must also read:

1. `.paper/RESEARCH.json` when present
2. `.paper/RESEARCH.md` as summary/index when present
3. `.paper/OUTLINE.md`
4. `.paper/DRAFT.md`

Drafting defaults to section-by-section for serious, researched, executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers. Full-draft mode is reserved for short pieces or explicit user requests. Redraft-from-comments mode updates only requested sections and must include a change log.

Fact-check workflows write factual-risk findings to `.paper/FACT-CHECK.md`. Review workflows should read `FACT-CHECK.md` when present and preserve known factual-risk findings instead of duplicating or smoothing them over.

External review workflows must write feedback to `.paper/EXTERNAL-REVIEWS.md` and proposed handling to `.paper/FEEDBACK-PLAN.md`. They must not change `.paper/DRAFT.md`.

## Project Vs Brief

Keep `PROJECT.md` short. It answers what the paper is, why it exists, where it will be used, and what operating constraints matter.

Keep argument detail in `BRIEF.md`: thesis, claims, objections, proof standard, constraints, and definition of done.

Do not duplicate the full thesis/claims deck in `PROJECT.md`. If the argument changes, update `BRIEF.md` first and only adjust `PROJECT.md` when the paper's identity, format, audience, or operating constraints change.

## Strategy Gate

`STRATEGY.md` is the strategic readiness gate.

The strategist challenges by default and returns:

- `Go`: strategically ready for research or drafting.
- `Revise Before Drafting`: promising idea, but the strategic core is weak.
- `No-Go`: topic is too vague, multi-purpose, mis-scoped, reader-misaligned, or not worth writing in current form.

`Revise Before Drafting` and `No-Go` block `/gpd-research`, `/gpd-outline`, and `/gpd-draft` unless the user explicitly overrides the block.

`STRATEGY.md` must include `Strategy Blockers` so workflow routing does not depend on prose interpretation:

- `Blocking issues`: `none` or one or more of `scope_too_broad`, `thesis_weak`, `audience_unclear`, `audience_conflict`, `evidence_gap`, `weak_ask`, `poor_posture`, `missing_outcome`, `reader_promise_weak`, `decision_usefulness_weak`
- `Primary blocker`: the first blocker to fix, or `none`
- `Block severity`: `None`, `Medium`, or `High`
- `Required unblock action`: `none`, `brief_revision`, `audience_revision`, `thesis_revision`, `scope_narrowing`, `research_plan`, or `user_override`

The strategy gate checks:

- paper job
- reader promise
- thesis quality
- argument posture
- decision usefulness
- scope discipline
- reader questions
- strategic gaps
- strategy blockers

## Profile Scope

Persona and audience profiles are paper-scoped by default. A reusable global profile can be imported, but the local `.paper/` profile is always authoritative for the current piece.

Reusable profiles may live in `profiles/*.md`. Importing a reusable profile should adapt it into `.paper/PERSONA.md`; workflows should not treat the reusable profile as more authoritative than the local paper profile.

## Audience Scope

Reusable audience personas live in `audiences/*.md`.

Default curated personas:

- `audiences/cxo-reader.md`
- `audiences/distinguished-architect-engineer.md`
- `audiences/business-operating-executive.md`
- `audiences/public-technical-reader.md`

Users may select one or multiple audience personas. Multiple personas require:

- priority order
- conflict rule
- success condition for each audience

Existing audience personas must not be used blindly. Before using them, summarize the selected persona(s), suggest paper-specific improvements, and ask the user to approve or modify the resulting `.paper/AUDIENCE.md`.

Audience selection should always present curated options plus a custom audience option:

- CxO reader
- Distinguished architect / engineer
- Business or operating executive
- Public technical reader
- Create new custom audience
- Hybrid / curated plus custom edits

Drafting cannot proceed unless `.paper/AUDIENCE.md` declares either selected curated personas or a custom audience.

Audience review uses one internal reviewer:

- `audience-reviewer`: reads `.paper/AUDIENCE.md` and any selected `audiences/*.md` files

Users choose audiences, not agents. Curated audience files carry the reader-specific concerns. Audience review uses `references/audience-review-rubric.md`.

Curated audience persona lifecycle:

- `/gpd-curate-audience --new`: create a reusable audience persona
- `/gpd-curate-audience --review <slug>`: assess and propose improvements
- `/gpd-curate-audience --edit <slug>`: update an approved reusable persona

Curated persona changes require approval before writing. Paper-specific adaptations belong in `.paper/AUDIENCE.md`, not in `audiences/*.md`.

## Source Scope

Repository-level `references/` contains system guidance and rubrics. It is not for paper-specific evidence. Paper-specific research belongs in `.paper/sources/`, compressed into `.paper/RESEARCH.json`, and summarized in `.paper/RESEARCH.md`.

If an imported source folder already contains directories named `references/`, `research/`, `sources/`, `drafts/`, `versions/`, `specs/`, `assets/`, or similar, those should be copied under `original/` first. Their useful contents can then be converted into `.paper/RESEARCH.json` and summarized or linked from `.paper/RESEARCH.md`, `.paper/BRIEF.md`, or `.paper/OUTLINE.md`.

## Import Stage

`/gpd-import-paper` is for papers already started outside the framework.

It should:

- ask for the source file or source directory
- ask for destination location and paper slug
- create `[location]/[paper-slug]/original/`
- copy the original draft, versions, specs, research, references, diagrams, and review material into `original/`
- avoid copying unrelated build/cache/git directories
- create `.paper/IMPORT.md`
- derive only minimal framework artifacts around the imported material

Import must preserve original material unchanged. It may create a normalized `.paper/DRAFT.md` from the canonical imported draft, but it should not rewrite the draft during import.

Import should not generate `.paper/RESEARCH.json`, `.paper/RESEARCH.md`, `.paper/OUTLINE.md`, `.paper/FACT-CHECK.md`, or `.paper/REVIEW.md` by default. Those stages are intentionally separate to avoid context overload:

- `/gpd-research` compresses imported/source material into a decision-useful evidence package.
- `/gpd-outline` structures the paper after brief and research are clear. Lite is for early shaping, short pieces, and first-pass triage of messy imported drafts; Deep is the default for serious, researched, executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers.
- `/gpd-review` reviews the draft after import context is cleared.

After import, show the user a small post-import menu:

1. `/gpd-research` if evidence or counterevidence needs to be compressed.
2. `/gpd-outline --lite` if imported structure should be quickly triaged, or `/gpd-outline --deep` if it is already a serious/researched/high-stakes piece.
3. `/gpd-review --external` if the current draft is coherent enough for independent review.

If the imported draft is already publication-sensitive and contains material factual claims, add a conditional note recommending `/gpd-fact-check --risk-scan` before external review or export. Keep the default import menu small.

If thesis, audience, or paper type is unclear, recommend `/gpd-brief` before the three choices.

## Research Stage

`/gpd-research` is the evidence-for/evidence-against checkpoint. It happens after `.paper/BRIEF.md` defines thesis and claims, and before `.paper/OUTLINE.md` fixes the narrative structure.

Default depth is `standard`. The researcher infers research questions from `BRIEF.md`, presents a research plan before collecting sources, and gives the user a chance to adjust questions, depth, or source mode.

If imported or user-provided research exists in `original/` or `.paper/sources/`, ask how to use it:

- `provided-first`: verify, improve, and convert provided material into GPD research format, then use web for gaps and counterevidence
- `provided-only`: use provided material only
- `web-first`: start fresh from web and reconcile with provided material
- `web-only`: ignore provided material

For each major claim, the research stage should capture:

- supporting evidence
- opposing evidence
- illustrative evidence
- source gaps
- confidence level
- implications for thesis, caveats, or recommendations

Hard rule: research is not complete until it is compressed into `.paper/RESEARCH.json`. Raw research belongs in `.paper/sources/`; downstream outline and draft workflows read `.paper/RESEARCH.json` first when present, then `.paper/RESEARCH.md` as a short summary. They do not read the raw source dump by default.

The compressed `RESEARCH.json` should identify:

- inferred research questions and approved research plan
- source registry with authority, freshness, relevance, specificity, bias/agenda, and stance
- best supporting evidence per claim
- best opposing evidence per claim
- synthesis matrix by theme
- contradictions and possible explanations
- facts safe to use
- claims to soften
- claims to drop
- source gaps
- draft support notes by section where outline/draft context exists
- implications for the thesis, outline, or recommendations

## Outline Stage

`/gpd-outline` creates `.paper/OUTLINE.md` from the strategy, brief, audience, persona, and compressed research. It should read `RESEARCH.json` first when present and avoid raw source dumps by default.

Depth modes:

- **Lite:** fast structure pass for early shaping, short pieces under about 1,200 words, or first-pass triage of messy imported drafts. Produces the core outline only.
- **Deep:** default when `RESEARCH.json` or `.paper/STRATEGY.md` exists, and for executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers. Adds `Deep Mode Additions`.

Output modes:

- **outline_only:** default.
- **outline_plus_skeleton:** only when explicitly requested; adds headings, topic sentences, support bullets, evidence placeholders, objection placeholders, and transition notes. It must not become polished prose.

`OUTLINE.md` must use reader-state cells that name a specific belief, doubt, or decision question. Bare role descriptions such as "CxO reader" or "technical audience" are invalid unless they include what that reader believes, doubts, or needs to decide.

Deep mode adds:

- structure-selection rubric
- draft-readiness scorecard
- severity-scored structural anti-patterns tied to the selected audience and author anti-fluff profile
- reader jump analysis
- evidence / objection load check

## Multi-Model Review Stage

`/gpd-review --external` can request feedback from installed external AI CLIs or local model servers. Use `/gpd-review --external --models claude,gemini,codex` to limit reviewers. Older aliases such as `/gpd-review --all` and `/gpd-review --claude --gemini` remain acceptable for compatibility.

The review stage has three outputs:

- `.paper/REVIEW.md`: local review
- `.paper/EXTERNAL-REVIEWS.md`: raw and summarized external model feedback
- `.paper/FEEDBACK-PLAN.md`: evaluated handling plan

The feedback plan must classify each item as incorporate, ignore, defer, or ask user. No draft or upstream artifact should be changed until the user approves the proposed handling.

## Fast Intake

The fast intake path captures:

- Audience
- Problem
- Thesis
- Three claims
- Best evidence
- Main counterargument
- Recommendation
- Tone notes
- What to avoid
- Draft length

Use fast intake when speed matters, but preserve source gaps and unsupported claims for later research.
