/**
 * =============================================================================
 * USERS MANAGEMENT PAGE
 * =============================================================================
 * Gestione utenti della piattaforma
 * =============================================================================
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  RefreshCw,
  UserCheck,
  UserX,
  Crown,
  User,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

// Types
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  fipsasNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
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

// Role priority (lower = higher priority, PARTICIPANT last)
const ROLE_PRIORITY: Record<string, number> = {
  SUPER_ADMIN: 1,
  TENANT_ADMIN: 2,
  PRESIDENT: 3,
  ORGANIZER: 4,
  JUDGE: 5,
  CAPTAIN: 6,
  PARTICIPANT: 99,
};

// Roles sorted alphabetically for filter dropdown
const ROLES_ALPHABETICAL = [
  { value: "TENANT_ADMIN", label: "Admin Societa" },
  { value: "CAPTAIN", label: "Capitano" },
  { value: "JUDGE", label: "Giudice" },
  { value: "ORGANIZER", label: "Organizzatore" },
  { value: "PARTICIPANT", label: "Partecipante" },
  { value: "PRESIDENT", label: "Presidente" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

// Sorting types
type SortField = "name" | "email" | "role" | "fipsas" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

export default function UsersPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("role");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "PARTICIPANT",
    fipsasNumber: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch users
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, API_URL]);
  // Extract unique tenants from users
  const tenants = useMemo(() => {
    const tenantMap = new Map<string, { id: string; name: string }>();
    users.forEach((u) => {
      if (u.tenant) {
        tenantMap.set(u.tenant.id, u.tenant);
      }
    });
    return Array.from(tenantMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);



  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />;
    }
    return sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  // Filter and sort users
  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesTenant = tenantFilter === "ALL" || u.tenant?.id === tenantFilter;
      return matchesSearch && matchesRole && matchesTenant;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "role":
          comparison = (ROLE_PRIORITY[a.role] || 50) - (ROLE_PRIORITY[b.role] || 50);
          break;
        case "fipsas":
          comparison = (a.fipsasNumber || "").localeCompare(b.fipsasNumber || "");
          break;
        case "status":
          comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setUsers(users.map((u) =>
          u.id === selectedUser.id ? { ...u, ...data.data } : u
        ));
        setEditDialogOpen(false);
        setSelectedUser(null);
      } else {
        alert(`Errore: ${data.message || "Aggiornamento utente fallito"}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Errore di rete");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (userToToggle: UserData) => {
    const action = userToToggle.isActive ? "disattivare" : "attivare";
    if (!confirm(`Vuoi ${action} l'utente ${userToToggle.firstName} ${userToToggle.lastName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userToToggle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !userToToggle.isActive }),
      });

      const data = await response.json();
      if (response.ok) {
        setUsers(users.map((u) =>
          u.id === userToToggle.id ? { ...u, isActive: !userToToggle.isActive } : u
        ));
      } else {
        alert(`Errore: ${data.message || "Operazione fallita"}`);
      }
    } catch (error) {
      console.error("Error toggling user:", error);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== selectedUser.id));
      } else {
        const data = await response.json();
        alert(`Errore: ${data.message || "Eliminazione fallita"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      setFormLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (userToEdit: UserData) => {
    setSelectedUser(userToEdit);
    setFormData({
      firstName: userToEdit.firstName,
      lastName: userToEdit.lastName,
      email: userToEdit.email,
      phone: userToEdit.phone || "",
      role: userToEdit.role,
      fipsasNumber: userToEdit.fipsasNumber || "",
    });
    setEditDialogOpen(true);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get role icon
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
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8" />
              Gestione Utenti
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestisci gli utenti della piattaforma
            </p>
          </div>
          <HelpGuide pageKey="users" position="inline" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale Utenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u) => ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"].includes(u.role)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partecipanti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "PARTICIPANT").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Utenti Registrati</CardTitle>
              <CardDescription>
                {filteredUsers.length} utenti trovati
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca utenti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtra per associazione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutte le associazioni</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtra per ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti i ruoli</SelectItem>
                  {ROLES_ALPHABETICAL.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center font-medium hover:text-primary transition-colors"
                    >
                      Utente
                      {getSortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center font-medium hover:text-primary transition-colors"
                    >
                      Contatti
                      {getSortIcon("email")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("role")}
                      className="flex items-center font-medium hover:text-primary transition-colors"
                    >
                      Ruolo
                      {getSortIcon("role")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("fipsas")}
                      className="flex items-center font-medium hover:text-primary transition-colors"
                    >
                      FIPSAS
                      {getSortIcon("fipsas")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center font-medium hover:text-primary transition-colors"
                    >
                      Stato
                      {getSortIcon("status")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center font-medium hover:text-primary transition-colors"
                    >
                      Registrato
                      {getSortIcon("createdAt")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p>Nessun utente trovato</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {userItem.firstName?.[0]}
                            {userItem.lastName?.[0]}
                          </div>
                          <div>
                            <span className="font-medium">
                              {userItem.firstName} {userItem.lastName}
                            </span>
                            {userItem.tenant && (
                              <p className="text-xs text-muted-foreground">
                                {userItem.tenant.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {userItem.email}
                          </span>
                          {userItem.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {userItem.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_COLORS[userItem.role] || "outline"} className="gap-1">
                          {getRoleIcon(userItem.role)}
                          {ROLE_LABELS[userItem.role] || userItem.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userItem.fipsasNumber || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {userItem.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Attivo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            <UserX className="h-3 w-3 mr-1" />
                            Disattivato
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(userItem.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(userItem)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(userItem)}>
                              {userItem.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Disattiva
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Attiva
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedUser(userItem);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica i dati dell&apos;utente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Cognome *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Ruolo</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTICIPANT">Partecipante</SelectItem>
                  <SelectItem value="CAPTAIN">Capitano</SelectItem>
                  <SelectItem value="JUDGE">Giudice</SelectItem>
                  <SelectItem value="ORGANIZER">Organizzatore</SelectItem>
                  <SelectItem value="PRESIDENT">Presidente</SelectItem>
                  <SelectItem value="TENANT_ADMIN">Admin Societa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fipsasNumber">Numero FIPSAS</Label>
              <Input
                id="fipsasNumber"
                value={formData.fipsasNumber}
                onChange={(e) => setFormData({ ...formData, fipsasNumber: e.target.value })}
                placeholder="Es. ABC123456"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateUser} disabled={formLoading || !formData.firstName || !formData.lastName}>
              {formLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Salva
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
              Sei sicuro di voler eliminare l&apos;utente &quot;{selectedUser?.firstName} {selectedUser?.lastName}&quot;?
              Questa azione non puo essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={formLoading}>
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
