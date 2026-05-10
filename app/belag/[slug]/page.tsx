import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  loadRubberBySlug,
  loadTopSynergiesForProduct,
  loadSimilarProducts,
} from "@/lib/product-detail";
import { ProductDetailView } from "@/components/product-detail-view";
import { config } from "@/lib/config";

// Page wird on-demand server-rendered + 24 h Cache (ISR-Light)
export const revalidate = 86400;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─── SEO Metadata pro Page ────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadRubberBySlug(slug);
  if (!product) {
    return { title: "Belag nicht gefunden" };
  }

  const title = `${product.name} — Test, Specs & Empfehlung`;
  const description = product.description
    ? product.description.substring(0, 155).replace(/\s+\S*$/, "") + "…"
    : `${product.name} von ${product.manufacturer.name}: Speed ${product.speed ?? "?"}/10, Spin ${product.spin ?? "?"}/10, Kontrolle ${product.control ?? "?"}/10. ${product.reviewCount} Community-Reviews. Passende Hölzer & Empfehlung.`;

  return {
    title,
    description,
    alternates: { canonical: `${config.siteUrl}/belag/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${config.siteUrl}/belag/${product.slug}`,
      // og-image wird automatisch aus opengraph-image.tsx in dieser Route gezogen
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function BelagDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await loadRubberBySlug(slug);
  if (!product) notFound();

  const [synergies, similar] = await Promise.all([
    loadTopSynergiesForProduct("rubber", product.id, 5),
    loadSimilarProducts("rubber", product, 4),
  ]);

  // Schema.org Product + BreadcrumbList
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? `${product.name} von ${product.manufacturer.name}`,
    brand: { "@type": "Brand", name: product.manufacturer.name },
    category: "Tischtennis-Belag",
    image: product.imageUrl ?? undefined,
    ...(product.reviewCount > 0 && product.speed !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (((product.speed ?? 0) + (product.spin ?? 0) + (product.control ?? 0)) / 3).toFixed(1),
            bestRating: "10",
            worstRating: "1",
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: config.siteUrl },
      { "@type": "ListItem", position: 2, name: "Sortiment", item: `${config.siteUrl}/sortiment` },
      { "@type": "ListItem", position: 3, name: "Beläge", item: `${config.siteUrl}/sortiment?type=rubber` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${config.siteUrl}/belag/${product.slug}` },
    ],
  };

  return (
    <>
      <Script
        id="schema-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailView product={product} synergies={synergies} similar={similar} />
    </>
  );
}
