# RFC-013.1: Global Workspace and Context Assembly

**Status:** Proposed
**Author:** AI Orchestrator / User
**Created:** 2026-05-20

## 1. Objective
To radically simplify the initialization of high-stakes papers by eliminating repetitive data entry (Steps 1 & 2 of the Musk teardown). This RFC proposes a structural shift to a "Workspace" model, enabling seamless reuse of profiles and audiences, harness-native context extraction, and continuous learning from finished papers.

## 2. Background
Currently, the GPD workflow forces users to establish their persona and audience interactively for *every* paper (`/gpd-persona`, `/gpd-audience`), even if they write to the same executive board weekly. Furthermore, reusable assets are mixed within the npm package structure rather than existing as a user-owned, global state. This creates unacceptable "bureaucratic friction" before the user can begin the actual intellectual work.

## 3. Proposed Solutions

### 3.1. The User-Owned Workspace Model
**The Problem:** Reusable contexts, profiles, and audiences are not easily manageable or inheritable across a user's personal portfolio of papers.
**The Solution:** Establish a strict separation between GPD framework code and User Workspace state.
*   **Implementation:**
    *   When the user initializes their paper directory (e.g., `~/Strategy-Papers/`), GPD creates a sibling `_global/` directory.
    *   Structure:
        ```text
        ~/Strategy-Papers/
        ├── _global/
        │   ├── profiles/
        │   ├── audiences/
        │   └── contexts/
        └── specific-paper-dir/
            └── .paper/
        ```
    *   The `gpd init` command is expanded: `gpd init --profile <name> --audience <name>`.
    *   This command performs a hard copy of the requested markdown files from `_global/` into the local `.paper/` directory. **Symlinks are strictly forbidden** to ensure the historical integrity of older papers if a global profile is updated later.

### 3.2. Harness-Native Persona Creation (Automate)
**The Problem:** Asking a user to define their own writing style and technical depth via a 10-question chat interface is tedious and often inaccurate.
**The Solution:** Leverage the existing knowledge of the host agentic harness (Claude Code, Codex).
*   **Implementation:** Introduce `/gpd-create-profile` and `/gpd-create-audience`.
    *   The prompt instructs the harness to read its own global system memory, custom instructions, and project context regarding the user.
    *   The harness synthesizes this data into the strict GPD `PERSONA.md` schema and saves it directly to `_global/profiles/`.

### 3.3. Continuous Learning via `gpd harvest`
**The Problem:** Profiles and audiences stagnate. The system does not learn from the stylistic edits or successful arguments made in previous papers.
**The Solution:** Introduce explicit feedback loops to update global state.
*   **Implementation:** A new CLI command: `gpd harvest --persona` or `gpd harvest --audience` (or both).
    *   This command is run after a paper is exported.
    *   The agent reads `.paper/exports/FINAL.md`, `.paper/FEEDBACK-READER.md`, and the current `.paper/PERSONA.md` or `.paper/AUDIENCE.md`.
    *   It identifies new vocabulary, adjusted tone, or newly discovered audience objections.
    *   It proposes a diff/update to the corresponding file in the `_global/` directory, making the user's toolset sharper for the next paper.

### 3.4. Context-Aware Grill Routing
**The Problem:** The grill phase currently asks setup questions even if the context is already known.
**The Solution:** `/gpd-grill` becomes state-aware.
*   **Implementation:**
    *   If `PERSONA.md` and `AUDIENCE.md` already exist in `.paper/` (injected via `gpd init`), `/gpd-grill` completely skips context-gathering and jumps immediately to unstructured source ingestion (to be defined in RFC-013.2) or adversarial interrogation.
    *   If the files are missing, the agent suggests pulling from `_global/` before resorting to interactive creation.

## 4. Drawbacks
*   Introduces the concept of "Global State," which requires users to understand the difference between updating a file in `.paper/` (local) vs. `_global/` (global).
*   Requires the host harness to have robust internal memory for `/gpd-create-profile` to be highly effective (though fallback to interactive generation remains possible).

## 5. Next Steps
*   Update `bin/lib/init.js` to support the `--profile` and `--audience` copy logic.
*   Create the scaffolding for the `_global/` directory initialization.
*   Draft the `/gpd-harvest` agent prompt.

## 6. Implementation Recommendation

**Readiness:** not ready as a separate implementation issue. Merge the resource model into #19 and hold the harness-memory and harvest pieces until the basic model is proven.

### Usability and quality direction

Reusable profiles, audiences, and context packs are the right simplification. They reduce repeated setup while preserving local paper history. The copy-not-symlink rule is correct because old papers must remain reproducible after shared resources evolve.

Recommended changes:

- Use an explicit GPD workspace name such as `.gpd/` or `gpd-workspace/` instead of `_global/`.
- Support configurable resource locations so users can separate work, personal, and public paper portfolios.
- Default to copy-with-provenance. Local paper artifacts should record where a reusable profile, audience, or context pack came from.
- Make global updates reviewable diffs. `gpd harvest` must never mutate reusable resources silently.
- Keep `/gpd-grill` rigorous. Existing reusable `PERSONA.md` and `AUDIENCE.md` should skip only known setup facts, not paper-specific ambiguity removal.

### Privacy boundary

Harness-native profile creation is risky if it reads global agent memory across projects. For regulated or enterprise users, cross-project memory leakage can become a policy problem.

Default scope should be:

- current paper directory
- explicitly imported sources
- explicitly selected reusable resources

If harness/global memory is used, the command must disclose that scope and require explicit opt-in before creating or updating a reusable profile.

### Issue mapping

| Issue | Merge this RFC's delta |
|---|---|
| #19 | Central resource model, copy-with-provenance, configurable resource location, no-symlink rule |
| #36 | Reusable source/context packs only after source provenance rules are settled |
| #42 | Only if harness-memory access becomes part of profile generation |

### Recommendation

Merge into #19. Phase 1 should implement reusable resource discovery and copy-with-provenance only. Defer harvest, harness-native profile creation, and context-aware grill shortcuts until at least one real paper proves the resource model is understandable.
