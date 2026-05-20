# RFC-1: Research-Driven Improvement Plan

- **Status:** Draft
- **Author:** Project maintainer
- **Date:** 2026-05-09
- **Scope:** Get Paper Done framework + tooling
- **Tracking Issue:** [#14](https://github.com/yarikc/get-paper-done/issues/14)
- **Supersedes:** none

## Summary

Five external pattern sources (Anthropic "Building Effective Agents," claude-octopus multi-provider orchestrator, DSPy/JSONAdapter schema enforcement, the 2026 LLM-as-judge bias literature, and modern prompt-eval frameworks) were cross-referenced against GPD's known gaps. Findings cluster into five top-leverage improvements and five second-tier improvements, with a skip list and an implementation priority order. Each improvement is tied to a concrete GPD change, named files, and an explicit "why for this project."

The dominant insight: GPD's prompt-and-artifact discipline is already strong. The next leverage is in (a) tooling that wraps multi-model review, (b) schema enforcement at AI-output boundaries, (c) bias mitigation in the review suite, (d) parallelization where reviewers are independent, and (e) regression coverage so calibrated agent quality does not silently drift.

---

## Research method

External patterns surveyed:

1. Anthropic — Building Effective Agents (workflow patterns, single-vs-multi-agent decision, parallelization guidance)
2. Anthropic — Multi-Agent Research System (orchestrator-worker pattern, token-cost economics)
3. claude-octopus — open-source multi-provider orchestrator (8 providers, consensus gates, circuit breakers, role specialization)
4. DSPy / JSONAdapter — typed signatures, schema-validated outputs, fallback retry
5. 2026 LLM-as-judge bias literature — verbosity, self-preference, position, rubric-order, score-ID, reference-answer biases; binary scoring + multi-judge filtering as mitigations
6. Cursor rules + AGENTS.md conventions — five themes (Convention, Guideline, Project, Example, LLM Directive)
7. Prompt-eval frameworks (Promptfoo, DeepEval, Confident AI, Braintrust) — layered offline/simulation/monitoring/human-review

Cross-referenced against GPD gaps surfaced during agent calibration: missing external review runner, no schema validators, no judge-bias mitigation, no parallelization, no prompt regression coverage, no spine mode by name, no observability, no per-paper rule overrides.

---

## Top 5 highest-leverage improvements

### 1. Parallelize the review stage (Anthropic Parallelization pattern)

**Pattern source.** Anthropic's "Parallelization" pattern names parallel editing — content review + fact-checking + tone assessment — as the canonical use case. "Tends to perform better when each consideration is handled by a separate LLM call."

**Current GPD state.** `/gpd-review`, `/gpd-fact-check`, and opposition-reviewer all run separately and sequentially. They read overlapping inputs (DRAFT, BRIEF, AUDIENCE, RESEARCH) but their outputs are independent — they don't depend on each other.

**Specific change.**

- Add `/gpd-review-suite` (or `/gpd-review --suite`) that fans out audience-reviewer + opposition-reviewer + fact-checker in parallel, then synthesizes into a single `REVIEW-SUITE.md` and unified `FEEDBACK-PLAN.md`.
- Each parallel reviewer writes to its own artifact (`REVIEW.md`, `FACT-CHECK.md`, `OPPOSITION.md`).
- Synthesizer runs last, dedupes overlapping findings, classifies each item once.

**Why for GPD.** Today running all three is three separate user invocations with three separate context loads. The fan-out pattern compresses this into one stage and prevents identical inputs being re-read three times.

**Files affected.** `commands/gpd/review-suite.md` (new), `workflows/review-suite.md` (new), `agents/review-synthesizer.md` (new, optional), updates to `workflows/review.md` and `workflows/fact-check.md` to support being run as a fan-out target.

---

### 2. Build the external review runner using the claude-octopus blueprint

**Pattern source.** claude-octopus is a working open-source orchestrator for up to 8 AI providers (Claude, Codex, Gemini, Perplexity, Qwen, Ollama, OpenRouter, Copilot) with:

- Specialized roles per provider (Codex = edge cases, Gemini = breadth, Claude = arbiter, Perplexity = live web)
- 75% consensus quality gate
- Circuit breakers with automatic provider recovery
- Adaptive consensus threshold when providers fail
- Provider status ledger showing which contributed / degraded / failed
- Token compression hooks (~7,300 tokens saved per session)
- Output normalization

**Current GPD state.** `/gpd-review --external` is documented as raw shell snippets in `workflows/review.md`. ROADMAP Track B item 5 names "external review runner" as still needed.

**Specific change.**

- Build `bin/lib/external-review.js` following the claude-octopus pattern.
- Provider detection (already designed in workflow): claude, codex, gemini, opencode, qwen, cursor, ollama, lm_studio, llama_cpp.
- Role specialization: Claude = arbiter, Codex = technical-claim review, Gemini = audience-fit / breadth, Perplexity (if available) = current-fact verification.
- 75% consensus gate adapted to writing: if ≥75% of reviewers flag the same finding HIGH, lock it into FEEDBACK-PLAN. Disagreements surface as Audience Conflict Table rows.
- Adversarial mode flag for opposition reviewers.
- Circuit breakers: 3 retries → mark provider degraded, continue.
- Adaptive consensus: if 2 of 4 providers fail, threshold adapts (don't require 3-of-4 agreement when only 2 ran).
- `EXTERNAL-REVIEWS.md` gets a status-ledger header showing which contributed, which failed.
- Token compression: pass `RESEARCH.md` (index) not `RESEARCH.json` (full) to external models unless they specifically need evidence detail.

**Why for GPD.** Largest implementation gap with the clearest blueprint. The pattern is proven, the failure modes are documented, and the adaptation to writing is straightforward.

**Files affected.** `bin/lib/external-review.js` (new), `bin/gpd.js` (add `review-external` command), `tests/external-review.test.js` (new fixtures for provider detection + output assembly), updates to `workflows/review.md` and `templates/external-reviews.md`.

---

### 3. Schema-validate AI artifacts (DSPy JSONAdapter pattern)

**Pattern source.** DSPy's signature + adapter system enforces schemas at AI-output boundaries: typed Pydantic-style models, JSONAdapter for JSON, ChatAdapter for markdown, automatic fallback retry, native `response_format` support where available. The 2026 production playbook: "native Structured Outputs as primary, prompt-based as fallback, schema validation to catch semantic errors, retry as final safety net."

**Current GPD state.**

- `RESEARCH.json` has a typed schema in `templates/research.json` but **no validator**. An agent can write malformed RESEARCH.json and downstream consumers crash silently.
- `FACT-CHECK.md`, `OUTLINE.md`, `STRATEGY.md` have implicit schemas (table columns, required sections) but nothing enforces them.
- `STATE.json` exists with a typed shape but the validator only checks for parse errors, not schema conformance.

**Specific change.**

- Author JSON Schema files for each typed artifact: `references/schemas/research.schema.json`, `state.schema.json`, `fact-check.schema.json`, etc.
- Add `gpd validate-artifact <path>` that runs schema validation on JSON artifacts.
- For markdown artifacts, write a structural validator: `gpd validate <paper>` already exists — extend it to check that OUTLINE.md has a Section Architecture table with all required columns, FACT-CHECK.md has a Claim Inventory with proper IDs, STRATEGY.md has Thesis Tests table with 5 rows.
- When agents produce structured outputs, hint at the schema in their prompt (already partially done via `templates/*.json`); add the explicit instruction "validate against schema before returning."

**Why for GPD.** Right now schema discipline is enforced by LLM compliance with prompt instructions. That's not enforcement — it's hope. A validator catches drift the moment it happens, not three stages downstream when a consumer crashes.

**Files affected.** `references/schemas/*.schema.json` (new), `bin/lib/validate.js` (new or extension to `state.js`), `bin/gpd.js` (add `validate-artifact` subcommand), `tests/validate.test.js` (new), updates to agent prompts to reference the schemas.

---

### 4. Mitigate LLM-as-judge biases in the review suite

**Pattern source.** The 2026 bias literature is mature and identifies specific, measurable failure modes:

- **Verbosity bias** — Claude and GPT both score longer answers higher, independent of quality.
- **Self-preference bias** — GPT prefers GPT-style, Claude prefers Claude-style. Same model writing + reviewing inflates scores.
- **Position bias** — judges favor responses by position, not quality.
- **Rubric order bias, score ID bias, reference answer score bias** — recently identified by 2025-2026 work.

Mitigations that work: binary scoring (Pass/Fail) outperforms 1–5 for bias robustness; multi-judge with median or IRT calibration; criterion decomposition matters more than judge-model choice.

**Current GPD state.** Audience-reviewer uses 1-5 scoring. Opposition-reviewer uses Fatal/Serious/Moderate/Minor. Fact-checker uses HIGH/MEDIUM/LOW. None enforce judge-vs-author model separation. None correct for verbosity.

**Specific change.**

- **Add `--binary` mode to audience-reviewer and opposition-reviewer.** For each rubric dimension, produce Pass/Fail with one rationale sentence. Use this for high-stakes papers per the IRT research.
- **Add cross-model rule to `/gpd-review --external`.** Refuse to use the same provider that drafted (drafter model recorded in DRAFT.md `Drafting mode` line) as a primary reviewer. Log this constraint in EXTERNAL-REVIEWS.md.
- **Add length-normalization warning.** Audience-reviewer flags if its scoring pattern correlates with section length (e.g., longer sections trending higher) — surfaces verbosity bias.
- **Random rubric ordering across runs.** Currently rubric order is fixed. Per the rubric-order-bias research, randomize per invocation to break order-dependent bias.

**Why for GPD.** Today GPD has Claude drafting AND Claude reviewing the draft via the audience-reviewer agent. Self-preference bias is the loudest known failure mode of LLM-as-judge. Without mitigation, every audience score is systematically inflated by an unmeasured amount.

**Files affected.** `agents/audience-reviewer.md`, `agents/opposition-reviewer.md`, `agents/paper-fact-checker.md` (constraint additions), `references/audience-review-rubric.md` (binary mode section), `workflows/review.md` (cross-model rule), `templates/external-reviews.md` (cross-model log row).

---

### 5. Add prompt-regression eval coverage

**Pattern source.** Mature prompt-first frameworks (Aider, Cursor, similar code-assist projects) all converge on layered eval: offline tests with golden inputs, simulation, production monitoring, human review. Tools like Promptfoo, DeepEval, Confident AI, Braintrust standardize this. Pattern: golden-input fixtures → run agent → assert structural properties of output.

**Current GPD state.** `npm test` covers CLI surface (10 functions). No prompt regression tests. If audience-reviewer's prompt changes and starts producing 6-row scorecards instead of 7, no test catches it. CI workflow runs CLI tests only.

**Specific change.**

- Build `tests/fixtures/papers/` with 3-4 golden-input papers in known states (CxO+Architect well-formed, vague-thesis, missing-evidence, multi-audience).
- For each agent, add `tests/agents/<agent>.eval.js` that:
  - Constructs the agent input artifacts.
  - Invokes the agent (via runtime — Claude API or Codex CLI).
  - Asserts structural properties of output (X has Y table, table has N rows, every score-≤3 row has an instruction, etc.).
- Add `npm run eval` separate from `npm test` (slow, costs API calls).
- Use Promptfoo or similar if you want it managed; or roll a 100-line internal harness — the structural assertions are simple.

**Why for GPD.** This is what prevents the project from regressing as agent prompts evolve. Eight agents are now calibrated to 9.0+. Without regression coverage, the next round of prompt edits could quietly break properties that took multiple iterations to lock in. Right now the only check is "does it still produce valid markdown" — the rubric, severity, drift checks, and mandatory-instruction-on-≤3 rules are all uncovered.

**Files affected.** `tests/fixtures/papers/*` (new), `tests/agents/*.eval.js` (new), `package.json` (add `eval` script), `.github/workflows/ci.yml` (optional: gated eval job that runs on tagged release only, since it costs tokens).

---

## Five second-tier improvements

### 6. Routing at intake (Anthropic Routing pattern)

`/gpd-new-paper` currently treats every paper the same. Add routing rules from the brief stage based on paper type: newsletter → minimal strategy + skip research; position paper → strategy gate + opposition emphasis; executive briefing → strategy gate + fact-check emphasis. Implementation: a small decision table in `workflows/new-paper.md` that sets `.paper/config.json` workflow toggles based on paper type from BRIEF.md.

### 7. First-class `--spine` mode

Profile says "build the short spine first." Current `outline_plus_skeleton` mode is post-outline. A `gpd-spine` or `/gpd-outline --spine` first-class mode produces a 3–5 page directional version, runs the parallelized review suite (improvement #1) on the spine, blocks full outline expansion until spine review passes. Closes the one remaining profile-fit gap.

### 8. Provenance and instrumentation logging

Add `.paper/log/<ISO>-<stage>.json` capturing: stage, agent, input artifact hashes, output artifact hash, agent prompt version, runtime model, duration. `gpd history` command surfaces stage-by-stage evolution. Enables retrospective analysis: which stage caused most rework, where review feedback actually landed, which prompts produce the most variance run-to-run. For a prompt-first framework, observability is what closes the iteration loop.

### 9. Per-paper rule overrides (Cursor rules pattern)

Add `.paper/rules/` directory for paper-specific overrides that downstream agents must honor. Examples: `.paper/rules/section-tone.md` overriding default direct tone with provocative for one section. Cursor's MDC pattern is mature; adopt the convention. Currently overrides have to be smuggled into PERSONA.md or BRIEF.md notes, which is ad-hoc.

### 10. Self-reflection notes (Anthropic Dreaming pattern, lightweight)

After each paper finishes, paper-strategist writes a paper-specific `STRATEGY-NOTES.md` capturing what worked, what got revised, where strategy was overridden. Across papers, accumulate to `profiles/<author>-strategy-notes.md`. The strategist reads this on next run to avoid repeating advice that didn't land. Lightweight version of Anthropic's "Dreaming" pattern — applied to a single author profile rather than the whole system.

---

## What to skip

- **Heavy agent frameworks (LangGraph, CrewAI, AutoGen).** Anthropic guidance is explicit: start simple, optimize single LLM calls first, add complexity only when measurably better. GPD's prompt-chain + light orchestration is already correct; adopting a framework would be regression.
- **Self-improving agents at scale.** Token cost is 10–15× single-agent. Not worth it for writing workflow until validation shows specific stages benefit.
- **LLM-as-judge for everything.** The bias literature suggests using it where rubrics are well-decomposed (audience-reviewer is fine) and avoiding it where the judgment is gestalt — voice quality, originality. Bias amplifies most where rubrics fail to decompose the judgment.

---

## Implementation priority

Sequenced against the existing roadmap:

1. **Run one real paper through current workflow** (already #1 on roadmap; nothing replaces real signal).
2. **External review runner** (improvement #2) — biggest tooling gap with clearest blueprint.
3. **Schema validation** (improvement #3) — small effort, large ratchet on artifact integrity.
4. **Bias mitigation in reviewers** (improvement #4) — closes a known measurement-distortion problem.
5. **Parallelized review suite** (improvement #1) — depends on #2 being done.
6. **Prompt eval coverage** (improvement #5) — pays off only after the suite stabilizes.
7. **Spine mode** (improvement #7) — small, profile-aligned win.
8. Routing, instrumentation, per-paper rules, self-reflection — second-tier.

Items 2–4 land the framework at roughly 9.0. Items 5–6 lock that quality against future drift.

---

## Open questions

- **Eval cost budget.** `npm run eval` against real models costs tokens. What is the acceptable per-CI-run budget? If high, gate on tagged release only; if zero, eval has to run against deterministic mock outputs, which catches structure but not behavior.
- **Cross-model judge rule strictness.** Should drafter-model-as-reviewer be a hard refuse, or a flag-with-warning? Profile prefers explicit risk over silent failure; suggest hard refuse with `--allow-self-review` escape hatch.
- **Schema enforcement strictness.** Should `gpd validate-artifact` fail-closed (refuse to consume invalid JSON) or fail-open with a warning? Recommend fail-closed with a single `--force` escape hatch for ad-hoc inspection.
- **Status: Implemented vs Proposed.** This RFC is currently Draft. Each improvement should be promoted individually as a sub-RFC or tracked in ROADMAP once accepted, so partial adoption is visible.

---

## Sources

- [Anthropic — Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Anthropic — Building Effective AI Agents (resources hub)](https://resources.anthropic.com/building-effective-ai-agents)
- [claude-octopus — multi-provider orchestrator (GitHub)](https://github.com/nyldn/claude-octopus)
- [DSPy — Adapters and JSONAdapter](https://dspy.ai/learn/programming/adapters/)
- [DSPy — Building AI Agents tutorial](https://dspy.ai/tutorials/customer_service_agent/)
- [DSPy — JSONAdapter API reference](https://dspy.ai/api/adapters/JSONAdapter/)
- [Cursor — Rules documentation](https://cursor.com/docs/rules)
- [Beyond the Prompt: Empirical Study of Cursor Rules (arXiv 2512.18925)](https://arxiv.org/html/2512.18925v2)
- [Rubric-Based Evaluations & LLM-as-a-Judge — Methodologies and Biases (Adnan Masood, 2026)](https://medium.com/@adnanmasood/rubric-based-evals-llm-as-a-judge-methodologies-and-empirical-validation-in-domain-context-71936b989e80)
- [Evaluating Scoring Bias in LLM-as-a-Judge (arXiv 2506.22316)](https://arxiv.org/abs/2506.22316)
- [Evaluating and Mitigating LLM-as-Judge Bias in Communication Systems (arXiv 2510.12462)](https://arxiv.org/html/2510.12462v3)
- [Prompt Evaluation Frameworks — Maxim AI](https://www.getmaxim.ai/articles/prompt-evaluation-frameworks-measuring-quality-consistency-and-cost-at-scale/)
- [LLM Evaluation Frameworks Complete Guide 2026 — Calmops](https://calmops.com/testing/llm-evaluation-frameworks-deepeval-2026/)
- [Best AI Evaluation Tools for Prompt Experimentation in 2026 — Confident AI](https://www.confident-ai.com/knowledge-base/compare/best-ai-evaluation-tools-for-prompt-experimentation-2026)
- [Code Agent Orchestra — Addy Osmani](https://addyosmani.com/blog/code-agent-orchestra/)
- [Multi-Agent Orchestration: Running Claude Codex and Gemini Together — Zencoder Docs](https://docs.zencoder.ai/user-guides/guides/multi-agent-orchestration-in-zenflow)
- [Agent Workflow Patterns — Beyond Anthropic's Playbook (Towards AI, March 2026)](https://pub.towardsai.net/agent-workflow-patterns-beyond-anthropics-playbook-1bd76a48d63d)
