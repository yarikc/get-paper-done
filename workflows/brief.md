<purpose>
Create or refine the writing brief.
</purpose>

<required_reading>
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/STRATEGY.md if present
- templates/brief.md
- templates/strategy.md
</required_reading>

<process>

Read `.paper/PERSONA.md` and `.paper/AUDIENCE.md` first.

Ask for or refine:

- document intent
- working title
- format
- one-line thesis
- strongest opposing view
- why the position matters now
- scope boundaries
- reader promise
- claims deck with 3 to 5 arguable claims
- objection, response, and implication for each claim
- known sources
- open questions
- length and deadline
- must-include and must-avoid items

Write `.paper/BRIEF.md`.

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
