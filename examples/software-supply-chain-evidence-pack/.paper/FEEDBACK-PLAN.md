# Feedback Handling Plan

**Created:** 2026-05-13T23:20:00.000Z
**Based on:** `.paper/READER-FEEDBACK.md` and `.paper/exports/FINAL.md.feedback`
**Status:** Approved and applied

## Summary

Reader feedback found a blocking strategy failure: the memo defined a static evidence pack too weakly, introduced standards as authority signals without enough context, and did not address evidence currency after dependencies or promoted artifacts change. The second feedback pass also found that "living evidence record" sounded like fluff and that the actual ask should be a lightweight control process, not just a record. A later feedback pass found that the memo claimed AI scope but still read like conventional software supply-chain control. The approved handling changes the recommendation to a supply-chain control process with a control record, AI runtime evidence, decision rules, observed evidence, owner attestation, and human review by exception.

## Proposed Handling

| # | Feedback | Source(s) | Assessment | Recommendation | Proposed Handling | Affected Artifact |
|---|----------|-----------|------------|----------------|-------------------|-------------------|
| 1 | Opening ask is not clear until too late; "evidence pack" is not defined well enough. | Human reader | Valid | Incorporate | Define the ask as approval of a supply-chain control process, with the supply-chain control record as the required artifact. | BRIEF.md, STRATEGY.md, OUTLINE.md, DRAFT.md, exports/FINAL.md |
| 2 | CISA, NIST, SLSA, and OpenSSF read like name-dropping without a story for why the references matter. | Human reader | Valid | Incorporate | Add a compact references-and-standards section that explains each source's role and bounds the claim. | RESEARCH.md, DRAFT.md, FACT-CHECK.md, exports/FINAL.md |
| 3 | Static evidence becomes obsolete when dependency versions, artifacts, AI runtime inputs, or deployments change. | Human reader | Valid | Incorporate | Add refresh triggers for dependency, artifact, model/provider, prompt/configuration, retrieval/source, tool-permission, deployment, and exception changes. | BRIEF.md, STRATEGY.md, RESEARCH.json, OUTLINE.md, DRAFT.md, FACT-CHECK.md, exports/FINAL.md |
| 4 | Bureaucracy objection is unresolved because the memo adds multiple human roles. | Human reader | Valid | Incorporate | Shift operating model to automation-by-default and human review by exception. | STRATEGY.md, OUTLINE.md, DRAFT.md, REVIEW.md, exports/FINAL.md |
| 5 | Reader needs fields, thresholds, ownership, recertification, evidence IDs, lifecycle states, and examples. | Human reader | Partly valid | Incorporate | Include fields, ownership, refresh triggers, and exception lifecycle in the memo; defer detailed schemas, IDs, and templates to implementation after approval. | BRIEF.md, OUTLINE.md, DRAFT.md, exports/FINAL.md |
| 6 | Tone is acceptable. | Human reader | Valid | Incorporate | Preserve direct executive memo tone. | DRAFT.md, REVIEW.md, exports/FINAL.md |
| 7 | "Living evidence record" sounds like fluff. | Human reader | Valid | Incorporate | Rename the artifact to supply-chain control record and make the process the approval ask. | BRIEF.md, STRATEGY.md, DRAFT.md, exports/FINAL.md |
| 8 | The memo needs to explain how evidence changes approval decisions. | Human reader | Valid | Incorporate | Add proceed / proceed with exception / hold / refresh-and-review decision rules. | OUTLINE.md, DRAFT.md, FACT-CHECK.md, REVIEW.md, exports/FINAL.md |
| 9 | Automation should create observed evidence, not only maintain owner-declared data. | Human reader | Valid | Incorporate | Add observed evidence plus owner attestation language. | DRAFT.md, FACT-CHECK.md, exports/FINAL.md |
| 10 | AI scope is under-supported; the paper needs to address traditional AI and LLM deployments, especially where SDLC dependency tooling does not cover model/provider, prompt/configuration, retrieval/source, and tool-permission risk. | Human reader | Valid | Incorporate | Route back through research and add NIST AI RMF, NIST Generative AI Profile, OWASP LLM Top 10, and NCSC secure AI guidance; add AI runtime inventory to the control record. | RESEARCH.json, RESEARCH.md, BRIEF.md, STRATEGY.md, OUTLINE.md, DRAFT.md, FACT-CHECK.md, REVIEW.md, exports/FINAL.md |

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
