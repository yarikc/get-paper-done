# Feedback Handling Plan

**Created:** 2026-05-13T23:20:00.000Z
**Based on:** `.paper/FEEDBACK-READER.md` and `.paper/exports/FINAL.md.feedback`
**Status:** Approved and applied

## Summary

Reader feedback found a blocking strategy failure: the memo defined a static evidence pack too weakly, introduced standards as authority signals without enough context, and did not address evidence currency after dependencies or promoted artifacts change. The second feedback pass also found that "living evidence record" sounded like fluff and that the actual ask should be a lightweight control process, not just a record. A later feedback pass found that the memo claimed AI scope but still read like conventional software supply-chain control. The approved handling changes the recommendation to a supply-chain control process with a control record, AI runtime evidence, decision rules, observed evidence, owner attestation, and human review by exception.

## Decision View

**Recommended decision:** Incorporate items 1-4 and 7-10 as blocking fixes. Incorporate item 5 only at memo-level detail and defer implementation schemas. Preserve item 6.

**Why:** The feedback exposed failures in the memo's ask, evidence model, process-burden answer, and AI-specific scope. Those issues would have made the decision memo weak even if the prose sounded polished.

**What improves:** The paper moves from a static evidence packet to a decision-ready control process with clearer approval language, standards context, evidence currency, AI runtime coverage, and exception-based governance.

**How:** Revise brief, strategy, research, outline, draft, fact-check, review, and export around the accepted items; keep detailed schema artifacts deferred until after the approval decision.

## Proposed Handling

### 1. Feedback Item

- **Feedback:** Opening ask is not clear until too late; "evidence pack" is not defined well enough.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** unclear ask blocks a decision memo; the reader can understand exactly what approval is requested.
- **Proposed Fix:** Define the ask as approval of a supply-chain control process, with the supply-chain control record as the required artifact.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** BRIEF.md, STRATEGY.md, OUTLINE.md, DRAFT.md, exports/FINAL.md

### 2. Feedback Item

- **Feedback:** CISA, NIST, SLSA, and OpenSSF read like name-dropping without a story for why the references matter.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** unexplained standards read as authority theater; evidence credibility and reader trust.
- **Proposed Fix:** Add a compact references-and-standards section that explains each source's role and bounds the claim.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** RESEARCH.md, DRAFT.md, FACT-CHECK.md, exports/FINAL.md

### 3. Feedback Item

- **Feedback:** Static evidence becomes obsolete when dependency versions, artifacts, AI runtime inputs, or deployments change.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** static evidence becomes stale as deployments and dependencies change; operational usefulness of the control model.
- **Proposed Fix:** Add refresh triggers for dependency, artifact, model/provider, prompt/configuration, retrieval/source, tool-permission, deployment, and exception changes.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** BRIEF.md, STRATEGY.md, RESEARCH.json, OUTLINE.md, DRAFT.md, FACT-CHECK.md, exports/FINAL.md

### 4. Feedback Item

- **Feedback:** Bureaucracy objection is unresolved because the memo adds multiple human roles.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** the memo otherwise looks like new bureaucracy; process-burden credibility.
- **Proposed Fix:** Shift operating model to automation-by-default and human review by exception.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** STRATEGY.md, OUTLINE.md, DRAFT.md, REVIEW.md, exports/FINAL.md

### 5. Feedback Item

- **Feedback:** Reader needs fields, thresholds, ownership, recertification, evidence IDs, lifecycle states, and examples.
- **Source(s):** Human reader
- **Decision:** Incorporate (Partly valid)
- **Why It Matters:** the reader needs enough operating detail to approve the control, but not a full implementation pack; decision confidence without bloating the memo.
- **Proposed Fix:** Include fields, ownership, refresh triggers, and exception lifecycle in the memo; defer detailed schemas, IDs, and templates to implementation after approval.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** BRIEF.md, OUTLINE.md, DRAFT.md, exports/FINAL.md

### 6. Feedback Item

- **Feedback:** Tone is acceptable.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** the tone was not the failure mode; continuity and concision.
- **Proposed Fix:** Preserve direct executive memo tone.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** DRAFT.md, REVIEW.md, exports/FINAL.md

### 7. Feedback Item

- **Feedback:** "Living evidence record" sounds like fluff.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** "living evidence record" sounded vague; artifact clarity and executive confidence.
- **Proposed Fix:** Rename the artifact to supply-chain control record and make the process the approval ask.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** BRIEF.md, STRATEGY.md, DRAFT.md, exports/FINAL.md

### 8. Feedback Item

- **Feedback:** The memo needs to explain how evidence changes approval decisions.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** evidence only matters if it changes decisions; control utility.
- **Proposed Fix:** Add proceed / proceed with exception / hold / refresh-and-review decision rules.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** OUTLINE.md, DRAFT.md, FACT-CHECK.md, REVIEW.md, exports/FINAL.md

### 9. Feedback Item

- **Feedback:** Automation should create observed evidence, not only maintain owner-declared data.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** owner-declared evidence alone is weak; defensibility and audit readiness.
- **Proposed Fix:** Add observed evidence plus owner attestation language.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** DRAFT.md, FACT-CHECK.md, exports/FINAL.md

### 10. Feedback Item

- **Feedback:** AI scope is under-supported; the paper needs to address traditional AI and LLM deployments, especially where SDLC dependency tooling does not cover model/provider, prompt/configuration, retrieval/source, and tool-permission risk.
- **Source(s):** Human reader
- **Decision:** Incorporate (Valid)
- **Why It Matters:** the original memo claimed AI scope without enough AI-specific evidence; source fit and risk coverage.
- **Proposed Fix:** Route back through research and add NIST AI RMF, NIST Generative AI Profile, OWASP LLM Top 10, and NCSC secure AI guidance; add AI runtime inventory to the control record.
- **Guardrail:** Keep the fix proportional to the approved memo scope; do not expand into a full implementation plan.
- **User Override:** Approved as recommended.
- **Affected Artifact:** RESEARCH.json, RESEARCH.md, BRIEF.md, STRATEGY.md, OUTLINE.md, DRAFT.md, FACT-CHECK.md, REVIEW.md, exports/FINAL.md

## Below-Target Items

| # | Issue | Target Bar Impact | Action | Reason |
|---|-------|-------------------|--------|--------|
| 1 | Original memo had weak evidence and ask clarity. | Blocked export until AI runtime evidence and decision rules were added. | Incorporate | Human feedback identified a real below-target failure in the core decision memo. |
| 2 | Detailed evidence ID schema, lifecycle-state enum, packet template, threshold catalog, and recertification cadence. | Does not block memo export because these are implementation artifacts after approval. | Defer | The memo should stay concise and decision-oriented. |

## Incorporate

- Redefine the paper's ask as a lightweight supply-chain control process.
- Use "supply-chain control record" for the required artifact.
- Add reference context before relying on CISA, NIST, SLSA, and OpenSSF.
- Add reference context for NIST AI RMF, NIST Generative AI Profile, OWASP LLM Top 10, and NCSC secure AI guidance.
- Add AI runtime inventory fields for model/provider, prompt/configuration, retrieval/source, and tool-permission evidence.
- Add refresh triggers for dependency, artifact, AI runtime, deployment, and exception changes.
- Add observed evidence, owner attestation, decision rules, and human review by exception.
- Keep the memo concise and decision-oriented.

## Ignore

- None.

## Defer

- Detailed evidence ID schema, lifecycle-state enum, packet template, threshold catalog, and recertification cadence. These are implementation artifacts that should follow the approval decision.

## User Decisions Needed

- None for this revision. The user approved moving forward with the feedback handling.

## Approval Gate

Approved in conversation before revision. Revision has been applied to upstream artifacts, draft, fact-check, review, state, and export.
