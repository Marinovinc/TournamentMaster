/**
 * =============================================================================
 * MY BOAT PAGE - Dashboard Participant
 * =============================================================================
 * Pagina per visualizzare/modificare i dati della propria barca
 * Utilizza il componente BoatsSection
 * =============================================================================
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { BoatsSection } from "@/components/user";
import { Loader2 } from "lucide-react";

export default function MyBoatPage() {
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
        <h1 className="text-2xl font-bold">La Mia Barca</h1>
        <p className="text-muted-foreground">
          Gestisci i dati della tua imbarcazione
        </p>
      </div>

      <BoatsSection primaryColor="#0066CC" />
    </div>
  );
}
