# Paper Context

This context records the language decisions behind the supply-chain evidence-pack memo. The paper is a decision memo asking for a lightweight control process, not a white paper about software supply-chain security.

## Language

**Supply-chain control record**: The durable record that links a high-risk pilot to evidence, attestations, validation results, exceptions, and approval decisions.
_Avoid_: treating the record as a separate approval forum or as proof that a deployment is secure.

**Observed evidence**: Evidence produced directly by tooling, such as dependency inventory, artifact provenance, open-source health checks, or detectable AI runtime configuration.
_Avoid_: implying all evidence can be automated.

**Owner attestation**: A named owner declaration for evidence that tooling cannot observe directly.
_Avoid_: using attestation as a substitute for validation when the claim is high-risk.

**AI runtime inventory**: The behavior-shaping model/provider, prompt/configuration, retrieval-source, and tool-permission information needed to understand AI-specific supply-chain exposure.
_Avoid_: reducing AI supply-chain risk to dependency scanning only.

## Relationships

- **Supply-chain control record** contains **observed evidence**, **owner attestation**, **validation results**, and **approved exceptions**.
- **Observed evidence** is preferred where feasible; **owner attestation** fills gaps that require accountable human declaration.
- **AI runtime inventory** extends software supply-chain evidence for AI deployments; it does not replace dependency, provenance, or open-source-health evidence.
- **Exception handling** is the explicit path for stale, incomplete, or threshold-breaching evidence.

## Example Dialogue

> **Author:** "Are we creating a new governance board?"
>
> **Reader:** "No. The memo proposes a durable record and exception-based validation model inside the existing approval path."

> **Author:** "Do the public standards require this exact workflow?"
>
> **Reader:** "No. They support the evidence categories and risk framing; the workflow is an internal policy recommendation."

## Flagged Ambiguities

- "Baseline" was too vague. Resolved as a starting supply-chain control process with named evidence categories, refresh triggers, owners, validation, and exception handling.
- "AI scope" originally leaned too heavily on generic software supply-chain evidence. Resolved by adding AI runtime inventory for model/provider, prompt/configuration, retrieval-source, and tool-permission changes.
- "Bureaucracy" risk was underhandled. Resolved by framing the process as observed evidence plus human-by-exception review, not a standing approval forum.
