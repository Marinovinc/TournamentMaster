/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/cookies/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Cookie Policy - Informativa sull'uso dei cookie
 * =============================================================================
 */

import Link from "next/link";
import { Home, Cookie, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CookiesPage({
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
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-4">
          <Cookie className="h-8 w-8 text-primary" />
          Cookie Policy
        </h1>
        <p className="text-muted-foreground">
          Ultimo aggiornamento: 2 Gennaio 2026
        </p>
      </div>

      <Card>
        <CardContent className="prose prose-slate max-w-none py-8">
          <h2>1. Cosa sono i Cookie</h2>
          <p>
            I cookie sono piccoli file di testo che vengono memorizzati sul
            dispositivo dell&apos;utente quando visita un sito web. Servono a
            migliorare l&apos;esperienza di navigazione e a fornire funzionalita
            personalizzate.
          </p>

          <h2>2. Tipologie di Cookie Utilizzati</h2>

          <h3>Cookie Tecnici (Necessari)</h3>
          <p>
            <Badge className="mr-2">Sempre attivi</Badge>
            Essenziali per il funzionamento del sito. Non richiedono consenso.
          </p>
          <ul>
            <li><strong>Sessione:</strong> Mantengono l&apos;utente autenticato</li>
            <li><strong>Preferenze:</strong> Memorizzano lingua e tema scelti</li>
            <li><strong>Sicurezza:</strong> Proteggono da accessi non autorizzati</li>
          </ul>

          <h3>Cookie Analitici</h3>
          <p>
            <Badge variant="outline" className="mr-2">Opzionali</Badge>
            Raccolgono informazioni anonime sull&apos;utilizzo del sito.
          </p>
          <ul>
            <li>Pagine visitate e tempo di permanenza</li>
            <li>Percorsi di navigazione</li>
            <li>Errori riscontrati</li>
          </ul>

          <h3>Cookie Funzionali</h3>
          <p>
            <Badge variant="outline" className="mr-2">Opzionali</Badge>
            Migliorano l&apos;esperienza utente con funzionalita aggiuntive.
          </p>
          <ul>
            <li>Memorizzazione preferenze di visualizzazione</li>
            <li>Autocompletamento moduli</li>
            <li>Localizzazione automatica</li>
          </ul>

          <h2>3. Cookie di Terze Parti</h2>
          <p>
            Alcuni cookie possono essere impostati da servizi di terze parti
            integrati nella piattaforma:
          </p>
          <ul>
            <li><strong>Google Maps:</strong> Per visualizzare mappe dei tornei</li>
            <li><strong>Cloudflare:</strong> Per sicurezza e performance</li>
          </ul>

          <h2>4. Durata dei Cookie</h2>
          <ul>
            <li><strong>Cookie di sessione:</strong> Eliminati alla chiusura del browser</li>
            <li><strong>Cookie persistenti:</strong> Rimangono per un periodo definito (max 12 mesi)</li>
          </ul>

          <h2>5. Gestione del Consenso</h2>
          <p>
            Al primo accesso al sito, viene mostrato un banner per la gestione
            del consenso. L&apos;utente puo:
          </p>
          <ul>
            <li>Accettare tutti i cookie</li>
            <li>Rifiutare i cookie non necessari</li>
            <li>Personalizzare le preferenze</li>
          </ul>
          <p>
            Il consenso puo essere modificato in qualsiasi momento dalle
            impostazioni del sito.
          </p>

          <h2>6. Come Disabilitare i Cookie</h2>
          <p>
            E possibile disabilitare i cookie attraverso le impostazioni del
            browser. Di seguito le guide per i browser piu comuni:
          </p>
          <ul>
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Microsoft Edge
              </a>
            </li>
          </ul>

          <h2>7. Conseguenze della Disabilitazione</h2>
          <p>
            La disabilitazione di alcuni cookie potrebbe influire sul corretto
            funzionamento di alcune funzionalita del sito, in particolare:
          </p>
          <ul>
            <li>Impossibilita di mantenere la sessione attiva</li>
            <li>Perdita delle preferenze salvate</li>
            <li>Funzionalita di geolocalizzazione limitate</li>
          </ul>

          <h2>8. Aggiornamenti alla Cookie Policy</h2>
          <p>
            Questa policy puo essere aggiornata periodicamente. Le modifiche
            saranno comunicate attraverso il banner cookie o notifiche in-app.
          </p>

          <h2>9. Link alla Privacy Policy</h2>
          <p>
            Per informazioni complete sul trattamento dei dati personali,
            consultare la{" "}
            <Link href={`/${locale}/privacy`} className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <h2>10. Contatti</h2>
          <p>
            Per domande sulla presente Cookie Policy:
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:privacy@tournamentmaster.it" className="text-primary hover:underline">
              privacy@tournamentmaster.it
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
