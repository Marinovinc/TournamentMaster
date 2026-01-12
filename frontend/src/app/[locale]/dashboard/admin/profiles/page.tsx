/**
 * =============================================================================
 * TOURNAMENT PROFILES MANAGEMENT PAGE
 * =============================================================================
 * Gestione profili torneo - FIPSAS e custom associazione
 * Pattern: Copy on Write (fork profili FIPSAS)
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useParams, useRouter } from "next/navigation";
import {
  Settings,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  Shield,
  Fish,
  Scale,
  Target,
  Award,
  ArrowLeft,
} from "lucide-react";

// Types
interface TournamentProfile {
  id: string;
  name: string;
  description?: string;
  isSystemProfile: boolean;
  basedOnId?: string;
  basedOn?: TournamentProfile;
  tenantId?: string;
  discipline: string;
  level: string;
  gameMode: string;
  followsFipsasRules: boolean;
  fipsasRegulationUrl?: string;
  defaultMinWeight?: number;
  defaultMaxCatchesPerDay?: number;
  defaultPointsPerKg?: number;
  defaultBonusPoints?: number;
  speciesScoringConfig?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

const DISCIPLINES = [
  { value: "BIG_GAME", label: "Big Game" },
  { value: "DRIFTING", label: "Drifting" },
  { value: "TRAINA_COSTIERA", label: "Traina Costiera" },
  { value: "BOLENTINO", label: "Bolentino" },
  { value: "VERTICAL_JIGGING", label: "Vertical Jigging" },
  { value: "EGING", label: "Eging" },
  { value: "SHORE", label: "Shore Fishing" },
  { value: "SOCIAL", label: "Sociale" },
];

const LEVELS = [
  { value: "CLUB", label: "Club" },
  { value: "REGIONAL", label: "Regionale" },
  { value: "NATIONAL", label: "Nazionale" },
  { value: "INTERNATIONAL", label: "Internazionale" },
];

const GAME_MODES = [
  { value: "TRADITIONAL", label: "Tradizionale (Peso)" },
  { value: "CATCH_RELEASE", label: "Catch & Release (Taglia)" },
];

export default function ProfilesManagementPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [systemProfiles, setSystemProfiles] = useState<TournamentProfile[]>([]);
  const [customProfiles, setCustomProfiles] = useState<TournamentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("fipsas");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<TournamentProfile | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discipline: "BIG_GAME",
    level: "CLUB",
    gameMode: "TRADITIONAL",
    followsFipsasRules: false,
    fipsasRegulationUrl: "",
    defaultMinWeight: "",
    defaultMaxCatchesPerDay: "",
    defaultPointsPerKg: "1",
    defaultBonusPoints: "0",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch profiles on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/tournament-profiles/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const profiles = data.data || [];

          // Separate system and custom profiles
          setSystemProfiles(profiles.filter((p: TournamentProfile) => p.isSystemProfile));
          setCustomProfiles(profiles.filter((p: TournamentProfile) => !p.isSystemProfile));
        }
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [token, API_URL]);

  // Check admin access
  useEffect(() => {
    if (!isAdmin && !loading) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAdmin, loading, router, locale]);

  // Filter profiles based on search
  const filterProfiles = (profiles: TournamentProfile[]) => {
    if (!searchQuery) return profiles;
    const query = searchQuery.toLowerCase();
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.discipline.toLowerCase().includes(query)
    );
  };

  // Get discipline label
  const getDisciplineLabel = (value: string) => {
    return DISCIPLINES.find((d) => d.value === value)?.label || value;
  };

  // Get level label
  const getLevelLabel = (value: string) => {
    return LEVELS.find((l) => l.value === value)?.label || value;
  };

  // Get game mode label
  const getGameModeLabel = (value: string) => {
    return GAME_MODES.find((m) => m.value === value)?.label || value;
  };

  // Handle fork profile (Copy on Write)
  const handleForkProfile = async () => {
    if (!selectedProfile) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournament-profiles/${selectedProfile.id}/fork`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name || `${selectedProfile.name} (Personalizzato)`,
          description: formData.description || selectedProfile.description,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCustomProfiles([data.data, ...customProfiles]);
        setForkDialogOpen(false);
        setSelectedProfile(null);
        resetForm();
        setActiveTab("custom");
      } else {
        alert(data.message || "Errore durante la creazione della copia");
      }
    } catch (error) {
      console.error("Error forking profile:", error);
      alert("Errore di connessione");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle create custom profile
  const handleCreateProfile = async () => {
    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournament-profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          defaultMinWeight: formData.defaultMinWeight ? parseFloat(formData.defaultMinWeight) : null,
          defaultMaxCatchesPerDay: formData.defaultMaxCatchesPerDay ? parseInt(formData.defaultMaxCatchesPerDay) : null,
          defaultPointsPerKg: formData.defaultPointsPerKg ? parseFloat(formData.defaultPointsPerKg) : 1,
          defaultBonusPoints: formData.defaultBonusPoints ? parseInt(formData.defaultBonusPoints) : 0,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCustomProfiles([data.data, ...customProfiles]);
        setCreateDialogOpen(false);
        resetForm();
      } else {
        alert(data.message || "Errore durante la creazione del profilo");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Errore di connessione");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit profile
  const handleEditProfile = async () => {
    if (!selectedProfile) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournament-profiles/${selectedProfile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          defaultMinWeight: formData.defaultMinWeight ? parseFloat(formData.defaultMinWeight) : null,
          defaultMaxCatchesPerDay: formData.defaultMaxCatchesPerDay ? parseInt(formData.defaultMaxCatchesPerDay) : null,
          defaultPointsPerKg: formData.defaultPointsPerKg ? parseFloat(formData.defaultPointsPerKg) : 1,
          defaultBonusPoints: formData.defaultBonusPoints ? parseInt(formData.defaultBonusPoints) : 0,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCustomProfiles(
          customProfiles.map((p) => (p.id === selectedProfile.id ? data.data : p))
        );
        setEditDialogOpen(false);
        setSelectedProfile(null);
        resetForm();
      } else {
        alert(data.message || "Errore durante l'aggiornamento del profilo");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Errore di connessione");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete profile
  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournament-profiles/${selectedProfile.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setCustomProfiles(customProfiles.filter((p) => p.id !== selectedProfile.id));
      } else {
        const data = await response.json();
        alert(data.message || "Errore durante l'eliminazione");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("Errore di connessione");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedProfile(null);
      setFormLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      discipline: "BIG_GAME",
      level: "CLUB",
      gameMode: "TRADITIONAL",
      followsFipsasRules: false,
      fipsasRegulationUrl: "",
      defaultMinWeight: "",
      defaultMaxCatchesPerDay: "",
      defaultPointsPerKg: "1",
      defaultBonusPoints: "0",
    });
  };

  // Open edit dialog
  const openEditDialog = (profile: TournamentProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || "",
      discipline: profile.discipline,
      level: profile.level,
      gameMode: profile.gameMode,
      followsFipsasRules: profile.followsFipsasRules,
      fipsasRegulationUrl: profile.fipsasRegulationUrl || "",
      defaultMinWeight: profile.defaultMinWeight?.toString() || "",
      defaultMaxCatchesPerDay: profile.defaultMaxCatchesPerDay?.toString() || "",
      defaultPointsPerKg: profile.defaultPointsPerKg?.toString() || "1",
      defaultBonusPoints: profile.defaultBonusPoints?.toString() || "0",
    });
    setEditDialogOpen(true);
  };

  // Open fork dialog
  const openForkDialog = (profile: TournamentProfile) => {
    setSelectedProfile(profile);
    setFormData({
      ...formData,
      name: `${profile.name} (Personalizzato)`,
      description: profile.description || "",
    });
    setForkDialogOpen(true);
  };

  // Profile row component
  const ProfileRow = ({ profile, isSystem }: { profile: TournamentProfile; isSystem: boolean }) => (
    <TableRow key={profile.id}>
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{profile.name}</span>
            {isSystem && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                FIPSAS
              </Badge>
            )}
            {profile.basedOnId && (
              <Badge variant="outline" className="text-xs">
                <Copy className="h-3 w-3 mr-1" />
                Fork
              </Badge>
            )}
          </div>
          {profile.description && (
            <span className="text-sm text-muted-foreground line-clamp-1">
              {profile.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{getDisciplineLabel(profile.discipline)}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {profile.gameMode === "CATCH_RELEASE" ? (
            <Target className="h-4 w-4 text-green-600" />
          ) : (
            <Scale className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-sm">{getGameModeLabel(profile.gameMode)}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{getLevelLabel(profile.level)}</span>
      </TableCell>
      <TableCell>
        {profile.followsFipsasRules ? (
          <Badge variant="default" className="bg-green-600">
            <Award className="h-3 w-3 mr-1" />
            FIPSAS
          </Badge>
        ) : (
          <Badge variant="secondary">Libero</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isSystem ? (
              <>
                <DropdownMenuItem onClick={() => openForkDialog(profile)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Crea Copia Personalizzata
                </DropdownMenuItem>
                {profile.fipsasRegulationUrl && (
                  <DropdownMenuItem
                    onClick={() => window.open(profile.fipsasRegulationUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Vedi Regolamento FIPSAS
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => openEditDialog(profile)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    setSelectedProfile(profile);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/dashboard/admin`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Profili Torneo
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestisci profili FIPSAS e personalizzati per la tua associazione
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuovo Profilo
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca profili..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fipsas" className="gap-2">
            <Shield className="h-4 w-4" />
            Profili FIPSAS ({systemProfiles.length})
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Settings className="h-4 w-4" />
            Profili Personalizzati ({customProfiles.length})
          </TabsTrigger>
        </TabsList>

        {/* FIPSAS Profiles Tab */}
        <TabsContent value="fipsas">
          <Card>
            <CardHeader>
              <CardTitle>Profili Standard FIPSAS</CardTitle>
              <CardDescription>
                Profili ufficiali FIPSAS - clicca su &quot;Crea Copia&quot; per personalizzarli
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Modalita</TableHead>
                    <TableHead>Livello</TableHead>
                    <TableHead>Regolamento</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterProfiles(systemProfiles).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Fish className="h-8 w-8" />
                          <p>Nessun profilo FIPSAS trovato</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterProfiles(systemProfiles).map((profile) => (
                      <ProfileRow key={profile.id} profile={profile} isSystem={true} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Profiles Tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Profili Personalizzati</CardTitle>
              <CardDescription>
                Profili creati dalla tua associazione - modifica liberamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Modalita</TableHead>
                    <TableHead>Livello</TableHead>
                    <TableHead>Regolamento</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterProfiles(customProfiles).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Settings className="h-8 w-8" />
                          <p>Nessun profilo personalizzato</p>
                          <p className="text-sm">
                            Crea una copia di un profilo FIPSAS o crea un nuovo profilo
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab("fipsas")}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copia da FIPSAS
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setCreateDialogOpen(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Nuovo Profilo
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterProfiles(customProfiles).map((profile) => (
                      <ProfileRow key={profile.id} profile={profile} isSystem={false} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Profile Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo Profilo Torneo</DialogTitle>
            <DialogDescription>
              Crea un nuovo profilo personalizzato per la tua associazione
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Profilo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es. Big Game Club Ischia"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione del profilo..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Disciplina *</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Livello *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Modalita di Gioco *</Label>
              <Select
                value={formData.gameMode}
                onValueChange={(value) => setFormData({ ...formData, gameMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAME_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followsFipsasRules"
                checked={formData.followsFipsasRules}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, followsFipsasRules: checked as boolean })
                }
              />
              <Label htmlFor="followsFipsasRules">Segue regolamento FIPSAS</Label>
            </div>
            {formData.followsFipsasRules && (
              <div className="grid gap-2">
                <Label>URL Regolamento FIPSAS</Label>
                <Input
                  value={formData.fipsasRegulationUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, fipsasRegulationUrl: e.target.value })
                  }
                  placeholder="https://www.fipsas.it/..."
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Peso Minimo (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.defaultMinWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultMinWeight: e.target.value })
                  }
                  placeholder="Es. 5"
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Catture/Giorno</Label>
                <Input
                  type="number"
                  value={formData.defaultMaxCatchesPerDay}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultMaxCatchesPerDay: e.target.value })
                  }
                  placeholder="Es. 10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Punti per Kg</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.defaultPointsPerKg}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultPointsPerKg: e.target.value })
                  }
                  placeholder="1"
                />
              </div>
              <div className="grid gap-2">
                <Label>Bonus Partecipazione</Label>
                <Input
                  type="number"
                  value={formData.defaultBonusPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultBonusPoints: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleCreateProfile}
              disabled={formLoading || !formData.name}
            >
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Crea Profilo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Profilo</DialogTitle>
            <DialogDescription>
              Modifica le impostazioni del profilo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome Profilo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrizione</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Disciplina *</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Livello *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Modalita di Gioco *</Label>
              <Select
                value={formData.gameMode}
                onValueChange={(value) => setFormData({ ...formData, gameMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAME_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-followsFipsasRules"
                checked={formData.followsFipsasRules}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, followsFipsasRules: checked as boolean })
                }
              />
              <Label htmlFor="edit-followsFipsasRules">Segue regolamento FIPSAS</Label>
            </div>
            {formData.followsFipsasRules && (
              <div className="grid gap-2">
                <Label>URL Regolamento FIPSAS</Label>
                <Input
                  value={formData.fipsasRegulationUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, fipsasRegulationUrl: e.target.value })
                  }
                  placeholder="https://www.fipsas.it/..."
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Peso Minimo (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.defaultMinWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultMinWeight: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Catture/Giorno</Label>
                <Input
                  type="number"
                  value={formData.defaultMaxCatchesPerDay}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultMaxCatchesPerDay: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Punti per Kg</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.defaultPointsPerKg}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultPointsPerKg: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Bonus Partecipazione</Label>
                <Input
                  type="number"
                  value={formData.defaultBonusPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultBonusPoints: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleEditProfile}
              disabled={formLoading || !formData.name}
            >
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fork Profile Dialog */}
      <Dialog open={forkDialogOpen} onOpenChange={setForkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Copia Personalizzata</DialogTitle>
            <DialogDescription>
              Crea una copia del profilo FIPSAS &quot;{selectedProfile?.name}&quot; che potrai
              modificare liberamente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fork-name">Nome Nuovo Profilo *</Label>
              <Input
                id="fork-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es. Big Game Ischia 2025"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fork-description">Descrizione (opzionale)</Label>
              <Textarea
                id="fork-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrivi le personalizzazioni..."
                rows={2}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Impostazioni ereditate:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Disciplina: {getDisciplineLabel(selectedProfile?.discipline || "")}</li>
                <li>Modalita: {getGameModeLabel(selectedProfile?.gameMode || "")}</li>
                <li>Livello: {getLevelLabel(selectedProfile?.level || "")}</li>
                {selectedProfile?.followsFipsasRules && <li>Regolamento FIPSAS</li>}
              </ul>
              <p className="mt-2 text-xs">Potrai modificare tutte le impostazioni dopo la creazione</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForkDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleForkProfile}
              disabled={formLoading || !formData.name}
            >
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Crea Copia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il profilo &quot;{selectedProfile?.name}&quot;?
              Questa azione non puo essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProfile}
              disabled={formLoading}
            >
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
