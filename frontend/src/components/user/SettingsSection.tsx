/**
 * =============================================================================
 * SETTINGS SECTION - User Settings & Membership
 * =============================================================================
 * Impostazioni utente con:
 * - Tessera associativa
 * - Informazioni FIPSAS
 * - Documenti (patente nautica, MIPAF, etc.)
 * - Stato membership
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface SettingsSectionProps {
  primaryColor?: string;
}

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

export default function SettingsSection({ primaryColor = "#0066CC" }: SettingsSectionProps) {
  const { token, user } = useAuth();

  // State
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch membership
  useEffect(() => {
    async function fetchMembership() {
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/memberships/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento");

        const data = await res.json();
        setMembership(data.data);
      } catch (err) {
        console.error("Error fetching membership:", err);
        setError("Impossibile caricare i dati tessera");
      } finally {
        setLoading(false);
      }
    }

    fetchMembership();
  }, [token]);

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

      {/* User Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" style={{ color: primaryColor }} />
            Informazioni Personali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ruolo</p>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Documents Info */}
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
            {/* Document placeholders */}
            <div className="p-4 border rounded-lg border-dashed flex items-center gap-3 text-muted-foreground">
              <Shield className="h-8 w-8" />
              <div>
                <p className="font-medium text-foreground">Patente Nautica</p>
                <p className="text-sm">Non registrata</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg border-dashed flex items-center gap-3 text-muted-foreground">
              <Award className="h-8 w-8" />
              <div>
                <p className="font-medium text-foreground">Licenza MIPAF</p>
                <p className="text-sm">Non registrata</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg border-dashed flex items-center gap-3 text-muted-foreground">
              <Fish className="h-8 w-8" />
              <div>
                <p className="font-medium text-foreground">Tessera FIPSAS</p>
                <p className="text-sm">Non registrata</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg border-dashed flex items-center gap-3 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <div>
                <p className="font-medium text-foreground">Assicurazione</p>
                <p className="text-sm">Non registrata</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            La gestione documenti sara disponibile prossimamente. Contatta l'associazione per registrare i tuoi documenti.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
