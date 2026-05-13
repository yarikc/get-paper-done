<purpose>
Check the current draft for unsupported, stale, exaggerated, contradicted, ambiguous, or risky claims.
</purpose>

<required_reading>
- .paper/PROJECT.md
- .paper/config.json if present
- .paper/BRIEF.md
- .paper/STRATEGY.md if present
- .paper/AUDIENCE.md
- .paper/RESEARCH.json if present
- .paper/RESEARCH.md if present
- .paper/DRAFT.md
- .paper/REVIEW.md if present
- .paper/FACT-CHECK.md if present
- templates/fact-check.md
</required_reading>

<process>

Read the required context. Prefer `.paper/RESEARCH.json` over `.paper/RESEARCH.md`. Do not load raw `.paper/sources/` or `original/` broadly; open only specific files needed to verify a specific claim.

Parse mode flags:

- `--risk-scan`: fast pass over high-risk claims only.
- `--full`: check every material claim. Default for serious, publishable, executive, technical, market, regulatory, or 1,200+ word papers.
- `--publication`: final pre-export pass for claims that would damage credibility if wrong, stale, overstated, or uncited.
- `--source-audit`: verify source quality and citation-source alignment without checking every prose claim.

If no mode is specified, use `--full` when `.paper/DRAFT.md` exists and the paper is serious, technical, executive-facing, public, or publication-bound. Otherwise use `--risk-scan`.

Use `.paper/config.json` classification to set scrutiny:

- `regulated` and `external_high` papers need publication-sensitive claim handling and strong source alignment.
- `decision_memo` fact-checking must verify that the evidence supports the requested decision and that operating/accountability claims are not presented as externally mandated unless sourced.
- `explainer` fact-checking must verify definitions, source authority, mechanism descriptions, and limits.
- `update` fact-checking can stay light unless it includes factual, numerical, external, or high-risk claims.

Extract a claim inventory from `.paper/DRAFT.md`. Assign IDs such as `FC1`, classify each material claim, and mark risk HIGH/MEDIUM/LOW.

Include headings, section titles, captions, tables, callouts, and summary bullets in the claim inventory when they make factual or causal claims. A cautious paragraph can still be undermined by an over-strong heading.

Check claims against `.paper/RESEARCH.json` when present:

- `evidence_matrix`
- `source_registry`
- `contradictions`
- `facts_safe_to_use`
- `claims_to_soften`
- `claims_to_drop_or_reframe`
- `draft_support_notes`

Use web research only when allowed by `.paper/config.json` and only for current, time-sensitive, legal/regulatory, product-specific, market-specific, named-entity-specific, numerical, quote/attribution, or high-risk claims. If web research is not allowed or unavailable, mark those claims `needs_current_verification`.

Evaluate each checked claim for support status, freshness, precision, context integrity, risk, and quantitative integrity. Do not treat a citation as sufficient unless it supports the specific wording of the claim.

For numerical, statistical, benchmark, percentage, cost, ROI, timing, or multiplier claims, fill `Quantitative Claims` in `.paper/FACT-CHECK.md`. Record the metric, baseline or denominator, comparison window or timeframe, source IDs, support strength, and handling. Route back to `/gpd-research` when the number needs evidence, and to `/gpd-revise` when the evidence supports only a softer or narrower claim.

For `source_registry` entries and cited source IDs, verify that URLs or file paths resolve to the intended source when practical. Record stale, redirected-to-wrong-page, inaccessible, or mismatched source links in `Source Alignment Notes` or `Source Gaps`, even if the draft prose itself is otherwise supportable.

When `.paper/RESEARCH.json` includes `source_registry[*].claim_support`, use it as a claim-source fidelity map. A source marked `topical_only`, `contradicts`, or `not_checked` for the closest evidence claim cannot justify a `Claims Safe To Keep` row. Move the claim to `Claims To Soften`, `Claims To Remove Or Verify Before Publication`, or route back to `/gpd-research`.

After claim-level checking, add a synthesis integrity assessment:

- whether the conclusion or recommendation is supported by the verified claims
- whether the draft is somewhat or materially overextended
- the largest gap between evidence and conclusion
- repeated factual risk patterns across the paper
- publication readiness from a factual-risk perspective

Write `.paper/FACT-CHECK.md` using `templates/fact-check.md`.

Update `.paper/STATE.md` and `.paper/STATE.json`:

- If HIGH issues require new evidence, set suggested next command to `/gpd-research`.
- If HIGH or MEDIUM issues can be fixed by softening/removing/reframing claims, set suggested next command to `/gpd-revise`.
- If no blocking issues remain, set suggested next command to `/gpd-review` or `/gpd-export` depending on review status.

</process>
