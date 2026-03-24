# Chiến lược Tối ưu hóa Hiệu suất & Chi phí (Turbo-Efficiency)

Bản tổng hợp cuối cùng tích hợp từ các kế hoạch Research, Visual Logic, Fix-bug và Install. Mục tiêu: Giảm 60% token lãng phí, tăng 3x tốc độ phản hồi, giữ 100% độ an toàn.

## 1. Nguyên tắc "Lazy-Loading Context" (Nạp bối cảnh theo nhu cầu)
AI không đọc toàn bộ tài liệu ngay từ đầu. Thay vào đó:
- **Surgical Reading**: Chỉ đọc `@references/` (như `ui-brand.md`, `security.md`) sau khi dùng `grep` phát hiện từ khóa liên quan trong mô tả task.
- **Minified Rules**: Sử dụng bộ quy tắc nén `*.min.md` (loại bỏ emoji, ví dụ thừa) cho AI, chỉ để lại logic cốt lõi.
- **On-demand Research**: Chỉ kích hoạt Research Squad (`/pd:research`) khi có yêu cầu phức tạp hoặc bắt đầu Milestone mới.

## 2. Chiến lược "Model-Tiering" (Phân tầng Model)
Tận dụng tối đa sự chênh lệch giá và tốc độ của các dòng model:
- **Haiku 4.5/5.0 (The Scout)**: Dành cho `init`, `scan`, `what-next`, Research thô, và Verification (Bước 9.5).
- **Sonnet 4.6 (The Builder)**: Mặc định cho `write-code`, `fix-bug` (đặc biệt là Regression Analysis) và vẽ sơ đồ Mermaid.
- **Opus 4.6 / Gemini Ultra (The Architect)**: Chỉ dùng cho `plan --discuss`, Synthesizer (Tổng hợp nghiên cứu) và Management Report.

## 3. Quy trình "Gọng kìm" & Trực quan hóa
- **Nghiên cứu một lần**: Kết quả nghiên cứu từ `init` và `plan` được lưu thành `TECHNICAL_STRATEGY.md`. `write-code` chỉ đọc file này để lấy hướng đi, không chạy lại nghiên cứu.
- **Visual Zero-Waste**: Chỉ vẽ sơ đồ Mermaid và xuất PDF khi phát hiện thay đổi trong Business Logic (dùng Haiku để quét nhanh trước).
- **Automated Pipeline**: Script `generate-pdf-report.js` chạy ngầm, sử dụng cache cho các sơ đồ không đổi.

## 4. Danh sách lệnh được cập nhật (Reflected in @docs/)
| Lệnh | Chế độ Lazy-load | Model đề xuất |
|------|-----------------|---------------|
| `pd init` | Quét cấu trúc (Codebase Mapper) | Haiku |
| `pd research` | **MỚI**: Nghiên cứu đa tầng (Parallel) | Haiku (Squad) + Opus (Synth) |
| `pd plan` | Chỉ đọc Strategy hiện có | Sonnet/Opus |
| `pd write-code` | Lazy-load refs + Strategy | Sonnet |
| `pd fix-bug` | Tự động tạo Repro Test | Sonnet |
| `pd complete` | Vẽ sơ đồ + Xuất PDF (nếu logic đổi) | Sonnet (Mermaid) + Opus (Summary) |

---
*Ghi chú: Để kích hoạt bối cảnh đầy đủ (Force Full Context), user có thể thêm tham số `--verbose` hoặc `--full-context` vào bất kỳ lệnh nào.*
