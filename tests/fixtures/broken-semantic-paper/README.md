# Broken Semantic Paper Fixture

This fixture is intentionally invalid. It gives `gpd validate --semantic --json` a compact paper workspace that should trigger multiple deterministic semantic gates at once.

It is not a realistic paper example. It is a regression fixture for validator coverage.

| Intentional violation | Expected semantic issue ID |
|---|---|
| `BRIEF.md` has researched claim evidence without source IDs or `[deferred: reason]` markers. | `semantic.brief_claim_evidence_stale` |
| `STRATEGY.md` reasoning spine restates the thesis instead of independently supporting it. | `semantic.strategy_reasoning_spine_restatement` |
| `RESEARCH.json` planned an academic source type but did not include one in `source_registry`. | `semantic.research_source_coverage` |
| `RESEARCH.json` has no contradicting sources and no documented reason why counterevidence is unavailable. | `semantic.research_counterevidence_missing` |
| `REVIEW.md` gives a low evidence score without a concrete rewrite instruction. | `semantic.review_rewrite_instruction_missing` |
| `DRAFT.md` recommends generic use cases without concrete examples, metrics, or failure signals. | `semantic.recommendation_specificity` |
| `DRAFT.md` repeats list-heavy parallel prose enough to trigger the prose saturation warning. | `semantic.prose_saturation` |
| `REVIEW.md` includes a generic audience-conflict row without a claim, section, or draft phrase anchor. | `semantic.audience_conflict_specificity` |
| `FACT-CHECK.md` marks a strategic safe-to-keep claim without source IDs. | `semantic.fact_check_safe_source_missing` |
| `DRAFT.md` includes a quantitative claim without baseline, denominator, timeframe, or comparison context. | `semantic.quantitative_claim_missing_context` |
| `DRAFT.md` uses precise numerical wording even though the closest evidence row is weak and marked for softening. | `semantic.quantitative_claim_weak_support` |

If this fixture stops emitting one of these IDs, either the fixture no longer exercises that validator or the validator behavior changed. Update this README and `tests/broken-fixture.test.js` together.
