# Implementation Note: RFC-001 Phase 1 Artifact Contracts And Static Validation

- **Status:** Implemented
- **Parent RFC:** [RFC-001: Research-Driven Improvement Plan](rfc-001-research-driven-improvement-plan.md)
- **Scope:** Get Paper Done artifact reliability, validation, and static consistency tests
- **Related Tracking Issue:** [#14](https://github.com/yarikc/get-paper-done/issues/14) for remaining RFC-001 work
- **Decision:** Implement this phase before external review orchestration, parallel review suites, or judge-bias mechanics.
- **Implemented in:** `9bc4ba1`, `e7ae451`, `bef683c`, `519b9ad`, `845736b`

## Summary

Phase 1 narrows RFC-001 to the lowest-regret foundation: make GPD artifacts structurally reliable.

GPD is a prompt-first, file-backed writing workflow. Its main reliability risk is not that the CLI cannot run; it is that an AI stage can produce an artifact that looks plausible but is missing the structure downstream stages expect. This phase adds artifact contracts, JSON schema validation, markdown structural checks, and static workflow consistency tests.

This phase deliberately does **not** implement the external review runner, parallel review suite, binary scoring, cross-model judge rules, or provider orchestration. Those features should wait until artifact contracts are stable.

## Implementation Result

Implemented as the current validation foundation:

- JSON schemas for `STATE.json`, `config.json`, and `RESEARCH.json`.
- Nested schema checks for `RESEARCH.json` evidence, source registry, and synthesis rows.
- Markdown structural contracts for strategy, outline, fact-check, review, and feedback-plan artifacts.
- `gpd validate-artifact`.
- `gpd validate` integration with artifact contracts.
- Static workflow consistency tests for command/workflow references, required readings, templates, agents, command flag parity, command-reference closure, and protected audience scorecard dimensions.
- Routing scenario tests for backward artifact refresh, saved next command hardening, and content-aware fact-check/review/feedback-plan outcomes.

Remaining work from the parent RFC is now outside Phase 1 and should be tracked through GitHub issues plus the roadmap.

## Why This Phase First

Artifact contracts are the foundation for every later RFC-001 improvement:

- External review runner output needs stable `EXTERNAL-REVIEWS.md` and `FEEDBACK-PLAN.md` shapes.
- Parallel review synthesis needs stable reviewer artifacts to merge.
- Bias mitigation needs comparable scorecards and review outputs.
- Prompt regression evals need expected structures to assert against.
- CLI routing and validation need machine-readable state and config guarantees.

Without contracts, more orchestration will amplify inconsistency.

## Goals

1. Define explicit contracts for the core paper artifacts.
2. Validate JSON artifacts with machine-readable schemas.
3. Validate markdown artifacts for required sections and tables.
4. Add static tests that catch broken command/workflow/template/agent references.
5. Document artifact expectations in one place.

## Non-Goals

- Do not implement multi-provider external review.
- Do not implement `/gpd-review-suite`.
- Do not add live LLM prompt evals.
- Do not add binary scoring or randomized rubric order.
- Do not enforce semantic quality in validators.
- Do not replace human review with automated scoring.

## Artifacts In Scope

### JSON Artifacts

Validate with JSON Schema:

- `.paper/STATE.json`
- `.paper/config.json`
- `.paper/RESEARCH.json`

### Markdown Artifacts

Validate structurally:

- `.paper/STRATEGY.md`
- `.paper/OUTLINE.md`
- `.paper/FACT-CHECK.md`
- `.paper/REVIEW.md`
- `.paper/FEEDBACK-PLAN.md`

Structural validation means checking for required headings, required tables, and required table columns. It does not judge whether the prose is good.

## Proposed Files

New:

- `references/schemas/state.schema.json`
- `references/schemas/config.schema.json`
- `references/schemas/research.schema.json`
- `references/artifact-contracts.md` or `docs/ARTIFACT-CONTRACTS.md`
- `tests/artifact-contracts.test.js`
- `tests/workflow-consistency.test.js`

Possible code changes:

- Extend `bin/lib/state.js`, or add `bin/lib/validate.js`.
- Extend `bin/gpd.js` with `validate-artifact` if useful.
- Extend `gpd validate` to call the new artifact validators.

## Validation Behavior

### `gpd validate`

`gpd validate` should continue validating paper workspace health, but add contract-aware checks:

- malformed JSON is `HIGH`
- JSON schema mismatch is `HIGH`
- missing required markdown sections is `HIGH` for completed stages
- missing required markdown tables or columns is `MEDIUM` or `HIGH` depending on downstream impact
- optional artifact missing is not an issue unless the workflow state says it is complete

### `gpd validate-artifact <path>`

Optional helper command.

It should validate a single artifact and print a focused report. This is useful for agents and tests, but it is not required if `gpd validate` remains simple and clear.

## Static Consistency Tests

Add tests that assert:

- every `commands/gpd/*.md` workflow reference points to an existing workflow
- every workflow `required_reading` entry points to an existing file, template, reference, or supported glob
- every workflow-referenced template exists
- every workflow-referenced agent exists
- every installed command source still uses runtime-neutral references where appropriate
- audience review scorecards still contain the seven fixed dimensions:
  - Thesis clarity
  - Audience relevance
  - Evidence sufficiency
  - Objection handling
  - Jargon appropriateness
  - Decision usefulness
  - Structural flow

These tests should run in `npm test`.

## Implementation Order

1. Document artifact contracts.
2. Add JSON schemas for `STATE.json`, `config.json`, and `RESEARCH.json`.
3. Add schema validation helper.
4. Extend `gpd validate` with JSON schema checks.
5. Add markdown structural validators for completed-stage artifacts.
6. Add static workflow consistency tests.
7. Add tests for invalid fixture artifacts.

## Acceptance Criteria

- `npm test` covers artifact contracts and workflow consistency.
- `npm run check` passes.
- Invalid `STATE.json`, `config.json`, or `RESEARCH.json` fails validation with actionable messages.
- Missing required sections/tables in completed-stage markdown artifacts are reported.
- Broken command/workflow/template/agent references are caught by tests.
- The seven audience review dimensions are protected by tests.

## Open Questions

1. Should JSON schema validation use a dependency such as Ajv, or should GPD keep a tiny custom validator for now?
2. Should markdown structural failures be `HIGH` by default, or should severity depend on current stage?
3. Should `validate-artifact` be a separate command, or should agents rely only on `gpd validate --paper`?
4. Should artifact contracts live under `references/` because agents read them, or under `docs/` because they are developer-facing?

## Deferred From RFC-001

These remain valuable but are intentionally deferred:

- external review runner
- review-suite fan-out/fan-in
- multi-provider consensus gates
- binary scoring mode
- cross-model judge enforcement
- live prompt-regression evals
- observability logs
- per-paper rules
- self-reflection notes
