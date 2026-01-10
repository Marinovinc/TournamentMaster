/**
 * =============================================================================
 * HELP GUIDE COMPONENT
 * =============================================================================
 * Componente riutilizzabile per mostrare guide contestuali per ogni pagina
 * Supporta contenuti differenziati per utenti normali e amministratori
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
import { HelpCircle, X, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Tipo per indicare a chi e' destinata la sezione
type Audience = "user" | "admin" | "both";

// Definizione delle guide per ogni pagina
export const PAGE_GUIDES: Record<string, {
  title: string;
  description: string;
  sections: Array<{
    title: string;
    content: string;
    icon?: string;
    audience?: Audience; // "user" | "admin" | "both" (default: "both")
  }>;
  tips?: Array<{
    text: string;
    audience?: Audience;
  }>;
}> = {
  // ============================================================================
  // PAGINE PUBBLICHE
  // ============================================================================

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
      { text: "Usa il menu di navigazione per esplorare le diverse sezioni" },
      { text: "Controlla regolarmente i tornei in evidenza nella home page" }
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
      { text: "Mantieni le tue credenziali al sicuro" },
      { text: "Effettua il logout quando usi dispositivi condivisi" }
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
      { text: "Usa un'email valida: riceverai notifiche sui tornei" },
      { text: "Completa il profilo per aumentare la visibilita'" }
    ]
  },

  // LISTA TORNEI (pubblico)
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
        icon: "user-plus",
        audience: "user"
      },
      {
        title: "Stato Tornei",
        content: "I colori indicano lo stato: Verde = Aperto, Giallo = In corso, Grigio = Completato, Rosso = Annullato.",
        icon: "info"
      },
      {
        title: "Gestione Tornei",
        content: "Come amministratore puoi creare nuovi tornei e modificare quelli esistenti direttamente da questa pagina.",
        icon: "settings",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Iscriviti in anticipo: i posti sono limitati", audience: "user" },
      { text: "Leggi attentamente il regolamento prima di iscriverti", audience: "user" },
      { text: "Pubblica i tornei con anticipo per massimizzare le iscrizioni", audience: "admin" }
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
      },
      {
        title: "Modifica Torneo",
        content: "Come amministratore puoi modificare le informazioni del torneo, gestire le iscrizioni e cambiare lo stato.",
        icon: "edit",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Salva la pagina nei preferiti per accedervi rapidamente", audience: "user" },
      { text: "Controlla le condizioni meteo prima del torneo" },
      { text: "Verifica che tutti i dati siano corretti prima di aprire le iscrizioni", audience: "admin" }
    ]
  },

  // PAGINA ASSOCIAZIONE
  association: {
    title: "Pagina Associazione",
    description: "Informazioni sulla tua associazione di pesca sportiva.",
    sections: [
      {
        title: "Informazioni Associazione",
        content: "Nome, descrizione, affiliazione FIPSAS e contatti dell'associazione.",
        icon: "building"
      },
      {
        title: "Tornei dell'Associazione",
        content: "Visualizza i tornei organizzati da questa associazione e iscriviti.",
        icon: "trophy",
        audience: "user"
      },
      {
        title: "Il Tuo Spazio Personale",
        content: "Se sei membro, accedi alla sezione con le tue barche, attrezzature e media.",
        icon: "user",
        audience: "user"
      },
      {
        title: "Contatti e Social",
        content: "Email, telefono, sito web e link ai social media dell'associazione.",
        icon: "mail"
      },
      {
        title: "Gestione Associazione",
        content: "Modifica il branding, gestisci i membri e configura le impostazioni dell'associazione.",
        icon: "settings",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Contatta l'associazione per informazioni su come diventare membro", audience: "user" },
      { text: "Mantieni aggiornati i contatti dell'associazione", audience: "admin" }
    ]
  },

  // FEATURES PAGE
  features: {
    title: "Funzionalita' della Piattaforma",
    description: "Scopri tutte le funzionalita' di TournamentMaster.",
    sections: [
      {
        title: "Gestione Tornei",
        content: "Crea, gestisci e monitora tornei di pesca sportiva con facilita'.",
        icon: "trophy"
      },
      {
        title: "Registrazione Catture",
        content: "Registra le catture con foto, verifica automatica e validazione giudici.",
        icon: "fish"
      },
      {
        title: "Classifiche Live",
        content: "Classifiche in tempo reale aggiornate automaticamente durante i tornei.",
        icon: "chart"
      },
      {
        title: "Multi-Associazione",
        content: "Ogni associazione ha il proprio spazio brandizzato con colori e logo personalizzati.",
        icon: "building"
      }
    ],
    tips: [
      { text: "Esplora tutte le funzionalita' registrandoti gratuitamente" }
    ]
  },

  // PRICING PAGE
  pricing: {
    title: "Piani e Prezzi",
    description: "Scegli il piano piu' adatto alla tua associazione.",
    sections: [
      {
        title: "Piano Gratuito",
        content: "Ideale per piccole associazioni: fino a 3 tornei all'anno e 50 membri.",
        icon: "gift"
      },
      {
        title: "Piano Pro",
        content: "Per associazioni in crescita: tornei illimitati, branding personalizzato e supporto prioritario.",
        icon: "star"
      },
      {
        title: "Piano Enterprise",
        content: "Per federazioni e grandi organizzazioni: funzionalita' avanzate e integrazioni custom.",
        icon: "building"
      }
    ],
    tips: [
      { text: "Contattaci per un preventivo personalizzato per grandi organizzazioni" }
    ]
  },

  // LEADERBOARD (pubblico)
  leaderboard: {
    title: "Classifiche",
    description: "Visualizza le classifiche dei tornei e i migliori pescatori.",
    sections: [
      {
        title: "Classifica Torneo",
        content: "Seleziona un torneo per vedere la classifica completa con punteggi e catture.",
        icon: "trophy"
      },
      {
        title: "Filtri",
        content: "Filtra per categoria, specie o periodo per trovare le classifiche desiderate.",
        icon: "filter"
      },
      {
        title: "Statistiche",
        content: "Visualizza statistiche dettagliate: peso totale, numero catture, media per partecipante.",
        icon: "chart"
      }
    ],
    tips: [
      { text: "Le classifiche si aggiornano automaticamente durante i tornei attivi" }
    ]
  },

  // ============================================================================
  // DASHBOARD UTENTE
  // ============================================================================

  // DASHBOARD PARTECIPANTE
  dashboard: {
    title: "Dashboard Personale",
    description: "Il tuo pannello personale per gestire iscrizioni, catture e attivita'.",
    sections: [
      {
        title: "I Miei Tornei",
        content: "Visualizza tutti i tornei a cui sei iscritto, con date, stato e dettagli.",
        icon: "trophy",
        audience: "user"
      },
      {
        title: "Le Mie Catture",
        content: "Registra le catture durante i tornei attivi. Carica foto e inserisci peso e specie.",
        icon: "fish",
        audience: "user"
      },
      {
        title: "Classifica",
        content: "Controlla la tua posizione nelle classifiche dei tornei in corso.",
        icon: "bar-chart",
        audience: "user"
      },
      {
        title: "Statistiche Personali",
        content: "Visualizza le tue statistiche: tornei partecipati, catture totali, punti accumulati.",
        icon: "chart-line",
        audience: "user"
      },
      {
        title: "Pannello Admin",
        content: "Accedi al pannello di amministrazione per gestire tornei, utenti e impostazioni.",
        icon: "settings",
        audience: "admin"
      },
      {
        title: "Catture da Validare",
        content: "Se sei giudice, visualizza le catture in attesa di validazione.",
        icon: "check",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Registra le catture il prima possibile per evitare dimenticanze", audience: "user" },
      { text: "Controlla sempre le regole specifiche di ogni torneo", audience: "user" },
      { text: "Controlla regolarmente le catture da validare", audience: "admin" }
    ]
  },

  // MESSAGGI
  messages: {
    title: "Sistema Messaggi",
    description: "Gestisci la comunicazione con altri utenti e l'organizzazione.",
    sections: [
      {
        title: "Posta in Arrivo",
        content: "Visualizza i messaggi ricevuti. I messaggi non letti sono evidenziati.",
        icon: "inbox",
        audience: "user"
      },
      {
        title: "Messaggi Inviati",
        content: "Storico dei messaggi che hai inviato ad altri utenti o all'organizzazione.",
        icon: "send",
        audience: "user"
      },
      {
        title: "Nuovo Messaggio",
        content: "Scrivi un nuovo messaggio selezionando il destinatario e impostando la priorita'.",
        icon: "edit"
      },
      {
        title: "Priorita' Messaggi",
        content: "I messaggi possono essere: Normale (grigio), Alta (arancione), Urgente (rosso).",
        icon: "flag"
      },
      {
        title: "Messaggi di Sistema",
        content: "Come amministratore puoi inviare messaggi broadcast a tutti gli utenti o a gruppi specifici.",
        icon: "megaphone",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Controlla regolarmente i messaggi per non perdere comunicazioni importanti", audience: "user" },
      { text: "Usa la priorita' 'Urgente' solo per comunicazioni critiche", audience: "admin" }
    ]
  },

  // IMPOSTAZIONI
  settings: {
    title: "Impostazioni Account",
    description: "Gestisci il tuo profilo e le preferenze dell'account.",
    sections: [
      {
        title: "Profilo Personale",
        content: "Modifica nome, cognome, foto profilo e informazioni di contatto.",
        icon: "user"
      },
      {
        title: "Sicurezza",
        content: "Cambia la password e gestisci le impostazioni di sicurezza del tuo account.",
        icon: "shield"
      },
      {
        title: "Notifiche",
        content: "Configura quali notifiche ricevere via email: tornei, catture, messaggi.",
        icon: "bell"
      },
      {
        title: "Aspetto",
        content: "Personalizza il tema dell'interfaccia: chiaro, scuro o automatico.",
        icon: "palette"
      }
    ],
    tips: [
      { text: "Mantieni aggiornata la tua email per ricevere notifiche importanti" },
      { text: "Usa una password forte e unica per proteggere il tuo account" }
    ]
  },

  // NUOVA CATTURA
  catchNew: {
    title: "Registra Nuova Cattura",
    description: "Guida passo-passo per registrare una cattura durante un torneo.",
    sections: [
      {
        title: "Step 1: Seleziona Torneo",
        content: "Scegli il torneo attivo in cui hai effettuato la cattura. Solo i tornei con stato 'In Corso' sono disponibili.",
        icon: "trophy",
        audience: "user"
      },
      {
        title: "Step 2: Carica Foto",
        content: "Scatta o carica una foto chiara della cattura. La foto deve mostrare il pesce per intero con un riferimento di scala.",
        icon: "camera",
        audience: "user"
      },
      {
        title: "Step 3: Inserisci Dettagli",
        content: "Indica la specie, il peso in kg e eventuali note. Il peso sara' verificato dai giudici.",
        icon: "edit",
        audience: "user"
      },
      {
        title: "Step 4: Conferma",
        content: "Rivedi tutti i dati e conferma la registrazione. Una volta confermata, la cattura andra' in validazione.",
        icon: "check",
        audience: "user"
      },
      {
        title: "Validazione Rapida",
        content: "Come giudice puoi validare le catture direttamente dalla lista senza passare per questa pagina.",
        icon: "zap",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Fotografa il pesce con un metro o oggetto di riferimento per facilitare la verifica", audience: "user" },
      { text: "Registra la cattura il prima possibile, entro il tempo limite del torneo", audience: "user" },
      { text: "In caso di dubbi sulla validita', contatta un giudice prima di registrare", audience: "user" }
    ]
  },

  // ============================================================================
  // DASHBOARD ADMIN
  // ============================================================================

  // PANNELLO ADMIN PRINCIPALE
  admin: {
    title: "Pannello Amministrazione",
    description: "Gestisci tornei, utenti e monitora le statistiche della piattaforma.",
    sections: [
      {
        title: "Gestione Tornei",
        content: "Crea nuovi tornei, modifica quelli esistenti e gestisci il ciclo di vita: Bozza -> Pubblicato -> Iscrizioni -> In Corso -> Completato.",
        icon: "trophy",
        audience: "admin"
      },
      {
        title: "Ciclo di Vita Torneo",
        content: "BOZZA: in preparazione. PUBBLICATO: visibile. ISCRIZIONI APERTE: utenti possono iscriversi. IN CORSO: torneo attivo. COMPLETATO: terminato.",
        icon: "refresh-cw",
        audience: "admin"
      },
      {
        title: "Campi Obbligatori",
        content: "Nome, disciplina, date inizio/fine, date iscrizione, location. Partecipanti max e quota sono opzionali ma consigliati.",
        icon: "list",
        audience: "admin"
      },
      {
        title: "Azioni Rapide",
        content: "Dal menu a 3 puntini: Visualizza, Modifica, Cambia stato, Elimina.",
        icon: "more-horizontal",
        audience: "admin"
      },
      {
        title: "Statistiche",
        content: "Monitora tornei attivi, utenti registrati, catture totali e ricavi.",
        icon: "bar-chart",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Pubblica i tornei con anticipo per permettere le iscrizioni", audience: "admin" },
      { text: "Verifica sempre i dati prima di cambiare stato", audience: "admin" },
      { text: "Controlla le catture da validare regolarmente", audience: "admin" }
    ]
  },

  // BRANDING
  branding: {
    title: "Personalizzazione Brand",
    description: "Configura l'aspetto visivo della tua associazione.",
    sections: [
      {
        title: "Logo Associazione",
        content: "Carica il logo dell'associazione. Formati supportati: PNG, JPG, SVG. Dimensione consigliata: 200x200px.",
        icon: "image",
        audience: "admin"
      },
      {
        title: "Banner",
        content: "Carica un'immagine banner per l'intestazione della pagina associazione. Dimensione: 1920x400px.",
        icon: "image",
        audience: "admin"
      },
      {
        title: "Colori",
        content: "Imposta colore primario e secondario. Questi colori verranno usati in tutta l'interfaccia dell'associazione.",
        icon: "palette",
        audience: "admin"
      },
      {
        title: "FIPSAS",
        content: "Inserisci il codice affiliazione FIPSAS e la regione per mostrare il badge ufficiale.",
        icon: "award",
        audience: "admin"
      },
      {
        title: "Social Media",
        content: "Aggiungi i link ai profili social: Facebook, Instagram, YouTube.",
        icon: "share",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Usa colori con buon contrasto per la leggibilita'", audience: "admin" },
      { text: "Il logo dovrebbe essere riconoscibile anche in piccole dimensioni", audience: "admin" }
    ]
  },

  // GESTIONE MEDIA ADMIN
  adminMedia: {
    title: "Gestione Media",
    description: "Gestisci immagini e video dell'associazione.",
    sections: [
      {
        title: "Gallery",
        content: "Carica foto e video nella gallery dell'associazione visibile a tutti i visitatori.",
        icon: "image",
        audience: "admin"
      },
      {
        title: "Formati Supportati",
        content: "Immagini: JPG, PNG, WebP. Video: MP4, MOV (max 100MB). I video vengono convertiti automaticamente.",
        icon: "file",
        audience: "admin"
      },
      {
        title: "Organizzazione",
        content: "Organizza i media in album o categorie per una migliore navigazione.",
        icon: "folder",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Ottimizza le immagini prima del caricamento per tempi di caricamento migliori", audience: "admin" },
      { text: "Usa didascalie descrittive per ogni media", audience: "admin" }
    ]
  },

  // GESTIONE PAGAMENTI
  adminPayments: {
    title: "Gestione Pagamenti",
    description: "Monitora e gestisci i pagamenti delle quote iscrizione.",
    sections: [
      {
        title: "Pagamenti in Attesa",
        content: "Visualizza le iscrizioni con pagamento pendente e invia solleciti.",
        icon: "clock",
        audience: "admin"
      },
      {
        title: "Conferma Pagamenti",
        content: "Conferma manualmente i pagamenti ricevuti via bonifico o contanti.",
        icon: "check",
        audience: "admin"
      },
      {
        title: "Storico",
        content: "Visualizza lo storico completo di tutti i pagamenti con filtri per data e torneo.",
        icon: "history",
        audience: "admin"
      },
      {
        title: "Report",
        content: "Genera report finanziari per torneo o periodo.",
        icon: "file-text",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Controlla regolarmente i pagamenti in attesa", audience: "admin" },
      { text: "Esporta i report per la contabilita' dell'associazione", audience: "admin" }
    ]
  },

  // GESTIONE UTENTI
  users: {
    title: "Gestione Utenti",
    description: "Amministra gli utenti registrati e i loro ruoli.",
    sections: [
      {
        title: "Lista Utenti",
        content: "Visualizza tutti gli utenti registrati con filtri per ruolo, stato e associazione.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Ruoli",
        content: "Assegna ruoli: MEMBER (base), JUDGE (giudice), ORGANIZER (organizzatore), ADMIN (amministratore).",
        icon: "shield",
        audience: "admin"
      },
      {
        title: "Dettaglio Utente",
        content: "Visualizza profilo completo, barche, attrezzature e storico partecipazioni.",
        icon: "user",
        audience: "admin"
      },
      {
        title: "Sospensione",
        content: "Sospendi temporaneamente o disabilita permanentemente account problematici.",
        icon: "ban",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Assegna i ruoli con attenzione: ogni ruolo ha permessi specifici", audience: "admin" },
      { text: "Verifica i dati FIPSAS degli utenti prima di approvare iscrizioni a tornei ufficiali", audience: "admin" }
    ]
  },

  // DETTAGLIO UTENTE (ADMIN VIEW)
  userDetail: {
    title: "Dettaglio Utente",
    description: "Visualizza il profilo completo di un membro.",
    sections: [
      {
        title: "Informazioni Personali",
        content: "Nome, email, telefono, data registrazione e ultimo accesso.",
        icon: "user",
        audience: "admin"
      },
      {
        title: "Barche",
        content: "Lista delle barche registrate dall'utente con dettagli tecnici.",
        icon: "anchor",
        audience: "admin"
      },
      {
        title: "Attrezzature",
        content: "Canne, mulinelli e altre attrezzature registrate.",
        icon: "tool",
        audience: "admin"
      },
      {
        title: "Gallery Media",
        content: "Foto e video caricati dall'utente.",
        icon: "image",
        audience: "admin"
      },
      {
        title: "Storico Tornei",
        content: "Tornei a cui l'utente ha partecipato con risultati e posizioni.",
        icon: "trophy",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Da questa pagina puoi visualizzare ma non modificare i dati dell'utente", audience: "admin" }
    ]
  },

  // SUPER ADMIN
  superAdmin: {
    title: "Super Admin Panel",
    description: "Gestione globale della piattaforma multi-tenant.",
    sections: [
      {
        title: "Gestione Tenant",
        content: "Crea, modifica e gestisci le associazioni (tenant) sulla piattaforma.",
        icon: "building",
        audience: "admin"
      },
      {
        title: "Statistiche Globali",
        content: "Visualizza metriche aggregate: utenti totali, tornei, catture su tutta la piattaforma.",
        icon: "chart",
        audience: "admin"
      },
      {
        title: "Configurazioni Sistema",
        content: "Impostazioni globali: limiti, feature flags, manutenzione programmata.",
        icon: "settings",
        audience: "admin"
      },
      {
        title: "Log Sistema",
        content: "Visualizza i log di sistema per debug e monitoraggio.",
        icon: "file-text",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Usa con cautela: le modifiche qui impattano TUTTA la piattaforma", audience: "admin" }
    ]
  },

  // ============================================================================
  // DASHBOARD GIUDICE
  // ============================================================================

  // PANNELLO GIUDICE
  judge: {
    title: "Pannello Giudice di Gara",
    description: "Valida le catture e gestisci le operazioni di gara.",
    sections: [
      {
        title: "Catture da Validare",
        content: "Esamina le catture registrate dai partecipanti. Verifica foto, peso e specie dichiarati.",
        icon: "check-circle",
        audience: "admin"
      },
      {
        title: "Approvazione/Rifiuto",
        content: "Approva le catture conformi al regolamento. Rifiuta quelle non valide indicando la motivazione.",
        icon: "thumbs-up",
        audience: "admin"
      },
      {
        title: "Classifica Live",
        content: "Monitora la classifica in tempo reale durante lo svolgimento del torneo.",
        icon: "list-ordered"
      },
      {
        title: "Segnalazioni",
        content: "Gestisci eventuali segnalazioni o contestazioni dei partecipanti.",
        icon: "flag",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Valida le catture in ordine cronologico", audience: "admin" },
      { text: "In caso di dubbio, contatta l'organizzatore", audience: "admin" },
      { text: "Documenta sempre le motivazioni dei rifiuti", audience: "admin" }
    ]
  },

  // ============================================================================
  // GESTIONE TORNEI
  // ============================================================================

  // GESTIONE BARCHE/TEAM
  teams: {
    title: "Gestione Barche e Team",
    description: "Crea e gestisci i team iscritti ai tornei con barche, capitani ed equipaggi.",
    sections: [
      {
        title: "Creazione Team",
        content: "Clicca '+ Nuovo Team' per creare un team. Campi obbligatori: Nome Team, Nome Barca, Torneo.",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "I Miei Team",
        content: "Visualizza i team di cui fai parte come capitano o membro equipaggio.",
        icon: "users",
        audience: "user"
      },
      {
        title: "Gestione Equipaggio",
        content: "Ogni team puo' avere un capitano e membri dell'equipaggio. Il capitano e' responsabile della barca.",
        icon: "users"
      },
      {
        title: "Assegnazione Ispettore",
        content: "L'ispettore puo' essere assegnato a qualsiasi torneo. Per tornei multi-societa' deve provenire da un club diverso.",
        icon: "shield",
        audience: "admin"
      },
      {
        title: "Livelli Torneo",
        content: "SOCIALE: interno al club. PROVINCIALE/REGIONALE: piu' societa'. NAZIONALE/INTERNAZIONALE: massimo livello.",
        icon: "trophy"
      }
    ],
    tips: [
      { text: "Assegna un numero barca univoco per identificare facilmente i team", audience: "admin" },
      { text: "Verifica che l'ispettore sia di un club diverso per tornei multi-societa'", audience: "admin" },
      { text: "Contatta l'organizzatore se vuoi modificare il tuo team", audience: "user" }
    ]
  },

  // STRIKE LIVE
  strikes: {
    title: "Strike Live - Monitoraggio Catture",
    description: "Registra e monitora gli strike in tempo reale durante i tornei attivi.",
    sections: [
      {
        title: "Cos'e' uno Strike?",
        content: "Uno strike e' il momento in cui un pesce abbocca. Risultati: CATCH (cattura), LOST (perso), RELEASED (rilasciato).",
        icon: "zap"
      },
      {
        title: "Registrazione Strike",
        content: "Seleziona torneo e team, inserisci numero canna (1-6), risultato e note.",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "Visualizzazione Live",
        content: "Segui gli strike in tempo reale di tutti i team partecipanti.",
        icon: "eye",
        audience: "user"
      },
      {
        title: "Griglia Team",
        content: "Ogni card mostra: nome team, numero barca, capitano, contatore strike.",
        icon: "grid"
      },
      {
        title: "Auto-Refresh",
        content: "La pagina si aggiorna ogni 30 secondi. Indicatore countdown visibile.",
        icon: "refresh"
      }
    ],
    tips: [
      { text: "Registra gli strike immediatamente per un tracking preciso", audience: "admin" },
      { text: "Badge: verde = CATCH, rosso = LOST, blu = RELEASED" },
      { text: "Gli strike sono immutabili: contatta un admin per correzioni", audience: "user" }
    ]
  },

  // MODIFICA TORNEO
  tournamentEdit: {
    title: "Modifica Torneo",
    description: "Configura tutti i parametri del torneo.",
    sections: [
      {
        title: "Informazioni Base",
        content: "Nome, descrizione, disciplina, location. Questi dati sono visibili nella pagina pubblica.",
        icon: "info",
        audience: "admin"
      },
      {
        title: "Date",
        content: "Data inizio/fine torneo e periodo apertura/chiusura iscrizioni. Attenzione alla sequenza logica.",
        icon: "calendar",
        audience: "admin"
      },
      {
        title: "Limiti e Quote",
        content: "Numero massimo partecipanti e quota iscrizione. Se non specificati, nessun limite.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Regolamento",
        content: "Carica o scrivi il regolamento del torneo. Sara' visibile ai partecipanti.",
        icon: "book",
        audience: "admin"
      },
      {
        title: "Immagini",
        content: "Carica banner e immagini per rendere il torneo piu' attraente.",
        icon: "image",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Verifica le date prima di pubblicare: errori possono confondere i partecipanti", audience: "admin" },
      { text: "Un buon regolamento previene contestazioni durante la gara", audience: "admin" }
    ]
  },

  // PARTECIPANTI TORNEO
  tournamentParticipants: {
    title: "Partecipanti Torneo",
    description: "Gestisci le iscrizioni al torneo.",
    sections: [
      {
        title: "Lista Iscritti",
        content: "Visualizza tutti i partecipanti con stato pagamento e data iscrizione.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Aggiungi Partecipante",
        content: "Iscrivi manualmente un partecipante (utile per iscrizioni offline).",
        icon: "user-plus",
        audience: "admin"
      },
      {
        title: "Stato Pagamento",
        content: "Conferma o annulla pagamenti. Filtra per stato: pagato, in attesa, annullato.",
        icon: "credit-card",
        audience: "admin"
      },
      {
        title: "Export",
        content: "Esporta la lista partecipanti in CSV o PDF per stampa o archivio.",
        icon: "download",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Controlla i pagamenti prima dell'inizio del torneo", audience: "admin" },
      { text: "Mantieni una copia offline della lista per emergenze", audience: "admin" }
    ]
  },

  // ZONE TORNEO
  tournamentZones: {
    title: "Zone di Pesca",
    description: "Definisci le zone valide per il torneo.",
    sections: [
      {
        title: "Mappa Zone",
        content: "Visualizza e modifica le zone di pesca consentite sulla mappa.",
        icon: "map",
        audience: "admin"
      },
      {
        title: "Crea Zona",
        content: "Disegna una nuova zona sulla mappa o inserisci coordinate GPS.",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "Regole Zone",
        content: "Ogni zona puo' avere regole specifiche: specie permesse, orari, metodi.",
        icon: "book",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Definisci zone chiare per evitare contestazioni", audience: "admin" },
      { text: "Considera correnti e fondali nella definizione delle zone", audience: "admin" }
    ]
  },

  // GIUDICI TORNEO
  tournamentJudges: {
    title: "Giudici di Gara",
    description: "Assegna i giudici al torneo.",
    sections: [
      {
        title: "Lista Giudici",
        content: "Visualizza i giudici assegnati al torneo con i rispettivi ruoli.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Assegna Giudice",
        content: "Seleziona un utente con ruolo JUDGE e assegnalo al torneo.",
        icon: "user-plus",
        audience: "admin"
      },
      {
        title: "Ruoli Giudice",
        content: "Giudice Capo: supervisione generale. Giudice: validazione catture. Ispettore: controllo a bordo.",
        icon: "shield",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Assicurati di avere abbastanza giudici per il numero di team", audience: "admin" },
      { text: "Comunica ai giudici le regole specifiche del torneo", audience: "admin" }
    ]
  },

  // PAGAMENTI TORNEO
  tournamentPayments: {
    title: "Pagamenti Torneo",
    description: "Gestisci i pagamenti delle quote iscrizione.",
    sections: [
      {
        title: "Riepilogo",
        content: "Totale incassato, pagamenti in attesa, quota media per partecipante.",
        icon: "chart",
        audience: "admin"
      },
      {
        title: "Conferma Pagamento",
        content: "Segna come pagato quando ricevi bonifico o contanti.",
        icon: "check",
        audience: "admin"
      },
      {
        title: "Solleciti",
        content: "Invia promemoria automatici ai partecipanti con pagamento in attesa.",
        icon: "mail",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Imposta una data limite per i pagamenti", audience: "admin" },
      { text: "Conserva le ricevute per la contabilita'", audience: "admin" }
    ]
  },

  // IMPOSTAZIONI TORNEO
  tournamentSettings: {
    title: "Impostazioni Torneo",
    description: "Configurazioni avanzate del torneo.",
    sections: [
      {
        title: "Regole Punteggio",
        content: "Configura come vengono calcolati i punti: per peso, per numero catture, bonus specie.",
        icon: "calculator",
        audience: "admin"
      },
      {
        title: "Specie Valide",
        content: "Definisci quali specie sono valide per il torneo e eventuali pesi minimi.",
        icon: "fish",
        audience: "admin"
      },
      {
        title: "Notifiche",
        content: "Configura notifiche automatiche per i partecipanti: promemoria, aggiornamenti classifica.",
        icon: "bell",
        audience: "admin"
      },
      {
        title: "Visibilita'",
        content: "Torneo pubblico (visibile a tutti) o privato (solo su invito).",
        icon: "eye",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Definisci le regole punteggio PRIMA di aprire le iscrizioni", audience: "admin" },
      { text: "Comunica chiaramente le specie valide nel regolamento", audience: "admin" }
    ]
  },

  // TEAM TORNEO
  tournamentTeams: {
    title: "Team del Torneo",
    description: "Gestisci i team iscritti a questo torneo specifico.",
    sections: [
      {
        title: "Team Iscritti",
        content: "Lista di tutti i team con barca, capitano e membri equipaggio.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Numero Barca",
        content: "Assegna numeri barca unici per l'identificazione durante la gara.",
        icon: "hash",
        audience: "admin"
      },
      {
        title: "Verifica Equipaggio",
        content: "Controlla che tutti i membri siano regolarmente iscritti e con tessera valida.",
        icon: "check",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Stampa la lista team con numeri barca per i giudici", audience: "admin" }
    ]
  },

  // ISCRIZIONE TORNEO
  tournamentRegister: {
    title: "Iscrizione al Torneo",
    description: "Completa la tua iscrizione al torneo.",
    sections: [
      {
        title: "Verifica Requisiti",
        content: "Controlla di avere tutti i requisiti: tessera valida, attrezzatura conforme, barca registrata.",
        icon: "check",
        audience: "user"
      },
      {
        title: "Selezione Categoria",
        content: "Se il torneo ha piu' categorie, seleziona quella appropriata.",
        icon: "list",
        audience: "user"
      },
      {
        title: "Pagamento",
        content: "Paga la quota iscrizione online o segui le istruzioni per bonifico/contanti.",
        icon: "credit-card",
        audience: "user"
      },
      {
        title: "Conferma",
        content: "Riceverai email di conferma. L'iscrizione e' valida dopo conferma pagamento.",
        icon: "mail",
        audience: "user"
      }
    ],
    tips: [
      { text: "Iscriviti in anticipo: i posti sono limitati", audience: "user" },
      { text: "Conserva la ricevuta di pagamento", audience: "user" }
    ]
  },

  // CLASSIFICA DETTAGLIO
  leaderboardDetail: {
    title: "Classifica Dettagliata",
    description: "Visualizza la classifica completa del torneo.",
    sections: [
      {
        title: "Classifica Generale",
        content: "Posizione, team/partecipante, punteggio totale, numero catture.",
        icon: "trophy"
      },
      {
        title: "Dettaglio Catture",
        content: "Clicca su un partecipante per vedere tutte le sue catture con foto e pesi.",
        icon: "fish"
      },
      {
        title: "Filtri",
        content: "Filtra per categoria, giornata o tipo di classifica (peso, numero, punti).",
        icon: "filter"
      },
      {
        title: "Export",
        content: "Scarica la classifica in PDF per stampa o archivio ufficiale.",
        icon: "download",
        audience: "admin"
      }
    ],
    tips: [
      { text: "La classifica si aggiorna in tempo reale durante il torneo" },
      { text: "Segnala eventuali errori all'organizzazione", audience: "user" }
    ]
  },

  // REPORT
  reports: {
    title: "Report e Statistiche",
    description: "Genera report dettagliati sull'attivita'.",
    sections: [
      {
        title: "Report Tornei",
        content: "Statistiche per torneo: partecipanti, catture, incassi, vincitori.",
        icon: "trophy",
        audience: "admin"
      },
      {
        title: "Report Utenti",
        content: "Analisi utenti: nuove registrazioni, attivita', retention.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Report Finanziari",
        content: "Riepilogo entrate: quote iscrizione, sponsorizzazioni, per periodo.",
        icon: "dollar",
        audience: "admin"
      },
      {
        title: "Export",
        content: "Esporta report in CSV, Excel o PDF.",
        icon: "download",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Genera report mensili per monitorare l'andamento", audience: "admin" },
      { text: "Usa i report per pianificare i prossimi tornei", audience: "admin" }
    ]
  }
};

interface HelpGuideProps {
  pageKey: keyof typeof PAGE_GUIDES;
  position?: "fixed" | "inline";
  isAdmin?: boolean; // Se true, mostra anche contenuti admin
}

export function HelpGuide({ pageKey, position = "fixed", isAdmin = false }: HelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const guide = PAGE_GUIDES[pageKey];

  if (!guide) return null;

  // Filtra sezioni in base al ruolo
  const filteredSections = guide.sections.filter(section => {
    const audience = section.audience || "both";
    if (audience === "both") return true;
    if (audience === "admin" && isAdmin) return true;
    if (audience === "user" && !isAdmin) return true;
    // Mostra sempre contenuti "user" anche agli admin (hanno bisogno di vedere tutto)
    if (audience === "user" && isAdmin) return true;
    return false;
  });

  // Filtra tips in base al ruolo
  const filteredTips = guide.tips?.filter(tip => {
    const audience = tip.audience || "both";
    if (audience === "both") return true;
    if (audience === "admin" && isAdmin) return true;
    if (audience === "user" && !isAdmin) return true;
    if (audience === "user" && isAdmin) return true;
    return false;
  });

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
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                {guide.title}
              </DialogTitle>
              {isAdmin && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <DialogDescription className="text-base">
              {guide.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Sezioni filtrate */}
            {filteredSections.map((section, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                section.audience === "admin" ? "bg-purple-50/50 border-purple-200" : "bg-muted/30"
              }`}>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className={`rounded-full w-6 h-6 flex items-center justify-center text-sm ${
                    section.audience === "admin"
                      ? "bg-purple-600 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  {section.title}
                  {section.audience === "admin" && (
                    <Badge variant="outline" className="text-xs ml-2 text-purple-600 border-purple-300">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </h3>
                <p className="text-muted-foreground">{section.content}</p>
              </div>
            ))}

            {/* Tips filtrati */}
            {filteredTips && filteredTips.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="text-yellow-500">💡</span>
                  Suggerimenti
                </h3>
                <ul className="space-y-2">
                  {filteredTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className={tip.audience === "admin" ? "text-purple-600 mt-1" : "text-primary mt-1"}>
                        {tip.audience === "admin" ? "◆" : "•"}
                      </span>
                      {tip.text}
                      {tip.audience === "admin" && (
                        <Badge variant="outline" className="text-xs ml-1 text-purple-600 border-purple-300">
                          Admin
                        </Badge>
                      )}
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
