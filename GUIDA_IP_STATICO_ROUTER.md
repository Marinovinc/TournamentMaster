# Configurazione IP Statico per TournamentMaster

## Perche' serve IP statico?

L'app mobile cerca il server all'indirizzo `192.168.1.74`. Se il router assegna un IP diverso al PC, l'app non funziona.

---

## Metodo 1: Prenotazione DHCP nel Router (Consigliato)

### Passo 1: Trova il MAC Address del PC

Apri Prompt dei comandi e digita:
```
ipconfig /all
```

Cerca "Indirizzo fisico" della scheda WiFi, es: `A4-B1-C2-D3-E4-F5`

### Passo 2: Accedi al Router

1. Apri browser e vai su `192.168.1.1` (o `192.168.0.1`)
2. Login (spesso admin/admin o scritto sotto il router)

### Passo 3: Trova "DHCP Reservation" o "Prenotazione IP"

Cerca in:
- LAN Settings → DHCP
- Network → DHCP Server
- Advanced → IP Reservation

### Passo 4: Aggiungi Prenotazione

- MAC Address: `A4-B1-C2-D3-E4-F5` (quello del tuo PC)
- IP Address: `192.168.1.74`
- Salva

### Passo 5: Riavvia

Riavvia il PC o esegui:
```
ipconfig /release
ipconfig /renew
```

---

## Metodo 2: IP Statico su Windows

### Passo 1: Apri Impostazioni Rete

1. Premi `Win + I` → Rete e Internet
2. Clicca su WiFi → la tua rete → Proprieta'

### Passo 2: Configura IP Manuale

1. Scorri a "Assegnazione IP" → Modifica
2. Seleziona "Manuale"
3. Abilita IPv4
4. Compila:
   - Indirizzo IP: `192.168.1.74`
   - Subnet mask: `255.255.255.0`
   - Gateway: `192.168.1.1` (indirizzo del router)
   - DNS preferito: `8.8.8.8`
   - DNS alternativo: `8.8.4.4`
5. Salva

---

## Verifica

Apri Prompt dei comandi:
```
ipconfig
```

Deve mostrare:
```
Indirizzo IPv4. . . . . . . . . : 192.168.1.74
```

---

## Troubleshooting

### "IP gia' in uso"
Un altro dispositivo ha gia' quell'IP. Cambia l'IP nell'app o libera l'IP sul router.

### "Nessuna connessione internet"
- Verifica che il Gateway sia corretto (indirizzo del router)
- Verifica che il DNS sia corretto (8.8.8.8)

### "L'app non si connette"
1. Verifica che il server sia avviato (`AVVIA_SERVER.bat`)
2. Verifica che il telefono sia sulla stessa rete WiFi
3. Prova: `http://192.168.1.74:3001/health` dal browser del telefono

---

*Guida creata il 2025-12-30*
