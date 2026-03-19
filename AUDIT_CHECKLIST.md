# Audit Checklist — Please Done Skills

Checklist chuẩn khi: (A) thêm rule/stack mới, (B) audit skills sau khi thay đổi rules, (C) audit bin/installers.

Mỗi item PHẢI ghi kết quả cụ thể (line number + evidence). KHÔNG được ghi "OK" chung chung.

---

## A. Thêm Rule / Stack Mới

### A1. Tạo files rule

- [ ] Tạo `commands/pd/rules/[stack].md` — coding standards, security, build & lint
- [ ] Nếu cần reference docs → tạo `commands/pd/rules/[stack]-refs/` directory với `.md` files
- [ ] File header: conventions khác `general.md` → PHẢI ghi **explicit exception** (VD: indent, naming, language)
- [ ] Mọi "BẮT BUỘC" rule → PHẢI có code example minh họa
- [ ] Mọi API/function name → verify tồn tại trong library version target (grep library source hoặc docs)

### A2. Cập nhật `init.md` (7 touch points)

- [ ] `<context>` section: thêm `[stack].md` vào danh sách rules (hiện tại: dòng 15-18)
- [ ] Bước 3 Glob: thêm file extension vào pattern `**/*.{ts,tsx,js,jsx,py,php,sol,...}` (dòng 51)
- [ ] Bước 3 Glob excludes: thêm build output directories nếu có (VD: `artifacts`, `cache` cho Solidity)
- [ ] Bước 4 Detection: thêm Glob/Grep patterns nhận diện stack (dòng 66-80). Cần ít nhất 1 primary + 1 fallback
- [ ] Bước 6 Copy rules: thêm `has[Stack]` condition + copy file (dòng 107-111). Nếu có `-refs/` → copy vào `.planning/docs/[stack]/`
- [ ] Bước 6 Delete list: thêm `[stack].md` vào danh sách xóa template (dòng 103)
- [ ] Bước 8 Notification: thêm `[stack].md (nếu có)` vào notification box (dòng 149-169)
- [ ] `<rules>` section: thêm `has[Stack]` flag + copy condition (dòng 172-183). Thêm file nhạy cảm vào security list nếu có

### A3. Cập nhật `scan.md` (4 touch points)

- [ ] Bước 2 Glob: thêm file extension (dòng 26 excludes, dòng 34 scan patterns)
- [ ] Bước 2a: thêm stack scan section với điều kiện `CHỈ quét nếu tồn tại [detection files]` (dòng 38-64)
- [ ] Bước 2a Grep patterns: MỌI pattern PHẢI có `(glob: "*.[ext]")` filter — không để match sai file type
- [ ] SCAN_REPORT template: thêm `## Phân tích [Stack]` section với subsections phù hợp (dòng 87-182)
- [ ] Bước 6 Re-copy rules: thêm `has[Stack]` condition (dòng 201-207)
- [ ] `<rules>` section: thêm `[Stack] CHỈ khi detect` condition (dòng 222-225)

### A4. Cập nhật `plan.md` (2 touch points)

- [ ] `<context>`: thêm đọc `[stack].md` theo stack (dòng 22-28)
- [ ] Bước 4 Design section: thêm `[Stack]` design guidance với ≥3 design concerns cụ thể (dòng 293-332). Stack phức tạp (>5 concerns) → thêm design section riêng, KHÔNG dùng "Stack khác" chung

### A5. Cập nhật `write-code.md` (4 touch points)

- [ ] `<context>`: thêm đọc `[stack].md` + docs path (dòng 19-26)
- [ ] Bước 4: thêm `Nếu task [Stack]:` section với coding instructions cụ thể (dòng 124-169)
- [ ] Bước 5 Lint/Build: thêm reference tới `[stack].md` mục Build & Lint (dòng 171-180)
- [ ] CODE_REPORT template: thêm section cho stack nếu có output format riêng (dòng 182-206)
- [ ] Test suggestion: cập nhật condition "CHỈ gợi ý nếu có Backend NestJS, WordPress, hoặc Solidity" (dòng 44) — thêm stack mới nếu có test support

### A6. Cập nhật `fix-bug.md` (3 touch points)

- [ ] `<context>`: thêm đọc `[stack].md` (dòng 13-17)
- [ ] Bước 5: thêm trace path cho stack — input → logic → state → output (dòng 67-93)
- [ ] Bước 7 Lint ref: thêm `[stack].md` vào danh sách Build & Lint reference (dòng 134-138)
- [ ] Test case format: thêm test file pattern cho stack (dòng 138)

### A7. Cập nhật `test.md` (2 touch points)

- [ ] Bước 1 Framework routing: thêm flow cho stack mới với sub-steps + mandatory test types (dòng 26-66)
- [ ] TEST_REPORT template: verify headings phù hợp cho stack mới (dòng 190-207). VD: "Database" → "Database/On-chain state"
- [ ] `<rules>`: thêm test file convention cho stack (dòng 245-253)

### A8. Cập nhật `what-next.md` (2 touch points)

- [ ] Bước 3.5: thêm stack vào condition đọc TEST_REPORT (dòng 56)
- [ ] Ưu tiên 6: thêm stack vào condition "Backend NestJS HOẶC WordPress HOẶC Solidity" (dòng 83-84)

### A9. Cập nhật `complete-milestone.md` (2 touch points)

- [ ] MILESTONE_COMPLETE template: thêm section cho stack (dòng 58-91). VD: `## Smart Contracts`, `## WordPress`
- [ ] Comment "CHỈ tạo sections có dữ liệu": thêm condition bỏ section stack mới (dòng 91)
- [ ] TEST_REPORT check: thêm stack vào condition kiểm tra (dòng 32, 39-40)

### A10. Cập nhật `README.md` (4 touch points)

- [ ] Bảng Rules: thêm row cho `[stack].md` + `[stack]-refs/` nếu có (dòng 162-171)
- [ ] Cây `.planning/`: thêm `[stack].md` vào rules + docs directory (dòng 226-252)
- [ ] Bảng Tech Stack: thêm row với detection patterns (dòng 378-389)
- [ ] Commit format: thêm test file patterns nếu khác hiện tại (dòng 357-363)

### A11. Cập nhật `general.md` (nếu cần)

- [ ] Code style: ghi rõ "[Stack] theo rules riêng trong [stack].md" nếu conventions khác (indent, naming...)
- [ ] Security list: thêm file nhạy cảm stack-specific nếu có (VD: `wp-config.php` cho WordPress)
- [ ] File line limits: thêm ngoại lệ nếu stack cần (VD: Solidity 500/800 thay vì 300/500)

---

## B. Audit Skills Sau Khi Thay Đổi Rules

### B1. Nội bộ từng skill (chạy cho MỖI skill file)

- [ ] `<context>` liệt kê inputs → `<process>` có thực sự dùng tất cả không?
- [ ] `<process>` output/notification templates → hiện đủ thông tin từ process không?
- [ ] `<rules>` section → mỗi rule có được `<process>` enforce không?
- [ ] Security list trong `<rules>` → khớp `general.md` dòng 55 không? (`.env`, `.env.*`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- [ ] Glob/Grep patterns → dùng đúng ripgrep syntax (`|` không cần backslash)?
- [ ] Mọi Grep pattern cho specific stack → có `(glob: "*.[ext]")` filter không?

### B2. Cross-skill consistency

- [ ] Thuật ngữ "Backend" — khi dùng generic có match tất cả backend stacks (NestJS, WordPress...) không? Khi chỉ NestJS → ghi rõ "(NestJS)"
- [ ] Condition test suggestion — TẤT CẢ skills dùng cùng condition: "Backend NestJS HOẶC WordPress HOẶC Solidity HOẶC Flutter"
- [ ] FastCode failure handling — TẤT CẢ skills dùng cùng pattern: fallback Grep/Read + warning
- [ ] Security list — TẤT CẢ skills có `<rules>` security → danh sách GIỐNG NHAU
- [ ] Stack detection conditions trong scan.md = init.md (cùng Glob/Grep patterns)

### B3. Template parity check

Liệt kê TẤT CẢ output templates → verify mỗi template có section cho TỪNG stack:

| Template | File | Stacks phải có |
|----------|------|----------------|
| SCAN_REPORT | scan.md | Backend, Frontend, WordPress, Solidity, Flutter |
| CODE_REPORT | write-code.md | API Endpoints, Database, Contract Functions, Hooks & Filters |
| TEST_REPORT | test.md | Headings generic (không hardcode 1 framework) |
| MILESTONE_COMPLETE | complete-milestone.md | Tổng hợp API, Smart Contracts, WordPress, Flutter |
| BUG_REPORT | fix-bug.md | Generic (không stack-specific heading) |
| Notification box | init.md | Liệt kê TẤT CẢ rules files copied |

- [ ] Mỗi template có section/mention cho TỪNG stack hỗ trợ?
- [ ] Frontmatter `description:` và `<objective>` — không hardcode 1 framework?
- [ ] Process instructions (Bước X): hardcode framework OK — đang mô tả conditional branch
- [ ] Template OUTPUT headings: PHẢI generic — dùng cho mọi project type
- [ ] Khi template dùng framework name → parameterize `[Jest|PHPUnit|Hardhat|Foundry]`

### B4. Rules file audit (dimensions 6-12)

**6. Cú pháp & chính xác kỹ thuật:**
- [ ] API/function names đúng version library target?
- [ ] CLI commands đúng cú pháp?
- [ ] Code patterns khớp library version?

**7. Contradictions nội bộ (cùng 1 file):**
- [ ] Rule A có mâu thuẫn Rule B không?
- [ ] Format/convention conflicts? (VD: nói kebab-case nhưng example PascalCase)

**8. Contradictions cross-file:**
- [ ] `general.md` vs stack-specific rules → scope rõ ràng? (VD: indent TS vs PHP vs Solidity)
- [ ] Mọi khác biệt với general.md → có ghi explicit exception + lý do?

**9. Rules ↔ Skills contradictions:**
- [ ] Rules file nói X, skill hardcode ngược?
- [ ] Mỗi "BẮT BUỘC" trong rules → có enforcement trong skill tương ứng?

**10. Logic bugs:**
- [ ] Rules kết hợp tạo kết quả vô lý?
- [ ] Rules thiếu escape clause? (VD: "CẤM X" nhưng không nói exception)
- [ ] Numeric limits hợp lý? (VD: file 500 dòng, array max 50) — có ghi "tùy chỉnh nếu cần"?

**11. Thiếu sót:**
- [ ] Security rules đủ coverage? (smart contract: reentrancy, access control, overflow, flash loan, frontrunning, oracle, signature replay, tx.origin, DoS) (flutter: secure storage, obfuscation, certificate pinning, env vars, notification payload validation)
- [ ] Pattern phổ biến có rule? (VD: middleware, interceptor, rescue functions)

**12. Cross-platform:**
- [ ] Tool names trong rules text (Read, Write, Bash...) → sẽ bị convert đúng bởi installers?
- [ ] `-refs/` code examples có bị tool replacement phá không?

### B5. Rules ↔ Template/Example code

- [ ] Mỗi "BẮT BUỘC dùng [library]" trong rules → templates có dùng đúng library, KHÔNG manual reimplementation?
- [ ] Mỗi "MỌI function có X" → TẤT CẢ functions trong templates (kể cả admin/rescue) có X?
- [ ] Mọi `emit EventName(...)` → `event EventName(...)` đã declared?
- [ ] Templates combo (1a+2, 1b+2) → cả 2 combo compile-safe?
- [ ] Mọi function thay đổi state → emit event? (đặc biệt admin functions)
- [ ] Diagrams/flowcharts → khớp code logic thứ tự?

### B6. Rules ↔ Audit checklist parity (nếu stack có checklist)

- [ ] Mỗi rule trong rules file → có checklist item tương ứng?
- [ ] Mỗi checklist section → khớp current rules?
- [ ] Event emit order — checklist hỏi "SAU state change, không trước"?

---

## C. Audit Bin / Installers

### C1. Installer file handling

Kiểm tra TẤT CẢ 5 installers: `claude.js`, `codex.js`, `copilot.js`, `gemini.js`, `opencode.js`

- [ ] `readdirSync` rules directory → dùng `withFileTypes: true` phân biệt file vs directory?
- [ ] Subdirectories (`wordpress-refs/`, `solidity-refs/`, `[stack]-refs/`) → được copy recursive?
- [ ] Uninstall → xóa TẤT CẢ files đã install (cả subdirectories)?
- [ ] Install/uninstall symmetry: mọi file install tạo → uninstall phải xóa

### C2. Tool name replacements

Kiểm tra 3 nguồn TOOL_MAP phải ĐỒNG BỘ:

| Nguồn | File | Vị trí |
|-------|------|--------|
| Master TOOL_MAP | `platforms.js` | Object per platform |
| Converter TOOL_MAP | `converters/[platform].js` | Constant ở đầu file |
| Installer replacements | `installers/[platform].js` | `content.replace(...)` lines |

- [ ] Platform có TOOL_MAP non-empty (gemini, copilot) → installer PHẢI có tool replacements khớp
- [ ] Platform có TOOL_MAP empty (codex, opencode) → installer KHÔNG CẦN tool replacements
- [ ] So sánh installer `replace()` vs converter TOOL_MAP → tìm missing tools
- [ ] Khi thêm tool mới → cập nhật CẢ 3 nguồn

### C3. Code example protection trong `-refs/` files

- [ ] `-refs/` subdirectories chứa code examples thực tế → identifiers trùng tool names (Edit, Read, Write...)
- [ ] Installer cho platforms có tool replacement (gemini, copilot) → SKIP tool replacement cho `-refs/` files
- [ ] `-refs/` files CHỈ replace paths (`~/.claude/` → `~/.gemini/`)
- [ ] Command ref replacement (`/pd:xxx` → `$pd-xxx`) — kiểm tra `-refs/` files không chứa patterns bị match

### C4. Path replacements

- [ ] `~/.claude/` → đúng target path cho mỗi platform
- [ ] Command prefix: `/pd:` → `$pd-` (codex), `/pd-` (opencode), giữ nguyên (gemini, copilot)
- [ ] Path replacements không break references trong rules content (VD: `~/.claude/commands/pd/.pdconfig`)

### C5. Regex patterns

- [ ] Skill name matching regex: `[a-z0-9_-]+` — cover TẤT CẢ valid skill names hiện tại?
- [ ] Tool name regex: `\b[ToolName]\b(?!\()` — không match tool name trong function calls?
- [ ] Template string escape: `${}` patterns không bị phá?

### C6. Converter audit

- [ ] Frontmatter fields giữ đúng: `name`, `description`, `allowed-tools` (nếu có)
- [ ] Body conversion: tool names, command refs, paths → đúng format target platform
- [ ] XML adapter (codex): output valid XML?

### C7. Platform detection & config

- [ ] `getGlobalDir()` trả về đúng path cho mỗi platform
- [ ] `getLocalDir()` dùng `dirName` đúng
- [ ] MCP config generation: đúng format cho mỗi platform (JSON/TOML/text)
- [ ] Install đăng ký MCP → uninstall xóa MCP tương ứng (trừ shared tools như Context7)

---

## D. Sibling Sweep (BẮT BUỘC sau mỗi fix)

Khi tìm thấy bug X trong file A:

1. Grep pattern X qua TẤT CẢ files cùng category
2. VD: tìm "hardcoded Jest" trong test.md → grep `Jest|PHPUnit|Hardhat` trong TẤT CẢ skill templates
3. VD: tìm regex bug trong codex.js → kiểm tra CÙNG regex trong TẤT CẢ installer/converter files
4. KHÔNG dừng sau fix 1 instance — exhaust category trước khi chuyển audit item tiếp

---

## E. Cascade Updates (khi thay đổi 1 giá trị)

### E1. Thêm mandatory function mới (VD: `rescueETH`)

Cập nhật 4 nơi:
- [ ] Templates file → implementation code
- [ ] Rules file → mention trong Bảo mật section
- [ ] Audit checklist → must-have functions section
- [ ] `test.md` → mandatory test list
- [ ] `write-code.md` → BẮT BUỘC list

### E2. Deprecate API (VD: `safeApprove` → `forceApprove`)

- [ ] Rules file → cập nhật rule text
- [ ] Templates → thay code + thêm comment warning
- [ ] Audit checklist → cập nhật checklist item
- [ ] Grep tất cả files cho API cũ → verify không còn sót

### E3. Thay đổi version number

- [ ] `VERSION` file
- [ ] `package.json` field `"version"`
- [ ] `README.md` phiên bản hiện tại
- [ ] `CHANGELOG.md` — entry mới
- [ ] Grep toàn project cho version cũ → chỉ nên còn trong CHANGELOG entries cũ

### E4. Thay đổi security rule

- [ ] `general.md` security list
- [ ] `init.md` `<rules>` security list
- [ ] `scan.md` `<rules>` security list
- [ ] `write-code.md` `<rules>` security list
- [ ] `fix-bug.md` `<rules>` security list
- [ ] `README.md` bảng bảo mật
- [ ] Grep file nhạy cảm pattern qua TẤT CẢ files → verify đồng bộ

---

## F. Numeric Count Verification

Khi thêm/xóa items có đếm:

- [ ] Số eval tests → grep count trong `promptfooconfig.yaml` = `README.md` ?
- [ ] Số skills → count files `commands/pd/*.md` = README bảng skills ?
- [ ] Số rules files → count `commands/pd/rules/*.md` = README bảng rules ?
- [ ] Số reference docs → count `*-refs/*.md` = README mô tả ?

---

## G. Hoàn tất Audit

Sau khi audit xong và fix tất cả bugs phát hiện:

1. **Commit fixes** — mỗi fix riêng hoặc gộp 1 commit với prefix `Audit fix:`
2. **Bump patch version** (x.y.N+1) — cập nhật 4 files:
   - `VERSION`
   - `package.json` field `"version"`
   - `README.md` phiên bản hiện tại
   - `CHANGELOG.md` — entry mới liệt kê từng fix
3. **Commit version bump** — message: `v[x.y.z]: Audit fix — [tóm tắt fixes]`
4. **Push** (nếu user yêu cầu)
