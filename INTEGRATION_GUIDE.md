# Hướng dẫn tích hợp Stack mới vào Please Done

Tài liệu này hướng dẫn quy trình tích hợp 1 stack mới (VD: Laravel, Go, Rust, React Native...) vào bộ skills Please Done.

**Đầu vào**: Quy ước lập trình của stack — viết tay, tạo từ AI, hoặc rút từ tài liệu nội bộ.

**Đầu ra**: Stack mới được tích hợp đầy đủ vào workflow 12 skills + 5 trình cài đặt + README + eval tests.

---

## Mục lục

- [Nguyên tắc rules](#nguyên-tắc-rules)
- [Giai đoạn 1: Tạo file rules](#giai-đoạn-1-tạo-file-rules)
- [Giai đoạn 2: Cập nhật workflows](#giai-đoạn-2-cập-nhật-workflows)
- [Giai đoạn 3: Cập nhật hạ tầng](#giai-đoạn-3-cập-nhật-hạ-tầng)
- [Giai đoạn 4: Kiểm tra](#giai-đoạn-4-kiểm-tra)
- [Giai đoạn 5: Nâng version + Commit](#giai-đoạn-5-nâng-version--commit)
- [Tham khảo: Format rules file](#tham-khảo-format-rules-file)
- [Tham khảo: Ví dụ input → output](#tham-khảo-ví-dụ-input--output)

---

## Nguyên tắc rules

### Tại sao cần rules khi đã có `/pd:conventions`?

Please Done có 2 lớp quy ước bổ sung nhau:

- **Rules** (`commands/pd/rules/`) — config kỹ thuật cho workflows: lệnh build/lint, detection patterns, quy tắc bảo mật stack-specific. Được áp dụng **tự động** mỗi lần `/pd:init`. Nếu bạn fork repo, sửa rules = quy ước cá nhân áp dụng cho **mọi dự án cùng stack** mà không cần khai báo lại.
- **CLAUDE.md** (tạo bởi `/pd:conventions`) — quy ước riêng của **từng dự án cụ thể** (coding style, architecture decisions). Claude Code tự load mỗi conversation.

**Nói đơn giản**: Rules = quy ước chung theo stack (dùng lại nhiều dự án). CLAUDE.md = quy ước riêng từng dự án.

### Nội dung rules

Rules file CHỈ chứa **quy ước riêng** — những thứ AI không thể tự suy ra từ code hoặc từ training data.

### Viết vào rules

- Conventions đặc thù: naming prefix, folder structure bắt buộc, response format riêng
- Lựa chọn công nghệ: thư viện nào dùng/cấm (VD: "dio only, CẤM http package")
- Bảo mật stack-specific: functions sanitize/escape riêng của framework
- Build & Lint commands + detect patterns

### KHÔNG viết vào rules

- Cách dùng framework (AI đã biết từ training data + tra Context7)
- Code examples tutorial (VD: cách setup JWT, cách tạo controller)
- Kiến thức phổ biến (VD: bcrypt cho password, CORS headers)

### Kiểm tra nhanh

Mỗi dòng trong rules, hỏi: **"Nếu không nói, AI có làm khác không?"**
- Có → giữ (VD: "MongoDB collection prefix `m`" — AI sẽ không tự thêm prefix)
- Không → xóa (VD: "dùng @Injectable() cho service" — AI đã biết)

---

## Giai đoạn 1: Tạo file rules

### 1.1. Viết rules/[stack].md

Tạo file tại `commands/pd/rules/[stack].md` theo format:

```markdown
# Quy tắc [Stack] ([Framework])

> Chỉ chứa quy ước riêng. Kiến thức [Stack] chuẩn → tra Context7.

## Code style (khác general.md)
- [CHỈ ghi nếu khác — VD: tabs thay spaces, 4 spaces thay 2]

## [Quy ước đặc biệt]
- [Conventions mà AI không tự biết]

## Bảo mật
- [Security rules đặc thù stack]

## Build & Lint
- Lint: `[lệnh lint]`
- Build: `[lệnh build]`
- Detect: Glob `**/[detection-file]`
```

**Checklist:**

- [ ] Mỗi dòng trả lời "Có" cho câu hỏi "AI có làm khác không?"
- [ ] Conventions khác `general.md` → ghi **explicit exception** + lý do
- [ ] Section **Build & Lint** BẮT BUỘC — skills dùng section này
- [ ] **Detect** pattern BẮT BUỘC — ghi Glob pattern nhận diện stack
- [ ] File nhạy cảm stack-specific (nếu có) → liệt kê rõ
- [ ] Mục tiêu: **dưới 50 dòng** — nếu dài hơn, cắt bớt tutorial

### 1.2. Tạo -refs/ (hiếm khi cần)

Refs chỉ dành cho nội dung **custom không có trên docs chính thức** (VD: contract templates riêng, audit checklist riêng).

KHÔNG tạo refs cho:
- Tutorial framework (dùng Context7)
- Code examples phổ biến (AI đã biết)
- Docs có sẵn online

Nếu thật sự cần:
```
commands/pd/rules/[stack]-refs/
├── [topic-1].md
└── [topic-2].md
```

### 1.3. Xác định mẫu nhận diện

Mỗi stack cần **ít nhất 1 chính + 1 dự phòng**:

| Stack | Chính | Dự phòng |
|---|---|---|
| NestJS | `**/nest-cli.json` | `**/app.module.ts`, `**/main.ts` + Grep `NestFactory` |
| NextJS | `**/next.config.*` | — |
| WordPress | `**/wp-config.php` | `**/wp-content/plugins/*/` |
| Solidity | `**/hardhat.config.*` | `**/foundry.toml` |
| Flutter | `**/pubspec.yaml` + Grep `flutter` | `**/lib/main.dart` |
| **[Stack mới]** | **[?]** | **[?]** |

VD Laravel: Chính `**/artisan` | Dự phòng: `**/composer.json` + Grep `laravel/framework`

Ghi nhận: `has[Stack]` flag + mẫu nhận diện → dùng ở Giai đoạn 2.

---

## Giai đoạn 2: Cập nhật workflows

Quy ước:
- `[stack]` = tên viết thường (laravel, go...)
- `[Stack]` = tên viết hoa đầu (Laravel, Go...)
- `has[Stack]` = cờ nhận diện
- `[ext]` = phần mở rộng file (php, go...)
- Tìm **mẫu neo** → chèn **SAU** dòng đó

### 2.1. init.md (6 điểm)

**① Bước 3 — Glob file extensions**
```
Anchor: Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}`
Sửa:   Thêm ,[ext]
```

**② Bước 4 — Detection patterns (sau block Flutter)**
```
Thêm:
- Glob `**/[primary-detection-file]` → **has[Stack] = true**
- Fallback [Stack]: Glob `**/[fallback-file]` → **has[Stack] = true**
```

**③ Bước 6 — Delete list**
```
Anchor: `general.md`, `nestjs.md`, `nextjs.md`, `wordpress.md`, `solidity.md`, `flutter.md`
Sửa:   Thêm `, [stack].md`
```

**④ Bước 6 — Copy condition (sau dòng Flutter)**
```
Thêm: - **Nếu has[Stack] = true**: copy `[stack].md`
      (Nếu có -refs/) + copy thư mục `[SKILLS_DIR]/commands/pd/rules/[stack]-refs/` → `.planning/docs/[stack]/`
```

**⑤ Bước 8 — Notification box**
```
Anchor: ║   - flutter.md (nếu có)             ║
Thêm:   ║   - [stack].md (nếu có)             ║
```

**⑥ `<rules>` section**
```
Anchor: - Nếu hasFlutter = true: copy `flutter.md` vào `.planning/rules/`
Thêm:   - Nếu has[Stack] = true: copy `[stack].md` vào `.planning/rules/`
        (Nếu có -refs/) + copy `[stack]-refs/` vào `.planning/docs/[stack]/`
```

### 2.2. scan.md (4 điểm)

**① Bước 2 — Glob extensions + excludes**
```
Anchor: Glob `**/*.{ts,tsx,js,jsx,py,php,sol,dart,html}`
Sửa:   Thêm ,[ext]
(Nếu stack có build dirs → thêm vào excludes)
```

**② Bước 2a — Scan section (sau Flutter scan)**
```
Thêm:
  **[Stack]:** (CHỈ quét nếu tồn tại `**/[detection-file]`)
  - [Pattern 1]: Grep `[pattern]` (glob: `*.[ext]`) → [mô tả]
  - ...
```

**③ Bước 5 — SCAN_REPORT template**
```
Anchor: (sau block Flutter)
Thêm:
## Phân tích [Stack]
(CHỈ tạo nếu project có [Stack])
### [Subsections phù hợp]
```

**④ `<rules>` + re-copy rules**
```
Anchor: has[Stack] flags + delete list + copy condition
Sửa:   Thêm [stack] tương tự init.md
```

### 2.3. plan.md (1 điểm)

**① Bước 4 — Design section (sau Flutter, TRƯỚC "Stack khác")**
```
Anchor: - **Flutter**: modules (Logic+State+View+Binding), navigation, design tokens, data layer

Thêm:
- **[Stack]**: [design concern 1], [design concern 2], [concern 3]
```

> plan.md đọc rules dynamically từ `.planning/rules/` — không cần sửa `<required_reading>`.

### 2.4. write-code.md (4 điểm)

> write-code.md đọc rules dynamically từ `.planning/rules/` — không cần sửa `<required_reading>`.

**① Bước 4 — Exceptions (CHỈ nếu stack có ngoại lệ)**
```
Nếu doc language khác: thêm vào dòng JSDoc ngoại lệ
Nếu file limit khác: thêm vào dòng giới hạn file
```

**② Bước 5 — Build reference**
```
Anchor: (nestjs.md/nextjs.md/wordpress.md/solidity.md/flutter.md): đọc mục **Build & Lint**
Sửa:   Thêm /[stack].md
```

**③ `<rules>` — rules list (2 chỗ)**
```
Anchor: (general + nestjs/nextjs/wordpress/solidity/flutter theo Loại task)
Sửa:   Thêm /[stack]
```

**④ Test suggestion (3 chỗ — CHỈ nếu stack có automated test)**
```
Anchor: Backend NestJS, WordPress, Solidity, hoặc Flutter
Sửa:   Thêm , [Stack]
```

### 2.5. fix-bug.md (2 điểm)

> fix-bug.md đọc rules dynamically — không cần sửa `<required_reading>`.

**① Bước 5c — Trace path (sau Flutter)**
```
Thêm:
- **[Stack]**: [trace luồng đặc thù]
```

**② Bước 8 — Lint reference + test pattern**
```
Anchor: `.planning/rules/nestjs.md` hoặc `nextjs.md` hoặc `wordpress.md` hoặc `solidity.md` hoặc `flutter.md` → mục **Build & Lint**
Sửa:   Thêm hoặc `[stack].md`

Anchor: `.spec.ts` (NestJS) hoặc `test-*.php` (WordPress) hoặc `test/*.ts`/`test/*.t.sol` (Solidity) hoặc `test/**/*_test.dart` (Flutter)
Sửa:   Thêm hoặc `[test-file-pattern]` ([Stack])
```

### 2.6. test.md (4 điểm — CHỈ nếu có automated test)

> test.md không có `<required_reading>` cho từng stack — đọc dynamically.

**① Bước 1 — Flow routing (sau Flutter, TRƯỚC "framework khác")**
```
Thêm:
- **[Stack]** → [Test Framework] (tra Context7 cho patterns):
  1. Kiểm tra [test framework] đã cài
  2. Viết test files `[test-file-pattern]`
  3. Chạy: `[test command]`
  4. Phần còn lại → Bước 7 (TEST_REPORT)
```

**② "framework khác" message**
```
Anchor: hỗ trợ NestJS/WP/Solidity/Flutter
Sửa:   Thêm /[Stack]
```

**③ TEST_REPORT template — framework name**
```
Anchor: [Jest|PHPUnit|Hardhat|Foundry|FlutterTest]
Sửa:   Thêm |[TestFramework]
```

**④ `<rules>` — test file convention**
```
Sửa: Thêm , [Stack]: `[test-file-pattern]` ([TestFramework])
```

### 2.7. what-next.md (0 điểm — thường không cần sửa)

`what-next.md` hiện áp dụng test suggestion cho MỌI project (không filter theo stack). Chỉ cần sửa nếu stack mới cần logic routing đặc biệt trong gợi ý.

### 2.8. complete-milestone.md (3 điểm)

**① MILESTONE_COMPLETE template (nếu cần section riêng)**
```
Thêm: ## [Stack Section Name]
      | [Cột phù hợp] |
```

**② Comment "CHỉ tạo sections có dữ liệu"**
```
Sửa: Thêm Bỏ '[Section]' nếu không có [Stack].
```

**③ TEST_REPORT check (nếu có test)**
```
Anchor: Backend NestJS, WordPress, Solidity, hoặc Flutter
Sửa:   Thêm , [Stack] (3 chỗ)
```

---

## Giai đoạn 3: Cập nhật hạ tầng

### 3.1. general.md (nếu cần)

Chỉ cập nhật nếu stack có conventions KHÁC default:

- [ ] **Code style**: nếu indent/naming khác → thêm ngoại lệ
- [ ] **Security list**: nếu có file nhạy cảm stack-specific
- [ ] **File line limits**: nếu stack cần giới hạn khác 300/500

### 3.2. README.md (3 điểm)

**① Bảng Rules:**
```markdown
| `rules/[stack].md` | Có [Stack] | Quy ước riêng: [mô tả ngắn] |
```

**② Cây `.planning/` — rules section:**
```
│   └── [stack].md                # Quy ước [Stack] (nếu có)
```

**③ Bảng Tech Stack:**
```markdown
| [Loại] | [Framework] | [Database nếu có] | `[detection patterns]` |
```

### 3.3. Kiểm thử đánh giá (nên thêm)

Thêm vào `promptfooconfig.yaml`:

```yaml
  - description: "pd:init — [Stack] project (detect [stack], copy rules)"
    vars:
      skill_file: commands/pd/init.md
      scenario: |
        Project tại /app/my-[stack]-project.
        Kết quả tool calls giả lập:
        - Glob **/[detection-file] → tìm thấy
        - .pdconfig có SKILLS_DIR=/home/user/skills
        - [SKILLS_DIR]/commands/pd/rules/[stack].md → tồn tại
    assert:
      - type: llm-rubric
        value: |
          1. PHẢI detect [Stack] → has[Stack] = true
          2. PHẢI copy general.md + [stack].md vào .planning/rules/
          3. CONTEXT.md PHẢI ghi [Stack] trong Tech Stack
      - type: icontains
        value: "[stack]"
```

Thêm vào `evals/trigger-config.yaml`:

```yaml
  - description: "Trigger pd:init — [stack] project"
    vars:
      user_request: "Khởi tạo project [stack]"
    assert:
      - type: icontains
        value: "pd:init"
```

### 3.4. Trình cài đặt (tự động)

Trình cài đặt tự xử lý files mới — CHỈ cần kiểm tra sau khi thêm:
```bash
node bin/install.js --claude
# Kiểm tra rules file đã copy đúng
```

---

## Giai đoạn 4: Kiểm tra

### 4.1. Kiểm tra bằng Grep

```bash
# 1. Stack xuất hiện đủ chỗ trong init.md
grep -c "[stack]" workflows/init.md
# Expected: ≥6

# 2. Stack xuất hiện trong scan.md
grep -c "[Stack]" workflows/scan.md
# Expected: ≥4

# 3. Conditions test suggestion đồng bộ
grep -n "NestJS.*WordPress.*Solidity.*Flutter" workflows/write-code.md workflows/what-next.md workflows/complete-milestone.md
# Expected: tất cả có thêm [Stack]

# 4. Detection patterns init = scan
grep "has[Stack]" workflows/init.md workflows/scan.md
# Expected: cùng patterns

# 5. Rules file dưới 50 dòng
wc -l commands/pd/rules/[stack].md
# Expected: ≤50

# 6. Không còn tham chiếu hỏng
grep -r "\.planning/docs/[stack]/" workflows/ commands/
# Expected: 0 matches (trừ khi có -refs/)
```

### 4.2. Kiểm tra thực tế

```bash
# Cài lại skills
node bin/install.js --claude

# Test trong project có [detection files]
/pd:init
# Verify: CONTEXT.md liệt kê [Stack], .planning/rules/[stack].md đã copy
```

---

## Giai đoạn 5: Nâng version + Commit

### 5.1. Phiên bản

Thêm stack mới = **nâng phiên bản phụ** (x.N+1.0). Cập nhật: `VERSION`, `package.json`, `README.md`.

### 5.2. CHANGELOG.md

```markdown
## [x.N+1.0] - DD_MM_YYYY
### Thêm mới
- [Stack] stack support — rules, detection, scan, write-code, test
```

### 5.3. Commit

```bash
git add commands/pd/rules/[stack].md
git add commands/pd/rules/[stack]-refs/  # nếu có
git add workflows/init.md workflows/scan.md workflows/plan.md
git add workflows/write-code.md workflows/fix-bug.md workflows/test.md
git add workflows/what-next.md workflows/complete-milestone.md
git add commands/pd/rules/general.md  # nếu đã sửa
git add README.md CHANGELOG.md VERSION package.json
git add promptfooconfig.yaml evals/trigger-config.yaml

git commit -m "v[x.N+1.0]: [Stack] stack — rules, detection, scan, write-code, test"
```

---

## Tham khảo: Format rules file

Dựa trên 5 rules files hiện có (sau tối ưu), format chuẩn:

```markdown
# Quy tắc [Stack] ([Framework])

> Chỉ chứa quy ước riêng. Kiến thức [Stack] chuẩn → tra Context7.

## Code style (khác general.md)
- [CHỈ ghi nếu khác default — indent, naming, file naming]
- Giới hạn file: [X/Y nếu khác 300/500]

## [Quy ước đặc biệt 1]
- [Convention mà AI không tự biết]

## [Quy ước đặc biệt 2]
- [Convention mà AI không tự biết]

## Bảo mật
- [Security rules đặc thù stack — KHÔNG lặp kiến thức phổ biến]

## Build & Lint
- Lint: `[lệnh]`
- Build: `[lệnh]`
- Detect: Glob `**/[file]`
```

**Mục tiêu: 30-50 dòng.** Nếu dài hơn → cắt tutorial, giữ conventions.

---

## Tham khảo: Ví dụ input → output

### Input (từ user hoặc AI)

```
Laravel Development Guidelines

Use PSR-12 coding standard. 4 spaces indent.
Use Eloquent ORM, not raw queries.
Repository pattern for data access.
Form Requests for validation.
API Resources for response formatting.
Gates/Policies for authorization.
Queue jobs for heavy tasks.
Use Laravel Pint for linting.
Run php artisan test for testing.
```

### Output (rules/laravel.md) — CHỈ quy ước riêng

```markdown
# Quy tắc Laravel (PHP)

> Chỉ chứa quy ước riêng. Kiến thức Laravel chuẩn → tra Context7.

## Code style (khác general.md)
- Indentation: 4 spaces (PSR-12, khác 2 spaces JS/TS)
- Naming: camelCase methods, snake_case DB columns, PascalCase classes

## Quy ước bắt buộc
- Data access: Repository pattern — KHÔNG gọi Eloquent trực tiếp từ Controller
- Validation: Form Requests — KHÔNG validate trong Controller
- Response: API Resources — KHÔNG return Model trực tiếp
- Auth: Gates/Policies — KHÔNG check role bằng if/else trong Controller
- Heavy tasks: Queue jobs — KHÔNG xử lý nặng trong request cycle

## Bảo mật
- Mass assignment: `$fillable` explicit — CẤM `$guarded = []`
- Raw queries: `DB::select()` với bindings — CẤM nối chuỗi
- File upload: `store()` với disk config — CẤM `move()`

## Build & Lint
- Lint: `./vendor/bin/pint`
- Test: `php artisan test`
- Detect: Glob `**/artisan` + Grep `laravel/framework` trong composer.json
```

**22 dòng nội dung** — không tutorial, chỉ conventions.

---

## Bảng tóm tắt điểm sửa

| # | File | Điểm sửa | Bắt buộc |
|---|---|---|---|
| 1 | `rules/[stack].md` | Tạo mới (≤50 dòng) | Luôn |
| 2 | `rules/[stack]-refs/` | Tạo mới | Hiếm khi cần |
| 3 | `workflows/init.md` | 6 điểm | Luôn |
| 4 | `workflows/scan.md` | 4 điểm | Luôn |
| 5 | `workflows/plan.md` | 1 điểm | Luôn |
| 6 | `workflows/write-code.md` | 4 điểm | Luôn |
| 7 | `workflows/fix-bug.md` | 2 điểm | Luôn |
| 8 | `workflows/test.md` | 4 điểm | Nếu có test |
| 9 | `workflows/what-next.md` | 0 điểm | Hiếm khi cần |
| 10 | `workflows/complete-milestone.md` | 3 điểm | Luôn |
| 11 | `commands/pd/rules/general.md` | 0-3 điểm | Nếu khác default |
| 12 | `README.md` | 3 điểm | Luôn |
| 13 | `promptfooconfig.yaml` | Tests | Nên có |
| 14 | Installers | 0 (tự động) | Verify only |
| **Tổng** | **14 files** | **~30-36 điểm** | |

> So với phiên bản trước (48-55 điểm): giảm ~40% nhờ bỏ hệ thống refs + context entries.
