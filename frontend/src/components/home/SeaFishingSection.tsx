/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/home/SeaFishingSection.tsx
 * Creato: 2025-12-29
 * Aggiornato: 2026-01-06 - Convertito a componente dinamico con dati CMS
 * Descrizione: Sezione discipline mare della homepage
 * =============================================================================
 */

import { Anchor } from "lucide-react";
import { DisciplineCard } from "./DisciplineCard";

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

interface SeaFishingSectionProps {
  disciplines: Discipline[];
}

export function SeaFishingSection({ disciplines }: SeaFishingSectionProps) {
  return (
    <section className="py-16 md:py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
            <Anchor className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Pesca in Mare</h2>
            <p className="text-muted-foreground">{disciplines.length} discipline</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {disciplines.map((discipline) => (
            <DisciplineCard
              key={discipline.id}
              discipline={discipline}
              variant="sea"
            />
          ))}
        </div>

        {/* Empty state */}
        {disciplines.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Discipline in caricamento...</p>
          </div>
        )}
      </div>
    </section>
  );
}
