# Progetto: Risoluzione Interruzioni Silenziose Claude Code

**Data:** 2026-01-05
**Applicazione:** TournamentMaster
**Percorso:** `C:\Users\marin\Downloads\TournamentMaster`
**Problema:** Claude Code si interrompe silenziosamente durante le sessioni
**Stato:** Da Implementare

---

## 1. Descrizione del Problema

**Claude Code si interrompe silenziosamente** quando lavora sul progetto TournamentMaster. Le sessioni terminano senza warning, perdendo il contesto della conversazione e costringendo a riavviare.

### Sintomi Osservati
- Sessione Claude Code termina improvvisamente senza errore
- Nessun messaggio di timeout o limite raggiunto
- Accade più frequentemente durante operazioni su file multipli
- Comportamento non deterministico

### ⚠️ NOTA IMPORTANTE
Questo documento riguarda **interruzioni di Claude Code CLI**, NON crash del server Next.js di sviluppo (che era l'interpretazione iniziale errata).

---

## 2. Analisi Tecnica: Dimensioni Progetto

### 2.1 Statistiche Progetto

| Metrica | Valore | Valutazione |
|---------|--------|-------------|
| **File totali** | 101,935 | 🔴 CRITICO |
| **Dimensione totale** | 1.6 GB | 🔴 CRITICO |
| **File in node_modules (frontend)** | 48,725 | 🔴 Eccessivo |
| **File in .next** | 506 | 🟡 Normale |

### 2.2 Struttura Directory Problematica

```
TournamentMaster/
├── frontend/
│   ├── node_modules/        # 48,725 file - PRINCIPALE PROBLEMA
│   ├── .next/               # 506 file
│   ├── src/                 # Codice sorgente
│   └── public/              # Asset statici
├── backend/
│   └── node_modules/        # Altri ~50,000 file stimati
└── ...
```

---

## 3. Cause Identificate

### 3.1 Causa Primaria: Progetto Troppo Grande per Claude Code

| Severità | 🔴 CRITICO |
|----------|-----------|
| **Problema** | 100,000+ file causano timeout/memory exhaustion in Claude Code |
| **Meccanismo** | Operazioni Glob, Grep, e search iterano su tutti i file |
| **Trigger** | Comandi come `find`, ricerche pattern, indicizzazione |

**Quando Claude Code esegue:**
```bash
# Questo comando scansiona TUTTI i 101,935 file!
Glob("**/*.tsx")
# Oppure
Grep("import", "**/*.ts")
```

### 3.2 Causa Secondaria: Assenza di .claudeignore

| Severità | 🟠 ALTO |
|----------|---------|
| **Problema** | Claude Code non sa quali directory ignorare |
| **Impatto** | Scansiona inutilmente node_modules, .next, build output |
| **Soluzione** | Creare `.claudeignore` con pattern appropriati |

### 3.3 Causa Terziaria: Operazioni Intensive su Windows

| Severità | 🟡 MEDIO |
|----------|---------|
| **Problema** | Windows file system più lento per molti file piccoli |
| **Impatto** | Timeout durante scansioni recursive |
| **Evidenza** | PowerShell commands con wildcards possono bloccarsi |

---

## 4. Soluzioni Proposte

### Soluzione A: Creare .claudeignore (PRIORITÀ 1)

**Effort:** Minimo (5 minuti)
**Impatto:** Riduce file scansionati da 101,935 a ~1,000

**Creare file `.claudeignore` nella root del progetto:**

```gitignore
# Node.js - CRITICO: 48,725+ file da ignorare
node_modules/
**/node_modules/

# Next.js build output
.next/
out/

# Build artifacts
dist/
build/
coverage/

# Cache
.cache/
*.cache
.turbo/

# IDE/Editor
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Capacitor build (mobile)
android/
ios/

# Test output
playwright-report/
test-results/

# Temporary files
*.tmp
*.temp
```

### Soluzione B: Aggiungere al .gitignore esistente (se .claudeignore non supportato)

Se la versione di Claude Code non supporta `.claudeignore`, verificare che `.gitignore` sia completo.

### Soluzione C: Spostare Progetto in Directory con Path Corto

| Da | A |
|-----|-----|
| `C:\Users\marin\Downloads\TournamentMaster` | `C:\Dev\TournamentMaster` |

Path più corti = meno overhead su Windows.

### Soluzione D: Pulire Cache e File Temporanei

```powershell
# Rimuovi cache Next.js
Remove-Item -Recurse -Force "C:\Users\marin\Downloads\TournamentMaster\frontend\.next"

# Rimuovi cache node
Remove-Item -Recurse -Force "C:\Users\marin\Downloads\TournamentMaster\frontend\node_modules\.cache"

# Rimuovi Turbo cache
Remove-Item -Recurse -Force "C:\Users\marin\Downloads\TournamentMaster\frontend\.turbo"
```

---

## 5. Piano di Implementazione Immediato

### Fase 1: Quick Fix (ORA - 5 minuti)

| Step | Azione | Comando |
|------|--------|---------|
| 1.1 | Crea .claudeignore | Vedi contenuto sopra |
| 1.2 | Verifica gitignore | Assicurati node_modules sia ignorato |
| 1.3 | Testa nuova sessione | Avvia Claude Code e prova operazioni |

### Fase 2: Pulizia (Opzionale - 10 minuti)

| Step | Azione | Impatto |
|------|--------|---------|
| 2.1 | Elimina .next folder | -506 file, rigenera al prossimo `npm run dev` |
| 2.2 | Elimina cache turbo | Riduce ulteriormente |
| 2.3 | Sposta in path corto | Migliora performance Windows |

---

## 6. Verifica Post-Implementazione

### Checklist
- [ ] File `.claudeignore` creato nella root
- [ ] Testata ricerca file (`Glob("src/**/*.tsx")`)
- [ ] Testata ricerca testo (`Grep("import", "src/")`)
- [ ] Sessione Claude Code stabile per 30+ minuti
- [ ] Nessuna interruzione durante operazioni normali

### Metriche di Successo

| Metrica | Prima | Obiettivo |
|---------|-------|-----------|
| File scansionati | 101,935 | <2,000 |
| Interruzioni/sessione | ~1-2 | 0 |
| Tempo risposta Glob | Timeout | <2s |

---

## 7. Best Practices per Progetti Next.js con Claude Code

### 7.1 Struttura Directory Consigliata

```
project/
├── .claudeignore          # ← SEMPRE presente
├── .gitignore
├── frontend/
│   ├── src/               # ← Claude lavora QUI
│   └── node_modules/      # ← Ignorato
└── backend/
    ├── src/               # ← Claude lavora QUI
    └── node_modules/      # ← Ignorato
```

### 7.2 Pattern di Lavoro Sicuri

**✅ CORRETTO - Scansioni mirate:**
```
Glob("frontend/src/**/*.tsx")
Grep("useEffect", "frontend/src/")
```

**❌ SBAGLIATO - Scansioni troppo ampie:**
```
Glob("**/*.tsx")           # Include node_modules!
Grep("import", ".")        # Scansiona TUTTO!
```

### 7.3 Comandi da Evitare

| Comando | Problema | Alternativa |
|---------|----------|-------------|
| `find . -name "*.ts"` | Include node_modules | `find src -name "*.ts"` |
| `grep -r "pattern" .` | Troppi file | `grep -r "pattern" src/` |
| `ls -laR` | Output enorme | `ls -la src/` |

---

## 8. APPENDICE: Analisi Rischi Applicazione

*(Mantenuta dalla versione precedente del documento)*

### 8.1 Rischi Tecnici Identificati

| ID | Rischio | Severità | Note |
|----|---------|----------|------|
| R01 | Node.js 24 (non LTS) | 🔴 CRITICO | Bleeding edge |
| R02 | Turbopack instabile | 🟠 ALTO | Beta bundler |
| R03 | React 19 canary | 🟡 MEDIO | Sperimentale |

### 8.2 Rischi Sicurezza

| ID | Rischio | Severità | Note |
|----|---------|----------|------|
| R04 | Token JWT in localStorage | 🔴 CRITICO | Vulnerabile XSS |
| R05 | Assenza refresh token | 🟡 MEDIO | UX degradata |
| R06 | No rate limiting API | 🟠 ALTO | DoS possibile |

### 8.3 Rischi Qualità

| ID | Rischio | Severità | Note |
|----|---------|----------|------|
| R10 | Nessun test backend | 🔴 CRITICO | 0% coverage |
| R11 | Nessun test unitario frontend | 🔴 CRITICO | Solo E2E |

*(Vedi documento dettagliato per analisi completa)*

---

## 9. Riferimenti

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [.claudeignore Syntax](https://docs.anthropic.com/claude-code/configuration)
- [Next.js Project Structure](https://nextjs.org/docs/app/building-your-application)
- [Windows Path Length Limitations](https://docs.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation)

---

## 10. Changelog Documento

| Data | Versione | Modifica |
|------|----------|----------|
| 2026-01-05 | 1.0 | Prima versione (problema Next.js) |
| 2026-01-05 | 2.0 | **CORREZIONE**: problema è Claude Code, non Next.js |
| 2026-01-05 | 2.1 | Aggiunta analisi dimensioni progetto (101,935 file) |

---

**Documento creato da:** Claude Code
**Ultima modifica:** 2026-01-06 00:15
