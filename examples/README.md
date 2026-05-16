# Examples

Examples are completed or calibrated GPD paper workspaces. They are synthetic,
anonymized, and safe to ship in the package.

## Current Examples

| Example | What It Demonstrates |
|---|---|
| `data-products-ai-scaling` | Full internal strategy-paper flow with deep research, outline, review, and export. |
| `public-ai-control-baseline` | Compact public-source decision memo with standards-aware evidence discipline. |
| `software-supply-chain-evidence-pack` | Canonical showcase for reader feedback, feedback planning, backward routing, fact-checking, and mandatory grill artifacts. |
| `platform-review-cycle-metrics` | Short quantitative paper with metric claims and expected findings. |
| `technology-lifecycle-management` | Imported/control-style paper shape used to test recovery from broad, over-dense architecture prose. |
| `responsible-ai-controls` | Governance/control-paper example with audience and evidence constraints. |
| `weekly-platform-update` | Lite update mode for short status-style writing. |

## Grill Artifact Policy

`/gpd-grill` is mandatory for new and imported papers going forward. New
example workspaces should include:

- `.paper/PAPER-CONTEXT.md`
- `.paper/DECISIONS.md`
- complete `STATE.json.grill` state

Older examples are grandfathered when they pre-date the mandatory grill gate.
They may keep retroactive `STATE.json.grill` compatibility without artificial
context or decision records. Do not backfill old examples unless the artifact
teaches a real workflow lesson.

The current canonical grill example is:

- `software-supply-chain-evidence-pack/.paper/PAPER-CONTEXT.md`
- `software-supply-chain-evidence-pack/.paper/DECISIONS.md`

## Privacy Boundary

Examples must not contain private drafts, person names, company names, employer
names, internal titles, local paths, ignored feedback files, or private source
material.
