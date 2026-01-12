/**
 * =============================================================================
 * MY CATCHES PAGE - Dashboard Participant
 * =============================================================================
 * Pagina per visualizzare le proprie catture registrate
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Fish,
  Calendar,
  Scale,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Catch {
  id: string;
  species: string;
  weight: number;
  length?: number;
  status: string;
  catchTime: string;
  photoUrl?: string;
  points?: number;
  tournament: {
    id: string;
    name: string;
  };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof CheckCircle }> = {
  PENDING: { label: "In Attesa", variant: "outline", icon: Clock },
  APPROVED: { label: "Approvata", variant: "default", icon: CheckCircle },
  REJECTED: { label: "Rifiutata", variant: "destructive", icon: XCircle },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyCatchesPage() {
  const { token, isLoading: authLoading, isAuthenticated } = useAuth();
  const params = useParams();
  const locale = (params.locale as string) || "it";

  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatches() {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/catches/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch catches");

        const data = await res.json();
        setCatches(data.data || []);
      } catch (err) {
        console.error("Error fetching catches:", err);
        setError("Impossibile caricare le catture");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated && token) {
      fetchCatches();
    }
  }, [token, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = {
    total: catches.length,
    pending: catches.filter(c => c.status === "PENDING").length,
    approved: catches.filter(c => c.status === "APPROVED").length,
    rejected: catches.filter(c => c.status === "REJECTED").length,
    totalWeight: catches.filter(c => c.status === "APPROVED").reduce((sum, c) => sum + c.weight, 0),
    totalPoints: catches.filter(c => c.status === "APPROVED").reduce((sum, c) => sum + (c.points || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Le Mie Catture</h1>
          <p className="text-muted-foreground">
            Tutte le catture registrate nei tornei
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/catch/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Cattura
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Fish className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Totali</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">In Attesa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approvate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalWeight.toFixed(1)} kg</p>
                <p className="text-sm text-muted-foreground">Peso Totale</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catches List */}
      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : catches.length > 0 ? (
        <div className="space-y-4">
          {catches.map((c) => {
            const config = statusConfig[c.status];
            const StatusIcon = config?.icon || Clock;

            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Photo */}
                  <div className="sm:w-32 h-24 sm:h-auto bg-muted flex-shrink-0 flex items-center justify-center">
                    {c.photoUrl ? (
                      <img
                        src={getMediaUrl(c.photoUrl)}
                        alt={c.species}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>

                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{c.species}</h4>
                        <p className="text-sm text-muted-foreground">
                          {c.tournament.name}
                        </p>
                      </div>
                      <Badge variant={config?.variant || "outline"}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config?.label || c.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <strong>{c.weight.toFixed(2)} kg</strong>
                      </span>
                      {c.length && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          Lunghezza: {c.length} cm
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(c.catchTime)}
                      </span>
                      {c.points !== undefined && c.status === "APPROVED" && (
                        <span className="flex items-center gap-1.5 text-primary">
                          <Trophy className="h-4 w-4" />
                          {c.points} punti
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Fish className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">
              Non hai ancora registrato catture
            </p>
            <Button asChild>
              <Link href={`/${locale}/catch/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Registra la Prima Cattura
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
