# Phase 149: Documentation Flow — Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite `docs/WORKFLOW_OVERVIEW.md` to be short and flow-focused (≤60 lines, lifecycle diagram, "when do I use which command?"), and create `docs/GETTING_STARTED.md` (new file, step-by-step from install to first phase completion with time estimates and inline pitfalls).

No other docs files are in scope. Vietnamese translations deferred (D-08 from Phase 148).

</domain>

<decisions>
## Implementation Decisions

### DOCS-04: WORKFLOW_OVERVIEW.md Rewrite

- **D-01:** Diagram type → **Mermaid flowchart** (`graph LR` or `flowchart LR`) — renders on GitHub, cleaner than ASCII for a lifecycle diagram
- **D-02:** Diagram placement → **top of file** — diagram first, then command-mapping section below
- **D-03:** Structure → Two sections only: (1) lifecycle diagram, (2) "When to use which command?" quick reference table
- **D-04:** Hard limit → **≤60 lines total** (including diagram block and blank lines)
- **D-05:** Audience → Developer who knows PD exists and wants to understand the workflow sequence — not a marketing pitch, not beginner tutorial
- **D-06:** Footer link → Keep single footer line: `For detailed command syntax, see [COMMAND_REFERENCE.md](COMMAND_REFERENCE.md)`
- **D-07:** Old content → **full rewrite** — do not preserve any of the current Step 1–5 prose blocks (too verbose, wrong level)

### DOCS-05: GETTING_STARTED.md Creation

- **D-08:** Starting point → `npm install -g please-done` — assumes Node.js installed, nothing else
- **D-09:** End point → First phase plan created and verified — stop before Phase 150 content
- **D-10:** Time estimates → **inline parenthetical** format: `(~2 min)` after each step heading
- **D-11:** Pitfalls → **inline `> ⚠️ Pitfall:` callout** under the step where the pitfall occurs — not a separate section
- **D-12:** Depth → Minimal — only the commands needed to reach first phase completion; do not list all flags or all commands
- **D-13:** Command sequence to cover → `install → onboard → new-milestone → plan → write-code → test`
- **D-14:** What-next integration → Include `pd:what-next` as the "when lost" escape hatch, briefly
- **D-15:** Length → Target 50–80 lines — enough to be complete, short enough to scan in 2 minutes

### Agent's Discretion
- Exact Mermaid syntax (LR vs TD) — use whatever renders cleanest
- Whether to use a table or bullet list for the "when to use" section in WORKFLOW_OVERVIEW — pick clearest
- Exact wording of pitfall notes

</decisions>

<canonical_refs>
## Files Downstream Agents Must Read

- `docs/WORKFLOW_OVERVIEW.md` — current content to be replaced (53 lines)
- `docs/GETTING_STARTED.md` — does not exist yet, must be created
- `docs/COMMAND_REFERENCE.md` — Phase 148 output; GETTING_STARTED must link here
- `docs/cheatsheet.md` — Phase 148 output; GETTING_STARTED may reference
- `.planning/REQUIREMENTS.md` — DOCS-04 and DOCS-05 acceptance criteria
- `.planning/ROADMAP.md` — phase dependency: README (Phase 150) links to GETTING_STARTED

No ADRs or external specs for this phase — pure documentation work.
</canonical_refs>

<deferred>
## Deferred Ideas

- Vietnamese translations of WORKFLOW_OVERVIEW and GETTING_STARTED — out of scope, separate translation pass
- Interactive/video tutorial — not a doc file, separate initiative
- Inline examples with terminal output screenshots — deferred (maintenance burden)
</deferred>
