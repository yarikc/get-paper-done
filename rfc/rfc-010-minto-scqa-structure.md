# RFC: Explicit Minto/SCQA structure check

**Type:** Enhancement
**Area:** Outline and draft validation, structure quality
**Status:** Proposed (revised)
**GitHub issue:** #35
**Revision note:** Revised after re-evaluating the grill mechanism. The SCQA opening pattern shares territory with `PAPER-CONTEXT.md`’s example dialogues and flagged ambiguities. Revised draft makes the integration explicit: SCQA components can be sourced from grill outputs rather than constructed independently.

## Problem

`paper-outliner` Deep mode has a “structure rubric,” “draft-readiness scoring,” and “reader jump analysis.” These are valuable but are framed as general structure quality, not as conformance to a specific reader-first communication standard.

The Minto Pyramid Principle and its SCQA opening pattern are the dominant communication structure in management consulting, executive communication, and strategy work because they match how senior readers process arguments. The principle has three operational rules:

1. **Answer first.** The governing thought (recommendation, thesis) sits at the top of the pyramid and appears in the opening.
1. **SCQA opening.** Situation, Complication, Question, Answer — the four-part structure that brings the reader to standing-in-the-same-place-as-the-author before the answer arrives.
1. **MECE grouping below the answer.** Supporting points are Mutually Exclusive and Collectively Exhaustive.

For a senior architect writing to CTOs, regulators, boards, or partner banks, conformance to these patterns is the difference between a paper that gets read and one that gets skimmed and dismissed.

GPD relies on the outliner agent to enforce structure implicitly. This RFC proposes making Minto/SCQA explicit, named, and validated — and uses `PAPER-CONTEXT.md` artifacts as inputs where appropriate.

## Goals

- Add explicit Minto pyramid structure as a declared architecture in `OUTLINE.md`.
- Add SCQA as a declared opening pattern with structural validation.
- Add MECE checks for supporting-point groups.
- Make the answer-first test operational: a validator can extract the recommendation from the opening alone.
- Use grill outputs (`PAPER-CONTEXT.md` example dialogues, flagged ambiguities, canonical terms) as inputs to SCQA construction.
- Allow papers to opt out of Minto for genre reasons (blog narrative), but require explicit opt-out.

## Non-goals

- Not mandating Minto for every paper.
- Not a writing-style enforcer (sentence length, paragraph count, tone are out of scope).
- Not a replacement for `paper-outliner` Deep mode — extends and makes explicit what it is partly doing.

## Conceptual model

### The pyramid

```
                  Answer / Governing thought
                  /        |          \
              Key       Key         Key
            point 1   point 2     point 3
            /  \       /  \         /  \
          ...  ...   ...  ...    ...  ...
```

Three architectural rules:

1. Every level summarizes the level below.
1. Ideas at the same level are MECE.
1. Order at each level is one of: time, structure (parts of a whole), or importance.

### SCQA opening, sourced from grill

|Component   |Purpose                                         |Sourced from grill                                                     |
|------------|------------------------------------------------|-----------------------------------------------------------------------|
|Situation   |What the reader already knows and accepts       |`PAPER-CONTEXT.md` canonical terms + audience proof standard           |
|Complication|The thing that disturbs the situation           |`PAPER-CONTEXT.md` flagged ambiguities (resolved) + audience objections|
|Question    |The implicit question raised by the complication|Often unstated; example dialogue can surface it                        |
|Answer      |The governing thought of the paper              |`BRIEF.md` thesis                                                      |

The grill mechanism produces material that maps directly to SCQA components. Rather than reconstructing them at outline stage, the outliner draws from existing grill artifacts.

For example, in the supply-chain memo’s `PAPER-CONTEXT.md`:

- The “AI scope” flagged ambiguity (originally too narrow) is the kind of complication that motivates the paper.
- The example dialogue (“Are we creating a new governance board?” → “No, the memo proposes a durable record…”) is precisely the question SCQA tries to surface.
- The canonical terms (supply-chain control record, observed evidence) define the situation the reader must accept.

A correctly structured SCQA opening lets the reader extract the paper’s main recommendation from the first paragraph alone — and the grill has already done most of the upstream work.

## Design

### OUTLINE.md schema additions

`OUTLINE.md` gains an explicit structure declaration:

```markdown
## Structure

**Architecture:** Minto pyramid
**Opening pattern:** SCQA
**Opt-out:** none

### Pyramid

**Governing thought:** [the answer / thesis, from BRIEF.md]

**Level 1 supporting points:**
1. [point 1] — MECE check: distinct from points 2, 3
2. [point 2] — MECE check: distinct from points 1, 3
3. [point 3] — MECE check: distinct from points 1, 2

**Completeness check:** points 1+2+3 collectively address the governing thought without gap.

**Ordering:** by importance (descending).

### SCQA opening (sourced from grill)

**Situation:** [1–3 sentences using canonical terms from PAPER-CONTEXT.md
that the reader will agree with on first read]
*Source: PAPER-CONTEXT.md §Language*

**Complication:** [what has changed / what is at stake — draws from the
flagged ambiguities and audience objections]
*Source: PAPER-CONTEXT.md §Flagged Ambiguities + AUDIENCE.md §Objections*

**Question:** [implicit or stated — typically surfaced by the example dialogue]
*Source: PAPER-CONTEXT.md §Example Dialogue*

**Answer:** [governing thought, stated in first or second paragraph]
*Source: BRIEF.md §Thesis*
```

For non-Minto papers:

```markdown
## Structure

**Architecture:** narrative / chronological / problem-method-result / explainer-arc
**Opt-out rationale:** [why Minto is not appropriate for this paper]
```

### Validators

`bin/lib/semantic.js` gains a `structure-conformance` rule pack:

**Check 1: Answer extractability.**
LLM judge reads only the first paragraph of `DRAFT.md` and is asked: “What is this paper recommending or arguing?” The answer is compared to the thesis in `BRIEF.md`. Match required for `decision_memo`, `position_paper`, `strategy_paper`.

**Check 2: MECE supporting points.**
For each pair of level-1 points, the judge tests: “Could a reader reasonably interpret these as overlapping?” Overlaps flagged. Collective check: “If a reader accepted all level-1 points, would the governing thought follow?”

**Check 3: SCQA opening present and grounded in grill.**
Judge identifies the boundaries of S, C, Q, A. Additionally checks that S uses canonical terms from `PAPER-CONTEXT.md`. If S doesn’t reuse the established vocabulary, the opening is not actually leveraging the grill output.

**Check 4: Reader jump test.**
Judge reads each section heading + first sentence only. From that skeleton alone, can the judge reconstruct the argument? If no, flag the sections where the argument breaks.

### Drafter integration

`paper-drafter` receives the structure declaration and the SCQA grill sources. When drafting the opening:

- For Minto/SCQA papers, the drafter produces a four-component opening with the Answer in the first or second paragraph.
- The drafter is required to use canonical terms from `PAPER-CONTEXT.md` in the Situation component.
- If a flagged ambiguity is resolved in `PAPER-CONTEXT.md` in a way that motivates the paper, the drafter is instructed to surface it as the Complication.
- For non-Minto papers, the drafter respects the declared opt-out.

### Outliner integration

`paper-outliner` Deep mode:

1. Defaults to Minto pyramid for `purpose ∈ {decision_memo, strategy_paper, position_paper}`.
1. Defaults to explainer-arc for `purpose: explainer`.
1. Requires explicit opt-out for blog/newsletter if author wants narrative-arc.
1. Generates the SCQA opening by pulling from `PAPER-CONTEXT.md` and `BRIEF.md`.
1. Produces the pyramid diagram with MECE annotations.

### Review integration

`/gpd-review` adds structure conformance to `REVIEW.md`:

```markdown
## Structure conformance

**Declared architecture:** Minto pyramid
**Answer extractable from opening:** YES — "We should adopt X for reasons A, B, C"
**MECE check on level-1 points:** PASS
**Completeness check:** PASS
**Reader jump test:** PASS for §1, §2, §4; FAIL for §3
**SCQA opening:** S present (uses canonical terms ✓), C present (sources flagged
ambiguity ✓), Q implicit (acceptable), A present in paragraph 2

**Overall:** PASS with one fix needed in §3.
```

### Configuration

`config.json` gains:

```json
{
  "structure": {
    "architecture": "minto" | "explainer" | "narrative" | "chronological" | "custom",
    "opening_pattern": "scqa" | "narrative_hook" | "executive_summary" | "custom",
    "answer_position": "first_paragraph" | "second_paragraph" | "end",
    "enforce": true
  }
}
```

## Acceptance criteria

1. `OUTLINE.md` template includes the structure declaration with Minto pyramid and SCQA fields, including explicit source pointers to `PAPER-CONTEXT.md` and `BRIEF.md`.
1. `paper-outliner` Deep mode defaults to Minto/SCQA for the three default classifications and explicitly handles opt-out for others.
1. `paper-drafter` produces SCQA openings using canonical terms from `PAPER-CONTEXT.md` in the Situation component.
1. `bin/lib/semantic.js` includes the four structure checks (answer extractability, MECE, SCQA presence with grill grounding, reader jump).
1. `REVIEW.md` includes a structure conformance section.
1. One example paper is reprocessed under explicit Minto declaration; the diff demonstrates measurable improvement in answer extractability (LLM-judge test on first paragraph).
1. Documentation includes a worked SCQA example showing each component sourced from a specific grill artifact.
1. Documentation includes one worked example of legitimate opt-out (blog post using narrative arc) showing the system correctly does not enforce Minto.

## Risks

- **Over-rigid structure.** Mechanical Minto application produces formulaic prose. The drafter must produce SCQA openings that sound like the author’s voice. Persona integration is critical — the Situation can be written in the author’s voice even while reusing canonical terms.
- **MECE as a tax on nuance.** Forcing supporting points to be mutually exclusive can flatten genuinely interconnected arguments. Allow up to two level-1 points to declare a stated relationship (e.g., “point 2 is the operational consequence of point 1”) rather than forcing artificial independence.
- **Answer-first conflicts with diagnosis-first.** Rumelt wants the diagnosis to lead; Minto wants the answer to lead. They are compatible in practice — the Answer is “do X because diagnosis Y, via guiding policy Z” — but the framing matters. Document the design choice.
- **Blog and public writing.** Narrative hooks and contrarian openings are legitimate for public writing. The opt-out mechanism must be lightweight or authors will avoid the system for public writing.
- **Over-coupling to grill.** Sourcing SCQA from grill is powerful but means structure quality depends on grill quality. If grill is shallow, SCQA built from it will be shallow. Document this dependency.

## Open questions

1. Should answer position be strictly “first paragraph” or allow “by end of opening section”? Recommend first or second paragraph as the rule.
1. Should the validator support multi-page papers where the answer is in an executive summary and the body uses different structure? Likely yes — declare the executive summary as the SCQA layer and the body as elaboration.
1. How to handle papers that extend prior papers (covered by RFC-005)? The grill source-intake mechanism may produce a prior-paper-aware Situation that references where the reader was left off.

## References

- Minto, *The Pyramid Principle* (1978, revised 2009) — original source
- Minto on SCQA: “permits you to make sure you and the reader are standing in the same place before you take him by the hand and lead him through your thinking”
- MECE principle origin — Barbara Minto, McKinsey internal training
- Rule of three in executive communication
- StrategyU and ModelThinkers — modern restatements of Minto/SCQA

## Implementation phases

**Phase 1:** `OUTLINE.md` schema additions with grill source pointers; manual structure declaration for one example paper.
**Phase 2:** `paper-outliner` defaults and structure generation; pyramid diagram output sourced from grill.
**Phase 3:** `paper-drafter` SCQA opening enforcement with canonical-term reuse.
**Phase 4:** Validator checks (answer extractability, MECE, SCQA + grill grounding, reader jump); review integration.
