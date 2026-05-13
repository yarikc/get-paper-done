<purpose>
Build a structured evidence package that identifies evidence for and against the argument before outline and drafting.
</purpose>

<required_reading>
- .paper/PROJECT.md
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/BRIEF.md
- .paper/STRATEGY.md if present
- .paper/OUTLINE.md if present
- .paper/DRAFT.md if present
- templates/research.json
- templates/research.md
</required_reading>

<process>

## 1. Parse Depth And Source Mode

If `.paper/STRATEGY.md` is missing, stop before researching and recommend `/gpd-brief` to run the strategy gate. Research may proceed without `STRATEGY.md` only if the user explicitly says to override the missing strategy gate; mark the research plan as `Strategy gate missing override` and list the risk being accepted.

If `.paper/STRATEGY.md` exists and its status is `Revise Before Drafting` or `No-Go`, stop before researching unless the user explicitly says to override the strategy block. Recommend `/gpd-brief` to revise the strategic core and cite the primary blocker from `Strategy Blockers` when present.

If `.paper/STRATEGY.md` exists and is not blocking, use it as the primary strategic frame for approved thesis, document job, argument posture, reader promise, and scope boundaries. Use `.paper/BRIEF.md` for supporting claims and constraints. If `STRATEGY.md` and `BRIEF.md` conflict, flag the conflict in the research plan before collecting sources.

Parse depth flags:

- `--rapid`: small number of high-value sources, 3-7 key findings, minimal matrices.
- `--standard`: default. Full research brief, source registry, evidence matrix, synthesis matrix, contradictions, open questions, and draft support notes.
- `--deep`: broader source search and more explicit treatment of disagreements, uncertainty, and section-level support.

If no depth flag is provided, use `standard`.

Parse source mode flags:

- `--provided-first`: inspect `original/` and `.paper/sources/` first, then use web for gaps, verification, and counterevidence.
- `--provided-only`: use only user-provided/imported material.
- `--web-first`: start with web research, then reconcile with provided material.
- `--web-only`: use web sources only.

If no source mode is provided:

- If `original/` or `.paper/sources/` contains material, ask the user to choose:
  - `provided-first` - verify, improve, and convert provided material into GPD research format
  - `provided-only` - use provided material only
  - `web-first` - start fresh from web and reconcile later
  - `web-only` - ignore provided material
- Otherwise use `web-first` if web research is allowed by `.paper/config.json`.

Use `.paper/config.json` classification to calibrate evidence burden:

- `regulated` or `external_high` risk requires stronger source authority, source alignment notes, and fact-check readiness.
- `decision_memo` research should support the ask, options, evidence basis, objections, and operating implications without becoming a literature review.
- `explainer` research should prioritize definitions, mechanisms, examples, limits, and source authority.
- `update` research is optional unless the update makes factual, external, regulatory, numerical, or high-stakes claims.

## 2. Infer Research Questions And Present Plan

Read project, persona, audience, brief, strategy when present, and optional outline/draft.

Identify:

- claims that need support, reconciled with strategy when present
- likely counterarguments
- audience proof standard
- sources already supplied by the user
- source gaps
- draft or outline sections needing support

Infer research questions from `.paper/BRIEF.md`, reconciled with `.paper/STRATEGY.md` when present. Map each research question to one or more claims.

Build a research plan with:

- depth
- source mode
- inferred research questions
- claim mapping
- planned source types
- initial search queries
- known user-provided/imported source locations
- strategy/brief conflicts, if any
- likely gaps and contradictions to investigate

Before collecting sources, present the plan and ask whether to proceed, edit the plan, or change depth/source mode.

Use AskUserQuestion when available:

- header: "Research Plan"
- question: "Proceed with this research plan?"
- options:
  - "Proceed" - Run the plan as shown
  - "Edit plan" - Let the user adjust questions, depth, or source mode
  - "Narrow" - Reduce scope before researching

If AskUserQuestion is unavailable, ask the same question in plain text and wait.

## 3. Collect And Triage Sources

If web research is available and allowed by `.paper/config.json`, research current or factual claims using reliable primary sources where possible.

For each candidate source, evaluate:

- authority
- freshness
- relevance
- specificity
- bias or agenda
- stance: supportive, neutral, critical, or mixed

Only keep sources worth citing or useful for contradiction/gap analysis.

Source preference:

- official docs, standards, regulations, and primary announcements where relevant
- peer-reviewed or high-quality research for technical/academic claims
- reputable industry analyses for market/industry claims
- credible practitioner sources only when appropriate for the audience proof standard

## 4. Extract Evidence

For each major claim, explicitly classify:

- **Supporting evidence:** evidence that strengthens the claim
- **Opposing evidence:** evidence that challenges, narrows, or complicates the claim
- **Illustrative evidence:** examples or anecdotes useful for explanation but not sufficient as proof
- **Claim-source fidelity:** whether each source directly supports the exact claim wording, partially supports it, is only topically related, contradicts it, or has not been checked
- **Confidence:** high, medium, or low
- **Implication:** how the evidence changes the thesis, caveats, or recommendations

Separate facts from interpretations. Extract useful facts, numbers, dates, definitions, mechanisms, caveats, limitations, and short quote candidates.

## 5. Build Matrices

Create `.paper/RESEARCH.json` using `templates/research.json`.

Include:

- research plan and user feedback
- research brief
- source registry
- evidence matrix
- synthesis matrix
- contradictions
- open questions
- draft support notes
- facts safe to use
- claims to soften
- claims to drop or reframe

If `.paper/OUTLINE.md` or `.paper/DRAFT.md` exists, add section-level draft support notes. If a draft exists but sections needing support are not specified, infer sections that make strong claims without clear evidence.

## 6. Write A Short Markdown Index

Write `.paper/RESEARCH.md` as a short human-readable index to `.paper/RESEARCH.json`.

It should include:

- evidence verdict
- key findings
- highest-risk contradictions
- claims to soften/drop
- open questions that block drafting
- pointer that `.paper/RESEARCH.json` is canonical

Do not duplicate the full source registry or matrices in Markdown unless explicitly requested.

Hard rule: research is not complete until raw material is compressed into `.paper/RESEARCH.json`. Raw research is never passed downstream by default.

Store paper-specific source material under `.paper/sources/`. Do not use repository-level `references/` for paper-specific research because that directory is reserved for system guidance.

Downstream workflows should read `.paper/RESEARCH.json` first when present, then `.paper/RESEARCH.md` as a summary. Do not load raw `.paper/sources/` or `original/` unless verifying a specific source.

Update `.paper/STATE.md` and `.paper/STATE.json` with suggested next command: `/gpd-outline --deep`, because completed research normally means the paper is ready for full argument-architecture diagnostics.

</process>
