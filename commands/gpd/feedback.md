---
name: gpd:feedback
description: Walk through feedback-plan concerns one at a time and record user decisions
argument-hint: "[collect|clean|--list] [--item N]"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

<context>
**Flags:**
- `--list` - Show the current feedback-plan concern queue without deciding anything.
- `--item N` - Review a specific concern instead of the next pending concern.
- `--aggregate` - Force theme-level feedback-plan grouping during capture.
- `--itemized` - Force one feedback-plan item per captured comment during capture.
- `collect` - Extract inline human comments into feedback artifacts. This is the default, so `gpd feedback` is enough when run from a paper directory.
- `clean` - Remove extracted inline comments from the reviewed Markdown after confirming capture.

This command is the user-facing approval loop for `.paper/FEEDBACK-PLAN.md`.
Use it after inline reader comments, `/gpd-review`, or `gpd review-external` creates a feedback plan.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/review.md
</execution_context>

<process>
If `collect` is present, or if no subcommand is provided, run:

```bash
gpd feedback
```

When running from outside the paper directory, use:

```bash
gpd feedback --paper <paper-dir>
```

Use this when the user has added inline comments such as:

```md
//todo: requested action
//keep: preserve this wording, argument, voice, or specificity
//qq: question or uncertainty
//no: reject or disagree with this claim/framing
```

The CLI preserves the commented paper, writes `.paper/FEEDBACK-READER.md` and `.paper/FEEDBACK-PLAN.md`, leaves comments in place by default, and records a first-pass interpretation. For 8 or fewer comments, the plan is itemized. For more than 8 comments, the plan is grouped into themes by default so the user decides a small set of patterns instead of approving every raw comment. Use `--itemized` only when the user explicitly wants comment-by-comment handling. Do not treat raw capture as approval to revise.

If `clean` is present, run:

```bash
gpd feedback clean --paper <paper-dir>
```

Only clean comments after the user confirms extraction captured the comments correctly.

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
- severity and suggested handling
- your interpretation: agree, disagree, or needs clarification
- why it matters
- what improves if addressed
- risk if handled badly
- proposed handling
- proposed edits
- reviewer evidence
- current decision and constraint

Before asking for a decision, read the relevant source context from the paper artifacts and state your judgment. Say "suggested handling" for the generated default; do not say "my recommendation: modify" because `modify` is also a user decision option.

- **Agree** when the comment identifies a real problem in thesis, audience fit, evidence, argument flow, voice, or ask clarity.
- **Disagree** when applying the comment would weaken the approved paper purpose, dilute voice, introduce false certainty, or expand scope.
- **Needs clarification** when the comment is valid as reader friction but the required fix is ambiguous.

Then explain what you would change, why it improves the paper, and how you would avoid damaging the current draft. If the concern is broad or indicates a structural failure, say so and route it to brief, research, outline, or major revision instead of pretending it is a sentence edit.

Ask the user for one decision using a single selection list:

- `approve`
- `modify`
- `defer`
- `reject`
- `answered_no_action`

If the user selects `modify`, ask one short follow-up question for the required
constraint or instruction. If the user selects `defer` or `reject`, ask for a
short reason only when the reason is not already clear from the conversation.
Use `answered_no_action` when a `//qq:` question has been answered and no
revision is needed.

After the user answers, record the decision with:

```bash
gpd feedback-plan decide --paper <paper-dir> --item <N> --decision <approve|modify|defer|reject|answered_no_action> --note "<constraint or reason>"
```

Then show the next pending concern if one remains. Do not revise `.paper/DRAFT.md`; `/gpd-feedback` only records decisions. `/gpd-revise` applies approved or modified concerns after snapshot protection.
</process>
