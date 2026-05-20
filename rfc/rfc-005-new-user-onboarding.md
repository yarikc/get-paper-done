# RFC: New User Onboarding for Get Paper Done

## Status
Draft

## Tracking Issue
[#16](https://github.com/yarikc/get-paper-done/issues/16)

## Author
Perplexity

## Date
2026-05-13

## Summary
Get Paper Done (GPD) is already a strong system for writing serious papers, but it is still easiest to understand if someone reads the whole README and infers the operating model from many sections.[page:272] This RFC proposes a newcomer-first onboarding layer that explains what makes GPD different, when to use it, how author profile and audience work, and the shortest path to producing a first paper.[page:272]

The goal is not to change the core workflow. The goal is to make the existing system legible and usable for a new user in the first 10 to 20 minutes.[page:272]

## Problem
A new user currently encounters a powerful but dense system: CLI commands, slash commands, many artifacts, a stateful workflow, strategy gates, classification, validation, reusable profiles, and reusable audiences.[page:272] All of that is coherent, but a newcomer can still struggle with three practical questions: what GPD is actually for, what makes it different from ordinary AI writing, and what exact steps they should take first.[page:272]

This creates a risk that a strong product feels harder than it is. GPD is opinionated in a useful way, but the initial learning curve is still higher than it needs to be.[page:272]

## Goals
- Explain what GPD is in plain language.[page:272]
- Show what differentiates GPD from normal chat-based AI writing.[page:272]
- Teach the minimum viable workflow for a first paper.[page:272]
- Clearly explain how to set or reuse a profile in `PERSONA.md`.[page:272]
- Clearly explain how to select or refine an audience in `AUDIENCE.md`.[page:272]
- Keep the first-run path short while preserving the real workflow model.[page:272]

## Non-Goals
- Redesign the artifact model.[page:272]
- Remove strategy gates or validation.[page:272]
- Replace the full README or design spec.[page:272]
- Hide advanced capabilities from power users.[page:272]

## Why GPD Is Different
GPD is not a single prompt and not a long chat that tries to hold everything in memory. It turns each paper into a small file-based project, with separate artifacts for project identity, author voice, audience, brief, strategy, research, outline, draft, review, fact-check, and state.[page:272]

That gives GPD four practical advantages over ordinary AI writing workflows:[page:272]

1. **Author voice is explicit.** The paper does not inherit a generic AI tone because voice and posture are stored in `PERSONA.md`.[page:272]
2. **Audience is explicit.** The system does not guess who the reader is; reader priorities, objections, and proof standard live in `AUDIENCE.md`.[page:272]
3. **Strategy comes before prose.** The workflow blocks weak paper ideas before they become polished but useless paragraphs through the strategy gate in `STRATEGY.md`.[page:272]
4. **Research and review are durable.** Evidence, objections, review findings, and revision decisions are stored in artifacts rather than buried in chat history.[page:272]

## Who It Is For
GPD is best for serious, structured writing where the paper has a real job: decision memos, strategy papers, explainers, executive updates, architecture papers, newsletters, blog posts, and white papers.[page:272] It is especially useful when audience, evidence quality, factual precision, and revision discipline matter.[page:272]

It is not optimized for tiny one-off writing tasks such as quick emails, ad hoc Slack messages, or purely freeform journaling.[page:272]

## Mental Model
A newcomer should learn GPD through one simple model:

- The **CLI** creates, validates, imports, exports, and inspects paper workspaces.[page:272]
- The **slash commands** run the writing workflow inside Claude or Codex.[page:272]
- The **`.paper/` folder** is the durable memory of the paper.[page:272]
- **`gpd status`** and **`/gpd-progress`** tell the user what to do next.[page:272]

The normal flow is:

`create or import -> brief -> strategy gate -> research -> outline -> draft -> fact-check -> review -> revise -> export` [page:272]

A new user does not need to memorize every artifact. They need to understand that each step writes one durable artifact and moves the paper forward.[page:272]

## Newcomer Quick Start
The onboarding flow should present this exact first-run path:[page:272]

1. Install the local CLI once:
   - `npm link`
2. Install runtime assets:
   - `gpd install claude`
   - `gpd install codex`
3. Create a paper:
   - `gpd init --location ~/papers --slug my-first-paper --title "My First Paper"`
4. Change into the paper directory and inspect status:
   - `cd ~/papers/my-first-paper`
   - `gpd status`
5. Open Claude or Codex in that folder and run:
   - `/gpd-brief`
   - `/gpd-research`
   - `/gpd-outline --lite` for a short or early paper, or `/gpd-outline --deep` for a serious one.[page:272]
   - `/gpd-draft --next-section`
   - `/gpd-fact-check --full`
   - `/gpd-review`
   - `/gpd-revise`
   - `/gpd-export`

This path should appear in a dedicated “Start Here” document and near the top of the README.[page:272]

## How Profile Works
A newcomer should be told plainly that **profile means author voice and posture**, not biography.[page:272]

In GPD, paper-specific author behavior lives in `.paper/PERSONA.md`, and reusable profiles can live in the repo `profiles/` folder.[page:272] The README already points to `profiles/head-data-ai-architecture.md` as a starter profile for regulated financial-services and enterprise technology writing.[page:272]

The onboarding explanation should say:

- Use a reusable profile if one already matches your role or writing style.[page:272]
- Use `/gpd-persona` to create or update the paper-specific persona.[page:272]
- Keep profile focused on voice, authority posture, tone boundaries, default assumptions, and what to avoid.[page:272]
- Do not overload `PERSONA.md` with resume-like history that does not affect how the paper should sound or argue.[page:272]

A newcomer-friendly example should look like this:

```md
# Persona

## Role
Senior enterprise architect writing for executive and technical readers.

## Voice
Direct, structured, plain English, low jargon unless needed.

## Tone boundaries
Do not sound boastful, vague, or hype-driven.

## Default posture
Lead with thesis, show trade-offs, make the decision ask explicit.
```

That is enough to make the concept concrete without overwhelming the user.

## How Audience Works
A newcomer should also be told that **audience is not generic target market language**. In GPD, audience means the specific readers, their priority order, likely objections, and proof expectations, stored in `.paper/AUDIENCE.md`.[page:272]

Reusable audience personas live in `audiences/`, including `cxo-reader`, `distinguished-architect-engineer`, `business-operating-executive`, and `public-technical-reader`.[page:272] The workflow does not blindly copy those personas; it summarizes them, suggests adjustments, and asks before writing paper-specific `AUDIENCE.md`.[page:272]

The onboarding guidance should say:

- Start with one primary audience.[page:272]
- Add secondary audiences only if necessary.[page:272]
- Use `/gpd-audience` to create or update the paper-specific audience.[page:272]
- Use `/gpd-curate-audience` when you want to build or refine reusable audience personas.[page:272]
- Capture what this audience needs to believe, what they are skeptical of, and what level of proof they need.[page:272]

A simple newcomer example:

```md
# Audience

## Primary reader
CIO or CTO evaluating platform direction.

## What they care about
Business impact, delivery risk, migration cost, decision clarity.

## Likely objections
Too expensive, too disruptive, unclear migration path.

## Proof standard
Needs concrete examples, bounded claims, and clear trade-offs.
```

## Recommended New Document
This RFC recommends adding a newcomer-first doc, for example:

- `docs/START-HERE.md`

It should contain five sections only:

1. What GPD is.
2. Why it is different.
3. Quick start in 10 minutes.
4. How to set profile and audience.
5. What command to run next when stuck (`gpd status` / `/gpd-progress`).[page:272]

## Recommended README Changes
The README is already strong, but it should expose onboarding more directly.[page:272] The following changes are recommended:

### 1. Add a newcomer block near the top
Right below the opening description, add:

- Best for: serious papers, memos, explainers, strategy docs.[page:272]
- Not for: casual short-form writing.[page:272]
- Start here: install, init, brief, research, outline, draft.[page:272]

### 2. Add a “What makes GPD different” section near the top
Use the four differentiators from this RFC: explicit persona, explicit audience, strategy gate, durable artifacts.[page:272]

### 3. Add a short “Profile and Audience” section earlier
Today that information is present, but it appears later in the README.[page:272] Bringing it forward would help new users understand that profile and audience are central, not optional extras.[page:272]

### 4. Add one tiny first-paper walkthrough
A 10-minute example should show:

- create paper,
- set persona,
- set audience,
- run brief,
- run outline,
- run draft.[page:272]

This should be intentionally smaller than the full workflow reference.[page:272]

## Suggested First-Paper Walkthrough
The onboarding doc should include a concrete sequence like this:[page:272]

### Create the workspace
```bash
npm link
gpd install claude
gpd init --location ~/papers --slug cloud-memo --title "Cloud Memo"
cd ~/papers/cloud-memo
gpd status
```

### Set author voice
Inside Claude or Codex:

```text
/gpd-persona
```

Use it to define:
- who the author is,
- how the paper should sound,
- what tone to avoid,
- what level of confidence or evidence is appropriate.[page:272]

### Set the audience
```text
/gpd-audience
```

Use it to define:
- who will read the paper,
- what they care about,
- what they will challenge,
- how much proof they need.[page:272]

### Build the paper
```text
/gpd-brief
/gpd-research
/gpd-outline --lite
/gpd-draft --next-section
```

### Check and finish
```text
/gpd-fact-check --full
/gpd-review
/gpd-revise
/gpd-export
```

If stuck at any point, run:

```bash
gpd status
```

or inside the runtime:

```text
/gpd-progress
```

## Success Criteria
This RFC is successful if a newcomer can do the following without reading the entire README first:[page:272]

- explain in one minute what makes GPD different from ordinary AI writing,[page:272]
- create a paper workspace,[page:272]
- set a paper-specific profile,[page:272]
- set a paper-specific audience,[page:272]
- run the first few commands in the right order,[page:272]
- and recover when confused by using `gpd status` or `/gpd-progress`.[page:272]

## Recommendation
Adopt this RFC and add a dedicated newcomer-first onboarding layer without changing the core architecture.[page:272] GPD already has the right building blocks; the missing piece is a shorter path that teaches new users how to think about the system before they need to understand every artifact and every command.[page:272]
