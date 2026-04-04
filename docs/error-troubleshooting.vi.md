<!-- Translated from docs/error-troubleshooting.md -->
<!-- Source version: 1.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](error-troubleshooting.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](error-troubleshooting.vi.md)

# Hướng dẫn Xử lý Lỗi

Hướng dẫn toàn diện để chẩn đoán và sửa các lỗi phổ biến khi sử dụng các skill Please Done (PD). Hướng dẫn này cung cấp các bảng tham khảo nhanh và các mục lỗi chi tiết để giúp bạn giải quyết vấn đề nhanh chóng.

## Mục Lục

- [Cách Sử dụng Hướng dẫn này](#cách-sử-dụng-hướng-dẫn-này)
- [Bảng Tham khảo Nhanh](#bảng-tham-khảo-nhanh)
  - [Lỗi Cài đặt](#lỗi-cài-đặt-1)
  - [Lỗi Lập kế hoạch](#lỗi-lập-kế-hoạch-1)
  - [Lỗi Thực thi](#lỗi-thực-thi-1)
  - [Lỗi Gỡ lỗi](#lỗi-gỡ-lỗi-1)
- [Hướng dẫn Lỗi Chi tiết](#hướng-dẫn-lỗi-chi-tiết)
  - [Lỗi Cài đặt](#lỗi-cài-đặt)
  - [Lỗi Lập kế hoạch](#lỗi-lập-kế-hoạch)
  - [Lỗi Thực thi](#lỗi-thực-thi)
  - [Lỗi Gỡ lỗi](#lỗi-gỡ-lỗi)
- [Tài liệu Tham khảo Liên quan](#tài-liệu-tham-khảo-liên-quan)

---

## Cách Sử dụng Hướng dẫn này

1. **Quét Nhanh**: Tra cứu lỗi của bạn trong [Bảng Tham khảo Nhanh](#bảng-tham-khảo-nhanh) để tìm nguyên nhân và giải pháp nhanh chóng
2. **Hướng dẫn Chi tiết**: Click vào bất kỳ mã lỗi nào (ví dụ: ERR-001) để xem các bước khắc phục đầy đủ
3. **Thực hiện Các Bước**: Thực thi các "Các Hành động Đề xuất" được đánh số theo thứ tự
4. **Vẫn Chưa Giải quyết được?**: Kiểm tra các liên kết "Xem thêm" để có thêm tài nguyên

---

## Bảng Tham khảo Nhanh

### Lỗi Cài đặt

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| FastCode MCP is not connected | Docker service không chạy hoặc MCP cấu hình sai | 1. Kiểm tra `docker ps`<br>2. Khởi động lại MCP container<br>3. Xác minh `claude_desktop_config.json` |
| Context7 MCP is not connected | MCP service không khả dụng hoặc lỗi mạng | 1. Kiểm tra kết nối mạng<br>2. Khởi động lại Context7 service<br>3. Sử dụng Grep/Read fallback |
| Missing prerequisites (Node/Python/Git) | Công cụ yêu cầu chưa được cài đặt hoặc không có trong PATH | 1. Cài đặt công cụ còn thiếu<br>2. Xác minh với `which [tool]`<br>3. Kiểm tra cấu hình PATH |
| `.planning/` directory does not exist | Dự án chưa được khởi tạo | 1. Chạy `/pd:init`<br>2. Hoặc chạy `/pd:onboard`<br>3. Thử lại lệnh |

### Lỗi Lập kế hoạch

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| Missing `CONTEXT.md` | Dự án chưa được khởi tạo hoặc file đã bị xóa | 1. Chạy `/pd:init`<br>2. Kiểm tra project root<br>3. Thử lại lệnh |
| Missing `ROADMAP.md` | Chưa tạo milestone nào | 1. Chạy `/pd:new-milestone [name]`<br>2. Ví dụ: `/pd:new-milestone "v1.1"`<br>3. Thử lại `/pd:plan` |
| Phase does not exist in ROADMAP | Số phase không hợp lệ được cung cấp | 1. Kiểm tra `.planning/ROADMAP.md`<br>2. Sử dụng số phase hợp lệ<br>3. Hoặc chạy `/pd:plan` không có phase |
| Circular dependencies detected | Các phase có tham chiếu phụ thuộc vòng tròn | 1. Xem xét ROADMAP.md dependencies<br>2. Loại bỏ các tham chiếu vòng tròn<br>3. Sắp xếp lại phase nếu cần |

### Lỗi Thực thi

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| Lint or build fails | Code vi phạm lint rules hoặc có lỗi syntax | 1. Đọc error output<br>2. Sửa ESLint/TypeScript errors<br>3. Chạy `npm run lint && npm run build` |
| Tests fail | Implementation không khớp với kỳ vọng | 1. Đọc chi tiết test failure<br>2. Xác định các file bị ảnh hưởng<br>3. Sửa implementation<br>4. Chạy lại tests |
| MCP is not connected (during execution) | FastCode/Context7 MCP không khả dụng | 1. Kiểm tra Docker services<br>2. Skills tự động sử dụng fallback<br>3. Tiếp tục hoặc thử lại sau khi sửa |
| Test framework not found | Test runner chưa được cài đặt hoặc cấu hình | 1. Kiểm tra `package.json` scripts<br>2. Cài đặt test framework<br>3. Chạy `/pd:test --standalone` |

### Lỗi Gỡ lỗi

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| The bug cannot be reproduced | Thông tin cung cấp không đầy đủ | 1. Thêm error messages và các bước<br>2. Bao gồm expected vs actual<br>3. Kiểm tra logs và thử lại |
| Unfinished tasks remain | Tasks chưa được đánh dấu hoàn thành trong milestone | 1. Chạy `/pd:status`<br>2. Hoàn thành các tasks còn lại<br>3. Thử lại `/pd:complete-milestone` |
| Open bugs remain | Có bugs trong `.planning/bugs/` | 1. Liệt kê bugs: `ls .planning/bugs/`<br>2. Chạy `/pd:fix-bug` cho mỗi cái<br>3. Thử lại completion |

---

## Hướng dẫn Lỗi Chi tiết

## Lỗi Cài đặt

### ERR-001: FastCode MCP is not connected

**Lỗi:** "FastCode MCP is not connected"

**Skill bị Ảnh hưởng:** `pd:init`, `pd:plan`, `pd:write-code`, `pd:scan`, `pd:onboard`

**Nguyên nhân:**
FastCode MCP server yêu cầu Docker để chạy. Lỗi này xảy ra khi:
- Docker daemon không chạy
- MCP container đã dừng hoặc bị crash
- Cấu hình trong `claude_desktop_config.json` không chính xác
- Vấn đề kết nối mạng giữa Claude và MCP server

**Các Hành động Đề xuất:**
1. Kiểm tra Docker status: `docker ps`
2. Nếu Docker không chạy, khởi động Docker Desktop
3. Kiểm tra nếu MCP container đang chạy: `docker ps | grep fastcode`
4. Nếu container đã dừng, khởi động lại: `docker start <container_id>`
5. Xác minh cấu hình Claude Desktop của bạn:
   ```json
   {
     "mcpServers": {
       "fastcode": {
         "command": "docker",
         "args": ["run", "--rm", "-i", "fastcode-mcp"]
       }
     }
   }
   ```
6. Khởi động lại Claude Desktop để reload MCP configuration
7. Thử lại skill command

**Xem thêm:**
- [Setup Guide](setup.md#mcp-configuration)
- [Error Recovery Guide](error-recovery.md#mcp-connection-errors)

---

### ERR-002: Context7 MCP is not connected

**Lỗi:** "Context7 MCP is not connected"

**Skill bị Ảnh hưởng:** `pd:plan`, `pd:write-code`, `pd:fix-bug`, `pd:research`

**Nguyên nhân:**
Context7 MCP server không khả dụng. Lỗi này xảy ra khi:
- Context7 service không chạy
- Vấn đề kết nối mạng
- Lỗi cấu hình trong MCP settings
- Service tạm thời down

**Các Hành động Đề xuất:**
1. Kiểm tra kết nối mạng đến Context7 service
2. Xác minh Context7 MCP configuration trong `claude_desktop_config.json`
3. Khởi động lại Context7 MCP service nếu cần
4. Skills sẽ tự động fallback sang Grep/Read tools nếu Context7 không khả dụng
5. Nếu fallback đang hoạt động, bạn có thể tiếp tục thực thi
6. Đối với các vấn đề lâu dài, kiểm tra Context7 documentation hoặc liên hệ support
7. Thử lại skill command sau khi sửa kết nối

**Xem thêm:**
- [Setup Guide](setup.md#mcp-configuration)
- [Research Command Reference](commands/pd/research.md)

---

### ERR-003: Missing prerequisites (Node/Python/Git)

**Lỗi:** "Missing prerequisite: [tool]" hoặc "[tool] is not installed"

**Skill bị Ảnh hưởng:** `pd:init`, `pd:scan`, `pd:onboard`, `pd:test`

**Nguyên nhân:**
Một công cụ phát triển yêu cầu chưa được cài đặt hoặc không khả dụng trong system PATH:
- Node.js được yêu cầu cho các dự án JavaScript/TypeScript
- Python được yêu cầu cho các dự án Python
- Git được yêu cầu cho các thao tác version control

**Các Hành động Đề xuất:**
1. Kiểm tra nếu công cụ đã được cài đặt: `which node` / `which python` / `which git`
2. Nếu chưa được cài đặt, cài đặt công cụ yêu cầu:
   - **Node.js**: Tải từ [nodejs.org](https://nodejs.org) hoặc sử dụng `nvm`
   - **Python**: Tải từ [python.org](https://python.org) hoặc sử dụng `pyenv`
   - **Git**: Tải từ [git-scm.com](https://git-scm.com)
3. Xác minh cài đặt: `node --version` / `python --version` / `git --version`
4. Đảm bảo công cụ nằm trong system PATH của bạn
5. Khởi động lại terminal để refresh PATH
6. Thử lại skill command

**Xem thêm:**
- [Setup Guide](setup.md#prerequisites)
- [Project Initialization](commands/pd/init.md)

---

### ERR-004: .planning/ directory does not exist

**Lỗi:** ".planning/ directory does not exist" hoặc "The project has not been initialized yet"

**Skill bị Ảnh hưởng:** `pd:status`, `pd:what-next`, `pd:plan`, `pd:new-milestone`

**Nguyên nhân:**
Dự án chưa được khởi tạo với `/pd:init`. Thư mục `.planning/` chứa:
- Các file cấu hình dự án
- ROADMAP.md và STATE.md
- Các phase plans và summaries
- Thông tin theo dõi bugs

**Các Hành động Đề xuất:**
1. Chạy `/pd:init` để khởi tạo cấu trúc dự án
2. Hoặc, chạy `/pd:onboard` cho automated setup với phân tích bổ sung
3. Xác minh thư mục `.planning/` đã được tạo: `ls -la .planning/`
4. Kiểm tra các key files tồn tại: `ls .planning/CONTEXT.md`
5. Thử lại command ban đầu của bạn

**Xem thêm:**
- [Init Command Reference](commands/pd/init.md)
- [Onboard Command Reference](commands/pd/onboard.md)

---

## Lỗi Lập kế hoạch

### ERR-005: Missing CONTEXT.md

**Lỗi:** "CONTEXT.md is missing" hoặc "Run `/pd:init` first"

**Skill bị Ảnh hưởng:** `pd:new-milestone`, `pd:plan`, `pd:complete-milestone`

**Nguyên nhân:**
File khởi tạo dự án bị thiếu. Điều này xảy ra khi:
- Dự án chưa được khởi tạo
- CONTEXT.md đã bị xóa nhầm
- Chạy commands từ sai directory

**Các Hành động Đề xuất:**
1. Chạy `/pd:init` để tạo CONTEXT.md với project settings
2. Kiểm tra nếu bạn đang ở đúng project root directory
3. Nếu CONTEXT.md tồn tại ở nơi khác, di chuyển nó về project root
4. Xác minh file đã được tạo: `cat .planning/CONTEXT.md`
5. Thử lại skill command

**Xem thêm:**
- [Initialization Guide](setup.md#initialization)
- [Context Documentation](.planning/CONTEXT.md)

---

### ERR-006: Missing ROADMAP.md

**Lỗi:** "ROADMAP.md is missing" hoặc "Run `/pd:new-milestone` first"

**Skill bị Ảnh hưởng:** `pd:plan`

**Nguyên nhân:**
Chưa có milestone nào được tạo. ROADMAP.md chứa:
- Các định nghĩa phase và mô tả
- Phân rã tasks
- Dependencies giữa các phase
- Theo dõi tiến độ

**Các Hành động Đề xuất:**
1. Chạy `/pd:new-milestone [milestone-name]` để tạo một milestone
2. Ví dụ: `/pd:new-milestone "v1.1 Notifications Feature"`
3. Xác minh ROADMAP.md đã được tạo: `cat .planning/ROADMAP.md`
4. Xem xét cấu trúc roadmap được tạo
5. Thử lại `/pd:plan` để tạo plans cho các phase

**Xem thêm:**
- [Milestone Guide](setup.md#milestones)
- [New Milestone Command](commands/pd/new-milestone.md)

---

### ERR-007: Phase does not exist in ROADMAP

**Lỗi:** "Phase does not exist in ROADMAP" hoặc "Invalid phase number"

**Skill bị Ảnh hưởng:** `pd:plan`, `pd:write-code`

**Nguyên nhân:**
Số phase được chỉ định không được định nghĩa trong roadmap. Điều này xảy ra khi:
- Lỗi đánh máy trong số phase
- Tham chiếu một phase chưa được định nghĩa
- Sử dụng sai format (ví dụ: "1" thay vì "1.1")

**Các Hành động Đề xuất:**
1. Mở `.planning/ROADMAP.md` để xem các phase có sẵn
2. Kiểm tra đúng format số phase (ví dụ: "1.2", "2.1")
3. Sử dụng một số phase hợp lệ từ roadmap
4. Hoặc, chạy `/pd:plan` không có số phase để tự động chọn phase tiếp theo
5. Nếu phase nên tồn tại, kiểm tra ROADMAP.md cho các lỗi đánh máy

**Xem thêm:**
- [Planning Guide](setup.md#planning)
- [Plan Command Reference](commands/pd/plan.md)

---

### ERR-008: Circular dependencies detected

**Lỗi:** "Circular dependencies detected" hoặc "Cannot resolve phase dependencies"

**Skill bị Ảnh hưởng:** `pd:plan`, `pd:new-milestone`

**Nguyên nhân:**
Các phase có tham chiếu dependency vòng tròn nơi:
- Phase A phụ thuộc vào Phase B
- Phase B phụ thuộc vào Phase A
- Hoặc một chuỗi dài hơn quay lại

**Các Hành động Đề xuất:**
1. Mở `.planning/ROADMAP.md` để xem xét các phase dependencies
2. Xác định tham chiếu vòng tròn trong dependency chain
3. Loại bỏ hoặc phá vỡ dependency vòng tròn
4. Sắp xếp lại các phase nếu cần để tạo luồng dependency tuyến tính
5. Lưu ROADMAP.md và thử lại command

**Xem thêm:**
- [Roadmap Structure](setup.md#roadmap-structure)
- [Dependency Management](.planning/phases/README.md)

---

## Lỗi Thực thi

### ERR-009: Lint or build fails

**Lỗi:** "Lint or build fails" hoặc các thông báo lỗi lint cụ thể

**Skill bị Ảnh hưởng:** `pd:write-code`, `pd:test`

**Nguyên nhân:**
Code vi phạm linting rules hoặc có lỗi build:
- ESLint errors (syntax, style violations)
- TypeScript type errors
- Import/export issues
- Missing dependencies

**Các Hành động Đề xuất:**
1. Đọc toàn bộ error output để xác định các vấn đề cụ thể
2. Sửa ESLint errors:
   - Thêm missing semicolons
   - Loại bỏ unused variables
   - Sửa indentation và spacing
3. Sửa TypeScript errors:
   - Giải quyết type mismatches
   - Thêm proper type annotations
   - Sửa interface definitions
4. Chạy lint check: `npm run lint`
5. Chạy build: `npm run build`
6. Nếu errors vẫn còn, sử dụng `/pd:write-code --resume` để thử lại từ bước bị lỗi

**Xem thêm:**
- [Code Standards](../CLAUDE.md)
- [Error Recovery Guide](error-recovery.md#code-issues)

---

### ERR-010: Tests fail

**Lỗi:** "Tests fail" hoặc "X tests failed: [test names]"

**Skill bị Ảnh hưởng:** `pd:test`, `pd:write-code`

**Nguyên nhân:**
Implementation không khớp với kỳ vọng của test:
- Logic errors trong implementation
- Regression trong chức năng hiện có
- Test expectations không được đáp ứng
- Environment differences

**Các Hành động Đề xuất:**
1. Đọc test failure output để hiểu expected vs actual behavior
2. Xác định các file bị ảnh hưởng từ error context
3. Xem xét implementation code
4. Sửa implementation để khớp với expected behavior
5. Chạy tests lại: `npm test` hoặc `/pd:test --all`
6. Nếu infrastructure error xảy ra, chạy `/pd:test --standalone` để setup test framework
7. Xác minh tất cả tests pass trước khi tiếp tục

**Xem thêm:**
- [Testing Guide](testing.md)
- [Test Command Reference](commands/pd/test.md)

---

### ERR-011: MCP is not connected (during execution)

**Lỗi:** "MCP is not connected" (trong test hoặc write-code)

**Skill bị Ảnh hưởng:** `pd:test`, `pd:write-code`

**Nguyên nhân:**
FastCode hoặc Context7 MCP trở nên không khả dụng trong quá trình thực thi:
- Docker service stopped
- MCP container crashed
- Network interruption

**Các Hành động Đề xuất:**
1. Kiểm tra Docker status: `docker ps`
2. Skills sẽ tự động sử dụng fallback tools (Grep/Read) nếu MCP không khả dụng
3. Một cảnh báo sẽ hiển thị: "⚠️ FastCode unavailable — using Grep/Read fallback"
4. Bạn có thể tiếp tục với execution sử dụng fallback tools
5. Hoặc, sửa MCP connectivity và thử lại
6. Kết quả có thể chậm hơn một chút nhưng vẫn sẽ hoạt động

**Xem thêm:**
- [MCP Setup](setup.md#mcp)
- [Fallback Documentation](error-recovery.md#fallback-mode)

---

### ERR-012: Test framework not found

**Lỗi:** "Test framework not found" hoặc "Cannot run tests"

**Skill bị Ảnh hưởng:** `pd:test`

**Nguyên nhân:**
Test runner chưa được cài đặt hoặc chưa được cấu hình:
- Missing test framework (Jest, Mocha, etc.)
- Missing configuration file
- Dependencies chưa được cài đặt

**Các Hành động Đề xuất:**
1. Kiểm tra `package.json` cho test scripts trong phần "scripts"
2. Cài đặt test dependencies:
   - `npm install --save-dev jest` (hoặc framework ưa thích của bạn)
3. Xác minh test configuration file tồn tại (ví dụ: `jest.config.js`)
4. Chạy `/pd:test --standalone` để auto-setup test infrastructure
5. Xác minh cài đặt: `npx jest --version`
6. Thử lại chạy tests

**Xem thêm:**
- [Testing Setup](setup.md#testing)
- [Test Framework Guide](testing.md#framework-setup)

---

## Lỗi Gỡ lỗi

### ERR-013: The bug cannot be reproduced

**Lỗi:** "The bug cannot be reproduced"

**Skill bị Ảnh hưởng:** `pd:fix-bug`

**Nguyên nhân:**
Thông tin cung cấp không đầy đủ để reproduce bug:
- Missing error messages
- Incomplete steps to reproduce
- Missing environment details
- Unclear expected vs actual behavior

**Các Hành động Đề xuất:**
1. Cung cấp thông tin chi tiết hơn:
   - Full error messages với stack traces
   - Các bước chính xác để reproduce issue
   - Expected behavior vs actual behavior
   - Environment details (OS, Node version, package versions)
2. Kiểm tra error logs: `tail -n 50 .planning/logs/agent-errors.jsonl`
3. Tìm patterns trong logs có thể chỉ ra root cause
4. Thử lại `/pd:fix-bug` với bug description toàn diện hơn
5. Bao gồm các file paths và line numbers cụ thể nếu biết

**Xem thêm:**
- [Bug Investigation](error-recovery.md#pd:fix-bug)
- [Fix Bug Command](commands/pd/fix-bug.md)

---

### ERR-014: Unfinished tasks remain

**Lỗi:** "There are unfinished tasks" hoặc "Complete them before closing the milestone"

**Skill bị Ảnh hưởng:** `pd:complete-milestone`

**Nguyên nhân:**
Có các tasks trong milestone hiện tại chưa được đánh dấu là hoàn thành:
- Plans đã được tạo nhưng chưa được thực thi
- Tasks đã được hoàn thành một phần
- STATE.md hiển thị incomplete status

**Các Hành động Đề xuất:**
1. Chạy `/pd:status` để xem danh sách các incomplete tasks
2. Hoặc đọc `.planning/STATE.md` để kiểm tra tiến độ hiện tại
3. Hoàn thành các tasks còn lại sử dụng `/pd:write-code` cho mỗi plan
4. Xác minh tất cả tasks được đánh dấu hoàn thành trong STATE.md
5. Sau khi tất cả tasks hoàn thành, thử lại `/pd:complete-milestone`

**Xem thêm:**
- [Milestone Completion](setup.md#completing-milestones)
- [State Documentation](.planning/STATE.md)

---

### ERR-015: Open bugs remain

**Lỗi:** "There are still unresolved bugs" hoặc "Run `/pd:fix-bug` first"

**Skill bị Ảnh hưởng:** `pd:complete-milestone`

**Nguyên nhân:**
Có các unresolved bugs trong thư mục `.planning/bugs/`:
- Bugs đã được báo cáo nhưng chưa được sửa
- Các file bug vẫn còn trong thư mục bugs
- Các vấn đề critical cần giải quyết trước khi hoàn thành milestone

**Các Hành động Đề xuất:**
1. Liệt kê các open bugs: `ls -la .planning/bugs/`
2. Đọc mỗi bug file để hiểu các vấn đề: `cat .planning/bugs/*.md`
3. Chạy `/pd:fix-bug "[bug description]"` cho mỗi open bug
4. Hoặc sử dụng `/pd:status` để xem bug summary
5. Xác minh tất cả bugs được giải quyết (các file bug có thể được chuyển sang `.planning/bugs/fixed/`)
6. Sau khi tất cả bugs được giải quyết, thử lại `/pd:complete-milestone`

**Xem thêm:**
- [Bug Management](setup.md#bugs)
- [Bug Directory](.planning/bugs/)

---

## Tài liệu Tham khảo Liên quan

- [Error Recovery Guide](error-recovery.md) — Xử lý lỗi nâng cao và phân tích logs
- [Setup Guide](setup.md) — Cài đặt ban đầu và cấu hình MCP
- [CLAUDE.md](../CLAUDE.md) — Các quy ước dự án và coding standards
- [State Tracking](.planning/STATE.md) — Trạng thái dự án hiện tại và tiến độ

---

*Cập nhật lần cuối: 2026-04-04*
