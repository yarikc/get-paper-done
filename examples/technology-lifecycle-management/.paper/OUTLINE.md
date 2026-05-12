# Outline

## Mode

- **Depth:** Deep
- **Output:** outline_plus_skeleton

## Structure Verdict

Ready to draft. The imported draft has enough strategic intent to proceed, but the rewrite should treat the original as source material rather than a structure to preserve. The outline must define recurring terms early, separate sourced risk / resilience expectations from the proposed operating model, and make the decision ask visible before architecture detail.

## Recommended Structure

Use an executive strategy memo pattern: decision ask, why current mechanisms are insufficient, operating model, proof standard, pilot, and risks. This fits a senior sponsor because it starts with the decision and stakes, then gives peer architecture leaders enough mechanism detail to test whether the proposal can operate without becoming a new approval layer.

## Reader Journey

- **Starting belief:** Existing procurement, architecture, risk, and platform controls already manage technology decisions well enough, even if execution is uneven.
- **Target belief:** The organization needs a narrow sponsored pilot for lifecycle management because post-adoption obligations are not visible enough to decide when to continue, modernize, or retire technology.
- **Core shift:** Move from intake governance as the default control point to operated lifecycle evidence as the basis for ongoing technology decisions.
- **Core tension:** The proposal must prove it is a decision discipline with named ownership and minimum viable signals, not another governance forum.

Reader-state fields must name a specific belief, doubt, or decision question. Bare role descriptions are invalid.

## Outline

### 1. Decision Ask And Thesis

- **Objective:** Give the senior sponsor the decision request and the main thesis in the first page.
- **Reader state in:** The reader wants to know whether this is another broad technology-governance proposal or a concrete decision.
- **Reader state out:** The reader understands the ask: validate the direction, sponsor a constrained pilot, and approve coalition framing.
- **Reader job:** Decide whether the proposal is worth testing with peers and selected domains.
- **Main claim:** Technology should be managed as a measurable lifecycle discipline, not only as an intake decision.
- **Supporting points:** Define lifecycle management as the discipline for adopt, continue, modernize, and retire decisions; define readiness as current evidence that a technology can continue to serve its business, risk, resilience, and cost obligations; define operational readiness as the live or refreshed evidence used for those decisions.
- **Evidence:** S5 for author intent and proposed decision ask; C1, C2, C3, C4.
- **Evidence strength:** moderate
- **Reader questions addressed:** What am I being asked to approve? What does lifecycle mean here? What does readiness mean here?
- **Objection handled:** This sounds like governance expansion under a new label.
- **Why here:** The imported draft delayed definitions and asked readers to infer the decision frame.
- **Decision implication:** The sponsor can approve a bounded pilot without approving a full enterprise operating model.
- **Approximate length:** 3-5 paragraphs
- **Transition to next:** Explain why existing mechanisms leave a gap after adoption.
- **Drafting notes:** Keep the language direct. Avoid broad transformation phrasing.

### 2. The Gap: Intake Is Managed, Lifecycle Is Not

- **Objective:** Show why current governance mechanisms are necessary but incomplete.
- **Reader state in:** The reader believes existing architecture, procurement, and risk processes already address the issue.
- **Reader state out:** The reader sees that the unmanaged risk sits after approval: ownership, usage, resilience, patching, modernization, duplication, and retirement.
- **Reader job:** Distinguish lifecycle management from more intake control.
- **Main claim:** Technology accumulation is a lifecycle problem, not just an intake problem.
- **Supporting points:** Adoption creates long-lived support and dependency obligations; aging and duplicated platforms are hard to retire without named evidence; paper attestations are too stale for continue / modernize / retire decisions.
- **Evidence:** K1/S1, K4/S4, C1.
- **Evidence strength:** moderate
- **Reader questions addressed:** What is missing from current controls? Why does this matter now?
- **Objection handled:** Existing controls already cover this.
- **Why here:** The sponsor needs the insufficiency case before hearing the operating model.
- **Decision implication:** The pilot should start where post-adoption obligations are visible and costly enough to test.
- **Approximate length:** 4-6 paragraphs
- **Transition to next:** Move from the problem to the decision model that makes obligations explicit.
- **Drafting notes:** Use a concrete but anonymized example shape: a technology with unclear ownership, unclear dependency use, and delayed modernization.

### 3. The Decision Model: Adopt, Continue, Modernize, Retire

- **Objective:** Make the operating concept memorable and decision-oriented.
- **Reader state in:** The reader understands the gap but may not see how to operationalize it.
- **Reader state out:** The reader sees four decision types that can be tested in a pilot.
- **Reader job:** Evaluate whether the four decisions are clear enough to govern without bureaucracy.
- **Main claim:** Lifecycle management works only if it produces explicit decisions, not inventory cleanup.
- **Supporting points:** Adopt decides whether a technology enters or expands; continue decides whether it remains fit; modernize decides when improvement is required; retire decides when a technology should be exited or consolidated.
- **Evidence:** S5 for the proposed decision model; C4 for modernization / retirement; S4 for ongoing maintenance.
- **Evidence strength:** weak
- **Reader questions addressed:** What decisions does the discipline actually create? What changes compared with today?
- **Objection handled:** Retirement metrics could incentivize premature consolidation.
- **Why here:** The paper needs a clear mechanism before introducing owners and signals.
- **Decision implication:** The pilot should measure decision quality, not only artifact completion.
- **Approximate length:** 4-5 paragraphs or one compact table
- **Transition to next:** Define who owns these decisions and how architecture supports them.
- **Drafting notes:** Frame the four decisions as a recommended pilot model, not as externally proven doctrine.

### 4. Ownership: Domain Owners Decide, Architecture Facilitates

- **Objective:** Resolve the federation / centralization tension.
- **Reader state in:** The reader worries that a lifecycle model will centralize decisions and slow delivery.
- **Reader state out:** The reader understands that domain owners make decisions while architecture helps maintain coherence, evidence, and cross-domain trade-off visibility.
- **Reader job:** Decide whether the governance shape respects federated delivery.
- **Main claim:** Federated technology delivery needs shared lifecycle visibility without centralizing every decision.
- **Supporting points:** Domain owners hold outcome accountability; architecture facilitates the conversation, maintains decision logic, and spots cross-domain conflicts; risk/control partners shape evidence expectations without owning every technology decision.
- **Evidence:** K2/S2, K3/S3, S5, C2, C6.
- **Evidence strength:** weak
- **Reader questions addressed:** Who decides? Who facilitates? How does this avoid a new committee?
- **Objection handled:** The model may undermine federation.
- **Why here:** Audience conflict is highest here: executives need accountability, architects need coherence, risk partners need evidence discipline.
- **Decision implication:** The pilot must test owner clarity and architecture facilitation before expanding.
- **Approximate length:** 5-7 paragraphs
- **Transition to next:** Explain what evidence the owners and facilitators use.
- **Drafting notes:** Use careful language: architecture is not the default approver.

### 5. Evidence Standard: Minimum Viable Signals

- **Objective:** Convert the proposal from principle to an operated proof standard.
- **Reader state in:** The reader is skeptical that live telemetry is mature enough to support decisions.
- **Reader state out:** The reader sees a pragmatic starting set of signals and a path to improve them.
- **Reader job:** Decide whether the pilot can start with imperfect evidence.
- **Main claim:** Lifecycle decisions should rely on live or regularly refreshed operational signals, starting with minimum viable signals.
- **Supporting points:** Begin with ownership, usage/dependency, resilience, security/maintenance, cost, and exception signals; distinguish current signal availability from target-state telemetry; record evidence gaps as decision risk.
- **Evidence:** K2/S2, K3/S3, K4/S4, C3, C5.
- **Evidence strength:** moderate
- **Reader questions addressed:** What counts as evidence? What if telemetry is incomplete?
- **Objection handled:** Live telemetry may be incomplete, inconsistent, or expensive.
- **Why here:** The paper must not overclaim readiness or imply a full signal platform exists.
- **Decision implication:** The pilot can start if it names the minimum evidence and tracks gaps transparently.
- **Approximate length:** 5-6 paragraphs or table
- **Transition to next:** Use the signal model to define pilot scope.
- **Drafting notes:** Replace absolute phrases like "no decision without live signals" with staged language.

### 6. Pilot Path

- **Objective:** Turn the strategy into a constrained next step.
- **Reader state in:** The reader may agree directionally but not want a broad operating-model rollout.
- **Reader state out:** The reader sees a low-regret pilot that tests ownership, signal feasibility, and decision usefulness.
- **Reader job:** Approve or reshape the pilot.
- **Main claim:** The next move should be a sponsored pilot across a small number of technology domains, not a firm-wide rollout.
- **Supporting points:** Select two or three domains; define decision records; test minimum signals; run one continue, one modernize, and one retire candidate where feasible; produce lessons before expanding.
- **Evidence:** S5 for proposal; research open questions Q1 and Q2.
- **Evidence strength:** weak
- **Reader questions addressed:** What happens next? What is the smallest credible test?
- **Objection handled:** The proposal is too broad to start.
- **Why here:** The decision ask needs a practical landing point.
- **Decision implication:** Sponsor approves pilot framing and peer architecture coalition work.
- **Approximate length:** 4-6 paragraphs
- **Transition to next:** Acknowledge risks and conditions for success.
- **Drafting notes:** Keep pilot domains generic unless the author approves examples.

### 7. Risks, Guardrails, And Conditions For Expansion

- **Objective:** Show that the paper has anticipated failure modes.
- **Reader state in:** The reader is looking for the catch: bureaucracy, ownership fights, data gaps, and overclaiming.
- **Reader state out:** The reader sees explicit guardrails and knows what would block expansion.
- **Reader job:** Decide whether the risks are manageable enough for a pilot.
- **Main claim:** The pilot should proceed only with guardrails that prevent governance theater and unsupported claims.
- **Supporting points:** Time-box decisions; separate advice from approval; record evidence gaps; avoid raw retirement targets; qualify regulatory language; require lessons before scale-up.
- **Evidence:** X1, X2, Q3, C3, C4, C6.
- **Evidence strength:** moderate
- **Reader questions addressed:** What could go wrong? What must be true before expanding?
- **Objection handled:** This becomes another governance layer.
- **Why here:** Ending with risk-aware conditions improves trust with executives, architects, and controls partners.
- **Decision implication:** Approval is for a disciplined pilot, not an unlimited mandate.
- **Approximate length:** 4-5 paragraphs
- **Transition to next:** Close with the decision request.
- **Drafting notes:** Use firm qualifiers; avoid defensive tone.

### 8. Closing Decision

- **Objective:** Restate the decision and immediate next actions.
- **Reader state in:** The reader has enough context to choose whether to sponsor the pilot.
- **Reader state out:** The reader knows the exact approval requested and what will be produced.
- **Reader job:** Approve, reject, or revise the pilot ask.
- **Main claim:** A small lifecycle-management pilot is the right next step to test whether the organization can make better technology decisions after adoption.
- **Supporting points:** Validate direction; identify pilot domains; confirm owner / architecture / risk roles; agree minimum signal set; return with pilot findings.
- **Evidence:** S5 and preceding sections.
- **Evidence strength:** not evidence-dependent
- **Reader questions addressed:** What decision do you need from me?
- **Objection handled:** The proposal is not ready for enterprise-wide rollout.
- **Why here:** The paper must close as a decision memo, not as an explainer.
- **Decision implication:** Sponsor has a concrete, bounded action.
- **Approximate length:** 2-3 paragraphs
- **Transition to next:** End.
- **Drafting notes:** Keep the final ask crisp.

## Section Architecture

| Section | Objective | Reader State In | Reader State Out | Main Claim | Evidence Hooks | Evidence Strength | Reader Questions | Objection Handled | Approx Length | Transition To Next | Keep/Cut |
|---------|-----------|-----------------|------------------|------------|----------------|-------------------|------------------|-------------------|---------------|--------------------|----------|
| 1. Decision Ask And Thesis | State ask and thesis early | Is this another governance proposal? | This is a bounded pilot decision | Technology should be managed as a measurable lifecycle discipline | S5; C1-C4 | moderate | What am I approving? What does lifecycle mean? | Governance expansion | 3-5 paragraphs | Why current mechanisms miss lifecycle obligations | Keep |
| 2. The Gap | Explain insufficiency after adoption | Existing controls may be enough | Intake controls do not manage accumulated obligations | Accumulation is a lifecycle problem | K1/S1; K4/S4; C1 | moderate | What is missing? Why now? | Existing controls already cover this | 4-6 paragraphs | Introduce four decisions | Keep |
| 3. Decision Model | Define adopt/continue/modernize/retire | The gap is clear but mechanism is vague | Four decision types make the discipline operational | Lifecycle management must produce decisions | S5; C4; S4 | weak | What decisions change? | Retirement metrics can misfire | 4-5 paragraphs/table | Move to ownership | Keep |
| 4. Ownership | Resolve federation tension | Centralization risk is high | Domain owners decide; architecture facilitates | Shared visibility does not require central approval | K2/S2; K3/S3; C2; C6 | weak | Who decides? Who facilitates? | Undermines federation | 5-7 paragraphs | Explain evidence used | Keep |
| 5. Evidence Standard | Define minimum viable signals | Telemetry may be immature | Start with refreshed signals and known gaps | Decisions should rely on live/refreshed signals | K2/S2; K3/S3; K4/S4; C3; C5 | moderate | What counts as evidence? | Telemetry incomplete | 5-6 paragraphs/table | Shape pilot | Keep |
| 6. Pilot Path | Make next step practical | Direction may be too broad | Small pilot can test ownership and signal feasibility | Start with a sponsored pilot | S5; Q1; Q2 | weak | What happens next? | Too broad to start | 4-6 paragraphs | Name risks | Keep |
| 7. Risks And Guardrails | Build trust through caveats | Hidden failure modes remain | Guardrails prevent governance theater and overclaiming | Pilot must have expansion conditions | X1; X2; Q3; C3; C4; C6 | moderate | What could go wrong? | Becomes governance theater | 4-5 paragraphs | Restate decision | Keep |
| 8. Closing Decision | Close with action | Ready to decide | Sponsor knows exact requested action | Approve a bounded pilot and coalition framing | S5 | not evidence-dependent | What decision do you need? | Not ready for rollout | 2-3 paragraphs | End | Keep |

## Thesis Placement

Put the thesis in paragraph 2 after a one-paragraph decision ask. The paper should not open with background. The senior sponsor needs to know the requested decision before deciding whether the problem frame is worth attention.

## Objection Map

| Objection | Where Addressed | Handling |
|-----------|-----------------|----------|
| This is governance expansion under a new label. | Sections 1, 4, 7 | Define the discipline by decisions, owner accountability, time-boxing, and architecture facilitation rather than approval authority. |
| Existing architecture, procurement, and risk processes already cover this. | Section 2 | Acknowledge those mechanisms and show the post-adoption gap: continue, modernize, and retire decisions. |
| Federated delivery will be recentralized. | Section 4 | Make domain owners the decision owners and architecture the facilitator / coherence function. |
| Live telemetry is not mature enough. | Section 5 | Use minimum viable signals, refreshed data, and explicit evidence gaps as pilot inputs. |
| Retirement metrics can create bad incentives. | Sections 3, 7 | Treat retirement as positive only when dependency, risk, and value evidence support it; measure decision quality first. |
| Regulatory claims may overreach. | Sections 2, 5, 7 | Use S1/S2/S3/S4 for broad expectations and avoid claiming they mandate the exact operating model. |

## Cut / Park List

- Detailed system-of-record design -- park for pilot design.
- Full enterprise taxonomy -- park for pilot outputs.
- Specific domain names -- park unless the author approves safe examples.
- Broad AI/security acceleration claim -- cut unless additional sourcing is added.
- Detailed control mapping -- park for fact-check or appendix if circulation expands.

## Drafting Risks

- The draft may sound like architecture claiming ownership of enterprise decisions; keep architecture as facilitator.
- The draft may imply complete telemetry exists today; frame signals as minimum viable and improving.
- Regulatory language may sound too specific; keep it expectation-aligned unless fact-check adds section-level support.
- The paper may blur strategy memo and architecture explainer; prioritize executive decision usefulness.
- Recurring terms such as lifecycle, readiness, and operational readiness must be defined before reuse.

## Deep Mode Additions

### Structure-Selection Rubric

| Paper Job | Audience Priority | Target Length | Recommended Pattern | Why | Trade-off |
|-----------|-------------------|---------------|---------------------|-----|-----------|
| Internal strategy / decision memo | Senior executive sponsor first; architects and controls second | 1,800-2,500 words | Decision-first strategy memo with operating-model middle and pilot close | Gives the sponsor a decision path while preserving enough mechanism for peer review | Less room for detailed architecture taxonomy or control mapping |

### Draft Readiness Scorecard

| Dimension | Score | Why | Structural Fix If 3 Or Below |
|-----------|-------|-----|------------------------------|
| Thesis placement | 4 | Thesis can appear immediately after the decision ask | - |
| Reader progression | 4 | The outline moves from ask to gap to model to pilot | - |
| Evidence placement | 3 | Evidence supports broad direction but several operating-model claims remain recommendations | Keep recommendation language clear and cite C2/C4/C6 cautiously |
| Objection placement | 4 | Major executive, architecture, and risk objections have assigned sections | - |
| Decision usefulness | 4 | Pilot ask and sponsor action are explicit | - |
| Scope discipline | 3 | The topic can expand into taxonomy, tools, controls, and operating model | Keep parked items out of the main draft |
| Draft readiness | 4 | Ready to rewrite imported material against this structure | - |

### Structural Anti-Patterns

| Severity | Anti-Pattern | Location | Why It Violates The Profile / Reader Need | Structural Fix |
|----------|--------------|----------|-------------------------------------------|----------------|
| HIGH | Undefined recurring terms | Imported draft opening | Executive readers should not infer what lifecycle or readiness means | Define lifecycle, readiness, and operational readiness in Section 1 |
| MEDIUM | Regulatory overclaiming | Why-now and evidence sections | Control partners need precise claims | Separate official-source support from proposed operating model |
| MEDIUM | Architecture as hidden approver | Ownership section | Federation tension is a primary objection | State that domain owners decide and architecture facilitates |
| MEDIUM | Pilot too broad | Pilot section | Sponsor needs a low-regret next step | Constrain to selected domains, minimum signals, and lessons before expansion |

### Reader Jump Analysis

| From Section | To Section | Jump Risk | Why It Matters | Fix |
|--------------|------------|-----------|----------------|-----|
| 1. Decision Ask | 2. The Gap | LOW | Ask leads naturally into why change is needed | Keep the ask short before problem framing |
| 2. The Gap | 3. Decision Model | LOW | Problem needs mechanism | Use one transition sentence: obligations become decisions |
| 3. Decision Model | 4. Ownership | MEDIUM | Decision types do not automatically imply who owns them | Add explicit bridge: decisions need accountable owners |
| 4. Ownership | 5. Evidence Standard | MEDIUM | Ownership without evidence can sound political | Add bridge: owners can only decide from shared evidence |
| 5. Evidence Standard | 6. Pilot | LOW | Minimum signals set up pilot feasibility | Keep signal list pragmatic |
| 6. Pilot | 7. Risks | LOW | Sponsor expects caveats before approval | Make guardrails expansion criteria |
| 7. Risks | 8. Closing Decision | LOW | Guardrails naturally lead to bounded approval | Close with exact ask |

### Evidence / Objection Load Check

| Section | Load Issue | Risk | Fix |
|---------|------------|------|-----|
| 2. The Gap | S1 and S4 support direction, not the exact lifecycle discipline | Overclaiming | Use "supports" and "aligns with", not "requires" |
| 3. Decision Model | Four decisions rely mostly on S5 | Weak external support | Present as proposed pilot model |
| 4. Ownership | Federation recommendation is strategic synthesis | Architects may challenge authority | Invite validation and define decision rights |
| 5. Evidence Standard | Live signal maturity is uncertain | Reader may reject as unrealistic | Start with minimum viable refreshed signals |
| 7. Risks | Many caveats can weaken the ask | Sponsor may see proposal as not ready | State caveats as pilot guardrails, not blockers |

## Skeleton Draft

### Intro

- **Purpose sentence(s):** This memo asks for approval to validate technology lifecycle management as a sponsored pilot, not as a broad enterprise rollout. The pilot would test whether selected technology domains can make better adopt, continue, modernize, and retire decisions from named ownership and current evidence.
- **Thesis/map:** Technology should be managed as a measurable lifecycle discipline because adoption creates obligations that persist after intake, federated decisions need shared visibility without central approval, and resilience / risk expectations require stronger evidence than periodic attestation.

### Decision Ask And Thesis

- **Topic sentence:** The decision is whether to sponsor a constrained pilot for technology lifecycle management.
- **Support bullets:** Validate direction; approve coalition framing; select pilot domains; agree minimum signals.
- **Evidence placeholders:** S5; C1-C4.
- **Objection placeholder:** This is not an enterprise rollout or new default approval forum.
- **Transition note:** Define why the current control model leaves a lifecycle gap.

### The Gap

- **Topic sentence:** Current controls are strongest at intake, but the cost and risk of technology often emerge after adoption.
- **Support bullets:** Long-lived obligations; unclear owner; duplicated use; patching and modernization pressure; retirement difficulty.
- **Evidence placeholders:** K1/S1; K4/S4; C1.
- **Objection placeholder:** Existing controls are necessary but incomplete.
- **Transition note:** Convert obligations into explicit decision types.

### Decision Model

- **Topic sentence:** The discipline should produce four decisions: adopt, continue, modernize, and retire.
- **Support bullets:** Define each decision; measure decision quality; avoid retirement as a raw target.
- **Evidence placeholders:** S5; S4; C4.
- **Objection placeholder:** Retirement must be evidence-based and dependency-aware.
- **Transition note:** Decisions require named owners and facilitation.

### Ownership

- **Topic sentence:** Domain owners should own lifecycle decisions; architecture should facilitate coherence, not become the approval gate.
- **Support bullets:** Owner accountability; architecture facilitation; risk/control evidence expectations; peer architecture coalition.
- **Evidence placeholders:** K2/S2; K3/S3; C2; C6.
- **Objection placeholder:** Federation is preserved by separating ownership from facilitation.
- **Transition note:** Owners need a common evidence standard.

### Evidence Standard

- **Topic sentence:** Lifecycle decisions should start from minimum viable live or refreshed signals.
- **Support bullets:** Ownership, use/dependency, resilience, security/maintenance, cost, exceptions; known gaps; maturity path.
- **Evidence placeholders:** K2/S2; K3/S3; K4/S4; C3; C5.
- **Objection placeholder:** Incomplete telemetry is a reason to start small, not to avoid the discipline.
- **Transition note:** Minimum signals shape the pilot.

### Pilot Path

- **Topic sentence:** The next step is a narrow pilot across selected domains.
- **Support bullets:** Pick domains; build decision records; test continue/modernize/retire candidates; return with lessons.
- **Evidence placeholders:** S5; Q1; Q2.
- **Objection placeholder:** The pilot does not require full operating-model design up front.
- **Transition note:** Name guardrails before asking for approval.

### Risks And Guardrails

- **Topic sentence:** The pilot should proceed only with guardrails that prevent governance theater and unsupported claims.
- **Support bullets:** Time-boxing; owner decision rights; architecture facilitation; evidence gaps; cautious regulatory wording; lessons before scale.
- **Evidence placeholders:** X1; X2; Q3.
- **Objection placeholder:** These risks are reasons for a pilot design, not reasons to leave the lifecycle unmanaged.
- **Transition note:** Close with the requested decision.

### Conclusion

- **Decision/takeaway placeholder:** Approve the lifecycle-management pilot framing, selected-domain validation, and peer architecture coalition conversation.
- **Implications/next steps placeholder:** Return with pilot-domain candidates, minimum signal inventory, decision-record format, and expansion criteria.
