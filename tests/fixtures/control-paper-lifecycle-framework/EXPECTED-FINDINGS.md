# Expected Findings

Status: pre-registered control fixture.

Current semantic baseline:

- `validateSemanticPaper()` returns zero issues when this fixture is evaluated as a standalone draft.
- That is intentionally documented as a gap, not a success condition.

Expected human/GPD findings:

- Evidence mapping is missing for regulatory, cyber, operating-model, and readiness claims.
- The paper mixes two audiences: a senior decision sponsor and peer architecture collaborators.
- The opening contains the thesis, but it does not make the requested decision crisp enough.
- The paper lacks a real counterargument or steelman, especially the risk that lifecycle discipline becomes status theater.
- The draft uses key terms repeatedly before defining them tightly enough for mixed readers.
- The draft is more of a directional outline than a complete paper.
- The draft sequence shows avoidable iteration caused by skipping frame and spine validation before long-form drafting.

Expected future automated findings:

- Profile-rule drift warning for overconfident readiness language.
- Define-before-reuse warning for recurring terms that are not defined near first use.
- Audience-conflict warning before review artifacts exist.
- Standalone imported-draft warning when source-sensitive claims appear without source mapping.

