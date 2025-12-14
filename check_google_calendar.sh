#!/bin/bash

# 🔍 Script di Verifica Google Calendar
# Controlla se la configurazione è corretta

echo "🔍 VERIFICA CONFIGURAZIONE GOOGLE CALENDAR"
echo "=========================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contatore errori
ERRORS=0

# 1. Verifica esistenza .env.local
echo "📁 1. Controllo file .env.local..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ File .env.local trovato${NC}"
else
    echo -e "${RED}❌ File .env.local NON trovato${NC}"
    echo "   → Crea il file .env.local nella root del progetto"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Verifica VITE_GOOGLE_CLIENT_ID
echo "🔑 2. Controllo VITE_GOOGLE_CLIENT_ID..."
if [ -f ".env.local" ]; then
    CLIENT_ID=$(grep "VITE_GOOGLE_CLIENT_ID" .env.local | cut -d '=' -f2)
    
    if [ -z "$CLIENT_ID" ]; then
        echo -e "${RED}❌ VITE_GOOGLE_CLIENT_ID è vuoto${NC}"
        echo "   → Aggiungi il tuo Google Client ID in .env.local"
        ERRORS=$((ERRORS + 1))
    elif [ ${#CLIENT_ID} -lt 20 ]; then
        echo -e "${RED}❌ VITE_GOOGLE_CLIENT_ID troppo corto (${#CLIENT_ID} caratteri)${NC}"
        echo "   → Verifica di aver copiato il Client ID completo"
        ERRORS=$((ERRORS + 1))
    elif [[ $CLIENT_ID == *".apps.googleusercontent.com"* ]]; then
        echo -e "${GREEN}✅ VITE_GOOGLE_CLIENT_ID configurato correttamente${NC}"
        echo "   Client ID: ${CLIENT_ID:0:30}...${CLIENT_ID: -30}"
    else
        echo -e "${YELLOW}⚠️  VITE_GOOGLE_CLIENT_ID presente ma formato sospetto${NC}"
        echo "   → Dovrebbe finire con .apps.googleusercontent.com"
        echo "   Client ID attuale: $CLIENT_ID"
    fi
else
    echo -e "${YELLOW}⏭️  Saltato (file .env.local non trovato)${NC}"
fi
echo ""

# 3. Verifica file googleCalendar.ts
echo "📄 3. Controllo file googleCalendar.ts..."
if [ -f "src/lib/googleCalendar.ts" ]; then
    echo -e "${GREEN}✅ File googleCalendar.ts trovato${NC}"
else
    echo -e "${RED}❌ File googleCalendar.ts NON trovato${NC}"
    echo "   → Il file dovrebbe essere in src/lib/googleCalendar.ts"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Verifica node_modules
echo "📦 4. Controllo dipendenze..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules presente${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules NON trovato${NC}"
    echo "   → Esegui: npm install"
fi
echo ""

# 5. Verifica processo npm run dev
echo "🚀 5. Controllo server dev..."
if pgrep -f "vite" > /dev/null; then
    echo -e "${GREEN}✅ Server dev in esecuzione${NC}"
    echo "   → Ricorda di riavviare dopo modifiche a .env.local"
else
    echo -e "${YELLOW}⚠️  Server dev NON in esecuzione${NC}"
    echo "   → Avvia con: npm run dev"
fi
echo ""

# Riepilogo
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 CONFIGURAZIONE OK!${NC}"
    echo ""
    echo "Prossimi passi:"
    echo "1. Se non l'hai fatto, riavvia il server: npm run dev"
    echo "2. Apri http://localhost:5173"
    echo "3. Vai su Operatori"
    echo "4. Click su 'Connetti Google Calendar'"
    echo ""
    echo "📖 Per istruzioni dettagliate: GUIDA_GOOGLE_CALENDAR.md"
else
    echo -e "${RED}❌ Trovati $ERRORS errori${NC}"
    echo ""
    echo "Leggi la guida completa: GUIDA_GOOGLE_CALENDAR.md"
fi
echo ""
