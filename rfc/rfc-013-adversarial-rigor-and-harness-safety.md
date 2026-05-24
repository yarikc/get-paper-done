# RFC-013: Adversarial Rigor and Harness Context Safety

**Status:** Proposed
**Author:** AI Orchestrator
**Created:** 2026-05-20

## 1. Objective
To protect the integrity of the high-stakes writing workflow against three specific AI failure modes: silent context eviction within the agent harness, sycophantic/weak interrogation during the `/gpd-grill` phase, and hallucinated evidence during the `/gpd-research` phase.

## 2. Background
Get Paper Done (GPD) relies on strict file boundaries to prevent LLMs from generating "corporate slop." However, because the workflow executes inside conversational agent harnesses (Claude Code, Codex), it is vulnerable to the inherent behaviors of those environments. If the harness drops context to save tokens, or if the LLM defaults to polite compliance rather than rigorous critique, the structural gates fail silently.

## 3. Proposed Solutions

### 3.1. Mitigating Harness Context Eviction (Explicit Read Directives)
**The Problem:** Harnesses periodically summarize or drop old context. If `/gpd-draft` is invoked late in a session, the harness may attempt to draft based on its "memory" of the brief rather than the actual `.paper/BRIEF.md` and `.paper/RESEARCH.json` files, leading to scope drift.
**The Solution:**
Update all downstream slash commands (`/gpd-outline`, `/gpd-draft`, `/gpd-fact-check`, `/gpd-review`) to include explicit, unbreakable file-read directives.
*   **Implementation:** Commands must start with instructions like: `CRITICAL: Do NOT rely on conversational memory. You MUST execute a raw file read of [Artifact X] before proceeding.`
*   **Impact:** Guarantees the LLM is always operating on the durable state, regardless of harness token-management strategies.

### 3.2. Adversarial Interrogation (`/gpd-grill` Hardening)
**The Problem:** LLMs are trained to be helpful and polite, often accepting vague user inputs without pushing for necessary specifics. If the `grill` phase asks weak questions, the resulting `DECISIONS.md` will be weak.
**The Solution:**
Refactor the `paper-strategist` and `grill` prompts to adopt an explicitly adversarial and skeptical persona.
*   **Implementation:** Inject system instructions such as: `You are a hostile, detail-oriented Principal Engineer. Do not accept vague assertions like "improves performance." You must demand specific metrics, identify ignored edge cases, and point out logical contradictions in the user's premise.`
*   **Impact:** Forces the extraction of deep tacit knowledge and ensures the user has a defensible thesis before reaching the strategy gate.

### 3.3. Strict Source Grounding (`/gpd-research` Containment)
**The Problem:** Left to its own devices, an LLM will confidently hallucinate citations or summarize pre-training data to fulfill the `RESEARCH.json` contract.
**The Solution:**
Establish a strict boundary between "User-Provided Ground Truth" and "LLM Synthesis."
*   **Implementation:**
    1.  Require users to place raw source material in `original/sources/`.
    2.  Update `/gpd-research` to explicitly ban the citation of any claim not directly verified by a file read within `original/sources/` or via a verified tool call (if web search is enabled).
    3.  If no sources exist, the agent must mark evidence gaps rather than inventing support.
*   **Impact:** Ensures that `FACT-CHECK.md` is validating against reality, not just checking the consistency of a hallucination.

## 4. Drawbacks
*   Increases the token cost per turn due to forced re-reading of artifacts.
*   The adversarial tone in the grill phase may be jarring to users unprepared for pushback, though this is aligned with the project's target persona.

## 5. Alternatives Considered
*   Building a standalone UI instead of using Claude/Codex harnesses. *Rejected: Rebuilding agentic scaffolding is too high an engineering burden when the file-based state machine already works.*

## 6. Implementation Recommendation

**Readiness:** not ready as a standalone implementation issue. Keep as an umbrella hardening RFC and merge its concrete pieces into existing feature requests.

### Usability and quality direction

The RFC identifies real risks: harness compaction, weak early interrogation, and hallucinated sourcing. The implementation should improve rigor without making the user experience feel hostile or heavy.

Recommended changes:

- Replace "hostile Principal Engineer" with "skeptical evidence-seeking reviewer." Rigor should be direct, specific, and reasoned, not performative.
- Do not require every source to live in `original/sources/`. Require recorded source provenance instead: user-provided file, imported source, verified web source, or explicit evidence gap.
- Avoid blanket re-reading of every artifact. Commands should use the smallest required artifact set and state which files informed the action.
- Explain backward routing in user language: "GPD is asking for research because the draft now depends on an unsupported claim."

### Load-bearing design correction

Prompt directives such as `CRITICAL: MUST read .paper/BRIEF.md` are not enough. They are advisory to the model and can be weakened by compaction or ignored by runtime behavior.

The durable fix is **mechanical CLI/workflow-layer artifact reading**. The workflow runner should insert or expose required artifact contents before the agent acts, outside the model's discretion. Prompt instructions may reinforce this, but they must not be the primary enforcement mechanism.

### Issue mapping

| Issue | Merge this RFC's delta |
|---|---|
| #36 | Source provenance, verified-source rules, evidence-gap behavior |
| #25 | Skeptical pre-draft interrogation and weak-premise challenge patterns |
| #42 | Mechanical CLI/workflow-layer re-read as the harness-compaction defense |
| #23 | Expected reduction in late review cycles from stronger early rigor |

### Recommendation

Do not create a new implementation issue for this RFC yet. Update #36, #25, and #42 when RFC-013.x is ready for implementation. The critical detail to preserve is that mechanical artifact reads, not prompt-only rules, are the primary context-safety mechanism.
