/**
 * =============================================================================
 * USER DASHBOARD SECTION - Association Page (Redesign 2025)
 * =============================================================================
 * Modern dashboard layout based on 2025 UI/UX best practices:
 * - Welcome-first approach with personalized greeting
 * - Stats prominently displayed in hero section
 * - Tournaments in horizontal cards with clear CTAs
 * - Progressive disclosure (important info first)
 * - Mobile-first responsive design
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// User sections
import { BoatsSection } from "@/components/user";
import { EquipmentSection } from "@/components/user";
import { SkipperSection } from "@/components/user";
import { SettingsSection } from "@/components/user";
import { MediaSection } from "@/components/user";
import { MessagesSection } from "@/components/user";
import {
  User,
  Trophy,
  Fish,
  Calendar,
  MapPin,
  Edit2,
  Medal,
  Scale,
  Loader2,
  ChevronRight,
  Award,
  TrendingUp,
  Clock,
  Target,
  Waves,
  Anchor,
  Package,
  Navigation,
  Settings,
  Camera,
  LayoutDashboard,
  LogOut,
  Mail,
  ArrowLeft,
  Shield,
  Users,
  Cog,
  Plus,
  Eye,
  BarChart3,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { getMediaUrl } from "@/lib/media";

// Types
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
  speciesBreakdown: Array<{
    name: string;
    count: number;
    totalWeight: number;
  }>;
}

interface UserDashboardSectionProps {
  locale: string;
  primaryColor?: string;
  secondaryColor?: string;
  /** ID utente da visualizzare (per admin che vede profilo di un altro utente) */
  viewUserId?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Discipline labels
const disciplineLabels: Record<string, string> = {
  BIG_GAME: "Big Game",
  DRIFTING: "Drifting",
  TRAINA_COSTIERA: "Traina Costiera",
  BOLENTINO: "Bolentino",
  EGING: "Eging",
  VERTICAL_JIGGING: "Vertical Jigging",
  SHORE: "Shore",
  SOCIAL: "Social",
};

// Status configuration
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PUBLISHED: { label: "In Programma", variant: "outline" },
  REGISTRATION_OPEN: { label: "Iscrizioni Aperte", variant: "default" },
  ONGOING: { label: "In Corso", variant: "default" },
  COMPLETED: { label: "Completato", variant: "secondary" },
};

// Format date
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format relative date
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

export default function UserDashboardSection({
  locale,
  primaryColor = "#0066CC",
  secondaryColor = "#004499",
  viewUserId
}: UserDashboardSectionProps) {
  const { user, token, isAuthenticated, isLoading: authLoading, logout, isAdmin } = useAuth();

  // Determine if we're viewing another user's profile (admin mode)
  const isViewingOtherUser = !!viewUserId;

  // State
  const [registrations, setRegistrations] = useState<{ upcoming: Registration[]; past: Registration[] } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Target user info when viewing another user
  const [targetUser, setTargetUser] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);

  // Admin mode switch state - when enabled, shows management tab
  const [adminModeEnabled, setAdminModeEnabled] = useState(false);

  // Profile edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  // Unread messages state
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        // Determine which endpoints to use based on whether viewing another user
        const userIdPath = isViewingOtherUser ? viewUserId : "me";

        const [regRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${userIdPath}/registrations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/users/${userIdPath}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!regRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch user data");
        }

        const regData = await regRes.json();
        const statsData = await statsRes.json();

        setRegistrations(regData.data);
        setStats(statsData.data);

        // If viewing another user, extract user info from stats response
        if (isViewingOtherUser && statsData.data?.user) {
          setTargetUser(statsData.data.user);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Impossibile caricare i dati");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated && token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token, isViewingOtherUser, viewUserId]);

  // Initialize edit form
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: "",
      });
    }
  }, [user]);

  // Fetch unread messages count
  useEffect(() => {
    async function fetchUnreadCount() {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setUnreadMessages(data.data.total);
          }
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    }

    if (isAuthenticated && token) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  // Handle profile update
  async function handleSaveProfile() {
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updatedUser = { ...user, ...editForm };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
      setIsEditDialogOpen(false);
    }
  }

  // Don't render if not authenticated
  if (authLoading || !isAuthenticated || !user) {
    return null;
  }

  // Determine which user to display
  const displayUser = isViewingOtherUser && targetUser ? targetUser : user;

  return (
    <div className="mt-12 mb-8">
      {/* Back button for admin viewing another user's profile */}
      {isViewingOtherUser && (
        <div className="mb-4">
          <Link
            href={`/${locale}/dashboard/users`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla lista utenti
          </Link>
        </div>
      )}

      {/* ================================================================
          HERO WELCOME SECTION
          Modern gradient card with user info + key stats
          ================================================================ */}
      <div
        className="rounded-2xl p-6 md:p-8 text-white mb-6"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* User Welcome */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl md:text-3xl font-bold">
              {displayUser.firstName.charAt(0)}{displayUser.lastName.charAt(0)}
            </div>
            <div>
              <p className="text-white/80 text-sm">
                {isViewingOtherUser ? "Profilo Utente" : "Bentornato"}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold">
                {displayUser.firstName} {displayUser.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {/* Dynamic Badge: PARTICIPANT if participated in tournaments, else Iscritto */}
                <Badge
                  variant="secondary"
                  className={`border-0 ${
                    registrations && (registrations.upcoming.length > 0 || registrations.past.length > 0)
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {registrations && (registrations.upcoming.length > 0 || registrations.past.length > 0)
                    ? "ISCRITTO"
                    : "Iscritto"}
                </Badge>
                {/* Hide edit/logout buttons when viewing another user */}
                {!isViewingOtherUser && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 h-7 px-2"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Modifica
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-red-500/20 h-7 px-2"
                      onClick={() => logout()}
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Esci
                    </Button>
                  </>
                )}
                {/* Admin Mode Switch - only visible for admins viewing their own profile */}
                {isAdmin && !isViewingOtherUser && (
                  <div className="flex items-center gap-2 ml-2 bg-white/10 backdrop-blur rounded-full px-3 py-1">
                    <Shield className="h-3.5 w-3.5 text-yellow-300" />
                    <span className="text-xs text-white/80">Gestione</span>
                    <Switch
                      checked={adminModeEnabled}
                      onCheckedChange={setAdminModeEnabled}
                      className="data-[state=checked]:bg-yellow-400 scale-75"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          {!loading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-2xl font-bold">{stats.tournamentsParticipated}</p>
                <p className="text-xs text-white/70">Tornei</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <Fish className="h-5 w-5 mx-auto mb-1 text-cyan-300" />
                <p className="text-2xl font-bold">{stats.totalCatches}</p>
                <p className="text-xs text-white/70">Catture</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <Scale className="h-5 w-5 mx-auto mb-1 text-green-300" />
                <p className="text-2xl font-bold">{stats.totalWeight.toFixed(1)}</p>
                <p className="text-xs text-white/70">Kg Totali</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <Medal className="h-5 w-5 mx-auto mb-1 text-orange-300" />
                <p className="text-2xl font-bold">{stats.podiums.total}</p>
                <p className="text-xs text-white/70">Podi</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue={adminModeEnabled ? "management" : "overview"} className="w-full">
        <TabsList className={`grid w-full mb-6 ${adminModeEnabled ? "grid-cols-4 md:grid-cols-8" : "grid-cols-4 md:grid-cols-7"}`}>
          {/* Management Tab - First position when admin mode enabled */}
          {adminModeEnabled && (
            <TabsTrigger value="management" className="flex items-center gap-1.5 bg-yellow-100 data-[state=active]:bg-yellow-200 text-yellow-800">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Gestione</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Panoramica</span>
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className={`flex items-center gap-1.5 relative ${
              unreadMessages > 0
                ? "text-red-600 data-[state=active]:text-red-600 data-[state=active]:bg-red-50"
                : ""
            }`}
            onClick={() => {
              // Reset count when tab is clicked (will be updated by MessagesSection)
              setTimeout(() => setUnreadMessages(0), 1000);
            }}
          >
            <Mail className={`h-4 w-4 ${unreadMessages > 0 ? "text-red-500" : ""}`} />
            <span className="hidden sm:inline">Messaggi</span>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="boats" className="flex items-center gap-1.5">
            <Anchor className="h-4 w-4" />
            <span className="hidden sm:inline">Barca</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Attrezzatura</span>
          </TabsTrigger>
          <TabsTrigger value="skipper" className="flex items-center gap-1.5">
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Skipper</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1.5">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Impostazioni</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
      {loading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================================================================
              LEFT COLUMN: UPCOMING TOURNAMENTS (2/3 width)
              Large cards with images and clear CTAs
              ================================================================ */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                Prossimi Tornei
              </h3>
              {registrations?.upcoming && registrations.upcoming.length > 0 && (
                <Badge variant="outline" className="font-normal">
                  {registrations.upcoming.length} iscrizioni
                </Badge>
              )}
            </div>

            {registrations?.upcoming && registrations.upcoming.length > 0 ? (
              <div className="space-y-4">
                {registrations.upcoming.map((reg) => (
                  <Card key={reg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      {/* Tournament Image */}
                      <div
                        className="sm:w-48 h-32 sm:h-auto bg-cover bg-center flex-shrink-0"
                        style={{
                          backgroundImage: reg.tournament.bannerImage
                            ? `url(${getMediaUrl(reg.tournament.bannerImage)})`
                            : `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
                        }}
                      >
                        {!reg.tournament.bannerImage && (
                          <div className="w-full h-full flex items-center justify-center">
                            <Trophy className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Tournament Info */}
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
                            <Badge
                              variant={statusConfig[reg.tournament.status]?.variant || "outline"}
                              className="flex-shrink-0"
                            >
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

                          {/* Team/Boat info if available */}
                          {(reg.teamName || reg.boatName) && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm">
                              <Waves className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {reg.teamName && <strong>{reg.teamName}</strong>}
                                {reg.teamName && reg.boatName && " - "}
                                {reg.boatName && <span className="text-muted-foreground">{reg.boatName}</span>}
                              </span>
                            </div>
                          )}

                          <div className="mt-4">
                            <Button asChild size="sm" style={{ backgroundColor: primaryColor }}>
                              <Link href={`/${locale}/tournaments/${reg.tournament.id}`}>
                                Visualizza Dettagli
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">
                    Non sei iscritto a nessun torneo
                  </p>
                  <Button asChild variant="outline">
                    <Link href={`/${locale}/tournaments`}>
                      Scopri i Tornei
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ================================================================
              RIGHT COLUMN: STATS + PAST TOURNAMENTS (1/3 width)
              Compact layout with detailed statistics
              ================================================================ */}
          <div className="space-y-6">
            {/* Detailed Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: primaryColor }} />
                  Statistiche Dettagliate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats ? (
                  <>
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="h-4 w-4" style={{ color: primaryColor }} />
                          <span className="text-xs text-muted-foreground">Record</span>
                        </div>
                        <p className="text-xl font-bold">{stats.biggestCatch.toFixed(2)} kg</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
                          <span className="text-xs text-muted-foreground">Media</span>
                        </div>
                        <p className="text-xl font-bold">{stats.averageWeight.toFixed(2)} kg</p>
                      </div>
                    </div>

                    {/* Podiums */}
                    {stats.podiums.total > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Piazzamenti sul podio</p>
                        <div className="flex justify-center gap-6">
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-1">
                              <Medal className="h-5 w-5 text-yellow-600" />
                            </div>
                            <p className="font-bold">{stats.podiums.gold}</p>
                          </div>
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                              <Medal className="h-5 w-5 text-gray-500" />
                            </div>
                            <p className="font-bold">{stats.podiums.silver}</p>
                          </div>
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-1">
                              <Medal className="h-5 w-5 text-orange-600" />
                            </div>
                            <p className="font-bold">{stats.podiums.bronze}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Species Breakdown */}
                    {stats.speciesBreakdown.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Specie pescate</p>
                        <div className="space-y-2">
                          {stats.speciesBreakdown.slice(0, 3).map((species, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <Fish className="h-3 w-3 text-muted-foreground" />
                                {species.name}
                              </span>
                              <span className="text-muted-foreground">
                                {species.count}x ({species.totalWeight.toFixed(1)} kg)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    Partecipa al tuo primo torneo per vedere le statistiche
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Past Tournaments - Compact List */}
            {registrations?.past && registrations.past.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Tornei Passati
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {registrations.past.slice(0, 5).map((reg) => (
                    <Link
                      key={reg.id}
                      href={`/${locale}/tournaments/${reg.tournament.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div
                          className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${primaryColor}10` }}
                        >
                          <Trophy className="h-4 w-4" style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {reg.tournament.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(reg.tournament.startDate)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}

                  {registrations.past.length > 5 && (
                    <Button variant="ghost" className="w-full text-sm" asChild>
                      <Link href={`/${locale}/dashboard`}>
                        Vedi tutti ({registrations.past.length})
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
        </TabsContent>

        {/* Messages Tab - Not available when viewing another user */}
        <TabsContent value="messages">
          {isViewingOtherUser ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                I messaggi sono privati e non visibili in modalità visualizzazione.
              </CardContent>
            </Card>
          ) : (
            <MessagesSection primaryColor={primaryColor} />
          )}
        </TabsContent>

        {/* Boats Tab */}
        <TabsContent value="boats">
          <BoatsSection
            primaryColor={primaryColor}
            viewUserId={viewUserId}
            readOnly={isViewingOtherUser}
          />
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <EquipmentSection
            primaryColor={primaryColor}
            viewUserId={viewUserId}
            readOnly={isViewingOtherUser}
          />
        </TabsContent>

        {/* Skipper Tab - Not available when viewing another user */}
        <TabsContent value="skipper">
          {isViewingOtherUser ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Le certificazioni skipper sono private e non visibili in modalità visualizzazione.
              </CardContent>
            </Card>
          ) : (
            <SkipperSection primaryColor={primaryColor} />
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <MediaSection
            primaryColor={primaryColor}
            viewUserId={viewUserId}
            readOnly={isViewingOtherUser}
          />
        </TabsContent>

        {/* Settings Tab - Not available when viewing another user */}
        <TabsContent value="settings">
          {isViewingOtherUser ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Le impostazioni sono private e non visibili in modalità visualizzazione.
              </CardContent>
            </Card>
          ) : (
            <SettingsSection primaryColor={primaryColor} />
          )}
        </TabsContent>

        {/* Management Tab - Only visible when admin mode is enabled */}
        {adminModeEnabled && (
          <TabsContent value="management">
            <div className="space-y-6">
              {/* Admin Banner */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Shield className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Modalita Amministratore</h3>
                    <p className="text-sm text-yellow-600">Gestisci la tua associazione da questa pagina</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Manage Tournaments */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <Link href={`/${locale}/dashboard/tournaments`} className="block">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Gestione Tornei</h4>
                          <p className="text-sm text-muted-foreground">Crea, modifica e gestisci i tornei della tua associazione</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Manage Users */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <Link href={`/${locale}/dashboard/users`} className="block">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Gestione Iscritti</h4>
                          <p className="text-sm text-muted-foreground">Visualizza e gestisci gli iscritti alla tua associazione</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Association Settings */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <Link href={`/${locale}/dashboard/admin`} className="block">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                          <Cog className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Impostazioni</h4>
                          <p className="text-sm text-muted-foreground">Configura branding, colori e informazioni associazione</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Reports & Statistics */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <Link href={`/${locale}/dashboard/reports`} className="block">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Report e Statistiche</h4>
                          <p className="text-sm text-muted-foreground">Visualizza statistiche e genera report PDF</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Media Management */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <Link href={`/${locale}/dashboard/admin/media`} className="block">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-pink-100 text-pink-600 group-hover:bg-pink-200 transition-colors">
                          <Camera className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Gestione Media</h4>
                          <p className="text-sm text-muted-foreground">Gestisci logo, banner e galleria immagini</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Create New Tournament */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-dashed border-2">
                  <CardContent className="p-6">
                    <Link href={`/${locale}/dashboard/tournaments?action=new`} className="block">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-colors">
                          <Plus className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Nuovo Torneo</h4>
                          <p className="text-sm text-muted-foreground">Crea rapidamente un nuovo torneo</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats for Admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Riepilogo Associazione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-blue-700">{stats?.tournamentsParticipated || 0}</p>
                      <p className="text-sm text-blue-600">Tornei Organizzati</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-700">--</p>
                      <p className="text-sm text-green-600">Iscritti Totali</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <Fish className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-purple-700">{stats?.totalCatches || 0}</p>
                      <p className="text-sm text-purple-600">Catture Registrate</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <Scale className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <p className="text-2xl font-bold text-orange-700">{stats?.totalWeight?.toFixed(1) || 0} kg</p>
                      <p className="text-sm text-orange-600">Peso Totale</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ================================================================
          EDIT PROFILE DIALOG
          ================================================================ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Profilo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
