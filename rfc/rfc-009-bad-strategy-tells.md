# RFC: Bad-strategy tells validator — Rumelt anti-pattern detection

**Type:** Enhancement
**Area:** Semantic validation, strategy gate
**Status:** Proposed

## Problem

`paper-strategist` writes `STRATEGY.md` with a `Go` / `Revise Before Drafting` / `No-Go` verdict and can block downstream work. The blocker taxonomy includes `scope_too_broad`, `thesis_weak`, `audience_conflict`, and `evidence_gap`.

This catches structural strategy problems but doesn’t catch what Rumelt calls **bad strategy**: documents that look like strategy but aren’t. Rumelt’s four hallmarks of bad strategy — fluff, failure to face the challenge, mistaking goals for strategy, bad objectives — are not currently named or detected anywhere in the GPD pipeline.

The danger of bad strategy is precisely that it looks fine. A paper full of motivational language, ambitious-sounding goals, and aligned values can pass every existing check while still being, in Rumelt’s terms, “a substitute for thinking.” For a head of architecture writing in a regulated bank, this failure mode is common and high-cost: papers that pass review, get approved, and then can’t be operationalized because nobody can act on them.

This RFC proposes adding bad-strategy detection as a semantic validator that runs against `BRIEF.md`, `STRATEGY.md`, and `DRAFT.md`, with named tells drawn directly from Rumelt’s diagnostics.

## Goals

- Detect Rumelt’s four hallmarks of bad strategy via concrete textual and structural signals.
- Operate as a layer in `bin/lib/semantic.js`, blocking export for strategy papers when high-severity tells are present.
- Provide named, citable diagnostics (e.g., “FLUFF: paragraph 3 uses inflated abstract language without concrete content”) rather than vague quality scores.
- Calibrate against real examples of bad strategy in the wild, not just synthetic test cases.

## Non-goals

- Not a style checker. Bad-strategy detection is about substance, not prose quality. A beautifully written paper can fail; a clumsy paper can pass.
- Not opinionated about strategy content. Doesn’t check whether the diagnosis is correct, only whether one is present and load-bearing.
- Not a replacement for `opposition-reviewer` or the strategy gate. Operates earlier and on narrower signals.

## Rumelt’s four hallmarks — operationalized

### 1. Fluff

**Rumelt’s definition:** “A form of gibberish masquerading as strategic concepts or arguments. It uses ‘Sunday’ words (words that are inflated and unnecessarily abstruse) and apparently esoteric concepts to create the illusion of high-level thinking.”

**Operational signals:**

- High density of abstract nouns (“alignment,” “synergy,” “transformation,” “leverage,” “ecosystem,” “paradigm,” “framework,” “journey,” “platform”) without specification
- Sentences that survive removal without changing meaning (test: delete the sentence; does any downstream sentence become incoherent?)
- Strings of nominalizations (“the optimization of the standardization of the modernization of…”)
- Buzzword density > N per 100 words in any paragraph, where N is calibrated

**Detector approach:** Hybrid. Static buzzword density via wordlist; LLM judge for “would removing this sentence change anything?” pass per paragraph.

**Diagnostic output:**

```
FLUFF-01 [HIGH] §2 paragraph 3:
  "We will leverage our enterprise-wide data platform capabilities to drive
   transformational outcomes through aligned execution."
  → This sentence makes no specific claim. Removable without loss.
  → Recommendation: state what specifically will be done, by whom, by when.
```

### 2. Failure to face the challenge

**Rumelt’s definition:** Bad strategy fails to recognize or define the challenge. Without a diagnosis, response cannot be evaluated or improved.

**Operational signals:**

- `BRIEF.md` has no clear “central challenge” or “binding constraint” statement
- The `Diagnosis` section (if present) describes the *situation* but doesn’t identify what is *hard* about it
- The recommendation section proposes actions that don’t reference any specific obstacle they overcome
- Section count: a paper with 0 sentences containing words from {challenge, obstacle, constraint, binding, problem, blocker, friction, barrier} in non-throwaway contexts is suspicious

**Detector approach:** Structural check on `BRIEF.md` + `DRAFT.md`. LLM judge for “what is the central challenge this paper addresses? Quote the passage.” If the judge can’t produce a quoted answer, flag.

### 3. Mistaking goals for strategy

**Rumelt’s definition:** “Stating desires and ambitions as if they were strategies. A list of things you wish would happen is not a strategy.”

**Operational signals:**

- Recommendations of the form “we will become the leading X” without saying how
- Targets without mechanisms (“reduce incidents by 50%” with no theory of why incidents will go down)
- Goal-language ratio: count sentences that are pure ambition statements vs sentences that describe mechanism. High ambition-to-mechanism ratio is the tell.
- The word “will” without a preceding “by” or “through” clause

**Detector approach:** Sentence-level classifier. Each recommendation sentence is classified as `ambition`, `mechanism`, or `mixed`. A paper where >50% of recommendation sentences are pure ambition is flagged.

**Diagnostic output:**

```
GOAL-AS-STRATEGY-03 [MEDIUM] §5 Recommendation 2:
  "We will achieve best-in-class incident response times."
  → States the desired outcome but not the mechanism.
  → Recommendation: either add the mechanism ("by adopting X, which addresses
     Y") or move this to a goals section and replace with the actual strategy.
```

### 4. Bad objectives

**Rumelt’s definition:** Objectives that fail to address critical issues, or that are infeasible, or that are a “dog’s dinner” of unrelated demands.

**Operational signals:**

- Objective lists with no priority (everything is critical = nothing is)
- Objective count > 7 (Rumelt’s heuristic: real strategy says no, so long lists indicate inability to choose)
- Objectives that contradict each other (LLM judge required)
- Objectives that don’t trace to the stated diagnosis

**Detector approach:** Structural count + LLM judge for contradiction and traceability.

## Design

### Validator location

`bin/lib/semantic.js` gains a `bad-strategy-tells` rule pack. Runs only when `purpose ∈ {strategy_paper, position_paper, decision_memo}`.

### Severity model

Each tell has a severity that maps to routing:

|Severity|Action                                                                       |
|--------|-----------------------------------------------------------------------------|
|HIGH    |Block export; route to `/gpd-brief` if affects brief, otherwise `/gpd-revise`|
|MEDIUM  |Warn at review; do not block; surface in `REVIEW.md`                         |
|LOW     |Note only; surface in `STATE.md` as a hygiene item                           |

### Configuration

Per-paper thresholds in `config.json`:

```json
{
  "bad_strategy_detection": {
    "enabled": true,
    "fluff_density_threshold": 0.15,
    "ambition_mechanism_ratio_threshold": 0.5,
    "max_objectives": 7,
    "block_on": ["fluff_high", "no_challenge", "goal_as_strategy_high"]
  }
}
```

### Strategy gate integration

`paper-strategist` consumes the bad-strategy validator output. New blocker types added to `STRATEGY.md`:

- `fluff_dominant`
- `no_diagnosis`
- `goals_as_strategy`
- `unprioritized_objectives`

These join the existing `scope_too_broad`, `thesis_weak`, `audience_conflict`, `evidence_gap` blockers.

### Output artifact

New file `.paper/BAD-STRATEGY-AUDIT.md` (analogous to `FACT-CHECK.md`):

```markdown
# Bad Strategy Audit

**Verdict:** 2 HIGH, 4 MEDIUM, 3 LOW
**Blocks export:** YES (2 HIGH tells)

## HIGH severity

### FLUFF-01 §2 paragraph 3
[quote and recommendation]

### NO-DIAGNOSIS-01 brief
[finding and recommendation]

## MEDIUM severity
...

## LOW severity
...

## Calibration notes
- Fluff density measured: 0.21 (threshold 0.15)
- Ambition/mechanism ratio: 0.6 (threshold 0.5)
- Objective count: 9 (threshold 7)
```

### Grill integration

`/gpd-grill` adds explicit questions to surface bad-strategy risk before brief:

- “What is the central challenge this paper addresses? In one sentence, what is hard about the current situation?”
- “If I removed every sentence about ambition, vision, and goals from your planned paper, what mechanism would remain?”
- “Which of your objectives, if removed, would not change the paper’s argument? Those are not real objectives.”

These questions are designed to surface the four hallmarks at the earliest possible stage.

## Acceptance criteria

1. `bin/lib/semantic.js` includes a `bad-strategy-tells` rule pack with detectors for each of the four hallmarks.
1. `BAD-STRATEGY-AUDIT.md` is produced for every strategy paper, decision memo, and position paper at the brief stage and again at draft stage.
1. `paper-strategist` consumes the audit output and reflects findings in `STRATEGY.md` blockers.
1. The validator correctly flags at least three known bad-strategy examples in a test corpus (sourced from publicly available “strategy” documents that exhibit the patterns Rumelt names).
1. The validator does NOT flag the three current GPD example papers above MEDIUM severity. If it does, either the validator is mis-calibrated or the example papers need revision — and either finding is worth surfacing.
1. Configuration thresholds are documented with calibration rationale.
1. Documentation includes a worked example of each of the four hallmarks with a real (or realistic) bad passage and the validator’s diagnostic output.

## Risks

- **False positives that punish strong abstract writing.** Some legitimate strategic prose uses abstract concepts well. The fluff detector must distinguish “abstract concept doing work” from “abstract concept doing nothing.” Mitigate via LLM judge for removability rather than pure wordlist scoring.
- **Adversarial gaming.** Once authors know the detector flags “leverage” and “synergy,” they substitute different words. Treat the wordlist as a tripwire, not a goal — the real check is the removability test.
- **Cultural mismatch.** Bank strategy documents sometimes have legitimate motivational sections (e.g., for board audiences). The validator should respect audience context: motivational language to a board is not the same as motivational language replacing strategy.
- **Rumelt overfit.** Rumelt’s four hallmarks are influential but not exhaustive. The validator should be extensible to other strategy-quality frameworks (e.g., Roger Martin’s strategic choice cascade).

## Open questions

1. Should the validator run on `BRIEF.md` alone before research/outline/draft, or only on the full draft? Recommend both — early detection saves the most work.
1. Should fluff detection be language-aware? Banking has its own legitimate jargon. Suggest a domain-specific wordlist via `contexts/`.
1. How to handle papers where bad-strategy tells are *quoting* bad strategy in order to critique it? Probably needs an annotation mechanism similar to `<bad-strategy-example>` blocks the validator ignores.

## References

- Rumelt, *Good Strategy Bad Strategy* — Part I, chapters on bad strategy and its four hallmarks
- Rumelt, “The Perils of Bad Strategy” (McKinsey Quarterly, 2011) — condensed version of the diagnostic
- Martin, *Playing to Win* — strategic choice cascade, alternative framing
- Orwell, “Politics and the English Language” — historical roots of fluff detection in prose

## Implementation phases

**Phase 1:** Hand-built diagnostic checklist + manual application to existing example papers. Generates calibration data.
**Phase 2:** Static detectors (wordlist density, objective count, ambition-mechanism ratio).
**Phase 3:** LLM judge for removability, diagnosis presence, contradiction detection.
**Phase 4:** Integration with strategy gate and export blocking.