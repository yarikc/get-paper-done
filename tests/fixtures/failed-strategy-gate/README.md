# Failed Strategy Gate Fixture

This fixture represents a paper that should not move into research, outline, or draft yet. It is intentionally stopped by the strategy gate with `Revise Before Drafting`.

Expected behavior:

- `gpd status --json` routes the paper to `/gpd-brief`.
- `gpd validate` fails with `Strategy blocks downstream work: thesis_weak`.
- The fixture has no downstream artifacts such as `RESEARCH.json`, `OUTLINE.md`, or `DRAFT.md`.

This is a workflow-state fixture, not a semantic-quality fixture. It exists to prove that a valid blocked state is visible, routable, and hard to accidentally skip.
