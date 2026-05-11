<purpose>
Prepare the final draft for publication or handoff.
</purpose>

<required_reading>
- .paper/PROJECT.md
- .paper/BRIEF.md
- .paper/DRAFT.md
- .paper/REVIEW.md
- .paper/FACT-CHECK.md if present
</required_reading>

<process>

Read project, brief, draft, review, and fact-check if present.

If `REVIEW.md` verdict is not Ready, warn the user and ask whether to export anyway.

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

</process>
