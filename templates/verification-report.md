# Mẫu VERIFICATION_REPORT.md

> Dùng bởi: `/pd:write-code` (Bước 9.5 — tạo), `/pd:complete-milestone` (Bước 3.5 — đọc)
> Đọc bởi: `/pd:what-next`, `/pd:complete-milestone`

## Mục đích

VERIFICATION_REPORT.md là **báo cáo xác minh tính năng** sau khi phase hoàn tất code. Xác nhận rằng tính năng trong PLAN.md **thực sự hoạt động**, không chỉ "task done".

**Phân biệt với các file khác:**
- `CODE_REPORT_TASK_N.md` = báo cáo code cho 1 task (files, security, deviations)
- `TEST_REPORT.md` = kết quả chạy test tự động/thủ công
- `VERIFICATION_REPORT.md` = xác minh tính năng end-to-end dựa trên Truths trong PLAN.md

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
| T1 | [mô tả] | ✅ ĐẠT | [bằng chứng: file tồn tại, logic đúng, test pass] |
| T2 | [mô tả] | ❌ CHƯA ĐẠT | [lý do: file thiếu / logic sai / stub detected] |
| T3 | [mô tả] | ⚠️ CẦN KIỂM TRA THỦ CÔNG | [lý do: cần chạy app / kiểm tra UI / WebSocket] |

## Artifacts — Sản phẩm cần có
| Artifact | Đường dẫn | Tồn tại | Thực chất | Kết nối | Vấn đề |
|----------|-----------|---------|-----------|---------|--------|
| [tên] | [path] | ✅ | ✅ | ✅ | — |
| [tên] | [path] | ✅ | ❌ | — | [stub detected: return null] |
| [tên] | [path] | ❌ | — | — | [file không tồn tại] |

## Key Links — Liên kết then chốt
| Từ | Đến | Mô tả | Trạng thái |
|----|-----|-------|-----------|
| [file A] | [file B] | [A gọi B.method()] | ✅ KẾT NỐI |
| [file C] | [file D] | [C import D] | ❌ ĐỨT | [D không export function cần thiết] |

## Anti-patterns phát hiện
| File | Dòng | Pattern | Mức độ |
|------|------|---------|--------|
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
- Anti-patterns: [X] chặn, [Y] cảnh báo
```

## Quy tắc

- **Trạng thái tổng thể** dựa trên kết quả verification:
  - `Đạt` → tất cả Truths ✅ (có thể có ⚠️ cần kiểm tra thủ công)
  - `Có gap` → có ≥1 Truth ❌ sau khi đã sửa 2 vòng
  - `Cần kiểm tra thủ công` → automated checks pass nhưng có items cần user verify
- **Cột "Thực chất"** = Cấp 2 verification (xem @references/verification-patterns.md)
- **Cột "Kết nối"** = Cấp 3 verification
- **Anti-patterns mức "🛑 Chặn"** = phải sửa trước khi advance
- **Anti-patterns mức "⚠️ Cảnh báo"** = ghi nhận, không block
- File lưu tại: `.planning/milestones/[version]/phase-[phase]/VERIFICATION_REPORT.md`
