# WordPress Rules (PHP)

> Contains project-specific conventions only. Standard WordPress knowledge → look up via Context7 (`resolve-library-id` → `query-docs`).

## Code style (differs from JS/TS)
- Indentation: **tabs**, NOT spaces
- Naming: `snake_case` functions/variables, `PascalCase` classes, `UPPER_CASE` constants
- Yoda Conditions: `if ( true === $value )` — literal on the left
- Spacing: space inside parentheses `if ( $condition )`
- Array: `[]` short syntax
- Prefix: ALL functions/classes/globals must have plugin slug prefix — unless using namespace
- Each PHP file: `defined( 'ABSPATH' )` at the top

## Security (WordPress-specific)
- **Sanitize**: `sanitize_text_field()`, `sanitize_email()`, `absint()`, `sanitize_url()`, `wp_kses()`, `wp_kses_post()`
- **Escape**: `esc_html()`, `esc_attr()`, `esc_url()`, `esc_js()` — NEVER echo without escaping
- **Nonce**: form `wp_nonce_field()`/`wp_verify_nonce()`, AJAX `check_ajax_referer()`
- **Capability**: `current_user_can()` BEFORE any privileged action
- **SQL**: `$wpdb->prepare()` for ALL dynamic queries — FORBIDDEN string concatenation
- **Unslash**: `wp_unslash()` BEFORE sanitize on `$_POST`/`$_GET`
- **File Upload**: `wp_check_filetype()` + whitelist MIME + `wp_handle_upload()` — FORBIDDEN `move_uploaded_file()`

## Database
- Table prefix: `$wpdb->prefix . 'plugin_table'` — FORBIDDEN hardcode
- Custom table: `dbDelta()` with exact format
- Schema versioning: `get_option()` to store version, compare on activate
- Check `is_wp_error()` on functions returning `WP_Error`

## Important conventions
- DO NOT `query_posts()` → use `WP_Query` or `pre_get_posts`
- `wp_reset_postdata()` after custom WP_Query loop
- REST API: `permission_callback` REQUIRED — FORBIDDEN `__return_true` for auth endpoints
- i18n: ALL display strings wrap `__()`, `_e()`, `esc_html__()` with unique text domain
- Assets: `wp_enqueue_style()`/`wp_enqueue_script()` — FORBIDDEN hardcode tags
- DO NOT `'posts_per_page' => -1` on frontend
- Performance: `get_transient()`/`set_transient()` cache expensive operations

## Build and lint
- Blocks: `npx wp-scripts build`
- PHP lint: `composer run lint`
- Detection: Glob `**/wp-config.php`
- Test: PHPUnit + `WP_UnitTestCase`
