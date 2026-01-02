/**
 * =============================================================================
 * GUIDA TARIFFE TOURNAMENTMASTER
 * =============================================================================
 * Guida descrittiva che illustra tutte le tariffe della piattaforma
 * Contenuti differenziati per ruolo utente
 * =============================================================================
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Euro,
  Users,
  Building2,
  Crown,
  Zap,
  Trophy,
  CreditCard,
  Percent,
  Calendar,
  Clock,
  CheckCircle2,
  Shield,
  FileText,
  Award,
  TrendingUp,
  PiggyBank,
  Smartphone,
  Building,
  HelpCircle,
  Star,
  Gift,
  Target,
  BarChart3,
  Settings,
  Link2,
  ExternalLink,
  Wallet,
  Receipt,
  ArrowRight,
  CircleDollarSign,
  RefreshCw,
  Eye,
  Download,
  Mail,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================================
// SEZIONE SUPER ADMIN - Visione completa tariffe e margini
// ============================================================================
function SuperAdminGuide() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-8">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="h-10 w-10" />
          <div>
            <h2 className="text-3xl font-bold">Tariffe e Margini TournamentMaster</h2>
            <p className="text-purple-200 text-lg">Visione completa per Super Amministratori</p>
          </div>
        </div>
      </div>

      {/* Introduzione */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Questo documento illustra la struttura completa delle tariffe di TournamentMaster.
            La piattaforma utilizza <strong>Stripe Connect</strong> come gateway di pagamento,
            garantendo split automatici in tempo reale tra TournamentMaster e le associazioni affiliate.
          </p>
        </CardContent>
      </Card>

      {/* Piani Abbonamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-purple-600" />
            Piani Abbonamento Piattaforma
          </CardTitle>
          <CardDescription>
            Abbonamenti per organizzatori e associazioni - 100% ricavo TournamentMaster
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-muted-foreground">
              Gli abbonamenti permettono alle associazioni di accedere alle funzionalità della piattaforma.
              Il <strong>100% degli abbonamenti va a TournamentMaster</strong> per coprire i costi di
              sviluppo, hosting, supporto e manutenzione della piattaforma. Le associazioni non ricevono
              una quota dagli abbonamenti, ma guadagnano dalle iscrizioni ai tornei e dalle sponsorizzazioni.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Piani Abbonamento - Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-muted-foreground">Dettaglio Piani Disponibili</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Starter */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-gray-600" />
                <span className="font-semibold">Starter</span>
              </div>
              <div className="text-3xl font-bold mb-1">Gratis</div>
              <div className="text-sm text-muted-foreground mb-4">per sempre</div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Fino a 3 tornei/anno
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Max 30 partecipanti/torneo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Classifiche real-time
                </li>
              </ul>
            </div>

            {/* Pro Mensile */}
            <div className="border-2 border-blue-500 rounded-xl p-5 bg-blue-50 relative">
              <Badge className="absolute -top-2 right-4 bg-blue-600">Popolare</Badge>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Pro</span>
              </div>
              <div className="text-3xl font-bold mb-1">EUR29</div>
              <div className="text-sm text-muted-foreground mb-4">al mese</div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Tornei illimitati
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Max 200 partecipanti
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Statistiche avanzate
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Supporto prioritario
                </li>
              </ul>
            </div>

            {/* Pro Annuale */}
            <div className="border rounded-xl p-5 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Pro Annuale</span>
              </div>
              <div className="text-3xl font-bold mb-1">EUR290</div>
              <div className="text-sm text-muted-foreground mb-4">all&apos;anno (risparmi EUR58)</div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Tutto il piano Pro
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  2 mesi gratis inclusi
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Payout giornaliero
                </li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="border rounded-xl p-5 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Enterprise</span>
              </div>
              <div className="text-3xl font-bold mb-1">EUR99</div>
              <div className="text-sm text-muted-foreground mb-4">al mese</div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Partecipanti illimitati
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  White-label completo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Account manager dedicato
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Split Completa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Percent className="h-6 w-6 text-purple-600" />
            Struttura Split Pagamenti
          </CardTitle>
          <CardDescription>
            Come vengono ripartiti i ricavi tra TournamentMaster e le associazioni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Come funziona lo Split?</h4>
            <p className="text-green-800">
              Ogni pagamento viene automaticamente diviso tra TournamentMaster e l&apos;Associazione
              grazie a <strong>Stripe Connect</strong>. Non serve fare nulla manualmente: quando un
              partecipante paga, la sua quota arriva direttamente sul conto dell&apos;associazione,
              mentre la quota TM viene trattenuta automaticamente.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Tipologia Pagamento</TableHead>
                <TableHead className="text-center font-semibold">TournamentMaster</TableHead>
                <TableHead className="text-center font-semibold">Associazione</TableHead>
                <TableHead className="font-semibold">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Piano Annuale</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-purple-600">100%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">0%</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">Abbonamento piattaforma</TableCell>
              </TableRow>
              <TableRow className="bg-green-50">
                <TableCell className="font-medium">Iscrizione Pescatore</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-purple-600">EUR5 fissi</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-600">Markup libero</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">Es. quota EUR15 = EUR5 TM + EUR10 Ass.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Team Profile</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-purple-600">100%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">0%</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">Singolo, Stagionale, Permanente</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Sponsor</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-purple-600">50%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-600">50%</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">Bronze, Silver, Gold, Platinum</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Report Premium</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-purple-600">80%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-600">20%</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">Post-torneo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Certificato Vincitore</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-purple-600">80%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-600">20%</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">Post-torneo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Spettatori Premium</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-purple-600">100%</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">0%</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">Accesso contenuti esclusivi</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pacchetti Sponsor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Star className="h-6 w-6 text-purple-600" />
            Pacchetti Sponsorizzazione
          </CardTitle>
          <CardDescription>
            Tariffe sponsor con split 50/50 tra TournamentMaster e Associazione
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Cosa sono le Sponsorizzazioni?</h4>
            <p className="text-amber-800">
              Le aziende possono sponsorizzare tornei o associazioni acquistando pacchetti pubblicitari.
              Questo è un <strong>ricavo condiviso 50/50</strong>: metà va a TournamentMaster
              (per la visibilità sulla piattaforma) e metà all&apos;Associazione (per il suo impegno
              nel portare sponsor). È un&apos;ottima fonte di guadagno extra per le associazioni attive!
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center bg-amber-50">
              <div className="text-amber-700 font-semibold mb-2">Bronze</div>
              <div className="text-2xl font-bold">EUR500</div>
              <div className="text-sm text-muted-foreground mt-2">Banner footer</div>
              <Separator className="my-3" />
              <div className="text-xs text-muted-foreground">TM: EUR250 | Ass: EUR250</div>
            </div>
            <div className="border rounded-lg p-4 text-center bg-gray-100">
              <div className="text-gray-600 font-semibold mb-2">Silver</div>
              <div className="text-2xl font-bold">EUR1.000</div>
              <div className="text-sm text-muted-foreground mt-2">Banner + Sidebar</div>
              <Separator className="my-3" />
              <div className="text-xs text-muted-foreground">TM: EUR500 | Ass: EUR500</div>
            </div>
            <div className="border rounded-lg p-4 text-center bg-yellow-50">
              <div className="text-yellow-700 font-semibold mb-2">Gold</div>
              <div className="text-2xl font-bold">EUR2.500</div>
              <div className="text-sm text-muted-foreground mt-2">Banner + Sidebar + Classifica</div>
              <Separator className="my-3" />
              <div className="text-xs text-muted-foreground">TM: EUR1.250 | Ass: EUR1.250</div>
            </div>
            <div className="border-2 border-purple-400 rounded-lg p-4 text-center bg-purple-50">
              <div className="text-purple-700 font-semibold mb-2">Platinum</div>
              <div className="text-2xl font-bold">EUR5.000</div>
              <div className="text-sm text-muted-foreground mt-2">Full branding</div>
              <Separator className="my-3" />
              <div className="text-xs text-muted-foreground">TM: EUR2.500 | Ass: EUR2.500</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissioni Stripe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-purple-600" />
            Commissioni Gateway (Stripe)
          </CardTitle>
          <CardDescription>
            Come funzionano le commissioni di pagamento e chi le paga
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Spiegazione chiara */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-blue-900">Cosa sono le commissioni Stripe?</h4>
            <p className="text-blue-800">
              Stripe è il gateway di pagamento che elabora tutte le transazioni su TournamentMaster.
              Per ogni pagamento, Stripe addebita una commissione fissa che copre i costi di
              elaborazione carta, protezione antifrode e sicurezza PCI-DSS.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-lg font-semibold text-orange-800 mb-2">
              Struttura Commissioni: 2.9% + EUR0.25 per transazione
            </div>
            <p className="text-orange-700">
              Esempio: su un pagamento di EUR100, la fee è (100 × 2.9%) + 0.25 = EUR3.15
            </p>
          </div>

          {/* Spiegazione ripartizione proporzionale */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Cosa significa &quot;ripartizione proporzionale&quot;?
            </h4>
            <p className="text-purple-800">
              Le commissioni Stripe vengono divise in base a <strong>chi riceve i soldi</strong>.
              Se TournamentMaster riceve il 33% del pagamento e l&apos;Associazione il 67%,
              allora anche la fee viene divisa 33% a TM e 67% all&apos;Associazione.
            </p>
            <p className="text-purple-700 text-sm">
              <strong>Perché?</strong> Questo sistema è equo: chi guadagna di più da una transazione,
              sostiene una quota maggiore dei costi di elaborazione.
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo Transazione</TableHead>
                <TableHead className="text-center">Importo</TableHead>
                <TableHead className="text-center">Fee Stripe</TableHead>
                <TableHead>Chi paga la fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Iscrizione Torneo</TableCell>
                <TableCell className="text-center">EUR15</TableCell>
                <TableCell className="text-center">EUR0.69</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>TM riceve EUR5 (33%) → paga EUR0.23</div>
                    <div>Ass. riceve EUR10 (67%) → paga EUR0.46</div>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">Team Profile</TableCell>
                <TableCell className="text-center">EUR30</TableCell>
                <TableCell className="text-center">EUR1.12</TableCell>
                <TableCell>
                  <div className="text-sm">
                    TM riceve 100% → paga 100% della fee
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Sponsor Gold</TableCell>
                <TableCell className="text-center">EUR1.200</TableCell>
                <TableCell className="text-center">EUR35.05</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>TM riceve 50% → paga EUR17.52</div>
                    <div>Ass. riceve 50% → paga EUR17.53</div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Nessun costo nascosto</AlertTitle>
            <AlertDescription>
              Le fee Stripe sono gli unici costi di transazione. Non ci sono commissioni
              aggiuntive da parte di TournamentMaster sui pagamenti.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Esempio Pratico Torneo */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Esempio Pratico: Torneo con 50 Iscritti a EUR15
          </CardTitle>
          <CardDescription>
            Simulazione completa dei flussi economici per un torneo tipico
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              Questo esempio mostra esattamente <strong>quanto guadagna l&apos;associazione</strong> da un
              torneo con 50 partecipanti che pagano EUR15 ciascuno. Include la quota TournamentMaster
              (EUR5 fissi per iscrizione) e le commissioni Stripe (proporzionali allo split).
            </p>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Incasso lordo</TableCell>
                <TableCell>50 x EUR15</TableCell>
                <TableCell className="text-right font-semibold">EUR750,00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Quota TournamentMaster</TableCell>
                <TableCell>50 x EUR5</TableCell>
                <TableCell className="text-right text-purple-600">-EUR250,00</TableCell>
              </TableRow>
              <TableRow className="bg-green-50">
                <TableCell className="font-medium">Quota Associazione lorda</TableCell>
                <TableCell>50 x EUR10</TableCell>
                <TableCell className="text-right font-semibold">EUR500,00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Fee Stripe (proporzionale)</TableCell>
                <TableCell>~3%</TableCell>
                <TableCell className="text-right text-red-600">-EUR23,00</TableCell>
              </TableRow>
              <TableRow className="bg-green-100 text-lg">
                <TableCell className="font-bold">NETTO ASSOCIAZIONE</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold text-green-700">EUR477,00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Guida all'uso di Stripe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6 text-purple-600" />
            Guida all&apos;Uso di Stripe
          </CardTitle>
          <CardDescription>
            Come gestire pagamenti, payout e monitoraggio dalla dashboard Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Cos&apos;è Stripe Connect?</h4>
            <p className="text-purple-800">
              TournamentMaster utilizza <strong>Stripe Connect</strong>, un sistema che permette di gestire
              pagamenti split automatici. Quando un partecipante paga, i fondi vengono divisi istantaneamente
              tra TM e l&apos;associazione, senza intervento manuale.
            </p>
          </div>

          {/* Step-by-step per SuperAdmin */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Dashboard Stripe - Cosa puoi fare
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Monitoraggio Transazioni</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Visualizza tutte le transazioni in tempo reale: iscrizioni, sponsor, acquisti.
                </p>
                <a
                  href="https://dashboard.stripe.com/payments"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Apri Payments <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Account Connessi</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Gestisci le associazioni collegate, verifica onboarding, vedi i loro payout.
                </p>
                <a
                  href="https://dashboard.stripe.com/connect/accounts/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Apri Connect <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Balance e Payout</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Controlla il saldo disponibile e lo storico dei payout verso il conto TM.
                </p>
                <a
                  href="https://dashboard.stripe.com/balance/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Apri Balance <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Rimborsi e Dispute</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Gestisci richieste di rimborso e eventuali dispute con i clienti.
                </p>
                <a
                  href="https://dashboard.stripe.com/disputes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Apri Disputes <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Metriche chiave */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-600" />
              Metriche da Monitorare
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">Volume</div>
                <div className="text-sm text-muted-foreground">Totale transato</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">Fee %</div>
                <div className="text-sm text-muted-foreground">Costo medio Stripe</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">Split</div>
                <div className="text-sm text-muted-foreground">Quota TM vs Ass.</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">Refund %</div>
                <div className="text-sm text-muted-foreground">Tasso rimborsi</div>
              </div>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Accesso Dashboard</AlertTitle>
            <AlertDescription>
              Per accedere alla dashboard Stripe completa, usa le credenziali dell&apos;account
              TournamentMaster su <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">dashboard.stripe.com</a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SEZIONE ADMIN ASSOCIAZIONE - Focus su costi e guadagni
// ============================================================================
function TenantAdminGuide() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-8">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="h-10 w-10" />
          <div>
            <h2 className="text-3xl font-bold">Tariffe per la Tua Associazione</h2>
            <p className="text-green-200 text-lg">Quanto costa e quanto guadagni con TournamentMaster</p>
          </div>
        </div>
      </div>

      {/* Quanto Costa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Euro className="h-6 w-6 text-green-600" />
            Quanto Costa TournamentMaster?
          </CardTitle>
          <CardDescription>
            Scegli il piano piu adatto alla tua associazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-6 w-6 text-gray-500" />
                <span className="text-xl font-semibold">Starter</span>
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">Gratis</div>
              <p className="text-muted-foreground mb-4">Perfetto per iniziare</p>
              <Separator className="my-4" />
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Fino a <strong>3 tornei</strong> all&apos;anno</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Massimo <strong>30 partecipanti</strong> per torneo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Classifiche in tempo reale</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Validazione GPS base</span>
                </li>
              </ul>
            </div>

            {/* Pro */}
            <div className="border-2 border-green-500 rounded-xl p-6 relative bg-green-50">
              <Badge className="absolute -top-3 right-4 bg-green-600 text-white">Consigliato</Badge>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-green-600" />
                <span className="text-xl font-semibold">Pro</span>
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">EUR29<span className="text-lg font-normal">/mese</span></div>
              <p className="text-muted-foreground mb-4">Per associazioni attive</p>
              <Separator className="my-4" />
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span><strong>Tornei illimitati</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Fino a <strong>200 partecipanti</strong> per torneo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Statistiche avanzate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Supporto prioritario</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>Personalizzazione brand</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                <span className="text-green-800 font-medium">Risparmia con il piano annuale: EUR290/anno</span>
              </div>
            </div>

            {/* Enterprise */}
            <div className="border rounded-xl p-6 bg-purple-50">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-semibold">Enterprise</span>
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">EUR99<span className="text-lg font-normal">/mese</span></div>
              <p className="text-muted-foreground mb-4">Per federazioni e grandi eventi</p>
              <Separator className="my-4" />
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <span><strong>Partecipanti illimitati</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <span>White-label completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <span>Accesso API</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <span>Account manager dedicato</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quanto Guadagni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <PiggyBank className="h-6 w-6 text-green-600" />
            Quanto Guadagna la Tua Associazione?
          </CardTitle>
          <CardDescription>
            Dalle iscrizioni ai tornei, tu decidi il prezzo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Il tuo guadagno e semplice</AlertTitle>
            <AlertDescription className="text-green-700">
              TournamentMaster trattiene solo <strong>EUR5 fissi</strong> per ogni iscrizione.
              Il resto e tutto tuo! Decidi liberamente la quota di iscrizione.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-xl p-5 text-center">
              <div className="text-muted-foreground mb-2">Quota economica</div>
              <div className="text-3xl font-bold mb-2">EUR15</div>
              <Separator className="my-3" />
              <div className="text-sm">
                <span className="text-purple-600">TM: EUR5</span>
                <span className="mx-2">|</span>
                <span className="text-green-600 font-semibold">Tu: EUR10</span>
              </div>
            </div>
            <div className="border-2 border-green-500 rounded-xl p-5 text-center bg-green-50">
              <div className="text-green-600 font-medium mb-2">Quota consigliata</div>
              <div className="text-3xl font-bold mb-2">EUR25</div>
              <Separator className="my-3" />
              <div className="text-sm">
                <span className="text-purple-600">TM: EUR5</span>
                <span className="mx-2">|</span>
                <span className="text-green-600 font-semibold">Tu: EUR20</span>
              </div>
            </div>
            <div className="border rounded-xl p-5 text-center">
              <div className="text-muted-foreground mb-2">Evento premium</div>
              <div className="text-3xl font-bold mb-2">EUR50</div>
              <Separator className="my-3" />
              <div className="text-sm">
                <span className="text-purple-600">TM: EUR5</span>
                <span className="mx-2">|</span>
                <span className="text-green-600 font-semibold">Tu: EUR45</span>
              </div>
            </div>
          </div>

          {/* Esempio Torneo */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Esempio: Torneo con 50 iscritti a EUR15
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Incasso totale</div>
                <div className="text-2xl font-bold">EUR750</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Quota TM</div>
                <div className="text-2xl font-bold text-purple-600">-EUR250</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Fee Stripe (~3%)</div>
                <div className="text-2xl font-bold text-red-500">-EUR23</div>
              </div>
              <div className="text-center bg-green-100 rounded-lg p-2">
                <div className="text-sm text-green-700">Il tuo netto</div>
                <div className="text-2xl font-bold text-green-700">EUR477</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quando Ricevi i Soldi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-green-600" />
            Quando Ricevi i Soldi?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-green-500 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-lg">Payout Settimanale</span>
                <Badge className="bg-green-600">Standard</Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Ogni <strong>Lunedi alle 09:00</strong> ricevi tutti gli incassi della settimana precedente sul tuo conto bancario.
              </p>
              <div className="text-sm text-muted-foreground">
                <strong>Minimo payout:</strong> EUR10 (se inferiore, accumula per la settimana dopo)
              </div>
            </div>
            <div className="border rounded-xl p-5 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-lg text-muted-foreground">Payout Giornaliero</span>
                <Badge variant="outline">Pro Annuale / Enterprise</Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Ogni giorno lavorativo ricevi gli incassi del giorno precedente.
              </p>
              <div className="text-sm text-muted-foreground">
                Disponibile con piano Pro Annuale o Enterprise
              </div>
            </div>
          </div>
          <Alert className="mt-4">
            <Clock className="h-4 w-4" />
            <AlertTitle>Tempo di accredito</AlertTitle>
            <AlertDescription>
              Dopo il payout, i fondi arrivano sul tuo conto in <strong>1-2 giorni lavorativi</strong> (bonifico SEPA standard).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Altri Guadagni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Star className="h-6 w-6 text-green-600" />
            Altri Modi per Guadagnare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold">Sponsorizzazioni</span>
                <Badge className="bg-green-100 text-green-700">50% per te</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Trova sponsor per i tuoi tornei. Ricevi il 50% di ogni pacchetto venduto.
              </p>
              <div className="text-xs text-muted-foreground">
                Bronze EUR500 (tu EUR250) | Silver EUR1.000 (tu EUR500) | Gold EUR2.500 (tu EUR1.250)
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Report e Certificati</span>
                <Badge className="bg-green-100 text-green-700">20% per te</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                I partecipanti possono acquistare report premium e certificati. Tu ricevi il 20%.
              </p>
              <div className="text-xs text-muted-foreground">
                Report EUR15 (tu EUR3) | Pack 10 certificati EUR9 (tu EUR1.80)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe è Gratuito per le Associazioni */}
      <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-green-600" />
            Stripe è Gratuito per la Tua Associazione
          </CardTitle>
          <CardDescription>
            Nessun costo di attivazione, nessun canone mensile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-100 border-green-300">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Ottima notizia!</AlertTitle>
            <AlertDescription className="text-green-700">
              TournamentMaster usa <strong>Stripe Connect Express</strong>, che è <strong>completamente gratuito</strong> per
              le associazioni. Non paghi nulla per attivare il tuo account Stripe, non ci sono canoni mensili
              e non hai vincoli contrattuali.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-xl p-5 text-center bg-white">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">EUR0</div>
              <div className="text-sm font-medium">Costo Attivazione</div>
              <div className="text-xs text-muted-foreground mt-1">Registrazione gratuita</div>
            </div>
            <div className="border rounded-xl p-5 text-center bg-white">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">EUR0</div>
              <div className="text-sm font-medium">Canone Mensile</div>
              <div className="text-xs text-muted-foreground mt-1">Mai, per sempre</div>
            </div>
            <div className="border rounded-xl p-5 text-center bg-white">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Link2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm font-medium">Vincoli</div>
              <div className="text-xs text-muted-foreground mt-1">Esci quando vuoi</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Unico Costo: Fee sulle Transazioni
            </h4>
            <p className="text-amber-800 mb-3">
              L&apos;unico costo che sostieni sono le <strong>commissioni Stripe sulle transazioni</strong>
              (2.9% + EUR0.25 per pagamento). Queste fee vengono dedotte automaticamente solo quando
              ricevi un pagamento - quindi paghi solo quando guadagni.
            </p>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-sm font-medium mb-2">Esempio pratico:</div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-bold">EUR10</div>
                  <div className="text-xs text-muted-foreground">La tua quota</div>
                </div>
                <div>
                  <div className="font-bold text-red-500">-EUR0.46</div>
                  <div className="text-xs text-muted-foreground">Fee Stripe</div>
                </div>
                <div>
                  <div className="font-bold text-green-600">EUR9.54</div>
                  <div className="text-xs text-muted-foreground">Ricevi</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Perché Stripe e non altri?</h4>
              <p className="text-blue-800 text-sm">
                Stripe è usato da milioni di aziende (Amazon, Google, Spotify) ed è certificato PCI-DSS Level 1,
                il massimo livello di sicurezza. Le associazioni sportive in Italia lo possono usare senza
                problemi fiscali: Stripe genera report compatibili con la contabilità associativa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Come Registrarsi a Stripe - Processo Dettagliato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Link2 className="h-6 w-6 text-green-600" />
            Come Registrarsi a Stripe
          </CardTitle>
          <CardDescription>
            Guida passo-passo per collegare la tua associazione a Stripe (5-10 minuti)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cosa ti serve */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cosa Ti Serve Prima di Iniziare
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium text-sm">IBAN dell&apos;associazione</span>
                  <div className="text-xs text-muted-foreground">Il conto dove riceverai i pagamenti</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium text-sm">Codice Fiscale o P.IVA</span>
                  <div className="text-xs text-muted-foreground">Dell&apos;associazione (non personale)</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium text-sm">Documento del Presidente</span>
                  <div className="text-xs text-muted-foreground">Carta d&apos;identità o passaporto valido</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium text-sm">Email dell&apos;associazione</span>
                  <div className="text-xs text-muted-foreground">Dove riceverai le notifiche Stripe</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1 */}
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">1</div>
              <div>
                <h4 className="font-semibold text-lg">Avvia la Registrazione da TournamentMaster</h4>
                <span className="text-sm text-muted-foreground">~1 minuto</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground ml-13">
              <p>Dalla tua <strong>Dashboard Associazione</strong>, vai su <strong>Pagamenti</strong> e clicca su <strong>&quot;Collega Account Stripe&quot;</strong>.</p>
              <p>Verrai reindirizzato al sito sicuro di Stripe per completare la registrazione. Non devi creare un account Stripe separato - viene tutto gestito attraverso TournamentMaster.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">2</div>
              <div>
                <h4 className="font-semibold text-lg">Inserisci i Dati dell&apos;Associazione</h4>
                <span className="text-sm text-muted-foreground">~3 minuti</span>
              </div>
            </div>
            <div className="space-y-3 ml-13">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="font-medium text-sm mb-1">Tipo di organizzazione</div>
                  <div className="text-xs text-muted-foreground">Seleziona &quot;Associazione&quot; o &quot;No-profit&quot;</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="font-medium text-sm mb-1">Nome legale</div>
                  <div className="text-xs text-muted-foreground">Es. &quot;A.S.D. Pescatori del Lago&quot;</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="font-medium text-sm mb-1">Indirizzo sede legale</div>
                  <div className="text-xs text-muted-foreground">Come da Statuto</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="font-medium text-sm mb-1">Codice Fiscale / P.IVA</div>
                  <div className="text-xs text-muted-foreground">Dell&apos;associazione</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">3</div>
              <div>
                <h4 className="font-semibold text-lg">Verifica del Rappresentante Legale</h4>
                <span className="text-sm text-muted-foreground">~2 minuti</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground ml-13">
              <p>Stripe richiede i dati del <strong>Presidente</strong> (o legale rappresentante) per verificare l&apos;identità:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Nome, cognome, data di nascita</li>
                <li>Codice fiscale personale</li>
                <li>Indirizzo di residenza</li>
                <li>Foto del documento d&apos;identità (fronte e retro)</li>
              </ul>
              <Alert className="mt-3">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  I dati personali sono protetti da crittografia e usati solo per la verifica antiriciclaggio
                  richiesta dalla legge. Non vengono condivisi con TournamentMaster.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border-l-4 border-amber-500 pl-4 py-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">4</div>
              <div>
                <h4 className="font-semibold text-lg">Collega il Conto Bancario</h4>
                <span className="text-sm text-muted-foreground">~1 minuto</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground ml-13">
              <p>Inserisci l&apos;<strong>IBAN</strong> del conto corrente dell&apos;associazione dove vuoi ricevere i pagamenti.</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                <p className="text-green-800 text-xs">
                  <strong>Consiglio:</strong> Usa il conto corrente intestato all&apos;associazione, non un conto personale.
                  Questo semplifica la contabilità e rende tutto trasparente.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="border-l-4 border-green-600 pl-4 py-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">✓</div>
              <div>
                <h4 className="font-semibold text-lg text-green-700">Attendi la Verifica</h4>
                <span className="text-sm text-muted-foreground">1-2 giorni lavorativi</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground ml-13">
              <p>Stripe verificherà i documenti in <strong>1-2 giorni lavorativi</strong>. Riceverai una email di conferma quando il tuo account sarà attivo.</p>
              <p>Nel frattempo puoi già creare tornei su TournamentMaster - i pagamenti saranno abilitati appena la verifica è completata.</p>
            </div>
          </div>

          {/* Stato verifica */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Stato della Verifica</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">In Attesa</div>
                  <div className="text-xs text-yellow-700">Documenti in verifica</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-800">Verificato</div>
                  <div className="text-xs text-green-700">Pronto a ricevere pagamenti</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-red-800">Richiesta Info</div>
                  <div className="text-xs text-red-700">Servono altri documenti</div>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Hai bisogno di aiuto?</AlertTitle>
            <AlertDescription className="text-blue-700">
              Se hai problemi durante la registrazione, contattaci a{" "}
              <a href="mailto:onboarding@tournamentmaster.it" className="underline font-medium">
                onboarding@tournamentmaster.it
              </a>
              . Ti guideremo passo passo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Guida all'uso di Stripe per Associazioni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6 text-green-600" />
            Come Usare Stripe per la Tua Associazione
          </CardTitle>
          <CardDescription>
            Guida passo-passo per collegare il conto e ricevere i pagamenti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Onboarding */}
          <div className="border-l-4 border-green-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">1</div>
              <h4 className="font-semibold text-lg">Collega il Tuo Conto Bancario</h4>
            </div>
            <p className="text-muted-foreground mb-3">
              La prima volta che accedi alla sezione pagamenti, ti verr&agrave; chiesto di completare
              l&apos;onboarding Stripe. Dovrai fornire:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                IBAN del conto corrente dell&apos;associazione
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Dati del rappresentante legale (documento d&apos;identit&agrave;)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Codice fiscale/P.IVA dell&apos;associazione
              </li>
            </ul>
            <Alert className="mt-3">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                L&apos;onboarding richiede circa <strong>5-10 minuti</strong>. Dopo la verifica (1-2 giorni),
                potrai ricevere pagamenti.
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 2: Dashboard Express */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">2</div>
              <h4 className="font-semibold text-lg">Accedi alla Tua Dashboard</h4>
            </div>
            <p className="text-muted-foreground mb-3">
              Dopo l&apos;onboarding, avrai accesso alla dashboard Stripe Express dove puoi:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Vedere i Pagamenti</div>
                  <div className="text-xs text-muted-foreground">Tutte le transazioni in tempo reale</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Controllare il Saldo</div>
                  <div className="text-xs text-muted-foreground">Quanto hai disponibile e in arrivo</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Storico Payout</div>
                  <div className="text-xs text-muted-foreground">Tutti i bonifici ricevuti</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Download className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Scaricare Report</div>
                  <div className="text-xs text-muted-foreground">Export CSV per contabilit&agrave;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Ricevere Pagamenti */}
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">3</div>
              <h4 className="font-semibold text-lg">Ricevi i Pagamenti Automaticamente</h4>
            </div>
            <p className="text-muted-foreground mb-3">
              Una volta collegato, tutto &egrave; automatico:
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <CircleDollarSign className="h-8 w-8 text-green-600 mx-auto mb-1" />
                  <div className="text-xs font-medium">Pagamento</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 text-purple-600 mx-auto mb-1" />
                  <div className="text-xs font-medium">Split Auto</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <Building className="h-8 w-8 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs font-medium">Tuo Conto</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <Mail className="h-8 w-8 text-amber-600 mx-auto mb-1" />
                  <div className="text-xs font-medium">Email Conferma</div>
                </div>
              </div>
            </div>
          </div>

          {/* Problemi comuni */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Problemi Comuni e Soluzioni
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-amber-800">Non ricevo i payout:</span>
                <span className="text-amber-700"> Verifica che l&apos;IBAN sia corretto nella dashboard Stripe e che il saldo minimo (EUR10) sia raggiunto.</span>
              </div>
              <div>
                <span className="font-medium text-amber-800">Onboarding bloccato:</span>
                <span className="text-amber-700"> Controlla di aver caricato un documento leggibile. Contatta support@tournamentmaster.it se persistono problemi.</span>
              </div>
              <div>
                <span className="font-medium text-amber-800">Pagamento non visibile:</span>
                <span className="text-amber-700"> I pagamenti appaiono entro pochi minuti. Se manca dopo 1 ora, contattaci con il numero ordine.</span>
              </div>
            </div>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Supporto Dedicato</AlertTitle>
            <AlertDescription className="text-green-700">
              Hai problemi con i pagamenti? Contatta <a href="mailto:payments@tournamentmaster.it" className="underline font-medium">payments@tournamentmaster.it</a> - rispondiamo entro 4 ore lavorative.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SEZIONE UTENTE - Quanto costa partecipare
// ============================================================================
function ParticipantGuide() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-8">
        <div className="flex items-center gap-3 mb-3">
          <Euro className="h-10 w-10" />
          <div>
            <h2 className="text-3xl font-bold">Quanto Costa Partecipare?</h2>
            <p className="text-blue-200 text-lg">Guida alle tariffe per pescatori e partecipanti</p>
          </div>
        </div>
      </div>

      {/* Iscrizione Tornei */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-blue-600" />
            Quanto Costa Iscriversi a un Torneo?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-muted-foreground">
            La quota di iscrizione varia da torneo a torneo ed è decisa dall&apos;associazione organizzatrice.
            Generalmente le quote vanno da <strong>EUR15 a EUR50</strong> a seconda del tipo di evento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-xl p-5 text-center">
              <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <div className="text-sm text-muted-foreground mb-1">Torneo Locale</div>
              <div className="text-3xl font-bold">EUR15-20</div>
              <div className="text-sm text-muted-foreground mt-2">Piccoli eventi, poche ore</div>
            </div>
            <div className="border-2 border-blue-500 rounded-xl p-5 text-center bg-blue-50">
              <Trophy className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <div className="text-sm text-blue-600 mb-1">Torneo Standard</div>
              <div className="text-3xl font-bold">EUR25-35</div>
              <div className="text-sm text-muted-foreground mt-2">Giornata intera, premi</div>
            </div>
            <div className="border rounded-xl p-5 text-center bg-purple-50">
              <Crown className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <div className="text-sm text-purple-600 mb-1">Campionato / Premium</div>
              <div className="text-3xl font-bold">EUR40-100</div>
              <div className="text-sm text-muted-foreground mt-2">Multi-giornata, grandi premi</div>
            </div>
          </div>

          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>Cosa include la quota?</AlertTitle>
            <AlertDescription>
              La quota di iscrizione include: accesso al torneo, classifica in tempo reale, validazione GPS delle catture,
              e certificato di partecipazione digitale.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Servizi Aggiuntivi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Star className="h-6 w-6 text-blue-600" />
            Servizi Aggiuntivi (Opzionali)
          </CardTitle>
          <CardDescription>
            Migliora la tua esperienza con questi servizi extra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Profilo Team</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Crea una pagina pubblica per il tuo team con foto, statistiche e risultati.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Singolo evento</span>
                  <Badge variant="outline" className="font-semibold">EUR29</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Stagionale (1 anno)</span>
                  <Badge variant="outline" className="font-semibold">EUR99</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                  <span>Permanente</span>
                  <Badge className="bg-blue-600">EUR249</Badge>
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Report e Certificati</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Ottieni statistiche dettagliate e certificati delle tue vittorie.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Report Torneo Premium</span>
                  <Badge variant="outline" className="font-semibold">EUR15</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Pack 10 Certificati PDF</span>
                  <Badge variant="outline" className="font-semibold">EUR9</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metodi di Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Come Puoi Pagare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Carta</div>
              <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Smartphone className="h-8 w-8 text-gray-800 mx-auto mb-2" />
              <div className="font-medium text-sm">Apple Pay</div>
              <div className="text-xs text-muted-foreground">Face ID / Touch ID</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Google Pay</div>
              <div className="text-xs text-muted-foreground">Android</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Building className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Bonifico</div>
              <div className="text-xs text-muted-foreground">Per importi &gt;EUR100</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Klarna</div>
              <div className="text-xs text-muted-foreground">3 rate, min EUR50</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sicurezza */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="h-10 w-10 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg text-green-800 mb-2">Pagamenti 100% Sicuri</h3>
              <p className="text-green-700 mb-3">
                TournamentMaster utilizza <strong>Stripe</strong>, lo stesso sistema usato da Amazon, Google e Spotify.
                I tuoi dati della carta non vengono mai memorizzati sui nostri server.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white">PCI-DSS Level 1</Badge>
                <Badge variant="outline" className="bg-white">3D Secure 2.0</Badge>
                <Badge variant="outline" className="bg-white">Crittografia TLS 1.3</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            Domande Frequenti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2">Posso avere un rimborso?</h4>
            <p className="text-muted-foreground">
              Sì, puoi richiedere il rimborso entro 48 ore dall&apos;iscrizione se il torneo non è ancora iniziato.
              Vai su Dashboard &gt; I Miei Pagamenti &gt; Richiedi Rimborso.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2">Ricevo una ricevuta?</h4>
            <p className="text-muted-foreground">
              Si, dopo ogni pagamento ricevi automaticamente una email con la ricevuta.
              Puoi scaricare tutte le ricevute dalla sezione Dashboard.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2">Posso pagare con PayPal?</h4>
            <p className="text-muted-foreground">
              Al momento PayPal non e disponibile. Puoi usare carta di credito/debito,
              Apple Pay, Google Pay, bonifico SEPA o Klarna (rate).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Il pagamento e fallito, cosa faccio?</h4>
            <p className="text-muted-foreground">
              Verifica che i dati della carta siano corretti e che ci sia disponibilita sul conto.
              Se il problema persiste, prova un altro metodo di pagamento o contatta la tua banca.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Come Funziona il Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6 text-blue-600" />
            Come Funziona il Pagamento
          </CardTitle>
          <CardDescription>
            I tuoi pagamenti sono gestiti in modo sicuro da Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Pagamenti Sicuri con Stripe</h4>
            <p className="text-blue-800">
              Quando paghi un&apos;iscrizione o un servizio, i tuoi dati vengono elaborati
              direttamente da <strong>Stripe</strong>, la piattaforma di pagamenti usata da
              aziende come Amazon, Google e Spotify. I dati della tua carta non vengono
              mai memorizzati sui nostri server.
            </p>
          </div>

          {/* Flusso pagamento */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-4">Cosa succede quando paghi:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <span className="font-medium">Inserisci i dati di pagamento</span>
                  <span className="text-muted-foreground text-sm block">Carta, Apple Pay, Google Pay o altro metodo</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <span className="font-medium">Stripe verifica il pagamento</span>
                  <span className="text-muted-foreground text-sm block">Controllo antifrode automatico in millisecondi</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <span className="font-medium">Ricevi conferma immediata</span>
                  <span className="text-muted-foreground text-sm block">Email con ricevuta e dettagli iscrizione</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">✓</div>
                <div>
                  <span className="font-medium text-green-700">Sei iscritto!</span>
                  <span className="text-muted-foreground text-sm block">Puoi vedere la tua iscrizione nella Dashboard</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ricevute */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-5 w-5 text-green-600" />
                <span className="font-medium">Le Tue Ricevute</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ogni pagamento genera automaticamente una ricevuta. Puoi scaricarle
                tutte dalla sezione <strong>Dashboard &gt; I Miei Pagamenti</strong>.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Rimborsi</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Puoi richiedere un rimborso entro 48 ore dall&apos;iscrizione se il
                torneo non &egrave; ancora iniziato. Vai su <strong>I Miei Pagamenti &gt; Richiedi Rimborso</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contatti */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Hai bisogno di aiuto?</h3>
              <p className="text-blue-700">
                Contattaci a <a href="mailto:payments-users@tournamentmaster.it" className="underline font-medium">payments-users@tournamentmaster.it</a>
                {" "}- rispondiamo entro 4 ore.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// PAGINA PRINCIPALE
// ============================================================================
export default function PaymentsGuidePage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const params = useParams();
  const locale = params.locale as string;

  const isSuperAdmin = hasRole("SUPER_ADMIN");
  const isTenantAdmin = hasRole("TENANT_ADMIN", "PRESIDENT");
  const isParticipant = !isSuperAdmin && !isTenantAdmin;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Link */}
      <Link
        href={`/${locale}/payments`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna ai Pagamenti
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">Guida Tariffe</h1>
        {isAuthenticated && user && (
          <p className="text-muted-foreground text-lg">
            Ciao <strong>{user.firstName}</strong>!
            <Badge className="ml-2" variant="outline">
              {user.role.replace("_", " ")}
            </Badge>
          </p>
        )}
        {!isAuthenticated && (
          <p className="text-muted-foreground">
            <Link href={`/${locale}/login`} className="text-primary hover:underline font-medium">
              Accedi
            </Link>
            {" "}per vedere la guida completa per il tuo ruolo.
          </p>
        )}
      </div>

      {/* Contenuto basato sul ruolo */}
      {!isAuthenticated && <ParticipantGuide />}

      {isAuthenticated && (
        <>
          {isSuperAdmin && <SuperAdminGuide />}
          {isTenantAdmin && !isSuperAdmin && <TenantAdminGuide />}
          {isParticipant && <ParticipantGuide />}
        </>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>TournamentMaster</strong> - Piattaforma per tornei di pesca sportiva
        </p>
        <p>
          Pagamenti sicuri powered by{" "}
          <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Stripe
          </a>
          {" "}| Documento aggiornato al 02/01/2026
        </p>
      </div>
    </main>
  );
}
