# Guida Installazione TournamentMaster con Docker

**Versione:** 1.0
**Data:** 29 Dicembre 2025
**Applicazione:** TournamentMaster - Piattaforma gestione tornei pesca sportiva

---

## Indice

1. [Requisiti di Sistema](#1-requisiti-di-sistema)
2. [Installazione Docker](#2-installazione-docker)
3. [Preparazione del Server](#3-preparazione-del-server)
4. [Deploy dell'Applicazione](#4-deploy-dellapplicazione)
5. [Configurazione](#5-configurazione)
6. [Avvio e Verifica](#6-avvio-e-verifica)
7. [Configurazione Dominio e SSL](#7-configurazione-dominio-e-ssl)
8. [Backup e Manutenzione](#8-backup-e-manutenzione)
9. [Troubleshooting](#9-troubleshooting)
10. [Aggiornamenti](#10-aggiornamenti)

---

## 1. Requisiti di Sistema

### Hardware Minimo

| Risorsa | Minimo | Raccomandato |
|---------|--------|--------------|
| CPU | 2 core | 4 core |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| Banda | 100 Mbps | 1 Gbps |

### Sistema Operativo Supportato

- Ubuntu 20.04 LTS o superiore (raccomandato)
- Debian 11 o superiore
- CentOS 8 / Rocky Linux 8
- Windows Server 2019+ con WSL2

### Porte Necessarie

| Porta | Servizio | Note |
|-------|----------|------|
| 22 | SSH | Accesso remoto |
| 80 | HTTP | Redirect a HTTPS |
| 443 | HTTPS | Traffico web |
| 3000 | Frontend | Solo interno Docker |
| 3001 | Backend API | Solo interno Docker |
| 3306 | Database | Solo interno Docker |

---

## 2. Installazione Docker

### Ubuntu/Debian

```bash
# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Installa prerequisiti
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Aggiungi chiave GPG Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Aggiungi repository Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installa Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Avvia Docker
sudo systemctl start docker
sudo systemctl enable docker

# Aggiungi utente al gruppo docker (evita sudo)
sudo usermod -aG docker $USER

# Ricarica gruppi (o logout/login)
newgrp docker
```

### CentOS/Rocky Linux

```bash
# Installa prerequisiti
sudo yum install -y yum-utils

# Aggiungi repository Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Installa Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Avvia Docker
sudo systemctl start docker
sudo systemctl enable docker

# Aggiungi utente al gruppo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Verifica Installazione

```bash
# Verifica versione Docker
docker --version
# Output atteso: Docker version 24.x.x

# Verifica Docker Compose
docker compose version
# Output atteso: Docker Compose version v2.x.x

# Test Docker
docker run hello-world
# Output atteso: "Hello from Docker!"
```

---

## 3. Preparazione del Server

### 3.1 Crea Utente Dedicato (Opzionale ma Raccomandato)

```bash
# Crea utente
sudo adduser tournamentmaster

# Aggiungi a gruppo docker
sudo usermod -aG docker tournamentmaster

# Passa all'utente
sudo su - tournamentmaster
```

### 3.2 Crea Directory Progetto

```bash
# Crea directory
sudo mkdir -p /opt/tournamentmaster
sudo chown $USER:$USER /opt/tournamentmaster
cd /opt/tournamentmaster
```

### 3.3 Installa Git

```bash
# Ubuntu/Debian
sudo apt install -y git

# CentOS
sudo yum install -y git
```

---

## 4. Deploy dell'Applicazione

### Opzione A: Clone da Repository Git

```bash
cd /opt/tournamentmaster

# Clone repository (sostituisci URL)
git clone https://github.com/tuouser/tournamentmaster.git .

# Verifica struttura
ls -la
# Deve mostrare: backend/, frontend/, docker-compose.yml
```

### Opzione B: Upload Manuale (SFTP/SCP)

```bash
# Dal tuo PC locale, copia i file
scp -r /path/to/tournamentmaster/* user@server:/opt/tournamentmaster/

# Oppure usa FileZilla/WinSCP per upload via SFTP
```

### Opzione C: Download da Archivio

```bash
cd /opt/tournamentmaster

# Scarica archivio (se disponibile)
wget https://example.com/tournamentmaster-v1.0.tar.gz

# Estrai
tar -xzf tournamentmaster-v1.0.tar.gz
rm tournamentmaster-v1.0.tar.gz
```

### Verifica Struttura

```bash
ls -la /opt/tournamentmaster/
```

Output atteso:
```
drwxr-xr-x  backend/
drwxr-xr-x  frontend/
-rw-r--r--  docker-compose.yml
-rw-r--r--  .env.example
-rw-r--r--  .dockerignore
```

---

## 5. Configurazione

### 5.1 Crea File Environment

```bash
cd /opt/tournamentmaster

# Copia template
cp .env.example .env

# Edita configurazione
nano .env
```

### 5.2 Contenuto File .env

```bash
# ============================================
# DATABASE (lascia default per Docker interno)
# ============================================
# Non modificare se usi il database Docker interno

# ============================================
# STRIPE (Pagamenti)
# ============================================
# Ottieni da: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxx

# ============================================
# ANTHROPIC (Claude AI - Opzionale)
# ============================================
# Ottieni da: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxx
```

### 5.3 Configurazione Production (docker-compose.yml)

Per un deploy in production, modifica `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Cambia i target da `development` a `production`:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production    # <-- Cambia da development
    # ...
    # Rimuovi o commenta la sezione volumes per hot reload:
    # volumes:
    #   - ./backend:/app
    #   - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production    # <-- Cambia da development
    # ...
    # Rimuovi o commenta la sezione volumes:
    # volumes:
    #   - ./frontend:/app
    #   - /app/node_modules
    #   - /app/.next
```

### 5.4 Configura JWT Secrets (IMPORTANTE per Production)

Genera secrets sicuri:

```bash
# Genera JWT_SECRET (256 bit)
openssl rand -base64 32
# Output esempio: K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=

# Genera JWT_REFRESH_SECRET
openssl rand -base64 32
```

Modifica `docker-compose.yml` sezione backend environment:

```yaml
backend:
  environment:
    JWT_SECRET: "K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols="
    JWT_REFRESH_SECRET: "altro-secret-generato-qui"
```

---

## 6. Avvio e Verifica

### 6.1 Build delle Immagini

```bash
cd /opt/tournamentmaster

# Build (prima volta: 5-15 minuti)
docker compose build

# Output atteso:
# [+] Building 180.5s (25/25) FINISHED
# => [backend] ...
# => [frontend] ...
```

### 6.2 Avvio Servizi

```bash
# Avvia in background
docker compose up -d

# Output atteso:
# [+] Running 4/4
# ✔ Container tournamentmaster-db        Started
# ✔ Container tournamentmaster-redis     Started
# ✔ Container tournamentmaster-backend   Started
# ✔ Container tournamentmaster-frontend  Started
```

### 6.3 Verifica Status

```bash
# Stato container
docker compose ps

# Output atteso:
# NAME                        STATUS              PORTS
# tournamentmaster-db         Up (healthy)        0.0.0.0:3306->3306/tcp
# tournamentmaster-backend    Up                  0.0.0.0:3001->3001/tcp
# tournamentmaster-frontend   Up                  0.0.0.0:3000->3000/tcp
# tournamentmaster-redis      Up                  0.0.0.0:6379->6379/tcp
```

### 6.4 Verifica Logs

```bash
# Tutti i logs
docker compose logs

# Solo backend (utile per debug)
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend

# Ultimi 100 log
docker compose logs --tail=100
```

### 6.5 Test Funzionamento

```bash
# Test Backend API
curl http://localhost:3001/api/health
# Output atteso: {"status":"ok"} o simile

# Test Frontend
curl -I http://localhost:3000
# Output atteso: HTTP/1.1 200 OK

# Test Database
docker compose exec database mysql -uroot -proot -e "SHOW DATABASES;"
# Output atteso: lista database incluso 'tournamentmaster'
```

### 6.6 Accesso Iniziale

Apri nel browser:
- **Frontend:** http://IP_SERVER:3000
- **API:** http://IP_SERVER:3001/api

Credenziali default (dal seed):
- **Admin:** admin@ischiafishing.it / demo123
- **Giudice:** giudice@ischiafishing.it / demo123

---

## 7. Configurazione Dominio e SSL

### 7.1 Installa Nginx (Reverse Proxy)

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS
sudo yum install -y nginx

# Avvia Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7.2 Configura Virtual Host

```bash
sudo nano /etc/nginx/sites-available/tournamentmaster
```

Contenuto:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tuodominio.com www.tuodominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name tuodominio.com www.tuodominio.com;

    # SSL (verranno configurati da Certbot)
    ssl_certificate /etc/letsencrypt/live/tuodominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tuodominio.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io (Real-time)
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # File upload size
    client_max_body_size 20M;
}
```

### 7.3 Attiva Configurazione

```bash
# Crea symlink
sudo ln -s /etc/nginx/sites-available/tournamentmaster /etc/nginx/sites-enabled/

# Rimuovi default (opzionale)
sudo rm /etc/nginx/sites-enabled/default

# Test configurazione
sudo nginx -t
# Output atteso: syntax is ok, test is successful

# Ricarica Nginx
sudo systemctl reload nginx
```

### 7.4 Installa SSL con Let's Encrypt

```bash
# Installa Certbot
sudo apt install -y certbot python3-certbot-nginx

# Ottieni certificato SSL
sudo certbot --nginx -d tuodominio.com -d www.tuodominio.com

# Segui le istruzioni interattive:
# - Inserisci email
# - Accetta termini
# - Scegli redirect HTTP -> HTTPS

# Verifica auto-rinnovo
sudo certbot renew --dry-run
```

### 7.5 Aggiorna Variabili Ambiente

Dopo aver configurato il dominio, aggiorna `docker-compose.yml`:

```yaml
backend:
  environment:
    FRONTEND_URL: https://tuodominio.com

frontend:
  environment:
    NEXT_PUBLIC_API_URL: https://tuodominio.com/api
    NEXT_PUBLIC_SOCKET_URL: https://tuodominio.com
```

Riavvia:

```bash
docker compose down
docker compose up -d
```

---

## 8. Backup e Manutenzione

### 8.1 Backup Database

```bash
# Backup manuale
docker compose exec database mysqldump -uroot -proot tournamentmaster > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compresso
docker compose exec database mysqldump -uroot -proot tournamentmaster | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 8.2 Script Backup Automatico

Crea `/opt/tournamentmaster/backup.sh`:

```bash
#!/bin/bash
# Script backup TournamentMaster

BACKUP_DIR="/opt/tournamentmaster/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Crea directory backup
mkdir -p $BACKUP_DIR

# Backup database
cd /opt/tournamentmaster
docker compose exec -T database mysqldump -uroot -proot tournamentmaster | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/lib/docker/volumes tournamentmaster_backend_uploads

# Elimina backup vecchi
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completato: $DATE"
```

Rendi eseguibile e schedula:

```bash
chmod +x /opt/tournamentmaster/backup.sh

# Aggiungi a crontab (backup giornaliero alle 3:00)
crontab -e
# Aggiungi:
0 3 * * * /opt/tournamentmaster/backup.sh >> /opt/tournamentmaster/backups/backup.log 2>&1
```

### 8.3 Restore Database

```bash
# Restore da backup
gunzip -c backup_20251229_030000.sql.gz | docker compose exec -T database mysql -uroot -proot tournamentmaster

# Oppure senza compressione
docker compose exec -T database mysql -uroot -proot tournamentmaster < backup.sql
```

### 8.4 Monitoraggio Risorse

```bash
# Risorse container in tempo reale
docker stats

# Spazio disco Docker
docker system df

# Cleanup immagini/container inutilizzati
docker system prune -a
```

### 8.5 Aggiornamento Certificati SSL

Let's Encrypt rinnova automaticamente, ma puoi forzare:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 9. Troubleshooting

### Problema: Container non si avvia

```bash
# Vedi logs dettagliati
docker compose logs [servizio]

# Esempio
docker compose logs backend
docker compose logs frontend
docker compose logs database
```

### Problema: Database "unhealthy"

```bash
# Verifica logs database
docker compose logs database

# Test connessione manuale
docker compose exec database mysqladmin ping -h localhost -uroot -proot

# Se corrotto, reset database (ATTENZIONE: perdi dati!)
docker compose down -v
docker compose up -d
```

### Problema: "Port already in use"

```bash
# Trova processo che usa la porta
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :3306

# Termina processo
sudo kill -9 [PID]

# Oppure cambia porte in docker-compose.yml
```

### Problema: "Permission denied" su volumes

```bash
# Fix permessi
sudo chown -R 1001:1001 /opt/tournamentmaster/backend/uploads
```

### Problema: Frontend non carica

```bash
# Verifica build frontend
docker compose logs frontend

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

### Problema: API restituisce errori

```bash
# Verifica variabili ambiente
docker compose exec backend printenv | grep -E "DATABASE|JWT|PORT"

# Verifica connessione database
docker compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('DB OK')).catch(e => console.error('DB ERROR:', e));
"
```

### Reset Completo

```bash
# Stop tutto
docker compose down

# Rimuovi volumi (ATTENZIONE: elimina database!)
docker compose down -v

# Rimuovi immagini
docker compose down --rmi all

# Rebuild da zero
docker compose build --no-cache
docker compose up -d
```

---

## 10. Aggiornamenti

### 10.1 Aggiornamento Applicazione

```bash
cd /opt/tournamentmaster

# Backup prima di aggiornare
./backup.sh

# Pull nuova versione
git pull origin main

# Rebuild e restart
docker compose build
docker compose up -d

# Verifica
docker compose ps
docker compose logs -f
```

### 10.2 Aggiornamento con Downtime Minimo

```bash
# Build nuove immagini senza fermare
docker compose build

# Restart veloce (pochi secondi downtime)
docker compose up -d --force-recreate
```

### 10.3 Rollback

```bash
# Torna a versione precedente
git checkout v1.0.0  # o commit hash

# Rebuild
docker compose build
docker compose up -d

# Restore database se necessario
gunzip -c backups/db_[data].sql.gz | docker compose exec -T database mysql -uroot -proot tournamentmaster
```

---

## Comandi Rapidi di Riferimento

```bash
# ==================== GESTIONE ====================
docker compose up -d          # Avvia tutti i servizi
docker compose down           # Ferma tutti i servizi
docker compose restart        # Riavvia tutti
docker compose ps             # Stato servizi

# ==================== LOGS ====================
docker compose logs -f        # Tutti i logs (follow)
docker compose logs backend   # Solo backend
docker compose logs --tail=50 # Ultimi 50 log

# ==================== BUILD ====================
docker compose build          # Build tutte le immagini
docker compose build backend  # Build solo backend
docker compose build --no-cache  # Build senza cache

# ==================== DATABASE ====================
docker compose exec database mysql -uroot -proot tournamentmaster
docker compose exec backend npx prisma studio  # GUI database
docker compose exec backend npx prisma migrate deploy  # Applica migrazioni

# ==================== SHELL ====================
docker compose exec backend sh    # Shell nel backend
docker compose exec frontend sh   # Shell nel frontend

# ==================== CLEANUP ====================
docker system prune -a        # Rimuovi tutto inutilizzato
docker volume prune           # Rimuovi volumi orfani
```

---

## Checklist Installazione

- [ ] Server con requisiti minimi soddisfatti
- [ ] Docker e Docker Compose installati
- [ ] Codice applicazione copiato in `/opt/tournamentmaster`
- [ ] File `.env` configurato con API keys
- [ ] `docker-compose.yml` configurato per production
- [ ] JWT secrets generati e configurati
- [ ] Build completato senza errori
- [ ] Container avviati e healthy
- [ ] Test API funzionante
- [ ] Test Frontend funzionante
- [ ] Nginx configurato come reverse proxy
- [ ] SSL certificato installato
- [ ] Backup automatico schedulato
- [ ] Firewall configurato (porte 80, 443 aperte)

---

## Supporto

Per problemi o domande:
1. Controlla i logs: `docker compose logs`
2. Consulta la sezione Troubleshooting
3. Verifica la documentazione Docker ufficiale

---

*Documento generato il 29 Dicembre 2025*
*TournamentMaster v1.0*
