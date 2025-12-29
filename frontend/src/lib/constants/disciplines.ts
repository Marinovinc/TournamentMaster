/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx
 * Data refactoring: 2025-12-29
 * Motivo: Separazione costanti per riutilizzo e manutenibilita
 *
 * Contiene:
 * - Mapping icone per ogni disciplina
 * - Array discipline mare (9)
 * - Array discipline acque interne (8)
 *
 * Utilizzato da:
 * - src/components/home/DisciplineCard.tsx
 * - src/components/home/SeaFishingSection.tsx
 * - src/components/home/FreshwaterSection.tsx
 * - src/app/[locale]/page.tsx
 * =============================================================================
 */

import {
  Anchor,
  Waves,
  Fish,
  Ship,
  Target,
  Compass,
  TreePine,
  Droplets,
  Mountain,
  Award,
  Users,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Mapping icone Lucide per ogni disciplina di pesca
 * Chiavi usano snake_case per consistenza con i18n
 */
export const disciplineIcons: Record<string, LucideIcon> = {
  // Discipline mare (9)
  big_game: Ship,
  drifting: Waves,
  traina_costiera: Anchor,
  vertical_jigging: Target,
  bolentino: Compass,
  eging: Fish,
  spinning_mare: Target,
  surfcasting: Waves,
  shore: Anchor,
  // Discipline acque interne (8)
  fly_fishing: Sparkles,
  spinning_fiume: Target,
  carpfishing: Fish,
  feeder: Droplets,
  trota_lago: Mountain,
  trota_torrente: TreePine,
  bass_fishing: Fish,
  colpo: Award,
  // Altro
  social: Users,
};

/**
 * Discipline pesca in mare (9 totali)
 * Ordine: dalla piu tecnica alla piu accessibile
 */
export const seaDisciplines = [
  "big_game",
  "drifting",
  "traina_costiera",
  "vertical_jigging",
  "bolentino",
  "eging",
  "spinning_mare",
  "surfcasting",
  "shore",
] as const;

/**
 * Discipline pesca acque interne (8 totali)
 * Ordine: dalla piu tecnica alla piu accessibile
 */
export const freshwaterDisciplines = [
  "fly_fishing",
  "spinning_fiume",
  "carpfishing",
  "feeder",
  "trota_lago",
  "trota_torrente",
  "bass_fishing",
  "colpo",
] as const;

// Type helpers
export type SeaDiscipline = typeof seaDisciplines[number];
export type FreshwaterDiscipline = typeof freshwaterDisciplines[number];
export type Discipline = SeaDiscipline | FreshwaterDiscipline | "social";
