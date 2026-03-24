# Báo cáo Thị giác & Business Logic

Kế hoạch tích hợp khả năng vẽ sơ đồ luồng nghiệp vụ và kiến trúc hệ thống vào quy trình tổng kết dự án.

## Milestone 1: Trực quan hóa Business Logic cho Quản lý
### Mô tả
Nâng cấp khả năng của AI trong việc tự động phân tích code và các kế hoạch (`PLAN.md`) để vẽ ra các sơ đồ thị giác (Flowcharts, Sequence Diagrams) minh họa rõ nét Business Logic, thay vì chỉ sử dụng văn bản Markdown thuần túy.

### Deliverables (Sản phẩm bàn giao)
- [ ] **Sơ đồ Luồng Nghiệp vụ (Business Logic Flowchart)**: Vẽ bằng Mermaid.js mô tả cách người dùng tương tác với các tính năng chính trong Milestone.
- [ ] **Sơ đồ Kiến trúc Hệ thống (Architecture Diagram)**: Minh họa kết nối giữa các Module, Service, Database và các bên thứ ba (APIs).
- [ ] **Template Báo cáo Quản lý (`MANAGEMENT_REPORT.md`)**: Một báo cáo chuyên nghiệp tập trung vào kết quả kinh doanh và kiến trúc tổng thể, không quá sâu vào chi tiết kỹ thuật.
- [ ] **Tích hợp Mermaid-to-Image/PDF**: Hướng dẫn hoặc tích hợp lệnh tự động chuyển đổi Markdown + Mermaid sang file PDF có hình ảnh rõ nét.

### Cách thức triển khai
1. **Phân bổ Model Agent (Thế hệ 4.x)**:
   - **Claude 4.6 Opus**: Dùng cho việc viết **Management Summary** và phân tích **Kiến trúc tổng thể** (Đảm bảo ngôn ngữ chuyên nghiệp, tầm nhìn chiến lược cho Manager).
   - **Claude 4.6 Sonnet**: Dùng cho việc **Vẽ sơ đồ Mermaid** và lập trình **`scripts/generate-pdf-report.js`** (Chính xác tuyệt đối về cú pháp sơ đồ và logic script).
   - **Claude 4.5 Haiku**: Dùng cho việc **Cập nhật Rules** và các tác vụ quét file phụ trợ (Tối ưu tốc độ).
2. **Tạo Template mới**: Bổ sung `templates/visual-report.md` với các khung sơ đồ mẫu.
3. **Tạo Script hỗ trợ**: 
   - Tạo `scripts/generate-pdf-report.js`: Script Node.js để quản lý việc render Mermaid và xuất PDF bằng `md-to-pdf`.
   - **Quan trọng**: Script BẮT BUỘC lấy đường dẫn hiện tại (`process.cwd()`) để xuất file PDF vào `./.planning/reports/` của dự án đang chạy lệnh, không được fix cứng vào thư mục gốc của `please-done`.
4. **Cập nhật Workflow `complete-milestone`**: 
   - Thêm bước yêu cầu AI "Phân tích và vẽ ít nhất 2 sơ đồ Mermaid" tại Bước 4.
   - Gọi lệnh: `node [SKILLS_DIR]/scripts/generate-pdf-report.js .planning/milestones/[version]/MANAGEMENT_REPORT.md`
5. **Cập nhật Rules**: Bổ sung quy tắc vẽ sơ đồ vào `rules/general.md` để AI luôn tuân thủ chuẩn thẩm mỹ (màu sắc, mũi tên, nhãn).
6. **Thông báo kết quả**: AI hiển thị đường dẫn file PDF đã tạo: `./.planning/reports/MANAGEMENT_REPORT_[version].pdf`.

---
*Ghi chú: Milestone này sẽ biến Please Done từ một công cụ hỗ trợ Dev thành một công cụ hỗ trợ Quản lý dự án mạnh mẽ.*
