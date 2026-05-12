# Fact And Claims Check

## Mode

full_claim_check

## Claims Risk Verdict

Medium

## Source Policy Used

- **Web allowed:** No
- **Citation style:** source IDs
- **Audience proof standard:** Internal decision memo claims must identify source support and avoid causal overclaiming.

## Claim Inventory

| Claim ID | Claim | Type | Location | Risk | Check Status |
|----------|-------|------|----------|------|--------------|
| FC1 | Decision-ready packet review is faster than mixed advisory intake in the synthetic sample. | factual | Current friction | MEDIUM | checked |
| FC2 | The pilot will reduce avoidable rework. | causal | Evidence limits | HIGH | needs source |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|----------|----------|-------|-------|-----------------|-----------|-----------------|-------------------|
| HIGH | FC2 | The pilot will reduce avoidable rework. | Current sources are partial or topical only for avoided rework. | unsupported | S1, S2 | Return to research for a direct rework source or remove the claim. | The pilot may reduce avoidable rework if follow-up evidence supports the causal link. |

## Quantitative Claims

| Claim ID | Metric Or Number | Baseline / Denominator / Timeframe | Source(s) | Support Strength | Handling |
|----------|------------------|------------------------------------|-----------|------------------|----------|
| FC1 | faster review cycle | synthetic packet sample, comparison window not exported | S1, S2 | strong | keep |

## Claims Safe To Keep

| Claim ID | Claim | Why Safe | Source(s) |
|----------|-------|----------|-----------|
| FC1 | Decision-ready packet review is faster than mixed advisory intake in the synthetic sample. | The claim is scoped to the sample and supported by direct source IDs. | S1, S2 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|----------|-----------------|-------------------|-----|
| FC2 | The pilot will reduce avoidable rework. | The pilot may reduce avoidable rework if follow-up evidence supports the causal link. | Current sources do not directly measure avoided rework. |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|----------|-------|--------|-----|
| FC2 | The pilot will reduce avoidable rework. | verify | It is a causal claim with weak support. |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|-----|--------------------|---------------------|
| Direct evidence for avoided rework | user_provided | Yes |

## Source Alignment Notes

- S2 is topical only for avoided rework and should not be cited as direct support for FC2.

## Synthesis Integrity

- **Overall assessment:** somewhat_overextended
- **Why:** Cycle-time claims are supported, but the rework claim extends beyond the current research.
- **Largest gap between evidence and conclusion:** Avoided rework is plausible but not directly measured.

## Systemic Risk Report

- **Summary:** The draft risks turning a plausible pilot benefit into a proven outcome.
- **Patterns:** Causal language is stronger than the evidence.
- **High-priority fixes:** Research the avoided-rework claim before revision.
- **Publication readiness:** needs_major_fact_revision

## Recommended Next Action

/gpd-research
