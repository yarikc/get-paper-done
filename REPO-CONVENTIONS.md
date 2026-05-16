# Repository Conventions

This repository is a prompt/workflow system, not an application server.

When editing:

- Keep workflow files concise and orchestration-focused.
- Put reusable schemas and rubrics in `references/`.
- Put output skeletons in `templates/`.
- Put user-facing entry points in `commands/gpd/`.
- Put specialized role prompts in `agents/`.
- Prefer paper-scoped context in `.paper/` over global assumptions.
- Every workflow that writes or revises prose should read `PERSONA.md`, `AUDIENCE.md`, and `BRIEF.md` first.
- Treat `.paper/RESEARCH.json` as the canonical research artifact when present; `.paper/RESEARCH.md` is a short index.
- Do not load raw `.paper/sources/` or `original/` by default unless verifying a specific source.
