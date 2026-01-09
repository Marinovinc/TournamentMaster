/**
 * =============================================================================
 * DASHBOARD HOME PAGE
 * =============================================================================
 * Dashboard principale - mostra overview basata sul ruolo utente
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HelpGuide } from "@/components/HelpGuide";
import {
  Trophy,
  Fish,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Shield,
  Building,
} from "lucide-react";

interface DashboardStats {
  totalCatches: number;
  pendingCatches: number;
  approvedCatches: number;
  rejectedCatches: number;
  activeTournaments: number;
  upcomingTournaments: number;
}

export default function DashboardPage() {
  const { user, token, isAdmin, isJudge } = useAuth();
  const params = useParams();
  const locale = params.locale as string || "it";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        // For now, use mock data - replace with actual API call
        // const res = await fetch(`${API_URL}/api/dashboard/stats`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const data = await res.json();

        // Mock data for demo
        setStats({
          totalCatches: 12,
          pendingCatches: 3,
          approvedCatches: 8,
          rejectedCatches: 1,
          activeTournaments: 2,
          upcomingTournaments: 4,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, API_URL]);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      TENANT_ADMIN: "Amministratore",
      PRESIDENT: "Presidente",
      ORGANIZER: "Organizzatore",
      JUDGE: "Giudice",
      PARTICIPANT: "Partecipante",
      MEMBER: "Associato",
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "PRESIDENT") return "default";
    if (role === "ORGANIZER") return "secondary";
    if (role === "JUDGE") return "outline";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">
              Ciao, {user?.firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Ecco un riepilogo della tua attività
            </p>
          </div>
          <HelpGuide pageKey="dashboard" position="inline" />
        </div>
        <Badge variant={getRoleBadgeVariant(user?.role || "")}>
          {getRoleLabel(user?.role || "")}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catture Totali</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCatches || 0}</div>
            <p className="text-xs text-muted-foreground">
              In tutti i tornei
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingCatches || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Da validare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approvate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.approvedCatches || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Validate con successo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tornei Attivi</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeTournaments || 0}</div>
            <p className="text-xs text-muted-foreground">
              In corso ora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* For Judges/Admins */}
        {(isAdmin || isJudge) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Catture da Validare
              </CardTitle>
              <CardDescription>
                Ci sono {stats?.pendingCatches || 0} catture in attesa di validazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/dashboard/judge`}>
                <Button className="w-full">
                  Vai alla Validazione
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* For Super Admins */}
        {user?.role === "SUPER_ADMIN" && (
          <Card className="border-purple-500/50 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Super Admin
              </CardTitle>
              <CardDescription>
                Gestione globale della piattaforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/dashboard/super-admin`}>
                <Button variant="outline" className="w-full border-purple-500 text-purple-700 hover:bg-purple-100">
                  Pannello Super Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Link to Association for users with tenantId */}
        {user?.tenantSlug && (
          <Card className="border-blue-500/50 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                {user.tenantName || "La Mia Associazione"}
              </CardTitle>
              <CardDescription>
                Gestisci la tua associazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/associazioni/${user.tenantSlug}`}>
                <Button variant="outline" className="w-full border-blue-500 text-blue-700 hover:bg-blue-100">
                  Vai all&apos;Associazione
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* For Admins */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Gestione Tornei
              </CardTitle>
              <CardDescription>
                {stats?.activeTournaments} tornei attivi, {stats?.upcomingTournaments} in arrivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/dashboard/admin`}>
                <Button variant="outline" className="w-full">
                  Pannello Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* For Participants - New Catch */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fish className="h-5 w-5 text-green-600" />
              Registra Cattura
            </CardTitle>
            <CardDescription>
              Fotografa e registra una nuova cattura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/catch/new`}>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Cattura
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* For Participants - Browse Tournaments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Prossimi Tornei
            </CardTitle>
            <CardDescription>
              Scopri i tornei a cui puoi iscriverti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/tournaments`}>
              <Button variant="outline" className="w-full">
                Esplora Tornei
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Attività Recente</CardTitle>
          <CardDescription>
            Le tue ultime azioni sulla piattaforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Cattura approvata</p>
                <p className="text-sm text-muted-foreground">
                  Tonno rosso - 85.5 kg
                </p>
              </div>
              <span className="text-sm text-muted-foreground">2h fa</span>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-blue-100">
                <Trophy className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Iscrizione confermata</p>
                <p className="text-sm text-muted-foreground">
                  Gran Premio Estate 2025
                </p>
              </div>
              <span className="text-sm text-muted-foreground">1g fa</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
