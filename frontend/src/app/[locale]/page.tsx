/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File refactored: 2025-12-29
 * Linee originali: 310
 * Linee dopo refactoring: ~40
 *
 * Componenti estratti:
 * - src/lib/constants/disciplines.ts (icone e array discipline)
 * - src/components/home/DisciplineCard.tsx
 * - src/components/home/HeroSection.tsx
 * - src/components/home/SeaFishingSection.tsx
 * - src/components/home/FreshwaterSection.tsx
 * - src/components/home/SocialEventsSection.tsx
 * - src/components/layout/Header.tsx
 * - src/components/layout/Footer.tsx
 *
 * Vedi anche:
 * - src/components/home/index.ts (barrel exports)
 * - src/components/layout/index.ts (barrel exports)
 * =============================================================================
 */

import { Header, Footer } from "@/components/layout";
import {
  HeroSection,
  SeaFishingSection,
  FreshwaterSection,
  SocialEventsSection,
  FeaturesSection,
  MobileAppSection,
} from "@/components/home";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <MobileAppSection />
      <SeaFishingSection />
      <FreshwaterSection />
      <SocialEventsSection />
      <Footer />
    </div>
  );
}
