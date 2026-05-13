# Artifact Contracts

GPD artifacts are written by prompts and consumed by later prompts plus CLI validation. These contracts define the minimum structure needed for downstream stages to work. They are structural contracts, not quality judgments.

## JSON Artifacts

JSON artifacts must parse and conform to the schemas in `references/schemas/`.

| Artifact | Schema | Purpose |
|----------|--------|---------|
| `.paper/STATE.json` | `references/schemas/state.schema.json` | Machine-readable workspace state, blockers, feedback state, and next command. |
| `.paper/config.json` | `references/schemas/config.schema.json` | Paper workflow configuration and feature toggles. |
| `.paper/RESEARCH.json` | `references/schemas/research.schema.json` | Canonical structured research, source registry, claim-support metadata, evidence matrix, synthesis, gaps, and draft support notes. |

The in-repo schema validator intentionally supports a small JSON Schema subset:

- `type`
- `required`
- `properties`
- `additionalProperties`
- `enum`
- `minLength`
- `minimum`
- `pattern`
- `items`

Schemas using unsupported keywords fail validation so authors do not assume semantics that the CLI does not enforce.

## Markdown Artifacts

Markdown artifacts must contain the headings and table columns listed below when the artifact exists as a completed stage output.

### `STRATEGY.md`

Required headings:

- `# Strategy Review`
- `## Strategic Readiness`
- `## Strategy Blockers`
- `## Thesis Package`
- `### Thesis Tests`
- `## Strategic Gaps`
- `## Recommended Shape`
- `## Block / Override`

Required tables:

- Thesis Tests: `Test`, `Pass?`, `Notes`
- Strategic Gaps: `ID`, `Type`, `Description`, `Why It Matters`, `Fix Instruction`

Completed `.paper/STRATEGY.md` artifacts must also use valid values:

- `Status`: `Go`, `Revise Before Drafting`, or `No-Go`
- `Primary blocker`: one of the blocker values in `references/schemas/state.schema.json`
- `Required unblock action`: one of the unblock-action values in `references/schemas/state.schema.json`

Bracketed placeholder values are invalid in completed strategy artifacts.

### `OUTLINE.md`

Required headings:

- `# Outline`
- `## Mode`
- `## Structure Verdict`
- `## Reader Journey`
- `## Section Architecture`
- `## Objection Map`
- `## Drafting Risks`

Required tables:

- Section Architecture: `Section`, `Objective`, `Reader State In`, `Reader State Out`, `Main Claim`, `Evidence Hooks`, `Evidence Strength`, `Reader Questions`, `Objection Handled`, `Approx Length`, `Transition To Next`, `Keep/Cut`
- Objection Map: `Objection`, `Where Addressed`, `Handling`

### `FACT-CHECK.md`

Required headings:

- `# Fact And Claims Check`
- `## Mode`
- `## Claims Risk Verdict`
- `## Claim Inventory`
- `## Claim Issues`
- `## Claims Safe To Keep`
- `## Claims To Soften`
- `## Claims To Remove Or Verify Before Publication`
- `## Source Gaps`
- `## Source Alignment Notes`
- `## Synthesis Integrity`
- `## Systemic Risk Report`
- `## Recommended Next Action`

Required tables:

- Claim Inventory: `Claim ID`, `Claim`, `Type`, `Location`, `Risk`, `Check Status`
- Claim Issues: `Severity`, `Claim ID`, `Claim`, `Issue`, `Evidence Status`, `Source(s)`, `Recommended Fix`, `Suggested Wording`
- Claims Safe To Keep: `Claim ID`, `Claim`, `Why Safe`, `Source(s)`
- Claims To Soften: `Claim ID`, `Current Wording`, `Suggested Wording`, `Why`
- Claims To Remove Or Verify Before Publication: `Claim ID`, `Claim`, `Action`, `Why`
- Source Gaps: `Gap`, `Source Type Needed`, `Blocks Publication?`

### `REVIEW.md`

Required headings:

- `# Review`
- `## Verdict`
- `## Scores`
- `## Required Fixes`
- `## Audience Review Scorecard`
- `## Unsupported Or Risky Claims`
- `## Revision Plan`
- `## Done Checklist`

Required tables:

- Scores: `Dimension`, `Score`, `Notes`
- Audience Review Scorecard: `Dimension`, `Score`, `Why`, `Actionable Rewrite Instruction If 3 Or Below`
- Unsupported Or Risky Claims: `Claim`, `Issue`, `Recommended Fix`

Audience Review Scorecard must include exactly these seven dimensions:

- Thesis clarity
- Audience relevance
- Evidence sufficiency
- Objection handling
- Jargon appropriateness
- Decision usefulness
- Structural flow

### `FEEDBACK-PLAN.md`

Required headings:

- `# Feedback Handling Plan`
- `## Summary`
- `## Proposed Handling`
- `## Incorporate`
- `## Ignore`
- `## Defer`
- `## User Decisions Needed`
- `## Approval Gate`

Required tables:

- Proposed Handling: `#`, `Feedback`, `Source(s)`, `Assessment`, `Recommendation`, `Proposed Handling`, `Affected Artifact`

### `READER-FEEDBACK.md`

Required headings:

- `# Reader Feedback`
- `## Source`
- `## Five-Signal Scorecard`
- `## Feedback Items`
- `## Questions`
- `## Suggested Handling`
- `## Notes`

Required tables:

- Five-Signal Scorecard: `Signal`, `Score`, `Evidence`, `Actionable Feedback`
- Feedback Items: `#`, `Feedback`, `Signal`, `Severity`, `Recommended Handling`, `Affected Artifact`

Five-Signal Scorecard must include exactly these five signals:

- Voice
- Register
- Audience fit
- Evidence
- Ask clarity
