<!-- Audit 2026-03-23: Intentional -- simple conventions workflow without numbered steps (data-driven, not procedural). See Phase 14 Audit I7. -->
Phân tích dự án, phát hiện quy ước lập trình từ code, hỏi user ưu tiên riêng, tạo/cập nhật CLAUDE.md.

<context>
- @references/conventions.md → commit prefixes, biểu tượng, ngôn ngữ
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
║ Sửa: trực tiếp hoặc /pd:conventions ║
╚══════════════════════════════════════╝
```

</process>

<rules>
- CLAUDE.md DƯỚI 50 dòng — ngắn gọn, chỉ conventions riêng
- KHÔNG viết tutorial/giải thích framework
- KHÔNG lặp nội dung `.planning/rules/`
- PHẢI scan code thực tế trước khi hỏi user
- Project chưa có code → hỏi nhiều hơn, detect ít hơn
- CẤM đọc/hiển thị file nhạy cảm
- File tương thích Claude Code auto-load (CLAUDE.md ở root)
</rules>