/**
 * =============================================================================
 * ADMIN PAYMENTS - STRIPE CONNECT ONBOARDING
 * =============================================================================
 * Gestione pagamenti per associazioni - onboarding e dashboard Stripe Connect
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ArrowRight,
  Euro,
  TrendingUp,
  RefreshCw,
  Shield,
  FileText,
  Wallet,
  ArrowLeft,
  Link2,
  Settings,
  Download,
  HelpCircle,
  Loader2,
  Ban,
  ChevronRight,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================================
// TYPES
// ============================================================================

type StripeAccountStatus =
  | "not_connected"
  | "onboarding_started"
  | "pending_verification"
  | "restricted"
  | "active";

interface StripeAccount {
  id: string;
  status: StripeAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
  createdAt: string;
  dashboardUrl?: string;
}

interface PaymentStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalTransactions: number;
  transactionsThisMonth: number;
  pendingPayouts: number;
  lastPayoutDate: string | null;
  lastPayoutAmount: number | null;
}

interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "succeeded" | "pending" | "failed" | "refunded";
  type: "registration" | "sponsor" | "service";
}

// ============================================================================
// MOCK DATA - Da sostituire con API reali
// ============================================================================

const MOCK_STRIPE_ACCOUNT: StripeAccount = {
  id: "acct_demo123",
  status: "not_connected", // Cambia per testare: "active", "pending_verification", etc.
  chargesEnabled: false,
  payoutsEnabled: false,
  detailsSubmitted: false,
  requirements: {
    currentlyDue: [],
    eventuallyDue: [],
    pastDue: [],
  },
  createdAt: new Date().toISOString(),
};

const MOCK_STATS: PaymentStats = {
  totalRevenue: 12580,
  revenueThisMonth: 2340,
  totalTransactions: 156,
  transactionsThisMonth: 23,
  pendingPayouts: 890,
  lastPayoutDate: "2025-12-28",
  lastPayoutAmount: 1250,
};

const MOCK_TRANSACTIONS: RecentTransaction[] = [
  {
    id: "tx_001",
    date: "2025-01-02",
    description: "Iscrizione - Gran Premio Mediterraneo",
    amount: 25,
    fee: 0.97,
    netAmount: 24.03,
    status: "succeeded",
    type: "registration",
  },
  {
    id: "tx_002",
    date: "2025-01-02",
    description: "Iscrizione - Gran Premio Mediterraneo",
    amount: 25,
    fee: 0.97,
    netAmount: 24.03,
    status: "succeeded",
    type: "registration",
  },
  {
    id: "tx_003",
    date: "2025-01-01",
    description: "Sponsor Bronze - Trofeo Estate",
    amount: 250,
    fee: 7.50,
    netAmount: 242.50,
    status: "succeeded",
    type: "sponsor",
  },
  {
    id: "tx_004",
    date: "2025-01-01",
    description: "Report Premium - Campionato Regionale",
    amount: 3,
    fee: 0.34,
    netAmount: 2.66,
    status: "pending",
    type: "service",
  },
];

// ============================================================================
// STATUS COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: StripeAccountStatus }) {
  const config = {
    not_connected: { label: "Non collegato", variant: "secondary" as const, icon: Ban },
    onboarding_started: { label: "Registrazione iniziata", variant: "outline" as const, icon: Clock },
    pending_verification: { label: "In verifica", variant: "outline" as const, icon: Clock },
    restricted: { label: "Restrizioni", variant: "destructive" as const, icon: AlertCircle },
    active: { label: "Attivo", variant: "default" as const, icon: CheckCircle2 },
  };

  const { label, variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// NOT CONNECTED STATE
// ============================================================================

function NotConnectedState({ onConnect, isConnecting }: { onConnect: () => void; isConnecting: boolean }) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Collega Stripe per Ricevere Pagamenti</h2>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                Inizia a ricevere pagamenti per le iscrizioni ai tornei, sponsorizzazioni e servizi premium.
                La registrazione richiede solo 5-10 minuti.
              </p>
            </div>
            <Button size="lg" onClick={onConnect} disabled={isConnecting} className="gap-2 mt-4">
              {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Link2 className="h-5 w-5" />}
              {isConnecting ? "Connessione..." : "Collega Account Stripe"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Gratuito</h3>
                <p className="text-sm text-muted-foreground">
                  Nessun costo di attivazione, nessun canone mensile. Paghi solo le fee sulle transazioni.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Sicuro</h3>
                <p className="text-sm text-muted-foreground">
                  Stripe e certificato PCI-DSS Level 1. I dati di pagamento sono protetti.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Veloce</h3>
                <p className="text-sm text-muted-foreground">
                  Accrediti automatici sul tuo conto bancario ogni 2-7 giorni lavorativi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertTitle>Cosa ti serve per registrarti?</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>IBAN del conto corrente dell&apos;associazione</li>
            <li>Codice Fiscale o P.IVA dell&apos;associazione</li>
            <li>Documento d&apos;identita del legale rappresentante</li>
            <li>Email dell&apos;associazione</li>
          </ul>
          <Link
            href="../../../payments/guide"
            className="inline-flex items-center gap-1 text-primary hover:underline mt-3"
          >
            Leggi la guida completa
            <ChevronRight className="h-4 w-4" />
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ============================================================================
// PENDING VERIFICATION STATE
// ============================================================================

function PendingVerificationState({ account }: { account: StripeAccount }) {
  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-amber-900">Account in Verifica</h2>
              <p className="text-amber-800 mt-1">
                Stripe sta verificando i tuoi documenti. Questo processo richiede solitamente 1-2 giorni lavorativi.
              </p>
              <div className="mt-4">
                <Progress value={66} className="h-2" />
                <p className="text-xs text-amber-700 mt-1">Verifica in corso...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Nel frattempo...</AlertTitle>
        <AlertDescription>
          Puoi gia creare tornei e configurare le quote di iscrizione.
          I pagamenti saranno abilitati automaticamente appena la verifica sara completata.
        </AlertDescription>
      </Alert>

      {account.requirements.currentlyDue.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Documenti Richiesti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {account.requirements.currentlyDue.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  {req}
                </li>
              ))}
            </ul>
            <Button className="mt-4" variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Completa su Stripe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// ACTIVE STATE - FULL DASHBOARD
// ============================================================================

function ActiveDashboard({
  account: _account,
  stats,
  transactions
}: {
  account: StripeAccount;
  stats: PaymentStats;
  transactions: RecentTransaction[];
}) {
  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Account Stripe Attivo</h3>
                <p className="text-sm text-green-700">Pagamenti e payout abilitati</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Dashboard Stripe
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incasso Totale</p>
                <p className="text-2xl font-bold">&euro;{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Questo Mese</p>
                <p className="text-2xl font-bold">&euro;{stats.revenueThisMonth.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transazioni</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payout in Arrivo</p>
                <p className="text-2xl font-bold">&euro;{stats.pendingPayouts.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transazioni Recenti</CardTitle>
              <CardDescription>Ultimi pagamenti ricevuti</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Esporta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Netto</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {new Date(tx.date).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tx.type === "registration" && "Iscrizione"}
                      {tx.type === "sponsor" && "Sponsor"}
                      {tx.type === "service" && "Servizio"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">&euro;{tx.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    -&euro;{tx.fee.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    &euro;{tx.netAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {tx.status === "succeeded" && (
                      <Badge className="bg-green-100 text-green-800">Completato</Badge>
                    )}
                    {tx.status === "pending" && (
                      <Badge variant="outline">In elaborazione</Badge>
                    )}
                    {tx.status === "failed" && (
                      <Badge variant="destructive">Fallito</Badge>
                    )}
                    {tx.status === "refunded" && (
                      <Badge variant="secondary">Rimborsato</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <Button variant="ghost" className="gap-2">
            Vedi tutte le transazioni
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Impostazioni Payout</h3>
                <p className="text-sm text-muted-foreground">Configura frequenza accrediti</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Report Fiscali</h3>
                <p className="text-sm text-muted-foreground">Scarica report per contabilita</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Supporto</h3>
                <p className="text-sm text-muted-foreground">Assistenza pagamenti</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const _locale = params.locale as string; // Reserved for future use
  const { user: _user, isLoading: authLoading } = useAuth(); // user reserved for API

  const [stripeAccount, setStripeAccount] = useState<StripeAccount>(MOCK_STRIPE_ACCOUNT);
  const [stats, _setStats] = useState<PaymentStats>(MOCK_STATS);
  const [transactions, _setTransactions] = useState<RecentTransaction[]>(MOCK_TRANSACTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Simula caricamento dati
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleConnectStripe = async () => {
    setIsConnecting(true);

    // TODO: Implementare chiamata API per creare Stripe Connect account
    // const response = await fetch("/api/stripe/connect", { method: "POST" });
    // const { onboardingUrl } = await response.json();
    // window.location.href = onboardingUrl;

    // Per ora simula redirect
    setTimeout(() => {
      alert("Redirect a Stripe Connect Onboarding...\n\nIn produzione, l'utente verra reindirizzato a Stripe per completare la registrazione.");
      setIsConnecting(false);
    }, 1000);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Pagamenti
            </h1>
            <HelpGuide pageKey="adminPayments" position="inline" isAdmin={true} />
          </div>
            <p className="text-muted-foreground">
              Gestisci i pagamenti della tua associazione
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={stripeAccount.status} />
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content based on status */}
      {stripeAccount.status === "not_connected" && (
        <NotConnectedState
          onConnect={handleConnectStripe}
          isConnecting={isConnecting}
        />
      )}

      {(stripeAccount.status === "onboarding_started" ||
        stripeAccount.status === "pending_verification") && (
        <PendingVerificationState account={stripeAccount} />
      )}

      {stripeAccount.status === "restricted" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account con Restrizioni</AlertTitle>
          <AlertDescription>
            Il tuo account Stripe ha delle restrizioni.
            <a href="https://dashboard.stripe.com" className="underline ml-1" target="_blank" rel="noopener noreferrer">
              Accedi alla dashboard Stripe
            </a> per risolvere i problemi.
          </AlertDescription>
        </Alert>
      )}

      {stripeAccount.status === "active" && (
        <ActiveDashboard
          account={stripeAccount}
          stats={stats}
          transactions={transactions}
        />
      )}

      {/* Demo Toggle - RIMUOVERE IN PRODUZIONE */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Demo: Cambia Stato Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["not_connected", "onboarding_started", "pending_verification", "restricted", "active"] as StripeAccountStatus[]).map((status) => (
              <Button
                key={status}
                variant={stripeAccount.status === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStripeAccount({ ...stripeAccount, status })}
              >
                {status.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
