# RFC: Warrant-integrity checks — Toulmin as first-class object

**Type:** Enhancement
**Area:** Argument quality, grill, fact-check
**Status:** Proposed (revised)
**GitHub issue:** #33
**Revision note:** This RFC was revised after re-evaluating the grill mechanism. Earlier draft placed warrants in `RESEARCH.json` as a parallel mechanism. Revised draft places warrant articulation inside grill (with `PAPER-CONTEXT.md` as the home for paper-level warrants) and uses `RESEARCH.json` only for evidence-level warrant references.

## Problem

`paper-fact-checker` evaluates claim support, staleness, exaggeration, quantitative integrity, and citation risk. These are all evidence-side checks: is the data true, current, and proportionate?

The dimension this misses is the **warrant** — Toulmin’s term for the link that justifies inferring a claim from evidence. In practice, most strategic and technical papers fail not because their numbers are wrong but because the inferential step from those numbers to the recommended action is unsupported or unstated.

Examples of warrant failures that pass current fact-checking:

- *“User signups grew 40% YoY (true). Therefore we should triple our infrastructure spend.”* — Evidence correct, but the warrant (growth ⇒ infra spend at this ratio) is implicit.
- *“This database has 99.99% availability per the vendor (true). Therefore it meets our RTO.”* — Warrant assumes vendor’s measurement methodology matches your RTO definition.
- *“Three peer banks have adopted X (true). Therefore X is the right choice for us.”* — Warrant is “peer adoption implies fit,” one of the weakest warrants in regulated environments.

The grill mechanism already extracts canonical terms, relationships, anti-definitions, example dialogues, and flagged ambiguities into `PAPER-CONTEXT.md`. Warrants are conceptually the same kind of artifact: links the author is asking the reader to accept. They belong in the same upstream stage as terms and relationships, not as a parallel mechanism downstream.

## Goals

- Make warrants explicit at the grill stage, alongside canonical terms and relationships, captured in `PAPER-CONTEXT.md`.
- Carry warrants forward into `RESEARCH.json` at the claim level via reference.
- Provide validators that detect unstated or under-supported warrants in `DRAFT.md` against the grill-established warrant set.
- Extend `paper-fact-checker` from evidence-only to evidence+warrant verification.
- Keep warrant articulation lightweight — it is a category of grill output, not a separate workflow stage.

## Non-goals

- Not a formal logic system. Warrant articulation is in natural language.
- Not required for every sentence — only for material claims and paper-level inferential moves.
- Does not replace `opposition-reviewer`. That operates on the whole paper at thesis level; warrant checks operate at claim and paper-context level.
- Not a parallel mechanism to grill — it is an additional category inside it.

## Design

### Grill becomes the home for warrant articulation

`PAPER-CONTEXT.md` gains a new section: **Warrants**. The grill agent prompts the author to surface the load-bearing inferential moves in the paper before research begins.

Example warrant section, in the style of the supply-chain memo’s existing `PAPER-CONTEXT.md`:

```markdown
## Warrants

**Observed-evidence-implies-coverage**: Where tooling produces evidence directly
(dependency inventory, provenance, AI runtime config), the produced evidence is
sufficient to demonstrate coverage of that risk category.
*Type*: pragmatic.
*Defeaters*: tooling may produce noisy or incomplete output; detection coverage
is not the same as risk coverage.

**Owner-attestation-substitutes-where-tooling-cannot-reach**: For risks tooling
cannot observe, a named owner's signed declaration is acceptable evidence.
*Type*: authoritative.
*Defeaters*: attestation quality depends on owner incentives and competence;
high-risk claims need validation beyond attestation.

**Exception-handling-prevents-bureaucratic-drift**: An explicit exception path
keeps the process lightweight by reserving human review for cases that need it.
*Type*: pragmatic.
*Defeaters*: exception paths can themselves become bureaucratic if approval
thresholds are wrong.
```

Each warrant has:

- A statement (what inferential link the paper asks the reader to accept)
- A type from the enum: `causal | analogical | authoritative | statistical | definitional | pragmatic`
- One or more defeaters (conditions under which the warrant fails)

The grill prompts that produce this section are structurally similar to the existing prompts for canonical terms — the existing “what does X mean / what does X NOT mean” pattern becomes “what inference is the paper asking the reader to accept / what would defeat that inference.”

### Warrant-type failure heuristics

Each warrant type has known failure modes the validator checks against:

|Type         |Common failure                         |Validator check                                           |
|-------------|---------------------------------------|----------------------------------------------------------|
|Causal       |Correlation mistaken for causation     |Flag if grounds are observational without mechanism stated|
|Analogical   |Peer adoption used as warrant          |Require explicit similarity argument                      |
|Authoritative|Vendor or analyst claim as warrant     |Flag if source is vendor of the recommended choice        |
|Statistical  |Sample insufficient or unrepresentative|Flag if sample size or context not stated                 |
|Definitional |Term redefined to make claim true      |Cross-check against `PAPER-CONTEXT.md` canonical terms    |
|Pragmatic    |“Works in practice” without scope      |Flag if scope conditions not stated                       |

### RESEARCH.json extension

Per-claim warrant binding by reference (warrants themselves live in `PAPER-CONTEXT.md`):

```json
{
  "claim_id": "C-014",
  "claim_text": "Adopt observed-evidence-first for the orders supply chain.",
  "grounds": [
    { "source_id": "S-007", "nugget": "Synchronous evidence cascade outages..." }
  ],
  "warrant_refs": ["observed-evidence-implies-coverage"],
  "qualifier": "for risk categories where tooling coverage is mature"
}
```

`warrant_refs` is a list of warrant IDs from `PAPER-CONTEXT.md`. Most papers have 3–6 paper-level warrants supporting many specific claims.

### FACT-CHECK.md additions

Per-claim warrant audit:

```markdown
### Claim C-014: adopt observed-evidence-first for orders

**Evidence audit:** Pass. Grounds verified against S-007.
**Warrant binding:** `observed-evidence-implies-coverage` (PAPER-CONTEXT §Warrants)
**Warrant audit:**
- Explicit in draft: NO. Reader must infer the link in §3.
- Defeaters in PAPER-CONTEXT not addressed in draft:
  - "tooling may produce noisy or incomplete output"
  - "detection coverage is not the same as risk coverage"
- **Recommendation:** Surface the warrant in §3 prose. Address at least the
  second defeater explicitly.
```

### Drafter integration

`paper-drafter` receives the warrant set from `PAPER-CONTEXT.md` and the per-claim `warrant_refs` from `RESEARCH.json`. When drafting a section containing a material claim:

> If the bound warrant is type `analogical`, `authoritative`, or `pragmatic`, surface the warrant in prose. For `causal`, `statistical`, or `definitional` warrants, surface when the audience is technical or adversarial. Always address at least the highest-risk defeater listed in `PAPER-CONTEXT.md`.

### Outliner integration

`paper-outliner` Deep mode adds a warrant-load check per section: which warrants does each section depend on? Sections that depend on more than two distinct warrants are flagged as draft risk — the reader has to accept multiple inferential moves to follow the section.

### Validator additions

`bin/lib/semantic.js` gains warrant-integrity rules:

1. Every claim in `RESEARCH.json` with `materiality: high` must have at least one `warrant_refs` entry.
1. Every warrant in `PAPER-CONTEXT.md` must have at least one defeater listed.
1. Warrants of type `analogical`, `authoritative`, or `pragmatic` referenced in material claims must be surfaced in `DRAFT.md` prose (LLM judge confirms).
1. Warrants where backing source is the vendor of the recommended choice are flagged as conflict of interest.

### Grill prompt additions

The grill agent gets new prompts after canonical-terms extraction:

> “What is the central inferential move this paper asks the reader to accept? Beyond the evidence, what does the reader have to believe about how the world works for your recommendation to follow?”

> “For that move, what would defeat it? Under what conditions would a skeptical reader say ‘your evidence is fine but the link to your recommendation doesn’t hold’?”

> “Are there secondary inferential moves the paper relies on? List them with the same defeater question.”

These map directly to warrant statements and defeaters.

## Acceptance criteria

1. `PAPER-CONTEXT.md` template includes the Warrants section with statement, type, and defeaters per warrant.
1. Grill agent extracts warrants alongside canonical terms; the warrant-extraction prompts are documented in the agent contract.
1. `RESEARCH.json` schema supports `warrant_refs` on claim entries, validated by `gpd validate`.
1. `paper-fact-checker` produces warrant audit output per material claim, referencing the warrant ID from `PAPER-CONTEXT.md`.
1. `FACT-CHECK.md` template includes the warrant-binding and warrant-audit format above.
1. `paper-drafter` surfaces analogical/authoritative/pragmatic warrants in prose for material claims.
1. `paper-outliner` Deep mode produces a per-section warrant-load count.
1. `gpd validate --semantic` flags missing warrants on material claims, missing defeaters on warrants, and unsurfaced high-risk warrants in draft.
1. One example paper is reprocessed with grill-extracted warrants made explicit; the diff demonstrates measurable improvement.
1. Documentation includes a worked example of each warrant type with a real-world failure case and the defeater that would have surfaced it.

## Risks

- **Author friction at grill.** Forcing warrant articulation alongside terms may make grill heavier. Mitigate by treating warrants as optional during grill v1 and required only for `strategy_paper` or `position_paper`.
- **Warrant inflation.** Once the field exists, authors may over-document. Cap at six paper-level warrants; if more are needed, the paper is doing too much.
- **Overlap with opposition-reviewer.** Document the boundary: opposition steelmans the whole paper; warrants check specific inferential links. Both can find issues; redundancy is acceptable.
- **Defeater discovery quality.** Authors are bad at finding defeaters in their own arguments. The grill agent should propose candidate defeaters per warrant type and ask the author to confirm or reject.

## Open questions

1. Authored or LLM-proposed-then-confirmed? Recommend LLM-proposed with author confirmation, since authors are systematically blind to their own warrants.
1. Block export on missing warrants, or warn? Block for `strategy_paper` and `position_paper`; warn for memos and explainers.
1. How to handle warrants that change between paper versions (extending a position paper into a strategy paper)? Covered by RFC-011 on grill source intake.

## References

- Toulmin, *The Uses of Argument* (1958, revised 2003)
- Hitchcock, “Toulmin’s Warrants” (McMaster)
- Rumelt, *Good Strategy Bad Strategy* — the kernel requires the link between diagnosis and policy, which is a warrant

## Implementation phases

**Phase 1:** `PAPER-CONTEXT.md` schema for warrants; grill prompts; manual warrant articulation for one example paper.
**Phase 2:** `RESEARCH.json` warrant_refs; `paper-fact-checker` warrant audit mode.
**Phase 3:** Drafter and outliner integration; warrant surfacing in prose.
**Phase 4:** Validator rules and export gates by paper purpose.
