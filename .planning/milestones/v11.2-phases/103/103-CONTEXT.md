---
phase: 103
name: DOC-04 — Error Message Improvements
milestone: v11.1
requirement: DOC-04
created: 2026-04-04
---

# Phase 103 Context: Error Message Improvements

## Goal
Cải thiện error messages để user biết cách khắc phục, giảm thời gian debug và cải thiện trải nghiệm developer.

## Requirements Reference
- DOC-04: Error Message Improvements (từ REQUIREMENTS.md)

## Decisions Locked

### Content Structure
1. **Review Scope**
   - Target: 16 skill commands (commands/pd/*.md)
   - Focus on user-facing error messages (not internal logs)
   - Prioritize errors thường gặp nhất

2. **Error Message Format**
   - Mỗi error có 3 phần:
     - **Error:** Mô tả ngắn gọn vấn đề
     - **Cause:** Giải thích tại sao xảy ra
     - **Suggested action:** Hướng dẫn cụ thể để fix

3. **Error Troubleshooting Guide**
   - File: `docs/error-troubleshooting.md`
   - Format: Table với Error | Cause | Solution
   - Group theo category: Setup, Planning, Execution, Debug

4. **Documentation Links**
   - Link mỗi error đến relevant documentation
   - Sử dụng relative paths: `docs/setup.md`, `CLAUDE.md#section`
   - Thêm "See also" references

### Gray Areas Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Which errors to document? | Top 10-15 most common | Focus on impact, không phải tất cả |
| Should we modify skill code? | No, chỉ documentation | Phase này chỉ improve docs, không đổi logic |
| Format cho "Suggested action"? | Numbered steps, imperative | Dễ follow, actionable |
| Error troubleshooting location? | `docs/error-troubleshooting.md` | Central reference, dễ tìm |
| How to prioritize errors? | Frequency + user impact | Dựa trên logs và feedback |

### Common Errors to Document

1. **Setup Errors**
   - MCP not connected
   - Missing prerequisites (Node, Python, Git)
   - Invalid Gemini API key

2. **Planning Errors**
   - Plan-check BLOCK status
   - Phase not found in roadmap
   - Circular dependencies

3. **Execution Errors**
   - Write-code lint failures
   - Test failures
   - Task verification failures

4. **Debug Errors**
   - Bug reproduction failed
   - Audit findings critical
   - Research query ambiguous

## Out of Scope (Deferred)

- Automated error classification → requires ML, v11.x backlog
- Real-time error analytics → requires infrastructure
- Skill code refactoring → out of scope for docs phase

## Success Criteria

1. Review 16 skills và identify common errors
2. Mỗi common error có "Suggested action" cụ thể
3. File `docs/error-troubleshooting.md` exists với table format
4. Errors được link đến relevant documentation
5. No changes to skill logic (docs only)

## Technical Notes

- Target file: `/Volumes/Code/Nodejs/please-done/docs/error-troubleshooting.md`
- Create new file, không modify existing skills
- Use existing error-recovery.md làm reference
- Follow markdown table syntax

## Research Needed

1. Review current error messages từ:
   - commands/pd/*.md (skill definitions)
   - docs/error-recovery.md (existing guide)
   - .planning/logs/agent-errors.jsonl (nếu có)

2. Identify top 10-15 errors thường gặp nhất

## Next Steps

1. Research existing error messages và recovery patterns
2. Identify và prioritize common errors
3. Design error troubleshooting guide structure
4. Create docs/error-troubleshooting.md
5. Update skill docs với suggested actions
