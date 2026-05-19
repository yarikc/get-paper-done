# Feedback Handling Plan

**Created:** 2026-05-13T23:20:00.000Z
**Based on:** `.paper/FEEDBACK-READER.md` and `.paper/exports/FINAL.md.feedback`
**Status:** Approved by user

## Summary

Reader feedback found a blocking strategy failure: the memo defined a static evidence pack too weakly, introduced standards without enough context, and did not address evidence currency after dependencies, AI runtime inputs, or promoted artifacts changed. Later feedback also found that "living evidence record" sounded vague and that the paper claimed AI scope while still reading like conventional software supply-chain control. The approved handling changed the recommendation to a supply-chain control process with a control record, AI runtime evidence, decision rules, observed evidence, owner attestation, and human review by exception.

## Decision View

Review each concern. Use `approve`, `modify`, `defer`, or `reject`.

| # | Concern | Type | Severity | Recommendation | User Decision |
|---|---------|------|----------|----------------|---------------|
| 1 | Ask and governed object were unclear | Concern | HIGH | approve | approve |
| 2 | Standards needed context, not name-dropping | Concern | HIGH | approve | approve |
| 3 | Evidence needed currency and refresh rules | Concern | HIGH | approve | approve |
| 4 | Process-burden objection was unresolved | Concern | HIGH | approve | approve |
| 5 | Implementation detail needed a memo-level boundary | Concern | MEDIUM | modify | modify |
| 6 | Tone should be preserved | Review Note | LOW | defer | defer |
| 7 | "Living evidence record" sounded vague | Concern | HIGH | approve | approve |
| 8 | Evidence needed to change decisions | Concern | HIGH | approve | approve |
| 9 | Owner-declared evidence needed observed evidence | Concern | HIGH | approve | approve |
| 10 | AI scope was under-supported | Concern | HIGH | approve | approve |

## Proposed Handling

### 1. Concern: Ask and governed object were unclear

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** An unclear ask blocks a decision memo because the reader cannot tell what they are being asked to approve.
- **What improves if addressed:** The memo becomes decision-ready because approval is tied to a named control process and required artifact.
- **Risk if handled badly:** The paper could expand into a full implementation plan instead of staying a concise decision memo.
- **Proposed handling:** Define the ask as approval of a supply-chain control process, with the supply-chain control record as the required artifact.
- **Proposed edits:**
  1. Rename the ask from evidence pack approval to control-process approval.
  2. Define the supply-chain control record before relying on it.
- **Reviewer evidence:**
  - Reader said the opening ask and "evidence pack" were not defined clearly enough.
- **Affected artifacts:** BRIEF.md / STRATEGY.md / OUTLINE.md / DRAFT.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Keep the fix proportional to the approved memo scope.

### 2. Concern: Standards needed context, not name-dropping

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** Unexplained standards read as authority theater and weaken evidence credibility.
- **What improves if addressed:** The memo explains why CISA, NIST, SLSA, OpenSSF, OWASP, and NCSC are relevant without implying they mandate the exact internal workflow.
- **Risk if handled badly:** The paper could overstate source authority or drown a memo in source explanation.
- **Proposed handling:** Add a compact references-and-standards section that explains each source's role and bounds the claim.
- **Proposed edits:**
  1. Explain each standard as source context.
  2. State that the sources support evidence categories but do not mandate the exact workflow.
- **Reviewer evidence:**
  - Reader said the references looked credible but were not explained in context.
- **Affected artifacts:** RESEARCH.md / DRAFT.md / FACT-CHECK.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Keep source explanation concise.

### 3. Concern: Evidence needed currency and refresh rules

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** Static evidence becomes stale when dependencies, artifacts, AI runtime inputs, or deployments change.
- **What improves if addressed:** The control model becomes operationally useful because evidence is refreshed when material risk changes.
- **Risk if handled badly:** The memo could imply a heavy recertification process instead of lightweight trigger-based refresh.
- **Proposed handling:** Add refresh triggers for dependency, artifact, model/provider, prompt/configuration, retrieval/source, tool-permission, deployment, and exception changes.
- **Proposed edits:**
  1. Add a material-change trigger list.
  2. Tie refresh to review packets and decision rules.
- **Reviewer evidence:**
  - Reader flagged that static evidence becomes obsolete after deployment or dependency changes.
- **Affected artifacts:** BRIEF.md / STRATEGY.md / RESEARCH.json / OUTLINE.md / DRAFT.md / FACT-CHECK.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Do not turn trigger language into a waterfall process.

### 4. Concern: Process-burden objection was unresolved

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** If the memo looks like new bureaucracy, the decision maker may reject the control even if the risk argument is valid.
- **What improves if addressed:** The memo becomes more credible by showing automation-by-default and human review by exception.
- **Risk if handled badly:** The paper could sound like it is dismissing governance responsibilities.
- **Proposed handling:** Shift the operating model to automation-created evidence, owner attestation, and exception-based human review.
- **Proposed edits:**
  1. Name automation as the default evidence producer.
  2. Reserve human review for exceptions and material changes.
- **Reviewer evidence:**
  - Reader anticipated pushback that the proposal creates new bureaucracy.
- **Affected artifacts:** STRATEGY.md / OUTLINE.md / DRAFT.md / REVIEW.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Preserve governance seriousness while reducing process burden.

### 5. Concern: Implementation detail needed a memo-level boundary

- **Type:** Concern
- **Severity:** MEDIUM
- **Source(s):** Human reader
- **Recommendation:** modify
- **Why this matters:** The reader needs enough operating detail to approve the control, but a full schema would bloat the memo.
- **What improves if addressed:** The memo gives decision confidence without becoming an implementation packet.
- **Risk if handled badly:** The paper could become generic if it avoids all detail, or too long if it specifies every field and template.
- **Proposed handling:** Include fields, ownership, refresh triggers, and exception lifecycle at memo level; defer detailed schemas, IDs, and templates.
- **Proposed edits:**
  1. Include the fields needed to understand the control record.
  2. Defer detailed evidence ID schema, lifecycle-state enum, packet template, threshold catalog, and recertification cadence.
- **Reviewer evidence:**
  - Reader asked for fields, thresholds, ownership, recertification, evidence IDs, lifecycle states, and examples.
- **Affected artifacts:** BRIEF.md / OUTLINE.md / DRAFT.md / exports/FINAL.md
- **User Decision:** modify
- **User Constraint:** Include enough operating detail for approval, but keep detailed implementation artifacts out of this memo.

### 6. Review Note: Tone should be preserved

- **Type:** Review Note
- **Severity:** LOW
- **Source(s):** Human reader
- **Recommendation:** defer
- **Why this matters:** Tone was not the failure mode, so revision should not flatten the direct executive memo voice.
- **What improves if addressed:** The revised memo keeps its concise, decision-oriented tone.
- **Risk if handled badly:** The paper could become generic or padded.
- **Proposed handling:** Preserve direct executive memo tone while fixing ask, evidence, and operating model.
- **Proposed edits:**
  1. Keep the tone direct and concise.
- **Reviewer evidence:**
  - Reader said the tone was good.
- **Affected artifacts:** DRAFT.md / REVIEW.md / exports/FINAL.md
- **User Decision:** defer
- **User Constraint:** Preserve the existing voice during revision.

### 7. Concern: "Living evidence record" sounded vague

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** Vague artifact names reduce executive confidence and make the ask sound like process fluff.
- **What improves if addressed:** The required artifact becomes concrete and governable.
- **Risk if handled badly:** The replacement name could still sound bureaucratic if not tied to decision use.
- **Proposed handling:** Rename the artifact to supply-chain control record and make the process the approval ask.
- **Proposed edits:**
  1. Replace "living evidence record" with "supply-chain control record."
  2. Explain how the record supports the control process.
- **Reviewer evidence:**
  - Reader said "living evidence record" sounded like fluff.
- **Affected artifacts:** BRIEF.md / STRATEGY.md / DRAFT.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Use plain control language.

### 8. Concern: Evidence needed to change decisions

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** Evidence only matters if it changes approval decisions.
- **What improves if addressed:** The control process becomes actionable through proceed, proceed with exception, hold, and refresh-and-review rules.
- **Risk if handled badly:** Decision rules could become too rigid for pilot variation.
- **Proposed handling:** Add compact decision rules that show how evidence changes approval outcomes.
- **Proposed edits:**
  1. Add proceed / proceed with exception / hold / refresh-and-review rules.
- **Reviewer evidence:**
  - Reader asked how evidence changes approval decisions.
- **Affected artifacts:** OUTLINE.md / DRAFT.md / FACT-CHECK.md / REVIEW.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Keep decision rules at memo-level detail.

### 9. Concern: Owner-declared evidence needed observed evidence

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** Owner-declared evidence alone is weak for defensibility and audit readiness.
- **What improves if addressed:** The memo distinguishes observed evidence from owner attestation.
- **Risk if handled badly:** The paper could overclaim that automated evidence proves security.
- **Proposed handling:** Add observed evidence plus owner attestation language.
- **Proposed edits:**
  1. State that automation creates observed evidence.
  2. State that owners attest to exceptions and context that automation cannot infer.
- **Reviewer evidence:**
  - Reader said automation should create observed evidence, not only maintain owner-declared data.
- **Affected artifacts:** DRAFT.md / FACT-CHECK.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Avoid claiming evidence proves the deployment is secure.

### 10. Concern: AI scope was under-supported

- **Type:** Concern
- **Severity:** HIGH
- **Source(s):** Human reader
- **Recommendation:** approve
- **Why this matters:** The original memo claimed AI scope without enough AI-specific evidence.
- **What improves if addressed:** The control record covers model/provider, prompt/configuration, retrieval/source, and tool-permission evidence.
- **Risk if handled badly:** The memo could conflate traditional software supply-chain control with AI runtime governance.
- **Proposed handling:** Route back through research, add AI-specific sources, and add AI runtime inventory to the control record.
- **Proposed edits:**
  1. Add NIST AI RMF, NIST Generative AI Profile, OWASP LLM Top 10, and NCSC secure AI guidance.
  2. Add AI runtime inventory fields to the control record.
- **Reviewer evidence:**
  - Reader said the memo claimed AI scope but still read like conventional software supply-chain control.
- **Affected artifacts:** RESEARCH.json / RESEARCH.md / BRIEF.md / STRATEGY.md / OUTLINE.md / DRAFT.md / FACT-CHECK.md / REVIEW.md / exports/FINAL.md
- **User Decision:** approve
- **User Constraint:** Keep AI runtime coverage bounded to the decision memo's control-process ask.

## Below-Target Items

| # | Issue | Target Bar Impact | Recommendation | Reason |
|---|-------|-------------------|----------------|--------|
| 1 | Original memo had weak evidence and ask clarity. | Blocked export until AI runtime evidence and decision rules were added. | approve | Human feedback identified a real below-target failure in the core decision memo. |
| 2 | Detailed evidence ID schema, lifecycle-state enum, packet template, threshold catalog, and recertification cadence. | Does not block memo export because these are implementation artifacts after approval. | defer | The memo should stay concise and decision-oriented. |

## Approved Or Modified

- Redefine the paper's ask as a lightweight supply-chain control process.
- Use "supply-chain control record" for the required artifact.
- Add reference context for software supply-chain and AI governance sources.
- Add AI runtime inventory fields for model/provider, prompt/configuration, retrieval/source, and tool-permission evidence.
- Add refresh triggers for dependency, artifact, AI runtime, deployment, and exception changes.
- Add observed evidence, owner attestation, decision rules, and human review by exception.
- Keep the memo concise and decision-oriented.

## Rejected

- None.

## Deferred

- Detailed evidence ID schema, lifecycle-state enum, packet template, threshold catalog, and recertification cadence. These are implementation artifacts that should follow the approval decision.

## User Decisions Needed

- None for this revision. The user approved moving forward with the feedback handling.

## Approval Gate

Approved in conversation before revision. Revision has been applied to upstream artifacts, draft, fact-check, review, state, and export.
