/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx (righe 154-211)
 * Data refactoring: 2025-12-29
 * Motivo: Sezione hero della homepage separata per manutenibilita
 *
 * Funzionalita:
 * - Badge "Piattaforma Tornei di Pesca"
 * - Titolo principale con gradient
 * - Descrizione hero
 * - CTA buttons (Registrati, Tornei)
 * - Feature highlights (GPS, Leaderboard, Multi-tenant)
 *
 * Stili custom utilizzati:
 * - bg-sea-gradient (definito in globals.css)
 * - bg-wave-pattern (definito in globals.css)
 * - text-gradient-sea (definito in globals.css)
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Timer,
  Users,
  Trophy,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export function HeroSection() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-sea-gradient opacity-5" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-wave-pattern opacity-50" />

      {/* Banner full-width */}
      <div className="w-full">
        <Image
          src="/banner.png"
          alt="TournamentMaster Banner"
          width={1920}
          height={400}
          className="w-full h-auto object-cover"
          priority
          sizes="100vw"
        />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 text-center relative">

        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
          <Sparkles className="h-3.5 w-3.5 mr-2" />
          {t("home.badge")}
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
          <span className="text-gradient-sea">{t("common.appName")}</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          {t("home.heroDescription")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto text-base px-8">
              {t("nav.register")}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/tournaments">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
              <Trophy className="h-4 w-4 mr-2" />
              {t("nav.tournaments")}
            </Button>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card shadow-sm">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="font-medium">GPS Validation</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card shadow-sm">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Timer className="h-5 w-5" />
            </div>
            <span className="font-medium">Real-time Leaderboards</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card shadow-sm">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-medium">Multi-tenant Platform</span>
          </div>
        </div>
      </div>
    </section>
  );
}
