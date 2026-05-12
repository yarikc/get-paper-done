# Research Summary

Canonical research artifact: `.paper/RESEARCH.json`

This Markdown file is a short index for human scanning. Do not duplicate the full source registry or evidence matrices here unless explicitly requested.

## Research Plan

- **Depth:** standard
- **Source mode:** web-first
- **User feedback on plan:** Convert the imported-paper workflow into an anonymized example. Keep private source material out of the repository.

## Research Questions

| ID | Question | Mapped Claims | Source Types |
|----|----------|---------------|--------------|
| RQ1 | Do supervisory sources support enterprise technology and cyber risk management? | C1, C3 | official |
| RQ2 | Do resilience expectations support dependency mapping and owned lifecycle evidence? | C1, C2, C3 | official |
| RQ3 | Do financial-institution technology examination sources support architecture / operations governance? | C2, C3 | official |
| RQ4 | Does maintenance guidance support lifecycle upkeep and modernization logic? | C1, C4 | official |
| RQ5 | Which parts remain strategic recommendation rather than externally evidenced fact? | C2, C4 | user_provided, official |

## Evidence Verdict

Official sources support the broad direction: technology risk, cyber risk, operational resilience, architecture / infrastructure / operations, and patch management all require governance, accountabilities, dependency visibility, and ongoing maintenance. They do not directly prove the proposed domain-owner model, four lifecycle decisions, or pilot design. Those should be presented as the recommended implementation path.

## Key Findings

- **K1:** Technology and cyber risk guidance supports enterprise risk-management framing, but not the exact proposed lifecycle model — high — S1.
- **K2:** Operational resilience guidance supports mapping critical operations and dependencies — high — S2.
- **K3:** Financial-institution IT examination guidance supports architecture / infrastructure / operations governance and risk management — high — S3.
- **K4:** NIST patch-management guidance supports preventive maintenance and ongoing technology upkeep — high — S4.
- **K5:** The domain-owner model, four lifecycle decisions, and pilot ask are strategic recommendations that need careful framing — medium — S5 plus S1-S4.

## Claim Evidence Map

| Claim | Best Supporting Evidence | Best Opposing Evidence | Confidence | Implication |
|-------|--------------------------|------------------------|------------|-------------|
| Technology accumulation is a lifecycle problem | S1, S4, S5 | No direct contradiction found | Medium | Keep with support |
| Federated delivery needs shared lifecycle visibility | S2, S3, S5 | No direct proof of federation-specific design | Medium | Support more |
| Live signals are stronger than paper attestation | S1, S2, S3 | Telemetry maturity may be incomplete | Medium | Caveat |
| Modernization and retirement are positive outcomes | S4, S5 | Retirement success needs internal evidence | Medium | Support more |
| Regulatory / resilience expectations make evidence more important | S1, S2 | No direct contradiction found | High | Keep |

## Highest-Risk Contradictions

| Issue | Sources In Tension | Recommended Handling |
|-------|--------------------|----------------------|
| Official sources support broad expectations, not the exact lifecycle model | S1, S2, S3, S5 | Separate external expectation claims from recommended operating-model claims |
| Live telemetry may be a target state, not a current-state assumption | S2, S5 | Add minimum viable signal caveat |

## Open Questions Blocking Drafting

- None fully block drafting, but internal examples and pilot-domain choices would materially improve the paper.

## Facts Safe To Use

- OSFI B-13 is official technology and cyber risk management guidance for federally regulated financial institutions — S1 — high.
- OSFI E-21 addresses operational risk management and resilience and includes governance, critical operations, and dependency mapping — S2 — high.
- FFIEC's AIO materials support examiner focus on architecture, infrastructure, operations, governance, and interconnection — S3 — high.
- NIST SP 800-40 Rev. 4 frames patch management as preventive maintenance and risk reduction — S4 — high.

## Claims To Soften

- "Regulatory expectations are lifecycle-specific" — soften to evidence of governed technology risk, operational dependencies, and recovery readiness.
- "No lifecycle decision without live signals" — soften to increasingly rely on live or regularly refreshed signals.
- "Retirement is tracked as success" — qualify as well-evidenced retirement when dependency, risk, and value analysis support it.

## Claims To Drop Or Reframe

- "Frontier-model capability is compressing the security timeline" — needs additional evidence if retained; otherwise reframe around security and vulnerability-management expectations.

## Draft Support Notes

| Section | Recommended Evidence | Strength Of Language | Cautions |
|---------|----------------------|----------------------|----------|
| Why now | S1, S2, S3, S4 | moderate | Do not imply exact lifecycle model is mandated |
| Ownership and architecture role | S2, S3, S5 | cautious | Frame domain ownership as a model to validate |
| Tools and evidence | S1, S2, S4 | moderate | Start with minimum viable signals |

## Research Decisions

- Keep the lifecycle thesis.
- Separate externally supported obligations from the author's proposed operating model.
- Use official sources for risk / resilience / maintenance claims.
- Treat pilot design, domain ownership, and retirement metrics as recommendations requiring executive validation.

## Refresh Notes

- 2026-05-12: BRIEF.md claim-evidence fields were aligned to S1-S5 after the initial research pass. No new sources were added; the research conclusion is unchanged.
