# WordPress Multisite Reference

## Network-Wide Plugin

```php
<?php
/**
 * Plugin Name:       My Network Plugin
 * Network:           true
 * ...
 */

// Check if multisite.
if ( ! is_multisite() ) {
    return;
}
```

## Site Switching

```php
// Process something across all sites.
function my_plugin_network_operation(): void {
    $sites = get_sites( [
        'number' => 0, // All sites.
        'fields' => 'ids',
    ] );

    foreach ( $sites as $site_id ) {
        switch_to_blog( $site_id );

        // Operations run against this site's tables.
        $posts = get_posts( [ 'numberposts' => 5 ] );
        // Process...

        restore_current_blog();
    }
}
```

Critical rule: Every `switch_to_blog()` must have a matching `restore_current_blog()`. Use try/finally to guarantee cleanup:

```php
switch_to_blog( $site_id );
try {
    // Work with the switched site.
} finally {
    restore_current_blog();
}
```

## Network Admin Pages

```php
add_action( 'network_admin_menu', function (): void {
    add_menu_page(
        __( 'My Network Settings', 'my-plugin' ),
        __( 'My Plugin', 'my-plugin' ),
        'manage_network_options',
        'my-network-settings',
        'my_plugin_network_page',
        'dashicons-admin-generic',
        99
    );
} );

function my_plugin_network_page(): void {
    if ( ! current_user_can( 'manage_network_options' ) ) {
        wp_die( esc_html__( 'Unauthorized.', 'my-plugin' ) );
    }

    // Handle form submission.
    if ( isset( $_POST['my_network_nonce'] ) ) {
        check_admin_referer( 'my_network_settings', 'my_network_nonce' );

        $value = sanitize_text_field( wp_unslash( $_POST['network_option'] ?? '' ) );
        update_site_option( 'my_plugin_network_option', $value );

        echo '<div class="notice notice-success"><p>' . esc_html__( 'Settings saved.', 'my-plugin' ) . '</p></div>';
    }

    $current = get_site_option( 'my_plugin_network_option', '' );
    ?>
    <div class="wrap">
        <h1><?php esc_html_e( 'My Network Settings', 'my-plugin' ); ?></h1>
        <form method="post">
            <?php wp_nonce_field( 'my_network_settings', 'my_network_nonce' ); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="network_option"><?php esc_html_e( 'Network Option', 'my-plugin' ); ?></label>
                    </th>
                    <td>
                        <input type="text" id="network_option" name="network_option" value="<?php echo esc_attr( $current ); ?>" class="regular-text" />
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
```

## Network Options vs Site Options

```php
// Network-wide option (stored in wp_sitemeta):
update_site_option( 'my_plugin_network_setting', $value );
$value = get_site_option( 'my_plugin_network_setting', $default );

// Per-site option (stored in each site's wp_options):
update_option( 'my_plugin_site_setting', $value );
$value = get_option( 'my_plugin_site_setting', $default );
```

## Multisite Activation

```php
register_activation_hook( __FILE__, function ( bool $network_wide ): void {
    if ( is_multisite() && $network_wide ) {
        $sites = get_sites( [ 'number' => 0, 'fields' => 'ids' ] );
        foreach ( $sites as $site_id ) {
            switch_to_blog( $site_id );
            my_plugin_activate_single_site();
            restore_current_blog();
        }
    } else {
        my_plugin_activate_single_site();
    }
} );

// Activate for new sites added after plugin activation.
add_action( 'wp_initialize_site', function ( \WP_Site $site ): void {
    if ( ! is_plugin_active_for_network( MY_PLUGIN_BASENAME ) ) {
        return;
    }
    switch_to_blog( $site->blog_id );
    my_plugin_activate_single_site();
    restore_current_blog();
} );

function my_plugin_activate_single_site(): void {
    // Create tables, set defaults, etc.
}
```

## Multisite-Specific Hooks

```php
// When a new site is created.
add_action( 'wp_initialize_site', function ( \WP_Site $site ): void {
    // Setup for the new site.
}, 10, 1 );

// When a site is deleted.
add_action( 'wp_uninitialize_site', function ( \WP_Site $site ): void {
    // Cleanup for the deleted site.
}, 10, 1 );

// Network-level user creation.
add_action( 'wpmu_new_user', function ( int $user_id ): void {
    // Handle new network user.
} );

// User added to a site.
add_action( 'add_user_to_blog', function ( int $user_id, string $role, int $blog_id ): void {
    // Handle user added to specific site.
}, 10, 3 );
```

## Shared Tables Pattern

When you need data shared across all sites, use the base prefix (not the site-specific prefix):

```php
function my_plugin_get_shared_table(): string {
    global $wpdb;
    // $wpdb->base_prefix = 'wp_' (shared across all sites).
    // $wpdb->prefix      = 'wp_2_' (site-specific for site 2).
    return $wpdb->base_prefix . 'my_plugin_shared_data';
}
```
