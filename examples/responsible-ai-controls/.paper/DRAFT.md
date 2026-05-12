# Draft

**Status:** Draft
**Version:** v1
**Based on:** `.paper/BRIEF.md`, `.paper/RESEARCH.json`, `.paper/PERSONA.md`, `.paper/AUDIENCE.md`, `.paper/OUTLINE.md`
**Drafting mode:** full_draft
**Target section(s):** full draft
**Style controls:** external, sourced, bounded, non-promotional

---

## Section Intent Map

| Section | Objective | Reader State In | Reader State Out | Main Claim | Evidence Hooks | Local Objection | Length / Density | Transition Target |
|---------|-----------|-----------------|------------------|------------|----------------|-----------------|------------------|-------------------|
| Principles Are Necessary But Not Enough | Establish the credibility gap | Principles seem adequate | Principles need evidence | Principle-only claims are weak | S1, S4, S2 | Principles still matter | Medium | Definition |
| What Control Evidence Means | Define mechanism | Needs definition | Can inspect evidence | Evidence shows behavior | S1, S3, S5 | Documentation burden | Medium | Small stack |
| Keep The Evidence Stack Small | Address process concern | Worries about drag | Sees narrow approach | Small stack beats broad inventory | S3, S5, S2 | Symbolic controls | Medium | Limits |
| What The Model Does Not Prove | State caveat | Wants stronger promise | Understands residual risk | Evidence is not guarantee | S2, S4, S6 | Public confidence | Medium | Recommendation |
| Recommendation | Give first step | Needs starting point | Can start mapping | Map high-risk use cases first | S3, S5, S2 | Narrow map misses risk | Medium | End |

## Draft Body

### Principles Are Necessary But Not Enough

Responsible AI principles are useful, but they are not enough to make public AI governance claims more credible. Principles describe intent. External readers want to know whether that intent shows up in delivery behavior. S1 and S4 support the need for structured governance and defensible claims. S2 adds the caution that governance language can become symbolic when it is disconnected from actual model and use-case behavior.

That distinction matters because responsible AI language often sounds complete before the operating system exists. A principle such as "human oversight" is directionally valuable. It still needs an owner, a review record, an exception path, and a re-review trigger. Public credibility improves when those answers are inspectable.

### What Control Evidence Means

Control evidence is the observable record that a responsible AI principle is operating in delivery. It is not just a policy document. A useful evidence record identifies the control owner and the artifact produced. It also identifies the exception path, monitoring signal, and review cadence. S1, S3, and S5 support this operating view of governance.

For example, if a public claim says high-impact AI use cases receive human review, the evidence should show more than a statement of intent. It should identify the reviewer and the decision record. It should also show how unresolved concerns are escalated and which production signal would trigger re-review. The point is not to expose sensitive internal details publicly. The point is to avoid making claims the organization cannot trace to operating behavior.

This also keeps architecture, risk, and product teams aligned. Architecture can describe where controls sit in the delivery path. Risk partners can inspect whether the evidence is sufficient for the claim. Product teams can see what must be true before a feature or model is represented externally.

### Keep The Evidence Stack Small

The obvious failure mode is bureaucracy. If responsible AI control evidence becomes a broad inventory that every team fills out the same way, it can slow delivery while still missing the risks that matter. S2 warns that controls can become symbolic or stale. That criticism is strong enough that the paper should not recommend a complete control-evidence program as the first move.

The better first move is a small evidence stack for high-risk use cases. The minimum stack should answer five questions. Who owns the control? What artifact proves it ran? Where do exceptions go? Which signal shows the control may be stale? When is the control reviewed? S3 and S5 support this narrower pattern. Existing controls can be reused when they actually cover the AI claim. When they do not, the gap should be visible instead of hidden by generic governance language.

### What The Model Does Not Prove

Control evidence improves scrutiny, but it does not guarantee safe or compliant AI outcomes. Controls can be weak. Review artifacts can become stale. Model behavior can shift after launch. A use case can change enough that the original evidence no longer supports the public claim. S2, S4, and S6 all support caution around overclaiming.

That caveat should be explicit in external writing. A stronger public claim is not "our controls ensure responsible AI." A more defensible claim is "our responsible AI work is tied to named controls, review evidence, exception handling, and monitoring routines for the use cases where those controls apply." The second version is less dramatic, but it is more credible because it preserves residual risk.

### Recommendation: Build A Claim-To-Control Map First

The first implementation step should be a claim-to-control map for the highest-risk AI use cases. Start where a weak claim would create trust or operational risk. Candidate first waves include customer-facing assistants, decision-support models used by internal operators, and code-generation workflows that affect production systems. These examples give leaders a practical place to inspect evidence before scaling the model.

The map should stay simple:

- Public or internal claim being made.
- Control owner.
- Evidence artifact.
- Exception path.
- Monitoring or drift signal.
- Review cadence.
- Trigger for expanding the map to adjacent use cases.

This recommendation is intentionally bounded. S3 and S5 support claim-to-control mapping as a practical pattern. S2 warns that a narrow map can miss systemic risks if it never expands. The answer is not to start with a giant maturity model. The answer is to start narrow, review frequently, and expand when repeated exceptions or new public claims show that the evidence boundary is too small.

Responsible AI credibility comes from that discipline. Principles remain necessary, but the defensible question is whether each material claim can be traced to operating evidence and whether the organization is honest about what the evidence does not prove.

## Draft Notes

- **Assumptions made:** Sources are synthetic fixture records; no real source claims are made.
- **Open evidence gaps:** No real public benchmark proves this control-evidence model improves AI outcomes.
- **Placeholder flags:** None.
- **Author decisions needed:** None.
- **Structure issues found while drafting:** None.
- **Intentional deviations from outline:** None.
- **Change log:** Initial evidence-heavy external fixture draft.
- **Next suggested section:** Fact-check.
- **Sections that may need review:** Recommendation and caveat sections.
