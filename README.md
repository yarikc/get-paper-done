# Get Paper Done

Get Paper Done is a file-based AI workflow for serious papers.

It is for writing that needs more than fluent prose: decision memos, strategy papers, explainers, architecture papers, white papers, executive updates, and public technical writing where audience, evidence, argument quality, and revision discipline matter.

Most AI writing workflows draft too early. They produce polished paragraphs before the paper has a clear job, reader, thesis, proof standard, or decision ask. GPD fixes that by turning each paper into a small durable project with explicit artifacts for author voice, audience, brief, strategy, research, outline, draft, fact-checking, review, feedback, and state.

The result is not just faster writing. It is a workflow that can stop weak ideas before drafting, preserve context across sessions and models, route backward when evidence changes, and make revision concrete.

New here? Start with [docs/START-HERE.md](docs/START-HERE.md). See [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md) for the design contract and [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md) for the current project review.

## Why Use It

- **Better papers, not just faster prose.** GPD forces clarity on purpose, audience, thesis, evidence, objections, and ask before polishing language.
- **Less generic AI writing.** Author voice and audience expectations are explicit artifacts, not assumptions buried in chat history.
- **Durable context.** Research, feedback, state, and revision decisions live in files, so the workflow survives context resets and model switches.
- **Quality gates.** Strategy, research, fact-check, review, and export gates prevent weak papers from quietly moving forward.
- **Controlled feedback.** Human or model feedback is captured in `READER-FEEDBACK.md` and planned in `FEEDBACK-PLAN.md` before revision changes the draft.
- **Real revision.** If review shows the paper needs more research, a better outline, or a clearer ask, GPD routes backward instead of treating revision as line editing.

## Best Fit

Use GPD for:

- decision memos
- strategy papers
- explainers
- architecture papers
- white papers
- executive updates
- public technical writing
- imported drafts that need recovery, evidence, or audience repair

It is not meant for quick emails, casual chat replies, one-off summaries, or writing where a lightweight prompt is enough.

## Quick Start

Because this is currently a local/private repo, link the CLI once so `gpd` is available on your shell `PATH`:

```bash
cd /path/to/get-paper-done
npm link
```

Install runtime assets for both Claude Code and Codex:

```bash
gpd install claude
gpd install codex
gpd doctor claude
gpd doctor codex
```

Restart Claude Code and Codex after installing so they pick up the slash commands.

Create a paper workspace:

```bash
gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
cd ~/papers/metadata-strategy
gpd status
```

Then open Claude or Codex in that paper directory and run:

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

`/gpd-persona` and `/gpd-audience` make author voice and reader expectations explicit before strategy work. `/gpd-brief` then confirms the paper classification: `decision_memo`, `strategy_paper`, `explainer`, or `update`, plus channel, risk, complexity, and audience shape.

`npm link` is not runtime-specific. It links the CLI once. After that, `gpd install claude` copies slash commands and workflow assets into `~/.claude`, and `gpd install codex` copies them into `~/.codex`.

Use `gpd init` when you want deterministic CLI setup. Use `/gpd-new-paper` when you want the AI runtime to ask setup questions interactively.

## How It Works

GPD has two command layers:

| Layer | Examples | What it is for |
|-------|----------|----------------|
| CLI commands | `gpd install`, `gpd init`, `gpd import`, `gpd export`, `gpd status`, `gpd validate` | Local setup, installing runtime assets, creating/importing/exporting paper folders, and validating state. |
| Slash commands | `/gpd-brief`, `/gpd-research`, `/gpd-outline`, `/gpd-draft` | The actual AI writing workflow inside Claude or Codex. |

Use the CLI for filesystem-safe setup. Use slash commands for strategy, research, outlining, drafting, review, and revision.

The normal loop:

```text
create/import paper
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

Each step reads the existing `.paper/` artifacts, writes its own artifact, and updates `.paper/STATE.md` plus `.paper/STATE.json` with the suggested next command.

## Documentation Map

- [docs/START-HERE.md](docs/START-HERE.md): first paper walkthrough and newcomer mental model.
- [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md): durable design contract, workflow model, and architecture.
- [docs/RELEASE.md](docs/RELEASE.md): private-repo release checklist, version policy, update flow, and package boundary.
- [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md): current ratings, risks, and review findings.
- [ROADMAP.md](ROADMAP.md): forward plan and active issue alignment.
- [examples](examples): completed reference paper workspaces.

## State And Gates

The workflow is deliberately stateful. `gpd status` and `/gpd-progress` both inspect the paper folder and tell you what should happen next.

| Stage | Primary command | Writes or updates | Gate / state change |
|-------|-----------------|-------------------|---------------------|
| Setup | `gpd init` or `/gpd-new-paper` | `PROJECT.md`, `PERSONA.md`, `AUDIENCE.md`, `BRIEF.md`, `STRATEGY.md`, `STATE.md`, `STATE.json`, `config.json` | Starts blocked by the strategy placeholder. Captures normalized paper classification in `config.json`. Next command is `/gpd-brief`. |
| Brief | `/gpd-brief` | `BRIEF.md`, `STRATEGY.md`, `STATE.md`, `STATE.json`, sometimes `config.json` | Confirms or corrects classification. Strategy gate returns `Go`, `Revise Before Drafting`, or `No-Go`. Blocking statuses route back to `/gpd-brief`. |
| Research | `/gpd-research` | `RESEARCH.json`, `RESEARCH.md`, state | Requires a non-blocking strategy gate unless explicitly overridden. Next command is usually `/gpd-outline --deep`. |
| Outline | `/gpd-outline` | `OUTLINE.md`, state | Blocks when strategy is blocked. Deep mode checks reader journey, evidence placement, objections, and draft readiness. |
| Draft | `/gpd-draft` | `DRAFT.md`, state | Defaults to section-by-section drafting for serious papers. Routes to next section, fact-check, or review. |
| Fact-check | `/gpd-fact-check` | `FACT-CHECK.md`, state | Flags unsupported, stale, exaggerated, contradicted, or risky claims before review/export. |
| Review | `/gpd-review` | `REVIEW.md`, optionally `READER-FEEDBACK.md`, `EXTERNAL-REVIEWS.md`, and `FEEDBACK-PLAN.md` | Local review uses fixed rubrics. Reader/external feedback is captured and converted into proposed handling before revision. |
| Revise | `/gpd-revise` | `DRAFT.md`, state | Applies approved feedback or a controlled editorial pass. Routes back to fact-check/review when needed. |
| Export | `/gpd-export` or `gpd export` | `.paper/exports/FINAL.md`, state | Final handoff after review and revision state is clean. CLI export requires `REVIEW.md` verdict `Ready` unless `--force` is used. |

`gpd validate` is stricter than `gpd status`. A newly initialized paper can be valid structurally but still report a HIGH issue because the strategy gate intentionally blocks downstream work until `/gpd-brief` confirms the paper direction.

Every paper has normalized classification in `.paper/config.json`:

```json
{
  "classification": {
    "purpose": "decision_memo",
    "channel": "internal",
    "risk": "internal_high",
    "complexity": "standard",
    "audience_shape": "prioritized_multi"
  },
  "mode": "standard"
}
```

The allowed purposes are `decision_memo`, `strategy_paper`, `explainer`, and `update`. Labels such as "blog," "white paper," or "architecture paper" can still appear as display context, but workflow logic should use `classification.purpose`.

Use `gpd validate --semantic` when you want deterministic quality gates in addition to structural contracts. Semantic validation catches empty-but-well-formed artifacts: stale BRIEF evidence placeholders after research, source-sensitive imported drafts without source mapping, mixed-audience drafts missing audience review, recurring draft terms used repeatedly before definition, planned source types missing from actual research, missing counterevidence rationale, export metadata leakage, STATE.md / STATE.json drift, weak rewrite instructions in low-scoring review rows, thesis-restating reasoning spines, generic audience-conflict rows, missing safe-claim sources, fact-check source/evidence mismatches for strategic or recommendation claims, safe claims that cite sources marked only topically related in research claim-support metadata, precise quantitative claims without source/context/support, generic recommendations without concrete examples, and clustered or artifact-dense list-heavy prose. HIGH semantic issues fail the command; MEDIUM semantic issues are warnings. JSON output includes stable semantic issue IDs so tests can assert validator behavior without depending on prose wording.

Run semantic validation before treating a paper as example-quality, publication-ready, or ready for long-term handoff.

Moving backward is normal. If you change an upstream artifact after downstream work exists, `gpd status` routes back to the earliest stage that needs refresh before trusting the saved next command in `STATE.json`:

| Change detected | Suggested command |
|-----------------|-------------------|
| `BRIEF.md` or `STRATEGY.md` newer than `RESEARCH.json` | `/gpd-research` |
| `RESEARCH.json` newer than `OUTLINE.md` | `/gpd-outline --deep` |
| `OUTLINE.md` newer than `DRAFT.md` | `/gpd-draft` |
| `DRAFT.md` newer than `FACT-CHECK.md` | `/gpd-fact-check --full` |
| `FACT-CHECK.md` newer than `REVIEW.md` | `/gpd-review --deep` |
| `DRAFT.md`, `FACT-CHECK.md`, or `REVIEW.md` newer than `exports/FINAL.md` | `/gpd-export` |
| `exports/FINAL.md` exists and is current | `/gpd-progress` |

This is an incremental refresh, not a full reset. Keep the existing artifacts, rerun the suggested stage, and let that stage update its artifact plus state. Use a full manual reset only when you intentionally want to discard an artifact rather than revise it.

`STATE.json` can still carry the saved next command and mode choice, such as `/gpd-outline --lite`, but `gpd status` will not let it skip structurally required artifacts. For example, a saved `/gpd-export` is ignored until a draft and review exist. Once `.paper/exports/FINAL.md` exists and is newer than the draft, fact-check, and review, `gpd status` treats the paper as exported and routes to `/gpd-progress`.

After fact-check and review, `gpd status` also reads documented outcome fields. `FACT-CHECK.md` `Recommended Next Action` can send the paper back to research or revise. `REVIEW.md` verdicts of `Revise` or `Rework` route to `/gpd-revise`. A newer `READER-FEEDBACK.md` routes back to `/gpd-review` so feedback can be synthesized into a plan. A pending `FEEDBACK-PLAN.md` pauses at `/gpd-progress` until you approve, revise, or ignore the plan.

## Main Slash Commands

The command files live in [commands/gpd](commands/gpd).

| Command | Purpose |
|---------|---------|
| `/gpd-new-paper` | Ask for location, create a paper directory, then initialize `.paper/` with setup artifacts and state. |
| `/gpd-import-paper` | Import an existing paper, versions, specs, research, and references into a GPD workspace. |
| `/gpd-progress` | Show current status, missing artifacts, suggested next command, and context-clearing guidance. |
| `/gpd-brief` | Capture or refine thesis, format, claims, constraints, audience promise, and source needs. |
| `/gpd-research` | Infer research questions, ask approval for the plan, then build structured evidence artifacts. |
| `/gpd-outline` | Create an argument-aware outline. Lite is for early/short/import triage; Deep is for serious or high-stakes papers. |
| `/gpd-draft` | Draft section-by-section from approved context; supports full draft for short pieces and targeted redrafting from comments. |
| `/gpd-fact-check` | Check material claims for source support, staleness, exaggeration, contradiction, and citation risk. |
| `/gpd-review` | Review for thesis, evidence, audience fit, tone, and structure. |
| `/gpd-review --external` | Ask available external AI CLIs/local models to review, then create a feedback handling plan. |
| `/gpd-revise` | Apply approved feedback or run a controlled layered editorial pass with drift checks. |
| `/gpd-export` | Prepare final Markdown for publication or handoff inside the AI runtime. |

Short aliases:

| Alias | Same as |
|-------|---------|
| `/gpd-new` | `/gpd-new-paper` |
| `/gpd-import` | `/gpd-import-paper` |
| `/gpd-status` | `/gpd-progress` |

Maintenance commands:

| Command | Purpose |
|---------|---------|
| `/gpd-persona` | Create or update the paper-specific author/persona profile. |
| `/gpd-audience` | Create or update the target audience profile. |
| `/gpd-curate-audience` | Create, review, or update reusable curated audience personas. |

## CLI Commands

Install and update runtime assets:

```bash
gpd install claude
gpd install codex
gpd update claude
gpd update codex
gpd doctor claude
gpd doctor codex
```

Create, inspect, and validate paper workspaces:

```bash
gpd init --location ~/papers --slug metadata-strategy --title "Metadata Strategy"
gpd status --paper ~/papers/metadata-strategy
gpd validate --paper ~/papers/metadata-strategy
gpd validate --semantic --paper ~/papers/metadata-strategy
gpd validate-artifact --path ~/papers/metadata-strategy/.paper/RESEARCH.json
gpd review-external --paper ~/papers/metadata-strategy --review-file claude=/tmp/claude-review.md
gpd list-audiences
gpd list-profiles
gpd version
```

`gpd install` copies commands, workflows, agents, audiences, profiles, templates, and references into the selected runtime. Source command files use the neutral `@{{GPD_RUNTIME_ROOT}}` placeholder; install rewrites that placeholder so Codex points at `~/.codex/get-paper-done/` and Claude points at `~/.claude/get-paper-done/`.

`gpd init` creates a new empty paper workspace. Import is covered separately below because it has a different preservation-first flow.

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
    READER-FEEDBACK.md
    FEEDBACK-PLAN.md
```

The framework package is not the paper workspace. Paper-specific state and source material live in the paper directory. That separation is what lets you update GPD without touching active papers.

## Examples

Completed reference workspaces are available under [examples](examples):

- [examples/data-products-ai-scaling](examples/data-products-ai-scaling) shows a full internal strategy-paper flow from a clean paper workspace.
- [examples/technology-lifecycle-management](examples/technology-lifecycle-management) shows an imported-paper recovery flow where the private source draft is withheld and the completed artifacts are anonymized.
- [examples/weekly-platform-update](examples/weekly-platform-update) shows a lite internal update flow that intentionally skips research and fact-check artifacts when the paper is low-risk and does not make source-sensitive claims.
- [examples/responsible-ai-controls](examples/responsible-ai-controls) shows an external, evidence-heavy explainer with flagship-style research, counterevidence, fact-check, audience review, and bounded publication claims.
- [examples/platform-review-cycle-metrics](examples/platform-review-cycle-metrics) shows a short quantitative internal memo with baseline, sample, timeframe, source IDs, fact-check handling, and bounded numerical claims.
- [examples/public-ai-control-baseline](examples/public-ai-control-baseline) shows a compact decision memo using real public NIST, OWASP, and NCSC/CISA source URLs with source verification notes, claim-support metadata, fact-check, review, and exported citations.
- [examples/software-supply-chain-evidence-pack](examples/software-supply-chain-evidence-pack) shows the showcase feedback-loop example: a pre-registered public-source decision memo using CISA, NIST, SLSA, OpenSSF, OWASP, and NCSC sources, `READER-FEEDBACK.md`, `FEEDBACK-PLAN.md`, backward routing, fact-checking, review, and export.

The examples are included in the test suite. `tests/example-fixtures.test.js` validates semantic gates and completed-workflow routing on normalized checkout copies, including the lite fixture's absence of research and fact-check artifacts, the external fixture's required evidence path, the quantitative fixture's claim-support metadata, the public-source fixtures' live URL and exported-citation shape, and the imported-paper fixture's anonymized source boundary. `npm run gate:examples` runs semantic validation across all example workspaces with zero warnings required.

## Core Artifacts

| Artifact | Responsibility |
|----------|----------------|
| `PROJECT.md` | Paper identity, format, publishing context, source policy, broad constraints. |
| `PERSONA.md` | Paper-scoped author voice, authority posture, tone boundaries. |
| `AUDIENCE.md` | Selected readers, priority order, conflict rules, objections, proof standard. |
| `BRIEF.md` | Thesis, claims, opposing view, reader promise, scope, definition of done. |
| `STRATEGY.md` | Strategic readiness gate, paper job, posture, decision usefulness, scope. |
| `RESEARCH.json` | Canonical source registry, claim-support metadata, evidence matrix, synthesis, contradictions, gaps. |
| `RESEARCH.md` | Short human-readable index to `RESEARCH.json`. |
| `OUTLINE.md` | Argument architecture, reader journey, section architecture, evidence placement, objection handling. |
| `DRAFT.md` | Current draft body, section drafting state, and draft notes. |
| `FACT-CHECK.md` | Claim inventory, source alignment, factual risk, source gaps, and recommended handling. |
| `REVIEW.md` | Local review findings and revision plan. |
| `EXTERNAL-REVIEWS.md` | Raw and summarized external model feedback. |
| `READER-FEEDBACK.md` | Structured human or model reader feedback using voice, register, audience fit, evidence, and ask clarity signals. |
| `FEEDBACK-PLAN.md` | Proposed incorporate/ignore/defer/ask handling before revision. |
| `STATE.md` | Human-readable current stage, blockers, approvals, suggested next command. |
| `STATE.json` | Machine-readable state used by CLI status and validation. |
| `config.json` | Machine-readable mode, classification, citation, research, and review settings. |
| `IMPORT.md` | Import manifest and classification. |

## Audience System

Reusable author profiles can live in [profiles](profiles). The starter profile [profiles/head-data-ai-architecture.md](profiles/head-data-ai-architecture.md) captures a Head of Data and AI Architecture voice for regulated financial-services and enterprise technology contexts. It can be imported into a paper-specific `.paper/PERSONA.md`.

Reusable audience personas live in [audiences](audiences):

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

Audience review supports two modes:

- **Lite:** early outline or brief review. Fast, blunt scoring and top fixes.
- **Deep:** late-stage draft review. Adds reverse outline, objection mapping, and decision-gap analysis.

Audience review uses exactly seven fixed dimensions, each scored on a 1-5 scale:

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

Readiness statuses:

```text
Go
Revise Before Drafting
No-Go
```

`Revise Before Drafting` and `No-Go` block `/gpd-research`, `/gpd-outline`, and `/gpd-draft` unless you explicitly override. A block is not a failure; it is the workflow protecting you from spending time on research or prose before the paper has a clear job.

The strategy artifact records:

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

## Outline And Draft

`/gpd-outline` has two depth modes:

- **Lite:** fast structure pass for early shaping, short pieces under about 1,200 words, or first-pass triage of messy imported drafts.
- **Deep:** default for serious papers, especially when `RESEARCH.json` or `.paper/STRATEGY.md` exists, the piece is executive-facing, technical, multi-audience, publishable, about 1,200 words or longer, or high-stakes.

Deep adds structure-selection scoring, draft-readiness scoring, reader jump analysis, evidence/objection load checks, and severity-scored structural anti-patterns.

`/gpd-draft` defaults to section-by-section drafting for serious papers:

```text
/gpd-draft --next-section
/gpd-draft --section "The Platform Shift"
/gpd-draft --full
/gpd-draft --redraft-from-comments
```

Full-draft mode is for short pieces or explicit requests. Section drafting keeps the paper inspectable and lets fact-checking/review catch problems before the whole draft drifts.

## Import Existing Work

Use import when a paper already exists outside the framework:

```bash
gpd import --source ~/drafts/current-paper --location ~/papers --slug lifecycle-framework --dry-run
gpd import --source ~/drafts/current-paper --location ~/papers --slug lifecycle-framework
cd ~/papers/lifecycle-framework
gpd status
```

The first command is optional but recommended when importing existing work. `--dry-run` previews the destination, copied files, skipped files, classification counts, warnings, and canonical draft candidate without writing anything. The second command runs the same import for real.

Use `--max-file-bytes <bytes>` when you want to lower or raise the per-file skip threshold for unusually large import folders.

Or from the AI runtime:

```text
/gpd-import-paper --source "/path/to/current-paper-or-folder" --location ~/papers --slug lifecycle-framework --profile head-data-ai-architecture
```

Import is preservation-first. It creates a new paper directory, copies original material into `original/`, writes `.paper/IMPORT.md`, creates minimal setup artifacts, and presents a post-import menu.

Import intentionally does not generate `RESEARCH.json`, `RESEARCH.md`, `OUTLINE.md`, `FACT-CHECK.md`, or `REVIEW.md` by default. Research, outline, fact-check, and review remain separate stages so you can clear context between them.

When multiple draft-like files exist, import ranks candidates using filename cues, version cues, location, and modified time. Confirm the selected canonical draft in `.paper/IMPORT.md` before treating the imported draft as authoritative.

Useful post-import next steps:

```text
/gpd-brief
/gpd-research --provided-first
/gpd-outline --lite
/gpd-outline --deep
/gpd-review --external
```

Use `/gpd-outline --deep` when the imported paper is serious, researched, high-stakes, or about 1,200+ words. If the imported draft is already publication-sensitive and contains material factual, current, technical, market, regulatory, numerical, or citation-dependent claims, run `/gpd-fact-check --risk-scan` before external review or export.

## Review And Revision

`/gpd-review` produces a local review with fixed scorecards and required fixes. `/gpd-review --external` asks available external AI CLIs or local models for independent feedback.

Reader feedback is captured in `.paper/READER-FEEDBACK.md` before it becomes revision work. The artifact uses five signals: voice, register, audience fit, evidence, and ask clarity. External review never edits the draft directly. It writes `.paper/EXTERNAL-REVIEWS.md` and `.paper/FEEDBACK-PLAN.md`, then asks how to proceed. `/gpd-revise` only applies feedback after you approve the proposed handling.

For deterministic CLI collection, use `gpd review-external --review-file reviewer=path` or `--stdin --reviewer name`. To invoke installed provider CLIs, use `gpd review-external --models claude,codex`. Provider invocation sends the generated review prompt to the selected CLI, so only use it with paper content that may be reviewed by that provider. Both paths update state to the pending feedback-plan gate and do not revise the draft.

## Artifact Contracts

GPD includes structural validation for known paper artifacts:

```bash
gpd validate --paper ~/papers/metadata-strategy
gpd validate --semantic --paper ~/papers/metadata-strategy
gpd validate-artifact --path ~/papers/metadata-strategy/.paper/RESEARCH.json
```

Contracts live in [references/artifact-contracts.md](references/artifact-contracts.md) and [references/schemas](references/schemas). They check structure, required headings/tables, JSON shape, and drift-prone enum values. Semantic validation adds deterministic lint-style quality gates, but it still does not replace human review.

## Updating Installed Runtimes

After pulling a new release or updating the local repo, refresh installed assets:

```bash
gpd update claude
gpd update codex
```

Update rewrites framework-owned files from the current package, writes `get-paper-done/INSTALL-MANIFEST.json`, and backs up changed installed files under `get-paper-done/.backups/`. It does not touch paper workspaces, and custom audience/profile files with names not shipped by GPD are left in place.

For private-repo release and update policy, see [docs/RELEASE.md](docs/RELEASE.md). Before tagging or handing off a release, run:

```bash
npm run release:check
```

## Package Boundary

The npm package is an installable framework bundle, not a dump of every repo file. It includes the CLI, commands, workflows, agents, templates, references, curated audiences/profiles, docs, and examples.

It intentionally excludes tests, RFC design drafts, ignored feedback files, local scratch files, and private paper/profile material. `npm run pack:check` verifies the package file list before release-style handoff.

## Documentation

| Doc | What's in it |
|-----|-------------|
| [docs/DESIGN-SPEC.md](docs/DESIGN-SPEC.md) | Full design contract and workflow model. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Package/runtime/workspace architecture. |
| [docs/RELEASE.md](docs/RELEASE.md) | Private-repo release checklist, version policy, update flow, and package boundary. |
| [docs/PROJECT-REVIEW.md](docs/PROJECT-REVIEW.md) | Current strengths, risks, and gaps. |
| [references/artifact-contracts.md](references/artifact-contracts.md) | Artifact contracts used by validation. |
| [references/audience-review-rubric.md](references/audience-review-rubric.md) | Fixed audience review rubric. |

## Legacy Installer

The direct installer still works for Claude-style targets:

```bash
node bin/install.js --target ~/.claude
```

Prefer `npm link` plus `gpd install ...` for day-to-day local development.
