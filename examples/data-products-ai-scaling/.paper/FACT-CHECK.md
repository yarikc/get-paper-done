# Fact And Claims Check

## Mode

full_claim_check

## Claims Risk Verdict

Medium

## Source Policy Used

- **Web allowed:** Yes
- **Citation style:** Source IDs in draft support artifacts; publication citations deferred
- **Audience proof standard:** Internal strategy paper for CxO and distinguished architect readers

## Claim Inventory

| Claim ID | Claim | Type | Location | Risk | Check Status |
|----------|-------|------|----------|------|--------------|
| FC1 | AI scaling depends on repeatable access to trusted, governed data, not model tooling alone. | strategic_judgment | Section 1 | MEDIUM | checked |
| FC2 | Domain-aligned data products help only when ownership and contracts are explicit. | technical_mechanism | Section 2 | MEDIUM | checked |
| FC3 | The common platform keeps local product sprawl in check. | technical_mechanism | Section 3 heading | MEDIUM | fixed |
| FC4 | Data-product programs should measure reuse and friction reduction, not product count. | recommendation | Section 4 | LOW | checked |
| FC5 | Start with high-value AI use cases rather than a taxonomy rollout. | recommendation | Section 6 | LOW | checked |
| FC6 | Product metadata, quality expectations, lineage, and access controls need to support downstream AI risk assessment. | strategic_judgment | Section 5 | MEDIUM | checked |
| FC8 | A focused first wave of domain-aligned data products can reduce recurring data friction when paired with governed platform controls. | recommendation | Section 1 | MEDIUM | checked |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|----------|----------|-------|-------|-----------------|-----------|-----------------|-------------------|
| MEDIUM | FC3 | The common platform prevents local product sprawl. | "Prevents" was too absolute; platform controls reduce fragmentation risk but do not guarantee prevention. | fixed | S1, S4, S7 | Applied in draft and outline. | The Common Platform Keeps Local Product Sprawl In Check |
| LOW | FC1 | AI scaling depends on repeatable access to trusted, governed data, not model tooling alone. | Supported as strategic judgment, not as universal measured causality. | supported | S9, S10, S11 | Keep the existing caveat that data products do not automatically improve AI outcomes. | Keep current body wording. |
| LOW | FC5 | Start with high-value AI use cases rather than a taxonomy rollout. | Supported as a pragmatic adoption recommendation, not as empirical law. | supported | S4, S7, S9, S12, S15 | Keep recommendation language; do not present as proven outcome evidence. | Keep current wording. |

## Claims Safe To Keep

| Claim ID | Claim | Why Safe | Source(s) |
|----------|-------|----------|-----------|
| FC2 | Domain-aligned data products help only when ownership and contracts are explicit. | Official architecture, academic, original blog, and practitioner sources support ownership, product thinking, consumption interfaces, and platform/governance responsibilities. | S1, S2, S4, S5, S7, S12, S13, S15 |
| FC4 | Data-product programs should measure reuse and friction reduction, not product count. | This is framed as an operating recommendation and aligns with the paper's bounded thesis. | S1, S4, S7 |
| FC6 | Product metadata, quality expectations, lineage, and access controls need to support downstream AI risk assessment. | NIST and ISO support the risk/data-quality logic; the draft does not claim these standards prescribe data-product architecture. | S9, S10, S11 |
| FC8 | A focused first wave of domain-aligned data products can reduce recurring data friction when paired with governed platform controls. | The revised opening states this as a bounded recommendation rather than proven outcome causality. | S1, S4, S7, S9, S10, S11, S12, S15 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|----------|-----------------|-------------------|-----|
| FC3 | The Common Platform Prevents Local Product Sprawl | The Common Platform Keeps Local Product Sprawl In Check | Common platform services can reduce fragmentation risk; they do not guarantee prevention. |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|----------|-------|--------|-----|
| FC7 | Direct public case study linking data-product adoption to measurable AI delivery improvement. | verify | The draft correctly marks this as needed evidence; no direct case study is currently present in the research corpus. |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|-----|--------------------|---------------------|
| Direct public case study linking data-product adoption to measurable AI delivery improvement. | Public case study or practitioner report | No for internal review; yes for stronger public publication claims |
| Regulated financial-services-specific control mapping. | Regulatory or internal control source pack | No for this bounded internal strategy draft |
| Practitioner failure examples where data-product programs increased fragmentation. | Practitioner postmortem or field report | No, but would strengthen opposition handling |

## Source Alignment Notes

- `RESEARCH.json` S10 was corrected to `https://www.iso.org/standard/81092.html`.
- `RESEARCH.json` S11 was corrected to `https://www.iso.org/standard/84150.html`.
- S9, S10, and S11 should remain framed as AI risk and data-quality support, not proof of data-product outcome improvement.
- BRIEF evidence fields cite source IDs, and planned academic, blog, analyst, and industry source types are represented in `RESEARCH.json`; practitioner-oriented evidence is encoded under allowed source-type values.

## Synthesis Integrity

- **Overall assessment:** supported
- **Why:** The draft now stays within the available evidence after softening the Section 3 heading.
- **Largest gap between evidence and conclusion:** Direct evidence that domain-aligned data products improve AI delivery outcomes remains thin.

## Systemic Risk Report

- **Summary:** The draft is credible for internal strategy review after source cleanup, heading revision, and opening thesis revision.
- **Patterns:** Mechanism claims are stronger than outcome claims; the revised opening preserves that distinction.
- **High-priority fixes:** None before review; public publication would still benefit from a direct case study.
- **Publication readiness:** ready_with_fixes

## Recommended Next Action

/gpd-review
