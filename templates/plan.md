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
> Chi tiết đầy đủ: xem [RESEARCH.md](./RESEARCH.md)

### Tóm tắt research
<!-- Rút gọn từ RESEARCH.md — chỉ giữ thông tin ảnh hưởng trực tiếp đến thiết kế -->

### Thư viện có sẵn
| Tên | Phiên bản | Sử dụng cho |

### Code tái sử dụng
| Function/Service | File | Mô tả |

### Cảnh báo từ research
<!-- Rút từ RESEARCH.md sections "Không nên tự code" + "Cạm bẫy" — chỉ liệt kê items ảnh hưởng đến thiết kế phase này -->

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

## Tiêu chí thành công (Goal-backward)

<!--
  Suy luận NGƯỢC từ mục tiêu: "Điều gì phải TRUE khi phase này hoàn tất?"
  → Không phải danh sách task, mà là KẾT QUẢ QUAN SÁT ĐƯỢC từ góc nhìn user/hệ thống.
  Mỗi tiêu chí = 1 sự thật có thể kiểm chứng (verify bằng code, test, hoặc thao tác thực tế).
-->

### Sự thật phải đạt (Truths)
<!-- Mỗi dòng = 1 điều PHẢI TRUE khi phase hoàn tất. Viết dạng khẳng định, kiểm chứng được. -->
| # | Sự thật | Cách kiểm chứng |
|---|---------|-----------------|
| T1 | [VD: User có thể đăng nhập bằng email + password] | [VD: POST /auth/login trả về JWT hợp lệ] |
| T2 | [VD: Token hết hạn sau 1 giờ] | [VD: JWT decode → exp = iat + 3600] |

### Sản phẩm cần có (Artifacts)
<!-- Files/modules PHẢI tồn tại để các Truths trên thành hiện thực. Mỗi artifact truy vết về ≥1 Truth. -->
<!-- Cột "Kiểm tra tự động" dùng cho verification sau khi code xong — xem @references/verification-patterns.md -->
| Artifact | Đường dẫn dự kiến | Phục vụ Truth | Kiểm tra tự động |
|----------|-------------------|---------------|-----------------|
| [VD: Auth service] | [src/auth/auth.service.ts] | T1, T2 | `exports: [login, register]`, `min_lines: 30` |
| [VD: Auth controller] | [src/auth/auth.controller.ts] | T1 | `imports: [AuthService]`, `contains: "@Post('login')"` |

### Liên kết then chốt (Key Links)
<!-- Cách các artifacts KẾT NỐI với nhau. Nếu link nào đứt → Truth không đạt. -->
| Từ | Đến | Mô tả |
|----|-----|-------|
| [VD: auth.controller] | [auth.service] | [Controller gọi service.login()] |

### Phân tích gap
<!-- Kết quả self-check: Truths nào CHƯA được phủ bởi thiết kế? Để trống nếu không có gap. -->
Không có gap — tất cả Truths đã được phủ bởi thiết kế kỹ thuật và artifacts ở trên.

## Thứ tự thực hiện
1. [Bước 1]
2. [Bước 2]

## Lưu ý kỹ thuật
```

## Quy tắc

- **CHỈ tạo sections có dữ liệu** — bỏ sections không liên quan đến stack
- Bỏ "API Endpoints" nếu không có backend, bỏ "Database" nếu không có DB
- Section "Quyết định thiết kế": **LUÔN** tạo ở cả hai chế độ
- Section "Tiêu chí thành công (Goal-backward)": **LUÔN** tạo — là chi tiết hóa tiêu chí từ ROADMAP.md. Thiếu section này = plan chưa hoàn tất
- Code PHẢI tuân thủ quyết định trong bảng — nếu không thể tuân thủ do constraint kỹ thuật → DỪNG, thông báo user
