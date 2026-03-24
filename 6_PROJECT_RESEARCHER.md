# Biệt đội Nghiên cứu Dự án (Project Research Squad)

Hệ thống Sub-agents chuyên biệt để nghiên cứu kỹ thuật, phân tích codebase và đảm bảo an toàn kiến trúc.

## Milestone 1: Tích hợp GSD-Research-Squad & Audit-Ready System

### Mô tả
Tích hợp bộ tác tử nghiên cứu đa năng với cơ chế lưu trữ phân tách, đánh số và dẫn chứng minh bạch. Đảm bảo mọi kết quả nghiên cứu đều có thể kiểm chứng (Audit) và không gây xung đột dữ liệu.

### Deliverables (Sản phẩm bàn giao)

#### 1. Cấu trúc lưu trữ Phân tách (`.planning/research/`)
- [ ] **`internal/`**: Lưu trữ các file phục vụ trực tiếp cho workflow (TECHNICAL_STRATEGY.md, CODEBASE_MAP.md). File tại đây sẽ được cập nhật/ghi đè theo từng Phase để đảm bảo tính thời sự cho AI code.
- [ ] **`external/`**: Lưu trữ các nghiên cứu ngoài dự án theo yêu cầu người dùng.
  - Định dạng tên: `RES-[ID]-[SLUG].md` (Ví dụ: `RES-001-CVE-NESTJS.md`).
  - **KHÔNG GHI ĐÈ**: Mỗi bản nghiên cứu là một file riêng biệt có đánh số tăng dần.
- [ ] **`INDEX.md`**: File danh mục tổng hợp toàn bộ các bản nghiên cứu (ID, Ngày, Chủ đề, Kết luận chính).

#### 2. Tiêu chuẩn Báo cáo "Chống Ảo Giác" (Audit Standard)
Mỗi bản nghiên cứu BẮT BUỘC phải bao gồm:
- **Metadata**: Người thực hiện (Agent ID), Ngày, Mục tiêu nghiên cứu.
- **Evidence (Dẫn chứng)**: Link URL (Context7/Web Search), Code Snippet đối chứng, hoặc trích dẫn tài liệu chính thức.
- **Confidence Level**: Đánh giá mức độ tin cậy của thông tin (High/Medium/Low).
- **Audit Log**: Danh sách các nguồn đã truy cập để tìm kiếm thông tin này.

#### 3. Research Squad (Định nghĩa prompt trong `commands/pd/agents/`)
- [ ] **Evidence Collector**: Tác tử chuyên trách việc kiểm chứng nguồn tin và trích xuất dẫn chứng.
- [ ] **Fact Checker**: Tác tử đối soát chéo thông tin giữa các researcher để loại bỏ ảo giác.

#### 4. Workflow Guards & Enforcement (Cơ chế cưỡng chế)
- [ ] **Plan-Gate Integration**: Cập nhật `workflows/plan.md` để thêm lớp bảo vệ (Guard). Trước khi lập kế hoạch, AI **BẮT BUỘC** kiểm tra sự tồn tại của `.planning/research/internal/TECHNICAL_STRATEGY.md`.
- [ ] **Mandatory Suggestion**: Nếu thiếu file Strategy, AI phải dừng lại và yêu cầu: *"Thiếu hồ sơ nghiên cứu kỹ thuật. Vui lòng chạy `/pd:research` để đảm bảo an toàn kiến trúc trước khi lập kế hoạch."*
- [ ] **Strategy Injection**: Đảm bảo `workflows/write-code.md` và `workflows/plan.md` luôn tự động đọc và tuân thủ các quyết định trong Strategy mới nhất.

### Lợi ích của Hệ thống Audit
- **Minh bạch**: Người dùng biết chính xác AI lấy thông tin từ đâu.
- **Bền vững**: Thông tin nghiên cứu cũ không bị mất đi khi có nghiên cứu mới.
- **An toàn**: Tránh việc AI tự "bịa" ra kiến thức không có thật (Hallucination).

### Cách thức triển khai
1. **Lệnh `pd research`**: Tự động nhận diện ngữ cảnh. Nếu có tham số chủ đề -> Lưu vào `external/` + Đánh số ID mới. Nếu không tham số -> Chạy quy trình `internal/` phục vụ `plan`.
2. **Cập nhật INDEX.md**: Sau mỗi lần nghiên cứu thành công, AI tự động thêm một dòng vào bảng danh mục.

---
*Ghi chú quan trọng: Research không chỉ là tìm kiếm, mà là xây dựng kho tri thức có thể kiểm chứng cho dự án.*
