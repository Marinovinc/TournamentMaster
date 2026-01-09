/**
 * =============================================================================
 * ADMIN USER PROFILE VIEW
 * =============================================================================
 * Pagina admin per visualizzare la scheda completa di un utente specifico
 * Include: Panoramica, Barche, Attrezzatura, Media
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Crown,
  Loader2,
  Anchor,
  Package,
  Camera,
  Trophy,
  Fish,
  Scale,
  Medal,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// User sections - will pass userId to them
import { BoatsSection } from "@/components/user";
import { EquipmentSection } from "@/components/user";
import { MediaSection } from "@/components/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  fipsasNumber?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  tenant?: {
    id: string;
    name: string;
  };
  captainedTeams?: Array<{ id: string; name: string; boatName?: string }>;
  teamMemberships?: Array<{ team: { id: string; name: string; boatName?: string } }>;
}

interface UserStats {
  tournamentsParticipated: number;
  totalCatches: number;
  totalWeight: number;
  totalPoints: number;
  biggestCatch: number;
  averageWeight: number;
  podiums: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin Societa",
  PRESIDENT: "Presidente",
  ORGANIZER: "Organizzatore",
  JUDGE: "Giudice",
  CAPTAIN: "Capitano",
  PARTICIPANT: "Partecipante",
};

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SUPER_ADMIN: "destructive",
  TENANT_ADMIN: "default",
  PRESIDENT: "default",
  ORGANIZER: "secondary",
  JUDGE: "secondary",
  CAPTAIN: "outline",
  PARTICIPANT: "outline",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminUserProfilePage() {
  const { token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";
  const userId = params.userId as string;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    async function fetchUserData() {
      if (!token || !userId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch user profile
        const userRes = await fetch(`${API_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) {
          if (userRes.status === 404) {
            throw new Error("Utente non trovato");
          } else if (userRes.status === 403) {
            throw new Error("Non autorizzato a visualizzare questo utente");
          }
          throw new Error("Errore nel caricamento dell'utente");
        }

        const userData = await userRes.json();
        setUserProfile(userData.data);

        // Try to fetch stats (may not exist for all users)
        try {
          const statsRes = await fetch(`${API_URL}/api/users/${userId}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData.data);
          }
        } catch {
          // Stats not available, that's okay
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [token, userId]);

  // Check admin access
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-semibold">Accesso Negato</h2>
        <p className="text-muted-foreground">Solo gli amministratori possono accedere a questa pagina</p>
        <Button asChild>
          <Link href={`/${locale}/dashboard`}>Torna alla Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-semibold">{error || "Utente non trovato"}</h2>
        <Button asChild>
          <Link href={`/${locale}/dashboard/users`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla lista utenti
          </Link>
        </Button>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "TENANT_ADMIN":
        return <Shield className="h-4 w-4" />;
      case "PRESIDENT":
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/users`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Scheda Utente</h1>
          <p className="text-muted-foreground">Visualizzazione amministratore</p>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
              {userProfile.firstName?.[0]}
              {userProfile.lastName?.[0]}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h2 className="text-2xl font-bold">
                  {userProfile.firstName} {userProfile.lastName}
                </h2>
                <div className="flex gap-2">
                  <Badge variant={ROLE_COLORS[userProfile.role] || "outline"} className="gap-1">
                    {getRoleIcon(userProfile.role)}
                    {ROLE_LABELS[userProfile.role] || userProfile.role}
                  </Badge>
                  {userProfile.isActive ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Attivo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Disattivato
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{userProfile.email}</span>
                </div>
                {userProfile.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{userProfile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Registrato il {formatDate(userProfile.createdAt)}</span>
                </div>
                {userProfile.tenant && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>{userProfile.tenant.name}</span>
                  </div>
                )}
                {userProfile.fipsasNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>FIPSAS: {userProfile.fipsasNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xl font-bold">{stats.tournamentsParticipated}</p>
                  <p className="text-xs text-muted-foreground">Tornei</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Fish className="h-5 w-5 mx-auto mb-1 text-cyan-500" />
                  <p className="text-xl font-bold">{stats.totalCatches}</p>
                  <p className="text-xs text-muted-foreground">Catture</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Scale className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xl font-bold">{stats.totalWeight.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Kg Totali</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Medal className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-xl font-bold">{stats.podiums.total}</p>
                  <p className="text-xs text-muted-foreground">Podi</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Panoramica</span>
          </TabsTrigger>
          <TabsTrigger value="boats" className="flex items-center gap-1.5">
            <Anchor className="h-4 w-4" />
            <span className="hidden sm:inline">Barche</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Attrezzatura</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1.5">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teams */}
            {(userProfile.captainedTeams?.length || userProfile.teamMemberships?.length) ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userProfile.captainedTeams?.map((team) => (
                      <div key={team.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">{team.name}</p>
                          {team.boatName && (
                            <p className="text-sm text-muted-foreground">Barca: {team.boatName}</p>
                          )}
                          <Badge variant="outline" className="mt-1">Capitano</Badge>
                        </div>
                      </div>
                    ))}
                    {userProfile.teamMemberships?.map((membership) => (
                      <div key={membership.team.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <User className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{membership.team.name}</p>
                          {membership.team.boatName && (
                            <p className="text-sm text-muted-foreground">Barca: {membership.team.boatName}</p>
                          )}
                          <Badge variant="outline" className="mt-1">Membro</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-4">
                    Nessun team associato
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Detailed Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Statistiche Dettagliate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Record personale</p>
                        <p className="text-xl font-bold">{stats.biggestCatch.toFixed(2)} kg</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Media peso</p>
                        <p className="text-xl font-bold">{stats.averageWeight.toFixed(2)} kg</p>
                      </div>
                    </div>

                    {stats.podiums.total > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-3">Piazzamenti sul podio</p>
                        <div className="flex justify-center gap-8">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-1">
                              <Medal className="h-6 w-6 text-yellow-600" />
                            </div>
                            <p className="font-bold">{stats.podiums.gold}</p>
                            <p className="text-xs text-muted-foreground">Oro</p>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                              <Medal className="h-6 w-6 text-gray-500" />
                            </div>
                            <p className="font-bold">{stats.podiums.silver}</p>
                            <p className="text-xs text-muted-foreground">Argento</p>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-1">
                              <Medal className="h-6 w-6 text-orange-600" />
                            </div>
                            <p className="font-bold">{stats.podiums.bronze}</p>
                            <p className="text-xs text-muted-foreground">Bronzo</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Boats Tab */}
        <TabsContent value="boats">
          <BoatsSection primaryColor="#0066CC" viewUserId={userId} readOnly />
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <EquipmentSection primaryColor="#0066CC" viewUserId={userId} readOnly />
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <MediaSection primaryColor="#0066CC" viewUserId={userId} readOnly />
        </TabsContent>
      </Tabs>
    </div>
  );
}
