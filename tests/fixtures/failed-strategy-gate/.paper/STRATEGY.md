# Strategy Review

## Strategic Readiness

**Status:** Revise Before Drafting

**Reason:** The paper has a plausible topic but not yet a decision-grade thesis, audience promise, or specific ask.

**Prior strategy handling:** None

## Strategy Blockers

- **Blocking issues:** thesis_weak, audience_unclear, missing_outcome
- **Primary blocker:** thesis_weak
- **Block severity:** High
- **Required unblock action:** brief_revision

## Paper Job

- **Primary job:** Recommend direction
- **Secondary jobs to demote:** Explain all possible operating-model patterns before the decision is clear.

## Paper Strategy

- **Primary reader:** Senior technical decision makers
- **Secondary readers:** Platform and delivery leads
- **Reader promise:** The reader should understand the specific decision being requested and the trade-offs that make it worth taking.
- **Decision usefulness:** Not sufficient yet because the brief does not name the concrete choice or approval boundary.
- **Why now:** Delivery friction is creating pressure for a clearer operating model, but the timing argument needs sharper evidence.

## Thesis Package

- **Current thesis:** The organization should improve the operating model for platform delivery.
- **Diagnosis:** Too vague
- **Recommended thesis:** Choose one concrete operating-model recommendation, name the decision requested, and state the consequence of not making the change.

### Thesis Tests

| Test | Pass? | Notes |
|------|-------|-------|
| Debatable | No | The current thesis is too generally agreeable. |
| Specific | No | It does not name the operating-model choice. |
| Supportable | No | It does not state what evidence would prove the point. |
| Right scope | Yes | The topic is appropriately scoped for a decision memo. |
| Reader relevant | Partial | The audience matters, but the reader promise is unclear. |

### Reasoning Spine

1. Current delivery friction has a root cause that the paper must define.
2. At least two plausible operating-model choices must be compared.
3. The recommendation must make the requested decision explicit.

## Argument Posture

- **Recommended posture:** Prescriptive
- **Why this posture fits:** The paper is asking for a decision, not merely explaining a concept.
- **Risks of wrong posture:** An explanatory posture would let the paper avoid the hard recommendation.

## Scope Design

### Must Include

- Specific decision requested
- Audience priority
- Alternatives considered
- Consequences of inaction

### Nice To Include

- Implementation implications
- Initial success measures

### Explicitly Out Of Scope

- Full organizational redesign
- Tool selection
- Detailed staffing model

### Scope Risks

- The paper may become a broad platform manifesto instead of a decision memo.

## Reader Questions

### Must Answer

- What exactly should be approved?
- Why is this decision needed now?
- What options were rejected?

### Should Answer

- What changes for delivery teams?
- What evidence supports the recommendation?

### Can Ignore

- Detailed implementation sequencing

## Strategic Gaps

| ID | Type | Description | Why It Matters | Fix Instruction |
|----|------|-------------|----------------|-----------------|
| G1 | thesis_weak | The thesis names a general improvement goal rather than a decision-grade recommendation. | Research and drafting would amplify ambiguity instead of resolving it. | Rewrite the brief with a specific recommendation and approval request. |
| G2 | audience_unclear | The paper names multiple readers but does not prioritize decision usefulness over implementation detail. | A mixed reader target can produce a paper that satisfies no one. | State the primary reader and the conflict rule for secondary detail. |
| G3 | missing_outcome | The intended outcome is described as a better direction rather than a concrete decision. | The review group cannot approve a vague direction. | Define the decision, rejection path, and success signal. |

## Recommended Shape

- **Opening move:** State the exact decision needed before explaining the problem.
- **Core sections:** Decision request, current friction, options, recommendation, trade-offs, implications.
- **Where to place counterarguments:** After the recommendation and before implementation implications.
- **Where to make the ask:** Opening section and conclusion.
- **Where to state out of scope:** Brief scope note after the recommendation.

## Block / Override

- **Blocks downstream work:** Yes
- **Override allowed only if user explicitly says to proceed despite strategy block:** Yes
