# 🚀 Roadmap di Deployment - InkFlow CRM

## 📊 Stato Attuale

**Cosa funziona ora:**
- ✅ Interfaccia completa (Manager, Artist, Student)
- ✅ Gestione clienti, appuntamenti, academy
- ✅ Dashboard con statistiche
- ✅ UI mobile-responsive con bottom navigation
- ✅ Autenticazione base
- ⚠️ **Tutto salvato su `localStorage`** (solo browser locale, non condivisibile)

**Problema principale:**
I dati sono salvati nel browser locale. Se cambi computer/browser, perdi tutto. Non c'è database condiviso tra utenti.

---

## 🎯 Obiettivo: App Pronta per Produzione

### Cosa serve implementare:

1. **Database Cloud (Supabase)** - Dati condivisi e persistenti
2. **Autenticazione Reale (Supabase Auth)** - Login sicuro
3. **Google Calendar API** - Sincronizzazione appuntamenti
4. **Gmail API** - Invio email automatiche
5. **WhatsApp Business API** - Notifiche clienti
6. **Hosting** - Deploy online
7. **Storage Files** - Caricamento documenti/foto

---

## 📋 FASE 1: Database Cloud con Supabase (PRIORITÀ MASSIMA)

### Perché Supabase?
- Database PostgreSQL gratuito (fino a 500MB)
- Autenticazione integrata
- Real-time subscriptions
- Storage file integrato
- API REST automatica

### Step-by-Step:

#### 1.1 Creazione Account Supabase
```bash
# 1. Vai su https://supabase.com
# 2. Crea account (gratis)
# 3. Crea un nuovo progetto
# 4. Annota:
#    - Project URL (es: https://xxx.supabase.co)
#    - Anon Key (chiave pubblica)
#    - Service Role Key (chiave privata, NON pubblicare)
```

#### 1.2 Installazione SDK
```bash
cd "/Users/giovannitrimarchiipad/Desktop/prova crm2"
npm install @supabase/supabase-js
```

#### 1.3 Configurazione Client Supabase
**File: `src/lib/supabase.ts`** (da creare)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**File: `.env.local`** (da creare)
```env
VITE_SUPABASE_URL=https://tuoprogetto.supabase.co
VITE_SUPABASE_ANON_KEY=tua_anon_key_qui
```

#### 1.4 Schema Database
**Da eseguire in Supabase SQL Editor:**

```sql
-- Tenants (Studi)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT,
  theme JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users (Manager, Artist, Student)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MANAGER', 'ARTIST', 'STUDENT')),
  avatar_url TEXT,
  profile JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  fiscal_code TEXT,
  birth_date DATE,
  address JSONB,
  preferences JSONB,
  preferred_style TEXT,
  in_broadcast BOOLEAN DEFAULT false,
  consents JSONB,
  attachments TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  client_id UUID REFERENCES clients(id),
  artist_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  service_type TEXT,
  tattoo_style TEXT,
  status TEXT CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  financials JSONB,
  reminders JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses (Academy)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours INTEGER,
  total_lessons INTEGER,
  schedule TEXT,
  program TEXT,
  price DECIMAL(10,2),
  attachments TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  course_id UUID REFERENCES courses(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  total_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendances
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  date DATE NOT NULL,
  hours INTEGER DEFAULT 0,
  present BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teaching Materials
CREATE TABLE teaching_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('PDF', 'VIDEO', 'LINK', 'IMAGE')),
  unlock_threshold_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course Payments
CREATE TABLE course_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_artist ON appointments(artist_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_attendances_student ON attendances(student_id);
```

#### 1.5 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ... (per tutte le tabelle)

-- Policy Example: Users can only see their tenant's data
CREATE POLICY "Users see own tenant"
  ON clients FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

#### 1.6 Migrazione da localStorage a Supabase
**File: `src/lib/storage.ts`** (modificare)
```typescript
import { supabase } from './supabase';

// Invece di localStorage.getItem(), usare:
export const storage = {
  getClients: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  saveClient: async (client: Client) => {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // ... stessa cosa per tutti i metodi
};
```

---

## 📋 FASE 2: Autenticazione Reale (Supabase Auth)

### 2.1 Setup Auth
```typescript
// src/features/auth/AuthContext.tsx
import { supabase } from '../../lib/supabase';

// Login con email/password
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

// Registrazione
const signUp = async (email: string, password: string, metadata: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata // nome, ruolo, ecc
    }
  });
  if (error) throw error;
  return data;
};

// Logout
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Ascoltare cambiamenti auth
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Aggiorna stato
  } else if (event === 'SIGNED_OUT') {
    // Pulisci stato
  }
});
```

### 2.2 Protezione Routes
```typescript
// In AppLayout.tsx
const { session, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!session) return <Navigate to="/login" />;
```

---

## 📋 FASE 3: Google Calendar Integration

### 3.1 Setup Google Cloud Console
```bash
# 1. Vai su https://console.cloud.google.com
# 2. Crea nuovo progetto "InkFlow CRM"
# 3. Abilita Google Calendar API
# 4. Crea credenziali OAuth 2.0:
#    - Application type: Web application
#    - Authorized redirect URIs: http://localhost:5173/auth/google/callback
#                                https://tuodominio.com/auth/google/callback
# 5. Annota Client ID e Client Secret
```

### 3.2 Installazione
```bash
npm install @react-oauth/google gapi-script
```

### 3.3 Implementazione
```typescript
// src/lib/googleCalendar.ts
import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export const initGoogleCalendar = () => {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      scope: SCOPES,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
    });
  });
};

export const createCalendarEvent = async (appointment: Appointment) => {
  const event = {
    summary: appointment.title,
    description: appointment.description,
    start: {
      dateTime: appointment.startTime,
      timeZone: 'Europe/Rome'
    },
    end: {
      dateTime: appointment.endTime,
      timeZone: 'Europe/Rome'
    },
    attendees: [
      { email: appointment.clientEmail }
    ]
  };

  const response = await gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });

  return response.result;
};
```

---

## 📋 FASE 4: Gmail Integration (Email automatiche)

### 4.1 Setup
```bash
# Stesso progetto Google Cloud
# Abilita Gmail API
npm install nodemailer @sendgrid/mail
```

### 4.2 Opzione A: SendGrid (consigliato, più semplice)
```typescript
// src/lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  const msg = {
    to,
    from: 'noreply@inkflow.com',
    subject,
    html
  };

  await sgMail.send(msg);
};

// Template reminder appuntamento
export const sendAppointmentReminder = async (appointment: Appointment, client: Client) => {
  const html = `
    <h2>Promemoria Appuntamento</h2>
    <p>Ciao ${client.firstName},</p>
    <p>Ti ricordiamo il tuo appuntamento:</p>
    <ul>
      <li><strong>Data:</strong> ${new Date(appointment.startTime).toLocaleString('it-IT')}</li>
      <li><strong>Servizio:</strong> ${appointment.title}</li>
    </ul>
  `;
  
  await sendEmail(client.email, 'Promemoria Appuntamento InkFlow', html);
};
```

### 4.3 Opzione B: Gmail API diretta
```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export const sendGmail = async (to: string, subject: string, body: string) => {
  const message = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
};
```

---

## 📋 FASE 5: WhatsApp Business API

### 5.1 Setup WhatsApp Business API
```bash
# Opzione 1: Twilio (più semplice)
# 1. Crea account su https://www.twilio.com
# 2. Acquista numero WhatsApp Business
# 3. Annota Account SID e Auth Token

npm install twilio
```

### 5.2 Implementazione
```typescript
// src/lib/whatsapp.ts
import twilio from 'twilio';

const client = twilio(
  import.meta.env.VITE_TWILIO_ACCOUNT_SID,
  import.meta.env.VITE_TWILIO_AUTH_TOKEN
);

export const sendWhatsApp = async (to: string, message: string) => {
  await client.messages.create({
    from: 'whatsapp:+14155238886', // Twilio sandbox o tuo numero
    to: `whatsapp:${to}`,
    body: message
  });
};

// Template reminder
export const sendAppointmentWhatsApp = async (phone: string, appointment: Appointment) => {
  const message = `
🗓️ *Promemoria Appuntamento InkFlow*

Ciao! Ti ricordiamo il tuo appuntamento:
📅 ${new Date(appointment.startTime).toLocaleDateString('it-IT')}
🕐 ${new Date(appointment.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
✨ ${appointment.title}

Ci vediamo presto! 🎨
  `.trim();

  await sendWhatsApp(phone, message);
};
```

---

## 📋 FASE 6: File Storage (Documenti, Foto)

### 6.1 Supabase Storage
```typescript
// src/lib/fileStorage.ts
import { supabase } from './supabase';

// Upload documento consenso
export const uploadConsentDocument = async (file: File, clientId: string) => {
  const fileName = `consents/${clientId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// Upload materiale didattico
export const uploadTeachingMaterial = async (file: File, materialId: string) => {
  const fileName = `materials/${materialId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('academy-materials')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('academy-materials')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
```

### 6.2 Creazione Buckets in Supabase
```sql
-- In Supabase Dashboard > Storage

-- Bucket: documents (privato)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Bucket: academy-materials (privato)
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-materials', 'academy-materials', false);

-- Bucket: avatars (pubblico)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Policy: Users can upload their own files
CREATE POLICY "Users upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 📋 FASE 7: Hosting e Deploy

### 7.1 Build Production
```bash
npm run build
# Crea cartella /dist con file ottimizzati
```

### 7.2 Opzioni Hosting

#### Opzione A: Vercel (CONSIGLIATO - Gratis)
```bash
# 1. Installa Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Segui wizard:
#    - Link GitHub repo (opzionale)
#    - Configure env variables (VITE_SUPABASE_URL, ecc)
#    - Deploy!

# URL finale: https://inkflow-crm.vercel.app
```

#### Opzione B: Netlify
```bash
# 1. Vai su https://netlify.com
# 2. Drag & drop cartella /dist
# oppure
npm install -g netlify-cli
netlify deploy --prod
```

#### Opzione C: Custom VPS (DigitalOcean, AWS)
```bash
# Setup Nginx
server {
    listen 80;
    server_name tuodominio.com;
    
    root /var/www/inkflow/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📋 FASE 8: Domini Personalizzati e SSL

### 8.1 Acquisto Dominio
```bash
# Opzioni:
# - Namecheap.com (economico)
# - Google Domains
# - GoDaddy

# Esempio: inkflow-studio.com
```

### 8.2 Configurazione DNS
```bash
# In Vercel/Netlify Dashboard:
# 1. Add Custom Domain
# 2. Update DNS records at domain registrar:

Type    Name    Value
A       @       76.76.21.21 (Vercel IP)
CNAME   www     cname.vercel-dns.com
```

### 8.3 SSL Automatico
```bash
# Vercel/Netlify forniscono SSL gratuito automatico
# Verifica: https://tuodominio.com (🔒 sicuro)
```

---

## 📋 FASE 9: Monitoraggio e Analytics

### 9.1 Google Analytics
```typescript
// src/lib/analytics.ts
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');

export const trackPageView = (page: string) => {
  ReactGA.send({ hitType: 'pageview', page });
};

export const trackEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({ category, action, label });
};

// In App.tsx
useEffect(() => {
  trackPageView(window.location.pathname);
}, [location]);
```

### 9.2 Error Tracking (Sentry)
```bash
npm install @sentry/react

# src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0
});
```

---

## 🗓️ Timeline Consigliato

### Settimana 1-2: Backend Foundation
- [ ] Setup Supabase account e progetto
- [ ] Creazione schema database
- [ ] Configurazione RLS policies
- [ ] Migrazione logica da localStorage a Supabase
- [ ] Test CRUD operations

### Settimana 3: Autenticazione
- [ ] Setup Supabase Auth
- [ ] Implementazione login/signup
- [ ] Protected routes
- [ ] User roles management

### Settimana 4: Integrazioni Esterne
- [ ] Google Calendar API setup
- [ ] Gmail/SendGrid email integration
- [ ] WhatsApp (Twilio) setup
- [ ] Test invio notifiche

### Settimana 5: Storage & Media
- [ ] Supabase Storage setup
- [ ] Upload documenti consensi
- [ ] Upload materiali didattici
- [ ] Gestione avatar utenti

### Settimana 6: Deploy & Production
- [ ] Build production
- [ ] Deploy su Vercel
- [ ] Setup dominio personalizzato
- [ ] SSL certificate
- [ ] Google Analytics
- [ ] Final testing

---

## 💰 Costi Stimati (mensili)

| Servizio | Piano Gratuito | Piano Pagamento |
|----------|----------------|-----------------|
| **Supabase** | Gratis (500MB DB, 1GB Storage) | $25/mese (8GB DB) |
| **Vercel** | Gratis (Hobby) | $20/mese (Pro) |
| **SendGrid** | Gratis (100 email/giorno) | $15/mese (40k email) |
| **Twilio WhatsApp** | Gratis sandbox | ~$0.005/messaggio |
| **Dominio** | - | ~$12/anno |
| **TOTALE** | **€0/mese** (inizio) | **~€50-80/mese** (scala) |

---

## 🔒 Sicurezza e Best Practices

### Variabili d'Ambiente
```env
# .env.local (NON committare su Git!)
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
VITE_GOOGLE_CLIENT_ID=xxx
VITE_SENDGRID_API_KEY=xxx
VITE_TWILIO_ACCOUNT_SID=xxx
VITE_TWILIO_AUTH_TOKEN=xxx
```

### .gitignore
```
.env.local
.env.production
dist/
node_modules/
*.log
```

### GDPR Compliance
- [ ] Cookie consent banner
- [ ] Privacy policy page
- [ ] Data export functionality
- [ ] Right to deletion
- [ ] Audit logs


---

## 📞 Supporto

Per problemi durante l'implementazione:
- Supabase Docs: https://supabase.com/docs
- Google Calendar API: https://developers.google.com/calendar
- Twilio Docs: https://www.twilio.com/docs
- Community Discord/Forum

---

## ✅ Checklist Finale Pre-Lancio

- [ ] Database migrato e testato
- [ ] Auth funzionante (login/logout/signup)
- [ ] Tutti i CRUD operations funzionano
- [ ] Google Calendar sync attivo
- [ ] Email notifications funzionanti
- [ ] WhatsApp messages testati
- [ ] File upload/download OK
- [ ] Mobile responsive verificato
- [ ] SSL certificate attivo
- [ ] Backup database configurato
- [ ] Domain configurato
- [ ] Analytics attivo
- [ ] Documentazione utenti pronta
- [ ] Training team completato

---

**Prossimo Step Immediato:** Vuoi che ti aiuti a configurare Supabase adesso? È il fondamento per tutto il resto.
