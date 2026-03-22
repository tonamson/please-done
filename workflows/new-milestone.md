<purpose>
Lập kế hoạch chiến lược: kiểm tra → cập nhật dự án → hỏi → nghiên cứu (tùy chọn) → yêu cầu → lộ trình → duyệt.
Tạo/cập nhật PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, CURRENT_MILESTONE.md với cổng duyệt và commit theo giai đoạn.
Dành cho dự án đã tồn tại — có thể đã có milestones trước.
</purpose>

<required_reading>
Đọc tất cả files trong execution_context trước khi bắt đầu:
- @templates/project.md, @templates/requirements.md, @templates/roadmap.md, @templates/state.md, @templates/current-milestone.md
- @references/conventions.md
</required_reading>

<conditional_reading>
Doc CHI KHI can (phan tich mo ta task truoc):
- @references/questioning.md -> cach hoi user -- KHI can interactive questioning
- @references/ui-brand.md -> product framing -- KHI du an co UI
- @references/prioritization.md -> uu tien tasks -- KHI can sap xep nhieu tasks
- @references/state-machine.md -> luong trang thai milestone -- KHI can hieu state transitions
</conditional_reading>

<process>

## 0. Tự kiểm tra

| # | File | Không có → |
|---|------|-----------|
| 1 | `.planning/CONTEXT.md` | "Chạy `/pd:init` trước." → **DỪNG** |
| 2 | `.planning/rules/general.md` | "Rules bị thiếu. Chạy `/pd:init` để tạo lại." → **DỪNG** |

Đọc cả hai. Ghi nhận ngôn ngữ, format ngày tháng, quy cách phiên bản, biểu tượng trạng thái.

---

## 0.5: Phân tích dự án -- quyết định tài liệu tham khảo
Xác định từ CONTEXT.md:
- Dự án có UI/frontend? → đọc @references/ui-brand.md
- Cần hỏi user nhiều? → đọc @references/questioning.md
- Nhiều tasks/phases cần ưu tiên? → đọc @references/prioritization.md
- Cần hiểu milestone state? → đọc @references/state-machine.md

Nếu không rõ → BỎ QUA. Nếu phát hiện cần giữa chừng → đọc khi cần.

---

## 1. Tạo/Cập nhật PROJECT.md

> Mẫu: @templates/project.md

**Chưa tồn tại:**
- Đọc CONTEXT.md → thông tin dự án
- Hỏi user (@references/questioning.md): tầm nhìn (1-3 câu), đối tượng người dùng, ràng buộc
- Tạo PROJECT.md theo mẫu

**Đã tồn tại:**
- Đọc PROJECT.md → lịch sử milestones, tầm nhìn
- Milestone trước hoàn tất → thêm vào bảng "Lịch sử Milestones"
- Hỏi user: "Tầm nhìn thay đổi không? Bài học từ milestone trước?"
- Cập nhật nếu cần

**Cập nhật STATE.md** (nếu tồn tại): `Hoạt động cuối: [DD_MM_YYYY] — Bắt đầu khởi tạo milestone mới`

---

## 2. Kiểm tra báo cáo quét

- **KHÔNG** có `.planning/scan/SCAN_REPORT.md`:
  - CONTEXT.md → dự án mới (chưa có code) → cho phép tiếp tục
  - Dự án đã có code → "Chạy `/pd:scan` trước." → **DỪNG**
- **CÓ** → đọc: trạng thái hoàn thành, thư viện có sẵn, vấn đề & đề xuất

---

## 3. Kiểm tra lộ trình hiện có

`.planning/ROADMAP.md` đã tồn tại:

```
AskUserQuestion({
  questions: [{
    question: "Đã có lộ trình. Bạn muốn làm gì?",
    header: "Lộ trình hiện có",
    multiSelect: false,
    options: [
      { label: "Ghi đè toàn bộ", description: "Xóa lộ trình cũ, lập lại từ đầu" },
      { label: "Viết tiếp", description: "Giữ milestones cũ, thêm mới vào cuối" }
    ]
  }]
})
```

**GHI ĐÈ → cảnh báo thư mục milestone cũ:**
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
- Không hỏi được → tự động sao lưu: `.planning/milestones/` → `.planning/milestones_backup_[DD_MM_YYYY]/`

**`--reset-phase-numbers`:**
- Có cờ → đánh số phase từ 1
- Có thư mục phase cũ → lưu trữ trước để tránh xung đột
- Không có cờ → tiếp tục đánh số từ phase cuối milestone trước

---

## 4. Thu thập yêu cầu milestone

> Áp dụng @references/questioning.md

`$ARGUMENTS` có nội dung → dùng làm bối cảnh ban đầu.

**GHI ĐÈ:** trình bày milestones đã hoàn tất → hỏi toàn bộ (mục tiêu, chức năng cốt lõi, ưu tiên) → hỏi sâu (đối tượng, tình huống, ràng buộc, tiến độ)

**VIẾT TIẾP:** trình bày milestones đã có → hỏi milestones/tính năng MỚI → hỏi sâu (phạm vi, quan hệ với tính năng cũ)

**Dự án mới:** CONTEXT.md + PROJECT.md làm nền → hỏi chức năng chính → hỏi ưu tiên, đối tượng, ràng buộc

---

## 5. Nghiên cứu chiến lược (Fast Parallel Research)

```
AskUserQuestion({
  questions: [{
    question: "Có muốn nghiên cứu chiến lược (kiến trúc, thư viện, luồng dữ liệu) trước khi xác định phạm vi?",
    header: "Nghiên cứu",
    multiSelect: false,
    options: [
      { label: "Nghiên cứu trước (Đề xuất)", description: "Dùng FastCode + Context7 để tra cứu nhanh, quét lỗi kiến trúc" },
      { label: "Bỏ qua, đi thẳng vào yêu cầu", description: "Dùng kiến thức hiện có" }
    ]
  }]
})
```

**"Bỏ qua":** nhảy Bước 6.

**"Nghiên cứu trước":**
```bash
mkdir -p .planning/research
```

Thực thi **Parallel Tool Calls** (gọi nhiều tool cùng lúc trong 1 turn) thay vì spawn sub-agents để tiết kiệm token và thời gian:
1. `mcp__fastcode__code_qa`: "Có component/module nào liên quan [tính năng] có thể tái sử dụng? Kiến trúc hiện tại có điểm nghẽn (bottleneck) nào khi tích hợp tính năng này không?"
2. `mcp__context7__query-docs` (hoặc WebSearch): "Thư viện tốt nhất cho [tính năng] trên [Stack]? Các lỗ hổng bảo mật phổ biến cần tránh?"
3. (Tự suy luận internal logic): Vẽ nhanh luồng dữ liệu (Data flow) và User Journey để tìm các edge cases (loading, error, rollback).

Sau khi có kết quả từ các tools, tổng hợp và ghi trực tiếp vào file:
`Write: .planning/research/SUMMARY.md` (bao gồm: Thư viện đề xuất, Điểm tái sử dụng, Cạm bẫy kiến trúc, Luồng dữ liệu cần chú ý).

Hiển thị tóm tắt: thư viện bổ sung, tính năng bắt buộc, cảnh báo top 3.

**Commit:**
```bash
git add .planning/research/ && git commit -m "docs: nghiên cứu chiến lược milestone — [tóm tắt ngắn]"
```

**Cập nhật STATE.md:** `Hoạt động cuối: [DD_MM_YYYY] — Nghiên cứu chiến lược hoàn tất`

---

## 6. Định nghĩa yêu cầu

> Mẫu + tiêu chí: @templates/requirements.md

### 6a. Phân tích hiện trạng
- CÓ báo cáo quét → tính năng hoàn thành/dở/chưa, thư viện có sẵn
- CÓ nghiên cứu → đọc `.planning/research/SUMMARY.md` → tính năng theo nhóm
- Dự án mới → dựa vào yêu cầu user từ Bước 4
- **KHÔNG gọi FastCode** cho thông tin đã có trong báo cáo quét

### 6b. Xác định phạm vi theo nhóm
Với MỖI nhóm:
```
AskUserQuestion({
  questions: [{
    question: "[Tên nhóm] — chọn tính năng đưa vào milestone:",
    header: "[Nhóm]",
    multiSelect: true,
    options: [
      { label: "[Tính năng 1]", description: "[mô tả — bắt buộc/tạo khác biệt]" },
      { label: "Không đưa nhóm này vào", description: "Hoãn sang milestone sau" }
    ]
  }]
})
```

Phân loại: Được chọn → **v1** | Bắt buộc không chọn → **Tương lai** | Tạo khác biệt không chọn → **Ngoài phạm vi**

### 6c. Kiểm tra thiếu sót
```
AskUserQuestion({
  questions: [{
    question: "Có tính năng nào chưa liệt kê mà bạn muốn thêm?",
    header: "Bổ sung",
    multiSelect: false,
    options: [
      { label: "Không, đã đủ", description: "Chuyển sang tạo danh sách yêu cầu" },
      { label: "Có, tôi muốn thêm", description: "Mô tả tính năng cần bổ sung" }
    ]
  }]
})
```
"Có" → thu thập thêm → xác định phạm vi lại.

### 6d. Tạo REQUIREMENTS.md
Theo mẫu @templates/requirements.md.
- Mã: `[NHÓM]-[SỐ]` (AUTH-01, NOTIF-02)
- Có REQUIREMENTS.md cũ → tiếp tục đánh số từ mã cuối
- Áp dụng tiêu chí yêu cầu tốt

### 6e. Cổng duyệt — Yêu cầu

Trình bày TOÀN BỘ yêu cầu:
```
## Yêu cầu Milestone v[X.Y]
### [Nhóm 1]
- [ ] **NHOM1-01**: Người dùng có thể...
**Tổng: [X] yêu cầu | [Y] nhóm**
```

```
AskUserQuestion({
  questions: [{
    question: "Yêu cầu có đúng phạm vi không?",
    header: "Duyệt yêu cầu",
    multiSelect: false,
    options: [
      { label: "Duyệt", description: "Chuyển sang tạo lộ trình" },
      { label: "Điều chỉnh", description: "Thêm/bớt/sửa rồi xem lại" }
    ]
  }]
})
```

- **"Duyệt"** → commit, tiếp Bước 7
- **"Điều chỉnh"** → sửa → hỏi duyệt lại (lặp đến khi duyệt)

**Commit:**
```bash
git add .planning/REQUIREMENTS.md && git commit -m "docs: định nghĩa yêu cầu milestone v[X.Y] ([N] yêu cầu)"
```

**Cập nhật STATE.md:** `Hoạt động cuối: [DD_MM_YYYY] — Yêu cầu milestone v[X.Y] đã duyệt`

---

## 7. Thiết kế lộ trình

> Mẫu + quy tắc: @templates/roadmap.md

### 7a. Chia milestones và phases
- Chia Milestones (1.0, 1.1, 2.0...) → Phases
- Mỗi phase PHẢI có đủ 5 thành phần (@templates/roadmap.md → "Quy tắc Phase")
- Xác định phụ thuộc, ưu tiên, đánh số phiên bản, kiểm tra trùng (khi VIẾT TIẾP)

### 7b. Kiểm tra độ phủ (BẮT BUỘC)
MỌI yêu cầu v1 PHẢI gắn vào đúng 1 phase. Chưa gắn → **DỪNG**, sửa trước.

### 7c. Quyết định chiến lược
Claude PHẢI ghi nhận: tại sao milestone X trước Y, tại sao ưu tiên Z, tại sao chia N milestones, phụ thuộc.

### 7d. Tạo ROADMAP.md
- **GHI ĐÈ** → viết mới theo mẫu
- **VIẾT TIẾP** → giữ nguyên milestones cũ → thêm mới SAU cuối → cập nhật ngày
- Thêm quyết định chiến lược vào bảng hiện có

### 7e. Cập nhật bảng theo dõi REQUIREMENTS.md

| Yêu cầu | Phase | Trạng thái |
|----------|-------|------------|
| AUTH-01 | Phase 1.1 | Chờ triển khai |

Kiểm tra: tất cả v1 đã gắn → Đủ. Có yêu cầu chưa gắn → **DỪNG**, sửa trước.

### 7f. Cổng duyệt — Lộ trình

Trình bày: `[N] phases | [X] yêu cầu đã gắn | Độ phủ: ✓` + bảng phases + chi tiết.

```
AskUserQuestion({
  questions: [{
    question: "Lộ trình có phù hợp không?",
    header: "Duyệt lộ trình",
    multiSelect: false,
    options: [
      { label: "Duyệt", description: "Chốt và commit" },
      { label: "Điều chỉnh phases", description: "Thay đổi thứ tự, gộp/tách, di chuyển yêu cầu" },
      { label: "Xem file đầy đủ", description: "Hiển thị toàn bộ ROADMAP.md trước khi quyết định" }
    ]
  }]
})
```

- **"Duyệt"** → commit, tiếp Bước 8
- **"Điều chỉnh"** → sửa → hỏi lại (lặp đến khi duyệt)
- **"Xem file đầy đủ"** → hiển thị → hỏi lại

**Commit:**
```bash
git add .planning/ROADMAP.md .planning/REQUIREMENTS.md && git commit -m "docs: tạo lộ trình milestone v[X.Y] ([N] phases, [X] yêu cầu đã gắn)"
```

In bảng quyết định chiến lược + cảnh báo review trước `/pd:plan`.

**Cập nhật STATE.md:** `Hoạt động cuối: [DD_MM_YYYY] — Lộ trình milestone v[X.Y] đã duyệt`

---

## 8. Tạo/Đặt lại STATE.md

```markdown
# Trạng thái làm việc
> Cập nhật: [DD_MM_YYYY]

## Vị trí hiện tại
- Milestone: v[X.Y] — [Tên]
- Phase: Chưa bắt đầu
- Kế hoạch: —
- Trạng thái: Sẵn sàng lên kế hoạch
- Hoạt động cuối: [DD_MM_YYYY] — Milestone v[X.Y] khởi tạo

## Bối cảnh tích lũy
[Milestone trước → giữ bối cảnh có giá trị. Milestone đầu → "Chưa có."]

## Vấn đề chặn
Không
```

Có STATE.md cũ → đọc "Bối cảnh tích lũy" → giữ lại → đặt lại phần còn lại.

---

## 9. Tạo theo dõi + Commit

### 9a. Tạo/cập nhật CURRENT_MILESTONE.md
- **GHI ĐÈ hoặc chưa tồn tại:** tạo mới (milestone, version, phase đầu tiên, status: Chưa bắt đầu)
- **VIẾT TIẾP VÀ đã tồn tại:** giữ nguyên

### 9b. Tạo `.planning/milestones/[version]/` cho TẤT CẢ milestones mới

### 9c. Cập nhật `> Cập nhật: [DD_MM_YYYY]` trong PROJECT.md

### 9d. Commit
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
   Phase [đầu tiên]: [Tên] — [Mục tiêu]
```

</process>

<rules>
- Tuân thủ `.planning/rules/general.md`
- Milestones thực tế, ưu tiên tính năng cốt lõi trước
- Backend + Frontend → Backend API trước. Frontend-only (UI, SEO) → độc lập
- Chỉ Frontend hoặc chỉ Backend → lên kế hoạch theo stack có sẵn
- Dự án mới: phase đầu = thiết lập (khởi tạo, cấu hình, thư viện)
- Xác thực/Bảo mật luôn trong milestone đầu
- KHÔNG gọi FastCode cho thông tin đã có trong báo cáo quét
- PHẢI kiểm tra CONTEXT.md + rules/general.md tồn tại → DỪNG nếu thiếu
- PHẢI tạo/cập nhật PROJECT.md ở Bước 1 — trước mọi công việc khác
- MỌI yêu cầu v1 PHẢI gắn vào đúng 1 phase — chưa gắn → sửa trước khi duyệt
- Yêu cầu PHẢI hướng người dùng, kiểm tra được, đơn lẻ
- PHẢI tạo thư mục milestones/[version]/ khi tạo lộ trình
- PHẢI có 2 cổng duyệt: yêu cầu + lộ trình — lặp đến khi duyệt
- PHẢI commit sau mỗi cổng
- PHẢI cập nhật STATE.md ở mỗi mốc (Bước 1, 5, 6e, 7f), KHÔNG chỉ cuối
- STATE.md PHẢI giữ "Bối cảnh tích lũy" từ milestone trước — KHÔNG xóa sạch
- FastCode và Context7 chạy song song trong Bước Nghiên cứu chiến lược
- Tổng hợp nghiên cứu trực tiếp vào .planning/research/SUMMARY.md
- AskUserQuestion không khả dụng → hỏi văn bản thường, chờ trả lời
</rules>
