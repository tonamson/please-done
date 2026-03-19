# Gutenberg Block Development Reference

## Block Registration (block.json)

Every custom block starts with a `block.json` file — the single source of truth for block metadata.

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "my-plugin/custom-card",
    "version": "1.0.0",
    "title": "Custom Card",
    "category": "widgets",
    "icon": "admin-post",
    "description": "A customizable card block.",
    "keywords": ["card", "box", "container"],
    "supports": {
        "html": false,
        "align": ["wide", "full"],
        "color": {
            "background": true,
            "text": true,
            "gradients": true
        },
        "typography": {
            "fontSize": true,
            "lineHeight": true
        },
        "spacing": {
            "margin": true,
            "padding": true
        }
    },
    "attributes": {
        "heading": {
            "type": "string",
            "default": ""
        },
        "content": {
            "type": "string",
            "default": ""
        },
        "mediaId": {
            "type": "number",
            "default": 0
        },
        "mediaUrl": {
            "type": "string",
            "default": ""
        }
    },
    "textdomain": "my-plugin",
    "editorScript": "file:./index.js",
    "editorStyle": "file:./index.css",
    "style": "file:./style-index.css",
    "render": "file:./render.php"
}
```

## Static Block (Edit + Save in JS)

```jsx
// src/blocks/custom-card/edit.js
import { __ } from '@wordpress/i18n';
import {
    useBlockProps,
    RichText,
    MediaUpload,
    MediaUploadCheck,
    InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, Button } from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
    const { heading, content, mediaId, mediaUrl } = attributes;
    const blockProps = useBlockProps( { className: 'wp-block-my-plugin-custom-card' } );

    return (
        <>
            <InspectorControls>
                <PanelBody title={ __( 'Card Settings', 'my-plugin' ) }>
                    <MediaUploadCheck>
                        <MediaUpload
                            onSelect={ ( media ) =>
                                setAttributes( { mediaId: media.id, mediaUrl: media.url } )
                            }
                            allowedTypes={ [ 'image' ] }
                            value={ mediaId }
                            render={ ( { open } ) => (
                                <div>
                                    { mediaUrl && (
                                        <img
                                            src={ mediaUrl }
                                            alt=""
                                            style={ { maxWidth: '100%', marginBottom: '8px' } }
                                        />
                                    ) }
                                    <Button onClick={ open } variant="secondary">
                                        { mediaId
                                            ? __( 'Replace Image', 'my-plugin' )
                                            : __( 'Select Image', 'my-plugin' ) }
                                    </Button>
                                    { mediaId > 0 && (
                                        <Button
                                            onClick={ () =>
                                                setAttributes( { mediaId: 0, mediaUrl: '' } )
                                            }
                                            isDestructive
                                        >
                                            { __( 'Remove Image', 'my-plugin' ) }
                                        </Button>
                                    ) }
                                </div>
                            ) }
                        />
                    </MediaUploadCheck>
                </PanelBody>
            </InspectorControls>

            <div { ...blockProps }>
                { mediaUrl && (
                    <div className="wp-block-my-plugin-custom-card__image">
                        <img src={ mediaUrl } alt="" />
                    </div>
                ) }
                <RichText
                    tagName="h3"
                    className="wp-block-my-plugin-custom-card__heading"
                    value={ heading }
                    onChange={ ( val ) => setAttributes( { heading: val } ) }
                    placeholder={ __( 'Card Heading…', 'my-plugin' ) }
                />
                <RichText
                    tagName="p"
                    className="wp-block-my-plugin-custom-card__content"
                    value={ content }
                    onChange={ ( val ) => setAttributes( { content: val } ) }
                    placeholder={ __( 'Card content…', 'my-plugin' ) }
                />
            </div>
        </>
    );
}
```

## Dynamic Block (PHP Render)

For blocks that need server-side data (latest posts, user info, etc.), use a PHP render callback:

```php
// render.php — Referenced in block.json as "render": "file:./render.php"
<?php
declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$heading   = $attributes['heading'] ?? '';
$content   = $attributes['content'] ?? '';
$media_url = $attributes['mediaUrl'] ?? '';

$wrapper_attributes = get_block_wrapper_attributes( [
    'class' => 'wp-block-my-plugin-custom-card',
] );
?>

<div <?php echo $wrapper_attributes; // Already escaped by WP. ?>>
    <?php if ( $media_url ) : ?>
        <div class="wp-block-my-plugin-custom-card__image">
            <img src="<?php echo esc_url( $media_url ); ?>" alt="" loading="lazy" />
        </div>
    <?php endif; ?>

    <?php if ( $heading ) : ?>
        <h3 class="wp-block-my-plugin-custom-card__heading">
            <?php echo wp_kses_post( $heading ); ?>
        </h3>
    <?php endif; ?>

    <?php if ( $content ) : ?>
        <p class="wp-block-my-plugin-custom-card__content">
            <?php echo wp_kses_post( $content ); ?>
        </p>
    <?php endif; ?>
</div>
```

## Block Registration in PHP

```php
add_action( 'init', function (): void {
    // Register a block from block.json (recommended).
    register_block_type( MY_PLUGIN_PATH . 'blocks/custom-card' );

    // Register a dynamic block without block.json.
    register_block_type( 'my-plugin/latest-posts', [
        'api_version'     => 3,
        'attributes'      => [
            'count' => [
                'type'    => 'number',
                'default' => 5,
            ],
        ],
        'render_callback' => function ( array $attributes ): string {
            $count = absint( $attributes['count'] ?? 5 );

            $posts = get_posts( [
                'numberposts' => $count,
                'post_status' => 'publish',
            ] );

            if ( empty( $posts ) ) {
                return '<p>' . esc_html__( 'No posts found.', 'my-plugin' ) . '</p>';
            }

            $output = '<ul class="wp-block-my-plugin-latest-posts">';
            foreach ( $posts as $post ) {
                $output .= sprintf(
                    '<li><a href="%s">%s</a></li>',
                    esc_url( get_permalink( $post ) ),
                    esc_html( get_the_title( $post ) )
                );
            }
            $output .= '</ul>';

            wp_reset_postdata();

            return $output;
        },
    ] );
} );
```

## Block Patterns

```php
add_action( 'init', function (): void {
    register_block_pattern_category( 'my-plugin', [
        'label' => __( 'My Plugin Patterns', 'my-plugin' ),
    ] );

    register_block_pattern( 'my-plugin/hero-section', [
        'title'       => __( 'Hero Section', 'my-plugin' ),
        'description' => __( 'A full-width hero section with heading and CTA.', 'my-plugin' ),
        'categories'  => [ 'my-plugin' ],
        'content'     => '<!-- wp:cover {"dimRatio":60,"minHeight":500,"align":"full"} -->
<div class="wp-block-cover alignfull" style="min-height:500px">
<span aria-hidden="true" class="wp-block-cover__background has-background-dim-60 has-background-dim"></span>
<div class="wp-block-cover__inner-container">
<!-- wp:heading {"textAlign":"center","level":1} -->
<h1 class="wp-block-heading has-text-align-center">Welcome to Our Site</h1>
<!-- /wp:heading -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Get Started</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
</div>
<!-- /wp:cover -->',
    ] );
} );
```

## InnerBlocks Pattern

```jsx
// For a container block that allows nested blocks:
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [ 'core/heading', 'core/paragraph', 'core/image', 'core/button' ];
const TEMPLATE = [
    [ 'core/heading', { placeholder: 'Section Title' } ],
    [ 'core/paragraph', { placeholder: 'Section content...' } ],
];

export default function Edit() {
    const blockProps = useBlockProps();
    return (
        <div { ...blockProps }>
            <InnerBlocks
                allowedBlocks={ ALLOWED_BLOCKS }
                template={ TEMPLATE }
                templateLock={ false }
            />
        </div>
    );
}

export function Save() {
    const blockProps = useBlockProps.save();
    return (
        <div { ...blockProps }>
            <InnerBlocks.Content />
        </div>
    );
}
```

## Build Setup with @wordpress/scripts

```json
{
    "scripts": {
        "build": "wp-scripts build",
        "start": "wp-scripts start",
        "lint:js": "wp-scripts lint-js",
        "lint:css": "wp-scripts lint-style",
        "format": "wp-scripts format"
    },
    "devDependencies": {
        "@wordpress/scripts": "^27.0.0"
    }
}
```

Directory structure for blocks:
```
src/
├── blocks/
│   ├── custom-card/
│   │   ├── block.json
│   │   ├── edit.js
│   │   ├── save.js (or render.php for dynamic)
│   │   ├── index.js (entry point)
│   │   ├── style.scss (frontend + editor)
│   │   └── editor.scss (editor only)
│   └── latest-posts/
│       ├── block.json
│       ├── edit.js
│       ├── index.js
│       └── render.php
└── index.js (registers all blocks)
```

Entry point `src/index.js`:
```js
import './blocks/custom-card';
import './blocks/latest-posts';
```

Block entry `src/blocks/custom-card/index.js`:
```js
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit';
import Save from './save';
import './style.scss';
import './editor.scss';

registerBlockType( metadata.name, {
    edit: Edit,
    save: Save,
} );
```
