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
5. **Triển khai Agent Squad**: Trình cài đặt chưa biết cách copy và đăng ký thư mục `commands/pd/agents/` (Bộ não mới của hệ thống).
6. **Thiếu bước Nén Token (Minification)**: Chưa có cơ chế tự động tạo các bản rules cực gọn (`*.min.md`) để tối ưu chi phí token cho người dùng ngay từ khâu cài đặt.
7. **Trải nghiệm cài đặt "Tĩnh"**: Thiếu các phản hồi thị giác (Progress bar, Color coding) và bước kiểm tra sau cài đặt (Post-install verification).

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
  - `node bin/install.js --local`: Cài đặt các rules và hướng dẫn chỉ cho project hiện tại.
  - `node bin/install.js --ide [cursor|vscode|windsurf]`: Cấu hình chuyên biệt cho IDE.
  - **Self-Healing**: Tự động phát hiện và cập nhật các file cũ/sai định dạng trong `.planning/`.
- [ ] **Agent & Token Optimizer**:
  - Triển khai toàn bộ thư mục `agents/` cho tất cả nền tảng.
  - Tự động tạo bản nén `*.min.md` cho toàn bộ rules và references.
  - Tự động cấu hình **Model Tiering** dựa trên nền tảng cài đặt.
- [ ] **UX & Verification**:
  - Giao diện cài đặt có màu sắc và Progress Bar (dùng `chalk` & `cli-progress`).
  - **Smoke Test**: Tự động chạy lệnh kiểm tra kết nối MCP và khả năng nạp Agent sau khi cài xong.

### Cách thức triển khai
1. **Cập nhật `bin/lib/platforms.js`**: Thêm định nghĩa cho các nền tảng mới (Antigravity, Cursor, Windsurf).
2. **Sửa `bin/lib/installers/`**:
   - Tạo `bin/lib/installers/cursor.js`: Xử lý việc ghi vào `.cursorrules`.
   - Cập nhật `bin/lib/installers/gemini.js`: Thêm logic cho Antigravity.
3. **Tạo `bin/lib/converters/minifier.js`**: Script chuyên trách việc loại bỏ các thành phần rác trong Markdown (emoji, ví dụ thừa) để tạo bản `.min.md`.
4. **Nâng cấp `bin/install.js`**: 
   - Thêm menu tương tác chọn IDE và chế độ Local/Global.
   - Thêm bước "Build & Minify" trước khi copy file.
   - Tự động nạp cấu hình Model Tier Mapping tương ứng với nền tảng được chọn.
   - **Thêm UI/UX**: Sử dụng các ký tự Box-drawing và màu sắc để phân cấp thông tin.
5. **Tích hợp FastCode Setup**: Đảm bảo khi cài cho bất kỳ nền tảng nào, nếu chưa có FastCode thì sẽ tự động gợi ý cài đặt môi trường Python/venv.
6. **Tạo `bin/lib/post-install.js`**: Script chuyên trách việc chạy Smoke Test, kiểm tra quyền file và cấu hình biến môi trường `.env`.


---
*Ghi chú: Việc hỗ trợ tốt các IDE như Cursor sẽ giúp Please Done tiếp cận được lượng người dùng lớn hơn và quy trình làm việc trở nên trực quan hơn.*
