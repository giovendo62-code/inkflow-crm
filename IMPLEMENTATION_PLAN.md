# Piano di Implementazione Completo - InkFlow CRM

## ✅ COMPLETATO

### Types aggiornati (`src/types/index.ts`)
- ✅ Aggiunto ruolo `STUDENT`
- ✅ Espansi stili tatuaggio (13 stili totali)
- ✅ Aggiunto `preferredStyle` ai clienti
- ✅ Aggiunto `inBroadcast` (lista broadcast WhatsApp)
- ✅ Aggiunto `tattooStyle` agli appuntamenti

### IMPLEMENTAZIONE COMPLETATA (Sessione Corrente)

#### 1. ✅ AddClientModal
- Aggiunto campo dropdown "Stile Preferito Principale"
- Aggiunto checkbox "Includi in Lista Broadcast WhatsApp"
- Aggiornata lista stili con tutti i 13 stili disponibili

#### 2. ✅ NewAppointmentModal  
- Aggiunto campo dropdown "Stile Tatuaggio" nella sezione Dettagli Finanziari
- Salvataggio tattooStyle nell'appuntamento

#### 3. ✅ AppointmentDetailsModal
- Aggiunto campo dropdown "Stile Tatuaggio" (visualizzazione e modifica)
- Popolamento automatico da appuntamento esistente

#### 4. ✅ ClientListPage - Ricerca Avanzata
- Pannello filtri avanzati collassabile con:
  - Dropdown filtro per Stile Preferito
  - Dropdown filtro In Broadcast (Tutti/Sì/No)
  - Checkbox "Nuovi Clienti (ultimi 30 giorni)"
- Contatore risultati filtrati
- Pulsante "Reset Filtri"
- Nuova colonna "Stile Preferito" nella tabella
- Nuova colonna "In Broadcast" con checkbox interattiva
- Funzione handleBroadcastToggle per modificare status broadcast

#### 5. ✅ Dashboard Manager - Grafici Stili
- Grafico a torta: Stili Preferiti dai Clienti
  - Visualizzazione percentuali
  - Lista Top 5 stili con conteggio clienti
  - Empty state se nessun dato
- Grafico a barre: Guadagni per Stile Tatuaggio
  - Calcolato da appuntamenti completati
  - Top 8 stili per guadagni
  - Totale guadagni da stili completati
  - Empty state se nessun dato

#### 6. ✅ Sezione Promozioni (NUOVA)
- **File creato**: `src/features/promotions/PromotionsPage.tsx`
- Filtri per:
  - Stile preferito (dropdown con tutti i 13 stili)
  - Solo clienti in Broadcast (checkbox)
- Selezione multipla clienti con:
  - Checkbox master nella header della tabella
  - Pulsanti "Seleziona Tutti" / "Deseleziona Tutti"
- Template messaggio personalizzabile (textarea)
- Invio bulk via:
  - WhatsApp (apre wa.me per ogni cliente selezionato)
  - Email (mailto con BCC)
- Contatore clienti selezionati nei pulsanti
- Tabella clienti filtrati con colonne:
  - Checkbox selezione
  - Nome
  - Email
  - Phone
  - Stile Preferito
  - Status Broadcast
- Link aggiunto in Sidebar (visibile solo per Manager)
- Rotta `/promotions` aggiunta in App.tsx

---

## 🚧 DA IMPLEMENTARE

### FASE 1: DASHBOARD & STATISTICHE MANAGER

#### 1.1 Dashboard - Stili Più Richiesti
**File da modificare**: `/src/features/dashboard/DashboardPage.tsx`

**Cosa aggiungere**:
- Grafico a torta: % clienti per stile preferito
- Tabella: Top 5 stili più richiesti
- Grafico a barre: Guadagni per stile (da appuntamenti completati)

**Dati da calcolare**:
```typescript
// Conteggio clienti per stile
const clientsByStyle = clients.reduce((acc, client) => {
  if (client.preferredStyle) {
    acc[client.preferredStyle] = (acc[client.preferredStyle] || 0) + 1;
  }
  return acc;
}, {});

// Guadagni per stile (da appuntamenti completati)
const earningsByStyle = appointments
  .filter(a => a.status === 'COMPLETED' && a.tattooStyle)
  .reduce((acc, apt) => {
    const style = apt.tattooStyle!;
    acc[style] = (acc[style] || 0) + (apt.financials?.priceQuote || 0);
    return acc;
  }, {});
```

---

### FASE 2: ACADEMY & CORSISTI

#### 2.1 Nuova Interfaccia Student
**File**: `src/types/index.ts`

**Aggiungere**:
```typescript
export interface Student {
  id: string;
  tenantId: string;
  userId: string; // Link to User with role STUDENT
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseId: string;
  enrollmentDate: string;
  courseStartDate: string;
  courseEndDate: string;
  totalHours: number;
  completedHours: number;
  financials: {
    courseFee: number;
    depositAmount: number;
    depositPaid: boolean;
    remainingBalance: number;
  };
  attendance: AttendanceRecord[];
  documents: string[]; // Course materials
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  present: boolean;
  hours: number;
  topic: string;
}

export interface Course {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  duration: number; // Total hours
  price: number;
  syllabus: string[]; // Topics
  materials: string[]; // Docs/PDFs
}
```

#### 2.2 Academy Dashboard
**File da creare**: `/src/features/academy/AcademyPage.tsx`

**Contenuto**:
- Lista corsisti
- Calendario presenze
- Gestione pagamenti
- Upload materiali corso

#### 2.3 Student Dashboard
**File da creare**: `/src/features/academy/StudentDashboardPage.tsx`

**Contenuto**:
- Calendario presenze personale
- Programma corso
- Materiali scaricabili
- Stato pagamenti

#### 2.4 Login con Selezione Ruolo
**File da modificare**: `/src/features/auth/LoginPage.tsx`

**Modifica**:
- Dropdown per selezionare ruolo (Manager/Artist/Student)
- Filtrare utenti disponibili in base al ruolo

---

### FASE 3: RICERCA CLIENTI AVANZATA

#### 3.1 ClientListPage - Filtri Avanzati
**File da modificare**: `/src/features/crm/ClientListPage.tsx`

**Aggiungere**:
```typescript
const [styleFilter, setStyleFilter] = useState<TattooStyle | 'all'>('all');
const [broadcastFilter, setBroadcastFilter] = useState<'all' | 'yes' | 'no'>('all');
const [newClientsFilter, setNewClientsFilter] = useState(false);

const filteredClients = clients.filter(client => {
  // Ricerca esistente
  if (searchQuery && !matchesSearch(client)) return false;
  
  // Filtro stile
  if (styleFilter !== 'all' && client.preferredStyle !== styleFilter) return false;
  
  // Filtro broadcast
  if (broadcastFilter === 'yes' && !client.inBroadcast) return false;
  if (broadcastFilter === 'no' && client.inBroadcast) return false;
  
  // Nuovi clienti (ultimi 30 giorni)
  if (newClientsFilter) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const clientDate = new Date(client.createdAt);
    if (clientDate < thirtyDaysAgo) return false;
  }
  
  return true;
});
```

#### 3.2 Checkbox Broadcast in Tabella
**Aggiungere colonna**:
```tsx
<th>In Broadcast</th>
...
<td>
  <input
    type="checkbox"
    checked={client.inBroadcast || false}
    onChange={(e) => handleBroadcastToggle(client.id, e.target.checked)}
  />
</td>
```

---

### FASE 4: SEZIONE PROMOZIONI

#### 4.1 Nuova Pagina Promozioni
**File da creare**: `/src/features/promotions/PromotionsPage.tsx`

**Funzionalità**:
1. **Filtro per Stile**:
   - Dropdown stili tatuaggio
   - Filtra clienti con quello stile preferito

2. **Lista Clienti Filtrati**:
   - Checkbox per selezione multipla
   - Pulsante "Seleziona Tutti"

3. **Template Messaggio**:
   ```tsx
   const [messageTemplate, setMessageTemplate] = useState('');
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   ```

4. **Azione WhatsApp**:
   ```tsx
   const sendWhatsAppPromotion = (clients: Client[]) => {
     clients.forEach(client => {
       const phone = client.phone.replace(/[^0-9]/g, '');
       const message = encodeURIComponent(messageTemplate);
       window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
     });
   };
   ```

5. **Azione Email**:
   ```tsx
   const sendEmailPromotion = (clients: Client[]) => {
     const emails = clients.map(c => c.email).join(',');
     window.location.href = `mailto:${emails}?subject=Promozione&body=${encodeURIComponent(messageTemplate)}`;
   };
   ```

---

### FASE 5: DETTAGLI OPERATORE

#### 5.1 Pagina Dettagli Operatore
**File da creare**: `/src/features/operators/OperatorDetailsPage.tsx`

**Contenuto**:
- Dati anagrafici completi
- Statistiche personali:
  - Appuntamenti totali
  - Guadagni totali
  - Stili più richiesti
  - Clienti serviti
- Calendario appuntamenti (vista mensile)
- Storico finanziario

#### 5.2 Link da OperatorListPage
**Modificare**: Rendere il nome cliccabile
```tsx
<td 
  style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
  onClick={() => navigate(`/operators/${operator.id}`)}
>
  {operator.name}
</td>
```

---

## 📝 TODO PRIORITARIO

### Immediate (da fare subito):
1. [ ] Aggiornare form creazione cliente per includere `preferredStyle` e `inBroadcast`
2. [ ] Aggiornare form appuntamento per includere `tattooStyle`
3. [ ] Dashboard Manager: Grafici stili
4. [ ] Ricerca clienti avanzata

### Short-term (prossima sessione):
5. [ ] Academy: Struttura base
6. [ ] Student dashboard
7. [ ] Login con selezione ruolo

### Medium-term:
8. [ ] Sezione Promozioni completa
9. [ ] Dettagli Operatore
10. [ ] Template messaggi WhatsApp

---

## 🎯 SUGGERIMENTI IMPLEMENTAZIONE

### Ordine consigliato:
1. **Prima**: Aggiungi campi ai form esistenti (client + appointment)
2. **Poi**: Dashboard con statistiche stili
3. **Poi**: Ricerca avanzata clienti
4. **Infine**: Nuove funzionalità (Academy, Promozioni)

### Note tecniche:
- Per i grafici: Usa `recharts` (già installato)
- Per WhatsApp: Usa `wa.me` API
- Per Email: Usa `mailto:` protocol
- Per upload file corso: Stesso sistema Base64

---

## 💡 NEXT STEPS

**Vuoi che proceda con**:
- A) Dashboard Manager con grafici stili? 📊
- B) Form clienti/appuntamenti con nuovi campi? 📝
- C) Ricerca avanzata clienti? 🔍
- D) Tutto insieme (implementazione automatica)?

Dimmi e procedo! 🚀
