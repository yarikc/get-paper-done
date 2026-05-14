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
| FC6 | High-risk AI and software deployments should use a lightweight supply-chain control process. | recommendation | Decision | MEDIUM | checked |
| FC7 | The control process standardizes existing production-approval questions rather than creating a separate approval forum. | strategic_judgment | Operating Rule | MEDIUM | checked |
| FC8 | Pilot owner, independent reviewer, and decision owner are proposed internal roles for operating the control process. | recommendation | Operating Rule | MEDIUM | checked |
| FC9 | The supply-chain control record should refresh when dependencies, promoted artifacts, AI runtime inputs, deployment status, or material exceptions change. | recommendation | Operating Rule | MEDIUM | checked |
| FC10 | Human review should happen by exception rather than as a standing handoff for every build. | recommendation | Operating Rule | MEDIUM | checked |
| FC11 | Automated checks should create observed evidence where possible, while the owner attests to gaps and reviewers handle exceptions. | recommendation | Operating Rule | MEDIUM | checked |
| FC12 | AI and LLM deployments add control points that may change behavior without a normal code release. | factual | Why This Is Needed | MEDIUM | checked |
| FC13 | Model/provider dependencies, prompt/configuration versions, retrieval data sources, and tool permissions should be visible in the control record when they can affect behavior. | recommendation | Evidence Pack Contents | MEDIUM | checked |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|---|---|---|---|---|---|---|---|
| LOW | FC3 | Supply-chain risk is an organizational risk-management concern, not only engineering hygiene. | This is a reasonable inference from NIST C-SCRM but should stay framed as risk-management context. | supported | S4 | Keep wording bounded. | NIST supply-chain guidance frames these concerns as organizational risk-management questions. |
| MEDIUM | FC6 | High-risk AI and software deployments should use a lightweight supply-chain control process. | Public sources support the evidence categories, but the exact requirement is an internal policy recommendation. | partially supported | S1, S2, S3, S5, S6, S7, S8, S9, S10 | Keep "should" and avoid saying public standards require the process. | High-risk deployments should use this minimum control process before deployment approval. |
| MEDIUM | FC7 | The control process standardizes existing production-approval questions rather than creating a separate approval forum. | This is an operating-design claim; it depends on implementation discipline. | partially supported | S4 | Keep the claim as design intent and include an exception path. | The process is designed to standardize existing production-approval questions. |
| MEDIUM | FC8 | Pilot owner, independent reviewer, and decision owner are proposed internal roles for operating the control process. | Public sources support accountability and risk management, but exact roles are internal design. | partially supported | S4 | Label the roles as the minimum operating rule after approval. | After approval, the pilot owner maintains the record, a separate reviewer validates exceptions, and the decision owner approves exceptions. |
| MEDIUM | FC9 | The supply-chain control record should refresh when dependencies, promoted artifacts, AI runtime inputs, deployment status, or material exceptions change. | Public sources support ongoing risk management, but exact refresh triggers are internal design. | partially supported | S4, S7, S8, S9, S10 | Label refresh triggers as internal lifecycle rules. | Refresh the record on material dependency, artifact, model/provider, prompt/configuration, retrieval/source, tool-permission, deployment, or exception changes. |
| MEDIUM | FC10 | Human review should happen by exception rather than as a standing handoff for every build. | Public sources support risk management, but automation-by-default is an internal operating design. | partially supported | S4 | Keep as operating rule, not standard mandate. | Automated checks should refresh evidence where possible; humans review exceptions, stale evidence, missing evidence, or material changes outside threshold. |
| MEDIUM | FC11 | Automated checks should create observed evidence where possible, while the owner attests to gaps and reviewers handle exceptions. | Public sources support risk management, but the exact automation/attestation process is internal design. | partially supported | S4 | Keep as operating design. | Automation creates observed evidence where possible; the owner attests, corrects, or explains gaps; reviewers handle exceptions. |
| MEDIUM | FC12 | AI and LLM deployments add control points that may change behavior without a normal code release. | Public AI sources support lifecycle governance and LLM-specific risk categories; the exact operational framing is an internal synthesis. | partially supported | S7, S8, S9, S10 | Keep bounded and concrete. | AI and LLM deployments add model, provider, prompt, retrieval, and tool-permission inputs that should be inspected when they can affect behavior. |
| MEDIUM | FC13 | Model/provider dependencies, prompt/configuration versions, retrieval data sources, and tool permissions should be visible in the control record when they can affect behavior. | Public sources support the risk categories but do not mandate this exact field list. | partially supported | S8, S9, S10 | Label as proposed internal evidence design. | The control record should include an AI runtime inventory for model/provider, prompt/configuration, retrieval/source, and tool-permission evidence when those inputs affect behavior. |

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
| FC6 | High-risk AI and software deployments should use a lightweight supply-chain control process. | The recommendation is supported by multiple software and AI evidence categories and is labeled as an internal policy proposal. | S1, S2, S3, S5, S6, S7, S8, S9, S10 |
| FC8 | Pilot owner, independent reviewer, and decision owner are proposed internal roles for operating the control process. | The claim is clearly framed as internal operating design, not an external standard mandate. | S4 |
| FC9 | The supply-chain control record should refresh when dependencies, promoted artifacts, AI runtime inputs, deployment status, or material exceptions change. | The claim is bounded as internal lifecycle design needed to prevent stale evidence. | S4, S7, S8, S9, S10 |
| FC10 | Human review should happen by exception rather than as a standing handoff for every build. | The claim is bounded as internal operating design, not a public-standard requirement. | S4 |
| FC11 | Automated checks should create observed evidence where possible, while the owner attests to gaps and reviewers handle exceptions. | The claim is bounded as internal operating design and avoids treating owner declaration alone as sufficient. | S4 |
| FC12 | AI and LLM deployments add control points that may change behavior without a normal code release. | NIST AI and secure AI sources support lifecycle governance; OWASP supports LLM-specific risk categories. | S7, S8, S9, S10 |
| FC13 | Model/provider dependencies, prompt/configuration versions, retrieval data sources, and tool permissions should be visible in the control record when they can affect behavior. | The field list is framed as internal evidence design derived from public AI risk categories. | S8, S9, S10 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|---|---|---|---|
| FC6 | Public standards require this control process. | Public references support the evidence categories; this memo proposes the internal process. | Avoid overclaiming the standards. |
| FC7 | The process will make approvals faster. | The process is designed to make production review more consistent by standardizing recurring questions and refreshing evidence on material change. | Speed benefit depends on implementation. |
| FC13 | AI runtime inventory proves the deployment is safe. | AI runtime inventory makes model, provider, prompt, retrieval, and tool dependencies inspectable; it does not prove the deployment is safe. | Avoid overstating control evidence. |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|---|---|---|---|
| None | - | - | - |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|---|---|---|
| Internal threshold for high-risk pilots | internal policy decision | No |
| Internal owner and validator names | internal operating decision | No |
| Exact refresh thresholds for dependencies, artifacts, AI runtime inputs, deployments, and exceptions | internal operating decision | No |
| Evidence that the process reduces approval cycle time | internal measurement | No |

## Source Alignment Notes

- Do not cite S1 or S2 as proof that a pilot is secure.
- Do not cite S5 as a universal mandate for full automated provenance in every early pilot.
- Do not cite S6 as a sufficient dependency-approval mechanism.
- Do not cite S7/S8 as a mandate for this exact AI runtime inventory template.
- Do not cite S9 as proof that this control process eliminates LLM risks.
- Do not cite S10 as proof that a third-party AI dependency is safe.
- Use S4 for risk-management framing, not for the exact internal control record fields, decision rules, refresh thresholds, or exception workflow.

## Synthesis Integrity

- **Overall assessment:** supported
- **Why:** Source-backed claims stay tied to evidence categories, and internal control process mechanics are labeled as operating-design recommendations.
- **Largest gap between evidence and conclusion:** The sources do not prove that this process will speed internal approval, guarantee better outcomes, or fully govern AI behavior.

## Systemic Risk Report

- **Summary:** Main risk is overclaiming transparency, provenance, or AI runtime inventory as security or safety proof.
- **Patterns:** Draft handles the main overclaim risk by calling artifacts evidence signals.
- **High-priority fixes:** Preserve the exception path, AI-specific refresh triggers, and "not proof of security" language.
- **Publication readiness:** ready_with_fixes

## Recommended Next Action

/gpd-review
