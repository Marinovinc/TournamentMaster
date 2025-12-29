/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx (righe 267-292)
 * Data refactoring: 2025-12-29
 * Motivo: Sezione eventi sociali separata per manutenibilita
 *
 * Funzionalita:
 * - Card con gradiente amber/orange
 * - Icona Users
 * - Descrizione eventi sociali
 * - Link a tornei filtrati per tipo social
 *
 * Stili custom:
 * - Gradiente from-amber-50 to-orange-50 (light mode)
 * - Gradiente from-amber-950/30 to-orange-950/30 (dark mode)
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";

export function SocialEventsSection() {
  const t = useTranslations();

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-0 shadow-lg">
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
              <Users className="h-8 w-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                {t("tournament.disciplines.social")}
              </h3>
              <p className="text-muted-foreground max-w-xl">
                {t("home.disciplines.social.description")}
              </p>
            </div>
            <Link href="/tournaments?type=social">
              <Button variant="secondary" size="lg">
                {t("nav.tournaments")}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
