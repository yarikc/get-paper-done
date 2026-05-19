<purpose>
Apply approved review feedback into a new draft pass, or run a controlled editorial pass when explicitly requested.
</purpose>

<required_reading>
- .paper/PROJECT.md
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/BRIEF.md
- .paper/STRATEGY.md if present
- .paper/RESEARCH.json if present
- .paper/RESEARCH.md if present
- .paper/OUTLINE.md if present
- .paper/DRAFT.md
- .paper/REVIEW.md
- .paper/FACT-CHECK.md if present
- .paper/FEEDBACK-EXTERNAL.md if present
- .paper/FEEDBACK-READER.md if present
- .paper/FEEDBACK-PLAN.md if present
- .paper/REVISION-LOG.md if present
- .paper/REVISION-CHECK.md if present
</required_reading>

<process>

Read the current draft and review. If `.paper/FEEDBACK-READER.md` exists, read it as input to feedback handling, not as direct edit authority. If `.paper/FEEDBACK-PLAN.md` exists, read it before proposing or applying changes.

If `.paper/FEEDBACK-PLAN.md` has status "Pending user approval", stop and ask the user to approve, revise, or ignore the plan. The `Decision` field is the generated default; the `User Override` field takes precedence for any item where the user changed it. Do not edit `.paper/DRAFT.md` until feedback handling is approved.

If `.paper/STRATEGY.md` has status `Revise Before Drafting` or `No-Go`, stop unless the user explicitly overrides the strategy block. Cite the primary blocker from `Strategy Blockers` when present.

Parse intent flags:

- `--section <name>`: revise or edit only a named section.
- `--full`: revise or edit the whole draft. Use only when explicitly requested.
- `--editorial-review`: return an editorial plan only; do not modify `.paper/DRAFT.md`.
- `--style-pass`: tune tone, rhythm, and voice without changing structure, thesis, claims, or evidence.
- `--final-polish`: final prose pass after review verdict is `Ready` or user explicitly accepts remaining risk.
- `--light-edit`: copyedit, small clarity edits, minor rhythm fixes, typo/grammar cleanup, no structural movement.
- `--standard-edit`: default editorial intensity; clarity, flow, redundancy, transitions, headings when allowed, and paragraph-level tightening.
- `--heavy-edit`: substantial structural and prose work on an existing draft. Requires explicit user request and must not change strategy, thesis, evidence meaning, or scope without approval.

Default mode:

- If approved review feedback exists, apply only approved feedback.
- If no approved feedback exists and the user asks for editing, use `editorial_review` first unless the user explicitly requests `--section`, `--style-pass`, `--final-polish`, or `--full`.
- If the user asks to apply pending, reader, or external feedback, create or update `.paper/FEEDBACK-PLAN.md` and ask before editing.
- If no edit intensity is provided, use `--standard-edit`.

Before editing, identify:

- required fixes
- below-target improvement gate items from `.paper/REVIEW.md`
- approved external feedback to incorporate
- approved reader feedback to incorporate
- user overrides in `.paper/FEEDBACK-PLAN.md`
- feedback explicitly ignored or deferred
- claims needing support or removal
- fact-check findings requiring source, softening, removal, reframe, or current verification
- sections needing reorder
- tone mismatches
- audience objections not handled
- author voice characteristics and strong existing material to preserve
- publication-readiness issues in title, opening, section flow, tone consistency, redundancy control, draft residue, and ending

Classify whether the requested edit is substantive before changing `.paper/DRAFT.md`.

A revision is substantive when it changes, removes, adds, compresses, reorders, or reframes any of the following:

- thesis, paper job, decision ask, reader promise, or scope
- argument flow, section order, section purpose, or conclusion
- evidence use, evidence strength, source interpretation, or claim support
- mechanisms, examples, definitions, governance/control language, or operating model
- audience handling, objection handling, persona, voice, register, or author posture
- more than local copyediting in a paragraph that carries a claim

Typos, punctuation, formatting, link fixes, and narrow sentence-level clarity edits are not substantive unless they change claim meaning, emphasis, or voice.

Before any substantive revision, run the CLI revision preflight. It creates the paper-local snapshot, records it in state, and prints the restore command:

```bash
gpd revise --paper <paper-dir> --trigger .paper/FEEDBACK-PLAN.md
```

If the revision is not triggered by a feedback plan, set `--trigger` to the artifact or user request that caused the edit. If `gpd revise` is unavailable, stop and ask before falling back to `gpd snapshot --paper <paper-dir> --reason before_substantive_revision --trigger <trigger>`. Do not edit first and snapshot later. Do not rely on `REVISION-CHECK.md` alone as the baseline. The snapshot is the recoverable paper state; the revision check is the quality comparison. Snapshot metadata includes hashes; validation checks those hashes when a revision check references the snapshot.

If `.paper/REVIEW.md` contains a `Below-Target Improvement Gate` with `Immediate improvement required before export: Yes`, handle those items before export. Apply any `apply_now` or equivalent items that do not require new author decisions. If an item cannot be applied safely, record it in `.paper/FEEDBACK-PLAN.md`, `.paper/REVIEW.md`, or the draft change log with a concrete deferral reason. Do not export a serious paper while known fixable below-target issues remain only as suggestions.

Revision boundary:

- `/gpd-revise` applies approved feedback from `.paper/REVIEW.md`, `.paper/FACT-CHECK.md`, `.paper/FEEDBACK-READER.md`, and `.paper/FEEDBACK-PLAN.md`.
- `paper-editor` handles controlled prose quality: editorial review, section edit, full edit, style pass, or final polish.
- Neither path may silently change thesis, claim meaning, evidence meaning, scope, audience, or decision ask.

Run drift checks before and after any edit:

- thesis drift
- claim drift
- evidence-strength drift
- scope drift
- audience-fit drift
- persona drift
- voice/register drift
- decision-ask drift
- substance loss

Edit in layers when running an editorial mode:

1. Structure: section order, headings, repetition, opening/conclusion alignment.
2. Clarity: clean claims, dense passages, jargon, overloaded sentences, terminology consistency.
3. Rhythm and flow: sentence variation, paragraph movement, transitions, repetition.
4. Tone consistency: voice drift, generic AI/corporate phrasing, over-formality, over-casualness.
5. Publication readiness: title, opening, placeholders, citation/source placeholder consistency, ending, target channel readiness.

Revise `.paper/DRAFT.md` in place only when feedback is approved or the user explicitly requested an edit mode. Preserve any strong material unless it conflicts with the approved review, brief, strategy, evidence, or audience profile.

Do not edit `.paper/exports/FINAL.md` as the durable source. If the user commented on `FINAL.md`, use those comments as feedback, apply approved changes to `.paper/DRAFT.md`, then route to `/gpd-export` so `FINAL.md` is regenerated.

Include a short change log for any draft modification:

- location
- change type
- what changed
- why
- whether it was substantive

If a needed change is substantive and not already approved, stop and ask before applying it.

After every substantive revision, write or update `.paper/REVISION-CHECK.md` from `templates/revision-check.md` before export. The check must compare the revised draft to the snapshot created before the revision and score thesis clarity, argument flow, evidence support, audience fit, persona and voice, ask clarity, and substance preservation.

The revision fails if any score drops unless the user explicitly accepts the tradeoff in `.paper/REVISION-CHECK.md`. Do not treat `gpd validate` or semantic validation as readiness by itself. Validators are advisory; never fix a validator warning by deleting specificity, weakening evidence, flattening persona/voice, or reducing persuasive force.

If a revision degrades the paper, use `gpd restore --paper <paper-dir> --snapshot REV-...` to recover the prior tracked files. Restore creates a safety snapshot of the current state before copying files back.

After any draft modification, report the exact snapshot and restore command:

```text
Prior version preserved at .paper/versions/<SNAPSHOT_ID>.
Restore with gpd restore --paper <paper-dir> --snapshot <SNAPSHOT_ID> if this revision regresses quality.
```

Add a short revision note at the top of `.paper/REVIEW.md` or in `.paper/STATE.md` describing what changed.

Update `.paper/STATE.md` and `.paper/STATE.json` with suggested next command:

- `/gpd-fact-check --publication` if factual claims, source-backed claims, statistics, current claims, technical claims, regulatory claims, market claims, citations, or factual risk language changed.
- `/gpd-review` if revision changed structure, audience handling, thesis expression, tone, or argument flow but did not change factual claims.
- `/gpd-export` only if the prior review verdict was `Ready`, no fact-check issues remain, and the revision was limited to low-risk copy/style cleanup.

</process>
