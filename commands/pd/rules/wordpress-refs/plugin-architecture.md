# Plugin Architecture Reference

## Full Plugin Boilerplate

### Main Plugin File

```php
<?php
/**
 * Plugin Name:       My Plugin
 * Plugin URI:        https://example.com/my-plugin
 * Description:       A comprehensive plugin description.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Author Name
 * Author URI:        https://example.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-plugin
 * Domain Path:       /languages
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Plugin constants.
define( 'MY_PLUGIN_VERSION', '1.0.0' );
define( 'MY_PLUGIN_FILE', __FILE__ );
define( 'MY_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
define( 'MY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'MY_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Autoloader.
spl_autoload_register( function ( string $class ): void {
    $prefix    = 'MyPlugin\\';
    $base_dir  = MY_PLUGIN_PATH . 'includes/';

    $len = strlen( $prefix );
    if ( 0 !== strncmp( $prefix, $class, $len ) ) {
        return;
    }

    $relative_class = substr( $class, $len );
    $file           = $base_dir . 'class-' . strtolower(
        str_replace( [ '\\', '_' ], [ '/', '-' ], $relative_class )
    ) . '.php';

    if ( file_exists( $file ) ) {
        require $file;
    }
} );

// Activation / Deactivation.
register_activation_hook( __FILE__, [ 'MyPlugin\\Activator', 'activate' ] );
register_deactivation_hook( __FILE__, [ 'MyPlugin\\Activator', 'deactivate' ] );

// Boot the plugin.
add_action( 'plugins_loaded', function (): void {
    MyPlugin\Plugin::get_instance();
} );
```

### Activator Class

```php
<?php
declare(strict_types=1);

namespace MyPlugin;

class Activator {

    public static function activate(): void {
        // Check minimum requirements.
        if ( version_compare( PHP_VERSION, '8.0', '<' ) ) {
            deactivate_plugins( MY_PLUGIN_BASENAME );
            wp_die(
                esc_html__( 'This plugin requires PHP 8.0 or higher.', 'my-plugin' ),
                'Plugin Activation Error',
                [ 'back_link' => true ]
            );
        }

        // Create custom tables.
        self::create_tables();

        // Set default options.
        self::set_defaults();

        // Schedule cron events.
        if ( ! wp_next_scheduled( 'my_plugin_daily_cleanup' ) ) {
            wp_schedule_event( time(), 'daily', 'my_plugin_daily_cleanup' );
        }

        // Flush rewrite rules (after CPT registration).
        flush_rewrite_rules();

        // Store the plugin version.
        update_option( 'my_plugin_version', MY_PLUGIN_VERSION );
    }

    public static function deactivate(): void {
        // Clear scheduled hooks.
        wp_clear_scheduled_hook( 'my_plugin_daily_cleanup' );

        // Flush rewrite rules.
        flush_rewrite_rules();
    }

    private static function create_tables(): void {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table_name      = $wpdb->prefix . 'my_plugin_items';

        $sql = "CREATE TABLE {$table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            title varchar(255) NOT NULL DEFAULT '',
            content longtext NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY status (status)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }

    private static function set_defaults(): void {
        $defaults = [
            'my_plugin_settings' => [
                'enabled'        => true,
                'items_per_page' => 10,
                'cache_duration' => 3600,
            ],
        ];

        foreach ( $defaults as $key => $value ) {
            if ( false === get_option( $key ) ) {
                add_option( $key, $value );
            }
        }
    }
}
```

### Uninstall File

```php
<?php
// uninstall.php — Runs when plugin is deleted from WP admin.

declare(strict_types=1);

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

global $wpdb;

// Delete options.
delete_option( 'my_plugin_version' );
delete_option( 'my_plugin_settings' );

// Delete transients.
$wpdb->query(
    "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_my_plugin_%'"
);
$wpdb->query(
    "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_my_plugin_%'"
);

// Drop custom tables.
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}my_plugin_items" );

// Delete post meta.
$wpdb->query(
    "DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE '_my_plugin_%'"
);

// Delete user meta.
$wpdb->query(
    "DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE '_my_plugin_%'"
);
```

## Settings API Pattern

```php
<?php
declare(strict_types=1);

namespace MyPlugin;

class Admin {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_menu_page' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
    }

    public function add_menu_page(): void {
        add_options_page(
            __( 'My Plugin Settings', 'my-plugin' ),
            __( 'My Plugin', 'my-plugin' ),
            'manage_options',
            'my-plugin-settings',
            [ $this, 'render_settings_page' ]
        );
    }

    public function register_settings(): void {
        register_setting(
            'my_plugin_settings_group',
            'my_plugin_settings',
            [
                'type'              => 'array',
                'sanitize_callback' => [ $this, 'sanitize_settings' ],
                'default'           => [
                    'enabled'        => true,
                    'items_per_page' => 10,
                ],
            ]
        );

        add_settings_section(
            'my_plugin_general',
            __( 'General Settings', 'my-plugin' ),
            function (): void {
                echo '<p>' . esc_html__( 'Configure plugin behavior.', 'my-plugin' ) . '</p>';
            },
            'my-plugin-settings'
        );

        add_settings_field(
            'my_plugin_enabled',
            __( 'Enable Plugin', 'my-plugin' ),
            [ $this, 'render_checkbox_field' ],
            'my-plugin-settings',
            'my_plugin_general',
            [ 'label_for' => 'my_plugin_enabled', 'field' => 'enabled' ]
        );

        add_settings_field(
            'my_plugin_items_per_page',
            __( 'Items Per Page', 'my-plugin' ),
            [ $this, 'render_number_field' ],
            'my-plugin-settings',
            'my_plugin_general',
            [ 'label_for' => 'my_plugin_items_per_page', 'field' => 'items_per_page' ]
        );
    }

    public function sanitize_settings( array $input ): array {
        $sanitized = [];

        $sanitized['enabled']        = ! empty( $input['enabled'] );
        $sanitized['items_per_page'] = absint( $input['items_per_page'] ?? 10 );

        if ( $sanitized['items_per_page'] < 1 || $sanitized['items_per_page'] > 100 ) {
            add_settings_error(
                'my_plugin_settings',
                'invalid_items_per_page',
                __( 'Items per page must be between 1 and 100.', 'my-plugin' )
            );
            $sanitized['items_per_page'] = 10;
        }

        return $sanitized;
    }

    public function render_checkbox_field( array $args ): void {
        $options = get_option( 'my_plugin_settings', [] );
        $checked = ! empty( $options[ $args['field'] ] );
        ?>
        <input
            type="checkbox"
            id="<?php echo esc_attr( $args['label_for'] ); ?>"
            name="my_plugin_settings[<?php echo esc_attr( $args['field'] ); ?>]"
            value="1"
            <?php checked( $checked ); ?>
        />
        <?php
    }

    public function render_number_field( array $args ): void {
        $options = get_option( 'my_plugin_settings', [] );
        $value   = $options[ $args['field'] ] ?? '';
        ?>
        <input
            type="number"
            id="<?php echo esc_attr( $args['label_for'] ); ?>"
            name="my_plugin_settings[<?php echo esc_attr( $args['field'] ); ?>]"
            value="<?php echo esc_attr( (string) $value ); ?>"
            min="1"
            max="100"
            class="small-text"
        />
        <?php
    }

    public function render_settings_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields( 'my_plugin_settings_group' );
                do_settings_sections( 'my-plugin-settings' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}
```

## Upgrade Routine Pattern

```php
public static function maybe_upgrade(): void {
    $installed_version = get_option( 'my_plugin_version', '0.0.0' );

    if ( version_compare( $installed_version, MY_PLUGIN_VERSION, '>=' ) ) {
        return;
    }

    if ( version_compare( $installed_version, '1.1.0', '<' ) ) {
        self::upgrade_to_1_1_0();
    }

    if ( version_compare( $installed_version, '1.2.0', '<' ) ) {
        self::upgrade_to_1_2_0();
    }

    update_option( 'my_plugin_version', MY_PLUGIN_VERSION );
}

private static function upgrade_to_1_1_0(): void {
    global $wpdb;
    $table = $wpdb->prefix . 'my_plugin_items';

    $column_exists = $wpdb->get_results(
        $wpdb->prepare(
            "SHOW COLUMNS FROM {$table} LIKE %s",
            'priority'
        )
    );

    if ( empty( $column_exists ) ) {
        $wpdb->query(
            "ALTER TABLE {$table} ADD COLUMN priority int(11) NOT NULL DEFAULT 0 AFTER status"
        );
    }
}
```

## Custom WP_List_Table Pattern

```php
<?php
declare(strict_types=1);

namespace MyPlugin;

if ( ! class_exists( 'WP_List_Table' ) ) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class Items_List_Table extends \WP_List_Table {

    public function __construct() {
        parent::__construct( [
            'singular' => __( 'Item', 'my-plugin' ),
            'plural'   => __( 'Items', 'my-plugin' ),
            'ajax'     => false,
        ] );
    }

    public function get_columns(): array {
        return [
            'cb'         => '<input type="checkbox" />',
            'title'      => __( 'Title', 'my-plugin' ),
            'status'     => __( 'Status', 'my-plugin' ),
            'created_at' => __( 'Date', 'my-plugin' ),
        ];
    }

    public function get_sortable_columns(): array {
        return [
            'title'      => [ 'title', false ],
            'created_at' => [ 'created_at', true ],
        ];
    }

    public function prepare_items(): void {
        $per_page     = 20;
        $current_page = $this->get_pagenum();

        $this->_column_headers = [
            $this->get_columns(),
            [], // Hidden columns.
            $this->get_sortable_columns(),
        ];

        global $wpdb;
        $table = $wpdb->prefix . 'my_plugin_items';

        $orderby = sanitize_sql_orderby( $_GET['orderby'] ?? 'created_at' ) ?: 'created_at';
        $order   = ( 'asc' === strtolower( $_GET['order'] ?? 'desc' ) ) ? 'ASC' : 'DESC';

        $total_items = (int) $wpdb->get_var( "SELECT COUNT(id) FROM {$table}" );

        $this->items = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} ORDER BY {$orderby} {$order} LIMIT %d OFFSET %d",
                $per_page,
                ( $current_page - 1 ) * $per_page
            ),
            ARRAY_A
        );

        $this->set_pagination_args( [
            'total_items' => $total_items,
            'per_page'    => $per_page,
        ] );
    }

    protected function column_default( $item, $column_name ): string {
        return esc_html( (string) ( $item[ $column_name ] ?? '' ) );
    }

    protected function column_cb( $item ): string {
        return sprintf(
            '<input type="checkbox" name="item_ids[]" value="%d" />',
            absint( $item['id'] )
        );
    }

    protected function column_title( $item ): string {
        $edit_url = add_query_arg( [
            'page'   => 'my-plugin-edit',
            'id'     => absint( $item['id'] ),
        ], admin_url( 'admin.php' ) );

        $actions = [
            'edit'   => sprintf(
                '<a href="%s">%s</a>',
                esc_url( $edit_url ),
                esc_html__( 'Edit', 'my-plugin' )
            ),
            'delete' => sprintf(
                '<a href="%s" onclick="return confirm(\'%s\');">%s</a>',
                esc_url( wp_nonce_url(
                    add_query_arg( [
                        'action' => 'delete',
                        'id'     => absint( $item['id'] ),
                    ] ),
                    'delete_item_' . $item['id']
                ) ),
                esc_js( __( 'Are you sure?', 'my-plugin' ) ),
                esc_html__( 'Delete', 'my-plugin' )
            ),
        ];

        return sprintf(
            '<strong><a href="%s">%s</a></strong>%s',
            esc_url( $edit_url ),
            esc_html( $item['title'] ),
            $this->row_actions( $actions )
        );
    }

    public function get_bulk_actions(): array {
        return [
            'delete' => __( 'Delete', 'my-plugin' ),
        ];
    }
}
```
