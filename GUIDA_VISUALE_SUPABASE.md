# 📸 GUIDA VISUALE SETUP SUPABASE
### Con Screenshot e Click Precisi

---

## 🎯 PARTE 1: Registrazione (3 minuti)

### Step 1.1: Vai su Supabase
```
URL: https://supabase.com
```

**Cosa vedi:**
- Homepage con "The Open Source Firebase Alternative"
- Pulsante verde **"Start your project"** in alto a destra

**CLICK SU:** `Start your project` (in alto a destra)

---

### Step 1.2: Scegli Metodo di Login

Verrai reindirizzato a: `https://supabase.com/dashboard/sign-in`

**Cosa vedi:**
```
┌─────────────────────────────────┐
│   Sign in to Supabase           │
│                                  │
│  [ Continue with GitHub    ]    │ ← CONSIGLIATO (più veloce)
│  [ Continue with Google    ]    │
│  [ Continue with Email     ]    │
│                                  │
└─────────────────────────────────┘
```

**SCELTA CONSIGLIATA:** GitHub (1 click, nessuna password da ricordare)

**CLICK SU:** `Continue with GitHub`

---

### Step 1.3: Autorizza Supabase (se usi GitHub)

**Cosa vedi:**
- Pagina GitHub che chiede permessi
- "Supabase wants to access your account"

**CLICK SU:** `Authorize Supabase` (pulsante verde)

---

### Step 1.4: Verifica Email (solo se usi Email)

Se hai scelto Email invece di GitHub:
1. Controlla inbox
2. Click su link di verifica
3. Conferma

---

## 🎯 PARTE 2: Creazione Progetto (5 minuti)

### Step 2.1: Dashboard Iniziale

**Cosa vedi dopo login:**
```
┌────────────────────────────────────────┐
│  Welcome to Supabase                   │
│                                         │
│  [ + New Project ]                     │ ← CLICK QUI!
│                                         │
│  Or join an existing organization      │
└────────────────────────────────────────┘
```

**CLICK SU:** `+ New Project` (pulsante blu)

---

### Step 2.2: Crea Organization (se richiesto)

**SE vedi richiesta "Create Organization":**
```
Organization name: InkFlow Studio
```

**CLICK SU:** `Create organization`

---

### Step 2.3: Compila Dettagli Progetto

**Form che appare:**
```
┌─────────────────────────────────────────┐
│  Create a new project                   │
│                                          │
│  Name *                                  │
│  [inkflow-crm____________]              │ ← INSERISCI QUESTO
│                                          │
│  Database Password *                     │
│  [●●●●●●●●●●●●●●●●●●●●]  [Generate]    │ ← CLICK Generate
│  ⚠️ SALVA QUESTA PASSWORD!               │
│                                          │
│  Region *                                │
│  [Europe (eu-west-1) ▼]                 │ ← SELEZIONA Europe
│                                          │
│  Pricing Plan                            │
│  ○ Free   $0/month                       │ ← SELEZIONA Free
│  ○ Pro    $25/month                      │
│  ○ Team   $599/month                     │
│                                          │
│  [ Create new project ]                  │ ← CLICK QUANDO PRONTO
└─────────────────────────────────────────┘
```

**COMPILA COSÌ:**
1. **Name:** `inkflow-crm` (o qualsiasi nome)
2. **Password:** Click `Generate` → **COPIA E SALVA** (Importante!)
3. **Region:** Seleziona `Europe (eu-west-1)` o `Europe West (Ireland)`
4. **Plan:** Seleziona `Free`

**⚠️ IMPORTANTE:** Copia la password in un posto sicuro (Notes, Password Manager)

**CLICK SU:** `Create new project`

---

### Step 2.4: Attendi Setup Database

**Cosa vedi:**
```
┌─────────────────────────────────────┐
│  Setting up your project...         │
│                                      │
│  [████████████░░░░░░░░] 70%        │
│                                      │
│  This usually takes ~2 minutes       │
└─────────────────────────────────────┘
```

**ASPETTA** (~2 minuti) finché non vedi:
```
✅ Project is ready!
```

---

## 🎯 PARTE 3: Ottieni Chiavi API (2 minuti)

### Step 3.1: Vai su Settings > API

**Nella sidebar sinistra:**
```
┌─────────────────────┐
│  🏠 Home            │
│  📊 Table Editor    │
│  🛠️ SQL Editor      │
│  📁 Storage         │
│  ⚙️ Settings        │ ← CLICK QUI!
└─────────────────────┘
```

**CLICK SU:** ⚙️ `Settings` (icona ingranaggio in fondo)

---

### Step 3.2: Sottomenu API

**Cosa vedi sotto Settings:**
```
┌─────────────────────────────────┐
│  Settings                       │
│                                  │
│  • General                       │
│  • Database                      │
│  • API                           │ ← CLICK QUI!
│  • Auth                          │
│  • Storage                       │
└─────────────────────────────────┘
```

**CLICK SU:** `API`

---

### Step 3.3: Copia le Chiavi

**Cosa vedi nella pagina API:**

```
┌──────────────────────────────────────────────────────┐
│  Project API                                         │
│                                                       │
│  Configuration                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ URL                                             │ │
│  │ https://vibghisqgsvjcitbgidn.supabase.co      │ │ ← COPIA QUESTO!
│  │ [📋 Copy]                                       │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  API Keys                                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ anon public                                     │ │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...       │ │ ← COPIA QUESTO!
│  │ [📋 Copy] [👁️ Reveal]                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  ⚠️ Never expose service_role key in browser!        │
└──────────────────────────────────────────────────────┘
```

**AZIONI:**

1. **COPIA URL:**
   - Click su `[📋 Copy]` accanto a URL
   - Oppure seleziona e Cmd+C

2. **COPIA ANON KEY:**
   - Click su `[📋 Copy]` accanto a "anon public"
   - Se serve, click `Reveal` prima per vedere la chiave

**⚠️ NON COPIARE** la "service_role" key (è segreta!)

---

## 🎯 PARTE 4: Configurazione Locale (3 minuti)

### Step 4.1: Crea File .env.local

**Nel tuo progetto:**
```
/Users/giovannitrimarchiipad/Desktop/prova crm2/.env.local
```

**CREA NUOVO FILE** con questo contenuto:

```env
VITE_SUPABASE_URL=https://vibghisqgsvjcitbgidn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYmdoaXNxZ3N2amNpdGJnaWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE5NzE2NDUsImV4cCI6MjAxNzU0NzY0NX0.xxx
```

**⚠️ SOSTITUISCI** con le TUE chiavi!

---

## 🎯 PARTE 5: Esegui Schema SQL (5 minuti)

### Step 5.1: Apri SQL Editor

**Nella sidebar Supabase:**
```
┌─────────────────────┐
│  🏠 Home            │
│  📊 Table Editor    │
│  🛠️ SQL Editor      │ ← CLICK QUI!
│  📁 Storage         │
└─────────────────────┘
```

**CLICK SU:** `SQL Editor`

---

### Step 5.2: Nuova Query

**In alto a destra:**
```
[ + New query ]  ← CLICK QUI
```

**CLICK SU:** `+ New query`

---

### Step 5.3: Incolla Schema

**Aprire il file locale:**
```
/Users/giovannitrimarchiipad/Desktop/prova crm2/supabase_schema.sql
```

**AZIONI:**
1. Apri `supabase_schema.sql` in VS Code/Editor
2. **Seleziona tutto** (Cmd+A / Ctrl+A)
3. **Copia** (Cmd+C / Ctrl+C)
4. Torna a Supabase SQL Editor
5. **Incolla** nel box SQL (grande area bianca)

---

### Step 5.4: Esegui Query

**In basso a destra nel SQL Editor:**
```
[ Run ] ← CLICK QUI (oppure Cmd+Enter)
```

**CLICK SU:** `Run` (o premi Cmd+Enter / Ctrl+Enter)

---

### Step 5.5: Verifica Successo

**Cosa vedi se funziona:**
```
✅ Success. No rows returned
```

**Cosa vedi se c'è errore:**
```
❌ ERROR: syntax error at or near...
```

Se vedi errore, **mandami screenshot** e ti aiuto!

---

## 🎯 PARTE 6: Verifica Tabelle (1 minuto)

### Step 6.1: Vai su Table Editor

**Sidebar:**
```
[ 📊 Table Editor ] ← CLICK QUI
```

---

### Step 6.2: Controlla Lista Tabelle

**Cosa dovresti vedere:**
```
┌─────────────────────────┐
│  Tables                 │
│                          │
│  ✓ tenants              │
│  ✓ users                │
│  ✓ clients              │
│  ✓ appointments         │
│  ✓ courses              │
│  ✓ students             │
│  ✓ attendances          │
│  ✓ teaching_materials   │
│  ✓ course_payments      │
└─────────────────────────┘
```

**SE VEDI TUTTE LE 9 TABELLE:** ✅ Setup completato!

**SE MANCA QUALCOSA:** SQL non eseguito correttamente

---

## ✅ CHECKLIST FINALE

Prima di dirmi "Setup completato!", verifica:

- [ ] Hai creato account Supabase
- [ ] Progetto "inkflow-crm" (o simile) creato
- [ ] File `.env.local` creato con URL e KEY
- [ ] Schema SQL eseguito senza errori
- [ ] 9 tabelle visibili in Table Editor
- [ ] Password database salvata in posto sicuro

---

## 🆘 AIUTO RAPIDO

### "Non vedo il pulsante X"
→ Mandami screenshot, ti dico esattamente dove cliccare

### "Errore SQL"
→ Mandami il messaggio d'errore completo

### "Chiavi API non funzionano"
→ Verifica di aver copiato "anon public" e non "service_role"

### "Tabelle non compaiono"
→ Ricarica pagina (F5) e controlla SQL Editor per errori

---

**Quando hai finito tutti i passi, dimmi:**
**"Setup Supabase completato!"**

E procedo con la migrazione del codice! 🚀
