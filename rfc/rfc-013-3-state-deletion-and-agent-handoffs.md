# RFC-013.3: State Deletion and Automated Agent Handoffs

**Status:** Proposed
**Author:** AI Orchestrator / User
**Created:** 2026-05-20

## 1. Objective
To finalize the execution of the 5-step UX teardown by eliminating redundant state management (Step 2: Delete) and enforcing strict momentum inside the conversational harness (Step 5: Automate).

## 2. Background
This RFC addresses the final two gaps identified in the teardown of the GPD user experience:
1.  **Redundant State:** The system currently maintains both a machine-readable `.paper/STATE.json` and a human-readable `.paper/STATE.md`. This violates the principle of a single source of truth and creates synchronization risks between the CLI and the LLM agents.
2.  **Loss of Momentum:** When an agent finishes a task (e.g., fact-checking or outlining), it often leaves the user guessing what command to run next, forcing context switching between the chat interface and the terminal.

## 3. Proposed Solutions

### 3.1. Deprecation and Deletion of `STATE.md`
**The Problem:** Managing state in two file formats simultaneously is fragile and unnecessary.
**The Solution:** Establish `.paper/STATE.json` as the sole, authoritative source of truth for the paper's state.
*   **Implementation:**
    *   Remove `STATE.md` from the `templates/` directory.
    *   Update all agent prompts and CLI commands to strictly read from and write to `STATE.json`.
    *   Rely entirely on the upgraded `gpd status` and `gpd next` commands (as defined in RFC-013.2) to render the JSON state into a human-readable, brutally honest TUI dashboard.
    *   During the `import` or `init` flow, if a legacy `STATE.md` is detected, the CLI will safely ignore or remove it.

### 3.2. Mandatory Agent Action Handoffs
**The Problem:** Users lose momentum when a conversational agent completes a task without providing an explicit, actionable next step.
**The Solution:** Enforce a universal termination rule for all GPD agent prompts.
*   **Implementation:**
    *   Update every system prompt (`paper-drafter`, `paper-editor`, `paper-fact-checker`, `paper-outliner`, `paper-strategist`, `audience-reviewer`, `opposition-reviewer`) with a strict output format rule.
    *   The rule mandates that the absolute final output of every agent response MUST be an explicit `[NEXT ACTION]` block.
    *   This block must contain the exact slash-command or CLI command the user should execute next, based on the outcome of the agent's run.
    *   **Example Output:**
        > *Fact-check complete. 2 high-risk claims lack sourcing.*
        > *[NEXT ACTION]: Resolve the missing sources with the agent, or run `/gpd-revise` to proceed with fixes.*

## 4. Drawbacks
*   Older tutorials, documentation, or existing example workspaces that reference `STATE.md` will need to be updated to prevent newcomer confusion.
*   Enforcing the `[NEXT ACTION]` format adds slight token overhead to every agent response and requires rigorous prompt engineering to ensure the LLM doesn't hallucinate invalid commands.

## 5. Next Steps
*   Execute a codebase-wide removal of `STATE.md` logic (specifically targeting `bin/lib/init.js`, templates, and agent prompts).
*   Append the `[NEXT ACTION]` directive to all files in the `agents/` and `workflows/` directories.

## 6. Implementation Recommendation

**Readiness:** not ready for direct implementation as written. Merge the handoff discipline into #42 and #26 after narrowing the mechanism.

### Usability and quality direction

The goal is correct: users should not have to infer the next command after an agent finishes. `STATE.json` should remain authoritative, and human-readable state should be rendered from it.

Recommended changes:

- Do not delete `STATE.md` in Phase 1. Treat it as a generated read-only view first.
- Keep handoffs short: current artifact, result, blocker if any, next command.
- Use allowed commands from `gpd next`; agents should not invent final commands.
- If the system cannot determine a next action, fall back to `gpd next`.

### Mechanical next-action model

Prompt-only `[NEXT ACTION]` rules are brittle. The preferred mechanism is:

1. agent or command updates structured state, such as `STATE.json.next_action_intent`
2. CLI derives the user-facing next action via `gpd next`
3. invalid or missing intent falls back to `gpd next`

The model should enforce next-action rendering outside freeform agent prose.

### STATE.md deprecation gradient

| Phase | STATE.md behavior |
|---|---|
| 0 | Authored alongside `STATE.json`; drift risk remains |
| 1 | Generated from `STATE.json` on every write; validator compares both |
| 2 | Generated read-only; warn if user edits it directly |
| 3 | Delete only after sustained clean Phase 2 usage |

### Issue mapping

| Issue | Merge this RFC's delta |
|---|---|
| #42 | `STATE.md` generated-view plan and structured `next_action_intent` |
| #26 | CLI-rendered next action and compact status output |
| #37 | Drift validation and workflow simulation for state migration |

### Recommendation

Do not create a new issue yet. Merge the narrowed mechanism into #42 and #26 when RFC-013.x is ready. Do not implement single-shot `STATE.md` deletion.
