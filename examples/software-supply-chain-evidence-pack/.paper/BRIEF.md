# Brief

## Document Intent

- **Purpose:** decision_memo
- **Channel:** internal
- **Risk:** internal_high
- **Complexity:** standard
- **Audience shape:** prioritized_multi
- **Legacy/display label:** internal decision memo
- **Target audience:** senior technology/risk decision maker, with senior engineering/architecture as secondary reader
- **Why this audience should care:** pilot approval decisions already depend on software dependency, development, provenance, and open-source risk signals, but those signals are often inconsistent or late.
- **Desired outcome after reading:** approve a minimum evidence pack for high-risk AI and software pilots before production approval.
- **Decision or belief to influence:** the organization should standardize a lightweight evidence packet rather than rely on ad hoc pilot assertions.

Use the normalized classification values for workflow decisions. Treat labels such as "blog," "white paper," or "architecture paper" as display/context labels, not purpose values.

## Strategy Gate

- **Paper job:** Win approval
- **Argument posture:** Prescriptive
- **Decision usefulness:** Enables a yes/no decision on a minimum evidence pack and clarifies the operating boundary.
- **Strategic readiness:** Go

## Working Title

Require a Software Supply Chain Evidence Pack for High-Risk AI and Software Pilots

## One-Line Thesis

High-risk AI and software pilots should carry a small software supply-chain evidence pack before production approval because it makes dependency, secure-development, provenance, and open-source health questions reviewable without creating a separate approval process.

## Thesis And Position

- **Core thesis:** A minimum software supply-chain evidence pack should be required for high-risk AI and software pilots before production approval.
- **Alternative title options:** Minimum Evidence for High-Risk Pilots; Software Supply-Chain Evidence Before Production; A Lightweight Evidence Pack for AI Pilot Approval
- **Strongest opposing view:** Pilot teams should not be slowed down by control artifacts before they know whether the pilot has value.
- **Why this matters now:** AI and software pilots increasingly depend on third-party components, generated artifacts, open-source projects, and build pipelines that decision makers cannot assess from a demo alone.
- **Scope boundaries:** This memo does not define a full software assurance program, procurement policy, vendor risk process, or regulatory compliance standard.

### Thesis Formula

This paper argues that **high-risk AI and software pilots should require a minimum software supply-chain evidence pack before production approval** because **SBOMs improve dependency transparency**, **SSDF gives a public reference for secure-development attestation**, and **provenance/open-source health signals make artifact and dependency risk reviewable**; this matters because **approval decisions need repeatable evidence without turning pilots into full production assurance programs**.

## Reader Promise

The reader will be able to decide whether to approve a lightweight baseline, understand what evidence belongs in the packet, and see how the packet speeds review by making common questions explicit.

## Core Argument

1. Production approval needs repeatable evidence, not just a pilot team's confidence.
2. Public standards support the evidence categories, but they do not dictate the exact internal packet.
3. The packet should be lightweight: dependency inventory, secure-development attestation, provenance explanation, open-source health signal, and exception handling.

## Claims Deck

Create 3 to 5 major claims. Each claim should be arguable and specific.

### Claim 1: SBOMs make software component review more transparent.

- **Why it is true:** CISA presents SBOM as a software transparency mechanism, and its minimum-elements guidance identifies expected component-level information.
- **What evidence supports it:** S1, S2
- **Likely objection:** SBOMs are often incomplete, stale, or hard to use.
- **Response to objection:** The memo should treat SBOM as one evidence input, not proof of security.
- **Implication if accepted:** The packet should require an SBOM or dependency inventory when software components are in scope.

### Claim 2: NIST SSDF provides a public reference for secure-development attestation.

- **Why it is true:** NIST SP 800-218 defines secure software development practices organizations can map to.
- **What evidence supports it:** S3
- **Likely objection:** The pilot team may not have full production-grade evidence yet.
- **Response to objection:** The packet can record attestation, gaps, and exceptions without demanding full maturity before experimentation.
- **Implication if accepted:** The packet should require a short SSDF-mapped attestation or exception.

### Claim 3: Provenance helps reviewers understand where, when, and how promoted artifacts were produced.

- **Why it is true:** SLSA defines provenance as verifiable information about where, when, and how software artifacts were produced.
- **What evidence supports it:** S5
- **Likely objection:** Not every pilot has automated provenance ready.
- **Response to objection:** The baseline can accept an equivalent explanation for early pilots and require stronger provenance before production promotion.
- **Implication if accepted:** The packet should include provenance or an explicit gap before production approval.

### Claim 4: Open-source project health signals can inform review, but they should not become standalone approval gates.

- **Why it is true:** OpenSSF Scorecard is positioned as an automated signal for understanding open-source project security posture.
- **What evidence supports it:** S6
- **Likely objection:** A score may be misleading or too generic for the pilot context.
- **Response to objection:** Use the signal as a review input and require human handling of exceptions.
- **Implication if accepted:** The packet should ask for a project health signal for critical dependencies and document exceptions.

## Known Sources

- S1: CISA Software Bill of Materials overview
- S2: CISA 2025 Minimum Elements for a Software Bill of Materials
- S3: NIST SP 800-218 Secure Software Development Framework
- S4: NIST SP 800-161 Rev. 1 Cybersecurity Supply Chain Risk Management
- S5: SLSA Provenance specification
- S6: OpenSSF Scorecard

## Open Questions

- Which internal role owns packet completion?
- Which internal role validates exceptions?
- Which pilot categories are high-risk enough to require the packet?

## Constraints

- **Length:** 700-1000 words
- **Deadline:** 2026-05-13
- **Desired tone:** executive, direct, operational
- **Publication venue:** internal decision review
- **Citation requirements:** source IDs
- **Confidentiality constraints:** public-source-only example
- **Words or phrases to avoid:** guarantee, prove secure, compliance-ready, transformation, best-in-class
- **Must include:** clear ask, evidence categories, exception path, process-burden answer
- **Must avoid:** implying public standards mandate the exact internal packet
- **Must-not-omit risks or caveats:** SBOM, provenance, and scores are evidence signals, not security proof.

## Process Burden Check

Use this section when the paper proposes governance, controls, standards, gates, reviews, required records, or operating mechanisms.

- **Likely bureaucracy objection:** This creates a new approval layer that slows pilots before value is proven.
- **Answer:** The packet standardizes questions reviewers already ask at production approval: what components are in scope, how software was developed, where artifacts came from, which dependencies are risky, and who accepted exceptions.
- **Existing decision need being standardized:** production approval for high-risk pilots already requires dependency visibility, secure-development confidence, artifact traceability, and explicit risk acceptance.

## House Style Defaults

- Prefer short, clear sentences.
- Prefer active voice.
- Use concrete nouns over abstractions where possible.
- Use one strong idea per paragraph.
- Keep claims visible and easy to scan.

## Definition Of Done

- [x] Thesis is clear
- [x] Thesis appears in the first 1 to 3 paragraphs
- [x] Key claims are specific rather than generic
- [x] Audience objections are addressed
- [x] Claims are supported at the chosen proof standard
- [x] Trade-offs and caveats are explicit
- [x] Governance, control, or standard proposals address process-burden objections
- [x] Acronyms and specialized terms are explained unless common to the audience
- [x] Persona voice is consistent
- [x] Final export is ready for publication or handoff
