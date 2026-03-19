# Quy tắc WordPress (PHP)

## Cấu trúc dự án
- Plugin: `my-plugin/my-plugin.php` (main file) + `includes/`, `admin/`, `public/`, `templates/`, `languages/`, `assets/`
- Theme: `my-theme/style.css` (header) + `functions.php`, `index.php`, `template-parts/`, `inc/`, `assets/`
- Block theme (FSE): thêm `theme.json`, `templates/`, `parts/`
- Mỗi file PHP BẮT BUỘC kiểm tra `defined( 'ABSPATH' )` ở đầu — ngăn truy cập trực tiếp

## Coding Style (WordPress PHP Coding Standards)
- Indentation: **tabs**, KHÔNG spaces
- Naming: `snake_case` cho functions/variables, `PascalCase` cho classes, `UPPER_CASE` cho constants
- Yoda Conditions: `if ( true === $value )` — literal/constant bên trái
- Spacing: space trong ngoặc `if ( $condition )`, space sau dấu phẩy
- Quotes: single quotes cho strings KHÔNG có interpolation, double quotes khi interpolate
- Array: dùng `[]` (short syntax), KHÔNG `array()`
- Type declarations: return type + parameter type cho tất cả functions/methods
- Prefix: TẤT CẢ function/class/global variable phải có prefix plugin/theme slug — tránh conflict. Ngoại lệ: nếu dùng PHP namespace (`namespace MyPlugin\Admin`) thì namespace thay thế cho prefix

## Bảo mật (BẮT BUỘC cho MỌI output)
- **Input Sanitization**: `sanitize_text_field()`, `sanitize_email()`, `absint()`, `sanitize_url()`, `wp_kses()`, `wp_kses_post()` — theo đúng data type
- **Output Escaping**: `esc_html()`, `esc_attr()`, `esc_url()`, `esc_js()` — KHÔNG BAO GIỜ echo data chưa escape
- **Nonce**: form dùng `wp_nonce_field()` / `wp_verify_nonce()`, AJAX dùng `check_ajax_referer()`
- **Capability**: `current_user_can()` TRƯỚC mọi thao tác đặc quyền
- **Prepared Statements**: `$wpdb->prepare()` cho MỌI dynamic query — CẤM nối chuỗi user input vào SQL
- **CSRF**: verify nonce trên TẤT CẢ request thay đổi state (POST, PUT, DELETE)
- **Unslash**: `wp_unslash()` TRƯỚC sanitize trên `$_POST`, `$_GET`, `$_REQUEST`
- **File Upload**: `wp_check_filetype()` + whitelist MIME types + giới hạn file size + `wp_handle_upload()` với `'test_form' => false` — CẤM dùng `move_uploaded_file()` trực tiếp

## Hooks & Filters
- KHÔNG BAO GIỜ sửa core files — extend qua actions và filters
- Đăng ký hooks trong method `define_hooks()` hoặc constructor
- Dùng `add_action()` / `add_filter()` — KHÔNG dùng `query_posts()` (dùng `WP_Query` hoặc `pre_get_posts`)
- Luôn gọi `wp_reset_postdata()` sau custom `WP_Query` loop

## Database
- Prefix bảng: `$wpdb->prefix . 'my_plugin_table'` — CẤM hardcode prefix
- Custom table: dùng `dbDelta()` với format chính xác (2 spaces sau PRIMARY KEY, KEY trên dòng riêng)
- Schema versioning: lưu version trong `get_option()`, so sánh khi activate để migrate
- CRUD: tạo Repository class với prepared statements cho mỗi bảng
- Kiểm tra `is_wp_error()` trên functions trả `WP_Error`

## REST API
- Đăng ký qua `register_rest_route()` trong hook `rest_api_init`
- `permission_callback` BẮT BUỘC — CẤM trả `__return_true` cho endpoints cần auth
- Validate + sanitize args trong schema (`validate_callback`, `sanitize_callback`)
- Response dùng `WP_REST_Response`

## Internationalization
- TẤT CẢ strings hiển thị cho user: wrap trong `__()`, `_e()`, `esc_html__()` với text domain unique
- Load textdomain: `load_plugin_textdomain()` trong hook `init`

## Performance
- **Transients**: `get_transient()` / `set_transient()` cache expensive operations
- **Object Cache**: `wp_cache_get()` / `wp_cache_set()` cho per-request cache
- **Tránh N+1**: `'update_post_meta_cache' => true`, `'update_post_term_cache' => true` (WP_Query / get_posts), batch-fetch meta
- **Pagination**: KHÔNG dùng `'posts_per_page' => -1` trên frontend
- **Conditional loading**: enqueue assets CHỈ trên pages cần

## Enqueue Assets
- CSS: `wp_enqueue_style()` — CẤM hardcode `<link>` tags
- JS: `wp_enqueue_script()` — CẤM hardcode `<script>` tags
- AJAX data: `wp_localize_script()` để truyền `ajaxUrl`, `nonce`
- Version: dùng plugin/theme version constant cho cache busting

## Build & Lint
- Gutenberg blocks: `npx wp-scripts build` (package `@wordpress/scripts`)
- PHP lint: `composer run lint` (WordPress Coding Standards — script `"lint": "phpcs"` trong composer.json)
- Detect thư mục: Glob `**/wp-config.php` → thư mục chứa = WordPress root
- Test: PHPUnit + `WP_UnitTestCase` (xem `.planning/docs/wordpress/testing.md`)

## Tham khảo chi tiết
Khi cần patterns phức tạp → đọc `.planning/docs/wordpress/`:
- `plugin-architecture.md` — Boilerplate plugin OOP, activation/deactivation, autoloading
- `theme-development.md` — Template hierarchy, child theme, Customizer, block theme
- `gutenberg-blocks.md` — block.json, dynamic blocks, InnerBlocks, @wordpress/scripts
- `woocommerce.md` — Hooks, payment gateway, HPOS, checkout customization
- `security-hardening.md` — CSP headers, rate limiting, file upload validation
- `database-migrations.md` — dbDelta(), schema versioning, transaction patterns
- `wp-cli.md` — Custom WP-CLI commands, batch processing
- `multisite.md` — Network plugins, site switching, shared tables
- `testing.md` — PHPUnit setup, WP_UnitTestCase, PHPCS configuration
