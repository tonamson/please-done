# Nâng cấp Skill fix-bug

Dưới đây là kế hoạch nâng cấp skill `fix-bug` dựa trên kết quả review định kỳ.

## Milestone 1: Tối ưu hóa độ an toàn và tự động hóa điều tra

### Mô tả
Tăng cường khả năng tự động hóa việc tái hiện lỗi, dọn dẹp môi trường sau khi sửa và kiểm tra các vùng ảnh hưởng (regression analysis).

### Deliverables
- [ ] Tích hợp tính năng tự động tạo Reproduction Test Case cho các stack hỗ trợ (NestJS, Flutter).
- [ ] Bổ sung bước "Regression Analysis" tự động tìm và kiểm tra các hàm/module phụ thuộc trước khi báo cáo hoàn tất.
- [ ] Triển khai cơ chế "Auto Cleanup" cho các log tạm thời (temporary logs) được thêm vào trong quá trình điều tra.
- [ ] **Đồng bộ Business Logic**: Tự động phát hiện nếu bản sửa lỗi làm thay đổi Business Logic/Kiến trúc hệ thống.
- [ ] **Tự động cập nhật Báo cáo (PDF)**: Nếu Business Logic thay đổi, BẮT BUỘC cập nhật `MANAGEMENT_REPORT.md` và chạy `scripts/generate-pdf-report.js` để xuất bản PDF mới.
- [ ] Liên kết với `pd:scan` để tham chiếu các cảnh báo bảo mật hiện có liên quan đến file bị lỗi.
- [ ] Bổ sung bước "Post-mortem" đề xuất cập nhật `CLAUDE.md` sau khi lỗi được xác nhận.

### Cách thức triển khai
1. **Phân bổ Model Agent (Thế hệ 4.x)**:
   - `pd:fix-bug` & `pd:complete-milestone`: Sử dụng **Claude 4.6 Sonnet** (Đỉnh cao về kiến trúc, suy luận lỗi và trực quan hóa sơ đồ).
   - `pd:init`, `pd:scan`, `pd:what-next`: Sử dụng **Claude 4.5 Haiku** (Tốc độ xử lý tức thì, tối ưu chi phí token cho các tác vụ quét).
2. Sửa `workflows/fix-bug.md` tại Bước 5b để ưu tiên tạo file test tái hiện.
3. Thêm logic vào Bước 8 để thực hiện Regression Analysis thông qua FastCode Call Chain.
4. **Bổ sung vào Bước 10 (Xác nhận)**:
   - AI đánh giá: "Bản sửa này có làm thay đổi luồng nghiệp vụ/kiến trúc không?"
   - Nếu **CÓ**: Tự động cập nhật sơ đồ Mermaid và nội dung trong báo cáo quản lý, sau đó gọi script xuất PDF.
5. Bổ sung quy tắc dọn dẹp log vào Bước 10 trước khi commit.
6. Cập nhật `commands/pd/fix-bug.md` để bao gồm các công cụ mới (nếu cần).
