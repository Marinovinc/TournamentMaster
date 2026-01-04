# Guida Tecnica: Esposizione Server Locale a Rete Esterna

**Versione:** 1.0.0
**Data:** 2026-01-03
**Contesto:** TournamentMaster - Test e Debug con Tester Esterni
**Ambiente:** Windows, Apache, Next.js (porta 3000), Node.js Backend (porta 3001)

---

## Indice

1. [Panoramica e Scenari](#1-panoramica-e-scenari)
2. [Tunneling Services](#2-tunneling-services)
   - [2.1 ngrok](#21-ngrok)
   - [2.2 Cloudflare Tunnel](#22-cloudflare-tunnel)
   - [2.3 localtunnel](#23-localtunnel)
   - [2.4 Tailscale Funnel](#24-tailscale-funnel)
3. [Port Forwarding Tradizionale](#3-port-forwarding-tradizionale)
4. [VPN Solutions](#4-vpn-solutions)
5. [Reverse Proxy con Apache](#5-reverse-proxy-con-apache)
6. [Configurazione Specifica TournamentMaster](#6-configurazione-specifica-tournamentmaster)
7. [Sicurezza e Best Practices](#7-sicurezza-e-best-practices)
8. [Troubleshooting](#8-troubleshooting)
9. [Confronto e Raccomandazioni](#9-confronto-e-raccomandazioni)

---

## 1. Panoramica e Scenari

### 1.1 Il Problema

Un server in rete privata (es. `192.168.1.74`) non è raggiungibile da Internet. I dispositivi esterni vedono solo l'IP pubblico del router, che non sa come instradare le richieste verso la macchina interna.

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  ROUTER (IP Pubblico: 85.42.xxx.xxx)                          │
│  - NAT: Traduce IP privati ↔ IP pubblico                      │
│  - Firewall: Blocca connessioni in ingresso non richieste     │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  RETE PRIVATA (192.168.1.0/24)                                │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │ PC Development  │  │ Altri dispositivi│                    │
│  │ 192.168.1.74    │  │ 192.168.1.x     │                     │
│  │ :3000 (Next.js) │  │                 │                     │
│  │ :3001 (Backend) │  │                 │                     │
│  └─────────────────┘  └─────────────────┘                     │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 Soluzioni Disponibili

| Metodo | Complessità | Sicurezza | Persistenza | Use Case |
|--------|-------------|-----------|-------------|----------|
| Tunneling (ngrok, Cloudflare) | Bassa | Alta | Temporanea | Test/Debug |
| Port Forwarding | Media | Media | Permanente | Staging |
| VPN (Tailscale, WireGuard) | Media | Molto Alta | Permanente | Team distribuito |
| Reverse Proxy Cloud | Alta | Alta | Permanente | Pre-produzione |

---

## 2. Tunneling Services

I servizi di tunneling creano un "ponte" sicuro tra il tuo server locale e un endpoint pubblico gestito dal provider.

### Architettura Tunneling

```
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│ Tester       │      │ Tunnel Provider  │      │ Tuo Server   │
│ Esterno      │ ───► │ (ngrok/CF/etc)   │ ───► │ localhost    │
│              │ HTTPS│                  │ WSS  │ :3000        │
└──────────────┘      └──────────────────┘      └──────────────┘

1. Il client tunnel sul tuo PC apre connessione OUTBOUND verso il provider
2. Il provider assegna un URL pubblico (es. abc123.ngrok.io)
3. Richieste all'URL pubblico vengono inoltrate al tuo localhost
4. Nessuna porta aperta sul router, nessuna configurazione firewall
```

---

### 2.1 ngrok

**Sito:** https://ngrok.com
**Prezzo:** Gratuito (con limiti) / $8+/mese (pro)

#### 2.1.1 Installazione

```powershell
# Opzione 1: winget (Windows 10/11)
winget install ngrok

# Opzione 2: Chocolatey
choco install ngrok

# Opzione 3: Download manuale
# Scarica da https://ngrok.com/download
# Estrai in una cartella nel PATH (es. C:\tools\ngrok\)
```

#### 2.1.2 Configurazione Iniziale

```powershell
# 1. Registrati su https://dashboard.ngrok.com/signup (gratis)

# 2. Copia il tuo authtoken dalla dashboard

# 3. Configura ngrok
ngrok config add-authtoken 2abc123def456ghi789jkl_EXAMPLE

# Il token viene salvato in:
# Windows: C:\Users\<username>\AppData\Local\ngrok\ngrok.yml
```

#### 2.1.3 Utilizzo Base

```powershell
# Esponi porta 3000 (Next.js)
ngrok http 3000

# Output:
# Session Status                online
# Account                       tuoemail@example.com (Plan: Free)
# Version                       3.5.0
# Region                        Europe (eu)
# Latency                       32ms
# Web Interface                 http://127.0.0.1:4040
# Forwarding                    https://a1b2c3d4.ngrok-free.app -> http://localhost:3000
```

#### 2.1.4 Opzioni Avanzate

```powershell
# Specifica regione (eu = Europa, riduce latenza)
ngrok http 3000 --region eu

# Dominio personalizzato (richiede piano a pagamento)
ngrok http 3000 --domain=tournamentmaster.ngrok.io

# Autenticazione HTTP Basic (proteggi l'accesso)
ngrok http 3000 --basic-auth="tester:password123"

# Ispeziona headers e richieste
ngrok http 3000 --inspect

# Esponi con hostname specifico (per cookie/CORS)
ngrok http 3000 --host-header=localhost:3000

# Timeout personalizzato
ngrok http 3000 --bind-tls=true
```

#### 2.1.5 Configurazione Multi-Tunnel (ngrok.yml)

```yaml
# C:\Users\<username>\AppData\Local\ngrok\ngrok.yml
version: "2"
authtoken: 2abc123def456ghi789jkl_EXAMPLE

tunnels:
  frontend:
    addr: 3000
    proto: http
    hostname: tm-frontend.ngrok.io  # Richiede piano pro

  backend:
    addr: 3001
    proto: http
    hostname: tm-backend.ngrok.io

  # Tunnel TCP per database (se necessario)
  database:
    addr: 3306
    proto: tcp
```

```powershell
# Avvia tutti i tunnel definiti
ngrok start --all

# Avvia solo frontend e backend
ngrok start frontend backend
```

#### 2.1.6 API e Webhook Inspector

ngrok fornisce un'interfaccia web locale per ispezionare tutte le richieste:

```
http://127.0.0.1:4040
```

Funzionalità:
- Visualizza tutte le richieste HTTP in tempo reale
- Ispeziona headers, body, response
- Replay delle richieste per debug
- Statistiche di latenza

#### 2.1.7 Limiti Piano Gratuito

| Limite | Valore |
|--------|--------|
| Sessioni contemporanee | 1 |
| Connessioni/minuto | 40 |
| Dominio | Random (cambia ad ogni riavvio) |
| Bandwidth | Illimitato |
| Interstitial page | Sì (pagina "Visit Site" per utenti) |

---

### 2.2 Cloudflare Tunnel

**Sito:** https://www.cloudflare.com/products/tunnel/
**Prezzo:** Gratuito (anche per uso commerciale)

#### 2.2.1 Vantaggi rispetto a ngrok

- Nessun limite di connessioni
- Nessuna pagina interstitial
- URL stabili (con account)
- Integrazione con Cloudflare CDN/WAF
- Zero Trust Access opzionale

#### 2.2.2 Installazione

```powershell
# Opzione 1: winget
winget install Cloudflare.cloudflared

# Opzione 2: Chocolatey
choco install cloudflared

# Opzione 3: Download diretto
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

#### 2.2.3 Quick Tunnel (Senza Account)

```powershell
# Tunnel temporaneo immediato (URL random)
cloudflared tunnel --url http://localhost:3000

# Output:
# 2024-01-03T10:00:00Z INF Starting tunnel
# 2024-01-03T10:00:01Z INF +-----------------------------------------------------------+
# 2024-01-03T10:00:01Z INF |  Your quick Tunnel has been created! Visit it at:        |
# 2024-01-03T10:00:01Z INF |  https://random-words-here.trycloudflare.com              |
# 2024-01-03T10:00:01Z INF +-----------------------------------------------------------+
```

#### 2.2.4 Tunnel Persistente (Con Account Cloudflare)

```powershell
# 1. Login a Cloudflare
cloudflared tunnel login
# Si apre browser per autenticazione OAuth

# 2. Crea tunnel con nome
cloudflared tunnel create tournamentmaster-dev

# Output: Created tunnel tournamentmaster-dev with id abc123-def456-...
# File credenziali salvato in: C:\Users\<user>\.cloudflared\abc123-def456.json

# 3. Configura routing DNS (richiede dominio su Cloudflare)
cloudflared tunnel route dns tournamentmaster-dev test.tuodominio.com

# 4. Crea file configurazione
# C:\Users\<user>\.cloudflared\config.yml
```

#### 2.2.5 Configurazione Avanzata (config.yml)

```yaml
# C:\Users\<user>\.cloudflared\config.yml

tunnel: abc123-def456-ghi789  # ID del tunnel
credentials-file: C:\Users\<user>\.cloudflared\abc123-def456.json

ingress:
  # Frontend Next.js
  - hostname: app.tuodominio.com
    service: http://localhost:3000

  # Backend API
  - hostname: api.tuodominio.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true

  # WebSocket per real-time
  - hostname: ws.tuodominio.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true
      # Mantieni connessione WebSocket
      connectTimeout: 30s

  # Catch-all (obbligatorio come ultima regola)
  - service: http_status:404
```

```powershell
# Avvia tunnel con configurazione
cloudflared tunnel run tournamentmaster-dev

# Oppure in background come servizio Windows
cloudflared service install
net start cloudflared
```

#### 2.2.6 Zero Trust Access (Autenticazione)

Cloudflare permette di proteggere i tunnel con autenticazione:

1. Vai su https://one.dash.cloudflare.com
2. Access → Applications → Add an Application
3. Configura policy (email, SSO, OTP)

```yaml
# config.yml con access policy
ingress:
  - hostname: app.tuodominio.com
    service: http://localhost:3000
    originRequest:
      access:
        required: true
        teamName: "tuo-team"
```

---

### 2.3 localtunnel

**Sito:** https://localtunnel.me
**Prezzo:** Gratuito (open source)

#### 2.3.1 Caratteristiche

- Semplicissimo da usare
- Nessuna registrazione
- Sottodominio personalizzabile
- Open source (puoi hostare il tuo server)

#### 2.3.2 Installazione e Utilizzo

```powershell
# Installa globalmente
npm install -g localtunnel

# Utilizzo base
lt --port 3000

# Output:
# your url is: https://random-string.loca.lt

# Con sottodominio personalizzato (se disponibile)
lt --port 3000 --subdomain tournamentmaster

# Output:
# your url is: https://tournamentmaster.loca.lt

# Con host locale specifico
lt --port 3000 --local-host 192.168.1.74
```

#### 2.3.3 Bypass Pagina Protezione

localtunnel mostra una pagina di conferma. Per bypassarla programmaticamente:

```javascript
// In richieste HTTP, aggiungi header:
headers: {
  'Bypass-Tunnel-Reminder': 'true'
}
```

#### 2.3.4 Self-Hosted localtunnel Server

```powershell
# Installa server
npm install -g localtunnel-server

# Avvia server (richiede dominio e certificato SSL)
lt-server --port 80 --domain tunnel.tuodominio.com
```

#### 2.3.5 Limiti

| Aspetto | Dettaglio |
|---------|-----------|
| Affidabilità | Media (server pubblici sovraccarichi) |
| Velocità | Variabile |
| Uptime | Non garantito |
| Sottodomini | Possono essere occupati |

---

### 2.4 Tailscale Funnel

**Sito:** https://tailscale.com/kb/1223/tailscale-funnel/
**Prezzo:** Gratuito (fino a 100 dispositivi)

#### 2.4.1 Cos'è Tailscale

Tailscale è una VPN mesh che crea una rete privata tra i tuoi dispositivi. Funnel espone un servizio di questa rete a Internet.

#### 2.4.2 Installazione

```powershell
# Download da https://tailscale.com/download/
# Oppure:
winget install tailscale
```

#### 2.4.3 Setup Iniziale

```powershell
# 1. Avvia Tailscale e fai login (Google/Microsoft/GitHub)
tailscale up

# 2. Verifica stato
tailscale status

# Output:
# 100.100.100.1   tuo-pc           tuoemail@gmail.com  windows  -
```

#### 2.4.4 Abilitare Funnel

```powershell
# Abilita Funnel per la porta 3000
tailscale funnel 3000

# Output:
# Available on the internet:
# https://tuo-pc.tailnet-name.ts.net/
#     |-- proxy http://127.0.0.1:3000

# Funnel su porta specifica esterna
tailscale funnel --bg 443 http://localhost:3000

# Verifica stato
tailscale funnel status
```

#### 2.4.5 Configurazione Avanzata

```powershell
# Esponi percorso specifico
tailscale funnel --bg --set-path=/api 3001

# Risultato:
# https://tuo-pc.ts.net/     → localhost:3000
# https://tuo-pc.ts.net/api  → localhost:3001

# Disabilita Funnel
tailscale funnel --bg=false 3000
```

#### 2.4.6 Vantaggi Tailscale

- URL stabile e permanente
- HTTPS automatico con certificato valido
- Integrazione con ACL per controllo accessi
- Funziona anche da mobile

---

## 3. Port Forwarding Tradizionale

Il port forwarding configura il router per inoltrare le richieste su una porta specifica al tuo server interno.

### 3.1 Architettura

```
┌──────────────┐         ┌──────────────────────────────────┐
│ Tester       │         │ Router                           │
│ Esterno      │ ──────► │ IP Pubblico: 85.42.100.50        │
│              │ :3000   │                                  │
└──────────────┘         │ Port Forward:                    │
                         │ :3000 → 192.168.1.74:3000        │
                         └────────────────┬─────────────────┘
                                          │
                                          ▼
                         ┌──────────────────────────────────┐
                         │ Tuo Server                       │
                         │ 192.168.1.74:3000                │
                         └──────────────────────────────────┘
```

### 3.2 Configurazione Router

La procedura varia per marca. Esempi comuni:

#### 3.2.1 Router Generici (Interfaccia Web)

```
1. Accedi al router: http://192.168.1.1 (o 192.168.0.1)
2. Credenziali: admin/admin o admin/password (controlla etichetta router)
3. Cerca: "Port Forwarding", "Virtual Server", "NAT"
4. Aggiungi regola:
   - Nome: TournamentMaster-Frontend
   - Porta esterna: 3000
   - Porta interna: 3000
   - IP interno: 192.168.1.74
   - Protocollo: TCP
5. Salva e riavvia router se necessario
```

#### 3.2.2 Fritz!Box

```
1. Accedi a http://fritz.box
2. Internet → Abilitazioni → Abilitazioni porte
3. Nuovo dispositivo → Seleziona 192.168.1.74
4. Nuova abilitazione:
   - Applicazione: Altra applicazione
   - Denominazione: TournamentMaster
   - Protocollo: TCP
   - Porta da/a: 3000
   - Porta interna: 3000
5. OK → Applica
```

#### 3.2.3 Netgear

```
1. Accedi a http://routerlogin.net
2. Advanced → Advanced Setup → Port Forwarding
3. Add Custom Service:
   - Service Name: TournamentMaster
   - Protocol: TCP
   - External Port Range: 3000-3000
   - Internal IP: 192.168.1.74
   - Internal Port Range: 3000-3000
4. Apply
```

#### 3.2.4 TP-Link

```
1. Accedi a http://tplinkwifi.net
2. Advanced → NAT Forwarding → Virtual Servers
3. Add:
   - Service Type: Custom
   - External Port: 3000
   - Internal IP: 192.168.1.74
   - Internal Port: 3000
   - Protocol: TCP
4. Save
```

### 3.3 Configurare IP Statico sulla Macchina

Per evitare che il DHCP cambi l'IP del server:

#### Windows (PowerShell come Admin)

```powershell
# Trova nome interfaccia di rete
Get-NetAdapter

# Configura IP statico
New-NetIPAddress -InterfaceAlias "Ethernet" `
    -IPAddress 192.168.1.74 `
    -PrefixLength 24 `
    -DefaultGateway 192.168.1.1

# Configura DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" `
    -ServerAddresses 8.8.8.8, 8.8.4.4
```

#### Oppure via GUI

```
1. Pannello di controllo → Rete e Internet → Centro connessioni
2. Clicca sulla connessione attiva → Proprietà
3. Protocollo Internet versione 4 (TCP/IPv4) → Proprietà
4. Usa il seguente indirizzo IP:
   - IP: 192.168.1.74
   - Subnet: 255.255.255.0
   - Gateway: 192.168.1.1
5. DNS: 8.8.8.8, 1.1.1.1
```

### 3.4 Gestire IP Pubblico Dinamico (DDNS)

La maggior parte delle connessioni domestiche ha IP pubblico che cambia. Usa un servizio DDNS:

#### 3.4.1 No-IP (Gratuito)

```
1. Registrati su https://www.noip.com
2. Crea hostname: tournamentmaster.ddns.net
3. Scarica DUC (Dynamic Update Client)
4. Configura con le tue credenziali
5. DUC aggiorna automaticamente l'IP
```

#### 3.4.2 DuckDNS (Gratuito, Senza Limiti)

```powershell
# Registrati su https://www.duckdns.org (login con Google/GitHub)
# Crea dominio: tournamentmaster.duckdns.org
# Ottieni token

# Aggiorna IP manualmente
Invoke-WebRequest "https://www.duckdns.org/update?domains=tournamentmaster&token=TUO-TOKEN&ip="

# Automatizza con Task Scheduler (ogni 5 minuti)
```

#### 3.4.3 Cloudflare DDNS (Se hai dominio su Cloudflare)

```powershell
# Script PowerShell per aggiornare DNS
$headers = @{
    "Authorization" = "Bearer TUO_API_TOKEN"
    "Content-Type" = "application/json"
}

$ip = (Invoke-WebRequest -Uri "https://api.ipify.org").Content

$body = @{
    type = "A"
    name = "test.tuodominio.com"
    content = $ip
    ttl = 120
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records/RECORD_ID" `
    -Method PUT -Headers $headers -Body $body
```

### 3.5 Aprire Firewall Windows

```powershell
# PowerShell come Amministratore

# Apri porta 3000 in ingresso
New-NetFirewallRule -DisplayName "TournamentMaster Frontend" `
    -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Apri porta 3001 (backend)
New-NetFirewallRule -DisplayName "TournamentMaster Backend" `
    -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Verifica regole
Get-NetFirewallRule -DisplayName "TournamentMaster*" | Format-Table
```

### 3.6 Test Connettività

```powershell
# Verifica IP pubblico
(Invoke-WebRequest -Uri "https://api.ipify.org").Content

# Test porta aperta (da un altro dispositivo o servizio online)
# https://www.yougetsignal.com/tools/open-ports/
# https://canyouseeme.org/

# Test locale
Test-NetConnection -ComputerName localhost -Port 3000
```

---

## 4. VPN Solutions

Le VPN creano una rete privata virtuale, permettendo a utenti remoti di accedere come se fossero nella tua LAN.

### 4.1 Tailscale (Mesh VPN)

#### 4.1.1 Architettura

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Tester       │     │ Tailscale        │     │ Tuo Server   │
│ (con Tailscale)    │ Coordination     │     │ (con Tailscale)
│ 100.64.0.2   │ ◄──►│ Server           │◄──► │ 100.64.0.1   │
└──────────────┘     └──────────────────┘     └──────────────┘
        │                                              │
        └──────────────────────────────────────────────┘
                    Connessione P2P diretta
                    (WireGuard encrypted)
```

#### 4.1.2 Setup per Team di Test

```powershell
# 1. Installa Tailscale su tutti i dispositivi
# https://tailscale.com/download/

# 2. Ogni tester fa login con stesso metodo (es. Google Workspace)
tailscale up

# 3. Condividi l'IP Tailscale del tuo server
tailscale ip -4
# Output: 100.64.0.1

# 4. I tester accedono via:
# http://100.64.0.1:3000
```

#### 4.1.3 Sharing con External Users

```powershell
# Invita utenti esterni (senza login al tuo account)
# Dashboard → Users → Invite external users

# Oppure usa Tailscale Funnel per accesso pubblico (vedi sezione 2.4)
```

### 4.2 ZeroTier

**Sito:** https://www.zerotier.com
**Prezzo:** Gratuito (fino a 25 nodi)

#### 4.2.1 Setup

```powershell
# 1. Installa ZeroTier
winget install ZeroTier.ZeroTierOne

# 2. Crea network su https://my.zerotier.com
#    Ottieni Network ID (es. 8056c2e21c000001)

# 3. Unisciti al network
zerotier-cli join 8056c2e21c000001

# 4. Autorizza il dispositivo nella dashboard web

# 5. Verifica IP assegnato
zerotier-cli listnetworks
```

#### 4.2.2 Condivisione con Tester

```
1. Ogni tester installa ZeroTier
2. Si unisce allo stesso Network ID
3. Tu autorizzi ogni dispositivo nella dashboard
4. Tutti possono accedere via IP ZeroTier (es. 10.147.20.1:3000)
```

### 4.3 WireGuard (Self-Hosted)

#### 4.3.1 Requisiti

- VPS o server con IP pubblico
- Oppure port forwarding sul router (porta UDP 51820)

#### 4.3.2 Installazione Server

```powershell
# Su server con IP pubblico (Linux)
sudo apt install wireguard

# Genera chiavi
wg genkey | tee privatekey | wg pubkey > publickey

# Configura /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <server-private-key>
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.0.0.2/32

# Avvia
sudo wg-quick up wg0
```

#### 4.3.3 Client Windows

```powershell
# Scarica da https://www.wireguard.com/install/

# Crea tunnel con configurazione:
[Interface]
PrivateKey = <client-private-key>
Address = 10.0.0.2/24

[Peer]
PublicKey = <server-public-key>
Endpoint = <server-ip>:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
```

---

## 5. Reverse Proxy con Apache

Se vuoi consolidare frontend e backend su un unico punto di ingresso.

### 5.1 Abilitare Moduli Necessari

```powershell
# Modifica httpd.conf (es. D:\xampp\apache\conf\httpd.conf)
# Decommenta:
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule ssl_module modules/mod_ssl.so
```

### 5.2 Configurazione VirtualHost

```apache
# httpd-vhosts.conf

<VirtualHost *:80>
    ServerName tournamentmaster.local

    # Logging
    ErrorLog "logs/tm-error.log"
    CustomLog "logs/tm-access.log" combined

    # Proxy Headers
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"

    # Frontend Next.js (porta 3000)
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Hot Module Replacement (HMR) WebSocket per sviluppo
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) ws://localhost:3000/$1 [P,L]
</VirtualHost>

<VirtualHost *:80>
    ServerName api.tournamentmaster.local

    # Backend API (porta 3001)
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    # WebSocket per Socket.io
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) ws://localhost:3001/$1 [P,L]
</VirtualHost>
```

### 5.3 Configurazione Unificata (Single VirtualHost)

```apache
<VirtualHost *:80>
    ServerName tournamentmaster.local

    ProxyPreserveHost On

    # API Backend - tutte le richieste /api/*
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    # Socket.io
    ProxyPass /socket.io http://localhost:3001/socket.io
    ProxyPassReverse /socket.io http://localhost:3001/socket.io

    # WebSocket upgrade
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /socket.io/(.*) ws://localhost:3001/socket.io/$1 [P,L]

    # Frontend - tutto il resto
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # HMR WebSocket
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://localhost:3000/$1 [P,L]
</VirtualHost>
```

### 5.4 Aggiungere HTTPS con Let's Encrypt

Se hai un dominio pubblico:

```powershell
# Installa win-acme
# https://www.win-acme.com/

# Esegui
wacs.exe

# Segui wizard per ottenere certificato
# I certificati vengono installati automaticamente in Apache
```

### 5.5 Esporre Apache con Tunnel

```powershell
# Dopo aver configurato Apache come reverse proxy
# Esponi la porta 80 invece delle singole porte

ngrok http 80

# Oppure
cloudflared tunnel --url http://localhost:80
```

---

## 6. Configurazione Specifica TournamentMaster

### 6.1 Architettura TournamentMaster

```
┌─────────────────────────────────────────────────────────────┐
│ TournamentMaster Stack                                       │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐  │
│  │ Next.js      │     │ Express.js   │     │ MySQL       │  │
│  │ Frontend     │────►│ Backend      │────►│ Database    │  │
│  │ :3000        │     │ :3001        │     │ :3306       │  │
│  └──────────────┘     └──────────────┘     └─────────────┘  │
│         │                    │                               │
│         │    Socket.io       │                               │
│         └────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Variabili d'Ambiente per Tunnel

Quando usi un tunnel, l'URL pubblico cambia. Aggiorna le variabili:

```env
# frontend/.env.local

# Per sviluppo locale
NEXT_PUBLIC_API_URL=http://localhost:3001

# Per tunnel ngrok (sostituisci con URL reale)
NEXT_PUBLIC_API_URL=https://abc123-backend.ngrok-free.app

# Oppure usa variabile dinamica
NEXT_PUBLIC_API_URL=${TUNNEL_BACKEND_URL:-http://localhost:3001}
```

```env
# backend/.env

# CORS - aggiungi URL tunnel
CORS_ORIGINS=http://localhost:3000,https://abc123-frontend.ngrok-free.app

# URL frontend per redirect
FRONTEND_URL=https://abc123-frontend.ngrok-free.app
```

### 6.3 Script di Avvio Completo

```powershell
# START_TUNNELS.ps1

Write-Host "=== TournamentMaster Tunnel Starter ===" -ForegroundColor Cyan

# Verifica ngrok installato
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "Errore: ngrok non installato" -ForegroundColor Red
    exit 1
}

# Avvia backend
Write-Host "Avvio Backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c cd backend && npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 3

# Avvia frontend
Write-Host "Avvio Frontend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c cd frontend && npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 5

# Avvia tunnel frontend
Write-Host "Avvio Tunnel Frontend (3000)..." -ForegroundColor Green
Start-Process -FilePath "ngrok" -ArgumentList "http 3000 --log stdout" -RedirectStandardOutput "tunnel_frontend.log"

# Avvia tunnel backend
Write-Host "Avvio Tunnel Backend (3001)..." -ForegroundColor Green
Start-Process -FilePath "ngrok" -ArgumentList "http 3001 --log stdout" -RedirectStandardOutput "tunnel_backend.log"

Start-Sleep -Seconds 3

# Mostra URL dei tunnel
Write-Host "`n=== TUNNEL URLs ===" -ForegroundColor Cyan
$tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
foreach ($tunnel in $tunnels.tunnels) {
    Write-Host "$($tunnel.name): $($tunnel.public_url)" -ForegroundColor Green
}

Write-Host "`nCondividi questi URL con i tester!" -ForegroundColor Yellow
Write-Host "Inspector: http://localhost:4040" -ForegroundColor Gray
```

### 6.4 Configurazione ngrok.yml per TournamentMaster

```yaml
# C:\Users\<user>\AppData\Local\ngrok\ngrok.yml

version: "2"
authtoken: TUO_AUTH_TOKEN
region: eu

tunnels:
  tm-frontend:
    addr: 3000
    proto: http
    inspect: true
    # host_header: localhost:3000  # Decommentare se problemi CORS

  tm-backend:
    addr: 3001
    proto: http
    inspect: true
```

```powershell
# Avvia entrambi i tunnel
ngrok start tm-frontend tm-backend
```

### 6.5 Gestione CORS con Tunnel

```typescript
// backend/src/index.ts o app.ts

import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Aggiungi pattern per ngrok
  /https:\/\/.*\.ngrok-free\.app$/,
  /https:\/\/.*\.trycloudflare\.com$/,
  /https:\/\/.*\.loca\.lt$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Permetti richieste senza origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Controlla whitelist
    const isAllowed = allowedOrigins.some(allowed =>
      typeof allowed === 'string'
        ? allowed === origin
        : allowed.test(origin)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

---

## 7. Sicurezza e Best Practices

### 7.1 Checklist Sicurezza

| Aspetto | Raccomandazione | Implementazione |
|---------|-----------------|-----------------|
| Autenticazione Tunnel | Usa HTTP Basic Auth | `ngrok http 3000 --basic-auth="user:pass"` |
| HTTPS Obbligatorio | Mai HTTP in produzione | Tunnels forniscono HTTPS automatico |
| Token/Credenziali | Mai nel codice | Usa `.env` e `.gitignore` |
| Dati Sensibili | Maschera in log | Configura logger per escludere PII |
| Rate Limiting | Previeni abuse | Express rate-limit già configurato |
| Timeout Tunnel | Chiudi quando non serve | Script di stop |

### 7.2 Protezione con Password (ngrok)

```powershell
# Autenticazione HTTP Basic
ngrok http 3000 --basic-auth="tester:SecurePass123!"

# Gli utenti vedranno prompt di login nel browser
```

### 7.3 Protezione con OAuth (Cloudflare Access)

```yaml
# Configurazione Cloudflare Zero Trust
# Dashboard: https://one.dash.cloudflare.com

# 1. Crea Application
# 2. Configura policy:
#    - Allow: email ends with @tuaazienda.com
#    - Allow: specific emails (tester1@email.com, tester2@email.com)
# 3. I tester devono autenticarsi prima di accedere
```

### 7.4 Limitare Accesso per IP

```powershell
# Con ngrok (richiede piano business)
ngrok http 3000 --cidr-allow="203.0.113.0/24"

# Con Cloudflare Access
# Configura IP whitelist nella dashboard
```

### 7.5 Script di Stop Sicuro

```powershell
# STOP_TUNNELS.ps1

Write-Host "Stopping all tunnels..." -ForegroundColor Yellow

# Termina processi ngrok
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force

# Termina processi cloudflared
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

# Termina processi Node (frontend/backend)
# ATTENZIONE: questo termina TUTTI i processi Node!
# Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Tunnels stopped." -ForegroundColor Green
```

---

## 8. Troubleshooting

### 8.1 Problemi Comuni

#### "Tunnel not found" o "Connection refused"

```powershell
# Verifica che l'applicazione sia in ascolto
netstat -an | findstr "3000"
# Deve mostrare: TCP 0.0.0.0:3000 ... LISTENING

# Verifica che non ci siano conflitti di porta
netstat -ano | findstr "3000"
# Identifica PID e verifica processo
tasklist /FI "PID eq <PID>"
```

#### CORS Errors nel Browser

```javascript
// Console browser mostra:
// Access to fetch at 'https://xxx.ngrok-free.app' from origin 'https://yyy.ngrok-free.app'
// has been blocked by CORS policy

// Soluzione 1: Aggiorna CORS nel backend (vedi sezione 6.5)

// Soluzione 2: Usa stesso dominio per frontend e backend
// Configura reverse proxy o usa path-based routing
```

#### WebSocket non funziona

```powershell
# Verifica supporto WebSocket nel tunnel
# ngrok supporta WebSocket automaticamente
# Cloudflare: assicurati che WebSocket sia abilitato nella dashboard

# Test WebSocket
# Apri console browser su frontend e controlla:
# - Network tab → WS → Verifica connessione socket.io
```

#### Pagina Interstitial ngrok

```javascript
// Aggiungi header per bypassare (solo richieste programmatiche)
fetch(url, {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});
```

#### Tunnel Lento

```powershell
# Usa regione più vicina
ngrok http 3000 --region eu  # Europa

# Regioni disponibili: us, eu, ap, au, sa, jp, in
```

### 8.2 Diagnostica

```powershell
# Verifica stato ngrok
curl http://localhost:4040/api/tunnels

# Log dettagliati
ngrok http 3000 --log=stdout --log-level=debug

# Test connettività esterna
# Da un altro dispositivo (es. smartphone con dati mobili):
curl -I https://tuo-tunnel.ngrok-free.app
```

### 8.3 Log e Monitoraggio

```powershell
# ngrok Inspector (GUI)
# Apri: http://localhost:4040
# Visualizza tutte le richieste in tempo reale

# Salva log su file
ngrok http 3000 --log=stdout > ngrok.log 2>&1
```

---

## 9. Confronto e Raccomandazioni

### 9.1 Matrice di Confronto Completa

| Criterio | ngrok | Cloudflare | localtunnel | Tailscale | Port Forward |
|----------|-------|------------|-------------|-----------|--------------|
| **Setup Time** | 2 min | 1 min | 30 sec | 5 min | 15+ min |
| **Costo** | Free/Paid | Free | Free | Free | Free |
| **URL Stabile** | Paid | Sì | No | Sì | Sì* |
| **HTTPS** | Auto | Auto | Auto | Auto | Manuale |
| **Custom Domain** | Paid | Sì | No | No | Sì |
| **Bandwidth** | Illimitato | Illimitato | Limitato | Illimitato | Illimitato |
| **Affidabilità** | Alta | Molto Alta | Media | Alta | Alta |
| **Rate Limit** | 40/min free | No | Variabile | No | No |
| **Auth Built-in** | Sì | Sì (Zero Trust) | No | Sì (ACL) | No |
| **Persistenza** | Sessione | Permanente | Sessione | Permanente | Permanente |
| **WebSocket** | Sì | Sì | Sì | Sì | Sì |
| **Multi-tunnel** | Paid | Sì | Manuale | Sì | Sì |

*Con DDNS

### 9.2 Raccomandazioni per Scenario

#### Scenario: Demo veloce a cliente (1-2 ore)

**Soluzione consigliata: Cloudflare Quick Tunnel**

```powershell
cloudflared tunnel --url http://localhost:3000
# Condividi URL, zero configurazione
```

#### Scenario: Test con team distribuito (giorni/settimane)

**Soluzione consigliata: Tailscale**

```powershell
# Ogni tester installa Tailscale
# Tutti accedono via IP Tailscale stabile
# Zero configurazione router, funziona ovunque
```

#### Scenario: Beta testing con utenti esterni (settimane/mesi)

**Soluzione consigliata: Cloudflare Tunnel + Zero Trust**

```powershell
# Tunnel persistente con dominio personalizzato
# Autenticazione OAuth per utenti
# Analytics e protezione DDoS inclusi
```

#### Scenario: Staging pre-produzione

**Soluzione consigliata: Port Forwarding + DDNS + Let's Encrypt**

```
# Configurazione permanente
# Performance massima (no intermediari)
# Certificato SSL valido
```

### 9.3 Flowchart Decisionale

```
                    ┌─────────────────────┐
                    │ Devo esporre server │
                    │ locale all'esterno  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ È per test/debug    │
                    │ temporaneo?         │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │ SÌ             │                │ NO
              ▼                │                ▼
    ┌─────────────────┐        │      ┌─────────────────┐
    │ Servono URL     │        │      │ Ho accesso al   │
    │ stabili?        │        │      │ router?         │
    └────────┬────────┘        │      └────────┬────────┘
             │                 │               │
    ┌────────┼────────┐        │      ┌────────┼────────┐
    │ SÌ     │        │ NO     │      │ SÌ     │        │ NO
    ▼        │        ▼        │      ▼        │        ▼
┌────────┐   │   ┌────────┐    │  ┌────────┐   │   ┌────────┐
│Tailscale   │   │ngrok / │    │  │ Port   │   │   │VPS +   │
│o Cloudflare│   │Cloudflare   │  │Forward │   │   │Tunnel  │
│Tunnel  │   │   │Quick   │    │  │+ DDNS  │   │   │        │
└────────┘   │   └────────┘    │  └────────┘   │   └────────┘
             │                 │               │
             └─────────────────┴───────────────┘
```

---

## Appendice A: Comandi Rapidi

```powershell
# === NGROK ===
ngrok http 3000                              # Base
ngrok http 3000 --region eu                  # Europa
ngrok http 3000 --basic-auth="u:p"           # Con auth
ngrok start --all                            # Da config

# === CLOUDFLARE ===
cloudflared tunnel --url http://localhost:3000  # Quick
cloudflared tunnel run <nome>                   # Persistente

# === LOCALTUNNEL ===
lt --port 3000                               # Base
lt --port 3000 --subdomain myapp             # Custom

# === TAILSCALE ===
tailscale funnel 3000                        # Funnel
tailscale up                                 # VPN

# === DIAGNOSTICA ===
netstat -an | findstr "3000"                 # Porta in uso
curl http://localhost:4040/api/tunnels      # Stato ngrok
```

---

## Appendice B: Risorse Utili

- **ngrok Docs:** https://ngrok.com/docs
- **Cloudflare Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Tailscale Funnel:** https://tailscale.com/kb/1223/tailscale-funnel/
- **localtunnel GitHub:** https://github.com/localtunnel/localtunnel
- **WireGuard:** https://www.wireguard.com/quickstart/

---

**Fine Documento**

*Generato il 2026-01-03 per TournamentMaster*
