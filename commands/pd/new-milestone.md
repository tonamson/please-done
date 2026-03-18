---
name: pd:new-milestone
description: Lập kế hoạch chiến lược dự án, tạo roadmap với milestones rõ ràng
---

<objective>
Lập kế hoạch chiến lược tổng thể, tạo roadmap với milestones, priorities và dependencies.
</objective>

<context>
User input: $ARGUMENTS

Đọc:
- `.planning/CONTEXT.md` (đã tạo bởi /pd:init)
- `.planning/rules/general.md` → ngôn ngữ, ngày tháng, version format, icons

Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
</context>

<process>

## Bước 1: Kiểm tra scan report
- Nếu KHÔNG có `.planning/scan/SCAN_REPORT.md`:
  - Đọc CONTEXT.md → nếu là project mới (chưa có code) → cho phép tiếp tục KHÔNG cần scan (user cung cấp yêu cầu ở Bước 3)
  - Nếu project đã có code → thông báo chạy `/pd:scan` trước, DỪNG
- Nếu CÓ → đọc, đặc biệt "Trạng thái hoàn thành", "Thư viện", và "Vấn đề & Đề xuất" (đưa technical debts vào roadmap planning)

## Bước 2: Kiểm tra roadmap hiện có
Nếu `.planning/ROADMAP.md` đã tồn tại → hỏi user: "GHI ĐÈ toàn bộ hay VIẾT TIẾP?"

**Nếu user chọn "GHI ĐÈ":**
- Cảnh báo: "Các thư mục milestone cũ (.planning/milestones/) vẫn tồn tại. Bạn muốn: (a) Xóa tất cả, (b) Giữ lại (backup), (c) Chỉ xóa milestones chưa có code"
- Nếu không hỏi được (flow phức tạp) → rename `.planning/milestones/` → `.planning/milestones_backup_[DD_MM_YYYY]/` trước khi tạo mới

## Bước 3: Thu thập yêu cầu
Nếu `$ARGUMENTS` có nội dung → dùng làm context.
Nếu không:
- **GHI ĐÈ**: hỏi toàn bộ mục tiêu dự án, chức năng cốt lõi, ưu tiên cao nhất
- **VIẾT TIẾP**: hỏi "milestones/features MỚI cần thêm vào roadmap hiện có?"

## Bước 4: Phân tích hiện trạng
- Nếu CÓ scan report: features đã hoàn thành / đang dở / chưa bắt đầu, thư viện có sẵn
- Nếu project mới: dựa hoàn toàn vào yêu cầu user từ Bước 3
- **KHÔNG gọi FastCode** cho thông tin đã có trong scan report

## Bước 5: Thiết kế Roadmap
- Chia thành **Milestones** (1.0, 1.1, 2.0...)
- Mỗi milestone gồm **Phases**
- Mỗi phase có mục tiêu + deliverables cụ thể
- Xác định dependencies giữa phases
- Priority: Quan trọng / Cao / Trung bình / Thấp
- **Version numbering**: Major version (1.0 → 2.0) cho feature set hoàn chỉnh mới. Minor version (1.0 → 1.1) cho incremental features. Ghi lý do bump version vào bảng Quyết định chiến lược.
- **Version conflict check** (khi VIẾT TIẾP): Kiểm tra version milestones mới KHÔNG trùng với milestones đã có. Nếu trùng → cảnh báo user chọn version khác.

## Bước 5.5: Xác định quyết định chiến lược
Claude PHẢI xác định các quyết định chiến lược đã tự đưa ra và ghi nhận:
- Tại sao milestone X trước Y?
- Tại sao feature Z ưu tiên Cao?
- Tại sao chia thành N milestones thay vì M?
- Dependencies giữa milestones
Lưu vào bảng "Quyết định chiến lược" trong ROADMAP.md (Bước 6).

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

## Quyết định chiến lược
| # | Vấn đề | Quyết định | Lý do | Alternatives đã loại |
|---|--------|-----------|-------|---------------------|

## Rủi ro & Lưu ý
```

## Bước 7: Tạo/cập nhật tracking
**Nếu "GHI ĐÈ" hoặc CURRENT_MILESTONE.md chưa tồn tại:**
Tạo `.planning/CURRENT_MILESTONE.md` pointing tới milestone ĐẦU TIÊN trong ROADMAP mới:
```markdown
# Milestone hiện tại
- milestone: [tên]
- version: [x.x]
- phase: [phase đầu tiên, VD: 1.1]
- status: Chưa bắt đầu
```

**Nếu "VIẾT TIẾP" VÀ CURRENT_MILESTONE.md đã tồn tại:**
Giữ nguyên CURRENT_MILESTONE.md (KHÔNG ghi đè) — milestone hiện tại vẫn đang hoạt động.

Tạo thư mục `.planning/milestones/[version]/` cho TẤT CẢ milestones mới trong ROADMAP (nếu chưa có).

## Bước 8: Thông báo
In tóm tắt roadmap cho user review.
In bảng tóm tắt quyết định chiến lược để user review:
```
### Claude đã tự quyết định [N] vấn đề chiến lược:
| # | Vấn đề | Quyết định | Lý do tóm tắt |
|---|--------|-----------|---------------|
Xem chi tiết đầy đủ (bao gồm alternatives đã loại) trong ROADMAP.md → Section "Quyết định chiến lược".
⚠️ Hãy review các quyết định trên trước khi chạy /pd:plan.
```
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/general.md` (ngôn ngữ, ngày tháng, version, bảo mật)
- Milestones thực tế, ưu tiên core features trước
- Nếu có cả Backend + Frontend: Backend API trước khi Frontend consume API đó
- Frontend-only features (UI, SEO, layout) được lên kế hoạch độc lập, KHÔNG cần chờ backend
- Nếu project chỉ có Frontend hoặc chỉ có Backend: lên kế hoạch theo stack có sẵn
- Project mới: phase đầu nên bao gồm setup project (init, config, dependencies) trước khi code features
- Auth/Security luôn trong milestone đầu
- KHÔNG gọi FastCode cho thông tin đã có trong scan report
- PHẢI tạo thư mục milestones/[version]/ khi tạo roadmap
</rules>
