---
name: pd:conventions
description: "Phân tích dự án và tạo CLAUDE.md chứa quy ước code riêng (phong cách code, đặt tên, patterns)"
model: sonnet
argument-hint: "(khong can tham so)"
allowed-tools:
  - read_file
  - write_file
  - edit_file
  - run_shell_command
  - glob
  - search_file_content
  - AskUserQuestion
---
<objective>
Phân tích dự án, phát hiện coding conventions, hỏi user ưu tiên, tạo/cập nhật CLAUDE.md.
</objective>
<guards>
Khong co dieu kien tien quyet nghiem ngat. Skill nay co the chay bat ky luc nao.
- [ ] Thu muc du an co source code -> "Thu muc trong hoac khong co source code de phan tich."
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
search_file_content/read_file quét patterns:
| Loại | search_file_content targets |
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
║ Sửa: trực tiếp hoặc /pd:conventions ║
╚══════════════════════════════════════╝
```
</process>
<output>
**Tao/Cap nhat:**
- `CLAUDE.md` -- quy uoc code cua du an
**Buoc tiep theo:** `/pd:plan` hoac `/pd:write-code`
**Thanh cong khi:**
- CLAUDE.md bao gom: naming conventions, code style, patterns
- User xac nhan noi dung
**Loi thuong gap:**
- Du an khong co source code -> khong the phan tich
- User khong dong y -> cho phep chinh sua thu cong
</output>
<rules>
- Moi output PHAI bang tieng Viet co dau
- PHAI hoi user ve uu tien ca nhan truoc khi tao CLAUDE.md
- CLAUDE.md PHAI phan anh thuc te code hien tai, khong ap dat quy uoc moi
- CLAUDE.md DƯỚI 50 dòng — ngắn gọn, chỉ conventions riêng
- KHÔNG viết tutorial/giải thích framework
- KHÔNG lặp nội dung `.planning/rules/`
- PHẢI scan code thực tế trước khi hỏi user
- Project chưa có code → hỏi nhiều hơn, detect ít hơn
- CẤM đọc/hiển thị file nhạy cảm
- File tương thích Claude Code auto-load (CLAUDE.md ở root)
</rules>
