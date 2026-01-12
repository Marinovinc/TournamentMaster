/**
 * =============================================================================
 * SETTINGS SECTION - User Settings & Membership
 * =============================================================================
 * Impostazioni utente con:
 * - Modifica profilo (nome, cognome, telefono)
 * - Cambio password
 * - Upload avatar
 * - Tessera associativa
 * - Informazioni FIPSAS
 * - Documenti (patente nautica, MIPAF, etc.)
 * =============================================================================
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { getMediaUrl } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Fish,
  FileText,
  Award,
  Shield,
  User,
  Pencil,
  Key,
  Camera,
  Upload,
  Trash2,
  Eye,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types
interface Membership {
  id: string;
  cardNumber?: string;
  memberSince: string;
  validFrom: string;
  validUntil: string;
  status: string;
  feePaid?: number;
  feeYear?: number;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    fipsasCode?: string;
    fipsasRegion?: string;
  };
}

interface Document {
  id: string;
  type: string;
  status: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  expiryDate?: string;
  reviewNotes?: string;
  createdAt: string;
}

interface SettingsSectionProps {
  primaryColor?: string;
  readOnly?: boolean;
}

// Document type configuration
const documentTypeConfig: Record<string, { label: string; icon: typeof Shield }> = {
  NAUTICAL_LICENSE: { label: "Patente Nautica", icon: Shield },
  MIPAF: { label: "Licenza MIPAF", icon: Award },
  TESSERA_FIPSAS: { label: "Tessera FIPSAS", icon: Fish },
  ASSICURAZIONE: { label: "Assicurazione", icon: FileText },
  MEDICAL_CERTIFICATE: { label: "Certificato Medico", icon: FileText },
  IDENTITY_DOCUMENT: { label: "Documento Identita", icon: User },
};

// Document status configuration
const documentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "In Attesa", variant: "outline" },
  APPROVED: { label: "Approvato", variant: "default" },
  REJECTED: { label: "Rifiutato", variant: "destructive" },
  EXPIRED: { label: "Scaduto", variant: "secondary" },
};

// Status configuration
const membershipStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
  ACTIVE: { label: "Attiva", variant: "default", icon: CheckCircle },
  EXPIRED: { label: "Scaduta", variant: "destructive", icon: AlertCircle },
  PENDING: { label: "In Attesa", variant: "outline", icon: Clock },
  SUSPENDED: { label: "Sospesa", variant: "secondary", icon: AlertCircle },
};

// Format date
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Check if expired
function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

// Days until expiry
function daysUntilExpiry(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SettingsSection({ primaryColor = "#0066CC", readOnly = false }: SettingsSectionProps) {
  const { token, user, updateUser } = useAuth();

  // State
  const [membership, setMembership] = useState<Membership | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile editing state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Document upload state
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentExpiryDate, setDocumentExpiryDate] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Initialize profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Fetch membership and documents
  useEffect(() => {
    async function fetchData() {
      if (!token) return;

      setLoading(true);
      try {
        const [membershipRes, documentsRes] = await Promise.all([
          fetch(`${API_URL}/api/memberships/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/documents`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          setMembership(membershipData.data);
        }

        if (documentsRes.ok) {
          const documentsData = await documentsRes.json();
          setDocuments(documentsData.data || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Impossibile caricare i dati");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!token) return;

    setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (!res.ok) throw new Error("Errore nel salvataggio");

      const data = await res.json();

      // Update context
      updateUser({
        firstName: data.data.firstName,
        lastName: data.data.lastName,
        phone: data.data.phone,
      });

      setIsEditProfileOpen(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Errore nel salvataggio del profilo");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!token) return;

    setPasswordError(null);

    // Validate
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("La nuova password deve essere di almeno 8 caratteri");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Le password non coincidono");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Errore nel cambio password");
      }

      setIsPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password aggiornata con successo");
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError(err instanceof Error ? err.message : "Errore nel cambio password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${API_URL}/api/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Errore nell'upload");

      const data = await res.json();
      updateUser({ avatar: data.data.avatar });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Errore nell'upload dell'avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  // Delete avatar
  const handleDeleteAvatar = async () => {
    if (!token || !user?.avatar) return;

    if (!confirm("Sei sicuro di voler rimuovere la foto profilo?")) return;

    try {
      const res = await fetch(`${API_URL}/api/users/me/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Errore nella rimozione");

      updateUser({ avatar: null });
    } catch (err) {
      console.error("Error deleting avatar:", err);
      alert("Errore nella rimozione dell'avatar");
    }
  };

  // Upload document
  const handleDocumentUpload = async () => {
    if (!token || !selectedDocType || !documentFile) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append("file", documentFile);
      formData.append("type", selectedDocType);
      if (documentExpiryDate) {
        formData.append("expiryDate", documentExpiryDate);
      }

      const res = await fetch(`${API_URL}/api/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Errore nell'upload");

      const data = await res.json();

      // Update documents list
      setDocuments(prev => {
        const filtered = prev.filter(d => d.type !== selectedDocType);
        return [...filtered, data.data];
      });

      setIsDocumentDialogOpen(false);
      setSelectedDocType(null);
      setDocumentFile(null);
      setDocumentExpiryDate("");
    } catch (err) {
      console.error("Error uploading document:", err);
      alert("Errore nell'upload del documento");
    } finally {
      setUploadingDocument(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId: string) => {
    if (!token) return;

    if (!confirm("Sei sicuro di voler eliminare questo documento?")) return;

    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Errore nell'eliminazione");

      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Errore nell'eliminazione del documento");
    }
  };

  // Get document by type
  const getDocumentByType = (type: string) => documents.find(d => d.type === type);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
        Impostazioni e Tessera
      </h3>

      {/* User Info Card - EDITABLE */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: primaryColor }} />
              Informazioni Personali
            </CardTitle>
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Modifica
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  <Key className="h-3 w-3 mr-1" />
                  Password
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <>
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={getMediaUrl(user.avatar)}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-muted"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {!readOnly && (
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                        title="Cambia foto"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                      </button>
                      {user.avatar && (
                        <button
                          onClick={handleDeleteAvatar}
                          className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                          title="Rimuovi foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <p className="font-medium text-lg">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="mt-1">{user.role}</Badge>
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{user.phone || "Non specificato"}</p>
                </div>
                {membership && (
                  <div>
                    <p className="text-sm text-muted-foreground">Associazione</p>
                    <p className="font-medium">{membership.tenant.name}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Profilo</DialogTitle>
            <DialogDescription>
              Aggiorna le tue informazioni personali
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome</Label>
              <Input
                id="lastName"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambia Password</DialogTitle>
            <DialogDescription>
              Inserisci la password attuale e la nuova password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {passwordError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Attuale</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Minimo 8 caratteri
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                "Aggiorna Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Membership Card */}
      {membership ? (
        <Card className="overflow-hidden">
          {/* Card Header with Logo */}
          <div
            className="p-6 text-white"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {membership.tenant.logo ? (
                  <img
                    src={membership.tenant.logo}
                    alt={membership.tenant.name}
                    className="w-16 h-16 rounded-lg bg-white p-1 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
                    <Fish className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-white/80 text-sm">Tessera Associativa</p>
                  <h4 className="text-xl font-bold">{membership.tenant.name}</h4>
                  {membership.cardNumber && (
                    <p className="text-white/90 font-mono mt-1">
                      N. {membership.cardNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              {(() => {
                const config = membershipStatusConfig[membership.status];
                const StatusIcon = config?.icon || CheckCircle;
                return (
                  <Badge
                    variant={config?.variant || "outline"}
                    className="text-sm"
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config?.label || membership.status}
                  </Badge>
                );
              })()}
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {/* Dates */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Socio Dal
                </p>
                <p className="font-medium">{formatDate(membership.memberSince)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Valida Dal
                </p>
                <p className="font-medium">{formatDate(membership.validFrom)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Scadenza
                </p>
                <p className={`font-medium ${isExpired(membership.validUntil) ? "text-destructive" : ""}`}>
                  {formatDate(membership.validUntil)}
                </p>
              </div>
              {membership.feeYear && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Quota Anno
                  </p>
                  <p className="font-medium">{membership.feeYear}</p>
                </div>
              )}
            </div>

            {/* Expiry Warning */}
            {membership.status === "ACTIVE" && (
              (() => {
                const days = daysUntilExpiry(membership.validUntil);
                if (days <= 30 && days > 0) {
                  return (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4" />
                      La tua tessera scade tra {days} giorni. Ricordati di rinnovarla!
                    </div>
                  );
                }
                if (days <= 0) {
                  return (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4" />
                      La tua tessera e scaduta. Contatta l'associazione per il rinnovo.
                    </div>
                  );
                }
                return null;
              })()
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-2">
              Nessuna tessera associativa registrata
            </p>
            <p className="text-sm text-muted-foreground">
              Contatta l'associazione per ottenere la tua tessera
            </p>
          </CardContent>
        </Card>
      )}

      {/* FIPSAS Info */}
      {membership?.tenant.fipsasCode && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Fish className="h-4 w-4" style={{ color: primaryColor }} />
              Affiliazione FIPSAS
            </CardTitle>
            <CardDescription>
              Federazione Italiana Pesca Sportiva e Attivita Subacquee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Codice Societa</p>
                <p className="font-medium font-mono">{membership.tenant.fipsasCode}</p>
              </div>
              {membership.tenant.fipsasRegion && (
                <div>
                  <p className="text-sm text-muted-foreground">Regione</p>
                  <p className="font-medium">{membership.tenant.fipsasRegion}</p>
                </div>
              )}
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                L'affiliazione FIPSAS consente la partecipazione a gare e tornei ufficiali
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents - INTERACTIVE */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: primaryColor }} />
            Documenti
          </CardTitle>
          <CardDescription>
            Gestione documenti come patente nautica, licenza MIPAF, assicurazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Document Cards */}
            {Object.entries(documentTypeConfig).map(([type, config]) => {
              const doc = getDocumentByType(type);
              const DocIcon = config.icon;

              return (
                <div
                  key={type}
                  className={`p-4 border rounded-lg ${
                    doc ? "" : "border-dashed"
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <DocIcon className={`h-8 w-8 ${doc ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium">{config.label}</p>
                      {doc ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={documentStatusConfig[doc.status]?.variant || "outline"}>
                            {documentStatusConfig[doc.status]?.label || doc.status}
                          </Badge>
                          {doc.expiryDate && (
                            <span className={`text-xs ${isExpired(doc.expiryDate) ? "text-destructive" : "text-muted-foreground"}`}>
                              Scade: {formatDate(doc.expiryDate)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Non registrato</p>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex gap-1">
                      {doc && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(getMediaUrl(doc.filePath), "_blank")}
                            title="Visualizza"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDocType(type);
                          setIsDocumentDialogOpen(true);
                        }}
                        title={doc ? "Sostituisci" : "Carica"}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Dialog */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Carica {selectedDocType && documentTypeConfig[selectedDocType]?.label}
            </DialogTitle>
            <DialogDescription>
              Seleziona il file del documento. Formati accettati: PDF, JPG, PNG
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>File</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => documentInputRef.current?.click()}
              >
                {documentFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="font-medium">{documentFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clicca per selezionare un file
                    </p>
                  </>
                )}
              </div>
              <input
                ref={documentInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setDocumentFile(file);
                }}
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Data di Scadenza (opzionale)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={documentExpiryDate}
                onChange={(e) => setDocumentExpiryDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDocumentDialogOpen(false);
                setSelectedDocType(null);
                setDocumentFile(null);
                setDocumentExpiryDate("");
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={handleDocumentUpload}
              disabled={!documentFile || uploadingDocument}
            >
              {uploadingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Caricamento...
                </>
              ) : (
                "Carica"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
