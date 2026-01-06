/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/page.tsx
 * Aggiornato: 2026-01-05 - Convertito a pagina dinamica con fetch da API CMS
 * Descrizione: Homepage con dati dinamici dal CMS
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

// Types for CMS data
interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
}

interface Discipline {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  category: string;
}

interface SocialSection {
  title: string;
  description: string;
  buttonText: string;
}

interface CMSData {
  features: Feature[];
  disciplines: Discipline[];
  socialSection: SocialSection;
}

// Fetch CMS data server-side
async function getCMSData(locale: string): Promise<CMSData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  try {
    const [featuresRes, disciplinesRes, socialRes] = await Promise.all([
      fetch(`${apiUrl}/api/cms/features?locale=${locale}`, {
        next: { revalidate: 60 },
      }),
      fetch(`${apiUrl}/api/cms/disciplines?locale=${locale}`, {
        next: { revalidate: 60 },
      }),
      fetch(`${apiUrl}/api/cms/social-section?locale=${locale}`, {
        next: { revalidate: 60 },
      }),
    ]);

    const featuresData = featuresRes.ok ? await featuresRes.json() : { success: false };
    const disciplinesData = disciplinesRes.ok ? await disciplinesRes.json() : { success: false };
    const socialData = socialRes.ok ? await socialRes.json() : { success: false };

    // Default social section content
    const defaultSocialSection: SocialSection = {
      title: "Eventi Sociali",
      description: "Partecipa ai nostri eventi sociali e incontra altri appassionati di pesca.",
      buttonText: "Scopri i Tornei",
    };

    return {
      features: featuresData.success ? featuresData.data : [],
      disciplines: disciplinesData.success ? disciplinesData.data : [],
      socialSection: socialData.success ? socialData.data : defaultSocialSection,
    };
  } catch (error) {
    console.error("Error fetching CMS data:", error);
    return {
      features: [],
      disciplines: [],
      socialSection: {
        title: "Eventi Sociali",
        description: "Partecipa ai nostri eventi sociali e incontra altri appassionati di pesca.",
        buttonText: "Scopri i Tornei",
      },
    };
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { features, disciplines, socialSection } = await getCMSData(locale);

  // Filter disciplines by category
  const seaDisciplines = disciplines.filter(d => d.category === "sea");
  const freshwaterDisciplines = disciplines.filter(d => d.category === "freshwater");

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection features={features} />
      <MobileAppSection />
      <SeaFishingSection disciplines={seaDisciplines} />
      <FreshwaterSection disciplines={freshwaterDisciplines} />
      <SocialEventsSection
        title={socialSection.title}
        description={socialSection.description}
        buttonText={socialSection.buttonText}
      />
      <Footer />
    </div>
  );
}
