# Fact And Claims Check

## Mode

- **Depth:** Full
- **Scope:** Full draft
- **Source base:** `.paper/RESEARCH.json`, `.paper/RESEARCH.md`, `.paper/DRAFT.md`

## Claims Risk Verdict

Pass with revisions. The draft is usable for internal executive review after targeted softening. The main factual risk is not fabricated detail; it is over-attribution. Official sources support governed technology risk, dependency visibility, resilience, architecture / operations risk management, and ongoing maintenance. They do not prove that the proposed domain-owner model, four-decision model, or pilot design is required or externally validated.

## Claim Inventory

| Claim ID | Claim | Type | Location | Risk | Check Status |
|----------|-------|------|----------|------|--------------|
| FC1 | Technology should be managed as a measurable lifecycle discipline. | strategic_judgment | Decision Ask | Medium | Supported directionally |
| FC2 | Adoption creates obligations after intake. | strategic_judgment | Decision Ask; Lifecycle Gap | Medium | Supported directionally |
| FC3 | Regulated operating environments require evidence that technology risk, dependency, resilience, and maintenance expectations are managed. | factual | Decision Ask | Medium | Supported with cautious wording |
| FC4 | Existing intake controls do not fully manage post-adoption obligations. | strategic_judgment | Lifecycle Gap | Medium | Plausible; needs internal examples for stronger claim |
| FC5 | Four decisions should organize the pilot: adopt, continue, modernize, retire. | recommendation | Four Lifecycle Decisions | Medium | Author recommendation |
| FC6 | Retirement should count as positive only when evidence supports it. | recommendation | Four Lifecycle Decisions | Low | Safe with current caveat |
| FC7 | Domain owners should decide while architecture facilitates. | recommendation | Ownership And Facilitation | Medium | Author recommendation; supported directionally |
| FC8 | Lifecycle decisions should start from minimum viable live or refreshed signals. | recommendation | Evidence Standard | Medium | Supported directionally; keep staged language |
| FC9 | Official sources do not mandate a specific lifecycle dashboard. | factual | Evidence Standard | Low | Safe |
| FC10 | A narrow pilot is the recommended next step. | recommendation | Pilot Path | Low | Safe as recommendation |

## Claim Issues

| Severity | Claim ID | Claim | Issue | Evidence Status | Source(s) | Recommended Fix | Suggested Wording |
|----------|----------|-------|-------|-----------------|-----------|-----------------|-------------------|
| MEDIUM | FC3 | Regulated operating environments require evidence that technology risk, dependency, resilience, and maintenance expectations are managed. | Accurate directionally, but could sound broader than the specific source base. | Supported by official sources at theme level | S1, S2, S3, S4 | Keep but avoid implying one universal regulatory requirement. | "In a regulated enterprise, technology risk, dependency, resilience, and maintenance expectations are harder to defend without current evidence." |
| MEDIUM | FC5 | Four decisions should organize the pilot. | The four-decision model is not externally proven. | Supported by imported draft / strategic synthesis | S5, S4 | Present as pilot design. | "For the pilot, organize the discipline around four decisions..." |
| MEDIUM | FC7 | Domain owners should decide while architecture facilitates. | This is an operating-model recommendation. | Directionally supported, not proven | S2, S3, S5 | Keep as proposed design to validate. | "The pilot should test a model where domain owners decide and architecture facilitates." |
| LOW | FC8 | Live or refreshed signals should support lifecycle decisions. | "Live" can overstate current maturity. | Supported directionally | S1, S2, S3, S4 | Keep "live or regularly refreshed" phrasing. | Current wording is acceptable. |

## Claims Safe To Keep

| Claim ID | Claim | Why Safe | Source(s) |
|----------|-------|----------|-----------|
| C1 | Technology accumulation is a lifecycle problem, not just an intake problem. | Framed as strategic synthesis and supported directionally by risk / maintenance sources. | S1, S4, S5 |
| FC6 | Retirement should count as positive only when evidence supports it. | Properly caveated and avoids bad incentive risk. | S5 |
| FC9 | Official sources do not mandate a specific lifecycle dashboard. | Consistent with research contradiction X1. | S1, S2, S3, S5 |
| C6 | The proposed domain-owner model and four lifecycle decisions are the right implementation path. | Safe only when framed as pilot design to validate, not as external fact. | S5 |

## Claims To Soften

| Claim ID | Current Wording | Suggested Wording | Why |
|----------|-----------------|-------------------|-----|
| FC3 | "Regulated operating environments increasingly require evidence..." | "In a regulated enterprise, these expectations are harder to defend without current evidence..." | Reduces universal regulatory implication. |
| FC7 | "Domain owners decide." | "The pilot should test domain owners as decision owners." | Makes the ownership model a validation target. |
| FC8 | "Live or regularly refreshed signals." | Keep wording; avoid shortening to "live signals." | Protects against telemetry-maturity overclaim. |

## Claims To Remove Or Verify Before Publication

| Claim ID | Claim | Action | Why |
|----------|-------|--------|-----|
| FC3 | Any section-level regulatory claim beyond the current theme-level wording | Verify before broader circulation | Research currently supports themes, not section-level legal interpretation. |
| FC4 | Any claim that current internal controls definitely fail in named domains | Verify or anonymize with approved internal evidence | The current example has no approved internal examples. |

## Source Gaps

| Gap | Source Type Needed | Blocks Publication? |
|-----|--------------------|---------------------|
| Internal examples of duplicated cost, dependency spread, modernization delay, or retirement difficulty | Approved internal examples or anonymized author-provided evidence | Blocks strong version; does not block internal draft |
| Pilot-domain candidates | Author decision | Blocks pilot proposal specificity |
| Section-level regulatory citations | Official source section review | Blocks external or broad formal circulation |
| Telemetry feasibility | Internal platform / operations evidence | Blocks implementation plan, not strategic memo |

## Source Alignment Notes

- S1 supports technology and cyber risk management framing, but not the exact lifecycle operating model.
- S2 supports operational resilience, governance, and dependency mapping themes.
- S3 supports architecture / infrastructure / operations governance as an examiner-relevant area.
- S4 supports patching, upgrades, and preventive maintenance as ongoing technology-management obligations.
- S5 supports author intent, pilot framing, and the domain-owner / four-decision proposal.

## Synthesis Integrity

The draft mostly preserves the research distinction between external support and strategic recommendation. The strongest integrity risk is reader confusion between "official sources support the need for governed evidence" and "official sources require this exact lifecycle model." The draft should keep that distinction visible in the Evidence Standard and Risks sections.

## Systemic Risk Report

- **Overclaiming risk:** Medium. Manage with cautious regulatory language.
- **Evidence-gap risk:** Medium. Internal examples are still missing.
- **Audience-risk:** Medium. Mixed audience needs review because executives, architects, and control partners will read the ownership model differently.
- **Anonymization risk:** Low in the rewritten draft. The draft avoids private names, company names, personal titles, and local paths.
- **Workflow risk:** Low. Status correctly routes to review after fact-check.

## Recommended Next Action

Run `/gpd-review --deep` next, with explicit audience and opposition review focus on:

- whether the decision ask is clear enough for the senior sponsor,
- whether architecture facilitation avoids hidden approval authority,
- whether regulatory language is cautious enough,
- whether the pilot feels concrete without naming sensitive internal examples.

## Revision Refresh

- **Checked draft version:** v2
- **Result:** Pass.
- **Changes verified:** Opening evidence language was softened; ownership is framed as a pilot-tested model; an anonymized lifecycle-gap example was added; the closing ask now uses explicit approval bullets.
- **Remaining fact-check caveat:** Internal examples remain generic and anonymized. Stronger final publication would need approved internal examples or a clear decision to keep the paper generic.
