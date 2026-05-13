# RFC-2.1: Progressive Classification And Policy-Driven Checks

- **Status:** Draft
- **Author:** Codex, based on review of RFC-2
- **Date:** 2026-05-10
- **Scope:** GPD policy layer — paper classification, workflow mode recommendation, and required quality checks
- **Tracking Issue:** [#15](https://github.com/yarikc/get-paper-done/issues/15)
- **Supersedes:** [RFC-2](RFC-2.md) if accepted
- **Ignores dependency status:** This RFC is written as the desired policy design, regardless of whether RFC-1 Phase 1 has landed.

## Summary

RFC-2 is directionally correct: GPD needs to replace the free-form `paper_type` string with a policy layer that can explain how much workflow rigor a paper deserves. But RFC-2 is too stage/agent-centric and too eager to route workflow behavior from classification.

RFC-2.1 keeps the core classification model but changes three important things:

1. Classification is **progressive**, not a five-field intake tax.
2. Mode is split into **recommended** and **selected**, with a rule trace.
3. Policy declares **required checks**, not required agents or exact stages.

The goal is to make GPD smarter without making every paper feel like a governance form.

---

## 1. Design Principles

1. Keep one coherent paper system.
2. Classify enough to guide rigor, not enough to satisfy metadata purity.
3. Prefer progressive inference over upfront questionnaires.
4. Separate policy intent from implementation mechanism.
5. Require quality checks, not specific agents.
6. Preserve user override, but make variance visible.
7. Keep lite work lightweight.

---

## 2. Core Model

The policy layer has four concepts:

| Concept | Purpose | Stored in |
|---|---|---|
| `classification` | Describes what the paper is trying to do and its stakes | `.paper/config.json` |
| `workflow_mode.recommended` | Mode derived from classification rules | `.paper/config.json` |
| `workflow_mode.selected` | Mode the user/system will actually follow | `.paper/config.json` |
| `required_checks` | Quality checks that must be satisfied before export or advancement | `.paper/config.json` and satisfaction state in `.paper/STATE.json` |

`config.json` owns policy. `STATE.json` owns progress and satisfaction.

---

## 3. Progressive Classification

Do not require the user to answer five metadata questions before writing.

Initial classification should start from three natural questions:

1. **What is this paper trying to do?**
2. **Who will read it and where will it circulate?**
3. **What happens if it is weak, wrong, or misread?**

GPD derives a provisional classification from those answers. The user can accept or correct it.

The full classification axes still exist, but they are filled progressively:

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

### 3.1 Purpose

Purpose describes the paper's job.

Allowed values:

- `decision_memo`
- `strategy_paper`
- `explainer`
- `update`

`update` is allowed but constrained. It should normally be `complexity=light` or `complexity=standard`. A high-rigor update should usually be reclassified as `decision_memo` or `strategy_paper` unless the user explicitly keeps it as an update.

### 3.2 Channel

Allowed values:

- `internal`
- `external`

No `mixed` value for now. If a paper has mixed circulation, classify by primary channel and capture secondary audience pressure in `audience_shape`.

### 3.3 Risk Level

Allowed values:

- `low`
- `medium`
- `high`
- `regulated`

This differs from RFC-2, which used only `low | high | regulated`.

`medium` is needed because many papers are not low-stakes, but calling them high-risk would over-route them into heavyweight process. `medium` maps naturally to standard rigor.

### 3.4 Complexity

Allowed values:

- `light`
- `standard`
- `deep`

Complexity describes structure and synthesis burden, not document length alone.

### 3.5 Audience Shape

Allowed values:

- `single`
- `prioritized_multi`
- `hybrid`

`hybrid` requires explicit justification:

```json
{
  "audience_shape": "hybrid",
  "hybrid_justification": "The paper is intentionally written for both executives and senior technologists, with no single audience allowed to dominate."
}
```

Use `hybrid` sparingly. Most multi-audience papers should be `prioritized_multi`.

---

## 4. Workflow Mode

Modes describe rigor level, not paper type.

Allowed selected/recommended values:

- `light`
- `standard`
- `rigorous`

RFC-2 used `lite | standard | flagship`. This RFC renames them:

- `light` is plain and user-facing.
- `standard` remains unchanged.
- `rigorous` is more operational than `flagship`.

If the project strongly prefers `lite | standard | flagship`, the concept still holds. The important change is the recommended/selected split.

### 4.1 Recommended vs Selected

Mode derivation produces a recommendation, not an unchallengeable command.

```json
{
  "workflow_mode": {
    "recommended": "rigorous",
    "selected": "standard",
    "source": "classification_rules",
    "variance_reason": "External but personal opinion piece with limited factual claims.",
    "rule_trace": [
      "risk_level=high AND channel=external -> recommend rigorous"
    ]
  }
}
```

If `selected` differs from `recommended`, `variance_reason` is required.

Downward variance from `rigorous` should require explicit confirmation. Downward variance from `regulated` should require `--force` and a reason.

---

## 5. Mode Derivation Rules

Mode is derived from classification using default and floor rules.

Mode order:

```text
light < standard < rigorous
```

Default mode:

| Classification pattern | Recommended mode |
|---|---|
| `purpose=update AND risk_level=low AND complexity=light` | `light` |
| `purpose=explainer AND channel=internal AND risk_level=low AND complexity=light` | `light` |
| `risk_level=medium` | `standard` |
| all other combinations | `standard` |

Floor rules:

| Trigger | Minimum recommended mode |
|---|---|
| `risk_level=regulated` | `rigorous` |
| `risk_level=high AND channel=external` | `rigorous` |
| `channel=external AND complexity=deep` | `rigorous` |
| `audience_shape=prioritized_multi OR audience_shape=hybrid` | `standard` |
| `purpose=strategy_paper AND complexity=deep` | `standard` |
| `purpose=decision_memo AND complexity IN {standard, deep}` | `standard` |

Final recommendation:

```text
recommended = max(default_mode, all floor rules that fire)
```

The rule trace must be stored so the user can see why a mode was recommended.

---

## 6. Required Checks, Not Required Agents

RFC-2 listed required stages such as `audience_reviewer`, `opposition_reviewer`, and `fact_checker`. That binds policy to implementation.

RFC-2.1 stores required checks instead:

```json
{
  "required_checks": {
    "strategy_gate": "required",
    "audience_fit": "required",
    "evidence_support": "required",
    "opposition": "conditional",
    "fact_check": "conditional",
    "final_edit": "required"
  }
}
```

Checks can later be satisfied by:

- a dedicated agent,
- a combined review workflow,
- a manual user approval,
- a future external review runner,
- or a simple structural validator for low-risk papers.

This keeps the policy layer stable even if GPD changes how reviews are implemented.

## 7. Check Defaults By Mode

### 7.1 Light

```json
{
  "strategy_gate": "required",
  "audience_fit": "optional",
  "evidence_support": "optional",
  "opposition": "optional",
  "fact_check": "optional",
  "structure_check": "required",
  "final_edit": "required"
}
```

Light mode should not require a separate `OUTLINE.md` artifact. It requires a structure check, which may be satisfied by a lite outline, a draft skeleton, or a brief-based structure confirmation.

### 7.2 Standard

```json
{
  "strategy_gate": "required",
  "audience_fit": "required",
  "evidence_support": "required",
  "opposition": "conditional",
  "fact_check": "conditional",
  "structure_check": "required",
  "final_edit": "required"
}
```

### 7.3 Rigorous

```json
{
  "strategy_gate": "required",
  "audience_fit": "required",
  "evidence_support": "required",
  "opposition": "required",
  "fact_check": "required",
  "structure_check": "required",
  "publication_readiness": "required",
  "final_edit": "required"
}
```

---

## 8. Check Satisfaction State

`STATE.json` should record check satisfaction separately from policy:

```json
{
  "checks_satisfied": {
    "strategy_gate": {
      "status": "passed",
      "source": ".paper/STRATEGY.md",
      "checked_at": "2026-05-10T10:00:00Z"
    },
    "fact_check": {
      "status": "not_required",
      "source": "classification",
      "checked_at": null
    }
  }
}
```

Allowed check statuses:

- `not_started`
- `passed`
- `warning`
- `blocked`
- `not_required`
- `waived`

If a required check is `waived`, a reason is required.

---

## 9. CLI Surface

This RFC implies a smaller CLI surface than RFC-2.

### 9.1 `gpd classify`

Classifies or reclassifies a paper.

Preferred syntax:

```bash
gpd classify --paper ~/papers/my-paper
gpd classify --paper ~/papers/my-paper --dry-run
```

Behavior:

- asks the three natural classification questions
- derives the five-axis classification
- derives recommended mode
- writes config only after confirmation
- appends classification history to `STATE.json`

### 9.2 `gpd mode`

Shows mode recommendation and variance.

```bash
gpd mode --paper ~/papers/my-paper
gpd mode --paper ~/papers/my-paper --set standard --reason "Personal essay, low factual burden"
```

### 9.3 `gpd status`

Prints:

- classification summary
- recommended mode
- selected mode
- missing required checks
- next suggested command

### 9.4 `gpd validate`

Validates:

- config schema
- state schema
- mode derivation consistency
- required checks vs satisfied checks
- waiver reasons

`gpd validate` should not require perfect semantic judgment. It should report what the policy layer can know.

---

## 10. Migration

Existing paper workspaces may lack classification.

Fallback behavior:

```json
{
  "classification": null,
  "workflow_mode": {
    "recommended": "standard",
    "selected": "standard",
    "source": "fallback_missing_classification"
  }
}
```

Missing classification should not block existing papers by default. It should create a warning:

```text
classification missing; using standard fallback
```

Active or high-stakes papers should be reclassified explicitly.

---

## 11. Implementation Phases

### Phase A: Pure Policy Core

Implement only:

- classification schema
- `deriveMode(classification)` pure function
- rule trace
- config shape
- tests for mode derivation

No workflow routing changes.

### Phase B: CLI Visibility

Implement:

- `gpd classify --dry-run`
- `gpd mode`
- `gpd status` classification/mode display
- fallback behavior for unclassified papers

Still no workflow routing changes.

### Phase C: Required Checks

Implement:

- `required_checks`
- `checks_satisfied`
- `gpd validate` checks against policy
- waiver handling

### Phase D: Workflow Integration

Only after the model survives real use:

- make `/gpd-outline`, `/gpd-draft`, `/gpd-review`, and `/gpd-fact-check` consult selected mode
- replace hardcoded heuristics gradually
- keep user override available

---

## 12. Open Questions

1. Should mode labels be `light | standard | rigorous` or preserve RFC-2's `lite | standard | flagship`?
2. Should `medium` risk be accepted, or should the system intentionally force low/high decisions?
3. Should `update` be constrained by schema so it cannot be `complexity=deep` without explicit override?
4. Which required checks can be satisfied manually?
5. Should `classification.history` live in `STATE.json`, or should it become a separate `.paper/log/classification.jsonl` later?

---

## 13. Recommendation

Adopt RFC-2.1 over RFC-2.

Do not start by changing the writing workflow. Start with a pure, tested classification and mode recommendation layer. Then expose it in CLI status. Only after real papers show that the recommendations are useful should GPD route stages or enforce checks from the policy layer.
