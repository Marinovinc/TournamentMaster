/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/features/page.tsx
 * Creato: 2026-01-02
 * Aggiornato: 2026-01-05 - Convertito a pagina dinamica con fetch da API CMS
 * Descrizione: Features - Pagina funzionalita della piattaforma
 * =============================================================================
 */

import Link from "next/link";
import {
  Home,
  Sparkles,
  Trophy,
  Camera,
  MapPin,
  BarChart3,
  Users,
  Bell,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Clock,
  CheckCircle,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Icon mapping from string to Lucide component
const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Camera,
  MapPin,
  BarChart3,
  Users,
  Bell,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Clock,
  CheckCircle,
  Home,
  Sparkles,
};

// Type for feature from API
interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  sortOrder: number;
}

// Fetch features from CMS API
async function getFeatures(locale: string): Promise<Feature[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  try {
    const res = await fetch(`${apiUrl}/api/cms/features?locale=${locale}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      console.error("Failed to fetch features:", res.status);
      return [];
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching features:", error);
    return [];
  }
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const features = await getFeatures(locale);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <Badge className="mb-4 px-4 py-1.5">
          <Sparkles className="h-4 w-4 mr-2" />
          Funzionalita Complete
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Tutto cio che serve per i tuoi <span className="text-primary">Tornei di Pesca</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          TournamentMaster offre una suite completa di strumenti per organizzatori
          e partecipanti. Dalla creazione del torneo alla premiazione finale.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = iconMap[feature.icon] || CheckCircle;
          return (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {features.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nessuna funzionalita disponibile al momento.</p>
        </div>
      )}

      {/* CTA Section */}
      <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Pronto per iniziare?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Registrati gratuitamente come partecipante o scopri i piani per organizzatori.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href={`/${locale}/register`}>
              Registrati Gratis
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/${locale}/pricing`}>
              Vedi Piani Organizzatori
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
