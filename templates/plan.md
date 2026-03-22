# Mẫu PLAN.md

> `/pd:plan` tạo | `/pd:write-code`, `/pd:test`, `/pd:fix-bug` đọc

Thiết kế kỹ thuật chi tiết cho 1 phase: mục tiêu, quyết định, research, thiết kế, thứ tự thực hiện.

- `TASKS.md` = danh sách công việc (@templates/tasks.md)
- `ROADMAP.md` = tổng quan phases (@templates/roadmap.md)
- `PLAN.md` = thiết kế kỹ thuật 1 phase

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

<!-- DISCUSS → bảng gốc: -->
| # | Vấn đề | Quyết định | Nguồn |
|---|--------|-----------|-------|
| 1 | [Tên] | [Phương án] | User chọn / Claude quyết định |

<!-- AUTO (hoặc DISCUSS skip-all) → bảng mở rộng: -->
| # | Vấn đề | Phương án đã chọn | Lý do | Alternatives đã loại |
|---|--------|-------------------|-------|---------------------|
| 1 | [Tên] | [Phương án] | [Tại sao chọn] | [PA khác → tại sao loại] |

<!-- DISCUSS hybrid → bảng gốc + ghi chú Lý do/Alternatives cho vấn đề Claude tự quyết -->
<!-- Không có quyết định → ghi: -->
Không có quyết định thiết kế đặc biệt — tất cả đã xác định rõ từ ROADMAP/CONTEXT.

## Research
> Chi tiết: xem [RESEARCH.md](./RESEARCH.md)

### Tóm tắt research
<!-- Rút gọn từ RESEARCH.md — chỉ giữ thông tin ảnh hưởng thiết kế -->

### Thư viện có sẵn
| Tên | Phiên bản | Sử dụng cho |

### Code tái sử dụng
| Function/Service | File | Mô tả |

### Cảnh báo từ research
<!-- Rút từ RESEARCH.md "Không nên tự code" + "Cạm bẫy" — chỉ items ảnh hưởng thiết kế -->

### Tài liệu đã fetch
| Tên | Sections liên quan |

## Thiết kế kỹ thuật

<!-- CHỈ tạo sections có dữ liệu, bỏ sections không liên quan -->

<!-- Backend -->
### API Endpoints
| Phương thức | Đường dẫn | Mô tả | Xác thực |

### Database
[Schema + migration strategy]

### DTOs & Validation

<!-- WordPress -->
### Plugin/Theme Architecture
[Cấu trúc plugin/theme]

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
[AppColors, AppSpacing, AppTextStyles]

<!-- Chung — LUÔN tạo -->
### Files cần tạo/sửa
| Hành động | Đường dẫn | Mô tả |

### Thư viện cần thêm

## UI/UX Design (nếu có giao diện)

<!-- Lớp 2 — Kế thừa patterns từ code hiện có (@references/ui-brand.md) -->
### UI — Kế thừa patterns
| Pattern | Tham khảo từ | Áp dụng cho |
|---------|-------------|-------------|

### UI — Pattern mới (nếu có)
| Pattern | Lý do không tái sử dụng | Mô tả |
|---------|------------------------|-------|

<!-- Lớp 3 — UX States cho feature mới (@references/ui-brand.md) -->
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

<!-- Suy luận NGƯỢC từ mục tiêu: "Điều gì phải TRUE khi phase hoàn tất?"
  Không phải danh sách task mà là KẾT QUẢ QUAN SÁT ĐƯỢC. Mỗi tiêu chí = 1 sự thật kiểm chứng được. -->

### Sự thật phải đạt (Truths)
<!-- Mỗi dòng = 1 điều PHẢI TRUE khi phase hoàn tất. Khẳng định, kiểm chứng được. -->
| # | Sự thật | Cách kiểm chứng |
|---|---------|-----------------|
| T1 | [VD: User có thể đăng nhập bằng email + password] | [VD: POST /auth/login trả về JWT hợp lệ] |
| T2 | [VD: Token hết hạn sau 1 giờ] | [VD: JWT decode → exp = iat + 3600] |

### Sản phẩm cần có (Artifacts)
<!-- Files/modules PHẢI tồn tại. Mỗi artifact truy vết về ≥1 Truth. Cột "Kiểm tra tự động" → @references/verification-patterns.md -->
| Artifact | Đường dẫn dự kiến | Phục vụ Truth | Kiểm tra tự động |
|----------|-------------------|---------------|-----------------|
| [VD: Auth service] | [src/auth/auth.service.ts] | T1, T2 | `exports: [login, register]`, `min_lines: 30` |
| [VD: Auth controller] | [src/auth/auth.controller.ts] | T1 | `imports: [AuthService]`, `contains: "@Post('login')"` |

### Liên kết then chốt (Key Links)
<!-- Cách artifacts KẾT NỐI nhau. Link đứt → Truth không đạt. -->
| Từ | Đến | Mô tả |
|----|-----|-------|
| [VD: auth.controller] | [auth.service] | [Controller gọi service.login()] |

### Phân tích gap
<!-- Self-check: Truths nào CHƯA được phủ? Để trống nếu không có gap. -->
Không có gap — tất cả Truths đã được phủ bởi thiết kế kỹ thuật và artifacts ở trên.

## Thứ tự thực hiện

> Mỗi task trong TASKS.md PHẢI có trường `Effort:` trong metadata line.
> Mặc định: `standard`. Xem @references/conventions.md.

1. [Bước 1]
2. [Bước 2]

## Lưu ý kỹ thuật
```

## Quy tắc

- **CHỈ tạo sections có dữ liệu** — bỏ sections không liên quan đến stack
- Section "Quyết định thiết kế": **LUÔN** tạo ở cả hai chế độ
- Section "Tiêu chí thành công (Goal-backward)": **LUÔN** tạo — thiếu = plan chưa hoàn tất
- Code PHẢI tuân thủ quyết định trong bảng — không thể tuân thủ → DỪNG, thông báo user
