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
        title: "Campo: Email",
        content: "Inserisci l'indirizzo email con cui ti sei registrato. Esempio: mario.rossi@email.com. Il campo e' case-insensitive (maiuscole/minuscole non importano).",
        icon: "mail"
      },
      {
        title: "Campo: Password",
        content: "Inserisci la tua password. ATTENZIONE: la password e' case-sensitive (maiuscole e minuscole sono diverse). Se la password contiene spazi, assicurati di inserirli.",
        icon: "key"
      },
      {
        title: "Pulsante: Accedi",
        content: "Dopo aver compilato email e password, clicca 'Accedi'. Se le credenziali sono corrette, verrai reindirizzato alla Dashboard.",
        icon: "log-in"
      },
      {
        title: "Link: Non hai un account?",
        content: "Se non sei ancora registrato, clicca su 'Registrati' in fondo al form per creare un nuovo account.",
        icon: "user-plus"
      }
    ],
    tips: [
      { text: "Se ricevi 'Credenziali non valide', verifica che l'email sia scritta correttamente" },
      { text: "In caso di password dimenticata, contatta l'amministratore della tua associazione" },
      { text: "Effettua sempre il logout quando usi computer pubblici o condivisi" }
    ]
  },

  // REGISTER PAGE
  register: {
    title: "Registrazione Nuovo Utente",
    description: "Crea il tuo account per partecipare ai tornei di pesca.",
    sections: [
      {
        title: "Campo: Nome *",
        content: "Inserisci il tuo nome di battesimo. Minimo 2 caratteri. Esempio: Mario. Questo nome apparira' nelle classifiche e nei profili.",
        icon: "user"
      },
      {
        title: "Campo: Cognome *",
        content: "Inserisci il tuo cognome. Minimo 2 caratteri. Esempio: Rossi. Verra' usato insieme al nome per identificarti.",
        icon: "user"
      },
      {
        title: "Campo: Email *",
        content: "Inserisci un indirizzo email valido e funzionante. Esempio: mario.rossi@gmail.com. Riceverai notifiche, conferme iscrizioni e comunicazioni importanti. L'email deve essere unica (non gia' registrata).",
        icon: "mail"
      },
      {
        title: "Campo: Password *",
        content: "Crea una password sicura. REQUISITI: minimo 8 caratteri, almeno una lettera maiuscola, una minuscola e un numero. Esempio: Pesca2024! Evita password ovvie come 'password123'.",
        icon: "key"
      },
      {
        title: "Campo: Conferma Password *",
        content: "Riscrivi la stessa password inserita sopra. Serve a verificare che non ci siano errori di battitura. Le due password devono coincidere esattamente.",
        icon: "check"
      },
      {
        title: "Campo: Numero FIPSAS (opzionale)",
        content: "Se sei tesserato FIPSAS, inserisci il numero della tua tessera (es: 123456). Permette di partecipare a tornei ufficiali che richiedono tessera valida. Se non ce l'hai, lascia vuoto.",
        icon: "id-card"
      },
      {
        title: "Pulsante: Registrati",
        content: "Dopo aver compilato tutti i campi obbligatori (*), clicca 'Registrati'. Riceverai un'email di conferma. Se vedi errori rossi, correggili prima di procedere.",
        icon: "user-plus"
      }
    ],
    tips: [
      { text: "Usa un'email che controlli regolarmente: riceverai notifiche importanti sui tornei" },
      { text: "Conserva la password in un luogo sicuro - ti servira' per ogni accesso" },
      { text: "Se hai gia' un account, clicca 'Accedi' invece di registrarti di nuovo" }
    ]
  },

  // LISTA TORNEI (pubblico)
  tournaments: {
    title: "Elenco Tornei",
    description: "Esplora tutti i tornei disponibili, filtra per caratteristiche e iscriviti agli eventi.",
    sections: [
      {
        title: "Card Torneo",
        content: "Ogni torneo mostra: nome, disciplina, date, location, posti disponibili, quota iscrizione, badge stato. Clicca sulla card per vedere i dettagli completi.",
        icon: "trophy"
      },
      {
        title: "Campo: Cerca",
        content: "Digita per cercare tornei. Cerca per: nome torneo, location, disciplina. La ricerca e' istantanea. Esempio: 'Ischia' mostra tutti i tornei a Ischia.",
        icon: "search"
      },
      {
        title: "Filtro: Disciplina",
        content: "Seleziona per vedere solo tornei di una disciplina: Big Game, Drifting, Traina Costiera, Bolentino, Eging, Vertical Jigging, Shore, Social. 'Tutte' mostra tutto.",
        icon: "fish"
      },
      {
        title: "Filtro: Stato",
        content: "Filtra per stato: Iscrizioni Aperte (puoi iscriverti), In Corso (gara attiva), Prossimamente (pubblicati ma iscrizioni non ancora aperte), Completati (terminati).",
        icon: "filter"
      },
      {
        title: "Filtro: Periodo",
        content: "Seleziona per vedere tornei in un periodo specifico: Questa Settimana, Questo Mese, Prossimi 3 Mesi, Quest'Anno. Utile per pianificare.",
        icon: "calendar"
      },
      {
        title: "Badge Stato",
        content: "Colori badge: VERDE = Iscrizioni Aperte (iscriviti ora!). GIALLO = In Corso (gara attiva). BLU = Prossimamente. GRIGIO = Completato. ROSSO = Annullato.",
        icon: "tag"
      },
      {
        title: "Posti Disponibili",
        content: "Mostra 'X/Y posti' dove X = iscritti, Y = max partecipanti. Se 'COMPLETO' = posti esauriti. Se nessun limite, mostra solo numero iscritti.",
        icon: "users"
      },
      {
        title: "Pulsante: Iscriviti",
        content: "Visibile solo se: sei loggato, iscrizioni aperte, posti disponibili, non sei gia' iscritto. Clicca per iniziare la procedura di iscrizione.",
        icon: "user-plus",
        audience: "user"
      },
      {
        title: "Ordinamento",
        content: "Default: tornei ordinati per data (piu' vicini prima). Clicca su 'Data', 'Nome' o 'Iscritti' per cambiare ordinamento. Freccia indica direzione.",
        icon: "sort"
      },
      {
        title: "Pulsante: + Nuovo Torneo",
        content: "Solo per admin. Clicca per creare un nuovo torneo. Si apre il form di creazione con tutti i campi.",
        icon: "plus",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Iscriviti in anticipo - i posti si esauriscono velocemente per tornei popolari", audience: "user" },
      { text: "Leggi SEMPRE il regolamento prima di iscriverti - ogni torneo ha regole specifiche", audience: "user" },
      { text: "Usa i filtri per trovare tornei adatti al tuo livello e disciplina preferita", audience: "user" },
      { text: "Pubblica i tornei almeno 30-45 giorni prima per massimizzare le iscrizioni", audience: "admin" }
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
    description: "Il tuo centro di controllo personale: tornei, catture, messaggi, statistiche e impostazioni.",
    sections: [
      {
        title: "Card: I Miei Tornei",
        content: "Mostra i tornei a cui sei iscritto. Per ogni torneo: nome, date, stato (Prossimo/In Corso/Completato), tua posizione in classifica. Clicca per vedere i dettagli.",
        icon: "trophy",
        audience: "user"
      },
      {
        title: "Badge: Torneo In Corso",
        content: "Se un torneo e' attivo, vedrai un badge verde 'IN CORSO'. Clicca per accedere rapidamente alla registrazione catture e alla classifica live.",
        icon: "zap",
        audience: "user"
      },
      {
        title: "Pulsante: Registra Cattura",
        content: "Visibile solo se hai tornei 'In Corso'. Clicca per aprire il form di registrazione cattura. Verrai guidato passo per passo.",
        icon: "fish",
        audience: "user"
      },
      {
        title: "Card: Le Mie Catture",
        content: "Storico delle tue catture. Per ogni cattura: foto miniatura, peso, specie, torneo, stato validazione (In Attesa/Approvata/Rifiutata). Clicca per dettagli.",
        icon: "fish",
        audience: "user"
      },
      {
        title: "Stato Catture",
        content: "Colori: GIALLO = In Attesa (giudice deve validare). VERDE = Approvata (conta in classifica). ROSSO = Rifiutata (vedi motivazione). Clicca sulla cattura per dettagli.",
        icon: "info",
        audience: "user"
      },
      {
        title: "Card: La Mia Posizione",
        content: "Per ogni torneo attivo/recente, vedi la tua posizione in classifica. Mostra: posizione attuale, punti totali, distanza dal primo. Aggiornamento ogni 5 minuti.",
        icon: "bar-chart",
        audience: "user"
      },
      {
        title: "Card: Statistiche",
        content: "I tuoi numeri: tornei totali partecipati, catture approvate totali, peso totale pescato, miglior piazzamento, media punti per torneo.",
        icon: "chart-line",
        audience: "user"
      },
      {
        title: "Card: Messaggi",
        content: "Ultimi messaggi ricevuti. Badge rosso indica non letti. Clicca 'Vedi Tutti' per aprire la sezione messaggi completa.",
        icon: "mail",
        audience: "user"
      },
      {
        title: "Menu: Navigazione",
        content: "Usa il menu laterale per accedere a: Tornei, Catture, Messaggi, Team, Barche, Attrezzature, Impostazioni. Su mobile: menu hamburger in alto.",
        icon: "menu",
        audience: "user"
      },
      {
        title: "Sezione: I Miei Team",
        content: "Lista dei team di cui fai parte. Per ogni team: nome, barca, torneo, tuo ruolo (Capitano/Membro). Clicca per vedere membri e dettagli.",
        icon: "users",
        audience: "user"
      },
      {
        title: "Sezione: Le Mie Barche",
        content: "Barche registrate a tuo nome. Per ogni barca: nome, tipo, lunghezza, porto. Clicca '+ Aggiungi' per registrare una nuova barca.",
        icon: "anchor",
        audience: "user"
      },
      {
        title: "Sezione: Le Mie Attrezzature",
        content: "Canne, mulinelli e altre attrezzature registrate. Utile per tornei che richiedono specifiche attrezzature. Clicca '+ Aggiungi' per registrare.",
        icon: "tool",
        audience: "user"
      },
      {
        title: "Card: Notifiche",
        content: "Avvisi importanti: nuovi tornei aperti, catture validate, messaggi urgenti, promemoria. Le notifiche non lette hanno sfondo colorato.",
        icon: "bell"
      },
      {
        title: "Pannello Admin (se Admin)",
        content: "Se sei admin, vedrai un link 'Pannello Admin' nel menu. Clicca per accedere alla gestione tornei, utenti e impostazioni associazione.",
        icon: "settings",
        audience: "admin"
      },
      {
        title: "Badge: Catture da Validare",
        content: "Se sei giudice: badge rosso indica catture in attesa di validazione. Clicca per accedere al pannello giudice.",
        icon: "check",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Registra le catture SUBITO - alcune regole richiedono registrazione entro 30 minuti", audience: "user" },
      { text: "Controlla lo stato delle catture - se rifiutata leggi la motivazione e contatta l'organizzatore", audience: "user" },
      { text: "Abilita le notifiche push per ricevere avvisi importanti anche quando non sei sulla piattaforma", audience: "user" },
      { text: "Completa il profilo con tessera FIPSAS per accedere a tutti i tornei", audience: "user" },
      { text: "Controlla regolarmente le catture da validare - i pescatori aspettano!", audience: "admin" }
    ]
  },

  // MESSAGGI
  messages: {
    title: "Sistema Messaggi",
    description: "Gestisci la comunicazione con altri utenti e l'organizzazione.",
    sections: [
      {
        title: "Tab: Ricevuti",
        content: "Clicca su 'Ricevuti' per vedere i messaggi in arrivo. I messaggi NON LETTI hanno sfondo colorato e testo in grassetto. Il badge rosso indica il numero di non letti. Clicca su un messaggio per leggerlo - verra' automaticamente segnato come letto.",
        icon: "inbox",
        audience: "user"
      },
      {
        title: "Tab: Inviati",
        content: "Clicca su 'Inviati' per vedere i messaggi che hai spedito. Puoi verificare se sono stati letti (icona verde 'Letto'). I messaggi broadcast mostrano 'Tutti gli iscritti' come destinatario.",
        icon: "send",
        audience: "user"
      },
      {
        title: "Campo: Cerca Messaggi",
        content: "Digita nel campo di ricerca per filtrare i messaggi. Cerca per: oggetto, contenuto, nome mittente. La ricerca e' istantanea mentre digiti. Cancella il testo per vedere tutti i messaggi.",
        icon: "search"
      },
      {
        title: "Pulsante: Nuovo Messaggio",
        content: "Clicca per aprire il form di composizione. Compila: Destinatario (seleziona dalla lista), Oggetto (breve descrizione), Messaggio (corpo del testo), Priorita' (opzionale).",
        icon: "edit"
      },
      {
        title: "Campo: Destinatario *",
        content: "OBBLIGATORIO. Seleziona dal menu a tendina l'utente a cui vuoi scrivere. Vedrai nome, cognome ed email. Se non trovi l'utente, potrebbe non essere iscritto alla tua associazione.",
        icon: "user"
      },
      {
        title: "Campo: Oggetto *",
        content: "OBBLIGATORIO. Inserisci un titolo breve e descrittivo. Max 100 caratteri. Esempio: 'Domanda sul torneo di Sabato' o 'Conferma iscrizione'. Evita oggetti vaghi come 'Info' o 'Ciao'.",
        icon: "type"
      },
      {
        title: "Campo: Messaggio *",
        content: "OBBLIGATORIO. Scrivi il contenuto del messaggio. Nessun limite di caratteri. Supporta testo semplice (no formattazione HTML). Vai a capo per separare i paragrafi.",
        icon: "align-left"
      },
      {
        title: "Campo: Priorita'",
        content: "OPZIONALE. Default: Normale. Opzioni: BASSA (grigio) per info non urgenti, NORMALE (blu) per comunicazioni standard, ALTA (arancione) per questioni importanti, URGENTE (rosso) SOLO per emergenze reali.",
        icon: "flag"
      },
      {
        title: "Pulsante: Broadcast (Solo Admin)",
        content: "Invia un messaggio a TUTTI gli iscritti dell'associazione contemporaneamente. Usa per: annunci tornei, comunicazioni importanti, avvisi generali. Il messaggio apparira' nella inbox di tutti con icona megafono.",
        icon: "megaphone",
        audience: "admin"
      },
      {
        title: "Azione: Rispondi",
        content: "Quando leggi un messaggio, clicca 'Rispondi' per rispondere. L'oggetto avra' automaticamente 'Re:' davanti. La conversazione viene collegata al messaggio originale.",
        icon: "reply"
      },
      {
        title: "Azione: Archivia/Elimina",
        content: "Archivia: sposta il messaggio nell'archivio (recuperabile). Elimina: rimuove definitivamente (solo messaggi inviati da te). I messaggi ricevuti possono solo essere archiviati.",
        icon: "archive"
      }
    ],
    tips: [
      { text: "Controlla i messaggi ogni giorno - potresti ricevere comunicazioni importanti sui tornei", audience: "user" },
      { text: "Rispondi sempre ai messaggi degli organizzatori entro 24-48 ore", audience: "user" },
      { text: "Usa Broadcast con parsimonia - troppi messaggi possono infastidire gli utenti", audience: "admin" },
      { text: "La priorita' URGENTE invia anche una notifica email immediata", audience: "admin" }
    ]
  },

  // IMPOSTAZIONI
  settings: {
    title: "Impostazioni Account",
    description: "Gestisci il tuo profilo, sicurezza, notifiche e preferenze visive.",
    sections: [
      {
        title: "TAB: Profilo",
        content: "Clicca sulla tab 'Profilo' per modificare i tuoi dati personali. Le modifiche vengono salvate automaticamente o cliccando 'Salva'.",
        icon: "user"
      },
      {
        title: "Campo: Nome *",
        content: "Il tuo nome di battesimo. Minimo 2 caratteri. Appare nelle classifiche e nel profilo pubblico. Esempio: Mario.",
        icon: "user"
      },
      {
        title: "Campo: Cognome *",
        content: "Il tuo cognome. Minimo 2 caratteri. Usato per identificarti ufficialmente. Esempio: Rossi.",
        icon: "user"
      },
      {
        title: "Campo: Email *",
        content: "Il tuo indirizzo email principale. NON modificabile direttamente - contatta l'admin per cambiarlo. Usato per login e notifiche.",
        icon: "mail"
      },
      {
        title: "Campo: Telefono",
        content: "OPZIONALE. Numero di cellulare. Formato consigliato: +39 333 1234567. Utile per contatti urgenti durante i tornei.",
        icon: "phone"
      },
      {
        title: "Campo: Foto Profilo",
        content: "Clicca sull'avatar per caricare una nuova foto. Formati: JPG, PNG. Dimensione max: 2MB. La foto appare nelle classifiche e nei commenti.",
        icon: "image"
      },
      {
        title: "Campo: Numero FIPSAS",
        content: "OPZIONALE. Se sei tesserato FIPSAS, inserisci il numero tessera (6-10 cifre). Necessario per tornei ufficiali. Esempio: 123456.",
        icon: "id-card"
      },
      {
        title: "TAB: Sicurezza",
        content: "Clicca sulla tab 'Sicurezza' per cambiare la password. Consigliamo di cambiarla ogni 6 mesi.",
        icon: "shield"
      },
      {
        title: "Campo: Password Attuale *",
        content: "Inserisci la tua password corrente per confermare l'identita'. Se non la ricordi, contatta l'amministratore.",
        icon: "key"
      },
      {
        title: "Campo: Nuova Password *",
        content: "Crea una nuova password. REQUISITI: minimo 8 caratteri, almeno 1 maiuscola, 1 minuscola, 1 numero. Evita date di nascita o nomi comuni.",
        icon: "key"
      },
      {
        title: "Campo: Conferma Nuova Password *",
        content: "Riscrivi la nuova password. Deve coincidere esattamente con il campo precedente. Verifica che non ci siano spazi extra.",
        icon: "check"
      },
      {
        title: "TAB: Notifiche",
        content: "Clicca sulla tab 'Notifiche' per configurare quali comunicazioni ricevere via email.",
        icon: "bell"
      },
      {
        title: "Toggle: Notifiche Tornei",
        content: "Attiva (ON) per ricevere email su: nuovi tornei, apertura iscrizioni, promemoria, risultati. Consigliato: ON.",
        icon: "trophy"
      },
      {
        title: "Toggle: Notifiche Catture",
        content: "Attiva (ON) per ricevere email quando: cattura validata, cattura rifiutata, posizione in classifica cambia.",
        icon: "fish"
      },
      {
        title: "Toggle: Notifiche Messaggi",
        content: "Attiva (ON) per ricevere email quando ricevi nuovi messaggi. Se OFF, vedrai i messaggi solo accedendo alla piattaforma.",
        icon: "mail"
      },
      {
        title: "Toggle: Notifiche Marketing",
        content: "Attiva (ON) per ricevere newsletter, promozioni e novita' della piattaforma. Puoi disattivarlo senza perdere notifiche importanti.",
        icon: "megaphone"
      },
      {
        title: "TAB: Aspetto",
        content: "Clicca sulla tab 'Aspetto' per personalizzare il tema visivo dell'interfaccia.",
        icon: "palette"
      },
      {
        title: "Opzione: Tema Chiaro",
        content: "Sfondo bianco con testo scuro. Ideale per uso diurno o ambienti luminosi. Consuma piu' batteria su OLED.",
        icon: "sun"
      },
      {
        title: "Opzione: Tema Scuro",
        content: "Sfondo scuro con testo chiaro. Ideale per uso notturno. Riduce affaticamento occhi e risparmia batteria su OLED.",
        icon: "moon"
      },
      {
        title: "Opzione: Automatico",
        content: "Il tema cambia automaticamente in base alle impostazioni del tuo dispositivo/browser. Scuro di notte, chiaro di giorno.",
        icon: "monitor"
      },
      {
        title: "Pulsante: Salva Modifiche",
        content: "Clicca per salvare tutte le modifiche. Vedrai un messaggio di conferma 'Impostazioni salvate'. Se esci senza salvare, le modifiche vengono perse.",
        icon: "save"
      }
    ],
    tips: [
      { text: "Verifica sempre che l'email sia corretta - e' il tuo unico modo per recuperare l'account" },
      { text: "Usa password diverse per ogni sito - non riutilizzare la stessa password" },
      { text: "Se non ricevi notifiche email, controlla la cartella Spam/Posta indesiderata" },
      { text: "Il tema Automatico e' il piu' comodo se usi dispositivi diversi" }
    ]
  },

  // NUOVA CATTURA
  catchNew: {
    title: "Registra Nuova Cattura",
    description: "Guida passo-passo per registrare una cattura durante un torneo attivo.",
    sections: [
      {
        title: "STEP 1 - Selezione Torneo",
        content: "Seleziona il torneo cliccando sulla card corrispondente. Vedrai solo i tornei con stato 'In Corso' a cui sei iscritto. La card selezionata avra' un bordo blu. Se hai un solo torneo attivo, sara' pre-selezionato automaticamente.",
        icon: "trophy",
        audience: "user"
      },
      {
        title: "STEP 2 - Scatto Foto",
        content: "Clicca 'Scatta Foto' per aprire la fotocamera o 'Carica Immagine' per selezionare una foto esistente. IMPORTANTE: la foto deve mostrare il pesce INTERO con un metro o oggetto di riferimento per verificare le dimensioni. Il GPS viene registrato automaticamente se disponibile.",
        icon: "camera",
        audience: "user"
      },
      {
        title: "Campo: Peso (kg) *",
        content: "OBBLIGATORIO. Inserisci il peso in chilogrammi con decimali. Formato: usa il punto per i decimali (es: 5.5 non 5,5). Range accettato: 0.1 - 999.9 kg. Se il torneo ha un peso minimo (es: 0.5 kg), catture sotto quel peso non saranno accettate.",
        icon: "scale",
        audience: "user"
      },
      {
        title: "Campo: Lunghezza (cm)",
        content: "OPZIONALE. Inserisci la lunghezza in centimetri. Formato: numero intero o con un decimale (es: 85 o 85.5). Misura dalla punta del muso alla biforcazione della coda. Utile per verifiche incrociate sul peso.",
        icon: "ruler",
        audience: "user"
      },
      {
        title: "Campo: Specie",
        content: "OPZIONALE ma consigliato. Seleziona la specie dal menu a tendina. Se la specie non e' in lista, lascia 'Non specificata'. Il giudice potra' correggerla in fase di validazione. Specie comuni: Tonno, Ricciola, Dentice, Orata, Spigola.",
        icon: "fish",
        audience: "user"
      },
      {
        title: "Campo: Note",
        content: "OPZIONALE. Aggiungi informazioni utili per il giudice: condizioni meteo, zona di cattura, esca usata, particolarita'. Max 500 caratteri. Esempio: 'Catturato a traina con rapala, zona Ponza Nord'.",
        icon: "edit",
        audience: "user"
      },
      {
        title: "STEP 4 - Conferma e Invio",
        content: "Rivedi TUTTI i dati nel riepilogo. Verifica che foto, peso e torneo siano corretti. Clicca 'Invia Cattura' per completare. ATTENZIONE: dopo l'invio NON potrai modificare i dati - la cattura andra' in coda di validazione.",
        icon: "check",
        audience: "user"
      },
      {
        title: "Validazione Rapida (Admin)",
        content: "Come giudice puoi validare le catture dalla sezione 'Validazione' nel menu. Clicca sulla cattura per vedere i dettagli e approva/rifiuta con motivazione.",
        icon: "zap",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Fotografa SEMPRE con un metro visibile accanto al pesce - catture senza riferimento potrebbero essere rifiutate", audience: "user" },
      { text: "Registra la cattura entro 30 minuti - alcune regole richiedono registrazione immediata", audience: "user" },
      { text: "Se il peso sembra anomalo rispetto alla foto, il giudice potrebbe chiedere verifiche", audience: "user" },
      { text: "Verifica la connessione internet prima di inviare - la foto deve essere caricata completamente", audience: "user" }
    ]
  },

  // ============================================================================
  // DASHBOARD ADMIN
  // ============================================================================

  // PANNELLO ADMIN PRINCIPALE
  admin: {
    title: "Pannello Amministrazione",
    description: "Centro di controllo per gestire tornei, utenti, catture e monitorare le statistiche dell'associazione.",
    sections: [
      {
        title: "Sezione: Dashboard",
        content: "Panoramica con metriche principali: tornei attivi, iscrizioni recenti, catture da validare, messaggi non letti. Clicca su una metrica per andare alla sezione corrispondente.",
        icon: "home",
        audience: "admin"
      },
      {
        title: "Pulsante: + Nuovo Torneo",
        content: "Clicca per creare un nuovo torneo. Si apre il form completo. Campi obbligatori: Nome, Disciplina, Date, Location. Puoi salvare come bozza o pubblicare subito.",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "Tabella Tornei",
        content: "Lista di tutti i tornei dell'associazione. Colonne: Nome, Disciplina, Date, Stato, Iscritti. Clicca sull'intestazione per ordinare. Usa la ricerca per filtrare.",
        icon: "table",
        audience: "admin"
      },
      {
        title: "Campo: Cerca Torneo",
        content: "Digita per filtrare la lista tornei. Cerca per: nome torneo, disciplina, location. La ricerca e' istantanea. Cancella per vedere tutti.",
        icon: "search",
        audience: "admin"
      },
      {
        title: "Filtro: Stato",
        content: "Filtra tornei per stato: Tutti, Bozza, Pubblicato, Iscrizioni Aperte, In Corso, Completato. Utile per gestire tornei in fasi specifiche.",
        icon: "filter",
        audience: "admin"
      },
      {
        title: "Ciclo di Vita Torneo",
        content: "Stati in ordine: BOZZA (in preparazione, non visibile) -> PUBBLICATO (visibile, iscrizioni chiuse) -> ISCRIZIONI APERTE (utenti possono iscriversi) -> IN CORSO (gara attiva) -> COMPLETATO (terminato, classifica finale).",
        icon: "refresh-cw",
        audience: "admin"
      },
      {
        title: "Menu Azioni (3 puntini)",
        content: "Clicca sui 3 puntini a destra di ogni torneo. Opzioni: Visualizza (pagina pubblica), Modifica (form completo), Cambia Stato, Team, Partecipanti, Catture, Elimina.",
        icon: "more-horizontal",
        audience: "admin"
      },
      {
        title: "Azione: Cambia Stato",
        content: "Modifica lo stato del torneo. ATTENZIONE: alcuni passaggi sono irreversibili. Da 'In Corso' a 'Completato' calcola la classifica finale. Richiede conferma.",
        icon: "toggle-right",
        audience: "admin"
      },
      {
        title: "Sezione: Utenti",
        content: "Gestione membri associazione. Vedi lista, modifica ruoli (Member/Judge/Admin), visualizza dettagli profilo, sospendi account. Usa filtri per cercare.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Sezione: Catture da Validare",
        content: "Elenco catture in attesa di validazione. Badge rosso indica il numero. Clicca per aprire il pannello giudice. Priorita': catture piu' vecchie prima.",
        icon: "fish",
        audience: "admin"
      },
      {
        title: "Card Statistiche",
        content: "Metriche in tempo reale: Tornei Attivi (in corso), Totale Iscrizioni (mese corrente), Catture Validate (mese), Ricavi Totali (se usi pagamenti). Clicca per dettagli.",
        icon: "bar-chart",
        audience: "admin"
      },
      {
        title: "Sezione: Branding",
        content: "Personalizza l'aspetto dell'associazione: logo, banner, colori primario/secondario, info FIPSAS, link social. Le modifiche sono visibili immediatamente.",
        icon: "palette",
        audience: "admin"
      },
      {
        title: "Sezione: Impostazioni",
        content: "Configurazioni avanzate: notifiche automatiche, limiti upload, regole default tornei, integrazione pagamenti, backup dati.",
        icon: "settings",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Controlla la dashboard ogni giorno - il badge rosso indica azioni urgenti", audience: "admin" },
      { text: "Pubblica i tornei almeno 30 giorni prima per massimizzare le iscrizioni", audience: "admin" },
      { text: "Prima di passare a 'In Corso', verifica che tutti i team siano pronti", audience: "admin" },
      { text: "Il passaggio a 'Completato' e' IRREVERSIBILE - verifica le catture prima", audience: "admin" },
      { text: "Assegna ruolo 'Judge' solo a persone fidate - possono validare catture", audience: "admin" }
    ]
  },

  // BRANDING
  branding: {
    title: "Personalizzazione Brand",
    description: "Configura l'aspetto visivo e le informazioni pubbliche della tua associazione.",
    sections: [
      {
        title: "Campo: Logo Associazione",
        content: "Clicca 'Carica Logo' per selezionare l'immagine. Formati: PNG, JPG, SVG (preferito). Dimensione: 200x200px minimo. Max: 2MB. Il logo appare nel menu, nelle card tornei e nel footer.",
        icon: "image",
        audience: "admin"
      },
      {
        title: "Campo: Banner",
        content: "Immagine di intestazione della pagina associazione. Dimensione consigliata: 1920x400px (rapporto 4.8:1). Formati: JPG, PNG. Max: 5MB. Verra' ridimensionata automaticamente per mobile.",
        icon: "image",
        audience: "admin"
      },
      {
        title: "Campo: Colore Primario",
        content: "Colore principale del brand. Clicca per aprire il color picker o inserisci codice HEX (es: #3B82F6). Usato per: pulsanti, link, accenti. Scegli un colore che rappresenti l'associazione.",
        icon: "palette",
        audience: "admin"
      },
      {
        title: "Campo: Colore Secondario",
        content: "Colore di supporto. Codice HEX (es: #10B981). Usato per: badge, sfondi secondari, hover. Deve contrastare bene con il primario. Evita colori troppo simili.",
        icon: "palette",
        audience: "admin"
      },
      {
        title: "Campo: Nome Associazione *",
        content: "OBBLIGATORIO. Nome ufficiale dell'associazione. Max 100 caratteri. Esempio: 'ASD Ischia Fishing Club'. Appare nell'header e nel footer di tutte le pagine.",
        icon: "building",
        audience: "admin"
      },
      {
        title: "Campo: Descrizione",
        content: "OPZIONALE. Descrizione breve dell'associazione. Max 500 caratteri. Appare nella pagina 'Chi Siamo'. Includi: storia, mission, attivita' principali.",
        icon: "align-left",
        audience: "admin"
      },
      {
        title: "Campo: Codice FIPSAS",
        content: "OPZIONALE. Codice affiliazione FIPSAS (6-10 caratteri). Se inserito, mostra il badge 'Affiliato FIPSAS' nella pagina associazione. Verifica il codice sul sito FIPSAS.",
        icon: "award",
        audience: "admin"
      },
      {
        title: "Campo: Regione FIPSAS",
        content: "OPZIONALE. Seleziona la regione di appartenenza dal menu. Richiesto se inserisci codice FIPSAS. Mostra il logo regionale nel badge.",
        icon: "map",
        audience: "admin"
      },
      {
        title: "Campo: Email Contatto",
        content: "Email pubblica dell'associazione. Formato: info@associazione.it. Appare nella pagina contatti e nel footer. Riceverai messaggi dai visitatori.",
        icon: "mail",
        audience: "admin"
      },
      {
        title: "Campo: Telefono",
        content: "OPZIONALE. Numero di telefono/cellulare pubblico. Formato: +39 333 1234567. Appare nella pagina contatti. Usa un numero dedicato all'associazione.",
        icon: "phone",
        audience: "admin"
      },
      {
        title: "Campo: Indirizzo",
        content: "OPZIONALE. Sede legale o operativa. Esempio: 'Via Roma 123, 80077 Ischia (NA)'. Appare nella pagina contatti e nel footer.",
        icon: "map-pin",
        audience: "admin"
      },
      {
        title: "Campo: Sito Web",
        content: "OPZIONALE. URL del sito web ufficiale (se diverso da TournamentMaster). Formato: https://www.associazione.it. Appare come link nella pagina contatti.",
        icon: "globe",
        audience: "admin"
      },
      {
        title: "Campo: Facebook",
        content: "OPZIONALE. URL della pagina Facebook. Formato completo: https://www.facebook.com/tuapagina. Mostra icona Facebook cliccabile nel footer.",
        icon: "facebook",
        audience: "admin"
      },
      {
        title: "Campo: Instagram",
        content: "OPZIONALE. URL del profilo Instagram. Formato: https://www.instagram.com/tuoprofilo. Mostra icona Instagram cliccabile nel footer.",
        icon: "instagram",
        audience: "admin"
      },
      {
        title: "Campo: YouTube",
        content: "OPZIONALE. URL del canale YouTube. Formato: https://www.youtube.com/@tuocanale. Mostra icona YouTube cliccabile nel footer.",
        icon: "youtube",
        audience: "admin"
      },
      {
        title: "Pulsante: Anteprima",
        content: "Clicca per vedere come apparira' la pagina pubblica con le modifiche. Si apre in nuova tab. Le modifiche NON sono salvate fino a che non clicchi Salva.",
        icon: "eye",
        audience: "admin"
      },
      {
        title: "Pulsante: Salva",
        content: "Salva tutte le modifiche. Le modifiche sono visibili IMMEDIATAMENTE sul sito pubblico. Riceverai conferma 'Branding aggiornato con successo'.",
        icon: "save",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Usa colori con buon contrasto (scuro su chiaro o viceversa) per la leggibilita'", audience: "admin" },
      { text: "Il logo deve essere riconoscibile anche a 32x32px - evita dettagli troppo piccoli", audience: "admin" },
      { text: "Banner: evita testo nell'immagine - potrebbe essere tagliato su mobile", audience: "admin" },
      { text: "Verifica il codice FIPSAS prima di inserirlo - un codice errato e' peggio di nessun codice", audience: "admin" },
      { text: "Tieni aggiornati i link social - link non funzionanti danno impressione negativa", audience: "admin" }
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
    description: "Amministra gli utenti registrati, assegna ruoli, verifica profili e gestisci permessi.",
    sections: [
      {
        title: "Tabella Utenti",
        content: "Lista di tutti gli utenti dell'associazione. Colonne: Nome, Email, Ruolo, Stato, Data Registrazione, Ultimo Accesso. Clicca sull'intestazione per ordinare.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Campo: Cerca Utente",
        content: "Digita per filtrare la lista. Cerca per: nome, cognome, email, numero FIPSAS. La ricerca e' istantanea mentre digiti. Case-insensitive.",
        icon: "search",
        audience: "admin"
      },
      {
        title: "Filtro: Ruolo",
        content: "Filtra per ruolo: Tutti, Member (utenti base), Judge (giudici), Organizer (organizzatori), Admin (amministratori). Utile per gestire gruppi specifici.",
        icon: "filter",
        audience: "admin"
      },
      {
        title: "Filtro: Stato",
        content: "Filtra per stato account: Tutti, Attivo (puo' accedere), Sospeso (bloccato temporaneamente), Disabilitato (bloccato permanentemente), In Attesa (email non verificata).",
        icon: "filter",
        audience: "admin"
      },
      {
        title: "Ruoli Disponibili",
        content: "MEMBER: utente base, puo' iscriversi e registrare catture. JUDGE: puo' validare catture. ORGANIZER: puo' creare/gestire tornei. ADMIN: accesso completo. Ogni ruolo include i permessi del precedente.",
        icon: "shield",
        audience: "admin"
      },
      {
        title: "Azione: Visualizza Profilo",
        content: "Clicca sull'icona occhio o sul nome utente. Vedi: dati personali, barche registrate, attrezzature, storico tornei, catture, statistiche.",
        icon: "eye",
        audience: "admin"
      },
      {
        title: "Azione: Modifica Ruolo",
        content: "Clicca sull'icona scudo. Seleziona il nuovo ruolo dal menu. ATTENZIONE: promuovere ad Admin da' accesso completo. Richiede conferma. L'utente riceve notifica.",
        icon: "shield",
        audience: "admin"
      },
      {
        title: "Azione: Sospendi Account",
        content: "Clicca sull'icona pausa. L'utente non potra' accedere fino a riattivazione. Motivi comuni: comportamento scorretto, verifica documenti pendente. Inserisci motivazione.",
        icon: "pause",
        audience: "admin"
      },
      {
        title: "Azione: Disabilita Account",
        content: "Clicca sull'icona X. Blocco PERMANENTE dell'account. L'utente non potra' piu' accedere ne' registrarsi con la stessa email. Usa solo per violazioni gravi. Richiede conferma.",
        icon: "ban",
        audience: "admin"
      },
      {
        title: "Azione: Riattiva Account",
        content: "Per utenti sospesi: clicca 'Riattiva'. L'utente potra' accedere nuovamente. Riceve email di notifica. Lo storico della sospensione rimane nel log.",
        icon: "play",
        audience: "admin"
      },
      {
        title: "Verifica FIPSAS",
        content: "Nella colonna FIPSAS: badge verde = verificato, giallo = da verificare, grigio = non inserito. Clicca per aprire dettagli e verificare sul sito FIPSAS.",
        icon: "check-circle",
        audience: "admin"
      },
      {
        title: "Export Lista",
        content: "Clicca 'Esporta' per scaricare la lista utenti. Formati: CSV, Excel. Include tutti i campi visibili. Utile per comunicazioni offline o backup.",
        icon: "download",
        audience: "admin"
      },
      {
        title: "Invita Utente",
        content: "Clicca '+ Invita' per inviare invito via email. Inserisci email e ruolo iniziale. L'utente riceve link per completare la registrazione.",
        icon: "mail",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Assegna ruolo JUDGE solo a persone esperte - validano catture ufficialmente", audience: "admin" },
      { text: "Verifica SEMPRE il numero FIPSAS prima di tornei ufficiali", audience: "admin" },
      { text: "Sospendi invece di disabilitare se pensi di riattivare - la disabilitazione e' permanente", audience: "admin" },
      { text: "Controlla 'Ultimo Accesso' per identificare account inattivi", audience: "admin" },
      { text: "Esporta la lista prima di eventi importanti come backup", audience: "admin" }
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
    description: "Valida le catture registrate dai partecipanti, monitora la classifica e gestisci le operazioni di gara.",
    sections: [
      {
        title: "Tab: In Attesa",
        content: "Mostra tutte le catture in attesa di validazione. Ordinate per data/ora di registrazione (le piu' vecchie prima). Il badge rosso indica il numero totale in coda.",
        icon: "clock",
        audience: "admin"
      },
      {
        title: "Tab: Validate",
        content: "Storico delle catture gia' validate (approvate o rifiutate). Utile per revisioni o in caso di contestazioni. Include data validazione e nome giudice.",
        icon: "check",
        audience: "admin"
      },
      {
        title: "Card Cattura",
        content: "Ogni cattura mostra: FOTO (clicca per ingrandire), Team/Partecipante, Peso dichiarato, Specie, Data/Ora registrazione, Note del pescatore.",
        icon: "fish",
        audience: "admin"
      },
      {
        title: "Verifica Foto",
        content: "Clicca sulla foto per aprirla a schermo intero. CONTROLLA: pesce intero visibile, metro di riferimento presente, foto nitida, data/ora metadata coerenti.",
        icon: "image",
        audience: "admin"
      },
      {
        title: "Campo: Peso Verificato",
        content: "Se il peso dichiarato sembra errato, puoi correggerlo. Inserisci il peso corretto in kg (es: 5.5). La modifica viene registrata con motivazione.",
        icon: "scale",
        audience: "admin"
      },
      {
        title: "Campo: Specie Verificata",
        content: "Correggi la specie se identificata erroneamente dal pescatore. Seleziona dal menu a tendina. Importante per tornei con specie specifiche.",
        icon: "fish",
        audience: "admin"
      },
      {
        title: "Pulsante: Approva",
        content: "Clicca per APPROVARE la cattura. La cattura viene aggiunta alla classifica. Azione IRREVERSIBILE senza intervento admin superiore. Verifica tutto prima di approvare.",
        icon: "check-circle",
        audience: "admin"
      },
      {
        title: "Pulsante: Rifiuta",
        content: "Clicca per RIFIUTARE la cattura. Si apre un form per inserire la MOTIVAZIONE (obbligatoria). Motivi comuni: foto non conforme, peso non verificabile, specie non valida, fuori zona.",
        icon: "x-circle",
        audience: "admin"
      },
      {
        title: "Campo: Motivazione Rifiuto *",
        content: "OBBLIGATORIO se rifiuti. Spiega chiaramente perche' la cattura non e' valida. Il pescatore ricevera' notifica con questa motivazione. Sii professionale e specifico.",
        icon: "edit",
        audience: "admin"
      },
      {
        title: "Pulsante: Richiedi Info",
        content: "Se hai dubbi, puoi richiedere informazioni aggiuntive al pescatore. La cattura rimane in sospeso. Il pescatore riceve notifica e puo' rispondere.",
        icon: "help-circle",
        audience: "admin"
      },
      {
        title: "Classifica Live",
        content: "Pannello laterale con classifica aggiornata in tempo reale. Mostra top 10 con punti totali. Si aggiorna automaticamente dopo ogni validazione.",
        icon: "trophy"
      },
      {
        title: "Filtro Torneo",
        content: "Se sei giudice di piu' tornei, usa il filtro per visualizzare le catture di un torneo specifico. Default: tutti i tornei assegnati.",
        icon: "filter",
        audience: "admin"
      },
      {
        title: "Storico Validazioni",
        content: "Nella tab 'Validate' puoi vedere tutte le tue validazioni. Include: data/ora, esito, motivazione (se rifiuto), eventuali correzioni peso/specie.",
        icon: "history",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Valida le catture in ordine cronologico - le piu' vecchie hanno priorita'", audience: "admin" },
      { text: "Se la foto non mostra chiaramente il metro, RIFIUTA con motivazione specifica", audience: "admin" },
      { text: "In caso di dubbio sulla specie, usa 'Richiedi Info' prima di rifiutare", audience: "admin" },
      { text: "Documenta SEMPRE le motivazioni dei rifiuti - servono in caso di contestazione", audience: "admin" },
      { text: "Controlla i metadata della foto (data/ora) se sospetti irregolarita'", audience: "admin" }
    ]
  },

  // ============================================================================
  // GESTIONE TORNEI
  // ============================================================================

  // GESTIONE BARCHE/TEAM
  teams: {
    title: "Gestione Barche e Team",
    description: "Crea e gestisci i team iscritti ai tornei con barche, capitani, equipaggi e ispettori.",
    sections: [
      {
        title: "Pulsante: + Nuovo Team",
        content: "Clicca per aprire il form di creazione team. REQUISITO: devi selezionare prima un torneo dalla lista. Il pulsante e' disabilitato se nessun torneo e' selezionato.",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "Campo: Torneo *",
        content: "OBBLIGATORIO. Seleziona dal menu a tendina il torneo per cui creare il team. Vedrai solo tornei con stato: Bozza, Pubblicato, Iscrizioni Aperte.",
        icon: "trophy",
        audience: "admin"
      },
      {
        title: "Campo: Nome Team *",
        content: "OBBLIGATORIO. Nome identificativo del team. Max 50 caratteri. Esempio: 'Squalo Bianco Team' o 'I Pescatori di Ponza'. Deve essere univoco nel torneo.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Campo: Nome Barca *",
        content: "OBBLIGATORIO. Nome della barca iscritta. Esempio: 'Blue Marlin' o 'Lady Luck'. Appare nelle classifiche e nella lista team.",
        icon: "anchor",
        audience: "admin"
      },
      {
        title: "Campo: Numero Barca",
        content: "OPZIONALE ma consigliato. Numero identificativo assegnato dall'organizzatore. Formato: numero intero (es: 1, 15, 42). Serve per identificazione rapida durante la gara.",
        icon: "hash",
        audience: "admin"
      },
      {
        title: "Campo: Capitano *",
        content: "OBBLIGATORIO. Seleziona l'utente che sara' capitano del team. Il capitano e' responsabile della barca e dell'equipaggio. Puo' registrare catture per il team.",
        icon: "user",
        audience: "admin"
      },
      {
        title: "Campo: Membri Equipaggio",
        content: "OPZIONALE. Aggiungi membri cliccando '+ Aggiungi Membro'. Seleziona utenti registrati o inserisci nome manualmente. Max equipaggio dipende dal regolamento torneo.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Campo: Ispettore",
        content: "OPZIONALE per tornei sociali, OBBLIGATORIO per tornei provinciali+. Seleziona un giudice che controllera' la barca. REGOLA: per tornei multi-societa', l'ispettore deve essere di club diverso.",
        icon: "shield",
        audience: "admin"
      },
      {
        title: "I Miei Team",
        content: "Sezione che mostra i team di cui fai parte. Vedrai: nome team, nome barca, torneo, tuo ruolo (Capitano/Membro). Clicca su un team per vedere i dettagli completi.",
        icon: "users",
        audience: "user"
      },
      {
        title: "Stato Team",
        content: "ATTIVO: puo' partecipare e registrare catture. SOSPESO: temporaneamente bloccato (es: verifica documenti). RITIRATO: ha abbandonato il torneo.",
        icon: "info"
      },
      {
        title: "Livelli Torneo",
        content: "SOCIALE: torneo interno al club - ispettore opzionale. PROVINCIALE/REGIONALE: piu' societa' - ispettore obbligatorio da altro club. NAZIONALE/INTERNAZIONALE: massimo livello - requisiti stretti.",
        icon: "trophy"
      },
      {
        title: "Azione: Modifica Team",
        content: "Clicca l'icona matita per modificare. Puoi cambiare: nome team, membri equipaggio, ispettore. NON puoi cambiare: barca, capitano (contatta admin).",
        icon: "edit",
        audience: "admin"
      },
      {
        title: "Azione: Elimina Team",
        content: "Clicca l'icona cestino per eliminare. ATTENZIONE: azione irreversibile. Le catture associate verranno perse. Richiede conferma.",
        icon: "trash",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Assegna numeri barca in sequenza (1, 2, 3...) per facilitare i giudici", audience: "admin" },
      { text: "Verifica sempre che l'ispettore sia di un club diverso per tornei multi-societa'", audience: "admin" },
      { text: "Stampa la lista team completa prima dell'inizio gara", audience: "admin" },
      { text: "Se devi modificare il tuo team, contatta l'organizzatore con anticipo", audience: "user" },
      { text: "Controlla che tutti i membri equipaggio siano iscritti alla piattaforma", audience: "user" }
    ]
  },

  // STRIKE LIVE
  strikes: {
    title: "Strike Live - Monitoraggio Catture",
    description: "Registra e monitora gli strike (abboccate) in tempo reale durante i tornei attivi.",
    sections: [
      {
        title: "Cos'e' uno Strike?",
        content: "Uno STRIKE e' il momento in cui un pesce abbocca all'esca. Viene registrato in tempo reale per tracking statistico. Non tutte le abboccate diventano catture.",
        icon: "zap"
      },
      {
        title: "Pulsante: Registra Strike",
        content: "Clicca per aprire il form di registrazione. REQUISITO: deve esserci almeno un torneo 'In Corso'. Disponibile solo per giudici e admin.",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "Campo: Torneo *",
        content: "OBBLIGATORIO. Seleziona il torneo attivo dal menu. Vedrai solo tornei con stato 'In Corso'. Se non vedi tornei, nessuno e' attualmente in gara.",
        icon: "trophy",
        audience: "admin"
      },
      {
        title: "Campo: Team *",
        content: "OBBLIGATORIO. Seleziona il team che ha avuto lo strike. Vedrai nome team e numero barca. Filtra digitando il nome. Esempio: 'Barca #3 - Blue Marlin'.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Campo: Numero Canna *",
        content: "OBBLIGATORIO. Seleziona la canna che ha registrato lo strike. Valori: 1, 2, 3, 4, 5, 6. Ogni barca ha massimo 6 canne in pesca secondo regolamento FIPSAS.",
        icon: "target",
        audience: "admin"
      },
      {
        title: "Campo: Risultato *",
        content: "OBBLIGATORIO. Esito dello strike: CATCH (verde) = pesce catturato e portato a bordo. LOST (rosso) = pesce perso durante il combattimento. RELEASED (blu) = pesce rilasciato volontariamente.",
        icon: "check",
        audience: "admin"
      },
      {
        title: "Campo: Ora Strike",
        content: "AUTOMATICO. Viene registrata l'ora corrente al momento del salvataggio. Non modificabile. Formato: HH:MM:SS. Fuso orario del server.",
        icon: "clock",
        audience: "admin"
      },
      {
        title: "Campo: Note",
        content: "OPZIONALE. Aggiungi dettagli utili: specie (se identificata), peso stimato, zona, condizioni. Max 200 caratteri. Esempio: 'Tonno rosso stimato 30kg, zona nord'.",
        icon: "edit",
        audience: "admin"
      },
      {
        title: "Griglia Team Live",
        content: "Visualizzazione in tempo reale di tutti i team. Ogni card mostra: nome team, numero barca, contatore strike per risultato (CATCH/LOST/RELEASED), ultimo strike registrato.",
        icon: "grid"
      },
      {
        title: "Badge Colorati",
        content: "I badge colorati indicano il risultato: VERDE = CATCH (cattura riuscita). ROSSO = LOST (pesce perso). BLU = RELEASED (rilascio volontario). Il numero nel badge indica il totale.",
        icon: "tag"
      },
      {
        title: "Auto-Refresh",
        content: "La pagina si aggiorna automaticamente ogni 30 secondi. Il countdown e' visibile in alto a destra. Clicca 'Aggiorna Ora' per refresh manuale immediato.",
        icon: "refresh"
      },
      {
        title: "Filtro Torneo",
        content: "Se ci sono piu' tornei attivi, usa il filtro in alto per visualizzare gli strike di un torneo specifico. Default: mostra tutti.",
        icon: "filter"
      },
      {
        title: "Timeline Strike",
        content: "Nella sezione inferiore, la timeline mostra tutti gli strike in ordine cronologico. Formato: Ora - Team - Canna - Risultato - Note.",
        icon: "list"
      }
    ],
    tips: [
      { text: "Registra lo strike SUBITO quando avviene - l'ora viene salvata automaticamente", audience: "admin" },
      { text: "Usa RELEASED solo per rilasci volontari, non per pesci persi", audience: "admin" },
      { text: "Badge: VERDE = CATCH, ROSSO = LOST, BLU = RELEASED" },
      { text: "Gli strike NON sono modificabili - in caso di errore contatta un admin", audience: "user" },
      { text: "Aggiorna la pagina se non vedi strike recenti - potrebbe essere un problema di connessione" }
    ]
  },

  // GESTIONE TORNEO (pagina principale)
  tournamentManagement: {
    title: "Gestione Torneo",
    description: "Panoramica completa e controllo del torneo. Da qui puoi monitorare lo stato e accedere a tutte le sezioni.",
    sections: [
      {
        title: "Statistiche Rapide",
        content: "4 card in alto mostrano: Iscritti (numero equipaggi/max), Catture (totale registrate), Data Inizio, Quota Iscrizione. Questi numeri si aggiornano in tempo reale.",
        icon: "bar-chart",
        audience: "admin"
      },
      {
        title: "Badge Stato",
        content: "Lo stato del torneo appare sotto il nome: Bozza (grigio), Pubblicato (blu), Iscrizioni Aperte (verde), Iscrizioni Chiuse (giallo), In Corso (rosso con LIVE), Completato (viola), Annullato (grigio scuro).",
        icon: "tag",
        audience: "admin"
      },
      {
        title: "Checklist Fase",
        content: "Lista interattiva di task da completare per la fase corrente. Ogni fase ha task diversi: BOZZA richiede info base e zone; ISCRIZIONI richiede ispettori; IN CORSO richiede validazione catture. Clicca sui link per andare alla sezione corrispondente.",
        icon: "list-checks",
        audience: "admin"
      },
      {
        title: "Progress Bar",
        content: "Mostra la percentuale di completamento della checklist attuale. 100% significa che sei pronto per passare alla fase successiva.",
        icon: "activity",
        audience: "admin"
      },
      {
        title: "Pulsante Modifica",
        content: "In alto a destra, clicca 'Modifica' per cambiare nome, date, location, quote e regole del torneo. Disponibile solo se il torneo non e' completato o annullato.",
        icon: "edit",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Completa tutta la checklist prima di cambiare stato al torneo", audience: "admin" },
      { text: "Durante 'In Corso' il badge LIVE lampeggia - il torneo e' attivo!", audience: "admin" },
      { text: "Usa la sidebar sinistra per navigare tra Partecipanti, Ispettori, Team, Zone, Pagamenti", audience: "admin" }
    ]
  },

  // MODIFICA TORNEO
  tournamentEdit: {
    title: "Modifica Torneo",
    description: "Modifica i parametri del torneo organizzati in 4 sezioni: informazioni base, date, iscrizioni e regolamento.",
    sections: [
      {
        title: "Card: Informazioni Base",
        content: "Contiene: Nome Torneo* (obbligatorio), Descrizione (textarea), Disciplina* (Big Game, Drifting, Traina Costiera, Bolentino, Eging, Vertical Jigging, Shore, Social), Luogo*, Latitudine/Longitudine (opzionali, per GPS).",
        icon: "info",
        audience: "admin"
      },
      {
        title: "Campo: Nome Torneo *",
        content: "OBBLIGATORIO. Nome ufficiale. Appare in classifiche, liste e pagine pubbliche.",
        icon: "trophy",
        audience: "admin"
      },
      {
        title: "Campo: Disciplina *",
        content: "OBBLIGATORIO. Seleziona la tipologia di gara. Opzioni: Big Game, Drifting, Traina Costiera, Bolentino, Eging, Vertical Jigging, Pesca da Riva, Evento Sociale.",
        icon: "fish",
        audience: "admin"
      },
      {
        title: "Card: Date e Orari",
        content: "Contiene: Data/Ora Inizio* (obbligatorio), Data/Ora Fine* (obbligatorio), Apertura Iscrizioni, Chiusura Iscrizioni. Formato datetime-local per precisione oraria.",
        icon: "calendar",
        audience: "admin"
      },
      {
        title: "Card: Iscrizioni",
        content: "Contiene: Quota Iscrizione EUR (0 = gratuito), Min Partecipanti, Max Partecipanti. Quando Max raggiunto, torneo mostra 'Iscrizioni Complete'.",
        icon: "users",
        audience: "admin"
      },
      {
        title: "Card: Regolamento",
        content: "Parametri gara: Peso Minimo (kg, catture sotto questo peso non contano), Max Catture/Giorno, Punti per Kg (per calcolo punteggio), Punti Bonus.",
        icon: "book",
        audience: "admin"
      },
      {
        title: "Pulsanti Azione",
        content: "In fondo: 'Annulla' (torna al torneo senza salvare), 'Salva Modifiche' (salva e torna alla pagina torneo). Mostra spinner durante salvataggio.",
        icon: "save",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Verifica TUTTE le date prima di salvare - ordine: Apertura Iscrizioni < Chiusura Iscrizioni < Data Inizio < Data Fine", audience: "admin" },
      { text: "Per tornei di 1 giorno, Data Inizio e Data Fine possono essere lo stesso giorno", audience: "admin" },
      { text: "Peso Minimo e Punti per Kg determinano come viene calcolata la classifica", audience: "admin" }
    ]
  },

  // PARTECIPANTI TORNEO
  tournamentParticipants: {
    title: "Partecipanti Torneo",
    description: "Gestisci gli equipaggi iscritti e i loro pagamenti.",
    sections: [
      {
        title: "Statistiche in Alto",
        content: "3 card mostrano: Equipaggi Totali (iscritti), Pagati (quota saldata), In Attesa Pagamento. La progress bar mostra la percentuale di pagamenti completati.",
        icon: "bar-chart",
        audience: "admin"
      },
      {
        title: "Filtri e Ricerca",
        content: "Usa la barra di ricerca per trovare per nome team/barca/capitano/email. Il filtro a tendina permette di vedere: Tutti, Da Pagare, Pagati.",
        icon: "search",
        audience: "admin"
      },
      {
        title: "Tabella Equipaggi",
        content: "Colonne: # (numero), Equipaggio (nome team), Barca, Capitano, Stato (badge colorato), Importo (€), Metodo pagamento, Data pagamento, Azioni.",
        icon: "table",
        audience: "admin"
      },
      {
        title: "Registra Pagamento",
        content: "Clicca 'Registra' sulla riga di un equipaggio non pagato. Si apre un dialog dove inserire: Importo €, Metodo (Contanti/Bonifico/Altro), Note opzionali. Conferma per registrare.",
        icon: "credit-card",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Verifica tutti i pagamenti PRIMA di chiudere le iscrizioni", audience: "admin" },
      { text: "I badge di stato sono: verde=Pagato, arancione=In attesa, rosso=Annullato", audience: "admin" },
      { text: "Usa i filtri per gestire rapidamente gli equipaggi da sollecitare", audience: "admin" }
    ]
  },

  // ZONE TORNEO
  tournamentZones: {
    title: "Zone di Pesca",
    description: "Definisci le aree consentite per la pesca durante il torneo.",
    sections: [
      {
        title: "Lista Zone",
        content: "Ogni zona appare come una card con: Nome, Descrizione, Coordinate GPS (se inserite), Badge stato (Attiva/Inattiva). Usa i pulsanti Edit/Elimina per gestirle.",
        icon: "list",
        audience: "admin"
      },
      {
        title: "Nuova Zona",
        content: "Clicca '+ Nuova Zona' per aprire il dialog. Compila: Nome zona (obbligatorio), Descrizione, Latitudine, Longitudine, Raggio (in km). Solo il nome e' obbligatorio.",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "Coordinate GPS",
        content: "Latitudine e Longitudine sono opzionali ma utili per definire il centro della zona. Il Raggio indica l'area consentita attorno al punto centrale.",
        icon: "map-pin",
        audience: "admin"
      },
      {
        title: "Ricerca Zone",
        content: "Usa la barra di ricerca per filtrare le zone per nome. Utile quando hai molte zone definite.",
        icon: "search",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Crea zone con nomi chiari e riconoscibili (es. 'Zona Nord - Scoglio Grande')", audience: "admin" },
      { text: "La descrizione puo' contenere riferimenti a punti noti ai pescatori locali", audience: "admin" },
      { text: "Definisci le zone PRIMA di pubblicare il torneo", audience: "admin" }
    ]
  },

  // ISPETTORI DI BORDO
  tournamentJudges: {
    title: "Ispettori di Bordo",
    description: "Assegna un ispettore a ciascuna barca partecipante.",
    sections: [
      {
        title: "Lista Barche",
        content: "Visualizza tutte le barche iscritte con: Nome barca, Numero barca, Capitano, Numero membri equipaggio, Stato ispettore (assegnato o da assegnare).",
        icon: "ship",
        audience: "admin"
      },
      {
        title: "Assegna Ispettore",
        content: "Clicca 'Edit' su una barca per aprire il dialog. Inserisci Nome Ispettore e Club Ispettore (opzionale). Ogni barca deve avere un ispettore prima dell'inizio gara.",
        icon: "user-check",
        audience: "admin"
      },
      {
        title: "Ricerca Barche",
        content: "Usa la barra di ricerca per filtrare per nome barca, capitano o ispettore gia' assegnato.",
        icon: "search",
        audience: "admin"
      },
      {
        title: "Download PDF",
        content: "Clicca il pulsante Download per scaricare un PDF con la lista completa barche-ispettori. Utile per la distribuzione il giorno della gara.",
        icon: "download",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Assegna gli ispettori PRIMA di passare allo stato 'In Corso'", audience: "admin" },
      { text: "Stampa il PDF lista ispettori per il briefing pre-gara", audience: "admin" },
      { text: "Badge verde = ispettore assegnato, grigio = da assegnare", audience: "admin" }
    ]
  },

  // PAGAMENTI TORNEO
  tournamentPayments: {
    title: "Pagamenti Torneo",
    description: "Dashboard completa per gestire le quote di iscrizione degli equipaggi.",
    sections: [
      {
        title: "4 Card Statistiche",
        content: "In alto: Equipaggi Pagati (verde), In Attesa (arancione), Incassato € (blu), Da Incassare € (viola). Progress bar mostra percentuale incassato/totale previsto.",
        icon: "bar-chart",
        audience: "admin"
      },
      {
        title: "Filtri e Ricerca",
        content: "Barra ricerca per trovare equipaggio per nome/barca/capitano. Filtro a tendina: Tutti, Da Pagare, Pagati.",
        icon: "search",
        audience: "admin"
      },
      {
        title: "Tabella Pagamenti",
        content: "Colonne: #, Equipaggio, Barca, Capitano, Stato (badge), Importo €, Metodo (Contanti/Bonifico/Altro), Data Pagamento, Azioni.",
        icon: "table",
        audience: "admin"
      },
      {
        title: "Registra Pagamento",
        content: "Clicca 'Registra' per aprire il dialog. Inserisci: Importo €, Metodo pagamento (CASH/BANK_TRANSFER/OTHER), Note opzionali. Clicca 'Conferma Pagamento' per salvare.",
        icon: "credit-card",
        audience: "admin"
      }
    ],
    tips: [
      { text: "La progress bar diventa verde al 100% - tutti hanno pagato!", audience: "admin" },
      { text: "Badge: verde=Pagato, arancione=Da Pagare, rosso=Annullato, blu=Rimborsato", audience: "admin" },
      { text: "Usa la ricerca per trovare rapidamente chi deve ancora pagare", audience: "admin" }
    ]
  },

  // IMPOSTAZIONI TORNEO
  tournamentSettings: {
    title: "Impostazioni Torneo",
    description: "Gestisci stato, esportazioni e azioni avanzate del torneo.",
    sections: [
      {
        title: "Stato Attuale",
        content: "Visualizza lo stato corrente del torneo (Bozza, Pubblicato, Iscrizioni Aperte, In Corso, Completato, Annullato). Mostra anche il numero di iscritti e catture registrate.",
        icon: "info",
        audience: "admin"
      },
      {
        title: "Gestione Stato",
        content: "Cambia lo stato del torneo: Avvia Torneo (da Iscrizioni Chiuse a In Corso), Sospendi (metti in pausa), Concludi Torneo (termina definitivamente). Le azioni disponibili dipendono dallo stato corrente.",
        icon: "settings",
        audience: "admin"
      },
      {
        title: "Esportazioni",
        content: "Scarica report e dati: Classifica PDF (report stampabile), Classifica CSV (per Excel), Assegnazioni Ispettori PDF (lista ispettori per barca).",
        icon: "download",
        audience: "admin"
      },
      {
        title: "Zona Pericolosa",
        content: "Azioni irreversibili: Annulla Torneo (marca come annullato, i dati rimangono), Elimina Torneo (rimuove completamente - solo se non ci sono iscrizioni/catture).",
        icon: "alert-triangle",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Esporta la classifica PDF prima di concludere il torneo per avere un documento ufficiale", audience: "admin" },
      { text: "Non puoi eliminare un torneo con iscrizioni o catture - usa 'Annulla' invece", audience: "admin" },
      { text: "Lo stato 'Completato' e' definitivo - assicurati che tutte le catture siano registrate prima di concludere", audience: "admin" }
    ]
  },

  // TEAM TORNEO (BARCHE ED EQUIPAGGI)
  tournamentTeams: {
    title: "Barche ed Equipaggi",
    description: "Gestisci le barche iscritte al torneo, assegna numeri di gara e ispettori di bordo.",
    sections: [
      {
        title: "4 Card Statistiche",
        content: "In alto: Barche Iscritte (blu), Numeri Assegnati (verde), Ispettori Assegnati (viola), Membri Totali (ambra). Monitora lo stato di preparazione del torneo.",
        icon: "bar-chart",
        audience: "admin"
      },
      {
        title: "Pulsante: Nuova Barca",
        content: "In alto a destra. Apre dialog per aggiungere barca: Nome Team, Nome Barca, Capitano (da lista utenti), Club rappresentato (per tornei provinciali/nazionali).",
        icon: "plus",
        audience: "admin"
      },
      {
        title: "Campo: Ricerca",
        content: "Cerca per nome barca, nome team, capitano o club. Filtra la lista in tempo reale.",
        icon: "search",
        audience: "admin"
      },
      {
        title: "Lista Barche Espandibile",
        content: "Ogni riga mostra: numero gara (o placeholder se non assegnato), nome team, nome barca, capitano, numero membri, badge ispettore. Clicca per espandere dettagli.",
        icon: "ship",
        audience: "admin"
      },
      {
        title: "Menu Azioni (3 puntini)",
        content: "Per ogni barca: Assegna Numero (numero univoco di gara), Assegna Ispettore (nome e societa), Aggiungi Membro Esterno (solo tornei social/club), Modifica, Elimina Barca.",
        icon: "more-horizontal",
        audience: "admin"
      },
      {
        title: "Dettagli Espansi",
        content: "Cliccando sulla riga: a sinistra info barca (nome team, barca, numero gara, club, rappresenta) + ispettore. A destra lista equipaggio con ruolo (Skipper, Capoequipaggio, Equipaggio, Ospite) e badge 'Esterno' per membri non registrati.",
        icon: "chevron-down",
        audience: "admin"
      },
      {
        title: "Membri Esterni",
        content: "Per tornei SOCIAL o CLUB puoi aggiungere skipper o ospiti non registrati nel sistema. Inserisci nome, ruolo, telefono e email (opzionali). Utile per eventi aperti.",
        icon: "user-plus",
        audience: "admin"
      }
    ],
    tips: [
      { text: "Assegna i numeri barca prima dell'inizio gara - servono per identificare le barche durante la competizione", audience: "admin" },
      { text: "Ogni barca deve avere un ispettore assegnato per tornei ufficiali - verifica il badge 'Ispettore mancante'", audience: "admin" },
      { text: "Per tornei provinciali/nazionali, specifica il club rappresentato nella creazione barca", audience: "admin" }
    ]
  },

  // ISCRIZIONE TORNEO
  tournamentRegister: {
    title: "Iscrizione al Torneo",
    description: "Completa la procedura di iscrizione passo per passo.",
    sections: [
      {
        title: "STEP 1 - Verifica Requisiti",
        content: "Prima di procedere, verifica di avere: account attivo, profilo completo, tessera FIPSAS (se richiesta dal torneo). I requisiti mancanti sono evidenziati in rosso.",
        icon: "check",
        audience: "user"
      },
      {
        title: "Riepilogo Torneo",
        content: "In alto vedi: nome torneo, date, location, disciplina, quota iscrizione, posti rimasti. Verifica che sia il torneo corretto prima di procedere.",
        icon: "info",
        audience: "user"
      },
      {
        title: "Campo: Categoria *",
        content: "OBBLIGATORIO se il torneo ha piu' categorie. Seleziona dal menu: categoria in base all'esperienza, eta' o tipo di barca. Ogni categoria puo' avere regole diverse. Se una sola categoria, e' pre-selezionata.",
        icon: "list",
        audience: "user"
      },
      {
        title: "Campo: Barca",
        content: "Se partecipi con barca propria, seleziona dal menu le tue barche registrate. Se non hai barche, clicca 'Aggiungi Barca' per registrarne una. Per tornei shore, lascia vuoto.",
        icon: "anchor",
        audience: "user"
      },
      {
        title: "Campo: Team",
        content: "Per tornei a squadre: seleziona un team esistente o crea un nuovo team. Per tornei individuali, questo campo non appare.",
        icon: "users",
        audience: "user"
      },
      {
        title: "Campo: Note per l'Organizzatore",
        content: "OPZIONALE. Aggiungi informazioni utili: allergie alimentari, richieste speciali, arrivo anticipato/ritardato. Max 500 caratteri.",
        icon: "edit",
        audience: "user"
      },
      {
        title: "Checkbox: Accetto il Regolamento *",
        content: "OBBLIGATORIO. Clicca sul link 'Regolamento' per leggerlo. Devi spuntare la checkbox per confermare di aver letto e accettato le regole. Senza questa spunta non puoi procedere.",
        icon: "book",
        audience: "user"
      },
      {
        title: "Checkbox: Accetto Privacy *",
        content: "OBBLIGATORIO. Accetta il trattamento dei dati personali secondo la normativa GDPR. Clicca sul link per leggere l'informativa completa.",
        icon: "shield",
        audience: "user"
      },
      {
        title: "STEP 2 - Pagamento",
        content: "Se il torneo ha una quota, scegli il metodo di pagamento. Opzioni: Carta di credito (immediato), PayPal (immediato), Bonifico (manuale - allegare ricevuta).",
        icon: "credit-card",
        audience: "user"
      },
      {
        title: "Pagamento: Carta di Credito",
        content: "Inserisci: numero carta, scadenza, CVV, nome intestatario. Circuiti accettati: Visa, Mastercard, American Express. Pagamento sicuro con crittografia SSL.",
        icon: "credit-card",
        audience: "user"
      },
      {
        title: "Pagamento: Bonifico",
        content: "Vedrai le coordinate bancarie. Causale OBBLIGATORIA: 'Iscrizione [nome torneo] - [tuo nome]'. Dopo il bonifico, carica la ricevuta nel campo dedicato. Iscrizione confermata dopo verifica (24-48h).",
        icon: "building",
        audience: "user"
      },
      {
        title: "Pulsante: Completa Iscrizione",
        content: "Clicca per finalizzare. Se pagamento online: verrai reindirizzato al gateway. Se bonifico: iscrizione in stato 'In Attesa Pagamento'. Riceverai email di conferma.",
        icon: "check",
        audience: "user"
      },
      {
        title: "Stato Iscrizione",
        content: "Dopo l'iscrizione: CONFERMATA (pagamento ricevuto) = sei dentro! IN ATTESA PAGAMENTO (bonifico da verificare) = completa il pagamento. RIFIUTATA (problema) = contatta organizzatore.",
        icon: "info",
        audience: "user"
      }
    ],
    tips: [
      { text: "Iscriviti PRIMA di pagare se devi verificare qualcosa - puoi sempre annullare", audience: "user" },
      { text: "Per bonifico: usa la causale ESATTA indicata, altrimenti il pagamento potrebbe non essere riconosciuto", audience: "user" },
      { text: "Conserva la ricevuta di pagamento - serve in caso di contestazioni", audience: "user" },
      { text: "Controlla la cartella Spam se non ricevi l'email di conferma entro 24h", audience: "user" },
      { text: "In caso di problemi, contatta l'organizzatore PRIMA dell'inizio del torneo", audience: "user" }
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
