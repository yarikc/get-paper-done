# Research Index

## Summary

Public sources support the evidence categories for a lightweight supply-chain control process: SBOM/dependency transparency from CISA, secure-development attestation from NIST SSDF, supply-chain risk context from NIST C-SCRM, provenance from SLSA, open-source project health signals from OpenSSF Scorecard, and AI/LLM lifecycle controls from NIST AI RMF, the NIST Generative AI Profile, OWASP LLM Top 10, and NCSC secure AI guidance.

The key limitation is important: the sources support the categories, not the exact internal control record fields, owners, decision rules, refresh triggers, or exception path. Those are operating-design recommendations. The AI-specific addition is also bounded: model/provider inventory, prompt/configuration version, retrieval/source inventory, and tool-permission evidence are proposed internal fields based on public AI risk categories, not public-standard mandates.

## Source Registry

| ID | Source | Use |
|---|---|---|
| S1 | CISA Software Bill of Materials overview | SBOM as transparency mechanism |
| S2 | CISA 2025 Minimum Elements for SBOM | Minimum dependency record expectations |
| S3 | NIST SP 800-218 SSDF | Secure-development attestation framing |
| S4 | NIST SP 800-161 Rev. 1 C-SCRM | Supply-chain risk management context |
| S5 | SLSA Provenance | Artifact provenance concept |
| S6 | OpenSSF Scorecard | Open-source project health signal |
| S7 | NIST AI RMF 1.0 | AI lifecycle risk-management framing |
| S8 | NIST AI RMF Generative AI Profile | Generative AI risk-management framing |
| S9 | OWASP LLM Top 10 | LLM-specific supply-chain, plugin/tool, agency, and sensitive-information risks |
| S10 | NCSC Guidelines for secure AI system development | Secure development, deployment, operation, and maintenance of AI systems built on third-party tools or services |

## Safe Use Notes

- Cite S1/S2 for SBOM and dependency transparency.
- Cite S3 for secure-development practice framing.
- Cite S5 for provenance, not for a universal mandate.
- Cite S6 as a signal input, not as an approval decision.
- Cite S7/S8 for AI lifecycle and generative AI risk-management framing, not for this exact internal template.
- Cite S9 for LLM-specific risk categories; do not imply OWASP mandates this control record.
- Cite S10 for secure AI system lifecycle coverage, especially systems built on third-party tools and services.
- Label the control record owner, validator, decision rules, refresh triggers, and exception path as internal operating design.
- Treat refresh on dependency, artifact, model, provider, prompt/configuration, retrieval/source, tool-permission, deployment, or exception changes as an internal lifecycle rule supported by risk-management logic, not as a public-standard mandate.
- Treat automated observed evidence plus owner attestation as an internal process design, not as a public-standard mandate.
