# Outline

## Mode

deep

## Structure Verdict

Use a compact decision memo. The paper should open with the ask, define the evidence pack, explain the public-source basis, answer the process-burden objection, and close with the approval decision.

## Reader Journey

The primary reader starts with concern that pilot controls will slow delivery. The paper should move that reader to the belief that the evidence pack standardizes questions already needed for production approval. The secondary reader should leave with enough detail to implement the packet without inventing a new process.

## Section Architecture

| Section | Objective | Reader State In | Reader State Out | Main Claim | Evidence Hooks | Evidence Strength | Reader Questions | Objection Handled | Approx Length | Transition To Next | Keep/Cut |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| Decision ask | State the approval request and the minimum packet. | Unsure whether this is a control proposal or another process layer. | Understands the exact ask and the lightweight boundary. | Approve a minimum evidence pack for high-risk pilots before production approval. | S1, S2, S3, S5, S6 | moderate | What am I being asked to approve? | Is this new bureaucracy? | 170 | Explain why current review is inconsistent. | Keep |
| Why the packet is needed | Show that ad hoc review leaves recurring risk questions late and inconsistent. | Believes teams may already know their risk. | Sees dependency, development, provenance, and open-source questions as repeatable approval inputs. | Production approval needs inspectable evidence, not just team confidence. | S4 | moderate | Why now? | Does this slow pilots? | 180 | Define the packet elements. | Keep |
| Evidence pack contents | Define the five packet elements and explain source basis. | Needs implementation detail. | Understands each evidence category and its source support. | The packet should cover dependency inventory, secure-development attestation, provenance, open-source health, and exceptions. | S1, S2, S3, S5, S6 | strong | What goes in the packet? | Are these standards being overread? | 320 | Address burden and exceptions. | Keep |
| Operating rule | Explain ownership, validation, and exceptions. | Worried the recommendation is not operational. | Sees a bounded operating model. | The packet standardizes existing approval questions and records exceptions. | S4 | moderate | Who owns this? What if evidence is missing? | This is a parallel approval process. | 220 | Close with decision. | Keep |
| Decision | Restate the approval decision and next step. | Needs the action. | Can approve the baseline and direct implementation. | Approve the baseline for high-risk pilots with an exception path. | S1-S6 | moderate | What happens after approval? | Does this overpromise security? | 120 | End. | Keep |

## Objection Map

| Objection | Where Addressed | Handling |
|---|---|---|
| This slows pilots before value is proven. | Decision ask, Operating rule | Explain that the packet applies before production approval and standardizes existing questions. |
| SBOMs and scores do not prove security. | Evidence pack contents | Explicitly frame them as evidence signals, not proof. |
| Public standards do not require this exact packet. | Evidence pack contents, Operating rule | Label the packet as an internal operating design based on public categories. |

## Drafting Risks

- Do not introduce SBOM, SSDF, SLSA, or Scorecard without explaining why each matters.
- Do not imply public standards mandate the exact internal packet.
- Do not let the process-burden answer appear only at the end.
- Keep the memo under 1000 words.
