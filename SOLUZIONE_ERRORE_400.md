# 🔧 SOLUZIONE ERRORE 400: redirect_uri_mismatch

Questo errore significa che Google sta dicendo: *"Ehi, qualcuno sta provando a connettersi da un sito che non conosco!"*.

Dobbiamo dire a Google che `http://localhost:5173` è sicuro.

---

## 🚀 PASSO 1: Verifica il tuo indirizzo

Guarda la barra degli indirizzi del tuo browser mentre usi il CRM.
È:
- `http://localhost:5173` ?
- `http://127.0.0.1:5173` ?
- `http://localhost:3000` ?

Google è molto preciso: se usi `127.0.0.1` ma hai autorizzato `localhost`, **NON funzionerà**.

---

## 🚀 PASSO 2: Aggiungi TUTTE le varianti su Google

1.  Vai su **[Google Cloud Console > Credenziali](https://console.cloud.google.com/apis/credentials)**
2.  Clicca sulla matita ✏️ o sul nome del tuo **"ID client OAuth 2.0"** (quello che hai creato prima).
3.  Vai alla sezione **"Origini JavaScript autorizzate"** (NON "URI di reindirizzamento"!).

4.  **AGGIUNGI QUESTI 3 URL** (per essere sicuri al 100%):
    - `http://localhost:5173`
    - `http://127.0.0.1:5173`
    - `http://localhost`

    *(Clicca su "+ AGGIUNGI URI" per ognuno)*

5.  **Clicca su SALVA** (in fondo alla pagina).

---

## 🚀 PASSO 3: Svuota la Cache e Riprova

⚠️ **IMPORTANTE:** Google ci mette qualche minuto ad aggiornare le modifiche.

1.  Aspetta **1 minuto**.
2.  Nel tuo CRM, **ricarica la pagina** (F5 o Cmd+R).
3.  Prova di nuovo a cliccare su "Connetti Google Calendar".
4.  Se da ancora errore, prova ad aprire una **Navigazione in Incognito** e accedi al CRM da lì, questo forza Google a ricaricare le impostazioni.

---

## ❓ Se vedi ancora l'errore...

Mandami uno screenshot della sezione "Origini JavaScript autorizzate" della tua Cloud Console, così vedo se c'è qualche spazio vuoto o errore di battitura!
