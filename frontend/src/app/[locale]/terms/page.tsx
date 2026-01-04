/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/terms/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Terms of Service - Termini e condizioni di utilizzo
 * =============================================================================
 */

import Link from "next/link";
import { Home, FileText, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function TermsPage({
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
          <FileText className="h-8 w-8 text-primary" />
          Termini di Servizio
        </h1>
        <p className="text-muted-foreground">
          Ultimo aggiornamento: 2 Gennaio 2026
        </p>
      </div>

      <Card>
        <CardContent className="prose prose-slate max-w-none py-8">
          <h2>1. Accettazione dei Termini</h2>
          <p>
            Utilizzando TournamentMaster, l&apos;utente accetta di essere vincolato
            dai presenti Termini di Servizio. Se non si accettano questi termini,
            si prega di non utilizzare la piattaforma.
          </p>

          <h2>2. Descrizione del Servizio</h2>
          <p>
            TournamentMaster e una piattaforma digitale per la gestione di tornei
            di pesca sportiva. Il servizio include:
          </p>
          <ul>
            <li>Registrazione e gestione account utente</li>
            <li>Iscrizione a tornei di pesca</li>
            <li>Registrazione e validazione delle catture</li>
            <li>Classifiche in tempo reale</li>
            <li>Gestione tornei per organizzatori</li>
          </ul>

          <h2>3. Registrazione Account</h2>
          <p>
            Per utilizzare alcune funzionalita della piattaforma e necessario
            creare un account. L&apos;utente si impegna a:
          </p>
          <ul>
            <li>Fornire informazioni accurate e veritiere</li>
            <li>Mantenere la sicurezza delle proprie credenziali</li>
            <li>Notificare immediatamente eventuali accessi non autorizzati</li>
            <li>Non creare account multipli o falsi</li>
          </ul>

          <h2>4. Regole di Utilizzo</h2>
          <p>L&apos;utente si impegna a:</p>
          <ul>
            <li>Rispettare le regole dei tornei a cui partecipa</li>
            <li>Non manipolare classifiche o risultati</li>
            <li>Non caricare contenuti falsi o ingannevoli</li>
            <li>Non utilizzare software o metodi automatizzati non autorizzati</li>
            <li>Rispettare gli altri utenti e organizzatori</li>
          </ul>

          <h2>5. Validazione Catture</h2>
          <p>
            Le catture registrate sono soggette a validazione. TournamentMaster
            si riserva il diritto di:
          </p>
          <ul>
            <li>Richiedere prove aggiuntive (foto, video, testimoni)</li>
            <li>Invalidare catture ritenute non conformi</li>
            <li>Squalificare partecipanti in caso di irregolarita</li>
          </ul>
          <p>
            La validazione tramite GPS e un requisito per la maggior parte dei
            tornei. L&apos;utente deve trovarsi nell&apos;area designata del torneo
            al momento della registrazione della cattura.
          </p>

          <h2>6. Responsabilita dell&apos;Organizzatore</h2>
          <p>
            Gli organizzatori che utilizzano TournamentMaster sono responsabili di:
          </p>
          <ul>
            <li>Definire regolamenti chiari e completi</li>
            <li>Gestire le iscrizioni correttamente</li>
            <li>Risolvere dispute tra partecipanti</li>
            <li>Rispettare le normative locali sulla pesca</li>
          </ul>

          <h2>7. Proprieta Intellettuale</h2>
          <p>
            Tutti i contenuti della piattaforma, inclusi logo, grafica, testi e
            software, sono di proprieta di TournamentMaster o dei suoi licenziatari.
            E vietata la riproduzione non autorizzata.
          </p>

          <h2>8. Limitazione di Responsabilita</h2>
          <p>
            TournamentMaster non e responsabile per:
          </p>
          <ul>
            <li>Interruzioni temporanee del servizio</li>
            <li>Perdita di dati causata da fattori esterni</li>
            <li>Comportamenti scorretti di altri utenti</li>
            <li>Danni derivanti dall&apos;attivita di pesca</li>
          </ul>

          <h2>9. Sospensione e Terminazione</h2>
          <p>
            TournamentMaster si riserva il diritto di sospendere o terminare
            account che violano questi termini, senza preavviso in caso di
            violazioni gravi.
          </p>

          <h2>10. Modifiche ai Termini</h2>
          <p>
            Ci riserviamo il diritto di modificare questi termini in qualsiasi
            momento. Le modifiche saranno comunicate tramite la piattaforma.
            L&apos;uso continuato del servizio costituisce accettazione dei nuovi
            termini.
          </p>

          <h2>11. Legge Applicabile</h2>
          <p>
            Questi termini sono regolati dalla legge italiana. Per qualsiasi
            controversia sara competente il Foro di Napoli.
          </p>

          <h2>12. Contatti</h2>
          <p>
            Per domande sui presenti Termini di Servizio:
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:legal@tournamentmaster.it" className="text-primary hover:underline">
              legal@tournamentmaster.it
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
