<purpose>
Prepare the final draft for publication or handoff.
</purpose>

<required_reading>
- .paper/PROJECT.md
- .paper/BRIEF.md
- .paper/DRAFT.md
- .paper/REVIEW.md
- .paper/FACT-CHECK.md if present
- .paper/REVISION-CHECK.md if `.paper/DRAFT.md` changed substantively since the last review or export
</required_reading>

<process>

Read project, brief, draft, review, and fact-check if present.

If `REVIEW.md` verdict is not Ready, warn the user and ask whether to export anyway.

If `.paper/DRAFT.md` changed substantively since the last reviewed/exported version, require both a paper-local snapshot in `.paper/versions/` and `.paper/REVISION-CHECK.md` before treating the export as ready. Do not rely on structural or semantic validation alone. The revision check must compare against the saved snapshot and show no quality regression in thesis clarity, argument flow, evidence support, audience fit, persona and voice, ask clarity, and substance preservation unless the user explicitly accepted the tradeoff.

When using the CLI, `gpd export` refuses to overwrite an existing `.paper/exports/FINAL.md` with a newer `DRAFT.md` unless `REVISION-CHECK.md` is current and valid. It then automatically snapshots the existing export before overwriting it and records the snapshot in `.paper/REVISION-LOG.md`. This protects the reviewed reading copy. Do not manually overwrite `FINAL.md` without preserving the prior file.

If `FACT-CHECK.md` is missing and the draft contains factual, current, technical, market, regulatory, numerical, or publication-sensitive claims, warn the user and recommend `/gpd-fact-check --publication` before export. Ask whether to export anyway.

If `FACT-CHECK.md` has HIGH issues or claims marked "verify before publication", warn the user and ask whether to export anyway. Do not silently export unresolved high-risk claims.

Before final handoff, recommend running:

```text
gpd validate --semantic --paper <paper-dir>
```

If semantic validation reports HIGH issues, do not treat the export as final until the affected upstream artifact has been refreshed. MEDIUM issues require explicit user acknowledgement before example/publication use.

Create `.paper/exports/FINAL.md` with:

- final title
- publication-ready body
- citations or source links in the configured style
- optional metadata block if publication context requires it

Update `.paper/STATE.md` and `.paper/STATE.json` to mark the paper exported.

After export, tell the user:

- Review `.paper/exports/FINAL.md`.
- If they add comments directly to `FINAL.md` or a `.feedback` file, run `gpd feedback collect`, then `/gpd-feedback`.
- GPD will capture comments, ask for approval, revise `.paper/DRAFT.md`, and regenerate `FINAL.md`; users do not need to remember the full stage sequence.

</process>
