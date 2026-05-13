# Fact And Claims Check

## Mode

full_claim_check

## Claims Risk Verdict

Low

## Source Policy Used

- **Web allowed:** Yes
- **Citation style:** source IDs
- **Audience proof standard:** Public-source claims must cite source IDs and avoid internal outcome proof.

## Claim Inventory

| Claim ID | Claim | Type | Location | Risk | Check Status |
|----------|-------|------|----------|------|--------------|
| FC1 | NIST AI RMF uses Govern, Map, Measure, and Manage as AI risk-management functions. | factual | Baseline controls | LOW | checked |
| FC2 | NIST AI 600-1 supports generative AI-specific risk handling. | strategic_judgment | Baseline controls | LOW | checked |
| FC3 | Prompt injection is a specific LLM application risk. | recommendation | Baseline controls | MEDIUM | checked |
| FC4 | Secure AI guidance supports lifecycle checks across design, development, deployment, and operation. | factual | Baseline controls | LOW | checked |
| FC5 | Each pilot should maintain a `pilot_control_record_id` with evidence fields, status values, validation gates, and recertification triggers. | recommendation | Governance object | MEDIUM | checked |
| FC6 | The baseline should name operating and validation roles for pilot attestations. | recommendation | Accountability | MEDIUM | checked |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|----------|----------|-------|-------|-----------------|-----------|-----------------|-------------------|
| LOW | FC2 | NIST AI 600-1 supports generative AI-specific risk handling. | Avoid wording that says the source mandates this internal baseline. | supported | S2 | Keep "supports" rather than "requires." | NIST AI 600-1 supports treating generative AI risks with profile-specific attention. |
| MEDIUM | FC5 | Each pilot should maintain a `pilot_control_record_id` with evidence fields, status values, validation gates, and recertification triggers. | Public sources support governance and lifecycle control framing, but the exact record schema is an internal operating-design proposal. | partially supported | S1, S4 | State clearly that the record ID and enums are proposed internal governance mechanics. | The proposed governance object is a `pilot_control_record_id`. |
| MEDIUM | FC6 | The baseline should name operating and validation roles for pilot attestations. | Public sources support governance and lifecycle responsibility, but exact role assignment is an internal operating decision. | partially supported | S1, S4 | Keep the accountability table generic and avoid naming real teams in the example. | The baseline should name who operates the record and who validates attestations. |

## Quantitative Claims

| Claim ID | Metric Or Number | Baseline / Denominator / Timeframe | Source(s) | Support Strength | Handling |
|----------|------------------|------------------------------------|-----------|------------------|----------|
| None | - | - | - | none | keep |

## Claims Safe To Keep

| Claim ID | Claim | Why Safe | Source(s) |
|----------|-------|----------|-----------|
| FC1 | NIST AI RMF uses Govern, Map, Measure, and Manage as AI risk-management functions. | The claim is a direct source-framing claim. | S1 |
| FC2 | NIST AI 600-1 supports generative AI-specific risk handling. | The claim is scoped to support, not mandate or proof. | S2 |
| FC3 | Prompt injection is a specific LLM application risk. | OWASP LLM01 directly supports the risk category. | S3 |
| FC4 | Secure AI guidance supports lifecycle checks across design, development, deployment, and operation. | The source is organized around those lifecycle areas. | S4 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|----------|-----------------|-------------------|-----|
| FC2 | Generative AI needs profile-specific risk handling beyond generic AI governance. | Generative AI pilots should identify profile-specific risks before approval. | This keeps the recommendation tied to pilot intake rather than universal proof. |
| FC5 | The pilot control record is required by public standards. | The pilot control record is the proposed internal mechanism for making the baseline governable. | Public sources support the need for governance and lifecycle evidence, not this exact schema. |
| FC6 | Public standards assign these exact operating roles. | The accountability table names proposed internal roles for operating the baseline and validating attestations. | Public sources support accountability and lifecycle responsibility, not this exact role model. |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|----------|-------|--------|-----|
| None | - | - | - |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|-----|--------------------|---------------------|
| Internal outcome evidence | internal measurement | No |
| Final pilot-control-record template | internal governance design | No |
| Named operating teams | internal ownership decision | No |

## Source Alignment Notes

- Do not cite S1 as direct support for prompt injection; use S3.
- Do not cite S4 as proof that the proposed baseline will reduce internal incidents.
- Do not present `pilot_control_record_id` as a public-standard field. It is a proposed internal primary key for governance.
- Do not present the accountability table as externally mandated role design. It is the proposed internal operating model.

## Synthesis Integrity

- **Overall assessment:** supported
- **Why:** Public-source claims map to direct source support, and the proposed internal governance mechanics are clearly labeled as operating design.
- **Largest gap between evidence and conclusion:** Internal outcome reduction is not proven and is not claimed.

## Systemic Risk Report

- **Summary:** Main risk is overclaiming public frameworks as internal implementation proof.
- **Patterns:** Claims are source-backed and scoped.
- **High-priority fixes:** Preserve source IDs in export.
- **Publication readiness:** ready_with_fixes

## Recommended Next Action

/gpd-review
