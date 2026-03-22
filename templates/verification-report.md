# Mẫu VERIFICATION_REPORT.md

> `/pd:write-code` tạo (Bước 9.5) | `/pd:what-next`, `/pd:complete-milestone` đọc

Báo cáo xác minh tính năng sau khi phase hoàn tất code. Xác nhận PLAN.md Truths **thực sự hoạt động**.

- `CODE_REPORT_TASK_N.md` = báo cáo code 1 task
- `TEST_REPORT.md` = kết quả test tự động/thủ công
- `VERIFICATION_REPORT.md` = xác minh đầu cuối dựa trên Truths

## Mẫu

```markdown
# Xác minh tính năng — Phase [x.x]
> Ngày: [DD_MM_YYYY HH:MM]
> Trạng thái: [Đạt | Có gap | Cần kiểm tra thủ công]
> Kết quả: [N]/[M] tiêu chí đạt
> Vòng sửa: [0 | 1 | 2]

## Truths — Sự thật phải đạt
| # | Sự thật | Trạng thái | Bằng chứng |
|---|---------|-----------|-----------|
| T1 | [mô tả] | ✅ ĐẠT | [file tồn tại, logic đúng, test đạt] |
| T2 | [mô tả] | ❌ CHƯA ĐẠT | [file thiếu / logic sai / stub] |
| T3 | [mô tả] | ⚠️ CẦN KIỂM TRA THỦ CÔNG | [cần chạy app / kiểm tra giao diện] |

## Artifacts — Sản phẩm cần có
| Artifact | Đường dẫn | Tồn tại | Thực chất | Kết nối | Vấn đề |
|----------|-----------|---------|-----------|---------|--------|
| [tên] | [path] | ✅ | ✅ | ✅ | — |
| [tên] | [path] | ✅ | ❌ | — | [stub: return null] |
| [tên] | [path] | ❌ | — | — | [file không tồn tại] |

## Liên kết then chốt (Key Links)
| Từ | Đến | Mô tả | Trạng thái |
|----|-----|-------|-----------|
| [file A] | [file B] | [A gọi B.method()] | ✅ KẾT NỐI |
| [file C] | [file D] | [C import D] | ❌ ĐỨT | [D không export function cần thiết] |

## Anti-pattern phát hiện
| File | Dòng | Mẫu | Mức độ |
|------|------|------|--------|
| [path] | [N] | [TODO: implement] | ⚠️ Cảnh báo |
| [path] | [N] | [return null — stub] | 🛑 Chặn |

## Gaps đã sửa (nếu có vòng sửa)
### Vòng [1|2]
| Gap | Mô tả | Cách sửa | Kết quả |
|-----|-------|----------|---------|
| T2 chưa đạt | [chi tiết] | [files đã sửa] | ✅ Đạt sau sửa |

## Tổng kết
- Đạt: [N] Truths
- Chưa đạt: [M] Truths
- Cần kiểm tra thủ công: [K] Truths
- Anti-pattern: [X] chặn, [Y] cảnh báo
```

## Quy tắc

- Trạng thái tổng: `Đạt` = tất cả ✅ | `Có gap` = ≥1 ❌ sau 2 vòng sửa | `Cần kiểm tra thủ công` = tự động đạt nhưng cần user xác nhận
- Cột "Thực chất" = Cấp 2 xác minh (@references/verification-patterns.md)
- Cột "Kết nối" = Cấp 3 xác minh
- 🛑 Chặn = phải sửa trước khi chuyển tiếp | ⚠️ Cảnh báo = ghi nhận
- Lưu tại: `.planning/milestones/[version]/phase-[phase]/VERIFICATION_REPORT.md`
