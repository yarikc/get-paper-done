# Get Paper Done Design Spec

## Status

- **Project:** Get Paper Done
- **Version:** 0.1 design baseline
- **Status:** CLI-backed prompt/workflow prototype
- **Primary user:** Senior data and AI architecture leader in regulated enterprise environments
- **Primary use cases:** decision memos, strategy papers, explainers, updates, newsletters, blog posts, white papers, and executive strategy papers

## Problem

AI writing workflows lose quality when they treat every paper as a generic drafting task. They also degrade when raw research, source dumps, draft variants, and review feedback remain in one overloaded context.

Get Paper Done solves this by making writing context durable, staged, and inspectable. Each paper gets its own workspace with explicit persona, audience, strategy, research, outline, draft, review, and revision artifacts.

## Goals

- Create one durable project workspace per paper.
- Preserve imported source material unchanged.
- Capture author persona and audience context before drafting.
- Force strategic clarity before expensive research or drafting.
- Force author-intent clarity before compressing imported drafts into a brief.
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
- classification and decision usefulness must be explicit
- paper classification must separate purpose, channel, risk, complexity, and audience shape
- generic prose is a failure
- context overload materially reduces output quality

The default reusable author profile is `profiles/head-data-ai-architecture.md`, but every paper uses a local `.paper/PERSONA.md` as authoritative context.

Reusable cross-paper context packs live in `contexts/`. They are optional, sanitized hints for recurring language, proof standards, and decision patterns. They never override a paper's local `.paper/PAPER-CONTEXT.md` or `.paper/DECISIONS.md`, and promotion into `contexts/` requires explicit user approval.

## Classification Model

Each paper stores normalized classification in `.paper/config.json`:

- `purpose`: `decision_memo`, `strategy_paper`, `explainer`, or `update`
- `channel`: `internal`, `external`, or `mixed`
- `risk`: `internal_low`, `internal_high`, `external_low`, `external_high`, or `regulated`
- `complexity`: `light`, `standard`, or `deep`
- `audience_shape`: `single`, `prioritized_multi`, or `hybrid`

Users can describe the paper in plain language. `/gpd-grill` resolves the real paper job, reader, thesis, proof standard, terms, scope, and non-goals before `/gpd-brief` normalizes the paper into enum values. Later stages use those values to calibrate evidence burden, outline shape, draft behavior, review standards, and fact-check intensity. Legacy labels such as blog, white paper, newsletter, board paper, or architecture paper are display/context labels, not workflow purpose values.

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
    PAPER-CONTEXT.md
    DECISIONS.md
    BRIEF.md
    STRATEGY.md
    STATE.md
    STATE.json
    config.json
    sources/
    exports/
    versions/
    RESEARCH.json
    RESEARCH.md
    OUTLINE.md
    DRAFT.md
    REVIEW.md
    FACT-CHECK.md
    FEEDBACK-EXTERNAL.md
    FEEDBACK-READER.md
    FEEDBACK-PLAN.md
    REVISION-CHECK.md
    REVISION-LOG.md
```

Setup creates only the artifacts required to start. Later stages create their artifacts on demand.

## Artifact Responsibilities

| Artifact | Responsibility |
|----------|----------------|
| `PROJECT.md` | Paper identity, format, publishing context, source policy, broad constraints |
| `PERSONA.md` | Paper-scoped author voice, authority posture, tone boundaries |
| `AUDIENCE.md` | Selected readers, priority order, conflict rule, objections, proof standard |
| `PAPER-CONTEXT.md` | Paper-specific language contract: canonical terms, relationships, and resolved ambiguities |
| `DECISIONS.md` | Paper decision records for hard-to-reconstruct thesis, audience, scope, source, and positioning choices |
| `BRIEF.md` | Thesis, claims, opposing view, reader promise, scope, definition of done |
| `STRATEGY.md` | Strategic readiness gate, paper job, posture, decision usefulness, scope |
| `RESEARCH.json` | Canonical source-lane coverage, author-language queries, source ranking, source cards, claim-support metadata, evidence nuggets, evidence matrix, synthesis, contradictions, gaps, and missed-source audit |
| `RESEARCH.md` | Human-readable research packet with source lanes, expected-source checkpoint notes, source ranking, why each source was picked, short summaries, extracted relevant points, evidence nuggets, caveats, missed-source audit notes, and links back to `RESEARCH.json` |
| `OUTLINE.md` | Argument architecture, reader journey, section architecture, evidence placement, objection handling, mode-specific diagnostics |
| `DRAFT.md` | Current draft body, section drafting state, and draft notes |
| `REVIEW.md` | Local review findings and revision plan |
| `FACT-CHECK.md` | Claim inventory, source alignment, factual risk, source gaps, and recommended handling |
| `FEEDBACK-EXTERNAL.md` | Raw and summarized external model feedback |
| `EXTERNAL-REVIEW-RUN.json` | Machine-readable external-review provenance: review target, context artifacts, requested providers, timeout, provider command/argument shape, exact-model policy, statuses, and raw feedback paths |
| `FEEDBACK-READER.md` | Structured human or model reader feedback using voice, register, audience fit, evidence, and ask clarity signals |
| `FEEDBACK-PLAN.md` | Concern-first approval queue for local, external, and reader feedback; records generated recommendations, proposed edits, user decisions, and user constraints before revision |
| `REVISION-CHECK.md` | Before/after regression gate for substantive revisions, including persona and voice preservation |
| `REVISION-LOG.md` | Snapshot ledger recording paper-local versions created before substantive revision, restore, or export overwrite |
| `versions/` | Paper-local snapshots of paper artifacts, source notes, external-review captures, imported originals, and hash metadata for rollback, comparison, and auditability |
| `STATE.md` | Human-readable current stage, blockers, approvals, suggested next command |
| `STATE.json` | Machine-readable state companion used by CLI status and validation |
| `IMPORT.md` | Import manifest and classification |

## Command Surface

### Main Commands

| Command | Purpose |
|---------|---------|
| `/gpd-new` | Create a new paper workspace |
| `/gpd-import` | Import an existing paper and preserve originals |
| `/gpd-status` | Report state, artifact health, suggested next command |
| `/gpd-grill` | Mandatory pre-brief interrogation and later re-entry workflow for paper intent, terminology, audience, thesis, proof standard, scope, and non-goals |
| `/gpd-brief` | Create or refine thesis, claims, and paper brief |
| `/gpd-research` | Infer questions, present plan, write structured evidence |
| `/gpd-outline` | Create argument-aware outline; Lite for early/short/import triage, Deep for serious/researched/high-stakes papers |
| `/gpd-draft` | Draft section-by-section from approved context; full draft only for short pieces or explicit requests; redraft specific sections from comments or approved feedback |
| `/gpd-review` | Review locally |
| `/gpd-fact-check` | Check material claims for source support, staleness, exaggeration, contradiction, and citation risk |
| `/gpd-review --external` | Run external model review and feedback planning |
| `/gpd-feedback` | Walk through pending feedback-plan concerns one at a time and record author decisions |
| `/gpd-revise` | Apply approved or modified feedback with snapshot protection |
| `/gpd-export` | Prepare final handoff |
| `gpd review-pack` | Show the current review target, editable source, and comment syntax |
| `gpd feedback collect` | Capture inline comments from the review target into reader feedback and feedback-plan artifacts |
| `gpd feedback clean` | Remove captured inline comments from the review target after the user confirms extraction |
| `gpd revise` | Prepare a controlled revision by snapshotting current paper state and surfacing the restore command |
| `gpd snapshot` | Preserve current tracked paper state before substantive revision or other risky work |
| `gpd restore` | Restore tracked paper files from a snapshot after first creating a safety snapshot |

### Maintenance Commands

| Command | Purpose |
|---------|---------|
| `/gpd-persona` | Update paper-scoped persona |
| `/gpd-audience` | Update paper-scoped audience |
| `/gpd-curate-audience` | Create or evolve reusable curated audience personas |

## Workflow

### User-Facing Rule

Users should not be expected to memorize the full stage sequence. The default user behavior is:

```text
run `gpd next` or `/gpd-status`
run the recommended command
repeat
```

After export, the user reviews `.paper/exports/FINAL.md`. `gpd review-pack` shows the exact review target and comment syntax. `gpd feedback collect` captures visible inline comments (`//todo:`, `//keep:`, `//qq:`, `//no:`) from the review target into `FEEDBACK-READER.md` and `FEEDBACK-PLAN.md`, preserves the commented paper, leaves comments in place by default, and stops at the approval gate. `gpd feedback clean` removes those inline comments only after the user confirms extraction. `FEEDBACK-PLAN.md` carries a concern-first decision view with numbered concerns, proposed edits grouped under each concern, `User Decision`, and `User Constraint`; `//keep:` becomes a preservation constraint. `/gpd-feedback` is the user-facing approval loop: it shows one concern, asks for `approve`, `modify`, `defer`, `reject`, or `answered_no_action`, and records the decision. The lower-level CLI exposes the same queue through `gpd feedback-plan list`, `gpd feedback-plan review`, and `gpd feedback-plan decide` for agents, tests, and scripts. Before substantive revision, `gpd revise --trigger <artifact>` preserves the current paper artifacts under `.paper/versions/` with file hashes, records the active revision snapshot in state, and prints the restore command. `/gpd-revise` then applies approved changes to `.paper/DRAFT.md`, and `/gpd-export` regenerates `FINAL.md`. If `FINAL.md` already exists and `DRAFT.md` changed after it, `gpd export` requires a current valid `REVISION-CHECK.md`, then snapshots the old export before overwriting it. `gpd next` compares the current `DRAFT.md` hash to the last exported draft hash, so a touched-but-unchanged draft does not force export while a content change with misleading mtimes still does. `gpd restore --snapshot REV-...` restores tracked files from a snapshot after creating a safety snapshot of the current state. `FINAL.md` is the reading copy; `DRAFT.md` remains the editable source of truth.

### Stage Semantics

| Stage | Primary command | Gate | Mandatory? | Writes | Transition rule |
|-------|-----------------|------|------------|--------|-----------------|
| Setup | `gpd init`, `gpd import`, `/gpd-new` | Workspace exists | Required | `.paper/PROJECT.md`, setup artifacts, state | Route to missing setup, then persona/audience/grill. |
| Persona | `/gpd-persona` | Author voice usable | Required unless already correct | `PERSONA.md` | Continue when voice, tone, claim style, and avoid-list are clear. |
| Audience | `/gpd-audience` | Reader and proof standard usable | Required unless already correct | `AUDIENCE.md` | Continue when primary reader, objections, and proof expectations are explicit. |
| Grill | `/gpd-grill` | Required decision keys complete | Mandatory for new/imported papers | `PAPER-CONTEXT.md`, `DECISIONS.md`, `STATE.json.grill` | Route to `/gpd-brief` only after author intent, thesis, reader, terms, scope, proof standard, counterargument, and non-goals are confirmed. |
| Brief | `/gpd-brief` | Brief contract clarity | Mandatory | `BRIEF.md` | Continue when classification, thesis, claims, reader promise, scope, objections, source assumptions, and open questions are clear enough to test. |
| Strategy gate | Produced by `/gpd-brief`; recorded in `STRATEGY.md` | Strategy status | Mandatory gate, not a separate user command | `STRATEGY.md` | `Go` allows research/outline. `Revise Before Drafting` or `No-Go` routes back to brief/grill/audience unless explicitly overridden. |
| Research | `/gpd-research` | Evidence sufficiency | Required for standard/flagship; conditional for lite | `RESEARCH.json`, `RESEARCH.md` | Continue when source lanes, expected-source checkpoint, source ranking, why-picked rationale, evidence nuggets, claim support, counterevidence, and source gaps are explicit. |
| Outline | `/gpd-outline` | Argument structure | Required before serious drafting | `OUTLINE.md` | Continue when reader journey, claims, objections, and evidence hooks are coherent. |
| Draft | `/gpd-draft` | Draft body exists | Required | `DRAFT.md` | Prefer `--next-section` until the paper body is complete; full draft only for short or explicit cases. |
| Fact-check | `/gpd-fact-check` | Material claim safety | Required for standard/flagship; conditional for lite | `FACT-CHECK.md` | Keep, soften, remove, verify, or route claims back to research/revise. |
| Review | `/gpd-review` | Review verdict and below-target gate | Required before export | `REVIEW.md`, optionally `FEEDBACK-READER.md` and `FEEDBACK-PLAN.md` | Ready routes to export only when the below-target gate does not require immediate improvement. Revise/rework, or Ready with immediate below-target fixes, routes to revision. |
| Revise | `/gpd-revise` | Approved fix application plus snapshot and regression check for substantive edits | Conditional | `versions/`, `DRAFT.md`, `REVISION-CHECK.md`, `REVISION-LOG.md`, and state updates | Apply only approved feedback/fact-check/review fixes. Any substantive revision must first preserve a snapshot, then compare before/after quality for thesis clarity, argument flow, evidence support, audience fit, persona and voice, ask clarity, and substance preservation before export. |
| Export | `/gpd-export`, `gpd export` | Final handoff current | Required for final output | `exports/FINAL.md`, and `versions/`/`REVISION-LOG.md` when overwriting a prior export | Allowed when draft/review state is ready and export is not stale. If `DRAFT.md` is newer than an existing `FINAL.md`, export requires a current valid `REVISION-CHECK.md`; existing `FINAL.md` is snapshotted before overwrite. |

`/gpd-grill` can also be invoked later. If an author or agent finds unresolved ambiguity after brief, research, outline, draft, review, or feedback, the workflow updates `PAPER-CONTEXT.md` and `DECISIONS.md` without rewriting downstream artifacts directly. When those artifacts are newer than `BRIEF.md`, status routing sends the paper back to `/gpd-brief` so the formal paper contract catches up before downstream work resumes.

### Backward Routing Walkthrough

Backward routing repairs the earliest stale artifact, not the most recent one.

Example:

1. `/gpd-review` finds that the draft's ask is unclear.
2. If the ask problem changes the decision, reader promise, thesis, or scope, the next command is `/gpd-brief`, not `/gpd-revise`.
3. `/gpd-brief` updates `BRIEF.md` and reruns the strategy gate in `STRATEGY.md`.
4. If the revised brief changes evidence needs, status routes to `/gpd-research`.
5. If research changes, status routes to `/gpd-outline`.
6. Drafting resumes only after the outline reflects the new brief and research.

This avoids line-editing a draft whose upstream contract is wrong.

### Gate Override Semantics

The grill gate and strategy gate may be overridden only by explicit user instruction.

- A grill override accepts the risk that downstream artifacts are based on unresolved author intent.
- A strategy override accepts the risk that research, outline, or draft work starts from a weak or blocked brief.
- Overrides must be recorded in `STATE.json` or the relevant gate artifact with `required_unblock_action = user_override` where applicable.
- Status output should explain the accepted risk instead of silently treating the gate as passed.

### Validation Composition

Validation has two layers:

1. Artifact-contract validation in `bin/lib/validate.js`. This checks required files, schemas, Markdown contracts, `PAPER-CONTEXT.md`, `DECISIONS.md`, and cross-artifact consistency such as canonical terms appearing in `DRAFT.md` once the paper has reached review or export.
2. Semantic lint-style validation in `bin/lib/semantic.js`. This checks paper-quality failure patterns such as stale evidence, weak reasoning spine, unsupported quantitative claims, and overloaded prose.

`gpd validate --semantic` always runs layer 1 before layer 2. A validator does not need to live in `bin/lib/semantic.js` to block semantic validation output.

### Import Flow

Import is preservation-first:

1. Ask for source path, destination location, and slug.
2. Create a new paper directory.
3. Copy relevant existing material into `original/`.
4. Create minimal `.paper/` artifacts.
5. Catalog existing research, versions, specs, reviews, and drafts in `IMPORT.md`.
6. Route to `/gpd-grill` before `/gpd-brief` to recover imported thesis, audience, narrative spine, desired outcome, proof standard, scope, and key terms.
7. Present post-import choices:
   - `/gpd-research`
   - `/gpd-outline --lite` for structure triage, or `/gpd-outline --deep` for serious/researched/high-stakes papers
   - `/gpd-review --external`
   - conditional note: use `/gpd-fact-check --risk-scan` before external review or export if the imported draft is already publication-sensitive and contains material factual, current, technical, market, regulatory, numerical, or citation-dependent claims

Import must not generate `RESEARCH.json`, `OUTLINE.md`, `FACT-CHECK.md`, or `REVIEW.md` by default. It must create lightweight setup artifacts and route to `/gpd-grill` before `/gpd-brief`; imported prose is evidence of possible intent, not confirmed intent.

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

`REVIEW.md` includes a below-target improvement gate. For serious internal, executive, external, high-risk, regulated, or flagship papers, the default target bar is 9/10 unless the brief or config says otherwise. If review scores any dimension below 5, gives an overall rating below target, or names a concrete fixable issue, the review must decide whether immediate revision is required before export. A paper cannot be treated as ready merely because the critique is written down.

Reader feedback writes:

- `FEEDBACK-READER.md`

It captures five signals: voice, register, audience fit, evidence, and ask clarity. Reader feedback is an input to handling, not permission to edit.

External review writes:

- `FEEDBACK-EXTERNAL.md`
- `FEEDBACK-PLAN.md`

Feedback plans must group tactical suggestions under named concerns when possible. Each concern carries a generated `Recommendation`, proposed edits, `User Decision`, and `User Constraint`.

Revision applies only concerns with `User Decision: approve` or `modify`; deferred and rejected concerns stay out of the draft.

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
- grill completion state
- feedback approval state
- post-import choices when applicable
- suggested next command

Suggested next command precedence:

1. Missing setup artifacts route to setup repair.
2. Incomplete `STATE.json.grill` routes to `/gpd-grill`; `/gpd-brief` cannot proceed until the required grill decisions are complete unless the user explicitly records an override in state and accepts that downstream work may rest on unresolved author intent.
3. `PAPER-CONTEXT.md` or `DECISIONS.md` newer than `BRIEF.md` routes to `/gpd-brief`, allowing later re-grill sessions to update the formal brief before downstream work resumes.
4. Blocking strategy statuses route back to `/gpd-brief` after grill completion.
5. Upstream artifacts newer than downstream artifacts route backward for incremental refresh: brief/strategy to research, research to outline, outline to draft, draft to fact-check, and fact-check to review.
6. A saved `STATE.json` `suggested_next_command` is used only when it is structurally plausible. It cannot skip required artifacts, such as exporting without a draft and review or drafting without an outline.
7. Fact-check and review outcome fields can route backward: fact-check recommended next action may send the paper to research or revise, and review verdicts of `Revise` or `Rework` route to revision.
8. Pending feedback plans pause at progress/status until the user approves, revises, or ignores the plan.
9. If no saved command can be trusted and no content outcome applies, artifact presence determines the next command.

Blocking conditions:

- missing persona/audience/brief
- incomplete grill gate
- strategy block, including the primary blocker from `STRATEGY.md`
- missing evidence when claims require support
- pending feedback-plan approval

Strategy and grill gates may be overridden only by explicit user instruction.
The override must be recorded in `STATE.json` or the relevant gate artifact, and
the next status explanation should say what risk the user accepted.

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

The installer copies commands, workflows, agents, audiences, profiles, templates, contexts, and references into a Claude or Codex runtime. Source command files use `@{{GPD_RUNTIME_ROOT}}`; command files are transformed at install time so workflow references point at the selected runtime root.

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
gpd next
gpd status
gpd validate
gpd review-pack
gpd feedback collect
gpd feedback clean
gpd review-external --review-file reviewer=<path>
gpd review-external --models claude,codex,gemini --current-runtime codex
gpd list-audiences
gpd list-profiles
```

`gpd init` creates `.paper/` setup artifacts and leaves grill incomplete until `/gpd-grill` resolves author intent. `gpd import` copies source material to `original/`, writes `.paper/IMPORT.md`, creates minimal setup artifacts, previews classification counts and warnings during dry-run, ranks draft candidates deterministically, extracts plain text from selected `.docx` canonical drafts, records unverified source-reference candidates for later triage, indexes copied files by likely role and downstream stage, routes to `/gpd-grill`, and preserves downstream research/outline/fact-check/review as separate stages.

`gpd review-external` sends external providers the paper workspace context needed for a real paper review: state, config/classification, grill context, decision records, persona, audience, brief, strategy gate, research summary, research JSON, outline, draft, exported reading copy, fact-check, local review, reader feedback, and prior feedback plan when present. It stores each reviewer capture under `.paper/feedback-external/`, writes `EXTERNAL-REVIEW-RUN.json` so the run records review target, context artifacts, requested providers, timeout, isolated working-directory policy, safe provider command/argument shape, provider status, and whether exact model/settings were controlled by GPD or inherited from provider CLI defaults, writes the active combined review to `FEEDBACK-EXTERNAL.md`, deduplicates overlapping reviewer concerns, and decomposes captured HIGH/MEDIUM/LOW concerns and suggested changes into a concern-first `FEEDBACK-PLAN.md` queue with proposed edits grouped under their parent concern. Claude provider review defaults to `claude -p --model opus --effort high`; Gemini provider review defaults to `gemini -p "" -m gemini-2.5-pro --output-format text --approval-mode plan --skip-trust`; other providers currently use their calibrated CLI argument shape and provider defaults. Provider CLIs run from an isolated temporary directory and are instructed to return the full review on stdout so accidental reviewer-created files do not land in the paper or repo.

Provider invocation is bounded by `--timeout-ms`. A timed-out provider is recorded as `timed_out`, counted as a review issue, and GPD requests cleanup for the provider process tree before continuing with any completed reviewer results. If the command is interrupted, GPD attempts to clean up active provider processes before exiting.

Tooling tests cover install/update/doctor, command-reference rewriting, backup correctness, init/import/next/status/validate, malformed input handling, and varied import classification. CI runs `npm run check`.

Remaining tool maturity requires:

- deeper import conversion and source-extraction helpers beyond first-pass `.docx` canonical-draft text extraction, source-reference triage, and version/source indexing
- local project install mode
- broader external review provider calibration beyond authenticated Claude/Codex/Gemini CLI paths, especially local HTTP servers; provider invocation skips the current runtime when identified because self-review is not independent; Opencode is intentionally unsupported for paper review
- public or team distribution policy

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
- Install result includes commands, workflows, agents, audiences, profiles, templates, contexts, and references.
- CLI can install, update, and doctor Claude and Codex runtimes.
- CLI can create, import, show the next action, status, and validate paper workspaces safely.
- Tests cover import, install, discovery, and artifact validation.

## Current Ratings

- Overall project: 9.4/10 as a writing framework; 9.10/10 as an installable private-repo tool
- Framework design: 9.5/10
- Installable tool maturity: 9.10/10
- Documentation: 9.4/10
- Test coverage: 9.8/10
- Release readiness: 8.8/10
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

1. Harden import further only where real use requires PDF/spreadsheet handling or very-large-folder review.
2. Continue real-paper calibration for combined Claude/Gemini external review behavior and decide whether local HTTP server support is worth adding.
3. Decide whether public/team distribution is needed beyond private-repo release discipline.
4. Continue one-by-one agent calibration from completed examples and future real paper trials.
5. Revisit agents after real-use calibration.
