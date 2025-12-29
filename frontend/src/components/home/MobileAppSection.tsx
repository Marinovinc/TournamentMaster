/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/home/MobileAppSection.tsx
 * Creato: 2025-12-29
 * Descrizione: Sezione download app mobile proprietaria con QR code
 *
 * Features:
 * - Descrizione app mobile
 * - QR code reali scansionabili per download diretto
 * - Istruzioni installazione sideload
 * - Lista funzionalita principali
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { Smartphone, Download, CheckCircle, Wifi, Camera, MapPin, Trophy, Video, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";

const appFeatures = [
  { icon: Camera, text: "Scatta foto catture con guida posizionamento" },
  { icon: MapPin, text: "GPS automatico per validazione posizione" },
  { icon: Trophy, text: "Classifica live in tempo reale" },
  { icon: Video, text: "Video tutorial scaricabili offline" },
  { icon: Wifi, text: "Funziona anche senza connessione" },
];

export function MobileAppSection() {
  // Download diretti dal sito - app proprietaria non su store
  const iosDownloadUrl = "/downloads/TournamentMaster-iOS.ipa";
  const androidDownloadUrl = "/downloads/TournamentMaster.apk";

  // Base URL - usa IP rete locale per accesso da dispositivi mobili
  // In sviluppo: Apache reverse proxy su porta 80 -> Next.js porta 3000
  // In produzione: dominio reale (es. https://tournamentmaster.app)
  const localNetworkIp = "192.168.1.74";
  const productionUrl = "https://tournamentmaster.app";

  // Determina se siamo in sviluppo locale o produzione
  const [baseUrl, setBaseUrl] = useState(productionUrl);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      // Sviluppo locale - i file sono serviti da Apache su porta 80
      setBaseUrl(`http://${localNetworkIp}`);
    } else {
      // Produzione - usa l'origin attuale
      setBaseUrl(window.location.origin);
    }
  }, []);

  // URL completi per i QR code (passano attraverso Apache proxy)
  const iosFullUrl = `${baseUrl}${iosDownloadUrl}`;
  const androidFullUrl = `${baseUrl}${androidDownloadUrl}`;

  return (
    <section className="py-20 relative overflow-hidden" id="download-app">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-emerald-600/5"></div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-0">
            <Smartphone className="h-4 w-4 mr-2" />
            Download Diretto
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Scarica l&apos;App <span className="text-gradient-sea">TournamentMaster</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            App esclusiva per i partecipanti ai nostri tornei. Scarica direttamente da qui
            e installa sul tuo dispositivo.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Features Column */}
          <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Funzionalita App
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature.text}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Security Badge */}
            <Card className="border-0 shadow-lg bg-emerald-50 dark:bg-emerald-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-200">App Sicura e Verificata</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      Sviluppata e distribuita direttamente da TournamentMaster.
                      Nessun dato viene condiviso con terze parti.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Download Cards Column */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* iOS Card */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-400 to-gray-600"></div>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 p-3 rounded-2xl bg-black text-white w-fit">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <CardTitle className="text-xl">iPhone & iPad</CardTitle>
                  <p className="text-sm text-muted-foreground">iOS 13.0 o superiore</p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {/* QR Code */}
                  <div className="mx-auto w-40 h-40 p-3 bg-white rounded-2xl shadow-inner border flex items-center justify-center">
                    <QRCodeSVG
                      value={iosFullUrl}
                      size={128}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Scansiona per scaricare</p>

                  {/* Download Button */}
                  <Button
                    asChild
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    size="lg"
                  >
                    <a href={iosDownloadUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Scarica per iOS
                    </a>
                  </Button>

                  {/* Installation Instructions */}
                  <div className="text-left p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">Installazione iOS:</p>
                        <ol className="list-decimal list-inside space-y-0.5">
                          <li>Scarica il file .ipa</li>
                          <li>Apri con AltStore o Sideloadly</li>
                          <li>Autorizza il profilo in Impostazioni</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Android Card */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 p-3 rounded-2xl bg-green-600 text-white w-fit">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.523 15.341c-.553 0-1 .448-1 1 0 .553.447 1 1 1s1-.447 1-1c0-.552-.447-1-1-1zm-11.046 0c-.553 0-1 .448-1 1 0 .553.447 1 1 1s1-.447 1-1c0-.552-.447-1-1-1zm11.362-6.643l1.919-3.323c.107-.185.045-.423-.14-.53-.185-.107-.423-.045-.53.14l-1.943 3.365c-1.474-.67-3.129-1.043-4.895-1.043-1.767 0-3.422.373-4.896 1.043L5.411 5.005c-.107-.185-.345-.247-.53-.14-.185.107-.247.345-.14.53l1.919 3.323C3.068 10.597.753 14.178.753 18.276h22.494c0-4.098-2.315-7.679-5.908-9.578zM6.477 15.341c-.553 0-1 .448-1 1 0 .553.447 1 1 1s1-.447 1-1c0-.552-.447-1-1-1zm11.046 0c-.553 0-1 .448-1 1 0 .553.447 1 1 1s1-.447 1-1c0-.552-.447-1-1-1z"/>
                    </svg>
                  </div>
                  <CardTitle className="text-xl">Android</CardTitle>
                  <p className="text-sm text-muted-foreground">Android 8.0 o superiore</p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {/* QR Code */}
                  <div className="mx-auto w-40 h-40 p-3 bg-white rounded-2xl shadow-inner border flex items-center justify-center">
                    <QRCodeSVG
                      value={androidFullUrl}
                      size={128}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Scansiona per scaricare</p>

                  {/* Download Button */}
                  <Button
                    asChild
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <a href={androidDownloadUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Scarica APK
                    </a>
                  </Button>

                  {/* Installation Instructions */}
                  <div className="text-left p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">Installazione Android:</p>
                        <ol className="list-decimal list-inside space-y-0.5">
                          <li>Scarica il file APK</li>
                          <li>Abilita &quot;Origini sconosciute&quot;</li>
                          <li>Apri il file e installa</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-6 rounded-2xl bg-muted/50 border">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Download gratuito</p>
                    <p className="text-sm text-muted-foreground">~50 MB di spazio richiesto</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Modalita Offline</p>
                    <p className="text-sm text-muted-foreground">Funziona anche senza connessione</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Video Tutorial</p>
                    <p className="text-sm text-muted-foreground">Scarica e guarda offline</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Hai bisogno di aiuto con l&apos;installazione?{" "}
                <a href="/guida-installazione" className="text-primary hover:underline font-medium">
                  Leggi la guida completa
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
