# Software Supply-Chain Evidence Pack Example

This is a completed GPD workspace for a public-source internal decision memo.

It validates a governance-heavy paper path:

- standard-mode `decision_memo` with prioritized technology/risk and engineering audiences
- real public sources from CISA, NIST, SLSA, OpenSSF, OWASP, and NCSC
- `RESEARCH.json` with claim-support metadata for direct and partial source support
- reader feedback routed back through research, brief, draft, fact-check, review, and export
- a concise control-process memo that answers the process-burden objection

The final paper asks for approval of a lightweight supply-chain control process for high-risk AI and software deployments. The key correction this example demonstrates is backward routing: human review found that the original memo claimed AI scope while mostly proving generic software supply-chain control. The workflow then added AI runtime evidence for model/provider, prompt/configuration, retrieval/source, and tool-permission changes.

## Expected Findings

`EXPECTED-FINDINGS.md` records the pre-run expectations and failure modes this example was meant to test. It is intentionally kept at the example root so test coverage can assert the calibration target, not only the finished output.

## Known Limitations

- The memo is a decision example, not an implementation template for a real control program.
- The control-record fields are proposed internal operating design; the public sources support the evidence categories, not this exact workflow.
- The example uses public sources only and does not include internal thresholds, role names, recertification cadence, or production policy text.

## Privacy Boundary

This example is synthetic and anonymized. It contains no real people, organization names, employer names, internal titles, local paths, private drafts, or private source material.
