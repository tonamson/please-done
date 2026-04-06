# Implementation Notes: Figma to HTML

> Purpose: document issues that need standardization before building a workflow/skill for converting Figma designs to HTML
> Date: 22_03_2026

## Current Issues

AI converting Figma to HTML commonly encounters these errors:

- responsive is wrong or missing breakpoints
- missing pages / missing sections / missing states
- HTML deviates from Figma design
- spacing, font, color, radius, shadow don't match
- exported assets are heavy, not optimized for web
- file/page names from Figma are inconsistent across deployment environments
- different errors between Linux / Ubuntu / Windows due to path differences and case sensitivity

## Goals

The Figma conversion process must:

- closely follow the design
- include all pages, sections, and states
- have clear responsive behavior
- have stable file/folder/asset names, cross-platform
- optimize images for web
- be easy to verify with a checklist

## Mandatory Standardization Rules

### 1. File Name Standardization

All page, section, component, and asset names when exported to code must use:

- `kebab-case`
- lowercase
- ASCII only
- no spaces
- no special characters

Examples:

- `Home Page` -> `home-page`
- `About Us` -> `about-us`
- `Hero Banner` -> `hero-banner`

Corresponding file names:

- `home-page.html`
- `about-us.html`
- `hero-banner.webp`

## 2. Cross-Platform Rules

To avoid errors between macOS / Linux / Ubuntu / Windows:

- don't use file names that only differ in letter case
- don't use spaces in file names
- don't use Vietnamese diacritics in paths
- import paths must match the actual file name exactly
- all assets/pages/components directories must use `kebab-case`

## 3. Asset Export Rules

Preferred formats:

- `svg` for icons, logos, vectors, shapes
- `webp` for raster images used on web
- only use `png/jpg` when truly needed as fallback

Asset rules:

- asset file names in `kebab-case`
- use clear semantic suffixes
- don't export images larger than necessary
- optimize file size before including in code

Examples:

- `home-page-hero.webp`
- `pricing-card-background.webp`
- `site-logo.svg`

## 4. Do Not Convert HTML Directly from Raw Frames

Before coding, there must be a design spec normalization step:

- page name
- route or file output
- screen type: page / modal / drawer / popup / section
- applicable breakpoints
- primary typography
- spacing system
- color tokens
- list of states
- list of assets to export

If this step is missing, AI is very likely to produce mismatched output.

## 5. Mandatory Frame-to-Page/Section/State Mapping

Each Figma frame must be clearly classified as:

- `page`
- `section`
- `modal`
- `drawer`
- `empty`
- `loading`
- `error`
- `success`

Don't let AI guess ambiguously.

## 6. Responsive Must Have Clear Specs

Don't start HTML conversion without determining:

- mobile breakpoint
- tablet breakpoint
- desktop breakpoint
- which sections stack
- which sections hide/show per breakpoint
- which images resize per breakpoint
- typography scale per breakpoint

If Figma doesn't specify responsive clearly:

- create a `responsive decision note`
- don't silently make decisions without documenting them

## 7. Cut by Component Then Assemble Page

Don't cut an entire page as one large block.

Follow this order:

1. analyze page structure
2. extract reusable components
3. define sections
4. assemble complete page
5. verify responsive

## 8. Post-Conversion HTML Checklist

After completing each page, cross-check against Figma:

- all pages included
- all sections included
- all states included
- layout correct
- spacing correct
- typography correct
- colors correct
- radius / border / shadow correct
- images correct
- mobile correct
- tablet correct
- desktop correct

## 9. Output Manifest Should Include

When deploying later, there should be a manifest or spec file clearly listing:

- original page name from Figma
- standardized slug
- output file
- route
- related assets
- related states
- applicable breakpoints

Example:

```md
- Figma: Home Page
- Slug: home-page
- Output: home-page.html
- Route: /
- Assets:
  - home-page-hero.webp
  - site-logo.svg
- States:
  - default
  - loading
  - error
```

## 10. Proposed Future Workflow

If building a dedicated skill/workflow later, split into these steps:

1. import list of frames/pages from Figma
2. normalize names + slugs + file names
3. determine page/section/state
4. determine responsive behavior
5. export assets following `svg/webp` rule
6. cut components
7. assemble HTML pages
8. run checklist against Figma
9. verify cross-platform path/name

## 11. Short Reusable Rules

```md
- Page/frame names from Figma must be normalized to kebab-case.
- Example: "Home Page" -> `home-page`
- Output file: `home-page.html`
- Raster assets prefer `webp`
- Vector assets prefer `svg`
- Don't use space / uppercase / special characters in file paths
- Don't start HTML conversion without a responsive spec
- Each frame must clearly map to page / section / state
- Mandatory checklist cross-check against Figma after conversion is done
```

## 12. Recommended Next Steps

- create a dedicated workflow or skill for `figma-to-html`
- create a manifest/spec template for page export
- add a standardized responsive checklist
- add a webp asset optimization rule
- add a visual QA step comparing against Figma design
