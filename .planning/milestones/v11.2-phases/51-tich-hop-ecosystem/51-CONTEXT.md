# Phase 51: Tích hợp Ecosystem - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Pipeline audit kết nối liền mạch với workflow hiện tại — user không cần nhớ chạy thủ công. 3 điểm wire: security gate trong complete-milestone, ưu tiên 7.5 trong what-next, pd:audit trong state machine. Đây là phase cuối cùng của v4.0 OWASP Security Audit.

</domain>

<decisions>
## Implementation Decisions

### Security Gate (WIRE-01)
- **D-01:** Security gate NON-BLOCKING. Khi chưa có SECURITY_REPORT.md trong milestone dir, complete-milestone cảnh báo rõ ràng nhưng cho phép bypass. Không chặn hoàn toàn
- **D-02:** Gate bypass = 2 lựa chọn: (1) Chạy pd:audit ngay (2) Bỏ qua, tiếp tục complete-milestone. Không cần ghi lý do bypass

### what-next Priority (WIRE-02)
- **D-03:** Gợi ý pd:audit ở ưu tiên 7.5 CHỈ KHI tất cả phases ✅ + chưa có SECURITY_REPORT.md trong milestone dir. Điều kiện: glob `.planning/milestones/[version]/SECURITY_REPORT.md` không tồn tại. Message: "Chưa kiểm toán bảo mật. Chạy `/pd:audit` trước khi đóng milestone."

### State Machine (WIRE-03)
- **D-04:** pd:audit là NHÁNH PHỤ — giống fix-bug/what-next, chạy bất kỳ lúc nào sau init. Không thay đổi luồng chính. Gate trong complete-milestone là enforcement duy nhất
- **D-05:** Cập nhật 3 files chính + 4 snapshot folders: references/state-machine.md (thêm nhánh phụ), workflows/what-next.md (thêm ưu tiên 7.5), workflows/complete-milestone.md (thêm gate check), + snapshots codex/copilot/gemini/opencode

### Testing
- **D-06:** Tạo test suite riêng `test/smoke-security-wire.test.js` kiểm tra: state-machine.md có pd:audit, what-next.md có ưu tiên 7.5, complete-milestone.md có security gate, snapshots đồng bộ

### Claude's Discretion
- Format chính xác của cảnh báo security gate trong complete-milestone
- Vị trí chèn ưu tiên 7.5 trong bảng ưu tiên what-next
- Cách mô tả pd:audit trong nhánh phụ state machine
- Snapshot sync strategy (copy nguyên hay chỉ sections liên quan)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Thiết kế gốc
- `4_AUDIT_MILESTONE.md` §"Tích hợp complete-milestone" (dòng ~105) — mô tả security gate
- `4_AUDIT_MILESTONE.md` §"Cập nhật what-next" (dòng ~144) — bảng ưu tiên 7.5
- `4_AUDIT_MILESTONE.md` §"State machine" — luồng trạng thái mới

### Files cần sửa
- `workflows/complete-milestone.md` — thêm security gate check vào Bước 2
- `workflows/what-next.md` — thêm ưu tiên 7.5 vào Bước 4 bảng ưu tiên
- `references/state-machine.md` — thêm pd:audit vào nhánh phụ
- `test/snapshots/codex/what-next.md` — sync what-next changes
- `test/snapshots/copilot/what-next.md` — sync what-next changes
- `test/snapshots/gemini/what-next.md` — sync what-next changes
- `test/snapshots/opencode/what-next.md` — sync what-next changes
- `test/snapshots/codex/complete-milestone.md` — sync gate changes
- `test/snapshots/copilot/complete-milestone.md` — sync gate changes
- `test/snapshots/gemini/complete-milestone.md` — sync gate changes (nếu có)
- `test/snapshots/opencode/complete-milestone.md` — sync gate changes

### Patterns to follow
- `bin/lib/resource-config.js` — AGENT_REGISTRY pattern (đã có pd-sec-fixer)
- `workflows/audit.md` — audit workflow tham chiếu
- `commands/pd/audit.md` — skill command tham chiếu

### Requirements
- `.planning/REQUIREMENTS.md` §"Tích hợp Ecosystem" — WIRE-01, WIRE-02, WIRE-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/complete-milestone.md` Bước 2: đã có pattern kiểm tra trạng thái (tasks ✅, TEST_REPORT) — thêm SECURITY_REPORT check tương tự
- `workflows/what-next.md` Bước 4: bảng ưu tiên 1-8 có sẵn — chèn 7.5 giữa 7 và 8
- `references/state-machine.md`: nhánh phụ đã có fix-bug, what-next, fetch-doc, update — thêm pd:audit theo pattern tương tự
- `bin/lib/utils.js`: có thể có helper functions cho state machine (cần kiểm tra)

### Established Patterns
- Snapshot sync: khi sửa workflow .md, phải sync sang 4 folders (codex/copilot/gemini/opencode)
- Guard pattern: `<guards>` section trong commands kiểm tra điều kiện tiên quyết
- Smoke test: `test/smoke-*.test.js` dùng node:test + node:assert/strict

### Integration Points
- `workflows/complete-milestone.md` Bước 2: chèn security gate check SAU kiểm tra tasks, TRƯỚC kiểm tra bugs
- `workflows/what-next.md` Bước 4 bảng: chèn row 7.5 giữa row 7 và row 8
- `references/state-machine.md` nhánh phụ: thêm bullet pd:audit
- `commands/pd/complete-milestone.md` `<guards>`: KHÔNG thêm guard ở đây vì gate là non-blocking (cảnh báo, không chặn)

</code_context>

<specifics>
## Specific Ideas

- Security gate check trong complete-milestone dùng glob pattern tương tự what-next: `.planning/milestones/[version]/SECURITY_REPORT.md`
- Cảnh báo gate nên rõ ràng với lựa chọn numbered: "(1) Chạy `/pd:audit` (2) Bỏ qua"
- State machine diagram dùng format text giống hiện tại (không Mermaid)
- Test suite mới kiểm tra nội dung file bằng grep/includes — không cần chạy workflow thật

</specifics>

<deferred>
## Deferred Ideas

- CI/CD integration: chạy audit trong pipeline — ngoài scope v4.0
- Configurable gate mode (blocking/non-blocking) — có thể thêm sau nếu user cần
- Auto-run pd:audit khi gần complete-milestone — quá intrusive

</deferred>

---

*Phase: 51-tich-hop-ecosystem*
*Context gathered: 2026-03-27*
