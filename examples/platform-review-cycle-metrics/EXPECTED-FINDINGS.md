# Expected Findings

Status: post-run pre-registration record for the committed quantitative example.

This example was created to prove that GPD can carry bounded numerical claims through research, draft, fact-check, review, and export without treating pilot metrics as enterprise proof.

## Expected Semantic Validation Result

`gpd validate --semantic --paper examples/platform-review-cycle-metrics` should return zero issues.

Expected validators to stay silent:

- `semantic.brief_claim_evidence_stale`
- `semantic.research_source_coverage`
- `semantic.research_counterevidence_missing`
- `semantic.fact_check_safe_source_alignment`
- `semantic.fact_check_claim_support_missing`
- `semantic.fact_check_claim_support_unsafe`
- `semantic.quantitative_claim_no_sources`
- `semantic.quantitative_claim_missing_context`
- `semantic.quantitative_claim_no_evidence_match`
- `semantic.quantitative_claim_source_alignment`
- `semantic.quantitative_claim_weak_support`
- `semantic.quantitative_claim_stale_source`
- `semantic.export_metadata_leak`
- `semantic.state_status_drift`
- `semantic.state_next_command_drift`

## Expected Human Findings

- The exact cycle-time number is safe only when baseline, endpoint, sample size, timeframe, and source IDs remain attached.
- The exact rework number is safe only when it stays scoped to the same pilot sample.
- The example should reject broad claims such as enterprise ROI, compliance improvement, or benchmark proof.
- The recommendation should remain a next-quarter continuation, not a broad rollout.

## Claim-Support Expectations

- `S1` and `S2` directly support `C1`.
- `S1` and `S3` directly support `C2`.
- `S4` directly supports `C3` and `C4`.
- Sources that only show improvement signal must not be treated as proof for ROI, compliance, or benchmark claims.

If future edits remove the source IDs, baseline, sample, timeframe, or `claim_support` metadata, semantic validation should fail or warn before this example is treated as complete.
