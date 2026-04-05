# Phase 7: Library Fallback and Version Detection - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Source:** Auto-generated (--auto mode, recommended defaults)

<domain>
## Phase Boundary

Library-aware generation works reliably even when Context7 is unavailable, and library versions are automatically detected from project manifests. Phase 6 established the standardized Context7 pipeline with hard-stop on failure — Phase 7 replaces that hard-stop with an intelligent fallback chain and adds version-aware queries.

</domain>

<decisions>
## Implementation Decisions

### Fallback chain (LIBR-02)
- **D-01:** Fallback order khi Context7 fail: (1) Project docs (.planning/docs/*.md từ /pd:fetch-doc), (2) Codebase examples (Grep/Read patterns trong code hiện có), (3) Training data (knowledge sẵn có của model). Thứ tự từ chính xác nhất → ít chính xác nhất.
- **D-02:** Mở rộng `references/context7-pipeline.md` thêm section fallback — KHÔNG tạo file mới. Pipeline hiện tại có "Xu ly loi" hard-stop 3 lựa chọn → thay bằng auto-fallback chain + transparency message.
- **D-03:** Fallback tự động — KHÔNG hỏi user ở mỗi bước. Thử tất cả nguồn rồi báo kết quả cuối cùng. Chỉ dừng khi KHÔNG nguồn nào có docs.
- **D-04:** Khi fallback đến training data (nguồn cuối), hiển thị warning: "⚠ Dùng knowledge sẵn, có thể không chính xác cho version hiện tại."
- **D-05:** Project docs fallback: tìm trong `.planning/docs/` folder (output của /pd:fetch-doc). Match tên thư viện với filename (e.g., `nestjs-guards.md` cho `@nestjs/common`).

### Version detection (LIBR-03)
- **D-06:** Detect version từ manifest files: `package.json` (Node.js), `pubspec.yaml` (Flutter), `composer.json` (PHP). Đọc file gần root nhất, parse tên thư viện → lấy version.
- **D-07:** Version info truyền vào `resolve-library-id` hoặc `query-docs` nếu Context7 hỗ trợ version parameter. Nếu không hỗ trợ: ghi nhận version cho transparency message.
- **D-08:** Monorepo support: nhiều `package.json` → ưu tiên file gần nhất với file đang sửa. Heuristic: `nest-cli.json` → backend package.json, `next.config.*` → frontend package.json. Giống logic hiện có trong `fetch-doc.md` Bước 1.
- **D-09:** Version detect thêm vào pipeline reference — thành bước "Bước 0: Version" trước resolve. KHÔNG tạo file mới.
- **D-10:** Không tìm thấy version → dùng "latest" và ghi note, KHÔNG dừng workflow.

### Transparency (LIBR-02 success criteria 3)
- **D-11:** Mỗi lần tra cứu thư viện, in 1 dòng ngắn: "[thư viện] v[version] — nguồn: Context7 | project docs | codebase | training data"
- **D-12:** Message tiếng Việt, nhất quán với style workflow hiện tại.

### Claude's Discretion
- Logic match tên thư viện với filename trong `.planning/docs/`
- Cách scan codebase examples (Grep patterns, import statements, etc.)
- Format chính xác của transparency message
- Thứ tự thử fallback sources trong codebase (import patterns vs usage patterns)
- Cách handle version range (^2.0.0) — có thể dùng range trực tiếp hoặc extract major version
- Testing strategy cho fallback scenarios

</decisions>

<specifics>
## Specific Ideas

- Pipeline hiện tại đã có structure rõ ràng (Bước 1: Resolve, Bước 2: Query, Xử lý lỗi) — thêm Bước 0 (Version) và mở rộng "Xử lý lỗi" thành fallback chain
- `/pd:fetch-doc` đã có logic version detection từ package.json (Bước 1) — tái sử dụng pattern đó
- `scan.md` đã có tech-stack detection patterns (NestJS, Flutter, WordPress) — tái sử dụng cho monorepo heuristic
- Guard `guard-context7.md` giữ nguyên — chỉ check kết nối, fallback xử lý ở pipeline level

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Context7 Pipeline (sẽ mở rộng)
- `references/context7-pipeline.md` — Pipeline chuẩn hiện tại, sẽ thêm version detect + fallback chain
- `references/guard-context7.md` — Guard check, giữ nguyên

### Version detection patterns (tham khảo)
- `commands/pd/fetch-doc.md` §Bước 1 — Logic detect version từ package.json, heuristic backend/frontend
- `workflows/scan.md` §Bước 1 — Tech-stack detection patterns (NestJS, Flutter, WordPress)
- `workflows/init.md` §Bước 2 — Tech-stack detection fallback patterns

### Prior phase decisions
- `06-CONTEXT.md` — Phase 6 decisions, đặc biệt D-10/D-11 (error handling) sẽ được thay thế bằng fallback chain
- `06-RESEARCH.md` — Phase 6 research, architecture analysis

### Test infrastructure
- `test/smoke-integrity.test.js` — Existing tests, sẽ thêm fallback + version tests

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fetch-doc.md` Bước 1: Version detection logic từ package.json — pattern sẵn có, tái sử dụng
- `scan.md` tech-stack patterns: NestJS (`nest-cli.json`), Flutter (`pubspec.yaml`), WordPress (`wp-config.php`)
- `.planning/docs/` folder: output của /pd:fetch-doc — fallback source 1

### Established Patterns
- `context7-pipeline.md` format: ngắn gọn, tiếng Việt không dấu, numbered steps
- Guard files: 1-2 dòng checklist, không nhồi logic
- @references/ inlining từ workflow files
- Smoke tests trong `test/smoke-integrity.test.js`: file existence + content pattern checks

### Integration Points
- `references/context7-pipeline.md` — mở rộng thêm 2 sections (version detect + fallback)
- `workflows/*.md` (5 files) — KHÔNG cần sửa nếu pipeline reference không đổi @reference path
- `test/smoke-integrity.test.js` — thêm tests cho version detection + fallback content

</code_context>

<deferred>
## Deferred Ideas

- Context7 version-specific queries (nếu Context7 API hỗ trợ version filter trong tương lai)
- Auto-update project docs khi phát hiện version thay đổi
- Fallback metrics/telemetry (đếm bao nhiêu lần dùng fallback)

</deferred>

---

*Phase: 07-library-fallback-and-version-detection*
*Context gathered: 2026-03-22 via --auto mode*
