# Strategy Review

## Strategic Readiness

**Status:** Go

**Reason:** The imported draft has a usable strategic thesis, identifiable executive audience, concrete decision ask, and enough argument structure to proceed to research and outline. It is not ready for final drafting without evidence mapping, counterargument handling, and audience-conflict management.

**Prior strategy handling:** Superseded initial import placeholder after brief reconstruction from imported draft.

## Strategy Blockers

- **Blocking issues:** none
- **Primary blocker:** none
- **Block severity:** None
- **Required unblock action:** none

## Paper Job

- **Primary job:** Win approval.
- **Secondary jobs to demote:** Establish narrative/vocabulary; create peer architecture alignment.

## Paper Strategy

- **Primary reader:** Senior executive sponsor for technology, procurement, data, and corporate platform decisions.
- **Secondary readers:** Peer architecture leaders and selected control / risk partners.
- **Reader promise:** A clear lifecycle-management position, a decision model, and a practical pilot ask.
- **Decision usefulness:** Lets the sponsor decide whether to validate the position, sponsor pilots, and approve coalition framing.
- **Why now:** Federated technology choices, AI-driven demand, security acceleration, and lifecycle-specific control expectations increase the cost of unmanaged technology accumulation.

## Thesis Package

- **Current thesis:** Technology decisions should be managed as one measurable lifecycle, with named domain owners and live operational signals driving adopt, continue, modernize, and retire decisions.
- **Diagnosis:** Well-formed but under-supported.
- **Recommended thesis:** A regulated enterprise should manage technology as one measurable lifecycle discipline because each adoption creates long-term obligations, federation needs shared visibility without central approval bottlenecks, and resilience / security / regulatory pressure now require evidence that the lifecycle is operated.

### Thesis Tests

| Test | Pass? | Notes |
|------|-------|-------|
| Debatable | Yes | The paper claims lifecycle discipline should become an operating model, not merely documentation. |
| Specific | Yes | Names ownership, live signals, four decisions, and pilot sponsorship. |
| Supportable | Partial | Needs research and source mapping for regulatory, security, resilience, cost, and modernization claims. |
| Right scope | Yes | Strong enough for executive validation; too broad for implementation design. |
| Reader relevant | Yes | Connects to cost, risk, federation, platform coherence, and executive sponsorship. |

### Reasoning Spine

1. Technology adoption creates long-term obligations that intake decisions do not consistently monitor, modernize, or retire.
2. Federated delivery increases the need for shared lifecycle visibility while making centralized approval less workable.
3. Live operational signals can turn lifecycle management from governance language into decision evidence.

## Argument Posture

- **Recommended posture:** Prescriptive.
- **Why this posture fits:** The paper asks for validation and sponsorship, not just understanding.
- **Risks of wrong posture:** Too much explanation will hide the ask; too much prescription without evidence will read like governance theater.

## Scope Design

### Must Include

- Decision ask for validation and pilot sponsorship.
- Clear distinction between technology domain owners and architecture facilitators.
- Four lifecycle decisions: adopt, continue, modernize, retire.
- Evidence model based on live operational signals.
- Pilot scope and explicit caveats.

### Nice To Include

- Example domain set for pilots.
- Minimum viable signal set.
- Example ADR or lifecycle-decision record shape.

### Explicitly Out Of Scope

- Selecting the final system of record.
- Assigning all technology domains.
- Designing the complete telemetry architecture.
- Publishing regulatory claims without source IDs.

### Scope Risks

- The draft can overreach by implying the operating model and telemetry platform already exist.
- The architecture facilitator section can become too detailed for the executive reader.
- The paper can underplay the risk that lifecycle discipline becomes another governance layer.

## Reader Questions

### Must Answer

- What decision are you asking me to make?
- Why existing governance is insufficient?
- Who owns lifecycle decisions?
- What does architecture do, and what does it not do?
- What starts in the pilot?
- What evidence is required before broader rollout?

### Should Answer

- What measures prove the discipline is operating?
- How does this support federation rather than undermine it?
- What risks or objections should we expect from peers?

### Can Ignore

- Detailed implementation tooling.
- Full domain taxonomy.
- Detailed regulatory analysis beyond source-backed claims.

## Strategic Gaps

| ID | Type | Description | Why It Matters | Fix Instruction |
|----|------|-------------|----------------|-----------------|
| G1 | evidence_gap | Regulatory, security, operational resilience, and cost claims are not source-mapped. | The paper is high-stakes and can lose credibility if evidence is implied rather than shown. | Run `/gpd-research` and map material claims to source IDs before fact-check or final drafting. |
| G2 | audience_conflict | The draft serves both executive sponsor and architecture peers. | Executive reader needs concise decision logic; architecture peers need mechanism detail. | Use outline to prioritize executive decision usefulness and push deeper detail into later sections or appendices. |
| G3 | reader_promise_weak | The ask is present but not forceful enough in the opening. | Sponsor may read the paper as a conceptual outline rather than a decision memo. | Make the first page state the decision requested, pilot scope, and what validation means. |
| G4 | poor_posture | The draft occasionally reads like a directional outline rather than a sponsored recommendation. | It can feel less complete than the topic requires. | Rewrite with an explicit recommendation spine and concrete next-step asks. |

## Recommended Shape

- **Opening move:** Name the hidden lifecycle obligation, state the decision ask, and explain why now in one page.
- **Core sections:** Problem / why now; lifecycle decision model; ownership and architecture facilitation; tools and evidence; pilot path and measures; risks and asks.
- **Where to place counterarguments:** After the model is introduced, before pilot asks.
- **Where to make the ask:** First page and final section.
- **Where to state out of scope:** End of opening or before pilot design.

## Block / Override

- **Blocks downstream work:** No.
- **Override allowed only if user explicitly says to proceed despite strategy block:** Not applicable.
