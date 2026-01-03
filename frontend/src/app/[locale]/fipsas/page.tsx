/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/fipsas/page.tsx
 * Creato: 2026-01-03
 * Descrizione: Pagina dedicata alla Federazione Italiana Pesca Sportiva e
 *              Attività Subacquee (FIPSAS) - regolamenti, punteggi, affiliazione
 * =============================================================================
 */

import Link from "next/link";
import { Home, Fish, Trophy, Award, Scale, Clock, Users, ExternalLink, BookOpen, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function FIPSASPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Tabella coefficienti specie (esempio FIPSAS)
  const speciesMultipliers = [
    { species: "Tonno Rosso", multiplier: 2.5, minWeight: "30 kg", category: "Big Game" },
    { species: "Marlin Blu", multiplier: 3.0, minWeight: "50 kg", category: "Big Game" },
    { species: "Pesce Spada", multiplier: 2.8, minWeight: "40 kg", category: "Big Game" },
    { species: "Ricciola", multiplier: 1.8, minWeight: "5 kg", category: "Drifting" },
    { species: "Dentice", multiplier: 1.5, minWeight: "2 kg", category: "Bolentino" },
    { species: "Orata", multiplier: 1.3, minWeight: "1 kg", category: "Shore" },
    { species: "Spigola", multiplier: 1.4, minWeight: "1 kg", category: "Shore" },
    { species: "Lampuga", multiplier: 1.6, minWeight: "3 kg", category: "Traina" },
  ];

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Fish className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              FIPSAS
            </h1>
            <p className="text-lg text-muted-foreground">
              Federazione Italiana Pesca Sportiva e Attività Subacquee
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="text-sm">Ente Riconosciuto CONI</Badge>
          <Badge variant="outline" className="text-sm">Fondata 1942</Badge>
          <Badge variant="outline" className="text-sm">300.000+ Tesserati</Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* About FIPSAS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Chi è la FIPSAS
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <p>
              La <strong>FIPSAS</strong> (Federazione Italiana Pesca Sportiva e Attività Subacquee)
              è l&apos;organismo nazionale che promuove, organizza e disciplina la pesca sportiva
              e le attività subacquee in Italia.
            </p>
            <p>
              Riconosciuta dal <strong>CONI</strong> come unica federazione nazionale di riferimento,
              la FIPSAS coordina oltre <strong>2.500 società affiliate</strong> e più di
              <strong>300.000 tesserati</strong> su tutto il territorio nazionale.
            </p>
            <h3>Discipline Riconosciute</h3>
            <ul>
              <li><strong>Pesca d&apos;altura (Big Game)</strong> - Tonni, Marlin, Pesce Spada</li>
              <li><strong>Drifting</strong> - Pesca alla deriva per ricciole e tonni</li>
              <li><strong>Traina costiera</strong> - Lampughe, lecce, palamite</li>
              <li><strong>Bolentino</strong> - Dentici, pagelli, cernie</li>
              <li><strong>Spinning/Shore</strong> - Spigole, orate, serra</li>
              <li><strong>Vertical Jigging</strong> - Ricciole, dentici</li>
              <li><strong>Eging</strong> - Pesca ai cefalopodi</li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Link Utili
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="https://www.fipsas.it" target="_blank" rel="noopener noreferrer">
                <Fish className="h-4 w-4" />
                Sito Ufficiale FIPSAS
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="https://www.fipsas.it/tesseramento" target="_blank" rel="noopener noreferrer">
                <Users className="h-4 w-4" />
                Tesseramento Online
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="https://www.fipsas.it/regolamenti" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4" />
                Regolamenti Ufficiali
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <a href="https://www.fipsas.it/calendario" target="_blank" rel="noopener noreferrer">
                <Trophy className="h-4 w-4" />
                Calendario Gare
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scoring System */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Sistema di Punteggio FIPSAS
          </CardTitle>
          <CardDescription>
            Il punteggio viene calcolato moltiplicando il peso della cattura per il coefficiente della specie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <span className="font-mono font-bold text-lg">Punti = Peso (kg) × Coefficiente × 100</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Esempio: Ricciola di 12 kg → 12 × 1.8 × 100 = <strong>2.160 punti</strong>
            </p>
          </div>

          <h3 className="font-semibold mb-4">Coefficienti per Specie</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Specie</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Coefficiente</TableHead>
                  <TableHead>Peso Minimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {speciesMultipliers.map((item) => (
                  <TableRow key={item.species}>
                    <TableCell className="font-medium">{item.species}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-primary">
                      ×{item.multiplier}
                    </TableCell>
                    <TableCell>{item.minWeight}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            * I coefficienti possono variare in base al regolamento specifico del torneo.
            TournamentMaster permette di personalizzare i moltiplicatori per ogni competizione.
          </p>
        </CardContent>
      </Card>

      {/* Tournament Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Regole Tornei
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Pesatura Ufficiale</h4>
                <p className="text-sm text-muted-foreground">
                  Le catture devono essere pesate su bilance certificate
                  e validate da un giudice di bordo FIPSAS.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Orari di Pesca</h4>
                <p className="text-sm text-muted-foreground">
                  Le catture sono valide solo durante gli orari ufficiali
                  di gara stabiliti dal comitato organizzatore.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Equipaggio</h4>
                <p className="text-sm text-muted-foreground">
                  Ogni imbarcazione deve avere a bordo un giudice FIPSAS
                  per la validazione delle catture.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Peso Minimo</h4>
                <p className="text-sm text-muted-foreground">
                  Ogni specie ha un peso minimo. Catture sotto il limite
                  non vengono conteggiate nella classifica.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fish className="h-5 w-5" />
              TournamentMaster + FIPSAS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              TournamentMaster è progettato per essere pienamente compatibile
              con i regolamenti FIPSAS, offrendo:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">Calcolo automatico punteggi FIPSAS</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">Classifiche in tempo reale</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">PDF classifiche formato ufficiale</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">Gestione giudici di bordo</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">Validazione foto catture</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">Export dati per federazione</span>
              </li>
            </ul>
            <Button className="w-full mt-4" asChild>
              <Link href={`/${locale}/register`}>
                Inizia con TournamentMaster
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <CardContent className="py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Sei un&apos;associazione FIPSAS?
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              TournamentMaster offre piani dedicati per le associazioni affiliate FIPSAS.
              Gestisci i tuoi tornei con la tecnologia più avanzata, nel pieno rispetto
              dei regolamenti federali.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/${locale}/pricing`}>
                  Vedi i Piani
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20" asChild>
                <a href="mailto:fipsas@tournamentmaster.it">
                  Contatta il Team
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
