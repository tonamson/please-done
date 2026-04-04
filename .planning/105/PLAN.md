# Plan: Phase 105 — DOC-06 Skill Reference Cards

> Phase: 105 — DOC-06
> Plan: 105-PLAN.md
> Updated: 2026-04-04

## Success Criteria

1. ✅ Một file ngắn (200-300 words) cho mỗi skill
2. ✅ Structure: Purpose → When to use → Prerequisites → Basic command → Common flags → See also
3. ✅ Đặt trong `docs/skills/`
4. ✅ Cover tất cả 16 skills

## Task Overview

| Task | Description | Effort |
|------|-------------|--------|
| Task 1 | Create docs/skills/ directory structure | XS |
| Task 2 | Create Project skill cards (5 files) | S |
| Task 3 | Create Planning skill cards (1 file) | XS |
| Task 4 | Create Execution skill cards (2 files) | XS |
| Task 5 | Create Debug skill cards (3 files) | S |
| Task 6 | Create Utility skill cards (5 files) | S |
| Task 7 | Create index.md for skills directory | XS |

## Task 1: Create docs/skills/ Directory

**Goal:** Set up directory structure for skill reference cards.

**Actions:**
1. Create `/docs/skills/` directory
2. Verify directory permissions

## Task 2: Project Skill Cards (5 files)

Create short reference cards for:
- `onboard.md` — Onboard command
- `init.md` — Init command
- `scan.md` — Scan command
- `new-milestone.md` — New milestone command
- `complete-milestone.md` — Complete milestone command

**Template per file:**
- Purpose (1 sentence)
- When to use (2-3 bullets)
- Prerequisites (list if any)
- Basic command (code block)
- Common flags (table)
- See also (links to related skills)

## Task 3: Planning Skill Cards (1 file)

Create:
- `plan.md` — Plan command

## Task 4: Execution Skill Cards (2 files)

Create:
- `write-code.md` — Write code command
- `test.md` — Test command

## Task 5: Debug Skill Cards (3 files)

Create:
- `fix-bug.md` — Fix bug command
- `audit.md` — Audit command
- `research.md` — Research command

## Task 6: Utility Skill Cards (5 files)

Create:
- `status.md` — Status command
- `what-next.md` — What next command
- `conventions.md` — Conventions command
- `fetch-doc.md` — Fetch doc command
- `update.md` — Update command

## Task 7: Create Index File

**Goal:** Create navigation index for all skill cards.

**Actions:**
1. Create `docs/skills/index.md`
2. List all 16 skills with one-liner descriptions
3. Group by category
4. Link to full command docs in docs/commands/

## Verification

- [ ] All 16 files created in docs/skills/
- [ ] Each file 200-300 words
- [ ] Consistent structure across all files
- [ ] index.md provides navigation
- [ ] Cross-links work correctly
