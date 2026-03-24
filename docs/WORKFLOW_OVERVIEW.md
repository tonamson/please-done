# Tổng Quan Quy Trình please-done (PD)

Hệ thống **please-done (PD)** không chỉ là một bộ lệnh CLI; nó là một **Giao thức Vận hành (Protocol)** dành cho AI Agent. PD buộc AI phải làm việc theo phong cách "Kỹ sư Cấp cao": Suy nghĩ kỹ (Plan) -> Chia nhỏ việc (Task) -> Kiểm tra tính khả thi (Check) -> Thực thi (Execute) -> Chứng minh (Verify).

---

## 1. Vòng đời của một Phase (Milestone)

Mọi dự án trong PD đều tuân theo một chu trình khép kín gồm 5 bước chính:

### Bước 1: Khởi tạo (Initialization) - `pd init`
Thiết lập cấu trúc dự án. Tạo ra "Hệ thần kinh" cho dự án bao gồm thư mục `.planning/` và file `ROADMAP.md`. Tại đây, các yêu cầu (Requirements) được định nghĩa rõ ràng.

### Bước 2: Lập kế hoạch (Planning) - `pd plan`
Đây là bước quan trọng nhất. AI không được phép viết code ngay. Nó phải:
- Đọc `ROADMAP.md` để hiểu mục tiêu của Phase hiện tại.
- Tạo file `PLAN.md`: Mô tả chiến lược, giải pháp kỹ thuật và các điểm nối then chốt (Key Links).
- Tạo file `TASKS.md`: Chia nhỏ `PLAN.md` thành các nhiệm vụ cụ thể, có định lượng (Effort, Files, Truths).
- **Plan-Checker:** Một bộ quy tắc tự động (D-01 đến D-13) sẽ quét qua Plan. Nếu Plan quá lớn (> 6 tasks) hoặc quá phức tạp, AI buộc phải làm lại.

### Bước 3: Chuẩn bị Task (Task Prep) - `pd what-next`
AI nhìn vào `STATE.md` để biết mình đang ở đâu và việc gì cần làm tiếp theo. Nó sẽ chọn ra một Task ưu tiên cao nhất chưa hoàn thành để thực hiện.

### Bước 4: Thực thi (Execution) - `pd write-code`
AI tập trung vào đúng 1 Task duy nhất.
- Đọc mô tả Task trong `TASKS.md`.
- Sửa đổi hoặc tạo mới các file đã được liệt kê.
- Đảm bảo tuân thủ các Rule cụ thể của ngôn ngữ/framework (NestJS, NextJS, Flutter...).

### Bước 5: Kiểm tra & Nghiệm thu (Verify & Complete) - `pd test` & `pd complete-milestone`
- **Verify:** AI tự viết báo cáo nghiệm thu (`verification-report.md`), chứng minh các "Truths" đã đề ra ở Bước 2 đều đúng.
- **Complete:** Khi mọi Task trong Phase đã xong, AI cập nhật `ROADMAP.md` và `CHANGELOG.md`, đóng lại một chu kỳ thành công.

---

## 2. Quản lý trạng thái (The State Machine)

Tại sao AI của PD không bao giờ "mất não" (context drift)? Đó là nhờ file `STATE.md`.
- File này lưu trữ: Activity gần nhất, Phase hiện tại, Task đang làm.
- Mọi câu lệnh của PD đều cập nhật hoặc đọc từ `STATE.md`.
- Nếu Agent bị crash, Agent mới chỉ cần đọc `STATE.md` là có thể tiếp tục công việc ngay lập tức mà không cần hỏi lại User.

---

## 3. Quy tắc "Surgical" (Can thiệp chính xác)

Triết lý của PD là **Surgical update**:
- Chỉ sửa những gì cần thiết.
- Không refactor "tiện tay" ngoài phạm vi Task.
- Mỗi thay đổi phải có lý do (mapped với một Truth trong Plan).

---
*Tài liệu này là hướng dẫn nền tảng. Để xem chi tiết từng câu lệnh, vui lòng đọc [COMMAND_REFERENCE.md](COMMAND_REFERENCE.md).*
