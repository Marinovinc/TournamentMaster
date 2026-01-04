/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/privacy/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Privacy Policy - Informativa sulla privacy GDPR compliant
 * =============================================================================
 */

import Link from "next/link";
import { Home, Shield, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function PrivacyPage({
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
          <Shield className="h-8 w-8 text-primary" />
          Privacy Policy
        </h1>
        <p className="text-muted-foreground">
          Ultimo aggiornamento: 2 Gennaio 2026
        </p>
      </div>

      <Card>
        <CardContent className="prose prose-slate max-w-none py-8">
          <h2>1. Titolare del Trattamento</h2>
          <p>
            Il Titolare del trattamento dei dati personali e TournamentMaster,
            con sede in Via della Pesca 1, 80077 Ischia (NA), Italia.
          </p>
          <p>
            <strong>Email:</strong> privacy@tournamentmaster.it
          </p>

          <h2>2. Tipologia di Dati Raccolti</h2>
          <p>
            Tra i Dati Personali raccolti da questa Applicazione, in modo autonomo
            o tramite terze parti, ci sono:
          </p>
          <ul>
            <li>Dati di utilizzo (pagine visitate, tempo di permanenza)</li>
            <li>Email e password (per la registrazione)</li>
            <li>Nome e cognome</li>
            <li>Numero tessera FIPSAS (opzionale)</li>
            <li>Dati di geolocalizzazione (per validare le catture)</li>
            <li>Fotografie (delle catture durante i tornei)</li>
          </ul>

          <h2>3. Finalita del Trattamento</h2>
          <p>I Dati dell Utente sono raccolti per le seguenti finalita:</p>
          <ul>
            <li>Registrazione e autenticazione degli utenti</li>
            <li>Gestione delle iscrizioni ai tornei</li>
            <li>Validazione delle catture tramite geolocalizzazione</li>
            <li>Calcolo e visualizzazione delle classifiche</li>
            <li>Comunicazioni relative ai tornei</li>
            <li>Statistiche aggregate anonime</li>
          </ul>

          <h2>4. Base Giuridica del Trattamento</h2>
          <p>
            Il trattamento dei Dati Personali si basa sul consenso dell Utente
            e/o sulla necessita di eseguire un contratto di cui l Utente e parte.
          </p>

          <h2>5. Modalita di Trattamento</h2>
          <p>
            Il Titolare adotta le opportune misure di sicurezza volte ad impedire
            l accesso, la divulgazione, la modifica o la distruzione non autorizzata
            dei Dati Personali.
          </p>
          <p>
            Il trattamento viene effettuato mediante strumenti informatici e/o
            telematici, con modalita organizzative e con logiche strettamente
            correlate alle finalita indicate.
          </p>

          <h2>6. Conservazione dei Dati</h2>
          <p>
            I Dati Personali sono conservati per il tempo necessario a fornire
            il servizio richiesto dall Utente, o per le finalita descritte in
            questo documento.
          </p>
          <ul>
            <li>Dati account: fino alla cancellazione dell account</li>
            <li>Dati tornei: 5 anni dalla conclusione del torneo</li>
            <li>Dati di log: 12 mesi</li>
          </ul>

          <h2>7. Diritti dell Utente</h2>
          <p>L Utente puo esercitare i seguenti diritti:</p>
          <ul>
            <li>Accesso ai propri Dati Personali</li>
            <li>Rettifica o aggiornamento dei Dati</li>
            <li>Cancellazione dei Dati (diritto all oblio)</li>
            <li>Limitazione del trattamento</li>
            <li>Portabilita dei Dati</li>
            <li>Opposizione al trattamento</li>
            <li>Revoca del consenso</li>
          </ul>
          <p>
            Per esercitare i propri diritti, l Utente puo inviare una richiesta a:
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:privacy@tournamentmaster.it" className="text-primary hover:underline">
              privacy@tournamentmaster.it
            </a>
          </p>

          <h2>8. Cookie Policy</h2>
          <p>
            Questa Applicazione utilizza Cookie. Per maggiori informazioni,
            consultare la{" "}
            <Link href={`/${locale}/cookies`} className="text-primary hover:underline">
              Cookie Policy
            </Link>
            .
          </p>

          <h2>9. Modifiche a questa Privacy Policy</h2>
          <p>
            Il Titolare si riserva il diritto di apportare modifiche alla presente
            privacy policy in qualunque momento. Gli Utenti saranno informati di
            eventuali modifiche tramite notifica nell applicazione.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
