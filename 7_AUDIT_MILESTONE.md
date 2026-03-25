# Lệnh `pd:audit` — Kiểm toán Bảo mật OWASP Top 10

Thêm lệnh `pd:audit` để quét mã nguồn bằng 13 agent scanner OWASP Top 10. Lệnh hoạt động **độc lập** (quét bất kỳ dự án nào) và **tích hợp milestone** (là security gate bắt buộc trước `pd:complete-milestone`).

## Thiết kế chính

### Nguyên tắc kép: Độc lập + Tích hợp

| Chế độ                 | Khi nào                                              | Hành vi                                                                                                       |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Độc lập**            | Không có `.planning/` hoặc user chạy trên repo ngoài | Quét toàn bộ source → xuất `SECURITY_REPORT.md` tại thư mục gốc dự án                                         |
| **Tích hợp milestone** | Có `.planning/CURRENT_MILESTONE.md`                  | Quét scope milestone (git diff) → xuất vào `.planning/milestones/[version]/` → nếu có lỗ hổng, tạo fix phases |

Lệnh tự phát hiện ngữ cảnh — user KHÔNG cần chỉ định chế độ.

### Mô tả

Phân tích ngữ cảnh dự án (milestone phases, code patterns, git diff) để **chỉ chọn scanner liên quan**, tránh gọi dư thừa agent không có khả năng tìm thấy lỗi — tiết kiệm token tối đa. Scanner được chọn chạy theo lô (batch), giới hạn tối đa **2 agent chạy đồng thời**. Sau khi quét xong, agent reporter tổng hợp kết quả. Trong chế độ milestone: nếu có lỗ hổng CRITICAL/WARNING, hệ thống **tự động bổ sung giai đoạn fix** vào roadmap milestone hiện tại — sắp xếp theo **thứ tự gadget chain**.

### Deliverables (Sản phẩm bàn giao)

#### 1. Lệnh `pd:audit` (`commands/pd/audit.md`)

```yaml
---
name: pd:audit
description: Kiểm toán bảo mật — Quét OWASP Top 10 trên dự án hoặc milestone
model: sonnet
argument-hint: "[path] [--full | --only scanner1,scanner2] [--auto-fix]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - SubAgent
---
```

**Tham số:**

- `path` (tùy chọn): Đường dẫn dự án cần quét. Mặc định: thư mục hiện tại.

**Chế độ quét:**

- _(mặc định)_: **Smart mode** — phân tích ngữ cảnh → chỉ chạy scanner liên quan (xem mục "Chọn Scanner Thông minh").
- `--full`: Ép chạy đủ 13 scanner, bỏ qua smart selection. Dùng khi muốn audit toàn diện.
- `--only sqli,xss,cmdi`: Chỉ định chính xác scanner muốn chạy (bỏ qua smart selection). Dùng khi user đã biết cần quét gì. 3 base scanner (secrets, crypto, vuln-deps) vẫn luôn chạy kèm.
- `--auto-fix`: Sau khi audit, tự động tạo fix phases mà không cần hỏi người dùng xác nhận (chỉ khi có milestone).

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

#### 2. Workflow `workflows/audit.md`

Quy trình thực thi chi tiết cho lệnh `pd:audit`.

#### 3. Cập nhật `workflows/complete-milestone.md`

Thêm security gate: nếu chưa có `SECURITY_REPORT.md` trong `.planning/milestones/[version]/`, yêu cầu chạy `pd:audit` trước khi cho phép đóng milestone.

#### 4. Cập nhật `references/state-machine.md`

Thêm `pd:audit` vào luồng trạng thái — nhánh phụ chạy được bất kỳ lúc nào sau init, tương tự `pd:fix-bug`.

#### 5. Template `templates/security-fix-phase.md`

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

### Chọn Scanner Thông minh (Smart Selection)

#### Nguyên tắc

Không phải mọi scanner đều liên quan đến mọi tính năng. File upload không cần kiểm tra SQL Injection. Blog post không cần kiểm tra Path Traversal. Chạy scanner không liên quan = **lãng phí token + không tìm thấy gì**.

Smart selection phân tích ngữ cảnh rồi chỉ kích hoạt scanner có khả năng phát hiện lỗi thực tế.

#### Nguồn tín hiệu

| Chế độ         | Nguồn phân tích                                                                                               | Ưu tiên                       |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Milestone**  | ROADMAP.md (phase title + description) → PLAN.md (task mô tả) → git diff (files changed) → grep code patterns | Phase context trước, code sau |
| **Standalone** | Grep code patterns trên toàn bộ source                                                                        | Code patterns duy nhất        |

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

### Kiến trúc Batch Execution (Chạy lô 2 agent)

#### Nguyên tắc phân lô

Sau khi smart selection chọn N scanner (3 ≤ N ≤ 13), xếp vào wave theo **dependency logic** — scanner nền tảng trước, scanner phụ thuộc sau. Mỗi wave tối đa 2 agent song song:

```
Full order (13 scanner — khi dùng --full):

Wave 1: [pd-sec-secrets]         + [pd-sec-crypto]           ← A02: Nền tảng mật mã (luôn chạy)
Wave 2: [pd-sec-sql-injection]   + [pd-sec-cmd-injection]    ← A03: Injection cơ bản
Wave 3: [pd-sec-xss]             + [pd-sec-path-traversal]   ← A03/A10: Injection + SSRF
Wave 4: [pd-sec-auth]            + [pd-sec-misconfig]        ← A01/A05: Access + Config
Wave 5: [pd-sec-deserialization] + [pd-sec-prototype-pollution] ← A08/A03: Integrity
Wave 6: [pd-sec-insecure-design] + [pd-sec-vuln-deps]        ← A04/A06: Design + Deps (vuln-deps luôn chạy)
Wave 7: [pd-sec-logging]                                     ← A09: Logging
Wave 8: [pd-sec-reporter]                                    ← Tổng hợp

Smart mode ví dụ (6 scanner — upload avatar):

Wave 1: [pd-sec-secrets]        + [pd-sec-crypto]            ← Luôn chạy
Wave 2: [pd-sec-cmd-injection]  + [pd-sec-path-traversal]    ← Upload signals
Wave 3: [pd-sec-xss]            + [pd-sec-vuln-deps]         ← XSS filename + luôn chạy
Wave 4: [pd-sec-reporter]                                    ← Tổng hợp
```

Scanner không được chọn sẽ **không chạy** — wave rỗng bị bỏ qua.

**`--only` mode** ví dụ (`pd:audit --only path,cmdi,xss`):

```
Wave 1: [pd-sec-secrets]        + [pd-sec-crypto]            ← Luôn chạy
Wave 2: [pd-sec-cmd-injection]  + [pd-sec-path-traversal]    ← User chỉ định
Wave 3: [pd-sec-xss]            + [pd-sec-vuln-deps]         ← User chỉ định + luôn chạy
Wave 4: [pd-sec-reporter]                                    ← Tổng hợp
```

#### Cơ chế kiểm soát tài nguyên

- **Concurrency limit**: Tối đa 2 SubAgent cùng lúc.
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
│  2. Xác định scope quét:                                    │
│     - MILESTONE: git diff milestone branch → files changed  │
│     - STANDALONE: toàn bộ src/ (trừ vendor, build)          │
│                                                             │
│  3. Smart Selection: phân tích tín hiệu → chọn scanner     │
│     - Grep code patterns trong scope (milestone/toàn bộ)    │
│     - Match với bảng ánh xạ → danh sách scanner cần chạy    │
│     - Luôn bao gồm: secrets + crypto + vuln-deps            │
│     - --full: bỏ qua selection, chạy đủ 13                  │
│     - --only: user chỉ định scanner, bỏ qua selection       │
│                                                             │
│  4. Chạy N scanner theo batch (waves + reporter)            │
│     ┌──────────┐  ┌──────────┐                              │
│     │ Scanner A │  │ Scanner B │  ← Wave N (max 2)          │
│     └─────┬─────┘  └─────┬─────┘                            │
│           └───────┬───────┘                                  │
│                   ▼                                          │
│     Chờ cả 2 xong → bắt đầu Wave N+1                       │
│                                                             │
│  5. pd-sec-reporter tổng hợp → SECURITY_REPORT.md           │
│     (ghi rõ: scanner nào đã chạy, scanner nào bỏ qua + lý do)│
│                                                             │
│  6. Phân tích kết quả:                                      │
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
│  7. MILESTONE + cần fix → Tạo fix phases (xem mục dưới)    │
│                                                             │
│  8. Lưu SECURITY_REPORT.md:                                 │
│     - MILESTONE: .planning/milestones/[version]/            │
│     - STANDALONE: thư mục gốc dự án                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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

Fix phases **PHẢI** được sắp xếp theo thứ tự **ngược gadget chain** — fix điểm cuối trước (nơi RCE xảy ra), rồi mới fix điểm đầu:

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

Thêm bước kiểm tra **trước Bước 1** (trước mọi bước khác):

```markdown
## Bước 0.5: Security Gate

1. Kiểm tra file `.planning/milestones/[version]/SECURITY_REPORT.md` tồn tại
2. Nếu KHÔNG tồn tại:
   → Hiển thị: "⚠️ Chưa chạy kiểm toán bảo mật. Vui lòng chạy `/pd:audit` trước."
   → Dừng workflow, KHÔNG cho phép complete
3. Nếu tồn tại:
   → Đọc outcome trong SECURITY_REPORT.md
   → Nếu có CRITICAL chưa fix: "🛑 Còn lỗ hổng CRITICAL. Phải fix trước khi đóng milestone."
   → Nếu có WARNING chưa fix: "⚠️ Còn WARNING — cần xác nhận chấp nhận rủi ro."
   → Nếu clean/đã fix hết: ✅ Cho phép tiếp tục
```

#### Bổ sung Guard cho `commands/pd/complete-milestone.md`

Thêm vào section `<guards>`:

```markdown
- [ ] Có SECURITY_REPORT.md và không còn CRITICAL → "Chạy `/pd:audit` trước khi đóng milestone."
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
- **Shift-left security**: Bắt lỗi bảo mật TRƯỚC khi ship, không phải SAU khi bị hack.
- **Hoạt động độc lập**: Quét bất kỳ repo nào, không bắt buộc có `.planning/` hay milestone.
- **Tích hợp tự nhiên**: Khi có milestone, là security gate bắt buộc — một bước trong flow quen thuộc.
- **Gadget chain awareness**: Không fix random — fix theo thứ tự ưu tiên RCE chain (chỉ khi milestone mode).
- **OWASP Top 10 coverage**: 10/10 category, 13 scanner sẵn sàng — chạy đúng cái cần.
- **Tài nguyên kiểm soát**: 2 agent/lần + smart selection, không lãng phí token/CPU.
- **Audit trail**: Milestone mode lưu evidence trong `.planning/` — kiểm tra lại bất kỳ lúc nào.

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
