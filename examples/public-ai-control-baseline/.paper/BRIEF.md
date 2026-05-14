# Brief

## Working Thesis

Internal generative AI pilots should not proceed with ad hoc controls because decision makers cannot compare pilots, validate risk treatment, or recertify controls when every team invents its own evidence. The review group should approve a minimum baseline that combines public AI risk framing, generative AI-specific risk attention, application-security risk taxonomy, and secure lifecycle evidence.

## Intended Ask

Approve a public-source control baseline and a standard pilot control record for internal generative AI pilots:

- this memo is written for a cold but qualified decision reader, not only people who participated in prior working sessions;
- each pilot gets a `pilot_control_record_id` used to track baseline evidence through intake, approval, recertification, and retirement;
- each pilot records required evidence for risk framing, generative AI profile risks, prompt-injection testing, and secure lifecycle checks;
- each baseline control has an owner, evidence template, allowed status values, validation gate, and recertification trigger;
- source references in the paper remain citation IDs such as S1 and S2, not enterprise pilot identifiers.

## Audience

Primary reader: senior technical decision makers. Secondary readers: security, risk, and platform leads.

## Claims

### Claim 1: NIST AI RMF supports organizing AI risk management through Govern, Map, Measure, and Manage functions

- **What evidence supports it:** S1.
- **What would challenge it:** If the paper claimed NIST mandates a specific internal control implementation.
- **Current handling:** Keep as a framing claim.

### Claim 2: Generative AI needs profile-specific risk handling beyond generic AI governance

- **What evidence supports it:** S2.
- **What would challenge it:** If the paper claimed the profile is a complete control catalog.
- **Current handling:** Keep with scope qualifier.

### Claim 3: Prompt injection should be treated as a specific pilot control topic

- **What evidence supports it:** S3.
- **What would challenge it:** If the paper claimed prompt-injection testing alone secures a pilot.
- **Current handling:** Keep as one required control area.

### Claim 4: Secure AI guidance supports lifecycle controls across design, development, deployment, and operation

- **What evidence supports it:** S4.
- **What would challenge it:** If the paper claimed the guidance replaces local risk assessment.
- **Current handling:** Keep as lifecycle framing.

### Claim 5: A baseline is only governable if it creates repeatable evidence and review gates

- **What evidence supports it:** S1 and S4 support governance and lifecycle framing; the specific pilot control record is this memo's proposed operating mechanism.
- **What would challenge it:** If the paper presented the pilot control record as a public standard instead of an internal governance design.
- **Current handling:** Keep as proposal, not source-backed fact.

### Claim 6: The decision must name who operates and validates the baseline

- **What evidence supports it:** S1 supports governance accountability and S4 supports lifecycle security responsibilities; exact role names are proposed internal operating design.
- **What would challenge it:** If the paper implied public standards assign internal role ownership.
- **Current handling:** Keep as implementation accountability proposal.

## Process Burden Check

Use this section because the memo proposes governance, controls, standards, review gates, required records, and an operating mechanism.

- **Governed object:** Internal generative AI pilots before approval, wider rollout, recertification, exception handling, or retirement.
- **Required artifact or record:** Standard pilot control record keyed by `pilot_control_record_id`.
- **Process vs artifact distinction:** Intake, review, exception handling, recertification, and retirement are the process; the durable artifact is the pilot control record with evidence links, owner, reviewer, status, decision date, next review date, and exception rationale.
- **Likely bureaucracy objection:** A skeptical reader may see the baseline as a new approval layer that slows pilots.
- **Answer:** The baseline standardizes evidence and gates that reviewers already need to approve, reject, recertify, or retire pilots; it does not approve individual pilots or create a parallel forum.
- **Existing decision need being standardized:** Reviewers already need to compare pilot evidence, validate attestations, approve exceptions, and know when a pilot must be refreshed or retired.
- **Evidence currency:** Evidence must remain current for pilot approval, wider rollout, recertification, and material use-case changes.
- **Refresh triggers:** Use-case change, control owner change, exception expiry, wider rollout request, material risk-profile change, prompt-injection test change, or lifecycle control change.
- **Decision rule:** Complete and current evidence can move to approval review; missing, stale, or failed evidence routes the pilot to more evidence, exception handling, rejection, or retirement.
- **Human-by-exception model:** Routine fields are standardized in the record; human review focuses on exceptions, stale evidence, failed tests, residual risk, and wider rollout decisions.
- **Standards used:** NIST AI RMF, NIST AI 600-1, OWASP LLM01, and NCSC/CISA secure AI guidance support risk framing, generative AI risk attention, prompt-injection coverage, and lifecycle evidence. They do not mandate this exact internal pilot record.
