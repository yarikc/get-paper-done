# RFC-013.2: Unified Intake, Omni-Grill, and Brutally Honest TUI

**Status:** Proposed
**Author:** AI Orchestrator / User
**Created:** 2026-05-20

## 1. Objective
To radically simplify the user experience of starting a paper by executing Steps 1, 2, and 3 of the GPD UX teardown (Make Requirements Less Dumb, Delete, Simplify). This RFC merges `import` and `init`, collapses the setup phases into an "Omni-Grill," allows for draft-to-think workflows, and mandates a radically transparent, brutally honest CLI/TUI to keep the user oriented and accountable.

## 2. Background
The current GPD workflow exposes its internal "database schema" (the individual markdown artifacts) to the user, forcing them to invoke separate commands to build context before they can debate strategy. Furthermore, the CLI is split between `import` (for legacy recovery) and `init` (for new papers). We must hide this plumbing while simultaneously increasing the transparency of the paper's *quality* and *state*.

## 3. Proposed Solutions

### 3.1. The Unified Front Door: `gpd init`
**The Problem:** Users shouldn't have to decide between initializing a new paper and importing an old one. It is all just "starting."
**The Solution:** Merge `gpd import` into `gpd init` using a unified `--source` flag.
*   **Command:** `gpd init --slug <name> [--source <path>]`
*   **Behavior:**
    *   If no `--source` is provided: Creates an empty `.paper/` structure (Blank Slate).
    *   If `--source` is a single text/audio file (e.g., `notes.txt`): Copies it to `original/` as an "Intake" brain-dump.
    *   If `--source` is a directory: Executes the current legacy `import` logic (copying, ranking drafts, creating `IMPORT.md`).
*   **Impact:** Deletes a CLI command. One front door for all paper creation.

### 3.2. The Omni-Grill (`/gpd-grill` Consolidation)
**The Problem:** The user is forced to run `/gpd-persona`, `/gpd-audience`, `/gpd-grill`, and `/gpd-brief` sequentially.
**The Solution:** Delete the separate setup commands. Make `/gpd-grill` the single, intelligent entry point in the harness.
*   **Behavior:** When the user types `/gpd-grill` (or `/gpd-start`), the agent executes a silent cascade:
    1.  **Context Check:** If `PERSONA.md` or `AUDIENCE.md` are missing, it infers them from harness memory or asks exactly *one* orienting question.
    2.  **Intake Parsing:** It reads `original/` (whether a single notes file or an `IMPORT.md` manifest).
    3.  **Silent Generation:** It silently drafts `.paper/PAPER-CONTEXT.md`, `.paper/DECISIONS.md`, and `.paper/BRIEF.md`.
    4.  **Strategy Evaluation:** It evaluates the brief and writes `.paper/STRATEGY.md`.
*   **The Adversarial Output:** The agent's first message to the user is NOT confirmation of file creation. It is a brutal critique of the premise based on the newly generated strategy.

### 3.3. Creative Escrow (`/gpd-draft --force`)
**The Problem:** The strategy gate (`No-Go`) blocks drafting, which violates how humans use writing to discover their thoughts.
**The Solution:** Make the requirement "less dumb." Slop cannot be exported, but it can be drafted.
*   **Behavior:** If `STRATEGY.md` is `No-Go` or `Revise Before Drafting`, the user can append `--force` to `/gpd-draft`.
*   **Consequence:** The draft is generated but watermarked as `UNVERIFIED`. The `STATE.json` enforces a hard block on `/gpd-fact-check`, `/gpd-review`, and `/gpd-export` until the `STRATEGY.md` gate is passed.

### 3.4. The Brutally Honest TUI (State & Quality Transparency)
**The Problem:** Hiding the plumbing (collapsing the commands into Omni-Grill) risks confusing the user about what actually happened. The CLI must compensate with extreme clarity.
**The Solution:** Upgrade `gpd status` and `gpd next` to act as a brutally honest dashboard.
*   **Design Principles:**
    *   **Where are we?** Clear visual indicator of the current pipeline stage (Clarify -> Support -> Shape -> Draft -> Check -> Export).
    *   **What was done?** "Omni-Grill generated Brief and evaluated Strategy."
    *   **Quality Assessment:** Explicitly surface the `STRATEGY.md` blockers or `FACT-CHECK.md` warnings in red text. Do not bury them in JSON.
    *   **Brutal Honesty:** If the strategy is weak, the CLI says: *"Strategy is blocked. Thesis is undefined. Your premise lacks a quantifiable warrant."*
    *   **Next Action:** Explicit, single-action instruction. *"Action: Return to harness. Defend your timeline warrant with the agent."*

## 4. Drawbacks
*   The "Omni-Grill" requires a very complex, multi-step system prompt for the LLM to successfully read notes, generate 4 distinct artifacts, and output an adversarial critique in a single turn. It may stress the limits of current model context windows and instruction following.
*   Merging `import` into `init` requires careful handling of CLI flags to ensure the legacy folder recovery logic doesn't trigger accidentally on a single file intake.

## 5. Next Steps
*   Deprecate `gpd import` and refactor `bin/lib/init.js` and `bin/lib/import.js` into a unified `gpd init --source` flow.
*   Rewrite the `/gpd-grill` system prompt to handle the silent artifact cascade and adversarial opening.
*   Implement the `--force` flag logic in the drafter agent and the `STATE.json` validation logic.
*   Design the new TUI output format for `gpd status`.

## 6. Implementation Recommendation

**Readiness:** not ready for implementation as written. Treat this RFC as UX pressure, not an approved design.

### Usability and quality direction

The user should not need to memorize a long setup sequence. A single start path and clearer `gpd status` / `gpd next` output are valuable. But the current `persona -> audience -> grill -> brief` sequence is also defensive structure, not just friction. It prevents a polished draft from moving in the wrong direction.

Recommended changes:

- Keep lower-level commands as escape hatches. Do not delete `/gpd-persona`, `/gpd-audience`, `/gpd-grill`, or `/gpd-brief`.
- Make `gpd init --source` the documented front door, with `gpd import` retained as a deprecated alias during transition.
- Do not silently generate `PAPER-CONTEXT.md`, `DECISIONS.md`, `BRIEF.md`, and `STRATEGY.md` in one opaque turn. Show the extracted thesis, audience, ambiguity, and strategy result before advancing.
- Replace "exactly one orienting question" with adaptive questioning.
- If blocked drafting is allowed, write a quarantined exploratory artifact, not normal `DRAFT.md`.
- Keep TUI language direct, not theatrical. Show what is blocked, why, which artifact caused it, and the single next action.

### Measurement gate

Any guided-start or Omni-Grill variant should be measured against the current four-gate baseline before shipping.

Minimum validation:

- same fixture through four-gate flow and guided flow
- scored with the RFC-007 evaluation harness when available
- non-inferiority criterion before replacing or hiding the current gates

If guided start produces equal quality with lower cognitive load, ship it. If not, the gates earned their friction.

### Diagnostic mechanism

Status diagnostics should come from validators or structured state, not from freeform LLM-generated prose. The CLI should render findings consistently from `semantic.js`, `STATE.json`, or another deterministic diagnostic source.

### Issue mapping

| Issue | Merge this RFC's delta |
|---|---|
| #16 | Unified start path, import alias transition, onboarding simplification |
| #26 | Status/next UX, validator-sourced diagnostics, single next action |
| #25 | Guard against collapsing brief acceptance into a silent guided flow |
| #37 | Workflow simulation for any guided-start cascade |
| #32 | Measurement precondition for guided-start non-inferiority |

### Recommendation

Do not create a new feature request yet. Merge the near-term UX pieces into #16 and #26 after RFC-013.x is refined. Hold full Omni-Grill until RFC-007 can measure whether it preserves quality.
