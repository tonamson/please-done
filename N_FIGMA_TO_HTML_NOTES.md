# Ghi chú triển khai sau: Figma to HTML

> Mục đích: note lại các vấn đề cần chuẩn hóa trước khi xây workflow/skill cắt HTML từ Figma
> Ngày: 22_03_2026

## Vấn đề hiện tại

AI cắt HTML từ Figma hay gặp các lỗi:

- responsive sai hoặc không đủ breakpoint
- thiếu page / thiếu section / thiếu state
- HTML lệch bản thiết kế Figma
- spacing, font, màu, radius, shadow không khớp
- asset xuất ra nặng, chưa tối ưu cho web
- tên file/page từ Figma không ổn định giữa các môi trường deploy
- lỗi khác nhau giữa Linux / Ubuntu / Windows do khác biệt path và phân biệt hoa thường

## Mục tiêu cần đạt

Quy trình cắt từ Figma phải:

- bám sát thiết kế
- đủ page, đủ section, đủ state
- có responsive rõ ràng
- tên file/folder/assets ổn định, cross-platform
- ảnh xuất tối ưu cho web
- dễ kiểm tra lại bằng checklist

## Rule chuẩn hóa bắt buộc

### 1. Chuẩn hóa tên file

Tất cả tên page, section, component, asset khi xuất ra code phải dùng:

- `kebab-case`
- lowercase
- ASCII only
- không dấu cách
- không ký tự đặc biệt

Ví dụ:

- `Home Page` -> `home-page`
- `About Us` -> `about-us`
- `Hero Banner` -> `hero-banner`

Tên file tương ứng:

- `home-page.html`
- `about-us.html`
- `hero-banner.webp`

## 2. Quy tắc cross-platform

Để tránh lỗi giữa macOS / Linux / Ubuntu / Windows:

- không dùng tên file chỉ khác nhau ở chữ hoa/chữ thường
- không dùng khoảng trắng trong tên file
- không dùng dấu tiếng Việt trong path
- import path phải khớp tuyệt đối với tên file thật
- mọi thư mục assets/pages/components đều theo `kebab-case`

## 3. Quy tắc export assets

Ưu tiên định dạng:

- `svg` cho icon, logo, vector, shape
- `webp` cho ảnh raster dùng trên web
- chỉ dùng `png/jpg` khi thật sự cần fallback

Quy tắc asset:

- tên file asset theo `kebab-case`
- có hậu tố ngữ nghĩa rõ ràng
- không export ảnh to quá mức cần thiết
- cần tối ưu dung lượng trước khi đưa vào code

Ví dụ:

- `home-page-hero.webp`
- `pricing-card-background.webp`
- `site-logo.svg`

## 4. Không được cắt HTML trực tiếp từ frame thô

Trước khi code phải có bước normalize design spec:

- tên page
- route hoặc file output
- loại màn hình: page / modal / drawer / popup / section
- breakpoint áp dụng
- typography chính
- spacing system
- color tokens
- danh sách states
- danh sách assets cần export

Nếu thiếu bước này thì AI rất dễ cắt lệch.

## 5. Bắt buộc map frame sang page / section / state

Mỗi frame Figma cần được phân loại rõ:

- `page`
- `section`
- `modal`
- `drawer`
- `empty`
- `loading`
- `error`
- `success`

Không được để AI tự đoán mơ hồ.

## 6. Responsive phải có spec rõ

Không nên cắt HTML nếu chưa xác định:

- mobile breakpoint
- tablet breakpoint
- desktop breakpoint
- section nào stack
- section nào ẩn/hiện theo breakpoint
- ảnh nào đổi kích thước theo breakpoint
- typography scale theo breakpoint

Nếu Figma không ghi rõ responsive:

- phải tạo `responsive decision note`
- không được âm thầm tự quyết mà không ghi lại

## 7. Cắt theo component rồi ghép page

Không nên cắt nguyên page thành một khối lớn.

Nên làm theo thứ tự:

1. phân tích page structure
2. tách component dùng lại
3. định nghĩa section
4. ghép page hoàn chỉnh
5. kiểm tra responsive

## 8. Checklist sau khi cắt HTML

Sau khi hoàn thành mỗi page cần đối chiếu lại với Figma:

- đủ page chưa
- đủ section chưa
- đủ state chưa
- layout đúng chưa
- spacing đúng chưa
- typography đúng chưa
- màu sắc đúng chưa
- radius / border / shadow đúng chưa
- ảnh đúng chưa
- mobile đúng chưa
- tablet đúng chưa
- desktop đúng chưa

## 9. Manifest đầu ra nên có

Khi triển khai sau này nên có manifest hoặc spec file ghi rõ:

- page name gốc từ Figma
- slug chuẩn hóa
- file output
- route
- assets liên quan
- states liên quan
- breakpoint áp dụng

Ví dụ:

```md
- Figma: Home Page
- Slug: home-page
- Output: home-page.html
- Route: /
- Assets:
  - home-page-hero.webp
  - site-logo.svg
- States:
  - default
  - loading
  - error
```

## 10. Đề xuất workflow tương lai

Sau này nếu làm skill/workflow riêng, nên chia các bước:

1. nhập danh sách frames/pages từ Figma
2. normalize tên + slug + file names
3. xác định page/section/state
4. xác định responsive behavior
5. export assets theo rule `svg/webp`
6. cắt component
7. ghép HTML page
8. chạy checklist đối chiếu Figma
9. xác minh cross-platform path/name

## 11. Rule ngắn gọn có thể dùng lại

```md
- Tên page/frame từ Figma phải normalize sang kebab-case.
- Ví dụ: "Home Page" -> `home-page`
- File output: `home-page.html`
- Asset raster ưu tiên `webp`
- Asset vector ưu tiên `svg`
- Không dùng space / uppercase / ký tự đặc biệt trong file path
- Không bắt đầu cắt HTML nếu chưa có responsive spec
- Mỗi frame phải map rõ sang page / section / state
- Bắt buộc checklist đối chiếu lại với Figma sau khi cắt xong
```

## 12. Việc nên làm tiếp sau này

- tạo workflow hoặc skill riêng cho `figma-to-html`
- tạo template manifest/spec cho page export
- thêm checklist responsive chuẩn
- thêm rule optimize asset webp
- thêm bước visual QA so với thiết kế Figma
