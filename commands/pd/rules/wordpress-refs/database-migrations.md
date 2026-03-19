# Database Migrations Reference

## Creating Custom Tables with dbDelta()

```php
function my_plugin_create_tables(): void {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    // Table 1: Items.
    $table_items = $wpdb->prefix . 'my_plugin_items';
    $sql_items   = "CREATE TABLE {$table_items} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        user_id bigint(20) unsigned NOT NULL DEFAULT 0,
        title varchar(255) NOT NULL DEFAULT '',
        content longtext NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft',
        priority int(11) NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY status (status),
        KEY priority (priority)
    ) {$charset_collate};";

    // Table 2: Item meta (EAV pattern).
    $table_meta = $wpdb->prefix . 'my_plugin_itemmeta';
    $sql_meta   = "CREATE TABLE {$table_meta} (
        meta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        item_id bigint(20) unsigned NOT NULL DEFAULT 0,
        meta_key varchar(255) DEFAULT NULL,
        meta_value longtext,
        PRIMARY KEY  (meta_id),
        KEY item_id (item_id),
        KEY meta_key (meta_key(191))
    ) {$charset_collate};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql_items );
    dbDelta( $sql_meta );
}
```

### dbDelta() Formatting Rules (CRITICAL)

`dbDelta()` is extremely picky about SQL formatting. Follow these rules exactly:

1. **Two spaces** between `PRIMARY KEY` and the column definition: `PRIMARY KEY  (id)`
2. **Key definitions** must use the word `KEY`, not `INDEX`
3. Each field on its own line
4. No trailing commas after the last field/key
5. Column types must match MySQL standards exactly
6. Use `$wpdb->get_charset_collate()` for table charset

## Schema Versioning Pattern

```php
class DB_Migrator {
    private const DB_VERSION = '1.3.0';
    private const OPTION_KEY = 'my_plugin_db_version';

    public static function check(): void {
        $installed = get_option( self::OPTION_KEY, '0.0.0' );

        if ( version_compare( $installed, self::DB_VERSION, '>=' ) ) {
            return;
        }

        // Run migrations in order.
        $migrations = [
            '1.0.0' => [ self::class, 'migrate_1_0_0' ],
            '1.1.0' => [ self::class, 'migrate_1_1_0' ],
            '1.2.0' => [ self::class, 'migrate_1_2_0' ],
            '1.3.0' => [ self::class, 'migrate_1_3_0' ],
        ];

        foreach ( $migrations as $version => $callback ) {
            if ( version_compare( $installed, $version, '<' ) ) {
                call_user_func( $callback );
            }
        }

        update_option( self::OPTION_KEY, self::DB_VERSION );
    }

    private static function migrate_1_0_0(): void {
        // Initial table creation.
        my_plugin_create_tables();
    }

    private static function migrate_1_1_0(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'my_plugin_items';

        // Add column if not exists.
        $col = $wpdb->get_results( "SHOW COLUMNS FROM {$table} LIKE 'priority'" );
        if ( empty( $col ) ) {
            $wpdb->query(
                "ALTER TABLE {$table} ADD COLUMN priority int(11) NOT NULL DEFAULT 0 AFTER status"
            );
            $wpdb->query(
                "ALTER TABLE {$table} ADD KEY priority (priority)"
            );
        }
    }

    private static function migrate_1_2_0(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'my_plugin_items';

        // Change column type.
        $wpdb->query(
            "ALTER TABLE {$table} MODIFY COLUMN status varchar(30) NOT NULL DEFAULT 'draft'"
        );
    }

    private static function migrate_1_3_0(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'my_plugin_items';

        // Add composite index.
        $indexes = $wpdb->get_results( "SHOW INDEX FROM {$table} WHERE Key_name = 'user_status'" );
        if ( empty( $indexes ) ) {
            $wpdb->query(
                "ALTER TABLE {$table} ADD KEY user_status (user_id, status)"
            );
        }
    }
}

// Run on admin_init (lightweight check).
add_action( 'admin_init', [ DB_Migrator::class, 'check' ] );
```

## Transaction Pattern

```php
function my_plugin_transfer_item( int $item_id, int $from_user, int $to_user ): bool {
    global $wpdb;

    $table = $wpdb->prefix . 'my_plugin_items';

    $wpdb->query( 'START TRANSACTION' );

    try {
        // Verify ownership.
        $item = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE id = %d AND user_id = %d FOR UPDATE",
                $item_id,
                $from_user
            )
        );

        if ( ! $item ) {
            $wpdb->query( 'ROLLBACK' );
            return false;
        }

        // Transfer.
        $updated = $wpdb->update(
            $table,
            [ 'user_id' => $to_user ],
            [ 'id' => $item_id, 'user_id' => $from_user ],
            [ '%d' ],
            [ '%d', '%d' ]
        );

        if ( false === $updated ) {
            $wpdb->query( 'ROLLBACK' );
            return false;
        }

        // Log the transfer.
        $log_table = $wpdb->prefix . 'my_plugin_logs';
        $wpdb->insert(
            $log_table,
            [
                'item_id'   => $item_id,
                'from_user' => $from_user,
                'to_user'   => $to_user,
                'action'    => 'transfer',
            ],
            [ '%d', '%d', '%d', '%s' ]
        );

        $wpdb->query( 'COMMIT' );
        return true;

    } catch ( \Exception $e ) {
        $wpdb->query( 'ROLLBACK' );
        error_log( 'Transfer failed: ' . $e->getMessage() );
        return false;
    }
}
```

## CRUD Helper Class

```php
<?php
declare(strict_types=1);

namespace MyPlugin;

class Item_Repository {
    private string $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'my_plugin_items';
    }

    public function find( int $id ): ?array {
        global $wpdb;
        $row = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id ),
            ARRAY_A
        );
        return $row ?: null;
    }

    public function find_by_user( int $user_id, int $per_page = 10, int $page = 1 ): array {
        global $wpdb;
        $offset = ( $page - 1 ) * $per_page;

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE user_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d",
                $user_id,
                $per_page,
                $offset
            ),
            ARRAY_A
        ) ?: [];
    }

    public function count_by_user( int $user_id ): int {
        global $wpdb;
        return (int) $wpdb->get_var(
            $wpdb->prepare( "SELECT COUNT(*) FROM {$this->table} WHERE user_id = %d", $user_id )
        );
    }

    public function create( array $data ): int|false {
        global $wpdb;
        $result = $wpdb->insert(
            $this->table,
            [
                'user_id' => absint( $data['user_id'] ?? 0 ),
                'title'   => sanitize_text_field( $data['title'] ?? '' ),
                'content' => wp_kses_post( $data['content'] ?? '' ),
                'status'  => sanitize_key( $data['status'] ?? 'draft' ),
            ],
            [ '%d', '%s', '%s', '%s' ]
        );
        return false !== $result ? (int) $wpdb->insert_id : false;
    }

    public function update( int $id, array $data ): bool {
        global $wpdb;

        $update = [];
        $format = [];

        if ( isset( $data['title'] ) ) {
            $update['title'] = sanitize_text_field( $data['title'] );
            $format[]        = '%s';
        }
        if ( isset( $data['content'] ) ) {
            $update['content'] = wp_kses_post( $data['content'] );
            $format[]          = '%s';
        }
        if ( isset( $data['status'] ) ) {
            $update['status'] = sanitize_key( $data['status'] );
            $format[]         = '%s';
        }

        if ( empty( $update ) ) {
            return false;
        }

        $result = $wpdb->update( $this->table, $update, [ 'id' => $id ], $format, [ '%d' ] );
        return false !== $result;
    }

    public function delete( int $id ): bool {
        global $wpdb;
        $result = $wpdb->delete( $this->table, [ 'id' => $id ], [ '%d' ] );
        return false !== $result;
    }
}
```

## Drop Tables on Uninstall

```php
// uninstall.php
global $wpdb;

$tables = [
    $wpdb->prefix . 'my_plugin_items',
    $wpdb->prefix . 'my_plugin_itemmeta',
    $wpdb->prefix . 'my_plugin_logs',
];

foreach ( $tables as $table ) {
    $wpdb->query( "DROP TABLE IF EXISTS {$table}" );
}

delete_option( 'my_plugin_db_version' );
```
