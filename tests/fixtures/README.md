# Test Fixtures

Fixtures are intentionally small paper workspaces or source folders used by the
test suite. They are not example-quality papers.

| Fixture | What It Tests |
|---|---|
| `broken-semantic-paper` | Semantic validators catch stale evidence, weak reasoning spine, weak ask clarity, and related paper-quality failures. |
| `control-paper-lifecycle-framework` | Anonymized control case for a paper created outside GPD, preserving the failure pattern without private details. |
| `failed-strategy-gate` | Strategy gate blocks downstream work when the paper is not ready. |
| `messy-import-source` | Import preserves mixed drafts, notes, sources, and review material without prematurely generating downstream artifacts. |
| `mid-revision-routing` | Backward routing after downstream work already exists. |

Fixtures may be deliberately incomplete or malformed. Do not use fixture shape
as the target shape for real papers.

## Privacy Boundary

Fixtures must remain synthetic or anonymized. They must not contain real person
names, company names, employer names, internal titles, local paths, private
drafts, ignored feedback files, or private source material.
