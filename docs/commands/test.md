# Lệnh `pd test`

## Mục đích
Đảm bảo chất lượng và độ tin cậy của code đã viết. Chứng minh bằng số liệu và kết quả thực tế.

## Cách hoạt động
1. **Chạy Test Suite:** Thực thi các bộ test hiện có của dự án (Jest, Mocha, Flutter test, v.v.).
2. **Kiểm tra Regression:** Đảm bảo những thay đổi mới không làm hỏng các tính năng cũ.
3. **Viết Báo cáo (verification-report.md):** AI tạo một file báo cáo tóm tắt các test đã chạy, kết quả (Pass/Fail) và các "Truths" đã được kiểm chứng.

## Tại sao lệnh này quan trọng?
Trong PD, một Milestone chỉ được coi là hoàn thành khi đã có báo cáo kiểm thử. Đây là căn cứ để "chốt" code.

## Kết quả (Output)
- Kết quả chạy test trong console.
- File `.planning/milestones/[version]/phase-[phase]/verification-report.md`.
- Gợi ý lệnh tiếp theo (thường là `pd complete-milestone`).

## Mẹo sử dụng
- Nếu dự án của bạn có các lệnh test đặc thù, hãy khai báo trong `.planning/PROJECT.md` hoặc `rules/general.md` để AI biết cách chạy đúng.

---
**Bước tiếp theo:** [pd complete-milestone](complete-milestone.md)
