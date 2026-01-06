/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/home/DisciplineCard.tsx
 * Creato: 2025-12-29
 * Aggiornato: 2026-01-06 - Convertito a componente dinamico con dati CMS
 * Descrizione: Card disciplina per homepage - riceve dati da CMS
 * =============================================================================
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Fish,
  Anchor,
  Ship,
  Waves,
  Target,
  Compass,
  Sailboat,
  TreePine,
  Mountain,
  Tent,
  ArrowDown,
  Sunrise,
  Wind,
  Package,
  Droplets,
  Zap,
  Trophy,
  Users,
  LucideIcon,
} from "lucide-react";

// Icon mapping from string to Lucide component
const iconMap: Record<string, LucideIcon> = {
  Fish,
  Anchor,
  Ship,
  Waves,
  Target,
  Compass,
  Sailboat,
  TreePine,
  Mountain,
  Tent,
  ArrowDown,
  Sunrise,
  Wind,
  Package,
  Droplets,
  Zap,
  Trophy,
  Users,
};

// Type for discipline from CMS
interface Discipline {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  category: string;
}

export interface DisciplineCardProps {
  discipline: Discipline;
  variant: "sea" | "freshwater";
}

export function DisciplineCard({ discipline, variant }: DisciplineCardProps) {
  const Icon = iconMap[discipline.icon] || Fish;

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
              {discipline.name}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {discipline.subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {discipline.description}
        </p>
      </CardContent>
    </Card>
  );
}
