# RFC-017: GPD Redesign — Authored-Prose Integrity, Baseline Protection, and Position Ledger

**Status**: Proposed
**Author**: User (with Claude + Codex as reviewers)
**Date**: 2026-05-25
**Origin**: A redo-recovery cycle on a real test paper exposed systemic failure, not a local bug. A forensic review of the paper's version history, feedback artifacts, and a comparison against the original human-authored ("vibe-written") source converged — independently across three reviewers — on one conclusion: GPD's prose-generation/rewrite pipeline degrades strong authored work, its self-rating overstates quality, its artifacts bloat without bound, and its history is not human-discoverable. The original author-written paper scored higher than every GPD-processed version of it.
**Sequencing**: Supersedes the framing of several existing RFCs. Re-scopes RFC-016 (research corpus) away from a global *source* library toward a claim/position layer. Subsumes RFC-015 (context-pruning/bloat) as a consequence of the new history model. Reframes RFC-007 (#32 eval harness) from "score papers" to "measure regressions against an accepted baseline." Relates to #46/#48/#49 (revision instructions, regression gate, recovery) — those become diagnostics under this model rather than rewrite authority.

> **Anonymization note**: Evidence below is drawn from a private test corpus. Papers are referred to as **Paper A** (a regulated-enterprise strategy paper) and **Paper B** (its companion). No private slugs, employer, or sector identifiers appear in this document. Verify with grep before any push.

---

## Summary

GPD today is architected on a premise the evidence disproves: that **more structure + more automated quality gates + more artifacts + agent-authored prose = better papers**. In practice the opposite happened — a strong 9,700-word human-authored paper was normalized into a generic ~3,900-word memo, rated 9.2/10 by the framework while two independent human-grade reads put it at ~6.5, and the paper measurably *degraded* with each revision cycle while every individual step "passed."

This RFC redefines GPD's value proposition and rebuilds its core loop:

**Value thesis** — GPD is a *research-and-integrity engine for a serial expert author*, **not a ghostwriter**. The author owns the prose. The AI gathers and binds evidence, surfaces diagnostics, preserves the best version, detects regressions, and — across a connected body of work — tracks the author's evolving positions. It drafts only when the user explicitly chooses generation mode.

**Three structural changes:**
1. **Authored-prose integrity** — default to *preserve-and-strengthen*; never rewrite authored prose wholesale; all changes land as human-approved diffs.
2. **Baseline protection** — one human-blessed *accepted baseline* is sovereign; every revision is a *candidate* that must demonstrably beat it; self-rating as workflow authority is removed.
3. **Position ledger** — a per-paper record of claims, evidence, vocabulary, genre, and accepted positions, plus a minimal cross-paper graph that (eventually) tracks reuse, evolution, conflict, and supersession across the author's body of work.

Build **core-first, with the ledger artifact model defined now and its cross-paper intelligence deferred** until validated against the author's real (non-companion, temporally separated) corpus.

---

# Part I — Product

## 1. Value thesis

> **GPD helps serial expert authors turn connected thinking into defensible papers — building a coherent body of work without surrendering voice, losing evidence, or contradicting their own evolving positions.**

GPD is **not** "an agent that writes your papers." That is a commodity (any frontier chat does it) and it loses the author's voice. GPD's defensible value is everything *except* authorship:

- **Research + verifiable evidence registry** (provenance, freshness, authority) — a raw chat session does not persist this.
- **Diagnostics, never authority** — objections, risks, weak/unsupported claims, audience/genre/length fit, regression vs. the accepted baseline. It says *what is wrong*; it does not rewrite.
- **Preservation + provenance** — the best version is never lost or silently overwritten; an audit trail of how the work evolved (a hard requirement for regulated authors).
- **Cross-paper coherence** — the position ledger turns a connected body of work into an asset, not a memory burden.

## 2. The user and the segment

The archetype user is a **serial expert author building a connected body of work in an evidence-bound domain**. The defensible market is defined not by "writers" but by a **generative property** — a user who has *all* of:

1. writes **multiple** papers over time (serial, not one-off);
2. on a **connected, evolving thesis** (claims recur, evolve, and sometimes conflict);
3. with a **personal voice worth preserving**;
4. under an **evidence/consistency burden** (regulatory, academic, or reputational);
5. needing **defensibility** (a record of how positions changed and why).

**Fit segments**: regulated-industry thought leaders / principal architects / heads-of; academic research programs; policy / think-tank analysts; standards authors, legal scholars, expert witnesses (contradicting a prior published position is a professional liability); industry analysts building a thesis franchise.

**Anti-segment (explicitly out of scope)**: one-off whitepaper authors, students, marketing copy, creative/fiction writers, journalists writing discrete stories. No connected corpus → no ledger value, and the integrity loop is overhead.

**Validity status of this segment claim**: strongly evidenced for the archetype user (two of their papers are explicit companion documents with rich claim-level relationships). **Not yet generalized.** See Part V validation plan. The product must be built so its value to the archetype does not *depend* on the ledger generalizing (the per-paper integrity loop is valuable from paper one).

## 3. Jobs to be done

1. *"Do repeatable research for me and keep the evidence, so I don't rebuild it every paper."*
2. *"Keep my prose in my voice and my audience's register — tell me where it drifts; don't rewrite it."*
3. *"Never let me lose my best version, and never silently make the paper worse."*
4. *"Tell me, honestly, whether this revision is better than my last good version — and what regressed."*
5. *"Don't let me contradict, or unknowingly repeat, what I already argued and published."*
6. *"Give me a defensible record of what I claimed, on what evidence, and how my position evolved."*

## 4. Scope and non-goals

**In scope**: import of authored prose; research and evidence binding; diagnostics; baseline/candidate management; diff-based revision; history and restore; per-paper position record; minimal cross-paper claim graph; provenance.

**Non-goals**:
- Wholesale AI authorship of papers in `preserve-and-strengthen` mode (the default for authored input). Generation is opt-in via an explicit mode.
- A single numeric "quality score" presented as workflow authority. Quality judgment is the human's, expressed at gates; the system reports *baseline-relative deltas* and *recommendations*, never an absolute vibe number.
- A global cross-paper **source** library as the headline (re-scoped from RFC-016; source reuse is real only between *same-angle* papers).
- Serving the anti-segment.

## 5. The three operating modes

Mode is selected at import and is the single most important safety decision in the system.

| Mode | When | What the AI may do | Default? |
|---|---|---|---|
| **preserve-and-strengthen** | Authored prose with voice (drafts, vibe-written papers, prior work) | Research, bind evidence, diagnose, propose **diffs** the human approves. **Never** regenerate prose. | **Yes — whenever authored prose is detected** |
| **generate-from-brief** | Genuinely new papers or weak/notes-only drafts with no voice to protect | Draft scaffolding and prose from brief/research, subject to the same baseline/diff loop once a draft exists | No |
| **convert-format** | Explicit genre transform (essay→memo, memo→briefing) | Restructure to the target genre, with the source preserved as an accepted baseline and the transform shown as a reviewable diff | No — user-initiated, risk acknowledged |

**Keystone rule**: GPD must *detect authored-prose-with-voice and refuse to enter generate/transform behavior without explicit user confirmation.* The original failure was GPD silently treating a strong authored essay as raw material to transform. Default-safe is non-negotiable (Part V, Test 2).

---

# Part II — Evidence and Root Cause

## 6. Verified findings (abstracted)

1. **Quality peaked early, then degraded monotonically.** Paper A's best version ("v-peak", ~5,026 words) was a *human recovery* after the author caught an earlier regression. Subsequent cycles reduced it to a flatter ~3,764-word base, and the latest redo (external-feedback-fed) produced a ~3,940-word version that was *worse than its own base* — it deleted inline definitions, muddied the opening, and vaguened a key section.
2. **Self-rating is invalid.** The framework rated the degraded version **9.2/10**; an independent read and the author's ~30 inline comments converge at **~6.5**. The grader systematically overstates quality.
3. **Author-written original beats every GPD version.** The original ~9,697-word human draft has a dialectical spine, named concrete evidence, memorable lines, and original frameworks. GPD normalized it into generic prose, replaced named proof with reference codes, and **coined its own thesis vocabulary** (terms appearing **zero times** in the author's originals). Degradation begins at **import→draft**, before any feedback loop.
4. **External feedback is additive; reader feedback is subtractive.** The author's inline feedback runs ~20 cut/simplify signals to ~3 additive; external AI review pushes more coverage/caveats/sources. The two loops pull in opposite directions; only the human compresses.
5. **Feedback artifacts bloat geometrically.** The feedback plan reached ~350K, of which the live plan was ~18.8K; the rest was a *recursively nested* embed of every prior plan (14 levels deep). Same pattern in reader-feedback artifacts (~569K). Growth is O(cycles²).
6. **Source reuse across papers is low.** Two same-domain companion papers shared only ~3 sources out of ~47 — source reuse is *angle*-scoped, not domain-scoped.
7. **Claim-level relationships are rich and explicit.** The same two papers show agreement, evolution, and conflict at the claim level, with one explicitly citing and rebutting the other. The *mechanism* for a position ledger is real and extraction is tractable. (Validity caveat: demonstrated on parallel companion papers — a favorable sample. Generalization unproven.)

## 7. Root causes

1. **No absolute anchor.** Every evaluation is *relative* (vs. the immediately prior version) and *self-graded* (the revising model grades itself). Result: undetectable monotonic drift — each step passes while the sum regresses.
2. **Generator and grader share biases.** Reviser, external reviewer, and eval gate are all LLMs that treat additive comprehensiveness as quality. The human is the only independent corrective signal; running revision/external loops without the human guarantees drift toward model-preferred prose.
3. **Append-only accumulation without curation.** Snapshots and feedback artifacts accumulate with no notion of "current vs. dead," causing both bloat and a history no human can navigate.
4. **The AI holds the pen.** Wholesale prose generation/rewrite launders the author's voice into house style. This is the value-destroying function, and it fires at import→draft, upstream of the feedback loops.

**Meta-failure**: GPD confused *more acceptable / more sourced / more structured / lower-risk* with *better*.

---

# Part III — Design (behavior and UX)

## 8. Principles

1. **The author owns the prose.** AI proposes; the human disposes. Every prose change is a human-approved diff.
2. **The accepted baseline is sovereign.** Nothing an agent does overwrites it. "Restore" means "return to accepted."
3. **AI output is diagnostics, not authority.** Including external review and self-assessment.
4. **Measure against a human-anchored reference, never an absolute vibe score.**
5. **Default-safe.** Ambiguity resolves toward preserving authored work, not transforming it.
6. **Spend human attention at one high-leverage gate** (accept/reject candidate), not scattered across micro-edits and plumbing.

## 9. Mode selection and safe-default detection (keystone)

On `import`, GPD classifies the source and **states the detected mode, then asks for confirmation**:

> "This looks like **authored prose with a distinct voice** (full prose, argument structure, figurative language, low boilerplate). I'll work in **preserve-and-strengthen** mode: I'll research, check evidence, and propose edits as diffs you approve — I won't rewrite it. Switch to generate or convert mode? [keep preserve / generate / convert]"

- If authored-prose signals are present, the default is **preserve-and-strengthen**, and entering `generate`/`convert` requires explicit confirmation.
- If the source is notes/bullets/specs (no voice to protect), default is **generate-from-brief**.
- The selected mode is recorded in the paper's config and is itself a versioned decision.

## 10. Accepted baseline and candidate

- **Accepted baseline (the "Gold")**: one named, human-blessed version. Human-readable identity: *"Accepted: 'v-peak', 5,026 words, approved 2026-05-19, genre: position paper."*
- **Candidate**: every revision produces a candidate; it **never overwrites accepted**.
- **Promotion**: a candidate becomes the new accepted only by explicit human approval at the gate. "No change" and "restore accepted" are **first-class successful outcomes**, not failures to advance.

## 11. Diff-based revision and the compare gate

Revisions are expressed as **change sets against the accepted baseline**, never as a regenerated document. The human-facing gate is a **baseline-aware compare report**:

```
Candidate vs Accepted ('v-peak')
  Better than baseline?  NO (recommendation: reject; harvest 2 changes)
  Improved:  + tightened §2 opening; + added 2026 source to trend claim
  Regressed: − removed the paper's one-sentence thesis
             − dropped 3 signature subsections from the core section
             − length +176w (no approved scope change)
             − introduced a non-author coinage (not in vocabulary)
  Decision:  [reject & keep accepted] [accept] [retry] [harvest selected diffs]
```

The diff makes **removal visible** — the failure that destroyed Paper A (silent deletion of structure during regeneration) becomes a line the author sees and rejects in seconds. **Small targeted patches are the default; a structural rewrite is high-risk and must be explicitly requested and must prove superiority.**

## 12. External feedback as diagnostics + trust hierarchy

- External review (and any model review) produces **objections, risks, missing-evidence flags, confusing-passage flags, suggested tests** — **never a rewrite plan**. It is routed through the same diff-proposal + compare gate as any change.
- **Feedback trust hierarchy** (higher dominates unless explicitly overridden): **user > peer human > external model > validator > agent self-review.** Weak signals may not silently override strong ones. External-model feedback that conflicts with an author position is surfaced as a question, not applied.

## 12A. Scoped external review and convergence discipline

The research-backed correction to the failed loop is: **external review must be scoped after a revision**. A model critic is useful when it helps the human notice problems; it becomes unsafe when it repeatedly reopens the entire paper and creates a fresh global critique queue after every candidate.

**Full review vs follow-up review are different modes:**

| Review mode | When | Allowed output | Forbidden output |
|---|---|---|---|
| **Full diagnostic review** | Explicit checkpoint before a change set, or user asks for a fresh review | Objections, missing evidence, audience/genre risks, confusing passages, issue candidates | Direct prose rewrite authority |
| **Follow-up verification review** | After a bounded change set | Did approved issues land? Did the candidate regress vs accepted? Did evidence/claims break? Did scope expand without approval? | New unrelated HIGH queue, broad style preferences, renewed whole-paper critique |

This prevents the failure mode observed in the convergence test: each external pass found new or reframed HIGH issues, including items previously treated as medium/polish, so the loop moved the target instead of converging.

**Convergence loop rule**:

1. Start from the accepted baseline.
2. Run a full diagnostic review only when explicitly requested.
3. Convert diagnostics into a small, human-approved change set.
4. Apply minimal diffs only.
5. Run follow-up verification against the approved change set and accepted baseline.
6. If HIGH issues repeat, grow, or shift into unrelated territory, **stop** and report process failure. Do not keep rewriting.
7. A cycle limit is mandatory; default `3`, maximum `5` unless explicitly overridden for research/testing.

**Stop conditions**:

- local baseline guard fails;
- external HIGH count does not fall after one bounded revision;
- external reviewer introduces unrelated HIGH issues during follow-up verification;
- candidate word count exceeds the approved contract;
- candidate appears better to the model but worse on baseline-relative guards;
- user rejects the candidate or asks to preserve the baseline.

The correct output of a failed loop is not another revision. It is a report: "This review process is not converging. Keep the accepted baseline; harvest only selected local improvements."

**Research grounding**:

- Iterative self-refinement can improve tasks with reliable feedback, but it is unsafe when the same family of models generates, critiques, and refines subjective work: Self-Refine (https://arxiv.org/abs/2303.17651).
- Iterative model feedback can reward-hack: scores improve while human-preferred quality stagnates or declines, including on essay-style tasks: "Spontaneous Reward Hacking in Iterative Self-Refinement" (https://arxiv.org/abs/2407.04549).
- Model critics are useful as assistance to human reviewers, not as authority; hallucinated critiques remain a risk: OpenAI CriticGPT (https://openai.com/index/finding-gpt4s-mistakes-with-gpt-4/) and "LLM Critics Help Catch LLM Bugs" (https://arxiv.org/abs/2407.00215).
- Pairwise/baseline-relative comparison is safer than absolute scoring, but still needs human calibration: "Aligning with Human Judgement" (https://arxiv.org/abs/2403.16950).

## 13. The revision contract (extends "do not lose this paper")

Before any change set, GPD compiles a short, versioned contract that constrains the revision:

- **preserve**: thesis, voice, target reader, argument spine, accepted-baseline strengths;
- **genre/register** (load-bearing — a *position paper* optimizes for conviction; an *exec memo* for defensibility; these are opposite targets, and GPD must not silently flip genre);
- **max word-count delta**;
- **allowed changes** / **rejected feedback** (explicitly recorded so it isn't re-applied next cycle).

## 14. Objective regression guards (replace the score)

Cheap, deterministic checks computed **against the accepted baseline** (Part IV.7 for algorithms). They produce a *baseline-relative report*, not a number:

- length delta beyond contract cap without approved scope change;
- heading/section loss;
- load-bearing phrase loss (from a registry);
- asserted-claim loss;
- density increase (long-list sentences) vs. baseline;
- vocabulary drift (author term replaced by non-author synonym; house coinage introduced).

**Self-rating as workflow authority is removed.** A false "9.2" is worse than no number. The only quality judgment in the system is the human's, at the gate.

## 15. History and discoverability

History is **semantic, not timestamped**. The author sees:

```
Accepted:  v-peak           (5,026w, 2026-05-19)   ← sovereign
History:   pre-external-review (3,764w)  | regressed-redo (3,940w) | …
```

- Named checkpoints (`pre-external-review`, `v-peak`, `before-restructure`), each with a one-line reason and a diffstat-vs-accepted.
- "Restore" takes a **name**, never a timestamp.
- Cryptic `REV-<timestamp>` identifiers are never shown to the user.

## 16. End-to-end flows

**preserve-and-strengthen (default for authored prose):**
import (mode confirmed) → research + evidence binding (diagnostics) → author sets accepted baseline → diagnostics surface gaps/weak claims/audience drift → AI proposes change set as diff → compare report → human accepts/rejects/harvests → on accept, candidate promoted to accepted; positions/ledger updated.

**generate-from-brief (new/weak input):** brief + research → generated draft → human reviews, edits, sets accepted → thereafter identical to preserve loop.

**convert-format (explicit):** source set as accepted → transform proposed as a full reviewable diff into target genre → human approves → both versions retained (lineage edge: `derived-from`).

## 16A. Desired UX: one improvement flow, hidden plumbing

The user should not have to orchestrate `review-external`, `feedback-plan`, `revise`, `export`, `validate`, `compare`, and `accept` as separate mental steps. The product surface should feel like one guided improvement flow:

```
gpd improve

Accepted: v-peak (5,026w, position paper, approved by user)
Candidate: none yet

Diagnostics:
- 3 material issues found
- 2 are evidence/claim issues
- 1 is audience/positioning risk

Recommended action:
Create a small change set, not a rewrite.

Decision:
[review change set] [skip] [run full external diagnostic] [restore accepted]
```

After a change set is proposed:

```
Change set: 4 targeted edits, +180w, no section removals

Expected benefit:
- closes evidence bridge
- clarifies ownership boundary

Regression risk:
- may over-explain platform vs architecture

Decision:
[apply candidate] [modify change set] [reject] [ask external critic]
```

After the candidate is produced:

```
Candidate vs Accepted
Recommendation: reject and harvest 1 local improvement

Improved:
+ stronger evidence caveat in §1

Regressed:
- opening grew by 420w
- reviewer introduced a new frame not in author vocabulary
- external follow-up added 4 new HIGH issues unrelated to the approved change set

Next:
[keep accepted] [harvest selected diff] [accept anyway] [retry with narrower contract]
```

The CLI may expose subcommands for automation, but the default human experience should be **one guided loop**. `status` should always explain:

- what version is accepted;
- whether a candidate exists;
- whether the candidate is better, worse, or inconclusive vs accepted;
- what the next safest action is;
- why GPD recommends another user review, external review, restore, or stop.

---

# Part IV — Architecture

> **v2 note**: §17–§28 below are the original design. They are **superseded where they differ** by the post-review resolutions in **§31 (Part IV v2)**, which fold in the Codex implementation-readiness review and Claude's refinements. Build from §31 for the authoritative decisions; §17–§28 remain for rationale. Test #1's executed result and reproduction are in **Appendix A**.

## 17. Data model overview

Three layers, three commitment levels:

| Layer | Build now? | Why |
|---|---|---|
| **Per-paper position record** | **Full** | The integrity loop already needs claims, load-bearing phrases, positions, genre, audience |
| **Baseline / candidate / named history** | **Full** | Replaces snapshot sprawl; fixes bloat + discoverability |
| **Cross-paper graph** | **Minimal hinge only** | Stable claim identity + generic edge store; relation taxonomy deferred until validated |

## 18. Per-paper position record (build now)

Stored at `.paper/POSITIONS.json` (machine) with a `.paper/POSITIONS.md` human view.

```jsonc
{
  "paper_id": "uuid",
  "genre": { "type": "position_paper", "register": "executive", "optimization_target": "conviction" },
  "audience": { "who": "...", "expectations": ["..."], "prohibited_assumptions": ["..."] },
  "vocabulary": [
    { "term": "boundary", "definition": "...", "author_canonical": true },
    { "term": "<house-coined term>", "author_canonical": false, "note": "house coinage — flag if introduced" }
  ],
  "claims": [
    {
      "id": "clm_3f9a…",                 // stable UUID, see §19
      "fingerprint": "<normalized-fingerprint>",  // normalized match key
      "statement": "<one load-bearing claim, verbatim from the paper>",
      "type": "thesis|supporting|scope|definition|empirical|normative",
      "status": "asserted|hedged|dropped",
      "load_bearing": true,
      "evidence": [ { "source_id": "S15", "binding": "supports|contradicts|context", "verified": true } ],
      "span_ref": "DRAFT.md#L29"
    }
  ],
  "positions": [
    { "claim_id": "clm_3f9a…", "stance": "accepted", "since": "v-peak" }
  ]
}
```

The objective guards (§14) read `claims[]` (asserted-claim loss), `vocabulary[]` (drift/coinage), and `load_bearing` flags directly. The revision contract (§13) reads `genre`, `audience`, and `positions`.

## 19. Claim identity — the expensive hinge

The one thing that is costly to get wrong later. Get it right now.

- Each claim receives a **durable UUID** at first extraction.
- Each claim also stores a **normalized fingerprint**: lemmatized, stop-worded, ordered canonical form of the statement. Used to **re-match on re-extraction** (so claims survive prose edits) and to **link across papers** (same/adjacent fingerprint in another paper → candidate edge).
- Re-extraction algorithm: for each newly extracted claim, match by fingerprint similarity (trigram/Jaccard ≥ threshold) to existing claim IDs; reuse the ID on match, mint a new one otherwise. This keeps IDs stable across edits and makes the cross-paper graph buildable later **without re-extraction or migration**.

This is the load-bearing investment. Everything else in the ledger can be added incrementally on top of stable claim IDs.

## 20. Cross-paper graph — minimal hinge (build skeleton, defer intelligence)

Stored at the workspace level (not per paper): `ledger/edges.jsonl`.

```jsonc
{ "from": "clm_3f9a…", "to": "clm_91bd…", "relation": "agrees|evolves|conflicts|supersedes|derived-from|…",
  "confidence": 0.0, "detected_by": "human|fingerprint|model", "status": "proposed|confirmed|dismissed", "created_at": "…" }
```

- **`relation` is an open string**, not an enum. Do **not** enumerate the taxonomy or build detection logic now — let the temporal/predictive validation (Part V) reveal which relations actually occur and how to detect them.
- A generic edge table absorbs new relation types without migration.
- Phase-now behavior: edges are created **only** by (a) explicit human annotation and (b) trivial fingerprint matches flagged as `proposed`. Automated conflict/supersession detection is **deferred**.

## 21. Baseline / candidate / history storage (replaces snapshot sprawl)

```
.paper/
  accepted/            # the sovereign baseline
    ACCEPTED.md
    ACCEPTED.meta.json # {label, approved_by, approved_at, word_count, genre, positions_snapshot_ref}
  candidate/
    CANDIDATE.md
    COMPARE.json       # baseline-aware compare report (regenerated each revision)
  history/
    v-peak/            # semantic name, not timestamp
      PAPER.md
      MANIFEST.json    # {label, reason, created_at, diffstat_vs_accepted}
    pre-external-review/
    …
```

- Promotion copies `candidate/` → `accepted/` and snapshots prior accepted into `history/<name>/`.
- **No recursive embedding anywhere.** Feedback plans and reader feedback store only the *live* content plus a pointer to the prior in `history/`; never an inline nested copy (kills the O(cycles²) bloat).

## 22. Component architecture and mapping to current code

| Concern | New / changed module | Current code touched |
|---|---|---|
| Mode detection + confirmation | `bin/lib/import-mode.js` (new) | `bin/lib/import.js`, `import.md` |
| Accepted/candidate/history | extend `bin/lib/snapshot.js`, `bin/lib/state.js` | `restore`, `snapshot`, `STATE.*` |
| Diff + compare report | `bin/lib/compare.js` (new) | `export.js`, `revise.js` |
| External-as-diagnostics + trust tiers | refactor `bin/lib/review-feedback.js`, `feedback-plan.js`, `external-review.js` | plan becomes diagnostics, not authority |
| Objective guards vs baseline | extend `bin/lib/semantic.js` | repurpose existing revision validators against the accepted baseline |
| Per-paper position record | `bin/lib/positions.js` (new) | extraction hook after draft/import |
| Cross-paper edges | `bin/lib/ledger.js` (new) | workspace-level store |
| Kill self-rating authority | `bin/lib/revise.js`, `semantic.js` | demote `REVISION-CHECK` self-grade to a non-authoritative note |
| History pruning / naming | `bin/lib/snapshot.js` | semantic names; prune embeds |

New/changed CLI verbs: `gpd accept` (promote candidate), `gpd compare` (candidate vs accepted), `gpd diagnose` (run diagnostics, no rewrite), `gpd history` (semantic list), `gpd restore <name>`. Existing `revise`/`feedback`/`review-external` are re-pointed to produce **diffs + diagnostics**, never wholesale rewrites.

## 23. Objective guard algorithms (vs accepted baseline)

- **length_delta** = |w(cand) − w(acc)| / w(acc); flag if > contract cap and no `scope_change_approved`.
- **structure_loss** = headings(acc) − headings(cand) (set diff on normalized heading text); flag each removed section.
- **load_bearing_phrase_loss**: for each phrase in the accepted load-bearing registry, flag if absent (normalized substring/trigram) from candidate.
- **claim_loss**: claims with `status=asserted` in accepted whose fingerprint is unmatched in candidate.
- **density_delta**: count of >40-word list-sentences per 1k words, candidate vs accepted; flag increase beyond tolerance.
- **vocabulary_drift**: author-canonical terms present in accepted but replaced in candidate by known non-author synonyms; and any `author_canonical:false` coinage newly introduced.

All are deterministic, baseline-relative, and immune to LLM bias. Output is a structured report, not a score.

## 24. Mode-detection heuristic

Signals for **authored-prose-with-voice** (→ preserve-and-strengthen): high prose-to-bullet ratio; complete sectioned argument; figurative/memorable phrasing; first-person or distinctive register markers; low boilerplate; coherent thesis present. Signals for **raw-material** (→ generate-from-brief): notes/bullets/specs, fragments, TODO scaffolding, low prose ratio. The classifier is advisory and **always confirmed by the user**; it never silently transforms.

## 25. Pruning / bloat elimination

- Feedback plans and reader feedback are **non-recursive**: live content + a `prior: history/<name>` pointer. Bloat is O(1) per cycle.
- History is pruned by policy (keep accepted + named checkpoints; archive or drop unnamed intermediate candidates).
- Agent context for any operation loads accepted + candidate + the relevant diagnostics — never the full history. No compaction required (RFC-015's goal achieved structurally, not by summarization).

## 26. Migration from current GPD

1. Designate **accepted**: user picks the best existing version (often a recoverable peak in `versions/`) → `accepted/`.
2. Current `DRAFT.md` → `candidate/`; generate first `COMPARE.json`.
3. Collapse `REV-<timestamp>` snapshots: keep user-named ones in `history/`, archive the rest. No re-embedding.
4. Flatten recursive `FEEDBACK-PLAN`/`FEEDBACK-READER`: keep live content, drop nested embeds, add `prior` pointers.
5. Extract the **per-paper position record** from the accepted version (claims + vocabulary + genre + audience).
6. Demote `REVISION-CHECK` self-grade to a non-authoritative note.

---

# Part V — Validation, Sequencing, Risks

## 27. Acceptance / falsification tests

1. **No-anchor RCA proof**: set accepted = the recoverable peak; run the *current* loop one external+revision cycle; it must regress on objective axes (structure_loss / claim_loss / length) while the old self-grade stays high. (Proves the root cause and the need for baseline guards.)
2. **Mode-detector safety**: the original author-written paper must classify as `preserve-and-strengthen`; entering transform requires explicit confirmation. (Prevents the original failure.)
3. **No silent regression**: a candidate that loses a load-bearing phrase or a heading vs. accepted cannot auto-promote; it is blocked/flagged at the gate.
4. **Bloat bound**: feedback artifacts must be O(1) per cycle — a 10-cycle paper's plan size stays within a constant factor of a 1-cycle plan.
5. **Discoverability**: a user can list history by semantic name and restore without knowing any timestamp.
6. **Claim identity stability**: re-extracting claims after a prose edit re-matches existing IDs (no spurious churn).
7. **Temporal-separation (ledger generalization)**: on two of the author's *non-companion, temporally separated* papers, do claim-level relationships still appear? (Gates investment in cross-paper intelligence.)
8. **Predictive (ledger value)**: on the *next* paper, does the ledger save effort or catch a real conflict? (Hindsight-proof; run as corpus grows.)
9. **External-review convergence falsification**: starting from the accepted baseline, run a scoped external-review + bounded-revision loop with a cycle cap. If HIGH concerns repeat, grow, or shift into unrelated territory, GPD must stop and report process failure instead of continuing to rewrite. (See Appendix B.)

## 28. Build sequencing

- **Phase 0 — stop the bleeding**: mode detection + safe default + confirmation gate.
- **Phase 1 — baseline protection**: accepted/candidate/history (semantic), diff + compare gate, kill self-rating authority, non-recursive feedback storage.
- **Phase 2 — diagnostics discipline**: external-as-diagnostics, scoped follow-up review, trust hierarchy, revision contract (incl. genre), objective guards vs baseline, stop conditions for non-converging loops.
- **Phase 3 — per-paper position record**: claims (with stable IDs), evidence bindings, vocabulary, genre, audience.
- **Phase 4 — cross-paper hinge**: claim-identity matching + generic edge store; human-annotated + trivial fingerprint edges only.
- **Deferred (gated by Tests 7–8)**: cross-paper relation taxonomy + automated conflict/supersession detection; cross-paper *source* reuse (re-scoped RFC-016 Phase 2); external-segment generalization.

## 29. Open questions and risks

- **Ledger generalization unproven** — validated only on parallel companion papers. Mitigation: build the per-paper substrate (valuable regardless) and the minimal hinge; gate intelligence on Tests 7–8.
- **Founder trap** — built for one archetype user. Mitigation: generalize the *problem*, not the workflow; interview 3–5 external segment users before investing in cross-paper intelligence.
- **Claim-extraction quality** — a noisy ledger is worse than none. Bar: trustworthy flags, not many flags; human confirms edges.
- **Market size** — the segment may be real but niche. The value thesis does not depend on the ledger generalizing; the per-paper integrity loop stands alone.
- **Genre detection** — mis-detecting genre re-introduces the style attractor. Genre is explicit in the contract and user-confirmed.

## 30. What this RFC changes in the existing backlog

- **RFC-016**: re-scoped — headline becomes the claim/position layer, not a global source corpus; source reuse limited to same-angle papers.
- **RFC-015**: subsumed — bloat is eliminated structurally by the non-recursive history model.
- **RFC-007 / #32**: reframed — the eval harness measures *regression against an accepted baseline*, not an absolute quality score.
- **#46 / #48 / #49**: reframed — revision instructions, regression gate, and recovery become **diagnostics and baseline guards**, not rewrite authority.

---

# Codex Implementation-Readiness Review

**Reviewer**: Codex
**Timestamp**: 2026-05-25 14:55:15 EDT
**Scope**: Implementation-readiness and architectural soundness review of Part IV, objective guards, migration, component mapping, sequencing, and implementer gaps. The value thesis, root-cause analysis, author-owned prose principle, accepted-baseline model, core-first sequencing, and ledger-as-measured-hypothesis are treated as settled.

## Summary verdict

Architecturally sound, but not yet fully implementation-ready in Part IV. The biggest fixes before build are claim identity specificity, schema/taxonomy alignment, migration safety, and compatibility with the current `DRAFT.md` / `exports/FINAL.md` source-of-truth model. Core-first sequencing is right, but Phase 2 should be split so baseline guards that depend only on structure do not wait for the still-unbuilt position record, while claim/vocabulary guards land after `POSITIONS.json`.

## Findings

[HIGH] §19: claim fingerprint algorithm is underspecified -> proposed change

`UUID + normalized fingerprint` is the right shape, but "lemmatized, stop-worded, ordered canonical form" is not implementable in the current repo without adding NLP dependencies. Use a deterministic no-dependency v1:

- normalize by lowercasing, stripping markdown/citations/punctuation, and preserving negation, modal verbs, numbers, acronyms, and proper-noun anchors
- tokenize, remove a small local stopword list, and apply only simple suffix stemming (`s`, `es`, `ed`, `ing`)
- store `normalized_text`, `token_set`, `token_bigrams`, `token_trigrams`, and `anchors`
- match score: `0.55 trigram_jaccard + 0.25 token_jaccard + 0.20 anchor_overlap`
- auto-reuse threshold: `>= 0.82`
- proposed-match threshold: `0.68-0.82`
- below `0.68`: mint a new claim ID
- never auto-reuse if negation, modal strength, number anchors, or claim type changed materially

False merges are worse than ID churn, so the first implementation should be conservative.

[HIGH] §18/§23: `claim_loss` is not fully deterministic unless claim extraction is deterministic -> proposed change

The guard is deterministic only after claims exist. Split claim handling into:

- deterministic guard: accepted claim IDs missing from candidate extraction
- advisory extraction: model or heuristic proposes new/changed claims
- human-confirmed claim set becomes the guard input

Do not call `claim_loss` LLM-bias-immune unless it operates over a frozen, human-confirmed claim set.

[HIGH] §18/§22: genre model conflicts with current config schema -> proposed change

The RFC uses `genre.type = position_paper`, while the current `classification.purpose` enum allows only `decision_memo | strategy_paper | explainer | update`. Avoid repeating the taxonomy conflict from earlier RFCs:

- keep `classification.purpose` as the workflow enum
- add `genre.label` for display labels such as `position_paper`, `white_paper`, or `executive_briefing`
- add `genre.optimization_target` such as `conviction | defensibility | explanation | alignment | update`

Do not add `position_paper` to the workflow-purpose enum unless routing behavior changes intentionally.

[HIGH] §21/§26: migration language risks data loss -> proposed change

"Collapse snapshots" and "drop nested embeds" can destroy evidence if implemented literally. Migration should be archival first:

- keep `.paper/versions/` intact initially
- create `.paper/history/MIGRATION-MANIFEST.json`
- map old `REV-*` IDs to semantic labels
- move or prune only after hash validation
- flatten feedback into live files, but store raw prior bloated artifacts under `.paper/history/raw/`
- never delete old material in phase 1 migration

[HIGH] §22: component mapping understates source-of-truth shift -> proposed change

Current GPD treats `.paper/DRAFT.md` as the editable source and `.paper/exports/FINAL.md` as the reading copy. RFC-017 introduces `accepted/ACCEPTED.md` and `candidate/CANDIDATE.md`, which is a deep model change. Specify one compatibility strategy before implementation:

- recommended migration path: keep `DRAFT.md` as the current candidate working copy and add `accepted/ACCEPTED.md` as the human-approved baseline
- later, if needed, fully replace draft/export routing with accepted/candidate semantics

[MEDIUM] §22: too many new CLI verbs fight the simplified UX direction -> proposed change

`accept`, `compare`, `diagnose`, `history`, and named restore are useful capabilities, but command sprawl is already a known GPD UX risk. Prefer:

- `gpd status` shows accepted/candidate/compare summary
- `gpd next` routes
- `gpd revise` prepares candidate work
- `gpd restore --name <semantic-name>` restores semantic history labels
- `gpd history` is acceptable as a discoverability command
- `gpd accept` may be needed, but `/gpd-feedback` or `/gpd-status` should be able to drive acceptance interactively

[MEDIUM] §23: `structure_loss` will be noisy on heading rewrites -> proposed change

Set-diff on normalized heading text will flag harmless renames. Use heading fingerprints:

- exact normalized match = preserved
- similar heading + same section order + similar first paragraph = renamed
- removed only if no comparable section body remains
- report `renamed` separately from `lost`

[MEDIUM] §23: `vocabulary_drift` needs a maintained synonym map -> proposed change

"Author term replaced by non-author synonym" is not cheaply computable unless the synonym map exists. Add this to `POSITIONS.json` or a dedicated vocabulary artifact:

```json
{
  "canonical": "<author's canonical term>",
  "allowed_aliases": [],
  "blocked_aliases": ["<model-preferred synonym to block>"],
  "status": "author_canonical|house_coinage|paper_specific"
}
```

Without this, vocabulary drift becomes subjective.

[MEDIUM] §28: sequencing has a hidden Phase 2 -> Phase 3 dependency -> proposed change

Objective guards in Phase 2 currently include checks that depend on claims/vocabulary from Phase 3. Split Phase 2:

- Phase 2a: baseline structural guards (`length_delta`, `structure_loss`, density/prose-saturation delta)
- Phase 2b: position-backed guards after Phase 3 (`claim_loss`, load-bearing phrase loss, vocabulary drift)

[MEDIUM] §9/§24: mode detection needs explicit non-interactive behavior -> proposed change

Current CLI commands are non-interactive. "Asks for confirmation" must define both TUI and CLI behavior:

- CLI import records detected mode and defaults to `preserve-and-strengthen`
- add `--mode preserve-and-strengthen|generate-from-brief|convert-format`
- if authored prose is detected and user passes `generate-from-brief` or `convert-format`, require `--confirm-transform`
- `/gpd-import` can ask interactively in Claude/Codex

[MEDIUM] §11: "human-approved diffs" needs a concrete diff artifact -> proposed change

Add `.paper/CHANGESET.md` and `.paper/CHANGESET.json` contracts:

- changed spans
- reason
- source diagnostic or feedback
- expected benefit
- risk
- before/after excerpt
- status: `proposed|approved|rejected|applied`

Without this, diff-based revision remains a principle rather than an implementation surface.

[MEDIUM] §20: ledger storage path/privacy needs definition -> proposed change

Workspace-level `ledger/edges.jsonl` needs root discovery and privacy rules:

- stored under the paper-root workspace, not the package repo
- no absolute private paths
- entries reference `paper_id`, `claim_id`, and relative artifact refs
- ledger is local/private by default
- snapshot inclusion/exclusion is explicit

[LOW] §23: density guard overlaps existing semantic calibration -> proposed change

Reuse the existing list-density / prose-saturation validator where possible. Name the RFC guard `baseline_relative_prose_saturation_delta` so it does not become a second inconsistent density system.

[LOW] §27: no-anchor RCA test depends on preserving current broken behavior -> proposed change

Create sanitized fixture inputs from the private failure before implementation changes make the old loop unavailable. The falsification test should not depend on a mutable private workspace.

## Implementer gaps before build

- Artifact schemas for `POSITIONS.json`, `ACCEPTED.meta.json`, `COMPARE.json`, `CHANGESET.json`, and `edges.jsonl`.
- Exact compatibility plan for `DRAFT.md`, `exports/FINAL.md`, and accepted/candidate state.
- Claim extraction source: deterministic parser, model-assisted extractor, or hybrid.
- CLI flags for mode override and transform confirmation.
- Archive-first migration policy with hash validation and no destructive collapse.
- UX contract for approving, rejecting, retrying, or harvesting candidate diffs.
- Examples/fixtures migration or grandfathering policy.

## Implementation recommendation

Keep RFC-017 as the umbrella redesign. Before implementation, tighten Part IV by adding:

1. the deterministic claim fingerprint v1;
2. the taxonomy split between workflow `classification.purpose` and display/voice `genre`;
3. the `DRAFT.md`-as-candidate compatibility path;
4. archive-first migration rules;
5. a concrete `CHANGESET` artifact;
6. split sequencing for structural guards vs position-backed guards.

---

# Part IV v2 — Resolutions (authoritative)

Incorporates the Codex implementation-readiness review + Claude's refinements. Supersedes §17–§28 where they differ. Each item is a build-ready decision.

**R1 — Claim fingerprint (§19): deterministic, no-dependency v1.**
No NLP deps. Normalize by lowercasing, stripping markdown/citations/punctuation, **preserving negation, modal verbs, numbers, acronyms, proper-noun anchors**; tokenize; small local stopword list; simple suffix stemming (`s/es/ed/ing`). Store `normalized_text`, `token_set`, `token_bigrams`, `token_trigrams`, `anchors`. Match score `= 0.55·trigram_jaccard + 0.25·token_jaccard + 0.20·anchor_overlap`. Auto-reuse `≥ 0.82`; proposed-match `0.68–0.82`; new ID `< 0.68`. **Never auto-reuse if negation, modal strength, numeric anchor, or claim type changed.** *(Refinement: weights/thresholds are INITIAL — calibrate against the first 3 real claim sets before locking; false merges are worse than ID churn.)*

**R2 — Two guard tiers + claim-loss determinism (§14/§18/§23).** Be honest about what is zero-touch:
- **Tier 1 — structural, fully deterministic, no position record required:** `length_delta`, `structure_loss`, `baseline_relative_prose_saturation_delta`. These alone are immune to LLM bias.
- **Tier 2 — position-backed, deterministic only over a *frozen, human-confirmed* claim/vocab set:** `claim_loss`, `load_bearing_phrase_loss`, `vocabulary_drift`. Extraction is advisory (model/heuristic); the guard runs on the confirmed set.
- **Anti-toil rule:** claim/vocab confirmation is **incremental — only the deltas, at accept-time** — never a separate heavy step. (Otherwise the ledger becomes the new chore.)

**R3 — Genre taxonomy (§18/§22): no enum war.** Keep the existing `classification.purpose` workflow enum **unchanged**. Add display/voice fields: `genre.label` (e.g., `position_paper`, `white_paper`, `executive_briefing`) and `genre.optimization_target` (`conviction | defensibility | explanation | alignment | update`). Do **not** add new values to `classification.purpose` unless routing behavior changes intentionally. *(Verify the live enum values before coding.)*

**R4 — Vocabulary map (§18/§23).** `POSITIONS.json` carries a vocabulary registry; `vocabulary_drift` computes only against it:
```json
{ "canonical": "...", "allowed_aliases": [], "blocked_aliases": ["..."],
  "status": "author_canonical | house_coinage | paper_specific" }
```

**R5 — Migration is archive-first (§21/§26): never destructive in phase 1.** Keep `.paper/versions/` intact; create `.paper/history/MIGRATION-MANIFEST.json` mapping `REV-*` → semantic labels; **hash-validate before any move/prune**; flatten feedback to live content + a `prior` pointer but store the raw bloated artifacts under `.paper/history/raw/`; **never delete old material in phase-1 migration.**

**R6 — Source-of-truth compatibility (§22).** Keep `DRAFT.md` as the candidate working copy; add `accepted/ACCEPTED.md` as the human-approved baseline; `exports/FINAL.md` stays the reading copy. Full replacement of draft/export routing with accepted/candidate semantics is a later, optional step — not phase 1.

**R7 — CLI: consolidate, but keep promotion explicit (§22).** `gpd status` shows accepted/candidate/compare summary; `gpd next` routes; `gpd revise` prepares candidate work; `gpd restore --name <semantic>`; `gpd history` lists. **Keep `gpd accept` as an explicit verb** — promotion to the sovereign baseline is the most consequential action and must be deliberate, not a side-effect of `status`.

**R8 — `structure_loss` uses heading fingerprints (§23).** Exact normalized match = preserved; similar heading + same section order + similar first paragraph = **renamed**; **removed** only if no comparable section body remains. Report `renamed` separately from `lost`.

**R9 — Reuse the density validator (§23).** Do not build a second density system. Reuse the existing list-density/prose-saturation validator; name the baseline-relative guard `baseline_relative_prose_saturation_delta`.

**R10 — Split Phase 2 (§28).** **Phase 2a** (after Phase 1, before Phase 3): Tier-1 structural guards. **Phase 2b** (after Phase 3 position record): Tier-2 position-backed guards. Structural protection ships without waiting on the ledger.

**R11 — Mode detection: explicit non-interactive behavior (§9/§24).** CLI records the detected mode and defaults to `preserve-and-strengthen`. Add `--mode preserve-and-strengthen|generate-from-brief|convert-format`. If authored prose is detected and the user passes `generate-from-brief`/`convert-format`, require `--confirm-transform`. Slash commands (`/gpd-import`) ask interactively.

**R12 — Concrete diff artifact (§11).** The diff loop operates on `.paper/CHANGESET.md` + `.paper/CHANGESET.json`: `{ changed_spans, reason, source (diagnostic/feedback ref), expected_benefit, risk, before/after excerpt, status: proposed|approved|rejected|applied }`.

**R13 — Ledger storage/privacy (§20).** Store under the paper-root **workspace**, not the package repo; no absolute private paths; entries reference `paper_id` + `claim_id` + relative artifact refs; **local/private by default**; snapshot include/exclude is explicit.

**R14 — Freeze Test #1 fixtures (§27).** Capture **sanitized** fixtures of the three test-paper versions + the self-grade artifact under a private fixtures dir **before** any loop change. The falsification test must not depend on a mutable private workspace. (See Appendix A.)

**R15 — External review scope discipline (§12A).** Split model review into two modes:
- **full diagnostic review**: explicit user-requested checkpoint; may surface new objections and risks;
- **follow-up verification review**: after a change set; may only verify approved issue resolution, baseline regression, evidence/claim breakage, and unauthorized scope expansion.

Follow-up verification must not generate a fresh unrelated HIGH queue. New issues found during follow-up are stored as diagnostics/backlog unless they are direct regressions caused by the change set.

**R16 — Mandatory convergence stop conditions (§12A).** Any automated or semi-automated improvement loop must have a cycle cap. Default `3`; maximum `5` unless the user explicitly runs a research/test mode. Stop and report process failure when HIGH issues repeat, grow, or shift into unrelated territory after a bounded revision. Do not continue rewriting to satisfy a moving external-review target.

**R17 — `gpd improve` as the default UX (§16A).** Implement the user-facing flow as one guided command/state, not a pile of commands. `gpd improve` can orchestrate diagnostics, change-set proposal, candidate creation, export, compare, follow-up verification, and accept/reject/harvest decisions. Underlying subcommands may remain for automation, but the default TUI experience should present one decision at a time: review change set, apply candidate, compare vs accepted, accept/harvest/reject.

**R18 — Pairwise baseline comparison replaces absolute rating (§12A/§14).** Do not surface a numeric paper score as workflow authority during improve/revise flows. The primary verdict is pairwise: `better than accepted | worse than accepted | inconclusive`, with concrete improved/regressed bullets. External critics and model evaluators may contribute evidence, but the accepted baseline and human decision remain sovereign.

**Implementer schemas to produce before build:** `POSITIONS.json`, `ACCEPTED.meta.json`, `COMPARE.json`, `CHANGESET.json`, `edges.jsonl`.

---

# Appendix A — Test #1 (no-anchor falsification): method, script, result

**Status**: executed 2026-05-25; RCA confirmed. Reproduce to confirm.
**Codex validation**: independently revalidated against the private workspace on 2026-05-25 15:08:10 EDT. The core falsification holds: downstream versions lose major baseline structure/load-bearing features while `REVISION-CHECK.md` reports no regression and `gpd status` still surfaces a 9.2/10 rating. Two precision corrections are recorded in A.3.

## A.1 Outline (method)

- **Hypothesis**: the current *relative + self-graded* loop regresses a paper on objective axes versus its true peak, while the self-grade stays high.
- **Approach**: retrospective and **non-destructive** — instead of running a fresh (destructive, non-deterministic) agent cycle, apply the Tier-1 structural guards across the *real loop outputs that already exist* (peak → redo-base → latest), using the **peak as the accepted baseline**. Deterministic; no agent run.
- **Inputs** (private; freeze as sanitized fixtures per R14): three versions of the test paper — `peak` (human-recovered best), `redo-base`, `redo-output (current)` — plus the self-grade artifact (`REVISION-CHECK.md`).
- **Guards vs peak**: `length_delta`; heading-set loss (`structure_loss`); `load_bearing_phrase_loss` against a registry extracted from the peak; long-list-sentence density.

## A.2 Script (parameterized; private paths and prose kept out)

```python
import re, os
PAPER = os.environ["GPD_TEST_PAPER"]            # private .paper dir (NOT committed)
V = { "peak(accepted)":  f"{PAPER}/versions/<peak-REV>/DRAFT.md",
      "redo-base":       f"{PAPER}/versions/<redo-base-REV>/DRAFT.md",
      "current":         f"{PAPER}/DRAFT.md" }
# Load-bearing registry: populate from the PEAK (private). Each entry is an exact
# substring present in the peak encoding a load-bearing feature (thesis line, scope
# limit, signature subsection headings, signature list). Kept out of this RFC.
LB = [ ("thesis line", "<peak thesis fragment>"),
       ("scope limit", "<peak scope-limit fragment>"),
       ("§4 subhead a", "<peak subsection heading>"),
       ("§4 subhead b", "<peak subsection heading>"),
       ("§4 subhead c", "<peak subsection heading>"),
       ("signature list", "<peak list-opener fragment>"),
       ("§5 structure", "<peak section-structure fragment>") ]
load = lambda p: open(p, encoding="utf-8").read()
words = lambda t: len(re.findall(r"\b[\w'-]+\b", t))
headings = lambda t: set(re.findall(r"^#{2,3}\s+(.*)$", t, re.M))
density = lambda t: sum(1 for ln in t.splitlines() if len(ln.split()) > 40)
bt = load(V["peak(accepted)"]); bh, bw = headings(bt), words(bt)
for name, p in V.items():
    t = load(p); w = words(t)
    dlen = 100*(w-bw)/bw
    sloss = len([x for x in bh if x not in headings(t)])
    lbloss = [lab for lab, ph in LB if ph in bt and ph not in t]
    verdict = "baseline" if name.startswith("peak") else ("REGRESSED" if (sloss or lbloss) else "ok")
    print(f"{name:16} {w:5}w  Δ{dlen:+5.1f}%  >40w={density(t):3}  structloss={sloss:2}  LBloss={len(lbloss)}  {verdict}")
# self-grade axis: grep REVISION-CHECK.md for per-dimension "Regression? No" across cycles
```

## A.3 Result (executed; Codex-revalidated)

Note: the table below uses the A.2 regex word counter, not shell `wc -w`; shell counts differ slightly on markdown punctuation and code-like tokens. The regression conclusion does not depend on the exact word counter.

| Version (vs peak) | Δ length | headings lost | load-bearing lost (of 7) | verdict |
|---|---|---|---|---|
| **peak (accepted)** | — | — | — | baseline |
| redo-base | **−24.0%** | **13** | **7** | **REGRESSED** |
| current (redo output) | **−20.5%** | **13** | **7** | **REGRESSED** |

Lost load-bearing features (both downstream versions): thesis line, scope-limit statement, three signature subsections, the signature enumerated list.

**Self-grade axis:** `REVISION-CHECK.md` records `Regression? No` on every parsed quality row across the recorded cycles; rows include `5 → 5`, `4 → 5`, and `4 → 4`, all with `No` regression. `gpd status` reports **9.2/10** ("independently_assessed"). The objective axes show major loss at the same time.

**Guard-calibration note:** the heading-loss probe is intentionally blunt and includes some draft-scaffold headings from the peak. This does not invalidate Test #1 because the load-bearing registry independently confirms substantive loss, but implementation should use R8's heading-fingerprint behavior before treating `structure_loss` as a production guard.

**The mechanism, pinpointed:** `REVISION-CHECK`'s "Baseline Score" column anchors to the **immediately prior revision, not the peak**. So each step reads "no regression vs. the slightly-worse previous step," and cumulative drift vs. the true peak is invisible. This is the no-anchor root cause in one observation.

## A.4 Conclusion + reproduction

**Confirmed**: relative + prior-anchored + self-graded evaluation cannot detect cumulative drift versus the true peak. The fix is a **sovereign accepted baseline** (not prior-anchored) plus the **Tier-1 objective guards** — exactly RFC-017 §10/§14 and R2.

**To reproduce (Codex):** set `GPD_TEST_PAPER` to the private workspace `.paper` dir (or the R14 frozen fixtures), fill `LB` from the peak's load-bearing features, run A.2, and confirm both downstream versions return `REGRESSED` while `REVISION-CHECK` shows prior-anchored `Regression? No`.

---

# Appendix B — Test #2 (external-review convergence falsification): method, result, implication

**Status**: executed 2026-05-26/27 against the private test paper; result confirms §12A/R15/R16.
**Privacy**: private paper paths, prose, and reviewer text are not included here. The run artifacts remain private scratch/test material.

## B.1 Hypothesis

A naive loop of **external review → revise → external review until no HIGH concerns remain** will not reliably converge for high-voice authored prose. It will tend to move the target: reviewers introduce new or reframed HIGH concerns, medium/polish issues escalate, and the paper grows or drifts even when local baseline guards pass.

## B.2 Method

- Accepted baseline: the prior human-recovered peak version of Paper A.
- Local gate: baseline-relative authored-prose checks over the candidate draft, including word delta, heading/spine preservation, and opening shift.
- External critic: one installed external provider, invoked through `gpd review-external`.
- Revision behavior: bounded manual diffs only; no wholesale rewrite; external feedback treated as diagnostics.
- Cycle cap: `5`.
- Success criterion: local gate passes and external HIGH concern count reaches `0`.
- Failure criterion: cycle cap reached, HIGH concerns repeat/grow/shift, or local gate fails.

## B.3 Result

| Iteration | Local gate | External HIGH concerns | Result |
|---|---:|---:|---|
| 1 | PASS | 3 | Needs bounded revision |
| 2 | FAIL | 0 | Test-harness bug: compared exported reading copy to baseline draft; fixed to compare draft-to-draft |
| 3 | PASS | 4 | HIGH count grew after bounded revision |
| 4 | PASS | 4 | Same/reframed HIGH themes persisted |
| 5 | PASS | 6 | HIGH count grew again; cycle limit reached |

The next resume correctly stopped:

```text
status: STOPPED - cycle limit reached (5)
why: convergence did not complete within the configured cycle budget; treat this as a process failure, not a paper failure.
```

Word-count direction also signaled drift: the working draft grew materially versus the accepted baseline while the external reviewer continued to complain about repetition, front-loading, and over-explanation. This is the same class of failure as Appendix A, but exercised prospectively as a loop rather than retrospectively as a version-history audit.

## B.4 Findings

1. A cycle limit is necessary and worked.
2. Local baseline guards are necessary but insufficient: they caught export/source mismatch and protected structure, but they did not determine whether the external-review loop was improving the paper.
3. Unscoped external review is not a convergence signal. It repeatedly introduced or escalated HIGH issues instead of verifying only the approved change set.
4. "No HIGH issues" is the wrong optimization target for authored prose. It lets the critic set a moving bar and rewards additive coverage.
5. GPD must treat repeated/growing HIGH concerns after bounded revisions as **process failure**, not as an instruction to keep rewriting.

## B.5 Product implication

This test converts §12's "external feedback as diagnostics" principle into a hard design rule:

- Full external review is a checkpoint, not an iteration engine.
- Follow-up review must be scoped to approved issue resolution and regression detection.
- New unrelated HIGH issues during follow-up go to diagnostics/backlog, not the current revision loop.
- If the critic keeps moving the target, GPD should stop, keep the accepted baseline, and offer to harvest only selected local improvements.

This is why `gpd improve` must be a guided baseline-protection workflow, not an autonomous external-review convergence loop.

---

# Validation Record

*(Naming: `R#` is reserved for Resolutions / design decisions. `V#` records validation events. Newest on top.)*

## V1. 2026-05-27 — Cross-runtime cold validation passed; RFC-017 promoted from provisional to "design rationale of record"

**Validators**: Claude (Explore subagent, isolated context, no shared conversation history) + Codex CLI (`codex exec`, separate session).

**Rubric**: 15 questions across 5 categories (core thesis & modes / schema correctness / loop discipline / UX / evidence + sequencing); 10 marked critical (must pass 100% for the strict claim). Rubric stored at `/tmp/rfc17-rubric.txt` during the run; the question set is reproducible.

**Result**:
- Claude: 15/15 total, 10/10 critical
- Codex: 14/15 total, 10/10 critical
- Single non-critical divergence on Q4 was a **rubric-wording issue**, not a spec gap: the question used handoff-spec terminology ("Tier 1 fact file frontmatter") rather than RFC-017's own POSITIONS.json language. Codex strictly marked it NOT IN SPEC; Claude charitably mapped it to §18. The content Claude found is in fact present in the spec at §18.
- Substantive answer convergence across runtimes on all other 14 questions, including all critical ones.

**Outcome**: RFC-017 promoted from *provisional* to *"design rationale of record"*. Both required conditions met: (1) strict cold validation passes 100% on critical questions; (2) cross-runtime with convergent answers.

**Cost**: Codex `exec` reported ~45K tokens for its session; Claude subagent ~same order. Total round-trip ~80–100K tokens, ~$0.30–1.00 at frontier-model pricing.

**Lesson for future runs**: cold-validation rubrics must use the target spec's own vocabulary; do not cross-import terminology between specs (the Q4 mismatch above is the exemplar).

**Next required validation**: at next structural change to the spec, OR by ~2026-07-08 (6 weeks).
