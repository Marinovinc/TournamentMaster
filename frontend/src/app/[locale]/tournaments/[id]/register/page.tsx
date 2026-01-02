/**
 * =============================================================================
 * TOURNAMENT REGISTRATION WITH STRIPE CHECKOUT
 * =============================================================================
 * Pagina iscrizione torneo con pagamento integrato via Stripe
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Users,
  Calendar,
  MapPin,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Shield,
  Smartphone,
  Building,
  Fish,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ============================================================================
// TYPES
// ============================================================================

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  discipline: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  registrationFee: number;
  maxParticipants: number | null;
  tenant: { name: string; slug: string };
  _count: { registrations: number };
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: typeof CreditCard;
  available: boolean;
  minAmount?: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TOURNAMENT: Tournament = {
  id: "1",
  name: "Gran Premio Mediterraneo 2025",
  description: "Il torneo di pesca sportiva piu importante del Mediterraneo",
  discipline: "BIG_GAME",
  status: "PUBLISHED",
  startDate: "2025-07-15T08:00:00Z",
  endDate: "2025-07-17T18:00:00Z",
  location: "Ischia, Italia",
  registrationFee: 25, // La quota che va all'associazione (dopo il nostro fee di EUR5)
  maxParticipants: 100,
  tenant: { name: "A.S.D. Pescatori del Golfo", slug: "pescatori-golfo" },
  _count: { registrations: 78 },
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "card", name: "Carta di Credito/Debito", icon: CreditCard, available: true },
  { id: "apple-pay", name: "Apple Pay", icon: Smartphone, available: true },
  { id: "google-pay", name: "Google Pay", icon: Smartphone, available: true },
  { id: "sepa", name: "Bonifico SEPA", icon: Building, available: true, minAmount: 50 },
];

const TM_FEE = 5; // Fee fisso TournamentMaster

// ============================================================================
// DISCIPLINE LABELS
// ============================================================================

const disciplineLabels: Record<string, string> = {
  BIG_GAME: "Big Game",
  DRIFTING: "Drifting",
  TRAINA_COSTIERA: "Traina Costiera",
  BOLENTINO: "Bolentino",
  EGING: "Eging",
  VERTICAL_JIGGING: "Vertical Jigging",
  SHORE: "Pesca da Riva",
  SOCIAL: "Evento Sociale",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TournamentRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const tournamentId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationId, setConfirmationId] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    teamName: "",
    boatName: "",
    boatLength: "",
    captainName: "",
    phone: "",
    emergencyContact: "",
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptRules, setAcceptRules] = useState(false);

  // Load tournament data
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        // TODO: Sostituire con chiamata API reale
        // const res = await fetch(`/api/tournaments/${tournamentId}`);
        // const data = await res.json();
        // setTournament(data);

        // Mock per ora
        setTimeout(() => {
          setTournament(MOCK_TOURNAMENT);
          setIsLoading(false);
        }, 300);
      } catch (error) {
        console.error("Error fetching tournament:", error);
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login?redirect=/${locale}/tournaments/${tournamentId}/register`);
    }
  }, [authLoading, user, router, locale, tournamentId]);

  // Derive captain name from user (without setState in effect)
  const derivedCaptainName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate costs
  const registrationFee = tournament?.registrationFee || 0;
  const totalFee = registrationFee + TM_FEE;
  const totalToPay = totalFee; // L'utente paga quota + fee TM, Stripe fee e dedotta internamente

  const handleSubmit = async () => {
    if (!acceptTerms || !acceptRules) {
      setErrorMessage("Devi accettare i termini e il regolamento per procedere.");
      return;
    }

    if (!formData.teamName) {
      setErrorMessage("Inserisci il nome del team.");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      // TODO: Implementare chiamata API Stripe
      // const response = await fetch("/api/payments/create-checkout-session", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     tournamentId,
      //     ...formData,
      //     paymentMethod: selectedPaymentMethod,
      //   }),
      // });
      //
      // const { sessionId, url } = await response.json();
      // window.location.href = url; // Redirect a Stripe Checkout

      // Simula successo per demo
      setTimeout(() => {
        setConfirmationId(`REG-${Date.now()}`);
        setPaymentStatus("success");
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      setErrorMessage("Si e verificato un errore durante il pagamento. Riprova.");
      setIsProcessing(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Torneo non trovato</AlertTitle>
          <AlertDescription>
            Il torneo richiesto non esiste o non e piu disponibile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Success state
  if (paymentStatus === "success") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">Iscrizione Completata!</h2>
                <p className="text-green-700 mt-2">
                  La tua iscrizione a <strong>{tournament.name}</strong> e stata confermata.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team:</span>
                  <span className="font-medium">{formData.teamName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quota pagata:</span>
                  <span className="font-medium">&euro;{totalToPay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Conferma:</span>
                  <span className="font-mono text-sm">{confirmationId}</span>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <Button asChild className="w-full">
                  <Link href={`/${locale}/dashboard`}>
                    Vai alla Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/${locale}/tournaments/${tournamentId}`}>
                    Torna al Torneo
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const spotsLeft = tournament.maxParticipants
    ? tournament.maxParticipants - tournament._count.registrations
    : null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Link */}
      <Link
        href={`/${locale}/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna al torneo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Iscrizione al Torneo</h1>
            <p className="text-muted-foreground">{tournament.name}</p>
          </div>

          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informazioni Team
              </CardTitle>
              <CardDescription>
                Inserisci i dati del tuo team per l&apos;iscrizione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Nome Team *</Label>
                  <Input
                    id="teamName"
                    placeholder="Es. Team Barracuda"
                    value={formData.teamName}
                    onChange={(e) => handleInputChange("teamName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boatName">Nome Barca</Label>
                  <Input
                    id="boatName"
                    placeholder="Es. Lady Luck"
                    value={formData.boatName}
                    onChange={(e) => handleInputChange("boatName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boatLength">Lunghezza Barca (mt)</Label>
                  <Input
                    id="boatLength"
                    type="number"
                    placeholder="Es. 8.5"
                    value={formData.boatLength}
                    onChange={(e) => handleInputChange("boatLength", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="captainName">Capitano</Label>
                  <Input
                    id="captainName"
                    value={formData.captainName || derivedCaptainName}
                    onChange={(e) => handleInputChange("captainName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+39 333 1234567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contatto Emergenza</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Nome e telefono"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodo di Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isDisabled = !!(method.minAmount && totalToPay < method.minAmount);

                  return (
                    <button
                      key={method.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                        ${selectedPaymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                        }
                        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <Icon className={`h-6 w-6 ${selectedPaymentMethod === method.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs text-center">{method.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Pagamento sicuro gestito da Stripe. I tuoi dati sono protetti.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                  Accetto i{" "}
                  <Link href={`/${locale}/terms`} className="text-primary hover:underline">
                    Termini e Condizioni
                  </Link>{" "}
                  e la{" "}
                  <Link href={`/${locale}/privacy`} className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="rules"
                  checked={acceptRules}
                  onCheckedChange={(checked) => setAcceptRules(checked as boolean)}
                />
                <label htmlFor="rules" className="text-sm leading-tight cursor-pointer">
                  Ho letto e accetto il regolamento del torneo e le regole della disciplina {disciplineLabels[tournament.discipline] || tournament.discipline}
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Riepilogo Ordine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tournament Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{tournament.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {disciplineLabels[tournament.discipline]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(tournament.startDate).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {tournament.location}
                </div>
                {spotsLeft !== null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className={spotsLeft < 10 ? "text-orange-600 font-medium" : ""}>
                      {spotsLeft} posti disponibili
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quota iscrizione</span>
                  <span>&euro;{registrationFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Servizio piattaforma</span>
                  <span>&euro;{TM_FEE.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Totale</span>
                  <span>&euro;{totalToPay.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isProcessing || !acceptTerms || !acceptRules}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Paga &euro;{totalToPay.toFixed(2)}
                  </>
                )}
              </Button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Pagamento sicuro con Stripe
              </div>
            </CardContent>
          </Card>

          {/* Association Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fish className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tournament.tenant.name}</p>
                  <p className="text-xs text-muted-foreground">Organizzatore</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
