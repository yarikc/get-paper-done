# Get Paper Done

Get Paper Done is a file-based AI workflow for serious papers.

It is for decision memos, strategy papers, explainers, architecture papers, white papers, executive updates, and public technical writing where audience, evidence, argument quality, and revision discipline matter.

Most AI writing workflows draft too early. They produce polished paragraphs before the paper has a clear job, reader, thesis, proof standard, or decision ask. GPD slows the workflow down in the right places: brief, strategy gate, research, outline, draft, fact-check, review, feedback, revise, export.

The point is not more process. The point is fewer weak drafts, less generic AI prose, and a paper folder that remembers what was decided even after chat context is gone.

New here? Read [docs/START-HERE.md](docs/START-HERE.md), then run `gpd next` or `/gpd-progress` whenever you are unsure what to do.

## Why Use It

- **Better papers, not just faster prose.** GPD forces clarity on purpose, audience, thesis, evidence, objections, and ask before polishing language.
- **Durable context.** Research, feedback, state, and revision decisions live in files, so the workflow survives context resets and model switches.
- **Quality gates.** Strategy, research, fact-check, review, and export gates prevent weak papers from quietly moving forward.
- **Controlled feedback.** Human or model feedback is captured and planned before revision changes the draft.
- **Real revision.** If review shows the paper needs more research, a better outline, or a clearer ask, GPD routes backward instead of pretending revision is line editing.

## Best Fit

Use GPD when the writing has real stakes:

- a decision needs approval
- a strategy or architecture direction needs to be argued
- a complex topic needs to be explained clearly
- a public or executive-facing paper needs evidence discipline
- an existing draft needs recovery, source mapping, or audience repair

Do not use it for quick emails, casual summaries, chat replies, or writing where one prompt is enough.

## Quick Preview

Before creating your own paper, inspect finished outputs:

- [examples/data-products-ai-scaling/.paper/exports/FINAL.md](examples/data-products-ai-scaling/.paper/exports/FINAL.md) shows a full internal strategy-paper flow.
- [examples/public-ai-control-baseline/.paper/exports/FINAL.md](examples/public-ai-control-baseline/.paper/exports/FINAL.md) shows a compact public-source decision memo.
- [examples/software-supply-chain-evidence-pack/.paper/exports/FINAL.md](examples/software-supply-chain-evidence-pack/.paper/exports/FINAL.md) shows the feedback-loop showcase: reader feedback, feedback plan, backward routing, fact-checking, review, and export.

The surrounding `.paper/` folders show the artifacts that produced each final paper.

## Install

Because this is currently a local/private repo, link the CLI once so `gpd` is available on your shell `PATH`:

```bash
cd /path/to/get-paper-done
npm link
```

Install GPD into both supported AI runtimes:

```bash
gpd install claude
gpd install codex
gpd doctor claude
gpd doctor codex
```

Restart Claude Code and Codex after installing so they pick up the slash commands.

`npm link` only exposes the local CLI. `gpd install claude` and `gpd install codex` copy slash commands, workflows, agents, templates, references, profiles, and audiences into the runtime directories.

## First Paper

Create a paper workspace:

```bash
gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
cd ~/papers/metadata-strategy
gpd next
```

Then open Claude or Codex in that paper directory and run the command GPD recommends.

For a first clean paper, the path usually looks like this:

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

You do not need to memorize the path. Use:

```bash
gpd next
```

or, inside Claude/Codex:

```text
/gpd-progress
```

Both are read-only. They tell you the current state, blocker, next command, and why.

## CLI Vs Slash Commands

GPD has two command layers:

| Layer | Examples | Use it for |
|-------|----------|------------|
| CLI | `gpd install`, `gpd init`, `gpd import`, `gpd next`, `gpd status`, `gpd validate`, `gpd export` | Filesystem-safe setup, import/export, status, validation, release checks. |
| Slash commands | `/gpd-brief`, `/gpd-research`, `/gpd-outline`, `/gpd-draft`, `/gpd-review` | The AI-assisted writing workflow inside Claude or Codex. |

Use the CLI for setup and inspection. Use slash commands for strategy, research, outlining, drafting, review, and revision.

## Workflow

Normal flow:

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

Each stage reads existing `.paper/` artifacts, writes its own artifact, and updates state.

Moving backward is normal. If you change the brief after research, or research after outlining, GPD routes you back to the earliest stage that needs refresh. That is an incremental repair, not a full reset.

For the full state and gate model, see [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md).

## Paper Types

During `/gpd-brief`, each paper gets a normalized classification:

- `decision_memo`
- `strategy_paper`
- `explainer`
- `update`

GPD also records channel, risk, complexity, and audience shape. This lets the workflow scale rigor without inventing separate systems for memos, articles, white papers, and updates.

## Import Existing Work

Use import when a paper already exists outside GPD:

```bash
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper --dry-run
gpd import --source ~/drafts/current-paper --location ~/papers --slug imported-paper
cd ~/papers/imported-paper
gpd next
```

Import is preservation-first. It copies source material into `original/`, writes `.paper/IMPORT.md`, creates minimal setup artifacts, and leaves research, outline, fact-check, and review as separate stages.

If the selected canonical draft is Markdown, plain text, or `.docx`, CLI import writes `.paper/DRAFT.md` from it. `.docx` extraction is plain paragraph text only; the original file remains unchanged under `original/`.

## Reader And External Feedback

Reader feedback is captured in `.paper/READER-FEEDBACK.md` before it becomes revision work. Feedback then moves through `.paper/FEEDBACK-PLAN.md`, where each item is marked incorporate, ignore, defer, or ask user before `/gpd-revise` changes the draft.

For deterministic CLI collection:

```bash
gpd review-external --paper ~/papers/metadata-strategy --review-file claude=/tmp/claude-review.md
gpd review-external --paper ~/papers/metadata-strategy --models claude,codex,opencode
```

Claude, Codex, and opencode have been calibrated on synthetic public papers. Gemini has argument-shape coverage but requires local Gemini authentication before real capture.

## Common CLI Commands

```bash
gpd next --paper ~/papers/metadata-strategy
gpd status --paper ~/papers/metadata-strategy
gpd validate --paper ~/papers/metadata-strategy
gpd validate --semantic --paper ~/papers/metadata-strategy
gpd export --paper ~/papers/metadata-strategy
gpd update claude
gpd update codex
```

Use `gpd next` for the compact answer. Use `gpd status` when you want full artifact presence. Use `gpd validate --semantic` before treating a paper as example-quality, publication-ready, or ready for long-term handoff.

## Documentation

| Doc | What it is for |
|-----|----------------|
| [docs/START-HERE.md](docs/START-HERE.md) | First-paper walkthrough. |
| [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md) | Full workflow model, state gates, and design contract. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Package/runtime/workspace architecture. |
| [docs/RELEASE.md](docs/RELEASE.md) | Private-repo release and update policy. |
| [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md) | Current strengths, risks, and gaps. |
| [ROADMAP.md](ROADMAP.md) | Forward plan and active issue alignment. |
| [references/artifact-contracts.md](references/artifact-contracts.md) | Artifact contracts used by validation. |

## Package Boundary

The npm package is an installable framework bundle, not a dump of every repo file. It includes the CLI, commands, workflows, agents, templates, references, curated audiences/profiles, docs, and examples.

It intentionally excludes tests, RFC design drafts, ignored feedback files, local scratch files, and private paper/profile material. `npm run release:check` verifies the package boundary before release-style handoff.
