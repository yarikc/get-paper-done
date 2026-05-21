<purpose>
Create, review, and evolve reusable curated audience personas in `audiences/`.
</purpose>

<required_reading>
- templates/curated-audience.md
- references/audience-review-rubric.md
- references/writing-artifacts.md
</required_reading>

<process>

## 1. Determine Mode

Parse `$ARGUMENTS`:

- `--new`: create new curated audience
- `--edit <slug>`: update existing curated audience
- `--review <slug>`: review existing curated audience and propose improvements

If no mode is provided, show available personas from `audiences/*.md` and ask whether to create, edit, or review.

## 2. New Curated Audience

For `--new`, ask:

- Who is this reader?
- What role/context do they occupy?
- What do they already believe?
- What do they care about most?
- What do they reject quickly?
- What proof standard do they need?
- What decisions or actions can they take?
- What writing fails for them?
- What writing works for them?
- What scoring dimensions matter most?

Create `audiences/[slug].md` using `templates/curated-audience.md`.

Keep the audience boundary explicit: curated audience personas describe reusable reader models, objections, proof standards, desired reader shifts, and adaptation rules. They must not define TUI interaction style, snapshot policy, feedback approval mechanics, or workflow gates.

Before writing:

- show the proposed persona
- ask for approval
- revise if requested

## 3. Review Existing Curated Audience

For `--review <slug>`:

Read `audiences/<slug>.md`.

Assess:

- Is the reader specific enough?
- Are current beliefs concrete?
- Are needs decision-relevant?
- Are objections strong and realistic?
- Is the proof standard clear?
- Are adaptation rules actionable?
- Are scoring emphases distinct from other personas?
- Are failure patterns and good/bad fit signals specific?

Return:

- strengths
- gaps
- proposed edits
- whether this should remain its own persona or merge with another

Ask before editing the file.

## 4. Edit Existing Curated Audience

For `--edit <slug>`:

Read `audiences/<slug>.md`.

Ask what changed or what new learning should be incorporated.

Classify changes:

- reusable persona change → update `audiences/<slug>.md`
- paper-specific adaptation → suggest updating `.paper/AUDIENCE.md` instead

Before writing:

- show proposed diff or clear summary of edits
- ask for approval

Update `Evolution Notes` with date, change, and reason.

## 5. Scope Rules

Curated audience personas are reusable. They should not include paper-specific thesis, source, or draft details.

Use `.paper/AUDIENCE.md` for:

- paper-specific audience priority
- conflict rules across multiple audiences
- adaptations for one publication context
- temporary assumptions

Use `audiences/*.md` for:

- stable reader type
- reusable objections
- reusable proof standard
- reusable scoring emphasis
- recurring failure patterns

</process>

<success_criteria>
- New personas are saved under `audiences/`
- Existing personas are never modified without approval
- Paper-specific adaptations are not mistakenly written into reusable personas
- Evolution notes are updated for reusable persona changes
</success_criteria>
