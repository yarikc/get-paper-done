# Get Paper Done

A file-based AI writing workflow for newsletters, blog posts, position papers, and white papers.

Current project rating: **8.4/10 overall**. The framework design is strong and the CLI is useful for install, import, status, and validation; the main gap is real-paper calibration. See [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md) for the detailed review and ratings, and [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md) for the design contract.

## Quick Start

Install the CLI locally from this repository:

```bash
npm link
gpd install codex
gpd doctor codex
```

For Claude instead:

```bash
gpd install claude
gpd doctor claude
```

Create a paper workspace:

```bash
gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
gpd status --paper ~/papers/metadata-strategy
```

Then use the installed slash commands in your AI runtime:

```text
/gpd-brief
/gpd-research
/gpd-outline
/gpd-draft
/gpd-fact-check
/gpd-review
/gpd-revise
/gpd-export
```

Import existing work without modifying originals:

```bash
gpd import --source ~/drafts/current-paper --location ~/papers --slug metadata-strategy --dry-run
gpd import --source ~/drafts/current-paper --location ~/papers --slug metadata-strategy
```

This project adapts the useful parts of Get Shit Done's architecture for writing:

- structured project memory
- prompt-based commands
- reusable workflow instructions
- specialized writing support behind simple commands
- paper-scoped persona and audience profiles
- curated reusable audience personas

Each paper is its own project. Initialization asks where to create the paper, creates a dedicated paper directory there, then creates a `.paper/` directory with the author's persona, target audience, brief, config, and current state. Research, outline, draft, fact-check, review, and export artifacts are created only when their stage runs. `STATE.md` is the human-readable state note; `STATE.json` is the machine-readable companion used by CLI status and validation.

## Core Idea

Most AI writing fails because the model treats every draft as a generic writing task. Get Paper Done makes the important context explicit:

- **Who is writing?** Voice, authority posture, tone boundaries, and argument style.
- **Who is reading?** Audience knowledge, incentives, objections, and patience.
- **What is the piece trying to do?** Thesis, belief shift, proof standard, format, and length.

Downstream workflows read those files before producing outlines, drafts, fact-checks, reviews, and revisions.

## Main Commands

The command files live in `commands/gpd/`.

| Command | Purpose |
|---------|---------|
| `/gpd-new-paper` | Ask for location, create a paper directory, then initialize `.paper/` with project, persona, audience, brief, config, and state |
| `/gpd-import-paper` | Import an existing paper, versions, specs, research, and references into a GPD workspace |
| `/gpd-progress` | Show current status, missing artifacts, suggested next command, and context-clearing guidance |
| `/gpd-brief` | Capture thesis, format, claims, constraints, and source needs |
| `/gpd-research` | Infer research questions, present a plan, then build structured evidence artifacts |
| `/gpd-outline` | Create an argument-aware outline; Lite for early/short/import triage, Deep for serious/researched/high-stakes papers |
| `/gpd-draft` | Draft section-by-section from approved context; supports full draft for short pieces and redraft-from-comments for targeted updates |
| `/gpd-review` | Review for thesis, evidence, audience fit, tone, and structure |
| `/gpd-fact-check` | Check material claims for source support, staleness, exaggeration, contradiction, and citation risk |
| `/gpd-review --external` | Ask available external AI CLIs/local models to review, then create a feedback handling plan |
| `/gpd-revise` | Apply approved feedback or run a controlled layered editorial pass with drift checks |
| `/gpd-export` | Prepare final Markdown for publication or handoff |

Short aliases:

| Alias | Same as |
|-------|---------|
| `/gpd-new` | `/gpd-new-paper` |
| `/gpd-import` | `/gpd-import-paper` |
| `/gpd-status` | `/gpd-progress` |

Maintenance commands exist when you need to evolve reusable context:

| Command | Purpose |
|---------|---------|
| `/gpd-persona` | Create or update the paper-specific author/persona profile |
| `/gpd-audience` | Create or update the target audience profile |
| `/gpd-curate-audience` | Create, review, or update reusable curated audience personas |

## Paper Workspace

```text
[location]/[paper-slug]/
  original/
    [preserved imported drafts, specs, research, references, versions, assets]
  .paper/
    IMPORT.md
    PROJECT.md
    PERSONA.md
    AUDIENCE.md
    BRIEF.md
    STRATEGY.md
    STATE.md
    STATE.json
    config.json
    sources/
    exports/

    # Created by later stages when needed:
    RESEARCH.json
    RESEARCH.md
    OUTLINE.md
    DRAFT.md
    REVIEW.md
    FACT-CHECK.md
    EXTERNAL-REVIEWS.md
    FEEDBACK-PLAN.md
```

Reusable author profiles can live in `profiles/`. The starter profile [profiles/yarik.md](profiles/yarik.md) captures Yarik's default writing voice and can be imported into a paper-specific `.paper/PERSONA.md`.

Reusable audience personas live in `audiences/`:

- [audiences/cxo-reader.md](audiences/cxo-reader.md)
- [audiences/distinguished-architect-engineer.md](audiences/distinguished-architect-engineer.md)
- [audiences/business-operating-executive.md](audiences/business-operating-executive.md)
- [audiences/public-technical-reader.md](audiences/public-technical-reader.md)

You can select one or multiple audiences. Existing audience personas are never used blindly: the workflow summarizes them, suggests paper-specific improvements, and asks before writing `.paper/AUDIENCE.md`.

To create or evolve reusable audience personas:

```text
/gpd-curate-audience --new
/gpd-curate-audience --review cxo-reader
/gpd-curate-audience --edit cxo-reader
```

Use `audiences/*.md` for stable reusable reader types. Use `.paper/AUDIENCE.md` for paper-specific adaptations, priority order, and conflict rules.

Audience review supports two modes:

- **Lite:** early outline or brief review. Fast, blunt scoring and top fixes.
- **Deep:** late-stage draft review. Adds reverse outline, objection mapping, and decision-gap analysis.

Audience review uses seven fixed dimensions, each scored on a 1-5 scale:

- Thesis clarity
- Audience relevance
- Evidence sufficiency
- Objection handling
- Jargon appropriateness
- Decision usefulness
- Structural flow

For every score of 3 or below, the review must produce an actionable rewrite instruction.

## Strategy Gate

`paper-strategist` is challenge-first. It checks whether the paper is worth writing in its current form before research, outline, or drafting.

It writes `.paper/STRATEGY.md` with:

- paper job
- reader promise
- thesis package
- argument posture
- decision usefulness
- scope design
- reader questions
- strategy blockers
- strategic gaps
- recommended shape

Readiness statuses:

```text
Go
Revise Before Drafting
No-Go
```

`Revise Before Drafting` and `No-Go` block `/gpd-research`, `/gpd-outline`, and `/gpd-draft` unless you explicitly override.

Blocked strategy reviews also include a normalized blocker schema:

```text
Blocking issues: scope_too_broad, thesis_weak, audience_unclear, audience_conflict, evidence_gap, weak_ask, poor_posture, missing_outcome, reader_promise_weak, decision_usefulness_weak
Primary blocker: one blocker to fix first
Block severity: None, Medium, or High
Required unblock action: brief_revision, audience_revision, thesis_revision, scope_narrowing, research_plan, or user_override
```

## Research

Research is the evidence-for/evidence-against checkpoint. It happens after the brief and before outline or drafting.

`/gpd-research` defaults to `--standard`. It first infers research questions from `.paper/BRIEF.md`, maps them to claims, and presents a research plan before collecting sources. You can approve, edit, or narrow the plan.

Depth options:

```text
/gpd-research --rapid
/gpd-research --standard
/gpd-research --deep
```

If imported or user-provided material exists, GPD asks how to use it:

```text
--provided-first   verify, improve, and convert provided material first, then use web for gaps
--provided-only    use provided material only
--web-first        start from web research, then reconcile with provided material
--web-only         ignore provided material
```

The canonical research artifact is `.paper/RESEARCH.json`. `.paper/RESEARCH.md` is a short human-readable index. Downstream outline, draft, fact-checking, and review stages read `RESEARCH.json` first and avoid raw source dumps unless verifying a specific source.

## Outline

`/gpd-outline` keeps both depth modes:

- **Lite:** fast structure pass for early shaping, short pieces under about 1,200 words, or first-pass triage of messy imported drafts.
- **Deep:** default for serious papers, especially when `RESEARCH.json` or `.paper/STRATEGY.md` exists, the piece is executive-facing, technical, multi-audience, publishable, about 1,200 words or longer, or high-stakes.

Deep adds structure-selection scoring, draft-readiness scoring, reader jump analysis, evidence/objection load checks, and severity-scored structural anti-patterns. Lite keeps the outline lighter for speed and context control.

## Suggested Flow

1. Run `/gpd-new-paper` or `/gpd-new-paper --profile yarik`.
2. Answer persona and audience questions.
3. Create the brief.
4. Run the strategy gate. If `STRATEGY.md` says `Revise Before Drafting` or `No-Go`, revise the brief or explicitly override before research, outline, or drafting.
5. Research the claims. This infers research questions, asks you to approve the plan, then writes `RESEARCH.json` and a short `RESEARCH.md` index.
6. Generate an outline.
7. Draft section-by-section by default. Use `/gpd-draft --next-section`, `/gpd-draft --section "<name>"`, `/gpd-draft --full` for short pieces, or `/gpd-draft --redraft-from-comments` for targeted comment-driven updates.
8. Run `/gpd-fact-check --full` when the draft contains factual, current, technical, market, regulatory, numerical, or publication-sensitive claims.
9. Review. Use `/gpd-review --external` when you want installed external models such as Claude, Gemini, Codex, OpenCode, Qwen, Cursor, or local model servers to provide independent feedback.
10. Revise.
11. Export.

External review never edits the draft directly. It writes `.paper/EXTERNAL-REVIEWS.md` and `.paper/FEEDBACK-PLAN.md`, then asks how to proceed. Revision only applies feedback after you approve the proposed handling.

## CLI Versus Slash Commands

GPD has two layers:

- `gpd ...` CLI commands install assets, create/import paper workspaces, report status, and validate workspace health.
- `/gpd-...` slash commands run the writing workflow inside Claude or Codex after installation.

Use the CLI for filesystem-safe setup. Use slash commands for strategy, research, outlining, drafting, review, and revision.

## Import Existing Work

Use import when a paper already exists outside the framework:

```text
/gpd-import-paper --source "/path/to/current-paper-or-folder" --location ~/papers --slug lifecycle-framework --profile yarik
```

The import workflow creates a new paper directory, copies the original material into `original/`, then creates only minimal `.paper/` artifacts: import report, project, persona, audience, brief, draft, config, and state. Source folders can contain research, references, specs, notes, versions, reviews, PDFs, diagrams, or other supporting files. Import preserves the original material unchanged and presents a small post-import menu.

Import intentionally does not generate `RESEARCH.json`, `RESEARCH.md`, `OUTLINE.md`, `FACT-CHECK.md`, or `REVIEW.md` by default. It does create a lightweight `STRATEGY.md` gate from imported context so research, outline, and drafting do not bypass strategy. Research, outline, fact-check, and review remain separate stages so you can clear context between them.

After import, GPD presents a small post-import menu:

```text
1. /gpd-research
2. /gpd-outline --lite
3. /gpd-review --external
```

Use `/gpd-outline --deep` instead of Lite when the imported paper is serious, researched, high-stakes, or about 1,200+ words.

If the imported draft is already publication-sensitive and contains material factual claims, run `/gpd-fact-check --risk-scan` before external review or export.

If thesis, audience, or paper type is unclear, it recommends `/gpd-brief` first.

For quick starts:

```text
/gpd-new-paper --fast --profile yarik
```

Fast mode captures audience, problem, thesis, three claims, best evidence, counterargument, recommendation, tone notes, avoid list, and draft length.

## Install Locally

GPD includes a small CLI for installing/updating prompt assets and doing safe paper workspace file operations.

```bash
npm link
gpd install claude
gpd install codex
```

Install copies commands, workflows, agents, audiences, profiles, templates, and references. Source command files use the neutral `@{{GPD_RUNTIME_ROOT}}` placeholder. During install, command files are rewritten for the target runtime, so a Codex install points at `~/.codex/get-paper-done/` and a Claude install points at `~/.claude/get-paper-done/`.

Useful install commands:

```bash
gpd install claude --dry-run
gpd install codex --dry-run
gpd doctor claude
gpd doctor codex
gpd version
```

Paper workspace helpers:

```bash
gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
gpd import --source ~/drafts/current-paper --location ~/papers --slug metadata-strategy
gpd import --source ~/drafts/current-paper --location ~/papers --slug metadata-strategy --dry-run
gpd status --paper ~/papers/metadata-strategy
gpd validate --paper ~/papers/metadata-strategy
gpd list-audiences
gpd list-profiles
```

`gpd init` creates a paper directory with `.paper/` setup artifacts and a blocking strategy placeholder so `/gpd-brief` remains the next step. `gpd import` preserves source material under `original/`, writes `.paper/IMPORT.md`, creates minimal setup artifacts, and does not generate research, outline, fact-check, or review artifacts.

The legacy installer still works:

```bash
node bin/install.js --target ~/.claude
```

## Update Installed Runtimes

After pulling a new release or updating the npm package, refresh installed assets:

```bash
gpd update claude
gpd update codex
```

Update rewrites framework-owned files from the current package, writes `get-paper-done/INSTALL-MANIFEST.json`, and backs up changed installed files under `get-paper-done/.backups/`. It does not touch paper workspaces, and custom audience/profile files with names not shipped by GPD are left in place.
