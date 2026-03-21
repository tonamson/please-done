# Hướng dẫn Bump Version

Tài liệu này chuẩn hóa cách tăng version cho toàn bộ repo `please-done`.

Mục tiêu:
- Không để lệch version giữa các file
- Phân biệt rõ `patch` và `upgrade`
- Có checklist cố định trước khi release

## Chuẩn version

Repo này dùng Semantic Versioning:

- `MAJOR.MINOR.PATCH`
- Ví dụ: `2.7.1`

Ý nghĩa:
- `PATCH`: sửa lỗi, chỉnh wording, fix converter/installer, bổ sung nhỏ không phá hành vi cũ
- `MINOR`: thêm tính năng mới, thêm skill, thêm stack support, thêm workflow, thêm eval mới nhưng không phá tương thích
- `MAJOR`: thay đổi breaking change, đổi command syntax, đổi cấu trúc cài đặt, đổi format output khiến bản cũ không còn tương thích

## Khi nào bump patch

Tăng `PATCH` khi thay đổi thuộc một trong các nhóm sau:

- Sửa bug trong installer, converter, utils
- Sửa tài liệu, README, changelog, wording
- Fix detection logic nhưng không đổi public contract
- Bổ sung warning, validation, guard rails
- Thêm rule nhỏ hoặc chỉnh prompt để ổn định hơn
- Sửa lệch metadata, packaging, version sync

Ví dụ:
- `2.7.1` -> `2.7.2`

## Khi nào bump upgrade

Trong repo này, "bump upgrade" nên hiểu là tăng chuẩn ở mức `MINOR` hoặc `MAJOR`.

### Upgrade Minor

Tăng `MINOR` khi:

- Thêm skill mới
- Thêm runtime/platform support
- Thêm stack support mới như Flutter, Solidity, WordPress
- Thêm workflow, templates, references đáng kể
- Thêm eval suite hoặc capability mới mà vẫn tương thích ngược

Ví dụ:
- `2.7.1` -> `2.8.0`

### Upgrade Major

Tăng `MAJOR` khi:

- Đổi tên command làm user cũ phải sửa thói quen dùng
- Đổi format output, cấu trúc file cài đặt, hoặc config format
- Xóa/bỏ runtime support
- Thay đổi workflow theo cách các repo đang dùng sẽ bị ảnh hưởng

Ví dụ:
- `2.7.1` -> `3.0.0`

## Các file bắt buộc phải đồng bộ version

Mỗi lần bump version, kiểm tra tối thiểu các file sau:

1. `VERSION`
2. `package.json`
3. `package-lock.json`
4. `README.md`
5. `CHANGELOG.md`

## Cách bump patch

Ví dụ bump từ `2.7.1` lên `2.7.2`.

### Bước 1: cập nhật version nguồn

Sửa file:

- `VERSION` -> `2.7.2`
- `package.json` -> `"version": "2.7.2"`

### Bước 2: đồng bộ lockfile

Chạy:

```bash
npm install --package-lock-only
```

Mục tiêu:
- cập nhật `package-lock.json`
- tránh lệch giữa `package.json` và `package-lock.json`

### Bước 3: cập nhật README

Tìm và sửa các chỗ có version hiển thị:

- badge version
- dòng `Phiên bản hiện tại`

### Bước 4: ghi changelog

Thêm entry mới lên đầu `CHANGELOG.md` theo format đang dùng:

```md
## [2.7.2] - DD_MM_YYYY
### Sửa lỗi
- Mô tả thay đổi
```

Nếu là patch docs hoặc metadata thì ghi đúng bản chất, không thổi phồng thành feature.

### Bước 5: kiểm tra lại

Checklist:

- `VERSION` đúng
- `package.json` đúng
- `package-lock.json` đúng
- `README.md` không còn version cũ ở phần public
- `CHANGELOG.md` có entry mới

## Cách bump upgrade minor

Ví dụ bump từ `2.7.1` lên `2.8.0`.

Làm tương tự patch, nhưng changelog nên chia rõ:

- `### Thêm mới`
- `### Thay đổi`
- `### Sửa lỗi`

Checklist bổ sung:

- README đã mô tả feature mới
- danh sách skills/platforms/stacks đã cập nhật
- các tài liệu integration liên quan đã sync

## Cách bump upgrade major

Ví dụ bump từ `2.7.1` lên `3.0.0`.

Ngoài các bước ở trên, bắt buộc thêm:

- section `### Breaking changes` trong changelog
- hướng dẫn migration trong `README.md` hoặc tài liệu riêng
- nêu rõ user cần làm gì sau khi update

Nên có thêm:

- ví dụ before/after command
- mapping tên cũ -> tên mới
- cảnh báo cho local configs cũ

## Quy tắc ghi changelog

Ưu tiên ghi theo tác động thực tế:

- file nào đổi
- đổi vì sao
- user được lợi gì
- có breaking hay không

Không nên ghi quá mơ hồ kiểu:

- "Cải thiện hệ thống"
- "Tối ưu hóa"
- "Fix nhiều lỗi nhỏ"

## Quy trình release tối thiểu

Trước khi publish:

1. Chốt loại bump: `patch`, `minor`, hoặc `major`
2. Đồng bộ toàn bộ file version
3. Cập nhật `CHANGELOG.md`
4. Kiểm tra `README.md` còn version cũ hay không
5. Chạy kiểm tra tối thiểu:

```bash
npm test
```

Nếu có quy trình eval thì nên chạy thêm:

```bash
npm run eval
```

6. Tạo git tag:

```bash
git tag v2.8.0
```

7. Push tag lên remote (nếu sẵn sàng release):

```bash
git push origin v2.8.0
```

## Checklist copy nhanh

```md
- [ ] Xác định đúng loại bump
- [ ] Sửa VERSION
- [ ] Sửa package.json
- [ ] Regenerate package-lock.json
- [ ] Sửa README badge + current version
- [ ] Thêm entry mới vào CHANGELOG.md
- [ ] Kiểm tra không còn version cũ ở các file public
- [ ] Chạy test tối thiểu
- [ ] Chạy eval nếu có
- [ ] Tạo git tag: `git tag v[version]`
- [ ] Push tag: `git push origin v[version]` (khi sẵn sàng release)
```

## Gợi ý chuẩn hóa thêm

Để nâng chuẩn version toàn repo, nên áp dụng thêm:

- Chỉ release khi `VERSION`, `package.json`, `package-lock.json` cùng khớp
- Thêm CI check fail nếu version bị lệch
- Có script tự động kiểm tra các file version trước khi publish
- Quy định rõ: docs-only fix thì bump `patch`, feature mới thì bump `minor`, breaking change thì bump `major`

## Kết luận

Nếu thay đổi nhỏ, sửa lỗi, chỉnh tài liệu: bump `PATCH`.

Nếu thêm capability mới nhưng không phá tương thích: bump `MINOR`.

Nếu có breaking change: bump `MAJOR`.

Nguyên tắc quan trọng nhất là:

- tăng đúng cấp version
- đồng bộ tất cả file public
- ghi changelog rõ ràng
- tạo git tag đánh dấu mốc release
