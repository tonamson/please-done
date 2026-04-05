# Phase 50: POC & Fix Phases - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Findings nghiêm trọng có bằng chứng khai thác cụ thể (POC) và fix phases tự động theo thứ tự ưu tiên. Phase này hoàn thiện 3 component còn thiếu: POC pipeline khi --poc, Gadget Chain cross-category analysis, và tự động tạo fix phases decimal với SEC-VERIFY cuối cùng. Đồng thời thay thế stub B8 "Fix routing" trong audit.md.

</domain>

<decisions>
## Implementation Decisions

### POC Pipeline
- **D-01:** POC được tạo BÊN TRONG scanner (pd-sec-scanner). Khi --poc flag active và scanner phát hiện FLAG/FAIL, scanner tự viết POC section ngay trong evidence file. Không cần agent riêng cho POC
- **D-02:** POC output nằm trong evidence file — thêm section `## POC` vào evidence_sec_{cat}.md ngay sau findings. Mọi thứ 1 file, dễ truy vết
- **D-03:** POC CHỈ được tạo khi user truyền --poc flag. Default audit không tạo POC — tiết kiệm token
- **D-04:** Mức độ chi tiết POC: mô tả khai thác bằng text — input vector, payload mẫu, bước tái hiện, kết quả dự kiến. KHÔNG tạo script chạy thật

### Gadget Chain
- **D-05:** Gadget Chain phát hiện trong Reporter B6. Reporter đã đọc tất cả evidence — thêm logic cross-reference tìm chain tại đây. Không cần agent/bước riêng
- **D-06:** Logic phát hiện chain: rule-based patterns. Dựng sẵn các chain templates phổ biến (IDOR+privesc, SQLi+data_leak, XSS+CSRF...) trong YAML. Match findings vào template. Dự đoán, nhanh, ít token
- **D-07:** Severity escalation: khi phát hiện gadget chain, severity tổng hợp = max(individual) + 1 bậc. VD: 2 HIGH → chain CRITICAL. Cap tại CRITICAL (không vượt)

### Fix Phases tự động
- **D-08:** Fix phases trigger: KHI USER APPROVE. Sau audit xong, hiển thị danh sách findings + gợi ý fix phases. User chọn "tạo fix phases" thì mới tạo vào ROADMAP. Không tự ý sửa roadmap
- **D-09:** Priority order: gadget chain ngược. Fix từ gốc chain trước (VD: fix SQLi trước khi fix data leak). Khi gốc được vá, các mắt xích sau có thể tự hết
- **D-10:** Fix phases dùng numbering decimal: N.1, N.2... trong đó N = phase audit hiện tại
- **D-11:** Template security-fix-phase.md: trích dẫn evidence gốc, hướng sửa cụ thể (từ security-rules.yaml fixes), tiêu chí hoàn thành rõ ràng

### SEC-VERIFY
- **D-12:** SEC-VERIFY = re-audit chỉ files đã fix. Dùng session-delta (Phase 49) để chỉ scan lại files đã sửa. Tiết kiệm token, tận dụng delta-aware
- **D-13:** SEC-VERIFY là fix phase cuối cùng trong chuỗi decimal — VD: nếu có 50.1, 50.2 fix thì 50.3 là SEC-VERIFY

### B8 Stub thay thế
- **D-14:** B8 dùng agent riêng pd-sec-fixer. Spawn agent sau khi có SECURITY_REPORT.md để phân tích findings và tạo fix phases proposal
- **D-15:** pd-sec-fixer nhận input: SECURITY_REPORT.md + evidence files + gadget chains. Output: danh sách fix phases đề xuất với priority order. Chế độ tích hợp: hỏi user approve rồi insert vào ROADMAP. Chế độ độc lập: chỉ in gợi ý trong report

### Claude's Discretion
- Chi tiết gadget chain templates trong YAML — researcher quyết định patterns phổ biến nào cần cover
- Cách pd-sec-fixer tương tác với ROADMAP.md API (gsd-tools insert-phase hoặc manual)
- Format chính xác của section ## POC trong evidence
- Cách SEC-VERIFY so sánh kết quả trước/sau fix

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit Workflow
- `workflows/audit.md` — Workflow 9 bước, B8 là stub cần thay thế
- `workflows/audit.md` §B2 — Delta-aware logic (Phase 49), pattern tương tự cho B8

### Security Rules & Config
- `references/security-rules.yaml` — Rules per category, severity levels, fixes suggestions (dùng cho POC + fix template)
- `bin/lib/resource-config.js` — AGENT_REGISTRY, agent tier/model mapping (cần đăng ký pd-sec-fixer)

### Existing Modules (patterns to follow)
- `bin/lib/session-delta.js` — Pure function module pattern (Phase 49), SEC-VERIFY sẽ dùng classifyDelta
- `bin/lib/smart-selection.js` — Pure function module pattern (Phase 48)
- `bin/lib/parallel-dispatch.js` — buildScannerPlan, mergeParallelResults
- `bin/lib/evidence-protocol.js` — Evidence parsing, validation

### Evidence Format
- `.planning/phases/48-evidence-smart-selection/48-CONTEXT.md` — D-07 Function Checklist format, D-08 verdict types

### Templates
- `templates/` — Existing GSD templates, pattern for security-fix-phase.md

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/session-delta.js`: classifyDelta() cho SEC-VERIFY — đã có sẵn delta-aware logic
- `bin/lib/evidence-protocol.js`: parseEvidence() để đọc evidence files
- `bin/lib/parallel-dispatch.js`: mergeParallelResults() cho gadget chain analysis input
- `bin/lib/resource-config.js`: getAgentConfig() pattern để đăng ký pd-sec-fixer
- `references/security-rules.yaml`: fixes suggestions per category — input cho fix template

### Established Patterns
- Agent template pattern: `agents/pd-sec-scanner.md` — template cho pd-sec-fixer
- Pure function modules: session-delta.js, smart-selection.js — pattern cho gadget chain logic
- YAML config: security-rules.yaml — pattern cho gadget chain templates

### Integration Points
- `workflows/audit.md` B8: stub cần thay thế bằng pd-sec-fixer dispatch
- `--poc` flag: đã parse trong B3 nhưng báo "chưa hỗ trợ" — cần bỏ thông báo và truyền cho scanners
- `--auto-fix` flag: vẫn giữ "chưa hỗ trợ" (không trong scope Phase 50)
- ROADMAP.md: fix phases decimal cần insert API hoặc manual edit

</code_context>

<specifics>
## Specific Ideas

- Gadget chain templates nên cover ít nhất: SQLi→data_leak, IDOR→privesc, XSS→session_hijack, cmd_injection→RCE
- Fix phases decimal numbering (50.1, 50.2...) theo pattern GSD đã có cho gap-closure phases
- pd-sec-fixer là agent mới — cần đăng ký trong AGENT_REGISTRY với tier phù hợp (architect/Opus vì cần phân tích complex)

</specifics>

<deferred>
## Deferred Ideas

- `--auto-fix`: tự sửa code trực tiếp — đã reject (AUTOFIX-01), giữ stub
- Interactive fix mode: user chọn từng finding để fix — có thể thêm sau
- CI/CD integration: chạy audit trong pipeline — thuộc Phase 51

</deferred>

---

*Phase: 50-poc-fix-phases*
*Context gathered: 2026-03-26*
