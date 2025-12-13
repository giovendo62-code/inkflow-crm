# 🚀 Deploy InkFlow CRM su Vercel

## Metodo Raccomandato: Interfaccia Web

### Passo 1: Prepara il Progetto
✅ FATTO - La build è già pronta nella cartella `dist/`

### Passo 2: Vai su Vercel
1. Apri il browser
2. Vai su: https://vercel.com/new
3. Fai login (hai già l'account)

### Passo 3: Importa il Progetto

**Opzione A - Da Git (Raccomandato se hai GitHub):**
1. Clicca "Import Git Repository"
2. Collega il tuo account GitHub
3. Crea un nuovo repository per questo progetto
4. Vercel lo rileverà automaticamente

**Opzione B - Upload Diretto:**
1. Scorri in basso nella pagina
2. Cerca "Or, deploy a Template or select a directory"
3. Clicca "Browse" 
4. Seleziona la cartella `prova crm2`

### Passo 4: Configura (Auto-rilevato da Vercel)
Vercel rileverà automaticamente:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Se ti chiede conferma, usa questi valori:**
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Root Directory: ./
```

### Passo 5: Deploy
1. Clicca il pulsante "Deploy"
2. Aspetta 1-2 minuti
3. Riceverai un URL tipo: `https://inkflow-crm-xyz.vercel.app`

### Passo 6: Personalizza URL (Opzionale)
1. Vai su Settings del progetto
2. Clicca "Domains"
3. Aggiungi un dominio personalizzato o modifica il nome

---

## 🔧 Troubleshooting

**Se la build fallisce:**
- Verifica che "Output Directory" sia impostato su `dist`
- Verifica che "Build Command" sia `npm run build`

**Se l'app non si carica:**
- Controlla che il file `vercel.json` sia presente (✅ già presente)
- Verifica che le routes siano configurate correttamente

---

## 📱 Dopo il Deploy

L'app sarà accessibile da:
- Computer
- Tablet  
- Smartphone
- Qualsiasi dispositivo con browser

**NOTA IMPORTANTE:**
I dati sono salvati nel localStorage del browser.
Ogni dispositivo avrà i suoi dati separati.

Per sincronizzare i dati tra dispositivi, in futuro possiamo aggiungere Firebase.

---

## 🎉 URL Finale

Dopo il deploy, il tuo URL sarà tipo:
`https://inkflow-crm-[random].vercel.app`

Puoi condividerlo con il team!

---

## 🔄 Aggiornamenti Futuri

Per aggiornare l'app:
1. Modifica il codice localmente
2. Esegui `npm run build`
3. Fai push su Git (se usi Git)
4. Vercel aggiornerà automaticamente

OPPURE:

1. Vai su vercel.com
2. Clicca sul progetto
3. Clicca "Redeploy"
