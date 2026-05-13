# Fact And Claims Check

## Mode

full_claim_check

## Claims Risk Verdict

Low

## Source Policy Used

- **Web allowed:** Yes
- **Citation style:** source IDs
- **Audience proof standard:** Public-source claims must cite source IDs and distinguish source-backed categories from internal operating-design recommendations.

## Claim Inventory

| Claim ID | Claim | Type | Location | Risk | Check Status |
|---|---|---|---|---|---|
| FC1 | SBOMs support software component transparency and dependency visibility. | factual | Why This Is Needed | LOW | checked |
| FC2 | NIST SSDF gives teams a public reference for secure software development practices. | factual | Why This Is Needed | LOW | checked |
| FC3 | Supply-chain risk is an organizational risk-management concern, not only engineering hygiene. | strategic_judgment | Why This Is Needed | MEDIUM | checked |
| FC4 | SLSA provenance is verifiable information about where, when, and how software artifacts were produced. | factual | Evidence Pack Contents | LOW | checked |
| FC5 | OpenSSF Scorecard can inform open-source project health review but should not be a standalone approval decision. | strategic_judgment | Evidence Pack Contents | MEDIUM | checked |
| FC6 | High-risk pilots should carry an evidence pack before production approval. | recommendation | Decision | MEDIUM | checked |
| FC7 | The packet standardizes existing production-approval questions rather than creating a separate approval forum. | strategic_judgment | Operating Rule | MEDIUM | checked |
| FC8 | Pilot owner, independent reviewer, and decision owner are proposed internal roles for operating the packet. | recommendation | Operating Rule | MEDIUM | checked |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|---|---|---|---|---|---|---|---|
| LOW | FC3 | Supply-chain risk is an organizational risk-management concern, not only engineering hygiene. | This is a reasonable inference from NIST C-SCRM but should stay framed as risk-management context. | supported | S4 | Keep wording bounded. | NIST supply-chain guidance frames these concerns as organizational risk-management questions. |
| MEDIUM | FC6 | High-risk pilots should carry an evidence pack before production approval. | Public sources support the evidence categories, but the exact requirement is an internal policy recommendation. | partially supported | S1, S2, S3, S5, S6 | Keep "should" and avoid saying public standards require the packet. | High-risk pilots should carry this minimum packet before production approval. |
| MEDIUM | FC7 | The packet standardizes existing production-approval questions rather than creating a separate approval forum. | This is an operating-design claim; it depends on implementation discipline. | partially supported | S4 | Keep the claim as design intent and include an exception path. | The packet is designed to standardize existing production-approval questions. |
| MEDIUM | FC8 | Pilot owner, independent reviewer, and decision owner are proposed internal roles for operating the packet. | Public sources support accountability and risk management, but exact roles are internal design. | partially supported | S4 | Label the roles as the minimum operating rule after approval. | After approval, the pilot owner completes the packet, a separate reviewer validates gaps, and the decision owner approves exceptions. |

## Quantitative Claims

| Claim ID | Metric Or Number | Baseline / Denominator / Timeframe | Source(s) | Support Strength | Handling |
|---|---|---|---|---|---|
| None | - | - | - | none | keep |

## Claims Safe To Keep

| Claim ID | Claim | Why Safe | Source(s) |
|---|---|---|---|
| FC1 | SBOMs support software component transparency and dependency visibility. | CISA supports SBOM as a software transparency mechanism. | S1, S2 |
| FC2 | NIST SSDF gives teams a public reference for secure software development practices. | NIST SP 800-218 is the public SSDF reference. | S3 |
| FC3 | Supply-chain risk is an organizational risk-management concern, not only engineering hygiene. | NIST C-SCRM supports the organizational risk framing. | S4 |
| FC4 | SLSA provenance is verifiable information about where, when, and how software artifacts were produced. | SLSA directly defines provenance in those terms. | S5 |
| FC5 | OpenSSF Scorecard can inform open-source project health review but should not be a standalone approval decision. | OpenSSF supports Scorecard as a project security posture signal; standalone approval is intentionally avoided. | S6 |
| FC6 | High-risk pilots should carry an evidence pack before production approval. | The recommendation is supported by multiple evidence categories and is labeled as an internal policy proposal. | S1, S2, S3, S5, S6 |
| FC8 | Pilot owner, independent reviewer, and decision owner are proposed internal roles for operating the packet. | The claim is clearly framed as internal operating design, not an external standard mandate. | S4 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|---|---|---|---|
| FC6 | Public standards require this evidence pack. | Public sources support the evidence categories; this memo proposes the internal packet. | Avoid overclaiming the standards. |
| FC7 | The packet will make approvals faster. | The packet is designed to make production review more consistent by standardizing recurring questions. | Speed benefit depends on implementation. |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|---|---|---|---|
| None | - | - | - |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|---|---|---|
| Internal threshold for high-risk pilots | internal policy decision | No |
| Internal owner and validator names | internal operating decision | No |
| Evidence that the packet reduces approval cycle time | internal measurement | No |

## Source Alignment Notes

- Do not cite S1 or S2 as proof that a pilot is secure.
- Do not cite S5 as a universal mandate for full automated provenance in every early pilot.
- Do not cite S6 as a sufficient dependency-approval mechanism.
- Use S4 for risk-management framing, not for the exact internal packet fields.

## Synthesis Integrity

- **Overall assessment:** supported
- **Why:** Source-backed claims stay tied to evidence categories, and internal packet mechanics are labeled as operating-design recommendations.
- **Largest gap between evidence and conclusion:** The sources do not prove that this packet will speed internal approval or guarantee better outcomes.

## Systemic Risk Report

- **Summary:** Main risk is overclaiming transparency and provenance artifacts as security proof.
- **Patterns:** Draft handles the main overclaim risk by calling artifacts evidence signals.
- **High-priority fixes:** Preserve the exception path and "not proof of security" language.
- **Publication readiness:** ready_with_fixes

## Recommended Next Action

/gpd-review
