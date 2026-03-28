# Command `pd research` (Multi-layer & Transparent Research System)

## Purpose
A versatile technical research system serving both project implementation (Internal) and user knowledge expansion (External). Each research report is standardized in an **Audit-Ready** format to prevent hallucination and enable permanent storage.

## Data Partitioning (Storage Structure)
All research results are stored in the `.planning/research/` directory:

1. **`internal/` (Project Research)**:
   - Main files: `TECHNICAL_STRATEGY.md`, `CODEBASE_MAP.md`.
   - Characteristics: Continuously updated per Phase. Directly serves AI when coding.
2. **`external/` (External Research)**:
   - File format: `RES-[ID]-[SLUG].md` (Example: `RES-001-CVE-NESTJS.md`).
   - Characteristics: **Never overwritten**. Each new research request creates a new file with a unique ID.
3. **`INDEX.md`**:
   - Summary table (directory) of all research reports, enabling easy lookup.

## Operating Modes
- **`pd research`**: Default mode, scans codebase for `plan`. Results saved to `internal/`.
- **`pd research [topic/library/issue]`**: Extended research mode.
  - AI will search for information outside the project.
  - Creates a new report file in `external/` and updates the ID in `INDEX.md`.

## Audit Standard
Each research report (especially external ones) MUST follow this structure:
- **Evidence Sources**: URL links, documentation snippets, or actual API references.
- **Search Log**: List of documents reviewed to reach conclusions.
- **Confidence Level**: AI self-assesses accuracy (High/Medium/Low).

## Output
- Transparent technical report file.
- Updated research directory (`INDEX.md`).
- Knowledge additions to the project record (`.planning/codebase/`).

---
**Next step:** [pd plan](plan.md)
