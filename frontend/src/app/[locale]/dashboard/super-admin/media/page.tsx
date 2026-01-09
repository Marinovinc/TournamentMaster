"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Image as ImageIcon,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Filter,
  Grid3X3,
  List,
  Star,
  Globe,
  Building2,
  Upload,
  X,
  Video,
  Play,
  ExternalLink,
} from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  title: string;
  description: string | null;
  category: string;
  tags: string | null;
  width: number | null;
  height: number | null;
  isActive: boolean;
  isFeatured: boolean;
  tenantId: string | null;
  tenant: { id: string; name: string; slug: string } | null;
  tournamentId: string | null;
  tournament: { id: string; name: string } | null;
  uploadedBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  mimeType: string | null;
  thumbnailPath: string | null;
  duration: number | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Tournament {
  id: string;
  name: string;
  tenantId: string;
  tenant?: { name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Helper function to check if a file is a video
const isVideoFile = (filename: string) => {
  return /\.(mp4|mov|webm|avi|mkv|mpg|mpeg)$/i.test(filename);
};

// Format duration in mm:ss
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const CATEGORIES = [
  "tournament",
  "boat",
  "catch",
  "port",
  "sea",
  "sunset",
  "action",
  "team",
  "award",
  "general",
];

export default function SuperAdminMediaPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all"); // all, photo, video
  const [tenantFilter, setTenantFilter] = useState("all");
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "general",
    tags: "",
    isGlobal: true,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Edit dialog state
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    isActive: true,
    isFeatured: false,
  });

  // Delete dialog state
  const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);

  // Check if user is SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Fetch tenants list for SuperAdmin
  const fetchTenants = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media/tenants`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    }
  }, [token]);

  // Fetch tournaments list for SuperAdmin (filtered by tenant if selected)
  const fetchTournaments = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (tenantFilter !== "all" && tenantFilter !== "global") {
        params.append("tenantId", tenantFilter);
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media/tournaments?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setTournaments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    }
  }, [token, tenantFilter]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchTournaments();
    // Reset tournament filter when tenant changes
    setTournamentFilter("all");
  }, [fetchTournaments]);

  // Prevent browser from opening/downloading files when dropped outside drop zone
  useEffect(() => {
    const preventDefaultDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefaultDrag);
    window.addEventListener('drop', preventDefaultDrag);
    return () => {
      window.removeEventListener('dragover', preventDefaultDrag);
      window.removeEventListener('drop', preventDefaultDrag);
    };
  }, []);

  const fetchMedia = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (tenantFilter === "global") params.append("onlyGlobal", "true");
      if (mediaTypeFilter !== "all") params.append("mediaType", mediaTypeFilter);
      if (tenantFilter !== "all" && tenantFilter !== "global") params.append("tenantId", tenantFilter);
      if (tournamentFilter !== "all") params.append("tournamentId", tournamentFilter);


      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  }, [token, search, categoryFilter, mediaTypeFilter, tenantFilter, tournamentFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Auto-fill title from filename
      if (!uploadForm.title) {
        const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setUploadForm({ ...uploadForm, title: name });
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.title || !uploadForm.category) {
      setUploadError("File, titolo e categoria sono obbligatori");
      return;
    }

    console.log("Upload debug:", { hasFile: !!uploadFile, hasToken: !!token });
    if (!token) {
      setUploadError("Token mancante - rieffettua il login");
      return;
    }

    setUploadLoading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("category", uploadForm.category);
      formData.append("tags", uploadForm.tags);
      formData.append("isGlobal", uploadForm.isGlobal.toString());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        setIsUploadDialogOpen(false);
        resetUploadForm();
        fetchMedia();
      } else {
        setUploadError(data.message || "Errore durante l'upload");
      }
    } catch (error) {
      setUploadError("Errore di connessione");
    } finally {
      setUploadLoading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadForm({
      title: "",
      description: "",
      category: "general",
      tags: "",
      isGlobal: true,
    });
    setUploadError("");
  };

  const handleEdit = async () => {
    if (!editingMedia) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media/${editingMedia.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      const data = await res.json();

      if (data.success) {
        setEditingMedia(null);
        fetchMedia();
      }
    } catch (error) {
      console.error("Failed to update media:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedia) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media/${deletingMedia.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (data.success) {
        setDeletingMedia(null);
        fetchMedia();
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
    }
  };

  const openEditDialog = (item: MediaItem) => {
    setEditingMedia(item);
    setEditForm({
      title: item.title,
      description: item.description || "",
      category: item.category,
      tags: item.tags || "",
      isActive: item.isActive,
      isFeatured: item.isFeatured,
    });
  };

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Accesso non autorizzato</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Gestisci foto e video disponibili per tutti i tornei
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) resetUploadForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Carica Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Carica Nuovo Media</DialogTitle>
              <DialogDescription>
                Carica una nuova immagine o video nella libreria globale.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {uploadError && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                  {uploadError}
                </div>
              )}

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>File *</Label>
                {uploadPreview ? (
                  <div className="relative">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
                    onClick={() => document.getElementById("file-input")?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        const file = files[0];
                        setUploadFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setUploadPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                        // Auto-fill title from filename
                        if (!uploadForm.title) {
                          const name = file.name.replace(/.[^/.]+$/, '').replace(/[-_]/g, ' ');
                          setUploadForm(prev => ({ ...prev, title: name }));
                        }
                      }
                    }}
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Clicca o trascina un file qui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, GIF, WEBP, MP4, WEBM (max 10MB)
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo *</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="es. Pescatore con tonno"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={uploadForm.category}
                    onValueChange={(v) => setUploadForm({ ...uploadForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Descrizione opzionale dell'immagine..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separati da virgola)</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="es. tonno, pesca, oceano"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isGlobal"
                  checked={uploadForm.isGlobal}
                  onCheckedChange={(checked) => setUploadForm({ ...uploadForm, isGlobal: checked })}
                />
                <Label htmlFor="isGlobal">Media globale (visibile a tutte le associazioni)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleUpload} disabled={uploadLoading}>
                {uploadLoading ? "Caricamento..." : "Carica"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Ricerca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca media..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tutte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo Media</Label>
              <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="photo">Foto</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Associazione</Label>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tutte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="global">Solo Globali</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Torneo</Label>
              <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tornei</SelectItem>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={fetchMedia}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Media</CardDescription>
            <CardTitle className="text-2xl">{pagination.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Globali</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {media.filter((m) => !m.tenantId).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Associazioni</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {media.filter((m) => m.tenantId).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Evidenza</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {media.filter((m) => m.isFeatured).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Media Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle>Libreria Media</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nessun media trovato</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-lg overflow-hidden border bg-muted/50 hover:shadow-lg transition-shadow"
                >
                  {isVideoFile(item.filename) ? (
                    <div className="relative w-full h-32 bg-black cursor-pointer" onClick={() => setViewingMedia(item)}>
                      <video
                        src={item.path}
                        className="w-full h-32 object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-3">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      </div>
                      <Badge className="absolute top-2 left-2 bg-black/70 text-white text-xs">
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </Badge>
                    </div>
                  ) : (
                    <img
                      src={item.path}
                      alt={item.title}
                      className="w-full h-32 object-cover cursor-pointer"
                      onClick={() => setViewingMedia(item)}
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeletingMedia(item); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {item.tenantId ? (
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {item.tenant?.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Globale
                        </Badge>
                      )}
                      {item.isFeatured && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {isVideoFile(item.filename) ? (
                    <div className="relative w-16 h-16 bg-black rounded cursor-pointer" onClick={() => setViewingMedia(item)}>
                      <video
                        src={item.path}
                        className="w-16 h-16 object-cover rounded"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white fill-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.path}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded cursor-pointer"
                      onClick={() => setViewingMedia(item)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.description || "Nessuna descrizione"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      {item.tenantId ? (
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {item.tenant?.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Globale
                        </Badge>
                      )}
                      {item.isFeatured && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => openEditDialog(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => setDeletingMedia(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Precedente
              </Button>
              <span className="flex items-center px-4">
                Pagina {pagination.page} di {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Successiva
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Media</DialogTitle>
            <DialogDescription>
              Modifica i dettagli del media selezionato.
            </DialogDescription>
          </DialogHeader>

          {editingMedia && (
            <div className="grid gap-4 py-4">
              <img
                src={editingMedia.path}
                alt={editingMedia.title}
                className="w-full h-32 object-cover rounded-lg"
              />

              <div className="space-y-2">
                <Label htmlFor="edit-title">Titolo</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrizione</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={editForm.isActive}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                  />
                  <Label htmlFor="edit-active">Attivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-featured"
                    checked={editForm.isFeatured}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, isFeatured: checked })}
                  />
                  <Label htmlFor="edit-featured">In Evidenza</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMedia(null)}>
              Annulla
            </Button>
            <Button onClick={handleEdit}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMedia} onOpenChange={(open) => !open && setDeletingMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Media</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare "{deletingMedia?.title}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* View Media Dialog */}
      <Dialog open={!!viewingMedia} onOpenChange={(open) => !open && setViewingMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingMedia?.title}</DialogTitle>
          </DialogHeader>
          {viewingMedia && (
            <div className="flex flex-col items-center">
              {(viewingMedia.mimeType?.startsWith('video/') || isVideoFile(viewingMedia.filename)) ? (
                <video
                  src={viewingMedia.path}
                  controls
                  autoPlay
                  playsInline
                  width="100%"
                  height="auto"
                  className="rounded-lg bg-black"
                  style={{ minWidth: '600px', minHeight: '400px', maxHeight: '70vh', display: 'block' }}
                >
                  Il tuo browser non supporta il tag video.
                </video>
              ) : (
                <img
                  src={viewingMedia.path}
                  alt={viewingMedia.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg cursor-pointer"
                  onClick={() => window.open(viewingMedia.path, '_blank', 'noopener,noreferrer')}
                  title="Clicca per aprire in una nuova finestra"
                />
              )}
              {viewingMedia.description && (
                <p className="mt-4 text-muted-foreground text-center">{viewingMedia.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
