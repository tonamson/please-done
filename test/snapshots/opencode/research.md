---
description: Automated research - classify internal vs external, collect evidence, verify, and cross-validate
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---
<objective>
Research a single topic automatically: classify it as internal/external, run the Evidence Collector -> Fact Checker pipeline, and cross-validate when both types exist. After completion: display a summary of the results.
**After completion:** `/pd-what-next`
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd-init` truoc."
- [ ] A research topic was provided -> "Please provide a topic to research."
      </guards>
<context>
User input: $ARGUMENTS
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.config/opencode/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
Đọc trước khi bắt đầu:
- [SKILLS_DIR]/references/conventions.md -> quy tắc output tiếng Việt, commit prefix
</required_reading>
<process>
## Bước 1: Phân loại query
1. Lấy topic từ $ARGUMENTS (full text user nhập).
2. Xác định thư mục research tuyệt đối: `path.resolve('.planning/research')`.
3. Phân loại topic:
   ```
   ROUTE=$(node bin/route-query.js "$TOPIC")
   ```
4. Hiển thị: `"Đã phân loại: [internal|external] research"`
5. Xác định thư mục con: `{research_dir}/internal/` hoặc `{research_dir}/external/`
## Bước 2: Thu thập bằng chứng
1. Spawn Agent `pd-evidence-collector` với prompt:
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
1. Spawn Agent `pd-fact-checker` với prompt:
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
## Bước 4: Cập nhật INDEX.md
Sau khi Fact Checker hoàn tất (per D-01 — chỉ gọi 1 lần cuối pipeline):
1. Chạy:
   ```
   node bin/update-research-index.js
   ```
2. Kiểm tra output: script in số lượng entries đã index.
3. Xác nhận `.planning/research/INDEX.md` tồn tại và có nội dung.
Bước này đảm bảo:
- Strategy Injection (trong write-code.md, plan.md) đọc INDEX.md thành công thay vì silent fallback
- Fact Checker cross-validate ở lần chạy SAU sẽ có INDEX.md để tìm files cùng topic
</process>
<output>
**Create/Update:**
- Research file in `.planning/research/internal/` or `external/`
- Verification file from Fact Checker
- `INDEX.md` updated
- `AUDIT_LOG.md` updated
**Next step:** `/pd-what-next`
**Success when:**
- The research file has complete frontmatter
- Fact Checker has verified the findings
- A summary is shown to the user
**Common errors:**
- The topic cannot be classified -> default to external
- Evidence Collector cannot find sources -> continue with confidence LOW
- MCP is not connected -> check configuration
  </output>
<rules>
- All output MUST be in English
- You MUST run the full pipeline: route -> collect -> verify
- DO NOT skip Fact Checker when Collector fails - run it with confidence LOW
- CHỈ orchestrator spawn agents — agents KHÔNG spawn agents khác
- PHẢI truyền absolute paths khi spawn agents
- KHÔNG block khi Evidence Collector fail — tiếp tục với Fact Checker
- KHÔNG hỏi user giữa pipeline — chạy seamless
- Cross-validate tự động khi Fact Checker phát hiện files cùng topic
- Khi phát hiện xung đột: ghi nhận với evidence từ cả 2 phía, KHÔNG tự resolve
- PHẢI chạy `node bin/update-research-index.js` SAU Fact Checker hoàn tất — INDEX.md phản ánh trạng thái đã xác minh
- [ ] INDEX.md được tạo/cập nhật sau mỗi lần chạy pipeline
- Mọi output PHẢI bằng tiếng Việt có dấu
</rules>
