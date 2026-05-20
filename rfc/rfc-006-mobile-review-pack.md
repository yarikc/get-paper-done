# RFC-006: Mobile Review Pack

- **Status:** Proposed backlog
- **Author:** AI-assisted, reviewed by project owner
- **Date:** 2026-05-13
- **Scope:** Away-from-desktop paper review capability
- **Tracking Issue:** [#17](https://github.com/yarikc/get-paper-done/issues/17)
- **Related:** `READER-FEEDBACK.md`, `FEEDBACK-PLAN.md`, `gpd export`, `gpd status`, `/gpd-progress`

## Summary

GPD already provides a disciplined, artifact-first workflow for serious papers. This RFC proposes **Mobile Review Pack**: a curated, audio-friendly projection of paper artifacts that supports useful review while away from the desktop.

The goal is to turn commuting, walking, exercising, or other no-keyboard time into structured review time without weakening GPD's core discipline: durable artifacts, quality gates, backward routing, and `.paper/` as the source of truth.

This is not a mobile drafting proposal. It is a review capability.

## Problem

Some of the best reactions to a paper happen when the user is not sitting at a desk. Listening to a draft can expose awkward phrasing, weak transitions, repetition, unclear asks, unsupported leaps, and reader confusion that are easier to miss during visual editing.

Today, the user can manually export a draft, play it through a text-to-speech tool, record voice notes, and later reconstruct the feedback. That loop is useful but ad hoc. It loses GPD's artifact discipline unless the user manually converts the notes back into structured review inputs.

## Opportunity

Create a **Listen -> Ask -> React** review loop:

1. **Listen** to curated paper content in an audio-friendly format.
2. **Ask** questions about current paper state, research, objections, review findings, or next-step implications.
3. **React** through spoken feedback that becomes durable, inspectable review input.

If validated, this extends GPD from a desktop writing workflow into a broader thinking and review system while preserving the existing paper lifecycle.

## Goals

- Enable meaningful paper review away from the desktop.
- Preserve `.paper/` as the single source of truth.
- Produce durable, inspectable artifacts from mobile or voice sessions.
- Route feedback through existing review, feedback planning, revision, and backward-routing gates.
- Validate the capability before choosing any mobile app, vendor, sync model, or implementation architecture.

## Non-Goals

- No native mobile app in the first slice.
- No live two-way sync in the first slice.
- No mobile drafting or heavy structural editing.
- No direct draft mutation from spoken feedback.
- No commitment to Notion, Mem, Tana, Knowbase, Notable, or another vendor.
- No replacement for the desktop workflow for research, outlining, drafting, fact-checking, or revision.

## Core Capability

A Mobile Review Pack is a lightweight, review-oriented projection of the current paper optimized for audio use. It is not the full workspace and not a second authoring system.

The review pack may include:

- paper title and purpose,
- current ask or thesis,
- audio-friendly draft sections,
- strongest supporting evidence,
- unresolved objections,
- fact-check summary,
- review findings,
- open feedback-plan decisions,
- suggested questions for the listener.

## Interaction Modes

### 1. Audio Review

The user listens to selected paper content:

- executive summary,
- current draft section by section,
- open objections,
- fact-check summary,
- audience review summary,
- feedback-plan summary.

### 2. Question-Driven Review

The user asks questions about paper state.

Examples:

- What is the strongest evidence for the main recommendation?
- Which section is weakest for the primary audience?
- What objections are still unresolved?
- What changed after the last review?

This mode should not be implemented until the project has validated that a static review pack is insufficient. Natural-language question answering implies a retrieval or chat surface and should not be assumed in the first slice.

### 3. Spoken Feedback Capture

The user speaks reactions, decisions, objections, and revision ideas.

Examples:

- Section three is too detailed for the intended reader.
- The migration path still feels weak.
- Add one concrete example after the second recommendation.
- This needs more research before revision.

Spoken feedback must become proposals, not direct edits. It should feed into `READER-FEEDBACK.md`, `FEEDBACK-PLAN.md`, or a mobile review session artifact for later approval.

## Design Principles

1. Source of truth stays in `.paper/`.
2. Mobile review is a lens, not a second authoring system.
3. Voice feedback creates proposals, not silent mutations.
4. Outputs must be durable and inspectable.
5. Review output must support backward routing to research, outline, fact-check, review, or revise.
6. Existing artifacts should be reused before new artifact families are added.
7. Capability comes before vendor.
8. Privacy and data boundaries must be explicit before third-party TTS, transcription, or mobile tools are used.

## Relationship To Existing Artifacts

Mobile review should feed existing GPD controls instead of bypassing them.

Likely downstream paths:

- Spoken reactions become `READER-FEEDBACK.md` entries.
- Proposed handling becomes `FEEDBACK-PLAN.md`.
- Research gaps route back to `/gpd-research`.
- Structural gaps route back to `/gpd-outline`.
- Claim concerns route back to `/gpd-fact-check`.
- Approved changes route through `/gpd-revise`.

This keeps mobile review aligned with controlled revision rather than turning it into an untracked editing channel.

## Proposed Artifact Contract

The first implementation should avoid adding a new artifact unless manual validation proves it is useful. If a dedicated artifact is needed, use:

`.paper/MOBILE-REVIEW-YYYYMMDD-HHMM.md`

Suggested structure:

```markdown
# Mobile Review Session

## Metadata
- Session timestamp:
- Source paper state:
- Reviewed artifacts:
- Review mode: audio | question | spoken-feedback | mixed

## Questions Asked
- ...

## Spoken Reactions
- ...

## Decisions
- ...

## Proposed Changes
- ...

## Routing Recommendations
- research | outline | fact-check | review | revise

## Open Questions
- ...
```

The preferred first target is still `READER-FEEDBACK.md` or `FEEDBACK-PLAN.md` when those artifacts are sufficient.

## Manual Validation First

Before implementation, validate the capability manually:

1. Select a real GPD paper with draft, research, fact-check, and review artifacts.
2. Manually prepare an audio-friendly review pack.
3. Listen using any available TTS tool.
4. Record spoken reactions using any available voice-note workflow.
5. Convert reactions into structured review input.
6. Decide whether the session produced feedback that normal desk review missed.
7. Check whether the feedback routed cleanly through existing GPD gates.

## Likely First Implementation Slice

If manual validation succeeds, the first product slice should be small:

- `gpd export --review-pack` or equivalent,
- audio-friendly Markdown output,
- optional manifest under `.paper/mobile/` only if needed,
- normalization guidance that converts spoken reactions into `READER-FEEDBACK.md` or `FEEDBACK-PLAN.md`,
- no mobile app,
- no sync engine,
- no vendor-specific integration.

## Privacy And Data Boundaries

Mobile review may involve TTS, transcription, mobile notes, or chat tools. For serious, confidential, regulated, or company-sensitive papers, sending paper content to third-party tools can be unacceptable.

Any implementation must make the data boundary explicit:

- what content leaves the local workspace,
- which tool receives it,
- whether the tool stores it,
- whether confidential papers are allowed,
- what local-only fallback exists.

## Success Criteria

This RFC is successful only if a manual or prototype run demonstrates that:

- listening reveals useful issues not caught during normal desk review,
- spoken reactions can be converted into specific, actionable feedback,
- feedback remains durable and inspectable,
- existing gates still control revision,
- the workflow improves actual revision quality rather than only adding convenience.

## Backlog Placement

This is a valid feature request, tracked by issue `#17`, but it is deferred behind the next public-source paper calibration.

Do not implement this before proving the core workflow on one more real paper unless the project explicitly reprioritizes mobile review as the next experiment.
