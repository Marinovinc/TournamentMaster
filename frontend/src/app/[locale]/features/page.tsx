/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/features/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Features - Pagina funzionalita della piattaforma
 * =============================================================================
 */

import Link from "next/link";
import {
  Home,
  Sparkles,
  Trophy,
  Camera,
  MapPin,
  BarChart3,
  Users,
  Bell,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Trophy,
    title: "Gestione Tornei Completa",
    description: "Crea e gestisci tornei di ogni tipo: giornalieri, settimanali, campionati stagionali. Definisci regole personalizzate, quote di iscrizione e premi.",
    badge: "Core",
  },
  {
    icon: Camera,
    title: "Registrazione Catture con Foto",
    description: "I partecipanti possono registrare le catture con foto geolocalizzate. Sistema di guida per posizionamento corretto del pesce nella foto.",
    badge: "Core",
  },
  {
    icon: MapPin,
    title: "Validazione GPS Automatica",
    description: "Verifica automatica della posizione del pescatore nell'area di gara. Previene frodi e garantisce la regolarita delle competizioni.",
    badge: "Sicurezza",
  },
  {
    icon: BarChart3,
    title: "Classifiche in Tempo Reale",
    description: "Classifiche aggiornate istantaneamente dopo ogni cattura validata. I partecipanti possono seguire la loro posizione durante tutto il torneo.",
    badge: "Live",
  },
  {
    icon: Users,
    title: "Gestione Partecipanti",
    description: "Sistema completo per iscrizioni, pagamenti, comunicazioni. Supporto per team e classifiche individuali contemporaneamente.",
    badge: "Core",
  },
  {
    icon: Bell,
    title: "Notifiche Push",
    description: "Notifiche in tempo reale per inizio torneo, nuove catture dei competitor, aggiornamenti classifica e comunicazioni dall'organizzatore.",
    badge: "Premium",
  },
  {
    icon: Smartphone,
    title: "App Mobile Dedicata",
    description: "App nativa per iOS e Android con funzionalita offline. Registra catture anche senza connessione, sincronizza quando torni online.",
    badge: "Mobile",
  },
  {
    icon: Shield,
    title: "Anti-Frode Avanzato",
    description: "Sistema multi-livello: verifica GPS, analisi foto con AI, controllo timestamp, validazione incrociata. Garantisce competizioni eque.",
    badge: "Sicurezza",
  },
  {
    icon: Zap,
    title: "Performance Ottimizzate",
    description: "Infrastruttura cloud scalabile per gestire migliaia di partecipanti contemporaneamente senza rallentamenti.",
    badge: "Tech",
  },
  {
    icon: Globe,
    title: "Multilingua",
    description: "Piattaforma disponibile in italiano, inglese, tedesco e spagnolo. Perfetta per tornei internazionali.",
    badge: "Global",
  },
  {
    icon: Clock,
    title: "Storico Completo",
    description: "Accedi allo storico di tutti i tuoi tornei, catture e risultati. Statistiche personali e confronto con altri pescatori.",
    badge: "Analytics",
  },
  {
    icon: CheckCircle,
    title: "Certificazione FIPSAS",
    description: "Supporto per numero tessera FIPSAS. I risultati possono essere esportati per competizioni ufficiali federali.",
    badge: "Ufficiale",
  },
];

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <Badge className="mb-4 px-4 py-1.5">
          <Sparkles className="h-4 w-4 mr-2" />
          Funzionalita Complete
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Tutto cio che serve per i tuoi <span className="text-primary">Tornei di Pesca</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          TournamentMaster offre una suite completa di strumenti per organizzatori
          e partecipanti. Dalla creazione del torneo alla premiazione finale.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Pronto per iniziare?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Registrati gratuitamente come partecipante o scopri i piani per organizzatori.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href={`/${locale}/register`}>
              Registrati Gratis
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/${locale}/pricing`}>
              Vedi Piani Organizzatori
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
