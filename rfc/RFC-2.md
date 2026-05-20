# RFC-2: Paper Workflow Classifications, Modes, and Expectations

- **Status:** Proposed
- **Author:** Project maintainer
- **Date:** 2026-05-09
- **Scope:** GPD policy layer — paper classification, workflow mode selection, machine-readable expectations
- **Tracking Issue:** [#15](https://github.com/yarikc/get-paper-done/issues/15)
- **Supersedes:** the implicit free-form `paper type` string in `PROJECT.md`
- **Complements:** [RFC-1](./RFC-1.md) — RFC-1 improves how agents *run*; this RFC improves how the system *decides which workflow to run*

## Summary

GPD currently conflates purpose, channel, risk, and format under one ambiguous "paper type" string. That conflation drives downstream confusion: the workflow doesn't know whether a "white paper" needs flagship-level rigor or whether an "internal status note" can skip outline. This RFC introduces a five-axis classification (purpose / channel / risk / complexity / audience-shape), three workflow modes (lite / standard / flagship), and machine-readable expectations (`required_stages` + `quality_gates`) that derive deterministically from classification.

The model keeps a single coherent paper system. It does not introduce separate workflows for notes, memos, and white papers. It scales rigor up or down based on what the paper is trying to do, where it lives, and what happens if it's wrong.

---

## 1. Design goals

1. Keep one coherent paper system — no separate pipelines per format.
2. Use a small number of orthogonal classification values with non-overlapping definitions.
3. Scale review intensity based on **risk and complexity, not document length**.
4. Make required stages and gates **machine-readable** so the CLI can validate transitions.
5. Allow deliberate upward override; require justification for downward override on high-stakes papers.

---

## 2. Core model

Three layers:

| Layer | Role | Where it lives |
|---|---|---|
| **Classification** | What kind of paper this is and what context it lives in | `.paper/config.json:classification` |
| **Mode** | How much workflow intensity is required | `.paper/config.json:mode` (derived) |
| **Expectations** | What must be true for the paper to advance | `.paper/config.json:workflow.required_stages` (policy) + `.paper/STATE.json:gates_satisfied` (status) |

Policy and state are split deliberately. `config.json` declares **what is required**; `STATE.json` records **what has been satisfied**. The CLI's `gpd validate` compares them.

---

## 3. Classification axes

Five orthogonal axes. Each captures one concern.

### 3.1 Purpose

Describes the paper's **job**. Not format. Not channel.

| Value | When to use |
|---|---|
| `decision_memo` | Ask for a specific decision (approve / fund / choose / authorize) from a defined audience |
| `strategy_paper` | Set medium-to-long-term direction. Frame a problem, argue for an approach |
| `explainer` | Help the reader understand a concept, mechanism, or viewpoint |
| `update` | Communicate progress, status, or changes |

**Removed.** The original proposal listed `update` as "optional fourth value." This RFC includes it as a first-class value. Status communication is a distinct job from the other three; making it ambiguous creates implementation drift.

### 3.2 Channel

Describes where the paper lives.

| Value | When to use |
|---|---|
| `internal` | Private to a team, organization, or trusted circulation |
| `external` | Published, public, customer-facing, or otherwise outside organizational walls |

**Removed.** The original proposal's optional `mixed` value is dropped. A "mixed-channel" paper almost always decomposes cleanly into one primary channel + a secondary audience-shape concern. If a real paper resists that decomposition, propose `mixed` as an amendment with a concrete example.

### 3.3 Risk level

Describes the **consequence of being wrong**, weakly supported, or misread. A property of the paper as an artifact in a channel — not a property of source count.

| Value | When to use |
|---|---|
| `low` | Confusion, rework, or modest credibility cost are the worst plausible outcomes |
| `high` | Bad decisions, wasted investment, brand damage, customer mistrust, or serious credibility loss |
| `regulated` | Audit findings, regulatory exposure, compliance issues, or legal defensibility required |

**Changed from original proposal.** The original conflated channel and risk into a single five-value enum (`internal_low`, `internal_high`, `external_low`, `external_high`, `regulated`). Since channel is already its own axis, encoding it inside risk created redundancy and impossible states (e.g., `channel=internal, risk=external_high`). Splitting risk into a clean three-value enum (`low | high | regulated`) gives 3 × 2 = 6 valid `(risk_level, channel)` combinations, all schema-valid.

A lightly researched internal note can still be high-risk if it influences important decisions. A deeply researched explainer can still be low-risk if it is narrow and non-consequential. **Risk is about stakes and consequence, not about source count.**

### 3.4 Complexity

How much structure, evidence, and synthesis the paper requires.

| Value | When to use |
|---|---|
| `light` | Limited structure, narrow scope, small number of claims |
| `standard` | Multiple claims, meaningful trade-offs, justifies explicit outlining and structured review |
| `deep` | Substantial framing, evidence across multiple dimensions, real synthesis burden |

### 3.5 Audience shape

How many distinct reader groups the paper must satisfy.

| Value | When to use |
|---|---|
| `single` | One primary audience drives the paper |
| `prioritized_multi` | Multiple audiences matter, but one has clear priority. Paper must declare audience order and conflict rule |
| `hybrid` | Intentionally written for a mixed audience without one dominant reader. **Use sparingly.** Hybrid creates real tension in tone, detail, and argument structure |

`hybrid` requires explicit justification in `BRIEF.md` (single sentence). The audience-reviewer flags hybrid papers for additional conflict-handling review.

---

## 4. Modes

Three workflow bundles. Modes are not paper types.

### 4.1 `lite`

Use for short internal notes, exploratory writing, updates, low-stakes pieces.

**Required stages:** `brief`, `strategy_gate`, `outline_lite`, `draft`, `editor`.
**Conditional:** `audience_reviewer` (if `audience_shape ≠ single`).
**Optional:** `research`, `opposition_reviewer`, `fact_checker`.

Lite mode requires `outline_lite`. The "direct draft" path from the original proposal is removed: even for short pieces, the structured outline is cheap to produce and prevents downstream consumers (drafter, reviewers) from operating on undefined input. Lite outlines are intentionally minimal — Section Architecture table only, no Deep Mode Additions.

### 4.2 `standard`

Use for serious internal memos, strategy papers, architecture papers, evidence-based writing with real organizational consequence.

**Required stages:** `persona`, `audience`, `brief`, `strategy_gate`, `research`, `outline_deep`, `draft`, `audience_reviewer`, `editor`.
**Conditional:** `fact_checker` (if claims are empirical or material), `opposition_reviewer` (if recommendation is contestable).

### 4.3 `flagship`

Use for major internal strategy papers, public writing under scrutiny, white-paper-style external pieces, anything regulated or highly exposed.

**Required stages:** all standard stages + `opposition_reviewer` + `fact_checker` + `publication_readiness_check`.

---

## 5. Mode derivation

Mode is **derived** from classification, not chosen ad hoc.

### 5.1 Derivation algorithm

```
final_mode = max(default_mode, all minimum_mode rules that fire)
```

Where `max` orders modes as `lite < standard < flagship`. If no rule fires, `default_mode = standard`.

### 5.2 Default mode rules

| Classification pattern | Default mode |
|---|---|
| `purpose=update AND risk_level=low AND complexity=light` | `lite` |
| `purpose=explainer AND channel=internal AND risk_level=low AND complexity=light` | `lite` |
| `channel=external AND complexity=deep` | `flagship` |
| (all other combinations) | `standard` |

### 5.3 Minimum mode rules

These set a floor. The final mode is the maximum over default and all minimums that fire.

| Trigger | Minimum mode |
|---|---|
| `risk_level = regulated` | `flagship` |
| `risk_level = high AND channel = external` | `flagship` |
| `risk_level = high AND channel = internal` | `standard` |
| `audience_shape = prioritized_multi OR audience_shape = hybrid` | `standard` |
| `purpose = strategy_paper AND complexity = deep` | `standard` |
| `purpose = decision_memo AND complexity ∈ {standard, deep}` | `standard` |

### 5.4 Why this is complete

The combination space is 4 × 2 × 3 × 3 × 3 = 216 combinations. The default rules cover all combinations explicitly. The minimum rules can only push mode upward. Together they produce a defined `final_mode` for every input.

**Removed from original proposal.** The rule "if `purpose = decision_memo` and the recommendation is contestable or consequential, minimum mode = standard" required a non-captured field ("contestable or consequential") and could not be machine-applied. Replaced with `complexity ∈ {standard, deep}` which is a captured axis.

### 5.5 Override semantics

| Direction | Allowed | Audit trail |
|---|---|---|
| Upward (e.g., `standard → flagship`) | Always allowed | Recorded in `STATE.json:classification.override` |
| Downward, when `risk_level ∈ {high, regulated}` | Blocked unless `--force` flag with required `--reason "..."` | Recorded with reason, timestamp, and `forced: true` |
| Downward, otherwise | Allowed with `--reason "..."` | Recorded in `STATE.json:classification.override` |

Override audit trail schema:

```json
{
  "classification": {
    "override": {
      "from": "standard",
      "to": "flagship",
      "reason": "External publication confirmed",
      "at": "2026-05-09T14:23:00Z",
      "forced": false
    }
  }
}
```

---

## 6. Stage → command → agent → artifact mapping

Each stage in `required_stages` maps to a command, agent, and output artifact in the existing GPD system.

| Stage | Command | Agent | Output artifact |
|---|---|---|---|
| `persona` | `/gpd-persona` | (intake workflow) | `.paper/PERSONA.md` |
| `audience` | `/gpd-audience` | (intake workflow) | `.paper/AUDIENCE.md` |
| `brief` | `/gpd-brief` | (brief workflow) | `.paper/BRIEF.md` |
| `strategy_gate` | (runs after `brief`) | `paper-strategist` | `.paper/STRATEGY.md`, `STATE.json:strategy.*` |
| `research` | `/gpd-research` | `paper-researcher` | `.paper/RESEARCH.json`, `.paper/RESEARCH.md` |
| `outline_lite` | `/gpd-outline --lite` | `paper-outliner` (Lite) | `.paper/OUTLINE.md` |
| `outline_deep` | `/gpd-outline --deep` | `paper-outliner` (Deep) | `.paper/OUTLINE.md` |
| `draft` | `/gpd-draft` | `paper-drafter` | `.paper/DRAFT.md` |
| `audience_reviewer` | `/gpd-review` | `audience-reviewer` | `.paper/REVIEW.md` |
| `opposition_reviewer` | `/gpd-review` (suite) | `opposition-reviewer` | `.paper/OPPOSITION.md` (proposed in RFC-1) |
| `fact_checker` | `/gpd-fact-check` | `paper-fact-checker` | `.paper/FACT-CHECK.md` |
| `editor` | `/gpd-revise` | `paper-editor` | `.paper/DRAFT.md` (revised) + change log |
| `publication_readiness_check` | (runs in `editor` flagship mode) | `paper-editor` | `.paper/REVIEW.md:publication_readiness` |

**Renamed from original proposal.** The original used `audience_advocate`. GPD's existing agent is `audience-reviewer`. Naming is reconciled.

The `--lite | --deep` outline flag convention is preserved. Mode (`lite | standard | flagship`) is the workflow-level concept; `--lite | --deep` are the outline-stage-level flags. They compose: `mode=lite` always uses `outline_lite`; `mode=standard` and `mode=flagship` always use `outline_deep`.

---

## 7. Quality gates: defined predicates

Each named quality gate is a machine-checkable predicate. The CLI's `gpd validate` evaluates them against the paper state.

| Gate | Predicate |
|---|---|
| `strategy_gate_passed` | `STATE.json:strategy.status == "Go"` |
| `evidence_for_against_complete` | `RESEARCH.json:evidence_matrix` has ≥1 row with non-empty `contradicting_sources` AND `synthesis_matrix.rows[*].pattern` includes at least one `disagreement` or `mixed` value |
| `objections_addressed` | For every objection in `AUDIENCE.md` and `STRATEGY.md`, `OUTLINE.md:objection_map` has a row with `where_addressed != "-"` AND `handling != "ignored"` |
| `material_claims_checked` | `FACT-CHECK.md` exists AND `synthesis_integrity.overall_assessment ∈ {supported}` (not `somewhat_overextended` or `materially_overextended`) AND no HIGH-severity claims with `evidence_status ∈ {unsupported, contradicted, needs_current_verification}` |
| `audience_conflicts_resolved` | If `audience_shape ∈ {prioritized_multi, hybrid}`: `REVIEW.md:audience_conflict_table` has a row for every detected tension AND every row has a `recommended_handling` value |
| `publication_readiness_passed` | `REVIEW.md:publication_readiness_check` table has all rows with `status == "Pass"` |
| `feedback_plan_approved` | `STATE.json:feedback.feedback_plan_status == "Approved"` |

Gates are declared in `config.json:workflow.required_gates` (a list of gate names). Their satisfaction is recorded in `STATE.json:gates_satisfied` (a map of gate name → `{satisfied: bool, checked_at: ISO}`).

---

## 8. Recommended config schema

```json
{
  "paper": {
    "slug": "modernizing-data-platform",
    "title": "Modernizing the Data & AI Platform"
  },
  "classification": {
    "purpose": "strategy_paper",
    "channel": "external",
    "risk_level": "high",
    "complexity": "deep",
    "audience_shape": "prioritized_multi"
  },
  "mode": "flagship",
  "derived": {
    "mode_source": "rule:risk_level=high+channel=external",
    "manual_override": false
  },
  "workflow": {
    "required_stages": [
      "persona",
      "audience",
      "brief",
      "strategy_gate",
      "research",
      "outline_deep",
      "draft",
      "audience_reviewer",
      "opposition_reviewer",
      "fact_checker",
      "editor",
      "publication_readiness_check"
    ],
    "required_gates": [
      "strategy_gate_passed",
      "evidence_for_against_complete",
      "objections_addressed",
      "audience_conflicts_resolved",
      "material_claims_checked",
      "publication_readiness_passed"
    ]
  }
}
```

State satisfaction is recorded separately in `STATE.json`:

```json
{
  "gates_satisfied": {
    "strategy_gate_passed": { "satisfied": true, "checked_at": "2026-05-09T11:00:00Z" },
    "evidence_for_against_complete": { "satisfied": true, "checked_at": "2026-05-09T13:30:00Z" },
    "objections_addressed": { "satisfied": false, "checked_at": null },
    "material_claims_checked": { "satisfied": false, "checked_at": null }
  }
}
```

---

## 9. Reconciliation with the strategy gate

`STRATEGY.md` returns `Go | Revise Before Drafting | No-Go`. Mode is derived from classification. The two systems compose as follows:

- **Classification + mode** determine which stages are required.
- **Strategy gate status** determines whether downstream stages may proceed.
- A `Revise Before Drafting` or `No-Go` strategy status blocks all stages downstream of `strategy_gate`, regardless of mode.
- A `Go` status unblocks the mode-determined stages.

In other words: mode is the policy ("what stages do we need?"); strategy gate is the runtime check ("are we allowed to proceed?"). They don't conflict because they answer different questions.

---

## 10. Classification lifecycle

| Lifecycle event | Trigger | Who/what |
|---|---|---|
| **Initial classification** | During `/gpd-brief` (after persona + audience are set) | User answers 5 axis questions; strategist confirms or challenges |
| **Re-evaluation** | After `/gpd-research` if research surfaces unexpected audience or risk; after `audience-reviewer` if multi-audience tension found; on user request via `gpd reclassify` | Strategist or user-initiated |
| **Override** | Anytime via `gpd mode <paper> --set <mode> [--reason "..."]` | User; subject to override-direction rules |
| **Audit** | Every classification change writes a new entry to `STATE.json:classification.history` | CLI |

`STATE.json` accumulates a classification history rather than overwriting:

```json
{
  "classification": {
    "current": { ... },
    "history": [
      {
        "at": "2026-05-08T09:00:00Z",
        "set_by": "/gpd-brief",
        "axes": { "purpose": "explainer", "risk_level": "low", ... },
        "derived_mode": "lite"
      },
      {
        "at": "2026-05-09T14:23:00Z",
        "set_by": "user",
        "reason": "Audience expanded to external on confirmation",
        "axes": { "purpose": "explainer", "risk_level": "high", ... },
        "derived_mode": "flagship"
      }
    ]
  }
}
```

---

## 11. Migration plan for existing papers

In-flight `.paper/` workspaces don't have classification or mode fields. Adoption follows two paths:

**Path A — graceful fallback.** Missing classification → `mode = standard`, classification = null, strategist surfaces "needs classification" as a `STATE.json:blocked_by` entry. The paper continues to function under standard mode until reclassified.

**Path B — explicit migration.** New CLI command:

```bash
gpd reclassify <paper>
```

Walks the user through 5 axis questions. Writes classification + derives mode. Records as the first entry in `classification.history`. Idempotent — running it on an already-classified paper updates and appends to history.

Path A is the default for backward compatibility. Path B is the recommended path for active papers.

---

## 12. CLI surface

New commands implied by this RFC:

| Command | Purpose |
|---|---|
| `gpd classify <paper>` | Set or update classification interactively (5 axis questions) |
| `gpd reclassify <paper>` | Alias for `gpd classify` on an already-classified paper, with history appending |
| `gpd mode <paper>` | Print derived mode and rule trace ("`flagship` because `risk_level=high+channel=external` triggered minimum_mode=flagship") |
| `gpd mode <paper> --set <mode> [--reason "..."] [--force]` | Manual mode override |
| `gpd validate <paper>` | (extends existing) Evaluate `required_gates` against `STATE.json:gates_satisfied`; report missing or unsatisfied gates |
| `gpd validate-artifact <path>` | (proposed in RFC-1) Validate an artifact against its JSON schema |

`gpd status` is extended to print mode and unsatisfied required gates.

---

## 13. How common labels map into the model

Common labels are not first-class classification values. They map into combinations:

| Common label | Recommended mapping |
|---|---|
| White paper | `purpose=strategy_paper, channel=external, risk_level=high or regulated, complexity=deep, audience_shape=single or prioritized_multi` → `flagship` |
| Architecture paper asking for approval | `purpose=decision_memo`, channel/risk per situation |
| Architecture paper setting direction | `purpose=strategy_paper`, channel/risk per situation |
| Technical explainer blog post | `purpose=explainer, channel=external, risk_level=low or high (per stakes)`, complexity per topic depth |
| Internal architecture explainer | `purpose=explainer, channel=internal`, risk per stakes |
| Executive status note | `purpose=update, channel=internal`, risk per stakes |
| Position paper | `purpose=strategy_paper or decision_memo`, channel per audience, complexity usually `deep` |
| Newsletter | `purpose=explainer or update, channel=external, complexity=light`, risk per stakes |

---

## 14. Worked examples

### 14.1 Data platform white paper

```json
{
  "classification": {
    "purpose": "strategy_paper",
    "channel": "external",
    "risk_level": "high",
    "complexity": "deep",
    "audience_shape": "prioritized_multi"
  }
}
```

Rules fired:
- Default rule: `channel=external AND complexity=deep` → default `flagship`.
- Minimum: `risk_level=high AND channel=external` → minimum `flagship`.
- Minimum: `audience_shape=prioritized_multi` → minimum `standard`.

`final_mode = max(flagship, flagship, standard) = flagship`.

Required stages: persona, audience, brief, strategy_gate, research, outline_deep, draft, audience_reviewer, opposition_reviewer, fact_checker, editor, publication_readiness_check.

Required gates: all six.

### 14.2 Internal architecture status note

```json
{
  "classification": {
    "purpose": "update",
    "channel": "internal",
    "risk_level": "low",
    "complexity": "light",
    "audience_shape": "single"
  }
}
```

Rules fired:
- Default rule: `purpose=update AND risk_level=low AND complexity=light` → default `lite`.
- No minimum rules fire.

`final_mode = lite`.

Required stages: brief, strategy_gate, outline_lite, draft, editor.

Required gates: `strategy_gate_passed`.

### 14.3 Public technical explainer blog with high stakes

```json
{
  "classification": {
    "purpose": "explainer",
    "channel": "external",
    "risk_level": "high",
    "complexity": "standard",
    "audience_shape": "single"
  }
}
```

Rules fired:
- Default rule: none of the lite or flagship defaults match (`channel=external` but `complexity≠deep`); falls through to default `standard`.
- Minimum: `risk_level=high AND channel=external` → minimum `flagship`.

`final_mode = max(standard, flagship) = flagship`.

Required stages: full flagship path.

Required gates: all six. Worth noting: even though the topic is "just a blog post," external + high stakes triggers full flagship rigor. This is the model working correctly — channel and consequence drive intensity, not the format label.

---

## 15. Forward references to RFC-1

This RFC composes with [RFC-1](./RFC-1.md):

- **RFC-1 #3 (schema validation).** This RFC's `quality_gates` predicates depend on schemas being enforceable. The schemas to author: `classification.schema.json`, `state.schema.json` (extended for `gates_satisfied` and `classification.history`), `outline.schema.json`, `fact-check.schema.json`, `research.schema.json`.
- **RFC-1 #1 (parallelized review suite).** Mode = `flagship` with all three reviewers (`audience_reviewer + opposition_reviewer + fact_checker`) is the canonical fan-out target. Implementing `/gpd-review-suite` simplifies flagship execution.
- **RFC-1 #4 (bias mitigation).** The `audience_shape = hybrid` rule and the `audience_conflicts_resolved` gate naturally invoke the cross-model judge rule and binary scoring proposed in RFC-1.
- **RFC-1 #8 (instrumentation).** Mode and classification are exactly the labels you'd want for retrospective analysis. The `STATE.json:classification.history` log feeds directly into `gpd history`.

Adopt both RFCs together. RFC-1 makes agents produce better artifacts; this RFC makes the system pick the right intensity.

---

## 16. Implementation order

1. **Author the JSON schema for classification + extended STATE.json.** Reusable by RFC-1's schema validator. Small effort, large payoff.
2. **Implement `gpd classify` / `gpd reclassify`.** Interactive 5-question flow. Writes classification + derives mode + appends history.
3. **Implement mode-derivation engine.** ~50 lines in `bin/lib/mode.js`. Pure function: `(classification) → { mode, rule_trace }`.
4. **Extend `gpd validate`** to evaluate `required_gates` against `STATE.json:gates_satisfied`. Define the gate predicates (Section 7) as named functions in `bin/lib/gates.js`.
5. **Update `gpd init` and `gpd import`** to set initial classification (interactive prompts or defaults if `--non-interactive`).
6. **Migrate existing workflows** (`brief.md`, `outline.md`, `draft.md`, `review.md`, `fact-check.md`) to consult `config.json:mode` for stage requirements instead of hardcoded heuristics ("for serious papers …", "for 1,200+ word papers …").
7. **Update agents** (paper-strategist especially) to read classification + mode and tune behavior.
8. **Backward-compatibility shim.** Papers without classification get `mode=standard, classification=null` and a `STATE.json:blocked_by="needs classification"` entry.
9. **Tests.** Mode-derivation table tests, gate predicate tests, override-direction tests, migration tests.
10. **Documentation.** Update `DESIGN-SPEC.md`, `README.md`, and `references/writing-artifacts.md` with the new policy layer.

Items 1–3 are the load-bearing core. Items 4–6 land the policy in the workflow. Items 7–10 are integration polish.

---

## 17. Open questions

- **Reclassification on research findings.** Should `paper-researcher` propose reclassification when research surfaces unexpected stakes? Recommend: yes, but as a strategist-surfaced flag, not an automatic rewrite.
- **Hybrid audience-shape justification format.** Single sentence in `BRIEF.md`? Dedicated field in classification (`hybrid_justification: "..."`)? Recommend the field; it makes downstream review predictable.
- **`risk_level=regulated` may need substructure.** Different regulated contexts (financial, medical, legal) imply different proof standards. Extension path: optional `regulated_context: financial | medical | legal | other` field. Defer until a real regulated paper hits the system.
- **Gate predicates over time.** Predicates should be versioned. If we change what `evidence_for_against_complete` means, papers validated under the old definition shouldn't silently fail. Recommend `gates_satisfied` entries record `predicate_version` alongside `satisfied`.

---

## Sources

- [RFC-1 — Research-Driven Improvement Plan](./RFC-1.md) — companion RFC. Sources for AI workflow patterns, schema enforcement, bias mitigation, and prompt-eval frameworks live there.
- The classification axes were derived by decomposing the existing `PROJECT.md:document_type` field's actual usage observed in the GPD codebase (`commands/gpd/*.md`, `workflows/*.md`) and in the curated audience personas (`audiences/*.md`).
- The mode-derivation algorithm follows standard policy-engine design (default + minimum-floor rules with deterministic resolution). The rule shape is similar to IETF BCP "MUST / SHOULD / MAY" semantics applied to workflow stages.
- The split between policy (`config.json`) and state (`STATE.json`) follows the convention used elsewhere in GPD's own tooling (e.g., `INSTALL-MANIFEST.json` records what was installed; install command declares what to install).
- The override audit trail design mirrors common audit-log patterns for compliance-sensitive systems.

No external academic citations were preserved from the original proposal because the original's footnote markers `[1]`–`[8]` were not accompanied by a sources list. If specific external sources informed the original taxonomy, they should be added here.
