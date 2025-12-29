/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx (righe 213-238)
 * Data refactoring: 2025-12-29
 * Motivo: Sezione discipline mare separata per manutenibilita
 *
 * Funzionalita:
 * - Header sezione con icona ancora
 * - Griglia 3 colonne di DisciplineCard
 * - 9 discipline mare
 *
 * Dipendenze:
 * - src/lib/constants/disciplines.ts (seaDisciplines)
 * - src/components/home/DisciplineCard.tsx
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Anchor } from "lucide-react";
import { DisciplineCard } from "./DisciplineCard";
import { seaDisciplines } from "@/lib/constants/disciplines";

export function SeaFishingSection() {
  const t = useTranslations();

  return (
    <section className="py-16 md:py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
            <Anchor className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t("home.seaFishingTitle")}</h2>
            <p className="text-muted-foreground">9 {t("home.disciplinesTitle").toLowerCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {seaDisciplines.map((discipline) => (
            <DisciplineCard
              key={discipline}
              disciplineKey={discipline}
              variant="sea"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
