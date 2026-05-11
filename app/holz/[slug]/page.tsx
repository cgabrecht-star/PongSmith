import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  loadBladeBySlug,
  loadTopSynergiesForProduct,
  loadSimilarProducts,
} from "@/lib/product-detail";
import { ProductDetailView } from "@/components/product-detail-view";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { config } from "@/lib/config";

export const revalidate = 86400;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadBladeBySlug(slug);
  if (!product) {
    return { title: "Holz nicht gefunden" };
  }

  const title = `${product.name} — Test, Specs & Empfehlung`;
  const description = product.description
    ? product.description.substring(0, 155).replace(/\s+\S*$/, "") + "…"
    : `${product.name} von ${product.manufacturer.name}: Speed ${product.speed ?? "?"}/10, Kontrolle ${product.control ?? "?"}/10. ${product.reviewCount} Community-Reviews. Passende Beläge & Empfehlung.`;

  return {
    title,
    description,
    alternates: { canonical: `${config.siteUrl}/holz/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${config.siteUrl}/holz/${product.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HolzDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await loadBladeBySlug(slug);
  if (!product) notFound();

  const [synergies, similar] = await Promise.all([
    loadTopSynergiesForProduct("blade", product.id, 5),
    loadSimilarProducts("blade", product, 4),
  ]);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? `${product.name} von ${product.manufacturer.name}`,
    brand: { "@type": "Brand", name: product.manufacturer.name },
    category: "Tischtennis-Holz",
    image: product.imageUrl ?? undefined,
    ...(product.reviewCount > 0 && product.speed !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (((product.speed ?? 0) + (product.control ?? 0)) / 2).toFixed(1),
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
      { "@type": "ListItem", position: 3, name: "Hölzer", item: `${config.siteUrl}/sortiment?type=blade` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${config.siteUrl}/holz/${product.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 antialiased">
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
      <Navbar />
      <ProductDetailView product={product} synergies={synergies} similar={similar} />
      <Footer />
    </div>
  );
}
