# Graph Report - BE  (2026-08-25)

## Corpus Check
- 70 files · ~29,323 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 27 nodes · 25 edges · 4 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `82e176bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Node → Django migration guide
- Scraper Plan
- Scraper strategy
- Daily execution plan

## God Nodes (most connected - your core abstractions)
1. `Node → Django migration guide` - 10 edges
2. `Scraper Plan` - 10 edges
3. `Scraper strategy` - 4 edges
4. `Daily execution plan` - 3 edges
5. `Phase 0 — Project hygiene (do this before writing any API code)` - 1 edges
6. `Phase 1 — Jobs API (read-only, no auth needed)` - 1 edges
7. `Phase 2 — Auth` - 1 edges
8. `Phase 3 — Profile` - 1 edges
9. `Phase 4 — Settings` - 1 edges
10. `Phase 5 — Applications (apply / track)` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (4 total, 0 thin omitted)

### Community 0 - "Node → Django migration guide"
Cohesion: 0.18
Nodes (10): Node → Django migration guide, Phase 0 — Project hygiene (do this before writing any API code), Phase 1 — Jobs API (read-only, no auth needed), Phase 2 — Auth, Phase 3 — Profile, Phase 4 — Settings, Phase 5 — Applications (apply / track), Phase 6 — Interview (AI features) (+2 more)

### Community 1 - "Scraper Plan"
Cohesion: 0.22
Nodes (8): Best approach for automation, Goal, Notes, Recommended workflow, Scraper Plan, Shared model, Suggested command design, Suggested folder structure

### Community 2 - "Scraper strategy"
Cohesion: 0.50
Nodes (4): 1) Naukri scraper, 2) Indeed scraper, 3) Third website scraper, Scraper strategy

### Community 3 - "Daily execution plan"
Cohesion: 0.67
Nodes (3): Daily execution plan, Option A: One command to run all, Option B: Separate commands for each scraper

## Knowledge Gaps
- **21 isolated node(s):** `Phase 0 — Project hygiene (do this before writing any API code)`, `Phase 1 — Jobs API (read-only, no auth needed)`, `Phase 2 — Auth`, `Phase 3 — Profile`, `Phase 4 — Settings` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Scraper Plan` connect `Scraper Plan` to `Scraper strategy`, `Daily execution plan`?**
  _High betweenness centrality (0.295) - this node is a cross-community bridge._
- **Why does `Scraper strategy` connect `Scraper strategy` to `Scraper Plan`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **What connects `Phase 0 — Project hygiene (do this before writing any API code)`, `Phase 1 — Jobs API (read-only, no auth needed)`, `Phase 2 — Auth` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._