# Public-Source Calibration Pre-Registration: Software Supply Chain Evidence Pack

- **Status:** Pre-registered before workflow run
- **Date:** 2026-05-13
- **Owning issues:** [#1](https://github.com/yarikc/get-paper-done/issues/1), [#2](https://github.com/yarikc/get-paper-done/issues/2)
- **Planned example slug:** `software-supply-chain-evidence-pack`
- **Public-source only:** Yes
- **Private material allowed:** No

## Purpose

Run one more realistic public-source paper calibration before adding more RFC surface area, synthetic fixtures, or speculative validators.

The trial should test whether GPD can produce a concise, decision-useful memo from real public sources while preserving source discipline, ask clarity, audience fit, fact-check readiness, and controlled review/revision.

## Working Paper

**Working title:** Require a Software Supply Chain Evidence Pack for High-Risk AI and Software Pilots

**Paper job:** Recommend whether high-risk AI/software pilots should require a minimum evidence pack before production approval.

**Intended ask:** Approve a lightweight baseline for pilot review packets:

1. SBOM or dependency inventory when software components are in scope.
2. Secure development attestation mapped to NIST SSDF practices.
3. Build/source provenance or equivalent explanation when artifacts are promoted.
4. Open-source project health signal for critical dependencies.
5. Exception path for pilots where the evidence is not yet available.

The memo must avoid sounding like a new bureaucracy. It should explain why the evidence pack improves decision speed, risk triage, and accountability rather than adding a parallel approval process.

## Classification

```json
{
  "purpose": "decision_memo",
  "channel": "internal",
  "risk": "internal_high",
  "complexity": "standard",
  "audience_shape": "prioritized_multi"
}
```

## Workflow Mode

Expected mode: `standard`

Rationale:

- The paper asks for a decision.
- It affects governance, risk acceptance, engineering delivery, and pilot promotion.
- It uses current public standards and guidance but should remain concise.
- It has multiple audiences, with one audience clearly prioritized.

## Audience

Primary audience:

- Senior technology/risk decision maker approving pilot controls.

Secondary audience:

- Senior engineering or architecture leader responsible for making the evidence pack operational.

Audience conflict to watch:

- The primary reader needs decision clarity and burden control.
- The secondary reader needs implementable evidence fields, owner expectations, and exception handling.

## Source Set

Use only public sources. Initial source set was verified as reachable on 2026-05-13.

| ID | Source | URL | Expected use |
|---|---|---|---|
| S1 | CISA Software Bill of Materials overview | https://www.cisa.gov/sbom | Establish SBOM as a recognized software transparency mechanism. |
| S2 | CISA 2025 Minimum Elements for a Software Bill of Materials | https://www.cisa.gov/resources-tools/resources/2025-minimum-elements-software-bill-materials-sbom | Identify minimum SBOM fields and maturity expectations. |
| S3 | NIST SP 800-218 Secure Software Development Framework | https://csrc.nist.gov/pubs/sp/800/218/final | Anchor secure development attestation in an official framework. |
| S4 | NIST SP 800-161 Rev. 1 Cybersecurity Supply Chain Risk Management | https://csrc.nist.gov/pubs/sp/800/161/r1/final | Connect evidence requirements to supply-chain risk management. |
| S5 | SLSA Provenance specification | https://slsa.dev/provenance | Explain provenance as verifiable information about where, when, and how artifacts were produced. |
| S6 | OpenSSF Scorecard | https://openssf.org/scorecard/ | Support the idea of using automated open-source project health signals as inputs, not final approval decisions. |

## Expected Claims

Claims the workflow should be able to support:

- SBOMs support software transparency and dependency visibility.
- NIST SSDF provides a public reference point for secure software development practices.
- Supply-chain risk management requires more than a point-in-time vendor or pilot assertion.
- Provenance is useful because it records how an artifact was produced, not just what the artifact is.
- Open-source project health scoring can inform review but should not be treated as a standalone approval gate.

Claims that should be softened, bounded, or rejected:

- "SBOMs prove a pilot is secure."
- "SLSA compliance eliminates software supply-chain risk."
- "OpenSSF Scorecard is sufficient for dependency approval."
- "Every pilot must complete full enterprise-grade software assurance before any experimentation."
- "This evidence pack guarantees regulatory readiness."

## Expected Failure Modes To Watch

1. **Acronym overload.** The paper may jump into SBOM, SSDF, SLSA, and C-SCRM without explaining why each standard matters.
2. **Bureaucracy objection underhandled.** The memo may propose a control baseline without preempting the objection that it slows pilots.
3. **Evidence overclaim.** The draft may treat transparency, provenance, or scoring signals as proof of security.
4. **Audience imbalance.** The memo may satisfy engineering readers but fail to make the decision ask clear to the primary reader.
5. **Weak operational model.** The draft may recommend evidence without naming who owns it, when it is required, and how exceptions work.
6. **Source mapping drift.** Fact-check may cite a source as direct support when it is only topically related.
7. **Visual temptation.** The memo may expose whether RFC-3/RFC-4 should remain deferred: if a simple evidence-pack flow or table is enough, no visual artifact is needed.

## What Counts As Useful Result

The calibration is useful if it produces at least one of the following:

- a clean completed example using public sources and no semantic warnings,
- a concrete prompt/workflow failure that should become guidance or a test,
- a source-support or fact-checking failure that should become a validator,
- evidence that classification should affect routing or required checks,
- evidence that a diagram/chart would materially improve a real paper,
- evidence that the workflow still drafts before the ask, thesis, or audience proof standard is stable.

The calibration is not useful if it only creates another polished example without new signal.

## Stage Plan

Run the workflow end to end:

1. `gpd init` or equivalent workspace creation.
2. `/gpd-persona` if persona setup needs adjustment.
3. `/gpd-audience`
4. `/gpd-brief`
5. strategy gate
6. `/gpd-research --standard`
7. `/gpd-outline --deep`
8. `/gpd-draft --next-section`
9. `/gpd-fact-check --full`
10. `/gpd-review --deep`
11. `/gpd-revise`
12. `/gpd-export`
13. `gpd validate --semantic`

## Required Observations

Record observations during or immediately after the run:

- Did the brief classify the paper correctly?
- Did the strategy gate challenge the ask, or rubber-stamp it?
- Did research distinguish direct support from topical support?
- Did the outline introduce the public standards before using acronyms heavily?
- Did the draft clearly state the decision ask and supporting thesis?
- Did the paper preempt the "new bureaucracy" objection?
- Did fact-check catch overclaims about SBOM, SLSA, Scorecard, or regulatory readiness?
- Did review produce audience-specific rewrite instructions?
- Did any feedback route backward to research, outline, or fact-check?
- Did the final memo remain concise?

## Commit Boundary

Do not commit private material, person names, company names, titles, local paths, ignored `docs/feedback*.md` files, or unpublished draft source material.

If this becomes a committed example, it must contain only public-source material and anonymized/generated paper artifacts.
