# Artifact Contracts

GPD artifacts are written by prompts and consumed by later prompts plus CLI validation. These contracts define the minimum structure needed for downstream stages to work. They are structural contracts, not quality judgments.

## JSON Artifacts

JSON artifacts must parse and conform to the schemas in `references/schemas/`.

| Artifact | Schema | Purpose |
|----------|--------|---------|
| `.paper/STATE.json` | `references/schemas/state.schema.json` | Machine-readable workspace state, blockers, feedback state, and next command. |
| `.paper/config.json` | `references/schemas/config.schema.json` | Paper workflow configuration and feature toggles. |
| `.paper/RESEARCH.json` | `references/schemas/research.schema.json` | Canonical structured research, source-lane coverage, author-language queries, source ranking, source cards, claim-support metadata, evidence nuggets, evidence matrix, synthesis, gaps, missed-source audit, and draft support notes. |

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
- `## Below-Target Improvement Gate`
- `## Unsupported Or Risky Claims`
- `## Revision Plan`
- `## Done Checklist`

Required tables:

- Scores: `Dimension`, `Score`, `Notes`
- Audience Review Scorecard: `Dimension`, `Score`, `Why`, `Actionable Rewrite Instruction If 3 Or Below`
- Unsupported Or Risky Claims: `Claim`, `Issue`, `Recommended Fix`

Below-Target Improvement Gate is required because a paper can be marked `Ready` while still having named, fixable issues. If any review score is below 5, any overall rating is below the paper's target quality bar, or the reviewer names fixable gaps, the gate must say whether those gaps require immediate revision before export or are deliberately deferred with a reason. Do not leave below-target findings as commentary only.

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
- `## Decision View`
- `## Proposed Handling`
- `## Below-Target Items`
- `## Incorporate`
- `## Ignore`
- `## Defer`
- `## User Decisions Needed`
- `## Approval Gate`

Required numbered sections under `## Proposed Handling`:

- Each feedback item uses `### N. Feedback Item`
- Each item includes `Feedback`, `Source(s)`, `Decision`, `Why It Matters`, `Proposed Fix`, `Guardrail`, `User Override`, and `Affected Artifact`

Required tables:

- Below-Target Items: `#`, `Issue`, `Target Bar Impact`, `Action`, `Reason`

`Decision` is the default generated handling, usually with severity when known. `Why It Matters` explains the consequence of accepting or ignoring the item. `Proposed Fix` states the concrete edit strategy if approved. `Guardrail` states what not to do when applying the fix. `User Override` is the explicit override point; if populated, revision must follow the override instead of the generated decision.

### `REVISION-CHECK.md`

Required when a substantive revision changes the draft before export or renewed review. The check must compare against a saved baseline, preferably a `.paper/versions/...` snapshot created before the revision.

Required headings:

- `# Revision Check`
- `## Revision Classification`
- `## Substantive Revision Definition`
- `## Before / After Quality Gate`
- `## Change Impact`
- `## Validator Interpretation`
- `## Decision`

Required tables:

- Before / After Quality Gate: `Dimension`, `Baseline Score`, `Revised Score`, `Regression?`, `Evidence / Notes`
- Change Impact: `Change`, `Intended Improvement`, `Regression Risk`, `Result`

A revision is substantive when it changes, removes, adds, compresses, reorders, or reframes thesis, paper job, decision ask, reader promise, scope, argument flow, evidence use, source interpretation, mechanisms, examples, definitions, governance/control language, operating model, audience handling, objection handling, persona, voice, register, author posture, or any claim-carrying paragraph beyond local copyediting.

The quality gate must score thesis clarity, argument flow, evidence support, audience fit, persona and voice, ask clarity, and substance preservation. A substantive revision fails if any dimension drops versus the baseline unless the user explicitly accepts the tradeoff. Validators are advisory and must not be fixed by deleting specificity, weakening evidence, flattening persona/voice, or reducing persuasive force.

Validation checks the required dimensions, numeric score ranges, score-drop/regression consistency, existence of any referenced `.paper/versions/...` baseline, and baseline snapshot hash metadata.

### `REVISION-LOG.md`

Records paper-local snapshots created before substantive revision, restore, or export overwrite.

Required headings:

- `# Revision Log`

Each entry should include:

- version id
- timestamp
- reason
- trigger artifact or event
- snapshot path
- source artifacts copied
- hash metadata stored in `VERSION-METADATA.json`
- notes

### `FEEDBACK-EXTERNAL.md`

Required headings:

- `# External Feedback`
- `## Review Prompt Summary`
- `## Consensus Summary`
- `### Shared Concerns`
- `### Shared Strengths`
- `### Divergent Views`
- `### High-Risk Items`

No table contract is required. External review content can come from different reviewers and provider formats, so validation only checks that raw feedback and summary sections have a durable place to land.

### `FEEDBACK-READER.md`

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

### `PAPER-CONTEXT.md`

Required headings:

- `# Paper Context`
- `## Language`
- `## Relationships`
- `## Example Dialogue`
- `## Flagged Ambiguities`

No table contract is required. This artifact is a paper-specific language contract, not a brief or outline.

### `DECISIONS.md`

Required headings:

- `# Paper Decision Records`
- `## Decision Index`

Required tables:

- Decision Index: `ID`, `Status`, `Decision`, `Why It Matters`

Paper decision records should be sparse. They are for thesis, audience, scope, source-positioning, and narrative choices that would be hard to reconstruct later.

## Grill State Contract

`STATE.json` contains a mandatory `grill` object. `/gpd-brief` must not proceed until:

- `grill.status` is `Complete`
- `grill.completion_basis` records why completion is valid
- `grill.resolved_decisions` contains all required decision keys:
  - `paper_job`
  - `primary_reader`
  - `belief_shift`
  - `thesis`
  - `narrative_spine`
  - `key_terms`
  - `scope_boundary`
  - `proof_standard`
  - `strongest_counterargument`
  - `non_goals`

`PAPER-CONTEXT.md` and `DECISIONS.md` are the human-readable companion artifacts. `STATE.json.grill` is the machine-readable gate.

The grill gate is re-enterable. After `grill.status` is `Complete`, `/gpd-grill` may still update `PAPER-CONTEXT.md` or `DECISIONS.md` when the author or an agent finds new ambiguity. If either artifact becomes newer than `BRIEF.md`, routing should send the paper to `/gpd-brief` so the formal paper contract catches up before research, outline, draft, review, revise, or export continues.

New examples created after the mandatory grill gate should include both companion artifacts. Older examples may be grandfathered with retroactive `STATE.json.grill` compatibility when backfilling would create artificial records. The canonical demonstration is `examples/software-supply-chain-evidence-pack/.paper/`.

`gpd validate` checks the structural contracts for these artifacts. `gpd validate --semantic` runs those structural checks first, then adds semantic lint-style checks from `bin/lib/semantic.js`.
