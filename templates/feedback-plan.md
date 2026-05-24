# Feedback Handling Plan

**Created:** [timestamp]
**Based on:** `.paper/REVIEW.md` and `.paper/FEEDBACK-EXTERNAL.md`
**Status:** Pending user approval

## Summary

[Short summary of the feedback and suggested path. State that suggested handling values are defaults and the user must record a decision before revision.]

## Decision Sets

Use this section only when the plan intentionally groups many concerns into a
smaller durable approval surface. If present, this section is the default review
surface; individual concerns remain below as evidence and implementation detail.

**Mode:** Aggregate ([N] sets covering [M] concerns)

### Set 1 -- MODIFY -- [Set title]

- **Covers:** concerns [1, 2, 3]
- **Why:** [Why these concerns should be decided together]
- **Instruction:** [User-facing revision instruction for the covered concerns]
- **User Decision:** pending
- **User Constraint:** none yet

## Decision View

Review each concern. Use `approve`, `modify`, `defer`, `reject`, or `answered_no_action`.

| # | Concern | Type | Severity | Suggested handling | User Decision |
|---|---------|------|----------|----------------|---------------|
| 1 | [Concern title] | Concern | HIGH / MEDIUM / LOW | approve / modify / defer / reject / answer / preserve | pending |

## Proposed Handling

### 1. Concern: [Concern title]

- **Type:** Concern
- **Severity:** [HIGH / MEDIUM / LOW / TOOLING / SUGGESTION]
- **Source(s):** [Reviewer]
- **Suggested handling:** [approve / modify / defer / reject / answer / preserve]
- **Why this matters:** [Why this affects paper quality, decision usefulness, evidence, or audience trust]
- **What improves if addressed:** [What gets better if the concern is handled]
- **Risk if handled badly:** [What to avoid while applying the fix]
- **Proposed handling:** [Concise edit strategy if approved]
- **Proposed edits:**
  1. [Concrete edit option]
- **Reviewer evidence:**
  - [Short quote or paraphrase from reviewer feedback]
- **Affected artifacts:** [DRAFT / BRIEF / RESEARCH / OUTLINE]
- **User Decision:** pending
- **User Constraint:** none yet

## Below-Target Items

Use this section when `REVIEW.md` includes a Below-Target Improvement Gate or the user challenges a rating below the target bar.

| # | Issue | Target Bar Impact | Suggested handling | Reason |
|---|-------|-------------------|----------------|--------|
| 1 | [Issue keeping paper below target] | [Why it affects quality/rating] | [approve / modify / defer / reject / answer / preserve / not applicable] | [Reason] |

If `Suggested handling` is `approve` or `modify`, revise before export after the user records a matching decision. If `Suggested handling` is `defer`, state why deferral is compatible with this paper's purpose, audience, risk, and mode.

## Approved Or Modified

- [Concerns with `User Decision: approve` or `modify`]

## Rejected

- [Concerns with `User Decision: reject`]

## Deferred

- [Concerns with `User Decision: defer`]

## User Decisions Needed

- Record `approve`, `modify`, `defer`, `reject`, or `answered_no_action` for each concern. If `modify`, fill `User Constraint`.

## Approval Gate

Before changing `.paper/DRAFT.md` or upstream artifacts, present this plan to the user and ask how to proceed.

Options:

- Approve a concern
- Modify a concern with a constraint
- Defer a concern
- Reject a concern
- Revise the handling plan
- Reject external feedback
