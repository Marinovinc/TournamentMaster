/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/home/SocialEventsSection.tsx
 * Creato: 2025-12-29
 * Aggiornato: 2026-01-06 - Convertito a componente dinamico con dati CMS
 * Descrizione: Sezione eventi sociali della homepage
 * =============================================================================
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";

interface SocialEventsSectionProps {
  title: string;
  description: string;
  buttonText: string;
}

export function SocialEventsSection({ title, description, buttonText }: SocialEventsSectionProps) {

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
                {title}
              </h3>
              <p className="text-muted-foreground max-w-xl">
                {description}
              </p>
            </div>
            <Link href="/tournaments?type=social">
              <Button variant="secondary" size="lg">
                {buttonText}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
