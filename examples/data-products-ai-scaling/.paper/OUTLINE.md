# Outline

## Mode

- **Depth:** Deep
- **Draft mode:** outline_only
- **Source basis:** `.paper/BRIEF.md`, `.paper/STRATEGY.md`, `.paper/RESEARCH.json`

## Structure Verdict

Use a strategy-paper structure: problem, thesis, mechanism, counterargument, operating model, adoption path, recommendation. The paper should not open as a data mesh explainer. It should open with the AI scaling failure and then show why domain-aligned data products are a practical operating pattern when constrained by shared platform services and controls.

## Reader Journey

- **Starting belief:** AI scaling is urgent, but the reader may see data products as either platform taxonomy or data mesh branding.
- **Target belief:** Domain-aligned data products are useful only when they become governed, reusable consumption interfaces for high-value AI use cases.
- **Core shift:** Move from "we need better data infrastructure" to "we need a domain-owned, platform-governed operating model for trusted AI data consumption."

## Opening Strategy

Start with a direct claim: AI programs do not scale through model tooling alone when every use case has to rediscover, re-permission, reinterpret, and re-validate the same enterprise data. Then state the thesis and immediately qualify it: data products help only when domain ownership is paired with common platform controls.

## Thesis Placement

Place the thesis in paragraph 2. Paragraph 1 should name the failure mode; paragraph 2 should state the recommendation and caveat.

## Section Architecture

| Section | Objective | Reader State In | Reader State Out | Main Claim | Evidence Hooks | Evidence Strength | Reader Questions | Objection Handled | Approx Length | Transition To Next | Keep/Cut |
|---------|-----------|-----------------|------------------|------------|----------------|-------------------|------------------|-------------------|---------------|--------------------|----------|
| 1. The AI scaling bottleneck is data repeatability | Reframe AI scaling from model tooling to trusted data consumption | CxO believes AI tooling is the visible bottleneck; architect suspects data quality is under-discussed | Reader sees trusted reusable data as a prerequisite for repeated AI delivery | AI scaling is constrained by data ownership, quality, semantics, access, lineage, and control gaps | S9, S10, S11; C1 | Moderate | What actually blocks repeated AI delivery? | "Model tooling is the real issue" | 350 | If the problem is repeatable trusted consumption, define the pattern that addresses it | Keep |
| 2. Domain-aligned data products are an operating pattern, not a label | Define data products operationally | CxO may hear jargon; architect wants mechanism | Reader understands data products as owned, documented, governed interfaces | Data products help only when ownership and consumption contracts are explicit | S1, S2, S4, S5, S7; C2 | Moderate | What makes this different from cataloging datasets? | "Data products are just data mesh rebranding" | 450 | Once the product mechanism is clear, explain why a common platform is still necessary | Keep |
| 3. The common platform keeps local product sprawl in check | Separate domain responsibilities from platform responsibilities | CxO worries about duplication; architect worries about silos | Reader sees shared services as the control layer for domain autonomy | A common governed platform keeps domain alignment from becoming fragmentation | S1, S4, S5, S7; C3 | Moderate | What does the platform own? What do domains own? | "Domain alignment creates inconsistent local silos" | 500 | With the mechanism established, face the strongest counterargument directly | Keep |
| 4. The strongest objection is fragmentation | Steelman the opposition | Reader is considering the recommendation but sees real execution risk | Reader trusts the paper because it names the failure mode honestly | Data-product programs fail when ownership, standards, incentives, and controls are weak | CON1, CON2; C2, C3 | Moderate | What could go wrong? | Main fragmentation and governance-burden objection | 400 | After naming the risk, define the operating model needed to control it | Keep |
| 5. The operating model is the real adoption decision | Translate architecture into ownership, funding, controls, and governance | CxO wants the decision implication; architect wants accountability boundaries | Reader sees the recommendation as an operating-model choice, not a tooling choice | Data products require domain ownership, platform paved roads, governance standards, and measurable use-case adoption | S2, S4, S7, S9; C4 | Weak to moderate | Who owns what? How does this avoid bureaucracy? | "This becomes governance theater" | 550 | With ownership defined, recommend an incremental adoption path | Keep |
| 6. Start with high-value AI use cases, not a taxonomy rollout | Make the recommendation actionable | Reader accepts the pattern but may default to broad program setup | Reader understands the next move: pilot around use cases with data contracts and controls | Adoption should begin with high-value AI use cases where reuse, quality, access, and governance pain are visible | C4, Q1, Q3 | Weak | Where do we start? How do we measure success? | "A broad standard is needed first" | 450 | Close with explicit recommendation and caveats | Keep |
| 7. Recommendation | State the ask and boundaries | Reader wants a concise decision | Reader knows what to approve, sequence, or challenge | Invest in domain-aligned data-product capability on a governed platform, with pilot-based adoption and explicit controls | S1-S11 synthesis | Moderate | What should leaders do now? | "Is this too broad?" | 300 | End | Keep |

## Objection Map

| Objection | Where Addressed | Handling |
|-----------|-----------------|----------|
| Data products can create fragmented local silos | Sections 3 and 4 | Accept as the strongest risk; answer with common platform services, standards, metadata, access control, lineage, and governance. |
| This is just data mesh language | Sections 2 and 5 | Define data products operationally: ownership, interface, quality, semantics, consumption contract, and control surface. |
| AI scaling depends more on model tooling | Section 1 | Position model tooling as necessary but insufficient without trusted reusable data. |
| Evidence does not prove business outcome uplift | Sections 1, 6, 7 | Use cautious language; claim reduction of recurring data friction, not guaranteed AI outcomes. |
| Governance will slow delivery | Sections 3 and 5 | Frame governance as paved-road controls and decision quality, not approval theater. |

## Drafting Risks

- Overclaiming the direct causal link between data products and AI business outcomes.
- Drifting into generic data mesh advocacy.
- Underexplaining the common platform's role.
- Making governance sound like bureaucracy instead of risk reduction and repeatability.
- Losing the CxO reader in mechanism detail.
- Losing the architect reader by hiding assumptions.

## Structure-Selection Rubric

| Paper Job | Audience Priority | Target Length | Recommended Pattern | Rationale |
|-----------|-------------------|---------------|---------------------|-----------|
| Recommend direction | CxO first, architect co-primary | 2,500 to 3,500 words | Problem -> thesis -> mechanism -> counterargument -> operating model -> adoption path | Balances decision usefulness with technical credibility. |

## Draft Readiness Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Thesis clarity | 4 | Clear and debatable; needs careful caveat on outcome evidence. |
| Evidence sufficiency | 3 | Good mechanism evidence; weak direct outcome evidence. |
| Objection handling | 4 | Fragmentation objection is explicit and central. |
| Audience fit | 4 | Structure serves both executive and architect readers. |
| Draft risk | 3 | Risk of generic data mesh prose remains high. |

## Structural Anti-Patterns

| Anti-pattern | Severity | Why It Matters | Fix |
|--------------|----------|----------------|-----|
| Generic data mesh explainer | HIGH | Would fail both executive decision usefulness and architect credibility. | Keep every section tied to AI scaling and operating-model decision. |
| Unsupported AI outcome claim | HIGH | Would overstate the evidence and trigger fact-check issues. | Use cautious language from `claims_to_soften`. |
| Governance theater | MEDIUM | Would make architecture sound like process preservation. | Describe controls as reusable paved roads, not approval gates. |

## Reader Jump Analysis

- CxO jump risk: From AI scaling problem to data product mechanism may feel technical. Fix with a short decision implication at the end of Section 1.
- Architect jump risk: From mechanism to recommendation may feel underspecified. Fix with a platform/domain responsibility table in Section 5.

## Evidence / Objection Load Check

- Sections 1 and 2 need the most evidence.
- Section 4 carries the main objection burden.
- Section 6 must stay modest because adoption-path evidence is currently weakest.

## Source Maintenance Note

- Fact-check corrected ISO source URLs in `RESEARCH.json`; no outline structure change was required.
- Section 3 heading was softened from "prevents" to "keeps local product sprawl in check" to preserve the bounded evidence posture.
- BRIEF claim evidence fields cite source IDs. Planned academic, blog, analyst, and industry source-type coverage is represented; practitioner-oriented evidence is encoded under allowed source-type values.
