# Hướng dẫn ưu tiên

> Dùng bởi: `/pd:new-milestone`, `/pd:plan`, `/pd:fix-bug`
> Mục đích: framework thống nhất để sắp xếp ưu tiên tính năng, phase, task, bug

## Mức ưu tiên

| Mức | Ý nghĩa | Ví dụ |
|-----|---------|-------|
| Quan trọng | Không có thì dự án không hoạt động | Xác thực, CRUD cốt lõi |
| Cao | Cần thiết cho trải nghiệm tối thiểu | Phân quyền, validation, UI chính |
| Trung bình | Cải thiện đáng kể nhưng có thể hoãn | Tìm kiếm nâng cao, báo cáo |
| Thấp | Nâng cao, có thì tốt | Dark mode, export PDF |

## Quy tắc sắp xếp

### Giữa milestones
1. Milestone MVP (v1.0) luôn trước
2. Tính năng nền tảng (auth, data model) trước tính năng phụ thuộc
3. Tính năng có rủi ro kỹ thuật cao → giải quyết sớm

### Giữa phases trong milestone
1. **Backend API trước Frontend** (khi frontend cần data từ API mới)
2. **Frontend-only tasks** (UI, SEO, layout) lên kế hoạch độc lập
3. **Core logic trước Validation/Edge cases**
4. **Xác thực/Bảo mật** luôn trong milestone đầu hoặc phase đầu
5. Dự án mới: phase đầu = thiết lập (khởi tạo, cấu hình, thư viện)

### Giữa tasks trong phase
1. Entity/Model → Service → Controller → DTO (Backend)
2. Module mới = task riêng
3. Task không phụ thuộc → có thể song song
4. Mỗi task: atomic, tối đa 5-7 files

## Phân loại rủi ro bug

| Loại | Ký hiệu | Ví dụ | Chiến lược kiểm thử | Chiến lược commit |
|------|---------|-------|---------------------|-------------------|
| Sửa nhanh | 🟢 | Lỗi chính tả, CSS, giá trị cấu hình sai | Lint + build đủ | Commit trực tiếp |
| Lỗi logic | 🟡 | Logic code sai, thiếu ngoại lệ, sai lệch 1 đơn vị | Unit + integration test bắt buộc | Commit + test cùng nhau |
| Lỗi dữ liệu | 🟠 | Dữ liệu hỏng, migration sai, DB lệch | Sao lưu trước, kiểm tra sau | Commit riêng cho migration |
| Nhạy cảm bảo mật | 🔴 | Vượt quyền, injection, lộ khóa bí mật | User đồng ý + rà soát | Commit riêng, không gộp |
| Hạ tầng/cấu hình | 🔵 | Biến môi trường, cấu hình deploy, dịch vụ bên thứ ba | Kiểm tra đúng môi trường | Tóm tắt thay đổi |

## Ma trận quyết định

Khi phân vân giữa 2 phương án:

| Tiêu chí | Trọng số |
|----------|---------|
| Ảnh hưởng người dùng | Cao |
| Rủi ro kỹ thuật | Cao |
| Nỗ lực triển khai | Trung bình |
| Khả năng mở rộng sau | Thấp |

Ưu tiên phương án: ít rủi ro + ảnh hưởng người dùng tích cực + đơn giản nhất có thể.
