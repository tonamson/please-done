# Benchmark — Please Done
> Ngày: 2026-03-20
> Node: v24.13.0
> OS: darwin arm64

## 1. Hiệu suất cài đặt

Cài vào thư mục tạm → đo thời gian + files sinh ra → gỡ → xác nhận sạch.

| Nền tảng | Cài (ms) | Gỡ (ms) | Files | Dòng | Rò rỉ path |
|----------|---------|---------|-------|------|-----------|
| Codex CLI | 33 | 8 | 48 | 11,638 | ✅ 0 |
| GitHub Copilot | 24 | 8 | 48 | 11,433 | ✅ 0 |
| Gemini CLI | 19 | 6 | 48 | 11,525 | ✅ 0 |
| OpenCode | 15 | 3 | 47 | 11,504 | ✅ 0 |

**Tổng**: 191 files, 46,100 dòng được sinh ra cho 4 nền tảng từ 1 bộ source duy nhất.

## 2. Idempotency (cài lại an toàn)

Cài 2 lần liên tiếp (v1 → v2): **4/4 nền tảng** không tạo file thừa.

## 3. Smoke tests

| Kết quả | Số lượng |
|---------|---------|
| ✅ Đạt | 75 |
| ❌ Lỗi | 0 |
| ⏱ Thời gian | 338ms |

## 4. Phân tích cấu trúc workflow

| Thành phần | Số lượng |
|-----------|---------|
| Skills (lệnh người dùng gọi) | 11 |
| Workflows (quy trình chi tiết) | 9 |
| Tổng bước workflow | 78 |
| Cổng kiểm tra (DỪNG/CHẶN) | 48 |
| Điểm khôi phục (gián đoạn) | 42 |
| Điểm tương tác người dùng | 74 |
| Templates (mẫu file) | 7 |
| References (quy ước chung) | 5 |
| Rules (quy tắc code theo stack) | 35 |
| Tổng dòng workflow | 3,167 |

## 5. Khả năng đa nền tảng

Viết 1 lần bằng format Claude Code → trình cài đặt tự chuyển đổi cho từng nền tảng.

| Nền tảng | Lệnh gọi | Đường dẫn config | Tool mapping |
|----------|----------|-----------------|-------------|
| Claude Code | `/pd:init` | `~/.claude/` | giữ nguyên |
| Codex CLI | `$pd-init` | `~/.codex/` | giữ nguyên |
| Gemini CLI | `/pd:init` | `~/.gemini/` | 9 tools |
| OpenCode | `/pd-init` | `~/.opencode/` | giữ nguyên |
| GitHub Copilot | `/pd:init` | `~/.github/` | 9 tools |

## 6. Luồng làm việc chính

```
/pd:init          Khởi tạo môi trường, phát hiện tech stack
    ↓
/pd:scan          Quét cấu trúc dự án, báo cáo bảo mật
    ↓
/pd:new-milestone Lập kế hoạch chiến lược + yêu cầu + lộ trình
    ↓
/pd:plan          Thiết kế kỹ thuật + chia danh sách công việc
    ↓
/pd:write-code    AI viết code theo kế hoạch (auto/parallel)
    ↓
/pd:test          Kiểm thử tự động (hoặc thủ công cho frontend)
    ↓
/pd:fix-bug       Sửa lỗi theo phương pháp khoa học
    ↓
/pd:complete-milestone  Đóng phiên bản, tạo git tag, báo cáo
```

Mỗi bước có cổng kiểm tra — AI không thể bỏ qua hoặc tự ý thay đổi thiết kế đã duyệt.

---
*Benchmark chạy tự động bởi `node test/benchmark.js` — 2026-03-20T20:11:46.887Z*
