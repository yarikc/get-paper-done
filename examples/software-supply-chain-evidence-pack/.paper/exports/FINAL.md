# Require a Software Supply Chain Evidence Pack for High-Risk AI and Software Pilots

Approve a minimum software supply-chain evidence pack for high-risk AI and software pilots before production approval. The packet should be lightweight: dependency inventory, secure-development attestation, artifact provenance, open-source project health signal, and documented exceptions.

The point is not to add a new approval board. The point is to standardize questions reviewers already need answered before a pilot moves into production: what software components are involved, how the software was developed, where the artifact came from, which open-source dependencies carry visible risk, and who accepted any missing evidence.

## Why This Is Needed

A pilot demo does not show software supply-chain risk. A model or application can look ready while depending on poorly understood components, weak development practices, untraceable build outputs, or open-source projects with unresolved risk signals.

Public sources support treating those questions as reviewable evidence. CISA positions a software bill of materials, or SBOM, as a software transparency mechanism (S1) and has published minimum-element guidance for SBOM records (S2). NIST's Secure Software Development Framework, or SSDF, gives teams a public reference for secure software development practices (S3). NIST's supply-chain risk guidance frames these concerns as organizational risk-management questions, not just engineering hygiene (S4).

## What The Evidence Pack Should Contain

For high-risk pilots, the packet should include five items.

1. **Dependency inventory.** Provide an SBOM or equivalent dependency inventory when software components are in scope. This improves transparency, but it does not prove the pilot is secure (S1, S2).

2. **Secure-development attestation.** Map the pilot team's development evidence to NIST SSDF at a practical level. If the evidence is not available, record the gap and the planned remediation (S3).

3. **Artifact provenance.** Provide provenance or an equivalent explanation for promoted artifacts. Supply-chain Levels for Software Artifacts, or SLSA, defines provenance as verifiable information about where, when, and how software artifacts were produced (S5). Early pilots may not have full automated provenance, but production approval should not ignore how the artifact was created.

4. **Open-source project health signal.** For critical open-source dependencies, record an OpenSSF Scorecard signal or equivalent review note. Treat it as an input to risk review, not as a standalone approval decision (S6).

5. **Exception record.** If evidence is missing, document the exception, owner, compensating control, and follow-up date. This keeps the process useful when a pilot is promising but not yet production-ready.

## Operating Rule

The evidence pack should be required only for high-risk pilots before production approval. It should not block early experimentation unless the pilot is already handling sensitive data, privileged integration, customer-facing behavior, regulated workflow, or production-like access.

After approval, the pilot owner completes the packet before production review. A security, risk, or architecture reviewer validates whether missing evidence is acceptable. The decision owner approves any exception explicitly, with a follow-up date. That is the minimum operating rule; it can be implemented as a review-packet section, not as a new workflow.

This is how the packet avoids becoming new bureaucracy: it does not create a separate forum. It makes the existing production decision faster and more consistent by putting dependency, development, provenance, and exception evidence in one place.

## Decision

Approve the evidence pack as the minimum baseline for high-risk AI and software pilots before production approval. The first implementation should use a simple review packet and exception log, then refine the fields after two or three pilot reviews.

## Sources

- S1: CISA Software Bill of Materials overview, https://www.cisa.gov/sbom
- S2: CISA 2025 Minimum Elements for a Software Bill of Materials, https://www.cisa.gov/resources-tools/resources/2025-minimum-elements-software-bill-materials-sbom
- S3: NIST SP 800-218 Secure Software Development Framework, https://csrc.nist.gov/pubs/sp/800/218/final
- S4: NIST SP 800-161 Rev. 1 Cybersecurity Supply Chain Risk Management, https://csrc.nist.gov/pubs/sp/800/161/r1/final
- S5: SLSA Provenance, https://slsa.dev/provenance
- S6: OpenSSF Scorecard, https://openssf.org/scorecard/
