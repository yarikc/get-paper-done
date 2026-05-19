# RFC: Evaluation harness — rubric runner for FINAL.md

**Type:** Enhancement
**Area:** Quality measurement, framework calibration
**Status:** Proposed

## Problem

GPD has rich machinery for *producing* papers (gates, classification, backward routing, snapshots) but no instrumentation for measuring whether papers produced by the system are actually better than papers produced without it. Today, paper quality is asserted by the framework itself (`Current Ratings` in `DESIGN-SPEC.md`, self-scored review verdicts) without independent measurement against an external rubric.

Two concrete consequences:

1. There is no way to know whether a change to `paper-outliner`, `paper-drafter`, or any agent contract makes output papers better or worse. Agent calibration relies on subjective inspection of three example papers.
1. The framework’s positioning claim (“better than good AI prose”) is unfalsifiable as currently structured. A claim of evidence discipline must itself be supported by evidence.

This RFC proposes a separate, independent evaluation layer that scores a finished `FINAL.md` against a research-grounded rubric, without reading any of the workflow artifacts that produced it.

## Goals

- Produce a numeric and qualitative quality assessment of any `FINAL.md` independent of the workflow that produced it.
- Run as a separate command and against papers not produced by GPD, so output evaluation isn’t entangled with workflow evaluation.
- Use a rubric grounded in established sources (Rumelt strategy kernel, Minto Pyramid, Toulmin argument model, Amazon narrative memo discipline) rather than ad-hoc criteria.
- Enable regression detection: when an agent contract changes, run the harness over a corpus of example papers and detect score deltas.
- Support both LLM-as-judge and human reviewer modes against the same rubric.

## Non-goals

- Not a replacement for `/gpd-review` (which is in-workflow, draft-stage, fix-routing oriented).
- Not a fact-checker (covered by `paper-fact-checker`).
- Does not modify drafts or route work backward. It is read-only evaluation.
- Does not score persona fidelity or audience fit through workflow artifacts — those signals exist only if the reader experiences them in the paper itself.

## Rubric

Twelve dimensions across four pillars, each scored 1–4 with descriptive anchors. Weights vary by paper classification.

**Substance pillar**

1. Diagnosis quality (Rumelt) — central challenge clearly identified
1. Guiding policy / thesis (Rumelt / Minto) — explicit approach, answer-first
1. Coherent actions / recommendations (Rumelt) — specific, feasible, mutually reinforcing
1. Absence of bad-strategy tells (Rumelt) — no fluff, no goals-as-strategy, no motivational language

**Argument pillar**
5. Claim–evidence integrity (Toulmin) — material claims have grounds
6. Warrant integrity (Toulmin) — the link between evidence and claim is defensible
7. Counterargument treatment (Toulmin rebuttal) — strongest opposing view named and addressed
8. Calibration of confidence (Toulmin qualifier) — hedging matches evidence strength

**Structure pillar**
9. Answer-first opening (Minto / SCQA) — recommendation extractable from opening
10. MECE supporting structure (Minto) — no overlaps, no gaps
11. Narrative discipline (Amazon) — full sentences carry the argument, not bullet skeletons

**Domain pillar (persona/audience-driven)**
12. Audience proof standard met — reader’s required evidence quality and framing present

## Design

### Command surface

```
gpd evaluate --paper <path>              # score one paper
gpd evaluate --corpus <path>             # score all FINAL.md under a directory
gpd evaluate --paper <path> --reviewer claude,codex,gemini  # multi-judge
gpd evaluate --paper <path> --human      # interactive human scoring mode
gpd evaluate --baseline <path> --candidate <path>  # regression diff
```

### Artifacts

A new top-level directory `evaluations/` (sibling to `examples/`), with per-evaluation records:

```
evaluations/
  YYYY-MM-DD-<paper-slug>/
    EVAL.md                  # human-readable rubric scoring
    EVAL.json                # machine-readable scores + metadata
    JUDGE-CAPTURES/          # raw per-judge outputs when multi-judge
    DELTA.md                 # present only when --baseline used
```

`EVAL.json` schema (sketch):

```json
{
  "paper_path": "examples/foo/.paper/exports/FINAL.md",
  "paper_classification": "strategy_paper",
  "evaluated_at": "2026-05-19T...",
  "judges": ["claude", "human:yarikc"],
  "scores": {
    "diagnosis": { "score": 3, "rationale": "...", "evidence_quotes": ["..."] },
    "warrant_integrity": { "score": 2, "rationale": "...", "evidence_quotes": ["..."] }
  },
  "weighted_total": 3.1,
  "weight_profile": "strategy_paper",
  "rubric_version": "v1.0.0"
}
```

### Weight profiles

Different paper classifications weight dimensions differently. Profiles live in `evaluations/weights/`:

- `strategy_paper.json` — substance and domain dominate
- `position_paper.json` — argument and counterargument dominate
- `decision_memo.json` — diagnosis, recommendations, structure dominate
- `explainer.json` — structure and clarity dominate
- `white_paper.json` — argument and domain rigor dominate

### Rubric versioning

The rubric is itself an artifact (`evaluations/rubric/v1.0.0.md`) under semantic versioning. Score comparisons across rubric versions are disallowed by the CLI unless `--force` is given.

### Independence from workflow

The harness reads only `FINAL.md` and the `config.json` classification. It does NOT read `BRIEF.md`, `STRATEGY.md`, `RESEARCH.json`, `REVIEW.md`, or any other workflow artifact. Reader experience is the only signal — the same as a real reader.

### LLM-as-judge implementation

Each dimension is scored by a separate judge prompt that:

- States the dimension and its source authority (Rumelt / Minto / Toulmin / Amazon)
- Provides the 1–4 descriptors
- Requires the judge to quote specific passages from `FINAL.md` as evidence
- Refuses to score above 2 without a quotation

Per-dimension judging reduces aggregation bias documented in multi-dimensional LLM evaluation literature.

### Regression detection

`gpd evaluate --baseline A --candidate B` runs the same rubric over both and reports per-dimension deltas. Used in CI when agent contracts change.

## Acceptance criteria

The harness is acceptance-ready when:

1. `gpd evaluate --paper <example>` produces `EVAL.md` and `EVAL.json` for all three current example papers.
1. The rubric is version-pinned in `evaluations/rubric/v1.0.0.md` with explicit source citations to Rumelt, Minto, Toulmin, and Amazon narrative memo references.
1. At least two independent judges (one LLM, one human) have scored the same paper and produced reconciliation notes documenting disagreements.
1. Weight profiles exist for the five paper classifications.
1. `gpd evaluate --baseline --candidate` produces a per-dimension delta table.
1. The harness reads only `FINAL.md` and `config.json`. CI test verifies no other workflow artifacts are accessed.
1. A `evaluations/calibration-set/` exists with at least 10 papers (mix of GPD-produced, hand-written, and unaided-LLM-produced) with known relative quality, against which the rubric’s discrimination is demonstrated.
1. Documentation includes a worked example showing the same paper scored 3.2 in v1.0.0 of the rubric, with each score traced to a quoted passage in the paper.

## Risks

- **Judge bias toward GPD outputs.** If the same model that drafted the paper also judges it, scores will be inflated. Enforce judge-drafter separation via `--current-runtime` exclusion, same pattern as external review.
- **Rubric overfitting to current examples.** Calibrate against papers GPD did *not* produce, including hand-written examples by recognized strong writers in the same domains.
- **Score precision theater.** Numeric scores create false precision. Always require qualitative rationale + quoted evidence; weighted totals are summary only.
- **Self-evaluation circularity.** The framework’s own design spec rates itself 9.4/10. The evaluation harness must be honest enough to score the framework’s own example papers below their self-rating if warranted.

## Open questions

1. Should evaluation results be published in the repository (as evidence of calibration) or kept private?
1. Should the rubric expose `warrant_integrity` as a single dimension or split into “warrant explicit” and “warrant defensible”?
1. Should `gpd review --external` optionally invoke `gpd evaluate` as part of its workflow, or are they kept strictly separate?

## References

- Rumelt, *Good Strategy Bad Strategy* — kernel and bad-strategy diagnostics
- Minto, *The Pyramid Principle* — answer-first, SCQA, MECE
- Toulmin, *The Uses of Argument* — claim/grounds/warrant/qualifier/rebuttal/backing
- Bezos 2004 internal memo on narrative-style documents
- Snorkel AI, “The science of rubric design” (2025) — judge independence, calibration
- Recent multi-dimensional LLM evaluation literature on decomposed rubrics

## Implementation phases

**Phase 1:** Rubric v1.0.0 in markdown, hand-scoring of three example papers, manual `EVAL.md` for each.
**Phase 2:** `gpd evaluate --paper` CLI with single LLM judge.
**Phase 3:** Multi-judge with reconciliation, weight profiles, regression diff.
**Phase 4:** Calibration set of 10+ papers, published rubric discrimination evidence.