# Theme Development Reference

## Theme Setup (functions.php)

```php
<?php
declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'MY_THEME_VERSION', '1.0.0' );

/**
 * Theme setup — runs after theme is loaded, before headers.
 */
add_action( 'after_setup_theme', function (): void {
    // Translation support.
    load_theme_textdomain( 'my-theme', get_template_directory() . '/languages' );

    // HTML5 support.
    add_theme_support( 'html5', [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ] );

    // Core features.
    add_theme_support( 'automatic-feed-links' );
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'customize-selective-refresh-widgets' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'align-wide' );
    add_theme_support( 'editor-styles' );

    // Custom image sizes.
    add_image_size( 'my-theme-featured', 1200, 630, true );
    add_image_size( 'my-theme-thumbnail', 400, 300, true );

    // Navigation menus.
    register_nav_menus( [
        'primary'   => __( 'Primary Menu', 'my-theme' ),
        'footer'    => __( 'Footer Menu', 'my-theme' ),
        'mobile'    => __( 'Mobile Menu', 'my-theme' ),
    ] );

    // Custom logo.
    add_theme_support( 'custom-logo', [
        'height'      => 100,
        'width'       => 350,
        'flex-height' => true,
        'flex-width'  => true,
    ] );

    // Custom background.
    add_theme_support( 'custom-background', [
        'default-color' => 'ffffff',
    ] );

    // Editor styles.
    add_editor_style( 'assets/css/editor-style.css' );
} );
```

## Asset Enqueuing

```php
add_action( 'wp_enqueue_scripts', function (): void {
    // Main stylesheet.
    wp_enqueue_style(
        'my-theme-style',
        get_stylesheet_uri(),
        [],
        MY_THEME_VERSION
    );

    // Additional CSS.
    wp_enqueue_style(
        'my-theme-main',
        get_template_directory_uri() . '/assets/css/main.css',
        [ 'my-theme-style' ],
        MY_THEME_VERSION
    );

    // Google Fonts (preconnect + enqueue).
    wp_enqueue_style(
        'my-theme-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        [],
        null // No version for external resources.
    );

    // Navigation script.
    wp_enqueue_script(
        'my-theme-navigation',
        get_template_directory_uri() . '/assets/js/navigation.js',
        [],
        MY_THEME_VERSION,
        true
    );

    // Comment reply script (only when needed).
    if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
        wp_enqueue_script( 'comment-reply' );
    }

    // Pass data to JS.
    wp_localize_script( 'my-theme-navigation', 'myThemeData', [
        'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'my_theme_nonce' ),
        'isMobile' => wp_is_mobile(),
    ] );
}, 10 );

// Preconnect to Google Fonts.
add_filter( 'wp_resource_hints', function ( array $urls, string $relation_type ): array {
    if ( 'preconnect' === $relation_type ) {
        $urls[] = [
            'href'        => 'https://fonts.gstatic.com',
            'crossorigin' => 'anonymous',
        ];
    }
    return $urls;
}, 10, 2 );
```

## Template Hierarchy Quick Reference

WordPress looks for templates in this order (simplified):

- **Front Page**: front-page.php → home.php → index.php
- **Single Post**: single-{post-type}-{slug}.php → single-{post-type}.php → single.php → singular.php → index.php
- **Page**: page-{slug}.php → page-{id}.php → page.php → singular.php → index.php
- **Category**: category-{slug}.php → category-{id}.php → category.php → archive.php → index.php
- **Tag**: tag-{slug}.php → tag-{id}.php → tag.php → archive.php → index.php
- **Taxonomy**: taxonomy-{taxonomy}-{term}.php → taxonomy-{taxonomy}.php → taxonomy.php → archive.php → index.php
- **Author**: author-{nicename}.php → author-{id}.php → author.php → archive.php → index.php
- **Date**: date.php → archive.php → index.php
- **Search**: search.php → index.php
- **404**: 404.php → index.php
- **Attachment**: {mime-type}.php → attachment.php → single-attachment.php → single.php → index.php

## Child Theme Setup

**style.css** (child):
```css
/*
 Theme Name:   My Theme Child
 Theme URI:    https://example.com/my-theme-child
 Description:  Child theme for My Theme
 Author:       Author Name
 Author URI:   https://example.com
 Template:     my-theme
 Version:      1.0.0
 Text Domain:  my-theme-child
*/
```

**functions.php** (child):
```php
<?php
declare(strict_types=1);

add_action( 'wp_enqueue_scripts', function (): void {
    wp_enqueue_style(
        'my-theme-parent-style',
        get_template_directory_uri() . '/style.css',
        [],
        wp_get_theme( 'my-theme' )->get( 'Version' )
    );

    wp_enqueue_style(
        'my-theme-child-style',
        get_stylesheet_uri(),
        [ 'my-theme-parent-style' ],
        wp_get_theme()->get( 'Version' )
    );
} );
```

## Widget Areas

```php
add_action( 'widgets_init', function (): void {
    register_sidebar( [
        'name'          => __( 'Primary Sidebar', 'my-theme' ),
        'id'            => 'sidebar-primary',
        'description'   => __( 'Widgets in this area appear on blog pages.', 'my-theme' ),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ] );

    register_sidebar( [
        'name'          => __( 'Footer Widgets', 'my-theme' ),
        'id'            => 'sidebar-footer',
        'description'   => __( 'Widgets in this area appear in the footer.', 'my-theme' ),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ] );
} );
```

## Customizer API

```php
add_action( 'customize_register', function ( \WP_Customize_Manager $wp_customize ): void {
    // Section.
    $wp_customize->add_section( 'my_theme_options', [
        'title'    => __( 'Theme Options', 'my-theme' ),
        'priority' => 30,
    ] );

    // Setting + Control: Primary color.
    $wp_customize->add_setting( 'my_theme_primary_color', [
        'default'           => '#0073aa',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ] );

    $wp_customize->add_control( new \WP_Customize_Color_Control(
        $wp_customize,
        'my_theme_primary_color',
        [
            'label'   => __( 'Primary Color', 'my-theme' ),
            'section' => 'my_theme_options',
        ]
    ) );

    // Setting + Control: Footer text.
    $wp_customize->add_setting( 'my_theme_footer_text', [
        'default'           => '',
        'sanitize_callback' => 'wp_kses_post',
        'transport'         => 'refresh',
    ] );

    $wp_customize->add_control( 'my_theme_footer_text', [
        'label'   => __( 'Footer Text', 'my-theme' ),
        'section' => 'my_theme_options',
        'type'    => 'textarea',
    ] );

    // Selective refresh for footer text.
    if ( isset( $wp_customize->selective_refresh ) ) {
        $wp_customize->selective_refresh->add_partial( 'my_theme_footer_text', [
            'selector'        => '.site-footer__text',
            'render_callback' => function (): void {
                echo wp_kses_post( get_theme_mod( 'my_theme_footer_text', '' ) );
            },
        ] );
    }
} );

// Output custom CSS from Customizer settings.
add_action( 'wp_head', function (): void {
    $color = get_theme_mod( 'my_theme_primary_color', '#0073aa' );
    if ( '#0073aa' !== $color ) {
        printf(
            '<style>:root { --primary-color: %s; }</style>',
            esc_attr( $color )
        );
    }
}, 100 );
```

## Block Theme (Full Site Editing) — theme.json

```json
{
    "$schema": "https://schemas.wp.org/trunk/theme.json",
    "version": 3,
    "settings": {
        "color": {
            "palette": [
                { "slug": "primary", "color": "#0073aa", "name": "Primary" },
                { "slug": "secondary", "color": "#23282d", "name": "Secondary" },
                { "slug": "accent", "color": "#00a0d2", "name": "Accent" },
                { "slug": "background", "color": "#ffffff", "name": "Background" },
                { "slug": "foreground", "color": "#1e1e1e", "name": "Foreground" }
            ],
            "custom": false,
            "defaultPalette": false
        },
        "typography": {
            "fontFamilies": [
                {
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
                    "slug": "system",
                    "name": "System"
                }
            ],
            "fontSizes": [
                { "slug": "small", "size": "0.875rem", "name": "Small" },
                { "slug": "medium", "size": "1rem", "name": "Medium" },
                { "slug": "large", "size": "1.25rem", "name": "Large" },
                { "slug": "x-large", "size": "1.5rem", "name": "Extra Large" }
            ]
        },
        "spacing": {
            "units": ["px", "em", "rem", "%", "vw", "vh"]
        },
        "layout": {
            "contentSize": "720px",
            "wideSize": "1200px"
        }
    },
    "styles": {
        "color": {
            "background": "var(--wp--preset--color--background)",
            "text": "var(--wp--preset--color--foreground)"
        },
        "typography": {
            "fontFamily": "var(--wp--preset--font-family--system)",
            "fontSize": "var(--wp--preset--font-size--medium)",
            "lineHeight": "1.6"
        },
        "elements": {
            "link": {
                "color": { "text": "var(--wp--preset--color--primary)" },
                ":hover": {
                    "color": { "text": "var(--wp--preset--color--accent)" }
                }
            }
        }
    },
    "templateParts": [
        { "name": "header", "title": "Header", "area": "header" },
        { "name": "footer", "title": "Footer", "area": "footer" }
    ]
}
```

## Custom Walker for Navigation

```php
<?php
declare(strict_types=1);

namespace MyTheme;

class Walker_Nav extends \Walker_Nav_Menu {

    public function start_lvl( &$output, $depth = 0, $args = null ): void {
        $indent  = str_repeat( "\t", $depth );
        $output .= "\n{$indent}<ul class=\"sub-menu depth-{$depth}\">\n";
    }

    public function start_el( &$output, $item, $depth = 0, $args = null, $id = 0 ): void {
        $classes = empty( $item->classes ) ? [] : (array) $item->classes;
        $classes[] = 'menu-item-depth-' . $depth;

        if ( in_array( 'current-menu-item', $classes, true ) ) {
            $classes[] = 'is-active';
        }

        $class_names = implode( ' ', array_filter( $classes ) );

        $output .= sprintf(
            '<li id="menu-item-%d" class="%s">',
            esc_attr( $item->ID ),
            esc_attr( $class_names )
        );

        $atts = [
            'title'  => ! empty( $item->attr_title ) ? $item->attr_title : '',
            'target' => ! empty( $item->target ) ? $item->target : '',
            'rel'    => ! empty( $item->xfn ) ? $item->xfn : '',
            'href'   => ! empty( $item->url ) ? $item->url : '',
            'class'  => 'menu-link',
        ];

        if ( '_blank' === $atts['target'] && empty( $atts['rel'] ) ) {
            $atts['rel'] = 'noopener noreferrer';
        }

        $attributes = '';
        foreach ( $atts as $attr => $value ) {
            if ( ! empty( $value ) ) {
                $attributes .= ' ' . $attr . '="' . esc_attr( $value ) . '"';
            }
        }

        $title = apply_filters( 'the_title', $item->title, $item->ID );

        $output .= sprintf(
            '<a%s>%s%s%s</a>',
            $attributes,
            $args->before ?? '',
            esc_html( $title ),
            $args->after ?? ''
        );
    }
}
```

## Template Tags Helper

```php
// inc/template-tags.php

function my_theme_posted_on(): void {
    $time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time>';

    if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
        $time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time>';
        $time_string .= '<time class="updated sr-only" datetime="%3$s">%4$s</time>';
    }

    printf(
        $time_string,
        esc_attr( get_the_date( DATE_W3C ) ),
        esc_html( get_the_date() ),
        esc_attr( get_the_modified_date( DATE_W3C ) ),
        esc_html( get_the_modified_date() )
    );
}

function my_theme_posted_by(): void {
    printf(
        '<span class="byline"><span class="author vcard"><a class="url fn n" href="%1$s">%2$s</a></span></span>',
        esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ),
        esc_html( get_the_author() )
    );
}

function my_theme_entry_footer(): void {
    if ( 'post' === get_post_type() ) {
        $categories_list = get_the_category_list( esc_html__( ', ', 'my-theme' ) );
        if ( $categories_list ) {
            printf(
                '<span class="cat-links">%s %s</span>',
                esc_html__( 'Posted in', 'my-theme' ),
                $categories_list // Already escaped by get_the_category_list().
            );
        }

        $tags_list = get_the_tag_list( '', esc_html_x( ', ', 'list item separator', 'my-theme' ) );
        if ( $tags_list ) {
            printf(
                '<span class="tags-links">%s %s</span>',
                esc_html__( 'Tagged', 'my-theme' ),
                $tags_list // Already escaped by get_the_tag_list().
            );
        }
    }

    edit_post_link(
        sprintf(
            '%s <span class="sr-only">%s</span>',
            esc_html__( 'Edit', 'my-theme' ),
            get_the_title()
        ),
        '<span class="edit-link">',
        '</span>'
    );
}
```
