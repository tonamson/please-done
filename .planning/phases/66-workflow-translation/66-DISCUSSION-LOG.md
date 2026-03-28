# Phase 66: Workflow Translation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 66-workflow-translation
**Areas discussed:** Step numbering, Batching strategy, Test assertion updates, Cross-reference consistency
**Mode:** --auto (all areas auto-selected, recommended defaults chosen)

---

## Step Numbering Convention

| Option | Description | Selected |
|--------|-------------|----------|
| Step X with preserved sub-numbering | "Bước X" → "Step X", "Bước 1.7" → "Step 1.7", "Bước 5b.1" → "Step 5b.1" | ✓ |
| Step X with flattened numbering | Renumber all steps sequentially (Step 1, Step 2, ...) | |
| Keep Bước | Preserve Vietnamese step labels as domain terms | |

**User's choice:** [auto] Step X with preserved sub-numbering (recommended default)
**Notes:** Maintains precision of existing sub-step references while converting to English. 269 total "Bước" occurrences across 13 files.

---

## Batching Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Roadmap-defined split (7+6) | Plan 01: 7 smaller workflows, Plan 02: 6 larger workflows | ✓ |
| Size-based split (even) | Split by total line count for roughly equal batches | |
| Single plan | All 13 files in one plan | |

**User's choice:** [auto] Roadmap-defined split (recommended default)
**Notes:** Aligns with the existing roadmap plan structure. Plan 01 handles smaller files (81-272 lines), Plan 02 handles larger files (307-524 lines).

---

## Test Assertion Updates

| Option | Description | Selected |
|--------|-------------|----------|
| Fix immediate regressions only | Update test strings that reference workflow content; defer broader migration to phase 69 | ✓ |
| Full test translation | Translate all Vietnamese test strings now | |
| No test changes | Leave tests as-is, accept temporary failures | |

**User's choice:** [auto] Fix immediate regressions only (recommended default)
**Notes:** Prevents smoke-integrity.test.js from failing after workflow translation while keeping scope tight. Broader SYNC-02 test migration belongs in phase 69.

---

## Cross-Reference Consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve paths, translate descriptions | Keep @path references exactly, translate surrounding text | ✓ |
| Update paths and descriptions | Rename workflow files to English names | |

**User's choice:** [auto] Preserve paths, translate descriptions (recommended default)
**Notes:** Consistent with Phase 65 D-02. All `@workflows/`, `@references/`, `@templates/` path references remain unchanged.

---

## the agent's Discretion

- Specific English phrasing choices
- Commit batching during translation
- Whether to use temp files or direct edits

## Deferred Ideas

None — discussion stayed within phase scope.
