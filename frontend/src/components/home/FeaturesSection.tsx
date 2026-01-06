/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/home/FeaturesSection.tsx
 * Creato: 2025-12-29
 * Aggiornato: 2026-01-05 - Convertito a componente dinamico con props da CMS
 * Descrizione: Sezione features della homepage - stile CatchStat migliorato
 * =============================================================================
 */

import {
  Users,
  Trophy,
  MapPin,
  Camera,
  Building2,
  Globe,
  Shield,
  Smartphone,
  Bell,
  Zap,
  Clock,
  CheckCircle,
  BarChart3,
  LucideIcon,
} from "lucide-react";

// Icon mapping from string to Lucide component
const iconMap: Record<string, LucideIcon> = {
  Users,
  Trophy,
  MapPin,
  Camera,
  Building2,
  Globe,
  Shield,
  Smartphone,
  Bell,
  Zap,
  Clock,
  CheckCircle,
  BarChart3,
};

// Color classes for badges
const badgeColors: Record<string, string> = {
  Core: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  Live: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  Sicurezza: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  Premium: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  Mobile: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  Global: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  Tech: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  Analytics: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  Ufficiale: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

// Type for feature from CMS
interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  // Show only first 6 features on homepage
  const displayFeatures = features.slice(0, 6);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tutto quello che serve per i tuoi tornei
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Una piattaforma completa per organizzare, gestire e partecipare a tornei di pesca sportiva di ogni tipo.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayFeatures.map((feature) => {
            const Icon = iconMap[feature.icon] || CheckCircle;
            const colorClass = badgeColors[feature.badge] || badgeColors.Core;
            return (
              <div
                key={feature.id}
                className="group p-6 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex p-3 rounded-xl ${colorClass} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {displayFeatures.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Funzionalita in caricamento...</p>
          </div>
        )}

        {/* Bottom CTA - Link to App Download */}
        <div className="mt-16 text-center">
          <a
            href="#download-app"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <Smartphone className="h-5 w-5" />
            <span className="font-medium">Scarica l&apos;app per iOS e Android</span>
          </a>
        </div>
      </div>
    </section>
  );
}
