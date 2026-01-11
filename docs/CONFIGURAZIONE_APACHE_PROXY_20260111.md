# Configurazione Apache Reverse Proxy - TournamentMaster

**Data:** 2026-01-11
**Versione:** 1.0.0
**Autore:** Claude Code Session

---

## Obiettivo

Eliminare la porta 8088 (server PHP standalone) e configurare Apache come unico punto di accesso (porta 80) per tutti i servizi TournamentMaster.

---

## Architettura Finale

```
                    +------------------+
                    |   Browser/Client |
                    +--------+---------+
                             |
                             | porta 80
                             v
                    +------------------+
                    |     Apache       |
                    |  (Reverse Proxy) |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
         v                   v                   v
  /tournamentmaster/    /tm/api/*           /tm/*
         |                   |                   |
         v                   v                   v
  +-------------+    +---------------+    +---------------+
  | Static PHP  |    | Express.js    |    | Next.js       |
  | (htdocs)    |    | porta 3001    |    | porta 3000    |
  +-------------+    +---------------+    +---------------+
```

---

## URLs Finali

| Servizio | URL | Destinazione |
|----------|-----|--------------|
| Frontend | `http://localhost/tm/` | Next.js :3000 |
| Backend API | `http://localhost/tm/api/` | Express :3001 |
| Server Manager | `http://localhost/tournamentmaster/server_manager.html` | Apache htdocs |

---

## File Modificati

### 1. `D:\xampp\apache\conf\extra\httpd-proxy.conf`

Aggiunta configurazione reverse proxy:

```apache
# ===========================================
# TournamentMaster Reverse Proxy
# ===========================================
RewriteEngine On

# Redirect /tm (senza slash) -> /tm/it (default locale)
RewriteRule ^/tm$ /tm/it [R=302,L]

# WebSocket support per Next.js HMR (Hot Module Reload)
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/tm/(.*) ws://localhost:3000/tm/$1 [P,L]

# Backend API (Node.js Express su porta 3001)
ProxyPass /tm/api/ http://localhost:3001/api/
ProxyPassReverse /tm/api/ http://localhost:3001/api/

# Frontend (Next.js su porta 3000 con basePath /tm)
ProxyPass /tm/ http://localhost:3000/tm/
ProxyPassReverse /tm/ http://localhost:3000/tm/
```

### 2. `frontend/next.config.ts`

Aggiunto `basePath` per deployment sotto subpath:

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/tm",  // <-- AGGIUNTO
  experimental: {
    optimizePackageImports: ["@turf/turf"],
  },
};
```

### 3. `frontend/src/middleware.ts`

Cambiato `localePrefix` per compatibilita con basePath:

```typescript
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',  // Cambiato da 'as-needed'
});
```

**Motivazione:** Con `basePath` e `localePrefix: 'as-needed'`, la root path `/tm` restituiva 404. Usando `'always'`, tutte le route includono esplicitamente la locale (es. `/tm/it`, `/tm/en`).

### 4. `START_SERVER_MANAGER.bat`

Aggiornato per usare Apache invece del server PHP standalone:

```batch
@echo off
REM Apre la dashboard di gestione su Apache (porta 80)
start "" "http://localhost/tournamentmaster/server_manager.html"
```

---

## Porte Utilizzate

| Porta | Servizio | Accessibilita |
|-------|----------|---------------|
| 80 | Apache (proxy) | Pubblico |
| 3000 | Next.js Frontend | Solo interno |
| 3001 | Express Backend | Solo interno |
| ~~8088~~ | ~~PHP Server~~ | **ELIMINATA** |

---

## Routing Locale (next-intl)

Con `localePrefix: 'always'`:

| URL | Comportamento |
|-----|---------------|
| `/tm` | Redirect 302 -> `/tm/it` |
| `/tm/it` | Homepage italiana |
| `/tm/en` | Homepage inglese |
| `/tm/de` | Homepage tedesca |
| ... | Altre 24 lingue EU |

---

## Troubleshooting

### Problema: 404 su /tm

**Causa:** Middleware next-intl con `localePrefix: 'as-needed'` non gestisce correttamente basePath.

**Soluzione:** Cambiare a `localePrefix: 'always'` e aggiungere redirect Apache `/tm` -> `/tm/it`.

### Problema: CSS/JS non caricano

**Causa:** Next.js genera path assoluti senza basePath.

**Soluzione:** Aggiungere `basePath: "/tm"` in `next.config.ts`.

### Problema: WebSocket HMR non funziona in dev

**Causa:** Apache non proxy WebSocket di default.

**Soluzione:** Aggiungere regole RewriteCond per upgrade WebSocket (gia incluse sopra).

---

## Backup Creati

- `frontend/next.config.ts.BACKUP_20260111`
- `frontend/src/middleware.ts.BACKUP_20260111`

---

## Test Verifica

```bash
# Test redirect
curl -I http://localhost/tm
# Atteso: 302 -> /tm/it

# Test frontend
curl -I http://localhost/tm/it
# Atteso: 200 OK

# Test backend API
curl http://localhost/tm/api/health
# Atteso: {"status":"ok",...}
```

---

## Note

- Il Server Manager (`server_manager.html`) rimane in `htdocs/tournamentmaster/` servito direttamente da Apache
- Frontend e Backend girano internamente su 3000/3001 ma sono accessibili solo via proxy
- La configurazione supporta Hot Module Reload in development via WebSocket proxy
