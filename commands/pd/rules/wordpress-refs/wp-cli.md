# WP-CLI Reference

## Creating Custom WP-CLI Commands

```php
<?php
declare(strict_types=1);

namespace MyPlugin\CLI;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
    return;
}

class My_Plugin_Command {

    /**
     * List all items.
     *
     * ## OPTIONS
     *
     * [--status=<status>]
     * : Filter by status.
     * ---
     * default: all
     * options:
     *   - all
     *   - active
     *   - draft
     *   - archived
     * ---
     *
     * [--user=<user_id>]
     * : Filter by user ID.
     *
     * [--format=<format>]
     * : Output format.
     * ---
     * default: table
     * options:
     *   - table
     *   - json
     *   - csv
     *   - yaml
     *   - count
     * ---
     *
     * ## EXAMPLES
     *
     *     # List all active items
     *     $ wp my-plugin list --status=active
     *
     *     # List items for user 5 as JSON
     *     $ wp my-plugin list --user=5 --format=json
     *
     * @subcommand list
     */
    public function list_items( array $args, array $assoc_args ): void {
        global $wpdb;

        $status = $assoc_args['status'] ?? 'all';
        $user   = isset( $assoc_args['user'] ) ? absint( $assoc_args['user'] ) : null;
        $format = $assoc_args['format'] ?? 'table';
        $table  = $wpdb->prefix . 'my_plugin_items';

        $where = [];
        $params = [];

        if ( 'all' !== $status ) {
            $where[]  = 'status = %s';
            $params[] = $status;
        }

        if ( null !== $user ) {
            $where[]  = 'user_id = %d';
            $params[] = $user;
        }

        $sql = "SELECT id, title, status, user_id, created_at FROM {$table}";
        if ( ! empty( $where ) ) {
            $sql .= ' WHERE ' . implode( ' AND ', $where );
        }
        $sql .= ' ORDER BY created_at DESC';

        if ( ! empty( $params ) ) {
            $sql = $wpdb->prepare( $sql, ...$params );
        }

        $items = $wpdb->get_results( $sql, ARRAY_A );

        if ( empty( $items ) ) {
            \WP_CLI::warning( 'No items found.' );
            return;
        }

        \WP_CLI\Utils\format_items(
            $format,
            $items,
            [ 'id', 'title', 'status', 'user_id', 'created_at' ]
        );
    }

    /**
     * Create a new item.
     *
     * ## OPTIONS
     *
     * <title>
     * : The item title.
     *
     * [--content=<content>]
     * : The item content.
     *
     * [--status=<status>]
     * : The item status.
     * ---
     * default: draft
     * ---
     *
     * [--user=<user_id>]
     * : Assign to a user.
     * ---
     * default: 0
     * ---
     *
     * ## EXAMPLES
     *
     *     $ wp my-plugin create "My Item" --status=active --user=1
     *     Success: Created item #42.
     */
    public function create( array $args, array $assoc_args ): void {
        global $wpdb;

        $table = $wpdb->prefix . 'my_plugin_items';
        $title = sanitize_text_field( $args[0] );

        $result = $wpdb->insert(
            $table,
            [
                'title'   => $title,
                'content' => sanitize_textarea_field( $assoc_args['content'] ?? '' ),
                'status'  => sanitize_key( $assoc_args['status'] ?? 'draft' ),
                'user_id' => absint( $assoc_args['user'] ?? 0 ),
            ],
            [ '%s', '%s', '%s', '%d' ]
        );

        if ( false === $result ) {
            \WP_CLI::error( 'Failed to create item.' );
        }

        \WP_CLI::success( sprintf( 'Created item #%d.', $wpdb->insert_id ) );
    }

    /**
     * Delete an item.
     *
     * ## OPTIONS
     *
     * <id>
     * : The item ID.
     *
     * [--yes]
     * : Skip confirmation.
     *
     * ## EXAMPLES
     *
     *     $ wp my-plugin delete 42 --yes
     *     Success: Deleted item #42.
     */
    public function delete( array $args, array $assoc_args ): void {
        global $wpdb;

        $id    = absint( $args[0] );
        $table = $wpdb->prefix . 'my_plugin_items';

        $item = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ),
            ARRAY_A
        );

        if ( ! $item ) {
            \WP_CLI::error( sprintf( 'Item #%d not found.', $id ) );
        }

        \WP_CLI::confirm(
            sprintf( 'Delete item "%s" (#%d)?', $item['title'], $id ),
            $assoc_args
        );

        $result = $wpdb->delete( $table, [ 'id' => $id ], [ '%d' ] );

        if ( false === $result ) {
            \WP_CLI::error( 'Failed to delete item.' );
        }

        \WP_CLI::success( sprintf( 'Deleted item #%d.', $id ) );
    }

    /**
     * Run database migrations.
     *
     * ## EXAMPLES
     *
     *     $ wp my-plugin migrate
     *     Success: Database is up to date (v1.3.0).
     */
    public function migrate( array $args, array $assoc_args ): void {
        \WP_CLI::log( 'Checking database version...' );

        $before = get_option( 'my_plugin_db_version', '0.0.0' );
        \MyPlugin\DB_Migrator::check();
        $after = get_option( 'my_plugin_db_version', '0.0.0' );

        if ( $before === $after ) {
            \WP_CLI::success( sprintf( 'Database is already up to date (v%s).', $after ) );
        } else {
            \WP_CLI::success( sprintf( 'Migrated from v%s to v%s.', $before, $after ) );
        }
    }

    /**
     * Flush all plugin transients.
     *
     * ## EXAMPLES
     *
     *     $ wp my-plugin flush-cache
     *     Success: Flushed 12 transients.
     */
    public function flush_cache( array $args, array $assoc_args ): void {
        global $wpdb;

        $count = $wpdb->query(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_my_plugin_%' OR option_name LIKE '_transient_timeout_my_plugin_%'"
        );

        \WP_CLI::success( sprintf( 'Flushed %d transient entries.', $count ) );
    }
}

\WP_CLI::add_command( 'my-plugin', My_Plugin_Command::class );
```

## Registration in Plugin

```php
// In main plugin file or bootstrap.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
    require_once MY_PLUGIN_PATH . 'includes/cli/class-my-plugin-command.php';
}
```

## Useful WP-CLI Patterns

### Progress Bar for Bulk Operations
```php
public function bulk_process( array $args, array $assoc_args ): void {
    global $wpdb;
    $table = $wpdb->prefix . 'my_plugin_items';

    $items = $wpdb->get_results( "SELECT id FROM {$table}", ARRAY_A );
    $total = count( $items );

    $progress = \WP_CLI\Utils\make_progress_bar( 'Processing items', $total );

    $success = 0;
    $errors  = 0;

    foreach ( $items as $item ) {
        try {
            // Process item...
            $success++;
        } catch ( \Exception $e ) {
            \WP_CLI::warning( sprintf( 'Item #%d failed: %s', $item['id'], $e->getMessage() ) );
            $errors++;
        }
        $progress->tick();
    }

    $progress->finish();
    \WP_CLI::success( sprintf( 'Done. %d succeeded, %d failed.', $success, $errors ) );
}
```

### Batch Processing with Memory Management
```php
public function batch_update( array $args, array $assoc_args ): void {
    global $wpdb;
    $table    = $wpdb->prefix . 'my_plugin_items';
    $batch    = absint( $assoc_args['batch'] ?? 100 );
    $offset   = 0;
    $total    = 0;

    do {
        $items = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id FROM {$table} ORDER BY id ASC LIMIT %d OFFSET %d",
                $batch,
                $offset
            ),
            ARRAY_A
        );

        if ( empty( $items ) ) {
            break;
        }

        foreach ( $items as $item ) {
            // Process...
            $total++;
        }

        $offset += $batch;

        // Free memory.
        \WP_CLI::log( sprintf( 'Processed %d items so far...', $total ) );
        if ( function_exists( 'wp_cache_flush' ) ) {
            wp_cache_flush();
        }
    } while ( count( $items ) === $batch );

    \WP_CLI::success( sprintf( 'Updated %d items.', $total ) );
}
```
