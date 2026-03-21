<purpose>
Lập kế hoạch chiến lược tổng thể: kiểm tra → cập nhật dự án → hỏi → nghiên cứu (tùy chọn) → yêu cầu → lộ trình → duyệt.
Tạo/cập nhật PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, CURRENT_MILESTONE.md với cổng duyệt và commit theo từng giai đoạn.
Dành cho dự án đã tồn tại — có thể đã có milestones trước.
</purpose>

<required_reading>
Đọc tất cả files được tham chiếu trong execution_context của command trước khi bắt đầu:
- @templates/project.md → mẫu PROJECT.md + quy tắc cập nhật
- @templates/requirements.md → mẫu REQUIREMENTS.md + tiêu chí yêu cầu tốt + mã yêu cầu
- @templates/roadmap.md → mẫu ROADMAP.md + quy tắc phase/phiên bản/độ phủ
- @templates/state.md → mẫu STATE.md + quy tắc cập nhật trạng thái làm việc
- @templates/current-milestone.md → mẫu CURRENT_MILESTONE.md + quy tắc cập nhật con trỏ milestone
- @references/questioning.md → cách hỏi user hiệu quả (ngôn ngữ options, nhóm câu hỏi, điều hướng)
- @references/conventions.md → ngôn ngữ, format ngày tháng, version, biểu tượng trạng thái
- @references/ui-brand.md → định hướng sản phẩm, UX states, continuity
- @references/prioritization.md → thứ tự ưu tiên yêu cầu và phases
- @references/state-machine.md → luồng trạng thái giữa các skill
</required_reading>

<process>

## 0. Tự kiểm tra

Kiểm tra 2 file BẮT BUỘC trước khi làm bất cứ gì:

| # | File | Không có → |
|---|------|-----------|
| 1 | `.planning/CONTEXT.md` | "Chạy `/pd:init` trước." → **DỪNG** |
| 2 | `.planning/rules/general.md` | "Rules bị thiếu. Chạy `/pd:init` để tạo lại." → **DỪNG** |

Đọc cả hai file. Ghi nhận ngôn ngữ, format ngày tháng, quy cách phiên bản, biểu tượng trạng thái.

---

## 1. Tạo/Cập nhật PROJECT.md

> Mục đích: giữ tầm nhìn dự án + lịch sử milestones xuyên suốt.
> Xem mẫu chi tiết: @templates/project.md

**Nếu `.planning/PROJECT.md` chưa tồn tại:**
- Đọc CONTEXT.md → lấy thông tin dự án (tên, tech stack)
- Hỏi user (áp dụng @references/questioning.md):
  - Tầm nhìn dự án (1-3 câu)
  - Đối tượng người dùng
  - Ràng buộc (nếu có)
- Tạo PROJECT.md theo mẫu @templates/project.md

**Nếu đã tồn tại:**
- Đọc PROJECT.md → nắm lịch sử milestones, tầm nhìn hiện tại
- Nếu milestone trước vừa hoàn tất (kiểm tra CURRENT_MILESTONE.md hoặc ROADMAP.md) → thêm vào bảng "Lịch sử Milestones"
- Hỏi user: "Tầm nhìn dự án có thay đổi không? Bài học kinh nghiệm gì từ milestone trước?"
- Cập nhật nếu cần

**Cập nhật STATE.md** (nếu tồn tại):
```
Hoạt động cuối: [DD_MM_YYYY] — Bắt đầu khởi tạo milestone mới
```

---

## 2. Kiểm tra báo cáo quét

- **KHÔNG** có `.planning/scan/SCAN_REPORT.md`:
  - Đọc CONTEXT.md → dự án mới (chưa có code) → cho phép tiếp tục (user cung cấp yêu cầu ở Bước 4)
  - Dự án đã có code → thông báo chạy `/pd:scan` trước → **DỪNG**
- **CÓ** → đọc, đặc biệt:
  - "Trạng thái hoàn thành" — tính năng nào đã xong, đang dở
  - "Thư viện" — thư viện có sẵn
  - "Vấn đề & Đề xuất" — nợ kỹ thuật cần đưa vào kế hoạch

---

## 3. Kiểm tra lộ trình hiện có

Nếu `.planning/ROADMAP.md` đã tồn tại:

```
AskUserQuestion({
  questions: [{
    question: "Đã có lộ trình. Bạn muốn làm gì?",
    header: "Lộ trình hiện có",
    multiSelect: false,
    options: [
      { label: "Ghi đè toàn bộ", description: "Xóa lộ trình cũ, lập lại từ đầu" },
      { label: "Viết tiếp", description: "Giữ milestones cũ, thêm milestones mới vào cuối" }
    ]
  }]
})
```

**Nếu GHI ĐÈ:**
- Cảnh báo về thư mục milestone cũ (`.planning/milestones/`):
```
AskUserQuestion({
  questions: [{
    question: "Thư mục milestones cũ vẫn tồn tại. Xử lý thế nào?",
    header: "Milestones cũ",
    multiSelect: false,
    options: [
      { label: "Sao lưu (Đề xuất)", description: "Đổi tên thành milestones_backup_[ngày]" },
      { label: "Xóa tất cả", description: "Xóa toàn bộ thư mục milestones cũ" },
      { label: "Chỉ xóa chưa có code", description: "Giữ milestones đã có code, xóa phần còn lại" }
    ]
  }]
})
```
- Nếu không hỏi được → tự động sao lưu: `.planning/milestones/` → `.planning/milestones_backup_[DD_MM_YYYY]/`

**Xử lý `--reset-phase-numbers`:**
- Có cờ → đánh số phase từ 1 cho milestone mới
- Có thư mục phase cũ → lưu trữ trước khi tiếp để tránh xung đột
- Không có cờ → tiếp tục đánh số từ phase cuối milestone trước (VD: trước kết thúc phase 5 → mới bắt đầu phase 6)

---

## 4. Thu thập yêu cầu milestone

> Áp dụng @references/questioning.md cho cách hỏi.

Nếu `$ARGUMENTS` có nội dung (ngoài cờ) → dùng làm bối cảnh ban đầu.

**Nếu GHI ĐÈ:**
- Trình bày tóm tắt: milestones đã hoàn tất (từ PROJECT.md "Lịch sử Milestones")
- Hỏi toàn bộ: mục tiêu dự án, chức năng cốt lõi, ưu tiên cao nhất
- Hỏi sâu: đối tượng người dùng, tình huống sử dụng, ràng buộc, tiến độ

**Nếu VIẾT TIẾP:**
- Trình bày tóm tắt milestones đã có trong ROADMAP
- Hỏi: "Milestones/tính năng MỚI cần thêm vào lộ trình hiện có?"
- Hỏi sâu: phạm vi tính năng mới, quan hệ với tính năng cũ

**Nếu dự án mới (chưa có code, chưa có ROADMAP):**
- Dùng CONTEXT.md (tech stack) + PROJECT.md (tầm nhìn) làm nền
- Hỏi: "Bạn muốn xây dựng gì? Mô tả chức năng chính."
- Hỏi tiếp: ưu tiên, đối tượng người dùng, ràng buộc

---

## 5. Nghiên cứu tùy chọn (Agents song song)

Hỏi user:
```
AskUserQuestion({
  questions: [{
    question: "Có muốn nghiên cứu lĩnh vực/hệ sinh thái cho tính năng mới trước khi xác định phạm vi?",
    header: "Nghiên cứu",
    multiSelect: false,
    options: [
      { label: "Nghiên cứu trước (Đề xuất)", description: "Tra cứu thư viện, mô hình triển khai, phương pháp tốt nhất — giúp xác định phạm vi chính xác hơn" },
      { label: "Bỏ qua, đi thẳng vào yêu cầu", description: "Dùng kiến thức hiện có, không tra cứu thêm" }
    ]
  }]
})
```

**Nếu "Bỏ qua":** nhảy sang Bước 6.

**Nếu "Nghiên cứu trước":**

```bash
mkdir -p .planning/research
```

Tạo **4 Agent song song** theo hợp đồng trong phần `<agents>` bên dưới.
Sau khi 4 agent hoàn tất → tạo **1 Agent tổng hợp** theo hợp đồng.

Hiển thị tóm tắt:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 NGHIÊN CỨU HOÀN TẤT ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thư viện bổ sung: [từ SUMMARY.md]
Tính năng bắt buộc: [từ SUMMARY.md]
Cảnh báo: [từ SUMMARY.md — top 3]
```

**Commit nghiên cứu:**
```bash
git add .planning/research/ && git commit -m "docs: nghiên cứu milestone — [tóm tắt ngắn tính năng]"
```

**Cập nhật STATE.md** (nếu tồn tại):
```
Hoạt động cuối: [DD_MM_YYYY] — Nghiên cứu lĩnh vực hoàn tất
```

---

## 6. Định nghĩa yêu cầu

> Xem mẫu + tiêu chí: @templates/requirements.md

### 6a. Phân tích hiện trạng
- CÓ báo cáo quét → tính năng đã hoàn thành/đang dở/chưa bắt đầu, thư viện có sẵn
- CÓ nghiên cứu → đọc `.planning/research/SUMMARY.md` → tính năng theo nhóm, bắt buộc vs tạo khác biệt
- Dự án mới → dựa hoàn toàn vào yêu cầu user từ Bước 4
- **KHÔNG gọi FastCode** cho thông tin đã có trong báo cáo quét

### 6b. Xác định phạm vi tính năng theo nhóm
Nhóm tính năng theo chủ đề (từ nghiên cứu hoặc từ cuộc trò chuyện).

Với MỖI nhóm, hỏi user chọn tính năng bằng `AskUserQuestion`:
```
AskUserQuestion({
  questions: [{
    question: "[Tên nhóm] — chọn tính năng đưa vào milestone này:",
    header: "[Nhóm]",
    multiSelect: true,
    options: [
      { label: "[Tính năng 1]", description: "[mô tả ngắn — bắt buộc/tạo khác biệt]" },
      { label: "[Tính năng 2]", description: "[mô tả ngắn]" },
      { label: "Không đưa nhóm này vào", description: "Hoãn toàn bộ nhóm sang milestone sau" }
    ]
  }]
})
```

Phân loại kết quả:
- Được chọn → **Yêu cầu v1** (milestone hiện tại)
- Bắt buộc nhưng không chọn → **Yêu cầu tương lai** (hoãn lại)
- Tạo khác biệt nhưng không chọn → **Ngoài phạm vi**

### 6c. Kiểm tra thiếu sót
```
AskUserQuestion({
  questions: [{
    question: "Có tính năng nào chưa được liệt kê mà bạn muốn thêm?",
    header: "Bổ sung",
    multiSelect: false,
    options: [
      { label: "Không, đã đủ", description: "Chuyển sang tạo danh sách yêu cầu" },
      { label: "Có, tôi muốn thêm", description: "Mô tả tính năng cần bổ sung" }
    ]
  }]
})
```
Nếu "Có" → thu thập thêm → xác định phạm vi lại.

### 6d. Tạo REQUIREMENTS.md
Theo mẫu @templates/requirements.md.
- Mã yêu cầu: `[NHÓM]-[SỐ]` (AUTH-01, NOTIF-02, CONT-03)
- Nếu có REQUIREMENTS.md cũ → tiếp tục đánh số từ mã cuối
- Áp dụng tiêu chí yêu cầu tốt từ @templates/requirements.md

### 6e. Cổng duyệt — Yêu cầu

Trình bày TOÀN BỘ yêu cầu cho user xem:
```
## Yêu cầu Milestone v[X.Y]

### [Nhóm 1]
- [ ] **NHOM1-01**: Người dùng có thể...
- [ ] **NHOM1-02**: Người dùng có thể...

### [Nhóm 2]
- [ ] **NHOM2-01**: Người dùng có thể...

**Tổng: [X] yêu cầu | [Y] nhóm**
```

```
AskUserQuestion({
  questions: [{
    question: "Yêu cầu có đúng phạm vi không?",
    header: "Duyệt yêu cầu",
    multiSelect: false,
    options: [
      { label: "Duyệt", description: "Yêu cầu đã ổn — chuyển sang tạo lộ trình" },
      { label: "Điều chỉnh", description: "Thêm/bớt/sửa yêu cầu rồi xem lại" }
    ]
  }]
})
```

- **"Duyệt"** → commit yêu cầu, tiếp Bước 7
- **"Điều chỉnh"** → nhận phản hồi → sửa → hỏi duyệt lại (lặp đến khi duyệt)

**Commit yêu cầu:**
```bash
git add .planning/REQUIREMENTS.md && git commit -m "docs: định nghĩa yêu cầu milestone v[X.Y] ([N] yêu cầu)"
```

**Cập nhật STATE.md** (nếu tồn tại):
```
Hoạt động cuối: [DD_MM_YYYY] — Yêu cầu milestone v[X.Y] đã duyệt
```

---

## 7. Thiết kế lộ trình

> Xem mẫu + quy tắc: @templates/roadmap.md

### 7a. Chia milestones và phases
- Chia thành Milestones (1.0, 1.1, 2.0...)
- Mỗi milestone gồm Phases
- Mỗi phase PHẢI có đủ 5 thành phần (xem @templates/roadmap.md → "Quy tắc Phase")
- Xác định phụ thuộc giữa phases
- Ưu tiên theo bảng trong @templates/roadmap.md → "Quy tắc ưu tiên"
- Đánh số phiên bản theo @templates/roadmap.md → "Quy tắc phiên bản"
- Kiểm tra trùng phiên bản (khi VIẾT TIẾP)

### 7b. Kiểm tra độ phủ (BẮT BUỘC)
**MỌI yêu cầu v1 PHẢI gắn vào đúng 1 phase.**
Nếu có yêu cầu chưa gắn → **DỪNG**, sửa trước khi tiếp.
Xem chi tiết: @templates/roadmap.md → "Kiểm tra độ phủ"

### 7c. Xác định quyết định chiến lược
Claude PHẢI ghi nhận các quyết định đã tự đưa ra:
- Tại sao milestone X trước Y?
- Tại sao tính năng Z ưu tiên Cao?
- Tại sao chia thành N milestones thay vì M?
- Phụ thuộc giữa milestones

### 7d. Tạo ROADMAP.md
- **GHI ĐÈ** → viết mới toàn bộ theo mẫu @templates/roadmap.md
- **VIẾT TIẾP** → đọc ROADMAP hiện tại → giữ nguyên milestones cũ (KHÔNG sửa trạng thái/nội dung) → thêm milestones mới SAU milestone cuối → cập nhật `Cập nhật lần cuối: [DD_MM_YYYY]`
- Nếu có thêm quyết định chiến lược → thêm vào bảng hiện có

### 7e. Cập nhật bảng theo dõi trong REQUIREMENTS.md
Điền bảng theo dõi:

| Yêu cầu | Phase | Trạng thái |
|----------|-------|------------|
| AUTH-01 | Phase 1.1 | Chờ triển khai |
| AUTH-02 | Phase 1.1 | Chờ triển khai |
| PROF-01 | Phase 1.2 | Chờ triển khai |

Kiểm tra độ phủ:
- Tất cả yêu cầu v1 đã gắn → ✓ Đủ
- Có yêu cầu chưa gắn → ⚠️ **DỪNG**, cảnh báo, sửa trước

### 7f. Cổng duyệt — Lộ trình

Trình bày lộ trình cho user:
```
## Lộ trình đề xuất

**[N] phases** | **[X] yêu cầu đã gắn** | Độ phủ: ✓

| # | Phase | Mục tiêu | Yêu cầu | Tiêu chí thành công |
|---|-------|----------|----------|---------------------|
| 1.1 | [Tên] | [Mục tiêu] | AUTH-01, AUTH-02 | 3 tiêu chí |
| 1.2 | [Tên] | [Mục tiêu] | PROF-01, PROF-02 | 2 tiêu chí |

### Chi tiết Phase

**Phase 1.1: [Tên]**
Mục tiêu: [mô tả]
Yêu cầu: AUTH-01, AUTH-02
Tiêu chí thành công:
1. [tiêu chí]
2. [tiêu chí]
```

```
AskUserQuestion({
  questions: [{
    question: "Lộ trình có phù hợp không?",
    header: "Duyệt lộ trình",
    multiSelect: false,
    options: [
      { label: "Duyệt", description: "Lộ trình đã ổn — chốt và commit" },
      { label: "Điều chỉnh phases", description: "Thay đổi thứ tự, gộp/tách phases, di chuyển yêu cầu" },
      { label: "Xem file đầy đủ", description: "Hiển thị toàn bộ ROADMAP.md trước khi quyết định" }
    ]
  }]
})
```

- **"Duyệt"** → commit, tiếp Bước 8
- **"Điều chỉnh"** → nhận phản hồi → thiết kế lại → hỏi duyệt lại (lặp đến khi duyệt)
- **"Xem file đầy đủ"** → hiển thị ROADMAP.md → hỏi lại duyệt

**Commit lộ trình + bảng theo dõi:**
```bash
git add .planning/ROADMAP.md .planning/REQUIREMENTS.md && git commit -m "docs: tạo lộ trình milestone v[X.Y] ([N] phases, [X] yêu cầu đã gắn)"
```

In bảng quyết định chiến lược:
```
### Claude đã tự quyết định [N] vấn đề chiến lược:
| # | Vấn đề | Quyết định | Lý do tóm tắt |
|---|--------|-----------|---------------|
Xem chi tiết đầy đủ (bao gồm phương án đã loại) trong ROADMAP.md → Phần "Quyết định chiến lược".
⚠️ Hãy xem lại các quyết định trên trước khi chạy /pd:plan.
```

**Cập nhật STATE.md** (nếu tồn tại):
```
Hoạt động cuối: [DD_MM_YYYY] — Lộ trình milestone v[X.Y] đã duyệt
```

---

## 8. Tạo/Đặt lại STATE.md

```markdown
# Trạng thái làm việc
> Cập nhật: [DD_MM_YYYY]

## Vị trí hiện tại
- Milestone: v[X.Y] — [Tên milestone]
- Phase: Chưa bắt đầu
- Kế hoạch: —
- Trạng thái: Sẵn sàng lên kế hoạch
- Hoạt động cuối: [DD_MM_YYYY] — Milestone v[X.Y] khởi tạo

## Bối cảnh tích lũy
[Nếu có milestone trước → giữ lại bối cảnh có giá trị: mô hình đã xác lập, quy ước, bài học kinh nghiệm.
Nếu milestone đầu tiên → "Chưa có bối cảnh tích lũy."]

## Vấn đề chặn
Không
```

**Nếu đã có STATE.md từ milestone trước:** đọc phần "Bối cảnh tích lũy" → giữ lại nội dung có giá trị → đặt lại phần còn lại.

---

## 9. Tạo theo dõi + Commit

### 9a. Tạo/cập nhật CURRENT_MILESTONE.md

**Nếu GHI ĐÈ hoặc CURRENT_MILESTONE.md chưa tồn tại:**
```markdown
# Milestone hiện tại
- milestone: [tên]
- version: [x.x]
- phase: [phase đầu tiên, VD: 1.1]
- status: Chưa bắt đầu
```

**Nếu VIẾT TIẾP VÀ CURRENT_MILESTONE.md đã tồn tại:**
Giữ nguyên (KHÔNG ghi đè) — milestone hiện tại vẫn đang hoạt động.

### 9b. Tạo thư mục milestones
Tạo `.planning/milestones/[version]/` cho TẤT CẢ milestones mới trong ROADMAP (nếu chưa có).

### 9c. Cập nhật PROJECT.md
Cập nhật dòng `> Cập nhật: [DD_MM_YYYY]` trong PROJECT.md.

### 9d. Commit cuối cùng
```bash
git add .planning/STATE.md .planning/CURRENT_MILESTONE.md .planning/PROJECT.md && git commit -m "docs: khởi tạo milestone v[X.Y] [Tên] — sẵn sàng lên kế hoạch"
```

---

## 10. Thông báo

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 KHỞI TẠO MILESTONE HOÀN TẤT ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone v[X.Y]: [Tên]

| Sản phẩm       | Đường dẫn                     | Trạng thái |
|-----------------|-------------------------------|------------|
| Dự án           | .planning/PROJECT.md          | ✓          |
| Nghiên cứu      | .planning/research/           | ✓/—        |
| Yêu cầu         | .planning/REQUIREMENTS.md     | ✓          |
| Lộ trình         | .planning/ROADMAP.md          | ✓          |
| Trạng thái       | .planning/STATE.md            | ✓          |
| Theo dõi         | .planning/CURRENT_MILESTONE.md| ✓          |

[N] phases | [X] yêu cầu | Độ phủ 100% ✓

▶ Tiếp theo: /pd:plan
   Phase [đầu tiên]: [Tên phase] — [Mục tiêu]
```

</process>

<agents>

## Hợp đồng Agent nghiên cứu

> Tất cả agents dùng `subagent_type: "general-purpose"`.
> Mỗi agent có hợp đồng rõ ràng: đầu vào → công việc → đầu ra → tiêu chí hoàn thành.

### Đầu vào chung (tất cả 4 agent đọc)

```
files_to_read:
  - .planning/CONTEXT.md
  - .planning/scan/SCAN_REPORT.md (nếu có)
tools_allowed: WebSearch, mcp__context7__resolve-library-id, mcp__context7__query-docs, Read, Write
```

### Agent 1 — Thư viện/Stack

```
output_file: .planning/research/STACK.md
done_when: File tồn tại VÀ có ≥1 thư viện được đánh giá

prompt: |
  Nghiên cứu thư viện/stack cho dự án.
  Đọc: .planning/CONTEXT.md, .planning/scan/SCAN_REPORT.md (nếu có)
  Câu hỏi: Thư viện nào cần thêm hoặc thay đổi cho tính năng mới: [liệt kê tính năng từ Bước 4]?
  Yêu cầu: Phiên bản cụ thể, tương thích với stack hiện có, lý do chọn.
  Dùng WebSearch + mcp__context7 để tra cứu tài liệu mới nhất.
  Viết kết quả vào .planning/research/STACK.md:

  # Nghiên cứu thư viện
  ## Thư viện hiện có (KHÔNG cần thêm)
  ## Thư viện cần bổ sung
  | Tên | Phiên bản | Mục đích | Lý do chọn | Tương thích |
  ## Thư viện cần nâng cấp
  ## Lưu ý tích hợp

description: "Nghiên cứu thư viện"
```

### Agent 2 — Tính năng

```
output_file: .planning/research/FEATURES.md
done_when: File tồn tại VÀ có phân loại bắt buộc/khác biệt/tránh

prompt: |
  Nghiên cứu mô hình tính năng cho dự án.
  Đọc: .planning/CONTEXT.md, .planning/scan/SCAN_REPORT.md (nếu có)
  Câu hỏi: Tính năng tương tự [liệt kê từ Bước 4] thường hoạt động thế nào trong ứng dụng cùng loại?
  Yêu cầu: Phân loại bắt buộc (phải có) / tạo khác biệt / nên tránh.
  Dùng WebSearch để khảo sát.
  Viết kết quả vào .planning/research/FEATURES.md:

  # Nghiên cứu tính năng
  ## [Nhóm 1]
  ### Bắt buộc (phải có)
  ### Tạo khác biệt
  ### Nên tránh
  ## [Nhóm 2]
  ...

description: "Nghiên cứu tính năng"
```

### Agent 3 — Kiến trúc

```
output_file: .planning/research/ARCHITECTURE.md
done_when: File tồn tại VÀ có thành phần mới + điểm tích hợp

prompt: |
  Nghiên cứu kiến trúc tích hợp cho dự án.
  Đọc: .planning/CONTEXT.md, .planning/scan/SCAN_REPORT.md (nếu có)
  Câu hỏi: Tính năng mới [liệt kê] tích hợp kiến trúc hiện có ra sao? Thành phần mới, luồng dữ liệu, điểm tích hợp?
  Yêu cầu: Xác định rõ thành phần mới vs sửa thành phần cũ, thứ tự xây dựng gợi ý.
  Dùng WebSearch + mcp__context7 nếu cần.
  Viết kết quả vào .planning/research/ARCHITECTURE.md:

  # Nghiên cứu kiến trúc
  ## Thành phần hiện có (cần sửa)
  ## Thành phần mới (cần tạo)
  ## Luồng dữ liệu
  ## Điểm tích hợp
  ## Thứ tự xây dựng gợi ý

description: "Nghiên cứu kiến trúc"
```

### Agent 4 — Cạm bẫy

```
output_file: .planning/research/PITFALLS.md
done_when: File tồn tại VÀ có ≥3 cạm bẫy

prompt: |
  Nghiên cứu sai lầm thường gặp cho dự án.
  Đọc: .planning/CONTEXT.md, .planning/scan/SCAN_REPORT.md (nếu có)
  Câu hỏi: Sai lầm thường gặp khi thêm [liệt kê tính năng] vào [loại ứng dụng]? Cách phòng tránh?
  Yêu cầu: Cụ thể, khả thi, gắn với phase nào nên xử lý.
  Dùng WebSearch để khảo sát.
  Viết kết quả vào .planning/research/PITFALLS.md:

  # Nghiên cứu cạm bẫy
  | # | Sai lầm | Hệ quả | Cách phòng tránh | Phase nên xử lý |
  |---|---------|--------|-------------------|----------------|

description: "Nghiên cứu cạm bẫy"
```

### Agent tổng hợp (CHỈ chạy SAU KHI 4 agent trên hoàn tất)

```
files_to_read:
  - .planning/research/STACK.md
  - .planning/research/FEATURES.md
  - .planning/research/ARCHITECTURE.md
  - .planning/research/PITFALLS.md
output_file: .planning/research/SUMMARY.md
done_when: File tồn tại VÀ có đủ 5 sections

prompt: |
  Tổng hợp kết quả nghiên cứu.
  Đọc 4 file: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md trong .planning/research/
  Viết .planning/research/SUMMARY.md:

  # Tổng hợp nghiên cứu
  > Ngày: [DD_MM_YYYY]
  ## Thư viện bổ sung
  [Tóm tắt từ STACK.md — chỉ thư viện cần thêm/nâng cấp]
  ## Phạm vi tính năng gợi ý
  [Tóm tắt từ FEATURES.md — bắt buộc vs tạo khác biệt]
  ## Kiến trúc
  [Tóm tắt từ ARCHITECTURE.md — thành phần mới, điểm tích hợp]
  ## Cảnh báo quan trọng
  [Top 5 cạm bẫy nghiêm trọng nhất từ PITFALLS.md]
  ## Gợi ý thứ tự triển khai
  [Từ ARCHITECTURE.md — thứ tự xây dựng]

description: "Tổng hợp nghiên cứu"
```

### Quy tắc agents

- 4 agent nghiên cứu PHẢI chạy **song song** (4 Agent tool calls trong 1 message)
- Agent tổng hợp CHỈ chạy **SAU KHI** 4 agent nghiên cứu hoàn tất
- Nếu 1 agent lỗi → ghi warning, tiếp tục với agents thành công
- Prompt agent PHẢI thay `[liệt kê tính năng từ Bước 4]` bằng danh sách thực tế

</agents>

<rules>
## Quy tắc chung
- Tuân thủ `.planning/rules/general.md` (ngôn ngữ, ngày tháng, phiên bản, biểu tượng, bảo mật)
- Milestones thực tế, ưu tiên tính năng cốt lõi trước
- Nếu có cả Backend + Frontend: Backend API trước khi Frontend dùng API đó
- Tính năng chỉ Frontend (UI, SEO, bố cục) được lên kế hoạch độc lập, KHÔNG cần chờ backend
- Nếu dự án chỉ có Frontend hoặc chỉ có Backend: lên kế hoạch theo stack có sẵn
- Dự án mới: phase đầu nên bao gồm thiết lập dự án (khởi tạo, cấu hình, thư viện) trước khi code tính năng
- Xác thực/Bảo mật luôn trong milestone đầu
- KHÔNG gọi FastCode cho thông tin đã có trong báo cáo quét

## Tự kiểm tra đầu command
- PHẢI kiểm tra CONTEXT.md + rules/general.md tồn tại → DỪNG nếu thiếu
- KHÔNG phụ thuộc ngầm vào /pd:init — nếu thiếu file thì nói rõ cho user

## PROJECT.md
- PHẢI tạo/cập nhật PROJECT.md ở Bước 1 — trước mọi công việc khác
- PROJECT.md là nguồn sự thật cấp dự án, xem @templates/project.md

## Yêu cầu
- MỌI yêu cầu v1 PHẢI gắn vào đúng 1 phase — chưa gắn = lỗi, sửa trước khi duyệt
- Yêu cầu PHẢI hướng người dùng, kiểm tra được, đơn lẻ (xem @templates/requirements.md)
- PHẢI tạo thư mục milestones/[version]/ khi tạo lộ trình

## Cổng duyệt
- PHẢI có 2 cổng duyệt: (1) yêu cầu, (2) lộ trình — lặp cho đến khi user duyệt
- PHẢI commit sản phẩm sau mỗi cổng — đảm bảo không mất dữ liệu nếu phiên bị ngắt
- Áp dụng @references/questioning.md cho mọi AskUserQuestion

## STATE.md
- PHẢI cập nhật STATE.md giữa chừng ở mỗi mốc quan trọng (Bước 1, 5, 6e, 7f), KHÔNG chỉ cuối
- STATE.md PHẢI giữ lại "Bối cảnh tích lũy" từ milestone trước (nếu có) — KHÔNG xóa sạch

## Agents
- 4 agents nghiên cứu PHẢI chạy song song — KHÔNG tuần tự
- Agent tổng hợp CHỈ chạy SAU KHI 4 agents hoàn tất
- Mỗi agent có hợp đồng rõ: đầu vào (files_to_read), đầu ra (output_file), tiêu chí (done_when)
- Nếu AskUserQuestion không khả dụng → hỏi bằng văn bản thường, chờ user trả lời
</rules>
