---
phase: 104
name: DOC-05 — Workflow Walkthrough Guides
milestone: v11.1
requirement: DOC-05
created: 2026-04-04
---

# Phase 104 Context: Workflow Walkthrough Guides

## Goal
Tạo text-based walkthrough guides chi tiết cho các workflow phổ biến, giúp người mới và experienced users đều có thể follow step-by-step.

## Requirements Reference
- DOC-05: Workflow Walkthrough Guides (từ REQUIREMENTS.md)

## Decisions Locked

### Content Structure
1. **Number of Guides**
   - 3 guides từ DOC-05 requirements:
     - `getting-started.md` — Workflow cho người mới
     - `bug-fixing.md` — Workflow debug và fix bug
     - `milestone-management.md` — Quản lý milestone

2. **Guide Format (Step-by-step)**
   - Mỗi guide có numbered steps (1, 2, 3...)
   - Mỗi step có:
     - **Command:** Exact command để run
     - **Expected Output:** Những gì sẽ thấy sau khi chạy
     - **Decision Points:** "If X then Y" scenarios
   - Screenshots thay thế bằng text output (ASCII/text-based)

3. **Audience Levels**
   - `getting-started.md` — Beginner (no prior PD experience)
   - `bug-fixing.md` — Intermediate (đã có project structure)
   - `milestone-management.md` — Advanced (planning và completing)

4. **File Location**
   - Target: `docs/workflows/*.md`
   - Create directory nếu chưa tồn tại

### Gray Areas Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Should guides include outputs verbatim? | Yes, text representation | User biết expect gì |
| How detailed each step? | Command + output + next action | Đủ để follow không cần đoán |
| Include troubleshooting? | Yes, inline "If this fails" | Không cần chuyển file khác |
| Decision points format? | Bullet với "If... then..." | Dễ scan |
| Should we use diagrams? | Text-based only | Consistent với DOC-03 |
| Prerequisites in each guide? | Yes, ở đầu mỗi guide | Self-contained |

### Guide Structure Template

```markdown
# Workflow Guide: [Name]

## Prerequisites
- [ ] Item 1
- [ ] Item 2

## Overview
Brief description of what this workflow accomplishes.

## Step-by-Step Walkthrough

### Step 1: [Action Name]
**Command:**
```
/pd:command [args]
```

**Expected Output:**
```
Sample output text here...
```

**What this does:** Explanation

**Decision Point:**
- If [condition], then [action]
- If [condition], then [action]

### Step 2: [Next Action]
...

## Summary
Review what was accomplished.

## Next Steps
- Link to related guides
- Link to skill reference
```

## Out of Scope (Deferred)

- Video walkthroughs → v11.x backlog
- Interactive guides → requires tooling
- Auto-generated guides → requires parsing
- Screenshots/images → text-only format

## Success Criteria

1. File `docs/workflows/getting-started.md` exists với complete beginner workflow
2. File `docs/workflows/bug-fixing.md` exists với debug workflow
3. File `docs/workflows/milestone-management.md` exists với planning workflow
4. Mỗi guide có numbered steps với commands, expected outputs, decision points
5. All text-based (no external media dependencies)

## Technical Notes

- Target directory: `/Volumes/Code/Nodejs/please-done/docs/workflows/`
- Create 3 new files
- Follow template structure consistently
- Use CLAUDE.md workflows làm reference

## Research Needed

1. Review Common Workflows từ CLAUDE.md (đã tạo ở Phase 102)
2. Extract commands và outputs từ recent execution
3. Identify decision points từ STATE.md và error patterns

## Next Steps

1. Design guide structure template
2. Create docs/workflows/ directory
3. Write getting-started.md với beginner workflow
4. Write bug-fixing.md với debug workflow
5. Write milestone-management.md với planning workflow
6. Verify all guides have complete steps
