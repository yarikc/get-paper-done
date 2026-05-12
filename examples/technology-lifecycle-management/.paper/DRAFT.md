# Draft

**Status:** Draft
**Version:** v2
**Based on:** `.paper/BRIEF.md`, `.paper/PERSONA.md`, `.paper/AUDIENCE.md`, `.paper/RESEARCH.json` / `.paper/RESEARCH.md`, `.paper/OUTLINE.md`
**Drafting mode:** full_draft
**Target section(s):** full draft
**Style controls:** executive, direct, strategic, evidence-aware, anonymized

---

## Working Definitions

- **Lifecycle:** Lifecycle means the full operating life of a technology after it is introduced. It covers entry, ownership, use, fitness, modernization, and retirement.
- **Lifecycle decision:** Lifecycle decision means an explicit adopt, continue, modernize, or retire choice with a named owner and evidence basis.
- **Domain owner:** Domain owner means the accountable decision owner for a defined technology domain.
- **Readiness:** Readiness means current evidence that a technology can keep serving its business, risk, resilience, security, and cost obligations.
- **Operational readiness:** Operational readiness means the live or regularly refreshed signals used to judge readiness.

## Section Intent Map

| Section | Objective | Reader State In | Reader State Out | Main Claim | Evidence Hooks | Local Objection | Length / Density | Transition Target |
|---------|-----------|-----------------|------------------|------------|----------------|-----------------|------------------|-------------------|
| Decision ask | Make the approval request explicit | Is this another broad governance proposal? | This is a bounded pilot decision | Sponsor a lifecycle-management pilot | S5; C1-C4 | Governance expansion | Short / high density | Lifecycle gap |
| Lifecycle gap | Explain why current controls are incomplete | Existing controls may be enough | Intake controls miss post-adoption obligations | Accumulation is a lifecycle problem | K1/S1; K4/S4; C1 | Existing controls already cover this | Medium / concrete | Decision model |
| Decision model | Define the four decisions | The mechanism is still abstract | Four decisions make the discipline operational | Lifecycle management must produce decisions | S5; S4; C4 | Retirement metrics can misfire | Medium / scannable | Ownership |
| Ownership | Resolve federation tension | Centralization risk is high | Domain owners decide; architecture facilitates | Shared visibility does not require central approval | K2/S2; K3/S3; C2; C6 | Undermines federation | Medium / precise | Evidence standard |
| Evidence standard | Define minimum viable signals | Telemetry may be immature | Start with refreshed signals and known gaps | Decisions should use live or refreshed evidence | K2/S2; K3/S3; K4/S4; C3; C5 | Telemetry incomplete | Medium / pragmatic | Pilot |
| Pilot | Make next step practical | Direction may be too broad | A small pilot can test feasibility | Start with selected domains | S5; Q1; Q2 | Too broad to start | Short / action-oriented | Risks |
| Risks | Build trust through caveats | Hidden failure modes remain | Guardrails make the pilot credible | Expansion should depend on evidence | X1; X2; Q3 | Governance theater | Medium / balanced | Closing |
| Closing | Restate requested decision | Ready to decide | Sponsor knows the requested action | Approve bounded validation | S5 | Not ready for rollout | Short / decisive | End |

## Draft Body

### Decision Ask

This memo asks for approval to validate technology lifecycle management through a constrained pilot. The request is not to launch a new enterprise governance body. It is also not a request to choose a permanent system of record or redesign every decision process. The request is to sponsor a focused test: can selected technology domains make better adopt, continue, modernize, and retire decisions from named ownership and current evidence?

Lifecycle means the full operating life of a technology after it is introduced. It covers entry through retirement. Readiness means current evidence that a technology can keep serving business, risk, resilience, security, and cost obligations. Operational readiness means live or regularly refreshed signals. It is not a static assertion that everything is fine.

The thesis is simple: technology should be managed as a measurable lifecycle discipline. Adoption creates obligations that persist long after intake. Federated decisions need shared visibility without central approval. In a regulated enterprise, technology risk, dependency, resilience, and maintenance expectations are harder to defend without current evidence.

The decision requested now is narrow: validate the direction and sponsor a pilot across a small number of technology domains. It also asks permission to frame the conversation with peer architecture leaders. A successful pilot would not prove that the full model is complete. It would show whether the organization can make lifecycle decisions with clearer ownership and explicit decision records.

### The Lifecycle Gap

Most technology organizations already manage intake. Architecture review and procurement help decide whether a technology can enter or expand. Risk assessment, security review, and platform governance also matter. The gap is that larger cost and risk often appear after intake. Support obligations accumulate. Dependencies spread. Usage changes. Controls age. Patches fall behind. Duplicated technologies become difficult to retire.

That is why this is not primarily an intake problem. It is a lifecycle problem. A technology that looked reasonable at approval can become expensive or strategically misaligned over time. The organization may still know that the technology exists. It may not know who owns the decision to keep it, what it costs to continue, what risk is accepted by delaying modernization, or what evidence would justify retirement.

For example, a shared platform can remain visible in inventory while still being decision-opaque. Several teams may depend on it. Patch windows may vary by team. Integrations may be aging. No single owner may be accountable for deciding whether to continue investment, modernize the platform, or retire a duplicated capability. Nothing in that example requires a failed intake decision. The problem is that the post-adoption decision path is unclear.

Official research supports the direction of this argument without proving every part of the proposed model. Technology and cyber risk guidance supports active management of technology risk [K1/S1]. Maintenance and patch-management guidance supports the idea that technology upkeep is preventive risk reduction rather than optional cleanup [K4/S4]. Those sources do not mandate this exact lifecycle model. They do support the broader claim that weak ownership, stale evidence, and delayed maintenance are hard to defend in a regulated enterprise.

The practical implication is that existing controls should not be replaced. They should be complemented by a discipline that looks after the decision life of technology once it is already in the estate.

### Four Lifecycle Decisions

The pilot should organize the discipline around four decisions: adopt, continue, modernize, and retire.

Adopt decides whether a technology should enter or expand in a domain. Continue decides whether an existing technology remains fit for its current role. Modernize decides whether the technology needs upgrade or replacement. Retire decides whether the organization should exit a technology because its value no longer justifies the cost and risk of continued use.

The important point is that the lifecycle discipline should produce decisions, not just inventories or status reports. Inventory is necessary, but insufficient. A list of technologies does not tell a sponsor whether a platform should continue. It does not show whether a duplicated tool should be consolidated. It does not prove that an aging component deserves more investment.

Retirement also needs careful handling. Retirement should be treated as a positive lifecycle outcome only when dependency and value evidence support it. It should not become a raw target that rewards premature consolidation. The better measure is decision quality: owners should be able to explain each choice from evidence current enough to act on.

### Ownership And Facilitation

The pilot should test a domain-owner model. A domain owner means the accountable decision owner for a technology domain's lifecycle choices. The owner does not need to operate every tool directly, but they must be able to explain the domain's technology choices, evidence, risks, exceptions, and modernization path.

Architecture should facilitate this discipline, not become the default approver. That distinction matters. In a federated organization, centralizing every lifecycle decision would slow delivery and invite resistance. The better model is shared visibility with local accountability. Domain owners decide. Architecture helps maintain coherence across domains. Control partners define the evidence expectations that make decisions defensible.

This is where the proposal needs discipline. If architecture acts as the owner, the model will be read as governance expansion. If architecture only observes, the model will not create coherence. The useful role sits between those extremes: convene the right owners, translate cross-domain implications, identify duplication, keep decision records consistent, and escalate only when trade-offs cross domain boundaries.

Research supports this direction at the level of governance, dependency visibility, and operations risk management [K2/S2, K3/S3]. It does not externally prove that this exact domain-owner model is the only right answer [C6]. The pilot should therefore treat ownership as a validation question: can named domain owners make clearer decisions when architecture facilitates coherence and control partners shape evidence expectations?

### Evidence Standard

The pilot should start with minimum viable signals. Live signals are the target, but the starting point can include regularly refreshed evidence if telemetry is incomplete. The point is to stop treating static attestations as enough for lifecycle decisions that depend on current usage, dependency, risk, resilience, and cost conditions.

The minimum signal set should include ownership, dependency, resilience, security maintenance, cost, and exceptions. Ownership identifies accountability for the domain. Dependency shows business and platform reliance. Resilience shows tolerance for failure and recovery constraints. Security maintenance shows patching and unsupported-component exposure. Cost shows what the organization pays to run and change the technology. Exceptions show accepted gaps.

The evidence standard should be pragmatic. The pilot should not pretend complete instrumentation already exists. Where signals are missing, the decision record should say so. A missing signal is not automatically a blocker, but it is decision risk. That distinction is valuable: it lets sponsors see whether the organization is making an informed choice or simply accepting unknowns.

Operational resilience and examination-oriented guidance support dependency visibility, governance, and operating evidence [K2/S2, K3/S3]. Maintenance guidance supports the security and upkeep side of the model [K4/S4]. The paper should stay precise: these sources support governed evidence. They do not prove that a specific technology lifecycle dashboard is externally required.

### Pilot Path

The next step should be a pilot across two or three selected technology domains. The pilot should choose domains where ownership is plausible, dependencies matter, and the organization can learn something useful within a short period. It should not start with the hardest enterprise-wide taxonomy question.

The pilot should produce a sponsor-facing approval package, not a process binder. That package should name the selected-domain owners and show the current signal set. It should also include material decision records, evidence gaps that limited those decisions, and a recommendation to expand, revise, or stop the model.

The pilot should also test at least one continue decision and one modernize or retire candidate if the evidence supports it. That does not mean forcing a retirement. It means testing whether the model can move beyond discussion and produce a real decision with evidence, caveats, and ownership.

The sponsor's role is to approve the pilot framing, help clear ownership ambiguity, and support coalition conversations with peer architecture leaders and control partners. Without that sponsorship, the work risks becoming a documentation exercise rather than an operating change.

### Risks And Guardrails

The strongest objection is that this becomes governance theater: more meetings, more templates, and no better decisions. That risk is real. The pilot should be designed to disprove it quickly.

The first guardrail is decision orientation: every pilot artifact should connect to an adopt, continue, modernize, or retire decision. The second is owner clarity. If no one can own a domain decision, the pilot should surface that as a finding instead of hiding it in process language. The third is architecture restraint. Architecture should facilitate and connect; it should not claim approval authority by default. The fourth is evidence transparency. Missing signals should be named as decision risk. The fifth is careful external-claim handling. Regulatory and resilience sources should support the need for governed evidence without implying that the proposed model is directly mandated.

The pilot should not expand until it can answer three questions. Did the selected domains make better decisions than they would have made through existing mechanisms alone? Did owners understand and accept their decision rights? Did the minimum signal set make decisions clearer without creating unacceptable friction?

If the answer is no, the model should be revised before expansion. If the answer is yes, the organization can decide whether lifecycle management should become a broader operating discipline.

### Closing Decision

The recommended decision is to sponsor a constrained technology lifecycle-management pilot. Approving the pilot does not commit the organization to a full operating-model rollout. It commits the organization to testing whether a small number of domains can make clearer technology decisions after adoption using named ownership, minimum viable evidence, and explicit decision records.

Approve three next actions:

- Confirm two or three pilot-domain candidates.
- Agree the minimum signal set and decision-record format.
- Schedule a peer architecture and control-partner review of the pilot design.

The strategic question is not whether the organization has technology governance. It does. The question is whether it has enough lifecycle discipline to know when technology should continue, modernize, or retire before the decision gets harder.

## Draft Notes

- **Assumptions made:** Pilot domains will remain generic until the author approves safe examples; source IDs are sufficient for draft-stage evidence hooks.
- **Open evidence gaps:** Internal examples for cost, dependency, and retirement claims; section-level citations if the paper circulates beyond the initial executive review.
- **Placeholder flags:** None.
- **Author decisions needed:** Select pilot domains; decide whether to name source organizations in the final paper; decide how much regulatory specificity is appropriate.
- **Structure issues found while drafting:** The argument can drift into taxonomy or tool design; those details should stay out of the main draft.
- **Intentional deviations from outline:** Combined some decision-model and measure language for flow; kept the draft shorter than the upper target.
- **Change log:** Replaced imported raw draft with anonymized GPD draft v1. Revised to v2 after review: softened evidence language, recast ownership as pilot-tested, added anonymized lifecycle-gap example, and tightened closing approval bullets.
- **Next suggested section:** Fact-check refresh and review refresh.
- **Sections that may need review:** Opening evidence language; Ownership And Facilitation; Closing Decision.
