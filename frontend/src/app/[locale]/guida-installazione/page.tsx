/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/guida-installazione/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Guida Installazione - Istruzioni per installare l'app mobile
 * =============================================================================
 */

import Link from "next/link";
import {
  Home,
  BookOpen,
  Smartphone,
  Download,
  Settings,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function GuidaInstallazionePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
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
        <Badge className="mb-4">
          <BookOpen className="h-4 w-4 mr-2" />
          Guida
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Guida all&apos;Installazione dell&apos;App
        </h1>
        <p className="text-lg text-muted-foreground">
          L&apos;app TournamentMaster non e disponibile sugli store ufficiali.
          Segui questa guida per installarla sul tuo dispositivo.
        </p>
      </div>

      {/* Important Notice */}
      <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Nota Importante</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          L&apos;app e distribuita direttamente da TournamentMaster. Questo metodo
          di installazione (sideloading) e perfettamente legale e sicuro.
          L&apos;app e sviluppata e firmata dal nostro team.
        </AlertDescription>
      </Alert>

      {/* Android Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Installazione Android</CardTitle>
              <CardDescription>Per dispositivi Android 8.0 o superiore</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-2">Scarica il file APK</h4>
              <p className="text-muted-foreground text-sm mb-3">
                Dalla homepage, clicca su &quot;Scarica APK&quot; o scansiona il QR code
                con la fotocamera del telefono.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}#download-app`}>
                  <Download className="h-4 w-4 mr-2" />
                  Vai al Download
                </Link>
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-2">Abilita &quot;Origini sconosciute&quot;</h4>
              <p className="text-muted-foreground text-sm mb-2">
                Vai in: <strong>Impostazioni</strong> → <strong>Sicurezza</strong> → <strong>Origini sconosciute</strong>
              </p>
              <p className="text-muted-foreground text-sm">
                Oppure, quando apri il file APK, il sistema ti chiedera automaticamente
                di abilitare l&apos;installazione da fonti sconosciute per il browser/file manager.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-2">Installa l&apos;app</h4>
              <p className="text-muted-foreground text-sm">
                Apri il file APK scaricato (di solito nella cartella Download).
                Clicca su &quot;Installa&quot; e attendi il completamento.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Fatto!</h4>
              <p className="text-muted-foreground text-sm">
                L&apos;app TournamentMaster apparira nel tuo launcher. Aprila e accedi
                con le tue credenziali.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* iOS Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Installazione iOS</CardTitle>
              <CardDescription>Per iPhone e iPad con iOS 13.0 o superiore</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">Requisiti</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Per iOS e necessario un computer con AltStore, Sideloadly, o un
              account sviluppatore Apple. L&apos;installazione e piu complessa rispetto ad Android.
            </AlertDescription>
          </Alert>

          {/* Method 1: AltStore */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline">Metodo 1</Badge>
              Con AltStore (Consigliato)
            </h4>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Installa AltServer sul tuo computer (Mac o Windows)</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Collega l&apos;iPhone al computer via USB</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Installa AltStore sul telefono tramite AltServer</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Scarica il file .ipa di TournamentMaster</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Apri il file .ipa con AltStore per installarlo</span>
              </li>
            </ol>
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <a href="https://altstore.io" target="_blank" rel="noopener noreferrer">
                Scarica AltStore →
              </a>
            </Button>
          </div>

          {/* Method 2: Sideloadly */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline">Metodo 2</Badge>
              Con Sideloadly
            </h4>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Scarica e installa Sideloadly sul computer</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Collega l&apos;iPhone e selezionalo in Sideloadly</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Trascina il file .ipa nell&apos;app</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Inserisci il tuo Apple ID e clicca Start</span>
              </li>
            </ol>
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <a href="https://sideloadly.io" target="_blank" rel="noopener noreferrer">
                Scarica Sideloadly →
              </a>
            </Button>
          </div>

          {/* Trust Profile */}
          <div className="p-4 rounded-lg bg-muted">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Autorizza il Profilo Sviluppatore
            </h4>
            <p className="text-sm text-muted-foreground">
              Dopo l&apos;installazione, vai in: <strong>Impostazioni</strong> →{" "}
              <strong>Generali</strong> → <strong>Gestione dispositivo</strong> →
              Seleziona il profilo e clicca &quot;Autorizza&quot;.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Domande Frequenti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">E sicuro installare app da fonti esterne?</h4>
            <p className="text-sm text-muted-foreground">
              L&apos;app TournamentMaster e sviluppata e distribuita direttamente da noi.
              Non scaricare mai il file da fonti non ufficiali.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Perche non siete su App Store / Play Store?</h4>
            <p className="text-sm text-muted-foreground">
              La distribuzione diretta ci permette di rilasciare aggiornamenti piu rapidamente
              e di mantenere costi piu bassi, che si traducono in un servizio migliore per voi.
            </p>
          </div>
          <div>
            <h4 className="font-medium">L&apos;app si aggiorna automaticamente?</h4>
            <p className="text-sm text-muted-foreground">
              L&apos;app ti notifichera quando e disponibile un aggiornamento. Dovrai scaricare
              la nuova versione dal sito e reinstallarla seguendo la stessa procedura.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Ho problemi con l&apos;installazione, cosa faccio?</h4>
            <p className="text-sm text-muted-foreground">
              Contattaci a{" "}
              <a href="mailto:support@tournamentmaster.it" className="text-primary hover:underline">
                support@tournamentmaster.it
              </a>{" "}
              descrivendo il problema e il tuo dispositivo. Ti aiuteremo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Pronto per iniziare?
        </p>
        <Button asChild size="lg">
          <Link href={`/${locale}#download-app`}>
            <Download className="h-4 w-4 mr-2" />
            Scarica l&apos;App
          </Link>
        </Button>
      </div>
    </main>
  );
}
