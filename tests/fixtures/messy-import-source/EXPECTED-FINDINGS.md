# Expected Findings

This fixture pre-registers expected behavior for `gpd import`.

## Expected Import Behavior

- Preserve all non-hidden source files under `original/`.
- Skip hidden or ignored local files such as `.git/` and dotfiles.
- Classify `sources/` and `references/` material as research/reference input.
- Classify review or feedback notes as review material, not as draft material.
- Select the newest draft-like Markdown file as the canonical draft.
- Copy the canonical draft to `.paper/DRAFT.md` without rewriting it.
- Do not generate `.paper/RESEARCH.json`, `.paper/RESEARCH.md`, `.paper/OUTLINE.md`, `.paper/FACT-CHECK.md`, or `.paper/REVIEW.md` during import.
- Keep the strategy gate blocked until thesis, audience, reader promise, and desired outcome are confirmed.
- Offer post-import choices but route first to `/gpd-grill` while imported author intent, thesis, audience, narrative spine, or key terms are unresolved.

## Expected Validation Behavior

- Semantic validation should warn that the imported draft contains source-sensitive claims without `RESEARCH.json`, `FACT-CHECK.md`, or source IDs.
- The import report should omit absolute local paths.
- The fixture must remain anonymized.
