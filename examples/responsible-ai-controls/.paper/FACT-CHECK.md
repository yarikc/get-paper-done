# Fact And Claims Check

## Mode

publication_check

## Claims Risk Verdict

High

## Source Policy Used

- **Web allowed:** No
- **Citation style:** Source IDs in draft support artifacts
- **Audience proof standard:** External technical explainer with synthetic source pack

## Claim Inventory

| Claim ID | Claim | Type | Location | Risk | Check Status |
|----------|-------|------|----------|------|--------------|
| FC1 | Responsible AI principles are not enough to make public AI governance claims more credible. | strategic_judgment | Section 1 | MEDIUM | checked |
| FC2 | Control evidence should identify owner, artifact, exception path, monitoring signal, and review cadence. | technical_mechanism | Section 2 | MEDIUM | checked |
| FC3 | Control evidence improves scrutiny but does not guarantee safe or compliant AI outcomes. | strategic_judgment | Section 4 | HIGH | checked |
| FC4 | The first implementation step should be a claim-to-control map for high-risk AI use cases. | recommendation | Section 5 | MEDIUM | checked |
| FC5 | Existing controls can be reused when they actually cover the AI claim. | recommendation | Section 3 | LOW | checked |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|----------|----------|-------|-------|-----------------|-----------|-----------------|-------------------|
| MEDIUM | FC1 | Principles are not enough for public credibility. | Could sound like principles have little value. | supported_with_caveat | S1, S2, S4 | Keep opening sentence but preserve "principles are useful" caveat. | Responsible AI principles are useful, but they are not enough to make public AI governance claims more credible. |
| MEDIUM | FC4 | Start with a claim-to-control map for high-risk AI use cases. | Supported as practical recommendation, not empirical proof of better outcomes. | supported_with_caveat | S2, S3, S5 | Keep recommendation bounded and include expansion trigger. | The first implementation step should be a claim-to-control map for the highest-risk AI use cases. |

## Claims Safe To Keep

| Claim ID | Claim | Why Safe | Source(s) |
|----------|-------|----------|-----------|
| FC2 | Control evidence should include ownership, review cadence, exception handling, and monitoring signals. | Closely maps to RESEARCH.json C2 and is supported by mechanism-focused sources. | S1, S3, S5 |
| FC3 | Control evidence improves scrutiny but does not guarantee safe or compliant outcomes. | Closely maps to RESEARCH.json C3 and is supported by critical counterevidence sources. | S2, S4, S6 |
| FC4 | The first implementation step should be a claim-to-control map for the highest-risk AI use cases. | Closely maps to RESEARCH.json C4 and is presented as a bounded recommendation with caveat. | S3, S5 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|----------|-----------------|-------------------|-----|
| FC1 | Responsible AI principles are not enough for public credibility. | Responsible AI principles are useful, but they are not enough to make public AI governance claims more credible. | Avoid dismissing principles and avoid absolute credibility language. |
| FC3 | Controls prove responsible AI. | Controls improve scrutiny and reduce opacity, but they do not guarantee safe or compliant outcomes. | Prevents unsupported guarantee language. |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|----------|-------|--------|-----|
| FC6 | A control-evidence model improves measurable AI outcomes. | remove | The synthetic source pack does not support outcome causality. |
| FC7 | The model satisfies legal or regulatory obligations. | remove | The fixture does not include legal analysis or jurisdiction-specific evidence. |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|-----|--------------------|---------------------|
| Real public benchmark for outcome improvement. | Academic or industry empirical study | Yes for outcome claims; no for the current bounded mechanism claim |
| Jurisdiction-specific legal mapping. | Legal or regulatory source pack | Yes for compliance claims; no for this explainer |
| External disclosure examples. | Public case examples | No, but would strengthen publication readiness |

## Source Alignment Notes

- Safe-to-keep FC2 maps to RESEARCH.json C2 and cites supporting sources S1, S3, and S5.
- Safe-to-keep FC3 maps to RESEARCH.json C3 and cites supporting sources S2, S4, and S6.
- Safe-to-keep FC4 maps to RESEARCH.json C4 and cites supporting sources S3 and S5.
- The draft uses synthetic source IDs only; it should not imply real source verification.

## Synthesis Integrity

- **Overall assessment:** supported
- **Why:** The draft stays within mechanism and credibility claims supported by the synthetic source pack.
- **Largest gap between evidence and conclusion:** The source pack does not support measured outcome improvement or compliance guarantees.

## Systemic Risk Report

- **Summary:** The largest factual risk is overclaiming what control evidence proves.
- **Patterns:** Mechanism claims are strong; outcome and compliance claims must be avoided.
- **High-priority fixes:** Keep caveats in Sections 1, 4, and 5.
- **Publication readiness:** ready_with_fixes

## Recommended Next Action

/gpd-review
