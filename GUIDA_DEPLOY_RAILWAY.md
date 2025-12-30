# Deploy TournamentMaster su Railway

## PASSO 1: Crea Account Railway

1. Vai su https://railway.app
2. Clicca "Login" → "Login with GitHub"
3. Autorizza Railway ad accedere al tuo GitHub

---

## PASSO 2: Crea Nuovo Progetto

1. Clicca "New Project"
2. Seleziona "Deploy from GitHub repo"
3. Cerca e seleziona `Marinovinc/TournamentMaster`
4. **IMPORTANTE**: Nella configurazione, imposta:
   - Root Directory: `backend`
   - (Railway rileverà automaticamente il Dockerfile)

---

## PASSO 3: Aggiungi Database MySQL

1. Nel progetto, clicca "New" → "Database" → "MySQL"
2. Railway creerà automaticamente un database
3. Copia la variabile `DATABASE_URL` che appare (es: `mysql://root:xxx@xxx.railway.internal:3306/railway`)

---

## PASSO 4: Configura Variabili d'Ambiente

Nel servizio backend, vai su "Variables" e aggiungi:

```
DATABASE_URL=<copia da MySQL service>
JWT_SECRET=tua-chiave-segreta-molto-lunga-almeno-32-caratteri
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NODE_ENV=production
PORT=3001
```

**Genera JWT_SECRET sicuro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## PASSO 5: Deploy

1. Railway farà automaticamente il build
2. Attendi che il deploy completi (2-3 minuti)
3. Clicca sul servizio → "Settings" → copia il "Public Domain" (es: `tournamentmaster-backend-production.up.railway.app`)

---

## PASSO 6: Verifica

Apri nel browser:
```
https://TUO-DOMINIO.up.railway.app/api/health
```

Dovresti vedere:
```json
{
  "status": "ok",
  "message": "TournamentMaster API is running",
  "environment": "production"
}
```

---

## PASSO 7: Comunicami l'URL

Una volta deployato, comunicami l'URL del backend (es: `https://xxx.up.railway.app`) e io aggiornerò l'app per usarlo.

---

## Costi Railway

- **Hobby Plan**: $5/mese (500 ore di esecuzione)
- **Trial**: $5 di credito gratuito per iniziare
- Il database MySQL è incluso

---

## Troubleshooting

### Errore "Build failed"
- Verifica che Root Directory sia `backend`
- Controlla i log di build per errori

### Errore "Database connection"
- Assicurati che DATABASE_URL sia copiato correttamente dal servizio MySQL
- Il formato deve essere: `mysql://user:pass@host:port/database`

### Errore "Port already in use"
- Railway imposta automaticamente PORT, non serve specificarlo manualmente

---

*Guida creata il 2025-12-30*
