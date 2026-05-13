# Research Index

## Summary

Public sources support the evidence categories for a lightweight software supply-chain evidence pack: SBOM/dependency transparency from CISA, secure-development attestation from NIST SSDF, supply-chain risk context from NIST C-SCRM, provenance from SLSA, and open-source project health signals from OpenSSF Scorecard.

The key limitation is important: the sources support the categories, not the exact internal packet fields, owners, or exception path. Those are operating-design recommendations.

## Source Registry

| ID | Source | Use |
|---|---|---|
| S1 | CISA Software Bill of Materials overview | SBOM as transparency mechanism |
| S2 | CISA 2025 Minimum Elements for SBOM | Minimum dependency record expectations |
| S3 | NIST SP 800-218 SSDF | Secure-development attestation framing |
| S4 | NIST SP 800-161 Rev. 1 C-SCRM | Supply-chain risk management context |
| S5 | SLSA Provenance | Artifact provenance concept |
| S6 | OpenSSF Scorecard | Open-source project health signal |

## Safe Use Notes

- Cite S1/S2 for SBOM and dependency transparency.
- Cite S3 for secure-development practice framing.
- Cite S5 for provenance, not for a universal mandate.
- Cite S6 as a signal input, not as an approval decision.
- Label the packet owner, validator, and exception path as internal operating design.
