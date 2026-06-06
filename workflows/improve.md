<purpose>
Guide the author through the accepted-baseline improvement loop without rewriting, applying feedback, or declaring the candidate better.
</purpose>

<process>

Parse flags:

- `--paper <path>`: existing paper workspace.
- `--json`: print the machine-readable guidance result.

Use `gpd improve` when the author wants to know what to do next after accepting a baseline or editing the candidate draft.

The command is read-only. It inspects:

- accepted baseline state from `.paper/accepted/ACCEPTED.md` and `.paper/accepted/ACCEPTED.meta.json`
- draft freshness since accept
- current/stale state of `.paper/CHANGESET.json`
- CHANGESET verdict, changed span count, advisory count, word delta, and structural/advisory summaries

Guidance rules:

- If no accepted baseline exists, tell the author to read the current paper and run `gpd accept` only if it is the human-approved baseline.
- If `DRAFT.md` changed since accept and no current CHANGESET exists, tell the author to run `gpd compare`.
- If a current CHANGESET exists, tell the author to review `CHANGESET.md` and decide whether to accept, revise, or continue manually.
- If the current CHANGESET reports `regression_risk`, tell the author not to accept yet.
- If `DRAFT.md` has not changed since accept, tell the author no candidate change is pending.

Do not rewrite prose. Do not call external review. Do not run `gpd accept` automatically. Do not treat `changed_inconclusive` as approval.

</process>

<success_criteria>
- The output names the current stage and one concrete next action.
- The guidance never bypasses the accepted baseline.
- The command remains read-only.
</success_criteria>
