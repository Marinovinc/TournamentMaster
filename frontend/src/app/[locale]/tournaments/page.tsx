/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/tournaments/page.tsx
 * Creato: 2025-12-29
 * Aggiornato: 2025-12-29 - Aggiunta ricerca e paginazione
 * Descrizione: Pagina lista tornei con filtri, ricerca e paginazione
 *
 * Dipendenze:
 * - @/components/tournament (TournamentCard)
 * - @/components/ui/tabs (shadcn)
 * - @/components/ui/input (shadcn)
 *
 * API:
 * - GET /api/tournaments
 * =============================================================================
 */

import Link from "next/link";
import { TournamentCard, Tournament } from "@/components/tournament";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Clock, Calendar, CheckCircle, Home, Search } from "lucide-react";
import { TournamentSearch } from "./TournamentSearch";
import { HelpGuide } from "@/components/HelpGuide";

interface TournamentsResponse {
  success: boolean;
  data: Tournament[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getTournaments(): Promise<Tournament[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/tournaments?limit=100`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch tournaments");
    }

    const data: TournamentsResponse = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
}

export default async function TournamentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tournaments = await getTournaments();

  // Filtra tornei per stato
  const ongoing = tournaments.filter((t) => t.status === "ONGOING");
  const upcoming = tournaments.filter((t) => t.status === "PUBLISHED");
  const completed = tournaments.filter((t) => t.status === "COMPLETED");
  const all = tournaments.filter((t) => t.status !== "DRAFT" && t.status !== "CANCELLED");

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            <Trophy className="inline h-8 w-8 mr-3 text-primary" />
            Tornei
          </h1>
          <HelpGuide pageKey="tournaments" position="inline" />
        </div>
        <p className="text-muted-foreground text-lg">
          Scopri e partecipa ai tornei di pesca nella tua zona
        </p>
      </div>

      {/* Search and Filters - Client Component */}
      <TournamentSearch
        tournaments={all}
        ongoing={ongoing}
        upcoming={upcoming}
        completed={completed}
        locale={locale}
      />
    </main>
  );
}
