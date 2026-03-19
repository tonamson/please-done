# WooCommerce Development Reference

## Essential Hooks

### Product Hooks
```php
// Add custom field to product edit page.
add_action( 'woocommerce_product_options_general_product_data', function (): void {
    woocommerce_wp_text_input( [
        'id'          => '_custom_product_field',
        'label'       => __( 'Custom Field', 'my-plugin' ),
        'desc_tip'    => true,
        'description' => __( 'Enter custom value.', 'my-plugin' ),
        'type'        => 'text',
    ] );
} );

// Save custom field.
add_action( 'woocommerce_process_product_meta', function ( int $post_id ): void {
    $value = sanitize_text_field( wp_unslash( $_POST['_custom_product_field'] ?? '' ) );
    update_post_meta( $post_id, '_custom_product_field', $value );
} );

// Display on frontend.
add_action( 'woocommerce_single_product_summary', function (): void {
    global $product;
    $value = get_post_meta( $product->get_id(), '_custom_product_field', true );
    if ( $value ) {
        printf( '<p class="custom-field">%s</p>', esc_html( $value ) );
    }
}, 25 );
```

### Cart & Checkout Hooks
```php
// Add custom field to checkout.
add_action( 'woocommerce_after_order_notes', function ( \WC_Checkout $checkout ): void {
    woocommerce_form_field( 'delivery_notes', [
        'type'        => 'textarea',
        'class'       => [ 'form-row-wide' ],
        'label'       => __( 'Delivery Notes', 'my-plugin' ),
        'placeholder' => __( 'Special delivery instructions...', 'my-plugin' ),
        'required'    => false,
    ], $checkout->get_value( 'delivery_notes' ) );
} );

// Validate custom checkout field.
add_action( 'woocommerce_checkout_process', function (): void {
    $notes = sanitize_textarea_field( wp_unslash( $_POST['delivery_notes'] ?? '' ) );
    if ( strlen( $notes ) > 500 ) {
        wc_add_notice(
            __( 'Delivery notes must be under 500 characters.', 'my-plugin' ),
            'error'
        );
    }
} );

// Save custom checkout field to order.
add_action( 'woocommerce_checkout_update_order_meta', function ( int $order_id ): void {
    if ( ! empty( $_POST['delivery_notes'] ) ) {
        $notes = sanitize_textarea_field( wp_unslash( $_POST['delivery_notes'] ) );
        $order = wc_get_order( $order_id );
        $order->update_meta_data( '_delivery_notes', $notes );
        $order->save();
    }
} );

// Display in admin order page.
add_action( 'woocommerce_admin_order_data_after_billing_address', function ( \WC_Order $order ): void {
    $notes = $order->get_meta( '_delivery_notes' );
    if ( $notes ) {
        printf(
            '<p><strong>%s:</strong> %s</p>',
            esc_html__( 'Delivery Notes', 'my-plugin' ),
            esc_html( $notes )
        );
    }
} );
```

### Order Status Hooks
```php
// Custom order status.
add_action( 'init', function (): void {
    register_post_status( 'wc-awaiting-pickup', [
        'label'                     => _x( 'Awaiting Pickup', 'Order status', 'my-plugin' ),
        'public'                    => true,
        'show_in_admin_status_list' => true,
        'show_in_admin_all_list'    => true,
        'exclude_from_search'       => false,
        'label_count'               => _n_noop(
            'Awaiting Pickup <span class="count">(%s)</span>',
            'Awaiting Pickup <span class="count">(%s)</span>',
            'my-plugin'
        ),
    ] );
} );

add_filter( 'wc_order_statuses', function ( array $statuses ): array {
    $statuses['wc-awaiting-pickup'] = _x( 'Awaiting Pickup', 'Order status', 'my-plugin' );
    return $statuses;
} );

// Action on status change.
add_action( 'woocommerce_order_status_changed', function ( int $order_id, string $old_status, string $new_status ): void {
    if ( 'awaiting-pickup' === $new_status ) {
        $order = wc_get_order( $order_id );
        // Send notification, trigger webhook, etc.
    }
}, 10, 3 );
```

## HPOS (High-Performance Order Storage) Compatibility

WooCommerce is migrating from post-based to custom table order storage. Declare compatibility:

```php
// In main plugin file.
add_action( 'before_woocommerce_init', function (): void {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            MY_PLUGIN_FILE,
            true
        );
    }
} );
```

Key changes for HPOS:
- Use `wc_get_order()` instead of `get_post()`.
- Use `$order->get_meta()` / `$order->update_meta_data()` instead of `get_post_meta()` / `update_post_meta()`.
- Use `$order->save()` after updating meta.
- Use `wc_get_orders()` instead of `WP_Query` for order queries.

```php
// HPOS-compatible order query.
$orders = wc_get_orders( [
    'status'     => 'processing',
    'limit'      => 10,
    'orderby'    => 'date',
    'order'      => 'DESC',
    'meta_key'   => '_delivery_notes',
    'meta_value' => '',
    'meta_compare' => '!=',
] );

foreach ( $orders as $order ) {
    $notes = $order->get_meta( '_delivery_notes' );
    // Process order.
}
```

## Custom Payment Gateway

```php
<?php
declare(strict_types=1);

namespace MyPlugin;

class Custom_Payment_Gateway extends \WC_Payment_Gateway {

    public function __construct() {
        $this->id                 = 'my_custom_gateway';
        $this->icon               = '';
        $this->has_fields         = true;
        $this->method_title       = __( 'Custom Gateway', 'my-plugin' );
        $this->method_description = __( 'Custom payment gateway description.', 'my-plugin' );

        $this->supports = [
            'products',
            'refunds',
        ];

        $this->init_form_fields();
        $this->init_settings();

        $this->title       = $this->get_option( 'title' );
        $this->description = $this->get_option( 'description' );
        $this->enabled     = $this->get_option( 'enabled' );

        add_action(
            'woocommerce_update_options_payment_gateways_' . $this->id,
            [ $this, 'process_admin_options' ]
        );
    }

    public function init_form_fields(): void {
        $this->form_fields = [
            'enabled' => [
                'title'   => __( 'Enable/Disable', 'my-plugin' ),
                'type'    => 'checkbox',
                'label'   => __( 'Enable Custom Gateway', 'my-plugin' ),
                'default' => 'no',
            ],
            'title' => [
                'title'       => __( 'Title', 'my-plugin' ),
                'type'        => 'text',
                'description' => __( 'Title shown during checkout.', 'my-plugin' ),
                'default'     => __( 'Custom Payment', 'my-plugin' ),
                'desc_tip'    => true,
            ],
            'description' => [
                'title'       => __( 'Description', 'my-plugin' ),
                'type'        => 'textarea',
                'description' => __( 'Description shown during checkout.', 'my-plugin' ),
                'default'     => __( 'Pay using our custom gateway.', 'my-plugin' ),
            ],
            'api_key' => [
                'title'       => __( 'API Key', 'my-plugin' ),
                'type'        => 'password',
                'description' => __( 'Your payment provider API key.', 'my-plugin' ),
                'desc_tip'    => true,
            ],
        ];
    }

    public function process_payment( $order_id ): array {
        $order = wc_get_order( $order_id );

        if ( ! $order ) {
            wc_add_notice( __( 'Order not found.', 'my-plugin' ), 'error' );
            return [ 'result' => 'fail' ];
        }

        try {
            // Call payment API here.
            // $response = $this->call_payment_api( $order );

            $order->payment_complete();
            $order->add_order_note(
                __( 'Payment completed via Custom Gateway.', 'my-plugin' )
            );

            WC()->cart->empty_cart();

            return [
                'result'   => 'success',
                'redirect' => $this->get_return_url( $order ),
            ];
        } catch ( \Exception $e ) {
            wc_add_notice(
                __( 'Payment failed. Please try again.', 'my-plugin' ),
                'error'
            );

            $order->add_order_note(
                sprintf(
                    /* translators: %s: error message */
                    __( 'Payment failed: %s', 'my-plugin' ),
                    $e->getMessage()
                )
            );

            return [ 'result' => 'fail' ];
        }
    }

    public function process_refund( $order_id, $amount = null, $reason = '' ): bool|\WP_Error {
        $order = wc_get_order( $order_id );

        if ( ! $order ) {
            return new \WP_Error( 'invalid_order', __( 'Order not found.', 'my-plugin' ) );
        }

        try {
            // Call refund API here.
            $order->add_order_note(
                sprintf(
                    /* translators: 1: refund amount, 2: refund reason */
                    __( 'Refunded %1$s. Reason: %2$s', 'my-plugin' ),
                    wc_price( (float) $amount ),
                    $reason
                )
            );

            return true;
        } catch ( \Exception $e ) {
            return new \WP_Error( 'refund_failed', $e->getMessage() );
        }
    }
}

// Register the gateway.
add_filter( 'woocommerce_payment_gateways', function ( array $gateways ): array {
    $gateways[] = Custom_Payment_Gateway::class;
    return $gateways;
} );
```

## Price Manipulation

```php
// Modify product price display.
add_filter( 'woocommerce_get_price_html', function ( string $price, \WC_Product $product ): string {
    if ( $product->is_on_sale() ) {
        $price .= '<span class="sale-badge">' . esc_html__( 'Sale!', 'my-plugin' ) . '</span>';
    }
    return $price;
}, 10, 2 );

// Add a programmatic discount.
add_action( 'woocommerce_cart_calculate_fees', function ( \WC_Cart $cart ): void {
    if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
        return;
    }

    $total = $cart->get_subtotal();
    if ( $total > 100 ) {
        $discount = $total * 0.10; // 10% discount.
        $cart->add_fee(
            __( 'Bulk Discount (10%)', 'my-plugin' ),
            -$discount
        );
    }
} );
```

## WooCommerce REST API Extension

```php
add_filter( 'woocommerce_rest_prepare_product_object', function (
    \WP_REST_Response $response,
    \WC_Product $product,
    \WP_REST_Request $request
): \WP_REST_Response {
    $data = $response->get_data();
    $data['custom_field'] = $product->get_meta( '_custom_product_field' );
    $response->set_data( $data );
    return $response;
}, 10, 3 );
```

## Email Customization

```php
// Add content to order emails.
add_action( 'woocommerce_email_after_order_table', function (
    \WC_Order $order,
    bool $sent_to_admin,
    bool $plain_text,
    \WC_Email $email
): void {
    $notes = $order->get_meta( '_delivery_notes' );
    if ( ! $notes ) {
        return;
    }

    if ( $plain_text ) {
        printf( "\n%s: %s\n", __( 'Delivery Notes', 'my-plugin' ), $notes );
    } else {
        printf(
            '<h2>%s</h2><p>%s</p>',
            esc_html__( 'Delivery Notes', 'my-plugin' ),
            esc_html( $notes )
        );
    }
}, 10, 4 );
```
