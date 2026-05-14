# Start Here

Get Paper Done turns serious AI-assisted writing into a staged paper workflow.

Instead of one long chat, each paper becomes a folder with durable files for author voice, audience, brief, strategy, research, outline, draft, fact-checking, review, feedback, and state. The files let you clear context, switch between Claude and Codex, revise safely, and see exactly what should happen next.

## What It Is For

Use GPD when the writing has a real job:

- get a decision
- explain a complex topic
- set strategy or architecture direction
- publish a public technical argument
- recover a messy existing draft
- make evidence, audience, and revision decisions explicit

It is usually too heavy for quick emails, casual summaries, short chat replies, or writing where a single prompt is enough.

## Quick Win: See A Finished Paper

Before creating your own workspace, look at a completed output:

- [examples/data-products-ai-scaling/.paper/exports/FINAL.md](../examples/data-products-ai-scaling/.paper/exports/FINAL.md) shows a full internal strategy-paper flow.
- [examples/public-ai-control-baseline/.paper/exports/FINAL.md](../examples/public-ai-control-baseline/.paper/exports/FINAL.md) shows a compact public-source decision memo.

These are workflow outputs, not marketing samples. The surrounding `.paper/` folders show the brief, research, outline, fact-check, review, state, and export artifacts that produced the final paper.

## The Mental Model

There are three moving parts:

| Part | What it does |
|------|--------------|
| `gpd` CLI | Installs runtime assets, creates/imports paper workspaces, checks status, validates artifacts, and exports final Markdown. |
| Slash commands | Run the actual AI writing workflow inside Claude or Codex. Examples: `/gpd-brief`, `/gpd-research`, `/gpd-outline`, `/gpd-draft`. |
| `.paper/` folder | Stores durable paper memory: persona, audience, brief, strategy, research, outline, draft, review, fact-check, feedback, and state. |

The normal flow is:

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

You do not need to memorize every artifact. Run `gpd status` in the paper folder, or `/gpd-progress` inside Claude or Codex, when you are unsure what to do next.

During `/gpd-brief`, GPD will classify the paper's purpose as `decision_memo`, `strategy_paper`, `explainer`, or `update`. It also records channel, risk, complexity, and audience shape so later stages know how much rigor the paper needs.

## Install Once

From the local GPD checkout:

```bash
cd /path/to/get-paper-done
npm link
```

`npm link` puts the local `gpd` CLI on your shell `PATH`. It is required once for this private/local repo setup.

Install runtime assets for both Claude Code and Codex:

```bash
gpd install claude
gpd install codex
gpd doctor claude
gpd doctor codex
```

Restart Claude Code and Codex after installing so the slash commands are available.

## Create Your First Paper

Use the CLI when you want deterministic setup:

```bash
gpd init --location ~/papers --slug my-first-paper --title "My First Paper"
cd ~/papers/my-first-paper
gpd status
```

Then open Claude or Codex in that paper directory.

Run:

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

Use `/gpd-persona` and `/gpd-audience` on a first paper so GPD captures author voice, authority posture, reader priority, objections, and proof standard before strategy work.

You can also start from the AI runtime:

```text
/gpd-new-paper
```

Use `/gpd-new-paper` when you want the AI runtime to ask setup questions interactively.

## Persona And Audience

GPD separates author voice from reader needs.

`PERSONA.md` is the paper-specific author profile. It should capture how the paper should sound and argue:

- role or authority posture
- voice
- tone boundaries
- default argument style
- things to avoid

`AUDIENCE.md` is the paper-specific reader model. It should capture:

- primary reader
- secondary readers, if needed
- what they care about
- what they will challenge
- what proof standard they expect

Use these commands when the defaults are not enough:

```text
/gpd-persona
/gpd-audience
/gpd-curate-audience
```

Start with one primary audience. Add secondary audiences only when the paper truly needs them.

## Reader Feedback

When a person or another model reviews the paper, capture that read in `READER-FEEDBACK.md` before revising. GPD uses five signals:

- voice
- register
- audience fit
- evidence
- ask clarity

Feedback then moves through `FEEDBACK-PLAN.md`, where each item is marked incorporate, ignore, defer, or ask user before `/gpd-revise` changes the draft.

## When You Get Stuck

From the paper directory:

```bash
gpd status
gpd validate
gpd validate --semantic
```

Inside Claude or Codex:

```text
/gpd-progress
```

Moving backward is normal. If you change the brief after research, or research after outlining, GPD routes you back to the earliest stage that needs refresh. That is an incremental repair, not a full reset.

## Import Existing Work

If you already have drafts, notes, sources, or review comments, import them instead of starting clean:

```bash
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper --dry-run
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper
cd ~/papers/imported-paper
gpd status
```

Import is preservation-first. GPD copies source material into `original/`, writes `.paper/IMPORT.md`, creates minimal setup artifacts, and leaves research, outline, fact-check, and review as separate stages.

If the selected canonical draft is Markdown, plain text, or `.docx`, CLI import writes `.paper/DRAFT.md` from it. `.docx` import extracts plain paragraph text only and keeps the original file unchanged under `original/`.

If the imported draft is publication-sensitive and contains material factual, current, technical, market, regulatory, numerical, or citation-dependent claims, run:

```text
/gpd-fact-check --risk-scan
```

before external review or export.
