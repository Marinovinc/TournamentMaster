# Guida Migrazione a Server Pubblico

## TournamentMaster - Da Rete Locale a Internet

Questa guida descrive le modifiche necessarie per passare dalla configurazione locale (192.168.1.74) a un server pubblico accessibile da Internet.

---

## Situazione Attuale (Rete Locale)

```
┌─────────────────────────────────────────────────────────┐
│                    RETE LOCALE                          │
│                                                         │
│  Telefono ──WiFi──► PC (192.168.1.74)                  │
│                     ├── Frontend :3000                  │
│                     └── Backend  :3001                  │
└─────────────────────────────────────────────────────────┘
```

**Limitazioni:**
- Funziona solo sulla stessa rete WiFi
- Richiede PC sempre acceso
- IP deve rimanere 192.168.1.74

---

## Situazione Futura (Server Pubblico)

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                           │
│                                                         │
│  Telefono ──4G/WiFi──► Cloud Server                    │
│                        ├── Frontend (Vercel/Netlify)   │
│                        └── Backend  (Railway/Render)   │
└─────────────────────────────────────────────────────────┘
```

**Vantaggi:**
- Accessibile da qualsiasi rete
- Server sempre online (99.9% uptime)
- Nessuna configurazione router necessaria

---

## Modifiche Richieste

### File 1: `frontend/.env.production`

**Posizione:** `frontend/.env.production`

**Prima (locale):**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.74:3001
```

**Dopo (server pubblico):**
```env
NEXT_PUBLIC_API_URL=https://tuo-backend.railway.app
```

> Sostituisci `tuo-backend.railway.app` con l'URL reale del tuo backend deployato.

---

### File 2: `frontend/capacitor.config.json`

**Posizione:** `frontend/capacitor.config.json`

**Prima (locale):**
```json
{
  "server": {
    "url": "http://192.168.1.74:3000",
    "cleartext": true
  }
}
```

**Dopo (server pubblico):**
```json
{
  "server": {
    "url": "https://tuo-frontend.vercel.app",
    "cleartext": false
  }
}
```

> **Nota:** `cleartext: false` perché HTTPS non richiede traffico in chiaro.

---

### File 3: `.github/workflows/build-mobile.yml`

**Posizione:** `.github/workflows/build-mobile.yml`

**Prima (locale):**
```yaml
env:
  NEXT_PUBLIC_API_URL: 'http://192.168.1.74:3001'
```

**Dopo (server pubblico):**
```yaml
env:
  NEXT_PUBLIC_API_URL: 'https://tuo-backend.railway.app'
```

---

## Procedura Completa di Migrazione

### Step 1: Deploy Backend

1. Crea account su [Railway](https://railway.app) o [Render](https://render.com)
2. Collega il repository GitHub
3. Configura le variabili d'ambiente:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=tuo-secret-sicuro
   NODE_ENV=production
   ```
4. Deploya e ottieni l'URL (es. `https://tournamentmaster-api.railway.app`)

### Step 2: Deploy Frontend

1. Crea account su [Vercel](https://vercel.com) o [Netlify](https://netlify.com)
2. Collega il repository GitHub (cartella `frontend`)
3. Configura la variabile d'ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://tournamentmaster-api.railway.app
   ```
4. Deploya e ottieni l'URL (es. `https://tournamentmaster.vercel.app`)

### Step 3: Aggiorna i File

Modifica i 3 file come descritto sopra con gli URL ottenuti.

### Step 4: Commit e Push

```bash
git add -A
git commit -m "chore: migrate to production servers"
git push origin master
```

### Step 5: Scarica Nuovo APK

1. Attendi che GitHub Actions completi il build (~6 minuti)
2. Vai su: https://github.com/Marinovinc/TournamentMaster/releases
3. Scarica il nuovo `app-debug.apk`
4. Installa sul telefono (sostituisce la versione precedente)

---

## Checklist Migrazione

- [ ] Backend deployato e funzionante
- [ ] Frontend deployato e funzionante
- [ ] `frontend/.env.production` aggiornato
- [ ] `frontend/capacitor.config.json` aggiornato
- [ ] `.github/workflows/build-mobile.yml` aggiornato
- [ ] Commit e push effettuato
- [ ] GitHub Actions build completato
- [ ] Nuovo APK scaricato e installato
- [ ] Test app da rete mobile (non WiFi) funzionante

---

## Hosting Consigliati

### Backend (Node.js + Prisma)

| Servizio | Piano Gratuito | Note |
|----------|----------------|------|
| [Railway](https://railway.app) | $5 credito/mese | Facile, PostgreSQL incluso |
| [Render](https://render.com) | 750 ore/mese | Ottimo per hobby |
| [Fly.io](https://fly.io) | 3 VM gratuite | Più tecnico |

### Frontend (Next.js)

| Servizio | Piano Gratuito | Note |
|----------|----------------|------|
| [Vercel](https://vercel.com) | Illimitato hobby | Creatori di Next.js |
| [Netlify](https://netlify.com) | 100GB banda/mese | Alternativa valida |
| [Cloudflare Pages](https://pages.cloudflare.com) | Illimitato | Molto veloce |

### Database (PostgreSQL)

| Servizio | Piano Gratuito | Note |
|----------|----------------|------|
| [Supabase](https://supabase.com) | 500MB | PostgreSQL + Auth |
| [Neon](https://neon.tech) | 512MB | Serverless PostgreSQL |
| [Railway](https://railway.app) | Incluso nel piano | Stesso provider del backend |

---

## Esempio URL Finali

Dopo la migrazione, i tuoi URL potrebbero essere:

```
Frontend: https://tournamentmaster.vercel.app
Backend:  https://tournamentmaster-api.railway.app
Database: postgresql://user:pass@db.railway.app:5432/tournamentmaster
```

---

## Rollback (Tornare a Locale)

Se vuoi tornare alla configurazione locale:

1. Ripristina i 3 file con i valori originali (192.168.1.74)
2. Commit e push
3. Scarica nuovo APK
4. Usa `AVVIA_SERVER.bat` sul PC

---

## Domande Frequenti

### Devo pagare per l'hosting?
No, tutti i servizi consigliati hanno piani gratuiti sufficienti per un'app piccola/media.

### L'APK cambia?
Sì, devi scaricare e reinstallare l'APK dopo la migrazione.

### Posso avere entrambe le versioni?
Sì, puoi creare due APK diversi (uno locale, uno pubblico) con `appId` diversi.

### Il database locale viene migrato?
No, devi esportare i dati da SQLite e importarli nel nuovo PostgreSQL.

---

*Documento creato il 2025-12-30*
*TournamentMaster v1.0.2*
