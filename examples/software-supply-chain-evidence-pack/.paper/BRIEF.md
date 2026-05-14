# Brief

## Document Intent

- **Purpose:** decision_memo
- **Channel:** internal
- **Risk:** internal_high
- **Complexity:** standard
- **Audience shape:** prioritized_multi
- **Legacy/display label:** internal decision memo
- **Target audience:** senior technology/risk decision maker, with senior engineering/architecture as secondary reader
- **Why this audience should care:** deployment approval decisions already depend on software dependency, AI runtime, development, provenance, and open-source risk signals, but those signals are often inconsistent or late.
- **Desired outcome after reading:** approve a lightweight supply-chain control process for high-risk AI and software deployments, including pilots moving into production-like use.
- **Decision or belief to influence:** the organization should standardize a supply-chain control record and exception process rather than rely on ad hoc deployment assertions or owner-declared paperwork.

Use the normalized classification values for workflow decisions. Treat labels such as "blog," "white paper," or "architecture paper" as display/context labels, not purpose values.

## Strategy Gate

- **Paper job:** Win approval
- **Argument posture:** Prescriptive
- **Decision usefulness:** Enables a yes/no decision on a minimum control process, required control record, decision rules, and exception-based review.
- **Strategic readiness:** Go

## Working Title

Approve a Supply-Chain Control Process for High-Risk AI and Software Deployments

## One-Line Thesis

High-risk AI and software deployments should use a lightweight supply-chain control process because dependency, artifact, AI runtime, and open-source risk can change outside a normal approval moment and should be handled through observed evidence, owner attestation, decision rules, and human review by exception.

## Thesis And Position

- **Core thesis:** A lightweight supply-chain control process should be required for high-risk AI and software deployments, including pilots moving into production-like use.
- **Alternative title options:** Supply-Chain Control Before Deployment; A Lightweight Control Process for High-Risk Deployments; Supply-Chain Decision Rules for Deployment Approval
- **Strongest opposing view:** Deployment teams should not be slowed down by control artifacts, manual handoffs, or repeated review cycles when existing SDLC tooling already covers software dependencies.
- **Why this matters now:** AI and software deployments increasingly depend on third-party components, generated artifacts, open-source projects, build pipelines, external model services, prompt/configuration versions, retrieval data sources, and tool permissions that decision makers cannot assess from a demo or model evaluation alone.
- **Scope boundaries:** This memo does not define a full software assurance program, procurement policy, vendor risk process, or regulatory compliance standard.

### Thesis Formula

This paper argues that **high-risk AI and software deployments should require a lightweight supply-chain control process** because **SBOMs improve dependency transparency**, **SSDF gives a public reference for secure-development attestation**, **provenance/open-source health signals make artifact and dependency risk reviewable**, and **AI runtime inventory makes model/provider, prompt/configuration, retrieval/source, and tool-permission changes inspectable**; this matters because **approval decisions need observed evidence, owner attestation, and exception rules without turning pilots into full production assurance programs**.

## Reader Promise

The reader will be able to decide whether to approve a lightweight control process, understand what evidence belongs in the control record, and see how decision rules keep the process current without creating a standing approval board.

## Core Argument

1. Production or production-like deployment needs repeatable evidence, not just a deployment team's confidence.
2. Public references support the evidence categories, but they do not dictate the exact internal control process.
3. AI and LLM systems need explicit runtime inventory fields because model/provider, prompt/configuration, retrieval/source, and tool-permission changes can alter behavior outside conventional code releases.
4. The process should be lightweight: observed evidence where possible, owner attestation where needed, decision rules for use, and exception handling for residual risk.

## Claims Deck

Create 3 to 5 major claims. Each claim should be arguable and specific.

### Claim 1: SBOMs make software component review more transparent.

- **Why it is true:** CISA presents SBOM as a software transparency mechanism, and its minimum-elements guidance identifies expected component-level information.
- **What evidence supports it:** S1, S2
- **Likely objection:** SBOMs are often incomplete, stale, or hard to use.
- **Response to objection:** The memo should treat SBOM as one evidence input, not proof of security, and require refresh when dependencies materially change.
- **Implication if accepted:** The control record should require an SBOM or dependency inventory when software components are in scope.

### Claim 2: NIST SSDF provides a public reference for secure-development attestation.

- **Why it is true:** NIST SP 800-218 defines secure software development practices organizations can map to.
- **What evidence supports it:** S3
- **Likely objection:** The pilot team may not have full production-grade evidence yet.
- **Response to objection:** The process can record attestation, gaps, and exceptions without demanding full maturity before experimentation.
- **Implication if accepted:** The control record should require a short SSDF-mapped attestation or exception.

### Claim 3: Provenance helps reviewers understand where, when, and how promoted artifacts were produced.

- **Why it is true:** SLSA defines provenance as verifiable information about where, when, and how software artifacts were produced.
- **What evidence supports it:** S5
- **Likely objection:** Not every pilot has automated provenance ready.
- **Response to objection:** The baseline can accept an equivalent explanation for early pilots and require stronger provenance when artifacts are promoted.
- **Implication if accepted:** The control record should include provenance or an explicit gap before production or production-like deployment.

### Claim 4: Open-source project health signals can inform review, but they should not become standalone approval gates.

- **Why it is true:** OpenSSF Scorecard is positioned as an automated signal for understanding open-source project security posture.
- **What evidence supports it:** S6
- **Likely objection:** A score may be misleading or too generic for the pilot context.
- **Response to objection:** Use the signal as a review input and require human handling of exceptions.
- **Implication if accepted:** The control record should ask for a project health signal for critical dependencies and document exceptions.

### Claim 5: AI runtime inputs need explicit review fields when they can affect behavior.

- **Why it is true:** NIST AI RMF and the NIST Generative AI Profile support lifecycle risk management, OWASP LLM Top 10 identifies LLM-specific risk categories, and NCSC secure AI guidance covers systems built on third-party AI tools and services.
- **What evidence supports it:** S7, S8, S9, S10
- **Likely objection:** This turns the memo into AI governance instead of a supply-chain control.
- **Response to objection:** Keep the field list narrow: model/provider, prompt/configuration, retrieval/source, and tool-permission evidence only when those inputs can affect deployment behavior.
- **Implication if accepted:** The control record should include an AI runtime inventory and refresh it on material AI runtime changes.

## Known Sources

- S1: CISA Software Bill of Materials overview
- S2: CISA 2025 Minimum Elements for a Software Bill of Materials
- S3: NIST SP 800-218 Secure Software Development Framework
- S4: NIST SP 800-161 Rev. 1 Cybersecurity Supply Chain Risk Management
- S5: SLSA Provenance specification
- S6: OpenSSF Scorecard
- S7: NIST AI Risk Management Framework 1.0
- S8: NIST AI RMF Generative AI Profile
- S9: OWASP Top 10 for Large Language Model Applications
- S10: NCSC Guidelines for secure AI system development

## Open Questions

- Which internal role owns control record completion?
- Which internal role validates exceptions?
- Which deployment categories are high-risk enough to require the process?
- Which build, dependency, model/provider, prompt/configuration, retrieval/source, tool-permission, or deployment changes trigger refresh?
- Which checks can be automated and which require human exception review?
- What validation cadence should check that records are accurate and not bypassing thresholds?

## Constraints

- **Length:** 700-1000 words
- **Deadline:** 2026-05-13
- **Desired tone:** executive, direct, operational
- **Publication venue:** internal decision review
- **Citation requirements:** source IDs
- **Confidentiality constraints:** public-source-only example
- **Words or phrases to avoid:** guarantee, prove secure, compliance-ready, transformation, best-in-class
- **Must include:** clear ask, software evidence categories, AI runtime evidence categories, decision rules, refresh triggers, exception path, process-burden answer
- **Must avoid:** implying public references mandate the exact internal control process
- **Must-not-omit risks or caveats:** SBOM, provenance, and scores are evidence signals, not security proof.

## Process Burden Check

Use this section when the paper proposes governance, controls, standards, gates, reviews, required records, or operating mechanisms.

- **Likely bureaucracy objection:** This creates a new approval layer with too many human handoffs and stale evidence after each build.
- **Answer:** The control process standardizes questions reviewers already ask, creates observed evidence through automation where possible, asks the owner to attest or fix gaps, and sends humans only exceptions, stale evidence, or material changes.
- **Existing decision need being standardized:** production or production-like deployment for high-risk systems already requires dependency visibility, AI runtime visibility, secure-development confidence, artifact traceability, current risk signals, and explicit risk acceptance.

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
