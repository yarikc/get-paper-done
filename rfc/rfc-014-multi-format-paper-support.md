# RFC-014: Multi-Format Paper Support

**Status**: Proposed
**Author**: User
**Date**: 2026-05-24
**Origin**: Surfaced during review of an imported enterprise strategy paper, where the same core argument needed three audience-specific renderings (leadership ask, practitioner long form, senior briefing). The reviewer flagged that GPD currently forces a choice of one rendering or manual duplication across workspaces.
**Sequencing**: Gated behind RFC-007 (evaluation harness, #32). Multi-format support adds significant artifact and workflow surface; building it before a quality-measurement instrument makes the framework harder to validate, not easier. See "Sequencing" section.

## Summary

Add native support for multiple output formats from a single GPD paper workspace while keeping the core argument, decisions, strategy, and evidence shared and canonical.

This enables enterprise paper flows where the same thesis travels as a decision memo, strategy paper, executive brief, or board note from one source of truth — without duplication, hidden drift, or manual rewriting.

## Problem

Serious papers are often multi-deliverable artifacts. The same underlying thesis, evidence, and decision logic may need to appear as a decision memo, long-form strategy paper, executive brief, or board note.

Today, GPD treats these as separate outputs. Users must either:

- maintain separate workspaces, which creates duplication and drift
- manually rewrite the same paper into multiple forms, which increases effort and error risk
- choose one format too early, which locks in audience assumptions before the argument is stable

This conflicts with GPD's value proposition of durable artifacts, explicit decisions, reusable structure, and controlled evolution.

## Decision

Adopt a **one core paper, multiple derived formats** model.

Under this model:

- the core paper remains canonical for purpose, thesis, decisions, strategy, evidence, and argument spine
- one or more explicit derived formats can be created from that core
- each derived format gets its own outline, draft, review, and export path
- drift between the core and a derived format is allowed but must be visible and managed
- format derivation must not skip Grill, the strategy gate, or fact-check at the core level

## Design principles

1. **One argument, many renderings.** The core argument remains shared and canonical. Format renderings change shape, length, and emphasis; they do not change the thesis, ask, or evidence base.
2. **Shared core, explicit derivatives.** Format-specific artifacts live under `.paper/formats/<format-name>/`. The core remains in `.paper/`. Derivation is explicit, not implicit.
3. **No silent synchronization.** GPD never mutates the core paper from a format-specific operation. Authors explicitly refresh formats when the core changes.
4. **Core decisions stay in the core workspace.** Strategy, decisions, evidence, and named concepts are authored at the core level. Formats render the argument; they do not redefine it.
5. **Single-format workflows stay simple.** Multi-format support is opt-in. Authors who only need one output never see the format layer.
6. **Drift is visible and managed.** When the core changes, derived formats are marked stale until explicitly refreshed.
7. **Short-first remains valid.** Authors may start with a short memo and expand into long form, or start long-form and compress into a briefing. Format is not a sequencing constraint.

## Relationship to existing `classification.purpose`

GPD currently uses `classification.purpose` with four values: `decision_memo`, `strategy_paper`, `explainer`, `update`.

**Purpose and format are different concepts.** This RFC keeps both:

- **Purpose** is the intellectual job the paper does: is it asking for a decision, presenting a strategy, explaining a topic, or reporting an update? Stable across formats.
- **Format** is the rendering shape for a specific forum or channel: long-form paper, short memo, executive brief, board note, slide-deck appendix.

A single paper has one purpose (its intellectual job) but may render into multiple formats.

**Naming collision.** Proposed format names overlap with purpose values:

| Purpose value | Proposed format name |
|---|---|
| `decision_memo` | `decision-memo` |
| `strategy_paper` | `strategy-paper` |
| `explainer` | `explainer` |
| `update` | `update` |

To avoid confusion at the file and CLI level:

- format names use hyphenated lowercase (`decision-memo`, `exec-brief`)
- purpose values keep underscored lowercase (`decision_memo`)
- documentation must explain the distinction in plain English, not by naming alone

**Backward compatibility.** Existing single-format workspaces continue to use `classification.purpose` as today. When a paper adds a format, `classification.purpose` remains in its current shape. Format adds a parallel layer; it does not replace purpose.

## Non-goals

- auto-generate every possible format for every paper
- keep all formats synchronized automatically at all times
- let derived formats silently rewrite the core paper
- replace audience-specific review, editing, or judgment
- force multi-format complexity onto single-format users
- redefine the clarify, support, shape, draft, check, revise, export lifecycle around format management

## Alternatives considered

### Option A: Keep single-format only

Users continue handling additional formats manually outside the core GPD model.

**Pros**: simplest mental model; no new artifact structure; no new drift logic.
**Cons**: duplicates work across deliverables; increases drift risk; weakens reuse of the core strategy and decisions; does not match real enterprise paper flows.

### Option B: Separate linked workspaces per format

Each format is its own paper workspace, with optional cross-links.

**Pros**: strong isolation; simple status per workspace; minimal changes to current artifact model.
**Cons**: duplicates PAPER-CONTEXT, DECISIONS, and STRATEGY across workspaces — the most expensive artifacts to keep consistent; synchronization becomes manual and error-prone; higher maintenance burden; makes short-to-long and long-to-short derivation awkward.

### Option C: One core paper with derived formats

One shared core paper contains the canonical argument and strategy. Derived formats are explicit renderings with format-specific artifacts.

**Pros**: strongest reuse of shared reasoning; explicit format management; drift is detectable and manageable; matches how one serious topic often travels through multiple forums.
**Cons**: more complex artifact and status model; requires careful design to avoid burdening simple workflows; introduces new concepts (argument spine, drift state).

**Decision**: adopt Option C. Option A leaves the multi-format problem unsolved. Option B duplicates the most expensive artifacts and creates the worst kind of drift — silent and unowned. Option C keeps the shared work shared and surfaces format-specific work explicitly.

## Definitions

### Core paper

The canonical paper workspace containing the shared purpose, decisions, strategy, evidence, named concepts, and argument spine.

### Derived format

A named deliverable shape derived from the core paper, such as `decision-memo`, `strategy-paper`, `exec-brief`, `board-note`, or `slide-deck-appendix`.

### Argument spine

A short structured artifact summarizing the core argument so derived formats can render it consistently. The spine is **authored**, not auto-derived. It is the canonical compression of the paper's argument, kept short enough that an author can re-read it before drafting any format.

See "Argument spine specification" below.

### Drift

A state in which a derived format no longer reflects the current argument spine, key decisions, or strategy constraints.

## Argument spine specification

`ARGUMENT-SPINE.md` is a markdown file with required sections in this order:

```markdown
# Argument Spine

**Last refreshed:** [ISO date]

## Problem
[1-3 sentences]

## Why now
[1-3 sentences]

## Thesis
[1-3 sentences]

## Ask
[Single decision or action being requested, or "none — paper is informational"]

## Key mechanisms
[3-7 bullets, one per mechanism the argument depends on]

## Risks and trade-offs
[3-7 bullets, one per material risk or trade-off]

## Accountability implications
[2-5 bullets: who owns what if the argument is accepted]

## Success measures
[2-5 bullets: how the reader would know in 6-12 months that this was right]
```

**Length budget**: 1 page (80-line default). If the spine exceeds the budget, the argument is not yet compressed enough.

**Why a separate file rather than a view over PAPER-CONTEXT + STRATEGY + BRIEF?** The spine forces the author to compress the entire argument into one place at one length, against the rendering needs of all formats. Existing artifacts each serve different stages (Grill outputs, strategy gate, paper contract); none is the *shared compression* every format reads. Maintaining the spine is the author's job; GPD validates that it exists and is current, not its content.

**Validation contract**:

- all required sections must be present
- "Last refreshed" must be an ISO date
- file must be under the line budget (default 80)

### Example (enterprise strategy case)

Generic example based on a paper that needs leadership, practitioner, and senior-briefing renderings.

```markdown
# Argument Spine

**Last refreshed:** 2026-05-23

## Problem
The organization needs to change how a cross-functional capability is
governed, but current review patterns are too slow and too informal.
Important decisions move through meetings, documents, and exceptions
without a shared evidence trail.

## Why now
Adoption is expanding beyond the original pilot teams. Without a clearer
operating model, scale will increase inconsistency, review burden, and
unclear accountability.

## Thesis
The organization should treat the capability as a managed operating
system, not a collection of local practices.

## Ask
Authorize a single accountable operating model with named owners,
evidence requirements, review triggers, and success measures.

## Key mechanisms
- Shared context and decision memory
- Standard evidence records for material decisions
- Exception routing with named owners
- Periodic review of outcomes, risks, and control effectiveness

## Risks and trade-offs
- Too much process slows adoption
- Too little structure creates ungoverned variation
- Ownership concentration may create bottlenecks
- Evidence requirements may be resisted as overhead

## Accountability implications
- Executive sponsor owns the mandate
- Operating team owns the common model and evidence record
- Delivery teams remain accountable for outcomes
- Control partners review exceptions and sampled evidence

## Success measures
- Lower cycle time for routine decisions
- Fewer unresolved ownership questions
- Complete evidence on sampled material decisions
- Stable exception volume within an agreed target band
```

## Artifact model

### Shared core artifacts

Canonical in `.paper/`:

- `PAPER-CONTEXT.md`
- `DECISIONS.md`
- `STRATEGY.md`
- `ARGUMENT-SPINE.md` (new)
- shared research artifacts
- shared evidence artifacts
- glossary or named-concept artifacts, if present

### Derived format artifacts

Format-specific artifacts live under `.paper/formats/<format-name>/`:

```text
.paper/
  PAPER-CONTEXT.md
  DECISIONS.md
  STRATEGY.md
  ARGUMENT-SPINE.md
  formats/
    decision-memo/
      FORMAT.md
      OUTLINE.md
      DRAFT.md
      REVIEW.md
      FINAL.md
    strategy-paper/
      FORMAT.md
      OUTLINE.md
      DRAFT.md
      REVIEW.md
      FINAL.md
    exec-brief/
      FORMAT.md
      OUTLINE.md
      DRAFT.md
      REVIEW.md
      FINAL.md
```

### FORMAT.md

Each derived format includes a `FORMAT.md` file with:

- format name
- target audience or forum
- target length (page count or word range)
- required sections (subset or extension of the spine)
- compression or expansion constraints
- decision ask pattern, if applicable
- relationship to the core paper
- last refreshed ISO timestamp
- drift state
- argument-spine content hash at last refresh (load-bearing for drift detection — see below)

### Sketch: how the same spine renders into two formats

Same spine (enterprise strategy example above), different formats:

**decision-memo** (target: 1 page, executive ask):

- opens with the ask: "Authorize a single accountable operating model..."
- 3-bullet justification (top 3 from key mechanisms)
- 2-bullet risk acknowledgement
- 1-bullet ownership statement
- explicit approve / decline boundary

**strategy-paper** (target: 5-8 pages, practitioners and control partners):

- problem framing in full
- why now with evidence
- mechanism walkthrough (each mechanism with diagram or worked example)
- trade-offs against alternatives considered
- accountability and operating-model implications
- success measures with measurement plan

Both renderings share the spine. They differ in compression ratio, evidence detail, and reader expectation. Neither modifies the spine.

## Workflow implications

### Initialization

Authors may declare formats at creation time or add them later.

```bash
gpd init --format decision-memo
gpd init --format strategy-paper --also exec-brief
gpd format add board-note
```

### Clarify and support

Clarify and support remain **core-paper stages**. They continue to produce shared artifacts for purpose, audience assumptions, strategy, evidence plan, core decisions, and the argument spine.

Formats may influence expected compression or depth at outline time, but do not replace the shared core workflow.

### Shape

Shape becomes two-level:

1. **Core shape**: produce or refresh `ARGUMENT-SPINE.md`
2. **Format shape**: produce a format-specific outline from the spine

```bash
/gpd-outline --core
/gpd-outline --format decision-memo
/gpd-outline --format strategy-paper
```

### Draft

Drafting is format-specific by default.

```bash
/gpd-draft --format decision-memo
/gpd-draft --format strategy-paper --next-section
/gpd-draft --format exec-brief
```

Drafting a format must not silently mutate the core paper. If a drafting session surfaces a needed change to the spine or strategy, GPD routes back to the core workflow explicitly.

### Check, review, revise

Review may occur at two levels:

- **Core review**: tests whether the underlying strategy and argument are sound
- **Format review**: tests whether a specific output is fit for its audience, length, and forum

```bash
/gpd-review --core
/gpd-review --format decision-memo
/gpd-review --format strategy-paper
```

Revision distinguishes between changes to the shared argument (core revise) and changes to a format-specific rendering (format revise).

### Export

Export is format-specific.

```bash
/gpd-export --format decision-memo
/gpd-export --format strategy-paper
/gpd-export --format exec-brief
```

## Drift management

### Phase 1 drift mechanism (this RFC)

**Detection**: each format's `FORMAT.md` stores the argument-spine section-body hash at last refresh. On status check, GPD compares stored hash to the current normalized `ARGUMENT-SPINE.md` section-body hash. Mismatch = format is stale.

This is still coarse — a wording change marks the format stale even if the core argument is unchanged — but whitespace-only changes should not. Phase 2 may refine material-vs-immaterial change detection once real-use friction data exists.

### Drift states

- `current` — stored spine hash matches current spine
- `stale` — stored spine hash differs from current spine; format must be refreshed or explicitly diverged
- `intentionally-diverged` — author explicitly marked the format as accepting divergence and recorded the rationale

Three states, not four. (The earlier draft proposed a `possibly-stale` state, but without a "material-vs-immaterial" detector, the difference between `possibly-stale` and `stale` is unimplementable. Dropped from Phase 1.)

### Refresh model

```bash
gpd format refresh decision-memo
gpd format refresh exec-brief --from argument-spine
gpd format mark-diverged strategy-paper --reason "intentionally narrower scope for board"
```

`refresh` re-reads the spine, prompts the author to update the format outline/draft, and updates the stored hash on success. `mark-diverged` sets the state to `intentionally-diverged` and records the rationale in `FORMAT.md`.

## Status model implications

A paper may be:

- core-complete but with no format exported yet
- exported in one format but stale in another
- ready as a decision memo while the longer strategy paper is still under revision

`gpd status` shows:

- core-paper state
- formats present
- drift state per format
- export readiness per format

## Backward compatibility

This feature must remain backward-compatible with current single-format workspaces.

Rules:

- single-format remains the default
- `.paper/formats/` is created only when a format is added
- existing workspaces continue to work without migration
- top-level `FINAL.md` may remain for backward compatibility during transition; future design may move all finals under `.paper/formats/`
- existing `classification.purpose` field stays in place

## Risks and consequences

### Risks

- The paper model becomes conceptually heavier; single-format users must still understand the format layer exists when reading docs.
- Status and lifecycle logic become more complex; bugs in drift detection could mislead authors about which format is current.
- Phase 1 hash-based drift is coarse — every typo fix to the spine marks all formats stale. Authors may learn to ignore the signal, defeating its purpose.
- Authors may proliferate formats before the core argument is stable — wasting effort.
- The argument-spine concept must be taught well; if authors treat it as fill-the-form scaffolding, format renderings will lose argument fidelity.

### Consequences

- GPD needs format-aware status reporting and command help.
- Review logic must differentiate core-level quality from format-level fitness.
- Documentation must explain core-versus-format clearly with examples.
- Validation must enforce the argument-spine schema.

## Migration path

### Phase 1: Foundational support

- add `ARGUMENT-SPINE.md` with the schema in this RFC
- add `.paper/formats/` and `FORMAT.md` per format
- support manual creation of formats: `gpd format add <name>`
- support format-aware outline, draft, review, and export
- implement hash-based drift detection
- update `gpd status` to show format presence and drift state
- argument-spine schema validator

### Phase 2: Refresh and templates

- refine drift detection if Phase 1 reveals friction (material-vs-immaterial change distinction)
- add format templates and defaults for the canonical format names
- add format comparison views

### Phase 3: Compression and expansion helpers

- memo-to-strategy and strategy-to-brief derivation helpers
- multi-format workflow presets

## Example use case

Drawn from a generic enterprise strategy paper external review.

**Core topic**: standardizing governance for a cross-functional enterprise capability.

**Required outputs**:

- `decision-memo` for leadership approval (1 page, ask + 3 mechanisms + risk + ownership)
- `strategy-paper` for practitioner and control partners (5-8 pages, full argument + trade-offs + accountability + measurement)
- `exec-brief` for senior circulation (2 pages, problem + thesis + ask + implications)

The underlying argument, evidence, decisions, and accountability stays shared. The rendered outputs differ in length, compression, and review expectations.

## Open questions

- Should `ARGUMENT-SPINE.md` be mandatory for all papers or only multi-format papers? Recommend: mandatory when ≥2 formats exist; optional but encouraged otherwise.
- Should a paper allow multiple audiences per format, or should each format assume one primary forum? Recommend: one primary forum per format; cross-forum reuse should be a new format.
- Should `FINAL.md` remain top-level for the primary format, or should all finals move under `.paper/formats/`? Defer to Phase 2.
- Should there be explicit `gpd compress` and `gpd expand` commands? Defer to Phase 3.
- Should drift signal be suppressible during rapid spine iteration (e.g., a `--draft-spine` mode that skips drift marking until explicit publish)? Open.

## Acceptance criteria

### Phase 1 ships when

- at least one real GPD-built paper has been produced in at least 2 formats (not template fixtures), with each format reviewed and exported successfully
- shared core artifacts remain canonical and non-duplicated across formats
- each format has its own outline, draft, review, and export path
- `gpd status` reports drift state per format using the hash-based mechanism
- a core change to `ARGUMENT-SPINE.md` correctly transitions all dependent formats to `stale`
- `gpd format refresh <name>` correctly returns a format to `current` after author updates
- single-format workflows show no behavior change (regression-tested)
- argument-spine validator catches malformed spines (missing sections, exceeded length budget)

### Phase 1 success — distinct from shipping — measured 90 days post-release

- at least 3 multi-format papers produced in real use (not demos), each scored against the RFC-007 rubric
- measured time-to-second-format ≤ 30% of time-to-first-format on those papers (the compression-of-effort claim that justifies the design)
- zero silent-mutation incidents (no case where format-level work changed core artifacts without explicit author intent)
- argument spine maintained `current` on ≥80% of multi-format papers at any given time (signal that drift detection is being used, not ignored)
- per-format quality score on the RFC-007 rubric is within 0.5 points of the equivalent single-format paper baseline (the multi-format derivation does not degrade individual outputs)

If these success measures are not met, Phase 2 acceptance must include a remediation plan addressing the failed measures.

## Sequencing

This RFC is **gated behind RFC-007** (evaluation harness, GitHub #32). The reasoning:

Multi-format support adds significant surface area — a new authored artifact (`ARGUMENT-SPINE.md`), a new file tree (`.paper/formats/`), new lifecycle states (drift), new commands (`gpd format ...`), and a doubled review surface (core review + format review). The framework's central claim is "better papers." That claim is currently unmeasured. Adding format complexity before the quality-measurement instrument exists makes the framework harder to validate, not easier.

Specifically, the question "is this format actually good for its forum?" is unanswerable without a quality rubric. RFC-007 defines that rubric. Without it, multi-format support ships with no way to know whether the renderings produced meet quality standards — including the central worry that compression-into-decision-memo or expansion-into-strategy-paper might degrade argument fidelity.

**Recommended sequencing**:

1. RFC-007 Phase 1 lands (rubric v1.0.0, manual hand-scoring of 3-5 papers, weak baseline included)
2. RFC-014 Phase 1 lands (this RFC)
3. RFC-014 Phase 1 success measures evaluated against RFC-007 rubric at 90 days post-release

This sequencing turns RFC-014 acceptance into a bounded, measurable design problem rather than an asserted feature.

## Implementation Recommendation

**Readiness:** ready for backlog tracking, not immediate implementation.

Tracked issues:

- #45: standalone `ARGUMENT-SPINE.md` artifact and validation
- #47: full multi-format paper support
- #32: evaluation harness dependency with format-aware rubric overlays
- #26: status/next UX for format drift visibility

### Usability and quality direction

The core/format split is the right architecture. It lets one argument travel into multiple deliverables without duplicating decisions, strategy, evidence, and argument structure. The feature must remain opt-in so single-format papers stay simple.

Recommended changes:

- Treat `ARGUMENT-SPINE.md` as the first independent value slice before building `.paper/formats/`.
- Keep format commands minimal. Prefer `gpd next` and `gpd status` for guidance once formats exist.
- Hide `.paper/formats/` from beginner docs until the user opts into multiple formats.
- Use plain-language drift messages, not hash output.
- Do not let derived formats create a new thesis, ask, or evidence base. If a format needs a different thesis, reopen the core or create a separate paper.

### Phase 0: spine validation

Before full multi-format support, validate whether `ARGUMENT-SPINE.md` should be authored or derived.

Run one real paper through the workflow and answer:

- Does the author maintain the spine independently?
- Does it drift from `BRIEF.md`, `STRATEGY.md`, or `PAPER-CONTEXT.md`?
- Does it improve review, drafting, compression, or revision?

If the spine becomes duplicate stale work, later design should derive it from existing artifacts instead of making it another authored artifact.

### Drift and measurement requirements

Initial drift detection should normalize section bodies before hashing so whitespace-only changes do not mark every format stale.

The RFC-007 evaluation harness must support format-aware rubric overlays. A short decision memo and a long strategy paper share quality dimensions, but not identical weights or depth expectations.

### Issue mapping

| Issue | Relationship |
|---|---|
| #45 | Phase 0 spine artifact and authored-vs-derived validation |
| #47 | Full multi-format feature, blocked by #32 and #45 outcome |
| #32 | Format-aware rubric overlays required before #47 ships |
| #26 | Per-format drift and export readiness in `gpd status` |
| #27 | Paper Lab fixture for multi-format workflow evaluation |
| #23 | Potential review-cycle reduction from spine reuse |

### Recommendation

Implement #45 first. Keep #47 blocked until #32 has format-aware scoring and #45 proves the spine model. Do not start `.paper/formats/` work until those conditions are met.
