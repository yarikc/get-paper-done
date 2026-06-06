<purpose>
Promote the current reviewed draft or export to the accepted baseline so future revisions compare against a human-approved reference.
</purpose>

<process>

Parse flags:

- `--paper <path>`: existing paper workspace.
- `--source <draft|final>`: optional source artifact. Defaults to `final` when `.paper/exports/FINAL.md` exists, otherwise `draft`.
- `--note <text>`: optional acceptance note.
- `--notes <text>`: optional acceptance note.

Use `gpd accept` only after the user has read and accepted the paper. This is a deliberate promotion step, not a side effect of export, review, or status.

The command writes:

- `.paper/accepted/ACCEPTED.md`
- `.paper/accepted/ACCEPTED.meta.json`
- `STATE.json.accepted`
- `STATE.md` accepted-baseline fields

Do not rewrite `.paper/DRAFT.md` or `.paper/exports/FINAL.md`.

</process>

<success_criteria>
- `.paper/accepted/ACCEPTED.md` contains the promoted source content.
- `.paper/accepted/ACCEPTED.meta.json` records accepted time, source artifact, and source/draft/final hashes.
- `gpd status` shows the accepted baseline and whether `DRAFT.md` has changed since acceptance.
</success_criteria>
