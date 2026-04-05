# Phase 32: Orchestrator Workflow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 32-orchestrator-workflow
**Areas discussed:** Workflow file strategy, Step transitions & error handling, V1.5 logic reuse, Session lifecycle

---

## Workflow File Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite fix-bug.md | Thay the noi dung fix-bug.md bang orchestrator moi. Phase 33 them --single fallback. Giu ten file + invocation. | ✓ |
| Tao file moi | Tao detective-orchestrator.md rieng, fix-bug.md goi no nhu dispatcher. | |
| Giu fix-bug.md + them hooks | Giu v1.5 logic, them orchestrator hooks tai cac buoc. | |

**User's choice:** Rewrite fix-bug.md
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Chi giu Buoc 0.5 + invocation | Giu preamble va Buoc 0.5. Thay toan bo Buoc 1-10 bang 5 buoc orchestrator. | ✓ |
| Giu preamble + rules | Giu preamble, required_reading, rules section. Thay process. | |
| Rewrite toan bo | Viet lai tu dau. | |

**User's choice:** Chi giu Buoc 0.5 + invocation
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Luu vao fix-bug-v1.5.md | Copy fix-bug.md → fix-bug-v1.5.md truoc khi rewrite. Phase 33 dung lam reference. | ✓ |
| Khong can, git history du | Git co lich su. Phase 33 checkout tu commit cu. | |
| Inline conditional | Giu ca 2 logic trong 1 file voi if/else. | |

**User's choice:** Luu vao fix-bug-v1.5.md
**Notes:** None

---

## Step Transitions & Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fail-forward voi warning | Agent fail → ghi warning, tiep tuc voi evidence co san. Chi stop khi Janitor fail. | ✓ |
| Stop va hoi user | Bat ky agent fail → hien loi, hoi user: retry / skip / abort. | |
| Auto-retry 1 lan roi skip | Agent fail → retry 1 lan. Van fail → skip voi warning. | |

**User's choice:** Fail-forward voi warning
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Milestone banners | Moi buoc hien 1 banner ngan. Chi tiet agent an. Ket qua cuoi hien day du. | ✓ |
| Silent — chi ket qua cuoi | An hoan toan, chi hien ket luan + fix. | |
| Verbose — moi chi tiet | Hien tat ca: agent spawn, evidence, timing. | |

**User's choice:** Milestone banners
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Tiep tuc voi Detective evidence | DocSpec la bo sung. Ghi warning, tiep voi evidence_code.md. | ✓ |
| Retry DocSpec 1 lan | Thu lai DocSpec. Neu van fail thi tiep khong co no. | |
| Spawn DocSpec tuan tu thay song song | Degrade tu parallel sang sequential. | |

**User's choice:** Tiep tuc voi Detective evidence
**Notes:** Nhat quan voi D-12 Phase 30

---

## V1.5 Logic Reuse

| Option | Description | Selected |
|--------|-------------|----------|
| Goi truc tiep tu orchestrator | Orchestrator import va goi 3 modules sau khi commit. | |
| Tao post-fix-pipeline.js | Wrap 3 modules vao 1 pipeline moi. | |
| Claude's Discretion | Claude tu chon cach tot nhat dua tren code hien tai. | ✓ |

**User's choice:** Claude's Discretion
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| fix([LOI]): mo ta | Prefix fix() voi tag [LOI]. Nhat quan voi v1.5 conventions. | ✓ |
| fix(pd-debug): mo ta | Dung scope pd-debug thay vi [LOI]. | |
| Claude's Discretion | Claude chon format phu hop nhat. | |

**User's choice:** fix([LOI]): mo ta
**Notes:** None

---

## Session Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Dau Buoc 1, sau Resume UI | User chon "Tao phien moi" hoac khong co session cu → createSession() → Janitor ghi evidence. | ✓ |
| Sau Buoc 1 (Janitor xong) | Janitor chay truoc, neu co trieu chung moi tao session. | |
| Lazy — khi co evidence dau tien | Tao session khi agent dau tien ghi evidence. | |

**User's choice:** Dau Buoc 1, sau Resume UI
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Sau user verify fix thanh cong | Nhat quan D-09 Phase 31. Sau commit + test pass + user OK. | ✓ |
| Sau commit fix | Tu dong sau commit, khong cho user verify. | |
| Claude's Discretion | Claude chon thoi diem phu hop. | |

**User's choice:** Sau user verify fix thanh cong
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Sau bug record + INDEX rebuild | Flow: commit → verify → bug record → INDEX → session resolved. | ✓ |
| Sau commit fix, truoc bug record | Session resolved ngay sau commit. | |
| User tu dong | Session chi resolved khi user chay lenh rieng. | |

**User's choice:** Sau bug record + INDEX rebuild
**Notes:** Nhat quan voi D-09, D-10 Phase 31

---

## Claude's Discretion

- V1.5 logic reuse approach (goi truc tiep vs wrap)
- So luong plans va task breakdown
- Chi tiet Buoc 0.5 giu nguyen bao nhieu
- Error message format cho milestone banners

## Deferred Ideas

None
