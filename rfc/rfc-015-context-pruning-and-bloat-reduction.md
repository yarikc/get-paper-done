# RFC-015: Context Pruning and Bloat Reduction

**Status:** Proposed
**Author:** AI Orchestrator / User
**Created:** 2026-05-20

## 1. Objective
To drastically reduce LLM latency, token cost, and "lost-in-the-middle" context eviction during the revision phase by pruning obsolete metadata from the agent's required reading list. This architectural change must be validated by a strict A/B test to ensure no degradation in output quality.

## 2. Background
Analysis of a real imported architecture-paper workspace revealed a severe token-saturation risk. While the UX of approving feedback via `/gpd-feedback` is clean, the underlying artifacts (`FEEDBACK-READER.md`, `FEEDBACK-PLAN.md`, `REVISION-LOG.md`) routinely exceed hundreds of kilobytes.

Currently, downstream agents (like `paper-editor` and `paper-drafter`) are instructed to read this entire historical trace. Feeding ~250k tokens of resolved debate into an LLM just to execute a 5-point instruction plan causes massive latency and risks the LLM forgetting foundational constraints (like `PERSONA.md` or `STRATEGY.md`) due to context window saturation.

## 3. Proposed Solutions

### 3.1. Just-In-Time Instruction Compilation
**The Problem:** Agents read the entire `FEEDBACK-PLAN.md` (which includes rationale, evidence quotes, and external review snippets) when they only need the approved instructions.
**The Solution:** Isolate actionable instructions from historical rationale.
*   **Implementation:**
    *   When a user finishes the `/gpd-feedback` approval loop, the CLI generates a durable revision-cycle file: `.paper/REVISION-INSTRUCTIONS.md`.
    *   This file contains the actionable `Instruction` and `User Constraint` fields for items marked `approve` or `modify`.
    *   It includes provenance links back to concern IDs, decision set IDs, and source artifacts.
    *   Deferred and rejected items are excluded from active instructions, with a short "not in scope" summary where useful.

### 3.2. Context Pruning in Agent Prompts
**The Problem:** The `<required_reading>` block in agent system prompts mandates the ingestion of bloated historical files.
**The Solution:** Strictly limit downstream agents to reading active state.
*   **Implementation:**
    *   Update `agents/paper-editor.md` and `agents/paper-drafter.md`.
    *   **Remove from default required reading:** `.paper/FEEDBACK-EXTERNAL.md`, `.paper/FEEDBACK-READER.md`, `.paper/FEEDBACK-PLAN.md`, and `.paper/REVISION-LOG.md`.
    *   **Add:** `.paper/REVISION-INSTRUCTIONS.md` (if present).
    *   Full feedback artifacts remain available for selective inspection when a compiled instruction is ambiguous.

## 4. Mandatory Validation (A/B Test Design)
Because stripping context risks degrading the quality of the LLM's revisions, this RFC cannot be implemented until the following A/B test is executed and passed.

### 4.1. The Baseline (Control)
1.  Use a mature workspace with pending approved feedback.
2.  Run `/gpd-revise` using the current, unpruned agent prompts.
3.  Record: Time-to-first-token and Total Run Time.
4.  Run `gpd validate --semantic`.
5.  Generate `.paper/REVISION-CHECK.md` and record the 1-5 quality scores (Thesis Clarity, Argument Flow, Persona/Voice, etc.).
6.  Run `gpd restore` to revert the draft to the pre-revision state.

### 4.2. The Variable (Test)
1.  Manually create `.paper/REVISION-INSTRUCTIONS.md` containing only the approved edit instructions and constraints.
2.  Locally modify `agents/paper-editor.md` to remove the bloated files and require the new instruction file.
3.  Run `/gpd-revise`.
4.  Record: Time-to-first-token and Total Run Time.
5.  Run `gpd validate --semantic`.
6.  Generate `.paper/REVISION-CHECK.md` and record the 1-5 quality scores.

### 4.3. Success Criteria
The proposal is validated for implementation if and only if the Test run:
1.  Decreases total run time/latency significantly.
2.  Passes `gpd validate --semantic` with no new warnings.
3.  Does not materially regress `REVISION-CHECK.md` scores. A practical threshold is no dimension dropping by more than 0.5 on a 1-5 scale, or weighted aggregate dropping by no more than 0.2.
4.  Successfully implements the specific instructions provided in `REVISION-INSTRUCTIONS.md`.

## 5. Drawbacks
*   The LLM loses access to the nuanced reasoning behind an edit request. If a user constraint is vague, the LLM cannot look back at the raw external feedback to guess the intent.
*   Introduces another revision-cycle artifact (`REVISION-INSTRUCTIONS.md`) that must remain tied to the feedback decisions and snapshot history.

## 6. Implementation Recommendation

**Readiness:** ready for a concrete implementation issue. Tracked as #46.

Dependencies and related issues:

- #43: hard dependency for Decision Sets validation
- #24: token and cost metrics for A/B measurement
- #28: active-learning feedback reduction umbrella
- #27: Paper Lab fixture for revision-flow comparison
- #23: review-cycle reduction umbrella

### Usability and quality direction

This is a high-leverage usability improvement. Rich feedback should remain durable and inspectable, but revision agents should not need to reread the full debate by default.

Recommended changes:

- Rename `.paper/ACTIVE-INSTRUCTIONS.md` to `.paper/REVISION-INSTRUCTIONS.md`.
- Make it durable for the revision cycle, snapshot-able, reviewable, and referenced in `REVISION-LOG.md`.
- Generate it from approved and modified decision sets or concerns only.
- Include a short "not in scope" summary for deferred and rejected items.
- Include provenance links back to concern IDs, decision set IDs, and source artifacts.
- Keep full feedback artifacts in the workspace for selective inspection.
- Show the compiled instructions to the user before revision begins.

### Scope decision

Phase 1 should focus on revision agents (`paper-editor` and `paper-drafter`) unless code review shows another agent is reading the same bloated feedback artifacts by default.

Fact-checker, audience reviewer, and opposition reviewer may need different context. Expand only after measuring their actual bloat and quality trade-offs.

### A/B validation

Use both a private real paper and a public reproducible fixture.

Public fixture approach:

- start from an existing example such as `examples/software-supply-chain-evidence-pack`
- inflate feedback artifacts to simulate a large review cycle
- compare full-feedback revision against compiled-instruction revision

Success criteria should avoid false rejection from scoring variance. Acceptable examples:

- no dimension drops by more than 0.5 on a 1-5 scale
- weighted aggregate score drops by no more than 0.2
- semantic validation does not introduce new high-severity issues
- target instruction implementation remains complete

### Issue mapping

| Issue | Relationship |
|---|---|
| #46 | Concrete implementation issue for this RFC |
| #43 | Hard dependency before instruction compilation can run |
| #24 | Required to prove token/cost and latency improvement |
| #28 | Umbrella; this RFC is the first concrete implementation slice |
| #27 | Public A/B fixture belongs in Paper Lab |
| #23 | Expected reduction in revision cycles |

### Recommendation

Implement #43 first, then #46. Do not bury this work inside #28; keep #28 as the umbrella and #46 as the concrete slice.
