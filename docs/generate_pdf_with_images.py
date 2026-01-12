"""
Generate PDF Manual with Screenshots for TournamentMaster
Uses reportlab to create a professional PDF with embedded images
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, ListFlowable, ListItem
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Colors
PRIMARY = HexColor('#2563eb')
PRIMARY_DARK = HexColor('#1d4ed8')
TEXT_COLOR = HexColor('#1e293b')
TEXT_LIGHT = HexColor('#64748b')
BORDER_COLOR = HexColor('#e2e8f0')
SUCCESS = HexColor('#22c55e')
WARNING = HexColor('#f59e0b')
DANGER = HexColor('#ef4444')

# Paths
DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(DOCS_DIR, 'screenshots')
OUTPUT_PDF = os.path.join(DOCS_DIR, 'MANUALE_AMMINISTRATORE_ASSOCIAZIONE.pdf')

def create_styles():
    """Create custom paragraph styles"""
    styles = getSampleStyleSheet()

    # Title style
    styles.add(ParagraphStyle(
        name='MainTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=PRIMARY,
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))

    # Subtitle style
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=TEXT_LIGHT,
        spaceAfter=6,
        alignment=TA_CENTER
    ))

    # Section header (H1)
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=PRIMARY,
        spaceBefore=30,
        spaceAfter=15,
        fontName='Helvetica-Bold',
        borderColor=PRIMARY,
        borderWidth=2,
        borderPadding=5
    ))

    # Subsection header (H2)
    styles.add(ParagraphStyle(
        name='SubsectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=PRIMARY_DARK,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    ))

    # Body text
    styles.add(ParagraphStyle(
        name='CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=TEXT_COLOR,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leading=14
    ))

    # Bullet item
    styles.add(ParagraphStyle(
        name='BulletItem',
        parent=styles['Normal'],
        fontSize=10,
        textColor=TEXT_COLOR,
        leftIndent=20,
        spaceAfter=4,
        bulletIndent=10
    ))

    # Caption for images
    styles.add(ParagraphStyle(
        name='Caption',
        parent=styles['Normal'],
        fontSize=9,
        textColor=TEXT_LIGHT,
        alignment=TA_CENTER,
        fontStyle='italic',
        spaceBefore=6,
        spaceAfter=15
    ))

    # TOC item
    styles.add(ParagraphStyle(
        name='TOCItem',
        parent=styles['Normal'],
        fontSize=11,
        textColor=TEXT_COLOR,
        leftIndent=0,
        spaceAfter=6
    ))

    # Note/Tip box
    styles.add(ParagraphStyle(
        name='NoteText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=TEXT_COLOR,
        leftIndent=15,
        rightIndent=15,
        spaceBefore=10,
        spaceAfter=10,
        backColor=HexColor('#f0f9ff'),
        borderColor=PRIMARY,
        borderWidth=1,
        borderPadding=10
    ))

    return styles

def add_screenshot(story, filename, caption, styles, max_width=14*cm):
    """Add a screenshot with caption to the story"""
    img_path = os.path.join(SCREENSHOTS_DIR, filename)
    if os.path.exists(img_path):
        try:
            img = Image(img_path)
            # Scale to fit width while maintaining aspect ratio
            aspect = img.imageHeight / img.imageWidth
            img.drawWidth = max_width
            img.drawHeight = max_width * aspect

            # Limit max height
            max_height = 10*cm
            if img.drawHeight > max_height:
                img.drawHeight = max_height
                img.drawWidth = max_height / aspect

            story.append(Spacer(1, 10))
            story.append(img)
            story.append(Paragraph(caption, styles['Caption']))
        except Exception as e:
            print(f"Warning: Could not add image {filename}: {e}")
    else:
        print(f"Warning: Image not found: {img_path}")

def build_pdf():
    """Build the complete PDF manual"""
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = create_styles()
    story = []

    # ===== COVER PAGE =====
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph("MANUALE AMMINISTRATORE", styles['MainTitle']))
    story.append(Paragraph("ASSOCIAZIONE", styles['MainTitle']))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("TournamentMaster - Piattaforma Gestione Tornei di Pesca", styles['Subtitle']))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Versione 1.0 - Gennaio 2026", styles['Subtitle']))
    story.append(PageBreak())

    # ===== TABLE OF CONTENTS =====
    story.append(Paragraph("Indice", styles['SectionHeader']))
    toc_items = [
        "1. Accesso e Autenticazione",
        "2. Dashboard Principale",
        "3. Gestione Tornei",
        "4. Gestione Partecipanti",
        "5. Gestione Giudici",
        "6. Validazione Catture",
        "7. Classifiche e Punteggi",
        "8. Report e Statistiche",
        "9. Archivio Storico",
        "10. Gestione Associazione"
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles['TOCItem']))
    story.append(PageBreak())

    # ===== SECTION 1: LOGIN =====
    story.append(Paragraph("1. Accesso e Autenticazione", styles['SectionHeader']))
    story.append(Paragraph(
        "Per accedere alla piattaforma TournamentMaster, navigare all'indirizzo web fornito "
        "dalla propria associazione e inserire le credenziali di accesso.",
        styles['CustomBody']
    ))

    story.append(Paragraph("1.1 Pagina di Login", styles['SubsectionHeader']))
    story.append(Paragraph(
        "La pagina di login richiede email e password. Il sistema supporta il recupero password "
        "tramite email e l'autenticazione a due fattori per maggiore sicurezza.",
        styles['CustomBody']
    ))
    add_screenshot(story, '01_login.png', 'Figura 1.1 - Pagina di Login', styles)

    story.append(Paragraph("1.2 Ruoli Utente", styles['SubsectionHeader']))
    roles_text = """
    <b>Amministratore Associazione:</b> Accesso completo a tutte le funzionalita<br/>
    <b>Organizzatore:</b> Gestione tornei assegnati<br/>
    <b>Giudice:</b> Validazione catture durante i tornei<br/>
    <b>Partecipante:</b> Registrazione catture e visualizzazione classifiche
    """
    story.append(Paragraph(roles_text, styles['CustomBody']))
    story.append(PageBreak())

    # ===== SECTION 2: DASHBOARD =====
    story.append(Paragraph("2. Dashboard Principale", styles['SectionHeader']))
    story.append(Paragraph(
        "La dashboard fornisce una panoramica completa dello stato dell'associazione, "
        "con accesso rapido alle funzionalita principali e statistiche in tempo reale.",
        styles['CustomBody']
    ))
    add_screenshot(story, '02_dashboard.png', 'Figura 2.1 - Dashboard Principale', styles)

    story.append(Paragraph("2.1 Widget Disponibili", styles['SubsectionHeader']))
    widgets = [
        "Tornei attivi e prossimi eventi",
        "Statistiche iscritti e partecipazioni",
        "Ultime catture registrate",
        "Notifiche e messaggi recenti",
        "Accessi rapidi alle funzioni principali"
    ]
    for w in widgets:
        story.append(Paragraph(f"- {w}", styles['BulletItem']))
    story.append(PageBreak())

    # ===== SECTION 3: TOURNAMENTS =====
    story.append(Paragraph("3. Gestione Tornei", styles['SectionHeader']))
    story.append(Paragraph(
        "La sezione tornei permette di creare, configurare e gestire tutti gli eventi "
        "dell'associazione. Ogni torneo puo essere personalizzato con regolamento specifico.",
        styles['CustomBody']
    ))
    add_screenshot(story, '03_tournaments.png', 'Figura 3.1 - Lista Tornei', styles)

    story.append(Paragraph("3.1 Creazione Nuovo Torneo", styles['SubsectionHeader']))
    creation_steps = [
        "Cliccare su 'Nuovo Torneo' nella barra superiore",
        "Compilare i dati base: nome, date, location",
        "Configurare il regolamento e sistema punteggio",
        "Definire le categorie e specie target",
        "Impostare quote iscrizione e premi",
        "Pubblicare o salvare come bozza"
    ]
    for i, step in enumerate(creation_steps, 1):
        story.append(Paragraph(f"{i}. {step}", styles['BulletItem']))

    add_screenshot(story, '04_tournament_detail.png', 'Figura 3.2 - Dettaglio Torneo', styles)
    story.append(PageBreak())

    # ===== SECTION 4: PARTICIPANTS =====
    story.append(Paragraph("4. Gestione Partecipanti", styles['SectionHeader']))
    story.append(Paragraph(
        "Gestione completa degli iscritti ai tornei con possibilita di import massivo, "
        "assegnazione team e monitoraggio pagamenti quote.",
        styles['CustomBody']
    ))
    add_screenshot(story, '05_participants.png', 'Figura 4.1 - Lista Partecipanti', styles)

    story.append(Paragraph("4.1 Funzionalita Principali", styles['SubsectionHeader']))
    features = [
        "Iscrizione singola o import da file Excel/CSV",
        "Assegnazione a team e categorie",
        "Gestione pagamenti e ricevute",
        "Stampa badge e materiale gara",
        "Export lista partecipanti"
    ]
    for f in features:
        story.append(Paragraph(f"- {f}", styles['BulletItem']))
    story.append(PageBreak())

    # ===== SECTION 5: JUDGES =====
    story.append(Paragraph("5. Gestione Giudici", styles['SectionHeader']))
    story.append(Paragraph(
        "Configurazione del team giudici per ogni torneo, con assegnazione zone "
        "e permessi specifici per la validazione delle catture.",
        styles['CustomBody']
    ))
    add_screenshot(story, '06_judges.png', 'Figura 5.1 - Gestione Giudici', styles)

    story.append(Paragraph("5.1 Assegnazione Giudici", styles['SubsectionHeader']))
    story.append(Paragraph(
        "I giudici possono essere assegnati a specifiche zone o postazioni. "
        "Ogni giudice riceve credenziali di accesso per l'app mobile di validazione.",
        styles['CustomBody']
    ))
    story.append(PageBreak())

    # ===== SECTION 6: CATCHES =====
    story.append(Paragraph("6. Validazione Catture", styles['SectionHeader']))
    story.append(Paragraph(
        "Sistema di validazione catture in tempo reale con supporto foto, "
        "misurazione e geolocalizzazione per garantire la regolarita della competizione.",
        styles['CustomBody']
    ))
    add_screenshot(story, '07_catches.png', 'Figura 6.1 - Validazione Catture', styles)

    story.append(Paragraph("6.1 Processo di Validazione", styles['SubsectionHeader']))
    validation_steps = [
        "Il partecipante registra la cattura via app mobile",
        "Il sistema verifica automaticamente i dati (GPS, timestamp)",
        "Il giudice di zona riceve notifica per validazione",
        "Validazione con foto e misurazione ufficiale",
        "Punteggio calcolato automaticamente secondo regolamento"
    ]
    for i, step in enumerate(validation_steps, 1):
        story.append(Paragraph(f"{i}. {step}", styles['BulletItem']))
    story.append(PageBreak())

    # ===== SECTION 7: LEADERBOARD =====
    story.append(Paragraph("7. Classifiche e Punteggi", styles['SectionHeader']))
    story.append(Paragraph(
        "Classifiche in tempo reale con calcolo automatico dei punteggi "
        "secondo il regolamento configurato per ogni torneo.",
        styles['CustomBody']
    ))
    add_screenshot(story, '08_leaderboard.png', 'Figura 7.1 - Classifica Torneo', styles)

    story.append(Paragraph("7.1 Tipologie di Classifica", styles['SubsectionHeader']))
    ranking_types = [
        "Classifica individuale generale",
        "Classifica per categoria/eta",
        "Classifica per specie",
        "Classifica a squadre",
        "Big Fish (pesce piu grande)"
    ]
    for r in ranking_types:
        story.append(Paragraph(f"- {r}", styles['BulletItem']))
    story.append(PageBreak())

    # ===== SECTION 8: REPORTS =====
    story.append(Paragraph("8. Report e Statistiche", styles['SectionHeader']))
    story.append(Paragraph(
        "Generazione automatica di report dettagliati per analisi performance, "
        "statistiche stagionali e documentazione ufficiale FIPSAS.",
        styles['CustomBody']
    ))

    story.append(Paragraph("8.1 Report Disponibili", styles['SubsectionHeader']))
    reports = [
        "Report finale torneo (PDF)",
        "Export classifica (Excel/PDF)",
        "Statistiche catture per specie",
        "Report partecipazione stagionale",
        "Export formato FIPSAS"
    ]
    for r in reports:
        story.append(Paragraph(f"- {r}", styles['BulletItem']))
    story.append(PageBreak())

    # ===== SECTION 9: ARCHIVE =====
    story.append(Paragraph("9. Archivio Storico", styles['SectionHeader']))
    story.append(Paragraph(
        "Accesso completo allo storico di tutti i tornei passati, "
        "con classifiche, statistiche e documentazione conservata.",
        styles['CustomBody']
    ))
    add_screenshot(story, '10_archive.png', 'Figura 9.1 - Archivio Tornei', styles)

    story.append(Paragraph("9.1 Funzionalita Archivio", styles['SubsectionHeader']))
    archive_features = [
        "Ricerca tornei per anno/categoria",
        "Visualizzazione classifiche storiche",
        "Download report archiviati",
        "Statistiche comparative multi-anno",
        "Albo d'oro vincitori"
    ]
    for a in archive_features:
        story.append(Paragraph(f"- {a}", styles['BulletItem']))
    story.append(PageBreak())

    # ===== SECTION 10: ASSOCIATION =====
    story.append(Paragraph("10. Gestione Associazione", styles['SectionHeader']))
    story.append(Paragraph(
        "Configurazione generale dell'associazione, gestione utenti "
        "e personalizzazione della pagina pubblica.",
        styles['CustomBody']
    ))
    add_screenshot(story, '12_association_public.png', 'Figura 10.1 - Pagina Pubblica Associazione', styles)

    story.append(Paragraph("10.1 Impostazioni Associazione", styles['SubsectionHeader']))
    settings = [
        "Logo e branding personalizzato",
        "Informazioni di contatto",
        "Regolamento generale",
        "Configurazione notifiche email",
        "Integrazioni social media"
    ]
    for s in settings:
        story.append(Paragraph(f"- {s}", styles['BulletItem']))

    story.append(Paragraph("10.2 Gestione Utenti", styles['SubsectionHeader']))
    add_screenshot(story, '09_users.png', 'Figura 10.2 - Gestione Utenti', styles)
    story.append(Paragraph(
        "Gestione completa degli utenti dell'associazione con assegnazione ruoli, "
        "reset password e monitoraggio accessi.",
        styles['CustomBody']
    ))
    story.append(PageBreak())

    # ===== APPENDIX =====
    story.append(Paragraph("Appendice: Supporto e Contatti", styles['SectionHeader']))
    story.append(Paragraph(
        "Per assistenza tecnica o domande sull'utilizzo della piattaforma:",
        styles['CustomBody']
    ))
    support_info = [
        "Email supporto: support@tournamentmaster.com",
        "Documentazione online: docs.tournamentmaster.com",
        "FAQ e guide video disponibili nella sezione Aiuto"
    ]
    for s in support_info:
        story.append(Paragraph(f"- {s}", styles['BulletItem']))

    # Build PDF
    try:
        doc.build(story)
        print(f"PDF generated successfully: {OUTPUT_PDF}")
        return True
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return False

if __name__ == '__main__':
    build_pdf()
