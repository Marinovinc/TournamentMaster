#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
TournamentMaster - Admin Manual PDF Generator
Generates professional PDF with screenshots
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Colors - Professional blue theme
PRIMARY_BLUE = HexColor('#1e40af')
LIGHT_BLUE = HexColor('#3b82f6')
DARK_BLUE = HexColor('#1e3a8a')
HEADER_BG = HexColor('#dbeafe')
TABLE_HEADER_BG = HexColor('#1e40af')
TABLE_ROW_ALT = HexColor('#f0f9ff')
TEXT_GRAY = HexColor('#374151')
BORDER_COLOR = HexColor('#93c5fd')

# Paths
DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(DOCS_DIR, 'screenshots')
OUTPUT_PDF = os.path.join(DOCS_DIR, 'MANUALE_AMMINISTRATORE_ASSOCIAZIONE.pdf')

def create_styles():
    """Create custom paragraph styles"""
    styles = getSampleStyleSheet()

    # Title style
    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=PRIMARY_BLUE,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))

    # Subtitle
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=TEXT_GRAY,
        spaceAfter=20,
        alignment=TA_CENTER
    ))

    # Section headers (H1)
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=PRIMARY_BLUE,
        spaceBefore=25,
        spaceAfter=15,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderPadding=0
    ))

    # Subsection headers (H2)
    styles.add(ParagraphStyle(
        name='SubsectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=DARK_BLUE,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))

    # Body text
    styles.add(ParagraphStyle(
        name='CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=TEXT_GRAY,
        spaceBefore=4,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leading=14
    ))

    # List item
    styles.add(ParagraphStyle(
        name='ListItem',
        parent=styles['Normal'],
        fontSize=10,
        textColor=TEXT_GRAY,
        leftIndent=20,
        spaceBefore=2,
        spaceAfter=2,
        leading=14
    ))

    # Caption for images
    styles.add(ParagraphStyle(
        name='Caption',
        parent=styles['Normal'],
        fontSize=9,
        textColor=LIGHT_BLUE,
        alignment=TA_CENTER,
        fontStyle='italic',
        spaceAfter=15
    ))

    # Note/Tip box text
    styles.add(ParagraphStyle(
        name='NoteText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=DARK_BLUE,
        leftIndent=10,
        rightIndent=10,
        spaceBefore=5,
        spaceAfter=5,
        leading=12
    ))

    return styles

def add_screenshot(story, filename, caption, styles, max_width=14*cm, max_height=9*cm):
    """Add screenshot with caption"""
    img_path = os.path.join(SCREENSHOTS_DIR, filename)
    if os.path.exists(img_path):
        try:
            img = Image(img_path)
            # Scale to fit
            aspect = img.imageWidth / img.imageHeight
            if img.imageWidth > max_width:
                img.drawWidth = max_width
                img.drawHeight = max_width / aspect
            if img.drawHeight > max_height:
                img.drawHeight = max_height
                img.drawWidth = max_height * aspect

            # Center the image
            img.hAlign = 'CENTER'

            story.append(Spacer(1, 10))
            story.append(img)
            story.append(Paragraph(caption, styles['Caption']))
            story.append(Spacer(1, 5))
        except Exception as e:
            print(f"Warning: Could not load image {filename}: {e}")
    else:
        print(f"Warning: Screenshot not found: {img_path}")

def create_table(data, col_widths=None, header=True):
    """Create styled table"""
    if col_widths is None:
        col_widths = [4*cm] * len(data[0])

    table = Table(data, colWidths=col_widths)

    style_commands = [
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]

    if header:
        style_commands.extend([
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ])
        # Alternate row colors
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_commands.append(('BACKGROUND', (0, i), (-1, i), TABLE_ROW_ALT))

    table.setStyle(TableStyle(style_commands))
    return table

def add_note_box(story, text, styles, note_type='info'):
    """Add a highlighted note/tip box"""
    bg_color = HEADER_BG if note_type == 'info' else HexColor('#fef3c7')
    border_color = LIGHT_BLUE if note_type == 'info' else HexColor('#f59e0b')

    data = [[Paragraph(text, styles['NoteText'])]]
    table = Table(data, colWidths=[15*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
    ]))
    story.append(Spacer(1, 10))
    story.append(table)
    story.append(Spacer(1, 10))

def build_document():
    """Build the complete PDF document"""
    styles = create_styles()
    story = []

    # =====================================================================
    # COVER PAGE
    # =====================================================================
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph("MANUALE AMMINISTRATORE", styles['CustomTitle']))
    story.append(Paragraph("ASSOCIAZIONE", styles['CustomTitle']))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("TournamentMaster - Guida Operativa Completa", styles['Subtitle']))
    story.append(Spacer(1, 2*cm))

    # Cover info box
    cover_data = [
        ['Versione:', '1.0.0'],
        ['Data:', '2026-01-10'],
        ['Destinatari:', 'Amministratori Associazioni di Pesca Sportiva'],
    ]
    cover_table = Table(cover_data, colWidths=[4*cm, 10*cm])
    cover_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_GRAY),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(cover_table)
    story.append(PageBreak())

    # =====================================================================
    # TABLE OF CONTENTS
    # =====================================================================
    story.append(Paragraph("Indice", styles['SectionHeader']))
    story.append(Spacer(1, 10))

    toc_items = [
        "1. Primo Accesso",
        "2. La Tua Dashboard",
        "3. Gestione Tornei",
        "4. Gestione Partecipanti",
        "5. Gestione Giudici e Staff",
        "6. Validazione Catture",
        "7. Classifiche e Punteggi",
        "8. Import/Export Dati",
        "9. Archivio e Statistiche",
        "10. Impostazioni Associazione",
        "11. Risoluzione Problemi",
        "12. Domande Frequenti",
    ]

    for item in toc_items:
        story.append(Paragraph(f"&bull; {item}", styles['CustomBody']))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 1: PRIMO ACCESSO
    # =====================================================================
    story.append(Paragraph("1. Primo Accesso", styles['SectionHeader']))

    story.append(Paragraph("1.1 Accedere alla Piattaforma", styles['SubsectionHeader']))
    steps = [
        "Apri il browser e vai all'indirizzo della piattaforma",
        "Clicca su <b>\"Accedi\"</b> in alto a destra",
        "Inserisci Email e Password forniti dal Super Admin",
        "Clicca <b>\"Accedi\"</b>",
    ]
    for i, step in enumerate(steps, 1):
        story.append(Paragraph(f"{i}. {step}", styles['ListItem']))

    add_screenshot(story, '01_login.png', 'Figura 1.1 - Pagina di Login', styles)

    story.append(Paragraph("1.2 Primo Accesso - Cambio Password", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Al primo accesso ti verra chiesto di cambiare la password temporanea, "
        "completare il profilo (nome, telefono, foto) e accettare i termini di servizio.",
        styles['CustomBody']
    ))

    story.append(Paragraph("1.3 Recupero Password", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Se hai dimenticato la password, clicca \"Password dimenticata?\" nella pagina di login, "
        "inserisci la tua email e controlla la casella (anche spam). "
        "Clicca il link ricevuto per impostare una nuova password.",
        styles['CustomBody']
    ))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 2: DASHBOARD
    # =====================================================================
    story.append(Paragraph("2. La Tua Dashboard", styles['SectionHeader']))

    story.append(Paragraph(
        "Dopo il login, vedrai la Dashboard Amministratore con una panoramica completa "
        "delle attivita della tua associazione.",
        styles['CustomBody']
    ))

    add_screenshot(story, '02_dashboard.png', 'Figura 2.1 - Dashboard Amministratore', styles)

    story.append(Paragraph("2.1 Panoramica Rapida", styles['SubsectionHeader']))

    dashboard_data = [
        ['Sezione', 'Cosa Mostra'],
        ['Tornei Attivi', 'Numero di tornei in corso'],
        ['Iscrizioni Pendenti', 'Iscrizioni in attesa di approvazione'],
        ['Catture da Validare', 'Catture in attesa di verifica'],
        ['Partecipanti Totali', 'Numero utenti registrati'],
    ]
    story.append(create_table(dashboard_data, [5*cm, 10*cm]))
    story.append(Spacer(1, 15))

    story.append(Paragraph("2.2 Menu Principale", styles['SubsectionHeader']))
    menu_items = [
        "<b>Dashboard</b> - Panoramica generale",
        "<b>Tornei</b> - Gestione completa tornei",
        "<b>Utenti</b> - Gestione partecipanti e staff",
        "<b>Squadre</b> - Visualizza team registrati",
        "<b>Report</b> - Statistiche e analisi",
        "<b>Archivio</b> - Storico tornei passati",
        "<b>Impostazioni</b> - Configurazione associazione",
    ]
    for item in menu_items:
        story.append(Paragraph(f"&bull; {item}", styles['ListItem']))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 3: GESTIONE TORNEI
    # =====================================================================
    story.append(Paragraph("3. Gestione Tornei", styles['SectionHeader']))

    story.append(Paragraph("3.1 Lista Tornei", styles['SubsectionHeader']))
    story.append(Paragraph(
        "La pagina Tornei mostra tutti i tornei della tua associazione con filtri per stato, "
        "data e disciplina.",
        styles['CustomBody']
    ))

    add_screenshot(story, '03_tournaments.png', 'Figura 3.1 - Lista Tornei', styles)

    story.append(Paragraph("3.2 Dettaglio Torneo", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Cliccando su un torneo accedi alla vista dettagliata con tutte le informazioni "
        "e le azioni disponibili.",
        styles['CustomBody']
    ))

    add_screenshot(story, '04_tournament_detail.png', 'Figura 3.2 - Dettaglio Torneo', styles)

    story.append(Paragraph("3.3 Creare un Nuovo Torneo", styles['SubsectionHeader']))
    story.append(Paragraph("<b>Percorso:</b> Dashboard -> Tornei -> <b>+ Nuovo Torneo</b>", styles['CustomBody']))

    story.append(Paragraph("I passaggi per creare un torneo sono:", styles['CustomBody']))
    creation_steps = [
        "<b>Informazioni Base</b>: Nome, Descrizione, Disciplina, Livello",
        "<b>Date e Orari</b>: Inizio, Fine, Apertura/Chiusura Iscrizioni",
        "<b>Location e Zone</b>: Localita, Zone di pesca (mappa o GeoJSON)",
        "<b>Quote e Limiti</b>: Quota iscrizione, Max partecipanti, Membri per squadra",
        "<b>Regolamento</b>: Peso minimo, Max catture, Specie ammesse",
    ]
    for i, step in enumerate(creation_steps, 1):
        story.append(Paragraph(f"{i}. {step}", styles['ListItem']))

    story.append(Paragraph("3.4 Stati del Torneo", styles['SubsectionHeader']))

    states_data = [
        ['Stato', 'Significato', 'Azioni'],
        ['BOZZA', 'In fase di creazione', 'Modifica, Pubblica'],
        ['PUBBLICATO', 'Visibile ma non iscrivibile', 'Apri iscrizioni'],
        ['ISCRIZIONI APERTE', 'Si accettano iscritti', 'Chiudi iscrizioni'],
        ['IN CORSO', 'Gara attiva', 'Registra catture, Concludi'],
        ['COMPLETATO', 'Gara terminata', 'Genera report, Archivia'],
    ]
    story.append(create_table(states_data, [4*cm, 5*cm, 6*cm]))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 4: GESTIONE PARTECIPANTI
    # =====================================================================
    story.append(Paragraph("4. Gestione Partecipanti", styles['SectionHeader']))

    story.append(Paragraph("4.1 Visualizzare gli Iscritti", styles['SubsectionHeader']))
    story.append(Paragraph("<b>Percorso:</b> Tornei -> [Torneo] -> <b>Partecipanti</b>", styles['CustomBody']))

    add_screenshot(story, '05_participants.png', 'Figura 4.1 - Lista Partecipanti', styles)

    story.append(Paragraph(
        "La tabella mostra nome, email, telefono, squadra/barca, stato iscrizione e stato pagamento.",
        styles['CustomBody']
    ))

    story.append(Paragraph("4.2 Approvare/Rifiutare Iscrizioni", styles['SubsectionHeader']))
    approval_steps = [
        "Clicca sulla riga del partecipante",
        "Verifica i dati e documenti",
        "Clicca <b>Approva</b> per confermare o <b>Rifiuta</b> con motivazione",
    ]
    for i, step in enumerate(approval_steps, 1):
        story.append(Paragraph(f"{i}. {step}", styles['ListItem']))

    story.append(Paragraph("4.3 Esportare Lista Partecipanti", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Formati disponibili: Excel (.xlsx), CSV, PDF per stampa.",
        styles['CustomBody']
    ))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 5: GESTIONE GIUDICI
    # =====================================================================
    story.append(Paragraph("5. Gestione Giudici e Staff", styles['SectionHeader']))

    story.append(Paragraph("5.1 Assegnare Giudici al Torneo", styles['SubsectionHeader']))
    story.append(Paragraph("<b>Percorso:</b> Tornei -> [Torneo] -> <b>Giudici</b>", styles['CustomBody']))

    add_screenshot(story, '06_judges.png', 'Figura 5.1 - Gestione Ispettori di Bordo', styles)

    story.append(Paragraph("Per assegnare un giudice:", styles['CustomBody']))
    judge_steps = [
        "Clicca \"+ Assegna Giudice\"",
        "Seleziona un utente con ruolo JUDGE dalla lista",
        "Scegli il ruolo: Direttore di Gara, Giudice, o Ispettore",
        "Clicca \"Assegna\"",
    ]
    for i, step in enumerate(judge_steps, 1):
        story.append(Paragraph(f"{i}. {step}", styles['ListItem']))

    story.append(Paragraph("5.2 Assegnare Ispettori alle Barche", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Per tornei Drifting/Big Game, usa la matrice Barche x Ispettori. "
        "Trascina un ispettore sulla barca assegnata. "
        "Il sistema verifica che l'ispettore non sia della stessa societa.",
        styles['CustomBody']
    ))

    add_note_box(story,
        "<b>Suggerimento:</b> Clicca \"Stampa PDF Assegnazioni\" per generare la lista "
        "ispettori con barca assegnata, contatti di emergenza e mappa zone.",
        styles, 'info')

    story.append(PageBreak())

    # =====================================================================
    # SECTION 6: VALIDAZIONE CATTURE
    # =====================================================================
    story.append(Paragraph("6. Validazione Catture", styles['SectionHeader']))

    story.append(Paragraph("6.1 Live Dashboard - Catture in Tempo Reale", styles['SubsectionHeader']))
    story.append(Paragraph("<b>Percorso:</b> Tornei -> [Torneo] -> <b>Live</b>", styles['CustomBody']))

    add_screenshot(story, '07_catches.png', 'Figura 6.1 - Live Dashboard con Catture in Tempo Reale', styles)

    story.append(Paragraph(
        "Il Live Dashboard mostra in tempo reale la classifica, le statistiche "
        "e il feed delle attivita durante la gara.",
        styles['CustomBody']
    ))

    story.append(Paragraph("6.2 Validare una Cattura", styles['SubsectionHeader']))
    story.append(Paragraph("Per ogni cattura vedrai:", styles['CustomBody']))
    catch_info = [
        "<b>Foto</b> - clicca per ingrandire",
        "<b>Dati</b> - peso, lunghezza, specie",
        "<b>GPS</b> - posizione sulla mappa",
        "<b>Orario</b> - quando e stata registrata",
        "<b>Pescatore</b> - chi l'ha registrata",
    ]
    for item in catch_info:
        story.append(Paragraph(f"&bull; {item}", styles['ListItem']))

    story.append(Paragraph("6.3 Approvare o Rifiutare", styles['SubsectionHeader']))
    story.append(Paragraph(
        "<b>Per approvare:</b> Verifica foto, controlla GPS nella zona valida, clicca \"Approva\".",
        styles['CustomBody']
    ))
    story.append(Paragraph(
        "<b>Per rifiutare:</b> Clicca \"Rifiuta\", seleziona motivo (foto non valida, fuori zona, "
        "peso non verificabile, specie non ammessa), conferma.",
        styles['CustomBody']
    ))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 7: CLASSIFICHE
    # =====================================================================
    story.append(Paragraph("7. Classifiche e Punteggi", styles['SectionHeader']))

    story.append(Paragraph("7.1 Classifica Pubblica", styles['SubsectionHeader']))
    story.append(Paragraph(
        "La classifica pubblica e accessibile a tutti e mostra posizione, "
        "partecipante/squadra, punti totali, numero catture e peso totale.",
        styles['CustomBody']
    ))

    add_screenshot(story, '08_leaderboard.png', 'Figura 7.1 - Classifica Pubblica', styles)

    story.append(Paragraph("7.2 Come si Calcolano i Punti", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Il sistema calcola automaticamente: <b>Punti = Peso (kg) x 100 x Moltiplicatore Specie</b>",
        styles['CustomBody']
    ))
    story.append(Paragraph(
        "Esempio: Cattura 5.5 kg di Tonno (moltiplicatore 1.5) = 5.5 x 100 x 1.5 = <b>825 punti</b>",
        styles['CustomBody']
    ))

    story.append(Paragraph("7.3 Generare Classifica PDF", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Clicca \"Esporta PDF\" per generare un documento con intestazione associazione, "
        "logo, classifica completa, dettaglio catture e firma Direttore di Gara.",
        styles['CustomBody']
    ))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 8: IMPORT/EXPORT
    # =====================================================================
    story.append(Paragraph("8. Import/Export Dati", styles['SectionHeader']))

    story.append(Paragraph("8.1 Importare Partecipanti da Excel", styles['SubsectionHeader']))
    import_steps = [
        "Scarica il template Excel cliccando \"Scarica Template\"",
        "Compila con Nome, Cognome, Email, Telefono, Squadra, Barca",
        "Carica il file compilato",
        "Rivedi l'anteprima e conferma",
    ]
    for i, step in enumerate(import_steps, 1):
        story.append(Paragraph(f"{i}. {step}", styles['ListItem']))

    story.append(Paragraph("8.2 Esportare Dati", styles['SubsectionHeader']))

    export_data = [
        ['Dato', 'Formati', 'Uso'],
        ['Partecipanti', 'Excel, CSV, JSON', 'Lista iscritti'],
        ['Catture', 'Excel, CSV, JSON', 'Dettaglio catture'],
        ['Classifica', 'Excel, CSV, JSON, PDF', 'Risultati'],
        ['FIPSAS', 'Excel (formato federale)', 'Omologazione'],
    ]
    story.append(create_table(export_data, [4*cm, 5*cm, 6*cm]))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 9: ARCHIVIO
    # =====================================================================
    story.append(Paragraph("9. Archivio e Statistiche", styles['SectionHeader']))

    story.append(Paragraph("9.1 Archivio Storico", styles['SubsectionHeader']))
    story.append(Paragraph("<b>Percorso:</b> Dashboard -> <b>Archivio</b>", styles['CustomBody']))

    add_screenshot(story, '10_archive.png', 'Figura 9.1 - Archivio Storico', styles)

    story.append(Paragraph(
        "L'archivio contiene tutti i tornei completati con classifica finale, "
        "statistiche e documenti.",
        styles['CustomBody']
    ))

    story.append(Paragraph("9.2 Hall of Fame", styles['SubsectionHeader']))
    story.append(Paragraph(
        "Mostra i vincitori di tutti i tornei passati: Classifica Generale, "
        "Cattura Maggiore, Piu Catture. Filtrabile per anno e disciplina.",
        styles['CustomBody']
    ))

    story.append(Paragraph("9.3 Record Associazione", styles['SubsectionHeader']))
    story.append(Paragraph("Visualizza i record storici:", styles['CustomBody']))
    records = [
        "Cattura piu grande (peso)",
        "Piu catture in un torneo",
        "Piu punti in un torneo",
        "Piu vittorie (partecipante)",
    ]
    for record in records:
        story.append(Paragraph(f"&bull; {record}", styles['ListItem']))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 10: IMPOSTAZIONI
    # =====================================================================
    story.append(Paragraph("10. Impostazioni Associazione", styles['SectionHeader']))

    story.append(Paragraph("10.1 Gestione Utenti", styles['SubsectionHeader']))
    story.append(Paragraph("<b>Percorso:</b> Impostazioni -> <b>Utenti</b>", styles['CustomBody']))

    add_screenshot(story, '09_users.png', 'Figura 10.1 - Gestione Utenti', styles)

    story.append(Paragraph(
        "Puoi vedere tutti gli utenti registrati, modificare ruoli (Partecipante, Giudice, "
        "Organizzatore), disattivare account e resettare password.",
        styles['CustomBody']
    ))

    story.append(Paragraph("10.2 Messaggi e Comunicazioni", styles['SubsectionHeader']))

    add_screenshot(story, '11_messages.png', 'Figura 10.2 - Sistema Messaggi', styles)

    story.append(Paragraph(
        "Il sistema messaggi permette di comunicare con partecipanti e staff, "
        "inviare notifiche di massa e gestire le comunicazioni del torneo.",
        styles['CustomBody']
    ))

    story.append(Paragraph("10.3 Pagina Pubblica Associazione", styles['SubsectionHeader']))

    add_screenshot(story, '12_association_public.png', 'Figura 10.3 - Pagina Pubblica Associazione', styles)

    story.append(Paragraph(
        "La pagina pubblica mostra le informazioni della tua associazione, "
        "i tornei in programma e lo storico delle gare. "
        "Personalizzabile con logo, banner, colori e descrizione.",
        styles['CustomBody']
    ))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 11: RISOLUZIONE PROBLEMI
    # =====================================================================
    story.append(Paragraph("11. Risoluzione Problemi", styles['SectionHeader']))

    problems = [
        ("Non riesco ad accedere",
         "Clicca \"Password dimenticata\", controlla anche spam. Se non ricevi email, contatta il Super Admin."),
        ("Un partecipante non riesce a iscriversi",
         "Verifica: iscrizioni aperte? Posti disponibili? Profilo completato? Documenti caricati?"),
        ("La cattura non appare in classifica",
         "Verifica: cattura approvata (stato APPROVED)? GPS nella zona valida? Specie ammessa?"),
        ("Non posso avviare il torneo",
         "Verifica: iscrizioni chiuse? Minimo partecipanti? Almeno un giudice assegnato?"),
        ("Il PDF non si genera",
         "Riprova dopo qualche secondo. Verifica che ci siano dati. Se persiste, contatta supporto."),
    ]

    for title, solution in problems:
        story.append(Paragraph(f"<b>{title}</b>", styles['SubsectionHeader']))
        story.append(Paragraph(solution, styles['CustomBody']))

    story.append(PageBreak())

    # =====================================================================
    # SECTION 12: FAQ
    # =====================================================================
    story.append(Paragraph("12. Domande Frequenti", styles['SectionHeader']))

    faqs = [
        ("Posso gestire piu tornei contemporaneamente?", "Si, non c'e limite al numero di tornei attivi."),
        ("I partecipanti possono iscriversi da soli?", "Si, una volta pubblicato il torneo e aperte le iscrizioni."),
        ("Come gestisco i pagamenti?", "Il sistema traccia lo stato. Il pagamento avviene offline (bonifico, contanti). Confermi manualmente."),
        ("Chi puo registrare le catture?", "I partecipanti dalla loro app, oppure ispettori/giudici dal pannello."),
        ("Posso correggere una cattura gia approvata?", "Si, vai su Catture -> [Cattura] -> Modifica. Solo admin e direttore."),
        ("Il PDF e valido per FIPSAS?", "Usa l'export specifico \"Formato FIPSAS\" per la documentazione federale."),
    ]

    for question, answer in faqs:
        story.append(Paragraph(f"<b>D: {question}</b>", styles['CustomBody']))
        story.append(Paragraph(f"R: {answer}", styles['ListItem']))
        story.append(Spacer(1, 5))

    story.append(PageBreak())

    # =====================================================================
    # GLOSSARY & CONTACTS
    # =====================================================================
    story.append(Paragraph("Glossario", styles['SectionHeader']))

    glossary_data = [
        ['Termine', 'Significato'],
        ['Tenant', 'La tua associazione sulla piattaforma'],
        ['TENANT_ADMIN', 'Il tuo ruolo di amministratore'],
        ['Bozza (Draft)', 'Torneo non ancora pubblicato'],
        ['Catch', 'Una cattura registrata'],
        ['Strike', "Un'abboccata/ferrata durante la pesca"],
        ['Leaderboard', 'Classifica in tempo reale'],
        ['GPS Validation', 'Verifica che la cattura sia nella zona'],
        ['Homologation', 'Omologazione FIPSAS del risultato'],
    ]
    story.append(create_table(glossary_data, [4*cm, 11*cm]))

    story.append(Spacer(1, 30))

    story.append(Paragraph("Contatti Supporto", styles['SectionHeader']))
    story.append(Paragraph("<b>Email:</b> supporto@tournamentmaster.it", styles['CustomBody']))
    story.append(Paragraph("<b>Telefono:</b> +39 XXX XXX XXXX", styles['CustomBody']))
    story.append(Paragraph("<b>Orari:</b> Lun-Ven 9:00-18:00", styles['CustomBody']))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Hotline urgenze durante gare:</b> +39 XXX XXX XXXX", styles['CustomBody']))

    story.append(Spacer(1, 40))
    story.append(Paragraph(
        "<i>Documento generato il 2026-01-10 - TournamentMaster v1.5.1</i>",
        styles['Caption']
    ))

    return story

def add_header_footer(canvas, doc):
    """Add header and footer to each page"""
    canvas.saveState()

    # Header line
    canvas.setStrokeColor(PRIMARY_BLUE)
    canvas.setLineWidth(2)
    canvas.line(1.5*cm, A4[1] - 1.2*cm, A4[0] - 1.5*cm, A4[1] - 1.2*cm)

    # Header text
    canvas.setFillColor(PRIMARY_BLUE)
    canvas.setFont('Helvetica-Bold', 9)
    canvas.drawString(1.5*cm, A4[1] - 1*cm, "TournamentMaster - Manuale Amministratore")

    # Footer
    canvas.setStrokeColor(BORDER_COLOR)
    canvas.setLineWidth(1)
    canvas.line(1.5*cm, 1.5*cm, A4[0] - 1.5*cm, 1.5*cm)

    # Page number
    canvas.setFillColor(TEXT_GRAY)
    canvas.setFont('Helvetica', 9)
    page_num = canvas.getPageNumber()
    canvas.drawCentredString(A4[0]/2, 1*cm, f"Pagina {page_num}")

    canvas.restoreState()

def main():
    """Main function to generate PDF"""
    print("=" * 60)
    print("TournamentMaster - Admin Manual PDF Generator")
    print("=" * 60)

    # Check screenshots
    print("\nVerifying screenshots...")
    screenshots = [
        '01_login.png', '02_dashboard.png', '03_tournaments.png',
        '04_tournament_detail.png', '05_participants.png', '06_judges.png',
        '07_catches.png', '08_leaderboard.png', '09_users.png',
        '10_archive.png', '11_messages.png', '12_association_public.png'
    ]

    missing = []
    for s in screenshots:
        path = os.path.join(SCREENSHOTS_DIR, s)
        if os.path.exists(path):
            print(f"  [OK] {s}")
        else:
            print(f"  [MISSING] {s}")
            missing.append(s)

    if missing:
        print(f"\nWarning: {len(missing)} screenshots missing. PDF will be generated without them.")

    # Create PDF
    print("\nGenerating PDF...")

    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    story = build_document()

    try:
        doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
        print(f"\n[SUCCESS] PDF generated: {OUTPUT_PDF}")
        print(f"File size: {os.path.getsize(OUTPUT_PDF) / 1024:.1f} KB")
    except Exception as e:
        print(f"\n[ERROR] Failed to generate PDF: {e}")
        raise

if __name__ == '__main__':
    main()
