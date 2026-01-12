# Analisi File Untracked - TournamentMaster

**Data:** 2026-01-09
**Autore:** Claude Code
**Contesto:** Pulizia repository dopo implementazione sistema messaggistica

---

## File Eliminati (18 file di test/fix)

| File | Tipo | Motivo Eliminazione |
|------|------|---------------------|
| `frontend/test_login_check.js` | Test | Script di test temporaneo |
| `frontend/test_login_debug.js` | Test | Script di debug temporaneo |
| `frontend/test_login_only.js` | Test | Script di test temporaneo |
| `frontend/test_media_check.js` | Test | Script di test temporaneo |
| `frontend/test_media_correct.js` | Test | Script di test temporaneo |
| `frontend/test_media_final.js` | Test | Script di test temporaneo |
| `frontend/test_media_screenshot.js` | Test | Script di test temporaneo |
| `frontend/check_errors.js` | Test | Script di verifica temporaneo |
| `frontend/check_live.js` | Test | Script di verifica temporaneo |
| `frontend/zoom_check.js` | Test | Script di verifica temporaneo |
| `frontend/fix-boats-complete.js` | Fix | Script di fix one-time |
| `frontend/fix-equipment-save.js` | Fix | Script di fix one-time |
| `frontend/update-boats.js` | Update | Script di update one-time |
| `frontend/update-boats-2.js` | Update | Script di update one-time |
| `frontend/update-boats-3.js` | Update | Script di update one-time |
| `frontend/update-boats-4.js` | Update | Script di update one-time |
| `frontend/update-boats-5.js` | Update | Script di update one-time |
| `frontend/update-boats-final.js` | Update | Script di update one-time |
| `frontend/update-equipment.js` | Update | Script di update one-time |
| `frontend/complete-equipment-media.js` | Fix | Script di completamento one-time |
| `frontend/complete-equipment-media-v2.js` | Fix | Script di completamento one-time |
| `frontend/scripts/fix_media_page.js` | Fix | Script di fix one-time |
| `frontend/src/components/user/EquipmentSection.new.tsx` | Temp | File temporaneo di sviluppo |
| `frontend/tests/association-dashboard-tabs.py` | Test | Test Playwright temporaneo |
| `fix-server-manager.js` | Fix | Script di fix one-time |

---

## File Rimasti Untracked

### 1. Script Utility (.bat) - DA VALUTARE

| File | Descrizione | Raccomandazione |
|------|-------------|-----------------|
| `START_BACKEND.bat` | Avvia server backend Node.js | Utile per sviluppo locale |
| `STOP_BACKEND.bat` | Ferma server backend | Utile per sviluppo locale |
| `START_SERVER_MANAGER.bat` | Avvia pannello gestione server | Utile per gestione |

**Nota:** Questi file potrebbero essere utili per lo sviluppo locale ma non dovrebbero essere nel repository pubblico. Considerare `.gitignore` o documentazione separata.

### 2. File SQL - NON COMMITTARE

| File | Descrizione | Raccomandazione |
|------|-------------|-----------------|
| `backup_ischiafishing_20260109_150051.sql` | Backup database tenant | Contiene dati sensibili - NON committare |
| `update_ischiafishing.sql` | Script update database | Valutare se necessario |

**Nota:** I file SQL con dati reali non devono MAI essere committati nel repository.

### 3. Server Manager - DA VALUTARE

| File | Descrizione | Raccomandazione |
|------|-------------|-----------------|
| `server_manager.html` | Interfaccia web gestione server | Valutare se includere nel progetto |
| `server_manager_api.php` | API PHP per gestione server | Valutare se includere nel progetto |

**Nota:** Se fanno parte del progetto, andrebbero spostati nella struttura corretta (es. `tools/` o `admin/`).

### 4. Media Caricati Utenti - NON COMMITTARE

#### Gallery (conversioni video)
| File | Tipo | Note |
|------|------|------|
| `jigging-video.mp4` | Video | Modificato (dimensione ridotta) |
| `pesca-zannone-video.mov` | Video | DELETED - convertito in .mp4 |
| `tonno-2011-video.mov` | Video | DELETED - convertito in .mp4 |
| `pesca-zannone-video.mp4` | Video | Nuova versione convertita |
| `tonno-2011-video.mp4` | Video | Nuova versione convertita |
| `jigging-video_OLD.mp4` | Video | Backup versione precedente |
| `pesca-zannone-video_OLD.mov` | Video | Backup versione precedente |
| `tonno-2011-video_OLD.mov` | Video | Backup versione precedente |

#### Upload Utenti (timestamp-based)
| File | Tipo |
|------|------|
| `1767817298695-Delfini Ponza.mpg` | Video |
| `1767818060691-Delfini Ponza.mp4` | Video |
| `1767823320298-DSC01715.jpg` | Immagine |
| `1767823369197-P1000064.mp4` | Video |
| `1767823885009-DSC01715.jpg` | Immagine |
| `1767824397090-DSC01715.jpg` | Immagine |
| `1767824930059-DSC01715.jpg` | Immagine |
| `1767825110067-DSC01715.jpg` | Immagine |
| `1767825778724-DSC01715.jpg` | Immagine |
| `1767825927642-P1000041.mp4` | Video |
| `1767826231557-P1000053.jpg` | Immagine |
| `1767826409374-2009 giugno 13 Bigfish Turnament Ponza 12.mp4` | Video |
| `1767826621265-P1000154.mp4` | Video |
| `1767826756973-P1000154.mp4` | Video |
| `1767827115455-thumbs_2022-LCBT_Kickoff_OYFD0505.jpg` | Immagine |
| `1767827826235-Delfini Ponza.mp4` | Video |
| `1767828037413-Delfini Ponza.mp4` | Video |
| `1767828229770-IMG_0737.mov` | Video |
| `1767828624857-IMG_0737.mp4` | Video |
| `1767828704693-IMG_0792.mp4` | Video |

#### Thumbnails
| File | Tipo |
|------|------|
| `1767984828518-415087376.jpg` | Thumbnail generato |

#### Tenants
| Directory | Contenuto |
|-----------|-----------|
| `frontend/public/images/tenants/` | Loghi e immagini associazioni |

**Nota:** I media caricati dagli utenti NON devono essere nel repository Git. Dovrebbero essere gestiti separatamente (storage esterno, backup dedicato).

---

## Raccomandazioni

### Immediato
1. **NON committare** file SQL con dati reali
2. **NON committare** media caricati dagli utenti
3. Aggiungere a `.gitignore`:
   ```
   # User uploads
   frontend/public/images/banners/17*.jpg
   frontend/public/images/banners/17*.mp4
   frontend/public/images/banners/17*.mov
   frontend/public/images/banners/17*.mpg
   frontend/public/thumbnails/
   frontend/public/images/tenants/

   # Backups
   *.sql
   *_OLD.*

   # Local utilities
   *.bat
   server_manager.*
   ```

### Futuro
1. Configurare storage esterno per media utenti (S3, Cloudinary, etc.)
2. Implementare sistema di backup automatico database
3. Documentare script utility in README separato

---

## Stato Git Attuale

```
Branch: master
Ahead of origin: 0 commits (tutto pushato)

Modified (not staged):
- frontend/public/images/banners/gallery/jigging-video.mp4

Deleted (not staged):
- frontend/public/images/banners/gallery/pesca-zannone-video.mov
- frontend/public/images/banners/gallery/tonno-2011-video.mov

Untracked: 35 file/directory
```

---

## Ultimo Commit

```
3b9fdfe feat(admin): Add user detail page with admin view mode for member profiles
```

Funzionalita implementate:
- Pagina dettaglio utente per admin
- Modalita read-only per BoatsSection, EquipmentSection, MediaSection
- Refactoring routes backend per supporto viewUserId
