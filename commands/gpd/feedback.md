---
name: gpd:feedback
description: Walk through feedback-plan concerns one at a time and record user decisions
argument-hint: "[--list] [--item N]"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

<context>
**Flags:**
- `--list` - Show the current feedback-plan concern queue without deciding anything.
- `--item N` - Review a specific concern instead of the next pending concern.

This command is the user-facing approval loop for `.paper/FEEDBACK-PLAN.md`.
Use it after `/gpd-review`, `gpd feedback`, or `gpd review-external` creates a feedback plan.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/review.md
</execution_context>

<process>
If `--list` is present, run:

```bash
gpd feedback-plan list --paper <paper-dir>
```

Show the queue and stop.

Otherwise, run:

```bash
gpd feedback-plan review --paper <paper-dir> [--item N]
```

Show the concern in plain language:

- concern title
- severity and recommendation
- why it matters
- what improves if addressed
- risk if handled badly
- proposed handling
- proposed edits
- reviewer evidence
- current decision and constraint

Ask the user for one decision using a single selection list:

- `approve`
- `modify`
- `defer`
- `reject`

If the user selects `modify`, ask one short follow-up question for the required
constraint or instruction. If the user selects `defer` or `reject`, ask for a
short reason only when the reason is not already clear from the conversation.

After the user answers, record the decision with:

```bash
gpd feedback-plan decide --paper <paper-dir> --item <N> --decision <approve|modify|defer|reject> --note "<constraint or reason>"
```

Then show the next pending concern if one remains. Do not revise `.paper/DRAFT.md`; `/gpd-feedback` only records decisions. `/gpd-revise` applies approved or modified concerns after snapshot protection.
</process>
