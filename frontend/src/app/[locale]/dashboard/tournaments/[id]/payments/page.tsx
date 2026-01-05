/**
 * =============================================================================
 * TOURNAMENT PAYMENTS PAGE
 * =============================================================================
 * Gestione pagamenti del torneo
 * - Vista pagamenti per equipaggio/barca
 * - Registrazione pagamenti manuali (cash, bonifico)
 * - Statistiche incassi
 * =============================================================================
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Ship,
  Euro,
  Banknote,
  Building,
  AlertCircle,
  RefreshCw,
  Hash,
  Users,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface Registration {
  id: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  registeredAt: string;
  confirmedAt: string | null;
  teamName: string | null;
  boatName: string | null;
  boatLength: number | null;
  boatNumber: number | null;
  clubName: string | null;
  clubCode: string | null;
  amountPaid: number | null;
  paymentId: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  registrationFee: number;
}

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "OTHER";

export default function PaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isAdmin } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !tournamentId) return;

      try {
        setLoading(true);

        // Fetch tournament info
        const tournamentRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tournamentRes.ok) {
          const tournamentData = await tournamentRes.json();
          setTournament(tournamentData.data);

          // Activate Tournament Mode
          const tournamentModeData = {
            id: tournamentData.data.id,
            name: tournamentData.data.name,
            status: tournamentData.data.status,
          };
          localStorage.setItem("activeTournament", JSON.stringify(tournamentModeData));
          window.dispatchEvent(new Event("tournamentChanged"));
        }

        // Fetch all registrations (not just confirmed)
        const registrationsRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}/registrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (registrationsRes.ok) {
          const registrationsData = await registrationsRes.json();
          setRegistrations(registrationsData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, tournamentId, API_URL]);

  // Stats calculation
  const stats = useMemo(() => {
    const paid = registrations.filter(r => r.status === "CONFIRMED");
    const pending = registrations.filter(r => r.status === "PENDING_PAYMENT");

    const totalCollected = paid.reduce((sum, r) => {
      const amount = typeof r.amountPaid === "number"
        ? r.amountPaid
        : parseFloat(r.amountPaid as unknown as string) || 0;
      return sum + amount;
    }, 0);

    const expectedTotal = registrations
      .filter(r => r.status !== "CANCELLED" && r.status !== "REFUNDED")
      .length * (Number(tournament?.registrationFee) || 0);

    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      totalCount: registrations.filter(r => r.status !== "CANCELLED" && r.status !== "REFUNDED").length,
      totalCollected: Number(totalCollected) || 0,
      expectedTotal: Number(expectedTotal) || 0,
      pendingAmount: (Number(expectedTotal) || 0) - (Number(totalCollected) || 0),
    };
  }, [registrations, tournament]);

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // Exclude cancelled/refunded from default view
      if (filterStatus === "ALL" && (r.status === "CANCELLED" || r.status === "REFUNDED")) {
        return false;
      }

      if (filterStatus !== "ALL" && r.status !== filterStatus) {
        return false;
      }

      const searchLower = searchQuery.toLowerCase();
      const fullName = `${r.user.firstName} ${r.user.lastName}`.toLowerCase();

      return (
        fullName.includes(searchLower) ||
        r.teamName?.toLowerCase().includes(searchLower) ||
        r.boatName?.toLowerCase().includes(searchLower) ||
        r.user.email.toLowerCase().includes(searchLower)
      );
    });
  }, [registrations, searchQuery, filterStatus]);

  // Open payment dialog
  const openPaymentDialog = (registration: Registration) => {
    setSelectedRegistration(registration);
    setPaymentAmount(tournament?.registrationFee?.toString() || "");
    setPaymentMethod("CASH");
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  };

  // Submit payment
  const handleSubmitPayment = async () => {
    if (!selectedRegistration || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Inserisci un importo valido");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/tournaments/${tournamentId}/registrations/${selectedRegistration.id}/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            method: paymentMethod,
            notes: paymentNotes || undefined,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setRegistrations(registrations.map(r =>
          r.id === selectedRegistration.id
            ? { ...r, status: "CONFIRMED" as const, amountPaid: amount, confirmedAt: new Date().toISOString() }
            : r
        ));
        setPaymentDialogOpen(false);
      } else {
        const data = await res.json();
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge
  const getStatusBadge = (status: Registration["status"]) => {
    const config: Record<Registration["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      CONFIRMED: { label: "Pagato", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      PENDING_PAYMENT: { label: "Da Pagare", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      CANCELLED: { label: "Cancellato", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      REFUNDED: { label: "Rimborsato", variant: "outline", icon: <RefreshCw className="h-3 w-3" /> },
    };

    const { label, variant, icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  // Parse payment info from paymentId JSON
  const getPaymentInfo = (paymentId: string | null) => {
    if (!paymentId) return null;
    try {
      // Check if it's JSON (manual payment) or Stripe ID
      if (paymentId.startsWith("{")) {
        return JSON.parse(paymentId);
      }
      return { method: "ONLINE", stripeId: paymentId };
    } catch {
      return null;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: "Contanti",
      BANK_TRANSFER: "Bonifico",
      OTHER: "Altro",
      ONLINE: "Online",
    };
    return labels[method] || method;
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna a {tournament?.name || "Torneo"}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <CreditCard className="h-7 w-7" />
            Pagamenti
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i pagamenti delle quote di iscrizione per equipaggio
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paidCount}</p>
                <p className="text-xs text-muted-foreground">Equipaggi Pagati</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
                <p className="text-xs text-muted-foreground">In Attesa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Euro className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCollected.toFixed(0)}€</p>
                <p className="text-xs text-muted-foreground">Incassato</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingAmount.toFixed(0)}€</p>
                <p className="text-xs text-muted-foreground">Da Incassare</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {stats.expectedTotal > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso Incassi</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalCollected.toFixed(0)}€ / {stats.expectedTotal.toFixed(0)}€
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (stats.totalCollected / stats.expectedTotal) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((stats.paidCount / stats.totalCount) * 100)}% degli equipaggi ha pagato
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Pagamenti per Equipaggio</CardTitle>
              <CardDescription>
                Quota iscrizione: <strong>{Number(tournament?.registrationFee || 0).toFixed(0)}€</strong> per barca
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca equipaggio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filtra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti</SelectItem>
                  <SelectItem value="PENDING_PAYMENT">Da Pagare</SelectItem>
                  <SelectItem value="CONFIRMED">Pagati</SelectItem>
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
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Equipaggio</TableHead>
                  <TableHead>Barca</TableHead>
                  <TableHead>Capitano</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Wallet className="h-8 w-8" />
                        <p>Nessun equipaggio trovato</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => {
                    const paymentInfo = getPaymentInfo(registration.paymentId);
                    const amountPaid = typeof registration.amountPaid === "number"
                      ? registration.amountPaid
                      : parseFloat(registration.amountPaid as unknown as string) || 0;

                    return (
                      <TableRow key={registration.id}>
                        <TableCell>
                          {registration.boatNumber ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {registration.boatNumber}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {registration.teamName || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {registration.boatName ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Ship className="h-3 w-3 text-muted-foreground" />
                              {registration.boatName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {registration.user.firstName} {registration.user.lastName}
                            </span>
                            {registration.user.phone && (
                              <span className="text-xs text-muted-foreground">
                                {registration.user.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(registration.status)}</TableCell>
                        <TableCell>
                          {registration.status === "CONFIRMED" ? (
                            <span className="font-medium text-green-600">
                              {amountPaid.toFixed(0)}€
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {Number(tournament?.registrationFee || 0).toFixed(0)}€
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {paymentInfo ? (
                            <div className="flex items-center gap-1">
                              {paymentInfo.method === "CASH" && <Banknote className="h-3 w-3" />}
                              {paymentInfo.method === "BANK_TRANSFER" && <Building className="h-3 w-3" />}
                              <span className="text-sm">{getMethodLabel(paymentInfo.method)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(registration.confirmedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {registration.status === "PENDING_PAYMENT" && (
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(registration)}
                            >
                              <Banknote className="h-4 w-4 mr-1" />
                              Registra
                            </Button>
                          )}
                          {registration.status === "CONFIRMED" && paymentInfo && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Registra Pagamento
            </DialogTitle>
            <DialogDescription>
              {selectedRegistration?.teamName && (
                <>Equipaggio: <strong>{selectedRegistration.teamName}</strong></>
              )}
              {selectedRegistration?.boatName && (
                <> - Barca: <strong>{selectedRegistration.boatName}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="method">Metodo di Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Contanti
                    </div>
                  </SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bonifico Bancario
                    </div>
                  </SelectItem>
                  <SelectItem value="OTHER">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Altro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Es: Ricevuto da Marco Rossi"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmitPayment} disabled={submitting}>
              {submitting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Conferma Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
