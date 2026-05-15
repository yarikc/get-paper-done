<purpose>
Initialize a new paper workspace through light intake, persona setup, audience setup, and the mandatory grill gate. Do not collapse the paper into a formal brief until `/gpd-grill` has completed.
</purpose>

<required_reading>
- references/questioning.md
- references/writing-artifacts.md
- templates/project.md
- templates/persona.md
- templates/audience.md
- templates/brief.md
- templates/strategy.md
- templates/paper-context.md
- templates/decisions.md
- templates/state.md
- templates/state.json
- templates/config.json
</required_reading>

<process>

## 1. Setup

Parse flags:

- `--fast`: use the one-page fast intake. Ask only for audience, problem, thesis, three claims, best evidence, main counterargument, recommendation, tone notes, what to avoid, and draft length.
- `--profile <name>`: import `profiles/<name>.md` as reusable author context when creating `.paper/PERSONA.md`.
- `--location <path>`: create the paper directory under this location.
- `--slug <name>`: use this directory name for the paper.

Ask for the paper location before creating files unless `--location` is provided:

- Default suggestion: current working directory
- Accept absolute paths and paths relative to the current working directory
- Expand `~` to the user's home directory

Ask for a paper directory name unless `--slug` is provided:

- Default suggestion: slugified working title or topic
- Use lowercase words separated by hyphens
- Avoid spaces and punctuation in the directory name

Create the paper directory at:

```text
[location]/[paper-slug]/
```

All subsequent file operations in this workflow happen inside that paper directory.

If `[location]/[paper-slug]/.paper/` already exists, stop and tell the user to choose a different location or slug, or run `/gpd-progress` from inside the existing paper directory.

Create:

```text
.paper/
.paper/sources/
.paper/exports/
```

## 2. Intake

If `--fast` is present, skip broad questioning and collect:

- Audience
- Problem
- Thesis
- Three claims
- Best evidence
- Main counterargument
- Recommendation
- Tone notes
- What to avoid
- Draft length

Use those answers to create `.paper/PROJECT.md`, `.paper/PERSONA.md`, `.paper/AUDIENCE.md`, placeholder `.paper/BRIEF.md`, placeholder `.paper/STRATEGY.md`, `.paper/config.json`, `.paper/STATE.md`, and `.paper/STATE.json`. Keep the placeholder brief visibly provisional and route to `/gpd-grill`; fast intake is not permission to skip ambiguity removal.

If `--fast` is not present, continue with full intake.

Ask freeform first:

> What are we writing?

Follow the thread until you understand:

- paper classification in plain language, then normalize into config enum values:
  - `purpose`: `decision_memo`, `strategy_paper`, `explainer`, or `update`
  - `channel`: `internal`, `external`, or `mixed`
  - `risk`: `internal_low`, `internal_high`, `external_low`, `external_high`, or `regulated`
  - `complexity`: `light`, `standard`, or `deep`
  - `audience_shape`: `single`, `prioritized_multi`, or `hybrid`
- any legacy/display label such as memo, blog, article, board paper, white paper, architecture paper, or newsletter
- working title or topic
- thesis or likely thesis
- target audience
- desired reader shift
- publication context
- rough length
- evidence standard

Use the questioning guide, but do not run a checklist out loud.

Write normalized classification into `.paper/config.json`. Do not force the user to speak in enum values; infer them from plain-language answers and state the mapping briefly before continuing.

## 3. Persona

Create `.paper/PERSONA.md`.

Before asking persona questions, check for reusable profiles in `profiles/*.md`. If one is provided with `--profile`, read it and adapt it into `.paper/PERSONA.md`. If profiles exist but no profile flag was provided, ask whether to import one or create a fresh paper-specific persona.

Ask for or infer:

- authority posture
- voice
- energy level
- vocabulary level
- argument style
- tone boundaries
- calibration examples
- content expectations
- output preferences

If the user has an existing persona profile, import it only after confirming it applies to this paper.

## 4. Audience

Create `.paper/AUDIENCE.md`.

Before asking audience questions, check for curated audience personas in `audiences/*.md`.

Present audience selection with curated options plus a custom option:

- CxO reader
- Distinguished architect / engineer
- Business or operating executive
- Public technical reader
- Create new custom audience
- Hybrid / curated plus custom edits

If existing curated personas are selected, read them, suggest improvements for this paper, and ask for approval before using them. Do not use existing personas without review.

If multiple personas are selected, capture priority order and conflict rule in `.paper/AUDIENCE.md`.

Drafting must not proceed unless `.paper/AUDIENCE.md` declares either selected curated personas or a custom audience.

Ask for or infer:

- audience identity
- expertise level
- current beliefs
- likely objections
- proof standard
- desired shift
- time/patience
- proof standard
- scoring emphasis

## 5. Placeholder Brief And Mandatory Grill

Create `.paper/BRIEF.md` only as a placeholder intake artifact. It may contain the apparent paper job, apparent reader, apparent thesis, and open questions, but it must state that it is provisional until `/gpd-grill` completes.

Set the mandatory grill gate in `.paper/STATE.json`:

```json
"grill": {
  "status": "Not Started",
  "completion_basis": "",
  "resolved_decisions": []
}
```

The grill must later resolve these decision keys before `/gpd-brief`: `paper_job`, `primary_reader`, `belief_shift`, `thesis`, `narrative_spine`, `key_terms`, `scope_boundary`, `proof_standard`, `strongest_counterargument`, and `non_goals`.

Do not run the real strategy gate, research, outline, or draft from this workflow. The next workflow must interrogate the paper idea one question at a time, record `PAPER-CONTEXT.md` and `DECISIONS.md`, then allow `/gpd-brief` to create the formal brief.

## 6. Project, Provisional Strategy, And State

Create `.paper/PROJECT.md`, `.paper/STRATEGY.md`, `.paper/config.json`, `.paper/STATE.md`, and `.paper/STATE.json`.

`PROJECT.md` should stay short: paper identity, intended outcome, format, publishing context, source policy, and boundaries. Do not duplicate the full claims deck from `BRIEF.md`.

Create provisional `STRATEGY.md` as blocked until the grill and brief are complete. `STRATEGY.md` must declare one of:

- `Go`
- `Revise Before Drafting`
- `No-Go`

`STRATEGY.md` must also include `Strategy Blockers` with:

- `Blocking issues`: normalized blocker list, or `none`
- `Primary blocker`: one blocker to fix first, or `none`
- `Block severity`: `None`, `Medium`, or `High`
- `Required unblock action`: `none`, `brief_revision`, `audience_revision`, `thesis_revision`, `scope_narrowing`, `research_plan`, or `user_override`

Valid blocker values are `none`, `scope_too_broad`, `thesis_weak`, `audience_unclear`, `audience_conflict`, `evidence_gap`, `weak_ask`, `poor_posture`, `missing_outcome`, `reader_promise_weak`, and `decision_usefulness_weak`.

Set suggested next command to `/gpd-grill` in both `STATE.md` and `STATE.json`.

Do not suggest `/gpd-research`, `/gpd-outline`, or `/gpd-draft` from `/gpd-new-paper`. `/gpd-brief` owns the real brief and strategy gate after the grill is complete.

Research is the evidence-for/evidence-against checkpoint. It happens after the brief captures thesis and claims, and before outline/draft lock in the argument structure.

</process>

<success_criteria>
- `.paper/PROJECT.md` exists
- `.paper/PERSONA.md` exists and contains actionable drafting directives
- `.paper/AUDIENCE.md` exists and contains objections and desired shift
- `.paper/BRIEF.md` exists and is clearly marked provisional until `/gpd-grill`
- `.paper/STRATEGY.md` exists and blocks downstream work until grill and brief completion
- `.paper/STATE.md` identifies `/gpd-grill` as suggested next command
- `.paper/STATE.md` records current stage, last completed stage, blockers, and suggested next command
- `.paper/STATE.json` records the same state in machine-readable form for CLI status and validation
</success_criteria>
