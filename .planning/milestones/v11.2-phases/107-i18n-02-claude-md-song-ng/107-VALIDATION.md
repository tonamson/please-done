---
phase: 107
plan: 01
type: validation
milestone: v11.2
milestone_name: Vietnamese Documentation
created: 2026-04-04
---

# Phase 107: I18N-02 — CLAUDE.md Song Ngữ — Validation Strategy

## Validation Architecture

### Dimension 1: Content Completeness
- **Verification:** File exists at `CLAUDE.vi.md` with comparable line count to `CLAUDE.md` (~290 lines ±10%)
- **Method:** `wc -l CLAUDE.vi.md` and compare to `wc -l CLAUDE.md`

### Dimension 2: Structure Preservation
- **Verification:** All major sections from CLAUDE.md present in CLAUDE.vi.md
- **Method:** Compare section headers (grep "^## " for both files)

### Dimension 3: Command Preservation
- **Verification:** All `/pd:*` commands unchanged in CLAUDE.vi.md
- **Method:** `grep -o "/pd:[a-z-]*" CLAUDE.md | sort -u` vs same for CLAUDE.vi.md

### Dimension 4: Badge/Header Format
- **Verification:** HTML tracking comment and language switcher badges present
- **Method:** Check for `<!-- Source version:` and `[![English]` patterns

### Dimension 5: Cross-File Links
- **Verification:** Links between CLAUDE.md and CLAUDE.vi.md work
- **Method:** Verify `[![English](...)](CLAUDE.md)` and `[![Tiếng Việt](...)](CLAUDE.vi.md)`

### Dimension 6: Technical Terminology
- **Verification:** Technical terms kept in English with Vietnamese context
- **Method:** Spot-check "Skills", "Phase", "Milestone", "Workflow" appear in English

### Dimension 7: Natural Language Flow
- **Verification:** Vietnamese text reads naturally (not machine-translated awkwardness)
- **Method:** Manual review of descriptive paragraphs

### Dimension 8: Success Criteria Coverage
- **Verification:** All 3 success criteria from I18N-02 met
- **Truth:** "CLAUDE.vi.md contains all content from CLAUDE.md with accurate technical terminology and preserved examples"

## Test Commands

```bash
# Content completeness
test -f CLAUDE.vi.md && wc -l CLAUDE.vi.md

# Structure preservation
grep -c "^## " CLAUDE.md
grep -c "^## " CLAUDE.vi.md

# Command preservation
grep -o "/pd:[a-z-]*" CLAUDE.md | sort -u | wc -l
grep -o "/pd:[a-z-]*" CLAUDE.vi.md | sort -u | wc -l

# Badge/header format
grep -c "<!-- Source version:" CLAUDE.vi.md
grep -c "lang-English-blue" CLAUDE.vi.md

# Cross-file links
grep -c "CLAUDE.md" CLAUDE.vi.md
grep -c "CLAUDE.vi.md" CLAUDE.md
```

## Acceptance Criteria

- [ ] CLAUDE.vi.md exists with 260-320 lines (90-110% of CLAUDE.md)
- [ ] All section headers present (Common Workflows, Command Usage Patterns, Command References, Schema Validation)
- [ ] All 30+ /pd:* commands preserved exactly
- [ ] HTML comment header with version tracking
- [ ] Language switcher badges on both files
- [ ] Technical terms in English (Skills, Phase, Milestone, Workflow, Plan)
- [ ] Vietnamese text reads naturally
