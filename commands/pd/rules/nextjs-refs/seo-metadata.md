# NextJS SEO & Metadata Reference

## Static Metadata
```tsx
// app/layout.tsx — metadata toàn cục + title template
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Tên Website',
    template: '%s | Tên Website',  // Page con: "Sản phẩm | Tên Website"
  },
  description: 'Mô tả website, tối đa 160 ký tự.',
  keywords: ['từ khóa 1', 'từ khóa 2'],
  openGraph: {
    type: 'website',
    siteName: 'Tên Website',
    locale: 'vi_VN',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  robots: { index: true, follow: true },
};
```

```tsx
// app/about/page.tsx — page con kế thừa, chỉ khai báo riêng
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giới thiệu',                    // → "Giới thiệu | Tên Website"
  description: 'Giới thiệu về công ty.',
};
```

## Dynamic Metadata — generateMetadata
```tsx
// app/products/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchFromApi } from '@/lib/api';

interface PageProps { params: { slug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await fetchFromApi<Product | null>(`/products/${params.slug}`);
  if (!product) return { title: 'Không tìm thấy' };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [{ url: product.image, width: 800, height: 600, alt: product.name }],
    },
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await fetchFromApi<Product | null>(`/products/${params.slug}`);
  if (!product) notFound();
  return <div style={{ padding: 24 }}><h1>{product.name}</h1></div>;
}
```

## Sitemap
```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  // Trang tĩnh
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Trang động
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchFromApi<{ slug: string; updatedAt: string }[]>('/products/slugs');
    productPages = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch { /* API lỗi → trả sitemap tĩnh */ }

  return [...staticPages, ...productPages];
}
```

## Robots
```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/checkout/'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

## JSON-LD — Structured Data
```tsx
// components/seo/JsonLd.tsx
interface JsonLdProps { data: Record<string, unknown> }

export default function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

```tsx
// Sử dụng trong page sản phẩm
import JsonLd from '@/components/seo/JsonLd';

export default async function ProductPage({ params }: PageProps) {
  const product = await fetchFromApi<Product>(`/products/${params.slug}`);

  const productSchema = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: product.name, description: product.description, image: product.image,
    offers: { '@type': 'Offer', price: product.price, priceCurrency: 'VND', availability: 'https://schema.org/InStock' },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://example.com' },
      { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: 'https://example.com/products' },
      { '@type': 'ListItem', position: 3, name: product.name },
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div style={{ padding: 24 }}><h1>{product.name}</h1></div>
    </>
  );
}
```

## SEO Checklist
```
✅ Mỗi page có title + description riêng (generateMetadata cho trang động)
✅ Title template ở root layout: "%s | Tên Website"
✅ Open Graph image 1200x630 cho page quan trọng
✅ Canonical URL cho trang có nhiều đường dẫn
✅ sitemap.ts tự động, robots.ts disallow /admin /api /checkout
✅ JSON-LD cho sản phẩm (Product), bài viết (Article), breadcrumbs
✅ h1 duy nhất mỗi page, image có alt + width/height
✅ NEXT_PUBLIC_SITE_URL cho metadataBase — không hardcode domain
```
