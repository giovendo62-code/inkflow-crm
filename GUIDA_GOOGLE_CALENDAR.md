# 📅 GUIDA CONFIGURAZIONE GOOGLE CALENDAR
### Setup Completo in 10 Minuti

---

## 🎯 COSA FAREMO

Configureremo l'integrazione di Google Calendar per permettere ai Manager di:
- ✅ Connettere il proprio account Google
- ✅ Associare calendari Google agli Artisti
- ✅ Creare automaticamente appuntamenti nel calendario Google

---

## 📋 PREREQUISITI

- Account Google (Gmail)
- Progetto InkFlow CRM funzionante
- 10 minuti di tempo

---

## 🎯 PARTE 1: Accesso a Google Cloud Console (2 minuti)

### Step 1.1: Vai su Google Cloud Console

**URL da aprire:**
```
https://console.cloud.google.com
```

**Cosa vedi:**
- Dashboard Google Cloud
- Menu hamburger (☰) in alto a sinistra
- Nome progetto in alto

**SE È LA PRIMA VOLTA:**
- Ti chiederà di accettare i Termini di Servizio
- Click su **"Accetta e continua"**

---

### Step 1.2: Crea Nuovo Progetto

**In alto, accanto a "Google Cloud":**
```
┌─────────────────────────────────┐
│  Google Cloud  ▼                │
│  [Nome Progetto Attuale]  ▼     │ ← CLICK QUI
└─────────────────────────────────┘
```

**Si apre popup:**
```
┌─────────────────────────────────────┐
│  Seleziona un progetto              │
│                                      │
│  [ 🔍 Cerca progetti ]               │
│                                      │
│  I miei progetti:                    │
│  • My First Project                  │
│  • Altro progetto...                 │
│                                      │
│  [ + NUOVO PROGETTO ]                │ ← CLICK QUI!
└─────────────────────────────────────┘
```

**CLICK SU:** `+ NUOVO PROGETTO`

---

### Step 1.3: Compila Dettagli Progetto

**Form che appare:**
```
┌──────────────────────────────────────┐
│  Nuovo progetto                      │
│                                       │
│  Nome progetto *                      │
│  [InkFlow CRM Calendar___________]   │ ← INSERISCI QUESTO
│                                       │
│  Organizzazione                       │
│  [Nessuna organizzazione      ▼]     │ ← LASCIA COSÌ
│                                       │
│  Località                             │
│  [Nessuna organizzazione      ▼]     │ ← LASCIA COSÌ
│                                       │
│  [ CREA ]                             │ ← CLICK QUANDO PRONTO
└──────────────────────────────────────┘
```

**COMPILA:**
- **Nome progetto:** `InkFlow CRM Calendar` (o qualsiasi nome)
- **Organizzazione:** Lascia "Nessuna organizzazione"
- **Località:** Lascia "Nessuna organizzazione"

**CLICK SU:** `CREA`

**ATTENDI** ~10 secondi mentre crea il progetto

---

## 🎯 PARTE 2: Abilita Google Calendar API (3 minuti)

### Step 2.1: Vai alla Libreria API

**Nel menu hamburger (☰) in alto a sinistra:**
```
┌─────────────────────────────┐
│  ☰  Google Cloud            │ ← CLICK QUI
│                              │
│  🏠 Home                     │
│  📊 Dashboard                │
│  🔧 API e servizi            │ ← ESPANDI QUESTO
│     • Libreria               │ ← POI CLICK QUI!
│     • Credenziali            │
│     • Schermata consenso     │
│  ...                         │
└─────────────────────────────┘
```

**PERCORSO:**
1. Click su **☰** (menu hamburger)
2. Scorri fino a **"API e servizi"**
3. Click su **"Libreria"**

---

### Step 2.2: Cerca Google Calendar API

**Nella pagina Libreria:**
```
┌─────────────────────────────────────────┐
│  Libreria API                           │
│                                          │
│  [ 🔍 Cerca API e servizi ]              │ ← CLICK E SCRIVI QUI
└─────────────────────────────────────────┘
```

**SCRIVI:** `Google Calendar API`

**Cosa vedi nei risultati:**
```
┌─────────────────────────────────────┐
│  📅 Google Calendar API             │ ← CLICK QUI!
│  Google                              │
│  Integrates with Google Calendar     │
└─────────────────────────────────────┘
```

**CLICK SU:** `Google Calendar API` (il primo risultato)

---

### Step 2.3: Abilita l'API

**Nella pagina Google Calendar API:**
```
┌─────────────────────────────────────────┐
│  Google Calendar API                    │
│                                          │
│  📅 Icona grande calendario              │
│                                          │
│  Displays, creates, and modifies         │
│  Google Calendar events                  │
│                                          │
│  [ ABILITA ]                             │ ← CLICK QUI!
└─────────────────────────────────────────┘
```

**CLICK SU:** `ABILITA` (pulsante blu)

**ATTENDI** ~5 secondi mentre abilita l'API

---

## 🎯 PARTE 3: Configura Schermata Consenso OAuth (3 minuti)

### Step 3.1: Vai a Schermata Consenso OAuth

**Nel menu laterale sinistro:**
```
┌─────────────────────────────┐
│  API e servizi              │
│                              │
│  • Panoramica                │
│  • Credenziali               │
│  • Schermata consenso OAuth  │ ← CLICK QUI!
│  • Libreria                  │
└─────────────────────────────┘
```

**CLICK SU:** `Schermata consenso OAuth`

---

### Step 3.2: Scegli Tipo Utente

**Cosa vedi:**
```
┌─────────────────────────────────────────┐
│  Tipo di utente                         │
│                                          │
│  ○ Interno                               │
│    Solo per utenti nella tua org        │
│                                          │
│  ⦿ Esterno                               │ ← SELEZIONA QUESTO
│    Disponibile a qualsiasi utente       │
│    con account Google                    │
│                                          │
│  [ CREA ]                                │ ← POI CLICK QUI
└─────────────────────────────────────────┘
```

**SELEZIONA:** `Esterno` (radio button)

**CLICK SU:** `CREA`

---

### Step 3.3: Compila Informazioni App (Parte 1)

**Form "Informazioni sull'app":**
```
┌──────────────────────────────────────────┐
│  Schermata consenso OAuth                │
│                                           │
│  Nome app *                               │
│  [InkFlow CRM___________________]        │ ← INSERISCI
│                                           │
│  Email assistenza utenti *                │
│  [tua-email@gmail.com___________]        │ ← TUA EMAIL
│                                           │
│  Logo app                                 │
│  [Carica logo]                            │ ← OPZIONALE (salta)
│                                           │
│  Domini autorizzati                       │
│  [____________________________]          │ ← LASCIA VUOTO
│                                           │
│  Email sviluppatore *                     │
│  [tua-email@gmail.com___________]        │ ← TUA EMAIL
│                                           │
│  [ SALVA E CONTINUA ]                     │ ← CLICK QUANDO PRONTO
└──────────────────────────────────────────┘
```

**COMPILA:**
1. **Nome app:** `InkFlow CRM`
2. **Email assistenza:** La tua email Gmail
3. **Logo:** Salta (opzionale)
4. **Domini:** Lascia vuoto
5. **Email sviluppatore:** La tua email Gmail

**CLICK SU:** `SALVA E CONTINUA`

---

### Step 3.4: Aggiungi Ambiti (Scopes)

**Pagina "Ambiti":**
```
┌──────────────────────────────────────────┐
│  Ambiti                                  │
│                                           │
│  [ + AGGIUNGI O RIMUOVI AMBITI ]          │ ← CLICK QUI!
└──────────────────────────────────────────┘
```

**CLICK SU:** `+ AGGIUNGI O RIMUOVI AMBITI`

**Si apre popup laterale:**
```
┌─────────────────────────────────────────────┐
│  Aggiorna ambiti selezionati                │
│                                              │
│  [ 🔍 Filtra ]                               │
│                                              │
│  ☑ .../auth/calendar                         │ ← SELEZIONA QUESTO!
│    View and edit events on all calendars    │
│                                              │
│  ☐ .../auth/calendar.readonly                │
│  ☐ .../auth/calendar.events                  │
│  ...                                         │
│                                              │
│  [ AGGIORNA ]                                │ ← POI CLICK QUI
└─────────────────────────────────────────────┘
```

**CERCA E SELEZIONA:**
- ☑ `https://www.googleapis.com/auth/calendar`

**CLICK SU:** `AGGIORNA`

**POI CLICK SU:** `SALVA E CONTINUA` (in fondo alla pagina)

---

### Step 3.5: Utenti di Test (Opzionale)

**Pagina "Utenti di test":**
```
┌──────────────────────────────────────────┐
│  Utenti di test                          │
│                                           │
│  [ + ADD USERS ]                          │ ← OPZIONALE
│                                           │
│  [ SALVA E CONTINUA ]                     │ ← CLICK QUI
└──────────────────────────────────────────┘
```

**OPZIONALE:** Aggiungi email di test se vuoi testare con altri account

**CLICK SU:** `SALVA E CONTINUA`

---

### Step 3.6: Riepilogo

**Pagina finale:**
```
┌──────────────────────────────────────────┐
│  Riepilogo                               │
│                                           │
│  ✅ Nome app: InkFlow CRM                 │
│  ✅ Email: tua-email@gmail.com            │
│  ✅ Ambiti: calendar                      │
│                                           │
│  [ TORNA ALLA DASHBOARD ]                 │ ← CLICK QUI
└──────────────────────────────────────────┘
```

**CLICK SU:** `TORNA ALLA DASHBOARD`

---

## 🎯 PARTE 4: Crea Credenziali OAuth (2 minuti)

### Step 4.1: Vai a Credenziali

**Nel menu laterale:**
```
┌─────────────────────────────┐
│  API e servizi              │
│                              │
│  • Panoramica                │
│  • Credenziali               │ ← CLICK QUI!
│  • Schermata consenso OAuth  │
└─────────────────────────────┘
```

**CLICK SU:** `Credenziali`

---

### Step 4.2: Crea Credenziali

**In alto nella pagina:**
```
┌─────────────────────────────────────┐
│  Credenziali                        │
│                                      │
│  [ + CREA CREDENZIALI ▼ ]           │ ← CLICK QUI!
└─────────────────────────────────────┘
```

**CLICK SU:** `+ CREA CREDENZIALI`

**Menu dropdown:**
```
┌─────────────────────────────┐
│  • Chiave API               │
│  • ID client OAuth          │ ← CLICK QUI!
│  • Account di servizio      │
└─────────────────────────────┘
```

**CLICK SU:** `ID client OAuth`

---

### Step 4.3: Configura ID Client OAuth

**Form "Crea ID client OAuth":**
```
┌──────────────────────────────────────────┐
│  Crea ID client OAuth                    │
│                                           │
│  Tipo di applicazione *                   │
│  [Applicazione web        ▼]             │ ← SELEZIONA QUESTO
│                                           │
│  Nome *                                   │
│  [InkFlow CRM Web Client_______]         │ ← INSERISCI
│                                           │
│  Origini JavaScript autorizzate           │
│  [ + AGGIUNGI URI ]                       │ ← CLICK E AGGIUNGI
│                                           │
│  URI di reindirizzamento autorizzati      │
│  [ + AGGIUNGI URI ]                       │ ← NON SERVE
│                                           │
│  [ CREA ]                                 │ ← CLICK QUANDO PRONTO
└──────────────────────────────────────────┘
```

**COMPILA:**

1. **Tipo:** Seleziona `Applicazione web`

2. **Nome:** `InkFlow CRM Web Client`

3. **Origini JavaScript autorizzate:**
   - Click `+ AGGIUNGI URI`
   - Inserisci: `http://localhost:5173`
   - Click `+ AGGIUNGI URI` di nuovo
   - Inserisci: `http://localhost:3000`
   - **SE HAI DOMINIO ONLINE**, aggiungi anche quello (es: `https://tuodominio.com`)

4. **URI di reindirizzamento:** LASCIA VUOTO (non serve per Google Identity Services)

**CLICK SU:** `CREA`

---

### Step 4.4: Copia Client ID

**Popup di conferma:**
```
┌──────────────────────────────────────────────────┐
│  Client OAuth creato                             │
│                                                   │
│  Il tuo ID client                                 │
│  ┌────────────────────────────────────────────┐  │
│  │ 123456789-abc123.apps.googleusercontent.com│  │ ← COPIA QUESTO!
│  │ [📋 Copia]                                  │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  Il tuo client secret                             │
│  ┌────────────────────────────────────────────┐  │
│  │ GOCSPX-xxxxxxxxxxxxxxxx                    │  │ ← NON SERVE
│  └────────────────────────────────────────────┘  │
│                                                   │
│  [ OK ]                                           │
└──────────────────────────────────────────────────┘
```

**IMPORTANTE:**
- **COPIA** il "Client ID" (quello lungo che finisce con `.apps.googleusercontent.com`)
- **NON SERVE** copiare il "Client Secret" per questa integrazione

**CLICK SU:** `📋 Copia` accanto al Client ID

**POI CLICK SU:** `OK`

---

## 🎯 PARTE 5: Configurazione Locale (.env.local)

### Step 5.1: Apri .env.local

**Nel tuo progetto:**
```
/Users/giovannitrimarchiipad/Desktop/prova crm2/.env.local
```

**APRI IL FILE** con il tuo editor (VS Code, TextEdit, ecc.)

---

### Step 5.2: Aggiungi Client ID

**Trova questa riga:**
```env
VITE_GOOGLE_CLIENT_ID=
```

**SOSTITUISCI CON:**
```env
VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

**⚠️ IMPORTANTE:** Usa il TUO Client ID copiato prima!

**ESEMPIO COMPLETO .env.local:**
```env
# Supabase
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar
VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

**SALVA IL FILE** (Cmd+S / Ctrl+S)

---

## 🎯 PARTE 6: Riavvia Applicazione

### Step 6.1: Ferma Server Dev

**Nel terminale dove gira `npm run dev`:**
```bash
Ctrl + C
```

**PREMI:** `Ctrl + C` per fermare il server

---

### Step 6.2: Riavvia Server

**Nel terminale:**
```bash
npm run dev
```

**ATTENDI** che si riavvii (~5 secondi)

---

## 🎯 PARTE 7: Test Connessione (2 minuti)

### Step 7.1: Apri Pagina Operatori

**Nel browser:**
```
http://localhost:5173
```

**NAVIGA A:**
- Login come Manager
- Vai su **"Operatori"** nel menu laterale

---

### Step 7.2: Connetti Google Calendar

**Nella pagina Operatori:**
```
┌─────────────────────────────────────┐
│  Operatori                          │
│                                      │
│  [ + Aggiungi Operatore ]            │
│                                      │
│  [ 📅 Connetti Google Calendar ]     │ ← CLICK QUI!
└─────────────────────────────────────┘
```

**CLICK SU:** `📅 Connetti Google Calendar`

---

### Step 7.3: Autorizza Accesso Google

**Si apre popup Google:**
```
┌─────────────────────────────────────────┐
│  Scegli un account                      │
│                                          │
│  📧 tua-email@gmail.com                  │ ← CLICK QUI
│  📧 altro-account@gmail.com              │
└─────────────────────────────────────────┘
```

**SELEZIONA** il tuo account Google

**POI:**
```
┌─────────────────────────────────────────┐
│  InkFlow CRM vuole accedere al tuo      │
│  Account Google                          │
│                                          │
│  Questo permetterà a InkFlow CRM di:    │
│  ✓ Visualizzare e modificare eventi     │
│    in tutti i tuoi calendari             │
│                                          │
│  [ Annulla ]  [ Consenti ]               │ ← CLICK QUI!
└─────────────────────────────────────────┘
```

**CLICK SU:** `Consenti`

---

### Step 7.4: Verifica Successo

**Cosa dovresti vedere:**
```
✅ Google Calendar connesso con successo!
```

**E nella lista operatori:**
```
┌─────────────────────────────────────┐
│  👤 Mario Rossi                     │
│  📅 Google Calendar: Connesso ✅     │
│  📆 Calendario: primary              │
└─────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE

Prima di dirmi "Setup completato!", verifica:

- [ ] Progetto Google Cloud creato
- [ ] Google Calendar API abilitata
- [ ] Schermata consenso OAuth configurata
- [ ] Ambito `calendar` aggiunto
- [ ] ID client OAuth creato (tipo "Applicazione web")
- [ ] Origini JavaScript autorizzate aggiunte (`http://localhost:5173`)
- [ ] Client ID copiato
- [ ] `.env.local` aggiornato con `VITE_GOOGLE_CLIENT_ID`
- [ ] Server dev riavviato
- [ ] Connessione Google Calendar testata con successo

---

## 🆘 RISOLUZIONE PROBLEMI

### ❌ "VITE_GOOGLE_CLIENT_ID mancante o non valido"

**CAUSA:** Client ID non configurato o troppo corto

**SOLUZIONE:**
1. Verifica che `.env.local` contenga `VITE_GOOGLE_CLIENT_ID=...`
2. Il Client ID deve finire con `.apps.googleusercontent.com`
3. Riavvia il server dev (`Ctrl+C` poi `npm run dev`)

---

### ❌ "redirect_uri_mismatch"

**CAUSA:** L'URL dell'app non è autorizzato

**SOLUZIONE:**
1. Vai su Google Cloud Console
2. Credenziali → Click sul tuo OAuth Client ID
3. Aggiungi `http://localhost:5173` in "Origini JavaScript autorizzate"
4. Salva e riprova

---

### ❌ "Access blocked: This app's request is invalid"

**CAUSA:** Schermata consenso OAuth non configurata correttamente

**SOLUZIONE:**
1. Vai su Google Cloud Console
2. API e servizi → Schermata consenso OAuth
3. Verifica che l'ambito `https://www.googleapis.com/auth/calendar` sia aggiunto
4. Salva e riprova

---

### ❌ Popup Google non si apre

**CAUSA:** Popup bloccato dal browser

**SOLUZIONE:**
1. Controlla la barra degli indirizzi per icona popup bloccato
2. Click e seleziona "Consenti sempre popup da questo sito"
3. Riprova

---

### ❌ "Failed to load Google GIS script"

**CAUSA:** Script Google bloccato o problema di rete

**SOLUZIONE:**
1. Controlla la connessione internet
2. Disabilita temporaneamente AdBlock/estensioni
3. Ricarica la pagina (F5)

---

## 📚 RISORSE UTILI

- **Google Cloud Console:** https://console.cloud.google.com
- **Google Calendar API Docs:** https://developers.google.com/calendar
- **OAuth 2.0 Playground:** https://developers.google.com/oauthplayground

---

## 🎉 PROSSIMI PASSI

Dopo aver completato questa guida:

1. **Testa la creazione eventi:**
   - Crea un appuntamento nel CRM
   - Verifica che appaia nel Google Calendar

2. **Associa calendari agli artisti:**
   - Vai su Operatori
   - Per ogni artista, seleziona il calendario Google da usare

3. **Verifica sincronizzazione:**
   - Crea appuntamento per un artista
   - Controlla che appaia nel calendario associato

---

**Quando hai finito tutti i passi, dimmi:**
**"Setup Google Calendar completato!"**

E testiamo insieme la sincronizzazione! 🚀
