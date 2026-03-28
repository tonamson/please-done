---
description: "Analyze the project and create CLAUDE.md with project-specific coding conventions (style, naming, patterns)"
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
Analyze the project, detect coding conventions, ask about user preferences, then create or update `CLAUDE.md`.
</objective>
<guards>
There are no strict prerequisites. This skill can be run at any time.
- [ ] The project directory contains source code -> "The directory is empty or contains no source code to analyze."
</guards>
<context>
User input: $ARGUMENTS
</context>
<process>
## Bước 1: Kiểm tra CLAUDE.md hiện có
`CLAUDE.md` ở root:
- Đã có → "Đã có CLAUDE.md. (1) Bổ sung (giữ cũ) (2) Tạo lại"
- Chưa có → tiếp tục
## Bước 2: Phát hiện conventions từ code
Grep/Read quét patterns:
| Loại | Grep targets |
|------|-------------|
| Đặt tên | file naming (snake/kebab/camelCase/PascalCase), function/method, biến (prefix `is*`/`has*`/`_private`) |
| Import & module | aliases (`@/`, `~/`, `#/`), relative vs absolute, barrel exports (`index.ts`) |
| Styling | `className`+Tailwind, `styled.`/`` css` ``, `.module.css`, `style={{`, `antd`/`ant-design` |
| State management | `zustand`/`create<`, `redux`/`createSlice`, `GetxController`/`.obs`, `useState`/`useReducer` |
| API | `axios`, `fetch(`, `Dio` |
| Testing | `describe(`/`it(`, `WP_UnitTestCase`, `flutter_test` |
| Error & logging | `console.log`/`Logger`/`winston`, `throw new`/`HttpException`, ngôn ngữ throw messages |
| Formatting | `.prettierrc`/`.eslintrc`/`biome.json`, `tsconfig.json` (strict, paths, target) |
## Bước 3: Tổng hợp phát hiện
Liệt kê cho user:
```
Phát hiện từ code:
- Đặt tên: kebab-case files, camelCase functions
- Giao diện: Ant Design v6 + inline styles
- Trạng thái: Zustand
- ...
```
## Bước 4: Hỏi user bổ sung
Hỏi những thứ KHÔNG detect được:
1. Ngôn ngữ giao tiếp: ghi chú/JSDoc tiếng Việt hay Anh?
2. Phong cách commit: conventional? Tiếng Việt? Tiền tố?
3. Quy ước đặc biệt khác? (prefix MongoDB, format phân trang, cấu trúc thư mục...)
4. AI hay làm sai gì cần nhắc? (tạo file mới thay vì sửa, thêm thư viện không cần...)
User có thể skip bất kỳ câu nào.
## Bước 5: Tạo CLAUDE.md
```markdown
# Quy ước dự án
## Phong cách code
## Đặt tên
## Kiến trúc
## Nên / Không nên
## Build & Kiểm thử
```
Quy tắc: CHỈ viết thứ AI không tự suy ra. KHÔNG lặp kiến thức framework. Mỗi bullet 1 dòng. **Dưới 50 dòng.** CLAUDE.md cũ + bổ sung → merge, loại trùng.
## Bước 6: Thông báo
```
╔══════════════════════════════════════╗
║     CLAUDE.md đã tạo!               ║
╠══════════════════════════════════════╣
║ File: CLAUDE.md ([N] dòng)          ║
║ Claude Code tự đọc mỗi conversation ║
║ Sửa: trực tiếp hoặc /pd-conventions ║
╚══════════════════════════════════════╝
```
</process>
<output>
**Create/Update:**
- `CLAUDE.md` -- project coding conventions
**Next step:** `/pd-plan` or `/pd-write-code`
**Success when:**
- `CLAUDE.md` includes naming conventions, coding style, and active patterns
- The user confirms the content
**Common errors:**
- The project has no source code -> it cannot be analyzed
- The user disagrees -> allow manual editing
</output>
<rules>
- All output MUST be in English
- You MUST ask the user about personal preferences before creating `CLAUDE.md`
- `CLAUDE.md` MUST reflect the current codebase reality and must not impose new conventions
- CLAUDE.md DƯỚI 50 dòng — ngắn gọn, chỉ conventions riêng
- KHÔNG viết tutorial/giải thích framework
- KHÔNG lặp nội dung `.planning/rules/`
- PHẢI scan code thực tế trước khi hỏi user
- Project chưa có code → hỏi nhiều hơn, detect ít hơn
- CẤM đọc/hiển thị file nhạy cảm
- File tương thích Claude Code auto-load (CLAUDE.md ở root)
</rules>
