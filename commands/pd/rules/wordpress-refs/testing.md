# WordPress Testing Reference

## PHPUnit with WordPress

### Setup with WP_UnitTestCase

```php
<?php
declare(strict_types=1);

namespace MyPlugin\Tests;

class Test_Item_Repository extends \WP_UnitTestCase {

    private \MyPlugin\Item_Repository $repo;

    public function set_up(): void {
        parent::set_up();
        $this->repo = new \MyPlugin\Item_Repository();

        // Create test table.
        global $wpdb;
        $table = $wpdb->prefix . 'my_plugin_items';
        $wpdb->query( "TRUNCATE TABLE {$table}" );
    }

    public function tear_down(): void {
        parent::tear_down();
    }

    public function test_create_item(): void {
        $id = $this->repo->create( [
            'title'   => 'Test Item',
            'content' => 'Test content.',
            'status'  => 'active',
            'user_id' => 1,
        ] );

        $this->assertIsInt( $id );
        $this->assertGreaterThan( 0, $id );
    }

    public function test_find_item(): void {
        $id   = $this->repo->create( [ 'title' => 'Find Me', 'user_id' => 1 ] );
        $item = $this->repo->find( $id );

        $this->assertNotNull( $item );
        $this->assertSame( 'Find Me', $item['title'] );
    }

    public function test_find_nonexistent_returns_null(): void {
        $item = $this->repo->find( 99999 );
        $this->assertNull( $item );
    }

    public function test_update_item(): void {
        $id = $this->repo->create( [ 'title' => 'Original', 'user_id' => 1 ] );
        $this->repo->update( $id, [ 'title' => 'Updated' ] );

        $item = $this->repo->find( $id );
        $this->assertSame( 'Updated', $item['title'] );
    }

    public function test_delete_item(): void {
        $id = $this->repo->create( [ 'title' => 'Delete Me', 'user_id' => 1 ] );
        $result = $this->repo->delete( $id );

        $this->assertTrue( $result );
        $this->assertNull( $this->repo->find( $id ) );
    }

    public function test_find_by_user(): void {
        $this->repo->create( [ 'title' => 'A', 'user_id' => 1 ] );
        $this->repo->create( [ 'title' => 'B', 'user_id' => 1 ] );
        $this->repo->create( [ 'title' => 'C', 'user_id' => 2 ] );

        $items = $this->repo->find_by_user( 1 );
        $this->assertCount( 2, $items );
    }
}
```

### Testing Hooks

```php
class Test_Hooks extends \WP_UnitTestCase {

    public function test_cpt_is_registered(): void {
        // Trigger init hooks.
        do_action( 'init' );

        $this->assertTrue( post_type_exists( 'book' ) );
    }

    public function test_filter_modifies_title(): void {
        $post_id = self::factory()->post->create( [ 'post_title' => 'Test Post' ] );

        // Apply the filter your plugin adds.
        $filtered = apply_filters( 'the_title', 'Test Post', $post_id );

        $this->assertStringContainsString( 'Test Post', $filtered );
    }

    public function test_action_fires(): void {
        $fired = false;
        add_action( 'my_plugin_item_created', function () use ( &$fired ): void {
            $fired = true;
        } );

        // Trigger the action.
        do_action( 'my_plugin_item_created', 1 );

        $this->assertTrue( $fired );
    }
}
```

### Testing AJAX Handlers

```php
class Test_Ajax extends \WP_Ajax_UnitTestCase {

    public function test_ajax_handler_requires_nonce(): void {
        // Set up as logged-in user.
        $this->_setRole( 'administrator' );

        // No nonce sent — should fail.
        $this->expectException( \WPAjaxDieContinueException::class );
        $this->_handleAjax( 'my_plugin_action' );
    }

    public function test_ajax_handler_success(): void {
        $this->_setRole( 'administrator' );

        $_POST['nonce'] = wp_create_nonce( 'my_plugin_nonce' );
        $_POST['data']  = 'test value';

        try {
            $this->_handleAjax( 'my_plugin_action' );
        } catch ( \WPAjaxDieContinueException $e ) {
            // Expected.
        }

        $response = json_decode( $this->_last_response, true );
        $this->assertTrue( $response['success'] );
    }

    public function test_ajax_handler_unauthorized(): void {
        $this->_setRole( 'subscriber' );

        $_POST['nonce'] = wp_create_nonce( 'my_plugin_nonce' );
        $_POST['data']  = 'test';

        try {
            $this->_handleAjax( 'my_plugin_action' );
        } catch ( \WPAjaxDieContinueException $e ) {
            // Expected.
        }

        $response = json_decode( $this->_last_response, true );
        $this->assertFalse( $response['success'] );
    }
}
```

### Testing REST API Endpoints

```php
class Test_REST_API extends \WP_Test_REST_TestCase {

    public function test_endpoint_registered(): void {
        $routes = rest_get_server()->get_routes();
        $this->assertArrayHasKey( '/my-plugin/v1/items', $routes );
    }

    public function test_get_items_requires_auth(): void {
        $request  = new \WP_REST_Request( 'GET', '/my-plugin/v1/items' );
        $response = rest_get_server()->dispatch( $request );

        $this->assertSame( 401, $response->get_status() );
    }

    public function test_get_items_returns_data(): void {
        $user_id = self::factory()->user->create( [ 'role' => 'editor' ] );
        wp_set_current_user( $user_id );

        self::factory()->post->create_many( 3, [ 'post_type' => 'my_item' ] );

        $request  = new \WP_REST_Request( 'GET', '/my-plugin/v1/items' );
        $response = rest_get_server()->dispatch( $request );

        $this->assertSame( 200, $response->get_status() );
        $this->assertCount( 3, $response->get_data() );
    }

    public function test_get_items_pagination(): void {
        $user_id = self::factory()->user->create( [ 'role' => 'editor' ] );
        wp_set_current_user( $user_id );

        self::factory()->post->create_many( 15, [ 'post_type' => 'my_item' ] );

        $request = new \WP_REST_Request( 'GET', '/my-plugin/v1/items' );
        $request->set_param( 'per_page', 5 );
        $response = rest_get_server()->dispatch( $request );

        $this->assertCount( 5, $response->get_data() );
    }
}
```

## PHP CodeSniffer with WordPress Standards

### composer.json
```json
{
    "require-dev": {
        "squizlabs/php_codesniffer": "^3.7",
        "wp-coding-standards/wpcs": "^3.0",
        "phpcompatibility/phpcompatibility-wp": "^2.1",
        "dealerdirect/phpcodesniffer-composer-installer": "^1.0"
    },
    "scripts": {
        "lint": "phpcs",
        "lint:fix": "phpcbf"
    }
}
```

### phpcs.xml.dist
```xml
<?xml version="1.0"?>
<ruleset name="My Plugin Coding Standards">
    <description>PHPCS rules for My Plugin.</description>

    <file>.</file>
    <exclude-pattern>/vendor/</exclude-pattern>
    <exclude-pattern>/node_modules/</exclude-pattern>
    <exclude-pattern>/tests/</exclude-pattern>

    <arg name="extensions" value="php"/>
    <arg name="colors"/>
    <arg value="sp"/>

    <!-- WordPress Coding Standards -->
    <rule ref="WordPress">
        <exclude name="WordPress.Files.FileName.InvalidClassFileName"/>
    </rule>

    <!-- PHP Compatibility -->
    <config name="testVersion" value="8.0-"/>
    <rule ref="PHPCompatibilityWP"/>

    <!-- Text domain -->
    <config name="minimum_wp_version" value="6.0"/>
    <rule ref="WordPress.WP.I18n">
        <properties>
            <property name="text_domain" type="array">
                <element value="my-plugin"/>
            </property>
        </properties>
    </rule>

    <!-- Prefixes -->
    <rule ref="WordPress.NamingConventions.PrefixAllGlobals">
        <properties>
            <property name="prefixes" type="array">
                <element value="my_plugin"/>
                <element value="MyPlugin"/>
            </property>
        </properties>
    </rule>
</ruleset>
```

## Debugging Tools

### Query Monitor Setup
Query Monitor is the essential debugging plugin. Key features:
- Database query analysis (slow queries, duplicates)
- Hook/action debugging
- PHP error logging
- HTTP API call tracking
- REST API debugging
- Conditional checks
- Environment info

### Custom Debug Logging
```php
function my_plugin_log( string $message, mixed $data = null ): void {
    if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
        return;
    }

    $entry = sprintf(
        '[%s] [MyPlugin] %s',
        gmdate( 'Y-m-d H:i:s' ),
        $message
    );

    if ( null !== $data ) {
        $entry .= ' | Data: ' . wp_json_encode( $data );
    }

    error_log( $entry );
}
```

### wp-config.php Debug Settings
```php
// Development:
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );     // Log to wp-content/debug.log.
define( 'WP_DEBUG_DISPLAY', false ); // Don't show errors on screen.
define( 'SCRIPT_DEBUG', true );     // Use unminified core scripts.
define( 'SAVEQUERIES', true );      // Log all queries (performance impact).

// Production:
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_LOG', false );
define( 'WP_DEBUG_DISPLAY', false );
define( 'DISALLOW_FILE_EDIT', true );
define( 'DISALLOW_FILE_MODS', true ); // Prevents plugin/theme installs.
```
