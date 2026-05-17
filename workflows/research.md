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
- author-specific terms, phrases, examples, and communities named during grill/brief that should become search queries

Infer research questions from `.paper/BRIEF.md`, reconciled with `.paper/STRATEGY.md` when present. Map each research question to one or more claims.

Build source-lane coverage into the plan. For serious papers, include at least these lanes unless explicitly out of scope:

- **Official/regulatory/standards lane:** authority sources for obligations, definitions, rules, and durable requirements.
- **Empirical/counterevidence lane:** studies, benchmarks, failure cases, or credible evidence that narrows or challenges the thesis.
- **Industry trend lane:** current market, adoption, product, or operating-model evidence.
- **Practitioner/operating-model lane:** credible practitioner communities, architecture/engineering sources, implementation patterns, and field-tested mechanisms accepted by the target audience.

For architecture, engineering operating-model, platform, or AI-delivery papers, the practitioner/operating-model lane must include searches for architecture-practitioner sources when relevant, such as InfoQ, Thoughtworks, Martin Fowler, Team Topologies, CNCF/platform engineering, DORA, and comparable domain communities. Use these sources as practitioner support or analogies, not as regulatory proof.

Expand queries from author language. Extract distinctive phrases from `.paper/PAPER-CONTEXT.md`, `.paper/DECISIONS.md`, `.paper/BRIEF.md`, and grill-derived notes, then turn them into search terms. Examples: `engineering flow`, `world model`, `context engineering`, `agentic harness`, `spec-driven development`, `declarative architecture`, `decision boundaries`, `guardrails`, `human by exception`, or any domain-specific phrase the author uses.

Build a research plan with:

- depth
- source mode
- inferred research questions
- claim mapping
- planned source types
- initial search queries
- source-lane coverage
- author-language query expansion
- known user-provided/imported source locations
- strategy/brief conflicts, if any
- likely gaps and contradictions to investigate
- expected-source checkpoint asking whether the author expects specific sources, standards, authors, communities, or competitor papers to appear

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

Before finalizing the retained source set, perform an expected-source checkpoint:

- Ask whether the author expected any source, standard, author, community, company report, or paper that is missing.
- If the author is unavailable and the paper is serious, self-check whether one of the required source lanes is thin or absent.
- If a lane is thin, either add sources or record the gap explicitly in `open_questions` and `draft_support_notes`.

## 4. Extract Evidence

For each major claim, explicitly classify:

- **Supporting evidence:** evidence that strengthens the claim
- **Opposing evidence:** evidence that challenges, narrows, or complicates the claim
- **Illustrative evidence:** examples or anecdotes useful for explanation but not sufficient as proof
- **Claim-source fidelity:** whether each source directly supports the exact claim wording, partially supports it, is only topically related, contradicts it, or has not been checked
- **Confidence:** high, medium, or low
- **Implication:** how the evidence changes the thesis, caveats, or recommendations

Separate facts from interpretations. Extract useful facts, numbers, dates, definitions, mechanisms, caveats, limitations, and short quote candidates.

For each core claim, extract evidence nuggets useful to the writer and reviewer. A source ID alone is not enough. Record 1-3 concise items per core claim where available:

- fact, mechanism, definition, example, or caution
- exact source ID
- how it should be used in prose
- caveat or limit on the wording it supports

## 5. Build Matrices

Create `.paper/RESEARCH.json` using `templates/research.json`.

Include:

- research plan and user feedback
- source-lane coverage and author-language query expansion when used
- research brief
- source ranking that makes source priority explicit
- source registry
- evidence matrix
- synthesis matrix
- contradictions
- open questions
- draft support notes
- facts safe to use
- claims to soften
- claims to drop or reframe

For every retained source, make the source useful to a human reviewer. `source_registry[*]` must include:

- `rank_group`
- `why_picked`
- `short_summary`
- `relevant_points`
- `use_in_paper`
- `limitations`

`relevant_points` should be prose-ready evidence nuggets, not generic summaries. A downstream drafter should be able to turn them into a sentence without opening the source.

Use `source_ranking` to show the ordered evidence hierarchy. Rank sources by fit for this paper, not only freshness. For example, an old but current official regulatory source can outrank a recent vendor or consulting source for a regulated-architecture claim, while recent industry or empirical sources may outrank old regulatory sources for claims about current AI adoption.

If `.paper/OUTLINE.md` or `.paper/DRAFT.md` exists, add section-level draft support notes. If a draft exists but sections needing support are not specified, infer sections that make strong claims without clear evidence.

## 6. Write A Short Markdown Index

Write `.paper/RESEARCH.md` as a human-readable research packet for source review. It should summarize the same evidence package without forcing the user to inspect JSON.

It should include:

- evidence verdict
- source ranking
- source cards with why picked, short summary, relevant information picked, how to use it, and limitations
- source-lane coverage and any thin lanes
- author-language queries that materially affected source discovery
- key findings
- highest-risk contradictions
- claims to soften/drop
- open questions that block drafting
- pointer that `.paper/RESEARCH.json` is canonical

If the user later provides important sources that research missed, update the research package and add a missed-source audit note. Classify each miss as one or more of:

- `absent_source_lane`
- `source_added_after_research`
- `underweighted_source_type`
- `terminology_mismatch`
- `not_discoverable`
- `agent_error`

Record what workflow change would have prevented the miss.

Do not duplicate the full source registry or matrices in Markdown unless explicitly requested.

Hard rule: research is not complete until raw material is compressed into `.paper/RESEARCH.json`. Raw research is never passed downstream by default.

Store paper-specific source material under `.paper/sources/`. Do not use repository-level `references/` for paper-specific research because that directory is reserved for system guidance.

Downstream workflows should read `.paper/RESEARCH.json` first when present, then `.paper/RESEARCH.md` as a summary. Do not load raw `.paper/sources/` or `original/` unless verifying a specific source.

Update `.paper/STATE.md` and `.paper/STATE.json` with suggested next command: `/gpd-outline --deep`, because completed research normally means the paper is ready for full argument-architecture diagnostics.

</process>
