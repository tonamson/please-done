---
phase: 105
name: DOC-06 — Skill Reference Cards
milestone: v11.1
requirement: DOC-06
created: 2026-04-04
---

# Phase 105 Context: Skill Reference Cards

## Goal
Tạo quick reference cards cho mỗi skill — concise, scannable documentation giúp user nhanh chóng hiểu và sử dụng mỗi skill.

## Requirements Reference
- DOC-06: Skill Reference Cards (từ REQUIREMENTS.md)

## Decisions Locked

### Content Structure (per skill)
Mỗi skill reference card có cấu trúc chuẩn 6 phần:

1. **Purpose** — One sentence mô tả skill làm gì
2. **When to use** — Scenarios và use cases cụ thể
3. **Prerequisites** — Checklist những gì cần trước khi chạy
4. **Basic command** — Command cơ bản nhất với example
5. **Common flags** — 3-5 flags phổ biến nhất với description
6. **See also** — Links đến related skills và docs

### Format Specifications
- **Length:** 200-300 words per skill (concise)
- **Language:** English (theo CLAUDE.md convention)
- **Code blocks:** Cho commands và examples
- **Bullet points:** Cho lists (flags, prerequisites)
- **Tables:** Cho common flags nếu nhiều

### File Organization
- **Location:** `docs/skills/`
- **Naming:** `{skill-name}.md` (kebab-case, no pd: prefix)
- **Total:** 16 files cho 16 skills

### 16 Skills to Document

**Core (4):**
- onboard.md — Orient AI to codebase
- init.md — Initialize project structure
- scan.md — Analyze codebase
- plan.md — Create technical design

**Project (5):**
- new-milestone.md — Plan milestones
- write-code.md — Execute tasks
- test.md — Run tests
- fix-bug.md — Debug and fix
- complete-milestone.md — Finalize milestone

**Debug (2):**
- audit.md — Security/code audits
- research.md — Technical research

**Utility (5):**
- status.md — Project status
- conventions.md — Code patterns
- fetch-doc.md — Download docs
- update.md — Update skills
- what-next.md — Next steps

### Gray Areas Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Word count strict? | 200-300 words target, flexible ±50 | Concise but đủ thông tin |
| Include all flags? | No, chỉ 3-5 most common | Focus on 80% use cases |
| Should cards link to each other? | Yes, trong "See also" | Cross-navigation |
| Include error handling? | Brief mention only | Chi tiết trong error-troubleshooting.md |
| One page per skill? | Yes, single file | Easy to reference |
| Auto-generate from code? | No, manual docs | Consistency và quality |

### Template Structure

```markdown
# Skill: {Name}

## Purpose

One sentence describing what this skill does.

## When to Use

- Scenario 1: Description
- Scenario 2: Description
- Scenario 3: Description

## Prerequisites

- [ ] Prerequisite 1
- [ ] Prerequisite 2

## Basic Command

```
/pd:skill-name
```

**Example:**
```
/pd:skill-name --flag value
```

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--flag1` | Description | `--flag1` |
| `--flag2` | Description | `--flag2 value` |

## See Also

- [Related Skill](skill-name.md)
- [Full Documentation](../CLAUDE.md#skill)
```

## Out of Scope (Deferred)

- Interactive cards → requires tooling
- Auto-sync with code → out of scope
- Multi-language versions → focus English
- Video explanations → v11.x backlog

## Success Criteria

1. Directory `docs/skills/` exists với 16 `.md` files
2. Mỗi skill có file 200-300 words với 6 section structure
3. All skills covered: Core (4) + Project (5) + Debug (2) + Utility (5)
4. Cross-references giữa related skills
5. Consistent formatting across all cards

## Technical Notes

- Target directory: `/Volumes/Code/Nodejs/please-done/docs/skills/`
- Create 16 new files
- Follow template structure strictly
- Use existing skill definitions từ commands/pd/*.md làm reference

## Research Needed

1. Review commands/pd/*.md cho mỗi skill
2. Identify most common flags từ usage patterns
3. Determine prerequisite checklist cho mỗi skill
4. Map related skills cho "See also" section

## Next Steps

1. Create docs/skills/ directory
2. Create template và example card
3. Generate 16 skill cards (có thể parallelize)
4. Verify all cards meet word count và structure
5. Add cross-references
6. Create index README.md
