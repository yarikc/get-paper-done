# Approve a Supply-Chain Control Process for High-Risk AI and Software Deployments

Approve a lightweight supply-chain control process for high-risk AI and software deployments. This includes pilots that move into production-like use. The required artifact is a **supply-chain control record** that keeps evidence, attestation, validation results, exceptions, and approval decisions current.

High-risk means the deployment handles sensitive data; uses privileged integration; faces customers; supports regulated workflow; has production-like access; uses externally hosted AI services; or carries material supply-chain exposure. The goal is defensible deployment approval without another standing review board. Deployment owner means the accountable product, application, or pilot owner.

## Why This Is Needed

A working demo or model evaluation does not show supply-chain risk by itself. A system can look ready while depending on risky software components, external model APIs, prompt versions, retrieval data, tool permissions, weak development practices, untraceable build outputs, or exposed open-source projects.

Traditional dependency scanning helps with code and packages. AI and LLM deployments add inputs that may change behavior without a code release: model version; provider; prompt; retrieval corpus; and tool permissions. When one of those inputs changes, the control record must refresh or explicitly show that no material risk changed.

## References And Standards Used

The sources used here are recognized public software supply-chain and AI security references. They support the evidence categories; they do not mandate this exact internal workflow.

- CISA SBOM guidance supports dependency transparency (S1/S2).
- NIST SSDF supports secure-development practice evidence (S3).
- NIST C-SCRM frames supply-chain risk as organizational risk management (S4).
- SLSA defines provenance for produced software artifacts (S5).
- OpenSSF Scorecard gives an open-source health signal, not an approval decision (S6).
- NIST AI RMF, the NIST Generative AI Profile, OWASP LLM Top 10, and NCSC secure AI guidance support AI lifecycle and LLM-specific risk evidence (S7-S10).

## What The Control Record Contains

The control record should keep seven evidence groups distinct.

| Field | Decision need | Evidence source | Refresh trigger |
|---|---|---|---|
| Dependency inventory | Software components inside the deployment | SBOM or equivalent scan | Dependency change |
| AI runtime inventory | Behavior-shaping model, provider, prompt/configuration, retrieval source, and tool permission | Runtime inventory | Model, prompt, retrieval, provider, or tool-permission change |
| Secure-development attestation | Practices followed and unresolved gaps | SSDF-style attestation | Material process change or unresolved gap |
| Artifact provenance | Where did the promoted build come from? | Provenance metadata or equivalent explanation | New build or artifact source |
| Open-source health signal | Critical dependencies with visible project risk | Scorecard or equivalent signal | Critical dependency or risk signal change |
| Exception record | Acceptance of missing or stale evidence | Owner, compensating control, approver, follow-up date | New, expired, or changed exception |
| Validation result | Has the record been checked for accuracy and currency? | Reviewer check or automated policy check | Sample failure, stale record, or threshold breach |

These fields do not prove the deployment is secure. They make the decision inspectable by showing current evidence, observed facts, gap attestation, and accepted residual risk.

## How Decisions Use The Record

The process should use simple decision rules.

| Record state | Decision handling |
|---|---|
| Evidence is complete, current, validated as needed, and within threshold | Proceed through the normal deployment approval path. |
| Evidence is missing but has an owner, compensating control, approver, and follow-up date | Proceed with an explicit exception. |
| Evidence is stale, unowned, unvalidated where required, or missing without an approved exception | Hold deployment approval until corrected or accepted. |
| A material change occurs | Refresh the record and route only the exception or threshold breach to review. |

Automation creates or refreshes observed evidence; the owner attests, corrects, or explains gaps; reviewers validate exceptions and threshold breaches; the decision owner accepts residual risk.

## Governance Model

The process should apply only to high-risk deployments and to pilots before they become production-like. It should not block early experimentation.

| Role or mechanism | Responsibility |
|---|---|
| Automated checks | Create observed evidence for dependency inventory; artifact provenance; open-source health; and detectable AI runtime configuration where possible. |
| Deployment owner | Maintain the control record, attest to software and AI runtime evidence, and remediate or explain gaps. |
| Security/risk/architecture reviewer | Validate exceptions, stale evidence, threshold breaches, and sampled records. |
| Decision owner | Accept residual risk, approve exceptions, and require follow-up dates. |
| Sample validation | Periodically check whether records are accurate, current, and not bypassing review thresholds. |

Material change means a change that alters deployed code; dependency version; artifact source; model or provider dependency; prompt or configuration; retrieval corpus; tool permission; privileged access; sensitive-data handling; customer exposure; or an approved exception.

Human review should be triggered by:

- missing required evidence,
- stale evidence past allowed age,
- material change,
- critical dependency risk signal,
- unreviewed model or provider change,
- unreviewed retrieval, prompt, or tool-permission change,
- expired exception,
- acknowledged gap without remediation or approved compensating control,
- sampled validation failure.

This avoids new bureaucracy. It does not create a separate forum or require every deployment to wait for a human meeting. It keeps the existing approval path while making the evidence trail visible in one place.

## Decision

Approve the lightweight supply-chain control process for high-risk AI and software deployments, including pilots promoted into production-like use. The first implementation should use a simple template, automated evidence collection where available, owner attestation for gaps, reviewer validation for exceptions and samples, and an exception log. After two or three reviews, refine the thresholds and validation cadence.

## Sources

- S1: CISA Software Bill of Materials overview, https://www.cisa.gov/sbom
- S2: CISA 2025 Minimum Elements for a Software Bill of Materials, https://www.cisa.gov/resources-tools/resources/2025-minimum-elements-software-bill-materials-sbom
- S3: NIST SP 800-218 Secure Software Development Framework, https://csrc.nist.gov/pubs/sp/800/218/final
- S4: NIST SP 800-161 Rev. 1 Cybersecurity Supply Chain Risk Management, https://csrc.nist.gov/pubs/sp/800/161/r1/final
- S5: SLSA Provenance, https://slsa.dev/provenance
- S6: OpenSSF Scorecard, https://openssf.org/scorecard/
- S7: NIST AI Risk Management Framework 1.0, https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
- S8: NIST AI RMF Generative AI Profile, https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
- S9: OWASP Top 10 for Large Language Model Applications, https://owasp.org/www-project-top-10-for-large-language-model-applications/
- S10: NCSC Guidelines for secure AI system development, https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development
