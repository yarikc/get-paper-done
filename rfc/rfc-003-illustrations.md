# RFC-003: Illustrations in the Paper Pipeline (Excalidraw)

- **Status:** Proposed
- **Author:** Project maintainer
- **Date:** 2026-05-11
- **Scope:** GPD pipeline extension — diagram authoring, rendering, and validation as a first-class lifecycle artifact
- **Tracking Issue:** [#12](https://github.com/yarikc/get-paper-done/issues/12)
- **Complements:** [RFC-004](./rfc-004-charts.md) (data charts via Vega-Lite); shares the same agent, pipeline slot, render command, and validator pattern
- **Supersedes:** an earlier exploratory charting draft that recommended Mermaid

## Summary

GPD today produces text-only papers. Executive strategy and architecture papers — the dominant use case — routinely need illustrations: architecture diagrams, lifecycle state diagrams, decision flows, layered conceptual diagrams. Authors today drop out of the pipeline, draw something in an external tool, paste an image back, and the diagram becomes a binary artifact disconnected from the rest of the paper's quality discipline.

This RFC adds illustrations as a first-class GPD artifact:

- A new `paper-illustrator` agent (one agent, two skills: this RFC covers the `diagram` skill; RFC-004 covers the `chart` skill) that runs after DRAFT and before FACT-CHECK
- Excalidraw JSON as the source-of-truth format
- SVG as the rendered output, committed alongside source
- Lifecycle-throughout rendering — diagrams visible in every viewer the paper is read in, not only at PDF export
- JSON-schema and semantic validators in the existing `bin/lib/semantic.js` pattern
- A copy-and-paste hand-edit roundtrip via excalidraw.com

Excalidraw was chosen over auto-layout alternatives (Mermaid, D2) because its source format includes explicit coordinates, so the AI controls layout directly instead of arguing with a layout engine. Hand-drawn aesthetic is acceptable for the bank-executive audience targeted today; if a more formal aesthetic is later required, the agent skill can swap rendering engines while the rest of the design holds.

---

## 1. Problem

GPD's quality pillars — strategy gate, audience review, fact-checking, opposition — apply only to prose. Illustrations live outside the pipeline entirely. Three concrete consequences:

1. **The lifecycle invariant breaks.** Diagrams produced externally appear only at PDF time. They are absent during drafting, review, and fact-checking. Reviewers cannot react to them in the same workflow as the prose.
2. **Validators cannot catch inconsistency.** When prose says "four lifecycle stages" but the diagram shows five, no gate fires. The defect ships.
3. **AI agents cannot iterate.** The drafter cannot adjust prose to match a diagram, and the fact-checker cannot flag a divergence, because the diagram is not an artifact the agents can read.

GPD's design ethos — prompt-first, file-based, validator-gated — extends naturally to diagrams if the diagram has a text source. The constraint is picking a format that the AI can generate, validators can lint, and the lifecycle can render at every stage.

### 1.1 Why not Mermaid

The earlier draft of this RFC recommended Mermaid because it renders natively in GitHub markdown. Direct author experience contradicts that: Mermaid's auto-layout (Dagre, ELK) produces generic-technical diagrams with frequent node overlap and crossing edges. For papers above roughly ten nodes or with cross-hierarchy edges, the author fights the engine. The default theme reads as wireframe, not executive-grade. Customization runs through theme variables, not direct manipulation.

The structural issue: when *layout is the content* — an architecture diagram showing platform layer above domain layer above consumer layer — an auto-layout engine guessing positions is the wrong model. The AI needs to *place things*, not request placement.

---

## 2. Why Excalidraw

| Property | Excalidraw | Mermaid | D2 |
|---|---|---|---|
| Source format | JSON with explicit x/y per element | DSL, layout engine derives coords | DSL, layout engine derives coords |
| AI controls layout | Yes (writes coords) | No (engine decides) | No (engine decides) |
| Rendering aesthetic | Hand-drawn, intentional informality | Generic technical | Designed-clean (often paid `tala` layout) |
| Markdown-native render | No (pre-render to image) | Yes (GitHub) | No (pre-render) |
| Cost | Free (Apache 2.0) | Free (MIT) | Free (MPL, but `tala` layout is paid) |
| MCP integration | Available in this Claude environment | None | None |
| Hand-edit workflow | Standard via excalidraw.com | Limited (text edit only) | Text edit only |

The explicit-coordinate model is the load-bearing reason. Every Excalidraw element carries `x`, `y`, `width`, `height`, `angle`, and style. Arrows have explicit endpoint bindings. The AI agent decides where things go and the layout is correct by construction. There is no layout engine to fight.

Cost is zero. The Excalidraw library is Apache 2.0, the web editor is free and self-hostable, and an MCP server already provides programmatic access in this Claude session.

The hand-drawn aesthetic is acceptable today. Anthropic, Stripe, Vercel, and most modern technical publications use Excalidraw-style figures in executive-facing materials. If a future paper requires a more formal aesthetic (board submissions, regulatory filings), the agent's `diagram` skill can swap the rendering engine while the rest of the pipeline (agent, pipeline slot, validator, hand-edit loop) remains intact.

---

## 3. The two-tool split (this RFC and RFC-004)

Two artifact categories with different mental models:

- **Illustrations** (this RFC) — *positioning carries the meaning.* Architecture, lifecycle, flow, layered diagrams. Excalidraw.
- **Charts** (RFC-004) — *data carries the meaning.* Bar, line, scatter, area, time series. Vega-Lite.

One tool cannot do both well. Excalidraw has no data binding; Vega-Lite has no concept of "labeled box with an arrow to another labeled box." Both formats are needed.

RFC-003 and RFC-004 share: the `paper-illustrator` agent, the pipeline slot, the render command, the validator pattern, and the hand-edit pattern. Only the rendering engine, the artifact directory, and the format-specific validators differ.

---

## 4. Design

### 4.1 Agent: `paper-illustrator`

One agent, two skills:

- `diagram` — produces Excalidraw JSON (this RFC)
- `chart` — produces Vega-Lite JSON (RFC-004)

The agent reads DRAFT.md and decides per-illustration which skill applies. The decision is mechanical: if the content is *positioning-as-meaning* (architecture, flow, state), use `diagram`. If *data-as-meaning* (counts, rates, distributions, trends), use `chart`. Mixed cases prefer two separate artifacts over one hybrid.

The agent contract follows the existing `agents/paper-*.md` pattern: front-matter, role, inputs (DRAFT.md, BRIEF.md, optional `illustration_requests` block), output artifacts, quality bar, escalation paths.

### 4.2 Pipeline location

After DRAFT, before FACT-CHECK.

Rationale:

- Real prose informs *what* to illustrate. Trying to illustrate from OUTLINE produces speculative diagrams that get redone after drafting.
- FACT-CHECK then validates *both* prose claims against sources and prose claims against illustration content. If prose says "four stages" and the diagram has five, that is a fact-check finding.
- Drafter is not blocked waiting for illustrations.

Trade-off: drafter cannot write "see Figure 1" before Figure 1 exists. For papers where illustrations augment prose rather than replace it, this is acceptable. If diagram-first prose flow is later needed, the order can flip — illustrations would move between OUTLINE and DRAFT.

### 4.3 Triggering

Two paths, both producing entries in the same illustration plan before generation.

**Agent-proposed.** Illustrator reads DRAFT.md and produces `.paper/illustrations/PLAN.md` first: a list of proposed figures with location (section), type (diagram vs chart), one-line content sketch. Author reviews and edits the plan. Then the agent generates JSON for each approved entry.

**User-requested.** Two surfaces:

- BRIEF.md adds an optional `illustration_requests:` block (explicit list of figures the user wants)
- DRAFT.md supports inline markers like `<!-- ILLUSTRATE: lifecycle state diagram -->`

Both surfaces feed into the plan file. The plan is the single source of what gets generated.

### 4.4 Artifact layout

```
.paper/illustrations/
  PLAN.md                    # illustration plan (agent-produced, user-editable)
  README.md                  # hand-edit copy-paste instructions per file
  lifecycle.excalidraw.json  # source
  lifecycle.svg              # rendered output
  architecture.excalidraw.json
  architecture.svg
```

Source JSON and rendered SVG are both committed. Rendered SVG is referenced from DRAFT.md and FINAL.md as a normal Markdown image pointing at the rendered file.

### 4.5 Render flow

`gpd render` is the new command. It walks every JSON source in `.paper/illustrations/`, renders to SVG, and writes alongside the source. It runs:

1. Automatically when the illustrator agent creates or updates a JSON file
2. Manually on demand (`gpd render` or `gpd render --illustrations`)
3. On a pre-commit hook (optional; helps catch stale renders before they ship)

Renderer toolchain (free, no cloud service): the `@excalidraw/excalidraw` package's export-to-SVG utilities run under Node with a `jsdom` polyfill, or via Puppeteer/Playwright headless rendering. Phase 1 picks one based on which produces consistent rendering of the hand-drawn Virgil/Cascadia typefaces.

### 4.6 SVG, not PNG

Decided: SVG.

Load-bearing rationale: bank executive papers are printed (high-DPI), projected (variable resolution), and read on retina displays. PNG at 1× DPI is blurry on retina; PNG at 3× is roughly 9× the file size for marginal future-proofing. SVG is one resolution-independent file that renders sharp at every scale.

Secondary wins:

- **Text-diffable PRs.** Reviewers see what changed in the XML, not two opaque image diffs.
- **Selectable text in exported PDF.** A reader can copy a label from the rendered diagram.
- **Smaller file size for typical diagram content.** Vector primitives are compact; ~10–30KB SVG versus ~100–300KB PNG at retina resolution.

Excalidraw's official SVG export embeds the hand-drawn font, so rendering is consistent across viewers. Phase 1 verifies this on the project's primary viewing surfaces (VS Code preview, GitHub, exported PDF).

### 4.7 Hand-edit roundtrip

For each rendered artifact, GPD writes copy-paste instructions to `.paper/illustrations/README.md`:

```
.paper/illustrations/lifecycle.excalidraw.json
  Edit on excalidraw.com:
    1. pbcopy < .paper/illustrations/lifecycle.excalidraw.json
    2. open https://excalidraw.com
    3. Cmd+V to paste; the diagram loads in the editor
    4. Edit; then File → Save to → Excalidraw file (.excalidraw)
    5. Replace .paper/illustrations/lifecycle.excalidraw.json with the saved file
    6. gpd render  (or commit; pre-commit hook re-renders)
```

Linux: `xclip -selection clipboard`. Windows: `clip`. The README is regenerated by the illustrator agent on every run so commands stay accurate.

No API integration is required. Clipboard plus browser is the entire loop.

---

## 5. Validation

Two layers, both deterministic, both in `bin/lib/semantic.js`.

### 5.1 JSON-schema validation

For each `*.excalidraw.json`:

- File parses as JSON
- Top-level `type === "excalidraw"`, `version` present, `elements` is an array
- Each element has required fields per type (rectangle, ellipse, arrow, text, freedraw): `id`, `type`, `x`, `y`, `width`, `height`
- Coordinates within reasonable bounds (catches obvious garbage; threshold tuneable in phase 1)

Implementation: `validateExcalidrawSchema` in `bin/lib/semantic.js`, following the shape of existing validators such as `validateProseSaturationInArtifact`.

### 5.2 Semantic validation

- Every illustration referenced in DRAFT.md has a matching `foo.excalidraw.json` source for its rendered `foo.svg` output.
- Every source JSON has a rendered SVG (catches missing render step).
- Rendered SVG's mtime ≥ source JSON's mtime (catches stale renders).
- No orphan arrows: every arrow's `startBinding.elementId` and `endBinding.elementId` exist in the elements array.
- No anonymous boxes that carry semantic weight: every rectangle or ellipse that has bound arrows has a child text element. Tuneable in phase 2.

Implementation: `validateIllustrationsArtifact`.

### 5.3 Out of scope for v1

- LLM-judge consistency between prose claims and illustration content. Named as future work; aligns with the deferred LLM-judge boundary tracked in the roadmap and follow-up issues.

---

## 6. CLI changes

| Command | Behavior |
|---|---|
| `gpd illustrate` | Invoke the illustrator agent (proposes plan, optionally generates artifacts) |
| `gpd illustrate --plan-only` | Generate `PLAN.md` without generating JSON yet |
| `gpd illustrate --request "lifecycle state diagram"` | Generate a specific illustration without proposing a plan |
| `gpd render` | Re-render all sources in `.paper/illustrations/` and (post-RFC-004) `.paper/charts/` |
| `gpd render --illustrations` | Render only illustrations |
| `gpd validate --semantic` | Existing command; adds illustration validation if `.paper/illustrations/` is present |

---

## 7. Phasing

**Phase 1 — plumbing (illustrations only).**

- `paper-illustrator` agent with `diagram` skill
- `.paper/illustrations/` artifact type
- `gpd render` command
- JSON-schema + semantic validators
- README.md hand-edit instructions
- One example illustration in `examples/data-products-ai-scaling/.paper/illustrations/`
- Tests under `tests/fixtures/` for valid and invalid illustration artifacts

Exit criteria: a paper can complete the pipeline end-to-end with one illustration; validators catch missing renders and orphan arrows; the example fixture passes `npm test`.

**Phase 2 — workflow integration.**

- Illustrator runs automatically after DRAFT, before FACT-CHECK, gated by config
- Fact-checker reads illustrations and flags prose-vs-illustration inconsistencies (deterministic rules first, LLM-judge deferred)
- BRIEF.md `illustration_requests` and DRAFT.md inline markers honored
- RFC-004 phase-1 (charts) lands in this phase

Exit criteria: end-to-end run of a strategy paper produces both illustrations and at least one chart without manual invocation.

**Phase 3 — polish.**

- Theme variables for output style (hand-drawn / clean / monochrome)
- LLM-judge tier for prose-vs-illustration consistency
- Pre-commit hook for stale renders
- More expressive hand-edit roundtrip (e.g., named-figure addressing in BRIEF.md)

Phases are independently shippable.

---

## 8. Open questions

1. **Renderer choice.** `@excalidraw/excalidraw` + jsdom versus Puppeteer/Playwright. Phase 1 decides based on font-rendering consistency. Both are free.
2. **PLAN.md format.** Markdown table with explicit columns versus free-form prose. Tabular is easier for validators; prose is easier for human editing. Default: tabular with a free-form notes column.
3. **Multi-section papers.** This RFC assumes one `.paper/illustrations/` directory per paper. If GPD later supports multi-section papers as separate sub-papers, illustrations may need sub-scoping.
4. **Stale-render detection beyond mtime.** Should each rendered SVG embed a checksum of its source so the validator can detect tampering between source and render without comparing mtimes? Defer to phase 2.
5. **Failure mode for direct-SVG edits.** If a user edits the rendered SVG directly (not the JSON), the next `gpd render` overwrites the edit. Detect and warn, or accept silently? Default: warn with a clear message pointing the user to the JSON source.

---

## 9. Sources

- Excalidraw — https://github.com/excalidraw/excalidraw (Apache 2.0)
- Excalidraw JSON schema — https://docs.excalidraw.com/docs/codebase/json-schema
- Mermaid flowchart layout — https://mermaid.js.org/syntax/flowchart.html
- D2 (terrastruct) — https://d2lang.com/ (MPL 2.0)
- Anthropic agent patterns (orchestrator-workers, evaluator-optimizer) — referenced in `rfc/rfc-001-research-driven-improvement-plan.md`
- Existing GPD validator shape — `bin/lib/semantic.js`
- Existing agent contract pattern — `agents/paper-drafter.md`, `agents/paper-fact-checker.md`
- Companion: `rfc/rfc-004-charts.md`
