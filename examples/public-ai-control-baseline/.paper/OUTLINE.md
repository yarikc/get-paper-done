# Outline

## Mode

standard

## Structure Verdict

The memo should stay compact and approval-oriented. The public sources support a baseline, but the argument must not become a literature review.

## Reader Journey

The reader starts with the pilot-review problem, sees the approval ask, understands why the public references were chosen, reviews the baseline, sees how it is operated and validated, and can approve the next action without the memo becoming a white paper.

## Section Architecture

| Section | Objective | Reader State In | Reader State Out | Main Claim | Evidence Hooks | Evidence Strength | Reader Questions | Objection Handled | Approx Length | Transition To Next | Keep/Cut |
|---------|-----------|-----------------|------------------|------------|----------------|-------------------|------------------|-------------------|---------------|--------------------|----------|
| Opening problem | Establish why the memo exists | Needs context | Understands the approval gap | Pilots need a common approval record | S1, S4 | moderate | Why am I reading this? | Working-group minutes feel | 150 words | Decision request | Keep |
| Decision request | Ask for approval | Needs the ask | Knows the decision | Standardize and enforce a minimum baseline | S1, S2, S3, S4 | strong | What is requested? | Scope creep | 150 words | Why baseline | Keep |
| Why baseline | Explain why ad hoc controls are weak | Skeptical | Understands risk of inconsistency | Pilots need a consistent record, review gate, and later validation path | S1, S4 | moderate | Why now? | Too much process | 200 words | Reference basis | Keep |
| References and standards used | Explain why the public sources matter | Wants source credibility | Understands source authority and limits | Public references provide credible structure, not internal outcome proof | S1, S2, S3, S4 | strong | Why these sources? | Acronym dumping | 150 words | Baseline controls | Keep |
| Baseline controls | Name concrete controls | Wants detail | Sees implementable minimums | Four control areas should be required | S1, S2, S3, S4 | strong | What changes? | Vague governance | 500 words | Governance object | Keep |
| Governance object | Define how the baseline is managed | Needs operating clarity | Understands record ID, statuses, and gates | A baseline needs repeatable evidence and recertification | S1, S4 | moderate | How is this governed? | One-time memo approval | 250 words | Accountability | Keep |
| Accountability | Name who operates and validates the baseline | Needs ownership clarity | Understands attestation responsibility | The baseline needs distinct operating and validation roles | S1, S4 | moderate | Who owns this after approval? | Unowned governance | 150 words | Decision reinforcement | Keep |
| Decision reinforcement | Reinforce approval consequence | Ready to decide | Knows what approval changes | Approval makes the baseline the required intake path | RESEARCH.json | moderate | What happens after approval? | Process without effect | 150 words | Sources | Keep |

## Objection Map

| Objection | Where Addressed | Handling |
|-----------|-----------------|----------|
| This creates too much process for pilots. | Why baseline | State that the baseline standardizes evidence and gates reviewers already need; it does not create a parallel approval process. |
| Public frameworks do not prove our internal controls will work. | References and standards used | State that the sources support a baseline, not outcome proof. |
| Who validates pilot attestations? | Accountability | Name generic operating and validation roles without naming real teams in the example. |

## Control / Governance Proposal Check

| Check | Placement | Notes |
|-------|-----------|-------|
| Governed object is defined early | Opening problem and Decision request | Internal generative AI pilots moving from experimentation toward broader use. |
| Standards or references are explained as context | References and standards used | Sources support risk structure, generative AI profile attention, prompt-injection risk, and secure lifecycle evidence; they do not mandate the exact internal record. |
| Process is distinguished from the durable artifact/record | Why baseline and How it works | The process is intake/review/exception/recertification/retirement; the durable artifact is the pilot control record. |
| Evidence currency and refresh triggers are explicit | Proposed baseline and How it works | Evidence refreshes on use-case changes, wider rollout, recertification, exceptions, and lifecycle control changes. |
| Evidence changes a decision | Decision request and What approval changes | Current evidence allows review; missing or stale evidence sends a pilot back for more evidence, exception handling, rejection, or retirement. |
| Process-burden objection is answered | Why baseline | The memo frames the baseline as standardizing existing review decisions, not creating a parallel approval process. |

## Drafting Risks

- Turning the memo into a framework summary instead of a decision memo.
- Claiming public guidance mandates internal implementation details.
- Omitting the prompt-injection control as a concrete example.
- Letting workflow scaffolding language leak into the memo.
