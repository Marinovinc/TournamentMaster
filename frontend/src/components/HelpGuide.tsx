/**
 * =============================================================================
 * HELP GUIDE COMPONENT
 * =============================================================================
 * Componente riutilizzabile per mostrare guide contestuali per ogni pagina
 * =============================================================================
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HelpCircle, X } from "lucide-react";

// Definizione delle guide per ogni pagina
export const PAGE_GUIDES: Record<string, {
  title: string;
  description: string;
  sections: Array<{
    title: string;
    content: string;
    icon?: string;
  }>;
  tips?: string[];
}> = {
  // HOME PAGE
  home: {
    title: "Benvenuto in TournamentMaster",
    description: "La piattaforma completa per la gestione di tornei di pesca sportiva.",
    sections: [
      {
        title: "Inizia Subito",
        content: "Registrati o accedi per partecipare ai tornei. Se sei un organizzatore, potrai creare e gestire i tuoi eventi.",
        icon: "rocket"
      },
      {
        title: "Esplora i Tornei",
        content: "Sfoglia i tornei disponibili, visualizza i dettagli e iscriviti a quelli che ti interessano.",
        icon: "search"
      },
      {
        title: "Discipline Supportate",
        content: "Big Game, Drifting, Traina Costiera, Bolentino, Eging, Vertical Jigging, Shore e Social.",
        icon: "fish"
      }
    ],
    tips: [
      "Usa il menu di navigazione per esplorare le diverse sezioni",
      "Controlla regolarmente i tornei in evidenza nella home page"
    ]
  },

  // LOGIN PAGE
  login: {
    title: "Accesso alla Piattaforma",
    description: "Inserisci le tue credenziali per accedere al tuo account.",
    sections: [
      {
        title: "Credenziali",
        content: "Usa l'email e la password con cui ti sei registrato. Le credenziali sono case-sensitive.",
        icon: "key"
      },
      {
        title: "Password Dimenticata?",
        content: "Contatta l'amministratore per reimpostare la password se l'hai dimenticata.",
        icon: "lock"
      },
      {
        title: "Nuovo Utente?",
        content: "Se non hai un account, clicca su 'Registrati' per crearne uno nuovo.",
        icon: "user-plus"
      }
    ],
    tips: [
      "Mantieni le tue credenziali al sicuro",
      "Effettua il logout quando usi dispositivi condivisi"
    ]
  },

  // REGISTER PAGE
  register: {
    title: "Registrazione Nuovo Utente",
    description: "Crea il tuo account per partecipare ai tornei di pesca.",
    sections: [
      {
        title: "Dati Obbligatori",
        content: "Nome, cognome, email e password sono campi obbligatori per la registrazione.",
        icon: "user"
      },
      {
        title: "Numero FIPSAS",
        content: "Se sei un pescatore tesserato FIPSAS, inserisci il tuo numero di tessera per la validazione.",
        icon: "id-card"
      },
      {
        title: "Password Sicura",
        content: "La password deve essere di almeno 8 caratteri. Consigliamo di usare lettere, numeri e simboli.",
        icon: "shield"
      }
    ],
    tips: [
      "Usa un'email valida: riceverai notifiche sui tornei",
      "Completa il profilo per aumentare la visibilita'"
    ]
  },

  // DASHBOARD PARTECIPANTE
  dashboard: {
    title: "Dashboard Partecipante",
    description: "Il tuo pannello personale per gestire iscrizioni e catture.",
    sections: [
      {
        title: "I Miei Tornei",
        content: "Visualizza tutti i tornei a cui sei iscritto, con date, stato e dettagli.",
        icon: "trophy"
      },
      {
        title: "Le Mie Catture",
        content: "Registra le catture durante i tornei attivi. Carica foto e inserisci peso e specie.",
        icon: "fish"
      },
      {
        title: "Classifica",
        content: "Controlla la tua posizione nelle classifiche dei tornei in corso.",
        icon: "bar-chart"
      },
      {
        title: "Statistiche",
        content: "Visualizza le tue statistiche personali: tornei partecipati, catture totali, punti accumulati.",
        icon: "chart-line"
      }
    ],
    tips: [
      "Registra le catture il prima possibile per evitare dimenticanze",
      "Controlla sempre le regole specifiche di ogni torneo"
    ]
  },

  // DASHBOARD ADMIN
  admin: {
    title: "Pannello Amministrazione",
    description: "Gestisci tornei, utenti e monitora le statistiche della piattaforma.",
    sections: [
      {
        title: "Gestione Tornei",
        content: "Crea nuovi tornei, modifica quelli esistenti e gestisci il ciclo di vita: Bozza -> Pubblicato -> Iscrizioni -> In Corso -> Completato.",
        icon: "trophy"
      },
      {
        title: "Ciclo di Vita Torneo",
        content: "BOZZA: torneo in preparazione. PUBBLICATO: visibile ma iscrizioni chiuse. ISCRIZIONI APERTE: gli utenti possono iscriversi. IN CORSO: torneo attivo. COMPLETATO: torneo terminato.",
        icon: "refresh-cw"
      },
      {
        title: "Campi Obbligatori Torneo",
        content: "Nome, disciplina, date inizio/fine, date iscrizione apertura/chiusura, location. Partecipanti max e quota sono opzionali ma consigliati.",
        icon: "list"
      },
      {
        title: "Azioni Rapide",
        content: "Dal menu a 3 puntini di ogni torneo puoi: Visualizzare, Modificare, Cambiare stato, Eliminare.",
        icon: "more-horizontal"
      },
      {
        title: "Statistiche",
        content: "Monitora tornei attivi, utenti registrati, catture totali e ricavi mensili.",
        icon: "bar-chart"
      }
    ],
    tips: [
      "Pubblica i tornei con anticipo per permettere le iscrizioni",
      "Verifica sempre i dati prima di cambiare stato",
      "Controlla le catture da validare regolarmente"
    ]
  },

  // DASHBOARD GIUDICE
  judge: {
    title: "Pannello Giudice di Gara",
    description: "Valida le catture e gestisci le operazioni di gara.",
    sections: [
      {
        title: "Catture da Validare",
        content: "Esamina le catture registrate dai partecipanti. Verifica foto, peso e specie dichiarati.",
        icon: "check-circle"
      },
      {
        title: "Approvazione/Rifiuto",
        content: "Approva le catture conformi al regolamento. Rifiuta quelle non valide indicando la motivazione.",
        icon: "thumbs-up"
      },
      {
        title: "Classifica Live",
        content: "Monitora la classifica in tempo reale durante lo svolgimento del torneo.",
        icon: "list-ordered"
      },
      {
        title: "Segnalazioni",
        content: "Gestisci eventuali segnalazioni o contestazioni dei partecipanti.",
        icon: "flag"
      }
    ],
    tips: [
      "Valida le catture in ordine cronologico",
      "In caso di dubbio, contatta l'organizzatore",
      "Documenta sempre le motivazioni dei rifiuti"
    ]
  },

  // LISTA TORNEI
  tournaments: {
    title: "Elenco Tornei",
    description: "Esplora tutti i tornei disponibili sulla piattaforma.",
    sections: [
      {
        title: "Filtri",
        content: "Usa i filtri per cercare tornei per disciplina, data, stato o localita'.",
        icon: "filter"
      },
      {
        title: "Iscrizione",
        content: "Clicca su un torneo per visualizzare i dettagli e procedere con l'iscrizione se le iscrizioni sono aperte.",
        icon: "user-plus"
      },
      {
        title: "Stato Tornei",
        content: "I colori indicano lo stato: Verde = Aperto, Giallo = In corso, Grigio = Completato, Rosso = Annullato.",
        icon: "info"
      }
    ],
    tips: [
      "Iscriviti in anticipo: i posti sono limitati",
      "Leggi attentamente il regolamento prima di iscriverti"
    ]
  },

  // DETTAGLIO TORNEO
  tournamentDetail: {
    title: "Dettaglio Torneo",
    description: "Informazioni complete sul torneo selezionato.",
    sections: [
      {
        title: "Informazioni Generali",
        content: "Date, location, disciplina, quota iscrizione e numero massimo partecipanti.",
        icon: "info"
      },
      {
        title: "Regolamento",
        content: "Leggi attentamente le regole specifiche del torneo: specie valide, pesi minimi, zone di pesca.",
        icon: "book"
      },
      {
        title: "Partecipanti",
        content: "Visualizza l'elenco degli iscritti e verifica la disponibilita' di posti.",
        icon: "users"
      },
      {
        title: "Classifica",
        content: "Durante e dopo il torneo, consulta la classifica con punteggi e catture.",
        icon: "trophy"
      }
    ],
    tips: [
      "Salva la pagina nei preferiti per accedervi rapidamente",
      "Controlla le condizioni meteo prima del torneo"
    ]
  }
};

interface HelpGuideProps {
  pageKey: keyof typeof PAGE_GUIDES;
  position?: "fixed" | "inline";
}

export function HelpGuide({ pageKey, position = "fixed" }: HelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const guide = PAGE_GUIDES[pageKey];

  if (!guide) return null;

  const buttonClasses = position === "fixed"
    ? "fixed bottom-6 right-6 z-50 rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90"
    : "rounded-full h-10 w-10";

  return (
    <>
      <Button
        variant={position === "fixed" ? "default" : "outline"}
        size="icon"
        className={buttonClasses}
        onClick={() => setIsOpen(true)}
        title="Apri guida"
      >
        <HelpCircle className={position === "fixed" ? "h-6 w-6" : "h-5 w-5"} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              {guide.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {guide.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Sezioni */}
            {guide.sections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {section.title}
                </h3>
                <p className="text-muted-foreground">{section.content}</p>
              </div>
            ))}

            {/* Tips */}
            {guide.tips && guide.tips.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="text-yellow-500">💡</span>
                  Suggerimenti
                </h3>
                <ul className="space-y-2">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            Premi <kbd className="px-2 py-1 bg-muted rounded">ESC</kbd> o clicca fuori per chiudere
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HelpGuide;
