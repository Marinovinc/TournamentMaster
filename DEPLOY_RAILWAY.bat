@echo off
title TournamentMaster - Deploy su Railway
color 0B

echo ============================================
echo    TournamentMaster - Deploy su Railway
echo ============================================
echo.

:: Step 1: Login
echo [STEP 1/5] Login su Railway
echo Si aprira' il browser per autenticarti...
echo.
railway login
if %errorlevel% neq 0 (
    echo.
    echo ERRORE: Login fallito. Riprova.
    pause
    exit /b 1
)
echo.
echo Login completato!
echo.

:: Step 2: Vai nella cartella backend
echo [STEP 2/5] Navigazione alla cartella backend
cd /d C:\Users\marin\Downloads\TournamentMaster\backend
echo Directory: %cd%
echo.

:: Step 3: Inizializza progetto
echo [STEP 3/5] Creazione progetto Railway
echo.
railway init
if %errorlevel% neq 0 (
    echo.
    echo NOTA: Se il progetto esiste gia', usa "railway link" per collegarlo.
)
echo.

:: Step 4: Aggiungi MySQL
echo [STEP 4/5] IMPORTANTE - Aggiungi Database MySQL
echo.
echo Devi aggiungere MySQL manualmente dalla Dashboard Railway:
echo.
echo 1. Vai su https://railway.app/dashboard
echo 2. Apri il progetto appena creato
echo 3. Clicca "+ New" (in alto a destra)
echo 4. Seleziona "Database" - "MySQL"
echo 5. Attendi che venga creato (1-2 minuti)
echo 6. Copia la variabile DATABASE_URL dalle impostazioni MySQL
echo.
echo Premi un tasto quando hai aggiunto MySQL...
pause
echo.

:: Step 5: Configura variabili
echo [STEP 5/5] Configurazione Variabili d'Ambiente
echo.
echo Eseguiro' i comandi per configurare le variabili...
echo.

railway variables set JWT_SECRET="tournamentmaster-production-secret-key-2026"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set JWT_REFRESH_EXPIRES_IN="30d"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://tournamentmaster.app"

echo.
echo NOTA: DATABASE_URL viene impostata automaticamente da Railway
echo quando colleghi il database MySQL al servizio.
echo.
echo Per collegare MySQL al backend:
echo 1. Dashboard Railway - progetto
echo 2. Clicca sul servizio backend
echo 3. Variables - "Add Reference"
echo 4. Seleziona MySQL - DATABASE_URL
echo.
pause

:: Step 6: Deploy
echo.
echo [DEPLOY] Avvio deploy...
echo.
railway up --detach

echo.
echo ============================================
echo    DEPLOY AVVIATO!
echo ============================================
echo.
echo Il deploy e' in corso. Controlla lo stato su:
echo https://railway.app/dashboard
echo.
echo Dopo il deploy, il tuo backend sara' disponibile su:
echo https://[nome-progetto].up.railway.app
echo.
echo Ricorda di aggiornare mobile/.env.production con il nuovo URL!
echo.
pause
