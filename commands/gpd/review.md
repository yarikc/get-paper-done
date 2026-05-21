---
name: gpd:review
description: Review the draft locally, capture reader feedback, or use external AI CLIs, then propose a feedback handling plan
argument-hint: "[--lite|--deep] [--external] [--models claude,gemini,codex]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
  - AskUserQuestion
---

<context>
**Flags:**
- `--lite` - Fast audience review for outlines, rough drafts, or early decision checks.
- `--deep` - Full audience review with reverse outline, objection map, and decision-gap analysis.
- `--external` - Ask available external AI CLIs/local model servers to review.
- `--models <list>` - Limit external review to comma-separated reviewers, such as `claude,gemini,codex`. Opencode is intentionally unsupported for paper review.

No external flag means local review only. If no review depth is specified, choose Lite for outlines/rough drafts and Deep for mature drafts.

Backward-compatible aliases are accepted: `--audience-lite`, `--audience-deep`, `--all`, and individual model flags such as `--claude` or `--gemini`.
</context>

<execution_context>
@{{GPD_RUNTIME_ROOT}}/get-paper-done/workflows/review.md
@{{GPD_RUNTIME_ROOT}}/get-paper-done/references/review-rubrics.md
</execution_context>

<process>
Run the review workflow. Use a review stance: findings first, then summary. If user-provided reader feedback is present, capture it in `.paper/FEEDBACK-READER.md` and synthesize it into a handling plan. If `--external` or `--models` is present, collect external feedback, synthesize it into a handling plan, and ask before any revision is applied.
</process>
