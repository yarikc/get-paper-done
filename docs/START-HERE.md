# Start Here

Get Paper Done helps you create serious papers with AI without losing the
paper's intent, evidence, audience, or state.

The core idea is simple: do not start by drafting. First clarify what the paper
is trying to do, who it is for, what it must prove, and what decision or
understanding it should create.

## First, See The Output

Open one finished paper before creating your own:

- [data-products-ai-scaling FINAL.md](../examples/data-products-ai-scaling/.paper/exports/FINAL.md) shows a full internal strategy-paper flow.
- [public-ai-control-baseline FINAL.md](../examples/public-ai-control-baseline/.paper/exports/FINAL.md) shows a compact public-source decision memo.
- [software-supply-chain-evidence-pack FINAL.md](../examples/software-supply-chain-evidence-pack/.paper/exports/FINAL.md) shows reader feedback, feedback planning, backward routing, fact-checking, and export.

These are workflow outputs. The surrounding `.paper/` folders show the files
that produced them.

## Three Things To Know

| Part | What it does |
|------|--------------|
| `gpd` CLI | Installs GPD, creates/imports paper folders, shows next steps, validates, and exports. |
| Slash commands | Run the writing workflow inside Claude or Codex. |
| `.paper/` | Stores the paper memory: persona, audience, context, decisions, brief, research, outline, draft, review, feedback, and state. |

When unsure, run:

```bash
gpd next
```

or inside Claude/Codex:

```text
/gpd-status
```

Both are read-only. They tell you what to run next and why.

## Install Once

From the local GPD checkout:

```bash
cd /path/to/get-paper-done
npm link
```

Then install into both AI runtimes:

```bash
gpd install claude
gpd install codex
gpd doctor claude
gpd doctor codex
```

Restart Claude Code and Codex after installing.

`npm link` exposes the local `gpd` CLI. `gpd install ...` copies the slash
commands and workflow files into the runtimes.

## Create Your First Paper

Use the CLI:

```bash
gpd init --location ~/papers --slug my-first-paper --title "My First Paper"
cd ~/papers/my-first-paper
gpd next
```

Then open Claude or Codex in that paper directory and run the command GPD
recommends.

You can also create a paper from the AI runtime:

```text
/gpd-new
```

## The Workflow

You do not need to memorize the whole sequence. Use this rule:

```bash
gpd next
```

or:

```text
/gpd-status
```

Run what GPD recommends, then ask for status again.

The mental model underneath is:

```text
clarify -> support -> shape -> draft -> check -> revise -> export
```

### Clarify

```text
/gpd-persona
/gpd-audience
/gpd-grill
/gpd-brief
```

This is where most paper quality is won.

Persona captures author voice. Audience captures the reader and their proof
standard. Grill asks one question at a time until the paper's job, thesis,
terms, scope, counterargument, and non-goals are clear. Brief turns that into a
formal paper contract and strategy gate.

### Support

```text
/gpd-research
```

Research builds evidence before the paper commits to an argument.

### Shape

```text
/gpd-outline
```

Outline creates the reader journey, section structure, evidence placement, and
objection handling.

### Draft

```text
/gpd-draft --next-section
```

Draft one controlled section at a time from approved artifacts.

### Check

```text
/gpd-fact-check --full
/gpd-review
```

Fact-check tests material claims. Review tests audience fit, ask clarity,
evidence, objections, structure, and decision usefulness. If review finds
fixable issues below the paper's quality bar, GPD routes them through revision
before export instead of treating them as optional notes.

### Revise And Export

```text
/gpd-revise
/gpd-export
```

Revise applies approved fixes. Export creates `.paper/exports/FINAL.md`.

## Reviewing The Export

When GPD exports the paper, review this file:

```text
.paper/exports/FINAL.md
```

If you add comments to it, run:

```text
/gpd-review
```

GPD will capture the comments, plan the handling, revise `.paper/DRAFT.md`,
and regenerate `FINAL.md`. You review the final reading copy; GPD keeps
`DRAFT.md` as the source of truth.

## Moving Backward Is Normal

GPD is not a one-way conveyor belt.

If review finds that the ask is unclear, GPD may route back to `/gpd-brief`.
If the new brief needs stronger evidence, it routes to `/gpd-research`. If
research changes the argument, it routes to `/gpd-outline` before drafting
continues.

That is an incremental repair, not a full reset.

## Import Existing Work

If you already have drafts, notes, sources, or review comments:

```bash
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper --dry-run
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper
cd ~/papers/imported-paper
gpd next
```

Import preserves source material under `original/`, writes `.paper/IMPORT.md`,
creates setup artifacts, and leaves research, outline, fact-check, and review
as separate stages.

Run `/gpd-grill` before `/gpd-brief` after import. Imported drafts often look
more finished than they really are.

## Reader Feedback

When you or another model reviews the paper, capture that read before revising:

```text
/gpd-review
```

Feedback goes into `READER-FEEDBACK.md`. Handling goes into
`FEEDBACK-PLAN.md`. Revision should happen only after the handling plan is
approved.

## Paper Types

During `/gpd-brief`, GPD classifies the paper as one of:

- `decision_memo`
- `strategy_paper`
- `explainer`
- `update`

It also records channel, risk, complexity, and audience shape so the workflow
can scale rigor without creating separate systems for every writing format.

## When You Get Stuck

From the paper directory:

```bash
gpd next
gpd status
gpd validate
gpd validate --semantic
```

Inside Claude or Codex:

```text
/gpd-status
```

Use `gpd next` for the compact answer. Use `gpd status` when you want the full
artifact list. Use `gpd validate --semantic` before treating a paper as
example-quality, publication-ready, or ready for handoff.
