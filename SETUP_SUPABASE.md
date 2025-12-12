# 🚀 SETUP RAPIDO SUPABASE - Inizia Ora!

## ⏱️ Tempo: 15 minuti

---

## STEP 1: Crea Account Supabase (3 min)

1. Vai su **https://supabase.com**
2. Click su **"Start your project"**
3. Sign up con GitHub / Email
4. Aspetta conferma email (1 min)

---

## STEP 2: Crea Nuovo Progetto (2 min)

1. Click **"New Project"**
2. Compila:
   - **Name:** `inkflow-crm`
   - **Database Password:** Scegli password forte (annotala!)
   - **Region:** Europe West (Ireland) - più vicino
   - **Plan:** Free (gratis!)
3. Click **"Create new project"**
4. ⏳ Aspetta ~2 minuti (setup database)

---

## STEP 3: Ottieni Chiavi API (1 min)

Quando il progetto è pronto:

1. Nella sidebar, vai su **Settings** (⚙️)
2. Click su **API**
3. Troverai:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys** > **anon public**: `eyJhbG...`

4. **COPIA QUESTE DUE CHIAVI!**

---

## STEP 4: Configura Progetto Locale (2 min)

### 4.1 Crea file `.env.local`

```bash
# Nella root del progetto, crea questo file:
/Users/giovannitrimarchiipad/Desktop/prova crm2/.env.local
```

### 4.2 Incolla le chiavi:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Sostituisci** `xxxxx` e `eyJ...` con le TUE chiavi vere!

---

## STEP 5: Esegui Schema SQL (5 min)

### 5.1 Apri SQL Editor in Supabase

1. Nella sidebar Supabase, vai su **SQL Editor**
2. Click su **"New query"**

### 5.2 Copia & Incolla Schema

1. Apri il file: `supabase_schema.sql` (nella root del progetto)
2. **Seleziona TUTTO** (Cmd+A / Ctrl+A)
3. **Copia** (Cmd+C / Ctrl+C)
4. **Incolla** nel SQL Editor di Supabase
5. Click su **"Run"** (▶️ in alto a destra)

### 5.3 Verifica

✅ Dovresti vedere: `Success. No rows returned`

Se vedi errori, scrivimi il messaggio!

---

## STEP 6: Verifica Tabelle (1 min)

1. Nella sidebar, vai su **Table Editor**
2. Dovresti vedere tutte le tabelle:
   - ✅ tenants
   - ✅ users
   - ✅ clients
   - ✅ appointments
   - ✅ courses
   - ✅ students
   - ✅ attendances
   - ✅ teaching_materials
   - ✅ course_payments

---

## STEP 7: Test Connessione (1 min)

### Riavvia server di sviluppo:

```bash
# Ferma Vite (Ctrl+C nel terminal)
# Riavvia:
npm run dev
```

### Apri Console Browser (F12)

Cerca nel log:
```
✅ Supabase connesso!
```

---

## ✅ FATTO! Database Pronto

Ora hai:
- ✅ Database PostgreSQL cloud
- ✅ Autenticazione pronta
- ✅ Storage sicuro
- ✅ API REST automatica
- ✅ Row Level Security attiva

---

## 🔥 Prossimi Step:

Una volta completato questo setup, dimmi **"Setup completato!"** e procediamo con:

1. **Migrazione dati** (localStorage → Supabase)
2. **Autenticazione reale** (login vero)
3. **Google Calendar** integration
4. **Deploy online**

---

## ⚠️ Problemi Comuni

### "Could not connect to database"
- Controlla che il progetto Supabase sia "Active" (verde)
- Verifica URL e Key in `.env.local`

### "Syntax error in SQL"
- Assicurati di aver copiato TUTTO il file SQL
- Riprova con "New query" pulita

### "RLS policy prevents access"
- Normale! Le policy proteggono i dati
- Appena implemento auth, funzionerà

---

**Hai problemi? Mandami screenshot e ti aiuto subito!** 🚀
