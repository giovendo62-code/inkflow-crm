# 📅 RISOLUZIONE PROBLEMA GOOGLE CALENDAR

## 🔴 PROBLEMA ATTUALE

Il calendario Google **non funziona** perché manca la configurazione del **Google Client ID**.

---

## ✅ SOLUZIONE RAPIDA (3 PASSI)

### 1️⃣ Esegui lo script di verifica

```bash
./check_google_calendar.sh
```

Questo ti dirà esattamente cosa manca.

---

### 2️⃣ Segui la guida completa

Apri e segui passo-passo:

```
GUIDA_GOOGLE_CALENDAR.md
```

La guida include:
- ✅ Screenshot e istruzioni visive
- ✅ Ogni click spiegato in dettaglio
- ✅ Configurazione Google Cloud Console
- ✅ Setup OAuth e API
- ✅ Configurazione .env.local

**Tempo richiesto:** ~10 minuti

---

### 3️⃣ Verifica che funzioni

Dopo aver completato la guida:

```bash
# 1. Riavvia il server
# Nel terminale dove gira npm run dev:
Ctrl + C

# Poi riavvia:
npm run dev

# 2. Testa nell'app
# - Apri http://localhost:5173
# - Login come Manager
# - Vai su "Operatori"
# - Click "Connetti Google Calendar"
# - Autorizza con Google
```

---

## 📚 FILE DI SUPPORTO

| File | Descrizione |
|------|-------------|
| `GUIDA_GOOGLE_CALENDAR.md` | 📖 Guida completa passo-passo con screenshot |
| `VERIFICA_GOOGLE_CALENDAR.md` | 🔍 Troubleshooting e debug avanzato |
| `check_google_calendar.sh` | 🤖 Script automatico di verifica |

---

## 🎯 COSA DEVI FARE

1. **Crea progetto Google Cloud:**
   - Vai su https://console.cloud.google.com
   - Crea nuovo progetto "InkFlow CRM Calendar"

2. **Abilita Google Calendar API:**
   - Nella libreria API
   - Cerca "Google Calendar API"
   - Click "Abilita"

3. **Configura OAuth:**
   - Schermata consenso OAuth
   - Tipo: Esterno
   - Aggiungi ambito: `calendar`

4. **Crea credenziali:**
   - ID client OAuth
   - Tipo: Applicazione web
   - Origini JavaScript: `http://localhost:5173`
   - Copia il Client ID

5. **Configura .env.local:**
   ```env
   VITE_GOOGLE_CLIENT_ID=tuo-client-id.apps.googleusercontent.com
   ```

6. **Riavvia server:**
   ```bash
   npm run dev
   ```

---

## ⚠️ IMPORTANTE

**Dopo aver modificato `.env.local`, DEVI riavviare il server!**

Le variabili d'ambiente vengono caricate solo all'avvio di Vite.

```bash
# Ferma il server
Ctrl + C

# Riavvia
npm run dev
```

---

## 🆘 SERVE AIUTO?

1. **Esegui lo script di verifica:**
   ```bash
   ./check_google_calendar.sh
   ```

2. **Leggi la sezione troubleshooting:**
   - Apri `VERIFICA_GOOGLE_CALENDAR.md`
   - Cerca il tuo errore specifico

3. **Controlla la console del browser:**
   - Apri DevTools (F12)
   - Tab "Console"
   - Cerca errori in rosso

---

## 📊 STATO ATTUALE

```
✅ File googleCalendar.ts presente
✅ Server dev in esecuzione
❌ VITE_GOOGLE_CLIENT_ID non configurato ← DA FARE!
```

---

## 🚀 INIZIA QUI

**Apri la guida completa:**

```bash
# Su Mac:
open GUIDA_GOOGLE_CALENDAR.md

# O aprila con il tuo editor
code GUIDA_GOOGLE_CALENDAR.md
```

**Segui tutti i passi e poi testa!**

Buon lavoro! 🎉
