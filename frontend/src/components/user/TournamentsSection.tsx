/**
 * =============================================================================
 * TOURNAMENTS SECTION - User Tournament Registrations
 * =============================================================================
 * Visualizza i tornei a cui l'utente e iscritto
 * Supporta viewUserId per visualizzazione admin
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Fish,
  Loader2,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { disciplineLabels } from '@/lib/disciplines';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Tournament {
  id: string;
  name: string;
  discipline: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  bannerImage?: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Registration {
  id: string;
  status: string;
  registeredAt: string;
  teamName?: string;
  boatName?: string;
  tournament: Tournament;
}

interface TournamentsSectionProps {
  primaryColor?: string;
  viewUserId?: string;
  readOnly?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PUBLISHED: { label: "In Programma", variant: "outline" },
  REGISTRATION_OPEN: { label: "Iscrizioni Aperte", variant: "default" },
  ONGOING: { label: "In Corso", variant: "default" },
  COMPLETED: { label: "Completato", variant: "secondary" },
};

// disciplineLabels importato da lib/disciplines

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  if (diffDays > 1 && diffDays <= 7) return `Tra ${diffDays} giorni`;
  if (diffDays > 7 && diffDays <= 30) return `Tra ${Math.ceil(diffDays / 7)} settimane`;
  return formatDate(dateStr);
}

export default function TournamentsSection({ primaryColor = "#0066CC", viewUserId, readOnly = false }: TournamentsSectionProps) {
  const { token } = useAuth();
  const params = useParams();
  const locale = (params.locale as string) || "it";

  const [registrations, setRegistrations] = useState<{ upcoming: Registration[]; past: Registration[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRegistrations() {
      if (!token) return;

      setLoading(true);
      try {
        const userIdParam = viewUserId ? `?userId=${viewUserId}` : "";
        const endpoint = viewUserId
          ? `${API_URL}/api/users/${viewUserId}/registrations`
          : `${API_URL}/api/users/me/registrations`;

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch registrations");

        const data = await res.json();
        setRegistrations(data.data);
      } catch (err) {
        console.error("Error fetching registrations:", err);
        setError("Impossibile caricare le iscrizioni");
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrations();
  }, [token, viewUserId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TournamentCard = ({ reg }: { reg: Registration }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <div
          className="sm:w-48 h-32 sm:h-auto bg-cover bg-center flex-shrink-0"
          style={{
            backgroundImage: reg.tournament.bannerImage
              ? `url(${getMediaUrl(reg.tournament.bannerImage)})`
              : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
          }}
        >
          {!reg.tournament.bannerImage && (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-4 sm:p-5">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-lg leading-tight">
                  {reg.tournament.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {disciplineLabels[reg.tournament.discipline] || reg.tournament.discipline}
                </p>
              </div>
              <Badge variant={statusConfig[reg.tournament.status]?.variant || "outline"}>
                {statusConfig[reg.tournament.status]?.label || reg.tournament.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-auto">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {getRelativeDate(reg.tournament.startDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(reg.tournament.startDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {reg.tournament.location}
              </span>
            </div>

            {(reg.teamName || reg.boatName) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm">
                <Fish className="h-4 w-4 text-muted-foreground" />
                <span>
                  {reg.teamName && <strong>{reg.teamName}</strong>}
                  {reg.teamName && reg.boatName && " - "}
                  {reg.boatName && <span className="text-muted-foreground">{reg.boatName}</span>}
                </span>
              </div>
            )}

            {!readOnly && (
              <div className="mt-4">
                <Button asChild size="sm">
                  <Link href={`/${locale}/tournaments/${reg.tournament.id}`}>
                    Dettagli Torneo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList>
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Prossimi ({registrations?.upcoming?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="past" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Passati ({registrations?.past?.length || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4 space-y-4">
        {registrations?.upcoming && registrations.upcoming.length > 0 ? (
          registrations.upcoming.map((reg) => (
            <TournamentCard key={reg.id} reg={reg} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {viewUserId ? "Nessuna iscrizione a tornei futuri" : "Non sei iscritto a nessun torneo"}
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4 space-y-4">
        {registrations?.past && registrations.past.length > 0 ? (
          registrations.past.map((reg) => (
            <TournamentCard key={reg.id} reg={reg} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Nessun torneo passato
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
