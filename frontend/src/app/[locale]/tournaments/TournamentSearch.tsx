/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/tournaments/TournamentSearch.tsx
 * Creato: 2025-12-29
 * Descrizione: Componente client per ricerca e filtri tornei
 *
 * Features:
 * - Ricerca per nome torneo
 * - Filtri per stato (tabs)
 * - Paginazione "Load More"
 * - Conteggi dinamici
 * =============================================================================
 */

"use client";

import { useState, useMemo } from "react";
import { TournamentCard, Tournament } from "@/components/tournament";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Calendar, CheckCircle, Search, ChevronDown, X } from "lucide-react";

interface TournamentSearchProps {
  tournaments: Tournament[];
  ongoing: Tournament[];
  upcoming: Tournament[];
  completed: Tournament[];
  locale: string;
}

const ITEMS_PER_PAGE = 6;

export function TournamentSearch({
  tournaments,
  ongoing,
  upcoming,
  completed,
  locale,
}: TournamentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Filtra tornei in base alla ricerca
  const filterBySearch = (items: Tournament[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.location.toLowerCase().includes(query) ||
        t.tenant.name.toLowerCase().includes(query)
    );
  };

  // Tornei filtrati per ogni tab
  const filteredAll = useMemo(() => filterBySearch(tournaments), [tournaments, searchQuery]);
  const filteredOngoing = useMemo(() => filterBySearch(ongoing), [ongoing, searchQuery]);
  const filteredUpcoming = useMemo(() => filterBySearch(upcoming), [upcoming, searchQuery]);
  const filteredCompleted = useMemo(() => filterBySearch(completed), [completed, searchQuery]);

  // Tornei da mostrare nel tab corrente
  const getCurrentTabItems = () => {
    switch (activeTab) {
      case "ongoing":
        return filteredOngoing;
      case "upcoming":
        return filteredUpcoming;
      case "completed":
        return filteredCompleted;
      default:
        return filteredAll;
    }
  };

  const currentItems = getCurrentTabItems();
  const visibleItems = currentItems.slice(0, visibleCount);
  const hasMore = visibleCount < currentItems.length;

  // Reset paginazione quando cambia tab o ricerca
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cerca tornei per nome, luogo o organizzatore..."
          className="pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Risultati ricerca */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {currentItems.length} {currentItems.length === 1 ? "torneo trovato" : "tornei trovati"} per "{searchQuery}"
        </p>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Tutti</span>
            <span className="text-xs bg-muted px-1.5 rounded">{filteredAll.length}</span>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            <span className="hidden sm:inline">In Corso</span>
            <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded dark:bg-red-900/30">{filteredOngoing.length}</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="hidden sm:inline">Prossimi</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded dark:bg-blue-900/30">{filteredUpcoming.length}</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">Conclusi</span>
            <span className="text-xs bg-green-100 text-green-600 px-1.5 rounded dark:bg-green-900/30">{filteredCompleted.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Content for all tabs - unified rendering */}
        <TabsContent value={activeTab} className="mt-0">
          {visibleItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleItems.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} locale={locale} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={loadMore}
                    className="gap-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Carica altri ({currentItems.length - visibleCount} rimanenti)
                  </Button>
                </div>
              )}

              {/* Showing count */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Mostrando {visibleItems.length} di {currentItems.length} tornei
              </p>
            </>
          ) : (
            <EmptyState
              message={
                searchQuery
                  ? `Nessun torneo trovato per "${searchQuery}"`
                  : activeTab === "ongoing"
                  ? "Nessun torneo in corso al momento"
                  : activeTab === "upcoming"
                  ? "Nessun torneo in programma"
                  : activeTab === "completed"
                  ? "Nessun torneo concluso"
                  : "Nessun torneo disponibile"
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p>{message}</p>
    </div>
  );
}
