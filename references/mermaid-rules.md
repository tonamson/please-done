# Mermaid Rules

> Single source of truth for mermaid-validator.js
> Read by: mermaid-validator.js (implement), test (validate), AI skills (generate diagrams)

## 1. Color Palette

5-color Corporate Blue palette (D-01):

| Name | Fill | Stroke | Text |
|------|------|--------|------|
| primary | #2563EB | #1e40af | #fff |
| secondary | #64748B | #475569 | #fff |
| accent | #10B981 | #059669 | #fff |
| warning | #F59E0B | #d97706 | #000 |
| error | #DC2626 | #b91c1c | #fff |

classDef syntax for validator and AI skills:

```
classDef primary fill:#2563EB,stroke:#1e40af,color:#fff
classDef secondary fill:#64748B,stroke:#475569,color:#fff
classDef accent fill:#10B981,stroke:#059669,color:#fff
classDef warning fill:#F59E0B,stroke:#d97706,color:#000
classDef error fill:#DC2626,stroke:#b91c1c,color:#fff
```

**Rule:** Only use these 5 colors in diagrams. Validator warns if it encounters classDef with fill not in the palette.

## 2. Node Shapes

6 roles with corresponding shapes (D-02 Shape-by-Role):

| Role | Shape | Syntax | Example |
|------|-------|--------|---------|
| Service | Rectangle | `A["Label"]` | `svc["Order Processing"]` |
| Database | Cylinder | `A[("Label")]` | `db[("PostgreSQL")]` |
| API | Rounded | `A("Label")` | `api("REST API")` |
| Decision | Diamond | `A{"Label"}` | `dec{"Valid?"}` |
| Start/End | Stadium | `A(["Label"])` | `start(["Begin"])` |
| External | Subroutine | `A[["Label"]]` | `ext[["Payment Gateway"]]` |

**Rule:** Choose shape matching the node's role. Validator warns if shape doesn't match role (when determinable).

## 3. Label Conventions

Rules for labels on nodes and edges (D-03, D-09, D-10):

- **Node labels:** 3-5 words, English (per D-09)
- **Edge labels:** 1-3 words, English
- **ALWAYS use double quotes** for all labels (per D-10)
- No obscure abbreviations
- Example: `A["Order Processing"] --> B["Success"]`
- Example edge label: `A["Input"] -- "valid" --> B["Storage"]`

**Rule:** Labels must be concise, clear, in English. DO NOT use non-English in labels except for technical names (e.g.: "PostgreSQL", "REST API").

## 4. Max Nodes

Node count limit per diagram (D-04):

- Maximum **15 nodes** per diagram
- Exceeding 15 should be split into subgraphs or separate diagrams
- Validator will warn when exceeding 15 nodes

**Rule:** Count node definitions (excluding comments, classDef, linkStyle). If > 15 nodes, must split diagram.

## 5. Direction Rules

4 directions and when to use:

| Direction | Use when |
|-----------|----------|
| TD (Top-Down) | Business logic flows, process flows, hierarchies — **DEFAULT** |
| LR (Left-Right) | Architecture diagrams, timelines, pipelines |
| BT (Bottom-Up) | Rarely used — hierarchy inversion |
| RL (Right-Left) | Rarely used — reverse flows |

**Rule:** First line MUST be `flowchart [direction]` or `graph [direction]`. Direction must be one of: TD, TB, LR, BT, RL. Missing direction declaration causes validator syntax error.
