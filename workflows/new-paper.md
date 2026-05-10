<purpose>
Initialize a new paper workspace through questioning, persona setup, audience setup, and brief creation.
</purpose>

<required_reading>
- references/questioning.md
- references/writing-artifacts.md
- templates/project.md
- templates/persona.md
- templates/audience.md
- templates/brief.md
- templates/strategy.md
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

Use those answers to create `.paper/PROJECT.md`, `.paper/PERSONA.md`, `.paper/AUDIENCE.md`, `.paper/BRIEF.md`, `.paper/STRATEGY.md`, `.paper/config.json`, `.paper/STATE.md`, and `.paper/STATE.json`. Keep `PROJECT.md` short and put detailed thesis, claims, objections, and definition of done in `BRIEF.md`. Keep missing evidence marked as source gaps. Run the strategy gate before suggesting research, outline, or drafting.

If `--fast` is not present, continue with full intake.

Ask freeform first:

> What are we writing?

Follow the thread until you understand:

- paper type
- working title or topic
- thesis or likely thesis
- target audience
- desired reader shift
- publication context
- rough length
- evidence standard

Use the questioning guide, but do not run a checklist out loud.

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

## 5. Brief

Create `.paper/BRIEF.md`.

Capture:

- document intent
- one-line thesis
- strongest opposing view
- why this matters now
- reader promise
- 3 to 5 arguable claims
- likely objection, response, and implication for each claim
- known sources
- open questions
- constraints
- definition of done

## 6. Strategy Gate, Project, And State

Create `.paper/PROJECT.md`, `.paper/STRATEGY.md`, `.paper/config.json`, `.paper/STATE.md`, and `.paper/STATE.json`.

`PROJECT.md` should stay short: paper identity, intended outcome, format, publishing context, source policy, and boundaries. Do not duplicate the full claims deck from `BRIEF.md`.

Run the strategy gate before setting the next command. `STRATEGY.md` must declare one of:

- `Go`
- `Revise Before Drafting`
- `No-Go`

`STRATEGY.md` must also include `Strategy Blockers` with:

- `Blocking issues`: normalized blocker list, or `none`
- `Primary blocker`: one blocker to fix first, or `none`
- `Block severity`: `None`, `Medium`, or `High`
- `Required unblock action`: `none`, `brief_revision`, `audience_revision`, `thesis_revision`, `scope_narrowing`, `research_plan`, or `user_override`

If the strategy gate returns `Revise Before Drafting` or `No-Go`, set suggested next command to `/gpd-brief` in both `STATE.md` and `STATE.json`, and do not suggest research, outline, or drafting unless the user explicitly overrides the strategy block.

Set suggested next command:

- `/gpd-research` if claims need support, if the argument has meaningful opposing views, or if the paper makes factual, strategic, trend, technical, regulatory, market, or organizational claims
- `/gpd-outline --deep` if sources and thesis are already sufficient for a serious/researched/high-stakes paper; `/gpd-outline --lite` for early shaping or short pieces

Research is the evidence-for/evidence-against checkpoint. It happens after the brief captures thesis and claims, and before outline/draft lock in the argument structure.

</process>

<success_criteria>
- `.paper/PROJECT.md` exists
- `.paper/PERSONA.md` exists and contains actionable drafting directives
- `.paper/AUDIENCE.md` exists and contains objections and desired shift
- `.paper/BRIEF.md` exists and contains a thesis, opposing view, claims deck, and definition of done
- `.paper/STRATEGY.md` exists and records strategic readiness
- `.paper/STATE.md` identifies `/gpd-research` as suggested next command when evidence or counterevidence is needed
- `.paper/STATE.md` records current stage, last completed stage, blockers, and suggested next command
- `.paper/STATE.json` records the same state in machine-readable form for CLI status and validation
</success_criteria>
