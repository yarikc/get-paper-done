<purpose>
Create or refine the writing brief.
</purpose>

<required_reading>
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/PAPER-CONTEXT.md if present
- .paper/DECISIONS.md if present
- .paper/STRATEGY.md if present
- templates/brief.md
- templates/strategy.md
</required_reading>

<process>

Read `.paper/PERSONA.md` and `.paper/AUDIENCE.md` first.

Before writing or rewriting the brief, check `.paper/STATE.json` `grill`.

If `grill.status` is not `Complete`, or `grill.resolved_decisions` does not include all required decision keys, stop and recommend `/gpd-grill`. This is mandatory for new and imported papers. Do not treat placeholder `BRIEF.md` content, imported draft prose, or chat memory as a substitute for completed grill state.

Required grill decision keys:

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

If `.paper/IMPORT.md` exists and the brief is mostly inferred from imported material, do not accept the imported thesis as settled. Check for completed grill state plus `.paper/PAPER-CONTEXT.md` and `.paper/DECISIONS.md`.

If the thesis, audience priority, decision/belief shift, narrative spine, or key terms are still ambiguous, stop and recommend `/gpd-grill` before rewriting `.paper/BRIEF.md`. The grill step should recover author intent and create paper decision records before the brief compresses the paper.

Ask for or refine:

- document intent
- paper classification: `purpose`, `channel`, `risk`, `complexity`, and `audience_shape`
- working title
- legacy/display label or format, if useful
- one-line thesis
- narrative spine
- strongest opposing view
- why the position matters now
- scope boundaries
- reader promise
- claims deck with 3 to 5 arguable claims
- objection, response, and implication for each claim
- process-burden check when the paper proposes governance, controls, standards, gates, reviews, required records, or operating mechanisms
- known sources
- open questions
- length and deadline
- must-include and must-avoid items

Write `.paper/BRIEF.md`.

If classification is missing or wrong in `.paper/config.json`, update it using the normalized enum values:

- `purpose`: `decision_memo`, `strategy_paper`, `explainer`, or `update`
- `channel`: `internal`, `external`, or `mixed`
- `risk`: `internal_low`, `internal_high`, `external_low`, `external_high`, or `regulated`
- `complexity`: `light`, `standard`, or `deep`
- `audience_shape`: `single`, `prioritized_multi`, or `hybrid`

Keep `paper_type` only as an optional display or backward-compatibility label. Later stages should use `classification.purpose`, not labels such as blog, white paper, or architecture paper.

For governance, control, standard, gate, review, required-record, or operating-mechanism proposals, make the brief name:

- the governed object
- the durable artifact or record
- the difference between the process and the artifact
- whether evidence is static, current, scheduled for recertification, or trigger-refreshed
- the refresh triggers
- the decision rule the evidence affects
- why cited standards matter, without implying they mandate the exact internal workflow unless they do
- how the proposal avoids unnecessary bureaucracy through automation, observed evidence, owner attestation, validation, or human-by-exception review

Run the strategy gate or update `.paper/STRATEGY.md` when the brief changes materially. The strategy gate may return:

- `Go`: proceed to research or outline.
- `Revise Before Drafting`: block research, outline, and drafting until the brief is revised or the user explicitly overrides.
- `No-Go`: block research, outline, and drafting until the user redirects the paper or explicitly overrides.

The strategy gate must also populate `Strategy Blockers`. Use normalized blocker values so downstream routing does not depend on prose:

- `scope_too_broad`
- `thesis_weak`
- `audience_unclear`
- `audience_conflict`
- `evidence_gap`
- `weak_ask`
- `poor_posture`
- `missing_outcome`
- `reader_promise_weak`
- `decision_usefulness_weak`

Use `none` when status is `Go`.

Set `Required unblock action` to one of:

- `none`
- `brief_revision`
- `audience_revision`
- `thesis_revision`
- `scope_narrowing`
- `research_plan`
- `user_override`

Update `.paper/STATE.md` and `.paper/STATE.json` with suggested next command:

- `/gpd-research` if claims need support
- `/gpd-outline --deep` if the brief is already sufficiently supported and the paper is serious/researched/high-stakes; `/gpd-outline --lite` for early shaping or short pieces

If the strategy gate blocks progress, set:

- **Status:** Blocked
- **Blocked By:** strategy block: [primary blocker from `STRATEGY.md`]
- **Suggested next command:** `/gpd-brief`

</process>
