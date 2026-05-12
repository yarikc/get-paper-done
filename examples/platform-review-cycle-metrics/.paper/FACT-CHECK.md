# Fact And Claims Check

## Mode

publication_check

## Claims Risk Verdict

Medium

## Source Policy Used

- **Web allowed:** No
- **Citation style:** Source IDs in draft support artifacts
- **Audience proof standard:** Internal decision memo with synthetic metric pack

## Claim Inventory

| Claim ID | Claim | Type | Location | Risk | Check Status |
|----------|-------|------|----------|------|--------------|
| FC1 | Median review cycle time moved from 10 days to 7 days, a 30% reduction across 20 sampled review packets over one quarter. | factual | Metric Evidence | MEDIUM | checked |
| FC2 | Average rework items moved from 6 to 4 per packet, a 33% reduction across the same 20 sampled review packets over one quarter. | factual | Metric Evidence | MEDIUM | checked |
| FC3 | The pilot does not prove enterprise ROI, compliance improvement, or general benchmark performance. | strategic_judgment | Boundary | MEDIUM | checked |
| FC4 | Continue the pilot for payment exception triage, access reviews, and model-change packets. | recommendation | Next Quarter | LOW | checked |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|----------|----------|-------|-------|-----------------|-----------|-----------------|-------------------|
| MEDIUM | FC3 | The pilot does not prove enterprise ROI or compliance improvement. | This caveat must remain near the metric claims. | supported_with_caveat | S4 | Keep boundary section. | The pilot does not prove enterprise ROI, compliance improvement, or a general benchmark for review performance. |
| MEDIUM | FC4 | Continue the pilot for named packet categories. | Supported as a bounded next step, not as broad rollout proof. | supported_with_caveat | S1, S3, S4 | Keep category list and repeatability condition. | Continue the pilot for payment exception triage, access reviews, and model-change packets. |

## Quantitative Claims

| Claim ID | Metric Or Number | Baseline / Denominator / Timeframe | Source(s) | Support Strength | Handling |
|----------|------------------|------------------------------------|-----------|------------------|----------|
| FC1 | 10 days to 7 days; 30% reduction | 20 sampled review packets over one quarter | S1, S2 | strong | keep |
| FC2 | 6 to 4 rework items per packet; 33% reduction | Same 20 sampled review packets over one quarter | S1, S3 | strong | keep |

## Claims Safe To Keep

| Claim ID | Claim | Why Safe | Source(s) |
|----------|-------|----------|-----------|
| FC1 | In the synthetic one-quarter pilot, median review cycle time moved from 10 days to 7 days, a 30% reduction across 20 sampled review packets. | Closely maps to RESEARCH.json C1 and includes baseline, endpoint, sample, timeframe, and source IDs. | S1, S2 |
| FC2 | Average rework items moved from 6 to 4 per packet, a 33% reduction across the same 20 sampled review packets over one quarter. | Closely maps to RESEARCH.json C2 and includes baseline, endpoint, sample, timeframe, and source IDs. | S1, S3 |
| FC4 | Continue the pilot for payment exception triage, access reviews, and model-change packets. | Closely maps to RESEARCH.json C4 and is presented as a bounded next-quarter recommendation. | S1, S3, S4 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|----------|-----------------|-------------------|-----|
| none | none | none | none |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|----------|-------|--------|-----|
| FC5 | The pilot proves enterprise ROI. | remove | No finance-backed analysis exists in the synthetic source pack. |
| FC6 | The pilot proves compliance improvement. | remove | No compliance outcome source exists in the synthetic source pack. |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|-----|--------------------|---------------------|
| Enterprise ROI | Finance-backed benefits analysis | Yes for ROI claims; no for current bounded recommendation |
| Compliance improvement | Compliance outcome evidence | Yes for compliance claims; no for current bounded recommendation |
| Repeatability | Next-quarter metric sample | No, but required before broader rollout |

## Source Alignment Notes

- FC1 maps to RESEARCH.json C1 and cites supporting sources S1 and S2.
- FC2 maps to RESEARCH.json C2 and cites supporting sources S1 and S3.
- FC4 maps to RESEARCH.json C4 and cites supporting sources S1, S3, and S4.
- Synthetic source IDs validate workflow shape only.

## Synthesis Integrity

- **Overall assessment:** supported
- **Why:** The memo keeps the recommendation within the strength of the synthetic metric pack.
- **Largest gap between evidence and conclusion:** The source pack does not support enterprise ROI, compliance improvement, or broad benchmark claims.

## Systemic Risk Report

- **Summary:** The largest risk is turning pilot metrics into proof.
- **Patterns:** Quantitative claims are safe only when baseline, sample, timeframe, and source IDs remain attached.
- **High-priority fixes:** Keep the Boundary section and do not remove metric context.
- **Publication readiness:** ready_with_fixes

## Recommended Next Action

/gpd-review
