<purpose>
Create an argument-aware outline for the paper.
</purpose>

<required_reading>
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/BRIEF.md
- .paper/STRATEGY.md if present
- .paper/RESEARCH.json if present
- .paper/RESEARCH.md if present
- templates/outline.md
</required_reading>

<process>

Read persona, audience, brief, strategy, and research. If `.paper/STRATEGY.md` exists and its status is `Revise Before Drafting` or `No-Go`, stop before outlining unless the user explicitly says to override the strategy block. Recommend `/gpd-brief` to revise the strategic core and cite the primary blocker from `Strategy Blockers` when present.

If `.paper/STRATEGY.md` is missing:

- For serious, researched, executive, technical, multi-audience, publishable, high-stakes, or 1,200+ word papers, stop and recommend `/gpd-brief` or strategy review before outlining unless the user explicitly overrides.
- For Lite mode, short pieces under about 1,200 words, or messy import triage, proceed only as `Provisional outline` and state that the structure may change after strategy review.

Prefer `RESEARCH.json` when present; use `RESEARCH.md` only as a summary/index. If both research artifacts are missing, proceed only if the brief does not require sourced claims.

Default to `outline_only`. If the user requests `outline_plus_skeleton`, skeleton mode, or a drafting scaffold, include a light skeleton draft after the outline. The skeleton must use headings, topic sentences, support bullets, evidence placeholders, objection placeholders, and transition notes only; it must not become polished prose.

Depth mode affects the produced sections:

- Lite produces the core outline only. Use it for early shaping, short pieces under about 1,200 words, or first-pass triage of messy imported drafts.
- Deep produces the core outline plus `Deep Mode Additions`. Use it by default when `RESEARCH.json` or `.paper/STRATEGY.md` exists, for executive/technical/multi-audience/publishable papers, for pieces about 1,200 words or longer, or when stakes are high.

Create `.paper/OUTLINE.md` with:

- mode: Lite or Deep, plus `outline_only` or `outline_plus_skeleton`
- structure verdict
- reader journey with starting belief, target belief, and core shift
- section architecture with reader-state transitions
- opening strategy
- thesis placement
- section sequence
- evidence per section
- evidence strength per major claim
- reader questions mapped to sections
- audience concern addressed per section
- objection placement
- approximate length per section
- transition to next section
- close
- cut list
- skeleton draft only when requested

In Deep mode only, add:

- structure-selection rubric: paper job x audience priority x target length -> recommended pattern
- draft readiness scorecard
- structural anti-patterns with HIGH/MEDIUM/LOW severity tied to the selected audience and the author's anti-fluff profile
- reader jump analysis
- evidence / objection load check

Reader-state cells must name a specific belief, doubt, or decision question. Bare role descriptions such as "CxO reader" or "technical audience" are invalid unless they include what that reader believes, doubts, or needs to decide.

The outline should make the argument easy to inspect before prose is drafted.

Update `.paper/STATE.md` and `.paper/STATE.json` with suggested next command: `/gpd-draft`.

</process>
