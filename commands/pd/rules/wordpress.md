# Quy tắc WordPress (PHP)

> Chỉ chứa quy ước riêng. Kiến thức WordPress chuẩn → tra Context7 (`resolve-library-id` → `query-docs`).

## Phong cách code (khác JS/TS)
- Indentation: **tabs**, KHÔNG spaces
- Naming: `snake_case` functions/variables, `PascalCase` classes, `UPPER_CASE` constants
- Yoda Conditions: `if ( true === $value )` — literal bên trái
- Spacing: space trong ngoặc `if ( $condition )`
- Array: `[]` short syntax
- Prefix: TẤT CẢ function/class/global phải có prefix plugin slug — trừ khi dùng namespace
- Mỗi file PHP: `defined( 'ABSPATH' )` ở đầu

## Bảo mật (WordPress-specific)
- **Sanitize**: `sanitize_text_field()`, `sanitize_email()`, `absint()`, `sanitize_url()`, `wp_kses()`, `wp_kses_post()`
- **Escape**: `esc_html()`, `esc_attr()`, `esc_url()`, `esc_js()` — KHÔNG BAO GIỜ echo chưa escape
- **Nonce**: form `wp_nonce_field()`/`wp_verify_nonce()`, AJAX `check_ajax_referer()`
- **Capability**: `current_user_can()` TRƯỚC mọi thao tác đặc quyền
- **SQL**: `$wpdb->prepare()` cho MỌI dynamic query — CẤM nối chuỗi
- **Unslash**: `wp_unslash()` TRƯỚC sanitize trên `$_POST`/`$_GET`
- **File Upload**: `wp_check_filetype()` + whitelist MIME + `wp_handle_upload()` — CẤM `move_uploaded_file()`

## Database
- Prefix bảng: `$wpdb->prefix . 'plugin_table'` — CẤM hardcode
- Custom table: `dbDelta()` với format chính xác
- Schema versioning: `get_option()` lưu version, compare khi activate
- Kiểm tra `is_wp_error()` trên functions trả `WP_Error`

## Quy ước quan trọng
- KHÔNG `query_posts()` → dùng `WP_Query` hoặc `pre_get_posts`
- `wp_reset_postdata()` sau custom WP_Query loop
- REST API: `permission_callback` BẮT BUỘC — CẤM `__return_true` cho auth endpoints
- i18n: TẤT CẢ strings hiển thị wrap `__()`, `_e()`, `esc_html__()` với text domain unique
- Assets: `wp_enqueue_style()`/`wp_enqueue_script()` — CẤM hardcode tags
- KHÔNG `'posts_per_page' => -1` trên frontend
- Performance: `get_transient()`/`set_transient()` cache expensive operations

## Build và lint
- Blocks: `npx wp-scripts build`
- PHP lint: `composer run lint`
- Nhận diện: Glob `**/wp-config.php`
- Test: PHPUnit + `WP_UnitTestCase`
