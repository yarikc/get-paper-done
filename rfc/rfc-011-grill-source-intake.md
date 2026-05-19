# RFC: Grill source intake — prior papers and local sources

**Type:** Enhancement
**Area:** Grill, research, paper continuity
**Status:** Proposed

## Problem

The grill mechanism currently extracts thesis, audience, terms, scope, proof standard, and counterargument from a blank-slate conversation with the author. This works well for standalone papers but fails for two recurring scenarios that matter materially for serious technical and strategic writing:

### Scenario A: paper continuity

Strategic writing happens in series. A position paper argues for a direction. Six months later, a strategy paper builds the detailed plan. Twelve months later, an architecture paper specifies the implementation. Each paper extends, refines, or constrains its predecessors.

When the strategy paper is being grilled today, the prior position paper is invisible to the workflow. The author has to manually re-explain decisions, terms, audience, and the established direction. Three concrete failure modes follow:

1. **Vocabulary drift.** The strategy paper redefines a term that the position paper established, often without intending to.
1. **Decision regression.** The strategy paper revisits a question the position paper closed, instead of building on the closed decision.
1. **Audience inconsistency.** The strategy paper addresses a different reader than the position paper, breaking the series.

### Scenario B: local sources

The current research flow assumes sources are either user-provided files in `original/` (preservation-first import) or web-discoverable. The middle case is missing: local sources that are not part of the imported paper material but are relevant to the research.

Examples for the user’s banking context:

- Internal architecture standards documents
- Previous board papers and minutes
- Vendor proposals received in confidence
- Internal post-mortems and incident reports
- Regulatory correspondence
- A reference library of prior papers the author has written, organized as `references/`

Today, the author can manually mention these sources during research, but grill doesn’t know they exist, so it doesn’t ask whether they should be included, doesn’t ask which are relevant for which questions, and doesn’t establish a source-precedence rule (e.g., “internal standards override web-discoverable best practice”).

### Common root cause

Both scenarios are instances of the same underlying gap: **grill assumes the paper exists in isolation.** In practice, serious papers are nodes in a graph of prior work and parallel knowledge. The grill should know this graph exists and ask about it.

## Goals

- Add a source-intake phase to grill that asks the author about prior papers and local sources before extracting thesis and audience.
- Establish canonical inheritance rules: when grill detects a prior paper, terms and decisions from that paper are inherited unless the author explicitly overrides them.
- Allow local sources to be registered with grill so they appear in `RESEARCH.json` source planning with their precedence rules already encoded.
- Make the source graph an inspectable artifact — the author should be able to see what the new paper inherits from what.
- Preserve the grill’s blank-slate behavior when no prior papers or local sources exist.

## Non-goals

- Not a full document-management system. GPD doesn’t index your entire filesystem.
- Not automatic prior-paper discovery via heuristics. The author declares prior papers and sources explicitly during grill.
- Not a replacement for `gpd import`. Import is for bringing an external paper *into* GPD as a workspace. Source intake is for referencing material the new paper builds on.
- Not a citation manager. Local sources participate in research the same way web sources do.

## Conceptual model

A new paper in GPD has up to three relationships with prior material:

|Relationship  |Definition                                                                     |Example                                               |
|--------------|-------------------------------------------------------------------------------|------------------------------------------------------|
|**Extends**   |The new paper continues a prior paper’s argument or builds on its conclusions  |Strategy paper extends position paper                 |
|**References**|The new paper cites or builds on a prior paper but is not a direct continuation|Architecture paper references prior tech-debt memo    |
|**Sources**   |Local non-paper material informs the new paper’s research                      |Internal standards doc, board minutes, vendor proposal|

Each relationship has different inheritance semantics:

|Relationship|Terms inherited?       |Decisions inherited?   |Audience inherited?    |Warrants inherited?            |
|------------|-----------------------|-----------------------|-----------------------|-------------------------------|
|Extends     |YES (override possible)|YES (override possible)|YES (override possible)|YES (override possible)        |
|References  |NO                     |NO                     |NO                     |NO — but available for citation|
|Sources     |NO                     |NO                     |NO                     |NO — pure evidence inputs      |

## Design

### New grill phase: source intake

`/gpd-grill` gains a new opening phase that runs before thesis extraction. The grill agent asks:

> “Before we work on the paper itself: is this paper extending or continuing any prior paper you’ve written or imported into GPD? If yes, point me to it.”

> “Are there other prior papers — yours or external — that this paper should reference but not directly continue?”

> “Do you have local sources (internal docs, prior board materials, post-mortems, vendor proposals, internal standards) that should be available to research? If yes, what’s the directory or list of paths?”

> “For local sources, what’s the precedence rule? Do internal sources override web-discoverable sources, or are they peers?”

Each question is skippable. If the author says no to all three, grill proceeds in blank-slate mode exactly as today.

### New artifact: SOURCE-GRAPH.md

A new artifact in the grill outputs, written alongside `PAPER-CONTEXT.md` and `DECISIONS.md`:

```markdown
# Source Graph

## Extends

- **prior_paper**: `~/papers/data-products-position/`
  - **Inheritance:** terms (yes), decisions (yes), audience (yes), warrants (yes)
  - **Overrides at this paper:**
    - Audience: extends to include CTO-1 reports (was board only)
    - Term "data product" refined to add internal-classification scope

## References

- **referenced_paper**: `~/papers/ai-control-baseline/`
  - **Why:** cited for control-pattern reuse; not a continuation
  - **Inheritance:** none

## Sources

- **internal_standards**: `~/work/standards/`
  - **Precedence:** OVERRIDES web sources on internal architecture topics
  - **Files indexed:** 23
  - **Scope:** internal use only — never quoted directly in external papers

- **vendor_proposals**: `~/work/vendor-proposals/2025-Q4/`
  - **Precedence:** PEER to web sources
  - **Files indexed:** 7
  - **Scope:** internal only; cited only by topic, not by vendor name
```

`SOURCE-GRAPH.md` is human-readable; `SOURCE-GRAPH.json` is the machine-readable companion used by validators and the research agent.

### Inheritance mechanics

When grill detects an `Extends` relationship:

1. The prior paper’s `PAPER-CONTEXT.md` is read.
1. Canonical terms, relationships, and warrants are copied into the new paper’s `PAPER-CONTEXT.md` under an **Inherited** subsection.
1. The grill agent prompts the author: “These terms and warrants are inherited from the prior paper. For each, confirm: keep as-is, refine, or override?”
1. Refinements and overrides are recorded in `DECISIONS.md` with explicit reference to the prior paper. This produces an audit trail of how the series evolved.
1. The prior paper’s `BRIEF.md` thesis is summarized as the author-relative-position field in the new `BRIEF.md` (“This paper builds on [prior thesis] by…”).

When grill detects a `References` relationship:

1. The prior paper is registered as a citable source in `SOURCE-GRAPH.md`.
1. No inheritance occurs.
1. The research agent treats it as a known source available for citation when relevant.

When grill detects local `Sources`:

1. The source directory or file list is recorded in `SOURCE-GRAPH.md`.
1. The research agent’s source mode is automatically adjusted: if internal sources have OVERRIDES precedence, the research plan must consult them before web sources for topics in their scope.
1. Each local source is indexed (lightweight metadata: filename, size, date, optionally a one-sentence summary the author can provide or the agent can infer).

### Research integration

`paper-researcher` reads `SOURCE-GRAPH.json` before building the research plan. The plan output now includes:

```markdown
## Source lanes

### Lane 1: internal architecture standards (OVERRIDES web)
- Source: `~/work/standards/`
- Scope: internal architecture topics
- Files prioritized: [list]

### Lane 2: prior papers in series (REFERENCE)
- Source: `~/papers/data-products-position/`, `~/papers/ai-control-baseline/`
- Use: citation and continuity check

### Lane 3: vendor proposals (PEER to web)
- Source: `~/work/vendor-proposals/2025-Q4/`
- Scope: vendor-specific tradeoffs

### Lane 4: web sources (default)
- Mode: web-first for topics not covered by lanes 1–3
```

### Confidentiality flags

Each local source can be flagged with a confidentiality level:

- `quotable` — direct quotation allowed
- `paraphrase-only` — content can inform paper but not be quoted
- `topic-only` — paper can acknowledge the topic was researched but not the source

This matters for banking-context papers where vendor proposals or regulatory correspondence inform the argument but cannot appear in an external paper. The research agent and fact-checker both respect these flags.

### CLI surface

```
gpd source add --paper <path> --extends <prior-paper-path>
gpd source add --paper <path> --references <prior-paper-path>
gpd source add --paper <path> --local <directory> --precedence overrides|peer
gpd source list --paper <path>
gpd source remove --paper <path> --id <source-id>
```

These commands edit `SOURCE-GRAPH.md` directly and can be run after grill if sources change.

### Backward routing

If `SOURCE-GRAPH.md` changes after research has started (e.g., the author adds a new local source mid-flow), `gpd next` routes back to `/gpd-research` to update the research plan. Standard backward-routing pattern.

### Grill prompts when prior paper is detected

When the author names a prior paper, the grill agent reads its `PAPER-CONTEXT.md` and `BRIEF.md` and asks targeted questions instead of generic ones:

> “Your position paper established the term `data product` as [X]. Does this strategy paper use the same definition, refine it, or replace it?”

> “Your position paper argued that [Y]. Is this strategy paper building on that conclusion, revising it, or treating it as background context?”

> “Your position paper addressed [audience A]. Does this strategy paper address the same readers, a subset, or a different audience?”

This transforms grill from a generic interrogation into a continuity-aware interrogation — which is the right behavior when continuity exists.

### Validator additions

`bin/lib/semantic.js` gains source-graph rules:

1. If `SOURCE-GRAPH.md` declares `Extends`, the new paper’s `PAPER-CONTEXT.md` must show explicit inheritance decisions for prior paper’s terms and warrants (keep / refine / override).
1. If a local source has `confidentiality: paraphrase-only` and the draft quotes it directly, that’s a blocking issue at fact-check.
1. If `Extends` is declared but the new paper’s audience differs from the prior paper without an explicit decision record in `DECISIONS.md`, that’s a warning.

## Acceptance criteria

1. `/gpd-grill` includes a source-intake phase that runs before thesis extraction and is skippable for blank-slate papers.
1. `SOURCE-GRAPH.md` and `SOURCE-GRAPH.json` are produced when any prior paper or local source is declared.
1. When `Extends` is declared, the prior paper’s canonical terms, relationships, and warrants are inherited into the new paper’s `PAPER-CONTEXT.md` with explicit per-item keep/refine/override decisions.
1. `paper-researcher` reads `SOURCE-GRAPH.json` and produces a research plan with explicit source lanes for inherited, referenced, local, and web sources.
1. Local sources support `quotable`, `paraphrase-only`, and `topic-only` confidentiality flags, respected by the research agent and fact-checker.
1. CLI commands `gpd source add/list/remove` allow source-graph maintenance outside the grill flow.
1. Backward routing handles source-graph changes after research starts.
1. One worked example demonstrates a strategy paper extending a position paper, showing the inherited terms and the diff in `PAPER-CONTEXT.md`.
1. One worked example demonstrates local sources with OVERRIDES precedence, showing the research plan respecting the precedence rule.
1. Documentation includes guidance on confidentiality flags and their implications for fact-check and export.

## Risks

- **Inheritance leaks.** Inheriting too much from a prior paper risks the new paper being a slightly-edited version of the old one. Mitigate by requiring explicit per-item inheritance decisions, not bulk inheritance.
- **Stale prior context.** A prior paper’s `PAPER-CONTEXT.md` may itself be out of date by the time the new paper is written. The grill agent should ask whether prior decisions still hold, not just inherit them.
- **Source sprawl.** Allowing arbitrary local source directories invites including everything. Add a soft cap (e.g., 50 indexed files per local source) and warn beyond it.
- **Confidentiality bugs.** If a source flagged `paraphrase-only` slips into a direct quote, that’s potentially a real-world data leak. Validator must hard-block, not warn.
- **Inheritance complexity at scale.** Three papers deep, with refinements at each level, the inheritance graph becomes hard to reason about. Recommend limiting `Extends` chains to two levels — if a third paper extends the second, it inherits from the second, not transitively from the first.
- **Confidentiality of source paths.** `SOURCE-GRAPH.md` may itself contain sensitive paths (e.g., `~/work/regulatory-correspondence/`). Worth flagging in docs that this file shouldn’t be shared externally even if the paper itself can be.

## Open questions

1. Should references be transitive? If paper C extends B, and B references A, does C automatically reference A? Recommend no — keep the graph explicit per paper.
1. Should the system support `Supersedes`? When a strategy paper makes the prior position paper obsolete, that’s a useful relationship to record. Could be added as a fourth relationship type.
1. How should local sources be re-indexed when files change? Likely manual: `gpd source refresh --id <source-id>`. Auto-indexing is out of scope.
1. Should `SOURCE-GRAPH.md` participate in snapshots and revision-check? Yes — if source graph changes, revision check should flag it.
1. For the banking-specific scenario, should there be a `contexts/banking-internal-sources.md` pack that pre-declares common internal source types (board minutes, post-mortems, vendor proposals) with default confidentiality flags? Probably yes — same pattern as curated audiences.

## References

- The existing GPD `import` flow (preservation-first, separate from this RFC’s source intake but conceptually adjacent)
- The existing `contexts/` mechanism for reusable proof standards (this RFC is the source-graph analog)
- Domain-Driven Design’s notion of bounded context relationships (Shared Kernel, Customer-Supplier, Conformist) — the inheritance semantics here are a simplified version of those patterns

## Implementation phases

**Phase 1:** `SOURCE-GRAPH.md` schema + grill source-intake prompts; manual creation for one example paper extending another.
**Phase 2:** Inheritance mechanics — read prior `PAPER-CONTEXT.md` and prompt for keep/refine/override per item.
**Phase 3:** `paper-researcher` integration with source lanes and precedence rules.
**Phase 4:** Confidentiality flags, validator rules, CLI surface, backward routing for source-graph changes.