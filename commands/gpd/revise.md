---
name: gpd:revise
description: Apply approved feedback or run a controlled editorial pass on the current draft
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/revise.md
</execution_context>

<process>
Run the revise workflow.

Before any edit to `.paper/DRAFT.md` or another existing paper artifact, run the CLI preflight and capture the snapshot ID:

```bash
gpd revise --paper <paper-dir> --trigger <triggering-artifact>
```

If `gpd revise` is unavailable, stop and ask the user before falling back to `gpd snapshot --paper <paper-dir> --reason before_substantive_revision --trigger <triggering-artifact>`. Do not edit first and snapshot later.

After the edit, report the restore command printed by the CLI:

```text
Restore with gpd restore --paper <paper-dir> --snapshot <SNAPSHOT_ID> if this revision regresses quality.
```

Accepted intent flags:

- `--section <name>` - revise or edit only a named section.
- `--full` - revise or edit the whole draft. Use only when explicitly requested.
- `--editorial-review` - return an editorial plan only; do not modify `.paper/DRAFT.md`.
- `--style-pass` - tune tone, rhythm, and voice without changing thesis, claims, evidence, or structure.
- `--final-polish` - final prose pass after review is ready or remaining risk is explicitly accepted.
- `--light-edit` - copyedit and small clarity/rhythm fixes only.
- `--standard-edit` - default editorial intensity for clarity, flow, transitions, redundancy, and paragraph-level tightening.
- `--heavy-edit` - substantial line-and-structure edit of an existing draft; requires explicit request and drift checks.
</process>
