# Data Products AI Scaling Example

This is a completed GPD paper workspace for an internal strategy paper about domain-aligned data products as an enterprise AI scaling pattern.

The example is intended to show the expected shape and quality of a completed `.paper/` workspace:

- strategy gate is `Go`
- research is represented in structured `RESEARCH.json`
- draft, fact-check, review, and export artifacts are present
- `gpd validate --semantic` passes cleanly
- `exports/FINAL.md` is the generated handoff artifact

Current workflow note: this is a grandfathered example from before mandatory
`PAPER-CONTEXT.md` and `DECISIONS.md`. New papers and new examples should
include both artifacts; see `examples/software-supply-chain-evidence-pack` for
the current shape.

## Known Limitations

This example is a regression and reference artifact, not proof that GPD generalizes across all paper types. It was produced from one internal strategy-paper trial and then repaired based on review feedback. It is useful for inspecting artifact shape, state progression, semantic gates, and export expectations; it is not a substitute for a broader cross-paper evaluation set.

The paper itself is also not publication advice or a complete public white paper. A public version would still need publication-grade citations, direct outcome evidence, organization-specific legal/compliance review, and a named organizational context.

## Calibration Notes

The example is intentionally included in automated validation so future changes do not regress a completed workflow. The feedback files that drove its calibration are kept as local review inputs under `docs/feedback*.md` when present; they are not part of the installable framework.
