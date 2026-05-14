# Start Here

Get Paper Done turns serious AI-assisted writing into a staged paper workflow.

Instead of one long chat, each paper becomes a folder with durable files for author voice, audience, brief, strategy, research, outline, draft, fact-checking, review, feedback, and state. You can clear context, switch between Claude and Codex, and still know what should happen next.

## First, See The Output

Before creating your own workspace, look at a finished paper:

- [data-products-ai-scaling FINAL.md](../examples/data-products-ai-scaling/.paper/exports/FINAL.md) shows a full internal strategy-paper flow.
- [public-ai-control-baseline FINAL.md](../examples/public-ai-control-baseline/.paper/exports/FINAL.md) shows a compact public-source decision memo.
- [software-supply-chain-evidence-pack FINAL.md](../examples/software-supply-chain-evidence-pack/.paper/exports/FINAL.md) shows reader feedback, feedback planning, backward routing, fact-checking, and export.

These are workflow outputs, not marketing samples. The surrounding `.paper/` folders show the artifacts behind each paper.

## What You Need To Know

There are only three moving parts:

| Part | What it does |
|------|--------------|
| `gpd` CLI | Installs GPD, creates/imports workspaces, shows the next action, validates, and exports. |
| Slash commands | Run the writing workflow inside Claude or Codex. |
| `.paper/` folder | Stores the paper memory and state. |

When unsure, run:

```bash
gpd next
```

or inside Claude/Codex:

```text
/gpd-progress
```

Both are read-only. They tell you the next command and why.

## Install Once

From the local GPD checkout:

```bash
cd /path/to/get-paper-done
npm link
```

Install into both AI runtimes:

```bash
gpd install claude
gpd install codex
gpd doctor claude
gpd doctor codex
```

Restart Claude Code and Codex after installing.

`npm link` puts the local `gpd` CLI on your shell `PATH`. `gpd install ...` copies the slash commands and workflow files into Claude/Codex.

## Create A Paper

Use the CLI for deterministic setup:

```bash
gpd init --location ~/papers --slug my-first-paper --title "My First Paper"
cd ~/papers/my-first-paper
gpd next
```

Then open Claude or Codex in that paper directory and run the command GPD recommends.

For a first clean paper, the usual path is:

```text
/gpd-persona
/gpd-audience
/gpd-brief
/gpd-research
/gpd-outline
/gpd-draft --next-section
/gpd-fact-check --full
/gpd-review
/gpd-revise
/gpd-export
```

You can also create the paper interactively from the AI runtime:

```text
/gpd-new-paper
```

## The Workflow In One Screen

```text
create or import
  -> brief
  -> strategy gate
  -> research
  -> outline
  -> draft
  -> fact-check
  -> review
  -> revise
  -> export
```

During `/gpd-brief`, GPD classifies the paper as `decision_memo`, `strategy_paper`, `explainer`, or `update`. It also records channel, risk, complexity, and audience shape so later stages know how much rigor the paper needs.

Moving backward is normal. If you change the brief after research, or research after outlining, GPD routes you back to the earliest stage that needs refresh. That is an incremental repair, not a full reset.

## Author Voice And Audience

Use these on a first paper:

```text
/gpd-persona
/gpd-audience
```

`PERSONA.md` captures how the paper should sound and argue. `AUDIENCE.md` captures who the paper must satisfy, what they care about, what they will challenge, and what proof standard they expect.

Start with one primary audience. Add secondary audiences only when the paper truly needs them.

## Reader Feedback

When a person or another model reviews the paper, capture that read before revising:

```text
/gpd-review
```

GPD records feedback in `READER-FEEDBACK.md` and plans handling in `FEEDBACK-PLAN.md`. Revision should happen only after the handling plan is approved.

## Import Existing Work

If you already have drafts, notes, sources, or review comments:

```bash
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper --dry-run
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper
cd ~/papers/imported-paper
gpd next
```

Import is preservation-first. GPD copies source material into `original/`, writes `.paper/IMPORT.md`, creates minimal setup artifacts, and leaves research, outline, fact-check, and review as separate stages.

If the imported draft is publication-sensitive and contains factual, current, technical, market, regulatory, numerical, or citation-dependent claims, run:

```text
/gpd-fact-check --risk-scan
```

before external review or export.

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
/gpd-progress
```

Use `gpd next` for the compact answer. Use `gpd status` when you want the full artifact list. Use `gpd validate --semantic` before treating a paper as example-quality, publication-ready, or ready for long-term handoff.
