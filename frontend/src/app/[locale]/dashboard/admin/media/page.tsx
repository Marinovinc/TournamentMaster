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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image as ImageIcon,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Grid3X3,
  List,
  Globe,
  Building2,
  Upload,
  X,
  Lock,
  Play,
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
  uploadedBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  mimeType: string | null;
  thumbnailPath: string | null;
  duration: number | null;
}

// Helper to check if file is video
const isVideoFile = (filename: string): boolean => {
  const ext = filename.toLowerCase();
  return ext.endsWith('.mp4') || ext.endsWith('.mov') || ext.endsWith('.webm') || ext.endsWith('.avi') || ext.endsWith('.mkv');
};

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

export default function TenantAdminMediaPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [globalMedia, setGlobalMedia] = useState<MediaItem[]>([]);
  const [tenantMedia, setTenantMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("global");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [globalPagination, setGlobalPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [tenantPagination, setTenantPagination] = useState<Pagination>({
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
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Edit dialog state
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    isActive: true,
  });

  // Delete dialog state
  const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && !["TENANT_ADMIN", "PRESIDENT", "SUPER_ADMIN"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchGlobalMedia = useCallback(async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      params.append("page", globalPagination.page.toString());
      params.append("limit", globalPagination.limit.toString());
      params.append("onlyGlobal", "true");
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (data.success) {
        setGlobalMedia(data.data);
        setGlobalPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch global media:", error);
    }
  }, [token, search, categoryFilter, globalPagination.page, globalPagination.limit]);

  const fetchTenantMedia = useCallback(async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      params.append("page", tenantPagination.page.toString());
      params.append("limit", tenantPagination.limit.toString());
      params.append("onlyTenant", "true");
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/media?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (data.success) {
        setTenantMedia(data.data);
        setTenantPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch tenant media:", error);
    }
  }, [token, search, categoryFilter, tenantPagination.page, tenantPagination.limit]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchGlobalMedia(), fetchTenantMedia()]);
    setLoading(false);
  }, [fetchGlobalMedia, fetchTenantMedia]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

    setUploadLoading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("category", uploadForm.category);
      formData.append("tags", uploadForm.tags);
      formData.append("isGlobal", "false"); // Tenant media

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
        fetchTenantMedia();
        setActiveTab("tenant"); // Switch to tenant tab to see new upload
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
        fetchTenantMedia();
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
        fetchGlobalMedia();
        fetchTenantMedia();
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
    });
  };

  const renderMediaGrid = (items: MediaItem[], isEditable: boolean) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => {
        const isVideo = isVideoFile(item.filename);
        const previewSrc = isVideo && item.thumbnailPath
          ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${item.thumbnailPath}`
          : item.path;

        return (
        <div
          key={item.id}
          className="group relative rounded-lg overflow-hidden border bg-muted/50 hover:shadow-lg transition-shadow"
        >
          <div className="relative">
            <img
              src={previewSrc}
              alt={item.title}
              className="w-full h-32 object-cover"
              onError={(e) => {
                // Fallback if thumbnail fails
                if (isVideo) {
                  (e.target as HTMLImageElement).src = "/images/video-placeholder.png";
                }
              }}
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 rounded-full p-2">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>
            )}
          </div>
          {isEditable && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" onClick={() => openEditDialog(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={() => setDeletingMedia(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!isEditable && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Sola lettura
              </Badge>
            </div>
          )}
          <div className="p-2">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
          </div>
        </div>
        );
      })}
    </div>
  );

  const renderMediaList = (items: MediaItem[], isEditable: boolean) => (
    <div className="space-y-2">
      {items.map((item) => {
        const isVideo = isVideoFile(item.filename);
        const previewSrc = isVideo && item.thumbnailPath
          ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${item.thumbnailPath}`
          : item.path;

        return (
        <div
          key={item.id}
          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="relative">
            <img
              src={previewSrc}
              alt={item.title}
              className="w-16 h-16 object-cover rounded"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-4 w-4 text-white drop-shadow-lg" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground truncate">
              {item.description || "Nessuna descrizione"}
            </p>
            <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
          </div>
          {isEditable ? (
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={() => openEditDialog(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setDeletingMedia(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Sola lettura
            </Badge>
          )}
        </div>
        );
      })}
    </div>
  );

  if (!user || !["TENANT_ADMIN", "PRESIDENT", "SUPER_ADMIN"].includes(user.role)) {
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
          <h1 className="text-3xl font-bold tracking-tight">Media Associazione</h1>
          <p className="text-muted-foreground">
            Gestisci le foto e i video della tua associazione
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
                Carica una nuova immagine o video per la tua associazione.
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
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => document.getElementById("file-input")?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const input = document.getElementById("file-input") as HTMLInputElement;
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                      }
                    }}
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Clicca o trascina un file qui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, GIF, WEBP, MP4, WEBM, MOV, AVI (max 100MB)
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo,.mov,.avi"
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
                    placeholder="es. Premiazione torneo"
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
                  placeholder="es. torneo, premiazione, 2024"
                />
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
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoria" />
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
            <Button variant="outline" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Media Globali Disponibili</CardDescription>
            <CardTitle className="text-2xl text-blue-600 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {globalPagination.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Media della Tua Associazione</CardDescription>
            <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {tenantPagination.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Disponibili</CardDescription>
            <CardTitle className="text-2xl">
              {globalPagination.total + tenantPagination.total}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Media Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Libreria Globale ({globalPagination.total})
              </TabsTrigger>
              <TabsTrigger value="tenant" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                I Miei Media ({tenantPagination.total})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {activeTab === "global" && (
                <>
                  {globalMedia.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Nessun media globale disponibile</p>
                    </div>
                  ) : viewMode === "grid" ? (
                    renderMediaGrid(globalMedia, true)
                  ) : (
                    renderMediaList(globalMedia, true)
                  )}

                  {globalPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        disabled={globalPagination.page <= 1}
                        onClick={() => setGlobalPagination({ ...globalPagination, page: globalPagination.page - 1 })}
                      >
                        Precedente
                      </Button>
                      <span className="flex items-center px-4">
                        Pagina {globalPagination.page} di {globalPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        disabled={globalPagination.page >= globalPagination.totalPages}
                        onClick={() => setGlobalPagination({ ...globalPagination, page: globalPagination.page + 1 })}
                      >
                        Successiva
                      </Button>
                    </div>
                  )}
                </>
              )}

              {activeTab === "tenant" && (
                <>
                  {tenantMedia.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Non hai ancora caricato media</p>
                      <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Carica il primo media
                      </Button>
                    </div>
                  ) : viewMode === "grid" ? (
                    renderMediaGrid(tenantMedia, true)
                  ) : (
                    renderMediaList(tenantMedia, true)
                  )}

                  {tenantPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        disabled={tenantPagination.page <= 1}
                        onClick={() => setTenantPagination({ ...tenantPagination, page: tenantPagination.page - 1 })}
                      >
                        Precedente
                      </Button>
                      <span className="flex items-center px-4">
                        Pagina {tenantPagination.page} di {tenantPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        disabled={tenantPagination.page >= tenantPagination.totalPages}
                        onClick={() => setTenantPagination({ ...tenantPagination, page: tenantPagination.page + 1 })}
                      >
                        Successiva
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
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
    </div>
  );
}
