<purpose>
Generate the baseline-aware change report for the current draft candidate.
</purpose>

<process>

Parse flags:

- `--paper <path>`: existing paper workspace.
- `--json`: print the machine-readable compare result.
- `--dry-run`: show planned writes without updating `.paper/CHANGESET.md` or `.paper/CHANGESET.json`.

Use `gpd compare` when `.paper/accepted/ACCEPTED.md` exists and `.paper/DRAFT.md` is the candidate working copy.

The command writes:

- `.paper/CHANGESET.md`
- `.paper/CHANGESET.json`

The report compares accepted baseline to candidate draft and surfaces:

- pairwise verdict (`unchanged`, `changed_inconclusive`, or `regression_risk`)
- word-count delta
- removed and added headings
- changed spans with reason, source, expected benefit, risk, before excerpt, after excerpt, and status

Do not treat `changed_inconclusive` as approval. GPD cannot declare the candidate better than accepted without human review.

</process>

<success_criteria>
- `CHANGESET.json` validates against the change-set schema.
- `CHANGESET.md` makes removed material visible to the author.
- Status can show whether the latest change set is current for `DRAFT.md`.
</success_criteria>
