# 🔍 VERIFICA RAPIDA GOOGLE CALENDAR

## ✅ Checklist Pre-Test

Prima di testare, verifica questi punti:

### 1. File .env.local
```bash
# Apri il file
cat .env.local | grep GOOGLE
```

**Dovresti vedere:**
```
VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

**❌ Se vedi solo:**
```
VITE_GOOGLE_CLIENT_ID=
```
→ **PROBLEMA:** Client ID non configurato. Segui la GUIDA_GOOGLE_CALENDAR.md

---

### 2. Server Dev Riavviato

**Dopo aver modificato .env.local, DEVI riavviare il server:**

```bash
# Ferma il server (Ctrl+C nel terminale)
# Poi riavvia:
npm run dev
```

**⚠️ IMPORTANTE:** Le variabili d'ambiente vengono caricate solo all'avvio!

---

### 3. Google Cloud Console

**Vai su:** https://console.cloud.google.com

**Verifica:**
- [ ] Progetto creato (es: "InkFlow CRM Calendar")
- [ ] Google Calendar API abilitata
- [ ] Schermata consenso OAuth configurata
- [ ] ID client OAuth creato (tipo "Applicazione web")
- [ ] Origini JavaScript: `http://localhost:5173` aggiunto

---

## 🧪 TEST MANUALE

### Test 1: Verifica Caricamento Script

1. **Apri l'app:** http://localhost:5173
2. **Login come Manager**
3. **Vai su "Operatori"**
4. **Apri Console Browser** (F12 o Cmd+Option+I)
5. **Vai su tab "Console"**

**Dovresti vedere:**
```
Initializing Google Calendar Service...
Google Script Loaded. Initializing Token Client...
Token Client Initialized Ready.
```

**❌ Se vedi:**
```
CRITICAL: VITE_GOOGLE_CLIENT_ID is missing or too short!
```
→ Client ID non configurato correttamente

---

### Test 2: Click Connetti Google Calendar

1. **Nella pagina Operatori**
2. **Click su "📅 Connetti Google Calendar"**

**Cosa dovrebbe succedere:**
- Si apre popup Google
- Ti chiede di selezionare account
- Ti chiede di autorizzare l'app

**❌ Se non si apre popup:**
- Controlla se il browser ha bloccato il popup (icona nella barra indirizzi)
- Consenti popup per localhost:5173

**❌ Se vedi errore "redirect_uri_mismatch":**
- Vai su Google Cloud Console
- Credenziali → OAuth Client ID
- Aggiungi `http://localhost:5173` in "Origini JavaScript autorizzate"

---

### Test 3: Autorizzazione Completata

**Dopo aver cliccato "Consenti" nel popup Google:**

**Nella Console Browser dovresti vedere:**
```
Access token received: ya29.a0AfB_...
Fetching Google Calendars...
Google Calendars loaded: [...]
```

**Nella UI dovresti vedere:**
```
✅ Google Calendar connesso con successo!
```

**❌ Se vedi errore:**
- Controlla la Console Browser per dettagli
- Verifica che l'ambito `calendar` sia configurato in Google Cloud

---

## 🐛 DEBUG AVANZATO

### Verifica Client ID in Runtime

**Nella Console Browser (F12), scrivi:**
```javascript
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

**Dovresti vedere:**
```
Client ID: 123456789-abc123.apps.googleusercontent.com
```

**❌ Se vedi `undefined` o stringa vuota:**
→ Server non riavviato dopo modifica .env.local

---

### Verifica Token Salvato

**Dopo connessione riuscita, nella Console Browser:**
```javascript
console.log('Token:', localStorage.getItem('google_access_token'));
```

**Dovresti vedere:**
```
Token: ya29.a0AfB_byC...
```

**❌ Se vedi `null`:**
→ Autenticazione non completata

---

### Test Chiamata API Manuale

**Nella Console Browser (dopo connessione):**
```javascript
const token = localStorage.getItem('google_access_token');
fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Calendari:', data.items));
```

**Dovresti vedere:**
```
Calendari: [
  { id: 'primary', summary: 'tua-email@gmail.com', ... },
  ...
]
```

**❌ Se vedi errore 401:**
→ Token scaduto o non valido

**❌ Se vedi errore 403:**
→ API non abilitata o ambiti mancanti

---

## 📊 STATO CONFIGURAZIONE

### ✅ Tutto OK se vedi:

1. **Console Browser:**
   ```
   ✅ Initializing Google Calendar Service...
   ✅ Google Script Loaded
   ✅ Token Client Initialized Ready
   ✅ Access token received
   ✅ Google Calendars loaded
   ```

2. **UI:**
   ```
   ✅ Google Calendar connesso con successo!
   ✅ Calendario: primary
   ```

3. **LocalStorage:**
   ```
   ✅ google_access_token: ya29.a0AfB_...
   ```

---

### ❌ Problemi Comuni

| Errore | Causa | Soluzione |
|--------|-------|-----------|
| `VITE_GOOGLE_CLIENT_ID is missing` | .env.local non configurato | Aggiungi Client ID e riavvia server |
| `redirect_uri_mismatch` | URL non autorizzato | Aggiungi localhost:5173 in Google Cloud |
| `access_denied` | Utente ha rifiutato | Riprova e clicca "Consenti" |
| `popup_closed_by_user` | Popup chiuso prima di completare | Riprova |
| `Failed to load Google GIS script` | Rete o AdBlock | Controlla connessione, disabilita AdBlock |
| Token `undefined` | Server non riavviato | Riavvia con `npm run dev` |

---

## 🎯 PROSSIMI PASSI

**Se tutti i test passano:**

1. **Associa calendario a un artista:**
   - Modifica un operatore
   - Seleziona calendario Google dal dropdown

2. **Crea appuntamento di test:**
   - Vai su "Calendario"
   - Crea nuovo appuntamento per l'artista
   - Verifica che appaia nel Google Calendar

3. **Controlla Google Calendar:**
   - Apri https://calendar.google.com
   - Verifica che l'evento sia stato creato

---

## 📞 SUPPORTO

**Se hai ancora problemi dopo questa verifica:**

1. **Copia l'output della Console Browser** (tutti gli errori in rosso)
2. **Fai screenshot della configurazione Google Cloud**
3. **Condividi il contenuto di .env.local** (oscura le chiavi sensibili)

E ti aiuto a risolvere! 🚀
