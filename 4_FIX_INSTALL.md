# Sửa lỗi và Nâng cấp Trình cài đặt (Fix & Upgrade Installer)

Kế hoạch khắc phục các hạn chế của `bin/install.js` và bổ sung hỗ trợ cho các IDE/AI CLI mới (Cursor, VS Code, Antigravity, Windsurf).

## Milestone 1: Đa nền tảng & Tích hợp IDE

### Mô tả
Nâng cấp trình cài đặt để hỗ trợ cài đặt cục bộ (Local), cấu hình tự động cho các IDE (Cursor, VS Code) và các AI CLI thế hệ mới (Antigravity). Đảm bảo quy trình cài đặt mượt mà, tự động đăng ký Skills và MCP.

### Các vấn đề cần sửa (Issues to Fix)
1. **Thiếu hỗ trợ Local Installation cho IDE**: Hiện tại `please-done` tập trung vào Global (`~/.claude/`), nhưng các IDE như Cursor/VS Code hoạt động tốt nhất khi có cấu hình `.cursorrules` hoặc `.vscode/custom-instructions.md` ngay tại thư mục dự án.
2. **Thiếu hỗ trợ Antigravity**: Đây là bản nâng cấp của Gemini CLI, cần có đường dẫn cài đặt riêng (`~/.gemini/antigravity/`).
3. **Cấu hình MCP chưa tự động**: GSD có cơ chế tự động cấu hình MCP vào file `claude_desktop_config.json` hoặc tương đương, `please-done` cần làm điều này cho cả Cursor và Gemini.
4. **Thiếu cơ chế "Sync Rules"**: Khi cài đặt cho IDE, cần tự động đồng bộ các file trong `commands/pd/rules/` vào file hướng dẫn của IDE để AI hiểu được stack của dự án ngay lập tức.

### Deliverables (Sản phẩm bàn giao)
- [ ] **Hỗ trợ Cursor & VS Code**: 
  - Tự động tạo/cập nhật `.cursorrules` hoặc `.vscode/settings.json` với các chỉ dẫn của Please Done.
  - Tích hợp logic "System Prompt" của Please Done vào IDE.
- [ ] **Hỗ trợ Antigravity (Gemini)**:
  - Bổ sung đường dẫn cài đặt: `~/.gemini/antigravity/commands/pd/`.
  - Tự động chuyển đổi định dạng skill sang chuẩn Antigravity.
- [ ] **Tự động cấu hình MCP**:
  - Tự động thêm FastCode và Context7 vào file cấu hình của Cursor/VS Code/Gemini.
- [ ] **Lệnh cài đặt cải tiến**:
  - `node bin/install.js --local`: Cài đặt các rules và hướng dẫn chỉ cho project hiện tại (dùng cho Cursor/Windsurf).
  - `node bin/install.js --ide [cursor|vscode|windsurf]`: Cấu hình chuyên biệt cho IDE.

### Cách thức triển khai
1. **Cập nhật `bin/lib/platforms.js`**: Thêm định nghĩa cho các nền tảng mới (Antigravity, Cursor, Windsurf).
2. **Sửa `bin/lib/installers/`**:
   - Tạo `bin/lib/installers/cursor.js`: Xử lý việc ghi vào `.cursorrules`.
   - Cập nhật `bin/lib/installers/gemini.js`: Thêm logic cho Antigravity.
3. **Nâng cấp `bin/install.js`**: Thêm menu tương tác cho phép chọn IDE và chế độ Local/Global.
4. **Tích hợp FastCode Setup**: Đảm bảo khi cài cho bất kỳ nền tảng nào, nếu chưa có FastCode thì sẽ tự động gợi ý cài đặt môi trường Python/venv.

---
*Ghi chú: Việc hỗ trợ tốt các IDE như Cursor sẽ giúp Please Done tiếp cận được lượng người dùng lớn hơn và quy trình làm việc trở nên trực quan hơn.*
