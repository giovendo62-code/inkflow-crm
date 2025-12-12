import type { Client } from '../types';

// ORA: Simulazione
// FUTURO: Qui metterai il tuo Webhook di Zapier (es. https://hooks.zapier.com/hooks/catch/...)
const ZAPIER_WEBHOOK_URL = '';

export const sendWelcomeEmail = async (client: Client) => {
    console.log('🔔 Notifica registrazione per:', client.firstName);

    // Se c'è un url Zapier, inviamo i dati lì
    if (ZAPIER_WEBHOOK_URL) {
        try {
            await fetch(ZAPIER_WEBHOOK_URL, {
                method: 'POST',
                body: JSON.stringify(client),
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ Dati inviati a Zapier');
        } catch (e) {
            console.error('Errore invio a Zapier', e);
        }
    } else {
        // Fallback: Simulazione Locale
        console.log('ℹ️ Zapier non configurato. Simulazione invio email.');
        // Non mostriamo alert per non disturbare l'UX se non richiesto esplicitamente
        // alert(`(Simulazione) Email inviata a ${client.email}`); 
    }

    return true;
};
