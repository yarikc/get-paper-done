# Strategy Review

## Strategic Readiness

- **Status:** Go
- **Current thesis:** High-risk AI and software deployments should use a lightweight supply-chain control process because dependency, artifact, AI runtime, and open-source risk can change outside a normal approval moment.
- **Recommended thesis:** Require a lightweight supply-chain control process for high-risk AI and software deployments, including pilots moving into production-like use, using a supply-chain control record as the artifact for observed evidence, owner attestation, validation, exception handling, and residual-risk approval.
- **Primary blocker:** none
- **Required unblock action:** none

## Strategy Blockers

- **Blocking issues:** none
- **Primary blocker:** none
- **Block severity:** None
- **Required unblock action:** none

## Thesis Package

- **Paper job:** Win approval for a lightweight control process.
- **Reader promise:** The reader can approve or reject a bounded baseline with clear evidence categories, decision rules, refresh triggers, and an exception path.
- **Argument posture:** Prescriptive decision memo.

### Thesis Tests

| Test | Pass? | Notes |
|---|---|---|
| Specific decision | Yes | The ask is to approve a supply-chain control process for high-risk deployments, including pilots moving into production-like use. |
| Contestable | Yes | A skeptic can argue the process creates stale checklists or repeated manual handoffs. |
| Evidence-backed | Yes | Public references support the evidence categories, not the exact internal control process. |
| Audience-relevant | Yes | The primary reader owns risk and approval burden; the secondary reader owns implementation detail. |
| Bounded | Yes | The memo excludes full assurance, procurement, vendor-risk, and compliance programs. |

### Reasoning Spine

1. Deployment approval is weak when dependency, build, AI runtime, and open-source risk questions are answered ad hoc or captured once and then left stale.
2. Public software supply-chain and AI security references support a small set of evidence categories that reviewers can inspect consistently.
3. A lightweight control process with observed evidence, owner attestation, decision rules, and exception-based review is lighter than a separate approval board and clearer than relying on team assertions.

## Strategic Gaps

| ID | Type | Description | Why It Matters | Fix Instruction |
|---|---|---|---|---|
| G1 | process_burden | The memo must preempt the objection that this is new bureaucracy. | Without that answer, the primary reader may reject the proposal as friction. | Explain automation-by-default and human review by exception. |
| G2 | source_scope | Public references support categories, not the exact internal field list or process. | Overstating the standards would weaken credibility. | Label control record fields as proposed internal mechanics. |
| G3 | owner_model | The memo needs an owner and validator model. | Otherwise the recommendation is not operational. | Include deployment owner, exception reviewer, decision owner, and sample validation at a generic level. |
| G4 | evidence_currency | A one-time packet becomes stale when dependencies or artifacts change. | This is the strongest reader objection and affects approval quality. | Require refresh on material dependency, artifact, deployment, or exception changes. |
| G5 | decision_rules | The memo needs to explain how evidence changes approval handling. | Otherwise the record sounds like paperwork instead of a control. | Add simple proceed / proceed with exception / hold / refresh-and-review rules. |
| G6 | ai_specificity | The memo claims AI scope but must show why AI and LLM systems need fields beyond conventional dependency scanning. | Without this, the paper reads like a generic software supply-chain memo with AI in the title. | Add AI runtime inventory and material-change triggers for model/provider, prompt/configuration, retrieval/source, and tool-permission changes. |

## Recommended Shape

Use a concise decision memo:

1. Open with the ask.
2. Explain why the current ad hoc review pattern is weak.
3. Introduce the supply-chain control record as the process artifact.
4. Show why each software and AI runtime element belongs, with source IDs.
5. Address decision rules, refresh triggers, automation, process burden, and exceptions.
6. Close with the approval decision.

## Block / Override

No block. Proceed to research, outline, draft, fact-check, review, and export.
