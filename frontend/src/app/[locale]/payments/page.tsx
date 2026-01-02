/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/payments/page.tsx
 * Creato: 2026-01-02
 * Aggiornato: 2026-01-02
 * Descrizione: Pagina Pagamenti - Checkout con Stripe Connect e split payments
 * Basato su: TOURNAMENTMASTER_PAGAMENTI_OVERVIEW.md
 * =============================================================================
 */

"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Lock,
  Check,
  ShieldCheck,
  Building2,
  Crown,
  Zap,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Award,
  Wallet,
  PiggyBank,
  Info,
  Smartphone,
  Building,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ============================================================================
// CONFIGURAZIONE PREZZI E SPLIT (da TOURNAMENTMASTER_PAGAMENTI_OVERVIEW.md)
// ============================================================================

// Piani abbonamento piattaforma (100% TournamentMaster)
const subscriptionPlans: Record<string, {
  name: string;
  price: number;
  period: string;
  description: string;
  icon: typeof Zap;
  features: string[];
  tmShare: number;
  assocShare: number;
}> = {
  starter: {
    name: "Starter",
    price: 0,
    period: "sempre gratis",
    description: "Per piccoli tornei locali",
    icon: Zap,
    features: [
      "Fino a 3 tornei/anno",
      "Max 30 partecipanti/torneo",
      "Classifiche real-time",
      "Validazione GPS base",
    ],
    tmShare: 100,
    assocShare: 0,
  },
  pro: {
    name: "Pro",
    price: 29,
    period: "mese",
    description: "Per associazioni e circoli",
    icon: Building2,
    features: [
      "Tornei illimitati",
      "Max 200 partecipanti/torneo",
      "Statistiche avanzate",
      "Supporto prioritario",
      "Personalizzazione brand",
    ],
    tmShare: 100,
    assocShare: 0,
  },
  "pro-annual": {
    name: "Pro Annuale",
    price: 290,
    period: "anno",
    description: "Risparmia 2 mesi!",
    icon: Building2,
    features: [
      "Tutto il piano Pro",
      "2 mesi gratis inclusi",
      "Payout giornaliero",
      "Supporto telefonico",
    ],
    tmShare: 100,
    assocShare: 0,
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    period: "mese",
    description: "Per federazioni e grandi eventi",
    icon: Crown,
    features: [
      "Partecipanti illimitati",
      "White-label completo",
      "API access",
      "Account manager dedicato",
      "SLA garantito",
    ],
    tmShare: 100,
    assocShare: 0,
  },
};

// Tipologie pagamento con split
const paymentTypes = {
  subscription: {
    name: "Abbonamento Piattaforma",
    description: "Piano annuale per organizzatori",
    tmShare: 100,
    assocShare: 0,
    icon: Building2,
  },
  registration: {
    name: "Iscrizione Torneo",
    description: "Quota partecipazione pescatore",
    tmShare: 5, // €5 fissi
    assocShare: "resto", // Markup libero
    icon: Users,
    isFixed: true,
  },
  "team-profile": {
    name: "Pagina Profilo Team",
    description: "Profilo pubblico del team",
    tmShare: 100,
    assocShare: 0,
    icon: Users,
  },
  sponsor: {
    name: "Pacchetto Sponsor",
    description: "Sponsorizzazione torneo",
    tmShare: 50,
    assocShare: 50,
    icon: Award,
  },
  report: {
    name: "Report Premium",
    description: "Report dettagliato post-torneo",
    tmShare: 80,
    assocShare: 20,
    icon: FileText,
  },
  certificate: {
    name: "Certificato Vincitore",
    description: "Certificato PDF personalizzato",
    tmShare: 80,
    assocShare: 20,
    icon: Award,
  },
};

// Servizi aggiuntivi con split
const additionalServices = [
  {
    id: "team-profile-single",
    name: "Profilo Team - Singolo Evento",
    price: 29,
    description: "Pagina profilo per 1 torneo",
    tmShare: 100,
    assocShare: 0,
  },
  {
    id: "team-profile-season",
    name: "Profilo Team - Stagionale",
    price: 99,
    description: "Pagina profilo per 1 anno",
    tmShare: 100,
    assocShare: 0,
  },
  {
    id: "team-profile-permanent",
    name: "Profilo Team - Permanente",
    price: 249,
    description: "Pagina profilo per sempre",
    tmShare: 100,
    assocShare: 0,
  },
  {
    id: "report-premium",
    name: "Report Torneo Premium",
    price: 15,
    description: "Statistiche dettagliate post-torneo",
    tmShare: 80,
    assocShare: 20,
  },
  {
    id: "certificates-pack",
    name: "Pack 10 Certificati",
    price: 9,
    description: "Certificati PDF personalizzati",
    tmShare: 80,
    assocShare: 20,
  },
];

// Pacchetti sponsor
const sponsorPackages = [
  { id: "bronze", name: "Bronze", price: 500, description: "Banner footer" },
  { id: "silver", name: "Silver", price: 1000, description: "Banner + Sidebar" },
  { id: "gold", name: "Gold", price: 2500, description: "Banner + Sidebar + Classifica" },
  { id: "platinum", name: "Platinum", price: 5000, description: "Full branding + Personalizzazioni" },
];

// Stripe fee: 2.9% + €0.25
const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED = 0.25;

// Metodi di pagamento
const paymentMethods = [
  { id: "card", name: "Carta di Credito/Debito", icon: CreditCard, available: true },
  { id: "apple-pay", name: "Apple Pay", icon: Smartphone, available: true },
  { id: "google-pay", name: "Google Pay", icon: Smartphone, available: true },
  { id: "sepa", name: "Bonifico SEPA", icon: Building, available: true, minAmount: 100 },
  { id: "klarna", name: "Klarna (3 rate)", icon: Clock, available: true, minAmount: 50 },
];

function PaymentsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  // Get params from URL
  const paymentType = searchParams.get("type") || "subscription";
  const selectedPlanId = searchParams.get("plan") || "pro";
  const tournamentFee = parseFloat(searchParams.get("fee") || "0");

  const selectedPlan = subscriptionPlans[selectedPlanId] || subscriptionPlans.pro;

  // Form state
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    country: "IT",
    vatNumber: "",
    companyName: "",
    billingAddress: "",
    city: "",
    postalCode: "",
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error">("idle");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSplitDetails, setShowSplitDetails] = useState(false);

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate totals
  const planPrice = paymentType === "subscription" ? selectedPlan.price : 0;
  const registrationPrice = paymentType === "registration" ? tournamentFee : 0;

  const servicesTotal = selectedServices.reduce((sum, serviceId) => {
    const service = additionalServices.find((s) => s.id === serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const subtotal = planPrice + registrationPrice + servicesTotal;
  const stripeFee = subtotal > 0 ? (subtotal * STRIPE_PERCENT) + STRIPE_FIXED : 0;
  const vat = subtotal * 0.22;
  const total = subtotal + vat;

  // Calculate split
  const calculateSplit = () => {
    let tmTotal = 0;
    let assocTotal = 0;

    // Plan (100% TM)
    if (planPrice > 0) {
      tmTotal += planPrice;
    }

    // Registration (€5 TM, rest to Association)
    if (registrationPrice > 0) {
      tmTotal += 5;
      assocTotal += registrationPrice - 5;
    }

    // Services
    selectedServices.forEach((serviceId) => {
      const service = additionalServices.find((s) => s.id === serviceId);
      if (service) {
        tmTotal += (service.price * service.tmShare) / 100;
        assocTotal += (service.price * service.assocShare) / 100;
      }
    });

    // Apply Stripe fee proportionally
    const totalBeforeFee = tmTotal + assocTotal;
    if (totalBeforeFee > 0) {
      const tmProportion = tmTotal / totalBeforeFee;
      const assocProportion = assocTotal / totalBeforeFee;
      tmTotal -= stripeFee * tmProportion;
      assocTotal -= stripeFee * assocProportion;
    }

    return { tmTotal, assocTotal, stripeFee };
  };

  const split = calculateSplit();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      alert("Devi accettare i termini e le condizioni");
      return;
    }

    setIsProcessing(true);

    try {
      // Simula chiamata a Stripe Connect
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setPaymentStatus("success");
    } catch {
      setPaymentStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Wait for client-side mount to avoid hydration issues with Select
  if (!isMounted) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  // Success state
  if (paymentStatus === "success") {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">
                Pagamento Completato!
              </h1>
              <p className="text-muted-foreground">
                Grazie per aver scelto TournamentMaster.
              </p>
            </div>

            {/* Split Summary */}
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
              <h3 className="font-medium">Riepilogo transazione:</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Totale pagato</span>
                  <span className="font-medium">EUR {total.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Commissione Stripe</span>
                  <span>-EUR {stripeFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>TournamentMaster</span>
                  <span>EUR {split.tmTotal.toFixed(2)}</span>
                </div>
                {split.assocTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Associazione Organizzatrice</span>
                    <span>EUR {split.assocTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Riceverai conferma a <strong>{formData.email}</strong>
            </p>

            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href={`/${locale}/dashboard`}>Vai alla Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${locale}`}>Torna alla Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href={`/${locale}/pricing`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna ai piani
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500">
          <Lock className="h-4 w-4 mr-2" />
          Stripe Connect - Pagamento Sicuro
        </Badge>
        <h1 className="text-3xl font-bold mb-2">Completa il tuo acquisto</h1>
        <p className="text-muted-foreground">
          Transazione sicura con split automatico. PCI-DSS Level 1 certificato.
        </p>
      </div>

      {/* Error Alert */}
      {paymentStatus === "error" && (
        <Alert variant="destructive" className="mb-6 max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore nel pagamento</AlertTitle>
          <AlertDescription>
            Verifica i dati della carta e riprova. Se il problema persiste, contatta il supporto.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Plan Selection */}
            {paymentType === "subscription" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <selectedPlan.icon className="h-5 w-5 text-primary" />
                    Piano Selezionato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div>
                      <h3 className="font-medium">{selectedPlan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.description}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        100% a TournamentMaster
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold">EUR {selectedPlan.price}</span>
                      <span className="text-muted-foreground">/{selectedPlan.period}</span>
                    </div>
                  </div>
                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {selectedPlan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tournament Registration */}
            {paymentType === "registration" && tournamentFee > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Iscrizione Torneo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Quota Iscrizione</span>
                      <span className="text-2xl font-bold">EUR {tournamentFee.toFixed(2)}</span>
                    </div>

                    {/* Split visualization */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span className="text-blue-700">TournamentMaster (fisso)</span>
                        <span className="font-medium text-blue-700">EUR 5.00</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span className="text-green-700">Associazione Organizzatrice</span>
                        <span className="font-medium text-green-700">EUR {(tournamentFee - 5).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Servizi Aggiuntivi</CardTitle>
                <CardDescription>
                  Migliora la tua esperienza con servizi extra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {additionalServices.map((service) => (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedServices.includes(service.id)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {service.tmShare === 100 ? (
                            <Badge variant="secondary" className="text-xs">100% TM</Badge>
                          ) : (
                            <>
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                {service.tmShare}% TM
                              </Badge>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                {service.assocShare}% Assoc.
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-medium">EUR {service.price}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Metodo di Pagamento
                </CardTitle>
                <CardDescription>
                  Scegli come pagare - tutti i metodi sono sicuri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment method buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isDisabled = !!(method.minAmount && subtotal < method.minAmount);
                    return (
                      <button
                        key={method.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedPaymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        <div className="text-sm font-medium">{method.name}</div>
                        {method.minAmount && (
                          <div className="text-xs text-muted-foreground">
                            Min. EUR {method.minAmount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Card form (shown for card payment) */}
                {selectedPaymentMethod === "card" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="cardName">Nome sulla Carta *</Label>
                      <Input
                        id="cardName"
                        placeholder="Mario Rossi"
                        value={formData.cardName}
                        onChange={(e) => handleInputChange("cardName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Numero Carta *</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) =>
                          handleInputChange("cardNumber", formatCardNumber(e.target.value))
                        }
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Scadenza *</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) =>
                            handleInputChange("expiryDate", formatExpiryDate(e.target.value))
                          }
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          value={formData.cvv}
                          onChange={(e) =>
                            handleInputChange("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))
                          }
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative payment messages */}
                {selectedPaymentMethod === "apple-pay" && (
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      Clicca &quot;Paga&quot; per aprire Apple Pay sul tuo dispositivo.
                    </AlertDescription>
                  </Alert>
                )}
                {selectedPaymentMethod === "google-pay" && (
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      Clicca &quot;Paga&quot; per aprire Google Pay sul tuo dispositivo.
                    </AlertDescription>
                  </Alert>
                )}
                {selectedPaymentMethod === "sepa" && (
                  <Alert>
                    <Building className="h-4 w-4" />
                    <AlertDescription>
                      Riceverai le coordinate per il bonifico SEPA via email.
                      Accredito in 1-2 giorni lavorativi.
                    </AlertDescription>
                  </Alert>
                )}
                {selectedPaymentMethod === "klarna" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Paga in 3 rate senza interessi. Verrai reindirizzato a Klarna.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Security badges */}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    TLS 1.3
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    PCI-DSS Level 1
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    3D Secure 2.0
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/80px-Visa_Inc._logo.svg.png"
                      alt="Visa"
                      className="h-5 object-contain"
                    />
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/80px-Mastercard-logo.svg.png"
                      alt="Mastercard"
                      className="h-5 object-contain"
                    />
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/80px-American_Express_logo_%282018%29.svg.png"
                      alt="Amex"
                      className="h-5 object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dati di Fatturazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tuo@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Ragione Sociale</Label>
                    <Input
                      id="companyName"
                      placeholder="Nome Associazione (opzionale)"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vatNumber">P.IVA / Codice Fiscale</Label>
                    <Input
                      id="vatNumber"
                      placeholder="IT12345678901"
                      value={formData.vatNumber}
                      onChange={(e) => handleInputChange("vatNumber", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="billingAddress">Indirizzo *</Label>
                    <Input
                      id="billingAddress"
                      placeholder="Via, numero civico"
                      value={formData.billingAddress}
                      onChange={(e) => handleInputChange("billingAddress", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Citta *</Label>
                    <Input
                      id="city"
                      placeholder="Roma"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">CAP *</Label>
                    <Input
                      id="postalCode"
                      placeholder="00100"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Paese *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => handleInputChange("country", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">Italia</SelectItem>
                        <SelectItem value="DE">Germania</SelectItem>
                        <SelectItem value="FR">Francia</SelectItem>
                        <SelectItem value="ES">Spagna</SelectItem>
                        <SelectItem value="AT">Austria</SelectItem>
                        <SelectItem value="CH">Svizzera</SelectItem>
                        <SelectItem value="HR">Croazia</SelectItem>
                        <SelectItem value="SI">Slovenia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Riepilogo Ordine
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSplitDetails(!showSplitDetails)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                {planPrice > 0 && (
                  <div className="flex justify-between">
                    <span>Piano {selectedPlan.name}</span>
                    <span>EUR {planPrice.toFixed(2)}</span>
                  </div>
                )}

                {registrationPrice > 0 && (
                  <div className="flex justify-between">
                    <span>Iscrizione Torneo</span>
                    <span>EUR {registrationPrice.toFixed(2)}</span>
                  </div>
                )}

                {selectedServices.map((serviceId) => {
                  const service = additionalServices.find((s) => s.id === serviceId);
                  return service ? (
                    <div key={serviceId} className="flex justify-between text-sm">
                      <span>{service.name}</span>
                      <span>EUR {service.price.toFixed(2)}</span>
                    </div>
                  ) : null;
                })}

                <Separator />

                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotale</span>
                  <span>EUR {subtotal.toFixed(2)}</span>
                </div>

                {/* VAT */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>IVA (22%)</span>
                  <span>EUR {vat.toFixed(2)}</span>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between text-lg font-bold">
                  <span>Totale</span>
                  <span>EUR {total.toFixed(2)}</span>
                </div>

                {/* Split Details (collapsible) */}
                {showSplitDetails && subtotal > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                    <div className="font-medium flex items-center gap-2">
                      <PiggyBank className="h-4 w-4" />
                      Ripartizione Pagamento
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>TournamentMaster</span>
                      <span>EUR {split.tmTotal.toFixed(2)}</span>
                    </div>
                    {split.assocTotal > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Associazione</span>
                        <span>EUR {split.assocTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Fee Stripe (2.9% + EUR 0.25)</span>
                      <span>-EUR {stripeFee.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Payout note */}
                {split.assocTotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    L&apos;associazione riceverà EUR {split.assocTotal.toFixed(2)} entro il prossimo lunedi (payout settimanale SEPA).
                  </p>
                )}
              </CardContent>

              <CardFooter className="flex-col gap-4">
                {/* Terms */}
                <div className="flex items-start gap-2 w-full">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground">
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing || !acceptTerms || subtotal === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Paga EUR {total.toFixed(2)}
                    </>
                  )}
                </Button>

                {/* Stripe badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Powered by Stripe Connect
                </div>
              </CardFooter>
            </Card>

            {/* Trust section */}
            <Card className="mt-4">
              <CardContent className="py-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span>Garanzia soddisfatti o rimborsati 30 giorni</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span>Dati crittografati end-to-end</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    <span>Cancella l&apos;abbonamento quando vuoi</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </main>
  );
}

// Loading fallback for Suspense
function PaymentsLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </main>
  );
}

// Main component with Suspense boundary
export default function PaymentsPage() {
  return (
    <Suspense fallback={<PaymentsLoading />}>
      <PaymentsContent />
    </Suspense>
  );
}

