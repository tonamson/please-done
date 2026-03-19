# Security Hardening Reference

## Input Sanitization Quick Reference

| Data Type | Sanitize Function | Escape Function |
|---|---|---|
| Plain text | `sanitize_text_field()` | `esc_html()` |
| Textarea | `sanitize_textarea_field()` | `esc_textarea()` |
| Email | `sanitize_email()` | `esc_html()` |
| URL | `sanitize_url()` | `esc_url()` |
| Filename | `sanitize_file_name()` | `esc_html()` |
| HTML class | `sanitize_html_class()` | `esc_attr()` |
| Slug/key | `sanitize_key()` | `esc_attr()` |
| Integer | `absint()` / `intval()` | `esc_html()` |
| Float | `floatval()` | `esc_html()` |
| Rich HTML | `wp_kses_post()` | `wp_kses_post()` |
| Custom HTML | `wp_kses( $data, $allowed )` | `wp_kses()` |
| File path | `realpath()` + validate | `esc_html()` |
| SQL LIKE | `$wpdb->esc_like()` | — |
| HTML attribute | — | `esc_attr()` |
| JavaScript | — | `esc_js()` |

Golden rule: **Sanitize early, escape late.** Sanitize on input; escape at the point of output.

## Nonce Patterns

### Form Nonce
```php
// In form template:
wp_nonce_field( 'my_plugin_save_settings', 'my_plugin_nonce' );

// In handler:
if (
    ! isset( $_POST['my_plugin_nonce'] )
    || ! wp_verify_nonce(
        sanitize_text_field( wp_unslash( $_POST['my_plugin_nonce'] ) ),
        'my_plugin_save_settings'
    )
) {
    wp_die( esc_html__( 'Security check failed.', 'my-plugin' ) );
}
```

### URL Nonce
```php
// Create URL with nonce:
$url = wp_nonce_url(
    admin_url( 'admin.php?page=my-plugin&action=delete&id=' . $id ),
    'delete_item_' . $id,
    '_wpnonce'
);

// Verify:
if (
    ! isset( $_GET['_wpnonce'] )
    || ! wp_verify_nonce(
        sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ),
        'delete_item_' . absint( $_GET['id'] ?? 0 )
    )
) {
    wp_die( esc_html__( 'Invalid request.', 'my-plugin' ) );
}
```

### AJAX Nonce
```php
// JS side:
jQuery.post( ajaxurl, {
    action: 'my_action',
    nonce: myPluginData.nonce,
    data: 'value'
} );

// PHP side:
check_ajax_referer( 'my_plugin_nonce', 'nonce' );
```

## File Upload Security

```php
function my_plugin_handle_upload(): array|\WP_Error {
    if ( ! current_user_can( 'upload_files' ) ) {
        return new \WP_Error( 'no_permission', __( 'You cannot upload files.', 'my-plugin' ) );
    }

    check_admin_referer( 'my_plugin_upload', 'upload_nonce' );

    if ( empty( $_FILES['my_file'] ) ) {
        return new \WP_Error( 'no_file', __( 'No file uploaded.', 'my-plugin' ) );
    }

    $file = $_FILES['my_file'];

    // Validate file type.
    $allowed_types = [ 'image/jpeg', 'image/png', 'image/gif', 'application/pdf' ];
    $file_type     = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'] );

    if ( ! in_array( $file_type['type'], $allowed_types, true ) ) {
        return new \WP_Error( 'invalid_type', __( 'File type not allowed.', 'my-plugin' ) );
    }

    // Validate file size (5MB max).
    $max_size = 5 * 1024 * 1024;
    if ( $file['size'] > $max_size ) {
        return new \WP_Error( 'too_large', __( 'File exceeds size limit.', 'my-plugin' ) );
    }

    // Use WordPress upload handler.
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $attachment_id = media_handle_upload( 'my_file', 0 );

    if ( is_wp_error( $attachment_id ) ) {
        return $attachment_id;
    }

    return [
        'id'  => $attachment_id,
        'url' => wp_get_attachment_url( $attachment_id ),
    ];
}
```

## Rate Limiting

```php
function my_plugin_rate_limit( string $action, int $max_attempts = 5, int $window = 300 ): bool {
    $ip    = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) );
    $key   = 'my_plugin_rate_' . md5( $action . $ip );
    $count = (int) get_transient( $key );

    if ( $count >= $max_attempts ) {
        return false; // Rate limited.
    }

    set_transient( $key, $count + 1, $window );
    return true; // Allowed.
}

// Usage in AJAX handler:
add_action( 'wp_ajax_nopriv_my_form_submit', function (): void {
    if ( ! my_plugin_rate_limit( 'form_submit', 3, 60 ) ) {
        wp_send_json_error( [
            'message' => __( 'Too many attempts. Try again later.', 'my-plugin' ),
        ], 429 );
    }
    // Process form...
} );
```

## Content Security Policy Headers

```php
add_action( 'send_headers', function (): void {
    if ( is_admin() ) {
        return; // Don't apply to admin.
    }

    $csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'self'",
    ];

    header( 'Content-Security-Policy: ' . implode( '; ', $csp ) );
    header( 'X-Content-Type-Options: nosniff' );
    header( 'X-Frame-Options: SAMEORIGIN' );
    header( 'X-XSS-Protection: 1; mode=block' );
    header( 'Referrer-Policy: strict-origin-when-cross-origin' );
} );
```

## Database Query Security

```php
// CORRECT — Always use $wpdb->prepare():
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}my_table WHERE user_id = %d AND status = %s",
        $user_id,
        $status
    )
);

// CORRECT — LIKE queries:
$like = $wpdb->esc_like( $search_term ) . '%';
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}my_table WHERE title LIKE %s",
        $like
    )
);

// CORRECT — IN clause:
$ids = array_map( 'absint', $ids );
$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}my_table WHERE id IN ({$placeholders})",
        ...$ids
    )
);

// WRONG — Never do this:
// $wpdb->query( "DELETE FROM {$wpdb->prefix}my_table WHERE id = {$_GET['id']}" );
```

## Security Audit Checklist

Before releasing any WordPress plugin or theme:

- [ ] All `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `$_SERVER` values are sanitized
- [ ] All output is escaped with appropriate `esc_*()` functions
- [ ] All forms include nonce fields and handlers verify them
- [ ] All AJAX handlers use `check_ajax_referer()`
- [ ] All REST endpoints have `permission_callback` set
- [ ] All database queries use `$wpdb->prepare()`
- [ ] All file operations validate paths (no directory traversal)
- [ ] All file uploads validate type, size, and use `media_handle_upload()`
- [ ] All redirects use `wp_safe_redirect()` with `exit`
- [ ] `ABSPATH` check at top of every PHP file
- [ ] No `eval()`, `create_function()`, or `preg_replace()` with `e` modifier
- [ ] No `extract()` usage
- [ ] Error messages don't leak sensitive information
- [ ] Debug mode disabled in production
- [ ] `DISALLOW_FILE_EDIT` set to `true` in production wp-config.php
- [ ] Sensitive options stored with `wp_hash()` or encrypted
