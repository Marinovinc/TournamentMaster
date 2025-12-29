/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx (righe 75-112)
 * Data refactoring: 2025-12-29
 * Motivo: Componente riutilizzabile per card disciplina
 *
 * Funzionalita:
 * - Mostra icona, titolo, sottotitolo e descrizione disciplina
 * - Supporta varianti "sea" (blu) e "freshwater" (verde)
 * - Effetti hover con animazioni
 *
 * Props:
 * - disciplineKey: chiave i18n della disciplina (es. "big_game")
 * - variant: "sea" | "freshwater" per colori
 *
 * Dipendenze:
 * - src/lib/constants/disciplines.ts (icone)
 * - next-intl (traduzioni)
 * - shadcn/ui (Card components)
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish } from "lucide-react";
import { disciplineIcons } from "@/lib/constants/disciplines";

export interface DisciplineCardProps {
  disciplineKey: string;
  variant: "sea" | "freshwater";
}

export function DisciplineCard({ disciplineKey, variant }: DisciplineCardProps) {
  const t = useTranslations();
  const Icon = disciplineIcons[disciplineKey] || Fish;

  const hoverClass = variant === "sea" ? "card-hover-sea" : "card-hover-freshwater";
  const iconBgClass = variant === "sea"
    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";

  return (
    <Card className={`${hoverClass} cursor-pointer group border-0 shadow-md hover:shadow-xl`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${iconBgClass} group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold">
              {t(`tournament.disciplines.${disciplineKey}`)}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {t(`home.disciplines.${disciplineKey}.subtitle`)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(`home.disciplines.${disciplineKey}.description`)}
        </p>
      </CardContent>
    </Card>
  );
}
