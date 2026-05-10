# Paper Spec Template

This template is designed for strategy papers, position papers, research notes, and blog drafts that need a strong argument, clear audience fit, and a consistent author voice. It is optimized for a structured, concise, and executive-ready writing style, with a reusable author profile block that captures personality, tone, expectations, and working preferences.

## How to use this template

Complete Sections 1 through 4 before drafting prose. Use Sections 5 through 8 to guide drafting, review, and revisions. Keep the profile block stable across documents and only adjust it when the public persona, audience, or publication context changes.

---

## 0. Reusable author profile

Use this section as a persistent context block for AI or human collaborators. It defines how the document should sound, what it should optimize for, and how trade-offs should be handled in both argument and prose.

### Identity

- Name: Yarik Chinskiy
- Role: Senior technology executive focused on data, AI, and enterprise architecture; incoming Head of Data and AI Architecture at TD Bank; previously Head of Data and AI Architecture at JPMorganChase
- Core domains: Enterprise data platforms, AI/ML systems, metadata and governance, platform architecture, operating models for engineering organizations, platform engineering.
- Default stance: Pragmatic, strategic, architecture-led, skeptical of hype, focused on systems that work at enterprise scale.

### Personality and working style

- High-energy, idea-driven, and strongly oriented toward strategic vision and pattern recognition.
- Naturally drawn to big-picture framing, transformation themes, and connections across technology, operating model, and talent.
- Values strong networks, credibility, and personal brand, but prefers authenticity over self-promotion.
- Prefers clarity, momentum, and practical usefulness over excessive ceremony or academic hedging.

### Tone and voice

- Sound direct, concise, intellectually serious, and practical.
- Be approachable, not boastful; confident, not inflated.
- Favor strong declarative sentences over soft corporate filler.
- Avoid unnecessary politeness, generic enthusiasm, marketing language, or consulting jargon.
- Write like an operator-architect explaining what matters, why it matters, and what should happen next.

### Expectations for content

- Optimize for insight density and decision usefulness.
- Prefer structured narrative over loose brainstorming.
- Make trade-offs explicit: cost, complexity, organizational impact, execution risk, and time-to-value.
- Ground arguments in mechanisms, examples, and operating realities, not slogans.
- Where possible, connect technology choices to organizational design, platform leverage, and business outcomes.

### What to avoid

- Resume-style self-description unless explicitly requested.
- Excessive self-congratulation, inflated thought-leadership language, or visionary clichés.
- Long introductions that delay the thesis.
- Purely abstract writing with no problem definition, implementation path, no examples, and no implications for operators.

### Default output preferences

- Have executive brief.
- Start with a strong thesis or problem statement.
- Use clear section headings.
- Keep paragraphs tight.
- Use bullets for claims, decisions, trade-offs, and recommendations.
- End sections with implications, not filler summaries.

### Optional short profile prompt

Use the block below when pasting context into an AI tool:

> Write in the voice of a senior data and AI architecture executive. The author is strategic, direct, pragmatic, and highly technical. The tone should be concise, confident, and approachable, without boasting or corporate fluff. Emphasize enterprise reality, scale / reliability / security required in regulated industry, operating model implications, decision trade-offs, and architecture as a lever for transformation. Prefer clear theses, explicit claims, and useful structure over polished but empty prose.

---

## 1. Document intent

- Working title:
- Document type: position paper / internal strategy memo / research note / blog / LinkedIn article
- Target audience:
- Why this audience should care:
- Desired outcome after reading:
- Decision or belief this document should influence:

### Prompting questions

- Who is the primary reader?
- What problem or debate is this document entering?
- What should the reader do, fund, approve, rethink, or discuss after reading?

---

## 2. Thesis and position

- Core thesis in one sentence:
- Alternative title options:
- Strongest opposing view in one sentence:
- Why this position matters now:
- Scope boundaries; what this document is not covering:

### Thesis formula

Use this structure if useful:

> This paper argues that **[claim]** because **[reason 1]**, **[reason 2]**, and **[reason 3]**; this matters because **[business, organizational, or strategic consequence]**.

---

## 3. Claims deck

Interview me to create a list 3 to 5 major claims. Each claim should be arguable and specific.

### Claim

- Claim:
- Why it is true:
- What evidence supports it:
- Likely objection:
- Response to objection:
- Implication if accepted:

---

## 4. Evidence inventory

Capture the raw material before drafting. In GPD, research happens through `/gpd-research` after the strategy gate. The default depth is `standard`; use `deep` only for high-stakes, publication-bound, technical, regulatory, or strategy-heavy papers where broader source coverage and explicit uncertainty handling are worth the extra context cost.

Store paper-specific reference material in `.paper/sources/` or preserve imported material in `original/`, then compress usable research into `.paper/RESEARCH.json` and a short `.paper/RESEARCH.md` index. Always capture both supporting and opposing evidence.

| Evidence item | Type | Supports which claim | Strength | Notes |
|---|---|---|---|---|
| Example: Internal platform metric | Internal data | Claim 1 | High | Use anonymized wording |
| Example: Research paper | External source | Claim 2 | Medium | Good conceptual support |
| Example: Executive anecdote | Experience | Claim 3 | Medium | Useful for framing, not proof |

### Evidence rules

- Separate strong evidence from illustrative evidence.
- Mark any claim that lacks hard support.
- Do not let a paragraph carry more certainty than the evidence justifies.
- Justification may be based on trend analysis and extrapolation. This will be more common for topics that focus on innovation or predicting the next trend cycle.

---

## 5. Narrative structure

### Reader journey

- What the reader believes at the start:
- What tension or gap the paper introduces:
- What new frame the paper offers:
- What the reader should believe at the end:

### Section outline

1. Opening: hook, problem, and thesis.
2. Context: why the issue matters now.
3. Core argument: claims and supporting evidence.
4. Counterarguments and trade-offs.
5. Recommendations, implications, or next steps.

### Opening guidance

The first paragraph should do one or more of the following:

- Identify a strategic mismatch.
- Identify a strategic trend or shift
- Surface a hidden cost, architectural constraint, or friction that impacts engineering or delivery flow
- Challenge a default assumption.
- Reframe the problem in more useful terms.

Avoid broad generic openings.

---

## 6. Drafting constraints

- Desired length:
- Desired tone: executive / technical / analytical / provocative / educational
- Publication venue:
- Citation requirements:
- Confidentiality constraints:
- Words or phrases to avoid:
- Must-include concepts or examples:
- Must-not-omit risks or caveats:

### House style defaults

- Prefer short, clear sentences.
- Prefer active voice.
- Use concrete nouns over abstractions where possible.
- Use one strong idea per paragraph.
- Keep claims visible and easy to scan.

---

## 7. Review checklist

Use this before considering a draft done.

### Argument quality

- Is the thesis explicit in the first 1 to 3 paragraphs?
- Are the key claims specific rather than generic?
- Are trade-offs and objections addressed fairly?
- Does the paper explain mechanism, not just recommendation?
- Does each section earn its place?
- Can the reader understand it even if they are not a technology expert or up to date on all the evidence and specialized language used in the paper?
- Avoid using acronyms without explaining them unless they are common industry terms.

### Voice quality

- Does it sound direct and credible rather than inflated?
- Does it avoid corporate filler and generic AI hype?
- Does it sound like an experienced operator with architectural and engineering depth?

### Usefulness

- Would a senior stakeholder know what to do with this?
- Would a technical reader respect the reasoning?
- Does the paper connect technology to organizational or business implications?

---

## 8. AI workflow block

Use this section when collaborating with an AI assistant.

### Step 1: Spec review prompt

> Review this paper spec for argument quality. Identify weak claims, missing evidence, hidden assumptions, vague language, and likely objections from a skeptical senior technical audience. Do not draft the paper yet.

### Step 2: Outline prompt

> Create a section-by-section outline from this spec. For each section, state its objective, the key claim it advances, and the evidence it should use. Keep the outline tight and non-redundant.

### Step 3: Draft prompt

> Draft the paper using the spec and author profile. Keep the tone direct, pragmatic, and executive-ready. Avoid hype, puffery, and vague abstractions. Make trade-offs explicit and connect technical recommendations to operating model and business outcomes.

### Step 4: Critique prompt

> Critique this draft like a skeptical CTO, chief architect, or senior platform leader. Identify where the reasoning is weak, where the prose gets generic, where the evidence is thin, and where the document fails to create decision clarity. Do research to identify assumptions vs facts.

### Step 5: Rewrite prompt

> Rewrite the draft to increase clarity, argument strength, and executive usefulness while preserving the core thesis. Make it more concise, more concrete, and more credible.

---

## 9. Variants by format

### Internal strategy or position paper

Emphasize decision rights, platform implications, organizational design, execution risk, and phased roadmap. Use an Amazon-style narrative where useful: problem, context, proposal, alternatives considered, risks, and FAQ.

### Research note or analytical memo

Emphasize claim precision, evidence quality, competing interpretations, and explicit limits of confidence. Separate empirical observations from opinion.

### Blog or LinkedIn draft

Keep the thesis sharp and reduce institutional language. Use examples, concrete insights, and one memorable framing device, but preserve the same intellectual seriousness and anti-hype stance.

---

## 10. One-page fast version

Use this abbreviated version when speed matters.

- Audience:
- Problem:
- Thesis:
- Three claims:
- Best evidence:
- Main counterargument:
- Recommendation:
- Tone notes:
- What to avoid:
- Draft length:

---

## 11. Example starter block

Below is a filled mini-example showing the level of specificity expected.

- Working title: Metadata as a Product Surface, Not a Back-Office Function
- Audience: CIO, platform engineering leadership, senior architects
- Thesis: Enterprise data platforms should treat metadata capabilities as a product surface because discoverability, governance, lineage, and AI readiness all depend on it; this matters because weak metadata architecture slows platform adoption and fragments trust.
- Claim 1: Metadata is not secondary infrastructure; it shapes how users discover and trust the platform.
- Claim 2: Centralized metadata control creates scale bottlenecks in large enterprises.
- Claim 3: A federated operating model with shared standards creates better speed-control balance than a centrally operated metadata function.
- Tone: Direct, strategic, no hype, no vendor language.
- Desired outcome: Leadership aligns on metadata as a strategic platform capability and funds roadmap changes.
