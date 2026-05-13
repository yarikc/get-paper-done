# Adopt a Public AI Control Baseline for Internal GenAI Pilots

Internal generative AI pilots need a common approval record before they move from experimentation to broader use. Today a team may describe its design, expected outcome, testing, owner, and controls in separate materials. Those claims are not captured in one consistent record or checked through a repeatable gate. The review group should approve a minimum control baseline and require every pilot to maintain a standard pilot control record.

## Decision Requested

Approve a minimum evidence baseline for generative AI pilot intake. This decision standardizes and enforces a `pilot_control_record_id` for each pilot. It also names the roles responsible for attestation validation, exception handling, recertification, and retirement. It sets the evidence required for pilot approval and wider rollout; it does not approve any individual pilot for production use.

## Why This Is Needed

Without a standard record, reviewers cannot compare pilots or later validate the attestation. The approval trail should show the evidence, control owner, reviewer, accepted exception, and next review date. Without that trail, pilot approval becomes a one-time judgment instead of a controlled lifecycle.

This should reduce review ambiguity, not create a parallel approval process. The baseline standardizes the evidence and gates that pilot reviewers already need in order to approve, reject, or recertify a pilot.

## References And Standards Used

The baseline uses public references to avoid inventing a private control model from scratch. NIST AI RMF provides the risk-management structure. NIST AI 600-1 applies that structure to generative AI risks. OWASP LLM01 is useful because it is an application-security reference for prompt injection. NCSC/CISA secure AI guidance keeps the baseline tied to secure design, development, deployment, operation, and maintenance. These sources do not prove the internal baseline will reduce incidents; they provide credible structure for what the baseline should cover.

## Proposed Baseline

| Control area | Why it matters | Public reference | Required pilot evidence | Gate |
|--------------|----------------|------------------|-------------------------|------|
| Risk ownership and review structure | A pilot needs a named control owner and reviewer, not only a technical lead. | NIST AI RMF defines the Govern, Map, Measure, and Manage functions as a risk-management structure (S1). | `risk_function_map` with owner, reviewer, evidence link, and status for each function. | Required before pilot approval. |
| Generative AI risk profile | The baseline must identify which generative AI risks matter for the specific use case. | NIST AI 600-1 applies the AI RMF to generative AI risk concerns (S2). | `genai_risk_profile` with selected risk categories, rationale, control owner, and exception status. | Required before pilot approval and refreshed when the use case changes. |
| Prompt-injection threat model | LLM applications can be manipulated through direct or indirect prompts, so a pilot needs a threat model and abuse-case test plan. | OWASP LLM01 describes prompt injection as an LLM application-security risk (S3). | `prompt_injection_test_result` with scenario, expected behavior, observed behavior, mitigation, and residual risk. | Required before user-facing pilot. |
| Secure operating evidence | A pilot needs documented sandbox, runtime, deployment, and operating constraints before wider rollout. | NCSC/CISA secure AI guidance frames secure design, development, deployment, operation, and maintenance (S4). | `secure_lifecycle_checklist` with design, development, deployment, operation, and maintenance status. | Required before wider rollout and on recertification. |

## How It Works

Each pilot gets a `pilot_control_record_id`. That identifier is the internal primary key for intake, approval, exception handling, recertification, and retirement.

Use these minimum status values in the control record:

- `not_started`
- `in_progress`
- `ready_for_review`
- `approved`
- `approved_with_exception`
- `rejected`
- `expired`

Each control should also record an owner, reviewer, evidence link, decision date, next review date, and exception rationale when applicable. That gives the review group a repeatable evidence model instead of a one-time memo approval.

## Accountability

| Role | Responsibility |
|------|----------------|
| Pilot owner | Creates and maintains the pilot control record and evidence links. |
| Platform or architecture reviewer | Confirms the pilot fits the approved baseline and records the review decision. |
| Security or risk reviewer | Validates threat-model, testing, exception, and residual-risk attestations. |
| Review process owner | Maintains the evidence template, allowed status values, recertification cadence, and exception rules. |

## What Approval Changes

Approval makes the baseline the required entry point for the next pilot intake cycle. A pilot can still be rejected, approved with exception, or sent back for more evidence. It cannot bypass the common record, required evidence, review roles, or recertification path. The follow-up deliverable should be a checklist template owned by the review process owner and mapped to the four control areas above.

## Sources

- S1: NIST Artificial Intelligence Risk Management Framework (AI RMF 1.0), https://doi.org/10.6028/NIST.AI.100-1
- S2: NIST AI 600-1 Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile, https://doi.org/10.6028/NIST.AI.600-1
- S3: OWASP GenAI Security Project LLM01:2025 Prompt Injection, https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- S4: NCSC Guidelines for Secure AI System Development, https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development
