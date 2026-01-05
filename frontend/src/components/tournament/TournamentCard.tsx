/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/tournament/TournamentCard.tsx
 * Creato: 2025-12-29
 * Descrizione: Card per visualizzazione singolo torneo
 *
 * Dipendenze:
 * - @/components/ui/card (shadcn)
 * - @/components/ui/badge (shadcn)
 * - lucide-react (icons)
 *
 * Utilizzato da:
 * - src/app/[locale]/tournaments/page.tsx
 * - src/components/home/FeaturedTournaments.tsx (futuro)
 * =============================================================================
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Fish,
  Euro,
  Clock,
  ChevronRight,
  CalendarX,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  discipline: string;
  status: "DRAFT" | "PUBLISHED" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  location: string;
  registrationFee: string;
  maxParticipants: number | null;
  bannerImage: string | null;
  tenant: {
    name: string;
    slug: string;
  };
  organizer: {
    firstName: string;
    lastName: string;
  };
  _count: {
    registrations: number;
    catches: number;
  };
}

interface TournamentCardProps {
  tournament: Tournament;
  locale?: string;
}

const statusConfig: Record<Tournament["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Bozza", variant: "secondary" },
  PUBLISHED: { label: "Aperto", variant: "default" },
  REGISTRATION_OPEN: { label: "Iscrizioni Aperte", variant: "default" },
  ONGOING: { label: "In Corso", variant: "destructive" },
  COMPLETED: { label: "Completato", variant: "outline" },
  CANCELLED: { label: "Annullato", variant: "secondary" },
};

const disciplineLabels: Record<string, string> = {
  BIG_GAME: "Big Game",
  DRIFTING: "Drifting",
  TRAINA_COSTIERA: "Traina Costiera",
  BOLENTINO: "Bolentino",
  EGING: "Eging",
  VERTICAL_JIGGING: "Vertical Jigging",
  SHORE: "Pesca da Riva",
  SOCIAL: "Evento Sociale",
};

export function TournamentCard({ tournament, locale = "it" }: TournamentCardProps) {
  const status = statusConfig[tournament.status] || { label: tournament.status || "N/A", variant: "secondary" as const };
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);
  const regCloses = new Date(tournament.registrationCloses);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateRange = (start: Date, end: Date) => {
    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) {
      return formatDate(start);
    }
    return `${start.toLocaleDateString(locale, { day: "numeric", month: "short" })} - ${formatDate(end)}`;
  };

  const isOngoing = tournament.status === "ONGOING";
  const isCompleted = tournament.status === "COMPLETED";
  const isPublished = tournament.status === "PUBLISHED";
  const regClosingSoon = isPublished && regCloses.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Banner Image */}
      <div className="relative h-40 bg-gradient-to-br from-blue-600 to-cyan-500 overflow-hidden">
        {tournament.bannerImage ? (
          <img
            src={tournament.bannerImage}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Fish className="h-16 w-16 text-white/30" />
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          <Badge
            variant={status.variant}
            className={`${isOngoing ? "animate-pulse bg-red-500 text-white border-red-500" : ""} shadow-lg`}
          >
            {isOngoing && <Clock className="h-3 w-3 mr-1" />}
            {status.label}
          </Badge>
        </div>

        {/* Discipline Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm">
            <Fish className="h-3 w-3 mr-1" />
            {disciplineLabels[tournament.discipline] || tournament.discipline}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {tournament.name}
        </CardTitle>
        {tournament.description && (
          <CardDescription className="line-clamp-2 mt-1">
            {tournament.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Fishing Days */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <div>
            <span className="text-muted-foreground">Giorni di Pesca: </span>
            <span className="font-medium">{formatDateRange(startDate, endDate)}</span>
          </div>
        </div>

        {/* Registration Closes - Solo per tornei aperti */}
        {isPublished && (
          <div className={`flex items-center gap-2 text-sm ${regClosingSoon ? "text-orange-600" : ""}`}>
            <CalendarX className={`h-4 w-4 shrink-0 ${regClosingSoon ? "text-orange-500" : "text-muted-foreground"}`} />
            <div>
              <span className="text-muted-foreground">Iscrizioni entro: </span>
              <span className={`font-medium ${regClosingSoon ? "text-orange-600" : ""}`}>
                {formatDate(regCloses)}
                {regClosingSoon && " ⚠️"}
              </span>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground truncate">{tournament.location}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>
              {tournament._count.registrations}
              {tournament.maxParticipants && <span className="text-xs">/{tournament.maxParticipants}</span>}
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Euro className="h-4 w-4 text-primary" />
            <span className="font-medium">{parseFloat(tournament.registrationFee).toFixed(0)}€</span>
          </div>

          {isCompleted && tournament._count.catches > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Trophy className="h-4 w-4" />
              <span className="font-medium">{tournament._count.catches}</span>
            </div>
          )}
        </div>

        {/* Organizer */}
        <div className="text-xs text-muted-foreground">
          Organizzato da <span className="font-medium text-foreground">{tournament.tenant.name}</span>
        </div>

        {/* Action Button - Push to bottom */}
        <div className="mt-auto pt-3">
          <Link href={`/${locale}/tournaments/${tournament.id}`} className="block">
            <Button
              variant={isPublished ? "default" : "outline"}
              className="w-full group-hover:shadow-md transition-all"
            >
              {isPublished ? "Iscriviti & Dettagli" : isCompleted ? "Vedi Risultati" : "Dettagli"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
