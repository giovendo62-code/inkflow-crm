# 🚀 Messa in Produzione di InkFlow CRM su Vercel

L'app è completa e pronta per essere pubblicata. Segui questi passaggi per averla online in pochi minuti.

## 1. Prerequisiti
- Un account GitHub (se non ne hai uno, crealo su [github.com](https://github.com)).
- Un account Vercel (accedi con GitHub su [vercel.com](https://vercel.com)).

## 2. Prepara il Codice (Git)
Apri il terminale del tuo editor e inizializza il repository se non lo hai fatto:

```bash
git init
git add .
git commit -m "Versione Finale InkFlow CRM"
```

Crea un nuovo repository su GitHub (chiamalo `inkflow-crm` o simile) e segui le istruzioni che ti dà GitHub per fare il push:

```bash
git remote add origin https://github.com/TUO_NOME_UTENTE/inkflow-crm.git
git push -u origin main
```

## 3. Deploy su Vercel
1. Vai sulla dashboard di Vercel e clicca **"Add New..."** -> **"Project"**.
2. Seleziona il repository `inkflow-crm` che hai appena creato e clicca **"Import"**.
3. Nella schermata di configurazione:
   - **Framework Preset:** Dovrebbe rilevare automaticamente `Vite`.
   - **Root Directory:** `./` (default).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).

## 4. Configurazione Variabili d'Ambiente (CRITICO)
Prima di cliccare "Deploy", espandi la sezione **Environment Variables** e aggiungi le seguenti chiavi (copia ESATTAMENTE questi valori):

**Chiave 1:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://smappspkfwamiyunaqsk.supabase.co`

**Chiave 2:**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYXBwc3BrZndhbWl5dW5hcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NjI0MTQsImV4cCI6MjA4MTEzODQxNH0.aiWz14LFiBiE-wdGhCdkn4XfzSlq85CGXz5IFZ3M-g0`

*Nota: Non copiare spazi extra all'inizio o alla fine.*

## 5. Lancia il Deploy
Clicca su **"Deploy"**. Vercel costruirà l'app. Se tutto va bene, in circa 1-2 minuti vedrai i fuochi d'artificio e il link alla tua app (es. `https://inkflow-crm.vercel.app`).

---

## 🚀 Primo Accesso e Inizializzazione (IMPORTANTE)
Una volta online, il database locale del browser (quello che hai usato finora per i test) sarà vuoto.

Per inizializzare il tuo utente Manager nel database reale (Supabase):
1. Apri l'app pubblicata.
2. Clicca su **"Accedi come Staff o Studente"**.
3. Inserisci Email: `manager@inkflow.com`
4. Lascia la **Password вуota**.
5. Clicca **Accedi**.

✅ Questo creerà automaticamente il tuo utente Manager nel cloud. Da quel momento potrai usare l'app, creare gli altri utenti (Artisti, Studenti) e gestire il tuo studio.

### Accesso Demo per il Team
Puoi fare lo stesso per inizializzare gli utenti di test:
- **Artista:** `artist@inkflow.com` (password vuota)
- **Studente:** `student@inkflow.com` (password vuota)

Buon lavoro con InkFlow! 🖤
