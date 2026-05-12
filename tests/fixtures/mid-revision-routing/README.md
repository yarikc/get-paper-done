# Mid-Revision Routing Fixture

This fixture represents a paper that has already moved through research, outline, draft, fact-check, and review, but is not ready to export because fact-check found one claim that needs refreshed research.

Expected behavior:

- `gpd status --json` routes the paper back to `/gpd-research`.
- `gpd validate` passes structurally because the workspace is not malformed.
- The route is incremental: downstream artifacts remain present, but the next action points to the earliest stage that must be repaired.

This fixture exists to prove backward movement after downstream work exists. It is intentionally synthetic and contains no real person names, company names, employer names, job titles, local paths, or private source material.
