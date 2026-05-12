# Get Paper Done Design Spec

## Status

- **Project:** Get Paper Done
- **Version:** 0.1 design baseline
- **Status:** CLI-backed prompt/workflow prototype
- **Primary user:** Senior data and AI architecture leader in regulated enterprise environments
- **Primary use cases:** newsletters, blog posts, position papers, white papers, executive strategy papers

## Problem

AI writing workflows lose quality when they treat every paper as a generic drafting task. They also degrade when raw research, source dumps, draft variants, and review feedback remain in one overloaded context.

Get Paper Done solves this by making writing context durable, staged, and inspectable. Each paper gets its own workspace with explicit persona, audience, strategy, research, outline, draft, review, and revision artifacts.

## Goals

- Create one durable project workspace per paper.
- Preserve imported source material unchanged.
- Capture author persona and audience context before drafting.
- Force strategic clarity before expensive research or drafting.
- Convert research into structured evidence, not source volume.
- Maintain explicit context-break stages to prevent quality degradation.
- Support curated reusable audience personas.
- Support external model review with user approval before changes.
- Keep the system usable as prompt/workflow files while the CLI handles setup, import, export, status, and validation.

## Non-Goals

- Do not become a general document management system.
- Do not replace the author as final decision-maker.
- Do not silently rewrite drafts from review feedback.
- Do not require raw research to stay in model context.
- Do not optimize for generic marketing copy.
- Do not make specialized agents visible as user-facing concepts when a simpler command or audience choice works.

## Core Principles

1. **Files are memory.** Durable context lives in `.paper/`, not in chat history.
2. **Stages are context boundaries.** Research, outline, draft, review, and revise should be run in separate contexts when needed.
3. **Strategy can block.** A weak paper direction should stop research and drafting until the brief is fixed or explicitly overridden.
4. **Research must compress.** Raw sources are not downstream context. `RESEARCH.json` is canonical.
5. **Audiences, not agents.** Users choose reader personas; the system routes review logic internally.
6. **Review proposes, revision applies.** Feedback is evaluated and approved before draft changes.
7. **Imported originals are preserved.** Source material goes into `original/` unchanged.

## User Model

The primary user is a senior technology executive writing serious papers where:

- audience fit matters
- strategic clarity matters
- evidence quality matters
- paper type and decision usefulness must be explicit
- generic prose is a failure
- context overload materially reduces output quality

The default reusable author profile is `profiles/head-data-ai-architecture.md`, but every paper uses a local `.paper/PERSONA.md` as authoritative context.

## Workspace Model

Each paper lives in its own directory:

```text
[location]/[paper-slug]/
  original/
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
    RESEARCH.json
    RESEARCH.md
    OUTLINE.md
    DRAFT.md
    REVIEW.md
    FACT-CHECK.md
    EXTERNAL-REVIEWS.md
    FEEDBACK-PLAN.md
```

Setup creates only the artifacts required to start. Later stages create their artifacts on demand.

## Artifact Responsibilities

| Artifact | Responsibility |
|----------|----------------|
| `PROJECT.md` | Paper identity, format, publishing context, source policy, broad constraints |
| `PERSONA.md` | Paper-scoped author voice, authority posture, tone boundaries |
| `AUDIENCE.md` | Selected readers, priority order, conflict rule, objections, proof standard |
| `BRIEF.md` | Thesis, claims, opposing view, reader promise, scope, definition of done |
| `STRATEGY.md` | Strategic readiness gate, paper job, posture, decision usefulness, scope |
| `RESEARCH.json` | Canonical source registry, claim-support metadata, evidence matrix, synthesis, contradictions, gaps |
| `RESEARCH.md` | Human-readable index to `RESEARCH.json` |
| `OUTLINE.md` | Argument architecture, reader journey, section architecture, evidence placement, objection handling, mode-specific diagnostics |
| `DRAFT.md` | Current draft body, section drafting state, and draft notes |
| `REVIEW.md` | Local review findings and revision plan |
| `FACT-CHECK.md` | Claim inventory, source alignment, factual risk, source gaps, and recommended handling |
| `EXTERNAL-REVIEWS.md` | Raw and summarized external model feedback |
| `FEEDBACK-PLAN.md` | Proposed incorporate/ignore/defer/ask handling before revision |
| `STATE.md` | Human-readable current stage, blockers, approvals, suggested next command |
| `STATE.json` | Machine-readable state companion used by CLI status and validation |
| `IMPORT.md` | Import manifest and classification |

## Command Surface

### Main Commands

| Command | Purpose |
|---------|---------|
| `/gpd-new-paper` | Create a new paper workspace |
| `/gpd-import-paper` | Import an existing paper and preserve originals |
| `/gpd-progress` | Report state, artifact health, suggested next command |
| `/gpd-brief` | Create or refine thesis, claims, and paper brief |
| `/gpd-research` | Infer questions, present plan, write structured evidence |
| `/gpd-outline` | Create argument-aware outline; Lite for early/short/import triage, Deep for serious/researched/high-stakes papers |
| `/gpd-draft` | Draft section-by-section from approved context; full draft only for short pieces or explicit requests; redraft specific sections from comments or approved feedback |
| `/gpd-review` | Review locally |
| `/gpd-fact-check` | Check material claims for source support, staleness, exaggeration, contradiction, and citation risk |
| `/gpd-review --external` | Run external model review and feedback planning |
| `/gpd-revise` | Apply approved feedback |
| `/gpd-export` | Prepare final handoff |

### Aliases

| Alias | Same as |
|-------|---------|
| `/gpd-new` | `/gpd-new-paper` |
| `/gpd-import` | `/gpd-import-paper` |
| `/gpd-status` | `/gpd-progress` |

### Maintenance Commands

| Command | Purpose |
|---------|---------|
| `/gpd-persona` | Update paper-scoped persona |
| `/gpd-audience` | Update paper-scoped audience |
| `/gpd-curate-audience` | Create or evolve reusable curated audience personas |

## Workflow

```text
new/import
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

### Import Flow

Import is preservation-first:

1. Ask for source path, destination location, and slug.
2. Create a new paper directory.
3. Copy relevant existing material into `original/`.
4. Create minimal `.paper/` artifacts.
5. Catalog existing research, versions, specs, reviews, and drafts in `IMPORT.md`.
6. Present post-import choices:
   - `/gpd-research`
   - `/gpd-outline --lite` for structure triage, or `/gpd-outline --deep` for serious/researched/high-stakes papers
   - `/gpd-review --external`
   - conditional note: use `/gpd-fact-check --risk-scan` before external review or export if the imported draft is already publication-sensitive and fact-heavy

Import must not generate `RESEARCH.json`, `OUTLINE.md`, `FACT-CHECK.md`, or `REVIEW.md` by default. It must create a lightweight `STRATEGY.md` gate from imported context; if that gate blocks, post-import next action is `/gpd-brief` unless the user explicitly overrides.

### Strategy Gate

`paper-strategist` writes `STRATEGY.md`.

Statuses:

- `Go`
- `Revise Before Drafting`
- `No-Go`

`Revise Before Drafting` and `No-Go` block `/gpd-research`, `/gpd-outline`, and `/gpd-draft` unless the user explicitly overrides.

`STRATEGY.md` includes `Strategy Blockers` as the operational routing layer:

- `Blocking issues`: `none` or normalized blockers such as `scope_too_broad`, `thesis_weak`, `audience_conflict`, or `evidence_gap`
- `Primary blocker`: the first blocker to fix
- `Block severity`: `None`, `Medium`, or `High`
- `Required unblock action`: the next unblock move, such as `brief_revision`, `thesis_revision`, `scope_narrowing`, `research_plan`, or `user_override`

### Research Flow

Default depth is `standard`.

Depth flags:

- `--rapid`
- `--standard`
- `--deep`

Source modes:

- `--provided-first`
- `--provided-only`
- `--web-first`
- `--web-only`

If imported or user-provided material exists, the workflow asks how to use it. The likely default for imported papers is `provided-first`: verify, improve, and convert provided material into GPD research format, then use web for gaps and counterevidence.

Research first presents a plan:

- inferred research questions
- mapped claims
- planned source types
- search direction
- source mode
- depth

Only after approval does it collect sources and write `RESEARCH.json`.

### Fact-Check Flow

Fact-checking audits material claims before review and export risk decisions.

It writes `FACT-CHECK.md` and checks:

- claim support and source alignment
- stale or time-sensitive claims
- exaggerated, ambiguous, or misleading-in-context claims
- quantitative integrity
- whether the paper's conclusion outruns verified support

The default placement is after drafting and before full review when the draft contains factual, current, technical, market, regulatory, numerical, or publication-sensitive claims. It can also run again after revision before export for high-risk papers.

### Review Flow

Review never edits the draft directly.

Local review writes `REVIEW.md`.

External review writes:

- `EXTERNAL-REVIEWS.md`
- `FEEDBACK-PLAN.md`

Feedback items must be classified:

- Incorporate
- Ignore
- Defer
- Ask user

Revision applies only approved feedback.

## Agent Contracts

| Agent | Contract |
|-------|----------|
| `paper-strategist` | Challenge-first strategic gatekeeper; can block progress and preserves/supersedes prior strategy state when rerun |
| `paper-researcher` | Builds strategy-aware structured evidence package and source registry |
| `paper-outliner` | Designs argument architecture with Lite for early/short/import triage and Deep as default for serious/researched/high-stakes papers; clarifies missing-strategy handling; Deep adds structure rubric, draft-readiness scoring, reader jump analysis, evidence/objection load checks, and severity-scored anti-patterns |
| `paper-drafter` | Controlled prose engine; drafts section-by-section by default, supports full draft and redraft-from-comments modes, preserves existing sections, carries reader-state transitions and length/density targets in the intent map, reads relevant strategy/review/feedback artifacts, and marks evidence gaps, author decisions, structure issues, assumptions, and change logs |
| `paper-editor` | Voice-preserving line-and-structure editor with plan-first default, section/full/style/final-polish modes, light/standard/heavy intensity, layered structure/clarity/rhythm/tone/publication passes, permission checks, drift checks, publication readiness checks, and change logs |
| `paper-fact-checker` | Editorial fact-checker and claims-risk auditor with risk-scan/full/publication/source-audit modes, material claim inventory, source alignment checks, current-fact verification policy, support/freshness/precision/context/quantitative checks, synthesis integrity assessment, systemic risk report, and `FACT-CHECK.md` output |
| `opposition-reviewer` | Steelman opposition reviewer with Lite/Deep modes, scope modes, opposition model, strongest fair opposing case, fatal/serious/moderate/minor objection audit, argument resilience scorecard, audience-impact mapping, claim stress tests, existing-defense check, assumption failure tests, alternative strategy checks, pre-mortem, narrowing plan, and explicit routing to brief/research/fact-check/outline/revision |
| `audience-reviewer` | Scores audience fit and decision readiness; supports Lite brief/outline review and explicit multi-audience conflict handling |

## Curated Audience Personas

Default reusable audiences:

- CxO reader
- Distinguished architect / engineer
- Business or operating executive
- Public technical reader

Users may select multiple personas. The paper-scoped `AUDIENCE.md` must capture:

- selected personas
- primary/secondary priority
- conflict rule
- paper-specific adaptations

Existing curated personas are never used blindly. The workflow summarizes and suggests improvements before use.

## State And Blocking

`STATE.md` is intentionally small and human-readable. `STATE.json` is the machine-readable companion and the preferred CLI state source when present. The CLI still checks hard gates, artifact freshness, and structural prerequisites before trusting a saved next command. Both state files track:

- current stage
- last completed stage
- blockers
- feedback approval state
- post-import choices when applicable
- suggested next command

Suggested next command precedence:

1. Missing setup artifacts and blocking strategy statuses route back to `/gpd-brief`.
2. Upstream artifacts newer than downstream artifacts route backward for incremental refresh: brief/strategy to research, research to outline, outline to draft, draft to fact-check, and fact-check to review.
3. A saved `STATE.json` `suggested_next_command` is used only when it is structurally plausible. It cannot skip required artifacts, such as exporting without a draft and review or drafting without an outline.
4. Fact-check and review outcome fields can route backward: fact-check recommended next action may send the paper to research or revise, and review verdicts of `Revise` or `Rework` route to revision.
5. Pending feedback plans pause at progress/status until the user approves, revises, or ignores the plan.
6. If no saved command can be trusted and no content outcome applies, artifact presence determines the next command.

Blocking conditions:

- missing persona/audience/brief
- strategy block, including the primary blocker from `STRATEGY.md`
- missing evidence when claims require support
- pending feedback-plan approval

## Installation Model

Current CLI:

```bash
gpd install claude
gpd install codex
gpd update claude
gpd update codex
gpd doctor claude
gpd doctor codex
```

The installer copies commands, workflows, agents, audiences, profiles, templates, and references into a Claude or Codex runtime. Source command files use `@{{GPD_RUNTIME_ROOT}}`; command files are transformed at install time so workflow references point at the selected runtime root.

Update behavior:

- reinstall framework-owned assets from the current package/repo
- write `get-paper-done/INSTALL-MANIFEST.json`
- back up changed installed files under `get-paper-done/.backups/`
- preserve paper workspaces
- preserve custom profiles/audiences with names not shipped by GPD

Workspace CLI helpers:

```bash
gpd init
gpd import --source <path> --location <path> --slug <name>
gpd status
gpd validate
gpd list-audiences
gpd list-profiles
```

`gpd init` creates `.paper/` setup artifacts and leaves strategy blocked until `/gpd-brief` confirms the paper direction. `gpd import` copies source material to `original/`, writes `.paper/IMPORT.md`, creates minimal setup artifacts, and preserves downstream research/outline/fact-check/review as separate stages.

Tooling tests cover install/update/doctor, command-reference rewriting, backup correctness, init/import/status/validate, malformed input handling, and varied import classification. CI runs `npm run check`.

Remaining tool maturity requires:

- deeper import classification and conversion helpers
- local project install mode
- external review runner

## Acceptance Criteria

Framework acceptance:

- A messy existing paper can be imported without losing originals.
- Strategy gate can block weak paper direction.
- Research produces useful `RESEARCH.json` without source overload.
- Outline and draft can proceed from compressed artifacts.
- Fact-checking exposes unsupported, stale, overstated, or risky material claims before export.
- Review feedback is evaluated before revision.
- Multi-audience review produces actionable conflict handling.

Tool acceptance:

- Installer dry-run passes.
- Install result includes commands, workflows, agents, audiences, profiles, templates, and references.
- CLI can install, update, and doctor Claude and Codex runtimes.
- CLI can create, import, status, and validate paper workspaces safely.
- Tests cover import, install, discovery, and artifact validation.

## Current Ratings

- Overall project: 9.1/10 as a writing framework; 8.6/10 as an installable private-repo tool
- Framework design: 9.2/10
- Installable tool maturity: 8.4/10
- Documentation: 9.1/10
- Test coverage: 9.7/10
- Release readiness: 8.1/10
- `audience-reviewer`: 8.8/10 pending real multi-audience calibration
- `paper-researcher`: 9.0/10 pending messy-import calibration
- `paper-strategist`: 9.1/10 pending real-use calibration
- `paper-outliner`: 9.3/10 pending calibration on a real imported or strategy-heavy paper
- `paper-drafter`: 9.1/10 pending real-use calibration
- `paper-editor`: 9.1/10 pending real-use calibration
- `paper-fact-checker`: 9.2/10 pending real-use calibration
- `opposition-reviewer`: 9.2/10 pending real adversarial-review calibration

## Open Work

Immediate next work:

1. Run live public-source citation verification on a real paper now that deterministic claim-support metadata exists and is demonstrated in the quantitative example.
2. Harden import based on real use, especially canonical draft selection and richer source extraction.
3. Add release/update documentation and compatibility policy.
4. Continue one-by-one agent calibration from completed examples and future real paper trials.
5. Revisit agents after real-use calibration.
