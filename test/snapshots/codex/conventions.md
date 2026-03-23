---
name: pd-conventions
description: "Phân tích dự án và tạo CLAUDE.md chứa quy ước code riêng (phong cách code, đặt tên, patterns)"
---
<codex_skill_adapter>
## Cách gọi skill này
Skill name: `$pd-conventions`
Khi user gọi `$pd-conventions {{args}}`, thực hiện toàn bộ instructions bên dưới.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: Khi cần hỏi user, dùng request_user_input thay vì AskUserQuestion
- `Task()` → `spawn_agent()`: Khi cần spawn sub-agent, dùng spawn_agent với fork_context
  - Chờ kết quả: `wait(agent_ids)`
  - Kết thúc agent: `close_agent()`
## Fallback tương thích
- Nếu `request_user_input` không khả dụng trong mode hiện tại, hỏi user bằng văn bản thường bằng 1 câu ngắn gọn rồi chờ user trả lời
- Mọi chỗ ghi "PHẢI dùng `request_user_input`" được hiểu là: ưu tiên dùng khi tool khả dụng; nếu không thì fallback sang hỏi văn bản thường, không được tự đoán thay user
## Quy ước
- `$ARGUMENTS` chính là `{{GSD_ARGS}}` — input từ user khi gọi skill
- Tất cả paths config đã được chuyển sang `~/.codex/`
- Các MCP tools (`mcp__*`) hoạt động tự động qua config.toml
- Đọc `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → lấy `SKILLS_DIR`
- Các tham chiếu `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → đọc từ thư mục source tương ứng
</codex_skill_adapter>
<objective>
Phân tích dự án, phát hiện quy ước code, hỏi ưu tiên của người dùng, rồi tạo hoặc cập nhật `CLAUDE.md`.
</objective>
<guards>
Không có điều kiện tiên quyết nghiêm ngặt. Skill này có thể chạy bất kỳ lúc nào.
- [ ] Thư mục dự án có source code -> "Thư mục trống hoặc không có source code để phân tích."
</guards>
<context>
Người dùng nhập: {{GSD_ARGS}}
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
║ Sửa: trực tiếp hoặc $pd-conventions ║
╚══════════════════════════════════════╝
```
</process>
<output>
**Tạo/Cập nhật:**
- `CLAUDE.md` -- quy ước code của dự án
**Bước tiếp theo:** `$pd-plan` hoặc `$pd-write-code`
**Thành công khi:**
- `CLAUDE.md` bao gồm quy ước đặt tên, phong cách code và pattern đang dùng
- Người dùng xác nhận nội dung
**Lỗi thường gặp:**
- Dự án không có source code -> không thể phân tích
- Người dùng không đồng ý -> cho phép chỉnh sửa thủ công
</output>
<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI hỏi người dùng về ưu tiên cá nhân trước khi tạo `CLAUDE.md`
- `CLAUDE.md` PHẢI phản ánh thực tế code hiện tại, không áp đặt quy ước mới
- CLAUDE.md DƯỚI 50 dòng — ngắn gọn, chỉ conventions riêng
- KHÔNG viết tutorial/giải thích framework
- KHÔNG lặp nội dung `.planning/rules/`
- PHẢI scan code thực tế trước khi hỏi user
- Project chưa có code → hỏi nhiều hơn, detect ít hơn
- CẤM đọc/hiển thị file nhạy cảm
- File tương thích Claude Code auto-load (CLAUDE.md ở root)
</rules>
