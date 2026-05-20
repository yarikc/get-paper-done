# RFC-4: Data Charts in the Paper Pipeline (Vega-Lite)

- **Status:** Proposed
- **Author:** Project maintainer
- **Date:** 2026-05-11
- **Scope:** GPD pipeline extension — quantitative chart authoring, rendering, and validation as a first-class lifecycle artifact
- **Tracking Issue:** [#13](https://github.com/yarikc/get-paper-done/issues/13)
- **Complements:** [RFC-3](./RFC-3-illustrations.md) (illustrations via Excalidraw); shares the same agent, pipeline slot, render command, hand-edit pattern, and validator shape
- **Supersedes:** none

## Summary

GPD papers routinely make quantitative claims — cost categories, effort distributions, incident counts over time, before/after comparisons. Today these claims live as prose tables or are absent entirely. This RFC adds data charts as a first-class GPD artifact via Vega-Lite, paired with RFC-3's illustration support to cover both halves of paper graphics.

The chart skill lives in the same `paper-illustrator` agent introduced in RFC-3. Vega-Lite was chosen because it is a data-bound declarative tool: the AI describes data + mark + encoding, the tool computes the layout. The author does not do chart geometry. This is the opposite of Excalidraw's explicit-coordinate model — and the right model for charts, where data structure should drive the visual.

Most of the design is shared with RFC-3. This RFC covers only the chart-specific deltas: the skill, the artifact directory, data handling, and chart-specific validation.

---

## 1. Problem

Quantitative claims in executive papers — *"~6× compression in time-to-paper"*, *"40% of cost in run, 25% in integration"*, *"incident rates by quarter"* — read flat as prose. A chart turns those claims into something the reader can scan and compare. Without charts, papers either drop the claims (less convincing) or wrap them in dense tables (less scannable).

The structural issue: charts cannot be authored well in Excalidraw. Reasons:

- Excalidraw has no data binding. To draw a bar chart of [Q1, Q2, Q3, Q4] costs, the AI computes bar heights, axis positions, and tick locations manually. Brittle. Wrong when data updates.
- Excalidraw has no statistical primitives — no axis scales, no log/linear toggles, no automatic legend, no aggregation.
- The result of forcing Excalidraw into chart duty is a static "drawn" chart with no semantic data behind it. Future iteration becomes hand-redrawing.

Vega-Lite reverses the model. The author writes data + mark + encoding; the tool produces the chart. The AI generates well-formed specs because every model has been trained extensively on Vega-Lite.

---

## 2. Why Vega-Lite

| Property | Vega-Lite | Chart.js | Plotly | matplotlib |
|---|---|---|---|---|
| Source format | Declarative JSON | Config + JS | Config + JS | Python script |
| Text-source AI-generatable | Yes | Partial (JS) | Partial (JS) | Yes |
| Rendering toolchain | `vega-cli` (Node, free) | Browser-bound | Browser or `kaleido` | Python runtime required |
| Output | SVG / PNG / PDF | Canvas | PNG / SVG | PNG / SVG |
| Schema-validatable | Yes (official JSON Schema) | Limited | Limited | N/A |
| License | BSD-3 | MIT | MIT | PSF |
| Statistical primitives | Strong | Limited | Strong | Strong |
| Integration with GPD pipeline | Mirrors RFC-3 exactly | More JS surface | More JS surface | Adds Python dependency |

Vega-Lite is the right choice on text-source, AI-generation quality, schema validation, and pipeline shape: JSON source committed, SVG render committed, validators in `bin/lib/semantic.js`. It is free and BSD-3 licensed.

Worth flagging: **Observable Plot** has a similar declarative model and slightly better defaults. It is not chosen here primarily because Vega-Lite has more AI training corpus and a longer-stable schema. If Observable Plot proves to produce better-looking executive charts with similar AI quality, the decision can flip — the agent skill encapsulates the choice.

---

## 3. What is shared with RFC-3

Everything except the rendering engine, the artifact directory, and a few format-specific validators. Specifically:

| Concern | Shared mechanism | Reference |
|---|---|---|
| Agent | `paper-illustrator` (one agent, two skills) | RFC-3 §4.1 |
| Pipeline slot | After DRAFT, before FACT-CHECK | RFC-3 §4.2 |
| Triggering | Agent-proposed via `PLAN.md`; user-requested via BRIEF.md or DRAFT.md markers | RFC-3 §4.3 |
| Render command | `gpd render` | RFC-3 §4.5 |
| Render output format | SVG | RFC-3 §4.6 |
| Hand-edit roundtrip | Copy/paste with provided commands; instructions in README.md | RFC-3 §4.7 |
| Validator pattern | JSON-schema + semantic; `bin/lib/semantic.js` | RFC-3 §5 |
| CLI shape | `gpd illustrate`, `gpd render` | RFC-3 §6 |

Phases (RFC-3 §7) are also shared: charts land in **phase 2**, after illustrations are stable in phase 1. This RFC is the design for phase 2's chart additions.

---

## 4. Chart-specific design

### 4.1 Chart skill in `paper-illustrator`

The same agent contract as the illustration skill (RFC-3 §4.1). The skill is invoked when the agent decides the content is *data-as-meaning*: counts, rates, distributions, trends, before/after comparisons, multi-series time data.

Decision heuristics for the agent:

- If the prose contains quantitative comparisons across three or more categories → chart
- If the prose contains a trend over time → chart
- If the prose contains a distribution or breakdown → chart
- If the data could fit in a small inline table without losing clarity → prefer the table; no chart
- Mixed cases (data + structural diagram) produce two separate artifacts, one per skill

### 4.2 Artifact layout

```
.paper/charts/
  README.md                       # hand-edit copy-paste instructions per chart
  cost-by-category.vega.json      # spec source
  cost-by-category.svg            # rendered output
  data/
    cost-by-category.csv          # optional separate data file (see §4.3)
```

Source spec and rendered SVG are both committed, same as illustrations. Charts reference data either inline (in the JSON spec's `data.values`) or via a sibling file under `.paper/charts/data/`.

The illustration `PLAN.md` (RFC-3 §4.4) covers both illustrations and charts (see Open Questions §7.1 for the placement decision).

### 4.3 Data handling

Two storage modes:

**Inline data.** For small datasets (roughly ≤ 30 rows), the data lives in the spec's `data.values` field. Single-file artifact. Easy to AI-generate, easy to validate, easy to hand-edit.

**External data.** For larger or reused datasets, the spec references `data.url: "./data/cost-by-category.csv"`. Data lives separately. Allows multiple charts to share a dataset and supports the future case where data is updated independently of the chart.

Default: inline. Switch to external only when (a) the same data backs more than one chart, or (b) the dataset is large enough that inline JSON becomes unwieldy.

### 4.4 Render flow

`gpd render` (defined in RFC-3 §4.5) walks `.paper/charts/*.vega.json` and renders each to SVG using `vega-cli` (`vl2svg`). Free, BSD-3, npm-installable. No Python, no headless browser.

Renderer choice notes:

- `vl2svg` produces deterministic output for fonts available in standard environments.
- Output is reasonably compact; typical chart SVG is 5–20KB.
- Vega-Lite's `config` field is the customization point for theme — set once at the project level for consistent styling across all charts.

### 4.5 Hand-edit roundtrip

For each rendered chart, GPD writes copy-paste instructions to `.paper/charts/README.md`:

```
.paper/charts/cost-by-category.vega.json
  Edit on the Vega Editor:
    1. pbcopy < .paper/charts/cost-by-category.vega.json
    2. open https://vega.github.io/editor/
    3. Switch to Vega-Lite mode (top-left dropdown)
    4. Cmd+V into the JSON editor; the chart renders in the right pane
    5. Edit; copy the JSON back
    6. Replace .paper/charts/cost-by-category.vega.json with the edited spec
    7. gpd render  (or commit; pre-commit hook re-renders)
```

Linux and Windows clipboard equivalents identical to RFC-3 §4.7.

---

## 5. Chart-specific validation

### 5.1 JSON-schema validation

Vega-Lite ships an official JSON Schema. Phase-2 implementation imports the schema and validates each `*.vega.json`:

- Spec parses as JSON
- `$schema` field present and recognized (Vega-Lite v5)
- `mark` is one of the supported marks (`bar`, `line`, `point`, `area`, `rect`, etc.)
- `encoding` references at least one of `x` or `y` (catches half-formed specs)
- `data` is present (either `values` or `url`)

Implementation: `validateVegaSchema` in `bin/lib/semantic.js`.

### 5.2 Semantic validation

- Every chart referenced in DRAFT.md (`![](./charts/foo.svg)`) has a matching `foo.vega.json` source.
- Every source spec has a rendered SVG (catches missing render).
- Rendered SVG's mtime ≥ source spec's mtime (catches stale renders).
- For inline data: every `encoding` field references a column that exists in `data.values`.
- For external data: `data.url` resolves to a file under `.paper/charts/data/`, and the file is parseable as CSV or JSON.

Implementation: `validateChartsArtifact`.

### 5.3 Out of scope for v1

- Statistical-claim consistency: chart says one thing, prose claims another (e.g., chart shows 35% but prose says "roughly 40%"). Named as future LLM-judge work.
- Data-source provenance: does `data/cost-by-category.csv` derive from a source listed in `RESEARCH.json`? Future work; ties into fact-checker integration.

---

## 6. CLI deltas

| Command | Behavior |
|---|---|
| `gpd illustrate --chart-only` | Generate only charts, skipping diagrams |
| `gpd render --charts` | Render only charts |
| `gpd validate --semantic` | Adds chart validation if `.paper/charts/` is present |

All other commands inherit RFC-3 behavior.

---

## 7. Open questions

1. **PLAN.md placement.** RFC-3 puts `PLAN.md` under `.paper/illustrations/`. Should charts share that file (one combined plan), or maintain a separate `.paper/charts/PLAN.md`? Recommendation: one combined plan at `.paper/PLAN.md` covering both, since the illustrator agent reasons across the whole paper. Decide alongside RFC-3 phase 1.
2. **Data column naming.** When data lives external to the spec, should column names follow a convention (snake_case, lower-case)? Default: accept whatever the agent produces; revisit if AI output drifts.
3. **Chart density limits.** Vega-Lite renders charts with thousands of points. For executive papers, charts above ~50 visual elements lose clarity. Should there be a validator that warns above a threshold? Defer to phase 3.
4. **Shared data across charts.** If two charts reference the same external file, the validator should accept it and not warn. The current §5.2 sketch handles this; verify in phase 2.
5. **Color palette.** Bank-executive papers benefit from a consistent restricted palette. Set in phase 3's project-level config; default Vega palette acceptable in phase 2.

---

## 8. Sources

- Vega-Lite — https://vega.github.io/vega-lite/ (BSD-3)
- Vega-Lite JSON Schema — https://vega.github.io/schema/vega-lite/v5.json
- vega-cli — https://github.com/vega/vega/tree/main/packages/vega-cli
- Vega Editor — https://vega.github.io/editor/
- Observable Plot (considered, not chosen) — https://observablehq.com/plot/
- Existing GPD validator shape — `bin/lib/semantic.js`
- Existing agent contract pattern — `agents/paper-drafter.md`, `agents/paper-fact-checker.md`
- Companion: `rfc/RFC-3-illustrations.md`
