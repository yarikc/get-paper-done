<purpose>
Review the draft for argument quality, evidence, audience fit, persona consistency, and publication readiness. Optionally request external model review from installed AI CLIs/local model servers, synthesize feedback, and propose how to handle it before any changes are made.
</purpose>

<required_reading>
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/BRIEF.md
- .paper/RESEARCH.json if present
- .paper/RESEARCH.md if present
- .paper/OUTLINE.md
- .paper/DRAFT.md
- .paper/exports/FINAL.md if present, especially when the user reviewed the exported paper
- .paper/FACT-CHECK.md if present
- .paper/FEEDBACK-READER.md if present
- .paper/REVISION-CHECK.md if present
- references/review-rubrics.md
- references/audience-review-rubric.md
- templates/review.md
- templates/feedback-reader.md
- templates/feedback-external.md
- templates/feedback-plan.md
</required_reading>

<process>

## 1. Local Review

Read all context and the current draft.

If `.paper/exports/FINAL.md` exists, treat it as the user's reading copy. Scan it for inline comments, `.feedback` companion files, or user-marked review notes. The export is not the editing source of truth; comments on `FINAL.md` must be captured into `.paper/FEEDBACK-READER.md` and `.paper/FEEDBACK-PLAN.md`, then applied later to `.paper/DRAFT.md` through `/gpd-revise`.

Use `.paper/config.json` classification as the review contract:

- `decision_memo`: judge ask clarity, decision usefulness, support for the ask, operating mechanism, accountability, caveats, and concise memo discipline.
- `strategy_paper`: judge problem framing, thesis, direction, trade-offs, implications over time, and audience conflict handling.
- `explainer`: judge reader understanding, definitions, source authority, examples, mechanisms, and bounded recommendations.
- `update`: judge status clarity, change summary, blockers, next steps, and whether the lightweight shape fits risk.

For governance, control, standard, gate, review, required-record, or operating-mechanism proposals, check whether the draft defines the governed object, names the durable artifact or record, distinguishes process from artifact, explains standards without overstating them, states evidence currency and refresh triggers, shows how evidence changes decisions, and answers the process-burden objection. Flag papers that add ceremony without explaining how the mechanism improves decision quality, evidence, accountability, risk control, speed, or consistency, especially when they create an unclear new approval forum instead of using automation, observed evidence, owner attestation, validation, or human-by-exception review.

Parse audience mode flags:

- `--lite`: use Audience Review Lite
- `--deep`: use Audience Review Deep

Backward-compatible aliases:

- `--audience-lite`: treat as `--lite`
- `--audience-deep`: treat as `--deep`

If neither is present:

- use Lite when reviewing an outline, brief, or rough draft
- use Deep when a mature `.paper/DRAFT.md` exists

Users choose audiences, not agents. Run audience review through the single internal `audience-reviewer` path. It reads `.paper/AUDIENCE.md` and any selected `audiences/*.md` files, then applies the selected reader concerns.

If multiple curated personas are selected, score each selected audience and include an audience conflict table that names the tension, audiences in conflict, priority rule, and recommended handling.

Audience review must use the fixed seven-dimension rubric from `references/audience-review-rubric.md`. Each dimension is scored on a 1-5 scale:

- thesis clarity
- audience relevance
- evidence sufficiency
- objection handling
- jargon appropriateness
- decision usefulness
- structural flow

Every score of 3 or below must include an actionable rewrite instruction.

Apply the below-target improvement rule:

- For serious internal, executive, external, high-risk, regulated, or flagship papers, use 9/10 as the default target quality bar unless `.paper/BRIEF.md` or `.paper/config.json` sets a different bar.
- If the review gives an overall rating below the target bar, any score below 5, or any concrete fixable issue, do not stop at critique.
- Classify each below-target issue as `apply_now`, `defer_with_reason`, or `not_applicable`.
- If an issue is fixable within the current paper goal and does not require new author decisions, mark it `apply_now` and route to `/gpd-revise` before export.
- If the paper is marked `Ready` despite fixable below-target issues, explain exactly why export is still acceptable or change the verdict to `Revise`.
- Do not tell the user the paper is below target and then leave the first obvious improvements unapplied unless the user explicitly asks for review only.

Write `.paper/REVIEW.md` with:

- verdict
- score table
- required fixes
- suggested improvements
- below-target improvement gate
- unsupported or risky claims
- fact-check findings summary when `.paper/FACT-CHECK.md` exists
- audience review scorecard
- audience conflict table when multiple audiences are selected
- revision plan

If `.paper/REVIEW.md` already exists, the new review must clearly supersede the prior verdict and evaluate the current draft, not preserve stale findings from an earlier revision. If the draft has changed since the prior review, explicitly account for whether prior required fixes were resolved.

If `.paper/REVISION-CHECK.md` exists, use it as required input. Confirm whether the revision preserved thesis clarity, argument flow, evidence support, audience fit, persona and voice, ask clarity, and substance. If the revision check reports any regression that the user did not explicitly accept, the verdict cannot be `Ready`.

Use review stance first. Do not praise before identifying the highest-impact issues.

## 1.5 Reader Feedback Capture

If the user provides paper feedback inline, through a `.feedback` file, in `.paper/exports/FINAL.md`, or by pointing to notes that are not already captured in `.paper/FEEDBACK-READER.md`, create or update `.paper/FEEDBACK-READER.md` using `templates/feedback-reader.md`.

Reader feedback must use the five-signal structure:

- Voice
- Register
- Audience fit
- Evidence
- Ask clarity

Capture the feedback as evidence for review planning, not as permission to rewrite. If feedback requires changes, route it through `.paper/FEEDBACK-PLAN.md` before `/gpd-revise`. The simple exported-paper loop is:

```text
user reviews .paper/exports/FINAL.md
  -> gpd feedback captures comments into FEEDBACK-READER.md and FEEDBACK-PLAN.md
  -> /gpd-feedback approves, modifies, defers, or rejects captured concerns
  -> /gpd-revise edits .paper/DRAFT.md
  -> /gpd-export regenerates .paper/exports/FINAL.md
```

## 2. External Review Flag Detection

Parse `$ARGUMENTS`.

External review is enabled when either simplified external flag is present:

- `--external`
- `--models <comma-separated-reviewers>`

Backward-compatible aliases:

- `--all`: treat as `--external`
- individual model flags such as `--claude`, `--gemini`, `--codex`, `--qwen`, `--cursor`, `--ollama`, `--lm-studio`, and `--llama-cpp`: treat as `--external --models ...`

If no external review flag is present, skip to Step 7.

CLI note: `gpd review-external` can collect existing review text from files/stdin and can invoke selected installed provider CLIs with `--models`. Provider invocation prints provider-level progress while it runs, sends the generated review prompt to those CLIs, stores each reviewer capture under `.paper/feedback-external/`, records the active combined review in `.paper/FEEDBACK-EXTERNAL.md`, and writes a pending `.paper/FEEDBACK-PLAN.md`. The generated prompt includes state, config/classification, grill context, decision records, persona, audience, brief, strategy gate, research summary, research JSON, outline, draft, exported reading copy, fact-check, local review, reader feedback, and prior feedback plan when present. The feedback plan deduplicates overlapping reviewer concerns and decomposes captured HIGH/MEDIUM/LOW concerns into a decision view plus numbered recommendation items with rationale. Pass `--current-runtime claude`, `--current-runtime codex`, or the matching runtime name when known; the CLI skips that provider because self-review is not independent. Continue using the slash workflow below for local HTTP servers or provider-specific behavior not yet covered by the CLI. Do not use Opencode for paper review.

Feedback-decision note: `/gpd-feedback` is the user-facing approval loop for a generated `.paper/FEEDBACK-PLAN.md`. Use `/gpd-feedback --list` to show the queue, or `/gpd-feedback --item N` to jump to a concern. When using the underlying CLI outside the paper workspace, pass `--paper <paper-dir>`. Without flags, it should show the next pending concern and present one selection list: `approve`, `modify`, `defer`, or `reject`. If the user selects `modify`, ask one follow-up question for the constraint or instruction. If the user selects `defer` or `reject`, ask for a short reason only when it is not already clear. Then record the decision with `gpd feedback-plan decide --decision <value> --note <constraint-or-reason>`. It must not edit `.paper/DRAFT.md`; `/gpd-revise` applies approved or modified concerns after snapshot protection.

## 3. Detect Available Reviewers

Check which external reviewers are available:

```bash
command -v gemini >/dev/null 2>&1 && echo "gemini:available" || echo "gemini:missing"
command -v claude >/dev/null 2>&1 && echo "claude:available" || echo "claude:missing"
command -v codex >/dev/null 2>&1 && echo "codex:available" || echo "codex:missing"
command -v qwen >/dev/null 2>&1 && echo "qwen:available" || echo "qwen:missing"
command -v cursor >/dev/null 2>&1 && echo "cursor:available" || echo "cursor:missing"

curl -s --max-time 2 "http://localhost:11434/v1/models" >/dev/null 2>&1 && echo "ollama:available" || echo "ollama:missing"
curl -s --max-time 2 "http://localhost:1234/v1/models" >/dev/null 2>&1 && echo "lm_studio:available" || echo "lm_studio:missing"
curl -s --max-time 2 "http://localhost:8080/v1/models" >/dev/null 2>&1 && echo "llama_cpp:available" || echo "llama_cpp:missing"
```

Selection rules:

- `--external` with no model list: include all available reviewers except the current runtime's own CLI when it can be identified.
- `--models <list>`: include only requested reviewers that are available, then skip the current runtime's own CLI when it can be identified.
- Legacy `--all`: same as `--external`.
- Legacy specific flags: same as `--models <requested reviewers>`.
- If none are available, write that result into `.paper/FEEDBACK-EXTERNAL.md`, update `.paper/STATE.md` and `.paper/STATE.json`, and stop after local review.

Current runtime skip rule:

- If running inside Claude Code, skip `claude`.
- If running inside Codex, skip `codex`.
- If running inside Cursor, skip `cursor`.
- If runtime detection is unclear, pass `--current-runtime <claude|codex|cursor>` rather than guessing.

## 4. Build External Review Prompt

Write a temporary prompt such as `/tmp/gpd-review-prompt.md` containing:

```markdown
# External Paper Review Request

You are reviewing a serious paper draft. Provide direct, skeptical, useful feedback.

## Project
{.paper/PROJECT.md}

## Persona
{.paper/PERSONA.md}

## Audience
{.paper/AUDIENCE.md}

## Brief
{.paper/BRIEF.md}

## Research
{.paper/RESEARCH.json if present; otherwise .paper/RESEARCH.md}

## Outline
{.paper/OUTLINE.md}

## Draft
{.paper/DRAFT.md}

## Fact Check
{.paper/FACT-CHECK.md if present}

## Local Review
{.paper/REVIEW.md if already written}

## Review Instructions

Review the draft for:

1. Thesis clarity
2. Argument quality
3. Evidence strength and unsupported claims
4. Counterarguments and trade-offs
5. Audience fit
6. Persona consistency
7. Technical credibility
8. Mechanism quality
9. Decision usefulness
10. Style, structure, and concision

Return markdown with:

- Summary
- Highest-priority concerns, with severity HIGH/MEDIUM/LOW
- Specific suggested changes
- Feedback you would ignore or treat cautiously
- Questions the author must answer before revision
```

## 5. Invoke External Reviewers

Invoke selected reviewers sequentially to avoid rate limits.

Recommended command patterns:

```bash
cat /tmp/gpd-review-prompt.md | gemini -p "" > /tmp/gpd-review-gemini.md 2>/tmp/gpd-review-gemini.err
cat /tmp/gpd-review-prompt.md | claude -p > /tmp/gpd-review-claude.md 2>/tmp/gpd-review-claude.err
cat /tmp/gpd-review-prompt.md | codex exec --skip-git-repo-check - > /tmp/gpd-review-codex.md 2>/tmp/gpd-review-codex.err
cat /tmp/gpd-review-prompt.md | qwen - > /tmp/gpd-review-qwen.md 2>/tmp/gpd-review-qwen.err
cat /tmp/gpd-review-prompt.md | cursor agent -p --mode ask --trust > /tmp/gpd-review-cursor.md 2>/tmp/gpd-review-cursor.err
```

For local OpenAI-compatible servers, use their `/v1/chat/completions` endpoint and capture the response into temp files:

- Ollama: `http://localhost:11434`
- LM Studio: `http://localhost:1234`
- llama.cpp: `http://localhost:8080`

If a reviewer fails or returns empty output, record the failure in `.paper/FEEDBACK-EXTERNAL.md` and continue with other reviewers.

## 6. Write External Feedback And Feedback Plan

Create `.paper/FEEDBACK-EXTERNAL.md` using `templates/feedback-external.md`. If reviewer-specific captures exist under `.paper/feedback-external/`, preserve them as raw source records and use `FEEDBACK-EXTERNAL.md` as the combined active view.

Include:

- reviewers requested
- reviewers available
- reviewers invoked
- raw feedback per reviewer
- failures or empty responses
- consensus summary
- divergent views

Then evaluate all feedback, including `.paper/REVIEW.md`, `.paper/FACT-CHECK.md`, and `.paper/FEEDBACK-READER.md` when present, and create `.paper/FEEDBACK-PLAN.md` using `templates/feedback-plan.md`.

The plan is a concern-first approval queue. For each meaningful concern, record:

- `Type`: Concern, Review Note, Unmapped Suggestion, or Tooling Issue
- `Severity`: HIGH, MEDIUM, LOW, or INFO
- `Source(s)`: reviewer, reader, or artifact that raised it
- `Recommendation`: generated default, using `approve`, `modify`, `defer`, or `reject`
- `Why this matters`: why the concern affects paper quality, trust, decision usefulness, or audience fit
- `What improves if addressed`: the expected quality gain
- `Risk if handled badly`: how revision could dilute, genericize, overclaim, or distort the paper
- `Proposed handling`: recommended approach in prose
- `Proposed edits`: concrete implementation options under the concern
- `Affected artifacts`: `BRIEF.md`, `RESEARCH.json` / `RESEARCH.md`, `OUTLINE.md`, `FACT-CHECK.md`, or `DRAFT.md`
- `User Decision`: pending until the user records `approve`, `modify`, `defer`, or `reject`
- `User Constraint`: the user's constraint when they choose `modify`

Tactical suggestions should be grouped under their parent concern when possible. If a suggestion does not map to a concern, list it as an `Unmapped Suggestion` so the user can decide it explicitly.

Do not edit `.paper/DRAFT.md` during review. Review proposes action; revision applies approved action.

## 7. Approval Gate

Before acting on feedback, present the `.paper/FEEDBACK-PLAN.md` concern queue and ask the user how to proceed. Use `gpd feedback-plan list` for a compact view and `gpd feedback-plan review --item N` for one concern at a time. Treat `Recommendation` as the generated default. Revision must honor `User Decision` and `User Constraint`.

Use AskUserQuestion when available:

- header: "Feedback"
- question: "How should I handle the review feedback?"
- options:
  - "Approve plan" -- Use the feedback handling plan during `/gpd-revise`
  - "Discuss first" -- Review decision items and unresolved trade-offs
  - "Revise plan" -- Adjust the feedback handling plan before revision
  - "Decide items" -- Record `approve`, `modify`, `defer`, or `reject` decisions, then revise
  - "Ignore external" -- Keep local review only

If AskUserQuestion is unavailable, ask the same question in plain text and wait.

Record the user's choice in `.paper/STATE.md` and `.paper/STATE.json`.

Update `.paper/STATE.md` and `.paper/STATE.json` with suggested next command:

- `/gpd-revise` if verdict is Revise/Rework and feedback handling is approved
- `/gpd-review` if feedback handling needs more discussion or plan revision
- `/gpd-export` if verdict is Ready

</process>
