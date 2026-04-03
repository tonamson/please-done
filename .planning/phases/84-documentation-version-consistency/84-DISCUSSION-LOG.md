# Discussion Log — Phase 84: Documentation & Version Consistency

**Date:** 2026-04-05
**Mode:** discuss (interactive)
**Areas discussed:** 3 + 1 bonus (INTEGRATION_GUIDE, Command docs format, CHANGELOG gap, README stacks)

---

## Area 1: INTEGRATION_GUIDE.md

**Question:** INTEGRATION_GUIDE.md có 2 references trong README (line 238 blockquote + line 524 table). File không tồn tại. Xử lý như thế nào?

**Options presented:**
- Tạo INTEGRATION_GUIDE.md thực sự (fork workflow + customize + add stacks)
- Xóa 2 references, không cần file này
- Thay link bằng link đến README section liên quan

**User selected:** "Xử lý theo hướng tốt nhất" (agent discretion)

**Agent decision:** Tạo file thực sự — blockquote line 238 references specific content ("how to add new stacks or edit rules") users actually need.

**Follow-up — depth:**
- Options: Ngắn gọn (1 trang) / Chi tiết hơn
- User selected: Chi tiết hơn: fork, add stacks, edit rules, anchor patterns, cross-references

**Decision captured:** D-02 — Create full INTEGRATION_GUIDE.md with 5 topic areas.

---

## Area 2: Command Docs Format

**Question:** 4 files thiếu (audit.md, conventions.md, onboard.md, status.md) — dùng format nào?

**Options presented:**
- Giữ format hiện tại (Purpose + How It Works + When to run + Output + Next step)
- Format mới thêm Arguments section và Examples

**User selected:** Format mới thêm Arguments section và Examples

**Decision captured:** D-03 — Extended format: Purpose + Arguments + How It Works + When to run + Output + Examples + Next step.

---

## Area 3: CHANGELOG Gap

**Question:** CHANGELOG frozen at 2.8.0, project now 4.0.0. MILESTONES.md has full history from v3.0–v9.0. How to handle?

**Options presented:**
- Deprecated CHANGELOG — prepend frozen notice + pointer to MILESTONES.md
- Cập nhật CHANGELOG thêm entries cho v3.0–v9.0

**User selected:** Deprecated CHANGELOG — thêm note trên top: 'Changelog frozen at 2.8.0 — history từ v3.0+ xem MILESTONES.md'

**Decision captured:** D-05 — Prepend deprecation notice, keep existing entries intact.

---

## Area 4 (Bonus): README Supported Stacks

**Question:** README nhắc `commands/pd/rules/` nhưng không liệt kê 6 stack rules hiện có. Thêm vào không?

**Options presented:**
- Phạm vi hiện tại đủ rồi
- Thêm section giới thiệu các stack rules hiện có

**User selected:** Thêm 1 section vào README giới thiệu các stack rules

**Decision captured:** D-04 — Add "Supported Stacks" section listing flutter, nextjs, nestjs, solidity, wordpress, general.

---

## Summary

| Decision | Area | Choice |
|----------|------|--------|
| D-01 | README badge | Update 2.8.0 → 4.0.0 (no discussion needed — clear) |
| D-02 | INTEGRATION_GUIDE.md | Create full file — 5 topic areas |
| D-03 | Command docs format | Extended format with Arguments + Examples |
| D-04 | README stacks | Add Supported Stacks section |
| D-05 | CHANGELOG | Prepend deprecation notice, keep entries |
