<purpose>
Import an existing paper into Get Paper Done by preserving original material, copying related research/spec/version files into `original/`, and extracting only the minimal framework artifacts needed to continue in explicit context-separated stages.
</purpose>

<required_reading>
- references/writing-artifacts.md
- templates/project.md
- templates/persona.md
- templates/audience.md
- templates/brief.md
- templates/strategy.md
- templates/draft.md
- templates/import-report.md
- templates/state.md
- templates/config.json
</required_reading>

<process>

## 1. Parse Inputs

Parse flags:

- `--source <path>`: existing draft file or directory to import
- `--location <path>`: destination parent directory
- `--slug <name>`: destination paper directory name
- `--profile <name>`: reusable author profile to adapt into `.paper/PERSONA.md`

If `--source` is missing, ask for the source path.

Accept:

- a single draft file
- a folder containing drafts, specs, research, references, notes, PDFs, docs, markdown, text, or exports
- a folder with subdirectories such as `references/`, `research/`, `specs/`, `drafts/`, `versions/`, `archive/`, `diagrams/`, or similar

Resolve source path:

- expand `~`
- accept absolute paths
- accept paths relative to the current working directory

If source does not exist, stop and ask for a valid path.

## 2. Destination Setup

Ask for destination location unless `--location` is provided.

- Default suggestion: source parent directory
- Accept absolute or relative paths
- Expand `~`

Ask for paper directory name unless `--slug` is provided.

- Default suggestion: slugified source filename, source folder name, working title, or inferred paper title
- Use lowercase words separated by hyphens

Create:

```text
[location]/[paper-slug]/
[location]/[paper-slug]/original/
[location]/[paper-slug]/.paper/
[location]/[paper-slug]/.paper/sources/
[location]/[paper-slug]/.paper/exports/
```

All subsequent operations happen inside `[location]/[paper-slug]/`.

If destination exists and contains `.paper/`, stop and ask the user to choose another slug/location or confirm they want to import into an existing GPD project.

Do not overwrite existing files without asking.

## 3. Copy Original Material

Copy the source material into `original/` before analysis.

If source is a file:

- copy the file to `original/`
- scan the source file's parent directory for likely related material
- ask before copying related directories/files

If source is a directory:

- copy the directory contents into `original/`

Preserve relative paths.

Likely related material includes:

- current draft files: `*draft*`, `*working*`, `*paper*`, `*article*`, `*memo*`, `*brief*`
- specs: `*spec*`, `*requirements*`, `*prompt*`, `*plan*`
- outlines: `*outline*`, `*structure*`
- reviews: `*review*`, `*critique*`, `*feedback*`, `*opponent*`
- research: `*research*`, `*notes*`, `*evidence*`
- source directories: `references/`, `reference/`, `research/`, `sources/`, `source/`, `specs/`, `drafts/`, `versions/`, `archive/`, `diagrams/`, `assets/`
- common file types: `.md`, `.txt`, `.docx`, `.pdf`, `.csv`, `.xlsx`, `.png`, `.jpg`, `.jpeg`, `.svg`

Avoid copying:

- `.git/`
- `node_modules/`
- `.venv/`, `venv/`
- build output
- caches
- very large unrelated binaries unless the user confirms

Write an import manifest to `.paper/IMPORT.md` using `templates/import-report.md`.

## 4. Inventory And Classify Original Material

Inspect `original/` and classify imported files:

- primary draft candidate
- previous draft versions
- specs/prompts/plans
- research/source material
- review/feedback material
- diagrams/assets
- unclear material

If multiple current draft candidates exist, pick the most likely latest version using filename cues such as `latest`, highest version number, modified date if available, or explicit user confirmation.

If uncertain, ask the user which draft is canonical.

CLI import records every draft candidate in `.paper/IMPORT.md` with a deterministic score. Filename cues such as `latest`, `current`, `final`, `working`, version numbers, and `drafts/` location are positive signals. `old`, `previous`, `archive/`, and `versions/` are negative signals. Modified time is a tie-breaker, not the only selection rule. If more than one draft candidate exists, treat the selected draft as provisional until the user confirms it.

CLI import can derive `.paper/DRAFT.md` from selected Markdown, plain text, or `.docx` canonical drafts. `.docx` handling is plain paragraph text extraction only: preserve the original `.docx` under `original/`, do not import formatting/comments/tracked changes, and record the extraction source and limitation in `.paper/IMPORT.md`.

CLI import also detects likely source-reference candidates from Markdown, text, and `.docx` material: URLs, DOIs, named standards/source families, and lines labeled as sources or references. Record them in `.paper/IMPORT.md` as unverified triage candidates only. Do not create `RESEARCH.json` or treat the detected references as evidence during import.

## 5. Derive Minimal GPD Artifacts

From original material, infer and write:

- `.paper/PROJECT.md`
- `.paper/AUDIENCE.md`
- `.paper/BRIEF.md`
- `.paper/STRATEGY.md`
- `.paper/DRAFT.md`
- `.paper/config.json`
- `.paper/STATE.md`
- `.paper/STATE.json`

Do not generate `.paper/RESEARCH.json`, `.paper/RESEARCH.md`, `.paper/OUTLINE.md`, `.paper/FACT-CHECK.md`, or `.paper/REVIEW.md` during import. Import should preserve and classify, not do full research, outline, fact-check, or review work in the same context. It must create a lightweight `.paper/STRATEGY.md` gate from imported context so downstream work does not bypass strategy.

Persona handling:

- If `--profile <name>` is provided, read `profiles/<name>.md` and adapt it into `.paper/PERSONA.md`.
- If no profile is provided but reusable profiles exist, ask whether to import one.
- If no profile is selected, infer a paper-scoped persona from the draft and ask for missing voice constraints.

Audience handling:

- Infer likely audience from the imported material when possible.
- Present curated audience options plus a custom option:
  - CxO reader
  - Distinguished architect / engineer
  - Business or operating executive
  - Public technical reader
  - Create new custom audience
  - Hybrid / curated plus custom edits
- Let the user select one or multiple curated personas, create a new custom audience, or combine both.
- If curated personas are selected, summarize them, suggest paper-specific improvements, and ask before writing `.paper/AUDIENCE.md`.
- If multiple personas are selected, capture priority order and conflict rule.
- Do not proceed to draft/review recommendations unless `.paper/AUDIENCE.md` declares either selected curated personas or a custom audience.

Artifact derivation rules:

- `.paper/DRAFT.md`: should contain the current imported draft, converted to Markdown if possible. Preserve content; do not rewrite during import. For `.docx`, import only plain paragraph text and record that formatting, comments, and tracked changes were not imported.
- `.paper/BRIEF.md`: extract or infer classification, title, target audience, thesis, opposing view, likely claims, constraints, and known gaps. Mark uncertainty clearly.
- `.paper/STRATEGY.md`: run the strategy gate from imported context. Status must be `Go`, `Revise Before Drafting`, or `No-Go`. If thesis, reader promise, paper job, scope, or desired outcome is unclear, set status to `Revise Before Drafting` and populate `Strategy Blockers` with the normalized blocker list and primary blocker.
- `.paper/PROJECT.md`: state what this paper appears to be and what outcome it appears to seek. Keep it short; do not duplicate the full thesis, claims, or objections from `BRIEF.md`.
- `.paper/STATE.md` and `.paper/STATE.json`: set current position based on import quality and record post-import choices plus any suggested choice.
- `.paper/IMPORT.md`: record copied files, skipped files, canonical draft, classification, assumptions, and post-import options.

Do not silently invent missing information. Mark unknowns as open questions.

Use only normalized strategy blocker values: `none`, `scope_too_broad`, `thesis_weak`, `audience_unclear`, `audience_conflict`, `evidence_gap`, `weak_ask`, `poor_posture`, `missing_outcome`, `reader_promise_weak`, and `decision_usefulness_weak`.

Use only normalized unblock actions: `none`, `brief_revision`, `audience_revision`, `thesis_revision`, `scope_narrowing`, `research_plan`, and `user_override`.

If the imported source contains research/reference material, record where it is in `original/` and summarize the categories in `.paper/IMPORT.md`. Do not compress research into `.paper/RESEARCH.json` or `.paper/RESEARCH.md` during import; route to `/gpd-research` so research compression happens in a fresh context.

If the imported source contains outlines or review notes, record them in `.paper/IMPORT.md`. Do not generate `.paper/OUTLINE.md` or `.paper/REVIEW.md` during import unless the user explicitly asks to treat an existing imported outline/review file as canonical.

## 6. Import Review And Post-Import Menu

Write `.paper/IMPORT.md` with:

- source path
- destination path
- files copied
- files skipped
- classification counts
- largest copied files
- import warnings
- canonical draft selected
- draft candidate ranking
- draft extraction status and source basis
- detected source-reference candidates and a clear note that they are unverified triage inputs
- minimal artifacts created
- imported research/reference material locations
- imported outline/review material locations
- assumptions made
- open questions
- post-import options

After import, present exactly these three choices unless required setup information is missing or `STRATEGY.md` blocks progress:

1. `/gpd-research` - research imported/source material and compress evidence for and against the argument.
2. `/gpd-outline --lite` - quickly triage or rebuild messy imported structure; use `/gpd-outline --deep` instead if the imported paper is already serious, researched, high-stakes, or about 1,200+ words.
3. `/gpd-review --external` - review the current draft locally and with available external models.

Do not add `/gpd-fact-check` as a fourth default import choice. If the imported draft is already publication-sensitive and contains material factual, current, technical, market, regulatory, numerical, or citation-dependent claims, add a conditional note recommending `/gpd-fact-check --risk-scan` before external review or export.

If thesis, audience, classification, reader promise, paper job, scope, or desired outcome is unclear, recommend `/gpd-brief` before showing the three post-import choices.

If `STRATEGY.md` status is `Revise Before Drafting` or `No-Go`, show the block reason and primary blocker, set suggested next command to `/gpd-brief`, and do not recommend research, outline, review, fact-check, or export unless the user explicitly overrides the strategy block.

Set `.paper/STATE.md` and `.paper/STATE.json` to show the post-import choices, not a hidden automatic next step. If one choice is clearly safest, mark it as "suggested" and explain why in one sentence.

Do not recommend `/gpd-revise` immediately after import. Revision requires a review or approved feedback plan from a separate stage.

Ask the user before taking any revision action.

</process>

<success_criteria>
- `original/` exists and contains preserved source material
- `.paper/IMPORT.md` records copied/skipped files and assumptions
- `.paper/DRAFT.md` preserves the canonical imported draft without rewriting
- `.paper/BRIEF.md` captures extracted thesis, claims, opposing view, and gaps
- `.paper/STRATEGY.md` records strategic readiness from imported context
- `.paper/RESEARCH.json`, `.paper/RESEARCH.md`, `.paper/OUTLINE.md`, `.paper/FACT-CHECK.md`, and `.paper/REVIEW.md` are not generated by default during import
- `.paper/STATE.md` and `.paper/STATE.json` record post-import choices and any suggested choice
</success_criteria>
