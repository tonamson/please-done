---
phase: 108
plan: 01
type: validation
milestone: v11.2
milestone_name: Vietnamese Documentation
created: 2026-04-05
---

# Phase 108: I18N-03 — Command Cheat Sheet Tiếng Việt — Validation Strategy

## Validation Architecture

### Dimension 1: Content Completeness
- **Verification:** File exists at `docs/cheatsheet.vi.md` with comparable line count to `docs/cheatsheet.md` (~200 lines ±10%)
- **Method:** `wc -l docs/cheatsheet.vi.md` and compare to `wc -l docs/cheatsheet.md`

### Dimension 2: Structure Preservation
- **Verification:** All 5 command categories present, Popular Flags Reference table present, Legend section present
- **Method:** `grep -c "## " docs/cheatsheet.vi.md` (section count)

### Dimension 3: Command/Flag Preservation
- **Verification:** All 16 `/pd:*` commands and 15 flags unchanged in docs/cheatsheet.vi.md
- **Method:** `grep -o "/pd:[a-z-]*" docs/cheatsheet.md | sort -u | wc -l` vs same for docs/cheatsheet.vi.md

### Dimension 4: Badge/Header Format
- **Verification:** HTML tracking comment and language switcher badges present
- **Method:** Check for `<!-- Source version:` and `lang-English-blue` patterns

### Dimension 5: Table Alignment
- **Verification:** Table row counts match between files
- **Method:** `grep -c "^|" docs/cheatsheet.md` vs docs/cheatsheet.vi.md

### Dimension 6: Legend Notation
- **Verification:** Flag notation symbols (`[--flag]`, `--flag value`, `|`) preserved exactly
- **Method:** `grep -E "\[--|\|" docs/cheatsheet.vi.md | head -10`

### Dimension 7: Natural Language Flow
- **Verification:** Vietnamese translations sound natural
- **Method:** Manual review of category descriptions and Notes sections

### Dimension 8: Success Criteria Coverage
- **Verification:** All 3 success criteria from I18N-03 met
- **Truth:** "docs/cheatsheet.vi.md exists with accurate descriptions and preserved commands/flags"

## Test Commands

```bash
# Content completeness
test -f docs/cheatsheet.vi.md && wc -l docs/cheatsheet.vi.md

# Structure preservation
grep -c "^## " docs/cheatsheet.md
grep -c "^## " docs/cheatsheet.vi.md

# Command preservation
grep -o "/pd:[a-z-]*" docs/cheatsheet.md | sort -u | wc -l
grep -o "/pd:[a-z-]*" docs/cheatsheet.vi.md | sort -u | wc -l

# Flag preservation
grep -o "--[a-z-]*" docs/cheatsheet.md | sort -u | wc -l
grep -o "--[a-z-]*" docs/cheatsheet.vi.md | sort -u | wc -l

# Badge/header format
grep -c "<!-- Source version:" docs/cheatsheet.vi.md
grep -c "lang-English-blue" docs/cheatsheet.vi.md

# Table alignment
grep -c "^|" docs/cheatsheet.md
grep -c "^|" docs/cheatsheet.vi.md
```

## Acceptance Criteria

- [ ] docs/cheatsheet.vi.md exists with 180-220 lines
- [ ] All 5 command categories present (Project, Planning, Execution, Debug, Utility)
- [ ] All 16 /pd:* commands preserved exactly
- [ ] All 15 flags preserved exactly
- [ ] Popular Flags Reference table present
- [ ] Legend section with notation symbols preserved
- [ ] HTML comment header with version tracking
- [ ] Language switcher badges on both files
