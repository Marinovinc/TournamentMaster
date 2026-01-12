#!/usr/bin/env python3
"""
Script per scaricare i regolamenti FIPSAS più recenti.
I PDF vengono salvati in frontend/public/documents/regulations/fipsas/
"""

import os
import requests
import time

# Directory di output
OUTPUT_DIR = "frontend/public/documents/regulations/fipsas"

# URL base FIPSAS
BASE_URL = "https://www.fipsas.it"

# Regolamenti verificati da scaricare - URL estratti dal sito FIPSAS
REGULATIONS = {
    # ========== MARE ==========
    "big-game-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/mare/big-game/circolare-normativa-big-game/5789-circolare-normativa-2025-big-game/file",
        "filename": "circolare_normativa_2025_big_game.pdf"
    },
    "big-game-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/mare/big-game/circolare-normativa-big-game/5219-circolare-normativa-2024-big-game/file",
        "filename": "circolare_normativa_2024_big_game.pdf"
    },
    "surf-casting-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/mare/surf-casting/circolare-normativa-surf-casting/5812-circolare-normativa-2025-surf-casting/file",
        "filename": "circolare_normativa_2025_surf_casting.pdf"
    },
    "surf-casting-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/mare/surf-casting/circolare-normativa-surf-casting/5271-circolare-normativa-2024-surf-casting/file",
        "filename": "circolare_normativa_2024_surf_casting.pdf"
    },
    "bolentino-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/mare/bolentino/circolare-normativa-bolentino/5775-circolare-normativa-2025-bolentino/file",
        "filename": "circolare_normativa_2025_bolentino.pdf"
    },
    "bolentino-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/mare/bolentino/circolare-normativa-bolentino/5220-circolare-normativa-2024-bolentino/file",
        "filename": "circolare_normativa_2024_bolentino.pdf"
    },

    # ========== ACQUE INTERNE ==========
    "bass-fishing-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/bass-fishing/circolare-normativa-bass-fishing/5819-circolare-normativa-2025-bass-fishing/file",
        "filename": "circolare_normativa_2025_bass_fishing.pdf"
    },
    "bass-fishing-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/bass-fishing/circolare-normativa-bass-fishing/5217-circolare-normativa-2024-bass-fishing/file",
        "filename": "circolare_normativa_2024_bass_fishing.pdf"
    },
    "pesca-colpo-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/pesca-al-colpo/circolare-normativa-pesca-al-colpo/5805-circolare-normativa-2025-pesca-al-colpo/file",
        "filename": "circolare_normativa_2025_pesca_al_colpo.pdf"
    },
    "pesca-colpo-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/pesca-al-colpo/circolare-normativa-pesca-al-colpo/5266-circolare-normativa-2024-pesca-al-colpo/file",
        "filename": "circolare_normativa_2024_pesca_al_colpo.pdf"
    },
    "feeder-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/feeder/circolare-normativa-feeder/5799-circolare-normativa-2025-pesca-a-feeder/file",
        "filename": "circolare_normativa_2025_feeder.pdf"
    },
    "feeder-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/feeder/circolare-normativa-feeder/5224-circolare-normativa-2024-pesca-a-feeder/file",
        "filename": "circolare_normativa_2024_feeder.pdf"
    },
    "fly-fishing-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/pesca-con-la-mosca/circolare-normativa-pesca-con-la-mosca/5883-circolare-normativa-2025-pesca-con-la-mosca/file",
        "filename": "circolare_normativa_2025_pesca_mosca.pdf"
    },
    "fly-fishing-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/pesca-con-la-mosca/circolare-normativa-pesca-con-la-mosca/5272-circolare-normativa-2024-pesca-con-la-mosca/file",
        "filename": "circolare_normativa_2024_pesca_mosca.pdf"
    },
    "carp-fishing-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/carp-fishing/circolare-normativa-carp-fishing/5833-circolare-normativa-2025-carp-fishing/file",
        "filename": "circolare_normativa_2025_carpfishing.pdf"
    },
    "carp-fishing-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/carp-fishing/circolare-normativa-carp-fishing/5223-circolare-normativa-2024-carp-fishing/file",
        "filename": "circolare_normativa_2024_carpfishing.pdf"
    },
    "trout-area-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/trout-area/circolare-normativa-trout-area/5785-circolare-normativa-2025-trout-area/file",
        "filename": "circolare_normativa_2025_trout_area.pdf"
    },
    "trout-area-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/acque-interne/trout-area/circolare-normativa-trout-area/5262-circolare-normativa-2024-trout-area/file",
        "filename": "circolare_normativa_2024_trout_area.pdf"
    },

    # ========== CASTING ==========
    "long-casting-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/casting/long-casting/circolare-normativa-long-casting/5889-circolare-normativa-2025-long-casting/file",
        "filename": "circolare_normativa_2025_long_casting.pdf"
    },
    "long-casting-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/casting/long-casting/circolare-normativa-long-casting/5315-circolare-normativa-2024-long-casting/file",
        "filename": "circolare_normativa_2024_long_casting.pdf"
    },
    "fly-casting-2025": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/casting/fly-casting/circolare-normativa-fly-casting/5890-circolare-normativa-2025-fly-casting/file",
        "filename": "circolare_normativa_2025_fly_casting.pdf"
    },
    "fly-casting-2024": {
        "url": "/pesca-di-superficie/discipline-pesca-di-superficie/casting/fly-casting/circolare-normativa-fly-casting/5316-circolare-normativa-2024-fly-casting/file",
        "filename": "circolare_normativa_2024_fly_casting.pdf"
    },

    # ========== DOCUMENTI GENERICI ==========
    "squadre-nazionali": {
        "url": "/pesca-di-superficie/documenti/5743-regolamento-delle-squadre-nazionali/file",
        "filename": "regolamento_squadre_nazionali.pdf"
    },
    "traina-costiera-cartellino": {
        "url": "/pesca-di-superficie/documenti/4098-foglio-gara-traina-costiera/file",
        "filename": "cartellino_traina_costiera.pdf"
    },
    "long-casting-massafra": {
        "url": "/pesca-di-superficie/documenti/4683-regolamento-campo-gara-di-long-casting-massafra-taranto/file",
        "filename": "regolamento_long_casting_massafra.pdf"
    },
    "long-casting-coltano": {
        "url": "/pesca-di-superficie/documenti/4673-regolamento-campo-long-casting-coltano-pisa/file",
        "filename": "regolamento_long_casting_coltano.pdf"
    },
    "long-casting-cinelli": {
        "url": "/pesca-di-superficie/documenti/4672-regolamento-campo-long-casting-cinelli-viterbo/file",
        "filename": "regolamento_long_casting_cinelli.pdf"
    },
    "casting-cartellini": {
        "url": "/pesca-di-superficie/documenti/5939-disciplina-casting-cartellini-eventi-da-1-a-9/file",
        "filename": "casting_cartellini_eventi.pdf"
    },
    "tabella-punteggio-a4": {
        "url": "/pesca-di-superficie/documenti/328-tabella-punteggio-centimetri-peso-formato-a4-ver-14-09-2017/file",
        "filename": "tabella_punteggio_cm_peso_a4.pdf"
    },
    "tabella-punteggio-a3": {
        "url": "/pesca-di-superficie/documenti/327-tabella-punteggio-centimetri-peso-formato-a3-14-09-2017/file",
        "filename": "tabella_punteggio_cm_peso_a3.pdf"
    },
    "scheda-tonno-tag": {
        "url": "/pesca-di-superficie/documenti/333-scheda-tonno-tag/file",
        "filename": "scheda_tonno_tag.pdf"
    },
    "manuale-rog": {
        "url": "/pesca-di-superficie/documenti/329-rog-richiesta-organizzazione-gara/file",
        "filename": "manuale_rog.pdf"
    },
}

def download_pdf(discipline, info):
    """Scarica un singolo PDF."""
    url = BASE_URL + info["url"]
    filepath = os.path.join(OUTPUT_DIR, info["filename"])

    # Salta se già scaricato
    if os.path.exists(filepath):
        size_kb = os.path.getsize(filepath) / 1024
        if size_kb > 10:  # Più di 10KB = probabilmente valido
            print(f"  {discipline}: SKIP (già presente, {size_kb:.1f} KB)")
            return True

    print(f"  Scaricando {discipline}...", end=" ", flush=True)

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        response = requests.get(url, timeout=30, allow_redirects=True, headers=headers)

        if response.status_code == 200:
            # Verifica che sia un PDF
            content_type = response.headers.get('content-type', '')
            if 'pdf' in content_type.lower() or response.content[:4] == b'%PDF':
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                size_kb = len(response.content) / 1024
                print(f"OK ({size_kb:.1f} KB)")
                return True
            else:
                print(f"SKIP (non PDF: {content_type[:50]})")
                return False
        else:
            print(f"ERRORE ({response.status_code})")
            return False

    except Exception as e:
        print(f"ERRORE ({str(e)[:50]})")
        return False

def main():
    print("="*60)
    print("Download Regolamenti FIPSAS")
    print("="*60)
    print(f"Output: {OUTPUT_DIR}")
    print(f"Documenti da scaricare: {len(REGULATIONS)}")
    print()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = 0
    failed = 0
    skipped = 0

    for discipline, info in REGULATIONS.items():
        filepath = os.path.join(OUTPUT_DIR, info["filename"])
        if os.path.exists(filepath) and os.path.getsize(filepath) > 10240:
            skipped += 1
            print(f"  {discipline}: SKIP (già presente)")
            continue

        if download_pdf(discipline, info):
            success += 1
        else:
            failed += 1
        time.sleep(0.5)  # Rate limiting

    print()
    print("="*60)
    print(f"Completato: {success} nuovi, {skipped} già presenti, {failed} falliti")
    print("="*60)

    # Lista file scaricati
    print("\nFile presenti:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        size = os.path.getsize(os.path.join(OUTPUT_DIR, f)) / 1024
        print(f"  - {f} ({size:.1f} KB)")

if __name__ == "__main__":
    main()
