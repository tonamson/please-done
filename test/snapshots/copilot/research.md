---
name: pd:research
description: Nghiên cứu tự động — phân loại internal/external, thu thập bằng chứng, xác minh và cross-validate
---
<objective>
Nghiên cứu 1 chủ đề tự động: phân loại internal/external, chạy pipeline Evidence Collector -> Fact Checker, cross-validate khi có cả 2 loại. Sau khi xong: Hiển thị tóm tắt kết quả.
**Sau khi xong:** `/pd:what-next`
</objective>
<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] Có chủ đề nghiên cứu được cung cấp -> "Hãy cung cấp chủ đề cần nghiên cứu."
</guards>
<context>
Người dùng nhập: $ARGUMENTS
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.copilot/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
Đọc trước khi bắt đầu:
- [SKILLS_DIR]/references/conventions.md -> quy tắc output tiếng Việt, commit prefix
</required_reading>
<process>
## Bước 1: Phân loại query
1. Lấy topic từ $ARGUMENTS (full text user nhập).
2. Xác định thư mục research tuyệt đối: `path.resolve('.planning/research')`.
3. Phân loại topic thành internal hoặc external bằng cách phân tích nội dung:
   - Nếu topic chứa tên file (.ts, .js, .md, .json...), đường dẫn (src/, ./, bin/), tên hàm/class (camelCase, PascalCase), từ khóa định nghĩa (function, class, interface, enum, hàm) -> **internal**
   - Còn lại -> **external** (fallback an toàn)
4. Hiển thị: `"Đã phân loại: [internal|external] research"`
5. Xác định thư mục con: `{research_dir}/internal/` hoặc `{research_dir}/external/`
## Bước 2: Thu thập bằng chứng
1. Spawn agent `pd-evidence-collector` với prompt:
   ```
   Thư mục research: {absolute_research_dir}/{source_type}/.
   Topic: {topic}.
   Phạm vi: {source_type}.
   Thu thập bằng chứng từ ít nhất 2 nguồn độc lập và ghi file vào thư mục trên.
   ```
2. Sau khi agent hoàn tất:
   - Tìm file mới nhất trong thư mục `{research_dir}/{source_type}/` (glob *.md, sort theo modified time)
   - Nếu tìm thấy file -> lưu path làm `collector_output_path`
   - Nếu KHÔNG tìm thấy file (Collector fail): hiển thị WARNING "Evidence Collector không tạo được output. Tiếp tục với Fact Checker — confidence sẽ là LOW." Vẫn tiếp tục Bước 3. Đặt `collector_output_path = null`.
## Bước 3: Xác minh và cross-validate
1. Spawn agent `pd-fact-checker` với prompt:
   ```
   Thư mục research: {absolute_research_dir}.
   File cần xác minh: {collector_output_path hoặc "Không có — Evidence Collector thất bại. Đánh dấu confidence LOW."}.
   Topic: {topic}.
   Nhiệm vụ:
   1. Xác minh file trên (nếu có).
   2. Cross-validate: đọc INDEX.md trong {absolute_research_dir}, tìm tất cả files có topic tương tự ở CẢ HAI thư mục internal/ và external/. Nếu tìm thấy files cùng topic ở cả 2 phía -> so sánh nội dung, phát hiện xung đột, ghi vào section "## Xung đột phát hiện" trong file verification. Chỉ GHI NHẬN xung đột với evidence từ cả 2 phía, KHÔNG tự resolve.
   ```
2. Sau khi agent hoàn tất:
   - Đọc verification output file
   - Trích xuất thông tin: confidence level, số claims verified, có xung đột không
   - Hiển thị tóm tắt cho user:
     ```
     === Kết quả nghiên cứu ===
     Chủ đề: {topic}
     Phân loại: {internal|external}
     Confidence: {HIGH|MEDIUM|LOW}
     Claims xác minh: {N} claims
     Xung đột: {có/không}
     File kết quả: {collector_output_path}
     File xác minh: {checker_output_path}
     ```
</process>
<output>
**Tạo/Cập nhật:**
- Research file trong `.planning/research/internal/` hoặc `external/`
- Verification file từ Fact Checker
- `INDEX.md` cập nhật
- `AUDIT_LOG.md` cập nhật
**Bước tiếp theo:** `/pd:what-next`
**Thành công khi:**
- Research file có frontmatter đầy đủ
- Fact Checker đã xác minh
- Tóm tắt hiển thị cho user
**Lỗi thường gặp:**
- Không phân loại được chủ đề -> mặc định external
- Evidence Collector không tìm được nguồn -> tiếp tục với confidence LOW
- MCP không kết nối -> kiểm tra cấu hình
</output>
<rules>
- Mọi output PHẢI bằng tiếng Việt có dấu
- PHẢI chạy pipeline đầy đủ: route -> collect -> verify
- KHÔNG skip Fact Checker khi Collector fail — chạy với confidence LOW
- CHỈ orchestrator spawn agents — agents KHÔNG spawn agents khác
- PHẢI truyền absolute paths khi spawn agents
- KHÔNG block khi Evidence Collector fail — tiếp tục với Fact Checker
- KHÔNG hỏi user giữa pipeline — chạy seamless
- Cross-validate tự động khi Fact Checker phát hiện files cùng topic
- Khi phát hiện xung đột: ghi nhận với evidence từ cả 2 phía, KHÔNG tự resolve
- Mọi output PHẢI bằng tiếng Việt có dấu
</rules>
</output>
