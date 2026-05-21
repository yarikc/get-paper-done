<purpose>
Create or refine the paper-scoped audience profile.
</purpose>

<required_reading>
- templates/audience.md
- references/questioning.md
- audiences/*.md if present
</required_reading>

<process>

Read existing `.paper/AUDIENCE.md` if present.

Check for curated audience personas in `audiences/*.md`.

Ask whether to:

- select one or more curated audience personas
- create a new custom audience
- combine curated personas with custom constraints

If the user chooses curated personas:

1. Allow multiple selections.
2. Read each selected persona.
3. Summarize what the persona optimizes for.
4. Suggest improvements or paper-specific adaptations before using it.
5. Ask the user to approve, modify, or reject the improved audience profile.

Never use an existing curated audience persona blindly. Always present the selected persona(s), suggest paper-specific improvements, and ask before writing `.paper/AUDIENCE.md`.

The selection UI should always include:

- CxO reader
- Distinguished architect / engineer
- Business or operating executive
- Public technical reader
- Create new custom audience
- Hybrid / curated plus custom edits

If multiple personas are selected, ask for priority order and conflict rule:

- Which audience is primary?
- Which audience can be secondary?
- What should win when one audience wants brevity and another wants mechanism?

Clarify:

- who the reader is
- what they already know
- what they believe now
- what they need
- likely objections
- desired belief/action shift
- proof standard
- technical depth
- patience and reading context
- scoring emphasis

Write or update `.paper/AUDIENCE.md`.

Keep the audience boundary explicit: `AUDIENCE.md` describes the reader model, objections, proof standard, desired reader shift, and paper-specific adaptation rules. It must not define TUI interaction style, snapshot policy, feedback approval mechanics, or workflow gates.

If `.paper/STATE.md` or `.paper/STATE.json` exists, note that the audience profile was updated and flag downstream artifacts that may need revision.

</process>
