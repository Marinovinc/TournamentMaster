/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/home/FeaturesSection.tsx
 * Creato: 2025-12-29
 * Descrizione: Sezione features della homepage - stile CatchStat migliorato
 *
 * Features mostrate:
 * - Gestione iscrizioni e categorie
 * - Classifiche live in tempo reale
 * - Validazione GPS delle catture
 * - Foto verificate con metadata
 * - Multi-tenant per circuiti
 * - Supporto multilingua
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  Trophy,
  MapPin,
  Camera,
  Building2,
  Globe,
  Shield,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestione Iscrizioni",
    description: "Registrazioni online, categorie multiple, pagamenti integrati e gestione squadre completa.",
    color: "blue",
  },
  {
    icon: Trophy,
    title: "Classifiche Real-time",
    description: "Leaderboard aggiornate in tempo reale durante tutto il torneo con punteggi automatici.",
    color: "amber",
  },
  {
    icon: MapPin,
    title: "Validazione GPS",
    description: "Ogni cattura viene geolocalizzata per verificare che sia all'interno delle zone di pesca autorizzate.",
    color: "emerald",
  },
  {
    icon: Camera,
    title: "Foto Certificate",
    description: "Sistema di verifica foto con analisi EXIF, timestamp e coordinate per garantire autenticità.",
    color: "purple",
  },
  {
    icon: Building2,
    title: "Multi-Circuito",
    description: "Piattaforma multi-tenant: ogni associazione o circuito gestisce i propri tornei in autonomia.",
    color: "rose",
  },
  {
    icon: Globe,
    title: "Multilingua",
    description: "Interfaccia disponibile in italiano, inglese, tedesco e spagnolo per pescatori internazionali.",
    color: "cyan",
  },
];

const colorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export function FeaturesSection() {
  const t = useTranslations();

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
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex p-3 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>

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
