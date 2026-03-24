# Phase 6: Context7 Standardization - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Every skill that generates code using external libraries follows a consistent Context7 pipeline, eliminating hallucinated API calls. This phase standardizes the Context7 integration pattern across the 5 skills that use external libraries, creates a shared reference file for the pipeline, and upgrades the guard to verify Context7 actually works.

</domain>

<decisions>
## Implementation Decisions

### Phạm vi skill
- **D-01:** Chỉ 5 skill cần Context7: write-code, plan, new-milestone, fix-bug, test. 7 skill còn lại (scan, init, fetch-doc, update, complete-milestone, conventions, what-next) không thêm vì không viết code dùng thư viện ngoài.
- **D-02:** Refactor cả 5 skill hiện tại cho pattern thống nhất — hiện tại mỗi skill viết khác nhau (write-code chi tiết, fix-bug sơ sài).

### Template và tổ chức
- **D-03:** Tạo `references/context7-pipeline.md` chứa pattern chuẩn. Guard (`guard-context7.md`) giữ nguyên vai trò guard check, không nhồi logic pipeline vào.
- **D-04:** Pattern chuẩn trong reference gồm: 2-step invocation (resolve-library-id → query-docs) + trigger rules + error handling cơ bản.

### Quy tắc kích hoạt
- **D-05:** Luôn tự động — bất kỳ task nào liên quan thư viện ngoài → Context7 tự động, không cần user yêu cầu.
- **D-06:** plan và new-milestone dùng Context7 để research API/docs thư viện, đảm bảo plan dựa trên API thực không hallucinate.
- **D-07:** Bỏ rule đặc thù stack (antd=bắt buộc, auth=bắt buộc) khỏi workflow. Đã "luôn tự động" thì mọi thư viện ngoài đều bắt buộc — không cần case-by-case.
- **D-08:** Nhiều thư viện trong cùng 1 task → resolve-library-id tất cả trước, query-docs sau. Hiệu quả hơn tuần tự từng cái.

### Guard và xử lý lỗi
- **D-09:** Guard mở rộng — ngoài check kết nối MCP, thử resolve 1 library (ví dụ "react" hoặc library từ project) để xác nhận Context7 thực sự hoạt động.
- **D-10:** Context7 lỗi hoặc không có → dừng task và báo user quyết định. Không âm thầm tiếp tục.
- **D-11:** Khi dừng, đưa 3 lựa chọn: (1) Tiếp tục không docs — chấp nhận rủi ro API sai, (2) Dừng, sửa Context7 rồi chạy lại, (3) Dùng /pd:fetch-doc tải docs thủ công.
- **D-12:** Message lỗi/warning viết tiếng Việt, nhất quán với style workflow hiện tại.

### Claude's Discretion
- Nội dung chính xác của `references/context7-pipeline.md` — cấu trúc, format, ví dụ
- Cách refactor Context7 sections trong 5 workflow files để @reference pipeline mới
- Cách guard thử resolve library — chọn library nào để test, xử lý timeout
- Logic phát hiện "task liên quan thư viện ngoài" vs "task nội bộ"
- Testing strategy cho việc verify Context7 pattern có đúng trong mỗi skill

</decisions>

<specifics>
## Specific Ideas

- write-code hiện có pattern chi tiết nhất (Bước 3) — dùng làm source of truth khi tạo reference
- fix-bug hiện có pattern đơn giản nhất ("Lỗi liên quan thư viện → Context7") — cần upgrade nhiều nhất
- Pattern multi-lib (resolve all → query all) có thể viết thành ví dụ cụ thể trong reference

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skills (target files)
- `commands/pd/write-code.md` — Skill có Context7 chi tiết nhất, dùng làm reference
- `commands/pd/plan.md` — Skill có Context7 cho research
- `commands/pd/new-milestone.md` — Skill có Context7 cho stack research
- `commands/pd/fix-bug.md` — Skill có Context7 sơ sài nhất, cần refactor nhiều
- `commands/pd/test.md` — Skill có Context7 nhưng workflow không rõ trigger

### Workflows (Context7 sections)
- `workflows/write-code.md` §Bước 3 — Pattern chi tiết nhất hiện tại (lines 126-137)
- `workflows/plan.md` §Bước 3B — Context7 trong planning (line 103)
- `workflows/fix-bug.md` §Bước 4 — Context7 cho library bugs (line 92)
- `workflows/new-milestone.md` §Bước 4.5 — Context7 cho stack research (line 389+)

### Guard và reference hiện tại
- `references/guard-context7.md` — Guard hiện tại (1 dòng), cần mở rộng
- `references/conventions.md` — Conventions reference, có thể cần thêm Context7 conventions

### Prior phase decisions
- `05-CONTEXT.md` §Effort routing — effort level routing (D-06: routing applies to write-code, fix-bug, test)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `guard-context7.md` — Guard hiện tại, sẽ mở rộng thêm kiểm tra hoạt động
- Pattern 2-step trong write-code Bước 3 — template cho reference file mới
- Converter logic trong `bin/lib/converters/copilot.js` — đã handle `mcp__context7__*` → `io.github.upstash/context7/*`

### Established Patterns
- 5 skill đều khai báo `mcp__context7__resolve-library-id` + `mcp__context7__query-docs` trong allowed-tools
- Guard files được @reference trong `<guards>` section của mỗi skill
- Reference files được @reference trong `<conditional_reading>` hoặc `<required_reading>` của workflow
- Vietnamese text convention cho workflow instructions

### Integration Points
- `commands/pd/*.md` — 5 skill files cần update allowed-tools và guards section
- `workflows/*.md` — 4 workflow files cần refactor Context7 sections để @reference pipeline mới
- `references/` — Tạo file mới context7-pipeline.md
- `references/guard-context7.md` — Mở rộng guard
- `test/smoke-integrity.test.js` — Cần test verify Context7 pattern có trong đúng skills

</code_context>

<deferred>
## Deferred Ideas

- Fallback chain khi Context7 fail (Phase 7: LIBR-02) — Phase 6 chỉ dừng và báo user, Phase 7 sẽ auto-fallback
- Auto-detect library versions từ package.json (Phase 7: LIBR-03)
- Thêm Context7 vào 7 skill còn lại — không cần vì không viết code dùng thư viện

</deferred>

---

*Phase: 06-context7-standardization*
*Context gathered: 2026-03-22*
