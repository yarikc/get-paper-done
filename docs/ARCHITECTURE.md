# Architecture Decisions

The full product contract lives in [DESIGN-SPEC.md](DESIGN-SPEC.md). This file records architectural decisions that should stay stable as the project evolves.

## System Shape

Get Paper Done is a prompt-first, file-backed workflow system with a small CLI helper.

The architecture has three boundaries:

```text
framework package
  commands, workflows, agents, templates, references, reusable profiles/audiences, CLI

installed runtime
  copied prompt assets under Claude or Codex runtime directories

paper workspace
  user-created paper directory containing original/ and .paper/
```

The framework package is not the paper workspace. Paper-specific state and source material must live in the paper directory.

## Decision 1: Files Are Memory

Durable writing context lives in `.paper/`, not chat history.

Implications:

- every stage reads explicit artifacts before acting
- agents should update artifacts instead of relying on prior conversation
- context can be cleared between stages without losing paper state
- raw source material is preserved separately from compressed reasoning artifacts

## Decision 2: Markdown For Humans, JSON For Machines

Human-facing artifacts remain Markdown. Machine-routable state uses JSON.

Current split:

- `STATE.md`: human-readable stage, blocker, approval, and next-action note
- `STATE.json`: CLI source of truth for status and validation
- `RESEARCH.json`: canonical structured evidence package
- `RESEARCH.md`: short human-readable research index

CLI code must read `STATE.json` first. Markdown parsing is allowed only as a legacy fallback for older workspaces.

## Decision 3: Strategy Can Block

`STRATEGY.md` is a gate, not commentary.

Blocking statuses:

- `Revise Before Drafting`
- `No-Go`

When blocked, downstream research, outline, drafting, revision, and editing stop unless the user explicitly overrides. `STATE.json` carries the operational blocker:

- `blocking_issues`
- `primary_blocker`
- `block_severity`
- `required_unblock_action`

## Decision 4: Research Is Compressed Before Use

Raw sources are not downstream context.

Paper-specific sources belong in:

```text
.paper/sources/
original/
```

Downstream stages should consume:

```text
.paper/RESEARCH.json
.paper/RESEARCH.md
```

Agents may inspect raw sources only to verify a specific claim or fill a targeted gap.

## Decision 5: Import Preserves Before Interpreting

Import is preservation-first.

`gpd import` and `/gpd-import-paper` copy source material into:

```text
original/
```

Import may create minimal setup artifacts and an import report, but it must not silently produce canonical research, outline, fact-check, or review artifacts. Those stages run separately so context can be reset.

## Decision 6: Audiences Are User Concepts, Agents Are Internal

Users choose audience personas. They should not have to select internal review agents.

Reusable audience personas live in:

```text
audiences/*.md
```

The paper-scoped audience file remains authoritative:

```text
.paper/AUDIENCE.md
```

Curated personas are reusable inputs, not final state.

## Decision 7: Runtime Install Uses Rewritten References

Source command files use a runtime-neutral placeholder:

```text
@{{GPD_RUNTIME_ROOT}}/get-paper-done/...
```

The installer rewrites command references for the target runtime:

- Claude target: usually `~/.claude`
- Codex target: usually `~/.codex`

Install/update must not touch user paper workspaces.

## Decision 8: CLI Modules Stay Small

CLI code is split by responsibility:

```text
bin/gpd.js              command router
bin/lib/installer.js    install, update, doctor
bin/lib/common.js       shared filesystem/path helpers
bin/lib/init.js         workspace initialization
bin/lib/import.js       preservation-first import
bin/lib/state.js        status and validation
bin/lib/workspace.js    thin public facade
```

New helpers should go into focused modules rather than expanding `workspace.js`.

## Decision 9: Review Proposes, Revision Applies

Review stages write findings and feedback plans. They do not edit drafts directly.

Draft changes happen only through revision/editing workflows after the user approves how to handle feedback.

## Decision 10: GSD Is An Inspiration, Not The Domain Model

GPD borrows durable context and staged workflow discipline from GSD, but the domain model is writing:

```text
persona -> audience -> brief -> strategy -> research -> outline -> draft -> fact-check -> review -> revise -> export
```

It should not inherit software-delivery concepts unless they directly improve writing workflow quality.
