---
name: sk:roadmap
description: Lập kế hoạch chiến lược dự án, tạo roadmap với milestones rõ ràng
---

<objective>
Lập kế hoạch chiến lược tổng thể, tạo roadmap với milestones, priorities và dependencies.
</objective>

<context>
User input: $ARGUMENTS

Đọc:
- `.planning/CONTEXT.md` (đã tạo bởi /sk:init)
- `.planning/rules/general.md` → ngôn ngữ, ngày tháng, version format, icons

Nếu chưa có CONTEXT.md → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Kiểm tra scan report
- Nếu KHÔNG có `.planning/scan/SCAN_REPORT.md` → thông báo chạy `/sk:scan` trước, DỪNG
- Nếu CÓ → đọc, đặc biệt "Trạng thái hoàn thành" và "Thư viện"

## Bước 2: Kiểm tra roadmap hiện có
Nếu `.planning/ROADMAP.md` đã tồn tại → hỏi user: "GHI ĐÈ toàn bộ hay VIẾT TIẾP?"

## Bước 3: Thu thập yêu cầu
Nếu `$ARGUMENTS` có nội dung → dùng làm context.
Nếu không → hỏi user: mục tiêu chính, chức năng cốt lõi, ưu tiên cao nhất.

## Bước 4: Phân tích hiện trạng từ scan report
- Features đã hoàn thành / đang dở / chưa bắt đầu
- Thư viện có sẵn để tận dụng
- **KHÔNG gọi FastCode** cho thông tin đã có trong scan report

## Bước 5: Thiết kế Roadmap
- Chia thành **Milestones** (1.0, 1.1, 2.0...)
- Mỗi milestone gồm **Phases**
- Mỗi phase có mục tiêu + deliverables cụ thể
- Xác định dependencies giữa phases
- Priority: Quan trọng / Cao / Trung bình / Thấp

## Bước 6: Tạo ROADMAP.md
Viết `.planning/ROADMAP.md`:

```markdown
# Lộ trình dự án
> Dự án: [tên]
> Ngày tạo: [DD_MM_YYYY]
> Cập nhật lần cuối: [DD_MM_YYYY]

## Mục tiêu dự án
[Mô tả ngắn gọn]

## Milestones

### Milestone 1: [Tên] (v1.0)
> Trạng thái: ⬜ | Ưu tiên: Quan trọng

#### Phase 1.1: [Tên]
- [ ] Deliverable 1
- [ ] Deliverable 2
- Phụ thuộc: Không

#### Phase 1.2: [Tên]
- [ ] Deliverable 1
- Phụ thuộc: Phase 1.1

### Milestone 2: [Tên] (v1.1)
...

## Rủi ro & Lưu ý
```

## Bước 7: Tạo tracking
Tạo `.planning/CURRENT_MILESTONE.md`:
```markdown
# Milestone hiện tại
- milestone: [tên]
- version: [x.x]
- phase: 1.1
- status: Chưa bắt đầu
```

Tạo thư mục `.planning/milestones/[version]/`

## Bước 8: Thông báo
In tóm tắt roadmap cho user review.
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/general.md` (ngôn ngữ, ngày tháng, version, bảo mật)
- Milestones thực tế, ưu tiên core features trước
- Nếu có cả Backend + Frontend: Backend API trước khi Frontend consume API đó
- Frontend-only features (UI, SEO, layout) được lên kế hoạch độc lập, KHÔNG cần chờ backend
- Nếu project chỉ có Frontend hoặc chỉ có Backend: lên kế hoạch theo stack có sẵn
- Auth/Security luôn trong milestone đầu
- KHÔNG gọi FastCode cho thông tin đã có trong scan report
- PHẢI tạo thư mục milestones/[version]/ khi tạo roadmap
</rules>
