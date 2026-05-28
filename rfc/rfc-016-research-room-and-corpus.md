# RFC-016: Research Room and Cross-Paper Research Corpus

**Status**: Proposed
**Author**: User
**Date**: 2026-05-25
**Origin**: Surfaced during a project review showing that GPD already persists rich research per paper but does not present a user-reviewable "room" before drafting, has no duplicate detection across `original/` and `.paper/sources/`, and has no cross-paper reuse path. The same review observed that revision-stage regression issues compound when downstream agents work from an unreviewed source set.
**Sequencing**: Phase 1 (local research room) is independent and unblocked. Phase 2 (global corpus) depends on RFC-013.1-style global workspace infrastructure (issue #19 territory) landing first. Both compound with RFC-007 (#32) — the eval harness becomes a fair judge of research quality once the room is the reviewable artifact.

## Summary

Add a user-reviewable "research room" artifact that the user approves before drafting begins. The room captures source inventory, authority hierarchy, duplicate detection, version family tracking, and missing-context surfacing as a first-class human-review surface. Phase 2 extends this with a cross-paper corpus that lets new papers reuse research from prior papers, saving token cost and strengthening external-feedback recovery.

This RFC builds on existing GPD infrastructure (`RESEARCH.json` source registry, `RESEARCH.md` summary, `original/` and `.paper/sources/` conventions) and extends RFC-011 (#36, SOURCE-GRAPH for grill-time prior-paper relationships) and RFC-013.1 (global workspace pattern). It explicitly does not replace any of these.

## Problem

### Three concrete gaps in current research handling

#### Gap 1: no user-reviewable inventory before drafting

GPD's `templates/research.json` already defines a rich `source_registry` (authority, freshness, relevance, specificity, bias, stance, claim_support fidelity) and `source_ranking` (rank, rank_group, role, ranking_reason). The workflow at `workflows/research.md` presents an `expected_source_checkpoint` to the author during research. But the canonical output is a 142 KB JSON file plus a flat human summary that the user typically does not inspect before drafting.

Downstream agents read `RESEARCH.json` and produce outline, draft, fact-check, and review. If the source set is wrong — wrong authority ranking, the wrong paper in the lead, a superseded version of a regulatory document, an absent counterevidence lane — the user only discovers it late, in review or external feedback. The cost compounds: token-expensive drafting, fact-checking, and revision all operate on bad inputs.

The user cannot easily answer the question "what does GPD think the source set is and why does it rank these sources in this order?" without reading 142 KB of JSON.

#### Gap 2: no duplicate detection or version family tracking

`original/` and `.paper/sources/` directories can accumulate multiple versions of the same source (e.g., draft and final of an internal standard; an older and newer report from the same organization). The framework does not detect duplicates, does not propose a current version, and does not flag version families. Bad synthesis starts here: agents blend two versions of a plan, average two reports of the same data, or cite a superseded document because it was attached to a later email.

This is true even within a single paper. It is more true across papers.

#### Gap 3: no cross-paper research reuse

Each new paper rebuilds its research from scratch. Sources identified, ranked, and used in a prior paper are invisible to the next paper, even if the topics overlap. The cost is concrete:

- Token cost: web search, source evaluation, source ranking, and claim mapping run again for the same sources.
- Quality cost: external feedback on a new paper often asks for evidence the framework already has, but cannot consult, in a prior paper's `RESEARCH.json`.
- Recovery cost: when external feedback identifies an evidence gap, the recovery loop (issue #49) has no corpus to consult — it either re-researches or invents.

GPD's existing `contexts/` mechanism is the right architectural pattern (reusable cross-paper resources) but currently contains only a `README.md`. RFC-013.1 proposes a global workspace for profiles/audiences/contexts but explicitly excludes research from its structure.

### Common root cause

The framework treats research as a *step in the pipeline* rather than a *reviewable surface*. The blog post that motivated this RFC frames it as moving from generation to preparation: the bottleneck has shifted from "can the model produce the artifact" to "is the source set in shape for the model to do anything useful with it." GPD's current research stage produces a rich machine-readable artifact and a flat human summary, but neither functions as the reviewable room the user can inspect, correct, and approve before downstream work commits resources.

## Decision

Adopt a two-phase Research Room model:

**Phase 1 (Local Research Room)**: per-paper user-reviewable inventory artifact (`SOURCE-INVENTORY.md`) plus missing-context surfacing (`MISSING-CONTEXT.md`), duplicate detection across `original/` and `.paper/sources/`, version family tracking with explicit current/superseded marking, and a user approval gate before outline begins.

**Phase 2 (Global Research Corpus)**: per-user persistent research store at the global workspace level (compatible with RFC-013.1's `~/.gpd/global/` pattern) containing reusable source records, a claim graph across papers, topic clustering for retrieval, and explicit promotion-from-paper semantics. New papers consult the corpus during research; fact-check and external-feedback recovery (#49) can also consult it.

Phase 1 ships first and is unblocked. Phase 2 ships after RFC-013.1 / #19 lands the global workspace foundation.

## Relationship to existing GPD infrastructure

This RFC does not replace or duplicate existing pieces; it extends and connects them.

| Existing piece | Role under this RFC |
|---|---|
| `RESEARCH.json` (rich, machine-readable) | Stays canonical for the research step's full output. `SOURCE-INVENTORY` is derived from it for human review. |
| `RESEARCH.md` (flat human summary) | Stays as the post-review research narrative. `SOURCE-INVENTORY.md` is the pre-draft user-approval surface — they serve different purposes. |
| `templates/research.json` `source_registry` schema | Reused as the underlying schema. `SOURCE-INVENTORY` adds Dublin Core / DataCite supersession fields and dedup metadata. |
| `original/` and `.paper/sources/` directories | Both indexed by the inventory; duplicate detection runs across both. |
| RFC-011 / #36 (SOURCE-GRAPH.md, grill-time) | Stays scoped to grill-time prior-paper relationships (Extends / References / Sources). `SOURCE-INVENTORY` is the research-stage analog. They reference each other but are distinct artifacts. |
| RFC-013.1 (global workspace pattern, parked) | Phase 2 corpus storage lives under the same global workspace tree. |
| #19 (reusable central resources) | Phase 2 corpus is a child concern of #19's resource pattern. |
| `IMPORT.md` (per-paper import inventory) | Inventory grows from `IMPORT.md` if present; otherwise built fresh. |
| #45 (ARGUMENT-SPINE.md) | Spine is the argument synthesis layer; inventory is the source synthesis layer. They can both exist; they answer different questions. |
| #48 / #49 (revision regression gate + recovery) | Cleaner room means fewer downstream regressions. Recovery loop consults the corpus (Phase 2) instead of re-researching. |

## Design principles

1. **The room is a user-reviewable artifact, not implicit state.** `SOURCE-INVENTORY.md` is the canonical human surface. `RESEARCH.json` remains the machine-readable canonical store; the inventory is a structured view derived from and gating against it.
2. **No silent resolution.** Duplicates, version conflicts, and supersession decisions are surfaced for user approval. The framework proposes; the user decides. Auto-resolve is forbidden.
3. **Mechanical first, judgment second.** Duplicate detection, hash comparison, version-family clustering, and authority-rank consistency checks are deterministic. Judgment-side checks (is this source relevant? is the ranking right?) require user review or independent runtime scoring.
4. **Reuse standards rather than mint new ones.** Dublin Core for minimum metadata. DataCite relations for supersession. PROV-O for derivation. CSL-JSON for citation-style records. TLSH for near-duplicate detection. LlamaIndex IngestionPipeline patterns for the state machine. See "Reused standards" section.
5. **Single-paper workflow stays simple.** Phase 1 is opt-in for short papers and update memos; it is the default for papers with `classification.purpose = strategy_paper`, `decision_memo`, or any paper marked `regulated` or `external_high` in `config.json`.
6. **Per-paper isolation by default; corpus is explicit opt-in.** Phase 2 sources only join the corpus when the user explicitly promotes them. This matches RFC-013.1's privacy discipline for regulated/enterprise users.
7. **Drift is visible.** Source currency, supersession, and corpus sync state appear in `gpd status`. The framework does not silently rely on stale sources.

## Non-goals

- Not replacing `RESEARCH.json` or `RESEARCH.md`. Both keep their current roles.
- Not building a full document management system. The room is a unit of work, not infrastructure.
- Not building a vector store or RAG retrieval engine. Phase 2 retrieval starts with metadata-and-topic filtering; semantic search is deferred to a follow-up RFC if needed.
- Not auto-promoting sources to the global corpus. Promotion is explicit user action.
- Not redefining the research workflow. The room is a new artifact and gate, not a new workflow.
- Not a citation manager. Sources still participate in research the way they do today; CSL-JSON is the schema, not a feature.
- Not changing existing `RESEARCH.json` schema in incompatible ways. Phase 1 adds optional fields; reads remain backward-compatible.

## Alternatives considered

### Option A: Stay with the current `RESEARCH.json` + `RESEARCH.md` pair

**Pros**: no new artifacts; no new workflow gates; backward compatible.
**Cons**: the user-review gap remains; duplicate detection still absent; no cross-paper reuse path; downstream agents continue to drift on unreviewed source sets.

### Option B: Add a research-stage gate but no new artifact

Gate `/gpd-research` completion behind a user approval step that points at the existing `RESEARCH.md`.

**Pros**: smaller change; reuses existing artifacts.
**Cons**: `RESEARCH.md` is a research narrative, not an inventory. It does not surface duplicates, version families, or missing context as separate review items. The user is forced to read a long summary and infer the review questions instead of working from a structured surface.

### Option C: Build a new inventory artifact, keep `RESEARCH.json` canonical, add a gate (this RFC)

**Pros**: structured review surface; supports duplicate detection and version families as first-class fields; supports cross-paper reuse in Phase 2; reuses standardized schemas (Dublin Core, DataCite, PROV-O, CSL-JSON); aligns with the existing FEEDBACK-PLAN approval-gate pattern.
**Cons**: introduces new artifacts and a new gate; users writing short papers may find the room overkill (mitigated by opt-in per classification).

### Option D: Build a global research corpus first, paper-room second

**Pros**: solves token-cost concern immediately.
**Cons**: without a per-paper room, the corpus has no clean ingestion surface; sources arrive in the corpus with no per-paper review history; quality of the corpus depends on per-paper review discipline that does not exist yet. Wrong sequencing.

**Decision**: Option C. The per-paper room is the foundation; the corpus is its natural extension.

## Definitions

### Research room

The bounded workspace for one paper's research. Comprises the existing `original/`, `.paper/sources/`, `RESEARCH.json`, and `RESEARCH.md`, plus the new `SOURCE-INVENTORY.md`, `SOURCE-INVENTORY.json`, and `MISSING-CONTEXT.md` artifacts.

### Source inventory

The user-reviewable catalog of sources for one paper. Includes authority ranking, version family marking, duplicate log, claim-mapping summary, and approval status. One inventory per paper.

### Authority ranking

A user-approved ordering of sources by suitability for the paper's claims. Reuses GPD's existing `source_ranking[*].rank_group` field plus GRADE-style authority dimensions (bias, currency, consistency, indirectness).

### Version family

A set of sources that represent the same underlying document at different points in time or different formats. One member is marked `current`; others are marked `superseded`. Uses DataCite relations (`IsNewVersionOf`, `IsPreviousVersionOf`, `Obsoletes`).

### Duplicate

Two or more sources that share content at the byte level (exact duplicates) or share content above a similarity threshold (near duplicates). Detected via sha256 (exact) and TLSH (near). Never auto-resolved.

### Missing context

A surfacing of three classes of gap: (1) what is missing (claims without source coverage, lanes that are thin), (2) what is ambiguous (sources in conflict without a winner declared, version unresolved), (3) what is dangerous (unsupported claims, inference presented as fact, sources with `paraphrase-only` confidentiality flagged for direct quotation). One `MISSING-CONTEXT.md` per paper.

### Research corpus (Phase 2)

A persistent cross-paper store of source records, claims, and topic clusters. Lives at the global workspace level. Sources arrive in the corpus only by explicit user promotion from a paper's inventory.

### Promotion

The explicit user action of moving a source from a paper's inventory to the corpus. Promotion is the only path into the corpus; sources never auto-promote.

## Phase 1: Local Research Room

### 1.1 New artifacts

Three new artifacts per paper, all under `.paper/`:

| Artifact | Format | Purpose |
|---|---|---|
| `SOURCE-INVENTORY.md` | Markdown | User-reviewable inventory: authority hierarchy, source records, duplicate log, version families, coverage matrix, approval section |
| `SOURCE-INVENTORY.json` | JSON | Machine-readable companion. Schema documented below. Drives validators and downstream agent reads. |
| `MISSING-CONTEXT.md` | Markdown | User-facing gap surface: missing, ambiguous, dangerous |

Plus updates to existing artifacts:

| Artifact | Update |
|---|---|
| `.paper/STATE.json` | New field `research_room_status` enum: `pending`, `inventory_drafted`, `user_review`, `approved`, `superseded_by_research_refresh` |
| `RESEARCH.json` | New optional top-level field `inventory_link` pointing at `SOURCE-INVENTORY.json`; preserved for backward compatibility |
| `templates/feedback-plan.md` analog | New template `templates/source-inventory.md` for inventory rendering |

### 1.2 `SOURCE-INVENTORY.md` structure

User-reviewable artifact with required sections in this order:

```markdown
# Source Inventory

**Created:** [ISO timestamp]
**Source:** `.paper/RESEARCH.json` (canonical)
**Status:** Pending user approval | Approved by user | Superseded by research refresh
**Classification:** [paper classification.purpose]

## Summary

[3-5 sentences naming the source set this paper relies on, the authority pattern,
and the load-bearing sources.]

## Authority Hierarchy

| Rank Group | Source IDs | Why |
|---|---|---|
| Primary anchor | S1, S2 | [What makes these primary for this paper's claims] |
| Strong support | S3, S4, S5 | [Why these strongly support without anchoring] |
| Background context | S6, S7 | [Why these inform but don't carry claims] |
| Counter-evidence | S8 | [What this contests] |

## Source Records

### S1: [Title]

- **Type:** official | academic | industry | analyst | news | blog | internal | other
- **Identifier:** [DOI, URL, or local path]
- **Date:** [Publication date]
- **Authority dimensions:**
  - Bias risk: low | medium | high
  - Currency: current | dated | stale
  - Consistency: consistent | mixed | contested
  - Indirectness: direct | indirect | inferential
- **Supports claims:** C1, C3
- **Use in paper:** [1 sentence: how this source should be used]
- **Limitations:** [What this source cannot support]
- **Confidentiality:** quotable | paraphrase-only | topic-only
- **Version family:** [Family ID if part of a family, or single]
- **Status:** current | superseded | unknown
- **Provenance:**
  - Origin: web fetch | local file in original/ | local file in .paper/sources/ | imported
  - Path: [absolute or relative path]
  - sha256: [hash]
  - tlsh: [hash if applicable]

[Repeat per source, ordered by rank group and rank]

## Duplicate Log

### Exact duplicates

- **D1**: Files identical at sha256 level
  - `original/file-a.pdf`
  - `.paper/sources/file-a-copy.pdf`
  - Proposed: keep `original/file-a.pdf`; drop the copy.
  - User decision: pending | approved | overridden

### Likely duplicates

- **D2**: Similar content (TLSH score 12, threshold 30)
  - `original/regulatory-doc-v1.pdf`
  - `original/regulatory-doc-v2.pdf`
  - Proposed: version family — see Version Families
  - User decision: pending | approved | overridden

[None if no duplicates detected]

## Version Families

### F1: [Document name]

- **Family ID:** F1
- **Current:** S2 (`original/regulatory-doc-v2.pdf`, date 2026-04-15)
- **Superseded:**
  - S3 (`original/regulatory-doc-v1.pdf`, date 2025-09-30) — `IsPreviousVersionOf` S2
- **Why this is current:** [1 sentence reasoning]
- **User decision:** pending | approved | overridden

[None if no families detected]

## Coverage Matrix

| Source Lane | Coverage | Sources |
|---|---|---|
| Official / regulatory / standards | [thin / adequate / strong] | S1, S2 |
| Empirical / counter-evidence | [thin / adequate / strong] | S8 |
| Industry trend / market | [thin / adequate / strong] | S4, S5 |
| Practitioner / operating-model | [thin / adequate / strong] | S6, S7 |

Thin lanes that block drafting: [list or "none"]

## Claim Coverage

| Claim ID | Claim | Supporting sources | Status |
|---|---|---|---|
| C1 | [Claim text] | S1, S3 | Covered |
| C2 | [Claim text] | — | **Uncovered** |
| C3 | [Claim text] | S2 (partial) | Partial |

## Approval

- **Approval status:** Pending user approval | Approved by user
- **Approved at:** [ISO timestamp, when approved]
- **Approval constraint:** [optional user note recorded at approval time]
- **What changes invalidate this approval:**
  - new source added to inventory
  - existing source supersession reversed
  - claim coverage reduced
  - thin lane added
```

### 1.3 `SOURCE-INVENTORY.json` schema (selected fields)

The JSON companion drives validators and downstream agent reads. Schema borrows from Dublin Core, DataCite, PROV-O, and the existing `templates/research.json`.

```json
{
  "metadata": {
    "created_at": "2026-05-25T00:00:00Z",
    "updated_at": "2026-05-25T00:00:00Z",
    "status": "pending_user_approval",
    "classification_purpose": "strategy_paper",
    "research_json_link": ".paper/RESEARCH.json"
  },

  "authority_hierarchy": [
    {
      "rank_group": "primary_anchor",
      "source_ids": ["S1", "S2"],
      "rationale": ""
    }
  ],

  "sources": [
    {
      "id": "S1",

      "dublin_core": {
        "title": "",
        "creator": "",
        "subject": "",
        "description": "",
        "publisher": "",
        "date": "",
        "type": "official",
        "format": "application/pdf",
        "identifier": "doi:10.xxxx/xxxxxx",
        "source": "",
        "language": "en",
        "relation": [],
        "coverage": "",
        "rights": ""
      },

      "csl_json": {
        "id": "S1",
        "type": "report",
        "title": "",
        "author": [],
        "issued": { "date-parts": [[2026, 4, 15]] },
        "URL": "",
        "DOI": "",
        "container-title": "",
        "publisher": ""
      },

      "authority_dimensions": {
        "bias_risk": "low",
        "currency": "current",
        "consistency": "consistent",
        "indirectness": "direct"
      },

      "rank_group": "primary_anchor",
      "supports_claims": ["C1", "C3"],
      "use_in_paper": "",
      "limitations": "",
      "confidentiality": "quotable",

      "version_family": {
        "family_id": "F1",
        "role": "current",
        "datacite_relations": [
          { "type": "Obsoletes", "target_id": "S3" }
        ]
      },

      "provenance": {
        "origin": "local_original",
        "path": "original/regulatory-doc-v2.pdf",
        "sha256": "abc123...",
        "tlsh": "T1ABC...",
        "ingested_at": "2026-05-25T00:00:00Z",
        "prov_o": {
          "was_attributed_to": "user",
          "was_generated_by": "gpd-research"
        }
      },

      "claim_support": [
        {
          "claim_id": "C1",
          "support": "direct",
          "rationale": ""
        }
      ]
    }
  ],

  "duplicates": {
    "exact": [
      {
        "id": "D1",
        "members": ["original/file-a.pdf", ".paper/sources/file-a-copy.pdf"],
        "sha256": "...",
        "proposed_action": "keep_first_drop_others",
        "user_decision": "pending",
        "user_constraint": ""
      }
    ],
    "near": [
      {
        "id": "D2",
        "members": ["original/doc-v1.pdf", "original/doc-v2.pdf"],
        "tlsh_score": 12,
        "tlsh_threshold": 30,
        "proposed_action": "version_family_F1",
        "user_decision": "pending",
        "user_constraint": ""
      }
    ]
  },

  "version_families": [
    {
      "family_id": "F1",
      "current": "S2",
      "superseded": ["S3"],
      "datacite_relations": [
        { "from": "S2", "type": "Obsoletes", "target": "S3" },
        { "from": "S3", "type": "IsPreviousVersionOf", "target": "S2" }
      ],
      "rationale": "",
      "user_decision": "pending"
    }
  ],

  "coverage_matrix": {
    "official_regulatory_standards": { "coverage": "strong", "sources": ["S1", "S2"] },
    "empirical_counterevidence": { "coverage": "adequate", "sources": ["S8"] },
    "industry_trend_market": { "coverage": "adequate", "sources": ["S4", "S5"] },
    "practitioner_operating_model": { "coverage": "thin", "sources": ["S6"] }
  },

  "claim_coverage": [
    {
      "claim_id": "C1",
      "claim": "",
      "supporting_source_ids": ["S1", "S3"],
      "status": "covered"
    }
  ],

  "approval": {
    "status": "pending_user_approval",
    "approved_at": null,
    "constraint": "",
    "invalidating_events": [
      "new_source_added",
      "supersession_reversed",
      "claim_coverage_reduced",
      "thin_lane_added"
    ]
  }
}
```

### 1.4 `MISSING-CONTEXT.md` structure

```markdown
# Missing Context

**Created:** [ISO timestamp]
**Status:** Pending user review | Reviewed

## Missing

Claims, sources, decisions, owners, or evidence the framework expected but
could not find.

- **M1:** Claim C2 ("[claim text]") has no supporting source after the source mode and lane coverage requested for this classification.
- **M2:** The official regulatory lane has no recent (≤24 months) primary source for the paper's jurisdiction.
- **M3:** Counter-evidence lane is thin; only S8 contests the thesis.

## Ambiguous

Conflicts or unresolved version choices that the framework cannot resolve without a user decision.

- **A1:** S4 and S5 give conflicting market sizing numbers (S4: $X bn; S5: $Y bn). Which is authoritative for this paper?
- **A2:** Version family F1 has two candidates both dated 2026-04 with identical hashes; one is in `original/`, one is in `.paper/sources/`. Same content, different provenance.

## Dangerous

Claims the framework would proceed on but should not without user awareness.

- **D1:** Claim C5 ("[claim text]") is supported only by S6 (blog, no primary source). Drafting this as a direct claim could overstate evidence.
- **D2:** S9 is flagged `paraphrase-only` but is the only source for claim C7. Direct quotation would violate the confidentiality contract.
- **D3:** Source S10 has `currency: stale` (date 2023-01) but is being used to support a current trend claim (C8).

## Resolution

For each item, record one of:
- `acknowledged` — user accepts the gap and proceeds
- `addressed` — user has added evidence or revised a claim
- `deferred` — user accepts this as a known limitation in the paper
```

### 1.5 Duplicate detection mechanism

**Exact duplicates**:
- Compute `sha256` on file content during ingestion of `original/` and `.paper/sources/`
- Group files by identical hash
- Output to `SOURCE-INVENTORY.json.duplicates.exact` and the inventory's Duplicate Log section
- Proposed action: keep the first by ingestion order (or by `original/` over `.paper/sources/`); user decides via `gpd source-inventory decide`

**Near duplicates**:
- Compute `TLSH` (Trend Micro Locality Sensitive Hash) on file content for files where exact hash did not match
- Files with TLSH score below threshold (default 30; tunable per paper) are flagged as likely duplicates
- Output to `SOURCE-INVENTORY.json.duplicates.near`
- Proposed action: cluster as a version family if filenames or dates differ in the expected way; otherwise flag for manual review

**Implementation**:
- Use Node.js built-in `crypto.createHash('sha256')` for exact
- For TLSH, integrate via npm package `tlsh` or shell out to a native binary if package quality is insufficient
- File types covered: PDF (text-extracted before hashing for fuzzy match), DOCX, MD, TXT, HTML
- Binary files (images, spreadsheets) get sha256 only; near-duplicate skipped

**Never auto-resolve**: the framework writes findings to the inventory; the user decides via the gate.

### 1.6 Version family tracking

**Detection**:
- Sources clustered as near-duplicates with high similarity are candidate family members
- Within a candidate cluster, the framework proposes the `current` based on a heuristic chain:
  1. Most recent `dublin_core.date` if present
  2. Otherwise most recent file mtime
  3. Otherwise the source whose filename matches a "final" / "v2" / latest-version pattern
- Other cluster members proposed as `superseded`

**Schema**:
- DataCite relation types in use:
  - `Obsoletes` (the current → superseded direction)
  - `IsPreviousVersionOf` (the superseded → current direction)
  - `IsVariantFormOf` (when content is the same but format differs, e.g., PDF and DOCX of the same document)
  - Other DataCite relation types preserved if user adds them manually

**User decision**:
- User may accept the proposed current, override to a different member, or split the family if the framework mis-clustered
- Final family state recorded with `user_decision: approved` per family entry

### 1.7 Missing-context surfacing

`MISSING-CONTEXT.md` is generated from:

- `RESEARCH.json.evidence_matrix` entries where `supporting_sources` is empty (→ missing)
- `RESEARCH.json.contradictions` entries where `stronger_source_for_this_paper` is unset (→ ambiguous)
- `RESEARCH.json.claims_to_soften` entries (→ dangerous: would overstate)
- `RESEARCH.json.claims_to_drop_or_reframe` entries (→ dangerous: would mislead)
- `RESEARCH.json.research_plan.expected_source_checkpoint` items where `sources_expected` were not found
- Source records with `currency: stale` used to support claims with `claim_type: trend` (→ dangerous: stale support)
- Sources with `confidentiality: paraphrase-only` linked to claims that the draft would direct-quote (→ dangerous: confidentiality)
- Coverage matrix lanes with `coverage: thin` (→ missing)

Each entry has an `id` and a `resolution` field with values `acknowledged`, `addressed`, `deferred`.

### 1.8 Workflow gate

A new gate inserted between `/gpd-research` and `/gpd-outline`. Pattern mirrors `/gpd-feedback`:

```
/gpd-research          # produces RESEARCH.json, RESEARCH.md, SOURCE-INVENTORY.md, MISSING-CONTEXT.md
/gpd-source-inventory  # user-facing approval loop (new slash command)
/gpd-outline           # blocked until inventory approved
```

The slash command `/gpd-source-inventory` walks the user through:

1. The Summary section
2. The Authority Hierarchy
3. The Duplicate Log (each duplicate with proposed action; user picks `approve` / `modify` / `defer` / `reject`)
4. The Version Families (each family; same decision options)
5. The Coverage Matrix (user can mark thin lanes as `acknowledged` / `addressed` / `deferred`)
6. The Missing Context items (each, same resolution choices)
7. Final approval (`approve` records timestamp and any constraint)

Same decision-set / per-item pattern as the existing feedback-plan approval flow. Reuses the FEEDBACK-PLAN approval-state machinery in `bin/lib/feedback-plan.js`.

### 1.9 CLI surface

```
gpd source-inventory list [--paper <path>]
gpd source-inventory review --paper <path> [--item N | --duplicate N | --family N | --missing-context N]
gpd source-inventory decide --paper <path> --item N --decision approve|modify|defer|reject --note "..."
gpd source-inventory check-duplicates --paper <path>
gpd source-inventory mark-current --paper <path> --family-id F1 --source-id S2
gpd source-inventory mark-superseded --paper <path> --family-id F1 --source-id S3
gpd source-inventory refresh --paper <path>   # re-run inventory generation after sources changed
gpd source-inventory status --paper <path>    # quick: how many decisions pending
```

`gpd next` reads the inventory's approval status and routes accordingly:
- Pending → recommend `/gpd-source-inventory` (or `gpd source-inventory review`)
- Approved → unblock `/gpd-outline`
- Invalidated → recommend `gpd source-inventory refresh`

### 1.10 Validator rules

New rules in `bin/lib/semantic.js`:

| Rule | Severity | What it catches |
|---|---|---|
| `semantic.source_inventory_missing` | HIGH | `RESEARCH.json` exists but `SOURCE-INVENTORY.md`/`.json` do not (when research room is required for this classification) |
| `semantic.source_inventory_not_approved` | HIGH | Inventory exists with `status: pending_user_approval` but downstream artifact (`OUTLINE.md`, `DRAFT.md`) exists |
| `semantic.source_inventory_unresolved_duplicates` | HIGH | Duplicates section has pending decisions while outline/draft exist |
| `semantic.source_inventory_unresolved_families` | HIGH | Version families have pending decisions while outline/draft exist |
| `semantic.source_inventory_thin_lane_unacknowledged` | MEDIUM | Coverage matrix flags thin lane but missing-context has no resolution |
| `semantic.source_inventory_dangerous_unresolved` | HIGH | `MISSING-CONTEXT.md` Dangerous items have no resolution and downstream artifact exists |
| `semantic.source_inventory_stale` | MEDIUM | Inventory approved but new source ingested into `original/` or `.paper/sources/` after approval |
| `semantic.confidentiality_violation_in_draft` | HIGH | Source with `confidentiality: paraphrase-only` appears as a direct quote in `DRAFT.md` (cross-checks via TLSH on quoted spans) |

### 1.11 Required vs optional by classification

Inventory is required for:

- `classification.purpose: strategy_paper`
- `classification.purpose: decision_memo` when `classification.evidence_burden: regulated` or `external_high`
- Any paper with > 5 sources in `original/` or `.paper/sources/`
- Any paper with `classification.confidentiality_present: true`

Inventory is optional (recommended) for:

- Short update memos
- Explainer papers with all-web sources and no local material
- Papers with ≤ 3 sources

The `gpd next` router applies this rule. Authors can override with `--skip-inventory` on `/gpd-research` for explicit cases, recorded in `RESEARCH.json` as `inventory_skipped_reason`.

### 1.12 Integration with existing research workflow

`workflows/research.md` gains a final step:

```
## 7. Build Source Inventory

After RESEARCH.json and RESEARCH.md are written:

1. Index original/ and .paper/sources/: compute sha256 + TLSH per file.
2. Build SOURCE-INVENTORY.json from RESEARCH.json source_registry + indexing results.
3. Detect exact and near duplicates; populate duplicates section.
4. Detect version families from near-duplicate clusters; propose current/superseded.
5. Build coverage matrix from source lanes.
6. Build claim coverage from evidence_matrix.
7. Build MISSING-CONTEXT.md from open_questions, contradictions, claims_to_soften, claims_to_drop_or_reframe, expected_source_checkpoint misses, currency-vs-claim-type checks.
8. Render SOURCE-INVENTORY.md from SOURCE-INVENTORY.json.
9. Write all three artifacts.
10. Update STATE.json with research_room_status: inventory_drafted.
11. Route next to /gpd-source-inventory.
```

### 1.13 Phase 1 acceptance criteria

#### Phase 1 ships when

- New templates `templates/source-inventory.md` and `templates/missing-context.md` exist
- `workflows/research.md` step 7 (above) is implemented and runs end-to-end
- `bin/lib/research.js` (or equivalent module) computes sha256 + TLSH on `original/` and `.paper/sources/` content
- `bin/lib/source-inventory.js` produces `SOURCE-INVENTORY.json` from `RESEARCH.json` + indexing results
- New CLI surface `gpd source-inventory list|review|decide|check-duplicates|mark-current|mark-superseded|refresh|status` is implemented
- New slash command `/gpd-source-inventory` provides the user-facing approval loop, reusing the feedback-plan machinery
- New validator rules in `bin/lib/semantic.js` enforce the inventory gate (8 rules above)
- `gpd next` routes via inventory approval status when classification requires inventory
- All 14 existing test suites still pass; new test suite `tests/source-inventory-fixture.test.js` covers: (a) inventory generation from a fixture paper, (b) duplicate detection happy path, (c) version family detection happy path, (d) gate blocks outline when inventory pending, (e) gate allows outline after approval, (f) confidentiality violation caught in draft
- Documentation updates: `docs/DESIGN-SPEC.md` adds the research-room stage; `docs/START-HERE.md` adds a one-paragraph intro; `references/artifact-contracts.md` adds inventory/missing-context contracts; `CHANGELOG.md` entry

#### Phase 1 success — measured 90 days post-release

- At least 3 real GPD-built papers used the research room before drafting (not fixtures)
- For at least one paper, the inventory review surfaced an issue (duplicate, supersession, missing context, dangerous claim) that would not have been caught in the previous flow
- Per-paper inventory review time ≤ 20% of research generation time (the inventory is supposed to be cheap to review compared to the research it summarizes; if the inventory itself takes longer than research, the design is wrong)
- Zero confidentiality-violation incidents (paraphrase-only source quoted directly in an exported paper) on inventory-gated papers
- No regression in `gpd validate --semantic` runtime > 10% on existing test fixtures (the new validators must not slow normal validation materially)

## Phase 2: Global Research Corpus

### 2.1 Storage layout

Phase 2 lives at the global workspace level, compatible with RFC-013.1's `~/.gpd/global/` proposal:

```
~/.gpd/global/
├── profiles/        # RFC-013.1 territory
├── audiences/       # RFC-013.1 territory
├── contexts/        # existing GPD pattern, RFC-013.1 extends
└── research/        # this RFC, Phase 2
    ├── corpus.json              # index over the corpus
    ├── sources/                 # per-source records
    │   ├── S-abc123.json        # source ID = stable hash of identifier
    │   └── S-def456.json
    ├── claims/                  # cross-paper claim graph
    │   ├── C-001.json
    │   └── C-002.json
    ├── topics/                  # topic clusters for retrieval
    │   ├── T-001.json
    │   └── T-002.json
    └── promotions/              # log of which papers contributed which sources
        ├── 2026-05-25-paper-slug-S-abc123.json
        └── ...
```

Location is configurable via env var `GPD_GLOBAL_DIR` per the RFC-013.1 discipline (multi-portfolio users separate work / personal / public).

### 2.2 Source record schema (cross-paper)

Source ID is stable across papers: `S-<sha256-prefix-of-canonical-identifier>` where canonical identifier is DOI > URL > content-hash, in that order of preference.

```json
{
  "id": "S-abc123",
  "canonical_identifier": "doi:10.xxxx/xxxxxx",

  "dublin_core": { /* same as Phase 1 */ },
  "csl_json": { /* same as Phase 1 */ },

  "authority_dimensions_by_paper": {
    "data-products-strategy-2026": {
      "bias_risk": "low",
      "currency": "current",
      "consistency": "consistent",
      "indirectness": "direct",
      "rank_group": "primary_anchor"
    },
    "ai-governance-board-memo-2026": {
      "bias_risk": "low",
      "currency": "dated",
      "consistency": "consistent",
      "indirectness": "indirect",
      "rank_group": "background_context"
    }
  },

  "version_history": [
    {
      "version_id": "v1",
      "date": "2025-09-30",
      "sha256": "...",
      "obsoleted_by": "v2"
    },
    {
      "version_id": "v2",
      "date": "2026-04-15",
      "sha256": "...",
      "obsoletes": "v1"
    }
  ],

  "current_version": "v2",

  "contributed_by_papers": [
    {
      "paper_slug": "data-products-strategy-2026",
      "promoted_at": "2026-03-01T00:00:00Z",
      "confidentiality_at_promotion": "quotable"
    }
  ],

  "claims_supported_globally": ["C-001", "C-002"],
  "claims_contested_globally": ["C-003"],

  "topic_ids": ["T-001", "T-005"],

  "decay": {
    "expires_at": "2027-04-15",
    "decay_reason": "industry trend currency"
  },

  "confidentiality_global": "quotable | paraphrase-only | restricted",

  "provenance": {
    "first_seen_paper": "data-products-strategy-2026",
    "first_seen_at": "2026-03-01T00:00:00Z",
    "prov_o": {
      "was_attributed_to": "user",
      "was_generated_by": "gpd-source-promote"
    }
  }
}
```

### 2.3 Claim graph

Claims are cross-paper too — when the same factual claim appears in multiple papers, the corpus links them. Schema:

```json
{
  "id": "C-001",
  "claim_text": "Agentic delivery accelerates engineering decisions at a higher rate than current review processes can absorb",
  "claim_type": "trend",

  "supported_by_sources": ["S-abc123", "S-def456"],
  "contested_by_sources": ["S-ghi789"],

  "used_in_papers": [
    {
      "paper_slug": "data-products-strategy-2026",
      "form_in_paper": "exact",
      "section": "Why now"
    },
    {
      "paper_slug": "ai-governance-board-memo-2026",
      "form_in_paper": "softened",
      "section": "Background"
    }
  ],

  "strength_history": [
    { "date": "2026-03-01", "strength": "moderate" },
    { "date": "2026-05-15", "strength": "strong" }
  ],

  "current_strength": "strong",
  "current_recommendation": "support_directly"
}
```

When a new paper's research surfaces a claim that semantically matches an existing claim in the corpus (matched via fuzzy text comparison + topic overlap), the framework proposes linking. User decides whether to link, fork, or treat as distinct.

### 2.4 Topic clustering and retrieval

Topics provide the retrieval surface. They are clusters of claims and sources that share subject matter. Cluster creation is incremental: each promoted source is matched against existing topics by Dublin Core `subject` field and CSL `keyword` overlap; a source that doesn't match any existing topic creates a new one.

```json
{
  "id": "T-001",
  "label": "agentic-delivery-operating-model",
  "description": "Sources and claims about how agentic AI changes engineering operating models",
  "source_ids": ["S-abc123", "S-def456"],
  "claim_ids": ["C-001", "C-002"],
  "papers": ["data-products-strategy-2026", "ai-governance-board-memo-2026"],
  "subjects_dublin_core": ["agentic AI", "operating model", "software delivery"]
}
```

Retrieval is intentionally simple in Phase 2:

1. `gpd source-corpus query --topic T-001` returns all sources/claims in a topic
2. `gpd source-corpus query --subject "agentic AI"` returns sources whose Dublin Core subjects overlap
3. `gpd source-corpus query --claim "agentic delivery accelerates"` returns claims by fuzzy text match
4. `gpd source-corpus query --by-author "<author>"` returns sources by CSL author

Vector / semantic search is **not** in Phase 2. The corpus is a structured retrieval layer, not a RAG store. If semantic search proves needed, file a follow-up RFC; do not bolt it into Phase 2.

### 2.5 Promotion model

A source moves from a paper's inventory to the corpus only by explicit user action:

```
gpd source-corpus promote --paper <path> --source-id S1
gpd source-corpus promote --paper <path> --source-id S1 --confidentiality paraphrase-only
gpd source-corpus promote --paper <path> --all-approved   # bulk-promote all sources with inventory user_decision: approve
```

Promotion behavior:

1. Source record is written to `~/.gpd/global/research/sources/S-<hash>.json`
2. If a record with the same canonical identifier exists, merge:
   - Add the current paper to `contributed_by_papers`
   - Add per-paper authority dimensions
   - Update `version_history` if the paper has a newer version
   - Surface conflicts (e.g., different confidentiality across papers) for user decision
3. Promotion log entry written to `~/.gpd/global/research/promotions/<date>-<paper>-<source>.json`
4. The paper's `SOURCE-INVENTORY.json.sources[i].corpus_link` is updated to point at the global record

Demotion (`gpd source-corpus demote --source-id S-abc123`) removes a source from the corpus but preserves promotion log entries for audit.

### 2.6 Privacy and confidentiality

Same discipline as RFC-013.1, sharpened for research:

- **Default scope**: paper's own `.paper/` only. Sources do not auto-promote.
- **Promotion is explicit**: requires `gpd source-corpus promote` per source (or `--all-approved` for batch).
- **Confidentiality respected at promotion**: a source flagged `confidentiality: paraphrase-only` in the paper's inventory promotes as `paraphrase-only` in the corpus. The corpus inherits the stricter of any conflicting flags from multiple papers.
- **Restricted confidentiality**: new flag `restricted` for sources that must not be promoted (e.g., internal regulatory correspondence, vendor proposals under NDA). The CLI refuses promotion of restricted sources.
- **Per-portfolio isolation**: `GPD_GLOBAL_DIR=/path/to/work-research` for work, `/path/to/personal-research` for personal. The user runs different `GPD_GLOBAL_DIR` for different portfolios — no automatic mixing.
- **Audit trail**: every promotion is logged in `~/.gpd/global/research/promotions/`. Demotion does not delete the log.
- **No auto-discovery of harness memory**: unlike RFC-013.1's harness-native profile creation, the corpus is built from explicit promotion only. The framework never reads the harness's global memory to populate the corpus.

### 2.7 Source currency and decay

Each source record carries `decay.expires_at` if applicable. Defaults by source type:

| Source type | Default decay window |
|---|---|
| Regulatory / official standard | 5 years (or until superseded by a newer version) |
| Academic / peer-reviewed | 7 years |
| Industry analyst report | 18 months |
| Vendor or product announcement | 12 months |
| News / blog | 6 months |
| Internal document | per-paper / no global default |

A source past `expires_at` surfaces as `currency: stale` in `gpd source-corpus query` results. New papers can still use it but the inventory will flag the staleness in `MISSING-CONTEXT.md`. The user can extend the expiry with `gpd source-corpus extend-expiry --source-id S-abc123 --until 2028-04-15 --reason "still authoritative for jurisdiction"`.

### 2.8 Integration with other workflows

| Workflow | Phase 2 integration |
|---|---|
| `/gpd-research` | Before web research, query the corpus for topics matching the paper's `research_plan.inferred_research_questions`. Surface relevant corpus sources as the first lane of source candidates. |
| `/gpd-source-inventory` | When approving the inventory, show which sources have global corpus matches; user can pull additional sources from the corpus into the paper's inventory. |
| `/gpd-fact-check` | Cross-check material claims against the global claim graph. If a claim in the draft contradicts the corpus's `current_recommendation` for that claim, flag for review. |
| `/gpd-feedback` (regression recovery, #49) | When an external reviewer asks for evidence on claim X, the recovery flow queries the corpus for sources supporting X. If found, surface them as candidates instead of re-researching. This is the load-bearing Phase 2 benefit for external-feedback recovery. |

### 2.9 CLI surface

```
# Corpus state
gpd source-corpus init [--global-dir <path>]
gpd source-corpus status

# Querying
gpd source-corpus query --topic <id>
gpd source-corpus query --subject "<text>"
gpd source-corpus query --claim "<text>"
gpd source-corpus query --by-author "<text>"

# Promotion
gpd source-corpus promote --paper <path> --source-id <id> [--confidentiality <flag>]
gpd source-corpus promote --paper <path> --all-approved
gpd source-corpus demote --source-id <id>

# Maintenance
gpd source-corpus list-stale [--lane <type>]
gpd source-corpus extend-expiry --source-id <id> --until <date> --reason "..."
gpd source-corpus mark-superseded --source-id <id> --by <new-id>

# Audit
gpd source-corpus promotions [--paper <path> | --source-id <id>]
```

### 2.10 Phase 2 acceptance criteria

#### Phase 2 ships when

- RFC-013.1 / #19 global workspace pattern is implemented (hard dependency)
- `~/.gpd/global/research/` storage layout exists; `gpd source-corpus init` creates it
- Promotion command `gpd source-corpus promote` works for individual and batch sources; promotion log entries written
- Query CLI returns matching sources, claims, and topics
- `/gpd-research` consults the corpus as a first-lane source candidate
- `/gpd-source-inventory` surfaces corpus matches during review
- `/gpd-fact-check` cross-checks claims against the global claim graph
- `/gpd-feedback` recovery flow queries the corpus for missing evidence
- Confidentiality discipline: `restricted` sources cannot be promoted; promotion inherits the stricter confidentiality flag
- Per-portfolio isolation: `GPD_GLOBAL_DIR` honored; no cross-portfolio leakage
- All 14 existing test suites pass; new test suite `tests/source-corpus-fixture.test.js` covers: promotion, demotion, query, confidentiality enforcement, version family merge on promotion, claim graph linking, decay/staleness surfacing
- Documentation updates: `docs/DESIGN-SPEC.md`, `docs/START-HERE.md`, `references/artifact-contracts.md`, `CHANGELOG.md`

#### Phase 2 success — measured 90 days post-release

- At least 3 papers reuse sources from the corpus (not as the only sources — as the first lane of candidates)
- For at least one external-feedback recovery cycle (#49), the corpus supplies evidence that resolves the reviewer's concern without re-research
- Token cost of `/gpd-research` (measured via #24 metrics if available) drops by ≥ 20% on the second and subsequent papers in a topic cluster
- Zero confidentiality breaches: no `paraphrase-only` source from one paper appears as a direct quote in another paper's draft after corpus reuse
- Per-paper inventory generation time drops when the corpus has matching sources (the corpus reduces ingestion work; if it doesn't, the integration is wrong)

## Reused standards and libraries

This RFC consumes established schemas and libraries rather than minting new ones.

| Concern | Reused from | Notes |
|---|---|---|
| Minimum source metadata | Dublin Core 15 (ISO 15836 / RFC 5013) | `title, creator, subject, description, publisher, contributor, date, type, format, identifier, source, language, relation, coverage, rights`. All optional, repeatable. |
| Citation-style records | CSL-JSON (csl-data.json) | Used by Zotero, Pandoc, Quarto. Stable schema for bibliographic records. |
| Version supersession relations | DataCite Schema 4.5 | `IsNewVersionOf`, `IsPreviousVersionOf`, `IsVariantFormOf`, `Obsoletes`, `IsObsoletedBy`. |
| Derivation provenance (summary → original) | W3C PROV-O | `wasGeneratedBy`, `wasAttributedTo`, `wasDerivedFrom`. |
| Exact deduplication | sha256 (RFC 6234), `crypto.createHash('sha256')` in Node.js | Trivial implementation. |
| Near deduplication | TLSH (Trend Micro Locality Sensitive Hash) | `tlsh` npm package; clusters with score below threshold are likely-duplicates. |
| Ingestion state machine | LlamaIndex `IngestionPipeline` strategies | `DUPLICATES_ONLY`, `UPSERTS`, `UPSERTS_AND_DELETE`. Pattern, not the library. |
| Authority axes | GRADE (Grading of Recommendations Assessment Development Evaluations) | Dimensions reused (bias, currency, consistency, indirectness) without the medical scoring scale. |
| Authority categories | Library-science Primary/Secondary/Tertiary | Reused as the user-facing rank group default. |
| Folder convention | Numbered-prefix tradition (Broad Institute, NBIS) | Reused only at the global workspace level; per-paper artifacts stay in `.paper/`. |

**No reusable library handles the workflow gate** (inventory-as-reviewable-artifact gating drafting). That is GPD's novel contribution — it does not exist in NotebookLM, Claude Projects, ChatGPT Projects, Cursor, Claude Code, LlamaIndex, or any surveyed tool.

## Implementation order within each phase

### Phase 1 implementation sequence

1. Define `SOURCE-INVENTORY.json` schema; write `templates/source-inventory.md` template
2. Define `MISSING-CONTEXT.md` template
3. Implement sha256 ingestion indexing in a new `bin/lib/source-ingest.js` module
4. Implement TLSH near-duplicate detection (integrate `tlsh` package; fallback path if package quality is poor)
5. Implement `bin/lib/source-inventory.js` with: inventory generation from `RESEARCH.json` + indexing, duplicate detection, version family detection, coverage matrix, missing context surfacing
6. Update `workflows/research.md` step 7 (above)
7. Implement CLI surface `gpd source-inventory list|review|decide|...`
8. Implement `/gpd-source-inventory` slash command in `commands/gpd/source-inventory.md`
9. Add validator rules in `bin/lib/semantic.js`
10. Update `gpd next` routing to honor inventory approval status
11. Add classification-based inventory-required logic
12. Tests: fixture-based test suite covering happy path, blocked path, refresh path, confidentiality enforcement
13. Documentation updates (DESIGN-SPEC, START-HERE, artifact-contracts, CHANGELOG)

### Phase 2 implementation sequence (after RFC-013.1 / #19 lands)

1. Define `~/.gpd/global/research/` storage layout; implement `gpd source-corpus init`
2. Define source record, claim, topic schemas
3. Implement source record reader/writer with merge-on-promote
4. Implement `gpd source-corpus promote` (single + batch)
5. Implement claim graph linking on promotion
6. Implement topic clustering on promotion
7. Implement query CLI
8. Integrate corpus into `/gpd-research` as first lane
9. Integrate corpus into `/gpd-source-inventory` review (surface matches)
10. Integrate corpus into `/gpd-fact-check` cross-check
11. Integrate corpus into `/gpd-feedback` recovery (#49)
12. Implement decay / expiry surfacing
13. Implement confidentiality discipline (`restricted` flag, inheritance rules)
14. Implement per-portfolio `GPD_GLOBAL_DIR` honor
15. Tests: fixture-based test suite covering promotion, query, merge, confidentiality, decay
16. Documentation updates

## Risks and consequences

### Risks

- **Inventory burden on the user.** If the inventory takes longer to review than the research takes to produce, the design has failed. The classification-based opt-in is the primary mitigation; the "≤ 20% of research time" success measure is the empirical check.
- **TLSH false positives / false negatives.** Near-duplicate detection at threshold 30 is approximate. Some real duplicates will be missed; some non-duplicates will be flagged. The "never auto-resolve" discipline turns this into surface noise, not silent errors.
- **Cross-portfolio leakage in Phase 2.** Regulated users could accidentally promote internal sources to a global corpus that personal projects can read. Mitigations: `restricted` confidentiality flag refuses promotion; per-portfolio `GPD_GLOBAL_DIR` isolation; explicit (not silent) promotion command. Worth documenting prominently.
- **Stale corpus surfacing.** Sources past `expires_at` could mislead future papers. Mitigation: `currency: stale` surfaces in inventory; user explicit extends expiry with rationale.
- **Authority ranking drift across papers.** The same source ranked `primary_anchor` in paper A and `background_context` in paper B may confuse the corpus user. Mitigation: per-paper authority dimensions stored separately; corpus shows the range, not a single value.
- **Claim graph false linking.** Fuzzy text match on claims could link claims that are semantically different. Mitigation: linking is proposed, not automatic; user approves each link.
- **Promotion regret.** A source promoted to the corpus with insufficient review pollutes the corpus. Mitigation: `gpd source-corpus demote` removes it (the promotion log preserves audit). Phase 1 inventory review is the primary quality gate before promotion is even possible.

### Consequences

- A new gate in the workflow. Authors writing strategy papers and decision memos will see one more approval step before drafting. The benefit (catching source-set problems before drafting commits resources) must outweigh the friction.
- Two new artifacts in `.paper/` per paper (where inventory applies). Snapshots, exports, and reviews must account for them.
- `gpd validate --semantic` runtime grows modestly (8 new rules); should remain under 10% on existing fixtures.
- Phase 2 introduces a global state file tree that must be backed up, versioned, and managed by the user. Documentation must explain how.
- The corpus becomes a new privacy surface. Documentation must teach the per-portfolio isolation discipline.

## Open questions

- **Should the inventory be mandatory for all classifications, not opt-in?** Recommend: classification-based opt-in for Phase 1; revisit after 90-day measurement. If even short memos benefit from the inventory, broaden the default.
- **Should the corpus support multiple users in one global directory (shared team corpus)?** Phase 2 default: single-user; team-corpus deferred to Phase 3 with permission model.
- **Should the corpus participate in `gpd validate`?** Possibly: `gpd validate --semantic --include-corpus` could cross-check the paper's claims against the corpus claim graph. Defer to Phase 2 stabilization.
- **Should there be a `gpd source-corpus export` for sharing a curated corpus subset?** Useful for collaborators but adds export-format complexity. Defer to a Phase 3 follow-up.
- **Should sha256 + TLSH cover binary-only sources (audio, video) via metadata-only fingerprinting?** Out of scope for Phase 1; PDF/DOCX/MD/TXT/HTML coverage is sufficient.
- **Should the inventory record agent-vs-user provenance per source-decision?** PROV-O `wasAttributedTo` already provides this. Worth exposing in the inventory UI when an inventory is regenerated and the user has prior decisions to inherit.
- **Should the corpus claim graph be queryable in `/gpd-grill`?** Sharper grilling when the corpus already contains decided positions on adjacent claims. Defer to Phase 2 stabilization.

## Codex Review: Usability And Simplification

*[Placeholder — to be filled in by Codex review.]*

## Claude Review: Usability And Simplification

### What to keep

The core decision (per-paper room first, corpus second) is the right sequencing. The schema discipline (reuse Dublin Core / CSL-JSON / DataCite / PROV-O / TLSH rather than invent) keeps the surface area defensible and the implementation tractable. The classification-based opt-in for Phase 1 (required for strategy paper / decision memo / regulated; optional for short memos) prevents the room from becoming friction for trivial papers.

The novel contribution the RFC defends — workflow gate that makes inventory the reviewable artifact before drafting — is correctly identified and correctly scoped. None of NotebookLM / Claude Projects / ChatGPT Projects / Cursor / LlamaIndex surface this pattern.

### What to change — rough edges in this draft

#### 1. The "blog post" reference (§1 Common root cause) is informal and unreferenced

The current text says *"the blog post that motivated this RFC frames it as..."* without naming or linking the blog. Future readers will be confused. Fix: either remove the gesture and present the framing as the author's own ("the underlying observation is that the bottleneck has shifted from generation to preparation"), or cite the source explicitly with a URL in the References section.

#### 2. Several numeric thresholds are asserted without grounding

- TLSH threshold `30` (§1.5) is a defensible default for "highly similar" content but the RFC doesn't say so. Add one sentence citing TLSH literature precedent and noting it is tunable per paper.
- ">5 sources" classification trigger (§1.11) is arbitrary. Either justify with empirical reasoning or restate qualitatively ("any paper with multiple local sources").
- Decay defaults in §2.7 (5 years regulatory, 18 months analyst, 6 months news) are picked from intuition. Call them "starting defaults; refine empirically from real corpus usage."
- "≥20% token-cost reduction" success measure (§2.10) repeats the same unbacked-specific pattern I called out in RFC-014's compression target. Loosen to "measurable reduction once #24 lands; specific threshold to be set against the first 3 papers' baseline."
- "≤20% of research time" inventory review (§1.13) has no measurement baseline. Either define what "research time" means or loosen to "the inventory must be reviewable in a single sitting on a real paper" with a concrete time cap (e.g., 15-20 minutes) tested at the 90-day measurement window.

#### 3. Vector-vs-fuzzy boundary is inconsistent

§2.4 emphatically excludes vector/semantic search from Phase 2. §2.3 uses "fuzzy text comparison" for claim graph linking. These are different but related notions of similarity. Resolve:

- Explicitly state that *deterministic* fuzzy matching (Levenshtein, edit distance, normalized token overlap) is allowed; *embedding/vector* similarity is deferred.
- Specify the algorithm for claim-graph linking (e.g., trigram overlap on normalized claim text + topic-set overlap with Jaccard threshold).

Without this, an implementer will reach for sentence embeddings on day one, defeating the scope discipline.

#### 4. Source-content change after approval is not covered

§1.2's `invalidating_events` list includes `new_source_added`, `supersession_reversed`, `claim_coverage_reduced`, `thin_lane_added` — but not "existing source content changed." If a user edits a PDF in `original/` after the inventory is approved, the sha256 changes silently and the approval is now against a different file. Add `source_content_changed` (detected by sha256 mismatch vs approval-time recorded hash) and a validator rule that re-runs the gate.

#### 5. Inventory ↔ snapshot/restore interaction is undefined

Snapshots include `RESEARCH.json` and presumably `SOURCE-INVENTORY.json` (since §2 of snapshot.js coreArtifacts could include it). What happens when `gpd restore` brings back an older inventory? Does the user need to re-approve? Three reasonable answers — pick one explicitly:

- Restored inventory inherits its prior approval state (status preserved).
- Restored inventory is marked `superseded_by_research_refresh` and requires re-approval.
- Restored inventory remains approved but `gpd next` warns the user that the inventory pre-dates current `RESEARCH.json`.

#### 6. PROV-O schema rigor

`"prov_o": { "was_attributed_to": "user", "was_generated_by": "gpd-research" }` uses string literals instead of PROV-O's expected URI references. Either:

- State that GPD uses a flattened JSON projection of PROV-O with reserved string values (`user`, `agent:gpd-research`, etc.) and document the projection
- Or use proper URI references (e.g., `prov:Agent` URIs)

For Phase 1, the flattened projection with documented reserved values is sufficient; document the convention.

#### 7. Authority dimensions provenance ambiguity

§1.3's `authority_dimensions` (bias_risk, currency, consistency, indirectness) does not specify who populates them. Are they agent-inferred during research, or user-set during inventory review, or both? The PROV-O `was_attributed_to` field exists at the source level but not per-dimension. Specify:

- Agent-inferred during research, user can override during inventory review.
- When user overrides, record `authority_dimensions_overridden_by: "user"` to preserve provenance.

#### 8. Recovery-loop integration (§2.8) is underdeveloped

The single strongest Phase 2 benefit is feeding the corpus into external-feedback recovery (#49). Currently it gets one table row. Expand to a short subsection describing the concrete flow:

1. Reviewer flags claim X as needing more evidence
2. Recovery loop queries `gpd source-corpus query --claim "<text>"` and `--subject "<topic>"`
3. Matching sources surface as candidates *before* re-research is triggered
4. User selects which corpus sources to pull into the paper's inventory
5. Re-research only happens if no corpus candidate satisfies the reviewer's concern

This is the most user-visible Phase 2 value and deserves prose, not a table cell.

#### 9. CLI command consistency

`gpd source-inventory` namespace mixes verb styles: `check-duplicates`, `mark-current`, `mark-superseded`, `refresh`, `status`. Compare with `gpd feedback-plan list/review/decide` — cleaner verb pattern. Consider:

- `gpd source-inventory list | review | decide | dedupe | version | refresh | status`
- Drop hyphenated compound verbs where possible

Smaller cleanup. Reasonable to defer to implementation review.

#### 10. PDF text extraction library choice is hand-waved

§1.5 says "PDF (text-extracted before hashing for fuzzy match)" without specifying the library. Quality varies dramatically across PDF parsers. Either pick (e.g., `pdf-parse` for Node.js; document the limitations) or note this as a Phase 1 implementation decision with fallback to sha256-only when extraction fails. Don't leave it to interpretation.

### Feature request overlap

- Directly overlaps with **#19** (reusable central resources) for Phase 2; corpus is a child concern of #19's resource pattern.
- Directly overlaps with **#36** (RFC-011 grill source intake); both define source-graph artifacts at different stages. The two RFCs should explicitly reference each other.
- Related to **#48 / #49** (revision regression gate + recovery); cleaner room compounds with regression detection; corpus feeds recovery.
- Related to **#32** (RFC-007 eval harness); inventory quality becomes measurable when an independent rubric exists.
- Related to **#24** (Token and Cost Metrics); Phase 2 success measurement depends on token-cost telemetry landing.
- Related to **#27** (Paper Lab); cross-paper corpus reuse is a natural Paper Lab experiment.
- Related to **#23** (Reduce paper review cycles umbrella) and **#28** (Active-Learning Feedback Reduction umbrella); both phases serve both umbrellas.

### Delta from existing issues

No current issue covers the inventory-as-reviewable-artifact pattern or the cross-paper corpus. Existing RFCs (013.1, 014, 015) and issues (19, 36, 45, 48, 49) cover adjacent surfaces but do not solve the room/corpus gap. This RFC requires two new feature requests (Phase 1 unblocked; Phase 2 blocked by #19 / RFC-013.1).

### Recommendation

Accept Phase 1 as ready for backlog tracking after addressing items 1, 2, 4, 5, 6, 7 (the substantive items) and items 3, 8, 9, 10 (the polish items) in a revision pass. Phase 2 is correctly parked behind RFC-013.1 / #19; do not file the Phase 2 issue until that infrastructure ships.

Implement Phase 1 ahead of Phase 2 of #45 (ARGUMENT-SPINE.md standalone) only if Phase 1 ships faster — both are unblocked. They are independent. Either order works; both compound.

The single most important sentence in this RFC: *"No reusable library handles the workflow gate. That is GPD's novel contribution."* The implementation must preserve that framing. Schemas come from established standards; the discipline does not.

## Implementation Recommendation

### Readiness

**Phase 1**: ready for backlog tracking. Unblocked. Can ship as a standalone feature request. Recommended issue title: *"Feature request: research room and source inventory approval gate (RFC-016 Phase 1)"*.

**Phase 2**: not ready as a standalone issue. Depends on RFC-013.1 / #19 global workspace pattern landing first. File as a follow-up issue blocked by whichever of #19 or a new RFC-013.1 issue ships the global workspace.

### Issue mapping

| Issue | Relationship to this RFC |
|---|---|
| New issue for Phase 1 | Concrete implementation issue; unblocked |
| New issue for Phase 2 | Blocked by #19 / RFC-013.1 implementation |
| #36 (RFC-011 grill source intake) | Adjacent — SOURCE-GRAPH at grill is the prior-paper relationship view; SOURCE-INVENTORY at research is the source-set authority view. Both should reference each other in their bodies. |
| #19 (reusable central resources) | Hard dependency for Phase 2 |
| #45 (ARGUMENT-SPINE.md) | Adjacent synthesis-layer artifact at the argument level |
| #48 (revision regression gate) | Compounds: cleaner room means fewer regressions to catch |
| #49 (regression recovery UX) | Phase 2 supplies the corpus recovery loop needs |
| #32 (RFC-007 eval harness) | Independent judge of inventory quality once it lands |
| #24 (Token and Cost Metrics) | Phase 2 success requires this for the ≥ 20% token-cost reduction measurement |
| #27 (Paper Lab) | Phase 2 corpus reuse experiments are a natural Paper Lab scenario |
| #23 (Reduce paper review cycles umbrella) | Both phases serve this umbrella |
| #28 (Active-Learning Feedback Reduction umbrella) | Approval gate at research stage is an active-learning slice |

### Recommendation

Implement Phase 1 first. Phase 2 lands after #19 / RFC-013.1 ships the global workspace. Do not skip Phase 1 to build Phase 2; the corpus quality depends on the per-paper review discipline that Phase 1 establishes.

The novel contribution to defend is the workflow gate — inventory-as-reviewable-artifact gating drafting — not any single schema or check. The schemas come from established standards. The libraries exist. The discipline does not.

## References

### GPD pieces this RFC extends or coordinates with

- `rfc/rfc-011-grill-source-intake.md` (#36) — grill-time SOURCE-GRAPH for prior-paper relationships
- `rfc/rfc-013-1-global-workspace-and-context-assembly.md` — global workspace pattern; not implementation-ready, but provides Phase 2 storage scaffolding
- `rfc/rfc-013-3-state-deletion-and-agent-handoffs.md` — STATE.md generated-view discipline applies to inventory state surfacing
- `rfc/rfc-014-multi-format-paper-support.md` — ARGUMENT-SPINE.md as adjacent synthesis layer
- `rfc/rfc-015-context-pruning-and-bloat-reduction.md` — REVISION-INSTRUCTIONS.md pattern; inventory gate is an analogous approval surface at the research stage
- `workflows/research.md` — existing research workflow that produces `RESEARCH.json` and `RESEARCH.md`
- `templates/research.json` — existing rich source_registry schema
- `bin/lib/semantic.js` — existing validator surface where new rules attach
- `bin/lib/feedback-plan.js` — existing decision-set approval machinery this RFC reuses

### External standards and libraries

- Dublin Core Metadata Element Set (ISO 15836 / RFC 5013): https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
- CSL-JSON (Citation Style Language): https://github.com/citation-style-language/schema
- DataCite Metadata Schema 4.5: https://schema.datacite.org/
- W3C PROV-O (Provenance Ontology): https://www.w3.org/TR/prov-o/
- TLSH (Trend Micro Locality Sensitive Hash): https://tlsh.org/
- LlamaIndex Document Management (IngestionPipeline): https://docs.llamaindex.ai/en/stable/module_guides/indexing/document_management/
- GRADE (Grading of Recommendations Assessment Development Evaluations): https://en.wikipedia.org/wiki/Grading_of_Recommendations,_Assessment,_Development_and_Evaluations
- Broad Institute file-structure guide: https://mitcommlab.mit.edu/broad/commkit/file-structure/
