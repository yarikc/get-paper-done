# Revision Check

## Revision Classification

- **Revision timestamp:** [YYYY-MM-DDTHH:MM:SSZ]
- **Revision source:** [REVIEW.md / FACT-CHECK.md / FEEDBACK-PLAN.md / user request / editorial pass]
- **Baseline compared:** [.paper/versions/REV-YYYYMMDDTHHMMSS-before-substantive-revision]
- **Baseline metadata:** [.paper/versions/REV-YYYYMMDDTHHMMSS-before-substantive-revision/VERSION-METADATA.json]
- **Current draft:** `.paper/DRAFT.md`
- **Substantive revision:** [Yes / No]
- **Reason:** [why this is or is not substantive]

## Substantive Revision Definition

A revision is substantive when it changes, removes, adds, compresses, reorders, or reframes any of the following:

- thesis, paper job, decision ask, reader promise, or scope
- argument flow, section order, section purpose, or conclusion
- evidence use, evidence strength, source interpretation, or claim support
- mechanisms, examples, definitions, governance/control language, or operating model
- audience handling, objection handling, persona, voice, register, or author posture
- more than local copyediting in a paragraph that carries a claim

Typos, punctuation, formatting, link fixes, and narrow sentence-level clarity edits are not substantive unless they change claim meaning, emphasis, or voice.

## Before / After Quality Gate

Use 1-5 scores. A substantive revision fails if any dimension drops versus the baseline unless the user explicitly accepts the tradeoff.

| Dimension | Baseline Score | Revised Score | Regression? | Evidence / Notes |
|-----------|----------------|---------------|-------------|------------------|
| Thesis clarity | [1-5] | [1-5] | [Yes / No] | [note] |
| Argument flow | [1-5] | [1-5] | [Yes / No] | [note] |
| Evidence support | [1-5] | [1-5] | [Yes / No] | [note] |
| Audience fit | [1-5] | [1-5] | [Yes / No] | [note] |
| Persona and voice | [1-5] | [1-5] | [Yes / No] | [note] |
| Ask clarity | [1-5] | [1-5] | [Yes / No] | [note] |
| Substance preservation | [1-5] | [1-5] | [Yes / No] | [note] |

## Preservation Constraints

Use this section when `.paper/FEEDBACK-PLAN.md` includes approved or modified `//keep:` constraints.

- **Preservation constraints present:** [Yes / No]
- **Preservation constraints honored:** [Yes / No / Not applicable]
- **Evidence:** [cite the preserved wording, argument, voice, specificity, or idea]
- **User override:** [None / describe explicit override]

## Change Impact

| Change | Intended Improvement | Regression Risk | Result |
|--------|----------------------|-----------------|--------|
| [what changed] | [why] | [risk] | [improved / neutral / regressed] |

## Validator Interpretation

- **Structural validation result:** [ok / issues]
- **Semantic validation result:** [ok / issues]
- **Snapshot hash validation:** [ok / issues]
- **Validator-driven edits made:** [None / list]
- **Meaning-preservation check:** [how the revision preserves argument, evidence, persona, and voice]

Validators are advisory. A validator warning must not be fixed by deleting specificity, weakening evidence, flattening author voice, or reducing persuasive force.

## Decision

- **Revision verdict:** [Accept / Revise again / Revert / Ask user]
- **Reason:** [short explanation]
- **User approval required before export:** [Yes / No]
- **Next action:** [/gpd-review / /gpd-fact-check / /gpd-export / /gpd-revise / ask user]
