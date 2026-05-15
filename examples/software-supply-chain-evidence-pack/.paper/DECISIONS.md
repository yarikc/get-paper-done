# Paper Decision Records

This file records paper decisions that are hard to reconstruct later. It is not a task list, review log, research note, or scratchpad.

## Decision Index

| ID | Status | Decision | Why It Matters |
|----|--------|----------|----------------|
| PDR-0001 | accepted | Treat the paper as a decision memo, not a white paper. | Keeps the artifact concise and approval-oriented. |
| PDR-0002 | accepted | Add AI runtime evidence after reader feedback. | Fixes the gap where the original memo claimed AI scope while mostly proving generic software supply-chain control. |
| PDR-0003 | accepted | Frame the process as observed evidence plus exception-based validation. | Directly answers the bureaucracy objection without weakening the control ask. |

## PDR-0001: Decision Memo Shape

**Status:** accepted
**Date:** 2026-05-15

The paper is classified as `decision_memo / internal / internal_high / standard / prioritized_multi`. It asks the reader to approve a control process for high-risk pilots, so the final artifact should stay concise, state the ask early, and avoid expanding into a standards explainer.

### Considered Options

- Treat as a white-paper-like standards explainer.
- Treat as a decision memo with a short standards section.

### Consequences

- The opening must state the approval ask.
- Standards are explained as context, not as the paper's main subject.
- Detailed implementation design belongs in follow-on operational artifacts.

## PDR-0002: AI Runtime Evidence

**Status:** accepted
**Date:** 2026-05-15

Reader feedback showed that the memo claimed AI control scope while relying too much on generic software supply-chain evidence. The paper therefore added AI runtime inventory as a required evidence category.

### Considered Options

- Narrow the paper to generic software supply-chain control.
- Keep AI scope and add AI-specific runtime evidence.

### Consequences

- The control record now includes model/provider, prompt/configuration, retrieval-source, and tool-permission changes.
- Research includes NIST AI RMF, the NIST Generative AI Profile, OWASP LLM Top 10, and NCSC secure AI development guidance.
- Fact-check must preserve the boundary that these sources support evidence categories but do not prove deployment security.

## PDR-0003: Bureaucracy Boundary

**Status:** accepted
**Date:** 2026-05-15

The memo keeps the process burden low by preferring observed evidence where tooling can produce it and using human review by exception for stale evidence, threshold breaches, incomplete records, or explicit exceptions.

### Considered Options

- Require a standing review forum for every high-risk pilot.
- Use observed evidence, owner attestation, validation thresholds, and exception handling.

### Consequences

- The paper explicitly says the proposal does not create a separate forum.
- Owners still remain accountable for attestations that tooling cannot observe.
- Validation is focused on exceptions and sampled records instead of continuous manual handoff.
