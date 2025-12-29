/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx (righe 240-265)
 * Data refactoring: 2025-12-29
 * Motivo: Sezione discipline acque interne separata per manutenibilita
 *
 * Funzionalita:
 * - Header sezione con icona pino
 * - Griglia 4 colonne di DisciplineCard
 * - 8 discipline acque interne
 *
 * Dipendenze:
 * - src/lib/constants/disciplines.ts (freshwaterDisciplines)
 * - src/components/home/DisciplineCard.tsx
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { TreePine } from "lucide-react";
import { DisciplineCard } from "./DisciplineCard";
import { freshwaterDisciplines } from "@/lib/constants/disciplines";

export function FreshwaterSection() {
  const t = useTranslations();

  return (
    <section className="py-16 md:py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <TreePine className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t("home.freshwaterFishingTitle")}</h2>
            <p className="text-muted-foreground">8 {t("home.disciplinesTitle").toLowerCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {freshwaterDisciplines.map((discipline) => (
            <DisciplineCard
              key={discipline}
              disciplineKey={discipline}
              variant="freshwater"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
