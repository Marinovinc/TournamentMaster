/**
 * =============================================================================
 * MY TEAM PAGE - Dashboard Participant
 * =============================================================================
 * Pagina per visualizzare/modificare i dati dell'equipaggio
 * Utilizza il componente SkipperSection
 * =============================================================================
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SkipperSection } from "@/components/user";
import { Loader2 } from "lucide-react";

export default function MyTeamPage() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Il Mio Equipaggio</h1>
        <p className="text-muted-foreground">
          Gestisci skipper e membri del team
        </p>
      </div>

      <SkipperSection primaryColor="#0066CC" />
    </div>
  );
}
