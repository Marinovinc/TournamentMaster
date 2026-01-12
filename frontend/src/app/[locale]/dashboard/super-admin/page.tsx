"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Snowflake,
  Sun,
  LogIn,
  Users,
  Trophy,
  RefreshCw,
  Eye,
  Server,
  ExternalLink,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo: string | null;
  primaryColor: string;
  isActive: boolean;
  createdAt: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }[];
  _count: {
    users: number;
    tournaments: number;
  };
}

export default function SuperAdminPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "it";

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: "freeze" | "unfreeze" | "confirm" | "impersonate" | null;
    tenant: Tenant | null;
  }>({ type: null, tenant: null });

  // Form state for new tenant
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    domain: "",
    primaryColor: "#0066CC",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
    adminPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Check if user is SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchTenants = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/tenants?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async () => {
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/tenants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTenant),
        }
      );

      const data = await res.json();

      if (data.success) {
        setIsCreateDialogOpen(false);
        setNewTenant({
          name: "",
          slug: "",
          domain: "",
          primaryColor: "#0066CC",
          adminEmail: "",
          adminFirstName: "",
          adminLastName: "",
          adminPassword: "",
        });
        fetchTenants();
      } else {
        setFormError(data.message || "Errore durante la creazione");
      }
    } catch (error) {
      setFormError("Errore di connessione");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.type || !actionDialog.tenant) return;

    const { type, tenant } = actionDialog;

    try {
      let endpoint = "";
      let method = "PATCH";
      let body: any = {};

      switch (type) {
        case "freeze":
          endpoint = `/api/tenants/${tenant.id}/freeze`;
          body = { frozen: true };
          break;
        case "unfreeze":
          endpoint = `/api/tenants/${tenant.id}/freeze`;
          body = { frozen: false };
          break;
        case "confirm":
          endpoint = `/api/tenants/${tenant.id}/confirm`;
          break;
        case "impersonate":
          endpoint = `/api/tenants/${tenant.id}/impersonate`;
          method = "POST";
          break;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${endpoint}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        }
      );

      const data = await res.json();

      if (data.success) {
        if (type === "impersonate" && data.data.token) {
          // Store the impersonation token and redirect to association page
          localStorage.setItem("impersonationToken", data.data.token);
          localStorage.setItem("impersonatingTenant", JSON.stringify(data.data.tenant));
          // Redirect to association page using tenant slug
          const tenantSlug = data.data.tenant?.slug || tenant.slug;
          router.push(`/${locale}/associazioni/${tenantSlug}`);
        } else {
          fetchTenants();
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionDialog({ type: null, tenant: null });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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
          <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Gestione Associazioni</h1>
          <HelpGuide pageKey="superAdmin" position="inline" isAdmin={true} />
        </div>
          <p className="text-muted-foreground">
            Amministra tutte le associazioni iscritte alla piattaforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="http://localhost:8088/server_manager.html" target="_blank" rel="noopener noreferrer">
              <Server className="mr-2 h-4 w-4" />
              Server Manager
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuova Associazione
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registra Nuova Associazione</DialogTitle>
              <DialogDescription>
                Inserisci i dati dell'associazione e del suo amministratore principale.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {formError && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Associazione *</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) => {
                      setNewTenant({
                        ...newTenant,
                        name: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    placeholder="es. Pesca Club Milano"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={newTenant.slug}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase() })
                    }
                    placeholder="es. pesca-club-milano"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Dominio (opzionale)</Label>
                  <Input
                    id="domain"
                    value={newTenant.domain}
                    onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })}
                    placeholder="es. pescaclubmilano.it"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Colore Principale</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={newTenant.primaryColor}
                      onChange={(e) => setNewTenant({ ...newTenant, primaryColor: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={newTenant.primaryColor}
                      onChange={(e) => setNewTenant({ ...newTenant, primaryColor: e.target.value })}
                      placeholder="#0066CC"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <hr className="my-2" />
              <h4 className="font-medium">Amministratore Associazione</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminFirstName">Nome *</Label>
                  <Input
                    id="adminFirstName"
                    value={newTenant.adminFirstName}
                    onChange={(e) => setNewTenant({ ...newTenant, adminFirstName: e.target.value })}
                    placeholder="Mario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminLastName">Cognome *</Label>
                  <Input
                    id="adminLastName"
                    value={newTenant.adminLastName}
                    onChange={(e) => setNewTenant({ ...newTenant, adminLastName: e.target.value })}
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={newTenant.adminEmail}
                    onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                    placeholder="admin@associazione.it"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={newTenant.adminPassword}
                    onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                    placeholder="Minimo 6 caratteri"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleCreateTenant} disabled={formLoading}>
                {formLoading ? "Creazione..." : "Crea Associazione"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca associazione..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                <SelectItem value="active">Attive</SelectItem>
                <SelectItem value="frozen">Congelate</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTenants}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Associazioni</CardDescription>
            <CardTitle className="text-2xl">{tenants.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attive</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {tenants.filter((t) => t.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Attesa Conferma</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {tenants.filter((t) => !t.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Utenti</CardDescription>
            <CardTitle className="text-2xl">
              {tenants.reduce((sum, t) => sum + t._count.users, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Associazioni</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nessuna associazione trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associazione</TableHead>
                  <TableHead>Amministratore</TableHead>
                  <TableHead>Utenti</TableHead>
                  <TableHead>Tornei</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Iscrizione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const admin = tenant.users.find(
                    (u) => u.role === "TENANT_ADMIN" || u.role === "PRESIDENT"
                  );
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: tenant.primaryColor + "20" }}
                          >
                            <Building2
                              className="h-5 w-5"
                              style={{ color: tenant.primaryColor }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin ? (
                          <div>
                            <p className="font-medium">
                              {admin.firstName} {admin.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {tenant._count.users}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          {tenant._count.tournaments}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Attiva
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            In Attesa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.createdAt).toLocaleDateString("it-IT")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!tenant.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => setActionDialog({ type: "confirm", tenant })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {tenant.isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600"
                              onClick={() => setActionDialog({ type: "freeze", tenant })}
                            >
                              <Snowflake className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600"
                              onClick={() => setActionDialog({ type: "unfreeze", tenant })}
                            >
                              <Sun className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setActionDialog({ type: "impersonate", tenant })}
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            Entra
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={actionDialog.type !== null}
        onOpenChange={() => setActionDialog({ type: null, tenant: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === "freeze" && "Congela Associazione"}
              {actionDialog.type === "unfreeze" && "Scongela Associazione"}
              {actionDialog.type === "confirm" && "Conferma Registrazione"}
              {actionDialog.type === "impersonate" && "Entra nell'Associazione"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === "freeze" &&
                `Sei sicuro di voler congelare "${actionDialog.tenant?.name}"? Gli utenti non potranno accedere.`}
              {actionDialog.type === "unfreeze" &&
                `Sei sicuro di voler scongelare "${actionDialog.tenant?.name}"? Gli utenti potranno accedere nuovamente.`}
              {actionDialog.type === "confirm" &&
                `Confermi che il pagamento per "${actionDialog.tenant?.name}" è stato ricevuto? L'associazione sarà attivata.`}
              {actionDialog.type === "impersonate" &&
                `Stai per entrare nell'associazione "${actionDialog.tenant?.name}" come amministratore. Potrai gestire utenti, tornei e impostazioni.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {actionDialog.type === "freeze" && "Congela"}
              {actionDialog.type === "unfreeze" && "Scongela"}
              {actionDialog.type === "confirm" && "Conferma Pagamento"}
              {actionDialog.type === "impersonate" && "Entra"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
