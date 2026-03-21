# Mẫu PLAN.md

> Dùng bởi: `/pd:plan` (tạo)
> Đọc bởi: `/pd:write-code`, `/pd:test`, `/pd:fix-bug`

## Mục đích

PLAN.md là **thiết kế kỹ thuật chi tiết** cho 1 phase. Chứa:
- Mục tiêu phase (hướng sản phẩm — xem @references/ui-brand.md)
- Quyết định thiết kế (nguồn sự thật cho code — vi phạm = lỗi)
- Research kết quả
- Thiết kế kỹ thuật (API, DB, files)
- Thứ tự thực hiện

**Phân biệt với các file khác:**
- `TASKS.md` = danh sách công việc cụ thể (xem @templates/tasks.md)
- `ROADMAP.md` = tổng quan phases/milestones (xem @templates/roadmap.md)
- `PLAN.md` = thiết kế kỹ thuật chi tiết cho 1 phase

## Mẫu

```markdown
# Kế hoạch triển khai
> Milestone: [tên] (v[x.x])
> Phase: [x.x]
> Chế độ: [Auto | Discuss]
> Ngày tạo: [DD_MM_YYYY]

## Mục tiêu
[Mô tả mục tiêu phase — hướng sản phẩm, không chỉ kỹ thuật]

## Quyết định thiết kế

<!-- Chế độ DISCUSS (user thảo luận TẤT CẢ) → bảng gốc: -->
| # | Vấn đề | Quyết định | Nguồn |
|---|--------|-----------|-------|
| 1 | [Tên] | [Phương án] | User chọn / Claude quyết định |

<!-- Chế độ AUTO (hoặc DISCUSS skip-all) → bảng mở rộng: -->
| # | Vấn đề | Phương án đã chọn | Lý do | Alternatives đã loại |
|---|--------|-------------------|-------|---------------------|
| 1 | [Tên] | [Phương án] | [Tại sao chọn] | [PA khác → tại sao loại] |

<!-- DISCUSS hybrid → bảng gốc + ghi chú bổ sung Lý do/Alternatives cho vấn đề Claude tự quyết -->
<!-- Không có quyết định → ghi: -->
Không có quyết định thiết kế đặc biệt — tất cả đã xác định rõ từ ROADMAP/CONTEXT.

## Research
### Thư viện có sẵn
| Tên | Phiên bản | Sử dụng cho |

### Code tái sử dụng
| Function/Service | File | Mô tả |

### Tài liệu đã fetch
| Tên | Sections liên quan |

## Thiết kế kỹ thuật

<!-- Sections dưới đây là TÙY CHỌN — CHỈ tạo sections có dữ liệu, bỏ sections không liên quan -->

<!-- Backend (NestJS/Express) -->
### API Endpoints
| Phương thức | Đường dẫn | Mô tả | Xác thực |

### Database
[Schema + migration strategy]

### DTOs & Validation

<!-- WordPress -->
### Plugin/Theme Architecture
[Mô tả cấu trúc plugin/theme]

### Custom Post Types & Taxonomies
| Tên | Slug | Mô tả |

### REST API Endpoints
| Route | Callback | Permission |

### Hooks & Filters
| Loại | Hook name | Callback | Mô tả |

<!-- Solidity -->
### Contract Architecture
| Tên | Base Contract | Mô tả |

### Contract Functions
| Function | Visibility | Modifiers | Mô tả |

### Token Interactions
[SafeERC20, approve patterns]

<!-- Flutter -->
### Screens & Navigation
| Route | View | Logic | Binding |

### State Management (GetX)
| Controller | State | Reactive Variables |

### Design System Tokens
[AppColors, AppSpacing, AppTextStyles sử dụng]

<!-- Chung — LUÔN tạo -->
### Files cần tạo/sửa
| Hành động | Đường dẫn | Mô tả |

### Thư viện cần thêm

## UI/UX Design (nếu feature có giao diện)

<!-- Lớp 2 — Kế thừa patterns từ code hiện có (xem @references/ui-brand.md) -->
### UI — Kế thừa patterns
| Pattern | Tham khảo từ | Áp dụng cho |
|---------|-------------|-------------|

### UI — Pattern mới (nếu có)
| Pattern | Lý do không tái sử dụng | Mô tả |
|---------|------------------------|-------|

<!-- Lớp 3 — UX States cho feature mới chưa có UI (xem @references/ui-brand.md) -->
### UX States — [Tên feature]
| State | Hiển thị | Hành động user |
|-------|---------|---------------|
| Empty | [mô tả] | [hành động] |
| Loading | [mô tả] | [hành động] |
| Error | [mô tả] | [hành động] |
| No permission | [mô tả] | [hành động] |
| Success | [mô tả] | [hành động] |

Entry point: [vào từ đâu]
Main CTA: [nút/hành động chính]
Responsive: [mobile khác desktop thế nào]

## Thứ tự thực hiện
1. [Bước 1]
2. [Bước 2]

## Lưu ý kỹ thuật
```

## Quy tắc

- **CHỈ tạo sections có dữ liệu** — bỏ sections không liên quan đến stack
- Bỏ "API Endpoints" nếu không có backend, bỏ "Database" nếu không có DB
- Section "Quyết định thiết kế": **LUÔN** tạo ở cả hai chế độ
- Code PHẢI tuân thủ quyết định trong bảng — nếu không thể tuân thủ do constraint kỹ thuật → DỪNG, thông báo user
