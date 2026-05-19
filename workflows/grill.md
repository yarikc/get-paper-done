<purpose>
Stress-test a paper idea, imported draft, or later ambiguity before brief/research/outline work continues. Resolve ambiguous thesis, audience, terminology, decision intent, proof standard, and narrative direction while writing durable paper context and paper decision records.
</purpose>

<required_reading>
- .paper/IMPORT.md if present
- .paper/PROJECT.md
- .paper/PERSONA.md
- .paper/AUDIENCE.md
- .paper/BRIEF.md
- .paper/STRATEGY.md
- .paper/PAPER-CONTEXT.md if present
- .paper/DECISIONS.md if present
- contexts/*.md if present
- templates/paper-context.md
- templates/decisions.md
</required_reading>

<process>

## 1. Read Existing Context

Read the paper artifacts listed above. If this is an imported paper, inspect `.paper/IMPORT.md` and the canonical `.paper/DRAFT.md` only enough to identify:

- apparent thesis
- target reader
- paper job
- desired reader action or belief shift
- repeated terms
- contradictions
- hidden assumptions
- decisions already made by the imported draft

Do not compress the imported draft into a new brief. The purpose of this workflow is to challenge the apparent brief before accepting it.

`/gpd-grill` is both:

- the mandatory first gate before `/gpd-brief`
- a re-entry workflow when the author wants to brainstorm again, or when an agent detects unresolved ambiguity later

If `STATE.json.grill.status` is already `Complete`, do not reset it automatically. Treat the session as a targeted re-grill unless the new ambiguity invalidates one of the required decision keys.

If the new ambiguity changes the thesis, primary reader, belief shift, narrative spine, key terms, scope, proof standard, counterargument, or non-goals, set `STATE.json.grill.status` back to `In Progress` while resolving it. After confirmation, set it back to `Complete`, update `PAPER-CONTEXT.md` / `DECISIONS.md`, and set the suggested next command to `/gpd-brief` so the formal brief absorbs the clarified context.

If reusable context packs exist under `contexts/`, use them carefully:

- candidate packs may inform terminology, proof standards, and prior decisions across papers
- do not apply a reusable context silently; summarize why it seems relevant and ask before using it
- do not promote paper-specific context into `contexts/` unless the user explicitly approves
- sanitize reusable context so it contains no private names, company names, titles, local paths, or sensitive source material

## 2. Grill One Branch At A Time

Ask one question at a time and wait for the answer before continuing. For each question:

- state the ambiguity or risk plainly
- provide your recommended answer
- explain what downstream artifact changes if the user agrees
- record the resolved term or decision immediately after the answer

Do not ask questions whose answers can be found in existing artifacts. Inspect the artifacts instead.

If this is a later re-grill, narrow the interrogation to the unresolved branch first. Do not re-ask already resolved decisions unless the new answer contradicts them.

## 3. Required Grill Areas

Cover these areas before marking the grill complete:

- **Paper job:** What is this paper trying to do: decide, persuade, explain, update, provoke, or frame?
- **Reader:** Who must be convinced first, and who can be treated as a secondary objection profile?
- **Decision or belief shift:** What should the reader approve, believe, fund, stop doing, start doing, or remember?
- **Thesis:** What is the strongest one-sentence thesis? What would make it false?
- **Narrative spine:** What story must the reader follow before the recommendation feels earned?
- **Terms:** Which words are overloaded, vague, or used inconsistently?
- **Evidence burden:** Which claims require sources, which are strategic synthesis, and which should be dropped?
- **Counterargument:** What is the strongest fair opposing view?
- **Scope boundary:** What belongs in this paper, what belongs in a companion artifact, and what should be cut?
- **Non-goals:** What should this paper explicitly not try to solve?
- **Decision records:** Which choices would be hard to reconstruct later if not written down?

For imported papers, add:

- What did the original draft appear to optimize for?
- What should survive unchanged?
- What should be demoted, reframed, or cut?
- What context did the original draft assume that a new reader may not have?
- What missing author intent must be recovered before brief/research/outline?

## 4. Challenge Against Paper Context

When the user uses a term that conflicts with `.paper/PAPER-CONTEXT.md`, call it out immediately:

> `.paper/PAPER-CONTEXT.md` defines "architecture" as X, but this answer seems to use it as Y. Which meaning should be canonical?

When the user uses vague or overloaded language, propose a precise canonical term:

> You are saying "world model." Do you mean organizational knowledge base, current-state memory, business operating context, or agent-usable context layer?

When relationships are unclear, test them with scenarios:

> If the paper is for engineering leaders but the ask changes risk/governance behavior, does the risk reader need to be a primary audience or an objection profile?

## 5. Update PAPER-CONTEXT.md Inline

Create `.paper/PAPER-CONTEXT.md` lazily when the first term is resolved.

Use `templates/paper-context.md`.

`PAPER-CONTEXT.md` is a glossary and language contract for the paper. It is not a brief, outline, scratchpad, research note, or spec.

Include:

- canonical terms
- terms to avoid
- relationships between concepts
- example reader/author dialogue when useful
- flagged ambiguities and their resolution

Only include terms specific to this paper's argument. Do not add general writing concepts.

## 6. Update DECISIONS.md Sparingly

Create `.paper/DECISIONS.md` lazily when the first paper decision is worth recording.

Use `templates/decisions.md`.

Create a Paper Decision Record only when all three are true:

1. **Hard to reverse:** changing it later would force meaningful research, outline, draft, or audience rework.
2. **Surprising without context:** a future reader would wonder why the paper went this direction.
3. **Real trade-off:** there were credible alternatives and the author chose one for a reason.

Examples that usually qualify:

- choosing `strategy_paper` instead of `decision_memo`
- choosing a primary reader and demoting another audience
- deciding that a concept belongs in this paper instead of a companion artifact
- deciding what the central thesis is and what competing thesis was rejected
- deciding how to use a controversial or imperfect source
- deciding a claim should be treated as strategic synthesis rather than sourced fact

Examples that usually do not qualify:

- obvious copy edits
- simple title changes
- facts that belong in `RESEARCH.json`
- feedback items that belong in `FEEDBACK-READER.md`

## 7. Completion Criteria

Before ending:

- summarize resolved thesis, reader, decision/belief shift, and narrative spine
- list unresolved questions that block `/gpd-brief`
- verify that every required decision key is resolved:
  - `paper_job`
  - `primary_reader`
  - `belief_shift`
  - `thesis`
  - `narrative_spine`
  - `key_terms`
  - `scope_boundary`
  - `proof_standard`
  - `strongest_counterargument`
  - `non_goals`
- update `.paper/STATE.md` and `.paper/STATE.json`
- recommend `/gpd-brief` only when the grill has resolved enough ambiguity to write a real brief

Set `.paper/STATE.json` `grill.status` to:

- `Not Started` before grilling begins
- `In Progress` while any required decision key is unresolved
- `Complete` only after the user confirms the shared understanding and all required decision keys are present in `grill.resolved_decisions`

Use `grill.completion_basis` to summarize the confirmation, such as `user confirmed resolved paper job, reader, thesis, terms, proof standard, counterargument, scope, and non-goals`.

If major ambiguity remains, set suggested next command to `/gpd-grill`, not `/gpd-brief`.

Do not write `BRIEF.md`, `STRATEGY.md`, `RESEARCH.json`, `OUTLINE.md`, or `DRAFT.md` in this workflow. `/gpd-grill` creates the shared understanding; `/gpd-brief` turns it into the formal paper contract.

If this was a later re-grill after `BRIEF.md` already existed, update `.paper/STATE.json` `suggested_next_command` to `/gpd-brief`. The brief must be refreshed before research, outline, draft, fact-check, review, revise, or export continues.

</process>
