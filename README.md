# Get Paper Done

A file-based AI workflow for serious papers.

GPD is for decision memos, strategy papers, explainers, architecture papers,
white papers, executive updates, and public technical writing where the paper
has to convince a real reader.

Most AI writing workflows draft too early. They produce fluent paragraphs before
the paper has a clear job, reader, thesis, proof standard, evidence plan, or
decision ask. GPD fixes that by turning each paper into a small workflow with
durable files, gates, and review loops.

What you see: a few commands and a `.paper/` folder.

What the system protects: author intent, audience fit, evidence, argument
structure, fact-checking, feedback, and revision state.

New here? Read [docs/START-HERE.md](docs/START-HERE.md). After that, you do
not need to memorize the workflow. Run `gpd next` or `/gpd-status`; GPD tells
you the next command and what you should review.

## Why Use It

Use GPD when a paper needs to be better than "good AI prose."

It helps when:

- a decision needs approval
- a strategy or architecture direction needs to be argued
- a complex topic needs to be explained clearly
- a public or executive-facing paper needs evidence discipline
- an existing draft needs recovery, source mapping, or audience repair

Do not use it for quick emails, casual summaries, chat replies, or anything
where one prompt is enough.

## See The Output

Before creating your own paper, inspect finished examples:

- [data-products-ai-scaling FINAL.md](examples/data-products-ai-scaling/.paper/exports/FINAL.md) shows a full internal strategy-paper flow.
- [public-ai-control-baseline FINAL.md](examples/public-ai-control-baseline/.paper/exports/FINAL.md) shows a compact public-source decision memo.
- [software-supply-chain-evidence-pack FINAL.md](examples/software-supply-chain-evidence-pack/.paper/exports/FINAL.md) shows reader feedback, feedback planning, backward routing, fact-checking, review, and export.

The surrounding `.paper/` folders show how each paper was built. For the grill
step specifically, see the supply-chain example's
[PAPER-CONTEXT.md](examples/software-supply-chain-evidence-pack/.paper/PAPER-CONTEXT.md)
and
[DECISIONS.md](examples/software-supply-chain-evidence-pack/.paper/DECISIONS.md).

## Install

This repo is currently meant to be used from a local/private checkout.

Link the CLI once:

```bash
cd /path/to/get-paper-done
npm link
```

Install the runtime files:

```bash
gpd install claude
gpd install codex
gpd doctor claude
gpd doctor codex
```

Restart Claude Code and Codex after install.

`npm link` puts the local `gpd` command on your shell `PATH`. `gpd install ...`
copies the slash commands, workflows, agents, templates, references, contexts,
profiles, and audiences into the AI runtime.

## Create A Paper

Use the CLI for deterministic setup:

```bash
gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
cd ~/papers/metadata-strategy
gpd next
```

Then open Claude or Codex in that paper directory and run the command GPD
recommends.

You can also create the paper interactively from the AI runtime:

```text
/gpd-new
```

`gpd init` is deterministic terminal setup. `/gpd-new` is interactive setup
inside Claude or Codex. Both create the same kind of paper workspace.

## How It Works

You do not need to remember every command. The operating rule is:

```bash
gpd next
```

or inside Claude/Codex:

```text
/gpd-status
```

Run the recommended command, then ask for status again.

The underlying loop is:

```text
clarify -> support -> shape -> draft -> check -> revise -> export
```

Each command writes durable files under `.paper/`. Each later command reads
those files instead of relying on chat memory.

### 1. Clarify

```text
/gpd-persona
/gpd-audience
/gpd-grill
/gpd-brief
```

Persona captures how the author sounds and argues. Audience captures who the
paper must satisfy and what they will challenge.

Grill is the interrogation step. It asks one question at a time until the paper
has a clear job, reader, thesis, terms, scope, proof standard, counterargument,
and non-goals. It writes `PAPER-CONTEXT.md` and `DECISIONS.md`.

Brief turns those decisions into the formal paper contract. It also produces
the strategy gate in `STRATEGY.md`. If the strategy gate is not `Go`, the paper
routes back before research or drafting.

### 2. Support

```text
/gpd-research
```

Research builds the source plan, evidence matrix, source registry,
counterevidence, and claim support. Weak claims are marked to soften or drop.

### 3. Shape

```text
/gpd-outline
```

Outline designs the reader journey, argument flow, evidence placement, and
objection handling before drafting starts.

### 4. Draft

```text
/gpd-draft --next-section
```

Draft writes controlled sections from the approved brief, research, and
outline. `--next-section` is the safe default for serious papers.

### 5. Check

```text
/gpd-fact-check --full
/gpd-review
```

Fact-check tests material claims for support, exaggeration, stale claims,
contradiction, and citation risk.

Review tests audience fit, ask clarity, evidence, objections, structure, and
decision usefulness. Fixable below-target issues route to revision before
export; human or model feedback is captured before revision work starts.

### 6. Revise And Export

```text
/gpd-revise
/gpd-export
```

Revise applies approved fixes from review, fact-check, or feedback planning. It
is not an open-ended rewrite step. If the revision changes the argument,
evidence, structure, ask, audience handling, persona, or voice, GPD requires a
snapshot plus `REVISION-CHECK.md` before export so fixes do not quietly make
the paper worse. Snapshots include the paper artifacts, source notes, external
review captures, imported originals, and hash metadata for integrity checks.
The benefit is practical: before a risky revision starts, GPD preserves the
known-good paper state, prints the restore command, and keeps rollback separate
from the quality review. If the new draft regresses, you can recover the prior
tracked files instead of reconstructing them from memory or chat history.

Export produces the final Markdown handoff in `.paper/exports/FINAL.md`. If
that file already exists, `gpd export` requires a current `REVISION-CHECK.md`
when the draft is newer than the export, then preserves the old copy under
`.paper/versions/` before overwriting it.

### Reviewing The Final Paper

When GPD exports a paper, read:

```text
.paper/exports/FINAL.md
```

To see the exact review target:

```bash
gpd review-pack --paper ~/papers/metadata-strategy
```

If you add inline comments there, capture them with:

```bash
gpd feedback collect --paper ~/papers/metadata-strategy
```

Then approve the feedback handling in Claude/Codex:

```text
/gpd-feedback
```

GPD captures comments into `FEEDBACK-READER.md`, creates a pending
`FEEDBACK-PLAN.md` with default recommendations, and waits for approval before
revision. In Claude/Codex, use `/gpd-feedback` to walk through one concern at a
time and record `approve`, `modify`, `defer`, `reject`, or
`answered_no_action` decisions. Approved
changes are applied to `.paper/DRAFT.md`; export regenerates `FINAL.md` and
snapshots the prior export first. You review the final paper; GPD keeps the
draft as the editable source of truth.

Use visible comment markers while reading:

```md
//todo: requested action
//keep: preserve this wording, argument, voice, or specificity
//qq: question or uncertainty
//no: reject or disagree with this claim/framing
```

Severity suffixes are supported: `//todo!:` for high severity and `//todo?:`
for low severity. `gpd feedback collect` leaves comments in place by default;
run `gpd feedback clean` only after confirming the extracted feedback is
complete.

For external model review, `gpd review-external` sends the reviewer the paper
state, classification, grill context, decisions, brief, research, outline,
draft, fact-check, review, prior feedback, and export when present. It writes
each raw reviewer capture to `.paper/feedback-external/`, writes the active
combined review to `FEEDBACK-EXTERNAL.md`, and breaks deduplicated
HIGH/MEDIUM/LOW concerns into a concern-first `FEEDBACK-PLAN.md` decision queue.
When you ask for multiple reviewers in one command, GPD prints the pending
concern list when the command finishes.

Each run also writes `.paper/EXTERNAL-REVIEW-RUN.json`. That file records the
review target, context artifacts sent, requested providers, current-runtime
skip setting, timeout, isolated working-directory policy, safe provider
command/argument shape, reviewer status, and raw feedback paths. GPD does not
pretend provider aliases are exact model versions. It records the requested
model alias or pin, any requested effort, and the resolved model only when the
provider reports it. Defaults favor the best current reviewer available to the
user: Claude uses `claude -p --model opus --effort xhigh`; Gemini uses `gemini
-p "" -m pro --output-format json --approval-mode plan --skip-trust` and parses
JSON model stats when present. Per-paper `config.json` can override Claude and
Gemini model selection when reproducibility matters; Claude also supports an
effort override. Other providers stay on their calibrated CLI defaults because
GPD does not yet control their model flags. Provider CLIs run from an isolated
temporary directory and are explicitly instructed to return the full review on
stdout, so accidental reviewer-created files do not land in the paper or repo.

Provider CLIs run with a timeout. If a reviewer hangs, GPD records the timeout
as a review issue, requests cleanup for the provider process tree, and still
writes the feedback artifacts for the providers that completed. If the command
is interrupted, GPD also attempts to clean up active provider processes before
exiting.

## Moving Backward Is Normal

If review finds that the ask is weak, the answer may not be another draft pass.
GPD may route back to `/gpd-brief` because the paper contract changed. If the
new brief needs different evidence, GPD routes to `/gpd-research`, then
`/gpd-outline`, then drafting resumes.

That is the point. The workflow repairs the earliest stale artifact instead of
polishing a draft built on the wrong contract.

## Import Existing Work

Use import when a paper already exists outside GPD:

```bash
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper --dry-run
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper
cd ~/papers/imported-paper
gpd next
```

Import is preservation-first. It copies source material into `original/`, writes
`.paper/IMPORT.md`, creates setup artifacts, and leaves research, outline,
fact-check, and review as separate stages.

Run `/gpd-grill` before `/gpd-brief` after import. This prevents a messy draft
from being compressed into a weak brief before the core thesis and decisions are
clear.

## Commands

Main writing commands:

| Command | What it does |
|---------|--------------|
| `/gpd-new` | Create a new paper workspace interactively |
| `/gpd-import` | Import existing paper material |
| `/gpd-status` | Show current state, blockers, and next command |
| `/gpd-persona` | Capture author voice |
| `/gpd-audience` | Capture reader, objections, and proof standard |
| `/gpd-grill` | Remove ambiguity before briefing |
| `/gpd-brief` | Create the paper contract and strategy gate |
| `/gpd-research` | Build evidence and claim support |
| `/gpd-outline` | Design the argument path |
| `/gpd-draft` | Draft from approved artifacts |
| `/gpd-fact-check` | Check material claims |
| `/gpd-review` | Evaluate audience fit and paper quality |
| `/gpd-revise` | Apply approved fixes |
| `/gpd-export` | Create final Markdown output |

Common CLI commands:

```bash
gpd next
gpd status
gpd validate
gpd validate --semantic
gpd export
gpd revise --trigger .paper/FEEDBACK-PLAN.md
gpd snapshot --reason before_substantive_revision
gpd restore --snapshot REV-20260519T143205123-before-substantive-revision
gpd review-pack
gpd feedback collect
gpd feedback clean
gpd review-external --models claude,codex,gemini --current-runtime codex
gpd update claude
gpd update codex
```

`/gpd-review` evaluates the paper. `gpd feedback collect` captures reader
comments into feedback artifacts for planning and revision.

Use `gpd next` for the compact answer. Use `gpd status` when you want full
artifact presence. Use `gpd validate --semantic` before treating a paper as
example-quality, publication-ready, or ready for long-term handoff.
When invoking external reviewers, exclude the runtime currently helping you.
For example, pass `--current-runtime codex` from Codex or `--current-runtime
claude` from Claude so GPD skips self-review and records the skip.

## Documentation

| Doc | What it is for |
|-----|----------------|
| [docs/START-HERE.md](docs/START-HERE.md) | First-paper walkthrough |
| [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md) | Full workflow model, state gates, and design contract |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Package, runtime, and workspace architecture |
| [docs/RELEASE.md](docs/RELEASE.md) | Private-repo release and update policy |
| [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md) | Current strengths, risks, and gaps |
| [ROADMAP.md](ROADMAP.md) | Forward plan and issue alignment |
| [examples/README.md](examples/README.md) | Example index |

## Package Boundary

The npm package is an installable framework bundle. It includes the CLI,
commands, workflows, agents, templates, references, contexts, profiles,
audiences, docs, and examples.

It excludes tests, RFC drafts, ignored feedback files, scratch files, and
private paper/profile material. `npm run release:check` verifies the boundary.
