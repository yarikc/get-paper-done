# Semantic Calibration

Last reviewed: 2026-05-14

This file records calibration notes for semantic validators whose thresholds depend on example evidence. It is not a backlog. The forward plan remains in [../ROADMAP.md](../ROADMAP.md), and the current health snapshot remains in [PROJECT-REVIEW.md](PROJECT-REVIEW.md).

## Prose Saturation

Current validator behavior:

- Flags clustered or artifact-dense list-heavy prose in `DRAFT.md` and `exports/FINAL.md`.
- Catches obvious repeated parallel structure in broken fixtures.
- Allows isolated definition lists when they are not repeated densely across the artifact.

Calibration evidence:

- `examples/data-products-ai-scaling` remains the original saturation-calibration anchor. Its earlier review history exposed clustered LLM-style parallel prose in explanatory sections, which is the pattern the validator is meant to catch.
- `examples/software-supply-chain-evidence-pack` is now a third meaningful data point. Its final memo contains scope-defining enumerations for high-risk conditions, AI/supply-chain risk surface, and material-change triggers.
- Those enumerations are load-bearing definitions, not filler. Removing them would weaken decision clarity.

Examples that are not useful saturation evidence:

- `examples/platform-review-cycle-metrics` is intentionally short and quantitative. It exercises metric support, not long-form prose cadence.
- `examples/public-ai-control-baseline` is a compact decision memo. It is useful for public-source citation discipline and governance/control prompt calibration, but too short to stress saturation thresholds.
- `examples/weekly-platform-update` is lite mode and intentionally omits research/fact-check artifacts. It should not drive standard or flagship prose-saturation thresholds.
- `examples/responsible-ai-controls` is evidence-heavy external writing, but current saturation concerns have come from internal strategy/control papers. Use it as supporting evidence only if future reviews identify the same cadence pattern there.

Working rule:

Definitional enumerations are acceptable when they define scope, triggers, or control fields that the reader must apply. They should still be written as clean definitions, not repeated as decorative cadence. If several such lists appear in one short memo, review should ask whether the list belongs in a table, a definition block, or an appendix.

Do not tighten the validator solely to catch every long definition list. Tighten it only when examples show the pattern is making finished papers harder to read without adding decision value.

Regression coverage:

- `tests/semantic-gates.test.js` includes saturated-prose warning cases.
- `testScopeDefinitionEnumerationDoesNotWarn` protects the current exception: a single scope or trigger definition list should not fail semantic validation when the rest of the artifact uses normal prose.

## Change History

- 2026-05-13: Added calibration note after the supply-chain example became the first full `FEEDBACK-READER.md` to `FEEDBACK-PLAN.md` to backward-routing showcase. The note records that its remaining enumerations are definitional, not decorative prose saturation.
- 2026-05-14: Backfilled `examples/public-ai-control-baseline` with governance/control checklist artifacts and tightened one output paragraph after it tripped prose-saturation warnings. This confirmed the guidance can apply to a compact decision memo, while the saturation validator still correctly pushes long trigger lists out of body prose.

## Open Calibration Question

The validator does not yet distinguish between:

- a necessary scope definition, and
- an LLM-style prose paragraph that stacks parallel nouns because it has no sharper causal argument.

That distinction remains a judgment call in review until there is enough corpus evidence for a reliable rule.
