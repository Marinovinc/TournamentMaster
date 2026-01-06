const fs = require('fs');
const path = require('path');

const content = `/**
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

interface CMSData {
  features: Feature[];
  disciplines: Discipline[];
}

// Fetch CMS data server-side
async function getCMSData(locale: string): Promise<CMSData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  try {
    const [featuresRes, disciplinesRes] = await Promise.all([
      fetch(\`\${apiUrl}/api/cms/features?locale=\${locale}\`, {
        next: { revalidate: 60 },
      }),
      fetch(\`\${apiUrl}/api/cms/disciplines?locale=\${locale}\`, {
        next: { revalidate: 60 },
      }),
    ]);

    const featuresData = featuresRes.ok ? await featuresRes.json() : { success: false };
    const disciplinesData = disciplinesRes.ok ? await disciplinesRes.json() : { success: false };

    return {
      features: featuresData.success ? featuresData.data : [],
      disciplines: disciplinesData.success ? disciplinesData.data : [],
    };
  } catch (error) {
    console.error("Error fetching CMS data:", error);
    return { features: [], disciplines: [] };
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { features, disciplines } = await getCMSData(locale);

  // Filter disciplines by category
  const seaDisciplines = disciplines.filter(d => d.category === "sea");
  const freshwaterDisciplines = disciplines.filter(d => d.category === "freshwater");
  const socialDisciplines = disciplines.filter(d => d.category === "social");

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection features={features} />
      <MobileAppSection />
      <SeaFishingSection disciplines={seaDisciplines} />
      <FreshwaterSection disciplines={freshwaterDisciplines} />
      <SocialEventsSection disciplines={socialDisciplines} />
      <Footer />
    </div>
  );
}
`;

const targetPath = path.join(__dirname, 'src/app/[locale]/page.tsx');
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Homepage written to:', targetPath);
