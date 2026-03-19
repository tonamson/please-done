# Hướng dẫn tích hợp Stack mới vào Please Done

Tài liệu này hướng dẫn quy trình tích hợp 1 stack mới (VD: Flutter, Laravel, Go, Rust...) vào bộ skills Please Done.

**Input**: File `.skill` hoặc `.md` chứa coding standards — có thể generate từ Claude Chat, tài liệu nội bộ, hoặc viết tay.

**Output**: Stack mới được tích hợp đầy đủ vào workflow 11 skills + 5 installers + README + AUDIT_CHECKLIST + eval tests.

**Thời gian ước tính**: 30-60 phút (tùy độ phức tạp stack).

---

## Mục lục

- [Phase 1: Chuẩn bị file rules](#phase-1-chuẩn-bị-file-rules)
- [Phase 2: Cập nhật 8 skill files](#phase-2-cập-nhật-8-skill-files)
- [Phase 3: Cập nhật hạ tầng](#phase-3-cập-nhật-hạ-tầng)
- [Phase 4: Validation](#phase-4-validation)
- [Phase 5: Version bump + Commit](#phase-5-version-bump--commit)
- [Tham khảo: Cấu trúc rules file chuẩn](#tham-khảo-cấu-trúc-rules-file-chuẩn)
- [Tham khảo: Ví dụ .skill input → rules output](#tham-khảo-ví-dụ-skill-input--rules-output)

---

## Phase 1: Chuẩn bị file rules

### 1.1. Chuyển đổi .skill → rules/[stack].md

File `.skill` từ Claude Chat thường có dạng tự do. Cần chuyển sang format chuẩn của Please Done rules.

**Format chuẩn rules file** (xem chi tiết ở cuối tài liệu):

```markdown
# Quy tắc [Stack] ([Framework])

## Code style
(Conventions KHÁC general.md — VD: indent, naming, file naming)
(Ghi rõ "Ngoại lệ cho general.md: ..." nếu khác)

## Cấu trúc dự án
(Folder structure, file conventions)

## [Sections đặc thù stack]
(VD: Components, Routing, State management, API layer...)

## Bảo mật (BẮT BUỘC)
(Security rules cho stack)

## Build & Lint
(Lệnh lint + build + detect thư mục)

## Tham khảo chi tiết
(Pointer tới -refs/ nếu có)
```

**Checklist chuyển đổi:**

- [ ] Mọi convention KHÁC `general.md` → ghi **explicit exception** + lý do
- [ ] Mọi rule "BẮT BUỘC" → có code example minh họa
- [ ] Mọi API/function name → verify tồn tại trong library version target
- [ ] Section **Build & Lint** BẮT BUỘC — skills dùng section này để chạy lint/build
- [ ] Section **Detect thư mục** BẮT BUỘC — ghi Glob pattern nhận diện (VD: `**/pubspec.yaml` cho Flutter)
- [ ] File nhạy cảm stack-specific (nếu có) → liệt kê rõ (VD: `.env.local` cho Laravel)

Lưu file tại: `commands/pd/rules/[stack].md`

### 1.2. Tạo -refs/ (tuỳ chọn — chỉ khi stack phức tạp)

Nếu stack cần reference docs chi tiết (templates, checklists, patterns) → tạo thư mục:

```
commands/pd/rules/[stack]-refs/
├── [topic-1].md
├── [topic-2].md
└── ...
```

**Lưu ý quan trọng cho -refs/ files:**
- KHÔNG chứa pattern `/pd:` (sẽ bị command ref replacement)
- Nếu có code examples dùng từ trùng tool names (`Read`, `Write`, `Edit`, `Bash`...) → OK, installers đã skip tool replacement cho -refs/ dirs
- CHỈ dùng tiếng Anh cho code examples, tiếng Việt cho giải thích

### 1.3. Xác định detection patterns

Mỗi stack cần **ít nhất 1 primary + 1 fallback** detection pattern:

| Stack | Primary | Fallback(s) |
|---|---|---|
| NestJS | `**/nest-cli.json` | `**/app.module.ts`, `**/main.ts` + Grep `NestFactory` |
| NextJS | `**/next.config.*` | `**/vite.config.*`, nhiều files `.tsx/.jsx` |
| WordPress | `**/wp-config.php` | `**/wp-content/plugins/*/`, `**/wp-content/themes/*/style.css` |
| Solidity | `**/hardhat.config.*` | `**/foundry.toml`, `**/contracts/**/*.sol` |
| **[Stack mới]** | **[?]** | **[?]** |

VD Flutter: Primary `**/pubspec.yaml` + Grep `flutter` | Fallback: `**/lib/main.dart`
VD Laravel: Primary `**/artisan` | Fallback: `**/composer.json` + Grep `laravel/framework`

Ghi nhận: `has[Stack] = true` flag name + detection patterns → dùng ở Phase 2.

---

## Phase 2: Cập nhật 8 skill files

Quy ước trong hướng dẫn:
- `[stack]` = tên viết thường (flutter, laravel, go...)
- `[Stack]` = tên viết hoa đầu (Flutter, Laravel, Go...)
- `has[Stack]` = biến detection flag (hasFlutter, hasLaravel...)
- `[ext]` = file extension (dart, php, go...)
- Tìm **anchor pattern** → chèn **SAU** dòng đó

### 2.1. init.md (7 điểm chỉnh sửa)

**① `<context>` — danh sách rules (sau dòng `solidity.md`)**
```
Anchor: - `solidity.md` — quy tắc Solidity smart contract (chỉ copy nếu có Solidity)
Thêm:  - `[stack].md` — quy tắc [Stack] (chỉ copy nếu có [Stack])
```

**② Bước 3 — Glob file extensions (dòng chứa `.sol,html}`)**
```
Anchor: Glob `**/*.{ts,tsx,js,jsx,py,php,sol,html}`
Sửa:   Glob `**/*.{ts,tsx,js,jsx,py,php,sol,[ext],html}`
```

**③ Bước 3 — Glob excludes (nếu stack có build output dirs)**
```
Anchor: trừ node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache
Thêm:   [build-dir] vào danh sách excludes (VD: `build` cho Flutter, `vendor` cho Laravel)
```

**④ Bước 4 — Detection patterns (sau block Solidity detection)**
```
Anchor dòng: - Nếu hasSolidity = true: `hasBackend` và `hasFrontend` giữ nguyên
Thêm:
- Glob `**/[primary-detection-file]` → **has[Stack] = true**
- Fallback [Stack]: Glob `**/[fallback-file]` → **has[Stack] = true**
- Nếu has[Stack] = true: `hasBackend` và `hasFrontend` giữ nguyên ([Stack] project có thể kết hợp NestJS API hoặc React frontend)
```

**⑤ Bước 6 — Copy rules (2 chỗ)**

Delete list:
```
Anchor: **Chỉ xóa các files template**: `general.md`, `backend.md`, `frontend.md`, `wordpress.md`, `solidity.md`.
Sửa:   Thêm `, [stack].md` vào danh sách
```

Copy condition (sau dòng `hasSolidity`):
```
Anchor: - **Nếu hasSolidity = true**: copy `solidity.md` + copy thư mục...
Thêm:   - **Nếu has[Stack] = true**: copy `[stack].md`
         (Nếu có -refs/) + copy thư mục `[SKILLS_DIR]/commands/pd/rules/[stack]-refs/` → `.planning/docs/[stack]/`
```

**⑥ Bước 8 — Notification box (2 chỗ)**

Rules list:
```
Anchor: ║   - solidity.md (nếu có)            ║
Thêm:   ║   - [stack].md (nếu có)             ║
```

Docs list (chỉ nếu có -refs/):
```
Anchor: ║   - solidity/ (nếu có Solidity)     ║
Thêm:   ║   - [stack]/ (nếu có [Stack])       ║
```

**⑦ `<rules>` section (2 chỗ)**

Detection flag:
```
Anchor: Chỉ copy rules files phù hợp với tech stack detected (hasBackend/hasFrontend/hasWordPress/hasSolidity)
Sửa:   Thêm /has[Stack] vào danh sách
```

Copy rule (nếu có -refs/):
```
Anchor: - Nếu hasSolidity = true: copy `solidity.md` vào `.planning/rules/` + copy `solidity-refs/` vào `.planning/docs/solidity/`
Thêm:   - Nếu has[Stack] = true: copy `[stack].md` vào `.planning/rules/` + copy `[stack]-refs/` vào `.planning/docs/[stack]/`
```

### 2.2. scan.md (5 điểm chỉnh sửa)

**① Bước 2 — Glob file extensions + excludes**
```
Anchor: Glob `**/*.{ts,tsx,js,jsx,py,php,sol,html}`
Sửa:   Thêm ,[ext] (VD: ,dart cho Flutter)
```

Nếu stack có build output dirs → thêm vào excludes (PHẢI khớp init.md Bước 3):
```
Anchor: trừ node_modules, .venv, .planning, wp-includes, wp-admin, artifacts, cache
Sửa:   Thêm , [build-dir] (VD: build cho Flutter, vendor cho Laravel)
```

**② Bước 2a — Thêm scan section (sau Solidity scan section)**
```
Anchor: - Security patterns: Grep `nonReentrant|whenNotPaused|onlyOwner` (glob: `*.sol`)

Thêm:
  **[Stack]:** (CHỈ quét nếu tồn tại `**/[detection-file]` hoặc `**/[fallback-file]`)
  - [Pattern 1]: Grep `[pattern]` (glob: `*.[ext]`) → [mô tả]
  - [Pattern 2]: Grep `[pattern]` (glob: `*.[ext]`) → [mô tả]
  ...
```

**QUAN TRỌNG**: Mọi Grep pattern PHẢI có `(glob: "*.[ext]")` filter.

**③ Bước 5 — SCAN_REPORT template (sau ## Phân tích Solidity)**
```
Anchor: (sau toàn bộ block ## Phân tích Solidity ... ### Events)

Thêm:
## Phân tích [Stack]
(CHỈ tạo nếu project có [Stack] — kiểm tra bằng `[detection patterns]`)

### [Subsection 1]
| Cột 1 | Cột 2 | Cột 3 |

### [Subsection 2]
...
```

**④ Bước 6 — Re-copy rules (2 chỗ)**

Flag list:
```
Anchor: So sánh hasBackend/hasFrontend/hasWordPress/hasSolidity mới
Sửa:   Thêm /has[Stack]
```

Copy/xóa condition (nếu có -refs/):
```
Anchor: - Nếu hasSolidity thay đổi: copy/xóa `solidity-refs/` → `.planning/docs/solidity/` tương ứng
Thêm:   - Nếu has[Stack] thay đổi: copy/xóa `[stack]-refs/` → `.planning/docs/[stack]/` tương ứng
```

Delete list:
```
Anchor: `general.md`, `backend.md`, `frontend.md`, `wordpress.md`, `solidity.md`. Giữ nguyên files custom
Sửa:   Thêm `, [stack].md`
```

**⑤ `<rules>` section**
```
Anchor: - Phân tích Solidity CHỈ khi detect được (...)
Thêm:   - Phân tích [Stack] CHỈ khi detect được (`**/[detection-patterns]`) — [mô tả ngắn quét gì]
```

### 2.3. plan.md (2 điểm chỉnh sửa)

**① `<context>` — đọc rules theo stack**
```
Anchor: `.planning/rules/wordpress.md` và/hoặc `.planning/rules/solidity.md`
Sửa:   Thêm và/hoặc `.planning/rules/[stack].md`
```

**② Bước 4 — Design section (sau block Solidity, TRƯỚC "Stack khác")**
```
Anchor: - Tham khảo `.planning/docs/solidity/templates.md` cho base patterns

Thêm:
**[Stack] (nếu có — đọc CONTEXT.md xác định framework: [frameworks]):**
- [Design concern 1] (VD: Widget architecture cho Flutter)
- [Design concern 2] (VD: Route structure)
- [Design concern 3] (VD: State management approach)
- [≥3 design concerns cụ thể cho stack]
- (Nếu có -refs/) Tham khảo `.planning/docs/[stack]/[file].md` cho [mô tả]
```

**Lưu ý**: Stack phức tạp (>5 concerns) → tạo design section riêng, KHÔNG dùng "Stack khác" chung.

### 2.4. write-code.md (7 điểm chỉnh sửa)

**① `<context>` — đọc rules + docs (sau dòng solidity.md)**
```
Anchor: `.planning/rules/solidity.md` → quy tắc Solidity...
Thêm:   - `.planning/rules/[stack].md` → quy tắc [Stack] (đọc khi task [Stack], CHỈ nếu file tồn tại). Tra cứu `.planning/docs/[stack]/*.md` cho patterns phức tạp
```

**② Bước 4 — General exceptions (CHỈ nếu stack có ngoại lệ)**

Nếu stack có doc comment language khác (VD: Solidity NatSpec English):
```
Anchor: **JSDoc + Logger + Comments** → TIẾNG VIỆT CÓ DẤU (ngoại lệ: Solidity NatSpec dùng tiếng Anh — xem solidity.md)
Sửa:   Thêm ngoại lệ: , [Stack] [loại comment] dùng [ngôn ngữ] — xem [stack].md
```

Nếu stack có file limit khác default 300/500:
```
Anchor: **Giới hạn file**: mục tiêu 300 dòng, BẮT BUỘC tách >500 (Solidity: 500/800 — xem solidity.md)
Sửa:   Thêm , [Stack]: [X]/[Y] — xem [stack].md
```

**③ Bước 4 — Coding instructions (sau block Solidity, TRƯỚC "Nếu task stack khác")**
```
Anchor: - Test: `npx hardhat test` (Hardhat) hoặc `forge test` (Foundry)

Thêm:
**Nếu task [Stack] ([framework]):**
- Tuân thủ quy tắc trong `.planning/rules/[stack].md`
- [BẮT BUỘC rule 1 — tóm tắt từ rules file]
- [BẮT BUỘC rule 2]
- ...
- Tra cứu `.planning/docs/[stack]/[file].md` cho [mô tả] (nếu có -refs/)
- Tra cứu Context7 (`[library-name]`) cho API cụ thể
- Build: `[build command]`
- Test: `[test command]`
```

**④ Bước 5 — Build & Lint reference**
```
Anchor: (backend.md/frontend.md/wordpress.md/solidity.md): đọc mục **Build & Lint**
Sửa:   Thêm /[stack].md vào danh sách
```

**⑤ Bước 6 — CODE_REPORT template (nếu stack có output format riêng)**
```
Anchor: ## Contract Functions (nếu có — Solidity)
Thêm:   ## [Section Name] (nếu có — [Stack])
         | [Cột phù hợp] |
```

VD Flutter: `## Screens & Widgets (nếu có — Flutter)` | VD Laravel: `## Routes & Controllers (nếu có — Laravel)`

**⑥ Rules file list trong parallel agent + `<rules>` (2 chỗ)**

Parallel agent spawn:
```
Anchor: Rules files phù hợp (general + backend/frontend/wordpress/solidity theo Loại task)
Sửa:   Thêm /[stack] vào danh sách
```

`<rules>` section:
```
Anchor: Tuân thủ toàn bộ quy tắc trong `.planning/rules/` (general + backend/frontend/wordpress/solidity theo Loại task)
Sửa:   Thêm /[stack] vào danh sách
```

**⑦ Test suggestion condition (3 chỗ — CHỈ khi stack có automated test)**

Bước 1 — khi tất cả tasks ✅:
```
Anchor: gợi ý: `/pd:test` (nếu có Backend NestJS, WordPress, hoặc Solidity)
Sửa:   Thêm , [Stack]
```

Bước 10 parallel ending — notification box:
```
Anchor: /pd:test              → Kiểm thử (NestJS/WP/Sol)
Sửa:   /pd:test              → Kiểm thử (NestJS/WP/Sol/[Abbr])
```

Bước 10 default mode ending:
```
Anchor: CHỈ gợi ý nếu CONTEXT.md có Backend NestJS, WordPress, hoặc Solidity
Sửa:   Thêm , [Stack]
```

### 2.5. fix-bug.md (3 điểm chỉnh sửa)

**① `<context>` — đọc rules**
```
Anchor: `backend.md` hoặc `frontend.md` hoặc `wordpress.md` hoặc `solidity.md`
Sửa:   Thêm hoặc `[stack].md`
```

**② Bước 5 — Trace path (sau block Solidity, TRƯỚC "Chung:")**
```
Anchor: - Tra cứu `.planning/docs/solidity/templates.md` cho pattern reference

Thêm:
**Nếu lỗi [Stack] ([Framework]):**
- Trace luồng: [input] → [logic layer] → [state/data] → [output]
- Kiểm tra: [common bug patterns cho stack]
- (Nếu có -refs/) Tra cứu `.planning/docs/[stack]/[file].md` cho [mô tả]
```

**③ Bước 7 — Lint reference + test file pattern**
```
Anchor: `backend.md` hoặc `frontend.md` hoặc `wordpress.md` hoặc `solidity.md` → mục **Build & Lint**
Sửa:   Thêm hoặc `[stack].md`

Anchor: `.spec.ts` (NestJS) hoặc `test-*.php` (WordPress) hoặc `test/*.ts`/`test/*.t.sol` (Solidity)
Sửa:   Thêm hoặc `[test-file-pattern]` ([Stack])
```

### 2.6. test.md (5 điểm chỉnh sửa — CHỈ nếu stack có automated test)

Nếu stack KHÔNG có automated test support → bỏ qua section này.

**① `<context>` — đọc rules theo stack (sau dòng solidity.md)**
```
Anchor: `.planning/rules/solidity.md` → quy tắc Solidity + Build & Lint (CHỈ nếu file tồn tại, đọc khi Solidity flow)
Thêm:   - `.planning/rules/[stack].md` → quy tắc [Stack] + Build & Lint (CHỈ nếu file tồn tại, đọc khi [Stack] flow)
```

**② Bước 1 — Flow routing (sau block Solidity, TRƯỚC "Nếu framework khác")**
```
Anchor: 7. Phần còn lại (report, bug, commit) — nhảy thẳng Bước 7 (TEST_REPORT) bên dưới
  (dòng cuối của Solidity block)

Thêm:
- **Nếu [Stack]** → chuyển sang flow [Test Framework]:
  1. Kiểm tra [test framework] đã cài
  2. (Nếu có -refs/) Đọc `.planning/docs/[stack]/[file].md` để lấy test patterns
  3. Viết test files `[test-file-pattern]`
  4. Chạy: `[test command]`
  5. **Test bắt buộc**:
     - [Mandatory test type 1]
     - [Mandatory test type 2]
     - ...
  6. Hiển thị kết quả → yêu cầu user xác nhận
  7. Phần còn lại — nhảy thẳng Bước 7 (TEST_REPORT) bên dưới
```

**③ "Nếu framework khác" message — cập nhật danh sách stacks**
```
Anchor: "Hiện `/pd:test` chỉ hỗ trợ tự động hóa test cho NestJS, WordPress, và Solidity.
Sửa:   Thêm , [Stack] vào danh sách
```

**④ TEST_REPORT template — test framework name**
```
Anchor: ## Kết quả tự động ([Jest|PHPUnit|Hardhat|Foundry])
Sửa:   Thêm |[TestFramework] (VD: |FlutterTest)
```

**⑤ `<rules>` — test file convention**
```
Anchor: Solidity: `test/*.ts` (Hardhat) hoặc `test/*.t.sol` (Foundry)
Sửa:   Thêm , [Stack]: `[test-file-pattern]` ([TestFramework])
```

### 2.7. what-next.md (2 điểm chỉnh sửa — CHỈ nếu stack có automated test)

**① Bước 3.5 — TEST_REPORT condition**
```
Anchor: CHỈ nếu project có Backend NestJS, WordPress, hoặc Solidity trong CONTEXT.md
Sửa:   Thêm , [Stack]
```

**② Ưu tiên 6 — Test condition**
```
Anchor: CHỈ áp dụng khi project có (Backend NestJS HOẶC WordPress HOẶC Solidity)
Sửa:   Thêm HOẶC [Stack]
```

### 2.8. complete-milestone.md (3 điểm chỉnh sửa)

**① MILESTONE_COMPLETE template (nếu stack cần section riêng)**
```
Anchor: ## WordPress
        | Plugin/Theme | Chức năng chính | Hooks | Custom Tables |

Thêm:
## [Stack Section Name]
| [Cột phù hợp] |
```

**② Comment "CHỈ tạo sections có dữ liệu"**
```
Anchor: > CHỈ tạo sections có dữ liệu. Bỏ 'Tổng hợp API' nếu không có backend. Bỏ 'Smart Contracts' nếu không có Solidity. Bỏ 'WordPress' nếu không có WordPress.
Sửa:   Thêm Bỏ '[Stack Section]' nếu không có [Stack].
```

**③ TEST_REPORT check — CHỈ nếu stack có automated test**
```
Anchor: CHỈ kiểm tra nếu project có Backend NestJS, WordPress, hoặc Solidity
Sửa:   Thêm , [Stack] (ở CẢ 3 chỗ: dòng kiểm tra, dòng "VÀ có TEST_REPORT", dòng "KHÔNG có")
```

---

## Phase 3: Cập nhật hạ tầng

### 3.1. general.md (nếu cần)

Chỉ cập nhật nếu stack mới có conventions KHÁC default:

- [ ] **Code style**: nếu indent/naming khác → thêm dòng `[Stack] theo rules riêng trong [stack].md`
- [ ] **Security list**: nếu có file nhạy cảm stack-specific → thêm vào danh sách dòng 55
- [ ] **File line limits**: nếu stack cần giới hạn khác 300/500

**QUAN TRỌNG**: Nếu thêm file nhạy cảm vào security list → PHẢI cập nhật ở TẤT CẢ skills có `<rules>` security (xem Section E4 trong AUDIT_CHECKLIST.md).

### 3.2. README.md (4 điểm chỉnh sửa)

**① Bảng Rules** (sau row `rules/solidity-refs/`):
```markdown
| `rules/[stack].md`    | Có [Stack] | [Mô tả ngắn nội dung rules] |
| `rules/[stack]-refs/` | Có [Stack] | [N] tài liệu tham khảo: [danh sách topics] |
```

**② Cây `.planning/`** — thêm vào rules section:
```
│   ├── [stack].md                # Quy ước [Stack] (nếu có [Stack])
```

Và docs section (nếu có -refs/):
```
│   ├── [stack]/                  # Tài liệu tham khảo [Stack] (nếu có [Stack])
```

**③ Bảng Tech Stack** — thêm row:
```markdown
| [Loại] | [Framework] | [Database nếu có] | `[detection patterns]` |
```

**④ Commit format** — thêm test file pattern nếu khác:
```markdown
| `[KIỂM THỬ]` | test | Thêm file kiểm thử (..., [test-file-pattern]) |
```

### 3.3. AUDIT_CHECKLIST.md (3 điểm chỉnh sửa)

Checklist audit cũng cần cập nhật để future audits cover stack mới:

**① B2 — Cross-skill consistency conditions**
```
Anchor: Condition test suggestion — TẤT CẢ skills dùng cùng condition: "Backend NestJS HOẶC WordPress HOẶC Solidity"
Sửa:   Thêm HOẶC [Stack]
```

**② B3 — Template parity table**
```
Anchor: | SCAN_REPORT | scan.md | Backend, Frontend, WordPress, Solidity |
Sửa:   Thêm , [Stack] vào cột "Stacks phải có" cho mỗi template row liên quan
```

**③ B4.11 — Security coverage (nếu stack có bảo mật đặc thù)**
```
Anchor: Security rules đủ coverage? (smart contract: reentrancy, access control, ...)
Thêm:   ([stack]: [danh sách security concerns cần audit])
```

### 3.4. Installers (tự động — KHÔNG cần sửa)

Installers đã xử lý đúng cho rules files mới:
- `readdirSync(rulesDir, { withFileTypes: true })` → tự quét file `.md` mới
- Subdirectory `-refs/` → tự copy recursive
- Tool replacement → tự áp dụng (hoặc skip cho -refs/)

**CHỈ cần verify** sau khi thêm: chạy `node bin/install.js --[platform]` và kiểm tra file rules đã copy đúng.

### 3.5. Eval tests (nên thêm)

**① Tạo fixture directories:**
```bash
mkdir -p evals/skills/init/fixtures/[stack]-project
# Tạo detection files giả trong fixture dir:
# VD Flutter: touch evals/skills/init/fixtures/flutter-project/pubspec.yaml
# VD Laravel: touch evals/skills/init/fixtures/laravel-project/artisan
```

**② Thêm test cases vào `promptfooconfig.yaml`:**
```yaml
  - description: "pd:init — [Stack] project (detect [stack], copy rules)"
    vars:
      skill_name: "init"
      user_input: "/pd:init"
      fixtures_dir: "evals/skills/init/fixtures/[stack]-project"
    assert:
      - type: contains
        value: "[stack].md"
      - type: contains
        value: "has[Stack]"
```

**③ Cập nhật README.md bảng eval** (nếu tổng tests thay đổi):
```
Anchor: | Tuân thủ quy trình     | 58       | —         |
Sửa:   Cập nhật số lượng tests
```

---

## Phase 4: Validation

### 4.1. Chạy audit nhanh (Sibling Sweep)

Sau khi sửa tất cả files, chạy grep verify:

```bash
# 1. Verify stack xuất hiện đủ chỗ trong init.md
grep -c "[stack]" commands/pd/init.md
# Expected: ≥7 (context + glob + detect + copy + delete list + notify + rules)

# 2. Verify stack xuất hiện trong scan.md
grep -c "[Stack]" commands/pd/scan.md
# Expected: ≥4 (scan section + template + re-copy + rules)

# 3. Verify conditions test suggestion đồng bộ
grep -n "NestJS.*WordPress.*Solidity" commands/pd/write-code.md commands/pd/what-next.md commands/pd/complete-milestone.md
# Expected: tất cả files có thêm [Stack]

# 4. Verify security list đồng bộ (nếu đã thêm file nhạy cảm)
grep -n "\.env.*credentials.*\.pem" commands/pd/init.md commands/pd/scan.md commands/pd/write-code.md commands/pd/fix-bug.md commands/pd/rules/general.md
# Expected: tất cả giống nhau

# 5. Verify detection patterns init = scan
grep "has[Stack]" commands/pd/init.md commands/pd/scan.md
# Expected: cùng detection files

# 6. Verify -refs/ không chứa /pd: patterns
grep -r "/pd:" commands/pd/rules/[stack]-refs/ 2>/dev/null
# Expected: 0 matches

# 7. Verify README counts
ls commands/pd/*.md | wc -l          # Số skills
ls commands/pd/rules/*.md | wc -l    # Số rules files
ls commands/pd/rules/[stack]-refs/*.md 2>/dev/null | wc -l  # Số ref docs
```

### 4.2. Chạy AUDIT_CHECKLIST.md Section A

Dùng checklist đầy đủ trong `AUDIT_CHECKLIST.md` → Section A (A1-A11) để verify từng touch point.

### 4.3. Test thực tế

```bash
# Cài lại skills
node bin/install.js --claude

# Test init detect stack mới
# (trong project có [detection files])
/pd:init

# Verify:
# - CONTEXT.md liệt kê [Stack]
# - .planning/rules/[stack].md đã copy
# - .planning/docs/[stack]/ đã copy (nếu có -refs/)
```

---

## Phase 5: Version bump + Commit

### 5.1. Tăng version

Thêm stack mới = **minor bump** (x.N+1.0):

```bash
# Cập nhật 3 files:
# VERSION: 2.5.1 → 2.6.0
# package.json: "2.5.1" → "2.6.0"
# README.md: v2.5.1 → v2.6.0
```

### 5.2. Cập nhật CHANGELOG.md

```markdown
## [2.6.0] - DD_MM_YYYY
### Thêm mới
- [Stack] stack support — rules, refs, detection, scan, write-code, test
```

### 5.3. Commit

```bash
git add commands/pd/rules/[stack].md
git add commands/pd/rules/[stack]-refs/  # nếu có
git add commands/pd/init.md commands/pd/scan.md commands/pd/plan.md
git add commands/pd/write-code.md commands/pd/fix-bug.md commands/pd/test.md
git add commands/pd/what-next.md commands/pd/complete-milestone.md
git add commands/pd/rules/general.md  # nếu đã sửa
git add README.md CHANGELOG.md VERSION package.json
git add AUDIT_CHECKLIST.md
git add promptfooconfig.yaml evals/skills/  # nếu thêm eval tests + fixtures

git commit -m "v2.6.0: [Stack] stack — rules, refs, detection, scan, write-code, test, eval"
```

---

## Tham khảo: Cấu trúc rules file chuẩn

Dựa trên 4 rules files hiện có, format chuẩn:

```markdown
# Quy tắc [Stack] ([Framework])

## Code style
- [Indent rule — ghi rõ nếu khác general.md]
- [Naming conventions]
- [File naming]
- Giới hạn file: [mục tiêu X dòng, BẮT BUỘC tách >Y] (ngoại lệ cho general.md 300/500 vì [lý do])

## Cấu trúc dự án
- [Folder structure]
- [Key files]

## [Domain-specific section 1]
(VD: Components, Models, Controllers, Widgets...)

## [Domain-specific section 2]
(VD: Routing, State management, API layer...)

## [Domain-specific section N]
...

## Bảo mật (BẮT BUỘC)
- [Security rule 1 — phổ biến nhất cho stack]
- [Security rule 2]
- ...

## Build & Lint
- Lint: `[lint command]`
- Build: `[build command]`
- Test: `[test command]`
- Detect thư mục: Glob `**/[detection-file]` → thư mục chứa = [stack] root

## Tham khảo chi tiết
Khi cần patterns phức tạp → đọc `.planning/docs/[stack]/`:
- `[file-1].md` — [mô tả]
- `[file-2].md` — [mô tả]
```

---

## Tham khảo: Ví dụ .skill input → rules output

### Input (.skill từ Claude Chat — Flutter)

```
Flutter Development Guidelines

Use 2 spaces indent. File names in snake_case.
Widgets should be split by feature.
Always use const constructors.
State management: Riverpod preferred.
Navigation: GoRouter.
Use flutter_lints.
Run flutter analyze before commit.
Build with flutter build.
```

### Output (rules/flutter.md)

```markdown
# Quy tắc Flutter (Dart)

## Code style
- 2 spaces indent (giống general.md — không cần ngoại lệ)
- File naming: snake_case (giống general.md)
- Class/Widget: PascalCase
- Giới hạn file: mục tiêu 300 dòng, BẮT BUỘC tách >500

## Cấu trúc dự án
    lib/
    ├── main.dart
    ├── app/           → App config, routes, theme
    ├── features/      → Feature-first: mỗi feature 1 thư mục
    │   └── [feature]/ → screen/, widgets/, providers/, models/
    ├── shared/        → Shared widgets, utils, constants
    └── core/          → Services, API clients, DI

## Widget
- BẮT BUỘC `const` constructors khi widget không có mutable state
- Split by feature — 1 widget/file, đặt trong `features/[name]/widgets/`
- Prefer `StatelessWidget` — chỉ dùng `StatefulWidget` khi cần lifecycle methods

## State Management (Riverpod)
- `@riverpod` annotation cho code generation
- Provider types: `Provider`, `StateNotifierProvider`, `FutureProvider`, `StreamProvider`
- Dispose: `ref.onDispose()` cho cleanup resources

## Navigation (GoRouter)
- Route config tập trung trong `app/router.dart`
- Named routes: `GoRoute(name: 'product', path: '/products/:id')`
- Redirect guards cho auth

## Bảo mật (BẮT BUỘC)
- KHÔNG hardcode API keys — dùng `--dart-define` hoặc `flutter_dotenv`
- Certificate pinning cho production API calls
- Obfuscate release builds: `flutter build apk --obfuscate --split-debug-info=build/debug-info`

## Build & Lint
- Lint: `flutter analyze`
- Build: `flutter build apk` (Android) / `flutter build ios` (iOS)
- Test: `flutter test`
- Detect thư mục: Glob `**/pubspec.yaml` + Grep `flutter` → Flutter project root
```

---

## Bảng tóm tắt touch points

| # | File | Điểm sửa | Bắt buộc |
|---|---|---|---|
| 1 | `rules/[stack].md` | Tạo mới | ✅ |
| 2 | `rules/[stack]-refs/` | Tạo mới (nếu phức tạp) | Tuỳ chọn |
| 3 | `init.md` | 7 điểm (≥10 sub-edits) | ✅ |
| 4 | `scan.md` | 5 điểm (≥8 sub-edits) | ✅ |
| 5 | `plan.md` | 2 điểm | ✅ |
| 6 | `write-code.md` | 7 điểm (⑦ có 3 sub-edits) | ✅ |
| 7 | `fix-bug.md` | 3 điểm | ✅ |
| 8 | `test.md` | 5 điểm | Nếu có test |
| 9 | `what-next.md` | 2 điểm | Nếu có test |
| 10 | `complete-milestone.md` | 3 điểm | ✅ |
| 11 | `general.md` | 0-3 điểm | Nếu conventions khác |
| 12 | `README.md` | 4 điểm | ✅ |
| 13 | `AUDIT_CHECKLIST.md` | 3 điểm | ✅ |
| 14 | `promptfooconfig.yaml` | Tests + fixtures | Nên có |
| 15 | Installers | 0 (tự động) | Verify only |
| **Tổng** | **15 files** | **~48-55 điểm** | |
