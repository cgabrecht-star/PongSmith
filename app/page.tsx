import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TrustBand } from "@/components/landing/trust-band";
import { CtaSection } from "@/components/landing/cta-section";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

/**
 * Landing-Page nach neuer Design-Spec ("Halle am Spielabend").
 *
 * Reihenfolge:
 *  1. Sticky Navbar
 *  2. Hero (mit Live-Typing-Chat-Mockup)
 *  3. Features (Bento-Grid)
 *  4. HowItWorks (3 Steps)
 *  5. Trust-Band (Säulen + Counter + Marken-Marquee)
 *  6. CTA-Section
 *  7. FAQ (mit aufklappbarer Founder-Info + Selbstverpflichtung)
 *  8. Footer
 *
 * Der echte Berater-Flow lebt auf /berater.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 antialiased">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <TrustBand />
      <CtaSection />
      <Faq />
      <Footer />
    </div>
  );
}
